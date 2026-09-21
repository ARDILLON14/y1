#!/usr/bin/env node
/**
 * CriptoMundo — prueba de carga
 *
 *   node carga.js               50 jugadores durante 30 s
 *   node carga.js 200 60        200 jugadores durante 60 s
 *   node carga.js 50 30 --ws    además abre un WebSocket por jugador
 *
 * Para qué sirve: llevo varias versiones diciendo que PostgreSQL es
 * prematuro "porque el JSON aguanta". Esto convierte esa opinión en un
 * número: cuántos jugadores concurrentes soporta antes de que las
 * respuestas se degraden. Cuando el percentil 95 se dispare, ese es el
 * momento de migrar, y no antes.
 *
 * Cada jugador simulado hace lo que hace uno real: pelea, mira el
 * inventario, consulta el mercado y habla por el chat.
 */
const http = require('http')
const crypto = require('crypto')

const HOST = process.env.HOST || 'localhost'
const PORT = Number(process.env.PORT || 3000)
const JUGADORES = Number(process.argv[2]) || 50
const SEGUNDOS = Number(process.argv[3]) || 30
const CON_WS = process.argv.includes('--ws')

const agente = new http.Agent({ keepAlive: true, maxSockets: 4096 })
const CUENTAS = process.env.CUENTAS || '/tmp/criptomundo-cuentas-carga.json'
const latencias = []          // solo peticiones de juego
const latenciasAlta = []      // registro y login (llevan scrypt: son lentos a propósito)
const errores = {}
let peticiones = 0, fallos = 0

function req(method, path, body, cookie) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const t0 = process.hrtime.bigint()
    const r = http.request({ host: HOST, port: PORT, path, method, agent: agente,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}) },
      res => {
        let o = ''
        res.on('data', c => o += c)
        res.on('end', () => {
          const ms = Number(process.hrtime.bigint() - t0) / 1e6
          // El registro y el login pasan por scrypt, que tarda cientos de
          // milisegundos ADREDE. Mezclarlos con el juego falsea el p95.
          if (path.startsWith('/api/auth/')) latenciasAlta.push(ms)
          else { latencias.push(ms); peticiones++ }
          if (res.statusCode >= 500) {
            fallos++
            errores['HTTP ' + res.statusCode] = (errores['HTTP ' + res.statusCode] || 0) + 1
          }
          let j = {}
          try { j = JSON.parse(o) } catch {}
          const sc = res.headers['set-cookie']
          resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : cookie })
        })
      })
    r.on('error', e => {
      fallos++
      errores[e.code || e.message] = (errores[e.code || e.message] || 0) + 1
      resolve({ status: 0, body: {} })
    })
    if (data) r.write(data)
    r.end()
  })
}

function abrirWs(cookie) {
  return new Promise(resolve => {
    const key = crypto.randomBytes(16).toString('base64')
    const r = http.request({ host: HOST, port: PORT, path: '/ws', method: 'GET', agent: agente,
      headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13', Cookie: cookie } })
    r.on('upgrade', (res, socket) => { socket.on('data', () => {}); socket.on('error', () => {}); resolve(socket) })
    r.on('response', () => resolve(null))
    r.on('error', () => resolve(null))
    r.end()
  })
}

const dormir = ms => new Promise(r => setTimeout(r, ms))
const azar = (a, b) => a + Math.random() * (b - a)

// El servidor limita los registros por IP (5 por hora), y con razón:
// si no, cualquiera crea mil cuentas. Para poder repetir la prueba sin
// desactivar esa protección, las cuentas creadas se guardan y se
// reutilizan entrando con su contraseña.
const fs = require('fs')
const PASS = 'clave-de-carga-1'
let pool = []
try { pool = JSON.parse(fs.readFileSync(CUENTAS, 'utf8')) } catch {}
let siguienteDelPool = 0

function guardarPool() {
  try { fs.writeFileSync(CUENTAS, JSON.stringify(pool), 'utf8') } catch {}
}

async function conseguirSesion(i) {
  // Primero se intenta reutilizar una cuenta ya creada
  if (siguienteDelPool < pool.length) {
    const c = pool[siguienteDelPool++]
    const r = await req('POST', '/api/auth/login', { email: c.email, password: PASS })
    if (r.status === 200) return r.cookie
  }
  const n = `Carga${Date.now().toString(36)}${i}`
  const email = `${n}@carga.test`
  const reg = await req('POST', '/api/auth/register', { username: n, email, password: PASS })
  if (reg.status === 201) { pool.push({ email }); return reg.cookie }
  if (reg.status === 429) limitados++
  return null
}

let limitados = 0
let sesiones = 0

async function jugador(i, hasta) {
  const cookie = await conseguirSesion(i)
  if (!cookie) return
  sesiones++
  let ws = null
  if (CON_WS) ws = await abrirWs(cookie)

  // Se escalonan las entradas para no crear una avalancha artificial
  await dormir(azar(0, 1500))

  while (Date.now() < hasta) {
    const d = Math.random()
    if (d < 0.5) await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' }, cookie)
    else if (d < 0.65) await req('GET', '/api/player', null, cookie)
    else if (d < 0.8) await req('GET', '/api/inventory', null, cookie)
    else if (d < 0.92) await req('GET', '/api/market', null, cookie)
    else await req('POST', '/api/chat', { message: 'hola ' + Math.random().toString(36).slice(2, 7) }, cookie)
    await dormir(azar(350, 900))   // ritmo humano, no bucle cerrado
  }
  if (ws) try { ws.destroy() } catch {}
}

function percentil(arr, p) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(s.length * p))]
}

