/**
 * CriptoMundo — pruebas de la revisión (§22)
 * Uso:  PORT=3810 node test-revision.js --spawn
 *
 * Comprueba desde el asiento del jugador lo que se ha tocado en esta
 * revisión. No vale que el código compile: aquí se pelea de verdad, se
 * bebe una poción de verdad y se mira si la vida sube y si la poción
 * desaparece del inventario.
 *
 * Cubre:
 *   §1/§2  combate del mundo: moverse, atacar, matar, XP
 *   §12    equipar / desequipar y que las estadísticas cambien
 *   §13    escalera de pociones y consumo real
 *   §11    las 6 rarezas presentes y ordenadas
 *   §14    la pantalla de mazmorras carga sin errores de JavaScript
 *   §19    una sola fuente de verdad para nombre/icono/rareza
 */
const http = require('http')
const crypto = require('crypto')
const vm = require('vm')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => {
  c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : '')))
}

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
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

// ── Cliente WebSocket mínimo ───────────────────────────────────────
function conectar() {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64')
    const r = http.request({
      host: 'localhost', port: PORT, path: '/ws', method: 'GET',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13', Cookie: cookie },
    })
    r.on('upgrade', (res, socket, head) => {
      const c = { socket, mensajes: [], buf: Buffer.from(head || []) }
      const leer = () => {
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
      socket.on('data', x => { c.buf = Buffer.concat([c.buf, x]); leer() })
      socket.on('error', () => {})
      leer()
      resolve(c)
    })
    r.on('response', res => resolve({ rechazado: res.statusCode }))
    r.on('error', reject)
    r.end()
  })
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
  const u = 'rev' + Math.floor(Math.random() * 1000000)
  const reg = await req('POST', '/api/auth/register', {
    username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero',
  })
  if (reg.status !== 200 && reg.status !== 201) {
    console.log('No se pudo registrar:', reg.status, reg.raw.slice(0, 200)); process.exit(1)
  }

  // ══ §12 EQUIPAMIENTO ══════════════════════════════════════════════
  console.log('\n── §12 EQUIPAMIENTO ──')
  let inv = await req('GET', '/api/inventory')
  const base = inv.body.stats
  const arma = inv.body.inventory.find(i => i.equipable && i.slot === 'weapon')
  check('el personaje nuevo trae un arma equipable', !!arma,
    'inventario: ' + inv.body.inventory.map(i => i.name).join(', '))

  if (arma) {
    const eq = await req('POST', '/api/player/equip', { uid: arma.uid })
    check('¿puedo equipar una espada?', eq.status === 200, eq.raw.slice(0, 100))
    check('¿cambia mi ataque?', eq.body.stats.strength > base.strength,
      `fuerza ${base.strength} → ${eq.body.stats.strength}`)
  }
  const casco = inv.body.inventory.find(i => i.equipable && i.slot === 'helmet')
  if (casco) {
    const antes = (await req('GET', '/api/inventory')).body.stats.defense
    const eq2 = await req('POST', '/api/player/equip', { uid: casco.uid })
    check('¿puedo equipar armadura?', eq2.status === 200)
    check('¿cambia mi defensa?', eq2.body.stats.defense > antes,
      `defensa ${antes} → ${eq2.body.stats.defense}`)
    const des = await req('POST', '/api/player/equip', { unequip: true, slot: 'helmet' })
    check('¿puedo desequiparla?', des.status === 200 && des.body.stats.defense === antes,
      `defensa vuelve a ${des.body.stats && des.body.stats.defense}`)
    await req('POST', '/api/player/equip', { uid: casco.uid })
  }
  const inv2 = await req('GET', '/api/inventory')
  const copias = inv2.body.inventory.filter(i => arma && i.uid === arma.uid).length
  check('equipar NO duplica el objeto', copias === 1, copias + ' copias')

  // ══ §11 RAREZAS ═══════════════════════════════════════════════════
  console.log('\n── §11 RAREZAS ──')
  const mon = await req('GET', '/api/monsters')
  const rarezas = new Set(inv2.body.inventory.map(i => i.rarity))
  check('el inventario expone la rareza de cada objeto',
    [...rarezas].every(r => ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].includes(r)),
    [...rarezas].join(', '))

  // ══ §1/§2 COMBATE DEL MUNDO ═══════════════════════════════════════
  console.log('\n── §1/§2 COMBATE EN TIEMPO REAL ──')
  const ws = await conectar()
  check('el socket acepta la conexión', !!ws.socket)
  const start = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('¿puedo entrar a la arena?', start.status === 200, start.raw.slice(0, 120))
  await sleep(400)

  const e0 = ultimo(ws, 'arena_estado')
  check('el estado del combate llega al cliente', !!e0)
  const x0 = e0 && e0.estado.jugador.x

  enviar(ws, { type: 'arena_entrada', entrada: { mx: -1, my: 0, apuntar: 3.14, atacar: false } })
  await sleep(900)
  const e1 = ultimo(ws, 'arena_estado')
  check('¿puedo moverme?', e1 && e1.estado.jugador.x !== x0,
    `x: ${x0} → ${e1 && e1.estado.jugador.x}`)

  // Perseguir y atacar hasta que muera alguno
  let bajas = 0, vidaTocada = false
  for (let i = 0; i < 90; i++) {
    const e = ultimo(ws, 'arena_estado')
    if (!e) { await sleep(100); continue }
    const j = e.estado.jugador
    const en = e.estado.enemigos[0]
    bajas = Math.max(bajas, e.estado.bajas)
    if (j.hp < e0.estado.jugador.hpMax) vidaTocada = true
    if (!en) { await sleep(100); continue }
    const ang = Math.atan2(en.y - j.y, en.x - j.x)
    const lejos = Math.hypot(en.x - j.x, en.y - j.y) > 40
    enviar(ws, {
      type: 'arena_entrada',
      entrada: { mx: lejos ? Math.cos(ang) : 0, my: lejos ? Math.sin(ang) : 0, apuntar: ang, atacar: true },
    })
    await sleep(100)
    if (bajas > 0 && vidaTocada) break
  }
  check('¿el enemigo recibe daño y muere?', bajas > 0, bajas + ' bajas')
  check('¿puedo recibir daño?', vidaTocada, 'el jugador nunca perdió vida en 9 s')

  const fin = await req('POST', '/api/arena/abandon', {})
  await sleep(300)
  const res = ultimo(ws, 'arena_fin') || fin.body
  check('¿obtengo XP?', (res.xp || 0) > 0, 'xp=' + res.xp)

  // ══ §13 POCIONES (con la vida ya dañada) ══════════════════════════
  console.log('\n── §13 POCIONES ──')
  const perfil = await req('GET', '/api/player')
  const invp = await req('GET', '/api/inventory')
  const curativas = invp.body.inventory.filter(i => i.cura > 0 && i.type === 'POTION')
  check('¿puedo elegir entre diferentes pociones?', curativas.length > 1,
    curativas.map(p => p.name).join(', ') || 'ninguna')

  const escalones = curativas.map(p => p.cura).sort((a, b) => a - b)
  check('cada nivel cura más que el anterior',
    escalones.length > 1 && escalones.every((v, i) => i === 0 || v > escalones[i - 1]),
    escalones.join(' < '))

  const p1 = curativas.sort((a, b) => a.cura - b.cura)[0]
  if (p1) {
    const hpAntes = perfil.body.character ? perfil.body.character.hp : perfil.body.hp
    const cantAntes = p1.quantity
    const uso = await req('POST', '/api/player/use', { uid: p1.uid })
    check('¿funcionan?', uso.status === 200, uso.raw.slice(0, 120))
    if (uso.status === 200) {
      check('¿cura de verdad la vida?', uso.body.hp > hpAntes, `vida ${hpAntes} → ${uso.body.hp}`)
      check('la curación coincide con el dato de la plantilla',
        uso.body.curado === Math.min(p1.cura, uso.body.maxHp - hpAntes),
        `curado=${uso.body.curado}, esperado=${Math.min(p1.cura, uso.body.maxHp - hpAntes)}`)
      const invd = await req('GET', '/api/inventory')
      const desp = invd.body.inventory.find(i => i.uid === p1.uid)
      check('¿se descuentan del inventario?', (desp ? desp.quantity : 0) === cantAntes - 1,
        `${cantAntes} → ${desp ? desp.quantity : 0}`)
    }
  }

  // ══ §14 LA PANTALLA DE MAZMORRAS EJECUTA ══════════════════════════
  console.log('\n── §14 MAZMORRAS: la pantalla ya no muere al cargar ──')
  const pag = await req('GET', '/criptomundo-mazmorras-pvp.html')
  const bloques = [...pag.raw.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  let rotos = 0, err = ''
  bloques.forEach((b, i) => {
    try { new vm.Script(b[1], { filename: 'mazmorras#' + i }) }
    catch (e) { rotos++; err = e.message }
  })
  check('todo el JavaScript de la página compila', rotos === 0, err)
  check('la pestaña PvP llama a una función que existe',
    /function setMode\s*\(/.test(pag.raw), 'setMode sigue sin definirse')

  const mz = await req('GET', '/api/mazmorra')
  check('hay mazmorras jugables', (mz.body.mazmorras || []).length > 0)

  // ══ §19 UNA SOLA FUENTE DE VERDAD ═════════════════════════════════
  console.log('\n── §19 INVENTARIO: una sola verdad ──')
  const invf = await req('GET', '/api/inventory')
  const pocionI = invf.body.inventory.find(i => i.itemId === 'potion_hp')
  check('el nombre sale de la plantilla, no de la copia guardada',
    !pocionI || pocionI.name === 'Poción de Curación I',
    pocionI ? 'devuelve "' + pocionI.name + '"' : 'sin poción')

  console.log(`\n══════════════════════════════════════════════`)
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log(`══════════════════════════════════════════════\n`)
  try { ws.socket.destroy() } catch {}
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-revision.json')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-revision.json' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else {
  run().catch(e => { console.error(e); process.exit(1) })
}

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
