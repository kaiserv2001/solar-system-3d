import { useState, useEffect } from 'react'
import { useScene } from '../SceneContext'
import { PLANETS } from '../data/planets'

// J2000 epoch = Jan 1.5, 2000 = Unix timestamp 946728000000 ms
const J2000_MS = 946728000000

// Orbital period in Earth days
const ORBITAL_PERIODS_DAYS = {
  mercury:  87.969,
  venus:   224.701,
  earth:   365.256,
  mars:    686.971,
  jupiter: 4332.59,
  saturn:  10759.22,
  uranus:  30688.5,
  neptune: 60182.0,
}

// J2000 mean longitudes in degrees (NASA planetary fact sheets)
const J2000_LONGITUDES = {
  mercury: 252.25,
  venus:   181.98,
  earth:   100.46,
  mars:    355.45,
  jupiter:  34.40,
  saturn:   49.94,
  uranus:  313.23,
  neptune: 304.88,
}

function getRealDateAngles() {
  const now = Date.now()
  const daysSinceJ2000 = (now - J2000_MS) / 86400000
  return PLANETS.map(planet => {
    const period  = ORBITAL_PERIODS_DAYS[planet.key]
    const L0      = J2000_LONGITUDES[planet.key]
    const meanMotion = 360 / period // degrees per day
    const L = (L0 + meanMotion * daysSinceJ2000) % 360
    return (L * Math.PI) / 180
  })
}

// ── Shared button style matching App.jsx HUD ──────────────────────────────────
const BTN_BASE = {
  background: 'rgba(0,6,18,0.75)',
  borderRadius: 6,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9,
  letterSpacing: 2,
  fontWeight: 600,
  padding: '7px 14px',
  backdropFilter: 'blur(8px)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid rgba(0,200,255,0.2)',
  color: '#4499bb',
  userSelect: 'none',
}

const LABEL_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9,
  letterSpacing: 1.5,
  fontWeight: 600,
  color: '#4499bb',
  userSelect: 'none',
}

export default function TimeControls() {
  const { timeScale, setTimeScale, paused, setPaused } = useScene()
  const [realDateMode, setRealDateMode] = useState(false)

  // When real date mode activates, snap planet angles to J2000-derived positions
  useEffect(() => {
    if (!realDateMode) return
    const angles = getRealDateAngles()
    window.dispatchEvent(new CustomEvent('orbit:setRealDate', { detail: { angles } }))
  }, [realDateMode])

  function handlePlayPause() {
    setPaused(v => !v)
  }

  function handleSpeedChange(e) {
    setTimeScale(parseFloat(e.target.value))
  }

  function handleRealDate() {
    setRealDateMode(v => !v)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        pointerEvents: 'auto',
        zIndex: 100,
      }}
    >
      {/* Real date label */}
      {realDateMode && (
        <div style={{
          ...LABEL_STYLE,
          background: 'rgba(0,6,18,0.75)',
          border: '1px solid rgba(0,200,255,0.2)',
          borderRadius: 6,
          padding: '5px 12px',
          backdropFilter: 'blur(8px)',
          letterSpacing: 2,
          color: '#00ccff',
        }}>
          2026-06-06
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Real Date button */}
        <button
          onClick={handleRealDate}
          style={{
            ...BTN_BASE,
            border: realDateMode
              ? '1px solid rgba(0,200,255,0.6)'
              : '1px solid rgba(0,200,255,0.2)',
            color: realDateMode ? '#00ccff' : '#4499bb',
          }}
        >
          REAL DATE
        </button>

        {/* Speed label + slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,6,18,0.75)',
          border: '1px solid rgba(0,200,255,0.2)',
          borderRadius: 6,
          padding: '6px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={LABEL_STYLE}>SPEED</span>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={timeScale}
            onChange={handleSpeedChange}
            style={{
              width: 90,
              accentColor: '#00ccff',
              cursor: 'pointer',
            }}
          />
          <span style={{ ...LABEL_STYLE, minWidth: 36, textAlign: 'right', color: '#00ccff' }}>
            {timeScale.toFixed(1)}×
          </span>
        </div>

        {/* Play / Pause button */}
        <button
          onClick={handlePlayPause}
          style={{
            ...BTN_BASE,
            fontSize: 14,
            padding: '5px 14px',
            letterSpacing: 0,
            color: paused ? '#00ccff' : '#4499bb',
            border: paused
              ? '1px solid rgba(0,200,255,0.6)'
              : '1px solid rgba(0,200,255,0.2)',
          }}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>
    </div>
  )
}
