/**
 * CriptoMundo v3.1 — pruebas de misiones y mundo
 * Uso: PORT=3974 node test-misiones-mundo.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}) },
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
  await req('POST', '/api/auth/register', { username: `Mis${rand}`, email: `m${rand}@t.com`, password: 'clave-segura-1' })

  console.log('\n── MISIONES ──')
  let r = await req('GET', '/api/quests?status=available')
  check('el catálogo de misiones viene del servidor', (r.body.quests || []).length > 0)
  check('las misiones traen objetivos con clave y cantidad', !!r.body.quests[0].objectives[0].required)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  check('aceptar misión', r.status === 200)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  check('no se puede aceptar dos veces', r.status === 409)

  r = await req('POST', '/api/quests', { questId: 'q_inventada', action: 'accept' })
  check('misión inexistente rechazada', r.status === 404)

  r = await req('POST', '/api/quests', { questId: 'q_patrol', action: 'accept' })
  check('misión por encima del nivel rechazada', r.status === 403)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'progress', objectiveKey: 'gather_herb', increment: 9999 })
  check('el cliente no puede inyectar progreso', r.body.readOnly === true)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'turnin' })
  check('entregar sin completar rechazado', r.status === 400)

  console.log('\n── PROGRESO POR EVENTOS REALES ──')
  // El presupuesto de ataques no es decorativo y estaba mal medido.
  //
  // La prueba mata arañas hasta reunir las 10 hierbas que pide q_herbs.
  // Con 150 ataques pasaba cuando se inventó; después del rebalanceo de
  // la v31 —ESCALA_TURNOS pasó a vida 1,6 y daño 1,4— cada araña cuesta
  // 7,6 ataques y el jugador de nivel 1 muere 13 veces por el camino.
  // Medido contra el servidor real: hacen falta unos 168 ataques, o sea
  // un 12% más de los que había. Justo en el filo: de siete ejecuciones
  // fallaba dos.
  //
  // Y como npm test encadena los 32 archivos con &&, ese fallo dejaba
  // 26 archivos sin ejecutar por algo que no tenía nada que ver con lo
  // que se estuviera tocando.
  //
  // 450 es tres veces lo que la medición pide, así que absorbe la mala
  // suerte del botín. No alarga la prueba en la práctica: se sale en
  // cuanto llega a 10, que es sobre el ataque 170.
  let prog = 0, guard = 0, bajas = 0, muertes = 0
  while (prog < 10 && guard++ < 450) {
    const c = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (c.status === 200) {
      if (c.body.enemyDied) bajas++
      if (c.body.playerDied) { muertes++; await req('POST', '/api/player/respawn', {}) }
      for (const q of c.body.questUpdates || []) prog = Math.max(prog, q.current)
    }
    await sleep(380)
  }
  // Si algún día vuelve a fallar, que se vea POR QUÉ sin tener que
  // instrumentar la prueba a mano.
  check('la recolección avanza con el botín real del combate', prog >= 10,
        `progreso ${prog} tras ${guard} ataques · ${bajas} arañas · ${muertes} muertes`)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'turnin' })
  check('entregar con objetivos completos', r.status === 200 && r.body.rewards.gold > 0)

  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'turnin' })
  check('no se puede entregar dos veces', r.status === 404)

  r = await req('GET', '/api/quests?status=completed')
  check('la misión aparece como completada', (r.body.quests || []).indexOf('q_herbs') >= 0)

  console.log('\n── MUNDO ──')
  r = await req('POST', '/api/world/explore', { zoneId: 'forest' })
  check('explorar una zona nueva', r.status === 200)

  r = await req('POST', '/api/world/explore', { zoneId: 'forest' })
  check('re-explorar no cuenta como nueva', r.body.first === false)

  // Desde la v20 viajar no se bloquea por nivel (el botón parecía
  // roto): se permite el viaje y se avisa de que los enemigos superan
  // al jugador.
  r = await req('POST', '/api/world/explore', { zoneId: 'ruins' })
  check('se puede viajar a una zona dura, con aviso', r.status === 200 && !!r.body.aviso, JSON.stringify(r.body).slice(0, 80))

  r = await req('POST', '/api/world/explore', { zoneId: 'narnia' })
  check('zona inexistente rechazada', r.status === 404)

  console.log('\n── PÁGINAS ──')
  for (const p of ['criptomundo-misiones.html', 'criptomundo-mundo2d.html', 'criptomundo-perfil.html']) {
    const res = await new Promise(r2 => http.get(`http://localhost:${PORT}/${p}`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2({ status: x.statusCode, body: o })) }))
    check(`${p} se sirve`, res.status === 200 && res.body.length > 5000)
  }
  const mundo = await new Promise(r2 => http.get(`http://localhost:${PORT}/criptomundo-mundo2d.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2(o)) }))
  check('el mapa ya no envía COMBAT_ACTION simulado', !/sendToParent\('COMBAT_ACTION'/.test(mundo))
  check('el mapa explora contra el servidor', /api\/world\/explore/.test(mundo))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-misiones-' + Date.now() + '.json' }, stdio: 'ignore' })
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
