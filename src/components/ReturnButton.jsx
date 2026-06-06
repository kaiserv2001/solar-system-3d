import { useScene } from '../SceneContext'

export default function ReturnButton() {
  const { focusedPlanet, setFocusedPlanet } = useScene()
  if (!focusedPlanet) return null

  return (
    <button
      onClick={() => setFocusedPlanet(null)}
      style={{
        position: 'fixed', top: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, cursor: 'pointer',
        padding: '10px 26px', borderRadius: 28,
        border: '1px solid rgba(80,160,255,0.28)',
        background: 'rgba(0,6,18,0.84)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#00ccff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11, fontWeight: 600, letterSpacing: 2.5,
        boxShadow: '0 0 24px rgba(0,120,255,0.12)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(80,160,255,0.55)'
        e.currentTarget.style.boxShadow = '0 0 32px rgba(0,140,255,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(80,160,255,0.28)'
        e.currentTarget.style.boxShadow = '0 0 24px rgba(0,120,255,0.12)'
      }}
    >
      ← SOLAR SYSTEM
    </button>
  )
}
