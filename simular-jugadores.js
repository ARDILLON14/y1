#!/usr/bin/env node
/**
 * CriptoMundo — cohorte simulada
 *
 *   node simular-jugadores.js                  10 jugadores, 3 minutos
 *   node simular-jugadores.js 25 5             25 jugadores, 5 minutos
 *   PORT=3000 node simular-jugadores.js --vivo usa un servidor ya arrancado
 *
 * Crea jugadores automáticos con distintos estilos de juego y los deja
 * jugar contra el servidor. Sirve para tres cosas:
 *
 *   1. Llenar el panel de analítica y comprobar que mide lo que debe.
 *   2. Ver la curva de economía con varios jugadores a la vez.
 *   3. Detectar cuellos de botella de progresión antes de exponerlo a nadie.
 *
 * IMPORTANTE: estos jugadores no se aburren, no se van y no opinan. La
 * retención y la diversión NO se pueden simular. Esto es un banco de
 * pruebas de balance, no un sustituto de gente real.
 */
const http = require('http')
const { spawn } = require('child_process')

const NUM = Number(process.argv[2]) || 10
const MINUTOS = Number(process.argv[3]) || 3
const VIVO = process.argv.includes('--vivo')
const PORT = Number(process.env.PORT || (VIVO ? 3000 : 4320))
const ADMIN = process.env.ADMIN_TOKEN || 'simulacion-token'
const DATA = '/tmp/cm-simulacion.json'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

function req(method, p, body, cookie, headers = {}) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {},
        cookie ? { Cookie: cookie } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : cookie }) }) })
    r.on('error', () => resolve({ status: 0, body: {}, cookie }))
    if (data) r.write(data); r.end()
  })
}

// Tres estilos de juego con ritmos distintos
const ESTILOS = [
  { nombre: 'moledor',   peso: 0.5, pausa: [400, 700],   quests: 0.3, mercado: 0.05, taller: 0.1 },
  { nombre: 'explorador', peso: 0.3, pausa: [800, 1600], quests: 0.8, mercado: 0.3,  taller: 0.4 },
  { nombre: 'casual',    peso: 0.2, pausa: [1500, 3500], quests: 0.5, mercado: 0.4,  taller: 0.3 },
]
function estiloAleatorio() {
  const r = Math.random()
  let acc = 0
  for (const e of ESTILOS) { acc += e.peso; if (r <= acc) return e }
  return ESTILOS[0]
}

const stats = { jugadores: 0, acciones: 0, kills: 0, muertes: 0, mazmorras: 0, compras: 0, misiones: 0, errores: {} }
function err(code) { stats.errores[code] = (stats.errores[code] || 0) + 1 }

