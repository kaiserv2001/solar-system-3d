export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000005',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Star dots background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.4 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(Math.sin(i * 127.1) * 0.5 + 0.5) * 100}%`,
            top:  `${(Math.sin(i * 311.7) * 0.5 + 0.5) * 100}%`,
            width: i % 7 === 0 ? 2 : 1,
            height: i % 7 === 0 ? 2 : 1,
            borderRadius: '50%',
            background: '#ffffff',
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 56, fontWeight: 700, letterSpacing: 20,
        color: '#ffffff', marginBottom: 12,
        textShadow: '0 0 40px rgba(80,160,255,0.4)',
        animation: 'pulse 3s ease-in-out infinite',
      }}>
        ORBIT
      </div>

      <div style={{
        fontSize: 10, letterSpacing: 6, color: '#00ccff', marginBottom: 50,
        opacity: 0.7,
      }}>
        SOLAR SYSTEM VISUALIZATION
      </div>

      {/* Pulse ring */}
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: 64, height: 64, borderRadius: '50%',
          border: '1px solid rgba(0,200,255,0.5)',
          animation: 'pulse 1.6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: 44, height: 44, borderRadius: '50%',
          border: '1px solid rgba(0,200,255,0.3)',
          animation: 'pulse 1.6s ease-in-out infinite 0.4s',
        }} />
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00ccff',
          boxShadow: '0 0 12px #00ccff',
        }} />
      </div>

      <div style={{ marginTop: 30, fontSize: 9, letterSpacing: 4, color: '#1a3a5a', animation: 'pulse 2s ease-in-out infinite' }}>
        LOADING UNIVERSE...
      </div>
    </div>
  )
}
