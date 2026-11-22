// Gas Dash — an arcade runner themed around USDC & gas on Arc Testnet.
// Pure HTML5 Canvas + vanilla JS. No frameworks, no wallet connection needed to play.

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const W = canvas.width
const H = canvas.height
const GROUND_Y = H - 70

// ---------- DOM refs ----------
const overlay = document.getElementById('overlay')
const gameOverEl = document.getElementById('gameOver')
const startBtn = document.getElementById('startBtn')
const retryBtn = document.getElementById('retryBtn')
const scoreVal = document.getElementById('scoreVal')
const txVal = document.getElementById('txVal')
const speedVal = document.getElementById('speedVal')
const bestScoreEl = document.getElementById('bestScore')
const finalScoreEl = document.getElementById('finalScore')

const BEST_KEY = 'gasdash_best_score'
let bestScore = Number(localStorage.getItem(BEST_KEY) || 0)
bestScoreEl.textContent = bestScore

// ---------- Game state ----------
const state = {
  running: false,
  gameOver: false,
  t: 0,
  speed: 6,
  baseSpeed: 6,
  score: 0,
  txCollected: 0,
  groundOffset: 0,
}

const player = {
  x: 90,
  y: GROUND_Y,
  w: 40,
  h: 40,
  vy: 0,
  ducking: false,
  onGround: true,
  rot: 0,
}

const GRAVITY = 0.0032 * H
const JUMP_VELOCITY = -0.052 * H

let obstacles = [] // gas spikes
let coins = [] // tx collectibles
let particles = []
let spawnTimer = 0
let coinSpawnTimer = 0

function resetGame() {
  state.running = true
  state.gameOver = false
  state.t = 0
  state.speed = state.baseSpeed
  state.score = 0
  state.txCollected = 0
  player.y = GROUND_Y
  player.vy = 0
  player.ducking = false
  player.onGround = true
  obstacles = []
  coins = []
  particles = []
  spawnTimer = 60
  coinSpawnTimer = 40
}

// ---------- Input ----------
function jump() {
  if (!state.running) return
  if (player.onGround) {
    player.vy = JUMP_VELOCITY
    player.onGround = false
  }
}

function setDuck(v) {
  if (!state.running) return
  player.ducking = v && player.onGround
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    jump()
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault()
    setDuck(true)
  }
})

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') setDuck(false)
})

canvas.addEventListener('pointerdown', () => jump())

startBtn.addEventListener('click', () => {
  overlay.classList.add('hidden')
  resetGame()
})

retryBtn.addEventListener('click', () => {
  gameOverEl.classList.add('hidden')
  resetGame()
})

// ---------- Spawning ----------
function spawnObstacle() {
  const kinds = ['spike', 'wall']
  const kind = kinds[Math.floor(Math.random() * kinds.length)]
  obstacles.push({
    x: W + 20,
    kind,
    w: kind === 'spike' ? 28 : 34,
    h: kind === 'spike' ? 36 : 54,
    passed: false,
  })
}

function spawnCoin() {
  const high = Math.random() < 0.5
  coins.push({
    x: W + 20,
    y: high ? GROUND_Y - 90 : GROUND_Y - 20,
    r: 11,
    spin: Math.random() * Math.PI * 2,
    collected: false,
  })
}

// ---------- Update ----------
function update(dt) {
  state.t += dt
  state.speed = state.baseSpeed + Math.min(state.t / 900, 7)
  speedVal.textContent = (state.speed / state.baseSpeed).toFixed(1) + 'x'

  state.groundOffset = (state.groundOffset + state.speed) % 40

  // player physics
  if (!player.onGround) {
    player.vy += GRAVITY
    player.y += player.vy
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y
      player.vy = 0
      player.onGround = true
    }
  }
  player.rot += 0.12 * (state.speed / state.baseSpeed)

  // spawn
  spawnTimer -= 1
  if (spawnTimer <= 0) {
    spawnObstacle()
    spawnTimer = Math.max(38, 85 - state.t / 60)
  }
  coinSpawnTimer -= 1
  if (coinSpawnTimer <= 0) {
    spawnCoin()
    coinSpawnTimer = 55 + Math.random() * 40
  }

  // move obstacles
  for (const o of obstacles) {
    o.x -= state.speed
    if (!o.passed && o.x + o.w < player.x) {
      o.passed = true
      state.score += 10
    }
  }
  obstacles = obstacles.filter((o) => o.x > -60)

  // move coins
  for (const c of coins) {
    c.x -= state.speed
    c.spin += 0.2
  }
  coins = coins.filter((c) => c.x > -40 && !c.collected)

  // collisions: player hitbox
  const pBox = {
    x: player.x,
    y: player.ducking ? player.y + 18 : player.y - player.h,
    w: player.w,
    h: player.ducking ? player.h - 18 : player.h,
  }

  for (const o of obstacles) {
    const oBox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h }
    if (rectOverlap(pBox, oBox)) {
      endGame()
      return
    }
  }

  for (const c of coins) {
    if (c.collected) continue
    const dx = c.x - (player.x + player.w / 2)
    const dy = c.y - (player.y - player.h / 2)
    if (Math.hypot(dx, dy) < c.r + 18) {
      c.collected = true
      state.txCollected += 1
      state.score += 25
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: c.x,
          y: c.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 1,
          life: 24,
          color: '#ffd23f',
        })
      }
    }
  }

  // particles
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.1
    p.life -= 1
  }
  particles = particles.filter((p) => p.life > 0)

  // score from survival
  state.score += 0.12 * dt
  scoreVal.textContent = Math.floor(state.score)
  txVal.textContent = state.txCollected
}

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function endGame() {
  state.running = false
  state.gameOver = true
  const finalScore = Math.floor(state.score)
  if (finalScore > bestScore) {
    bestScore = finalScore
    localStorage.setItem(BEST_KEY, String(bestScore))
    bestScoreEl.textContent = bestScore
  }
  finalScoreEl.textContent = `Score: ${finalScore} · TX collected: ${state.txCollected}`
  gameOverEl.classList.remove('hidden')
}

