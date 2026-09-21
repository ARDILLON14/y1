/**
 * CriptoMundo — el socket no puede acumular conexiones colgadas
 * Uso:  PORT=3940 node test-socket-fugas.js --spawn
 *
 * EL FALLO QUE CAZA
 * Reportado desde la partida: "jugué 2 batallas y me dejó de cargar".
 * El servidor aguanta cuatro batallas seguidas sin despeinarse, así que
 * el problema no estaba ahí.
 *
 * Estaba en el navegador. Cuando algo en medio —un cortafuegos, un
 * antivirus, una VPN— se TRAGA el paquete del WebSocket en vez de
 * rechazarlo, el socket se queda colgado en "conectando" para siempre:
 * no abre, no falla y no se cierra. Y cada batalla creaba uno nuevo:
 *
 *     empezar() -> conectar() -> ws = new WebSocket(...)
 *
 * sin cerrar el anterior. El objeto viejo se perdía pero la conexión
 * seguía abierta, ocupando una de las ~6 ranuras que el navegador da
 * por servidor. Dos o tres batallas después no quedaba ninguna libre y
 * TODAS las peticiones se quedaban en cola: la pantalla dejaba de
 * cargar. No un error, no un mensaje: una espera infinita.
 *
 * Por eso pasaba "como en versiones pasadas": la causa de fondo es la
 * misma de siempre —su red no deja pasar el WebSocket—, solo que ahora
 * además se acumulaba.
 *
 * Esta prueba ejecuta el JavaScript REAL de la página con un WebSocket
 * que se cuelga a propósito, juega varias batallas y cuenta cuántas
 * conexiones quedan colgadas. Si vuelve a acumularlas, falla.
 */
const http = require('http')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3940)
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
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

// ── Un WebSocket que se cuelga, como el del jugador ────────────────
// No abre, no falla, no se cierra. Exactamente lo que hace una red que
// se traga el paquete en vez de contestar que no.
function WebSocketColgado(registro) {
  return function (url) {
    const self = this
    self.url = url
    self.readyState = 0            // CONNECTING, y aquí se queda
    self.onopen = null; self.onmessage = null; self.onclose = null; self.onerror = null
    const entrada = { url, cerrado: false }
    registro.sockets.push(entrada)
    self.send = function () {}
    self.close = function () {
      entrada.cerrado = true
      self.readyState = 3
      if (self.onclose) { try { self.onclose() } catch (e) {} }
    }
  }
}

// ── DOM mínimo, el mismo del arnés de navegador ────────────────────
function crearElemento(id) {
  return {
    id, tagName: 'DIV', textContent: '', innerHTML: '', value: '', disabled: false,
    style: {}, dataset: {}, children: [], firstChild: null, lastChild: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, remove() {},
    appendChild(c) { this.children.push(c); this.lastChild = c; if (!this.firstChild) this.firstChild = c; return c },
    insertBefore(c) { this.children.unshift(c); this.firstChild = c; if (!this.lastChild) this.lastChild = c; return c },
    // Ojo: hay que refrescar lastChild. El registro de la pantalla se
    // poda con "while (children.length > 7) removeChild(lastChild)", y
    // si lastChild se queda apuntando a un nodo ya quitado, el bucle no
    // termina nunca. Colgaba la prueba, no el juego.
    removeChild(c) {
      this.children = this.children.filter(x => x !== c)
      this.firstChild = this.children[0] || null
      this.lastChild = this.children[this.children.length - 1] || null
      return c
    },
    querySelector() { return null }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 } },
    setAttribute() {}, getAttribute() { return null },
  }
}

function contextoCanvas() {
  const PROPS = ['fillStyle', 'strokeStyle', 'font', 'lineWidth', 'lineCap', 'lineJoin',
    'textAlign', 'textBaseline', 'globalAlpha', 'globalCompositeOperation',
    'imageSmoothingEnabled', 'imageSmoothingQuality', 'shadowBlur', 'shadowColor',
    'shadowOffsetX', 'shadowOffsetY', 'miterLimit', 'direction', 'filter',
    'letterSpacing', 'wordSpacing', 'lineDashOffset']
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'canvas') return { width: 900, height: 600 }
      if (prop === 'createRadialGradient') return () => ({ addColorStop() {} })
      if (typeof prop === 'string' && PROPS.includes(prop)) return ''
      return () => {}
    },
    set() { return true },
  })
}

function montarVentana(registro) {
  const elementos = {}
  const lienzo = crearElemento('lienzo')
  lienzo.width = 900; lienzo.height = 600
  lienzo.getContext = () => contextoCanvas()
  lienzo.addEventListener = () => {}
  elementos.lienzo = lienzo

  const documento = {
    getElementById(id) { return elementos[id] || (elementos[id] = crearElemento(id)) },
    createElement(t) { const e = crearElemento(null); e.tagName = String(t).toUpperCase(); return e },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    body: crearElemento('body'), documentElement: crearElemento('html'),
    hidden: false, visibilityState: 'visible',
  }

  const ventana = {
    document: documento,
    location: { protocol: 'http:', host: 'localhost:' + PORT, href: 'http://localhost:' + PORT + '/criptomundo-arena.html', hostname: 'localhost' },
    navigator: { userAgent: 'nodo-prueba', maxTouchPoints: 0 },
    WebSocket: WebSocketColgado(registro),
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Number, String, Boolean, Array, Object, Error, RegExp, Promise, Map, Set,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    requestAnimationFrame(fn) { return setTimeout(() => { try { fn(Date.now()) } catch (e) { registro.errores.push(String(e && e.message)) } }, 30) },
    cancelAnimationFrame: clearTimeout,
    addEventListener() {}, removeEventListener() {},
    focus() {}, alert() {}, postMessage() {},
    Image: function () {
      const img = this
      img.complete = false; img.naturalWidth = 0; img.naturalHeight = 0
      Object.defineProperty(img, 'src', {
        set(v) { img.complete = true; img.naturalWidth = 128; img.naturalHeight = 64; if (img.onload) img.onload() },
        get() { return '' },
      })
    },
    fetch(url, opciones) {
      const o = opciones || {}
      registro.peticiones++
      return new Promise(resolve => {
        req(o.method || 'GET', url, o.body ? JSON.parse(o.body) : null).then(r => {
          resolve({ ok: r.status >= 200 && r.status < 300, status: r.status,
            json: async () => r.body, text: async () => r.raw })
        })
      })
    },
  }
  ventana.window = ventana; ventana.self = ventana; ventana.globalThis = ventana
  ventana.parent = ventana; ventana.top = ventana
  return ventana
}

