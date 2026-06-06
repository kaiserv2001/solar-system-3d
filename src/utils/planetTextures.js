import * as THREE from 'three'

function sr(seed) {
  const x = Math.sin(seed + 1) * 43758.5453
  return x - Math.floor(x)
}

// ─── Mercury ─────────────────────────────────────────────────────────────────
function makeMercury(ctx, W, H) {
  ctx.fillStyle = '#5a5450'
  ctx.fillRect(0, 0, W, H)

  // Highland patches
  for (let i = 0; i < 60; i++) {
    const cx = sr(i * 3) * W, cy = sr(i * 7) * H
    const r = 25 + sr(i * 11) * 70
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(175,165,150,${0.12 + sr(i) * 0.14})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Craters
  for (let i = 0; i < 140; i++) {
    const cx = sr(i * 5) * W, cy = sr(i * 9) * H
    const r = 3 + sr(i * 13) * 28
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(25,22,20,0.75)')
    g.addColorStop(0.65, 'rgba(35,32,28,0.3)')
    g.addColorStop(1, `rgba(195,185,168,${0.15 + sr(i) * 0.2})`)
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }
}

// ─── Venus ───────────────────────────────────────────────────────────────────
function makeVenus(ctx, W, H) {
  // Warm amber base
  const base = ctx.createLinearGradient(0, 0, 0, H)
  base.addColorStop(0, '#b87820')
  base.addColorStop(0.4, '#d4a030')
  base.addColorStop(0.6, '#c89020')
  base.addColorStop(1, '#a86010')
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H)

  // Swirling cloud bands
  for (let y = 0; y < H; y += 1) {
    const t = y / H
    const n = Math.sin(t * 22 + Math.sin(t * 8) * 2.5) * 0.5 + 0.5
    const bright = n > 0.55
    if (bright) {
      ctx.fillStyle = `rgba(255,235,150,${(n - 0.55) * 0.7})`
      ctx.fillRect(0, y, W, 1)
    }
  }

  // Long curved streaks
  for (let i = 0; i < 24; i++) {
    const sy = sr(i * 3) * H
    ctx.beginPath()
    ctx.moveTo(0, sy)
    for (let x = 0; x <= W; x += 16) {
      const wave = Math.sin((x / W) * Math.PI * 5 + sr(i) * 12) * 55
        + Math.sin((x / W) * Math.PI * 2 + sr(i * 2) * 6) * 20
      ctx.lineTo(x, sy + wave)
    }
    ctx.strokeStyle = `rgba(255,228,120,${0.03 + sr(i * 7) * 0.07})`
    ctx.lineWidth = 2 + sr(i * 5) * 5
    ctx.stroke()
  }
}