// ---------- Draw ----------
function drawBackground() {
  ctx.clearRect(0, 0, W, H)

  // distant "block" skyline - rectangles pulsing like blocks being mined
  ctx.save()
  for (let i = 0; i < 10; i++) {
    const bx = ((i * 110 - state.groundOffset * 0.3) % (W + 120)) - 60
    const bh = 40 + ((i * 37) % 70)
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,63,164,0.08)' : 'rgba(53,240,208,0.08)'
    ctx.fillRect(bx, GROUND_Y - bh - 30, 60, bh)
  }
  ctx.restore()

  // ground line
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y + 2)
  ctx.lineTo(W, GROUND_Y + 2)
  ctx.stroke()

  // scrolling ground ticks ("confirmed blocks")
  ctx.fillStyle = 'rgba(255,210,63,0.5)'
  for (let x = -40; x < W + 40; x += 40) {
    const gx = x - state.groundOffset
    ctx.fillRect(gx, GROUND_Y + 8, 18, 4)
  }
}

function drawPlayer() {
  ctx.save()
  const cx = player.x + player.w / 2
  const cy = player.ducking ? player.y - player.h / 3 : player.y - player.h / 2
  ctx.translate(cx, cy)
  if (!player.ducking) ctx.rotate(Math.sin(player.rot) * 0.08)

  const r = player.ducking ? player.h / 2.6 : player.h / 2
  // coin body
  const grad = ctx.createRadialGradient(-r / 3, -r / 3, 2, 0, 0, r)
  grad.addColorStop(0, '#fff4c2')
  grad.addColorStop(0.5, '#ffd23f')
  grad.addColorStop(1, '#e0a400')
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#8a5a00'
  ctx.stroke()

  // dollar/usdc glyph
  ctx.fillStyle = '#8a5a00'
  ctx.font = `bold ${Math.floor(r)}px 'Space Mono', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 1)

  ctx.restore()
}

function drawObstacles() {
  for (const o of obstacles) {
    const baseY = GROUND_Y
    if (o.kind === 'spike') {
      // "gas spike" — jagged red/pink triangle, like a gas-price spike
      ctx.beginPath()
      ctx.moveTo(o.x, baseY)
      ctx.lineTo(o.x + o.w / 2, baseY - o.h)
      ctx.lineTo(o.x + o.w, baseY)
      ctx.closePath()
      const grad = ctx.createLinearGradient(o.x, baseY - o.h, o.x, baseY)
      grad.addColorStop(0, '#ff3fa4')
      grad.addColorStop(1, '#8a1a5e')
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      // "congestion wall" — blocky pink/purple obstacle
      const grad = ctx.createLinearGradient(o.x, baseY - o.h, o.x, baseY)
      grad.addColorStop(0, '#9a3fd6')
      grad.addColorStop(1, '#4a1a66')
      ctx.fillStyle = grad
      ctx.fillRect(o.x, baseY - o.h, o.w, o.h)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.strokeRect(o.x, baseY - o.h, o.w, o.h)
    }
  }
}

function drawCoins() {
  for (const c of coins) {
    ctx.save()
    ctx.translate(c.x, c.y)
    const squish = Math.abs(Math.cos(c.spin))
    ctx.scale(Math.max(0.3, squish), 1)
    ctx.beginPath()
    ctx.arc(0, 0, c.r, 0, Math.PI * 2)
    ctx.fillStyle = '#35f0d0'
    ctx.fill()
    ctx.strokeStyle = '#0d6b5e'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = '#083a32'
    ctx.font = "bold 11px 'Space Mono', monospace"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('tx', c.x, c.y)
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 24)
    ctx.fillStyle = p.color
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
    ctx.globalAlpha = 1
  }
}

function draw() {
  drawBackground()
  drawObstacles()
  drawCoins()
  drawPlayer()
  drawParticles()
}

// ---------- Main loop ----------
let lastTime = performance.now()
function loop(now) {
  const dt = Math.min(2.2, (now - lastTime) / 16.67)
  lastTime = now
  if (state.running) update(dt)
  draw()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
