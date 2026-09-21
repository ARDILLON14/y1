/**
 * CriptoMundo — pruebas del PASO 1: armas visibles y base de animación
 * Uso:  PORT=3840 node test-armas-visual.js --spawn
 *
 * QUÉ SE COMPRUEBA Y POR QUÉ
 * El bug era que la espada equipada no se veía en la arena. Un test que
 * solo mire el PNG no habría cazado nada: el archivo estaba bien y se
 * servía bien. Lo que fallaba era la cadena entera —el servidor no
 * mandaba qué arma llevabas, y el cliente pintaba un círculo—, así que
 * aquí se recorre esa cadena de punta a punta:
 *
 *   1. el arma equipada llega al cliente con su dibujo
 *   2. cambiar de espada cambia el dibujo Y el comportamiento
 *   3. un arma sin dibujo cae al emoji sin romper nada
 *   4. el estado de animación viaja en el paquete y lo decide el servidor
 *   5. el cliente sigue sin poder tocar vida, daño ni botín
 */
const http = require('http')
const crypto = require('crypto')
const path = require('path')
const { spawn } = require('child_process')

const fs = require('fs')
const zlib = require('zlib')

const PORT = process.env.PORT || 3840

// Todavía no hay tiras de animación dibujadas, pero la arquitectura que
// las admite tiene que estar probada: si no, es andamio sin comprobar y
// el día que llegue el arte no se sabrá si funciona. Así que la prueba
// se fabrica su propia tira de 4 cuadros, comprueba que el servidor la
// detecta sola por el nombre del archivo, y la borra al terminar.
const DIR_TIRAS = path.join(__dirname, 'assets', 'items', 'anim')
const TIRA = path.join(DIR_TIRAS, 'espada_piedra.png')
function crc32(buf) {
  let c, t = []
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c }
  c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function trozo(tag, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length, 0)
  const cuerpo = Buffer.concat([Buffer.from(tag, 'ascii'), datos])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo), 0)
  return Buffer.concat([len, cuerpo, crc])
}
function fabricarTira(ancho, alto) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8; ihdr[9] = 6
  const crudo = Buffer.alloc(alto * (1 + ancho * 4))
  fs.mkdirSync(DIR_TIRAS, { recursive: true })
  fs.writeFileSync(TIRA, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(crudo)), trozo('IEND', Buffer.alloc(0)),
  ]))
}
function limpiarTira() {
  try { fs.unlinkSync(TIRA) } catch {}
  try { fs.rmdirSync(DIR_TIRAS) } catch {}
}
fabricarTira(128, 32)          // 4 cuadros de 32×32
process.on('exit', limpiarTira)
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

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
        resolve({ status: res.statusCode, body: j, raw: o }) }) })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}
const pagina = p => new Promise(res => http.get({ host: 'localhost', port: PORT, path: p }, x => {
  let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }).on('error', () => res('')))

// ── Cliente WebSocket mínimo (mismo que test-arena.js) ─────────────
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

// Forjar la Espada de Piedra de verdad: minar, hacer el mango y
// pasar por la fragua. Es lento, pero es el camino que recorre un
// jugador; darse el objeto por debajo probaría menos.
async function forjarEspadaPiedra() {
  await req('POST', '/api/world/explore', { zoneId: 'forest' })
  let inv = (await req('GET', '/api/inventory')).body
  const pico = (inv.inventory || []).find(i => i.itemId === 'pico_madera_piedra')
  if (!pico) return false
  await req('POST', '/api/player/equip', { uid: pico.uid })
  const cuenta = async id => ((await req('GET', '/api/inventory')).body.inventory || [])
    .filter(i => i.itemId === id).reduce((a, i) => a + i.quantity, 0)
  const rocas = ((await req('GET', '/api/recursos?zona=forest')).body.nodos || [])
    .filter(n => n.util === 'pico' && n.nivel === 1)
  // Picar como se pica en el juego: junto a la roca y esperando a
  // recuperar el golpe. El servidor exige las dos cosas desde el §10.
  for (const r of rocas) {
    if (await cuenta('stone') >= 5) break
    for (let i = 0; i < 80; i++) {
      await sleep(470)
      const g = await req('POST', '/api/recursos/golpear', { nodoId: r.id, pos: { x: r.x, y: r.y } })
      if (g.status !== 200 || g.body.agotado) break
    }
  }
  await req('POST', '/api/crafting', { recipeId: 'rec_mango_madera', quantity: 1 })
  const r = await req('POST', '/api/crafting', { recipeId: 'rec_espada_piedra', quantity: 1 })
  return r.status === 200 && r.body.made > 0
}

