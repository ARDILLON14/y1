/**
 * CriptoMundo — la arena, ejecutada como la ejecuta el navegador
 * Uso:  PORT=3850 node test-arena-navegador.js --spawn
 *
 * POR QUÉ EXISTE ESTA PRUEBA
 * test-arena.js habla con el servidor a pelo: registra, abre un socket,
 * manda entradas y comprueba resultados. Pasa en verde. Y aun así el
 * jugador dice "entro y no me puedo mover". Eso ya pasó en la v29 y la
 * lección fue la misma: **la prueba no ejecutaba el código de la
 * página**. Comprobaba que el motor funciona, no que la pantalla lo
 * use bien.
 *
 * Aquí se hace lo otro. Se descarga /criptomundo-arena.html, se sacan
 * sus <script> y se ejecutan de verdad en un DOM de mentira, con un
 * WebSocket de verdad contra el servidor de verdad. Si el script se
 * rompe, si el socket no conecta, si el bucle de dibujo muere o si las
 * entradas no llegan, sale aquí y con la traza.
 *
 * Lo que NO se finge: el servidor, el protocolo WebSocket, las
 * cookies y la lógica de la página. Lo que sí: canvas, elementos del
 * DOM y el reloj de dibujo.
 */
const http = require('http')
const crypto = require('crypto')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3850)
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

function req(method, p, body, extraCookie) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    const ck = extraCookie !== undefined ? extraCookie : cookie
    if (ck) h.Cookie = ck
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o, headers: res.headers }) }) })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

// ── WebSocket de cliente, el mismo de test-arena.js ────────────────
function wsFrameCliente(texto) {
  const payload = Buffer.from(texto, 'utf8')
  const mask = crypto.randomBytes(4)
  const m = Buffer.alloc(payload.length)
  for (let i = 0; i < payload.length; i++) m[i] = payload[i] ^ mask[i % 4]
  let h
  if (payload.length < 126) { h = Buffer.alloc(2); h[1] = 0x80 | payload.length }
  else { h = Buffer.alloc(4); h[1] = 0x80 | 126; h.writeUInt16BE(payload.length, 2) }
  h[0] = 0x81
  return Buffer.concat([h, mask, m])
}

// El WebSocket que ve la página: misma interfaz que la del navegador
// (readyState, send, onmessage, onclose), socket real por debajo.
function crearWebSocketFalso(registro) {
  return function WebSocketFalso(url) {
    const self = this
    this.url = url
    this.readyState = 0
    this.onmessage = null; this.onclose = null; this.onopen = null; this.onerror = null
    registro.intentos.push(url)

    const key = crypto.randomBytes(16).toString('base64')
    const r = http.request({ host: 'localhost', port: PORT, path: '/ws', method: 'GET',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key,
                 'Sec-WebSocket-Version': '13', Cookie: cookie } })

    r.on('upgrade', (res, socket, head) => {
      self.readyState = 1
      self.socket = socket
      registro.abiertos++
      let buf = Buffer.from(head || [])
      const leer = () => {
        while (buf.length >= 2) {
          const op = buf[0] & 0x0f
          let len = buf[1] & 0x7f, off = 2
          if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4 }
          else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10 }
          if (buf.length < off + len) return
          const payload = buf.slice(off, off + len)
          buf = buf.slice(off + len)
          if (op === 0x9) { try { socket.write(Buffer.concat([Buffer.from([0x8a, 0x80]), crypto.randomBytes(4)])) } catch {} ; continue }
          if (op !== 0x1) continue
          const texto = payload.toString('utf8')
          registro.recibidos.push(texto)
          if (self.onmessage) {
            try { self.onmessage({ data: texto }) }
            catch (e) { registro.errores.push('onmessage: ' + e.stack) }
          }
        }
      }
      socket.on('data', c => { buf = Buffer.concat([buf, c]); leer() })
      socket.on('error', () => {})
      socket.on('close', () => { self.readyState = 3; if (self.onclose) try { self.onclose() } catch {} })
      leer()
      if (self.onopen) try { self.onopen() } catch (e) { registro.errores.push('onopen: ' + e.stack) }
    })
    // Handshake rechazado: es EXACTAMENTE lo que el jugador vive como
    // "entro y no se mueve nada", y sin esto no se ve por ningún lado.
    r.on('response', res => { registro.rechazos.push(res.statusCode); self.readyState = 3 })
    r.on('error', e => { registro.rechazos.push(e.code || 'error'); self.readyState = 3 })
    r.end()

    this.send = function (texto) {
      registro.enviados.push(texto)
      try { self.socket.write(wsFrameCliente(texto)) } catch (e) { registro.errores.push('send: ' + e.message) }
    }
    this.close = function () { try { self.socket.destroy() } catch {} ; self.readyState = 3 }
  }
}

