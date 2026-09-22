/**
 * CriptoMundo — las quince pantallas cargan, y llaman a cosas que existen
 * Uso:  PORT=3888 node test-paginas.js --spawn
 *
 * POR QUÉ EXISTE
 * Solo una pantalla —la arena— tenía una prueba que EJECUTARA su código.
 * Las demás se comprobaban mirando el texto del HTML, y eso no distingue
 * una pantalla que funciona de una que revienta en la primera línea.
 *
 * Esta prueba pasa las quince por un DOM de mentira contra un servidor
 * de verdad y vigila tres cosas que se rompen de verdad y en silencio:
 *
 *   1. Que la pantalla no reviente al cargar.
 *   2. Que las rutas /api/… que usa EXISTAN en el servidor. La auditoría
 *      encontró el caso simétrico —endpoints de PvP sin nadie que los
 *      llamara— y este es el que duele más: una pantalla que pide algo
 *      que no está y se queda a medias sin decir por qué.
 *   3. Que cada una declare viewport y que los archivos que enlaza estén.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3888)
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

const PAGINAS = [
  'index.html', 'criptomundo-mundo2d.html', 'criptomundo-combat.html', 'criptomundo-arena.html',
  'criptomundo-huerto.html', 'criptomundo-crafting.html', 'criptomundo-mercado.html',
  'criptomundo-misiones.html', 'criptomundo-mazmorras-pvp.html', 'criptomundo-casas.html',
  'criptomundo-guilds.html', 'criptomundo-hub.html', 'criptomundo-perfil.html',
  'economia.html', 'admin.html',
]
// El mundo 2D monta una escena de Phaser. Ejecutarlo de verdad pide un
// navegador con canvas y WebGL, que aquí no hay. Se comprueba lo que SÍ
// se puede: que su código parsea y que Phaser se sirve desde el propio
// servidor. Fingir un Phaser de mentira daría un verde que no significa
// nada, y eso es peor que no probarlo.
const NECESITA_NAVEGADOR = new Set(['criptomundo-mundo2d.html'])

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
        resolve({ status: res.statusCode, body: j, raw: o, headers: res.headers })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '', headers: {} }))
    if (data) r.write(data)
    r.end()
  })
}

// ── Un DOM de mentira con lo justo ─────────────────────────────────
// Tiene que traer TODO lo que las pantallas usen, no solo lo que a esta
// prueba le interese: si falta un método, el script revienta ahí y lo de
// abajo ni se ejecuta, y el fallo parece de la pantalla cuando es de la
// prueba. Eso ya pasó una vez en test-economia-objetos.
function estiloFalso() {
  return new Proxy({}, {
    get(t, k) {
      if (k === 'setProperty' || k === 'removeProperty') return () => {}
      if (k === 'getPropertyValue') return () => ''
      return t[k] !== undefined ? t[k] : ''
    },
    set(t, k, v) { t[k] = v; return true },
  })
}
function lienzo2d() {
  const nada = () => {}
  return new Proxy({ canvas: { width: 900, height: 600 } }, {
    get(t, k) {
      if (k in t) return t[k]
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} })
      if (k === 'measureText') return () => ({ width: 10 })
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) })
      return nada
    },
    set() { return true },
  })
}
function nodo() {
  return {
    style: estiloFalso(), dataset: {}, value: '', textContent: '', innerHTML: '', className: '',
    checked: false, disabled: false, src: '', href: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {}, insertBefore() {},
    setAttribute() {}, getAttribute() { return null }, removeAttribute() {}, focus() {}, blur() {}, click() {},
    scrollIntoView() {}, closest() { return null }, remove() {}, cloneNode() { return nodo() },
    querySelector() { return nodo() }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 } },
    getContext() { return lienzo2d() },
    children: [], childNodes: [], parentNode: null, offsetWidth: 900, offsetHeight: 600,
    width: 900, height: 600, naturalWidth: 64, naturalHeight: 64, complete: true,
  }
}
function ventana(errores) {
  const doc = {
    getElementById() { return nodo() }, querySelector() { return nodo() }, querySelectorAll() { return [] },
    createElement() { return nodo() }, createTextNode() { return nodo() },
    getElementsByClassName() { return [] }, getElementsByTagName() { return [] },
    addEventListener() {}, removeEventListener() {}, write() {}, writeln() {},
    body: nodo(), head: nodo(), documentElement: nodo(),
    readyState: 'complete', cookie: '', title: '',
  }
  const v = {
    console: { log() {}, warn() {}, info() {}, debug() {}, error(...a) { errores.push('console.error: ' + a.join(' ')) } },
    Math, JSON, Date, Number, String, Array, Object, Boolean, Promise, Error, RegExp, Map, Set,
    parseInt, parseFloat, isNaN, isFinite,
    setTimeout() { return 0 }, clearTimeout() {}, setInterval() { return 0 }, clearInterval() {},
    requestAnimationFrame() { return 0 }, cancelAnimationFrame() {},
    document: doc,
    localStorage: { getItem() { return null }, setItem() {}, removeItem() {}, clear() {} },
    sessionStorage: { getItem() { return null }, setItem() {}, removeItem() {} },
    location: { href: 'http://localhost/', pathname: '/', search: '', hash: '', origin: 'http://localhost', reload() {}, replace() {} },
    navigator: { userAgent: 'prueba', sendBeacon() { return true }, maxTouchPoints: 0, clipboard: { writeText() { return Promise.resolve() } } },
    addEventListener() {}, removeEventListener() {}, postMessage() {},
    alert() {}, confirm() { return true }, prompt() { return '' },
    Image: function () { return nodo() },
    WebSocket: function () { this.send = () => {}; this.close = () => {}; this.addEventListener = () => {} },
    URLSearchParams, URL, encodeURIComponent, decodeURIComponent,
    btoa: s => Buffer.from(String(s)).toString('base64'),
    atob: s => Buffer.from(String(s), 'base64').toString(),
    fetch(url, o) {
      o = o || {}
      return req(o.method || 'GET', String(url).replace('http://localhost', ''), o.body ? JSON.parse(o.body) : null)
        .then(r => ({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body, text: async () => r.raw }))
    },
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    performance: { now: () => Date.now() },
  }
  v.window = v; v.self = v; v.globalThis = v; v.parent = v; v.top = v; v.frames = []
  return v
}
function scriptsDe(html) {
  const out = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

async function run() {
  const u = 'pag' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── LAS QUINCE PANTALLAS SE SIRVEN ──')
  const htmls = {}
  for (const p of PAGINAS) {
    const r = await req('GET', '/' + p)
    htmls[p] = r.raw
    if (r.status !== 200 || r.raw.length < 500) { check(p + ' se sirve', false, r.status + ' · ' + r.raw.length + ' bytes'); continue }
  }
  check('las quince responden con contenido',
    PAGINAS.every(p => (htmls[p] || '').length > 500),
    PAGINAS.filter(p => (htmls[p] || '').length <= 500).join(',') || 'todas')

  console.log('\n── Y NINGUNA REVIENTA AL CARGAR ──')
  const rotas = []
  for (const p of PAGINAS) {
    if (NECESITA_NAVEGADOR.has(p)) continue
    const errores = []
    const ctx = vm.createContext(ventana(errores))
    for (const [i, codigo] of scriptsDe(htmls[p]).entries()) {
      try { vm.runInContext(codigo, ctx, { filename: p + '#' + i, timeout: 5000 }) }
      catch (e) { errores.push(`script ${i}: ${e.message}`) }
    }
    await dormir(120)
    if (errores.length) rotas.push(p + ': ' + errores[0])
  }
  check('ninguna pantalla lanza un error al cargar', rotas.length === 0, rotas.join(' | ').slice(0, 300))

  console.log('\n── LA DEL MUNDO 2D, LO QUE SE PUEDE SIN NAVEGADOR ──')
  const mundo = htmls['criptomundo-mundo2d.html']
  let parsean = 0, noParsean = []
  for (const [i, codigo] of scriptsDe(mundo).entries()) {
    try { new vm.Script(codigo, { filename: 'mundo2d#' + i }); parsean++ }
    catch (e) { noParsean.push(i + ': ' + e.message) }
  }
  check('todo su código parsea', noParsean.length === 0, noParsean.join(' | ').slice(0, 200))
  check('y trae varios scripts', parsean >= 4, String(parsean))
  // Lo importante de esa pantalla: que Phaser salga de AQUÍ. Depender de
  // un servidor de terceros para ver el mundo es regalar el juego a la
  // red, y este proyecto ya perdió una versión con el WebSocket por algo
  // parecido.
  const iLocal = mundo.indexOf('/assets/vendor/phaser.min.js')
  const iCdn = mundo.indexOf('cdnjs.cloudflare.com')
  check('Phaser se enlaza desde el propio servidor', iLocal > 0, String(iLocal))
  check('y el CDN queda DESPUÉS, solo de respaldo', iCdn === -1 || iCdn > iLocal, `local ${iLocal} · cdn ${iCdn}`)
  const ph = await req('GET', '/assets/vendor/phaser.min.js')
  check('el Phaser local se sirve de verdad', ph.status === 200 && ph.raw.length > 100000,
    ph.status + ' · ' + ph.raw.length + ' bytes')

  console.log('\n── LO QUE PIDEN LAS PANTALLAS EXISTE EN EL SERVIDOR ──')
  // El caso simétrico del que encontró la auditoría. Allí había endpoints
  // sin nadie que los llamara; aquí se vigila lo contrario, que es lo que
  // duele: una pantalla que pide algo que no está se queda a medias sin
  // decir por qué.
  const fuentes = fs.readdirSync(path.join(__dirname, 'src', 'pages'))
    .map(f => fs.readFileSync(path.join(__dirname, 'src', 'pages', f), 'utf8')).join('\n')
  const servidor = fs.readdirSync(path.join(__dirname, 'src', 'server'))
    .map(f => fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8')).join('\n')
  const usadas = [...new Set((fuentes.match(/\/api\/[a-zA-Z0-9/_-]*/g) || [])
    .map(s => s.replace(/\/$/, '')).filter(s => s.length > 5))]
  check('se encontraron rutas de API en las pantallas', usadas.length > 30, String(usadas.length))
  const huerfanas = usadas.filter(r => {
    if (servidor.includes(`'${r}'`)) return false
    // Rutas con un id por medio: /api/market/<id>/buy y similares.
    if (new RegExp(`\\^\\\\/api\\\\${r.split('/').slice(0, 3).join('\\\\/')}`).test(servidor)) return false
    const raiz = r.split('/').slice(0, 3).join('/')
    return !servidor.includes(`'${raiz}'`) && !servidor.includes(`startsWith('${raiz}`)
  })
  check('ninguna pantalla llama a una ruta que no existe', huerfanas.length === 0, huerfanas.join(', '))

  console.log('\n── MÓVIL: TODAS DECLARAN VIEWPORT ──')
  const sinViewport = PAGINAS.filter(p => !/name="viewport"/.test(htmls[p] || ''))
  check('las quince declaran viewport', sinViewport.length === 0, sinViewport.join(', '))
  const sinEscala = PAGINAS.filter(p => /name="viewport"/.test(htmls[p] || '') && !/initial-scale/.test(htmls[p] || ''))
  check('y todas fijan la escala inicial', sinEscala.length === 0, sinEscala.join(', '))

  console.log('\n── LOS ARCHIVOS QUE ENLAZAN ESTÁN ──')
  const enlaces = new Set()
  for (const p of PAGINAS) {
    for (const m of (htmls[p] || '').matchAll(/(?:src|href)="(\/assets\/[^"']+)"/g)) enlaces.add(m[1])
  }
  check('las pantallas enlazan archivos locales', enlaces.size > 0, String(enlaces.size))
  const faltan = []
  for (const e of enlaces) {
    const r = await req('GET', e)
    if (r.status !== 200) faltan.push(e + ' → ' + r.status)
  }
  check('ninguno da 404', faltan.length === 0, faltan.join(', '))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-paginas.json', '/tmp/cm-paginas-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test', ADMIN_TOKEN: 'prueba',
      DATA_FILE: '/tmp/cm-test-paginas.json', BACKUP_DIR: '/tmp/cm-paginas-b',
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