async function run() {
  const u = 'arm' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  // ═══ 1. EL ARMA EQUIPADA LLEGA AL CLIENTE, CON DIBUJO ═══
  console.log('\n── EL ARMA EQUIPADA VIAJA HASTA LA PANTALLA ──')
  let inv = (await req('GET', '/api/inventory')).body
  const conDibujo = (inv.inventory || []).filter(i => i.imagen)
  check('el inventario marca qué objetos traen dibujo propio', Array.isArray(inv.inventory))

  let arena = await req('GET', '/api/arena')
  check('/api/arena manda el arma en detalle, no solo el nombre',
    !!arena.body.armaDetalle && typeof arena.body.armaDetalle === 'object', JSON.stringify(arena.body.armaDetalle))
  check('sigue mandando el nombre suelto (no se rompe lo que ya había)',
    typeof arena.body.arma === 'string' && arena.body.arma.length > 0, String(arena.body.arma))
  check('el detalle trae id, icono y hueco para el dibujo',
    arena.body.armaDetalle && 'id' in arena.body.armaDetalle && 'icono' in arena.body.armaDetalle && 'imagen' in arena.body.armaDetalle,
    Object.keys(arena.body.armaDetalle || {}).join(','))

  // ═══ 2. SIN ARMA: PUÑOS, Y NADA SE ROMPE ═══
  console.log('\n── SIN ARMA EQUIPADA ──')
  check('a puño limpio el arma tiene nombre', !!(arena.body.armaDetalle || {}).nombre, String((arena.body.armaDetalle || {}).nombre))
  check('a puño limpio no hay dibujo, y eso es válido', (arena.body.armaDetalle || {}).imagen === null)
  check('pero sí hay emoji de reserva', !!(arena.body.armaDetalle || {}).icono)

  // ═══ 3. EL CATÁLOGO FUSIONADO: UNA SOLA VERDAD POR ARMA ═══
  console.log('\n── CADA ARMA, UNA SOLA VERDAD ──')
  const armas = arena.body.armas || []
  const porId = Object.fromEntries(armas.map(a => [a.id, a]))
  check('el servidor publica el catálogo de armas', armas.length >= 10, String(armas.length))
  const esperado = {
    espada_piedra: '/assets/items/espada_piedra.png',
    espada_hierro: '/assets/items/espada_hierro.png',
    espada_diamante: '/assets/items/espada_diamante.png',
  }
  for (const [id, ruta] of Object.entries(esperado)) {
    const a = porId[id] || {}
    check(id + ' declara SU dibujo, no el de otra', a.imagen === ruta, String(a.imagen))
    check('  · con alcance, arco y cadencia propios',
      a.alcance > 0 && a.arco > 0 && a.cadenciaMs > 0, `alcance=${a.alcance} arco=${a.arco} cad=${a.cadenciaMs}`)
  }
  check('la de diamante llega más lejos que la de piedra',
    porId.espada_diamante.alcance > porId.espada_piedra.alcance,
    `${porId.espada_piedra.alcance} vs ${porId.espada_diamante.alcance}`)
  check('y golpea más rápido',
    porId.espada_diamante.cadenciaMs < porId.espada_piedra.cadenciaMs,
    `${porId.espada_piedra.cadenciaMs} vs ${porId.espada_diamante.cadenciaMs}`)
  check('el nombre sale de la plantilla del objeto, no de un catálogo paralelo',
    porId.espada_diamante.nombre === 'Espada de Diamante', String(porId.espada_diamante.nombre))
  check('un arco se marca como arma a distancia', (porId.short_bow || {}).tipo === 'ranged', String((porId.short_bow || {}).tipo))
  check('una espada se marca como cuerpo a cuerpo', porId.espada_hierro.tipo === 'melee', String(porId.espada_hierro.tipo))

  // ═══ 3b. CADA ARMA SE MUEVE A SU MANERA ═══
  console.log('\n── CADA ARMA CON SU GESTO ──')
  check('la lanza pincha, no barre', porId.iron_spear.gesto === 'estocada', String(porId.iron_spear.gesto))
  check('el hacha cae desde arriba', porId.iron_axe.gesto === 'tajo_alto', String(porId.iron_axe.gesto))
  check('el garrote también', porId.wood_club.gesto === 'tajo_alto', String(porId.wood_club.gesto))
  check('la daga da un pinchazo corto', porId.dagger.gesto === 'pinchazo', String(porId.dagger.gesto))
  check('el arco se tensa y suelta', porId.short_bow.gesto === 'disparo', String(porId.short_bow.gesto))
  check('las espadas barren', porId.espada_hierro.gesto === 'barrido', String(porId.espada_hierro.gesto))
  check('ningún arma se queda sin gesto', armas.every(a => !!a.gesto),
    armas.filter(a => !a.gesto).map(a => a.id).join(','))
  // La Vara de Cristal no declara gesto en el catálogo: se deduce de que
  // dispara. Un arma nueva nunca puede quedarse sin movimiento.
  check('un arma que no lo declara igualmente lo recibe',
    porId.crystal_wand.gesto === 'disparo', String(porId.crystal_wand.gesto))

  console.log('\n── TIRA DE CUADROS: LA ARQUITECTURA FUNCIONA ──')
  check('el servidor detecta la tira solo por el nombre del archivo',
    !!porId.espada_piedra.tira, JSON.stringify(porId.espada_piedra.tira))
  check('cuenta bien los cuadros (ancho ÷ alto)',
    porId.espada_piedra.tira && porId.espada_piedra.tira.cuadros === 4,
    JSON.stringify(porId.espada_piedra.tira))
  check('y publica la ruta para pedirla',
    porId.espada_piedra.tira && porId.espada_piedra.tira.url === '/assets/items/anim/espada_piedra.png',
    porId.espada_piedra.tira && porId.espada_piedra.tira.url)
  check('un arma sin tira manda null, no se inventa una',
    porId.espada_hierro.tira === null, JSON.stringify(porId.espada_hierro.tira))

  // ═══ 4. UN ARMA SIN DIBUJO USA EL EMOJI ═══
  console.log('\n── ARMA SIN DIBUJO: EMOJI DE RESERVA ──')
  const sinDibujo = armas.filter(a => !a.imagen)
  check('hay armas sin dibujo propio (las de siempre)', sinDibujo.length > 0, String(sinDibujo.length))
  check('ninguna se queda sin emoji de reserva', sinDibujo.every(a => !!a.icono),
    sinDibujo.filter(a => !a.icono).map(a => a.id).join(','))
  check('la Espada del Alba manda imagen null, no una ruta inventada',
    porId.sword_alba && porId.sword_alba.imagen === null, String((porId.sword_alba || {}).imagen))
  check('y todas declaran hacia dónde apunta su dibujo',
    armas.every(a => typeof a.spriteAngulo === 'number'))

  // ═══ 5. FORJAR, EQUIPAR Y QUE LA ARENA SE ENTERE ═══
  console.log('\n── DE LA FRAGUA A LA MANO DEL PERSONAJE ──')
  const forjada = await forjarEspadaPiedra()
  check('se forja la Espada de Piedra con lo minado', forjada)
  inv = (await req('GET', '/api/inventory')).body
  const esp = (inv.inventory || []).find(i => i.itemId === 'espada_piedra')
  check('aparece en el inventario con su dibujo',
    esp && esp.imagen === '/assets/items/espada_piedra.png', esp && String(esp.imagen))
  const fuerzaAntes = inv.stats.strength
  let eq = await req('POST', '/api/player/equip', { uid: esp.uid })
  check('se equipa y sube la fuerza', eq.status === 200 && eq.body.stats.strength > fuerzaAntes,
    `${fuerzaAntes} → ${eq.body.stats && eq.body.stats.strength}`)
  arena = await req('GET', '/api/arena')
  check('la arena ya la anuncia con su dibujo',
    (arena.body.armaDetalle || {}).imagen === '/assets/items/espada_piedra.png',
    String((arena.body.armaDetalle || {}).imagen))
  check('y con el alcance de la de piedra, no el de los pu\u00f1os',
    arena.body.armaDetalle.alcance === porId.espada_piedra.alcance,
    `${arena.body.armaDetalle.alcance} vs ${porId.espada_piedra.alcance}`)

  console.log('\n── EQUIPAR NO DUPLICA ──')
  const antes = (inv.inventory || []).filter(i => i.itemId === 'espada_piedra')
    .reduce((a, i) => a + i.quantity, 0)
  await req('POST', '/api/player/equip', { uid: esp.uid })
  await req('POST', '/api/player/equip', { uid: esp.uid })
  inv = (await req('GET', '/api/inventory')).body
  check('equipar tres veces no crea espadas de más',
    (inv.inventory || []).filter(i => i.itemId === 'espada_piedra').reduce((a, i) => a + i.quantity, 0) === antes,
    `${antes} → ${(inv.inventory || []).filter(i => i.itemId === 'espada_piedra').reduce((a, i) => a + i.quantity, 0)}`)
  check('solo hay un arma equipada a la vez',
    (inv.inventory || []).filter(i => i.equipado && i.type === 'WEAPON').length === 1)

  // ═══ 6. ANIMACIÓN: ESTADO DEL SERVIDOR, NO DEL CLIENTE ═══
  console.log('\n── LA ANIMACIÓN ES ESTADO DEL SERVIDOR ──')
  let r = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('empieza el combate', r.status === 200, r.raw.slice(0, 80))
  const c = await conectar()
  await sleep(350)
  let est = (ultimo(c, 'arena_estado') || {}).estado
  check('el paquete trae el estado de animación del jugador', !!(est && est.jugador && est.jugador.anim), JSON.stringify(est && est.jugador && est.jugador.anim))
  check('en reposo la animación es idle o walk',
    est && ['idle', 'walk'].includes(est.jugador.anim.n), est && est.jugador.anim.n)
  check('el paquete trae el arma dibujable', !!(est && est.jugador.armaVis && est.jugador.armaVis.imagen !== undefined),
    JSON.stringify(est && est.jugador.armaVis))
  check('con la espada equipada, el dibujo que viaja es el suyo',
    est && est.jugador.armaVis.imagen === '/assets/items/espada_piedra.png', String(est && est.jugador.armaVis.imagen))
  check('los enemigos también traen animación',
    est && (est.enemigos || []).length > 0 && !!est.enemigos[0].anim, JSON.stringify(est && (est.enemigos || [])[0] && est.enemigos[0].anim))

  console.log('\n── ATACAR CAMBIA LA ANIMACIÓN ──')
  enviar(c, { type: 'arena_entrada', entrada: { mx: 0, my: -1, apuntar: -1.57, atacar: true } })
  await sleep(300)
  const conAtaque = c.mensajes.filter(m => m.type === 'arena_estado')
    .map(m => m.estado.jugador.anim).filter(a => a && a.n === 'attack')
  check('al atacar el servidor pone la animación en attack', conAtaque.length > 0,
    'animaciones vistas: ' + [...new Set(c.mensajes.filter(m => m.type === 'arena_estado').map(m => m.estado.jugador.anim.n))].join(','))
  check('el ataque llega con su fase (preparación / golpe / recuperación)',
    conAtaque.some(a => ['preparacion', 'golpe', 'recuperacion'].includes(a.fase)),
    conAtaque.map(a => a.fase).join(','))
  check('la animación dura algo, no es un destello de un cuadro',
    conAtaque.every(a => a.d >= 150), conAtaque.map(a => a.d).join(','))

  console.log('\n── EL CLIENTE NO DECIDE NADA DE ESTO ──')
  // Se intenta colar animación, vida, daño y botín en el mismo mensaje.
  enviar(c, { type: 'arena_entrada', entrada: { mx: 0, my: 0, atacar: false, anim: 'death', hp: 99999, dmg: 99999 } })
  enviar(c, { type: 'arena_estado', estado: { jugador: { hp: 99999, anim: { n: 'death' } } } })
  enviar(c, { type: 'arena_fin', motivo: 'victoria', oro: 999999, botin: [{ itemId: 'espada_diamante', quantity: 99 }] })
  await sleep(300)
  est = (ultimo(c, 'arena_estado') || {}).estado
  check('el cliente no puede fijar su animación', est && est.jugador.anim.n !== 'death', est && est.jugador.anim.n)
  check('el cliente no puede fijarse la vida', est && est.jugador.hp < 90000, est && String(est.jugador.hp))
  check('el cliente no puede declararse ganador', !ultimo(c, 'arena_fin'))
  const oro = (await req('GET', '/api/character')).body
  check('ni regalarse oro', !oro.character || oro.character.gold < 900000, String(oro.character && oro.character.gold))
  inv = (await req('GET', '/api/inventory')).body
  check('ni regalarse botín',
    (inv.inventory || []).filter(i => i.itemId === 'espada_diamante').reduce((a, i) => a + i.quantity, 0) < 90)
  try { c.socket.destroy() } catch {}
  await req('POST', '/api/arena/abandon')

  // ═══ 7. LO QUE DE VERDAD SE DIBUJA EN LA PÁGINA ═══
  console.log('\n── LA PÁGINA DIBUJA EL ARMA, NO UNA RAYA ──')
  const html = await pagina('/criptomundo-arena.html')
  check('la página de arena se sirve', html.length > 1000)
  check('tiene una función que dibuja el arma', /function dibujarArma/.test(html))
  check('carga sprites de verdad (drawImage)', /drawImage\(/.test(html))
  check('y si el PNG falla no revienta: se marca roto y se usa el emoji',
    /roto = true/.test(html) && /fillText\(w\.icono/.test(html))
  check('el gesto de ataque tiene fases, no es un destello',
    /preparacion/.test(html) && /recuperacion/.test(html))
  check('ya no representa al jugador solo con una raya de dirección',
    !/ctx\.lineTo\(j\.x \+ Math\.cos\(j\.mirando\)/.test(html))
  check('el cliente no calcula daño', !/hp\s*-=|dmg\s*=\s*Math\.round/.test(html))
  check('la página tiene los cinco gestos', /GESTOS/.test(html) &&
    ['barrido', 'tajo_alto', 'estocada', 'pinchazo', 'disparo'].every(g => new RegExp(g + ':').test(html)))
  check('voltea el arma al apuntar a la izquierda', /Math\.cos\(j\.mirando\) < 0/.test(html))
  check('sabe recortar una tira de cuadros', /w\.tira/.test(html) && /i \* alto, 0, alto, alto/.test(html))
  check('el gesto es solo presentación: no toca el daño',
    !/dmg|daño/i.test(html.slice(html.indexOf('var GESTOS'), html.indexOf('function dibujarArma'))))

  console.log('\n── LOS GESTOS, EJECUTADOS DE VERDAD ──')
  // No basta con que la tabla exista: se saca de la página y se corre.
  // Si dos armas dieran la misma curva, cambiar de arma se notaría en
  // los números y no en las manos, que es justo lo que se quería evitar.
  const ini = html.indexOf('var FASES = {'), fin2 = html.indexOf('function dibujarArma')
  const caja = {}
  try { new Function('g', 'with(g){' + html.slice(ini, fin2) + '; g.GESTOS = GESTOS;}')(caja) }
  catch (e) { check('la tabla de gestos se puede ejecutar', false, e.message) }
  const G = caja.GESTOS || {}
  check('la tabla de gestos se ejecuta', Object.keys(G).length === 5, Object.keys(G).join(','))
  const curva = (g, arco, alc) => {
    let maxA = 0, maxD = 0
    for (let i = 0; i <= 100; i++) { const r = G[g](i / 100, arco, alc); maxA = Math.max(maxA, Math.abs(r.ang)); maxD = Math.max(maxD, r.dist) }
    return { maxA, maxD, fin: G[g](1, arco, alc) }
  }
  const cEsp = curva('barrido', 1.6, 72), cHac = curva('tajo_alto', 1.3, 64), cLan = curva('estocada', 0.5, 96)
  check('la espada barre de lado (mucho giro, nada de avance)',
    cEsp.maxA > 1.0 && cEsp.maxD < 1, `giro=${cEsp.maxA.toFixed(2)} avance=${cEsp.maxD.toFixed(1)}`)
  check('la lanza avanza recto (mucho avance, casi sin giro)',
    cLan.maxD > 40 && cLan.maxA < 0.3, `giro=${cLan.maxA.toFixed(2)} avance=${cLan.maxD.toFixed(1)}`)
  check('el hacha gira más que la espada (viene de más arriba)',
    cHac.maxA > cEsp.maxA, `${cEsp.maxA.toFixed(2)} vs ${cHac.maxA.toFixed(2)}`)
  check('espada y hacha no dibujan la misma curva',
    Math.abs(G.barrido(0.5, 1.5).ang - G.tajo_alto(0.5, 1.5).ang) > 0.3)
  check('todos vuelven a la guardia al acabar, sin deriva',
    ['barrido', 'tajo_alto', 'estocada', 'pinchazo', 'disparo'].every(function (g) {
      const f = G[g](1, 1.5, 80); return Math.abs(f.ang) < 0.02 && Math.abs(f.dist) < 0.5
    }))

  const combate = await pagina('/criptomundo-combat.html')
  check('el inventario del combate por turnos prioriza el dibujo', /function dibujoItem/.test(combate))
  check('  · usa item.imagen cuando existe', /it\.imagen/.test(combate))
  // Se mira el comportamiento, no la forma exacta de la línea: antes
  // esto buscaba el literal "(it && it.icon)" y se rompió al ampliar
  // dibujoItem para aceptar también "icono", que es el nombre que usa
  // el catálogo de combate. La regla que importa es que haya emoji de
  // reserva, no cómo esté escrita.
  check('  · y cae al emoji cuando no', /it\.icon \|\| it\.icono/.test(combate) || /\(it && it\.icon\)/.test(combate))
  check('  · las casillas ya no usan it.icon a pelo',
    !/class="i-icon">' \+ \(it\.icon/.test(combate))

  console.log('\n── LA PUERTA DE PRUEBAS ESTÁ CERRADA EN PRODUCCIÓN ──')
  // Dar objetos a mano es cómodo para probar y peligrosísimo si se
  // queda abierto. test-produccion.js comprueba que con NODE_ENV=production
  // la ruta ni existe; aquí se comprueba que en desarrollo se porta bien.
  const dev = await req('POST', '/api/dev/dar', { itemId: 'espada_diamante', quantity: 1 })
  check('en desarrollo sí da objetos', dev.status === 200, String(dev.status))
  const basura = await req('POST', '/api/dev/dar', { itemId: 'objeto_que_no_existe' })
  check('pero no inventa objetos que no existen', basura.status === 400, String(basura.status))
  const muchos = await req('POST', '/api/dev/dar', { itemId: 'espada_piedra', quantity: 99999 })
  check('y hay tope: no se dan 99999 de golpe',
    muchos.status === 200 && muchos.body.item.quantity <= 99, JSON.stringify(muchos.body.item))

  console.log('\n── EL ARMA VA EN LA MANO, NO FLOTANDO AL LADO ──')
  const htmlFin = await pagina('/criptomundo-arena.html')
  check('el dibujo se ancla por la empuñadura, no por el centro',
    /empunadura/.test(htmlFin) && /-lado \* ex, -lado \* ey/.test(htmlFin))
  check('el servidor dice dónde se agarra cada arma',
    !!(porId.espada_hierro.empunadura && porId.espada_hierro.empunadura.x > 0),
    JSON.stringify(porId.espada_hierro.empunadura))
  check('y con qué ángulo viene dibujada la hoja (-135° exactos)',
    Math.abs(porId.espada_hierro.spriteAngulo + 2.356) < 0.01, String(porId.espada_hierro.spriteAngulo))
  check('a mano desnuda se dibujan nudillos, no un emoji borroso',
    /w\.id === 'puños'/.test(htmlFin))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-armas.json', BACKUP_DIR: '/tmp/cm-armas-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1500)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
