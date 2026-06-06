import { useRef, useEffect, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { useScene } from '../SceneContext'
import { PLANETS } from '../data/planets'
import Planet from './Planet'
import Sun from './Sun'
import AsteroidBelt from './AsteroidBelt'
import Comet from './Comet'

// ── Moon definitions ──────────────────────────────────────────────────────────
const MOONS = [
  { key: 'moon',     parentKey: 'earth',   radius: 1.24, orbitRadius: 16.4, orbitSpeed: 2.6,  color: '#aaaaaa', emissive: '#222222' },
  { key: 'io',       parentKey: 'jupiter', radius: 1.00, orbitRadius: 28,   orbitSpeed: 2.8,  color: '#d4a840', emissive: '#221400' },
  { key: 'europa',   parentKey: 'jupiter', radius: 0.96, orbitRadius: 38,   orbitSpeed: 1.8,  color: '#c8b8a0', emissive: '#141210' },
  { key: 'ganymede', parentKey: 'jupiter', radius: 1.44, orbitRadius: 50,   orbitSpeed: 1.0,  color: '#747068', emissive: '#0e0e0c' },
  { key: 'titan',    parentKey: 'saturn',  radius: 1.20, orbitRadius: 44,   orbitSpeed: 1.5,  color: '#c89050', emissive: '#201408' },
]

const INITIAL_PLANET_ANGLES = PLANETS.map((_, i) => (i / PLANETS.length) * Math.PI * 2)
const INITIAL_MOON_ANGLES   = MOONS.map((_, i) => (i / MOONS.length) * Math.PI * 2)

// ── Comparison layout — tighter spacing so zoomed camera sees full lineup ──────
const COMPARISON_POSITIONS = (() => {
  const gap = 4.5
  let x = 0
  const raw = PLANETS.map(planet => {
    x += planet.radius + gap
    const pos = x
    x += planet.radius
    return pos
  })
  const center = x / 2
  return raw.map(px => new THREE.Vector3(px - center, 0, 0))
})()

const EARTH_RADIUS = PLANETS.find(p => p.key === 'earth').radius

// ── Earth's moon with real texture ────────────────────────────────────────────
const TexturedMoon = forwardRef(function TexturedMoon({ moon }, ref) {
  const tex = useTexture('/textures/2k_moon.jpg')
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[moon.radius, 32, 32]} />
      <meshStandardMaterial map={tex} roughness={0.92} emissive="#111111" emissiveIntensity={0.4} />
    </mesh>
  )
})

