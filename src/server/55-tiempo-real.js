
// ═══════════════════════════════════════════════════════════════════
//  TIEMPO REAL — WebSocket implementado a mano
//
//  Antes el chat funcionaba por sondeo: cada cliente preguntaba
//  "¿hay mensajes nuevos?" cada pocos segundos. Con 50 jugadores eso
//  son miles de peticiones por minuto para, casi siempre, nada.
//
//  Aquí está el protocolo WebSocket mínimo (RFC 6455) implementado
//  con lo que trae Node: handshake, marcos de texto, ping/pong y
//  cierre. No hace falta ninguna librería.
//
//  Lo que viaja: chat, presencia y las ENTRADAS del combate en tiempo
//  real (hacia dónde me muevo, ataco, esquivo). Ojo a la diferencia:
//  el cliente manda intenciones, nunca resultados. La simulación de la
//  arena corre en el servidor (ver 58-arena.js); por aquí no se puede
//  declarar daño, muertes ni botín. El mercado, el crafteo y el resto
//  siguen pasando por HTTP con su validación.
// ═══════════════════════════════════════════════════════════════════
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-5AB0DC85B39A'
const WS_MAX_FRAME = 16 * 1024          // un mensaje de chat no necesita más
const WS_PING_MS = 30_000

const wsClients = new Set()             // { socket, username, char, alive, joinedAt }

// Últimos rechazos del handshake. Existe porque el navegador NO deja
// ver a la página el código HTTP con el que se rechazó un WebSocket:
// por diseño, ws.onerror no dice nada. Sin esto, un 401 y un 429 se
// viven exactamente igual —"no me puedo mover"— y no hay forma de
// distinguirlos desde el asiento del jugador.
const wsRechazos = []

function wsRechazar(req, socket, codigo, motivo) {
  wsRechazos.unshift({ cuando: now(), ip: clientIp(req), codigo, motivo,
                       cookie: !!req.headers.cookie, agente: String(req.headers['user-agent'] || '').slice(0, 60) })
  if (wsRechazos.length > 20) wsRechazos.pop()
  console.warn(`  ⚠️  WebSocket rechazado (${codigo}): ${motivo}`)
  try { socket.write(`HTTP/1.1 ${codigo} Rechazado\r\nConnection: close\r\n\r\n`) } catch {}
  try { socket.destroy() } catch {}
}

function wsAccept(key) {
  return crypto.createHash('sha1').update(key + WS_MAGIC).digest('base64')
}

// Construye un marco de texto del servidor (sin máscara, como manda el RFC)
function wsFrame(text, opcode = 0x1) {
  const payload = Buffer.from(text, 'utf8')
  const len = payload.length
  let header
  if (len < 126) {
    header = Buffer.alloc(2)
    header[1] = len
  } else if (len < 65536) {
    header = Buffer.alloc(4)
    header[1] = 126
    header.writeUInt16BE(len, 2)
  } else {
    header = Buffer.alloc(10)
    header[1] = 127
    header.writeBigUInt64BE(BigInt(len), 2)
  }
  header[0] = 0x80 | opcode             // FIN + opcode
  return Buffer.concat([header, payload])
}

function wsSend(client, obj) {
  try { client.socket.write(wsFrame(JSON.stringify(obj))) } catch { wsDrop(client) }
}

function wsBroadcast(obj, filter) {
  const frame = wsFrame(JSON.stringify(obj))
  for (const c of wsClients) {
    if (filter && !filter(c)) continue
    try { c.socket.write(frame) } catch { wsDrop(c) }
  }
}

function wsDrop(client) {
  if (!wsClients.has(client)) return
  wsClients.delete(client)
  // Al cerrar la pestaña, el muñeco desaparece del mundo de los demás.
  // Sin esto quedaba de pie en mitad del pueblo hasta que caducara.
  if (client.username && typeof salirDelMundo === 'function') salirDelMundo(client.username)
  try { client.socket.destroy() } catch {}
  wsBroadcast({ type: 'presence', online: wsOnline() })
}

function wsOnline() {
  const seen = new Map()
  for (const c of wsClients) {
    if (!c.username) continue
    seen.set(c.username, { name: c.char?.name || c.username, level: c.char?.level || 1 })
  }
  return [...seen.values()]
}

// Lee marcos del cliente. Los del cliente SIEMPRE vienen enmascarados;
// si llega uno sin máscara, el RFC obliga a cerrar la conexión.
function wsReadFrames(client, buffer) {
  let buf = buffer
  while (buf.length >= 2) {
    const fin = (buf[0] & 0x80) !== 0
    const opcode = buf[0] & 0x0f
    const masked = (buf[1] & 0x80) !== 0
    let len = buf[1] & 0x7f
    let offset = 2

    if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); offset = 4 }
    else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); offset = 10 }

    if (!masked) { wsDrop(client); return Buffer.alloc(0) }
    if (len > WS_MAX_FRAME) { wsDrop(client); return Buffer.alloc(0) }
    if (buf.length < offset + 4 + len) break

    const mask = buf.slice(offset, offset + 4)
    const data = Buffer.alloc(len)
    for (let i = 0; i < len; i++) data[i] = buf[offset + 4 + i] ^ mask[i % 4]
    buf = buf.slice(offset + 4 + len)

    if (opcode === 0x8) { wsDrop(client); return Buffer.alloc(0) }   // cierre
    if (opcode === 0xa) { client.alive = true; continue }             // pong
    if (opcode === 0x9) { try { client.socket.write(wsFrame('', 0xa)) } catch {} ; continue }
    if (opcode === 0x1 && fin) wsHandleMessage(client, data.toString('utf8'))
  }
  return buf
}