async function jugador(i, hasta) {
  const estilo = estiloAleatorio()
  const id = Date.now().toString(36) + i
  let ck = ''

  const reg = await req('POST', '/api/auth/register', {
    username: `Sim${id}`, email: `sim${id}@test.local`, password: 'simulacion-1234',
    className: pick(['Guerrero', 'Mago', 'Asesino', 'Archimago']),
    appearance: { skinId: pick(['aventurero', 'guerrera', 'hechicero', 'sombra', 'stone_pepe', 'holy_pepe']) },
  })
  if (reg.status !== 201) { err('registro:' + reg.status); return null }
  ck = reg.cookie
  stats.jugadores++

  let char = reg.body.character
  const local = { estilo: estilo.nombre, kills: 0, muertes: 0, acciones: 0, nivelFinal: 1, mazmorras: 0 }

  // acepta un par de misiones al empezar
  if (Math.random() < estilo.quests) {
    await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' }, ck)
    await req('POST', '/api/quests', { questId: 'q_forge', action: 'accept' }, ck)
  }

  while (Date.now() < hasta) {
    const monstruo = char.level >= 8 ? 'm_golem' : char.level >= 5 ? 'm_troll' : 'm_spider'
    const r = await req('POST', '/api/combat/action', { monsterId: monstruo, action: Math.random() < 0.15 ? 'block' : 'attack' }, ck)
    local.acciones++; stats.acciones++
    if (r.status !== 200) err('combate:' + r.status)
    else {
      if (r.body.enemyDied) { local.kills++; stats.kills++ }
      if (r.body.playerDied) { local.muertes++; stats.muertes++; await req('POST', '/api/player/respawn', {}, ck) }
      if (r.body.newLevel) char.level = r.body.newLevel
    }

    // actividades secundarias según el estilo
    if (Math.random() < estilo.taller * 0.1) {
      const c = await req('POST', '/api/crafting', { recipeId: 'rec_potion', quantity: 1 }, ck)
      if (c.status !== 200) err('taller:' + c.status)
    }
    if (Math.random() < estilo.mercado * 0.08) {
      const mk = await req('GET', '/api/market', null, ck)
      const l = (mk.body.listings || []).filter(x => x.pricePerUnit < 60)[0]
      if (l) {
        const b = await req('POST', `/api/market/${l.id}/buy`, { quantity: 1 }, ck)
        if (b.status === 200) stats.compras++
      }
    }
    if (char.level >= 5 && Math.random() < 0.02) {
      const s = await req('POST', '/api/dungeon', { dungeonId: 'dng_crypt', action: 'start' }, ck)
      if (s.status === 200) {
        const runId = s.body.run.id
        for (let f = 0; f < 3; f++) { await sleep(8000); await req('POST', '/api/dungeon', { action: 'floor', runId }, ck) }
        await sleep(22000)
        const done = await req('POST', '/api/dungeon', { action: 'complete', runId }, ck)
        if (done.status === 200) { local.mazmorras++; stats.mazmorras++ }
      }
    }
    if (Math.random() < estilo.quests * 0.05) {
      const act = await req('GET', '/api/quests?status=active', null, ck)
      for (const q of act.body.quests || []) {
        const t = await req('POST', '/api/quests', { questId: q.questId, action: 'turnin' }, ck)
        if (t.status === 200) stats.misiones++
      }
    }

    await sleep(rnd(estilo.pausa[0], estilo.pausa[1]))
  }

  const fin = await req('GET', '/api/player', null, ck)
  if (fin.status === 200) {
    local.nivelFinal = fin.body.character.level
    local.oro = fin.body.character.gold
    local.cgrid = fin.body.character.cgrid
  }
  return local
}

function tabla(filas) {
  for (const f of filas) console.log('   ' + f)
}