function scripts(html) {
  const out = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

async function run() {
  const u = 'fg' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  const html = await new Promise(res => http.get({ host: 'localhost', port: PORT, path: '/criptomundo-arena.html' },
    x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))

  const registro = { sockets: [], errores: [], peticiones: 0 }
  const ventana = montarVentana(registro)
  const ctx = vm.createContext(ventana)
  let rotos = 0
  for (const codigo of scripts(html)) {
    try { vm.runInContext(codigo, ctx, { filename: 'arena', timeout: 5000 }) } catch (e) { rotos++; registro.errores.push(e.message) }
  }
  check('la página arranca con un socket que se cuelga', rotos === 0, registro.errores.join(' | ').slice(0, 200))

  console.log('\n── CUATRO BATALLAS CON EL SOCKET COLGADO ──')
  let jugables = 0
  for (let b = 1; b <= 4; b++) {
    ventana.empezar('arena_bosque')
    await sleep(900)
    if (ventana.estado) jugables++
    // Se abandona como lo haría el jugador al terminar y volver al menú.
    await req('POST', '/api/arena/abandon')
    ventana.estado = null
    await sleep(250)
  }
  check('las cuatro batallas se pudieron jugar igualmente', jugables === 4,
    jugables + ' de 4 · (por HTTP, ya que el socket nunca abre)')

  console.log('\n── Y NO SE ACUMULAN CONEXIONES COLGADAS ──')
  const colgados = registro.sockets.filter(s => !s.cerrado)
  console.log('     sockets creados: ' + registro.sockets.length + ' · sin cerrar: ' + colgados.length)
  // El navegador da unas 6 conexiones por servidor. Con una colgada por
  // batalla, a la tercera o cuarta no queda ninguna libre y TODAS las
  // peticiones se quedan en cola: la pantalla deja de cargar.
  check('no queda más de una conexión colgada a la vez',
    colgados.length <= 1, colgados.length + ' colgadas tras 4 batallas (el navegador solo da ~6)')
  check('cada intento nuevo cierra el anterior',
    registro.sockets.length <= 1 || registro.sockets.slice(0, -1).every(s => s.cerrado),
    registro.sockets.map(s => s.cerrado ? 'cerrado' : 'COLGADO').join(', '))

  console.log('\n── EL CÓDIGO LO DICE TAMBIÉN ──')
  check('se cierra el socket anterior antes de abrir otro', /cerrarSocket\(\)/.test(html))
  check('un socket que no abre en unos segundos se descarta',
    /socketVigilante|no abrió/.test(html))
  check('y se deja de insistir cuando se sabe que no va a abrir',
    /socketImposible/.test(html))

  console.log('\n── TRAS UNA BATALLA DE VERDAD, DEJA DE INTENTARLO ──')
  // Arriba las batallas duran menos que el vigilante (4 s), así que el
  // socket todavía se intenta cada vez. Con una batalla de duración
  // normal el vigilante salta, se da por imposible, y a partir de ahí
  // no se abre ni una conexión más en toda la sesión. Eso es lo que
  // hace que el problema no pueda reaparecer jugando de verdad.
  const antesLargo = registro.sockets.length
  ventana.empezar('arena_bosque')
  await sleep(5200)                       // más que ESPERA_SOCKET_MS
  await req('POST', '/api/arena/abandon')
  ventana.estado = null
  await sleep(300)
  const trasVigilante = registro.sockets.length
  check('el vigilante cerró el socket colgado',
    registro.sockets.every(x => x.cerrado) || registro.sockets.filter(x => !x.cerrado).length === 0,
    registro.sockets.filter(x => !x.cerrado).length + ' sin cerrar')

  let masSockets = 0
  for (let b = 0; b < 3; b++) {
    const n = registro.sockets.length
    ventana.empezar('arena_bosque')
    await sleep(600)
    masSockets += registro.sockets.length - n
    await req('POST', '/api/arena/abandon')
    ventana.estado = null
    await sleep(200)
  }
  check('y en las tres batallas siguientes no abre ni una conexión más',
    masSockets === 0, masSockets + ' sockets nuevos (creados en total: ' + antesLargo + ' → ' + registro.sockets.length + ')')
  check('el juego se sigue pudiendo jugar sin socket ninguno',
    registro.peticiones > 40, registro.peticiones + ' peticiones HTTP')

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-fugas.json', BACKUP_DIR: '/tmp/cm-fugas-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1600)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
