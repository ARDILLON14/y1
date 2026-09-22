/**
 * CriptoMundo — cuántos objetos entran y cuántos salen del juego
 * Uso:  PORT=3884 node test-economia-objetos.js --spawn
 *
 * POR QUÉ EXISTE
 * La curva de economía medía el oro creado, el quemado, el neto, el
 * CGRID emitido y las bajas por hora. De la lista de la FASE 18 faltaba
 * la otra mitad: cuántos objetos se crean y se destruyen. Sin eso, un
 * mercado con precios a la baja no se puede distinguir de uno con
 * demasiada gente vendiendo lo mismo.
 *
 * Lo delicado no es contar, es contar BIEN. Comprar en el mercado no
 * crea nada: el objeto sale del escrow del vendedor y entra en la
 * mochila del comprador. Si eso contara como creación, el mercado
 * parecería una fábrica de objetos y la cifra mentiría justo donde más
 * se mira. Esta prueba comprueba las dos cosas: que se cuenta, y que no
 * se cuenta de más.
 */
const http = require('http')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3884)
const ADMIN = 'prueba-admin'
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function pedir(method, p, body, cookie, cabeceras) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = Object.assign({ 'Content-Type': 'application/json' }, cabeceras || {})
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

async function crearCuenta() {
  const u = 'eco' + Math.floor(Math.random() * 1e9)
  const r = await pedir('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return { usuario: u, cookie: r.cookie, personaje: r.body.character }
}

const economia = () => pedir('GET', '/api/economy/public').then(r => r.body)
const objetosHoy = async () => (await economia()).objetos || {}

async function run() {
  console.log('\n── LA ECONOMÍA PUBLICA EL FLUJO DE OBJETOS ──')
  const e0 = await economia()
  check('el informe trae un apartado de objetos', !!e0.objetos, Object.keys(e0).join(','))
  check('con creados, destruidos y neto',
    e0.objetos && ['creadosHoy', 'destruidosHoy', 'netoHoy'].every(k => typeof e0.objetos[k] === 'number'),
    JSON.stringify(e0.objetos).slice(0, 120))
  check('y el desglose por motivo', !!(e0.objetos && e0.objetos.porMotivoHoy), JSON.stringify((e0.objetos || {}).porMotivoHoy))
  check('el mercado publica el volumen total', typeof (e0.mercado || {}).volumenTotal === 'number',
    JSON.stringify((e0.mercado || {}).volumenTotal))
  check('y el precio realmente pagado por objeto', Array.isArray((e0.mercado || {}).preciosPagados),
    typeof (e0.mercado || {}).preciosPagados)

  console.log('\n── CREAR UN OBJETO SE CUENTA ──')
  const a = await crearCuenta()
  const antes = await objetosHoy()
  const dar = await pedir('POST', '/api/dev/dar', { itemId: 'iron_ore', quantity: 5 }, a.cookie)
  check('la ruta de pruebas reparte objetos', dar.status === 200, dar.raw.slice(0, 80))
  const trasDev = await objetosHoy()
  // La ruta de pruebas NO cuenta: reparte objetos de la nada y si
  // contara, cualquier sesión de desarrollo falsearía la curva.
  check('lo que reparte la ruta de pruebas no cuenta como creado',
    trasDev.creadosHoy === antes.creadosHoy, `${antes.creadosHoy} → ${trasDev.creadosHoy}`)

  // Recolectar sí crea. Se pica un árbol de verdad, y para eso hay que
  // estar EN el bosque: el servidor rechaza golpear un nodo de otra
  // zona. La primera versión de esto cogía el primer nodo de la lista,
  // que era de otra zona, y medía cero creaciones sin que nada
  // estuviera roto.
  await pedir('POST', '/api/world/explore', { zoneId: 'forest' }, a.cookie)
  // Un árbol pide un hacha equipada. El personaje nace con una, pero
  // hay que ponérsela: sin esto el servidor contesta 400 y se medían
  // cero creaciones sin que nada estuviera roto.
  const inv = (await pedir('GET', '/api/inventory', null, a.cookie)).body.inventory || []
  const hacha = inv.find(i => String(i.itemId).startsWith('hacha_'))
  if (hacha) await pedir('POST', '/api/player/equip', { uid: hacha.uid }, a.cookie)
  check('se equipa un hacha para talar', !!hacha, inv.map(i => i.itemId).join(','))
  const rec = await pedir('GET', '/api/recursos?zona=forest', null, a.cookie)
  const nodos = ((rec.body || {}).nodos || []).filter(n => n.zona === 'forest' && !n.agotado)
  check('el bosque tiene nodos que picar', nodos.length > 0, String(nodos.length))
  const base = (await objetosHoy()).creadosHoy
  let creadosPorPicar = 0
  for (const nodo of nodos.slice(0, 3)) {
    for (let i = 0; i < 12; i++) {
      await dormir(470)
      const g = await pedir('POST', '/api/recursos/golpear', { nodoId: nodo.id, pos: { x: nodo.x, y: nodo.y } }, a.cookie)
      if (g.status !== 200) break
      if (g.body.agotado) break
    }
    creadosPorPicar = (await objetosHoy()).creadosHoy - base
    if (creadosPorPicar > 0) break
  }
  check('picar un nodo cuenta como objetos creados', creadosPorPicar > 0, String(creadosPorPicar))
  const porMotivo = (await objetosHoy()).porMotivoHoy || {}
  check('y queda anotado de dónde salieron', (porMotivo['creado:recoleccion'] || 0) > 0,
    JSON.stringify(porMotivo))

  console.log('\n── FABRICAR CREA Y DESTRUYE A LA VEZ ──')
  await pedir('POST', '/api/dev/dar', { itemId: 'wood', quantity: 20 }, a.cookie)
  await pedir('POST', '/api/dev/dar', { itemId: 'leather', quantity: 20 }, a.cookie)
  const antesCraft = await objetosHoy()
  let hecho = false
  for (let i = 0; i < 8 && !hecho; i++) {
    const r = await pedir('POST', '/api/crafting', { recipeId: 'rec_club', quantity: 1 }, a.cookie)
    if (r.status === 200 && (r.body.made || 0) > 0) hecho = true
    await dormir(200)
  }
  check('se fabrica algo', hecho)
  const trasCraft = await objetosHoy()
  check('fabricar destruye los materiales', trasCraft.destruidosHoy > antesCraft.destruidosHoy,
    `${antesCraft.destruidosHoy} → ${trasCraft.destruidosHoy}`)
  check('y crea el resultado', trasCraft.creadosHoy > antesCraft.creadosHoy,
    `${antesCraft.creadosHoy} → ${trasCraft.creadosHoy}`)
  const m2 = trasCraft.porMotivoHoy || {}
  check('la fabricación se anota por su nombre',
    (m2['creado:fabricacion'] || 0) > 0 && (m2['destruido:fabricacion'] || 0) > 0, JSON.stringify(m2))

  console.log('\n── COMPRAR Y VENDER NO CREA NI DESTRUYE NADA ──')
  // Esto es lo que más fácil se cuenta mal: el objeto cambia de dueño.
  const b = await crearCuenta()
  await pedir('POST', '/api/dev/dar', { itemId: 'iron_ore', quantity: 10 }, a.cookie)
  await pedir('POST', '/api/dev/dar', { itemId: 'iron_ore', quantity: 1 }, b.cookie)
  const antesMercado = await objetosHoy()
  const pub = await pedir('POST', '/api/market', { itemId: 'iron_ore', quantity: 3, pricePerUnit: 10 }, a.cookie)
  check('se publica en el mercado', pub.status === 201 || pub.status === 200, pub.status + ' ' + pub.raw.slice(0, 100))
  const trasPublicar = await objetosHoy()
  check('publicar no cuenta como destruir', trasPublicar.destruidosHoy === antesMercado.destruidosHoy,
    `${antesMercado.destruidosHoy} → ${trasPublicar.destruidosHoy}`)

  const lista = await pedir('GET', '/api/market')
  const mio = ((lista.body || {}).listings || []).find(l => l.itemId === 'iron_ore' && l.status === 'ACTIVE')
  check('la publicación aparece en el mercado', !!mio, JSON.stringify((lista.body || {}).listings || []).slice(0, 120))
  if (mio) {
    const compra = await pedir('POST', '/api/market/' + mio.id + '/buy', { quantity: 2 }, b.cookie)
    check('se puede comprar', compra.status === 200, compra.raw.slice(0, 120))
    const trasComprar = await objetosHoy()
    check('comprar no cuenta como crear', trasComprar.creadosHoy === trasPublicar.creadosHoy,
      `${trasPublicar.creadosHoy} → ${trasComprar.creadosHoy}`)
    // Y lo que SÍ tiene que moverse: el volumen del mercado.
    const eco = await economia()
    check('la venta sí suma volumen de mercado', eco.mercado.volumenTotal > 0, String(eco.mercado.volumenTotal))
    check('y aparece el precio pagado de ese objeto',
      eco.mercado.preciosPagados.some(p => p.itemId === 'iron_ore' && p.precioMedioPagado > 0),
      JSON.stringify(eco.mercado.preciosPagados).slice(0, 140))
  }

  console.log('\n── LA CURVA POR HORA LO TRAE TODO ──')
  const adm = await pedir('GET', '/api/admin/analytics', null, null, { 'x-admin-token': ADMIN })
  check('el informe de administración responde', adm.status === 200, String(adm.status))
  const curva = (adm.body || {}).economia || []
  check('la curva tiene horas', curva.length > 0, String(curva.length))
  const ultima = curva[curva.length - 1] || {}
  for (const campo of ['objetosCreados', 'objetosDestruidos', 'objetosNetos', 'mercadoVentas', 'mercadoVolumen']) {
    check('la curva trae ' + campo, typeof ultima[campo] === 'number', JSON.stringify(ultima).slice(0, 140))
  }
  check('la hora actual registró objetos creados', ultima.objetosCreados > 0, String(ultima.objetosCreados))
  check('y el volumen de mercado de esta hora', ultima.mercadoVolumen > 0, String(ultima.mercadoVolumen))

  console.log('\n── LA PÁGINA PÚBLICA LO ENSEÑA ──')
  // Que el servidor calcule un número que nadie ve no sirve de nada.
  // Esta es la lección que este repositorio ya aprendió dos veces: un
  // endpoint que responde 200 no es una función terminada.
  const pag = await pedir('GET', '/economia.html')
  check('la página de economía se sirve', pag.status === 200, String(pag.status))
  const html = pag.raw
  check('tiene la tabla de objetos creados y destruidos', /id="objetos"/.test(html))
  check('y la de lo que de verdad se paga', /id="pagados"/.test(html))
  check('lee el apartado de objetos del informe', /d\.objetos\.ultimos14dias/.test(html))
  check('y el precio pagado del mercado', /d\.mercado\.preciosPagados/.test(html))
  check('el resumen enseña el volumen del mercado', /Volumen del mercado/.test(html))
  check('y los objetos creados hoy', /Objetos creados hoy/.test(html))

  console.log('\n── Y LA PÁGINA LO PINTA DE VERDAD ──')
  // Que el texto esté en el HTML no prueba que el script funcione. Esta
  // es la lección que el repositorio ya tiene escrita en
  // test-arena-navegador.js: si la prueba no EJECUTA el código de la
  // página, no está probando la página. Aquí se ejecuta con un DOM de
  // mentira y el `fetch` apuntando al servidor de verdad.
  const tablas = {}
  const tarjetas = {}
  const errores = []
  const ventana = {
    console, Math, JSON, Date, Number, String, Array, Object, Promise, setTimeout,
    // El DOM de mentira tiene que traer TODO lo que la página use, no
    // solo lo que a esta prueba le interesa: la página también monta el
    // botón de avisos y escucha eventos. Si falta un método, el script
    // revienta ahí y lo de abajo ni se ejecuta.
    document: {
      getElementById(id) {
        const el = {
          _id: id, textContent: '', value: '', style: {}, classList: { add() {}, remove() {}, toggle() {} },
          addEventListener() {}, removeEventListener() {}, appendChild() {}, focus() {}, click() {},
          set innerHTML(v) { tablas[id] = v }, get innerHTML() { return tablas[id] || '' },
        }
        if (id === 'cards') Object.defineProperty(el, 'innerHTML', { set(v) { tarjetas.html = v }, get() { return tarjetas.html || '' } })
        return el
      },
      querySelector() { return null },
      querySelectorAll() { return [] },
      createElement() { return { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {}, setAttribute() {} } },
      addEventListener() {}, removeEventListener() {},
      body: { appendChild() {}, style: {}, classList: { add() {}, remove() {} } },
      head: { appendChild() {} },
    },
    addEventListener() {}, removeEventListener() {},
    localStorage: { getItem() { return null }, setItem() {}, removeItem() {} },
    location: { href: '/economia.html', pathname: '/economia.html', search: '' },
    fetch(url) {
      return pedir('GET', url).then(r => ({ ok: r.status < 300, status: r.status, json: async () => r.body, text: async () => r.raw }))
    },
  }
  ventana.window = ventana; ventana.globalThis = ventana
  const trozos = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) trozos.push(m[1])
  check('la página trae scripts', trozos.length > 0, String(trozos.length))
  const ctx = vm.createContext(ventana)
  for (let i = 0; i < trozos.length; i++) {
    try { vm.runInContext(trozos[i], ctx, { filename: 'economia-' + i, timeout: 5000 }) }
    catch (e) { errores.push(e.message) }
  }
  check('los scripts se ejecutan sin reventar', errores.length === 0, errores.join(' | ').slice(0, 200))
  // El fetch es asíncrono: se le da tiempo a pintar.
  await dormir(800)
  check('la tabla de objetos se rellena', /Creados/.test(tablas.objetos || ''), (tablas.objetos || '').slice(0, 120))
  check('con los 14 días', ((tablas.objetos || '').match(/<tr>/g) || []).length > 2,
    String(((tablas.objetos || '').match(/<tr>/g) || []).length))
  check('la tabla de precios pagados se rellena', /Precio medio pagado/.test(tablas.pagados || ''),
    (tablas.pagados || '').slice(0, 120))
  check('y el resumen sale con números, no con NaN ni undefined',
    /Objetos creados hoy/.test(tarjetas.html || '') && !/NaN|undefined/.test(tarjetas.html || ''),
    (tarjetas.html || '').slice(0, 200))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test', ADMIN_TOKEN: ADMIN,
      DATA_FILE: '/tmp/cm-test-ecoobj.json', BACKUP_DIR: '/tmp/cm-ecoobj-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 2000)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
