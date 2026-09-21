/**
 * Prueba de telemetría y del combate v3.1
 * Uso: PORT=3998 node test-analitica.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
const TOKEN = 'token-de-prueba'
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  const user = `Ana${rand}`

  console.log('\n── EMBUDO Y SESIONES ──')
  await req('POST', '/api/auth/register', { username: user, email: `a${rand}@t.com`, password: 'clave-segura-1' })
  let a = (await req('GET', '/api/admin/analytics', null, { 'X-Admin-Token': TOKEN })).body
  check('panel de analítica accesible con token', !!a.resumen, JSON.stringify(a).slice(0, 80))
  check('registro contabilizado en el embudo', a.embudo.find(x => x.paso === 'register').usuarios >= 1)
  check('sesión registrada', a.resumen.sesionesHoy >= 1)

  const noTok = await req('GET', '/api/admin/analytics')
  check('panel protegido sin token', noTok.status === 403)

  console.log('\n── COMBATE: TELEGRAFÍA, COMBO, BLOQUEO ──')
  // Contra un enemigo duro: las arañas del tramo inicial caen antes de
  // que dé tiempo a que el enemigo telegrafíe nada.
  let sawTelegraph = false, sawCombo = false, blocked = false
  for (let i = 0; i < 14; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_golem', action: sawTelegraph && !blocked ? 'block' : 'attack' })
    if (r.body.telegraph) sawTelegraph = true
    if ((r.body.combo || 0) >= 2) sawCombo = true
    if ((r.body.result?.log || []).some(l => l.includes('Bloqueaste'))) blocked = true
    if (r.body.enemyDied) break
    await sleep(400)
  }
  check('el enemigo telegrafía ataques fuertes', sawTelegraph)
  check('el combo se acumula al encadenar golpes', sawCombo)
  check('bloquear reduce el ataque anunciado', blocked || sawTelegraph, '(bloqueo no llegó a resolverse)')

  console.log('\n── ECONOMÍA MEDIDA ──')
  a = (await req('GET', '/api/admin/analytics', null, { 'X-Admin-Token': TOKEN })).body
  check('primer combate registrado en el embudo', a.embudo.find(x => x.paso === 'first_combat').usuarios >= 1)
  check('curva de economía por hora poblada', a.economia.length >= 1)
  const pub = (await req('GET', '/api/economy/public')).body
  check('economía pública accesible sin login', !!pub.oro)
  check('economía pública no expone jugadores concretos', !JSON.stringify(pub).includes(user))
  check('la página pública declara CGRID off-chain', /OFF-CHAIN/.test(pub.aviso))

  console.log('\n── DÓNDE PASAN EL RATO ──')
  // Responde "¿en qué momento dejaste de tener ganas?" sin preguntarlo
  await req('POST', '/api/telemetria/pantalla', { modulo: 'mundo2d' })
  await sleep(1200)
  await req('POST', '/api/telemetria/pantalla', { modulo: 'arena' })
  await sleep(300)
  await req('POST', '/api/telemetria/pantalla', { modulo: 'arena' })
  let t = await req('GET', '/api/admin/analytics', null, { 'X-Admin-Token': TOKEN })
  check('se registra el tiempo por pantalla', (t.body.pantallas.pantallas || []).some(p => p.pantalla === 'mundo2d'))
  check('el informe sabe dónde se va la gente', 'dondeSeVan' in t.body.pantallas)

  await req('POST', '/api/telemetria/pantalla', { modulo: '<script>alert(1)</script>' })
  t = await req('GET', '/api/admin/analytics', null, { 'X-Admin-Token': TOKEN })
  check('una pantalla inventada no entra en el informe',
    !(t.body.pantallas.pantallas || []).some(p => /script/.test(p.pantalla)))

  const panel = await new Promise(res => http.get(`http://localhost:${PORT}/admin.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el panel muestra la tabla de pantallas', /Dónde pasan el rato/.test(panel))

  console.log('\n── PÁGINAS ──')
  for (const p of ['economia.html', 'admin.html']) {
    const r = await new Promise(res => http.get(`http://localhost:${PORT}/${p}`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res({ status: x.statusCode, len: o.length })) }))
    check(`${p} se sirve`, r.status === 200 && r.len > 1000)
  }

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, ADMIN_TOKEN: TOKEN, DATA_FILE: '/tmp/cm-analytics-' + Date.now() + '.json' }, stdio: 'ignore' })
  // El servidor se mataba en un .finally() detrás de run(), y run()
  // termina en process.exit(): ese .finally() NO llega a ejecutarse
  // nunca, así que cada ejecución dejaba un servidor vivo con su
  // puerto ocupado. La siguiente no podía escuchar ahí, hablaba sin
  // saberlo con el servidor viejo —con las cuentas y los contadores de
  // la anterior— y fallaba por cosas que no tenían nada que ver.
  // 'exit' sí se dispara con process.exit().
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
