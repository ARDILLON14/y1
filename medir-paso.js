// La latencia que importa no es el viaje HTTP (2 ms): es cuánto tarda
// el jugador en VER la consecuencia. Entre medias hay dos esperas de
// hasta 100 ms (el paso del servidor, y el siguiente sondeo del
// cliente) y la anticipación del arma, que es a propósito.
const http = require('http'), path = require('path'), fs = require('fs')
const { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3778)
function req(m, p, b, ck) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => { let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, ck: x.headers['set-cookie'] ? x.headers['set-cookie'][0].split(';')[0] : ck }) })
    })
    q.on('error', () => r({ s: 0, b: {}, ck })); if (d) q.write(d); q.end()
  })
}
const dormir = ms => new Promise(r => setTimeout(r, ms))
const media = a => a.reduce((x, y) => x + y, 0) / a.length
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))]

// Un jugador que sondea cada 40 ms, como hace la pantalla de la arena.
async function medir(j, etiqueta) {
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' }, j.ck)
  const aGesto = [], aDano = []
  for (let intento = 0; intento < 30; intento++) {
    // Soltar el botón y dejar que termine la recuperación.
    for (let i = 0; i < 6; i++) { await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0, atacar: false } }, j.ck); await dormir(40) }
    const t0 = Date.now()
    let tGesto = null, tDano = null
    for (let i = 0; i < 40 && (!tGesto || !tDano); i++) {
      const r = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0, atacar: true, apuntar: 0 } }, j.ck)
      const s = (r.b.estado && r.b.estado.sucesos) || []
      if (!tGesto && s.some(x => x.t === 'gesto')) tGesto = Date.now() - t0
      if (!tDano && s.some(x => x.t === 'golpe' || x.t === 'daño')) tDano = Date.now() - t0
      await dormir(40)
    }
    if (tGesto !== null) aGesto.push(tGesto)
    if (tDano !== null) aDano.push(tDano)
  }
  const f = (n, a) => a.length
    ? `  ${(etiqueta + ' · ' + n).padEnd(44)} media ${media(a).toFixed(0).padStart(4)} ms · p95 ${String(pct(a, .95)).padStart(4)} ms · peor ${String(Math.max(...a)).padStart(4)} ms · n=${a.length}`
    : `  ${(etiqueta + ' · ' + n).padEnd(44)} sin muestras`
  console.log(f('pulsar → ver el gesto', aGesto))
  console.log(f('pulsar → ver el daño', aDano))
}
async function alta(n) {
  const u = 'paso' + n + Math.floor(Math.random() * 1e5)
  const r = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return { u, ck: r.ck }
}
try { fs.rmSync('/tmp/cm-paso.json', { force: true }) } catch {}
const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
  env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-paso.json', BACKUP_DIR: '/tmp/cm-paso-b' }),
  stdio: 'ignore',
})
process.on('exit', () => { try { c.kill() } catch {} })
;(async () => {
  for (let i = 0; i < 60; i++) { await dormir(200); if ((await req('GET', '/api/health')).s === 200) break }
  console.log('\n══ DE PULSAR A VERLO, SONDEANDO CADA 40 ms ══\n')
  console.log('── UN JUGADOR ──')
  await medir(await alta(1), '1 jugador')
  console.log('\n── CUATRO A LA VEZ ──')
  const js = []; for (let i = 0; i < 4; i++) js.push(await alta(30 + i))
  await Promise.all(js.map((j, i) => medir(j, '4 jug · nº' + (i + 1))))
  console.log()
  try { c.kill() } catch {}
  process.exit(0)
})()