async function informe() {
  const a = await req('GET', '/api/admin/analytics', null, '', { 'X-Admin-Token': ADMIN })
  const eco = await req('GET', '/api/economy/public')
  const line = '═'.repeat(62)

  console.log('\n' + line)
  console.log('  📊  RESULTADO DE LA COHORTE SIMULADA')
  console.log(line)

  console.log('\n── ACTIVIDAD ──')
  tabla([
    `jugadores creados     ${stats.jugadores}`,
    `acciones de combate   ${stats.acciones}`,
    `enemigos derrotados   ${stats.kills}`,
    `muertes               ${stats.muertes}`,
    `mazmorras completadas ${stats.mazmorras}`,
    `compras en el mercado ${stats.compras}`,
    `misiones entregadas   ${stats.misiones}`,
  ])

  if (Object.keys(stats.errores).length) {
    console.log('\n── RESPUESTAS NO OK (esperables: 429 por límite de ritmo) ──')
    tabla(Object.entries(stats.errores).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}  ×${v}`))
  }

  if (a.status === 200) {
    const s = a.body.resumen
    console.log('\n── LO QUE VE EL PANEL ──')
    tabla([
      `usuarios              ${s.usuariosTotales}`,
      `activos hoy           ${s.activosHoy}`,
      `minutos (mediana)     ${s.minutosMedianaPorJugador}`,
      `juegan +40 min        ${s.jugadoresQueSuperan40min}`,
    ])
    console.log('\n── EMBUDO ──')
    tabla(a.body.embudo.filter(x => x.usuarios > 0 || x.abandonanAqui > 0)
      .map(x => `${x.paso.padEnd(22)} ${String(x.usuarios).padStart(4)}  (${x.porcentaje}%)  se quedan aquí: ${x.abandonanAqui}`))
    const corte = a.body.embudo.filter(x => x.abandonanAqui > 0).sort((x, y) => y.abandonanAqui - x.abandonanAqui)[0]
    if (corte) console.log(`\n   → El paso donde más gente se queda es "${corte.paso}".`)
  } else {
    console.log('\n   (panel no accesible: arranca el servidor con ADMIN_TOKEN=' + ADMIN + ')')
  }

  if (eco.status === 200) {
    console.log('\n── ECONOMÍA ──')
    tabla([
      `oro creado hoy        ${eco.body.oro.creadoHoy.toLocaleString('es')}`,
      `oro quemado hoy       ${eco.body.oro.quemadoHoy.toLocaleString('es')}`,
      `balance neto          ${(eco.body.oro.creadoHoy - eco.body.oro.quemadoHoy).toLocaleString('es')}`,
      `oro en circulación    ${eco.body.oro.circulante.toLocaleString('es')}`,
      `CGRID emitido hoy     ${eco.body.cgrid.emitidoHoy} / ${eco.body.cgrid.topeDiarioGlobal}`,
    ])
    const neto = eco.body.oro.creadoHoy - eco.body.oro.quemadoHoy
    if (neto > eco.body.oro.creadoHoy * 0.8) {
      console.log('\n   ⚠️  Casi todo el oro creado se queda en circulación: faltan sumideros.')
      console.log('      Con muchos jugadores esto es inflación y los precios del mercado se disparan.')
    }
  }

  console.log('\n' + line)
  console.log('  Estos jugadores no se aburren ni se van: esto mide balance,')
  console.log('  no retención. Para saber si engancha hacen falta personas.')
  console.log(line + '\n')
}

async function main() {
  let child = null
  if (!VIVO) {
    try { require('fs').unlinkSync(DATA) } catch {}
    child = spawn('node', [__dirname + '/criptomundo.js'],
      { env: { ...process.env, PORT: String(PORT), DATA_FILE: DATA, ADMIN_TOKEN: ADMIN }, stdio: 'ignore' })
    await sleep(1500)
  }

  console.log(`\n🎮 Simulando ${NUM} jugadores durante ${MINUTOS} min en el puerto ${PORT}…`)
  console.log('   estilos: moledor (50%), explorador (30%), casual (20%)\n')

  const hasta = Date.now() + MINUTOS * 60 * 1000
  const progreso = setInterval(() => {
    const quedan = Math.max(0, Math.round((hasta - Date.now()) / 1000))
    process.stdout.write(`\r   ${stats.acciones} acciones · ${stats.kills} enemigos · quedan ${quedan}s   `)
  }, 2000)

  const resultados = await Promise.all(Array.from({ length: NUM }, (_, i) => jugador(i, hasta)))
  clearInterval(progreso)
  process.stdout.write('\r' + ' '.repeat(70) + '\r')

  const vivos = resultados.filter(Boolean)
  if (vivos.length) {
    console.log('\n── POR ESTILO DE JUEGO ──')
    for (const e of ESTILOS) {
      const g = vivos.filter(v => v.estilo === e.nombre)
      if (!g.length) continue
      const media = k => (g.reduce((a, v) => a + (v[k] || 0), 0) / g.length).toFixed(1)
      console.log(`   ${e.nombre.padEnd(11)} ${String(g.length).padStart(2)} jugadores · nivel medio ${media('nivelFinal')} · ${media('kills')} enemigos · ${media('muertes')} muertes · ${media('oro')} de oro`)
    }
  }

  await informe()
  if (child) child.kill()
  process.exit(0)
}

main()
