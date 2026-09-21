/**
 * Carga criptomundo-arena.html en un DOM real (jsdom), con sesión real,
 * y la juega: elige arena, pulsa teclas, ataca. Comprueba lo que ve el
 * jugador, no lo que responde el servidor.
 */
const http = require('http')
const { JSDOM, VirtualConsole } = require('jsdom')

const PORT = process.env.PORT || 3777
const BASE = `http://localhost:${PORT}`
let cookie = ''

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
    r.on('error', e => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
let pass = 0, fail = 0
const check = (n, c, extra = '') => {
  c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (extra ? '  → ' + extra : '')))
}

async function main() {
  // ── sesión real ────────────────────────────────────────────────
  const u = 'probador' + Math.floor(Math.random() * 100000)
  const reg = await req('POST', '/api/auth/register', {
    username: u, email: u + '@test.io', password: 'Prueba12345', className: 'Guerrero',
  })
  if (reg.status !== 200 && reg.status !== 201) {
    console.log('No se pudo registrar:', reg.status, reg.raw.slice(0, 300)); process.exit(1)
  }
  console.log(`\nSesión creada para ${u}\n`)

  // ── cargar la página tal cual la sirve el servidor ─────────────
  const page = await req('GET', '/criptomundo-arena.html')
  const errores = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', e => errores.push(e.message + ' :: ' + (e.detail && e.detail.message)))
  vc.on('error', (...a) => errores.push('console.error ' + a.join(' ')))

  const dom = new JSDOM(page.raw, {
    url: BASE + '/criptomundo-arena.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      // jsdom no trae canvas: se sustituye por un contexto que solo anota
      win.HTMLCanvasElement.prototype.getContext = function () {
        const nada = () => {}
        return new Proxy({}, {
          get: (t, k) => {
            if (k === 'canvas') return null
            if (k === 'measureText') return () => ({ width: 10 })
            if (k === 'createLinearGradient' || k === 'createRadialGradient')
              return () => ({ addColorStop: nada })
            return typeof t[k] === 'undefined' ? nada : t[k]
          },
          set: () => true,
        })
      }
      // fetch con la cookie de sesión (jsdom no comparte nuestro login)
      const realFetch = win.fetch
      win.fetch = (url, opts = {}) => {
        const abs = String(url).startsWith('http') ? String(url) : BASE + String(url)
        const headers = Object.assign({}, opts.headers || {}, { Cookie: cookie })
        return new Promise(resolve => {
          const uu = new URL(abs)
          const data = opts.body || null
          const r = http.request({
            host: uu.hostname, port: uu.port, path: uu.pathname + uu.search,
            method: opts.method || 'GET', headers,
          }, res => {
            let o = ''
            res.on('data', c => o += c)
            res.on('end', () => resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: async () => { try { return JSON.parse(o) } catch { return {} } },
              text: async () => o,
            }))
          })
          r.on('error', () => resolve({ ok: false, status: 0, json: async () => ({}), text: async () => '' }))
          if (data) r.write(data)
          r.end()
        })
      }
      // WebSocket real, con la cookie puesta a mano
      const crypto = require('crypto')
      class WS {
        constructor(url) {
          this.readyState = 0
          this.onmessage = null; this.onclose = null; this.onopen = null
          const uu = new URL(url.replace(/^ws/, 'http'))
          const key = crypto.randomBytes(16).toString('base64')
          const r = http.request({
            host: uu.hostname, port: uu.port, path: uu.pathname, method: 'GET',
            headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13', Cookie: cookie },
          })
          r.on('upgrade', (res, socket, head) => {
            this.readyState = 1
            this.socket = socket
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
                if (op === 0x1 && this.onmessage) this.onmessage({ data: payload.toString('utf8') })
              }
            }
            socket.on('data', c => { buf = Buffer.concat([buf, c]); leer() })
            socket.on('error', () => {})
            if (this.onopen) this.onopen()
            leer()
          })
          r.on('error', () => { this.readyState = 3; if (this.onclose) this.onclose() })
          r.end()
        }
        send(text) {
          if (this.readyState !== 1) return
          const payload = Buffer.from(text, 'utf8')
          const mask = crypto.randomBytes(4)
          const m = Buffer.alloc(payload.length)
          for (let i = 0; i < payload.length; i++) m[i] = payload[i] ^ mask[i % 4]
          let h
          if (payload.length < 126) { h = Buffer.alloc(2); h[1] = 0x80 | payload.length }
          else { h = Buffer.alloc(4); h[1] = 0x80 | 126; h.writeUInt16BE(payload.length, 2) }
          h[0] = 0x81
          try { this.socket.write(Buffer.concat([h, mask, m])) } catch {}
        }
        close() { try { this.socket.destroy() } catch {} }
      }
      win.WebSocket = WS
    },
  })

  const win = dom.window
  const doc = win.document
  await sleep(600)

  console.log('── LA PÁGINA ARRANCA ──')
  check('el script de la arena se ejecuta sin reventar', errores.length === 0, errores[0] || '')
  check('existe la función empezar()', typeof win.empezar === 'function')

  const menu = doc.getElementById('menu')
  check('el menú de arenas se ha rellenado', !!menu && /arena-item/.test(menu.innerHTML),
    menu ? menu.innerHTML.slice(0, 120) : 'sin #menu')

  // ── entrar a la arena como hace el jugador: clic en la tarjeta ──
  console.log('\n── ENTRAR A LA ARENA ──')
  const tarjeta = doc.querySelector('.arena-item:not(.bloqueada)')
  check('hay una arena disponible para pulsar', !!tarjeta)
  if (tarjeta) tarjeta.dispatchEvent(new win.MouseEvent('click', { bubbles: true }))
  await sleep(1200)

  check('el menú se cierra al entrar', menu.style.display === 'none', 'display=' + menu.style.display)
  check('el socket queda abierto', win.ws && win.ws.readyState === 1)

  // ── ¿llega el estado del servidor? ─────────────────────────────
  await sleep(600)
  const est1 = win.estado
  check('el cliente recibe estado del servidor', !!est1 && typeof est1.jugador === 'object')
  const x0 = est1 && est1.jugador ? est1.jugador.x : null
  const y0 = est1 && est1.jugador ? est1.jugador.y : null

  // ── EL JUGADOR PULSA UNA TECLA ─────────────────────────────────
  console.log('\n── MOVERSE CON EL TECLADO (lo que falla) ──')
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'a', bubbles: true }))
  await sleep(150)
  check('la tecla marca intención de movimiento en el cliente',
    win.entrada && win.entrada.mx === -1, 'entrada.mx=' + (win.entrada && win.entrada.mx))

  await sleep(1200)
  const est2 = win.estado
  const x1 = est2 && est2.jugador ? est2.jugador.x : null
  check('el personaje se mueve de verdad en el servidor', x1 !== null && x0 !== null && x1 !== x0,
    `x: ${x0} → ${x1}`)
  doc.dispatchEvent(new win.KeyboardEvent('keyup', { key: 'a', bubbles: true }))

  // ── ATACAR ─────────────────────────────────────────────────────
  console.log('\n── ATACAR ──')
  const vidaAntes = est2 && est2.enemigos && est2.enemigos[0] ? est2.enemigos[0].hp : null
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  check('la barra espaciadora marca ataque', win.entrada && win.entrada.atacar === true)
  await sleep(2500)
  doc.dispatchEvent(new win.KeyboardEvent('keyup', { key: ' ', bubbles: true }))
  const est3 = win.estado
  const enemigosAhora = est3 && est3.enemigos ? est3.enemigos.length : 0
  check('el combate progresa (el estado sigue llegando)', !!est3)
  console.log(`     enemigos en pantalla: ${enemigosAhora} · bajas: ${est3 ? est3.bajas : '?'}`)

  if (errores.length) {
    console.log('\n── ERRORES DE JAVASCRIPT EN LA PÁGINA ──')
    errores.slice(0, 8).forEach(e => console.log('   ‼️ ' + e.slice(0, 300)))
  }

  console.log(`\n══════════════════════════════\n  ${pass} OK · ${fail} fallidas\n══════════════════════════════`)
  try { await req('POST', '/api/arena/abandon', {}) } catch {}
  dom.window.close()
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
