/**
 * CriptoMundo — lo que sobrevive a un reinicio del servidor
 * Uso:  node test-sesiones-persisten.js
 *
 * POR QUÉ EXISTE
 * La cookie de sesión dura siete días en el navegador, pero el token que
 * la valida vivía SOLO en memoria: snapshotOf() no guardaba sessions. En
 * la práctica eso significaba que cada despliegue echaba a todos los
 * jugadores a la pantalla de login, y el síntoma que ellos veían ("me ha
 * cerrado la sesión sola") no se parece en nada a la causa ("han
 * reiniciado el servidor"). Lo mismo con las batallas por turnos: el
 * código ya preveía encontrarse partidas a medias guardadas de antes,
 * pero nunca llegaban a guardarse.
 *
 * Esta prueba arranca el servidor, hace cosas, LO MATA, lo vuelve a
 * arrancar con el mismo archivo de datos y comprueba qué sigue en pie.
 */
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3881)
const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-sesiones-'))
const DATA_FILE = path.join(BASE, 'datos.json')
const BACKUP_DIR = path.join(BASE, 'backups')

let cookie = '', pass = 0, failed = 0, hijo = null
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body, ck) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    const c = ck === undefined ? cookie : ck
    if (c) h.Cookie = c
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', x => o += x)
      res.on('end', () => {
        if (res.headers['set-cookie'] && ck === undefined) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

async function arrancar() {
  hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE, BACKUP_DIR }),
    stdio: 'ignore',
  })
  // Se espera a que conteste de verdad, no a que pase un tiempo: en una
  // máquina cargada 1,5 s no siempre bastan y el fallo parecería otra cosa.
  for (let i = 0; i < 60; i++) {
    await dormir(200)
    const r = await req('GET', '/api/auth/mode', null, '')
    if (r.status === 200) return true
  }
  return false
}

async function parar() {
  if (!hijo) return
  const p = hijo
  hijo = null
  await new Promise(r => { p.once('exit', r); try { p.kill() } catch { r() } })
  await dormir(300)
}

