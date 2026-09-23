/**
 * CriptoMundo — la primera misión, contra el primer enemigo
 * Uso:  PORT=3892 node test-primera-mision.js --spawn
 *
 * POR QUÉ EXISTE
 * Salió jugando una partida entera de principio a fin: la araña es el
 * primer enemigo de TODOS —es lo que se encuentra un personaje nuevo
 * nada más salir al bosque— y no tenía ninguna misión detrás. Se matan
 * seis para llegar a nivel 3 y no contaban para nada. La primera misión
 * que veía un jugador nuevo era matar ocho trolls, que a ese nivel lo
 * revientan.
 *
 * Esta prueba no mira el catálogo: crea un personaje de nivel 1, mira
 * qué se le ofrece, acepta la misión, mata arañas de verdad y cobra.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3892)
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
const ficha = async () => (await req('GET', '/api/player')).body.character || {}
const cuantos = async id => ((await req('GET', '/api/inventory')).body.inventory || [])
  .filter(i => i.itemId === id).reduce((a, i) => a + i.quantity, 0)

async function run() {
  const u = 'pm' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const yo = await ficha()
  check('el personaje empieza en el nivel 1', yo.level === 1, String(yo.level))

  console.log('\n── LO QUE SE LE OFRECE A UN RECIÉN LLEGADO ──')
  const disp = (await req('GET', '/api/quests?status=available')).body.quests || []
  check('hay misiones para un nivel 1', disp.length > 0, String(disp.length))
  // Lo que se arregla aquí: que haya una misión para el bicho contra el
  // que de verdad pelea un principiante.
  const deAranas = disp.find(q => (q.objectives || []).some(o => o.key === 'kill_spider'))
  check('hay una misión para la araña, que es el primer enemigo de todos',
    !!deAranas, disp.map(q => q.name).join(' · '))
  check('y se puede aceptar desde el nivel 1', !!deAranas && deAranas.levelReq <= 1,
    String(deAranas && deAranas.levelReq))
  // Y que sea LA PRIMERA que se ve, no la tercera de la lista.
  check('además es la primera de la lista', disp[0] && disp[0].id === (deAranas || {}).id,
    disp.map(q => q.name).join(' · '))

  console.log('\n── SE ACEPTA Y MATAR ARAÑAS LA HACE AVANZAR ──')
  const acep = await req('POST', '/api/quests', { questId: deAranas.id, action: 'accept' })
  check('se acepta', acep.status === 200, acep.raw.slice(0, 90))
  const pedidas = deAranas.objectives[0].required
  check('pide un número de arañas que cuadra con el arranque', pedidas >= 3 && pedidas <= 6,
    String(pedidas) + ' arañas')

  // Se pelea con pociones en vez de esperando a regenerar: lo que se
  // mide aquí es la misión, no el desgaste, y esperar de verdad hacía que
  // la prueba tardara más de cinco minutos.
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 20 })
  let muertas = 0, avisos = 0, turnos = 0, completada = false
  for (let i = 0; i < 90 && !completada; i++) {
    const salud = await ficha()
    if (salud.hp < salud.maxHp * 0.4) { await req('POST', '/api/player/use', { itemId: 'potion_hp_v' }) }
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (r.status !== 200) { await dormir(380); continue }
    turnos++
    if (r.body.enemyDied) muertas++
    if ((r.body.questUpdates || []).length) avisos++
    if (r.body.playerDied) await req('POST', '/api/player/respawn', {})
    // La misión se consulta cada pocas bajas, no en cada turno: preguntar
    // en cada uno doblaba el tiempo de la prueba sin decir nada nuevo.
    if (r.body.enemyDied && muertas >= pedidas) {
      const act = (await req('GET', '/api/quests?status=active')).body.quests || []
      if (!act.some(q => q.questId === deAranas.id)) completada = true
    }
    await dormir(370)
  }
  check('matar arañas avisa de que la misión avanza', avisos > 0, String(avisos) + ' avisos')
  check('se matan las arañas que pedía', muertas >= pedidas, `${muertas} de ${pedidas}`)

  console.log('\n── Y SE COBRA ──')
  // Las misiones NO se cierran solas: hay que entregarlas. La primera
  // versión de esto daba por buena la misión cuando los objetivos
  // estaban al día y se saltaba el cobro dentro de un `if`, o sea
  // exactamente el modo de fallo que este repositorio ya conoce: una
  // comprobación que desaparece en silencio.
  const oroAntes = (await ficha()).gold
  const pocionesAntes = await cuantos('potion_hp')
  const entrega = await req('POST', '/api/quests', { questId: deAranas.id, action: 'turnin' })
  check('la misión se puede entregar', entrega.status === 200, entrega.status + ' ' + entrega.raw.slice(0, 100))
  const hechas = (await req('GET', '/api/quests?status=completed')).body.quests || []
  check('y queda registrada como completada',
    hechas.some(q => q === deAranas.id || q.questId === deAranas.id), JSON.stringify(hechas).slice(0, 110))
  const oroDespues = (await ficha()).gold
  check('paga el oro que prometía', oroDespues > oroAntes, `${oroAntes} → ${oroDespues}`)
  // La recompensa lleva pociones a propósito: la medición del arranque
  // decía que a un nivel 1 se le acaba la forma de curarse tras 3,8
  // arañas, así que la primera misión le da justo lo que le falta.
  check('y entrega las pociones, que es lo que le falta a un novato',
    (await cuantos('potion_hp')) > pocionesAntes,
    `${pocionesAntes} → ${await cuantos('potion_hp')}`)
  const yaNo = await req('POST', '/api/quests', { questId: deAranas.id, action: 'accept' })
  check('y no se puede volver a aceptar para cobrarla dos veces', yaNo.status === 409,
    String(yaNo.status))

  console.log('\n── LO QUE NO SE HA TOCADO ──')
  const cod = fs.readFileSync(path.join(__dirname, 'src', 'server', '40-mundo-mercado.js'), 'utf8')
  for (const vieja of ['q_trolls', 'q_herbs', 'q_patrol', 'q_forge', 'q_depths']) {
    check('sigue existiendo ' + vieja, cod.includes(`id: '${vieja}'`))
  }
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  const arana = mons.find(m => m.id === 'm_spider')
  check('la araña sigue con sus mismos números',
    arana && arana.hp === 285 && arana.xpReward === 180 && arana.level === 3,
    JSON.stringify(arana && { hp: arana.hp, xp: arana.xpReward, nivel: arana.level }))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-primera.json', '/tmp/cm-primera-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-primera.json', BACKUP_DIR: '/tmp/cm-primera-b',
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
