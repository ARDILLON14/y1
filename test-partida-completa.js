/**
 * CriptoMundo — una partida entera, de registrarse a vender en el mercado
 * Uso:  PORT=3890 node test-partida-completa.js --spawn
 *
 * POR QUÉ EXISTE
 * Cada sistema tiene su prueba y todos pasan. Lo que no tenía prueba era
 * el VIAJE: registrarse, subir de nivel, recolectar, fabricar, equipar,
 * aceptar una misión y cobrarla, pelear en la arena, entrar en una
 * mazmorra, vender en el mercado y medirse en PvP, todo con el mismo
 * personaje y de una sentada.
 *
 * Los fallos de integración viven justo ahí, en las costuras entre
 * sistemas que cada prueba mira por separado: el objeto que se fabrica
 * pero no se puede equipar, la misión que cuenta bajas de un combate y
 * no del otro, el oro que se gana en un sitio y no llega al siguiente.
 *
 * Si algo se atasca, el mensaje dice EN QUÉ PASO, porque una partida que
 * se para a la mitad sin decir dónde no sirve para diagnosticar nada.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3890)
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function pedir(method, p, body, cookie) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', c => o += c)
      res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o, cookie: (res.headers['set-cookie'] || [''])[0].split(';')[0] })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '', cookie: '' }))
    if (data) r.write(data)
    r.end()
  })
}

// Un jugador. Todo lo suyo pasa por aquí, para que no se mezclen las
// sesiones de dos personajes cuando hacen falta los dos.
function jugador(cookie) {
  return {
    cookie,
    get: (p) => pedir('GET', p, null, cookie),
    post: (p, b) => pedir('POST', p, b, cookie),
    ficha: async function () { return (await pedir('GET', '/api/player', null, cookie)).body.character || {} },
    mochila: async function () { return (await pedir('GET', '/api/inventory', null, cookie)).body.inventory || [] },
    tiene: async function (id) {
      return (await pedir('GET', '/api/inventory', null, cookie)).body.inventory
        .filter(i => i.itemId === id).reduce((a, i) => a + i.quantity, 0)
    },
  }
}

async function nuevoJugador(nombre) {
  const u = nombre + Math.floor(Math.random() * 1e9)
  const r = await pedir('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return { j: jugador(r.cookie), usuario: u, registro: r }
}

// Pelea hasta el nivel pedido. Presupuesto medido en otras pruebas de
// este repositorio: de 36 a 53 ataques para llegar a nivel 3.
async function subirNivel(j, objetivo, presupuesto) {
  let nivel = 1
  for (let i = 0; i < presupuesto && nivel < objetivo; i++) {
    const r = await j.post('/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (r.status === 200) {
      if (r.body.newLevel) nivel = r.body.newLevel
      if (r.body.playerDied) await j.post('/api/player/respawn', {})
    }
    await dormir(370)
  }
  return nivel
}

async function run() {
  const t0 = Date.now()
  console.log('\n── 1. UN JUGADOR NUEVO ──')
  const { j: yo, registro } = await nuevoJugador('vje')
  check('se crea la cuenta', registro.status === 201 || registro.status === 200, String(registro.status))
  const inicio = await yo.ficha()
  check('nace con nivel 1 y algo de oro', inicio.level === 1 && inicio.gold > 0, `nivel ${inicio.level} · ${inicio.gold} oro`)
  check('y con herramientas para empezar',
    (await yo.mochila()).some(i => String(i.itemId).startsWith('hacha_')), 'sin hacha')

  console.log('\n── 2. RECOLECTAR EN EL BOSQUE ──')
  await yo.post('/api/world/explore', { zoneId: 'forest' })
  const hacha = (await yo.mochila()).find(i => String(i.itemId).startsWith('hacha_'))
  await yo.post('/api/player/equip', { uid: hacha.uid })
  const nodos = ((await yo.get('/api/recursos?zona=forest')).body.nodos || []).filter(n => n.zona === 'forest' && !n.agotado)
  check('el bosque tiene nodos', nodos.length > 0, String(nodos.length))
  let madera = 0
  for (const n of nodos.slice(0, 4)) {
    for (let i = 0; i < 12 && madera < 4; i++) {
      await dormir(470)
      const g = await yo.post('/api/recursos/golpear', { nodoId: n.id, pos: { x: n.x, y: n.y } })
      if (g.status !== 200) break
      madera = await yo.tiene('wood')
      if (g.body.agotado) break
    }
    if (madera >= 4) break
  }
  check('se consigue madera picando de verdad', madera > 0, String(madera) + ' de madera')

  console.log('\n── 3. FABRICAR Y EQUIPAR LO FABRICADO ──')
  // La costura: lo que sale del taller tiene que poder equiparse y
  // NOTARSE en la ficha. Un objeto que se fabrica y no hace nada es un
  // sistema completo que no llega al jugador.
  await yo.post('/api/dev/dar', { itemId: 'wood', quantity: 10 })
  await yo.post('/api/dev/dar', { itemId: 'leather', quantity: 10 })
  let hecho = false
  for (let i = 0; i < 8 && !hecho; i++) {
    const r = await yo.post('/api/crafting', { recipeId: 'rec_club', quantity: 1 })
    if (r.status === 200 && (r.body.made || 0) > 0) hecho = true
    await dormir(180)
  }
  check('se fabrica el garrote', hecho)
  const garrote = (await yo.mochila()).find(i => i.itemId === 'wood_club')
  check('y aparece en la mochila', !!garrote, (await yo.mochila()).map(i => i.itemId).join(',').slice(0, 100))
  if (garrote) {
    const antes = await yo.ficha()
    const eq = await yo.post('/api/player/equip', { uid: garrote.uid })
    check('se puede equipar', eq.status === 200, eq.raw.slice(0, 80))
    const despues = await yo.ficha()
    check('y el arma equipada se nota en la ficha',
      despues.attack !== antes.attack || despues.strength !== antes.strength ||
      JSON.stringify(despues.equipment) !== JSON.stringify(antes.equipment),
      `ataque ${antes.attack} → ${despues.attack}`)
    // Y la otra costura, la que ya se rompió una vez: el arma equipada
    // tiene que llegar a la arena.
    const arena = await yo.get('/api/arena')
    check('la arena reconoce el arma equipada',
      (arena.body.armas || []).some(a => a.id === 'wood_club'), 'no está en el catálogo')
  }

  console.log('\n── 4. SUBIR DE NIVEL PELEANDO ──')
  const nivel = await subirNivel(yo, 3, 250)
  check('se llega a nivel 3 peleando', nivel >= 3, 'nivel ' + nivel)
  const tras = await yo.ficha()
  check('subir de nivel sube la vida máxima', tras.maxHp > inicio.maxHp, `${inicio.maxHp} → ${tras.maxHp}`)

  console.log('\n── 5. UNA MISIÓN, DE ACEPTARLA A COBRARLA ──')
  const disp = (await yo.get('/api/quests?status=available')).body.quests || []
  check('hay misiones disponibles a este nivel', disp.length > 0, String(disp.length))
  // Se busca una de MATAR, que es la que cruza dos sistemas: el de
  // misiones y el de combate. Y se pelea contra el bicho que pide ELLA,
  // no contra el que a uno le apetezca.
  //
  // La primera versión de esto cogía la primera misión disponible —que a
  // nivel 3 es la de trolls— y luego peleaba contra arañas. Cuarenta
  // turnos sin que la misión avanzara ni un punto, y con razón. El fallo
  // era de la prueba, pero de paso dejó ver algo del juego que conviene
  // saber: no hay ninguna misión para la araña, que es justo el bicho
  // contra el que pelea todo el mundo al empezar.
  const mision = disp.find(q => (q.objectives || []).some(o => /^kill_/.test(o.key))) || disp[0]
  const objetivo = (mision.objectives || []).find(o => /^kill_/.test(o.key))
  const bichoDeLaMision = objetivo ? 'm_' + objetivo.key.replace('kill_', '') : 'm_spider'
  console.log(`     (misión "${mision.name}" · hay que matar ${bichoDeLaMision})`)
  const acep = await yo.post('/api/quests', { questId: mision.id, action: 'accept' })
  check('se acepta una misión', acep.status === 200, acep.raw.slice(0, 90))
  const activas = (await yo.get('/api/quests?status=active')).body.quests || []
  check('y queda activa', activas.some(q => q.questId === mision.id), JSON.stringify(activas).slice(0, 100))
  // Pelear cuenta para la misión: eso es la costura.
  // Aquí hay una cosa del sistema que conviene saber: al aceptar una
  // misión, el progreso se siembra con lo que YA habías hecho. Si vienes
  // de subir a nivel 3 matando arañas, la misión de las arañas nace
  // completa. Eso está bien —premia lo que ya hiciste— pero significa que
  // "pelear la hace avanzar" no siempre se puede observar.
  //
  // Así que se comprueba lo que de verdad cierra la costura entre los dos
  // sistemas: que la misión se pueda ENTREGAR y que pague. Si además
  // quedaba trabajo por hacer, se hace.
  await yo.post('/api/dev/dar', { itemId: 'potion_hp_v', quantity: 20 })
  const pendiente = (activas.find(q => q.questId === mision.id) || {}).objectiveProgress || []
  const faltaba = pendiente.some(o => o.current < (objetivo ? objetivo.required : 1))
  let progresó = !faltaba
  for (let i = 0; i < 60 && faltaba && !progresó; i++) {
    const salud = await yo.ficha()
    if (salud.hp < salud.maxHp * 0.4) { await yo.post('/api/player/use', { itemId: 'potion_hp_v' }); await dormir(200) }
    const r = await yo.post('/api/combat/action', { monsterId: bichoDeLaMision, action: 'attack' })
    if (r.status === 200) {
      if ((r.body.questUpdates || []).length) progresó = true
      if (r.body.playerDied) await yo.post('/api/player/respawn', {})
    }
    await dormir(370)
  }
  check('la misión avanza peleando, o ya venía hecha de antes', progresó,
    faltaba ? 'faltaba trabajo y no avanzó en 60 turnos' : 'venía hecha')

  const oroAntesMision = (await yo.ficha()).gold
  const entrega = await yo.post('/api/quests', { questId: mision.id, action: 'turnin' })
  check('la misión se entrega y se cobra', entrega.status === 200, entrega.status + ' ' + entrega.raw.slice(0, 100))
  check('y el oro sube al cobrarla', (await yo.ficha()).gold > oroAntesMision,
    `${oroAntesMision} → ${(await yo.ficha()).gold}`)

  console.log('\n── 6. LA ARENA PAGA EN EL SERVIDOR ──')
  // Se entra CURADO, como entraría cualquiera. La primera versión venía
  // de cuarenta turnos de pelea y moría en la arena antes de matar a
  // nadie; lo que medía entonces no era la arena sino el desgaste.
  for (let i = 0; i < 8; i++) {
    const h = await yo.ficha()
    if (h.hp >= h.maxHp * 0.95) break
    await yo.post('/api/player/use', { itemId: 'potion_hp_v' })
    await dormir(150)
  }
  const salud = await yo.ficha()
  check('se entra a la arena en condiciones', salud.hp > salud.maxHp * 0.7, `${salud.hp} de ${salud.maxHp}`)
  const oroAntesArena = salud.gold
  const ini = await yo.post('/api/arena/start', { arenaId: 'arena_bosque' })
  check('se entra en la arena', ini.status === 200, ini.raw.slice(0, 90))
  // Presupuesto medido: con los puños, la primera araña cae sobre el
  // paso 110. Se dan 300 para que quepa con holgura.
  let bajas = 0, murióEnLaArena = false, entrada = { mx: 0, my: 0, apuntar: 0, atacar: true }
  for (let i = 0; i < 300; i++) {
    const s = await yo.post('/api/arena/sync', { entrada })
    await dormir(100)
    if (s.status !== 200 || !s.body.estado) break
    const e = s.body.estado
    bajas = Math.max(bajas, e.bajas || 0)
    if (e.jugador.hp <= 0) { murióEnLaArena = true; break }
    const v = (e.enemigos || []).filter(x => x.hp > 0)[0]
    if (!v) { entrada = { mx: 0, my: 0, apuntar: 0, atacar: true }; continue }
    const dx = v.x - e.jugador.x, dy = v.y - e.jugador.y, d = Math.hypot(dx, dy)
    entrada = { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx), atacar: true }
    if (bajas >= 2) break
  }
  check('se mata a alguien en la arena', bajas > 0, String(bajas) + ' bajas')
  await yo.post('/api/arena/abandon', {})
  const oroTrasArena = (await yo.ficha()).gold
  // La regla del oro, comprobada en vez de supuesta. Ganar paga; perder
  // cuesta el 5 %; abandonar no paga ni cobra. La primera versión exigía
  // que el oro no bajara nunca, y falló legítimamente: el personaje había
  // muerto y el servidor le cobró su 5 %. Lo que se comprueba ahora es
  // que el movimiento del oro cuadre con lo que pasó.
  const tope = Math.ceil(oroAntesArena * 0.05) + 1
  check('el oro se mueve según lo que pasó, no por capricho',
    murióEnLaArena ? (oroAntesArena - oroTrasArena) <= tope : oroTrasArena >= oroAntesArena,
    `${oroAntesArena} → ${oroTrasArena} · ${murióEnLaArena ? 'murió' : 'sobrevivió'} · tope ${tope}`)

  console.log('\n── 7. UNA MAZMORRA, Y SALIR CON LO GANADO ──')
  // Entrar pide estar sano: se bebe antes, que es lo que haría cualquiera.
  await yo.post('/api/dev/dar', { itemId: 'potion_hp_v', quantity: 10 })
  for (let i = 0; i < 5; i++) await yo.post('/api/player/use', { itemId: 'potion_hp_v' })
  const ent = await yo.post('/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' })
  check('se entra en la Cripta', ent.status === 200, ent.raw.slice(0, 110))
  let run1 = ent.body.run
  check('la mazmorra ofrece salas entre las que elegir',
    !!run1 && (run1.opciones || []).length > 0, JSON.stringify((run1 || {}).opciones || []).slice(0, 90))
  if (run1) {
    const barata = (run1.opciones || []).find(o => o.tipo === 'santuario' || o.tipo === 'cofre') || run1.opciones[0]
    const el = await yo.post('/api/mazmorra/sala', { salaId: barata.id })
    check('elegir una sala abre algo jugable', el.body.combate === true, JSON.stringify(el.body).slice(0, 110))
    // Se juega la sala hasta que termine.
    let e2 = { mx: 0, my: 0, apuntar: 0, atacar: true }
    for (let i = 0; i < 200; i++) {
      const s = await yo.post('/api/arena/sync', { entrada: e2 })
      await dormir(100)
      if (s.status !== 200 || !s.body.estado) break
      const e = s.body.estado
      if (e.jugador.hp <= 0) break
      const o = e.sala && e.sala.objetivo
      if (o && !o.hecho) {
        const dx = o.x - e.jugador.x, dy = o.y - e.jugador.y, d = Math.hypot(dx, dy)
        e2 = d < o.radio * 0.5 ? { mx: 0, my: 0, apuntar: 0 } : { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx) }
        continue
      }
      const v = (e.enemigos || []).filter(x => x.hp > 0)[0]
      if (!v) continue
      const dx = v.x - e.jugador.x, dy = v.y - e.jugador.y, d = Math.hypot(dx, dy)
      e2 = { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx), atacar: true }
    }
    const est = await yo.get('/api/mazmorra')
    check('la sala se despeja y la run avanza',
      !est.body.run || est.body.run.piso > 1 || est.body.run.terminada || !est.body.run.enCombate,
      JSON.stringify(est.body).slice(0, 110))
    const salida = await yo.post('/api/mazmorra/retirarse', {})
    check('retirarse cierra la run y devuelve el resultado',
      salida.status === 200 && !!salida.body.fin, salida.raw.slice(0, 110))
  }

  console.log('\n── 8. EL MERCADO, CON DOS PERSONAS DE VERDAD ──')
  const { j: otro } = await nuevoJugador('cmp')
  await yo.post('/api/dev/dar', { itemId: 'iron_ore', quantity: 5 })
  const pub = await yo.post('/api/market', { itemId: 'iron_ore', quantity: 2, pricePerUnit: 40 })
  check('se publica una venta', pub.status === 201 || pub.status === 200, pub.raw.slice(0, 90))
  const anuncio = pub.body.listing || {}
  const oroVendedorAntes = (await yo.ficha()).gold
  const oroCompradorAntes = (await otro.ficha()).gold
  const compra = await otro.post('/api/market/' + anuncio.id + '/buy', { quantity: 2 })
  check('otra persona la compra', compra.status === 200, compra.raw.slice(0, 110))
  check('al comprador le llega el objeto', (await otro.tiene('iron_ore')) >= 2, String(await otro.tiene('iron_ore')))
  check('al comprador le baja el oro', (await otro.ficha()).gold < oroCompradorAntes,
    `${oroCompradorAntes} → ${(await otro.ficha()).gold}`)
  check('y al vendedor le sube', (await yo.ficha()).gold > oroVendedorAntes,
    `${oroVendedorAntes} → ${(await yo.ficha()).gold}`)
  // La comisión se quema: es el sink que sostiene la economía.
  const eco = (await pedir('GET', '/api/economy/public')).body
  check('la venta deja rastro en la economía pública',
    (eco.mercado || {}).ventasRegistradas > 0 && eco.mercado.volumenTotal > 0,
    JSON.stringify((eco.mercado || {}).volumenTotal))

  console.log('\n── 9. PVP: EL SERVIDOR DECIDE QUIÉN GANA ──')
  const ratingAntes = (await yo.ficha()).pvpRating
  const duelo = await yo.post('/api/pvp/match', {})
  check('se juega un duelo', duelo.status === 200, duelo.raw.slice(0, 110))
  if (duelo.status === 200) {
    check('el duelo dice quién ganó', typeof duelo.body.won === 'boolean' || !!duelo.body.duelo,
      JSON.stringify(duelo.body).slice(0, 120))
    const ratingDespues = (await yo.ficha()).pvpRating
    check('y el rating se mueve', ratingDespues !== ratingAntes, `${ratingAntes} → ${ratingDespues}`)
  }

  console.log('\n── 10. Y EL PERSONAJE SIGUE SIENDO COHERENTE ──')
  const fin = await yo.ficha()
  check('acabó con más nivel del que empezó', fin.level > inicio.level, `${inicio.level} → ${fin.level}`)
  check('la vida nunca pasó del tope', fin.hp <= fin.maxHp, `${fin.hp} de ${fin.maxHp}`)
  check('el oro es una cifra creíble', fin.gold >= 0 && fin.gold < 1000000, String(fin.gold))
  check('y la mochila no se desbordó', (await yo.mochila()).length <= 120, String((await yo.mochila()).length))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas · ${((Date.now() - t0) / 1000).toFixed(0)}s de partida`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-partida.json', '/tmp/cm-partida-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-partida.json', BACKUP_DIR: '/tmp/cm-partida-b',
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