async function run() {
  console.log('\n── ARRANQUE LIMPIO ──')
  check('el servidor arranca', await arrancar())

  const u = 'ses' + Math.floor(Math.random() * 1e6)
  const reg = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  check('se puede crear una cuenta', reg.status === 201 || reg.status === 200, String(reg.status))
  const galleta = cookie
  check('el registro deja una cookie de sesión', /cm_token=.+/.test(galleta), galleta)

  const yo = await req('GET', '/api/player')
  check('la sesión vale para pedir el personaje', yo.status === 200, String(yo.status))

  // Algo que deje rastro en cada una de las tres estructuras nuevas.
  await req('POST', '/api/chat', { message: 'hola desde antes del reinicio' })
  // No hay endpoint para "empezar" una batalla: la crea el primer golpe.
  //
  // Y se insiste hasta que el golpe ENTRE. Un ataque falla el 5 % de las
  // veces; con un solo golpe, una de cada veinte ejecuciones dejaba a la
  // araña intacta y esta prueba daba en rojo sin que hubiera nada roto.
  // Es la misma familia de defecto que ya se corrigió en test-turnos,
  // test-contenido y test-seguridad: una prueba que observa algo que el
  // servidor decide con un dado tiene que insistir con un presupuesto
  // medido. Seis intentos dejan la probabilidad de fallar los seis por
  // debajo de uno entre diez mil.
  let bat = null, golpes = 0
  for (let i = 0; i < 6; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (r.status !== 200) { bat = r; break }
    golpes++
    bat = r
    if (r.body.newMonsterHp < r.body.enemyMaxHp) break
    await dormir(420)
  }
  check('empieza una batalla por turnos', bat.status === 200 && !!bat.body.battleId, String(bat.status) + ' ' + bat.raw.slice(0, 80))
  check('y la araña ya ha perdido vida', bat.body.newMonsterHp < bat.body.enemyMaxHp,
    `${bat.body.newMonsterHp} de ${bat.body.enemyMaxHp} tras ${golpes} golpes`)
  const batallaId = bat.body.battleId
  const hpEnemigo = bat.body.newMonsterHp

  // La escritura en disco está amortiguada 1,5 s; se le da margen.
  await dormir(2500)
  check('el archivo de datos existe', fs.existsSync(DATA_FILE))
  const disco = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))

  console.log('\n── LO QUE SE ESCRIBE EN DISCO ──')
  check('el snapshot guarda sesiones', disco.sessions && Object.keys(disco.sessions).length >= 1,
    Object.keys(disco.sessions || {}).join(','))
  const tokenCookie = galleta.replace('cm_token=', '')
  check('y guarda ESTE token, no otro', !!(disco.sessions || {})[tokenCookie])
  check('la sesión guardada apunta al usuario correcto',
    ((disco.sessions || {})[tokenCookie] || {}).username === u)
  check('el snapshot guarda la batalla en curso', !!(disco.battles || {})[batallaId],
    Object.keys(disco.battles || {}).join(','))
  check('el snapshot guarda el historial de chat',
    Array.isArray(disco.chatMessages) && disco.chatMessages.some(m => m.message.includes('antes del reinicio')))
  check('NO guarda la caché de idempotencia', disco.idempotency === undefined)
  check('NO guarda las partidas de arena', disco.partidas === undefined && disco.arena === undefined)

  console.log('\n── REINICIO ──')
  await parar()
  check('el servidor se ha parado', (await req('GET', '/api/auth/mode', null, '')).status === 0)
  check('y vuelve a arrancar con los mismos datos', await arrancar())

  console.log('\n── LA SESIÓN SIGUE VALIENDO ──')
  const yo2 = await req('GET', '/api/player', null, galleta)
  check('la misma cookie sigue autenticando', yo2.status === 200, 'HTTP ' + yo2.status)
  check('y devuelve el mismo personaje', yo2.body.character && yo2.body.character.name === reg.body.character.name,
    JSON.stringify(yo2.body).slice(0, 80))

  console.log('\n── LA BATALLA A MEDIAS SIGUE AHÍ ──')
  const acc = await req('POST', '/api/combat/action', { battleId: batallaId, monsterId: 'm_spider', action: 'attack' }, galleta)
  check('se puede seguir peleando la batalla de antes del reinicio', acc.status === 200, 'HTTP ' + acc.status + ' ' + acc.raw.slice(0, 80))
  // Sin el `&& batallaId`, si las dos fueran undefined la comprobación
  // pasaría sola sin haber comprobado nada.
  check('es LA MISMA batalla, no una nueva', !!batallaId && acc.body.battleId === batallaId,
    `${batallaId} → ${acc.body.battleId}`)
  // Mismo cuidado con el dado: lo que se comprueba es que la vida SIGUE
  // donde estaba, así que basta con que no haya vuelto al tope. Exigir
  // que baje obliga a que el golpe acierte, y eso es otro 5 %.
  check('el enemigo conserva la vida que le quedaba, no vuelve a empezar',
    acc.body.enemyDied || acc.body.newMonsterHp <= hpEnemigo,
    `antes ${hpEnemigo} ahora ${acc.body.newMonsterHp} de ${acc.body.enemyMaxHp}`)
  check('y desde luego no está otra vez entero',
    acc.body.enemyDied || acc.body.newMonsterHp < acc.body.enemyMaxHp,
    `${acc.body.newMonsterHp} de ${acc.body.enemyMaxHp}`)

  console.log('\n── EL CHAT NO SE BORRA ──')
  const chat = await req('GET', '/api/chat', null, galleta)
  check('el historial sobrevive al reinicio',
    (chat.body.messages || []).some(m => String(m.message).includes('antes del reinicio')),
    (chat.body.messages || []).length + ' mensajes')

  console.log('\n── CERRAR SESIÓN SE RESPETA TAMBIÉN AL REINICIAR ──')
  await req('POST', '/api/auth/logout', {}, galleta)
  await dormir(2500)
  const disco2 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  check('el token desaparece del disco al cerrar sesión', !(disco2.sessions || {})[tokenCookie])
  await parar()
  check('el servidor vuelve a arrancar tras el logout', await arrancar())
  const yo3 = await req('GET', '/api/player', null, galleta)
  check('una sesión cerrada NO revive con el reinicio', yo3.status === 401, 'HTTP ' + yo3.status)

  console.log('\n── UNA SESIÓN CADUCADA NO SE RESTAURA ──')
  await parar()
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  d.sessions = d.sessions || {}
  d.sessions['tokenviejo'] = { username: u, createdAt: Date.now() - 9e8, expiresAt: Date.now() - 1000 }
  d.sessions['tokensinusuario'] = { createdAt: Date.now(), expiresAt: Date.now() + 9e8 }
  d.battles = d.battles || {}
  d.battles['btl_viejo'] = { id: 'btl_viejo', owner: 'x', monsterId: 'm_spider', state: 'ACTIVE', updatedAt: Date.now() - 3 * 3600 * 1000 }
  fs.writeFileSync(DATA_FILE, JSON.stringify(d))
  check('arranca con el archivo manipulado', await arrancar())
  const viejo = await req('GET', '/api/player', null, 'cm_token=tokenviejo')
  check('un token caducado en disco no autentica', viejo.status === 401, 'HTTP ' + viejo.status)
  const roto = await req('GET', '/api/player', null, 'cm_token=tokensinusuario')
  check('una sesión sin usuario tampoco', roto.status === 401, 'HTTP ' + roto.status)

  // Y que el servidor siga vivo después de todo esto.
  const modo = await req('GET', '/api/auth/mode', null, '')
  check('el servidor sigue sano tras restaurar basura', modo.status === 200, String(modo.status))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  await parar()
  try { fs.rmSync(BASE, { recursive: true, force: true }) } catch {}
  process.exit(failed ? 1 : 0)
}

process.on('exit', () => { try { hijo && hijo.kill() } catch {} })
run().catch(e => { console.error(e); try { hijo && hijo.kill() } catch {}; process.exit(1) })
