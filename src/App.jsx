import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { SceneContext } from './SceneContext'
import SpaceBackground from './components/SpaceBackground'
import SolarSystem from './components/SolarSystem'
import InfoPanel from './components/InfoPanel'
import ReturnButton from './components/ReturnButton'
import LoadingScreen from './components/LoadingScreen'
import TimeControls from './components/TimeControls'

// ── Sound hook ────────────────────────────────────────────────────────────────
function useSound(muted) {
  const audioRef = useRef(null)
  const ctxRef   = useRef(null)

  // Start bg music + unlock Web Audio on first user gesture
  const init = useCallback(() => {
    // Background music via HTML Audio (simpler, reliable loop)
    if (!audioRef.current) {
      const audio = new Audio('/bgmusic.mp3')
      audio.loop = true
      audio.volume = muted ? 0 : 0.15
      audio.play().catch(() => {})
      audioRef.current = audio
    }

    // Web Audio context for SFX
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }, [muted])

  // Planet hover tone
  const playHoverTone = useCallback((planetIndex) => {
    if (!ctxRef.current || muted) return
    const ctx = ctxRef.current
    const freq = 220 * Math.pow(2, planetIndex / 7 * 2)
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.18
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  }, [muted])

  // Camera transition whoosh
  const playWhoosh = useCallback(() => {
    if (!ctxRef.current || muted) return
    const ctx     = ctxRef.current
    const bufSize = ctx.sampleRate * 0.5
    const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data    = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain   = ctx.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.5
    gain.gain.value = 0.15
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  }, [muted])

  // Sync mute state to bg music volume
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = muted ? 0 : 0.15
  }, [muted])

  return { init, playHoverTone, playWhoosh }
}

// ── Space cursor ──────────────────────────────────────────────────────────────
function SpaceCursor() {
  const cursorRef = useRef(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top  = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const obs = new MutationObserver(() => {
      setHovering(document.body.style.cursor === 'pointer')
    })
    obs.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => {
      window.removeEventListener('mousemove', onMove)
      obs.disconnect()
    }
  }, [])

  const c = hovering ? '#ffcc44' : '#00ccff'
  const r = hovering ? 6 : 3.5

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 9999,
        transition: 'opacity 0.1s',
      }}
    >
      <svg
        width={24} height={24} viewBox="0 0 24 24"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {hovering && (
          <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="0.6" opacity="0.4" />
        )}
        <circle cx="12" cy="12" r={r} fill="none" stroke={c} strokeWidth="1"
          style={{ transition: 'r 0.15s ease, stroke 0.15s ease' }}
        />
        <line x1="12" y1="2"  x2="12" y2="8"  stroke={c} strokeWidth="1" />
        <line x1="12" y1="16" x2="12" y2="22" stroke={c} strokeWidth="1" />
        <line x1="2"  y1="12" x2="8"  y2="12" stroke={c} strokeWidth="1" />
        <line x1="16" y1="12" x2="22" y2="12" stroke={c} strokeWidth="1" />
        <circle cx="12" cy="12" r="1" fill={c} />
      </svg>
    </div>
  )
}