async function main() {
  console.log(`\n${'═'.repeat(58)}`)
  console.log(`  PRUEBA DE CARGA — ${JUGADORES} jugadores · ${SEGUNDOS}s${CON_WS ? ' · con WebSocket' : ''}`)
  console.log(`${'═'.repeat(58)}\n`)

  const salud = await req('GET', '/api/health')
  if (salud.status !== 200) {
    console.error(`No hay servidor en ${HOST}:${PORT}. Arráncalo primero con: npm start\n`)
    process.exit(1)
  }
  const mem0 = salud.body

  const hasta = Date.now() + SEGUNDOS * 1000
  const t0 = Date.now()
  const avance = setInterval(() => {
    const restan = Math.max(0, Math.round((hasta - Date.now()) / 1000))
    process.stdout.write(`\r  ${peticiones} peticiones · p95 ${percentil(latencias, 0.95).toFixed(0)} ms · quedan ${restan}s   `)
  }, 1000)

  await Promise.all(Array.from({ length: JUGADORES }, (_, i) => jugador(i, hasta)))
  clearInterval(avance)
  guardarPool()

  const dur = (Date.now() - t0) / 1000
  const salud2 = await req('GET', '/api/health')

  console.log('\n\n── RESULTADOS ──\n')
  console.log(`  Jugadores activos   ${sesiones} de ${JUGADORES} pedidos`)
  console.log(`  Peticiones          ${peticiones} (${(peticiones / dur).toFixed(1)}/s)`)
  console.log(`  Latencia mediana    ${percentil(latencias, 0.5).toFixed(0)} ms`)
  console.log(`  Latencia p95        ${percentil(latencias, 0.95).toFixed(0)} ms`)
  console.log(`  Latencia p99        ${percentil(latencias, 0.99).toFixed(0)} ms`)
  console.log(`  Peor caso           ${Math.max(...latencias, 0).toFixed(0)} ms`)
  console.log(`  Fallos              ${fallos}${fallos ? '  ' + JSON.stringify(errores) : ''}`)
  console.log(`  Registro/login p95  ${percentil(latenciasAlta, 0.95).toFixed(0)} ms  (scrypt: lento a propósito)`)
  if (limitados) console.log(`  Limitados por IP    ${limitados} (protección antiabuso; se reutilizan cuentas guardadas)`)
  console.log(`  Jugadores en disco  ${mem0.players} → ${salud2.body.players}\n`)

  const p95 = percentil(latencias, 0.95)
  console.log('── VEREDICTO ──\n')
  if (sesiones < JUGADORES * 0.8) {
    // Sin este aviso el resultado engaña: "300 jugadores, 13 ms" cuando
    // en realidad solo entraron 2 es una medición sin valor.
    console.log(`  ⚪ Solo entraron ${sesiones} de ${JUGADORES}: esta medición NO vale para ${JUGADORES}.`)
    console.log('     El límite de registros por IP lo impidió. Para medir de verdad,')
    console.log(`     arranca el servidor con REGISTER_LIMIT_PER_HOUR=${JUGADORES * 2} (solo en pruebas).`)
  } else if (fallos > peticiones * 0.01) {
    console.log(`  🔴 ${fallos} fallos: el servidor no aguanta ${JUGADORES} jugadores.`)
  } else if (p95 > 1000) {
    console.log(`  🔴 p95 de ${p95.toFixed(0)} ms: con ${JUGADORES} jugadores el juego se siente lento.`)
    console.log('     Aquí sí toca mirar PostgreSQL o repartir en varios procesos.')
  } else if (p95 > 300) {
    console.log(`  🟡 p95 de ${p95.toFixed(0)} ms: aguanta ${JUGADORES}, pero ya se nota.`)
    console.log('     Repite con el doble de jugadores para encontrar el techo.')
  } else {
    console.log(`  🟢 p95 de ${p95.toFixed(0)} ms con ${JUGADORES} jugadores: va sobrado.`)
    console.log(`     Prueba con ${JUGADORES * 4} para saber dónde está el límite de verdad.`)
  }


  console.log('\n  Recuerda: esto mide el servidor, no el juego. Que aguante 500')
  console.log('  jugadores no significa que 500 personas quieran jugar.\n')
  console.log('  Los jugadores creados quedan en la base de datos. Si has usado')
  console.log('  la de producción, arranca con DATA_FILE apuntando a otro sitio.\n')
}

main()