export default function SolarSystem() {
  const { focusedPlanet, controlsRef, showOrbits, comparisonMode, setFocusedPlanet, timeScale, paused } = useScene()
  const { camera } = useThree()

  const planetAngles  = useRef([...INITIAL_PLANET_ANGLES])
  const moonAngles    = useRef([...INITIAL_MOON_ANGLES])
  const focusedRef    = useRef(focusedPlanet)
  const comparisonRef = useRef(comparisonMode)
  const exitingRef    = useRef(false)  // true while GSAP tweening planets back from comparison
  const timeScaleRef  = useRef(1)
  const pausedRef     = useRef(false)

  useEffect(() => { focusedRef.current = focusedPlanet },     [focusedPlanet])
  useEffect(() => { comparisonRef.current = comparisonMode }, [comparisonMode])
  useEffect(() => { timeScaleRef.current = timeScale },       [timeScale])
  useEffect(() => { pausedRef.current = paused },             [paused])

  const planetRefs = useRef(PLANETS.map(() => ({ current: null })))
  const moonRefs   = useRef(MOONS.map(() => ({ current: null })))
  const labelRefs  = useRef(PLANETS.map(() => ({ current: null })))

  // Real date mode: receive computed angles from TimeControls via custom event
  useEffect(() => {
    const handler = (e) => {
      planetAngles.current = e.detail.angles
    }
    window.addEventListener('orbit:setRealDate', handler)
    return () => window.removeEventListener('orbit:setRealDate', handler)
  }, [])

  // ── Animation loop ──────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const fp = focusedRef.current
    const cm = comparisonRef.current
    const effectiveDelta = pausedRef.current ? 0 : delta * timeScaleRef.current

    PLANETS.forEach((planet, i) => {
      const ref = planetRefs.current[i]
      if (!ref?.current) return

      if (cm || exitingRef.current) {
        // Comparison mode or exiting: only slow spin, GSAP owns position
        ref.current.rotation.y += delta * 0.18
        return
      }

      if (planet.key === fp) {
        ref.current.rotation.y += delta * 0.06
        return
      }

      planetAngles.current[i] += (effectiveDelta * planet.orbitSpeed * Math.PI * 2) / 60
      ref.current.position.set(
        Math.cos(planetAngles.current[i]) * planet.orbitRadius,
        0,
        Math.sin(planetAngles.current[i]) * planet.orbitRadius
      )
      ref.current.rotation.y += effectiveDelta * planet.rotationSpeed
    })

    // Moons — skip in comparison mode
    if (!cm && !exitingRef.current) {
      MOONS.forEach((moon, mi) => {
        const mRef = moonRefs.current[mi]
        const parentIdx = PLANETS.findIndex(p => p.key === moon.parentKey)
        const parentRef = planetRefs.current[parentIdx]
        if (!mRef?.current || !parentRef?.current) return

        if (fp !== moon.parentKey) {
          moonAngles.current[mi] += (effectiveDelta * moon.orbitSpeed * Math.PI * 2) / 60
        }
        const a = moonAngles.current[mi]
        mRef.current.position.set(
          parentRef.current.position.x + Math.cos(a) * moon.orbitRadius,
          parentRef.current.position.y,
          parentRef.current.position.z + Math.sin(a) * moon.orbitRadius
        )
      })
    }

    // Labels follow planets (skip moons labels — only planet labels)
    if (!cm) {
      PLANETS.forEach((planet, i) => {
        const pRef = planetRefs.current[i]
        const lRef = labelRefs.current[i]
        if (!pRef?.current || !lRef?.current) return
        lRef.current.position.copy(pRef.current.position)
        lRef.current.position.y += planet.radius + 2.2
      })
    }
  })

  // ── Comparison mode transitions ─────────────────────────────────────────────
  useEffect(() => {
    const controls = controlsRef?.current
    if (!controls) return

    if (comparisonMode) {
      // Clear any planet focus first
      setFocusedPlanet(null)

      controls.enabled = false
      controls.autoRotate = false
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(controls.target)

      // Diagonal above-left view matching classic solar system diagram perspective
      gsap.to(camera.position, {
        x: -90, y: 100, z: 160,
        duration: 1.8, ease: 'power2.inOut',
      })
      gsap.to(controls.target, {
        x: 0, y: 0, z: 0,
        duration: 1.8,
        onComplete: () => {
          controls.minDistance = 20
          controls.maxDistance = 400
          controls.enabled = true
        },
      })

      // Fly each planet and its label to comparison position with staggered delay
      PLANETS.forEach((planet, i) => {
        const ref = planetRefs.current[i]
        const lRef = labelRefs.current[i]
        if (!ref?.current) return
        const cp = COMPARISON_POSITIONS[i]
        const delay = i * 0.055
        gsap.to(ref.current.position, {
          x: cp.x, y: 0, z: 0,
          duration: 1.4, ease: 'power2.inOut', delay,
        })
        if (lRef?.current) {
          gsap.to(lRef.current.position, {
            x: cp.x, y: planet.radius + 2.8, z: 0,
            duration: 1.4, ease: 'power2.inOut', delay,
          })
        }
      })

      // Hide moons in comparison mode
      MOONS.forEach((_, mi) => {
        const mRef = moonRefs.current[mi]
        if (mRef?.current) {
          gsap.to(mRef.current.position, { y: -500, duration: 0.4 })
        }
      })

    } else {
      // Exit comparison — tween each planet back to its orbital position
      exitingRef.current = true
      controls.enabled = false
      controls.autoRotate = false
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(controls.target)

      // Return camera to overview
      gsap.to(camera.position, {
        x: 0, y: 80, z: 520,
        duration: 2.0, ease: 'power3.inOut',
      })
      gsap.to(controls.target, {
        x: 0, y: 0, z: 0,
        duration: 2.0,
      })

      // Tween planets and labels back to current orbital positions
      PLANETS.forEach((planet, i) => {
        const ref = planetRefs.current[i]
        const lRef = labelRefs.current[i]
        if (!ref?.current) return
        const a = planetAngles.current[i]
        const tx = Math.cos(a) * planet.orbitRadius
        const tz = Math.sin(a) * planet.orbitRadius
        const delay = i * 0.04
        gsap.to(ref.current.position, {
          x: tx, y: 0, z: tz,
          duration: 1.4, ease: 'power2.inOut', delay,
        })
        if (lRef?.current) {
          gsap.to(lRef.current.position, {
            x: tx, y: planet.radius + 2.2, z: tz,
            duration: 1.4, ease: 'power2.inOut', delay,
          })
        }
      })

      // After all planets are back, hand control to useFrame and restore camera
      const totalDelay = PLANETS.length * 0.04 + 1.4
      gsap.delayedCall(totalDelay, () => {
        exitingRef.current = false
        controls.target.set(0, 0, 0)
        controls.minDistance = 20
        controls.maxDistance = 900
        controls.autoRotate = true
        controls.enabled = true
      })

      // Restore moons
      MOONS.forEach((moon, mi) => {
        const mRef = moonRefs.current[mi]
        if (mRef?.current) {
          gsap.to(mRef.current.position, { y: 0, duration: 0.6, delay: totalDelay })
        }
      })
    }
  }, [comparisonMode, camera, controlsRef, setFocusedPlanet])

  // ── Planet focus transitions ─────────────────────────────────────────────────
  useEffect(() => {
    const controls = controlsRef?.current
    if (!controls || comparisonMode) return

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    if (!focusedPlanet) {
      controls.enabled = false
      controls.autoRotate = false
      gsap.to(camera.position, {
        x: 0, y: 80, z: 520,
        duration: 2.0, ease: 'power3.inOut',
      })
      gsap.to(controls.target, {
        x: 0, y: 0, z: 0,
        duration: 2.0, ease: 'power3.inOut',
        onComplete: () => {
          controls.minDistance = 20
          controls.maxDistance = 900
          controls.autoRotate = true
          controls.enabled = true
        },
      })
      return
    }

    if (focusedPlanet === 'sun') {
      controls.enabled = false
      controls.autoRotate = false
      gsap.to(camera.position, {
        x: 26, y: 14, z: 26,
        duration: 2.0, ease: 'power2.inOut',
      })
      gsap.to(controls.target, {
        x: 0, y: 0, z: 0,
        duration: 2.0, ease: 'power2.inOut',
        onComplete: () => {
          controls.minDistance = 16
          controls.maxDistance = 80
          controls.enabled = true
        },
      })
      return
    }

    const idx = PLANETS.findIndex(p => p.key === focusedPlanet)
    if (idx === -1) return
    const pData = PLANETS[idx]
    const pRef  = planetRefs.current[idx]
    if (!pRef?.current) return

    const pos = pRef.current.position.clone()
    // Guard: if position hasn't been set by useFrame yet, skip (planet still at origin)
    if (pos.length() < pData.orbitRadius * 0.5) return

    const dist = Math.max(pData.radius * 5.0, 12)

    // Camera offset: perpendicular to the Sun–planet axis in XZ plane + slight elevation.
    // This keeps the Sun ~90° off the view direction (well outside the 60° FOV).
    const perp = new THREE.Vector3(-pos.z, 0, pos.x).normalize()
    const camX = pos.x + perp.x * dist
    const camY = dist * 0.55
    const camZ = pos.z + perp.z * dist

    controls.enabled = false
    controls.autoRotate = false
    controls.minDistance = 0
    controls.maxDistance = 10000
    controls.target.set(pos.x, pos.y, pos.z)

    gsap.to(camera.position, {
      x: camX, y: camY, z: camZ,
      duration: 2.2, ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(pos),
      onComplete: () => {
        camera.lookAt(pos)
        // Re-set target in onComplete so OrbitControls clamps distance from the
        // planet, not from origin — prevents camera snap on re-enable.
        controls.target.set(pos.x, pos.y, pos.z)
        controls.minDistance = pData.radius * 1.6
        controls.maxDistance = pData.radius * 14
        controls.enabled = true
      },
    })
  }, [focusedPlanet, camera, controlsRef, comparisonMode])

  return (
    <>
      {/* Sun */}
      <Sun />

      {/* Asteroid belt */}
      <AsteroidBelt />

      {/* Comet — Halley's Comet on elliptical orbit */}
      <Comet />

      {/* Orbit path rings — always shown in comparison mode (they look like the classic diagram ellipses from the angled camera), otherwise respect the toggle */}
      {(showOrbits || comparisonMode) && PLANETS.map((planet) => (
        <mesh key={`orb-${planet.key}`} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.orbitRadius - 0.5, planet.orbitRadius + 0.5, 200]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={comparisonMode ? 0.055 : 0.035}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Planets */}
      {PLANETS.map((planet, i) => (
        <Planet key={planet.key} data={planet} ref={planetRefs.current[i]} />
      ))}

      {/* Moons */}
      {MOONS.map((moon, mi) => (
        moon.key === 'moon'
          ? <TexturedMoon key={moon.key} moon={moon} ref={moonRefs.current[mi]} />
          : (
            <mesh key={moon.key} ref={moonRefs.current[mi]}>
              <sphereGeometry args={[moon.radius, 24, 24]} />
              <meshStandardMaterial color={moon.color} roughness={0.92} emissive={moon.emissive} emissiveIntensity={0.5} />
            </mesh>
          )
      ))}

      {/* Planet labels — orbit labels OR comparison size labels */}
      {PLANETS.map((planet, i) => (
        <group key={`lbl-${planet.key}`} ref={labelRefs.current[i]}>
          <Html
            center
            distanceFactor={comparisonMode ? 28 : 80}
            zIndexRange={[1, 5]}
            style={{ pointerEvents: 'none' }}
          >
            {comparisonMode ? (
              // Comparison mode: name + diameter + relative size
              <div style={{
                textAlign: 'center',
                fontFamily: 'system-ui, sans-serif',
                userSelect: 'none',
              }}>
                <div style={{
                  color: '#00ccff', fontSize: 9, fontWeight: 700,
                  letterSpacing: 2.5, whiteSpace: 'nowrap',
                  textShadow: '0 0 10px rgba(0,180,255,0.6)',
                  marginBottom: 3,
                }}>
                  {planet.name.toUpperCase()}
                </div>
                <div style={{ color: '#4488aa', fontSize: 8, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                  {planet.info.diameter}
                </div>
                <div style={{
                  color: planet.key === 'earth' ? '#88ffaa' : '#667788',
                  fontSize: 8, marginTop: 2, letterSpacing: 1,
                }}>
                  {(planet.radius / EARTH_RADIUS).toFixed(1)}× Earth
                </div>
              </div>
            ) : (
              // Normal mode: planet name only
              <div style={{
                color: '#00bbee', fontSize: 10, fontFamily: 'system-ui, sans-serif',
                fontWeight: 600, letterSpacing: 2.5, whiteSpace: 'nowrap',
                opacity: focusedPlanet ? 0 : 0.75, transition: 'opacity 0.4s ease',
                textShadow: '0 0 10px rgba(0,180,255,0.7)', userSelect: 'none',
              }}>
                {planet.name.toUpperCase()}
              </div>
            )}
          </Html>
        </group>
      ))}
    </>
  )
}
