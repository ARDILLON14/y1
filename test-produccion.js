/**
 * CriptoMundo — la puerta de pruebas está cerrada en producción
 * Uso:  PORT=3872 node test-produccion.js --spawn
 *
 * POR QUÉ EXISTE
 * /api/dev/dar reparte objetos gratis. Es cómodo para probar el juego y
 * catastrófico si algún día se arranca el servidor de verdad y sigue
 * ahí. La guarda es una línea (`if (IS_PROD) return 404`) y las líneas
 * de una en una se borran sin querer: por eso hay una prueba que
 * arranca el servidor CON NODE_ENV=production y comprueba que la ruta
 * ni siquiera admite existir.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3872)
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

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

async function run() {
  console.log('\n── SERVIDOR EN MODO PRODUCCIÓN ──')
  const u = 'prod' + Math.floor(Math.random() * 1e6)
  const reg = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  check('el servidor de producción funciona con normalidad', reg.status === 201 || reg.status === 200, String(reg.status))

  const dar = await req('POST', '/api/dev/dar', { itemId: 'espada_diamante', quantity: 1 })
  check('/api/dev/dar no existe (404), ni siquiera para un usuario válido',
    dar.status === 404, 'HTTP ' + dar.status + ' ' + dar.raw.slice(0, 60))

  const inv = (await req('GET', '/api/inventory')).body
  check('y no ha caído ninguna espada en el inventario',
    !(inv.inventory || []).some(i => i.itemId === 'espada_diamante'),
    (inv.inventory || []).map(i => i.itemId).join(','))

  // Que el resto del juego siga en pie en producción: la guarda no
  // puede haberse llevado nada por delante.
  const arena = await req('GET', '/api/arena')
  check('la arena sigue publicando su catálogo en producción',
    arena.status === 200 && (arena.body.armas || []).length > 5, String(arena.status))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-prod.json', '/tmp/cm-prod-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'production', ADMIN_TOKEN: 'prueba',
      DATA_FILE: '/tmp/cm-test-prod.json', BACKUP_DIR: '/tmp/cm-prod-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

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
