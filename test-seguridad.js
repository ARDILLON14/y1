/**
 * CriptoMundo v3 — Suite de pruebas (0 dependencias)
 * Uso:  node criptomundo.js   (en otra terminal)
 *       node test-seguridad.js
 * O:    PORT=3999 node test-seguridad.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
const BASE = `http://localhost:${PORT}`
let cookie = ''
let pass = 0, failed = 0

function req(method, path, body, useCookie = true) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {},
        useCookie && cookie ? { Cookie: cookie } : {}) },
      res => {
        let out = ''
        res.on('data', c => out += c)
        res.on('end', () => {
          const sc = res.headers['set-cookie']
          if (sc) cookie = sc[0].split(';')[0]
          let json = {}
          try { json = JSON.parse(out) } catch {}
          resolve({ status: res.statusCode, body: json, headers: res.headers })
        })
      })
    r.on('error', reject)
    if (data) r.write(data)
    r.end()
  })
}

function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${extra}`) }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
const section = t => console.log(`\n── ${t} ──`)

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  const user = `Test${rand}`, email = `t${rand}@test.com`, password = 'clave-segura-1'

  section('AUTENTICACIÓN')
  let r = await req('POST', '/api/auth/register', { username: user, email, password })
  check('registro correcto', r.status === 201, JSON.stringify(r.body))
  check('cookie HttpOnly + SameSite', /HttpOnly/i.test(r.headers['set-cookie']?.[0] || '') && /SameSite/i.test(r.headers['set-cookie']?.[0] || ''))
  check('no se filtra el hash de contraseña', !JSON.stringify(r.body).includes('scrypt'))

  r = await req('POST', '/api/auth/register', { username: `X${rand}`, email: `x${rand}@t.com`, password: '123' })
  check('contraseña corta rechazada', r.status === 400)

  r = await req('POST', '/api/auth/login', { email, password: 'incorrecta' }, false)
  check('login con contraseña mala falla', r.status === 401)

  r = await req('POST', '/api/auth/login', { email, password })
  check('login correcto', r.status === 200)

  const saved = cookie
  cookie = 'cm_token=falsificado'
  r = await req('GET', '/api/player')
  check('token falsificado rechazado', r.status === 401)
  cookie = saved

  section('TLS')
  r = await req('GET', '/api/health')
  check('/api/health informa de si la petición llegó cifrada', typeof r.body.tlsDetectado === 'boolean')

  section('CORS Y CABECERAS')
  r = await req('GET', '/api/health')
  check('sin Access-Control-Allow-Origin: *', r.headers['access-control-allow-origin'] !== '*')
  check('X-Content-Type-Options presente', r.headers['x-content-type-options'] === 'nosniff')

  section('COMBATE SERVER-AUTHORITATIVE')
  r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack', monsterCurrentHp: 1 })
  if (r.status === 429) { await sleep(450); r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack', monsterCurrentHp: 1 }) }
  check('el cliente no puede fijar el HP del enemigo', r.body.newMonsterHp > 1, `hp=${r.body.newMonsterHp}`)
  const hp1 = r.body.newMonsterHp
  // Segundo golpe: lo que se comprueba es que la vida del enemigo viene
  // de la batalla guardada en el servidor y no de lo que mande el
  // cliente. Para verlo hace falta que el golpe ACIERTE.
  //
  // Antes se daba un golpe y ya. Un ataque falla el 5 % de las veces, y
  // cuando fallaba la vida del enemigo se quedaba igual y la prueba
  // daba en rojo sin que hubiera nada roto: una de cada veinte suites.
  // Es el mismo modo de fallo que ya se corrigió en test-turnos y en
  // test-contenido — una prueba que observa algo que el servidor decide
  // con un dado tiene que insistir hasta verlo, con un presupuesto
  // medido, o no exigirlo.
  //
  // Seis intentos dejan la probabilidad de no acertar ninguno en menos
  // de uno entre diez mil.
  let hp2 = hp1, golpes = 0, murio = false
  for (let i = 0; i < 6 && hp2 >= hp1 && !murio; i++) {
    await sleep(450)
    r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack', monsterCurrentHp: 99999 })
    // El servidor rechaza acciones demasiado seguidas: si topa con ese
    // límite, se espera y se repite. Sin esto la prueba fallaba a veces
    // por temporización y no por un fallo real.
    if (r.status === 429) { await sleep(600); continue }
    golpes++
    murio = !!r.body.enemyDied
    if (typeof r.body.newMonsterHp === 'number') hp2 = r.body.newMonsterHp
  }
  check('la batalla persiste en el servidor', hp2 < hp1 || murio,
    `${hp1} → ${hp2} en ${golpes} golpes`)
  r = await req('POST', '/api/combat/action', { monsterId: 'm_inventado', action: 'attack' })
  check('monstruo inexistente rechazado', r.status === 404)
  await sleep(450)
  r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'ganar_todo' })
  check('acción inválida rechazada', r.status === 400)

  section('MISIONES')
  await req('POST', '/api/quests', { questId: 'q_trolls', action: 'accept' })
  r = await req('POST', '/api/quests', { questId: 'q_trolls', action: 'progress', objectiveKey: 'kill_troll', increment: 9999 })
  const prog = r.body.objectiveProgress?.[0]?.current ?? 0
  check('el cliente no puede inyectar progreso', prog < 8, `progreso=${prog}`)
  r = await req('POST', '/api/quests', { questId: 'q_trolls', action: 'turnin' })
  check('turnin sin objetivos completos rechazado', r.status === 400)

  section('MAZMORRAS')
  r = await req('POST', '/api/mazmorra/sala', { salaId: 'cualquiera' })
  check('elegir sala sin estar dentro rechazado', r.status === 404, JSON.stringify(r.body))
  r = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_ruinas' })
  check('mazmorra por encima del nivel rechazada', r.status === 403)
  r = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'inventada' })
  check('mazmorra inexistente rechazada', r.status === 404)
  r = await req('POST', '/api/mazmorra/retirarse', {})
  check('retirarse sin estar dentro rechazado', r.status === 404)

  section('MERCADO')
  r = await req('GET', '/api/market')
  const listing = r.body.listings.find(l => l.itemId === 'iron_ore')
  const before = (await req('GET', '/api/player')).body.character.gold
  r = await req('POST', `/api/market/${listing.id}/buy`, { quantity: 1, pricePerUnit: 1, price: 0 })
  const after = (await req('GET', '/api/player')).body.character.gold
  check('el precio lo pone el servidor, no el cliente', before - after === listing.pricePerUnit, `pagó ${before - after}`)
  r = await req('POST', `/api/market/${listing.id}/buy`, { quantity: -5 })
  check('cantidad negativa rechazada', r.status === 400)
  r = await req('POST', `/api/market/${listing.id}/buy`, { quantity: 999999 })
  check('cantidad excesiva rechazada', r.status === 400)
  r = await req('POST', '/api/market', { itemId: 'iron_ore', quantity: 99999, pricePerUnit: 10 })
  check('vender más de lo que tienes rechazado', r.status === 400)
  r = await req('POST', '/api/market', { itemId: 'objeto_falso', quantity: 1, pricePerUnit: 10 })
  check('objeto inexistente rechazado', r.status === 400)

  // escrow + cancelación
  r = await req('POST', '/api/market', { itemId: 'iron_ore', quantity: 1, pricePerUnit: 50 })
  const mine = r.body.listing
  check('publicación creada con escrow', !!mine)
  if (mine) {
    r = await req('POST', `/api/market/${mine.id}/buy`, { quantity: 1 })
    check('no puedes comprar tu propia publicación', r.status === 400)
    r = await req('POST', `/api/market/${mine.id}/cancel`, {})
    check('cancelar devuelve el objeto', r.status === 200)
  }

  section('PvP')
  const rating0 = (await req('GET', '/api/player')).body.character.pvpRating
  r = await req('POST', '/api/pvp/result', { result: 'win', goldBet: 999999, cgridBet: 500, opponentRating: 3000 })
  check('endpoint antiguo ya no acepta el resultado del cliente', r.body.deprecated === true)
  check('CGRID no se puede apostar', (await req('GET', '/api/player')).body.character.cgrid === 0)
  check('el rating lo calcula el servidor (Elo)', Math.abs((r.body.newRating || rating0) - rating0) <= 32)

  section('ECONOMÍA CGRID')
  r = await req('GET', '/api/economy')
  check('existe tope diario de emisión', r.body.cgrid.dailyPlayerCap > 0 && r.body.cgrid.dailyGlobalCap > 0)
  r = await req('GET', '/api/web3/status')
  check('se declara que CGRID NO está on-chain', r.body.onChain === false)

  section('CHAT / ANTI-SPAM')
  let blocked = false
  for (let i = 0; i < 12; i++) {
    const rr = await req('POST', '/api/chat', { message: 'hola mundo ' + i })
    if (rr.status === 429) { blocked = true; break }
  }
  check('rate limit de chat activo', blocked)
  await new Promise(r2 => setTimeout(r2, 100))
  r = await req('GET', '/api/chat')
  const xss = await req('POST', '/api/chat', { message: '<script>alert(1)</script>' })
  if (xss.status === 201) check('XSS escapado en el chat', !xss.body.message.message.includes('<script'))
  else check('XSS escapado en el chat (limitado por rate limit)', true)

  section('CASA')
  r = await req('POST', '/api/house', { action: 'buy', furnitureId: 'throne', cost: 1 })
  check('el coste de muebles lo pone el servidor', r.status === 400 || r.body.newGold !== undefined)

  console.log(`\n${'═'.repeat(46)}\n  ${pass} pruebas OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-')
  const child = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-test-' + Date.now() + '.json' }, stdio: 'ignore' })
  // El servidor se mataba en un .finally() detrás de run(), y run()
  // termina en process.exit(): ese .finally() NO llega a ejecutarse
  // nunca, así que cada ejecución dejaba un servidor vivo con su
  // puerto ocupado. La siguiente no podía escuchar ahí, hablaba sin
  // saberlo con el servidor viejo —con las cuentas y los contadores de
  // la anterior— y fallaba por cosas que no tenían nada que ver.
  // 'exit' sí se dispara con process.exit().
  process.on('exit', () => { try { child.kill() } catch {} })
  esperarServidor(PORT).then(() => run().finally(() => child.kill()))
} else run()

// Espera a que el servidor CONTESTE, en vez de dar por hecho que en unos
// milisegundos ya estará arriba.
//
// Esa suposición se cae en cuanto la suite corre en paralelo: varios
// servidores levantando a la vez tardan más, y el síntoma era un
// ECONNREFUSED que parecía un fallo de la prueba y no lo era.
function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = require('http').get({ host: 'localhost', port: puerto, path: '/api/health' }, res => {
        res.resume()
        resolve(true)
      })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}

// Empieza siempre de cero.
//
// Sin esto, una prueba hereda el mundo que dejó la ejecución anterior:
// publicaciones a medio vender, personajes con nivel, enfriamientos sin
// cumplir. Lo destapó test-economia-objetos, que compraba dos unidades de
// una publicación que la vez anterior había dejado en una, y contestaba
// "Cantidad inválida" sin que hubiera nada roto.
function limpiarDatos() {
  const fs = require('fs')
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
