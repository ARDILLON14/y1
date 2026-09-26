// FASE A · punto 8 — latencia de intención → daño.
// No mide "pintado": mide hasta que el dato del daño está en el cliente.
// El pintado son como mucho 16 ms más (un cuadro a 60/s) y se dice así.
const http = require('http')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3777)
const DATA = '/tmp/cm-lat.json'

function req(m, p, b, ck) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, ck: x.headers['set-cookie'] ? x.headers['set-cookie'][0].split(';')[0] : ck })
      })
    })
    q.on('error', () => r({ s: 0, b: {}, ck }))
    if (d) q.write(d); q.end()
  })
}
const dormir = ms => new Promise(r => setTimeout(r, ms))
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))]
const media = a => a.reduce((x, y) => x + y, 0) / a.length

async function alta(n) {
  const u = 'lat' + n + Math.floor(Math.random() * 1e5)
  const r = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return { u, ck: r.ck }
}

// Intención → daño en la ARENA, que es el modelo que la FASE C copia.
async function arena(j) {
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' }, j.ck)
  const muestras = []
  for (let i = 0; i < 60; i++) {
    const t0 = Date.now()
    const r = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0, atacar: true, apuntar: 0 } }, j.ck)
    const dt = Date.now() - t0
    const hubo = (r.b.estado && r.b.estado.sucesos || []).some(s => s.t === 'daño' || s.t === 'golpe')
    if (hubo) muestras.push(dt)
    await dormir(60)
  }
  return muestras
}

// Intención → daño en el MUNDO hoy: una acción del combate por turnos.
async function turnos(j) {
  const muestras = []
  for (let i = 0; i < 40; i++) {
    const t0 = Date.now()
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' }, j.ck)
    const dt = Date.now() - t0
    if (r.s === 200) muestras.push(dt)
    if (r.b && r.b.playerDied) await req('POST', '/api/player/respawn', {}, j.ck)
    await dormir(40)
  }
  return muestras
}

// El pulso de posición del mundo compartido (STEP 6), que es el
// transporte que la FASE C.8 quiere reutilizar.
async function pulso(j) {
  const muestras = []
  for (let i = 0; i < 60; i++) {
    const t0 = Date.now()
    await req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 100 + i, y: 100, dir: 0, anim: 'walk' } }, j.ck)
    muestras.push(Date.now() - t0)
    await dormir(60)
  }
  return muestras
}

function fila(nombre, a) {
  if (!a.length) return `  ${nombre.padEnd(38)} sin muestras`
  return `  ${nombre.padEnd(38)} media ${media(a).toFixed(1).padStart(6)} ms · p95 ${String(pct(a, 0.95)).padStart(4)} ms · peor ${String(Math.max(...a)).padStart(4)} ms · n=${a.length}`
}

async function main() {
  console.log('\n══ LATENCIA MEDIDA (local, sin red) ══\n')

  console.log('── UN JUGADOR ──')
  const j1 = await alta(1)
  console.log(fila('arena · intención → suceso de daño', await arena(j1)))
  console.log(fila('mundo hoy · /api/combat/action', await turnos(await alta(9))))
  console.log(fila('mundo · pulso de posición (STEP 6)', await pulso(await alta(8))))

  console.log('\n── CUATRO JUGADORES A LA VEZ ──')
  const js = []
  for (let i = 0; i < 4; i++) js.push(await alta(20 + i))
  const res = await Promise.all(js.map(j => arena(j)))
  res.forEach((a, i) => console.log(fila('arena · jugador ' + (i + 1), a)))
  console.log(fila('arena · los cuatro juntos', res.flat()))
  const res2 = await Promise.all(js.map(j => pulso(j)))
  console.log(fila('mundo · pulso, los cuatro juntos', res2.flat()))
  console.log()
}

try { fs.rmSync(DATA, { force: true }) } catch {}
const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
  env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: DATA, BACKUP_DIR: '/tmp/cm-lat-b' }),
  stdio: 'ignore',
})
process.on('exit', () => { try { c.kill() } catch {} })
;(async () => {
  for (let i = 0; i < 60; i++) { await dormir(200); if ((await req('GET', '/api/health')).s === 200) break }
  await main()
  try { c.kill() } catch {}
  process.exit(0)
})()
