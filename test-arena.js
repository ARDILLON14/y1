/**
 * CriptoMundo v21 — pruebas del combate en tiempo real
 * Uso: PORT=3420 node test-arena.js --spawn
 *
 * Juega una partida de verdad: se conecta por WebSocket, se mueve, se
 * acerca al enemigo, ataca y comprueba que muere, que la XP y el botín
 * llegan al personaje, y que el cliente NO puede declarar daño ni
 * matar a nadie mandando mensajes falsos.
 */
const http = require('http')
const crypto = require('crypto')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data)
    r.end()
  })
}

// ── Cliente WebSocket mínimo ───────────────────────────────────────
function conectar() {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64')
    const r = http.request({ host: 'localhost', port: PORT, path: '/ws', method: 'GET',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13', Cookie: cookie } })
    r.on('upgrade', (res, socket, head) => {
      const c = { socket, mensajes: [], buf: Buffer.from(head || []) }
      socket.on('data', x => { c.buf = Buffer.concat([c.buf, x]); leer(c) })
      socket.on('error', () => {})
      leer(c)
      resolve(c)
    })
    r.on('response', res => resolve({ rechazado: res.statusCode }))
    r.on('error', reject)
    r.end()
  })
}
function leer(c) {
  while (c.buf.length >= 2) {
    const op = c.buf[0] & 0x0f
    let len = c.buf[1] & 0x7f, off = 2
    if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4 }
    else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10 }
    if (c.buf.length < off + len) return
    const payload = c.buf.slice(off, off + len)
    c.buf = c.buf.slice(off + len)
    if (op === 0x1) { try { c.mensajes.push(JSON.parse(payload.toString('utf8'))) } catch {} }
  }
}
function enviar(c, obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8')
  const mask = crypto.randomBytes(4)
  const m = Buffer.alloc(payload.length)
  for (let i = 0; i < payload.length; i++) m[i] = payload[i] ^ mask[i % 4]
  let h
  if (payload.length < 126) { h = Buffer.alloc(2); h[1] = 0x80 | payload.length }
  else { h = Buffer.alloc(4); h[1] = 0x80 | 126; h.writeUInt16BE(payload.length, 2) }
  h[0] = 0x81
  c.socket.write(Buffer.concat([h, mask, m]))
}
const ultimo = (c, tipo) => [...c.mensajes].reverse().find(m => m.type === tipo)

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  await req('POST', '/api/auth/register', { username: `Are${rand}`, email: `a${rand}@t.com`, password: 'clave-segura-1', className: 'Guerrero' })

  console.log('\n── CATÁLOGO ──')
  let r = await req('GET', '/api/arena')
  check('hay arenas disponibles', (r.body.arenas || []).length >= 3)
  check('el arma equipada se refleja', !!r.body.arma)
  check('las arenas duras están bloqueadas por nivel', r.body.arenas.find(a => a.id === 'arena_ruinas').disponible === false)

  r = await req('POST', '/api/arena/start', { arenaId: 'arena_ruinas' })
  check('no se entra a una arena por encima del nivel', r.status === 403)
  r = await req('POST', '/api/arena/start', { arenaId: 'inventada' })
  check('arena inexistente rechazada', r.status === 404)

  console.log('\n── EMPEZAR COMBATE ──')
  r = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('se inicia el combate', r.status === 200 && !!r.body.partida)
  check('empieza con enemigos en la arena', (r.body.partida.enemigos || []).length >= 2)
  check('el jugador entra con su vida real', r.body.partida.jugador.hp > 0)

  const dup = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('no se pueden tener dos combates a la vez', dup.status === 409)

  // ⚠️ Se abren DOS sockets a propósito, como en el juego real: el del
  // launcher (chat y presencia) y el de la página de arena dentro del
  // iframe. Con un solo socket esta suite pasaba mientras la arena
  // estaba injugable para los jugadores de verdad.
  const wsLauncher = await conectar()
  await sleep(300)
  const ws = await conectar()
  check('el socket acepta la conexión', !ws.rechazado)
  await sleep(700)
  let est = ultimo(ws, 'arena_estado')
  check('la pantalla de arena recibe el estado aunque el launcher tenga su propio socket',
    !!est, 'no llegó arena_estado al segundo socket')
  check('el launcher también lo recibe (no se pierde ningún cliente)',
    !!ultimo(wsLauncher, 'arena_estado'))

  console.log('\n── SIMULACIÓN REAL ──')
  const pos0 = { x: est.estado.jugador.x, y: est.estado.jugador.y }
  enviar(ws, { type: 'arena_entrada', entrada: { mx: 1, my: 0 } })
  await sleep(600)
  est = ultimo(ws, 'arena_estado')
  check('moverse cambia la posición', est.estado.jugador.x !== pos0.x, `${pos0.x} → ${est.estado.jugador.x}`)

  enviar(ws, { type: 'arena_entrada', entrada: { mx: 9999, my: 9999 } })
  await sleep(400)
  const antes = ultimo(ws, 'arena_estado').estado.jugador
  await sleep(400)
  const desp = ultimo(ws, 'arena_estado').estado.jugador
  const salto = Math.hypot(desp.x - antes.x, desp.y - antes.y)
  check('un vector de entrada gigante no teletransporta', salto < 200, `saltó ${Math.round(salto)}px`)

  console.log('\n── NO SE PUEDE HACER TRAMPA ──')
  const vidaEnemigo = est.estado.enemigos[0].hp
  enviar(ws, { type: 'arena_daño', id: est.estado.enemigos[0].id, dmg: 99999 })
  enviar(ws, { type: 'arena_estado', estado: { enemigos: [] } })
  enviar(ws, { type: 'arena_fin', motivo: 'victoria', oro: 999999 })
  await sleep(500)
  const oroAhora = (await req('GET', '/api/player')).body.character.gold
  check('el cliente no puede declarar daño', ultimo(ws, 'arena_estado').estado.enemigos.length > 0)
  check('el cliente no puede declararse ganador', oroAhora === 500, `oro ${oroAhora}`)

  console.log('\n── PELEAR DE VERDAD ──')
  // Perseguir al enemigo más cercano y atacar hasta matar a alguno
  let bajas = 0, vueltas = 0
  while (bajas === 0 && vueltas++ < 120) {
    const e = ultimo(ws, 'arena_estado')
    if (!e) break
    if (e.estado.bajas > 0) { bajas = e.estado.bajas; break }
    const en = e.estado.enemigos[0]
    if (!en) { await sleep(120); continue }
    const j = e.estado.jugador
    const dx = en.x - j.x, dy = en.y - j.y
    const d = Math.hypot(dx, dy) || 1
    enviar(ws, { type: 'arena_entrada', entrada: { mx: dx / d, my: dy / d, apuntar: Math.atan2(dy, dx), atacar: d < 90 } })
    await sleep(110)
  }
  check('atacar mata enemigos de verdad', bajas > 0, `bajas ${bajas}`)

  const kills0 = (await req('GET', '/api/profile')).body.contadores.bajas
  check('la baja se registra en el perfil', kills0 >= 1, `${kills0}`)

  console.log('\n── FIN DE COMBATE ──')
  enviar(ws, { type: 'arena_abandonar' })
  await sleep(500)
  const fin = ultimo(ws, 'arena_fin')
  check('se puede abandonar y llega el resultado', !!fin, 'no llegó arena_fin')
  check('el resultado trae bajas y XP', fin && typeof fin.bajas === 'number' && typeof fin.xp === 'number')

  const perfil = (await req('GET', '/api/profile')).body
  check('la XP del combate llega al personaje', perfil.xp > 0 || perfil.nivel > 1)
  r = await req('GET', '/api/arena')
  check('tras terminar ya no hay combate en curso', r.body.enCurso === false)

  r = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('se puede volver a entrar', r.status === 200)
  await req('POST', '/api/arena/abandon', {})

  console.log('\n── INTERFAZ ──')
  const pagina = await new Promise(res => http.get(`http://localhost:${PORT}/criptomundo-arena.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res({ status: x.statusCode, body: o })) }))
  check('la página de arena se sirve', pagina.status === 200)
  check('dibuja el estado que manda el servidor', /arena_estado/.test(pagina.body))
  check('solo envía entradas', /arena_entrada/.test(pagina.body))

  console.log('\n── MAZMORRAS SOBRE EL MISMO MOTOR ──')
  r = await req('GET', '/api/mazmorra')
  check('hay mazmorras jugables', (r.body.mazmorras || []).length >= 3)
  check('cada una declara pisos y enemigos', r.body.mazmorras.every(m => m.pisos >= 3 && m.enemigos.length))
  r = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_ruinas' })
  check('no se entra por encima del nivel', r.status === 403)
  r = await req('POST', '/api/mazmorra/sala', { salaId: 'inventada' })
  check('sin estar dentro no se elige sala', r.status === 404)
  const pagina2 = await new Promise(res => http.get(`http://localhost:${PORT}/criptomundo-mazmorras-pvp.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('la pantalla de mazmorras usa el sistema nuevo', /api\/mazmorra/.test(pagina2) && /mz-salas/.test(pagina2))
  check('ya no hay un botón "Avanzar" solitario', !/dngAction/.test(pagina2))

  ws.socket.destroy()
  wsLauncher.socket.destroy()
  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-arena.json', '/tmp/cm-arena-b')
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-arena.json', BACKUP_DIR: '/tmp/cm-arena-b' }, stdio: 'ignore' })
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
