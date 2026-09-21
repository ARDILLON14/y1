/**
 * CriptoMundo v20 — pruebas de los arreglos y sistemas nuevos
 * Uso: PORT=3405 node test-arreglos-v20.js --spawn
 *
 * Cubre exactamente lo que estaba roto en la partida reportada:
 * zonas inaccesibles, agua imposible de conseguir, objetos que no se
 * podían equipar, misiones que no se aceptaban desde el NPC, contador
 * de bajas parado, skins rotas y compra de lo propio en el mercado.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, p, body, headers = {}) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = Object.assign({ 'Content-Type': 'application/json' }, headers)
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
const cuantos = async it => {
  const inv = (await req('GET', '/api/inventory')).body.inventory || []
  return inv.filter(i => i.itemId === it).reduce((a, i) => a + i.quantity, 0)
}

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  await req('POST', '/api/auth/register', { username: `Fix${rand}`, email: `f${rand}@t.com`, password: 'clave-segura-1' })

  console.log('\n── 1. ZONAS (bosque y minas eran inaccesibles) ──')
  for (const [zona, nombre] of [['bosque', 'Bosque del Este'], ['minas', 'Minas Profundas'], ['ruinas', 'Ruinas Malditas']]) {
    const r = await req('POST', '/api/world/explore', { zoneId: zona })
    check(`se puede viajar a ${zona}`, r.status === 200 && r.body.zone.name === nombre, JSON.stringify(r.body).slice(0, 70))
  }
  let r = await req('POST', '/api/world/explore', { zoneId: 'minas' })
  check('avisa del peligro en vez de bloquear', !!r.body.aviso)
  r = await req('POST', '/api/world/explore', { zoneId: 'narnia' })
  check('una zona inventada sigue rechazada', r.status === 404)

  console.log('\n── 2. AGUA Y RECURSOS (no había forma de conseguirlos) ──')
  const agua0 = await cuantos('water')
  r = await req('POST', '/api/gather', { nodoId: 'pozo' })
  check('el pozo da agua', r.status === 200 && r.body.obtenido.some(o => o.itemId === 'water'))
  check('el agua entra de verdad al inventario', (await cuantos('water')) > agua0)
  r = await req('POST', '/api/gather', { nodoId: 'pozo' })
  check('el nodo respeta su enfriamiento', r.status === 429)
  r = await req('POST', '/api/gather', { nodoId: 'inventado' })
  check('un nodo inexistente se rechaza', r.status === 404)

  console.log('\n── 3. HUERTO ──')
  r = await req('GET', '/api/farm')
  check('hay parcelas', (r.body.parcelas || []).length >= 4)
  check('el jugador empieza con semillas', r.body.semillas.some(s => s.tengo > 0))
  r = await req('POST', '/api/farm/plant', { parcela: 0, semilla: 'semilla_trigo' })
  check('se puede sembrar', r.status === 200)
  r = await req('POST', '/api/farm/harvest', { parcela: 0 })
  check('no se cosecha antes de tiempo', r.status === 400)
  r = await req('POST', '/api/farm/plant', { parcela: 0, semilla: 'semilla_trigo' })
  check('no se siembra sobre lo sembrado', r.status === 409)
  r = await req('POST', '/api/farm/plant', { parcela: 99, semilla: 'semilla_trigo' })
  check('parcela inválida rechazada', r.status === 400)

  console.log('\n── 4. EQUIPAR (el endpoint existía pero nada lo llamaba) ──')
  await req('POST', '/api/crafting', { recipeId: 'rec_dagger', quantity: 1 })
  const inv = (await req('GET', '/api/inventory')).body
  const daga = (inv.inventory || []).find(i => i.itemId === 'dagger')
  check('el objeto fabricado llega al inventario', !!daga)
  check('el inventario dice para qué sirve cada objeto', !!daga.slot && daga.equipable === true && !!daga.stats)
  const fuerza0 = inv.stats.strength
  r = await req('POST', '/api/player/equip', { uid: daga.uid })
  check('equipar sube las estadísticas de verdad', r.body.stats.strength === fuerza0 + daga.stats.str, `${fuerza0} → ${r.body.stats.strength}`)
  const personaje = (await req('GET', '/api/player')).body.character
  check('el personaje refleja el equipo', personaje.strength === fuerza0 + daga.stats.str)
  r = await req('POST', '/api/player/equip', { slot: 'weapon', unequip: true })
  check('quitar el equipo revierte las estadísticas', r.body.stats.strength === fuerza0)

  console.log('\n── 5. CONSUMIBLES FUERA DE COMBATE ──')
  const pocion = (await req('GET', '/api/inventory')).body.inventory.find(i => i.itemId === 'potion_hp')
  r = await req('POST', '/api/player/use', { uid: pocion.uid })
  check('con la vida llena no se malgasta la poción', r.status === 400)
  let vivo = true
  for (let i = 0; i < 12 && vivo; i++) {
    const c = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (c.status === 200 && c.body.enemyDied) vivo = false
    else await sleep(380)
  }
  const antes = await cuantos('potion_hp')
  r = await req('POST', '/api/player/use', { uid: pocion.uid })
  check('herido, la poción cura', r.status === 200 && r.body.curado > 0, JSON.stringify(r.body).slice(0, 60))
  check('la poción se consume', (await cuantos('potion_hp')) === antes - 1)
  r = await req('POST', '/api/player/use', { itemId: 'iron_ore' })
  check('un material no se puede "usar"', r.status === 400)

  console.log('\n── 6. CONTADOR DE BAJAS Y PERFIL ──')
  const perfil = (await req('GET', '/api/profile')).body
  check('el perfil cuenta las bajas reales', perfil.contadores.bajas >= 1, `${perfil.contadores.bajas}`)
  check('cuenta los objetos fabricados', perfil.contadores.objetosFabricados >= 1)
  check('cuenta los recursos recolectados', perfil.contadores.recursosRecolectados >= 1)
  check('las medallas salen de los contadores', perfil.medallas.find(m => m.id === 'primera_sangre').conseguida === true)
  check('las medallas no conseguidas muestran progreso', perfil.medallas.find(m => m.id === 'cazador').meta === 50)
  check('el perfil trae clase, nivel y estadísticas', !!perfil.clase && perfil.nivel >= 1 && perfil.estadisticas.fuerza > 0)

  console.log('\n── 7. MISIONES DESDE EL NPC ──')
  r = await req('GET', '/api/npcs')
  check('los NPC del servidor tienen identificador', (r.body.npcs || []).every(n => !!n.id))
  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  check('se acepta la misión que ofrece el NPC', r.status === 200)
  r = await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  check('no se puede aceptar dos veces', r.status === 409)
  const activas = (await req('GET', '/api/quests?status=active')).body.quests || []
  check('queda registrada como activa con sus objetivos', activas.some(a => a.questId === 'q_herbs' && a.objectiveProgress.length))

  console.log('\n── 8. MERCADO: NO COMPRAR LO PROPIO ──')
  const pub = (await req('POST', '/api/market', { itemId: 'herb', quantity: 2, pricePerUnit: 30 })).body.listing
  r = await req('POST', `/api/market/${pub.id}/buy`, { quantity: 1 })
  check('el servidor impide comprar tu propia publicación', r.status === 400)
  r = await req('POST', `/api/market/${pub.id}/buy`, { quantity: 1, pricePerUnit: 1, sellerId: 'otro' })
  check('no se puede engañar mandando otro sellerId', r.status === 400)
  const listado = ((await req('GET', '/api/market')).body.listings || []).find(l => l.id === pub.id)
  check('la publicación sigue visible para los demás', !!listado)

  console.log('\n── 9. SKINS ──')
  const skins = (await req('GET', '/api/skins')).body.skins || []
  check('ninguna skin del catálogo está marcada como rota', skins.every(s => !s.rota))
  check('las ilustraciones con fondo opaco no se usan en el mapa',
    skins.filter(s => ['holy_pepe', 'stone_pepe'].includes(s.id)).every(s => s.usableEnMapa === false))
  check('las skins válidas sí se pueden usar en el mapa', skins.find(s => s.id === 'laurel_possum').usableEnMapa === true)
  r = await req('POST', '/api/character/appearance', { skinId: 'holy_pepe' })
  check('se puede elegir igualmente como retrato', r.status === 200)

  console.log('\n── 10. INTERFAZ CONECTADA ──')
  const perfilHtml = await new Promise(res => http.get(`http://localhost:${PORT}/criptomundo-perfil.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el perfil tiene panel de inventario y equipo', /inv-rejilla/.test(perfilHtml) && /api\/player\/equip/.test(perfilHtml))
  check('el perfil permite usar consumibles', /api\/player\/use/.test(perfilHtml))
  const mapa = await new Promise(res => http.get(`http://localhost:${PORT}/criptomundo-mundo2d.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el mapa deja aceptar misiones del NPC', /aceptarMisionNpc/.test(mapa))
  check('el mapa lee las bajas del servidor', /monstersKilled/.test(mapa))

  console.log('\n── 11. HUERTO Y ARENA EN LA INTERFAZ ──')
  for (const [pagina, marca] of [['criptomundo-huerto.html', /api\/farm/], ['criptomundo-arena.html', /api\/arena/]]) {
    const html = await new Promise(res => http.get(`http://localhost:${PORT}/${pagina}`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
    check(`${pagina} está conectada al servidor`, marca.test(html))
  }
  const hub = await new Promise(res => http.get(`http://localhost:${PORT}/`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el menú lleva a la arena y al huerto', /loadModule\('arena'\)/.test(hub) && /loadModule\('huerto'\)/.test(hub))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-v20.json', BACKUP_DIR: '/tmp/cm-v20-b' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