// ─── Earth ───────────────────────────────────────────────────────────────────
function makeEarth(ctx, W, H) {
  // Deep ocean base
  ctx.fillStyle = '#143060'
  ctx.fillRect(0, 0, W, H)

  // Ocean depth variation — brighter shallow-water areas
  for (let i = 0; i < 60; i++) {
    const cx = sr(i * 5) * W, cy = sr(i * 9) * H
    const r = 25 + sr(i) * 90
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(30,90,180,${0.22 + sr(i) * 0.15})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Ocean specular shimmer strips — bright horizontal glints
  for (let y = 0; y < H; y += 1) {
    const t = y / H
    // Equatorial glint band
    const eq = Math.exp(-Math.pow((t - 0.5) * 4, 2))
    if (eq > 0.05) {
      ctx.fillStyle = `rgba(80,160,255,${eq * 0.08})`
      ctx.fillRect(0, y, W, 1)
    }
  }

  // Continents
  const land = [
    { cx: 0.22, cy: 0.36, rx: 0.09,  ry: 0.26, rot: -0.35, c: '#2d6e2a', c2: '#4a7030' },  // N.America
    { cx: 0.20, cy: 0.63, rx: 0.065, ry: 0.19, rot: 0.12,  c: '#3d5820', c2: '#2a4518' },  // S.America
    { cx: 0.51, cy: 0.30, rx: 0.065, ry: 0.17, rot: 0.08,  c: '#3a5c26', c2: '#506830' },  // Europe
    { cx: 0.53, cy: 0.56, rx: 0.065, ry: 0.23, rot: -0.05, c: '#5a6028', c2: '#6a5820' },  // Africa
    { cx: 0.68, cy: 0.34, rx: 0.14,  ry: 0.25, rot: 0.12,  c: '#486030', c2: '#5a7038' },  // Asia
    { cx: 0.81, cy: 0.62, rx: 0.062, ry: 0.09, rot: 0.28,  c: '#6a7038', c2: '#8a8048' },  // Australia
  ]
  for (const l of land) {
    // Main continent body
    ctx.save()
    ctx.translate(l.cx * W, l.cy * H)
    ctx.rotate(l.rot)
    ctx.scale(l.rx * W, l.ry * H)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g.addColorStop(0, l.c + 'ff')
    g.addColorStop(0.55, l.c + 'ee')
    g.addColorStop(0.85, l.c2 + 'aa')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // Mountain/highland interior
    ctx.save()
    ctx.translate(l.cx * W + sr(l.cx * 20) * 14 - 7, l.cy * H + sr(l.cy * 20) * 14 - 7)
    ctx.rotate(l.rot + 0.45)
    ctx.scale(l.rx * W * 0.42, l.ry * H * 0.48)
    const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g2.addColorStop(0, 'rgba(140,95,45,0.65)')
    g2.addColorStop(0.6, 'rgba(120,80,35,0.3)')
    g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // Snow-capped mountain tips
    ctx.save()
    ctx.translate(l.cx * W, l.cy * H - l.ry * H * 0.3)
    ctx.scale(l.rx * W * 0.22, l.ry * H * 0.18)
    const g3 = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g3.addColorStop(0, 'rgba(240,248,255,0.7)')
    g3.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g3
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  // Sahara / desert patch on Africa
  ctx.save()
  ctx.translate(W * 0.53, H * 0.45)
  ctx.scale(W * 0.044, H * 0.07)
  const dsrt = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  dsrt.addColorStop(0, 'rgba(210,180,100,0.55)')
  dsrt.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = dsrt; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Amazon green (brighter than surrounding)
  ctx.save()
  ctx.translate(W * 0.20, H * 0.57)
  ctx.scale(W * 0.038, H * 0.08)
  const amz = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  amz.addColorStop(0, 'rgba(30,100,20,0.6)')
  amz.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = amz; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Polar caps with slight blue tint (ice shelf)
  const np = ctx.createLinearGradient(0, 0, 0, H * 0.14)
  np.addColorStop(0, 'rgba(235,245,255,0.96)'); np.addColorStop(1, 'rgba(235,245,255,0)')
  ctx.fillStyle = np; ctx.fillRect(0, 0, W, H * 0.14)
  const sp = ctx.createLinearGradient(0, H * 0.85, 0, H)
  sp.addColorStop(0, 'rgba(235,245,255,0)'); sp.addColorStop(1, 'rgba(235,245,255,0.94)')
  ctx.fillStyle = sp; ctx.fillRect(0, H * 0.85, W, H * 0.15)
}

// ─── Mars ────────────────────────────────────────────────────────────────────
function makeMars(ctx, W, H) {
  ctx.fillStyle = '#b03818'
  ctx.fillRect(0, 0, W, H)

  // Lighter dust basins
  for (let i = 0; i < 50; i++) {
    const cx = sr(i * 3) * W, cy = sr(i * 7) * H
    const r = 40 + sr(i) * 120
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(210,140,80,${0.1 + sr(i) * 0.18})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Dark volcanic highlands
  for (let i = 0; i < 18; i++) {
    const cx = sr(i * 11) * W, cy = H * 0.28 + sr(i * 7) * H * 0.44
    const r = 25 + sr(i) * 70
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(70,20,8,${0.3 + sr(i) * 0.2})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Valles Marineris gash
  ctx.save()
  ctx.translate(W * 0.50, H * 0.47)
  ctx.rotate(-0.08)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `rgba(55,12,4,${0.28 - i * 0.04})`
    ctx.fillRect(-W * 0.24, i * 3 - 6, W * 0.48, 4)
  }
  ctx.restore()

  // North polar cap
  const np = ctx.createLinearGradient(0, 0, 0, H * 0.13)
  np.addColorStop(0, 'rgba(238,240,248,0.94)'); np.addColorStop(1, 'rgba(238,240,248,0)')
  ctx.fillStyle = np; ctx.fillRect(0, 0, W, H * 0.13)
}

// ─── Jupiter ─────────────────────────────────────────────────────────────────
function makeJupiter(ctx, W, H) {
  const bands = [
    [0.00, 0.08, '#c8a058'], [0.08, 0.14, '#e0c888'],
    [0.14, 0.22, '#c06828'], [0.22, 0.30, '#e4d0a0'],
    [0.30, 0.36, '#b85a20'], [0.36, 0.44, '#d4b068'],
    [0.44, 0.50, '#c07030'], [0.50, 0.58, '#e8d4a8'],
    [0.58, 0.66, '#b86030'], [0.66, 0.74, '#d0a860'],
    [0.74, 0.82, '#c87838'], [0.82, 0.90, '#e0cc98'],
    [0.90, 1.00, '#c09050'],
  ]
  for (const [y0, y1, c] of bands) {
    ctx.fillStyle = c
    ctx.fillRect(0, y0 * H, W, (y1 - y0) * H + 1)
  }

  // Turbulent wavy edges
  for (const [y0, y1, c] of bands) {
    const edgeY = y1 * H
    ctx.beginPath()
    for (let x = 0; x <= W; x += 6) {
      const wave = Math.sin(x * 0.025 + sr(x + y1 * 200) * 8) * 7
      x === 0 ? ctx.moveTo(x, edgeY + wave) : ctx.lineTo(x, edgeY + wave)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 3; ctx.stroke()
  }

  // Great Red Spot
  const gx = W * 0.30, gy = H * 0.615, grx = W * 0.055, gry = H * 0.062
  ctx.save(); ctx.translate(gx, gy); ctx.scale(1, gry / grx)
  const grs = ctx.createRadialGradient(0, 0, 0, 0, 0, grx)
  grs.addColorStop(0, 'rgba(210,75,35,0.95)')
  grs.addColorStop(0.5, 'rgba(185,55,22,0.85)')
  grs.addColorStop(1, 'rgba(160,45,18,0)')
  ctx.fillStyle = grs; ctx.beginPath(); ctx.arc(0, 0, grx, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Swirl strands on GRS
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(gx, gy, grx * 0.6, a, a + 0.8)
    ctx.strokeStyle = `rgba(230,100,40,0.3)`; ctx.lineWidth = 4; ctx.stroke()
  }
}

// ─── Saturn ──────────────────────────────────────────────────────────────────
function makeSaturn(ctx, W, H) {
  const bands = [
    [0.00, 0.09, '#e0d0a0'], [0.09, 0.17, '#c8b870'],
    [0.17, 0.28, '#dccca0'], [0.28, 0.36, '#c0aa68'],
    [0.36, 0.48, '#d8c898'], [0.48, 0.57, '#c4b474'],
    [0.57, 0.68, '#dccca0'], [0.68, 0.77, '#c8b87a'],
    [0.77, 0.87, '#d8ca98'], [0.87, 1.00, '#c4b068'],
  ]
  for (const [y0, y1, c] of bands) {
    ctx.fillStyle = c
    ctx.fillRect(0, y0 * H, W, (y1 - y0) * H + 1)
  }
  // Soft blends at edges
  for (const [, y1] of bands) {
    const ey = y1 * H
    const blend = ctx.createLinearGradient(0, ey - 6, 0, ey + 6)
    blend.addColorStop(0, 'rgba(0,0,0,0)'); blend.addColorStop(1, 'rgba(0,0,0,0.09)')
    ctx.fillStyle = blend; ctx.fillRect(0, ey - 6, W, 12)
  }
}

// ─── Uranus ──────────────────────────────────────────────────────────────────
function makeUranus(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#58acca'); g.addColorStop(0.25, '#80c8dc')
  g.addColorStop(0.5, '#98d8e8'); g.addColorStop(0.75, '#80c8dc')
  g.addColorStop(1, '#58a8c8')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // Very faint horizontal banding
  for (let i = 0; i < 10; i++) {
    const y = H * (0.1 + i * 0.085)
    const b = ctx.createLinearGradient(0, y - 5, 0, y + 5)
    b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(0.5, 'rgba(0,0,0,0.07)'); b.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = b; ctx.fillRect(0, y - 5, W, 10)
  }

  // Polar brighter region
  const pole = ctx.createLinearGradient(0, 0, 0, H * 0.2)
  pole.addColorStop(0, 'rgba(200,240,255,0.18)'); pole.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = pole; ctx.fillRect(0, 0, W, H * 0.2)
}

// ─── Neptune ─────────────────────────────────────────────────────────────────
function makeNeptune(ctx, W, H) {
  ctx.fillStyle = '#182878'
  ctx.fillRect(0, 0, W, H)

  // Deep dark regions
  for (let i = 0; i < 25; i++) {
    const cx = sr(i * 3) * W, cy = sr(i * 7) * H
    const r = 50 + sr(i) * 130
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(8,12,55,${0.18 + sr(i) * 0.18})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }

  // Lighter blue cloud streaks
  for (let i = 0; i < 14; i++) {
    const y = sr(i * 5) * H
    ctx.beginPath(); ctx.moveTo(0, y)
    for (let x = 0; x <= W; x += 24) {
      const dy = Math.sin(x * 0.013 + sr(i * 3) * 9) * 22 + sr(i * x * 1e-4) * 12
      ctx.lineTo(x, y + dy)
    }
    ctx.strokeStyle = `rgba(110,165,255,${0.06 + sr(i * 7) * 0.09})`
    ctx.lineWidth = 4 + sr(i) * 9; ctx.stroke()
  }

  // Great Dark Spot
  const gdx = W * 0.60, gdy = H * 0.43
  const gd = ctx.createRadialGradient(gdx, gdy, 0, gdx, gdy, W * 0.072)
  gd.addColorStop(0, 'rgba(5,8,38,0.75)'); gd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(gdx, gdy, W * 0.072, 0, Math.PI * 2); ctx.fill()
}

// ─── Saturn Rings texture ────────────────────────────────────────────────────
function makeSaturnRings(ctx, W, H) {
  ctx.clearRect(0, 0, W, H)

  function fillBand(x0, x1, color, alpha) {
    ctx.fillStyle = `rgba(${color},${alpha})`
    ctx.fillRect(x0 * W, 0, (x1 - x0) * W, H)
  }

  // Radial bands from inner (left) to outer (right)
  fillBand(0.00, 0.05, '180,165,130', 0.22)  // D ring (faint)
  fillBand(0.05, 0.22, '190,172,135', 0.50)  // C ring
  fillBand(0.22, 0.46, '215,195,150', 0.90)  // B ring (bright)
  fillBand(0.46, 0.50, '20,15,8',     0.18)  // Cassini Division
  fillBand(0.50, 0.70, '200,180,140', 0.80)  // A ring inner
  fillBand(0.70, 0.72, '20,15,8',     0.22)  // Encke Gap
  fillBand(0.72, 0.82, '185,168,128', 0.60)  // A ring outer
  fillBand(0.82, 0.92, '165,148,110', 0.35)  // F ring area
  fillBand(0.92, 1.00, '0,0,0',       0.00)  // outer gap

  // Subtle radial texture streaks
  for (let x = 0; x < W; x += 3) {
    const n = Math.sin(x * 0.9) * Math.cos(x * 0.3)
    if (n > 0.3) {
      ctx.fillStyle = `rgba(255,255,220,${(n - 0.3) * 0.06})`
      ctx.fillRect(x, 0, 2, H)
    }
  }
}

// ─── Cache & Export ──────────────────────────────────────────────────────────
const _cache = {}

const GENERATORS = {
  mercury: makeMercury,
  venus:   makeVenus,
  earth:   makeEarth,
  mars:    makeMars,
  jupiter: makeJupiter,
  saturn:  makeSaturn,
  uranus:  makeUranus,
  neptune: makeNeptune,
}

export function getPlanetTexture(key) {
  if (!_cache[key]) {
    const W = 1024, H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    GENERATORS[key]?.(ctx, W, H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.needsUpdate = true
    _cache[key] = tex
  }
  return _cache[key]
}

export function getSaturnRingsTexture() {
  if (!_cache['saturn_rings']) {
    const W = 512, H = 64
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    makeSaturnRings(ctx, W, H)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    _cache['saturn_rings'] = tex
  }
  return _cache['saturn_rings']
}
