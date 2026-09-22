/**
 * CriptoMundo v15 — pruebas de concurrencia
 * Uso: PORT=3988 node test-concurrencia.js --spawn
 *
 * Todo lo que mueve oro u objetos se comprueba disparando varias
 * peticiones A LA VEZ, no una detrás de otra. Es la diferencia entre
 * "el código parece correcto" y "no se puede duplicar dinero".
 *
 * El servidor es de un solo hilo y sus manejadores no tienen `await`
 * después de leer el cuerpo, así que en teoría cada operación es
 * atómica. Esto lo verifica en la práctica, que es lo que cuenta.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body, cookie, headers = {}) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = Object.assign({ 'Content-Type': 'application/json' }, headers)
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : cookie }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data)
    r.end()
  })
}

const nuevo = async () => {
  const n = 'Conc' + Math.floor(Math.random() * 1e9)
  const r = await req('POST', '/api/auth/register', { username: n, email: n + '@t.com', password: 'clave-segura-1' })
  return { cookie: r.cookie, nombre: n }
}
const oro = async cookie => (await req('GET', '/api/player', null, cookie)).body.character.gold
const cuantos = async (cookie, itemId) => {
  const inv = (await req('GET', '/api/inventory', null, cookie)).body.inventory || []
  return inv.filter(i => i.itemId === itemId).reduce((a, i) => a + i.quantity, 0)
}

async function run() {
  console.log('\n── COMPRA SIMULTÁNEA DE LA ÚLTIMA UNIDAD ──')
  const vendedor = await nuevo()
  const a = await nuevo()
  const b = await nuevo()

  // El vendedor publica UNA unidad. Dos compradores van a por ella a la vez.
  const pub = await req('POST', '/api/market', { itemId: 'herb', quantity: 1, pricePerUnit: 10 }, vendedor.cookie)
  const listado = pub.body.listing
  check('se publica una unidad', !!listado)

  const [c1, c2] = await Promise.all([
    req('POST', `/api/market/${listado.id}/buy`, { quantity: 1 }, a.cookie),
    req('POST', `/api/market/${listado.id}/buy`, { quantity: 1 }, b.cookie),
  ])
  const compras = [c1, c2].filter(r => r.status === 200).length
  check('solo una de las dos compras prospera', compras === 1, `prosperaron ${compras}`)

  // Cada personaje nace con 8 hierbas: 16 entre los dos, más la comprada.
  const recibidas = (await cuantos(a.cookie, 'herb')) + (await cuantos(b.cookie, 'herb'))
  check('no se entrega el objeto dos veces', recibidas === 17, `hierbas totales ${recibidas}`)

  const mercado = (await req('GET', '/api/market')).body.listings || []
  check('la publicación ya no aparece disponible', !mercado.some(l => l.id === listado.id))

  console.log('\n── CANCELAR Y COMPRAR A LA VEZ ──')
  const v2 = await nuevo()
  const comprador = await nuevo()
  const pub2 = (await req('POST', '/api/market', { itemId: 'herb', quantity: 2, pricePerUnit: 10 }, v2.cookie)).body.listing
  const antesV2 = await cuantos(v2.cookie, 'herb')
  const [cancel, compra] = await Promise.all([
    req('POST', `/api/market/${pub2.id}/cancel`, {}, v2.cookie),
    req('POST', `/api/market/${pub2.id}/buy`, { quantity: 2 }, comprador.cookie),
  ])
  const exitos = [cancel, compra].filter(r => r.status === 200).length
  check('cancelar y comprar no pueden ganar los dos', exitos === 1, `${exitos} éxitos`)
  const despuesV2 = await cuantos(v2.cookie, 'herb')
  const delComprador = await cuantos(comprador.cookie, 'herb')
  check('el objeto acaba en un solo inventario',
    (cancel.status === 200 && despuesV2 === antesV2 + 2 && delComprador === 8) ||
    (compra.status === 200 && despuesV2 === antesV2 && delComprador === 10),
    `vendedor ${antesV2}→${despuesV2}, comprador ${delComprador}`)

  console.log('\n── RECOMPENSA DE PRIMEROS PASOS ──')
  const c = await nuevo()
  let vivo = true
  for (let i = 0; i < 25 && vivo; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' }, c.cookie)
    if (r.status === 200 && r.body.enemyDied) vivo = false
    else await sleep(380)
  }
  const oroAntes = await oro(c.cookie)
  const cobros = await Promise.all(Array.from({ length: 5 }, () =>
    req('POST', '/api/onboarding/claim', { id: 'p_combate' }, c.cookie)))
  const pagados = cobros.filter(r => r.status === 200).length
  check('cinco cobros simultáneos pagan una sola vez', pagados === 1, `pagaron ${pagados}`)
  const oroDespues = await oro(c.cookie)
  check('el oro solo sube una vez', oroDespues - oroAntes === 100, `+${oroDespues - oroAntes}`)

  console.log('\n── MISMA CLAVE DE IDEMPOTENCIA EN PARALELO ──')
  const d = await nuevo()
  const clave = 'k' + Math.random().toString(36).slice(2)
  const listado3 = (await req('POST', '/api/market', { itemId: 'herb', quantity: 5, pricePerUnit: 5 }, vendedor.cookie)).body.listing
  const oroD0 = await oro(d.cookie)
  await Promise.all(Array.from({ length: 4 }, () =>
    req('POST', `/api/market/${listado3.id}/buy`, { quantity: 1 }, d.cookie, { 'Idempotency-Key': clave })))
  const oroD1 = await oro(d.cookie)
  const hierbasD = await cuantos(d.cookie, 'herb')
  check('con la misma clave no se cobra de más', oroD0 - oroD1 <= 5, `pagó ${oroD0 - oroD1}`)
  check('con la misma clave no se entrega de más', hierbasD <= 9, `hierbas ${hierbasD}`)

  console.log('\n── GREMIOS ──')
  const g1 = await nuevo()
  const g2 = await nuevo()
  const nombre = 'Gremio' + Math.floor(Math.random() * 1e9)
  // Ninguno tiene los 5000 de oro: las dos creaciones deben fallar igual
  const [r1, r2] = await Promise.all([
    req('POST', '/api/guilds', { action: 'create', name: nombre }, g1.cookie),
    req('POST', '/api/guilds', { action: 'create', name: nombre }, g2.cookie),
  ])
  check('sin oro no se crea el gremio por mucho que se insista', r1.status !== 201 && r2.status !== 201)

  const gremios = (await req('GET', '/api/guilds')).body.guilds || []
  const primero = gremios[0]
  const [j1, j2] = await Promise.all([
    req('POST', '/api/guilds', { action: 'join', guildId: primero.id }, g1.cookie),
    req('POST', '/api/guilds', { action: 'join', guildId: primero.id }, g1.cookie),
  ])
  const unido = [j1, j2].filter(r => r.status === 200).length
  check('el mismo jugador no se une dos veces al mismo gremio', unido === 1, `${unido} uniones`)

  console.log('\n── MAZMORRA ──')
  const e = await nuevo()
  const inicios = await Promise.all(Array.from({ length: 3 }, () =>
    req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' }, e.cookie)))
  // El invariante que importa: nunca puede haber dos runs activas a la
  // vez, ni aunque se pidan tres a la vez. (Un personaje nuevo es de
  // nivel 1 y la Cripta pide 5, así que lo normal es que sean cero.)
  const abiertas = inicios.filter(r => r.status === 200).length
  check('varios inicios a la vez no abren varias runs', abiertas <= 1, `${abiertas} runs`)
  const retiradas = await Promise.all(Array.from({ length: 3 }, () =>
    req('POST', '/api/mazmorra/retirarse', {}, e.cookie)))
  const cobradas = retiradas.filter(r => r.status === 200).length
  check('retirarse tres veces a la vez solo cobra una', cobradas <= 1, `${cobradas} cobros`)

  console.log('\n── RECOMPENSA DE MAZMORRA (la prueba cara) ──')
  // Esta es la que de verdad importa: una run completada da oro, XP y
  // botín. Si tres "completar" simultáneos pagaran tres veces, sería
  // una fábrica de dinero. Cuesta un minuto de grindeo, pero vale.
  const f = await nuevo()
  let nivel = 1
  // El presupuesto de golpes depende de lo que dure una pelea, así que
  // el paso 10 lo dejó corto: una araña pasó de morir en 3,4 turnos a
  // morir en 6,3, o sea de 54 XP por turno a 29. Con 120 golpes ya no
  // se llegaba a nivel 5 y esta prueba fallaba sin que hubiera nada
  // roto. Lo que mide es que completar una mazmorra no pague tres
  // veces; el grindeo solo es el peaje para llegar hasta ahí.
  for (let i = 0; i < 300 && nivel < 5; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' }, f.cookie)
    if (r.status === 200) {
      if (r.body.newLevel) nivel = r.body.newLevel
      if (r.body.playerDied) await req('POST', '/api/player/respawn', {}, f.cookie)
    }
    await sleep(370)
  }
  check('el personaje llega a nivel 5 para entrar a la Cripta', nivel >= 5, `nivel ${nivel}`)

  // ── LA COMPROBACIÓN QUE NUNCA SE HABÍA EJECUTADO ────────────────
  //
  // Aquí había un bloque contra `/api/dungeon` con ids en inglés
  // (`dng_crypt`, acciones `start`/`floor`/`complete`). Esa API no
  // existe: la real es /api/mazmorra/{entrar,sala,retirarse} con ids en
  // español. Y como el personaje nunca llegaba a nivel 5, el bloque
  // quedaba dentro de un `if` que no se cumplía jamás, así que el error
  // no salía a la luz.
  //
  // Peor: las dos comprobaciones de arriba se hacen con un personaje de
  // nivel 1, que NO PUEDE entrar a la Cripta (pide 5). O sea que
  // "varios inicios a la vez no abren varias runs" pasaba contando
  // cero runs, y "retirarse tres veces solo cobra una" contando cero
  // cobros. Verde las dos, sin haber probado nada.
  //
  // Total: el invariante que este archivo llama "el que de verdad
  // importa" —que una mazmorra no pague dos veces— no se había
  // comprobado nunca. Ahora sí, con un personaje que llega a nivel 5 y
  // contra la API que existe.
  if (nivel >= 5) {
    const entrada = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' }, f.cookie)
    check('un personaje de nivel 5 sí entra a la Cripta', entrada.status === 200,
      entrada.status + ' ' + JSON.stringify(entrada.body).slice(0, 120))

    if (entrada.status === 200) {
      // Entrar otra vez estando dentro no puede abrir una segunda run.
      const dobles = await Promise.all(Array.from({ length: 3 }, () =>
        req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' }, f.cookie)))
      check('estando dentro, tres entradas a la vez no abren otra run',
        dobles.every(r => r.status !== 200), dobles.map(r => r.status).join(','))

      const oroPrevio = await oro(f.cookie)
      // Retirarse es lo que paga. Tres a la vez tienen que pagar UNA.
      const cobros = await Promise.all(Array.from({ length: 3 }, () =>
        req('POST', '/api/mazmorra/retirarse', {}, f.cookie)))
      const ok = cobros.filter(r => r.status === 200)
      check('tres retiradas simultáneas cobran una sola vez', ok.length === 1,
        ok.length + ' cobros de 3')

      const ganado = (await oro(f.cookie)) - oroPrevio
      const pagado = ok[0] && ok[0].body.fin ? (ok[0].body.fin.oro || 0) : 0
      check('el oro que llega es el de una sola retirada', ganado === pagado,
        'recibió ' + ganado + ', la run pagó ' + pagado)
      check('y al salir ya no hay ninguna run abierta',
        !(await req('GET', '/api/mazmorra', {}, f.cookie)).body.run)
    }
  }

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-conc.json', '/tmp/cm-conc-b')
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, REGISTER_LIMIT_PER_HOUR: '200', DATA_FILE: '/tmp/cm-conc.json', BACKUP_DIR: '/tmp/cm-conc-b' }, stdio: 'ignore' })
  // El servidor se mataba en un .finally() detrás de run(), y run()
  // termina en process.exit(): ese .finally() NO llega a ejecutarse
  // nunca, así que cada ejecución dejaba un servidor vivo con su
  // puerto ocupado. La siguiente no podía escuchar ahí, hablaba sin
  // saberlo con el servidor viejo —con las cuentas y los contadores de
  // la anterior— y fallaba por cosas que no tenían nada que ver.
  // 'exit' sí se dispara con process.exit().
  process.on('exit', () => { try { c.kill() } catch {} })
  esperarServidor(PORT).then(() => run().finally(() => c.kill()))
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
