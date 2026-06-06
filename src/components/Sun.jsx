import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScene } from '../SceneContext'
import { SUN_DATA } from '../data/planets'

const sunVert = `
uniform float time;
varying vec2 vUv;
varying float vDisp;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vUv = uv;
  float n = fbm(position * 0.25 + vec3(0.0, 0.0, time * 0.12));
  vDisp = n;
  vec3 displaced = position + normal * (n * 1.2 - 0.3);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const sunFrag = `
varying vec2 vUv;
varying float vDisp;

void main() {
  float t = clamp(vDisp, 0.0, 1.0);
  vec3 cool  = vec3(0.85, 0.25, 0.02);
  vec3 mid   = vec3(1.0,  0.55, 0.08);
  vec3 hot   = vec3(1.0,  0.92, 0.65);
  vec3 white = vec3(1.0,  0.98, 0.90);

  vec3 col = mix(cool, mid, smoothstep(0.15, 0.45, t));
  col = mix(col, hot,  smoothstep(0.45, 0.72, t));
  col = mix(col, white, smoothstep(0.72, 0.92, t));

  // Boost brightness for bloom
  col *= 2.4;
  gl_FragColor = vec4(col, 1.0);
}
`

export default function Sun() {
  const matRef = useRef()
  const { setFocusedPlanet } = useScene()

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.time.value += delta
  })

  return (
    <group>
      {/* Bright inner core — picked up by Bloom */}
      <mesh
        onClick={(e) => { e.stopPropagation(); setFocusedPlanet('sun') }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[SUN_DATA.radius, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={sunVert}
          fragmentShader={sunFrag}
          uniforms={{ time: { value: 0 } }}
        />
      </mesh>
      {/* Soft outer glow halo */}
      <mesh>
        <sphereGeometry args={[SUN_DATA.radius * 1.08, 32, 32]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={2}
        />
      </mesh>
    </group>
  )
}
