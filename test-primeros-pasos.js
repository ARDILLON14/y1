/**
 * CriptoMundo v6 — pruebas de Primeros pasos
 * Uso: PORT=3979 node test-primeros-pasos.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}

async function run() {
  const rand = Math.floor(Math.random() * 1e9)

  console.log('\n── LISTA INICIAL ──')
  let r = await req('GET', '/api/onboarding')
  check('sin sesión no se puede consultar', r.status === 401)

  await req('POST', '/api/auth/register', { username: `Paso${rand}`, email: `p${rand}@t.com`, password: 'clave-segura-1' })
  r = await req('GET', '/api/onboarding')
  check('la lista viene del servidor', r.status === 200 && r.body.total >= 5)
  check('incluye los sistemas nuevos', ['p_recolectar', 'p_sembrar', 'p_arena'].every(id => r.body.pasos.some(p => p.id === id)))
  check('un jugador nuevo empieza a cero', r.body.hechos === 0)
  check('hay un primer paso propuesto', !!r.body.siguiente)
  check('cada paso indica a qué pantalla ir', r.body.pasos.every(p => !!p.modulo && !!p.pista))

  console.log('\n── NO SE PUEDE HACER TRAMPA ──')
  r = await req('POST', '/api/onboarding/claim', { id: 'p_combate' })
  check('cobrar un paso no hecho se rechaza', r.status === 400)

  r = await req('POST', '/api/onboarding/claim', { id: 'paso_inventado' })
  check('paso inexistente rechazado', r.status === 404)

  console.log('\n── SE MARCA SOLO CON EL JUEGO REAL ──')
  let vivo = true
  for (let i = 0; i < 20 && vivo; i++) {
    const c = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (c.status === 200 && c.body.enemyDied) vivo = false
    else await sleep(400)
  }
  r = await req('GET', '/api/onboarding')
  const combate = r.body.pasos.find(p => p.id === 'p_combate')
  check('ganar un combate marca el paso sin avisar a nadie', combate && combate.hecho === true)
  check('queda pendiente de cobrar', r.body.porReclamar >= 1)

  console.log('\n── COBRO ──')
  // Se mide justo antes de cobrar: entre medias el combate ya dio oro.
  const oro0 = (await req('GET', '/api/player')).body.character.gold
  r = await req('POST', '/api/onboarding/claim', { id: 'p_combate' })
  check('se cobra la recompensa', r.status === 200 && r.body.oro > 0)
  const oro1 = (await req('GET', '/api/player')).body.character.gold
  check('el oro llega de verdad al personaje', oro1 === oro0 + r.body.oro, `${oro0} → ${oro1}`)

  r = await req('POST', '/api/onboarding/claim', { id: 'p_combate' })
  check('no se puede cobrar dos veces', r.status === 409)

  r = await req('POST', '/api/onboarding/claim', { id: 'p_combate' }, { 'Idempotency-Key': 'x' + rand })
  const r2 = await req('POST', '/api/onboarding/claim', { id: 'p_combate' }, { 'Idempotency-Key': 'x' + rand })
  check('el doble envío no duplica el pago', r.raw === r2.raw)

  console.log('\n── OTRAS ACTIVIDADES ──')
  await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  r = await req('GET', '/api/onboarding')
  check('aceptar una misión marca su paso', r.body.pasos.find(p => p.id === 'p_mision').hecho === true)

  await req('POST', '/api/crafting', { recipeId: 'rec_potion', quantity: 1 })
  r = await req('GET', '/api/onboarding')
  check('fabricar marca su paso', r.body.pasos.find(p => p.id === 'p_taller').hecho === true)

  await req('POST', '/api/gather', { nodoId: 'pozo' })
  r = await req('GET', '/api/onboarding')
  check('recolectar marca su paso', r.body.pasos.find(p => p.id === 'p_recolectar').hecho === true)

  console.log('\n── INTERFAZ ──')
  const idx = await new Promise(res => http.get(`http://localhost:${PORT}/`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el launcher muestra el panel de pasos', /pp-panel/.test(idx))
  check('el panel se construye desde la API', /api\/onboarding/.test(idx))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-pasos.json', BACKUP_DIR: '/tmp/cm-pasos-backups' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