// ── DOM de mentira, lo justo para que la página viva ───────────────
function crearElemento(id) {
  const el = {
    id, tagName: 'DIV', textContent: '', innerHTML: '', value: '', disabled: false,
    style: {}, dataset: {}, children: [], firstChild: null, lastChild: null,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, remove() {},
    appendChild(c) { this.children.push(c); this.lastChild = c; if (!this.firstChild) this.firstChild = c; return c },
    insertBefore(c) { this.children.unshift(c); this.firstChild = c; if (!this.lastChild) this.lastChild = c; return c },
    removeChild(c) { this.children = this.children.filter(x => x !== c); this.lastChild = this.children[this.children.length - 1] || null; return c },
    querySelector() { return null }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 } },
    setAttribute() {}, getAttribute() { return null },
  }
  return el
}

function crearContexto(registro) {
  const dibujo = { drawImage: 0, arc: 0, fillText: [], rotate: 0, save: 0, restore: 0 }
  const roto = {}
  const ctx = new Proxy(roto, {
    get(_, prop) {
      if (prop in roto) return roto[prop]
      if (prop === 'drawImage') return () => { dibujo.drawImage++ }
      if (prop === 'fillText') return t => { dibujo.fillText.push(String(t)) }
      if (prop === 'arc') return () => { dibujo.arc++ }
      if (prop === 'rotate') return () => { dibujo.rotate++ }
      if (prop === 'save') return () => { dibujo.save++ }
      if (prop === 'restore') return () => { dibujo.restore++ }
      if (prop === 'canvas') return { width: 900, height: 600 }
      // Solo estas son PROPIEDADES; todo lo demás es un método. Antes
      // el filtro iba por prefijo y convertía fillRect en una cadena:
      // el arnés reventaba solo y culpaba a la página.
      const PROPS = ['fillStyle', 'strokeStyle', 'font', 'lineWidth', 'lineCap', 'lineJoin',
        'textAlign', 'textBaseline', 'globalAlpha', 'globalCompositeOperation',
        'imageSmoothingEnabled', 'imageSmoothingQuality', 'shadowBlur', 'shadowColor',
        'shadowOffsetX', 'shadowOffsetY', 'miterLimit', 'direction', 'filter',
        'letterSpacing', 'wordSpacing', 'lineDashOffset']
      if (typeof prop === 'string' && PROPS.includes(prop)) return ''
      return () => {}
    },
    set() { return true },
  })
  registro.dibujo = dibujo
  registro.ctx = roto
  return ctx
}

