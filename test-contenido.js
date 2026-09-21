/**
 * CriptoMundo v27 — pruebas del contenido nuevo
 * Uso: PORT=3560 node test-contenido.js --spawn
 *
 * Lo que importa aquí no es que los objetos existan, sino que HAGAN
 * algo: que la poción de fuerza suba el daño de verdad, que caduque,
 * que cada pieza de armadura sume donde dice y que todos los cultivos
 * acaben en una receta que se pueda completar.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data)
    r.end()
  })
}
const inv = async () => (await req('GET', '/api/inventory')).body
const buscar = async id => ((await inv()).inventory || []).find(i => i.itemId === id)

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  await req('POST', '/api/auth/register', { username: `Cont${rand}`, email: `c${rand}@t.com`, password: 'clave-segura-1' })

  console.log('\n── CATÁLOGO ──')
  let r = await req('GET', '/api/crafting')
  const recetas = r.body.recipes || []
  check('hay recetas de sobra', recetas.length >= 25, `${recetas.length}`)
  const cat = {}
  recetas.forEach(x => { cat[x.category] = (cat[x.category] || 0) + 1 })
  check('las tres estaciones tienen recetas', cat.forge >= 10 && cat.alch >= 5 && cat.cook >= 4, JSON.stringify(cat))

  const armas = recetas.filter(x => (x.outputItem || {}).type === 'WEAPON')
  const armaduras = recetas.filter(x => (x.outputItem || {}).type === 'ARMOR')
  check('hay varias armas fabricables', armas.length >= 6, `${armas.length}`)
  check('hay armaduras para varias ranuras', new Set(armaduras.map(x => x.outputItem.slot)).size >= 4)

  r = await req('GET', '/api/farm')
  check('hay al menos 6 cultivos', (r.body.semillas || []).length >= 6, `${(r.body.semillas || []).length}`)

  console.log('\n── TODO LO QUE SE CULTIVA SIRVE PARA ALGO ──')
  // Un cultivo sin receta es trabajo del jugador tirado a la basura
  const cosechas = ['wheat', 'herb', 'corn', 'pumpkin', 'chili', 'crystal']
  const sinUso = cosechas.filter(c => !recetas.some(x => x.ingredients.some(i => i.itemId === c)))
  check('ningún cultivo se queda sin receta', sinUso.length === 0, sinUso.join(', '))

  const materiales = ['honey', 'leather', 'water', 'iron_ore', 'wood']
  const huerfanos = materiales.filter(m => !recetas.some(x => x.ingredients.some(i => i.itemId === m)))
  check('ningún material recolectable sobra', huerfanos.length === 0, huerfanos.join(', '))

  console.log('\n── SE PUEDEN CONSEGUIR LOS INGREDIENTES ──')
  r = await req('POST', '/api/world/explore', { zoneId: 'bosque' })
  const nodos = (await req('GET', '/api/gather?zona=forest')).body.nodos || []
  check('el bosque tiene sitios de recolección', nodos.length >= 4, `${nodos.length}`)
  const suelta = new Set()
  for (const n of nodos) for (const s of n.sueltan || []) suelta.add(s[0])
  check('hay una fuente fiable de cuero', suelta.has('leather'))
  check('hay una fuente fiable de miel', suelta.has('honey'))

  await req('POST', '/api/gather', { nodoId: 'cazadero' })
  check('el coto de caza da cuero', (await buscar('leather')) !== undefined)

  console.log('\n── LAS POCIONES HACEN EFECTO ──')
  // Nivel 3 para las pociones con efecto
  let nivel = 1
  for (let i = 0; i < 80 && nivel < 3; i++) {
    const c = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (c.body.newLevel) nivel = c.body.newLevel
    if (c.body.playerDied) await req('POST', '/api/player/respawn', {})
    await sleep(370)
  }
  check('se llega a nivel 3', nivel >= 3, `nivel ${nivel}`)

  await req('POST', '/api/gather', { nodoId: 'rio' })
  await req('POST', '/api/gather', { nodoId: 'colmena' })

  // La receta tiene un 95% de éxito y los materiales se gastan aunque
  // falle. Fabricando UNA vez, una de cada veinte ejecuciones se
  // quedaba sin poción, y la línea siguiente reventaba con un
  // TypeError buscando el uid de algo que no existía. Lo que esta
  // sección quiere comprobar es que la poción HACE EFECTO, no que el
  // alquimista no falle nunca.
  //
  // Se reparten ingredientes de sobra y se insiste hasta tenerla: con
  // ocho intentos la probabilidad de quedarse sin ella es de 4 entre
  // cien mil millones. El crafteo real se sigue ejercitando igual.
  for (const ing of ['honey', 'water', 'herb']) {
    await req('POST', '/api/dev/dar', { itemId: ing, quantity: 20 })
  }
  let intentos = 0
  do {
    r = await req('POST', '/api/crafting', { recipeId: 'rec_spd', quantity: 1 })
    intentos++
  } while (r.status === 200 && r.body.made === 0 && intentos < 8)
  check('se fabrica la Poción de Velocidad', r.status === 200 && r.body.made > 0,
    intentos + ' intento(s) · ' + JSON.stringify(r.body).slice(0, 70))

  const agiAntes = (await inv()).stats.agility
  const pocion = await buscar('potion_spd')
  r = await req('POST', '/api/player/use', { uid: pocion.uid })
  check('beberla devuelve el efecto aplicado', r.status === 200 && !!r.body.efecto, JSON.stringify(r.body).slice(0, 90))
  check('la agilidad sube de verdad', r.body.stats.agility === agiAntes + r.body.efecto.valor,
    `${agiAntes} → ${r.body.stats.agility}`)
  check('el efecto aparece como activo con su duración', (r.body.efectos || []).some(e => e.stat === 'agility' && e.restanteMs > 0))

  const per = (await req('GET', '/api/player')).body.character
  check('el personaje expone sus efectos', (per.efectos || []).length >= 1)

  // Tomar otra del mismo tipo renueva, no acumula sin fin
  const pocion2 = await buscar('potion_spd')
  if (pocion2) {
    r = await req('POST', '/api/player/use', { uid: pocion2.uid })
    check('dos pociones iguales no acumulan el bono', r.body.stats.agility === agiAntes + r.body.efecto.valor,
      `${r.body.stats.agility}`)
  }

  console.log('\n── LA ARMADURA SUMA DONDE DICE ──')
  await req('POST', '/api/gather', { nodoId: 'lena' })
  r = await req('POST', '/api/crafting', { recipeId: 'rec_lhelm', quantity: 1 })
  check('se fabrica una pieza de armadura', r.status === 200 && r.body.made > 0)
  const casco = await buscar('leather_helm')
  const antes = (await inv()).stats
  r = await req('POST', '/api/player/equip', { uid: casco.uid })
  check('el casco sube defensa y agilidad como declara',
    r.body.stats.defense === antes.defense + casco.stats.def && r.body.stats.agility === antes.agility + casco.stats.agi,
    `def ${antes.defense}→${r.body.stats.defense}`)
  check('ocupa la ranura de casco', r.body.equipment.helmet === casco.uid)

  console.log('\n── LAS ARMAS NUEVAS SE USAN EN LA ARENA ──')
  r = await req('GET', '/api/arena')
  check('la arena reconoce el arma equipada', !!r.body.arma)
  await req('POST', '/api/crafting', { recipeId: 'rec_club', quantity: 1 })
  const garrote = await buscar('wood_club')
  if (garrote) {
    await req('POST', '/api/player/equip', { uid: garrote.uid })
    r = await req('GET', '/api/arena')
    check('cambiar de arma cambia lo que ve la arena', r.body.arma === 'Garrote de Roble', r.body.arma)
  }

  console.log('\n── COMIDA CON EFECTO ──')
  const conBuff = recetas.filter(x => (x.outputItem || {}).buff)
  check('hay comida que además da un efecto', conBuff.length >= 3, `${conBuff.length}`)
  check('la comida cura menos que una poción mayor',
    (conBuff[0].outputItem.heal || 0) < 600)

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-contenido.json', BACKUP_DIR: '/tmp/cm-cont-b' }, stdio: 'ignore' })
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
