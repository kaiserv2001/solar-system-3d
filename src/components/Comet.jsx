/**
 * Comet.jsx — Halley's Comet on a Keplerian elliptical orbit
 *
 * NOTE for ui-engineer:
 *   InfoPanel reads body data from PLANETS. To support focusedPlanet === 'halley',
 *   update InfoPanel to also import COMETS (or ALL_BODIES) from '../data/planets'
 *   and look up the body from that combined array when the planet key isn't found
 *   in PLANETS.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from '../SceneContext'
import { COMETS } from '../data/planets'

const COMET = COMETS[0]

// ── Orbital parameters ────────────────────────────────────────────────────────
const SEMI_MAJOR    = COMET.semiMajorAxis                            // 280
const ECC           = COMET.eccentricity                             // 0.967
const SEMI_MINOR    = SEMI_MAJOR * Math.sqrt(1 - ECC * ECC)         // ~50.8
const CENTER_OFFSET = SEMI_MAJOR * ECC                              // ~271 (sun near one end)
const ORBIT_SPEED   = 0.006   // radians per scene-second (much slower than planets)
const TRAIL_LENGTH  = 600

export default function Comet() {
  const { setFocusedPlanet, timeScale, paused } = useScene()

  const nucleusRef = useRef()
  const trailRef   = useRef()
  const comaRef    = useRef()
  // Start near aphelion (θ ≈ π) so the comet is visible in the outer system
  const angleRef   = useRef(Math.PI * 0.85)

  // Circular buffer: last TRAIL_LENGTH nucleus world positions
  const trailPositions = useRef(new Float32Array(TRAIL_LENGTH * 3))
  const trailColors    = useRef(new Float32Array(TRAIL_LENGTH * 3))

  // Initialise trail colours: warm-white at nucleus → faint blue at tail tip
  useMemo(() => {
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = 1 - i / TRAIL_LENGTH   // 1 = nucleus, 0 = tail tip
      trailColors.current[i * 3 + 0] = 0.7 + t * 0.3   // R
      trailColors.current[i * 3 + 1] = 0.85 + t * 0.15  // G
      trailColors.current[i * 3 + 2] = 1.0               // B
    }
  }, [])

  useFrame((_, delta) => {
    const effectiveDelta = paused ? 0 : delta * (timeScale ?? 1)

    // ── Advance orbit angle ─────────────────────────────────────────────────
    angleRef.current += effectiveDelta * ORBIT_SPEED
    const θ = angleRef.current

    // Ellipse parametric: sun is at one focus
    // x = a·cos(θ) − c,  z = b·sin(θ)
    const nx = SEMI_MAJOR * Math.cos(θ) - CENTER_OFFSET
    const nz = SEMI_MINOR * Math.sin(θ)

    if (nucleusRef.current) {
      nucleusRef.current.position.set(nx, 0, nz)
    }

    // ── Shift trail buffer: copy [0..end-3] → [3..end], insert current front ─
    const pos = trailPositions.current
    pos.copyWithin(3, 0, (TRAIL_LENGTH - 1) * 3)
    pos[0] = nx
    pos[1] = 0
    pos[2] = nz

    if (trailRef.current?.geometry?.attributes?.position) {
      trailRef.current.geometry.attributes.position.needsUpdate = true
    }

    // ── Coma: scale & opacity vary with distance from sun (origin) ──────────
    if (comaRef.current) {
      const dist = Math.sqrt(nx * nx + nz * nz)
      const glow = Math.max(0.4, Math.min(3.0, 60 / dist))
      comaRef.current.scale.setScalar(glow * 2)
      comaRef.current.material.opacity = Math.min(0.7, glow * 0.25)
      // Keep coma centred on nucleus
      comaRef.current.position.set(nx, 0, nz)
    }
  })

  return (
    <>
      {/* ── Nucleus ───────────────────────────────────────────────────────── */}
      <mesh
        ref={nucleusRef}
        onClick={e => { e.stopPropagation(); setFocusedPlanet('halley') }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#c8e8ff"
          emissive="#88ccff"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* ── Coma glow (billboard plane centred on nucleus, placed by useFrame) */}
      <mesh ref={comaRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Particle tail ─────────────────────────────────────────────────── */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions.current, 3]}
            count={TRAIL_LENGTH}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[trailColors.current, 3]}
            count={TRAIL_LENGTH}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.4}
          vertexColors
          transparent
          opacity={0.6}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* ── Orbit path (very faint ellipse) ───────────────────────────────── */}
      <CometOrbitPath />
    </>
  )
}

// ── Faint elliptical orbit path ───────────────────────────────────────────────
function CometOrbitPath() {
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 200; i++) {
      const θ = (i / 200) * Math.PI * 2
      pts.push(new THREE.Vector3(
        SEMI_MAJOR * Math.cos(θ) - CENTER_OFFSET,
        0,
        SEMI_MINOR * Math.sin(θ),
      ))
    }
    return pts
  }, [])

  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  )

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#334466" transparent opacity={0.15} depthWrite={false} />
    </line>
  )
}
