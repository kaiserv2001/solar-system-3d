import { forwardRef, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useScene } from '../SceneContext'
import { PLANETS } from '../data/planets'

// ── Earth extras: real cloud + city-lights layers ─────────────────────────────
function EarthLayers({ radius, textures, orbitRef }) {
  const cloudsRef = useRef()
  const nightMatRef = useRef()
  const [cloudsTex, nightTex] = useTexture([textures.cloudsMap, textures.nightMap])

  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.038
    if (nightMatRef.current && orbitRef?.current) {
      const planetPos = orbitRef.current.position
      const sunDir = new THREE.Vector3(0, 0, 0).sub(planetPos).normalize()
      nightMatRef.current.uniforms.sunDirection.value.copy(sunDir)
    }
  })

  const nightShader = useMemo(() => ({
    uniforms: {
      nightMap: { value: nightTex },
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vec4 nightColor = texture2D(nightMap, vUv);
        // sunDot: positive = day side, negative = night side
        float sunDot = dot(normalize(vNormal), normalize(sunDirection));
        // City lights visible only on night side, fade across terminator
        float nightFactor = smoothstep(0.1, -0.2, sunDot);
        gl_FragColor = vec4(nightColor.rgb, nightColor.a * nightFactor * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [nightTex])

  return (
    <>
      {/* Cloud layer — additive blend: white clouds show, black gaps are invisible */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius + 0.09, 64, 64]} />
        <meshBasicMaterial
          map={cloudsTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.55}
        />
      </mesh>

      {/* City lights — terminator-aware: only visible on the night side */}
      <mesh>
        <sphereGeometry args={[radius + 0.03, 64, 64]} />
        <shaderMaterial ref={nightMatRef} args={[nightShader]} />
      </mesh>
    </>
  )
}

// ── Earth atmospheric scattering (Rayleigh-style) ─────────────────────────────
function EarthAtmosphere({ radius, orbitRef }) {
  const matRef = useRef()

  useFrame(() => {
    if (!matRef.current || !orbitRef?.current) return
    // Sun is at origin; planet is at orbitRef.current.position in world space
    const planetPos = orbitRef.current.position
    // sunDir points FROM planet TOWARD sun = normalize(origin - planetPos)
    const sunDir = new THREE.Vector3(0, 0, 0).sub(planetPos).normalize()
    matRef.current.uniforms.sunDirection.value.copy(sunDir)
  })

  const atmosphereShader = useMemo(() => ({
    uniforms: {
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      atmosphereRadius: { value: radius * 1.18 },
      planetRadius: { value: radius },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // View direction
        vec3 viewDir = normalize(-vPosition);
        // Fresnel-like limb factor: stronger at grazing angles
        float limb = 1.0 - max(0.0, dot(vNormal, viewDir));
        float rim = pow(limb, 3.5);

        // Sun angle: how much this fragment faces the sun
        // sunDirection is in view space — transform normal to world-ish
        // Use a simplified dot with the world normal approximation
        float sunDot = dot(normalize(vNormal), normalize(sunDirection));

        // Rayleigh color: blue on the lit side, orange/red on terminator
        vec3 dayColor   = vec3(0.2, 0.5, 1.0);   // blue sky
        vec3 termColor  = vec3(0.9, 0.45, 0.1);  // orange terminator glow
        vec3 nightColor = vec3(0.02, 0.04, 0.12); // nearly black on night side

        // Blend based on sun angle
        float t = smoothstep(-0.3, 0.4, sunDot);     // day/night blend
        float tTerm = 1.0 - abs(sunDot) * 2.5;       // terminator band
        tTerm = clamp(tTerm, 0.0, 1.0);

        vec3 atmColor = mix(nightColor, dayColor, t);
        atmColor = mix(atmColor, termColor, tTerm * 0.5);

        // Intensity: only rim, stronger on day side, faint on night
        float intensity = rim * (0.3 + 0.7 * t);

        gl_FragColor = vec4(atmColor, intensity * 0.85);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [radius])

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.18, 48, 48]} />
      <shaderMaterial ref={matRef} args={[atmosphereShader]} />
    </mesh>
  )
}

// ── Saturn rings — UV-remapped so the texture maps radially inner→outer ───────
function PlanetRings({ rings }) {
  const tex = useTexture(rings.textureMap)

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(rings.innerR, rings.outerR, 160)
    const pos = geo.attributes.position
    const uv  = geo.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - rings.innerR) / (rings.outerR - rings.innerR), 1)
    }
    uv.needsUpdate = true
    return geo
  }, [rings.innerR, rings.outerR])

  return (
    <mesh rotation={[Math.PI / 2, 0, 0.15]} geometry={geometry}>
      <meshBasicMaterial
        map={tex}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Atmosphere limb glow (BackSide sphere trick) ───────────────────────────────
function AtmosphereGlow({ data }) {
  return (
    <mesh>
      <sphereGeometry args={[data.radius * 1.18, 32, 32]} />
      <meshStandardMaterial
        color={data.atmosphereColor}
        transparent
        opacity={data.atmosphereOpacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Planet ────────────────────────────────────────────────────────────────────
const Planet = forwardRef(function Planet({ data }, orbitRef) {
  const { setFocusedPlanet } = useScene()

  // Load the base color map — all planets have this
  const texture = useTexture(data.textures.map)
  texture.wrapS = THREE.RepeatWrapping

  const tiltRad = THREE.MathUtils.degToRad(data.axialTilt)

  // Keep a very faint emissive so the night side isn't pure black
  const emissive = useMemo(() => new THREE.Color(data.color).multiplyScalar(0.05), [data.color])

  return (
    <group ref={orbitRef} userData={{ planetKey: data.key }}>
      <group rotation={[0, 0, tiltRad]}>
        <mesh
          onClick={e => { e.stopPropagation(); setFocusedPlanet(data.key) }}
          onPointerEnter={() => {
            document.body.style.cursor = 'pointer'
            const index = PLANETS.findIndex(p => p.key === data.key)
            window.dispatchEvent(new CustomEvent('planet:hover', { detail: { index } }))
          }}
          onPointerLeave={() => { document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[data.radius, 72, 72]} />
          <meshStandardMaterial
            map={texture}
            roughness={data.key === 'earth' ? 0.6 : 0.88}
            metalness={data.key === 'earth' ? 0.06 : 0.0}
            emissive={emissive}
            emissiveIntensity={1}
          />
        </mesh>

        {data.key === 'earth'    && <EarthLayers radius={data.radius} textures={data.textures} orbitRef={orbitRef} />}
        {data.key === 'earth'    && <EarthAtmosphere radius={data.radius} orbitRef={orbitRef} />}
        {data.rings              && <PlanetRings rings={data.rings} />}
        {data.hasAtmosphere && data.key !== 'earth' && <AtmosphereGlow data={data} />}
      </group>
    </group>
  )
})

export default Planet
