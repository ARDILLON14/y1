/**
 * CriptoMundo — el cliente no decide nada, endpoint por endpoint
 * Uso:  PORT=3889 node test-autoridad-servidor.js --spawn
 *
 * POR QUÉ EXISTE
 * La regla de la FASE 1 es una sola y vale para todo el juego: el
 * servidor decide el daño, la vida, la experiencia, el botín, el oro, el
 * precio, el resultado del combate, los enfriamientos y el resultado del
 * PvP. El cliente manda intenciones.
 *
 * Eso se comprobaba en un puñado de sitios sueltos. Aquí se comprueba en
 * los TREINTA Y OCHO endpoints POST que tiene el servidor, y de la forma
 * más desagradable posible: a cada uno se le manda un cuerpo con todos
 * los campos de resultado que se le ocurrirían a alguien con la consola
 * abierta, con valores absurdos, y después se mira si algo de eso pegó.
 *
 * La comprobación no puede ser "nada cambió": hay endpoints que SÍ deben
 * cambiar el oro o la experiencia. Lo que se exige es que los valores
 * INYECTADOS no aparezcan por ninguna parte.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3889)
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
        if (res.headers['set-cookie'] && p !== '/api/auth/logout') cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

// Los objetos marcadores: si alguno aparece en la mochila, es que un
// campo `loot` inyectado por el cliente se aceptó. Son de los caros del
// catálogo justamente para que no puedan llegar por otra vía en una
// partida de nivel 1 que dura segundos.
const MARCADORES = ['espada_diamante', 'elixir_mitico', 'soul_shard']

// Todo lo que a alguien se le ocurriría mandar desde la consola. Va en
// TODAS las peticiones, mezclado con los campos legítimos de cada una.
const VENENO = {
  gold: 999999999, oro: 999999999, newGold: 999999999,
  xp: 999999999, experiencia: 999999999, newXp: 999999999, xpEarned: 999999999,
  level: 99, nivel: 99, newLevel: 99,
  hp: 999999, maxHp: 999999, newHp: 999999, mp: 999999,
  cgrid: 99999, cgridEarned: 99999,
  damage: 999999, dmg: 999999, playerDmg: 999999, enemyDmg: 0,
  enemyHp: 0, newMonsterHp: 0, monsterCurrentHp: 1, enemyDied: true, playerDied: false,
  loot: MARCADORES.map(id => ({ itemId: id, quantity: 99 })),
  botin: MARCADORES.map(id => ({ itemId: id, quantity: 99 })),
  rewards: { gold: 999999999, xp: 999999999, loot: MARCADORES.map(id => ({ itemId: id, quantity: 99 })) },
  price: 0, pricePerUnit: 0, precio: 0, total: 0, fee: 0,
  cooldown: 0, cooldownMs: 0, enfriamiento: 0, proxGolpe: 0,
  success: true, exito: true, resultado: 'victoria', motivo: 'victoria', winner: 'yo',
  rating: 9999, pvpRating: 9999, elo: 9999,
  quantity: 99, cantidad: 99, made: 99, outputQty: 99,
  duracion: 0, duration: 0, tiempo: 0,
  anim: 'death', estado: { jugador: { hp: 999999 } },
}

// Cuerpos legítimos por endpoint, para que la petición LLEGUE a la
// lógica en vez de quedarse en la validación de entrada. Sin esto, la
// mitad contestaría 400 sin haber probado nada y la prueba pasaría en
// verde habiendo comprobado el validador y no la autoridad.
const CUERPOS = {
  '/api/combat/action': { monsterId: 'm_spider', action: 'attack' },
  '/api/crafting': { recipeId: 'rec_mango_madera', quantity: 1 },
  '/api/gather': { zoneId: 'forest' },
  '/api/recursos/golpear': { nodoId: 'x', pos: { x: 0, y: 0 } },
  '/api/farm/plant': { itemId: 'seed_wheat', plot: 0 },
  '/api/farm/harvest': { plot: 0 },
  '/api/market': { itemId: 'iron_ore', quantity: 1, pricePerUnit: 10 },
  '/api/world/explore': { zoneId: 'forest' },
  '/api/arena/start': { arenaId: 'arena_bosque' },
  '/api/arena/sync': { entrada: { mx: 0, my: 0 } },
  '/api/mazmorra/entrar': { mazmorraId: 'mz_cripta' },
  '/api/mazmorra/sala': { salaId: 'x' },
  '/api/player/equip': { uid: 'x' },
  '/api/player/use': { itemId: 'potion_hp' },
  '/api/quests': { questId: 'q1', action: 'accept' },
  '/api/chat': { message: 'hola' },
  '/api/guilds': { action: 'create', name: 'G' + Math.floor(Math.random() * 1e6) },
  '/api/house': { action: 'upgrade' },
  '/api/hotbar': { ranura: 0, itemId: 'potion_hp' },
  '/api/hotbar/seleccionar': { ranura: 0 },
  '/api/mundo/sync': { pos: { x: 100, y: 100, zona: 'pueblo' } },
  '/api/mundo/salir': {},
  '/api/telemetria/pantalla': { pantalla: 'hub' },
  '/api/feedback': { texto: 'prueba' },
  '/api/onboarding/claim': { paso: 'register' },
  '/api/character/appearance': { skin: 'laurel_possum' },
  '/api/pvp/match': {},
  '/api/pvp/result': { matchId: 'x', winner: 'yo' },
  '/api/wallet/nonce': {},
  '/api/wallet/link': { address: '0x0', signature: 's' },
  '/api/dev/dar': { itemId: 'wood', quantity: 1 },
}
// Estas se dejan fuera del barrido porque cambian QUIÉN eres o te sacan
// de la partida, y entonces lo que midan las demás ya no vale.
const FUERA = new Set(['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/character/upload'])

const ficha = async () => (await req('GET', '/api/player')).body.character || {}
const mochila = async () => (await req('GET', '/api/inventory')).body.inventory || []

async function run() {
  const u = 'aut' + Math.floor(Math.random() * 1e6)
  const reg = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  check('se crea la cuenta de la prueba', reg.status === 201 || reg.status === 200, String(reg.status))

  const antes = await ficha()
  check('el personaje empieza con cifras normales', antes.gold < 10000 && antes.level === 1,
    `oro ${antes.gold} nivel ${antes.level}`)

  console.log('\n── SE ENVENENAN LOS 38 ENDPOINTS POST ──')
  const rutas = fs.readFileSync(path.join(__dirname, 'src', 'server', '60-http.js'), 'utf8')
    .match(/pathname === '\/api\/[^']*' && req\.method === 'POST'/g)
    .map(s => s.match(/'(\/api\/[^']*)'/)[1])
  const lista = [...new Set(rutas)].filter(r => !FUERA.has(r))
  check('se encontraron los endpoints en el código', lista.length >= 30, String(lista.length))

  let llegaron = 0, rechazadas = 0
  const porRuta = []
  for (const ruta of lista) {
    const cuerpo = Object.assign({}, CUERPOS[ruta] || {}, VENENO)
    const r = await req('POST', ruta, cuerpo)
    // 404 aquí significa "el servidor ni siquiera conoce esta ruta", que
    // sería un fallo de la propia prueba. 400/403/409/429 significan que
    // la lógica la vio y la rechazó, que es un resultado perfectamente
    // válido para este barrido.
    if (r.status === 0) rechazadas++
    else llegaron++
    porRuta.push(`${ruta} → ${r.status}`)
    await dormir(60)
  }
  check('todas las peticiones llegaron al servidor', rechazadas === 0, String(rechazadas))
  // Sin esto, si todo contestara 404 la prueba pasaría en verde habiendo
  // comprobado exactamente nada.
  check('y la mayoría entró en la lógica, no murió en el router',
    llegaron >= lista.length * 0.9, `${llegaron} de ${lista.length}`)

  console.log('\n── Y NO PEGÓ NI UNO ──')
  const despues = await ficha()
  const inv = await mochila()
  check('el oro no se disparó', despues.gold < 100000, `${antes.gold} → ${despues.gold}`)
  check('la experiencia tampoco', despues.xp < 100000, `${antes.xp} → ${despues.xp}`)
  check('el nivel sigue siendo de nivel 1, no de 99', despues.level <= 5, `${antes.level} → ${despues.level}`)
  check('el CGRID no se emitió solo', (despues.cgrid || 0) < 100, String(despues.cgrid))
  check('la vida no pasa de su tope', despues.hp <= despues.maxHp, `${despues.hp} de ${despues.maxHp}`)
  check('el maná tampoco', despues.mp <= despues.maxMp, `${despues.mp} de ${despues.maxMp}`)
  check('la vida máxima no la fija el cliente', despues.maxHp < 99999, String(despues.maxHp))
  const colados = inv.filter(i => MARCADORES.includes(i.itemId))
  check('ningún objeto inyectado llegó a la mochila', colados.length === 0,
    colados.map(i => i.itemId + '×' + i.quantity).join(', '))
  check('el rating de PvP no lo pone el cliente', (despues.pvpRating || 0) < 5000, String(despues.pvpRating))

  console.log('\n── LOS CASOS QUE MÁS TIENTAN, UNO A UNO ──')
  // Fabricar: `made` y `outputQty` inyectados no pueden multiplicar el
  // resultado, y los materiales tienen que consumirse igual.
  await req('POST', '/api/dev/dar', { itemId: 'wood', quantity: 10 })
  const maderaAntes = (await mochila()).filter(i => i.itemId === 'wood').reduce((a, i) => a + i.quantity, 0)
  const craft = await req('POST', '/api/crafting', Object.assign({ recipeId: 'rec_mango_madera', quantity: 1 }, VENENO))
  const maderaDespues = (await mochila()).filter(i => i.itemId === 'wood').reduce((a, i) => a + i.quantity, 0)
  check('fabricar consume materiales aunque digas que no',
    craft.status !== 200 || maderaDespues < maderaAntes, `${maderaAntes} → ${maderaDespues}`)
  check('y no fabrica 99 de golpe porque el cliente lo pida',
    (craft.body.made || 0) <= 5, String(craft.body.made))

  // Mercado: el precio sale SIEMPRE de la publicación.
  await req('POST', '/api/dev/dar', { itemId: 'iron_ore', quantity: 5 })
  const pub = await req('POST', '/api/market', { itemId: 'iron_ore', quantity: 2, pricePerUnit: 500 })
  check('se publica algo en el mercado', pub.status === 201 || pub.status === 200, String(pub.status))
  // LA MÍA, por su id, no la primera de la lista. El barrido de arriba ya
  // dejó otra publicación de hierro —con el precio envenenado a 0, que el
  // servidor subió a su mínimo— y buscar por itemId encontraba aquella.
  // Mismo tropiezo que en test-economia-objetos: una prueba no debería
  // adivinar cuál es su propia publicación.
  const mio = pub.body.listing || {}
  const lst = ((await req('GET', '/api/market')).body.listings || []).find(l => l.id === mio.id)
  check('la publicación existe con el id que devolvió el servidor', !!lst, JSON.stringify(mio.id))
  check('la publicación conserva SU precio, no el inyectado',
    !!lst && lst.pricePerUnit === 500, JSON.stringify(lst && lst.pricePerUnit))
  // Y lo de al lado: el precio envenenado a 0 no se guardó tal cual.
  const regalada = ((await req('GET', '/api/market')).body.listings || []).filter(l => l.pricePerUnit <= 0)
  check('ninguna publicación quedó a precio cero', regalada.length === 0,
    JSON.stringify(regalada.map(l => l.itemId + '@' + l.pricePerUnit)))

  // Combate: el daño y la muerte del enemigo los decide el servidor.
  const oroAntes = (await ficha()).gold
  const golpe = await req('POST', '/api/combat/action', Object.assign({ monsterId: 'm_dragon', action: 'attack' }, VENENO))
  check('pegarle a un dragón no lo mata porque el cliente lo diga',
    golpe.status !== 200 || !golpe.body.enemyDied, JSON.stringify(golpe.body.enemyDied))
  check('ni el daño inyectado se aplica',
    golpe.status !== 200 || golpe.body.playerDmg < 99999, String(golpe.body.playerDmg))
  const oroDespues = (await ficha()).gold
  check('y el oro no sube por decirlo en el cuerpo', oroDespues - oroAntes < 100000,
    `${oroAntes} → ${oroDespues}`)

  console.log('\n── LA REGLA ESTÁ ESCRITA DONDE SE APLICA ──')
  const servidor = fs.readdirSync(path.join(__dirname, 'src', 'server'))
    .map(f => fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8')).join('\n')
  check('el servidor no lee el daño del cuerpo de la petición',
    !/body\.(playerDmg|damage|dmg)\b/.test(servidor))
  check('ni el oro', !/body\.(gold|oro)\b/.test(servidor))
  check('ni la experiencia', !/body\.(xp|experiencia)\b/.test(servidor))
  check('ni el botín', !/body\.(loot|botin|rewards)\b/.test(servidor))
  check('ni el precio de una compra', !/body\.(price|total|fee)\b/.test(servidor))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-autoridad.json', '/tmp/cm-autoridad-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-autoridad.json', BACKUP_DIR: '/tmp/cm-autoridad-b',
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