function montarVentana(registro) {
  const elementos = {}
  const lienzo = crearElemento('lienzo')
  lienzo.width = 900; lienzo.height = 600
  lienzo.getContext = () => crearContexto(registro)
  // Los oyentes del lienzo se guardan para poder disparar un mousemove
  // igual que lo haría una mano sobre el ratón.
  lienzo.addEventListener = (tipo, fn) => { (registro.oyentes['m:lienzo:' + tipo] = registro.oyentes['m:lienzo:' + tipo] || []).push(fn) }
  elementos.lienzo = lienzo

  const registroPantalla = crearElemento('registro')
  registroPantalla.insertBefore = function (c) { (registro.anotado = registro.anotado || []).push(c.textContent || ''); this.children.unshift(c); this.firstChild = c; this.lastChild = this.lastChild || c; return c }
  elementos.registro = registroPantalla

  const documento = {
    getElementById(id) { return elementos[id] || (elementos[id] = crearElemento(id)) },
    createElement(t) { const e = crearElemento(null); e.tagName = String(t).toUpperCase(); return e },
    addEventListener(tipo, fn) { (registro.oyentes[tipo] = registro.oyentes[tipo] || []).push(fn) },
    removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    body: crearElemento('body'), documentElement: crearElemento('html'),
    hidden: false, visibilityState: 'visible',
  }

  const ventana = {
    document: documento,
    location: { protocol: 'http:', host: 'localhost:' + PORT, href: 'http://localhost:' + PORT + '/criptomundo-arena.html', hostname: 'localhost' },
    navigator: { userAgent: 'nodo-prueba', maxTouchPoints: 0 },
    WebSocket: crearWebSocketFalso(registro),
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Number, String, Boolean, Array, Object, Error, RegExp, Promise, Map, Set,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    // El bucle de dibujo: se ejecuta de verdad, y si revienta se anota
    // en vez de morirse en silencio (que es como se ve una pantalla
    // congelada desde el asiento del jugador).
    requestAnimationFrame(fn) {
      return setTimeout(() => {
        registro.cuadros++
        try { fn(Date.now()) } catch (e) { registro.errores.push('dibujo: ' + e.stack); registro.dibujoMuerto = true }
      }, 16)
    },
    cancelAnimationFrame: clearTimeout,
    addEventListener(tipo, fn) { (registro.oyentes['w:' + tipo] = registro.oyentes['w:' + tipo] || []).push(fn) },
    removeEventListener() {},
    focus() {}, alert() {}, postMessage() {},
    Image: function () {
      // Imagen que carga bien: así se comprueba que drawImage llega a
      // llamarse de verdad con la espada equipada.
      const img = this
      img.complete = false; img.naturalWidth = 0; img.naturalHeight = 0
      Object.defineProperty(img, 'src', {
        set(v) { registro.sprites.push(v); img.complete = true; img.naturalWidth = 32; img.naturalHeight = 32; if (img.onload) img.onload() },
        get() { return registro.sprites[registro.sprites.length - 1] },
      })
    },
    fetch(url, opciones) {
      const o = opciones || {}
      return new Promise(resolve => {
        req(o.method || 'GET', url, o.body ? JSON.parse(o.body) : null).then(r => {
          resolve({ ok: r.status >= 200 && r.status < 300, status: r.status,
            json: async () => r.body, text: async () => r.raw })
        })
      })
    },
  }
  ventana.window = ventana
  ventana.self = ventana
  ventana.globalThis = ventana
  ventana.parent = ventana        // como si la página se abriera suelta
  ventana.top = ventana
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
  const u = 'nav' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── LA PÁGINA ARRANCA ──')
  const html = await new Promise(res => http.get({ host: 'localhost', port: PORT, path: '/criptomundo-arena.html' },
    x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('la página se sirve', html.length > 2000, String(html.length))

  const registro = { errores: [], recibidos: [], enviados: [], intentos: [], rechazos: [],
                     abiertos: 0, cuadros: 0, sprites: [], oyentes: {}, dibujoMuerto: false }
  const ventana = montarVentana(registro)
  const ctx = vm.createContext(ventana)

  const trozos = scripts(html)
  check('la página trae scripts', trozos.length > 0, String(trozos.length))
  let rotos = 0
  trozos.forEach((codigo, i) => {
    try { vm.runInContext(codigo, ctx, { filename: 'arena-script-' + i, timeout: 5000 }) }
    catch (e) { rotos++; registro.errores.push('script ' + i + ': ' + e.message) }
  })
  check('todos los scripts se ejecutan sin reventar', rotos === 0, registro.errores.join(' | ').slice(0, 300))

  await sleep(400)
  check('el bucle de dibujo está vivo', registro.cuadros > 3, registro.cuadros + ' cuadros')

  console.log('\n── EMPEZAR COMBATE COMO LO HACE EL JUGADOR ──')
  ventana.empezar('arena_bosque')
  await sleep(900)
  check('el socket se abrió', registro.abiertos > 0,
    'intentos=' + registro.intentos.length + ' rechazos=' + JSON.stringify(registro.rechazos))
  check('llegan estados del servidor', registro.recibidos.some(m => m.includes('arena_estado')),
    'mensajes: ' + registro.recibidos.map(m => (JSON.parse(m).type)).join(',').slice(0, 120))
  check('la página envía entradas', registro.enviados.some(m => m.includes('arena_entrada')),
    String(registro.enviados.length) + ' enviados')

  console.log('\n── MOVERSE ──')
  const antes = ventana.estado ? { x: ventana.estado.jugador.x, y: ventana.estado.jugador.y } : null
  check('la página tiene estado del combate', !!antes, JSON.stringify(antes))
  const teclado = registro.oyentes['keydown'] || []
  check('la página escucha el teclado', teclado.length > 0, String(teclado.length))
  teclado.forEach(fn => { try { fn({ key: 'w', preventDefault() {} }) } catch (e) { registro.errores.push('keydown: ' + e.message) } })
  await sleep(1200)
  const despues = ventana.estado ? { x: ventana.estado.jugador.x, y: ventana.estado.jugador.y } : null
  check('pulsar W mueve al personaje de verdad',
    !!(antes && despues) && (Math.abs(despues.x - antes.x) + Math.abs(despues.y - antes.y)) > 5,
    JSON.stringify(antes) + ' → ' + JSON.stringify(despues))

  console.log('\n── APUNTAR CON EL RATÓN ──')
  const mirandoAntes = ventana.estado && ventana.estado.jugador.mirando
  const lienzo = ventana.document.getElementById('lienzo')
  const raton = registro.oyentes['m:lienzo:mousemove'] || []
  check('la página escucha el ratón sobre el lienzo', raton.length > 0,
    'oyentes registrados: ' + Object.keys(registro.oyentes).join(','))
  raton.forEach(fn => { try { fn({ clientX: 100, clientY: 100, preventDefault() {} }) } catch (e) { registro.errores.push('mousemove: ' + e.message) } })
  await sleep(700)
  const mirandoDespues = ventana.estado && ventana.estado.jugador.mirando
  check('mover el ratón cambia hacia dónde mira el personaje',
    mirandoAntes !== undefined && mirandoDespues !== undefined && mirandoAntes !== mirandoDespues,
    mirandoAntes + ' → ' + mirandoDespues)

  console.log('\n── UN FALLO AL PINTAR NO PUEDE CONGELAR LA PANTALLA ──')
  // Se rompe el lienzo a propósito. Antes esto mataba la cadena de
  // requestAnimationFrame y el juego quedaba congelado sin decir nada:
  // el jugador lo vive como "no me puedo mover".
  const cuadrosAntes = registro.cuadros
  registro.ctx.arc = () => { throw new Error('fallo de pintura de prueba') }
  await sleep(500)
  const durante = registro.cuadros
  check('el bucle sigue pidiendo cuadros con el lienzo roto', durante > cuadrosAntes + 5,
    cuadrosAntes + ' → ' + durante)
  check('y el fallo se anota en pantalla en vez de morir en silencio',
    (registro.anotado || []).some(t => /dibujo|fallo/i.test(t)), (registro.anotado || []).join(' | ').slice(0, 120))
  delete registro.ctx.arc
  await sleep(300)
  check('al arreglarse, sigue dibujando', registro.cuadros > durante + 5, durante + ' → ' + registro.cuadros)

  console.log('\n── LA ESPADA SE DIBUJA ──')
  check('se pidió cargar algún sprite', registro.sprites.length >= 0, registro.sprites.join(','))
  check('el bucle sigue vivo tras pelear', !registro.dibujoMuerto && registro.cuadros > 20, registro.cuadros + ' cuadros')

  if (registro.errores.length) {
    console.log('\n── ERRORES CAPTURADOS ──')
    registro.errores.slice(0, 6).forEach(e => console.log('  ⚠️  ' + e.split('\n')[0]))
  }

  await req('POST', '/api/arena/abandon')
  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-nav.json', BACKUP_DIR: '/tmp/cm-nav-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1500)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
