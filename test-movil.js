/**
 * CriptoMundo v8 — pruebas de uso en móvil
 * Uso: PORT=3983 node test-movil.js --spawn
 *
 * No renderiza nada (haría falta un navegador). Comprueba lo que sí se
 * puede comprobar sin uno: que cada página declara viewport, que trae
 * las reglas móviles, y que ninguna deja una rejilla de tres columnas
 * fijas sin su correspondiente anulación.
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

const PAGINAS = [
  '', 'criptomundo-mundo2d.html', 'criptomundo-combat.html', 'criptomundo-crafting.html',
  'criptomundo-mercado.html', 'criptomundo-misiones.html', 'criptomundo-mazmorras-pvp.html',
  'criptomundo-casas.html', 'criptomundo-guilds.html', 'criptomundo-hub.html',
  'criptomundo-perfil.html', 'criptomundo-arena.html', 'criptomundo-huerto.html',
  'economia.html', 'admin.html',
]

const get = p => new Promise(res => http.get(`http://localhost:${PORT}/${p}`, x => {
  let o = ''; x.on('data', c => o += c); x.on('end', () => res({ status: x.statusCode, body: o }))
}))

async function run() {
  console.log('\n── DECLARACIÓN DE VIEWPORT ──')
  const paginas = {}
  for (const p of PAGINAS) {
    const r = await get(p)
    paginas[p || 'index'] = r.body
    if (r.status !== 200) { check(`${p || 'index'} se sirve`, false, `status ${r.status}`); continue }
  }
  const sinViewport = Object.entries(paginas).filter(([, b]) => !/name=["']viewport["']/.test(b)).map(([k]) => k)
  check('todas las páginas declaran viewport', sinViewport.length === 0, sinViewport.join(', '))

  const sinEscala = Object.entries(paginas).filter(([, b]) => /user-scalable=no|maximum-scale=1/.test(b)).map(([k]) => k)
  check('ninguna impide hacer zoom', sinEscala.length === 0, sinEscala.join(', '))

  console.log('\n── REGLAS MÓVILES ──')
  const sinMedia = Object.entries(paginas).filter(([, b]) => !/@media[^{]*max-width/.test(b)).map(([k]) => k)
  check('todas traen reglas para pantalla estrecha', sinMedia.length === 0, sinMedia.join(', '))

  const sinBloque = Object.entries(paginas).filter(([, b]) => !b.includes('CSS-MOVIL:INICIO')).map(([k]) => k)
  check('todas llevan el bloque compartido', sinBloque.length === 0, sinBloque.join(', '))

  const duplicado = Object.entries(paginas).filter(([, b]) => (b.match(/CSS-MOVIL:INICIO/g) || []).length > 1).map(([k]) => k)
  check('el bloque no está duplicado en ninguna', duplicado.length === 0, duplicado.join(', '))

  console.log('\n── COLUMNAS FIJAS ──')
  // Una página con tres columnas fijas y sin anulación queda inservible
  // en un teléfono: el contenido central se reduce a unos pocos píxeles.
  const rotas = []
  for (const [nombre, body] of Object.entries(paginas)) {
    const tresColumnas = /grid-template-columns\s*:\s*\d{3}px\s+1fr\s+\d{3}px/.test(body)
    const anulado = /\.layout[^{]*\{[^}]*display:\s*block\s*!important/.test(body) || body.includes('CSS-MOVIL:INICIO')
    if (tresColumnas && !anulado) rotas.push(nombre)
  }
  check('ninguna página deja columnas fijas sin anular', rotas.length === 0, rotas.join(', '))

  console.log('\n── OBJETIVOS TÁCTILES ──')
  const sinTactil = Object.entries(paginas)
    .filter(([k]) => k !== 'economia.html' && k !== 'admin.html')
    .filter(([, b]) => !/min-height:\s*4\dpx/.test(b)).map(([k]) => k)
  check('los botones tienen altura mínima táctil', sinTactil.length === 0, sinTactil.join(', '))

  console.log('\n── LAUNCHER ──')
  const idx = paginas.index
  check('el chat pasa a pantalla completa en móvil', /\.notif-panel\s*\{\s*width:\s*100%/.test(idx))
  check('Primeros pasos pasa a barra inferior', /\.pp-panel\s*\{[^}]*left:\s*0/.test(idx))
  check('se ocultan los elementos que no caben', /\.gtb-zone[^}]*display:\s*none|\.gtb-sep,\s*\.gtb-zone/.test(idx))

  console.log('\n── CONTROLES TÁCTILES ──')
  const mundo = paginas['criptomundo-mundo2d.html']
  check('el mapa trae mando táctil', /id="joystick"/.test(mundo) && /btn-accion/.test(mundo))
  check('el mando solo sale en pantallas táctiles', /pointer:\s*coarse/.test(mundo))
  check('el joystick no bloquea el gesto del navegador por error', /touch-action:\s*none/.test(mundo))
  check('hay zona muerta para el dedo quieto', /zona muerta|< 6/.test(mundo))
  check('el mapa ya no dice que solo se juega con teclado', !/Usa WASD o flechas para moverte/.test(mundo))

  console.log('\n── MAPA CON MUNDO GRANDE ──')
  check('la zona es mayor que la pantalla', /this\.MW = \d{4}/.test(mundo))
  check('la cámara sigue al jugador', /startFollow/.test(mundo))
  check('los edificios son sólidos', /chocaCon\(/.test(mundo))
  check('se desliza a lo largo de las paredes', /chocaCon\(nx, this\.py\)/.test(mundo) && /chocaCon\(this\.px, ny\)/.test(mundo))
  check('se entra por el lado opuesto al salir', /entradas\[lado\]/.test(mundo))
  check('el minimapa muestra la posición dentro de la zona', /escenaMundo/.test(mundo))
  check('el terreno se genera con semilla fija', /pintarTerreno/.test(mundo) && /ruido\(/.test(mundo))
  check('cada zona tiene decorado propio', /densidadDecor/.test(mundo))

  console.log('\n── EL INYECTOR ES REPETIBLE ──')
  const fs = require('fs')
  const path = require('path')
  const { execFileSync } = require('child_process')
  const antes = fs.readFileSync(path.join(__dirname, 'src/pages/criptomundo-mercado.js'), 'utf8')
  execFileSync('node', [path.join(__dirname, 'aplicar-css-movil.js')], { cwd: __dirname })
  const despues = fs.readFileSync(path.join(__dirname, 'src/pages/criptomundo-mercado.js'), 'utf8')
  check('volver a aplicarlo no cambia nada', antes === despues)

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-movil.json', '/tmp/cm-movil-b')
  const c = spawn('node', [__dirname + '/criptomundo.js'],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-movil.json', BACKUP_DIR: '/tmp/cm-movil-b' }, stdio: 'ignore' })
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
