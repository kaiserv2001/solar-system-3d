import { useEffect, useState } from 'react'

export default function Toast({ message, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 2000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      background: 'rgba(0,20,40,0.9)',
      border: '1px solid rgba(0,200,255,0.3)',
      borderRadius: 6,
      padding: '8px 20px',
      color: '#00ccff',
      fontSize: 10,
      letterSpacing: 2,
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 600,
      backdropFilter: 'blur(8px)',
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      {message}
    </div>
  )
}
