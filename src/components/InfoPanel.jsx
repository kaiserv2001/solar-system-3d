import { useState } from 'react'
import { useScene } from '../SceneContext'
import { SUN_DATA, ALL_BODIES } from '../data/planets'
import Toast from './Toast'

const BADGE_COLORS = {
  mercury: '#8a7a6a',
  venus:   '#c8a850',
  earth:   '#2266cc',
  mars:    '#cc4422',
  jupiter: '#c8a878',
  saturn:  '#d4c090',
  uranus:  '#88ccdd',
  neptune: '#2244bb',
  sun:     '#ff8800',
  halley:  '#c8e8ff',
}

const ROWS = [
  ['Diameter',         'diameter'],
  ['Distance from Sun','distanceFromSun'],
  ['Orbital Period',   'orbitalPeriod'],
  ['Moons',            'moons'],
  ['Atmosphere',       'atmosphere'],
  ['Avg Temperature',  'avgTemp'],
]

export default function InfoPanel() {
  const { focusedPlanet, setFocusedPlanet } = useScene()
  const [toastMessage, setToastMessage] = useState(null)

  if (!focusedPlanet) return null

  const body = focusedPlanet === 'sun'
    ? SUN_DATA
    : ALL_BODIES.find(b => b.key === focusedPlanet)
  if (!body) return null

  const { info } = body
  const dotColor = BADGE_COLORS[body.key] || '#aaaaaa'

  const isComet = body.key === 'halley'
  const subtitleLabel = body.key === 'sun'
    ? 'STELLAR BODY — SOL'
    : isComet
      ? 'COMETARY BODY — SOL SYSTEM'
      : 'PLANETARY BODY — SOL SYSTEM'

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToastMessage('LINK COPIED')
    })
  }

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 92, right: 36,
        width: 330, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        background: 'rgba(0,6,18,0.90)',
        border: '1px solid rgba(80,160,255,0.22)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: 'system-ui, sans-serif',
        color: '#cce4ff',
        zIndex: 20,
        animation: 'slideUp 0.3s ease',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,80,200,0.08)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          borderBottom: '1px solid rgba(80,160,255,0.14)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}88` }} />
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2.5, color: '#ffffff' }}>
                {body.name.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 9, color: '#00ccff', letterSpacing: 3, paddingLeft: 20 }}>
              {subtitleLabel}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Share button */}
            <button
              onClick={handleShare}
              title="Copy link"
              style={{
                background: 'none', border: '1px solid rgba(0,200,255,0.2)',
                color: '#3a6688', fontSize: 12, cursor: 'pointer',
                padding: '3px 8px', borderRadius: 4,
                transition: 'color 0.2s, border-color 0.2s',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: 1,
                lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#00ccff'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3a6688'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.2)' }}
            >
              &#x2BAD;
            </button>
            {/* Close button */}
            <button
              onClick={() => setFocusedPlanet(null)}
              style={{
                background: 'none', border: 'none',
                color: '#445566', fontSize: 18, cursor: 'pointer',
                padding: '2px 6px', borderRadius: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#aaccff'}
              onMouseLeave={e => e.target.style.color = '#445566'}
            >✕</button>
          </div>
        </div>

        {/* Data rows */}
        <div style={{ padding: '12px 18px' }}>
          {ROWS.map(([label, key]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', gap: 12,
              marginBottom: 9, fontSize: 11,
            }}>
              <span style={{ color: '#3a6688', letterSpacing: 0.8, flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#99ccee', fontWeight: 600, textAlign: 'right', lineHeight: 1.4 }}>
                {String(info[key])}
              </span>
            </div>
          ))}
        </div>

        {/* Habitability block */}
        <div style={{
          padding: '10px 18px 14px',
          borderTop: '1px solid rgba(80,160,255,0.10)',
          background: 'rgba(0,15,40,0.5)',
        }}>
          <div style={{ fontSize: 11, marginBottom: 5, color: '#88ddaa', fontWeight: 600 }}>
            {info.lifeforms}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#00ccff', marginBottom: 10 }}>
            {info.habitability}
          </div>
          <div style={{
            fontSize: 10, color: '#3a5566', lineHeight: 1.65,
            fontStyle: 'italic', borderLeft: '2px solid rgba(0,150,255,0.2)', paddingLeft: 10,
          }}>
            {info.funFact}
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </>
  )
}
