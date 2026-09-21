/**
 * CriptoMundo v13 — pruebas de la capa de red del cliente
 * Uso: PORT=3986 node test-red-cliente.js --spawn
 *
 * La capa vive en el navegador, así que aquí se comprueban dos cosas:
 *   1. que está inyectada en todas las páginas y es JavaScript válido
 *   2. que su lógica hace lo que dice, ejecutándola en Node con un
 *      `fetch` falso que simula caídas
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

const PAGINAS = ['', 'criptomundo-combat.html', 'criptomundo-mercado.html', 'criptomundo-mundo2d.html',
  'criptomundo-misiones.html', 'criptomundo-crafting.html', 'criptomundo-guilds.html',
  'criptomundo-casas.html', 'criptomundo-mazmorras-pvp.html', 'criptomundo-perfil.html', 'criptomundo-hub.html']

const get = p => new Promise(res => http.get(`http://localhost:${PORT}/${p}`, x => {
  let o = ''; x.on('data', c => o += c); x.on('end', () => res({ status: x.statusCode, body: o }))
}))

// ── Entorno de navegador de mentira para ejecutar la capa ──────────
function montarCapa(fetchFalso) {
  const src = fs.readFileSync(path.join(__dirname, 'aplicar-red-cliente.js'), 'utf8')
  const codigo = src.slice(src.indexOf('(function () {'), src.lastIndexOf('})()') + 4)

  const avisos = []
  const el = { className: '', innerHTML: '', appendChild() {}, }
  const ctx = {
    window: {
      fetch: fetchFalso,
      addEventListener() {},
    },
    document: {
      getElementById: () => el,
      createTextNode: t => { avisos.push(t); return {} },
      createElement: () => ({ style: {}, onclick: null }),
    },
    setTimeout, clearTimeout, location: { reload() {} },
  }
  ctx.window.document = ctx.document
  vm.createContext(ctx)
  vm.runInContext(codigo, ctx)
  return { fetch: ctx.window.fetch, avisos }
}

async function run() {
  console.log('\n── INYECCIÓN ──')
  const paginas = {}
  for (const p of PAGINAS) paginas[p || 'index'] = (await get(p)).body

  const sinCapa = Object.entries(paginas).filter(([, b]) => !b.includes('__redCliente')).map(([k]) => k)
  check('la capa está en todas las páginas de juego', sinCapa.length === 0, sinCapa.join(', '))

  const duplicada = Object.entries(paginas).filter(([, b]) => (b.match(/RED-CLIENTE:INICIO/g) || []).length > 1).map(([k]) => k)
  check('no está duplicada en ninguna', duplicada.length === 0, duplicada.join(', '))

  const sinAviso = Object.entries(paginas).filter(([, b]) => !b.includes('id="aviso-red"')).map(([k]) => k)
  check('todas tienen el hueco del aviso', sinAviso.length === 0, sinAviso.join(', '))

  check('el aviso se anuncia a lectores de pantalla', /aria-live="polite"/.test(paginas.index))
  check('hay foco visible para navegar con teclado', /focus-visible/.test(paginas.index))

  console.log('\n── REINTENTOS ──')
  let intentos = 0
  let capa = montarCapa(async () => { intentos++; if (intentos < 3) throw new Error('ECONNREFUSED'); return { status: 200 } })
  let r = await capa.fetch('/api/player')
  check('una lectura que falla se reintenta hasta lograrlo', intentos === 3 && r.status === 200, `intentos ${intentos}`)

  intentos = 0
  capa = montarCapa(async () => { intentos++; throw new Error('ECONNREFUSED') })
  let fallo = false
  try { await capa.fetch('/api/market', { method: 'POST' }) } catch { fallo = true }
  check('una escritura NO se reintenta (evita comprar dos veces)', intentos === 1 && fallo, `intentos ${intentos}`)

  intentos = 0
  capa = montarCapa(async () => { intentos++; return { status: 500 } })
  r = await capa.fetch('/api/player')
  check('un 500 en lectura se reintenta', intentos === 3)

  intentos = 0
  capa = montarCapa(async () => { intentos++; return { status: 400 } })
  r = await capa.fetch('/api/player')
  check('un 400 no se reintenta (el error es del cliente)', intentos === 1 && r.status === 400)

  console.log('\n── AVISOS ──')
  capa = montarCapa(async () => { throw new Error('ECONNREFUSED') })
  try { await capa.fetch('/api/player') } catch {}
  check('avisa cuando se pierde la conexión', capa.avisos.some(t => /Sin conexión/.test(t)), JSON.stringify(capa.avisos))
  check('advierte de que puede haberse perdido algo', capa.avisos.some(t => /pueden no haberse guardado/.test(t)))

  let caidas = 2
  capa = montarCapa(async () => { if (caidas-- > 0) throw new Error('ECONNREFUSED'); return { status: 200 } })
  try { await capa.fetch('/api/player', { method: 'POST' }) } catch {}
  await capa.fetch('/api/player')
  check('avisa cuando la conexión vuelve', capa.avisos.some(t => /restablecida/.test(t)), JSON.stringify(capa.avisos))

  console.log('\n── NO SE PISA A SÍ MISMA ──')
  const src = fs.readFileSync(path.join(__dirname, 'aplicar-red-cliente.js'), 'utf8')
  check('la capa se protege de aplicarse dos veces', /if \(window\.__redCliente\) return/.test(src))

  const antes = fs.readFileSync(path.join(__dirname, 'src/pages/criptomundo-mercado.js'), 'utf8')
  require('child_process').execFileSync('node', [path.join(__dirname, 'aplicar-red-cliente.js')], { cwd: __dirname })
  const despues = fs.readFileSync(path.join(__dirname, 'src/pages/criptomundo-mercado.js'), 'utf8')
  check('reaplicar el inyector no cambia nada', antes === despues)

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-red.json', BACKUP_DIR: '/tmp/cm-red-b' }, stdio: 'ignore' })
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
