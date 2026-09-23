/**
 * CriptoMundo — el juego enseña las dos cosas que deciden si pierdes
 * Uso:  PORT=3893 node test-ensenar-combate.js --spawn
 *
 * POR QUÉ EXISTE
 * El banco de balance del propio proyecto dice algo incómodo: un jugador
 * que bloquea el golpe anunciado y se cura por debajo de un tercio de
 * vida gana el 100 % de las peleas del juego, jefes incluidos, con entre
 * el 43 % y el 94 % de vida de sobra. Y las mediciones del arranque
 * dicen que un nivel 1 que no hace esas dos cosas muere cuatro veces
 * antes de llegar al nivel 3.
 *
 * O sea que la dificultad de CriptoMundo no estaba en sus números: estaba
 * en dos mecánicas que nadie te contaba. El tutorial tenía once pasos y
 * no mencionaba ninguna de las dos.
 *
 * Esta prueba comprueba que ahora sí se cuentan, y que contarlas no ha
 * cambiado ni un número del combate.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3893)
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', c => o += c)
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}
const pasos = async () => (await req('GET', '/api/onboarding')).body

async function run() {
  const u = 'ens' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── EL TUTORIAL LAS MENCIONA ──')
  const lista = (await pasos()).pasos || []
  check('el tutorial tiene pasos', lista.length > 0, String(lista.length))
  const bloquear = lista.find(x => x.id === 'p_bloquear')
  const pocion = lista.find(x => x.id === 'p_pocion')
  check('enseña a bloquear el golpe anunciado', !!bloquear, lista.map(x => x.id).join(','))
  check('y a beber en mitad del combate', !!pocion, lista.map(x => x.id).join(','))
  check('la pista de bloquear dice qué se gana',
    !!bloquear && /tercio|bloquea/i.test(bloquear.pista), (bloquear || {}).pista)
  check('la de beber aclara que no cuesta el turno',
    !!pocion && /sin perder el turno|no.*turno/i.test(pocion.pista), (pocion || {}).pista)
  // Y que vayan pronto: de nada sirve enseñarlo en el paso once.
  const iBloq = lista.findIndex(x => x.id === 'p_bloquear')
  const iCombate = lista.findIndex(x => x.id === 'p_combate')
  check('van justo después del primer combate, no al final',
    iBloq === iCombate + 1 && iBloq < 4, `combate en ${iCombate}, bloquear en ${iBloq}`)

  console.log('\n── Y SE MARCAN AL HACERLAS DE VERDAD ──')
  // Contra un troll, que anuncia golpes: se bloquea hasta que uno entre.
  let bloqueado = false
  for (let i = 0; i < 25 && !bloqueado; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_troll', action: 'block' })
    if (r.status !== 200) { await dormir(380); continue }
    if (r.bloqueoPesado || r.body.bloqueoPesado) bloqueado = true
    const hechos = ((await pasos()).pasos || []).find(x => x.id === 'p_bloquear')
    if (hechos && hechos.hecho) bloqueado = true
    if (r.body.playerDied) await req('POST', '/api/player/respawn', {})
    await dormir(380)
  }
  const trasBloquear = ((await pasos()).pasos || []).find(x => x.id === 'p_bloquear') || {}
  check('bloquear un golpe anunciado marca el paso', !!trasBloquear.hecho,
    JSON.stringify(trasBloquear).slice(0, 120))

  await req('POST', '/api/dev/dar', { itemId: 'potion_hp', quantity: 3 })
  const bebida = await req('POST', '/api/combat/action', { monsterId: 'm_troll', action: 'objeto', itemId: 'potion_hp' })
  check('se puede beber en combate', bebida.status === 200, bebida.raw.slice(0, 90))
  const trasBeber = ((await pasos()).pasos || []).find(x => x.id === 'p_pocion') || {}
  check('beber en combate marca el paso', !!trasBeber.hecho, JSON.stringify(trasBeber).slice(0, 120))

  console.log('\n── LA PANTALLA AVISA EN EL MOMENTO ──')
  const pag = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-combat-2.js'), 'utf8')
  check('sigue avisando del golpe anunciado', /function showTelegraph/.test(pag) && /Bloquea/.test(pag))
  check('y ahora también de que queda poca vida', /function avisarVidaBaja/.test(pag) && /bebe/i.test(pag))
  check('el golpe anunciado manda sobre el aviso de vida',
    /if \(!el \|\| STATE\.telegraph\) return;/.test(pag))

  console.log('\n── SIN TOCAR UN SOLO NÚMERO DEL COMBATE ──')
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  const troll = mons.find(m => m.id === 'm_troll')
  const arana = mons.find(m => m.id === 'm_spider')
  check('el troll sigue igual', troll && troll.hp === 420 && troll.level === 5,
    JSON.stringify(troll && { hp: troll.hp, nivel: troll.level }))
  check('la araña sigue igual', arana && arana.hp === 285 && arana.level === 3,
    JSON.stringify(arana && { hp: arana.hp, nivel: arana.level }))
  const cod = fs.readFileSync(path.join(__dirname, 'src', 'server', '30-personajes-combate.js'), 'utf8')
  check('bloquear sigue encajando el 30 % del golpe', /dmg = Math\.floor\(dmg \* 0\.3\)/.test(cod))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-ensenar.json', '/tmp/cm-ensenar-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-ensenar.json', BACKUP_DIR: '/tmp/cm-ensenar-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = http.get({ host: 'localhost', port: puerto, path: '/api/health' }, res => { res.resume(); resolve(true) })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}
function limpiarDatos() {
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