const BTN_BASE = {
  background: 'rgba(0,6,18,0.75)',
  borderRadius: 6,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9, letterSpacing: 2, fontWeight: 600,
  padding: '7px 14px',
  backdropFilter: 'blur(8px)',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function HUD({ showOrbits, setShowOrbits, comparisonMode, setComparisonMode, muted, setMuted }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 10, fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Title */}
      <div style={{ position: 'absolute', top: 28, left: 36 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: 4, color: '#ffffff',
          textShadow: '0 0 24px rgba(80,160,255,0.4)',
        }}>
          ORBIT
        </div>
        <div style={{ fontSize: 9, color: '#00ccff', letterSpacing: 3.5, marginTop: 3 }}>
          SOLAR SYSTEM
        </div>
        <div style={{
          width: 140, height: 1,
          background: 'linear-gradient(90deg, rgba(0,200,255,0.4), transparent)',
          marginTop: 7, borderRadius: 1,
        }} />
      </div>

      {/* Bottom-left controls */}
      <div style={{
        position: 'absolute', bottom: 28, left: 36,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'auto',
      }}>
        {/* S4-19: Mute toggle */}
        <button
          onClick={() => {
            const next = !muted
            setMuted(next)
            localStorage.setItem('orbit-muted', next)
          }}
          style={{
            ...BTN_BASE,
            border: '1px solid rgba(0,200,255,0.2)',
            color: muted ? '#334455' : '#4499bb',
          }}
        >
          {muted ? '🔇 MUTE' : '🔊 SOUND'}
        </button>

        {/* Orbit toggle — hidden in comparison mode */}
        {!comparisonMode && (
          <button
            onClick={() => setShowOrbits(v => !v)}
            style={{
              ...BTN_BASE,
              border: `1px solid ${showOrbits ? 'rgba(0,200,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
              color: showOrbits ? '#00ccff' : '#334455',
            }}
          >
            ORBITS {showOrbits ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Compare toggle */}
        <button
          onClick={() => setComparisonMode(v => !v)}
          style={{
            ...BTN_BASE,
            border: `1px solid ${comparisonMode ? 'rgba(255,180,0,0.5)' : 'rgba(0,200,255,0.2)'}`,
            color: comparisonMode ? '#ffcc44' : '#4499bb',
            boxShadow: comparisonMode ? '0 0 14px rgba(255,180,0,0.15)' : 'none',
          }}
        >
          {comparisonMode ? 'EXIT COMPARE' : 'COMPARE SIZES'}
        </button>
      </div>

      {/* Comparison mode label */}
      {comparisonMode && (
        <div style={{
          position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
          color: '#ffcc44', fontSize: 9, letterSpacing: 3.5, fontWeight: 600,
          textShadow: '0 0 18px rgba(255,180,0,0.4)',
          background: 'rgba(0,6,18,0.5)', padding: '6px 16px',
          borderRadius: 4, border: '1px solid rgba(255,180,0,0.18)',
          backdropFilter: 'blur(6px)',
        }}>
          SIZE COMPARISON MODE — TRUE RELATIVE SCALE
        </div>
      )}

      {/* Controls hint — moved to bottom-left when TimeControls occupies bottom-right */}
      {!comparisonMode && (
        <div style={{
          position: 'absolute', bottom: 28, right: 36,
          color: 'rgba(0,150,255,0.28)', fontSize: 9, letterSpacing: 2, textAlign: 'right',
          // TimeControls renders its own fixed element at bottom-right;
          // keep the hint visible above it by adding bottom offset
          paddingBottom: 60,
        }}>
          {['DRAG — ROTATE', 'SCROLL — ZOOM', 'CLICK PLANET — FOCUS'].map(t => (
            <div key={t} style={{ marginTop: 4 }}>{t}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [focusedPlanet, setFocusedPlanetRaw] = useState(null)
  const [showOrbits, setShowOrbits] = useState(true)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [ready, setReady] = useState(false)
  const [timeScale, setTimeScale] = useState(1)
  const [paused, setPaused] = useState(false)
  // S4-19: persist mute preference
  const [muted, setMuted] = useState(() => localStorage.getItem('orbit-muted') === 'true')
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)

  const { init, playHoverTone, playWhoosh } = useSound(muted)

  // Expose sound functions globally so other components can optionally use them
  useEffect(() => {
    window.__orbitSound = { playHoverTone, playWhoosh }
  }, [playHoverTone, playWhoosh])

  // S4-17: listen for planet:hover custom events
  useEffect(() => {
    const handler = (e) => playHoverTone(e.detail.index)
    window.addEventListener('planet:hover', handler)
    return () => window.removeEventListener('planet:hover', handler)
  }, [playHoverTone])

  // Wrap setFocusedPlanet to also play whoosh on focus change
  const setFocusedPlanet = useCallback((key) => {
    init()
    if (key !== null) playWhoosh()
    setFocusedPlanetRaw(key)
  }, [init, playWhoosh])

  // S4-20: On mount, read ?focus= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const focus = params.get('focus')
    if (focus) setFocusedPlanetRaw(focus)
  }, [])

  // S4-21: Keep URL in sync with focusedPlanet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (focusedPlanet) {
      params.set('focus', focusedPlanet)
    } else {
      params.delete('focus')
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
    window.history.pushState({}, '', newUrl)
  }, [focusedPlanet])

  const clearFocus = useCallback(() => {
    if (!comparisonMode) setFocusedPlanet(null)
  }, [comparisonMode, setFocusedPlanet])

  return (
    <SceneContext.Provider value={{
      focusedPlanet, setFocusedPlanet,
      cameraRef, controlsRef,
      showOrbits, setShowOrbits,
      comparisonMode, setComparisonMode,
      timeScale, setTimeScale,
      paused, setPaused,
    }}>
      {/* Custom cursor — always mounted */}
      <SpaceCursor />

      {!ready && <LoadingScreen />}
      {ready && (
        <HUD
          showOrbits={showOrbits}
          setShowOrbits={setShowOrbits}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          muted={muted}
          setMuted={setMuted}
        />
      )}
      {ready && !comparisonMode && <ReturnButton />}
      {ready && !comparisonMode && <InfoPanel />}
      {ready && <TimeControls />}

      <Canvas
        camera={{ position: [0, 80, 520], fov: 60 }}
        gl={{ antialias: true }}
        onPointerMissed={clearFocus}
        onClick={init}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
          cameraRef.current = camera
          setTimeout(() => setReady(true), 1200)
        }}
      >
        <color attach="background" args={['#000005']} />

        {/* Lighting: sun PointLight + hemisphere so far planets aren't pitch black */}
        <pointLight position={[0, 0, 0]} intensity={6.0} distance={2000} decay={0.6} color="#fff5e0" />
        <hemisphereLight args={['#1a2a4a', '#000510', 0.55]} />
        <ambientLight intensity={0.18} color="#18284a" />

        <Suspense fallback={null}>
          <SpaceBackground />
          <SolarSystem />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={20}
          maxDistance={900}
          autoRotate
          autoRotateSpeed={0.06}
          dampingFactor={0.08}
          enableDamping
        />

        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.3}
            intensity={1.8}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </SceneContext.Provider>
  )
}
