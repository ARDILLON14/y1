/**
 * CriptoMundo v5 — pruebas de tiempo real y persistencia
 * Uso: PORT=3976 node test-tiempo-real.js --spawn
 *
 * Incluye un cliente WebSocket mínimo escrito a mano: si el servidor
 * implementa el protocolo a mano, la prueba también, para no depender
 * de que el navegador lo haga bien.
 */
const http = require('http')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
const DATA = '/tmp/cm-tiemporeal.json'
const BACKUPS = path.join(path.dirname(DATA), 'backups')
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path: p, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : cookie }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}

// ── Cliente WebSocket mínimo ───────────────────────────────────────
function wsConnect(cookie) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64')
    const r = http.request({ host: 'localhost', port: PORT, path: '/ws', method: 'GET',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13', ...(cookie ? { Cookie: cookie } : {}) } })
    r.on('upgrade', (res, socket, head) => {
      const expected = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-5AB0DC85B39A').digest('base64')
      const client = { socket, accept: res.headers['sec-websocket-accept'], expected, messages: [], buf: Buffer.from(head || []) }
      socket.on('data', c => { client.buf = Buffer.concat([client.buf, c]); drain(client) })
      drain(client)
      resolve(client)
    })
    r.on('response', res => resolve({ rejected: res.statusCode }))
    r.on('error', reject)
    r.end()
  })
}
function drain(c) {
  while (c.buf.length >= 2) {
    const opcode = c.buf[0] & 0x0f
    let len = c.buf[1] & 0x7f, off = 2
    if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4 }
    else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10 }
    if (c.buf.length < off + len) return
    const payload = c.buf.slice(off, off + len)
    c.buf = c.buf.slice(off + len)
    if (opcode === 0x1) { try { c.messages.push(JSON.parse(payload.toString('utf8'))) } catch {} }
  }
}
function wsSend(c, obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8')
  const mask = crypto.randomBytes(4)
  const masked = Buffer.alloc(payload.length)
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4]
  let header
  if (payload.length < 126) { header = Buffer.alloc(2); header[1] = 0x80 | payload.length }
  else { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2) }
  header[0] = 0x81
  c.socket.write(Buffer.concat([header, mask, masked]))
}
const waitFor = async (c, type, ms = 2500) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const m = c.messages.find(x => x.type === type)
    if (m) return m
    await sleep(60)
  }
  return null
}

async function run() {
  const rand = Math.floor(Math.random() * 1e9)

  console.log('\n── HANDSHAKE ──')
  let anon = await wsConnect(null)
  check('sin sesión el WebSocket se rechaza', anon.rejected === 401, `status ${anon.rejected}`)

  const reg = await req('POST', '/api/auth/register', { username: `Ws${rand}`, email: `w${rand}@t.com`, password: 'clave-segura-1' })
  const cookieA = reg.cookie
  const a = await wsConnect(cookieA)
  check('con sesión el WebSocket acepta', !a.rejected)
  check('la clave del handshake es correcta', a.accept === a.expected)

  const hello = await waitFor(a, 'hello')
  check('al conectar llega el historial', !!hello && Array.isArray(hello.messages))

  console.log('\n── CHAT EN TIEMPO REAL ──')
  const reg2 = await req('POST', '/api/auth/register', { username: `Ws${rand}b`, email: `w${rand}b@t.com`, password: 'clave-segura-1' })
  const b = await wsConnect(reg2.cookie)
  await waitFor(b, 'hello')
  a.messages.length = 0; b.messages.length = 0

  wsSend(a, { type: 'chat', message: 'hola desde el socket' })
  const recibido = await waitFor(b, 'chat')
  check('un mensaje llega al otro jugador sin sondear', !!recibido && recibido.message.message === 'hola desde el socket')

  b.messages.length = 0
  await req('POST', '/api/chat', { message: 'hola por HTTP' }, cookieA)
  const porHttp = await waitFor(b, 'chat')
  check('lo enviado por HTTP también se difunde', !!porHttp && porHttp.message.message === 'hola por HTTP')

  b.messages.length = 0
  wsSend(a, { type: 'chat', message: '<script>alert(1)</script>' })
  const xss = await waitFor(b, 'chat')
  check('el XSS se escapa igual que por HTTP', !!xss && !xss.message.message.includes('<script'))

  a.messages.length = 0
  for (let i = 0; i < 12; i++) wsSend(a, { type: 'chat', message: 'spam ' + i })
  const err = await waitFor(a, 'error')
  check('el límite de mensajes se aplica también por socket', !!err)

  console.log('\n── PRESENCIA ──')
  a.messages.length = 0
  const reg3 = await req('POST', '/api/auth/register', { username: `Ws${rand}c`, email: `w${rand}c@t.com`, password: 'clave-segura-1' })
  const c3 = await wsConnect(reg3.cookie)
  const presencia = await waitFor(a, 'presence', 3000)
  check('al entrar alguien se avisa a los demás', !!presencia && Array.isArray(presencia.online))
  check('la lista incluye a los tres conectados', !!presencia && presencia.online.length >= 3, presencia ? String(presencia.online.length) : '—')
  c3.socket.destroy()
  await sleep(500)
  let r = await req('GET', '/api/online', null, cookieA)
  check('/api/online lista los conectados', r.status === 200 && r.body.total >= 2, `total ${r.body.total}`)

  const antes = (await req('GET', '/api/online', null, cookieA)).body.total
  b.socket.destroy()
  await sleep(1200)
  r = await req('GET', '/api/online', null, cookieA)
  check('al desconectar baja el recuento', r.body.total < antes, `${antes} → ${r.body.total}`)

  console.log('\n── SEGURIDAD DEL SOCKET ──')
  a.messages.length = 0
  wsSend(a, { type: 'combat', monsterId: 'm_dragon', action: 'win' })
  wsSend(a, { type: 'gold', amount: 999999 })
  await sleep(400)
  r = await req('GET', '/api/player', null, cookieA)
  check('el socket no acepta acciones de juego', r.body.character.gold === 500, `oro ${r.body.character.gold}`)

  console.log('\n── PERSISTENCIA ──')
  await req('POST', '/api/chat', { message: 'antes de guardar' }, cookieA)
  await sleep(2000)
  check('el archivo de datos existe', fs.existsSync(DATA))
  check('el archivo de datos es JSON válido', (() => { try { JSON.parse(fs.readFileSync(DATA, 'utf8')); return true } catch { return false } })())
  check('no queda ningún .tmp a medias', !fs.existsSync(DATA + '.tmp'))
  const snap = JSON.parse(fs.readFileSync(DATA, 'utf8'))
  check('el volcado lleva versión y fecha', snap.version === 1 && !!snap.savedAt)

  a.socket.destroy()
  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  for (const f of [DATA, DATA + '.tmp']) { try { fs.unlinkSync(f) } catch {} }
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: DATA, BACKUP_DIR: BACKUPS, BACKUP_EVERY_MS: '1' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
