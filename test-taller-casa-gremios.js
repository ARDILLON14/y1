/**
 * CriptoMundo v3.1 — pruebas de taller, casa y gremios
 * Uso: PORT=3977 node test-taller-casa-gremios.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  await req('POST', '/api/auth/register', { username: `Taller${rand}`, email: `t${rand}@t.com`, password: 'clave-segura-1' })

  console.log('\n── TALLER ──')
  let r = await req('GET', '/api/crafting')
  check('el catálogo de recetas viene del servidor', (r.body.recipes || []).length > 0)
  check('las recetas traen el objeto resultante', !!r.body.recipes[0].outputItem)

  r = await req('POST', '/api/crafting', { recipeId: 'rec_potion', quantity: 2 })
  check('fabricar consume materiales y devuelve resultado', r.status === 200 && r.body.made > 0, JSON.stringify(r.body))

  r = await req('POST', '/api/crafting', { recipeId: 'rec_chest', quantity: 1 })
  check('receta por encima del nivel rechazada', r.status === 403)

  r = await req('POST', '/api/crafting', { recipeId: 'receta_falsa', quantity: 1 })
  check('receta inexistente rechazada', r.status === 404)

  r = await req('POST', '/api/crafting', { recipeId: 'rec_potion', quantity: 99999 })
  check('cantidad excesiva rechazada', r.status === 400)

  console.log('\n── CASA ──')
  r = await req('GET', '/api/house')
  check('la casa viene del servidor', r.status === 200 && !!r.body.house)
  const gold0 = (await req('GET', '/api/player')).body.character.gold

  r = await req('POST', '/api/house', { action: 'buy', furnitureId: 'bed', cost: 1, placed: [{ furnitureId: 'bed', gridX: 1, gridY: 1 }] })
  const gold1 = (await req('GET', '/api/player')).body.character.gold
  check('el precio del mueble lo pone el servidor, no el cliente', gold0 - gold1 === 80, `pagó ${gold0 - gold1}`)
  check('el diseño se guarda con la compra', (r.body.placed || []).length === 1)

  r = await req('POST', '/api/house', { action: 'buy', furnitureId: 'nave_espacial' })
  check('mueble inexistente rechazado', r.status === 404)

  r = await req('POST', '/api/house', { action: 'save', placed: [{ furnitureId: 'throne', gridX: 0, gridY: 0 }] })
  check('no se puede colocar un mueble no comprado', (r.body.placed || []).length === 0)

  r = await req('POST', '/api/house', { action: 'buy', furnitureId: 'throne' })
  check('mueble caro sin oro suficiente rechazado', r.status === 400)

  console.log('\n── GREMIOS ──')
  r = await req('GET', '/api/guilds')
  const guilds = r.body.guilds || []
  check('el directorio de gremios viene del servidor', guilds.length > 0)

  r = await req('POST', '/api/guilds', { action: 'create', name: `Prueba${rand}` })
  check('crear sin los 5000 de oro rechazado', r.status === 400)

  r = await req('POST', '/api/guilds', { action: 'join', guildId: guilds[0].id })
  check('unirse a un gremio', r.status === 200)

  r = await req('POST', '/api/guilds', { action: 'join', guildId: guilds[1].id })
  check('no se puede estar en dos gremios', r.status === 409)

  r = await req('POST', '/api/guilds', { action: 'donate', amount: -500 })
  check('donación negativa rechazada', r.status === 400)

  r = await req('POST', '/api/guilds', { action: 'donate', amount: 50 })
  check('donar suma al tesoro', r.status === 200 && r.body.treasury.gold >= 50)

  r = await req('POST', '/api/guilds', { action: 'kick', target: 'alguien' })
  check('expulsar sin permisos rechazado', r.status === 403 || r.status === 404)

  r = await req('POST', '/api/guilds', { action: 'leave' })
  check('salir del gremio', r.status === 200)

  console.log('\n── PÁGINAS ──')
  for (const p of ['criptomundo-crafting.html', 'criptomundo-casas.html', 'criptomundo-guilds.html', 'criptomundo-mercado.html']) {
    const res = await new Promise(r2 => http.get(`http://localhost:${PORT}/${p}`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2({ status: x.statusCode, body: o })) }))
    check(`${p} se sirve sin datos de ejemplo`, res.status === 200 && !/MY_INVENTORY|makeListings|Default starter layout/.test(res.body))
  }

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-taller-')
  const c = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-taller-' + Date.now() + '.json' }, stdio: 'ignore' })
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