// Mensajes que acepta el servidor por socket. La lista es corta a
// propósito: todo lo que mueva oro u objetos va por HTTP.
function wsHandleMessage(client, raw) {
  let msg
  try { msg = JSON.parse(raw) } catch { return }
  if (!msg || typeof msg !== 'object') return

  if (msg.type === 'ping') { wsSend(client, { type: 'pong' }); return }

  // Dónde está el jugador en el mundo. El servidor acepta o corrige, y
  // contesta con quién tiene al lado. Es un pulso del cliente, no un
  // reloj aparte: así quien no se mueve no genera tráfico.
  if (msg.type === 'mundo_entrada') {
    const r = moverEnMundo(client.username, msg.pos || {})
    if (!r) return
    wsSend(client, { type: 'mundo', tu: r, vecinos: vecinosDe(client.username) })
    return
  }
  if (msg.type === 'mundo_salir') { salirDelMundo(client.username); return }

  // Entradas del combate en tiempo real. Se sanean en entradaArena().
  if (msg.type === 'arena_entrada') { entradaArena(client.username, msg.entrada || {}); return }
  if (msg.type === 'arena_abandonar') {
    const fin = abandonarArena(client.username)
    if (fin) wsSend(client, { type: 'arena_fin', ...fin })
    return
  }

  if (msg.type === 'chat') {
    const player = store.players[client.username]
    if (!player) { wsDrop(client); return }
    if (player.muteUntil > now()) { wsSend(client, { type: 'error', error: 'Estás silenciado' }); return }
    if (!rateLimit('chat:' + player.character.id, 8, 20_000)) {
      wsSend(client, { type: 'error', error: 'Demasiados mensajes. Espera unos segundos.' })
      return
    }
    const text = String(msg.message || '').trim().slice(0, 200)
    if (!text) return
    const stored = pushChatMessage(player.character, text, msg.channel)
    if (!stored) { wsSend(client, { type: 'error', error: 'No repitas el mismo mensaje' }); return }
    wsBroadcast({ type: 'chat', message: stored })
  }
}

// Misma función que usa el endpoint HTTP: un solo sitio donde se
// sanea y se guarda, para que los dos caminos no diverjan.
function pushChatMessage(char, raw, channel) {
  const clean = sanitize(String(raw).trim().slice(0, 200))
  if (!clean) return null
  const last = store.chatMessages.filter(m => m.characterId === char.id).slice(-3)
  if (last.length === 3 && last.every(m => m.message === clean)) return null
  const msg = {
    id: nextId('msg'), characterId: char.id, username: sanitize(char.name), level: char.level,
    message: clean, channel: ['global', 'guild', 'trade'].includes(channel) ? channel : 'global',
    timestamp: now(),
  }
  store.chatMessages.push(msg)
  if (store.chatMessages.length > 200) store.chatMessages.shift()
  return msg
}

// Handshake. Requiere una sesión válida: el WebSocket no es una puerta
// trasera para entrar sin autenticarse.
// Cuenta TODO intento de handshake, antes de mirar nada. Si esto se
// queda en cero mientras el navegador dice "error de conexión", la
// petición ni siquiera llega a Node: el problema está en medio
// (antivirus, proxy, extensión), no en el servidor.
let wsIntentos = 0

function wsUpgrade(req, socket, head) {
  wsIntentos++
  const key = req.headers['sec-websocket-key']
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') {
    wsRechazar(req, socket, 400, 'no es una petición de WebSocket'); return
  }
  const player = getPlayer(req)
  if (!player) {
    wsRechazar(req, socket, 401, req.headers.cookie ? 'sesión caducada o desconocida' : 'la petición llegó sin cookie')
    return
  }
  // Antes eran 30 por minuto. Una recarga gasta dos (launcher + módulo)
  // y cambiar de pantalla gasta otra, así que jugando un rato normal se
  // llegaba al tope y el socket empezaba a fallar sin explicación.
  if (!rateLimit('ws:' + clientIp(req), 120, 60_000)) {
    wsRechazar(req, socket, 429, 'demasiadas conexiones desde esta IP en un minuto'); return
  }

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${wsAccept(key)}`,
    '', '',
  ].join('\r\n'))

  socket.setNoDelay(true)
  const client = { socket, username: player.username, char: player.character, alive: true, joinedAt: now() }
  wsClients.add(client)

  let buffer = head && head.length ? Buffer.from(head) : Buffer.alloc(0)
  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk])
    if (buffer.length > WS_MAX_FRAME * 4) { wsDrop(client); return }
    buffer = wsReadFrames(client, buffer)
  })
  socket.on('error', () => wsDrop(client))
  socket.on('close', () => wsDrop(client))
  // Sin este 'end' un cliente que cierra la mitad de lectura deja el
  // socket a medias y seguiría contando como conectado para siempre.
  socket.on('end', () => wsDrop(client))
  socket.setTimeout(WS_PING_MS * 3, () => wsDrop(client))

  // Estado inicial: historial reciente y quién está conectado
  wsSend(client, { type: 'hello', you: player.character.name, messages: store.chatMessages.slice(-30) })
  wsBroadcast({ type: 'presence', online: wsOnline() })
}

// Latido: se cierran los sockets que dejaron de responder
setInterval(() => {
  for (const c of [...wsClients]) {
    if (!c.alive) { wsDrop(c); continue }
    c.alive = false
    try { c.socket.write(wsFrame('', 0x9)) } catch { wsDrop(c) }
  }
}, WS_PING_MS).unref?.()
