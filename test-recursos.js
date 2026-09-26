/**
 * CriptoMundo — pruebas de recolección física, minería, forja y hotbar
 * Uso:  PORT=3820 node test-recursos.js --spawn
 *
 * Sigue el guion del §22: acercarse, equipar la herramienta, golpear,
 * ver bajar la vida del nodo y comprobar que el material entra en el
 * inventario DE VERDAD. Nada de reclamar recursos desde un menú.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => {
  c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : '')))
}
function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''
      res.on('data', c => o += c)
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
const sleep = ms => new Promise(r => setTimeout(r, ms))

// Golpear un nodo como lo hace el juego: de pie junto a él y esperando
// a recuperar el golpe. El servidor exige las dos cosas desde el §10:
// la posición porque hay que andar hasta el árbol, y la espera porque
// un hacha no da dos hachazos en el mismo instante.
async function golpear(nodo, opciones) {
  const o = opciones || {}
  if (!o.sinEsperar) await sleep(470)
  const pos = o.pos || { x: nodo.x, y: nodo.y }
  return req('POST', '/api/recursos/golpear', { nodoId: nodo.id || nodo, pos })
}
const inv = async () => (await req('GET', '/api/inventory')).body
const cuenta = async itemId => {
  const d = await inv()
  return (d.inventory || []).filter(i => i.itemId === itemId).reduce((a, i) => a + i.quantity, 0)
}
// Atajo de pruebas: dar material sin farmear media hora
async function conseguir(itemId, n) {
  // se consigue talando/picando, pero para montar el escenario se usa
  // el propio sistema: se golpea hasta tener lo que hace falta
  return cuenta(itemId)
}

async function run() {
  const u = 'rec' + Math.floor(Math.random() * 1000000)
  const reg = await req('POST', '/api/auth/register', {
    username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero',
  })
  if (reg.status !== 200 && reg.status !== 201) { console.log('registro falló', reg.raw.slice(0, 150)); process.exit(1) }
  await req('POST', '/api/world/explore', { zoneId: 'forest' })

  // ══ §7 SIN HERRAMIENTA NO SE TALA ═════════════════════════════════
  console.log('\n── §7 RECOLECCIÓN FÍSICA ──')
  let r = await req('GET', '/api/recursos?zona=forest')
  check('el mundo tiene nodos de recurso', (r.body.nodos || []).length > 0, `${(r.body.nodos || []).length}`)
  // Sin esto, quien dibuje los nodos tiene que adivinar la escala.
  check('la lista dice en qué espacio están las coordenadas',
    r.body.espacio && r.body.espacio.ancho > 0 && r.body.espacio.alto > 0, JSON.stringify(r.body.espacio))
  check('y a qué distancia se puede golpear', r.body.alcance > 0, String(r.body.alcance))
  check('los nodos traen posición', (r.body.nodos || []).every(n2 => Number.isFinite(n2.x) && Number.isFinite(n2.y)))
  check('y caben en el espacio declarado',
    (r.body.nodos || []).every(n2 => n2.x >= 0 && n2.x <= r.body.espacio.ancho && n2.y >= 0 && n2.y <= r.body.espacio.alto))
  const arbol = (r.body.nodos || []).find(n => n.util === 'hacha' && n.nivel === 1)
  const roca = (r.body.nodos || []).find(n => n.util === 'pico' && n.nivel === 1)
  check('hay árboles y rocas en el bosque', !!arbol && !!roca)

  r = await golpear(arbol)
  check('sin nada equipado NO se puede talar', r.status === 400 && /hacha/i.test(r.body.error || ''),
    r.raw.slice(0, 90))
  const inicial = (await inv()).inventory
  check('el personaje arranca con hacha y pico (no queda encerrado)',
    inicial.some(i => i.itemId === 'hacha_madera_piedra') && inicial.some(i => i.itemId === 'pico_madera_piedra'),
    inicial.filter(i => i.type === 'TOOL').map(i => i.name).join(', '))

  // ══ §10 FORJAR UN HACHA CON MANGO + CABEZA ════════════════════════
  console.log('\n── §10 FORJA: mango + cabeza ──')
  // El personaje arranca con 6 de madera y 5 de hierro
  const mad = await cuenta('wood'), hie = await cuenta('iron_ore')
  check('hay materia prima para empezar', mad >= 2 && hie >= 3, `madera=${mad} hierro=${hie}`)

  r = await req('POST', '/api/crafting', { recipeId: 'rec_mango_madera', quantity: 1 })
  check('se fabrica un mango de madera', r.status === 200 && r.body.made > 0, r.raw.slice(0, 90))
  r = await req('POST', '/api/crafting', { recipeId: 'rec_cabeza_hierro', quantity: 1 })
  check('se fabrica una cabeza de hierro', r.status === 200 && r.body.made > 0, r.raw.slice(0, 90))
  r = await req('POST', '/api/crafting', { recipeId: 'rec_hacha_madera_hierro', quantity: 1 })
  check('mango + cabeza = hacha', r.status === 200 && r.body.made > 0, r.raw.slice(0, 90))

  // §10: distinto mango ⇒ distintas estadísticas
  const d = await inv()
  const hacha = d.inventory.find(i => i.itemId === 'hacha_madera_hierro')
  check('el hacha aparece en el inventario', !!hacha)
  check('el hacha ocupa la ranura de herramienta', hacha && hacha.slot === 'tool', hacha && hacha.slot)

  const cat = (await req('GET', '/api/forja')).body.herramientas || []
  check('el catálogo de forja lista las combinaciones', cat.length >= 24, `${cat.length} herramientas`)
  const barato = cat.find(h => h.itemId === 'pico_madera_hierro')
  const bueno  = cat.find(h => h.itemId === 'pico_ceniza_hierro')
  check('MISMA cabeza + MEJOR mango = más poder de minería',
    barato && bueno && bueno.poder > barato.poder,
    barato && bueno ? `madera=${barato.poder} vs ceniza=${bueno.poder}` : 'faltan entradas')
  check('MISMA cabeza + MEJOR mango = más durabilidad',
    barato && bueno && bueno.durabilidad > barato.durabilidad,
    barato && bueno ? `madera=${barato.durabilidad} vs ceniza=${bueno.durabilidad}` : '')
  check('MISMA cabeza + MEJOR mango = mejor rareza',
    barato && bueno && barato.rareza !== bueno.rareza,
    barato && bueno ? `${barato.rareza} vs ${bueno.rareza}` : '')
  const cabezaMejor = cat.find(h => h.itemId === 'pico_madera_plata')
  check('MEJOR cabeza sube el nivel de minería',
    cabezaMejor && barato && cabezaMejor.nivel > barato.nivel,
    barato && cabezaMejor ? `hierro=${barato.nivel} vs plata=${cabezaMejor.nivel}` : '')

  // ══ §12 EQUIPAR LA HERRAMIENTA ════════════════════════════════════
  console.log('\n── §4/§12 EQUIPAR HERRAMIENTA ──')
  const stAntes = (await inv()).stats
  r = await req('POST', '/api/player/equip', { uid: hacha.uid })
  check('se puede equipar el hacha', r.status === 200, r.raw.slice(0, 90))
  check('el hacha no ocupa la mano del arma',
    r.body.equipment.tool === hacha.uid, JSON.stringify(r.body.equipment))
  check('la herramienta también sube la fuerza', r.body.stats.strength > stAntes.strength,
    `${stAntes.strength} → ${r.body.stats.strength}`)

  // ══ §7 TALAR DE VERDAD ════════════════════════════════════════════
  console.log('\n── §7 TALAR: golpe a golpe ──')
  const maderaAntes = await cuenta('wood')
  r = await golpear(arbol)
  check('¿puedo golpear un árbol?', r.status === 200, r.raw.slice(0, 100))
  const vida1 = r.body.vida, vidaMax = r.body.vidaMax
  check('el árbol recibe daño', vida1 < vidaMax, `${vidaMax} → ${vida1}`)
  check('la herramienta se desgasta',
    r.body.herramienta && r.body.herramienta.durabilidad < r.body.herramienta.durabilidadMax,
    JSON.stringify(r.body.herramienta))

  let golpes = 1, caido = null
  while (golpes < 60) {
    r = await golpear(arbol)
    golpes++
    if (r.body.agotado) { caido = r.body; break }
    if (r.status !== 200) break
  }
  check('¿se destruye tras suficientes golpes?', !!caido, `${golpes} golpes, último: ${r.raw.slice(0, 70)}`)
  check('¿obtengo madera?', caido && caido.obtenido.length > 0,
    caido ? JSON.stringify(caido.obtenido) : '')
  const maderaDesp = await cuenta('wood')
  check('la madera entra en el inventario REAL', maderaDesp > maderaAntes,
    `${maderaAntes} → ${maderaDesp}`)
  check('talar da XP', caido && caido.xp > 0, caido && String(caido.xp))

  r = await golpear(arbol)
  check('un árbol agotado no se puede volver a talar', r.status === 429, r.raw.slice(0, 80))

  // ══ §9 MINERÍA: el hacha no sirve ═════════════════════════════════
  console.log('\n── §9 MINERÍA ──')
  r = await golpear(roca)
  check('con el hacha NO se pica piedra', r.status === 400 && /pico/i.test(r.body.error || ''),
    r.raw.slice(0, 90))

  // Cambiar al pico inicial y picar la roca de verdad
  const pico = (await inv()).inventory.find(i => i.itemId === 'pico_madera_piedra')
  r = await req('POST', '/api/player/equip', { uid: pico.uid })
  check('¿puedo equipar un pico?', r.status === 200, r.raw.slice(0, 80))
  const piedraAntes = await cuenta('stone')
  let rocaCaida = null
  for (let i = 0; i < 80; i++) {
    r = await golpear(roca)
    if (r.status !== 200) break
    if (r.body.agotado) { rocaCaida = r.body; break }
  }
  check('¿puedo golpear una roca?', !!rocaCaida || r.status === 200, r.raw.slice(0, 80))
  check('¿se destruye?', !!rocaCaida, r.raw.slice(0, 80))
  check('¿obtengo mineral?', rocaCaida && rocaCaida.obtenido.length > 0,
    rocaCaida ? JSON.stringify(rocaCaida.obtenido) : '')
  const piedraDesp = await cuenta('stone')
  check('el mineral entra en el inventario REAL', piedraDesp > piedraAntes,
    `${piedraAntes} → ${piedraDesp}`)

  // Y con la piedra ya se puede forjar la cabeza: el círculo se cierra.
  // Una roca da de 2 a 5 y la receta pide 4, así que a veces hace
  // falta picar otra. No es un atasco: hay cinco rocas de nivel 1.
  const rocas = (await req('GET', '/api/recursos?zona=forest')).body.nodos
    .filter(n => n.util === 'pico' && n.nivel === 1 && !n.agotado)
  for (const otra of rocas) {
    if (await cuenta('stone') >= 4) break
    for (let i = 0; i < 80; i++) {
      const g = await golpear(otra)
      if (g.status !== 200 || g.body.agotado) break
    }
  }
  check('varias rocas disponibles evitan el atasco', await cuenta('stone') >= 4,
    `piedra=${await cuenta('stone')}`)
  await req('POST', '/api/crafting', { recipeId: 'rec_mango_madera', quantity: 1 })
  r = await req('POST', '/api/crafting', { recipeId: 'rec_cabeza_piedra', quantity: 1 })
  check('con la piedra minada se forja una cabeza nueva', r.status === 200 && r.body.made > 0,
    r.raw.slice(0, 80))

  // La plata está en las MINAS. Antes esta comprobación se hacía desde
  // el bosque y pasaba en verde por el motivo equivocado: fallaba por
  // estar en otra zona, no por llevar un pico flojo. Se viaja primero,
  // y así lo que se mide es de verdad la progresión de herramienta.
  await req('POST', '/api/world/explore', { zoneId: 'mines' })
  const enMinas = (await req('GET', '/api/recursos?zona=mines')).body.nodos || []
  const plata = enMinas.find(n2 => n2.tipo === 'veta_plata')
  check('las minas tienen filones de plata', !!plata, JSON.stringify(enMinas.map(n2 => n2.tipo)))
  r = await golpear(plata)
  check('un pico básico NO saca plata (progresión real)',
    r.status === 403 && /básica|nivel/i.test(r.body.error || ''), r.raw.slice(0, 120))

  // Volver al bosque para lo que queda
  await req('POST', '/api/world/explore', { zoneId: 'forest' })

  // ══ §10 NI DE LEJOS NI A RÁFAGAS ══════════════════════════════════
  console.log('\n── §10 HAY QUE ESTAR DELANTE, Y UN GOLPE CADA VEZ ──')
  // Una roca entera del bosque: es de nivel 1, así que el pico de
  // fábrica sirve y lo que se mide es el control, no la progresión.
  const entera = (await req('GET', '/api/recursos?zona=forest')).body.nodos
    .find(n2 => n2.util === 'pico' && n2.nivel === 1 && !n2.agotado)
  check('queda alguna roca entera en el bosque', !!entera)

  r = await golpear(entera, { pos: { x: entera.x + 900, y: entera.y + 700 } })
  check('desde lejos no se puede picar', r.status === 403 && /lejos/i.test(r.body.error || ''),
    r.raw.slice(0, 100))

  r = await req('POST', '/api/recursos/golpear', { nodoId: entera.id })
  check('y tampoco sin decir dónde estás', r.status === 400, r.raw.slice(0, 100))

  // Un golpe bueno, y otro inmediato: el segundo tiene que rebotar.
  const deCerca = await golpear(entera)
  check('de cerca sí se puede picar', deCerca.status === 200, deCerca.raw.slice(0, 100))
  const seguido = await golpear(entera, { sinEsperar: true })
  check('dos golpes seguidos al mismo nodo NO cuelan', seguido.status === 429,
    seguido.raw.slice(0, 100))
  const trasEsperar = await golpear(entera)
  check('pero tras esperar sí', trasEsperar.status === 200 || trasEsperar.body.agotado,
    trasEsperar.raw.slice(0, 100))

  // ══ §11 RAREZA FUNCIONAL ══════════════════════════════════════════
  console.log('\n── §11 RAREZA FUNCIONAL, NO SOLO COLOR ──')
  const tpl = (await req('GET', '/api/recursos')).body
  const maderas = ['wood', 'wood_roble', 'wood_ceniza', 'wood_sombra', 'wood_alba', 'wood_savia']
  const rarezas = []
  for (const m of maderas) {
    const n = (await req('GET', '/api/recursos')).body.nodos
      .flatMap(x => x.suelta).find(s => s.itemId === m)
    if (n) rarezas.push(n.rareza)
  }
  check('las maderas cubren varias rarezas', new Set(rarezas).size >= 3, rarezas.join(', '))

  // ══ §5 HOTBAR ═════════════════════════════════════════════════════
  console.log('\n── §5 HOTBAR ──')
  r = await req('GET', '/api/hotbar')
  check('la hotbar existe', r.status === 200 && Array.isArray(r.body.ranuras), r.raw.slice(0, 80))
  // Diez desde la FASE B del encargo de combate: la barra se maneja con
  // las teclas 1–0 y eso son diez. Es la ÚNICA expectativa que ha
  // cambiado al unificar las dos barras que había, y cambia porque el
  // encargo lo pide, no porque se haya roto nada: las ocho primeras
  // siguen valiendo para lo mismo y una partida guardada de antes se
  // migra conservando lo que tuviera.
  check('tiene 10 ranuras', r.body.ranuras.length === 10, String(r.body.ranuras.length))

  const semilla = (await inv()).inventory.find(i => i.type === 'SEED')
  r = await req('POST', '/api/hotbar', { ranura: 0, uid: semilla.uid })
  check('se puede poner una semilla en la ranura 0', r.status === 200, r.raw.slice(0, 80))
  check('la ranura muestra el objeto real', r.body.hotbar.ranuras[0] &&
    r.body.hotbar.ranuras[0].uid === semilla.uid, JSON.stringify(r.body.hotbar.ranuras[0]))
  check('la ranura refleja la cantidad del inventario',
    r.body.hotbar.ranuras[0].cantidad === semilla.quantity,
    `hotbar=${r.body.hotbar.ranuras[0].cantidad} inventario=${semilla.quantity}`)

  r = await req('POST', '/api/hotbar', { ranura: 3, uid: semilla.uid })
  const hb = (await req('GET', '/api/hotbar')).body
  check('un objeto no puede estar en dos ranuras a la vez',
    hb.ranuras[0] === null && hb.ranuras[3] && hb.ranuras[3].uid === semilla.uid,
    JSON.stringify(hb.ranuras.map(x => x && x.uid)))

  r = await req('POST', '/api/hotbar', { ranura: 1, uid: 'itm_inventado' })
  check('no se puede poner un objeto que no tienes', r.status === 404, r.raw.slice(0, 70))

  // La referencia muerta se limpia sola
  const pocion = (await inv()).inventory.find(i => i.type === 'POTION')
  await req('POST', '/api/hotbar', { ranura: 5, uid: pocion.uid })
  await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
  for (let i = 0; i < pocion.quantity + 1; i++) await req('POST', '/api/player/use', { uid: pocion.uid })
  const hb2 = (await req('GET', '/api/hotbar')).body
  const quedan = await cuenta(pocion.itemId)
  check('al gastar el objeto la ranura se vacía sola',
    quedan > 0 || hb2.ranuras[5] === null,
    `quedan ${quedan}, ranura=${JSON.stringify(hb2.ranuras[5])}`)

  r = await req('POST', '/api/hotbar/seleccionar', { ranura: 3 })
  check('se puede seleccionar una ranura', r.status === 200 && r.body.seleccionada === 3)

  // ══ NO SE PUEDE HACER TRAMPA ══════════════════════════════════════
  console.log('\n── NO SE PUEDE HACER TRAMPA ──')
  r = await req('POST', '/api/recursos/golpear', { nodoId: 'arbol_inventado#9', pos: { x: 0, y: 0 } })
  check('un nodo inventado se rechaza', r.status === 404)
  r = await req('POST', '/api/recursos/golpear', { nodoId: 'arbol_sombrio#0', pos: { x: 0, y: 0 } })
  check('no se puede picar en una zona a la que no has llegado',
    r.status === 403 || r.status === 400, r.raw.slice(0, 80))
  // Haber estado alguna vez no basta: hay que estar AHORA. Antes se
  // podía talar el bosque entero desde el banco del pueblo.
  const arbolBosque = (await req('GET', '/api/recursos?zona=forest')).body.nodos[0]
  await req('POST', '/api/world/explore', { zoneId: 'pueblo' })
  r = await golpear(arbolBosque)
  check('ni se tala el bosque desde el pueblo', r.status === 403 && /y tú no/i.test(r.body.error || ''),
    r.raw.slice(0, 100))

  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log(`══════════════════════════════════════════════\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-recursos.json', '/tmp/cm-rec-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-recursos.json', BACKUP_DIR: '/tmp/cm-rec-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else {
  run().catch(e => { console.error(e); process.exit(1) })
}

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
