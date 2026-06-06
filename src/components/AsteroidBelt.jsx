import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function sr(s) { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x) }

const COUNT = 1800
const INNER_R = 170   // just outside Mars orbit (155)
const OUTER_R = 210   // just inside Jupiter orbit (220)

// GPU-driven asteroid belt — orbital math runs in vertex shader, zero JS per frame
const vertexShader = `
uniform float time;
attribute float orbitRadius;
attribute float startAngle;
attribute float orbitSpeed;
attribute float yOffset;
attribute float aSize;

void main() {
  float angle = startAngle + time * orbitSpeed;
  vec3 pos = vec3(
    cos(angle) * orbitRadius,
    yOffset,
    sin(angle) * orbitRadius
  );
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (280.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.18, dist) * 0.65;
  gl_FragColor = vec4(0.62, 0.56, 0.46, alpha);
}
`

export default function AsteroidBelt() {
  const matRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const orbitRadius  = new Float32Array(COUNT)
    const startAngle   = new Float32Array(COUNT)
    const orbitSpeed   = new Float32Array(COUNT)
    const yOffset      = new Float32Array(COUNT)
    const aSize        = new Float32Array(COUNT)
    const positions    = new Float32Array(COUNT * 3) // zeros — shader drives actual pos

    for (let i = 0; i < COUNT; i++) {
      orbitRadius[i] = INNER_R + sr(i * 3) * (OUTER_R - INNER_R)
      startAngle[i]  = sr(i * 7) * Math.PI * 2
      orbitSpeed[i]  = (0.025 + sr(i * 5) * 0.022) * Math.PI * 2 / 60
      yOffset[i]     = (sr(i * 11) - 0.5) * 9
      aSize[i]       = 0.7 + sr(i * 13) * 1.4
    }

    geo.setAttribute('position',   new THREE.BufferAttribute(positions,  3))
    geo.setAttribute('orbitRadius',new THREE.BufferAttribute(orbitRadius, 1))
    geo.setAttribute('startAngle', new THREE.BufferAttribute(startAngle,  1))
    geo.setAttribute('orbitSpeed', new THREE.BufferAttribute(orbitSpeed,  1))
    geo.setAttribute('yOffset',    new THREE.BufferAttribute(yOffset,     1))
    geo.setAttribute('aSize',      new THREE.BufferAttribute(aSize,       1))

    return geo
  }, [])

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.time.value += delta
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ time: { value: 0 } }}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
