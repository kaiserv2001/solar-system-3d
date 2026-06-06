import { useMemo } from 'react'
import { Stars } from '@react-three/drei'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function makeNebulaTex(color1, color2) {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, color1)
  g.addColorStop(0.5, color2)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(canvas)
}

const NEBULAE = [
  { pos: [-520, 80, -340],  scale: 480, colors: ['rgba(60,20,90,0.22)',  'rgba(20,0,50,0)']   },
  { pos: [480, -60, -420],  scale: 520, colors: ['rgba(0,40,80,0.18)',   'rgba(0,10,30,0)']   },
  { pos: [-360, 140, 380],  scale: 400, colors: ['rgba(40,0,80,0.16)',   'rgba(10,0,40,0)']   },
  { pos: [300, -120, 500],  scale: 450, colors: ['rgba(0,50,70,0.15)',   'rgba(0,20,40,0)']   },
  { pos: [-200, 200, -500], scale: 380, colors: ['rgba(70,10,60,0.14)',  'rgba(30,0,30,0)']   },
  { pos: [550, 180, 200],   scale: 420, colors: ['rgba(10,20,80,0.16)',  'rgba(0,5,40,0)']    },
  { pos: [-480, -80, 200],  scale: 360, colors: ['rgba(50,30,80,0.13)',  'rgba(20,10,40,0)']  },
  { pos: [100, -200, -480], scale: 500, colors: ['rgba(0,30,60,0.18)',   'rgba(0,10,30,0)']   },
]

function GalaxyPlane() {
  const milkyWay = useTexture('/textures/2k_stars_milky_way.jpg')
  return (
    <mesh
      rotation={[Math.PI / 10, 0.5, 0.2]}
      position={[0, -80, -700]}
      renderOrder={-1}
    >
      <planeGeometry args={[1800, 900]} />
      <meshBasicMaterial
        map={milkyWay}
        transparent
        opacity={0.18}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function SpaceBackground() {
  const nebulaTex = useMemo(
    () => NEBULAE.map(n => makeNebulaTex(n.colors[0], n.colors[1])),
    []
  )

  return (
    <group>
      {/* Layer 1: Drei Stars */}
      <Stars radius={400} depth={80} count={6000} factor={5} fade speed={0.15} />

      {/* Layer 2: Nebula sprites */}
      {NEBULAE.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={nebulaTex[i]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}

      {/* Layer 3: Real milky way photo */}
      <GalaxyPlane />
    </group>
  )
}
