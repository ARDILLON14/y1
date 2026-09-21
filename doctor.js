#!/usr/bin/env node
/**
 * CriptoMundo — doctor
 *
 *   node doctor.js
 *
 * Arranca el servidor en un puerto libre, lo somete a una partida
 * automatizada y produce un informe con lo que conviene mejorar,
 * ordenado por importancia.
 *
 * No sustituye a jugadores reales: mide lo que se puede medir sin
 * ellos (configuración, balance, curvas, peso de los assets).
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn, execFileSync } = require('child_process')

const ROOT = __dirname
const PORT = Number(process.env.PORT || 4310)
const DATA = '/tmp/cm-doctor-' + Date.now() + '.json'

const findings = []   // { level: 'alto'|'medio'|'bajo'|'ok', area, msg, fix }
const add = (level, area, msg, fix) => findings.push({ level, area, msg, fix })
const sleep = ms => new Promise(r => setTimeout(r, ms))

let cookie = ''
function req(method, p, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {},
        cookie ? { Cookie: cookie } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, len: o.length, headers: res.headers }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}

// ── 1. Comprobaciones estáticas ──────────────────────────────────
function staticChecks() {
  // build sincronizado
  try {
    execFileSync('node', [path.join(ROOT, 'build.js'), '--check'], { stdio: 'pipe' })
    add('ok', 'compilación', 'El archivo generado coincide con src/.')
  } catch {
    add('alto', 'compilación', 'criptomundo.js está desfasado respecto a src/.', 'node build.js')
  }

  // assets
  const dir = path.join(ROOT, 'assets/skins')
  if (!fs.existsSync(dir)) {
    add('alto', 'assets', 'No existe assets/skins: las skins ilustradas no cargarán.', 'Copia la carpeta assets junto al ejecutable.')
  } else {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'))
    const pesados = files.filter(f => fs.statSync(path.join(dir, f)).size > 600 * 1024)
    const total = files.reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0)
    if (pesados.length) {
      add('medio', 'assets', `${pesados.length} PNG por encima de 600 KB (${pesados.join(', ')}).`,
        'Si no se usan en el juego, quítalos: solo hacen falta las variantes full/portrait/avatar.')
    }
    add('ok', 'assets', `${files.length} imágenes, ${Math.round(total / 1024)} KB en total.`)
  }

  // configuración de entorno
  if (!process.env.ADMIN_TOKEN) {
    add('medio', 'configuración', 'ADMIN_TOKEN no está definido: el panel de analítica queda cerrado.',
      'ADMIN_TOKEN=una_clave_larga node criptomundo.js')
  }
  if (process.env.NODE_ENV !== 'production') {
    add('bajo', 'configuración', 'NODE_ENV no es production (normal en desarrollo).',
      'En el servidor real: NODE_ENV=production, para cookies Secure y errores sin detalle.')
  }

  // persistencia
  add('medio', 'persistencia', 'Los datos se guardan en un JSON en disco.',
    'Aguanta desarrollo y pruebas pequeñas. Con decenas de jugadores concurrentes, migra a PostgreSQL (migrations/001_init.sql).')
}

// ── 2. Partida automatizada ──────────────────────────────────────
async function playthrough() {
  const rand = Math.floor(Math.random() * 1e9)
  const t0 = Date.now()

  const reg = await req('POST', '/api/auth/register', {
    username: 'Doctor' + rand, email: `d${rand}@test.local`, password: 'clave-de-prueba-1',
    className: 'Guerrero', appearance: { skinId: 'stone_pepe' },
  })
  if (reg.status !== 201) { add('alto', 'juego', 'No se puede registrar un personaje.', JSON.stringify(reg.body)); return null }

  const metrics = { kills: 0, deaths: 0, actions: 0, gold: 0, xp: 0, level: 1, loot: 0, levelTimes: {}, cgrid: 0 }
  let char = reg.body.character
  const startGold = char.gold

  await req('POST', '/api/quests', { questId: 'q_herbs', action: 'accept' })
  await req('POST', '/api/quests', { questId: 'q_trolls', action: 'accept' })

  // Juega hasta nivel 5 o hasta agotar el presupuesto de acciones
  const MAX_ACTIONS = 320
  while (metrics.actions < MAX_ACTIONS && metrics.level < 5) {
    const monster = metrics.level >= 3 ? 'm_troll' : 'm_spider'
    const r = await req('POST', '/api/combat/action', { monsterId: monster, action: 'attack' })
    metrics.actions++
    if (r.status !== 200) { await sleep(400); continue }
    const b = r.body
    if (b.enemyDied) { metrics.kills++; metrics.loot += (b.loot || []).length }
    if (b.playerDied) { metrics.deaths++; await req('POST', '/api/player/respawn', {}) }
    for (const lu of b.levelUps || []) {
      metrics.level = lu.level
      metrics.levelTimes[lu.level] = { seg: Math.round((Date.now() - t0) / 1000), acciones: metrics.actions, kills: metrics.kills }
    }
    await sleep(370)
  }

  const me = await req('GET', '/api/player')
  char = me.body.character
  metrics.gold = char.gold - startGold
  metrics.xp = char.xp
  metrics.level = char.level
  metrics.cgrid = char.cgrid

  // ¿se pueden completar las misiones aceptadas?
  const active = await req('GET', '/api/quests?status=active')
  const quests = (active.body.quests || []).map(q => ({
    id: q.questId,
    objetivos: q.quest.objectives.map(o => {
      const p = q.objectiveProgress.find(x => x.objectiveId === o.id)
      return { texto: o.text, clave: o.key, actual: p ? p.current : 0, meta: o.required }
    }),
  }))

  // Prueba de dificultad: pelear contra algo por encima de tu nivel
  // pulsando siempre "atacar", sin bloquear ni interrumpir. Si eso sale
  // gratis, la telegrafía y el bloqueo son decorado.
  const antes = char.hp
  let riesgo = { turnos: 0, hpPerdida: 0, murio: false, bloqueosIgnorados: 0 }
  for (let i = 0; i < 40; i++) {
    const r2 = await req('POST', '/api/combat/action', { monsterId: 'm_golem', action: 'attack' })
    if (r2.status !== 200) { await sleep(400); continue }
    riesgo.turnos++
    if (r2.body.telegraph) riesgo.bloqueosIgnorados++
    if (r2.body.playerDied) { riesgo.murio = true; await req('POST', '/api/player/respawn', {}); break }
    if (r2.body.enemyDied) break
    await sleep(370)
  }
  const despues = (await req('GET', '/api/player')).body.character
  riesgo.hpPerdida = Math.max(0, Math.round((1 - despues.hp / despues.maxHp) * 100))
  metrics.riesgo = riesgo

  // recorridos que un jugador nuevo intentará
  const probes = {}
  // Mazmorras jugables (v22). Se prueba entrar y salir sin dejar la
  // run abierta, que si no bloquea el resto del diagnóstico.
  const rMaz = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' })
  probes.mazmorra = rMaz.status
  // Guardar el motivo: "HTTP 400" no dice nada, "estás demasiado
  // herido" sí, y además puede ser el comportamiento correcto.
  if (rMaz.status !== 200) probes.mazmorraMotivo = rMaz.body.error
  if (rMaz.status === 200) await req('POST', '/api/mazmorra/retirarse', {})
  probes.arena = (await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })).status
  if (probes.arena === 200) await req('POST', '/api/arena/abandon', {})
  probes.recolectar = (await req('POST', '/api/gather', { nodoId: 'pozo' })).status
  probes.huerto = (await req('POST', '/api/farm/plant', { parcela: 0, semilla: 'semilla_trigo' })).status
  probes.pvp = (await req('POST', '/api/pvp/match', { wagerGold: 0 })).status
  probes.mercado = (await req('GET', '/api/market')).status
  probes.taller = (await req('POST', '/api/crafting', { recipeId: 'rec_potion', quantity: 1 })).status
  probes.explorar = (await req('POST', '/api/world/explore', { zoneId: 'forest' })).status

  return { metrics, quests, probes, tiempoSeg: Math.round((Date.now() - t0) / 1000), char }
}

// ── 3. Análisis del resultado ────────────────────────────────────
function analyse(r) {
  if (!r) return
  const m = r.metrics

  const kills = m.kills || 1
  const oroPorKill = Math.round(m.gold / kills)
  const accionesPorKill = (m.actions / kills).toFixed(1)
  const lootPorKill = (m.loot / kills).toFixed(2)

  add('ok', 'balance', `Partida simulada: ${m.actions} acciones, ${m.kills} enemigos, nivel ${m.level}, ${r.tiempoSeg}s.`)
  add('ok', 'balance', `Por enemigo: ${accionesPorKill} turnos, ${oroPorKill} de oro, ${lootPorKill} objetos.`)

  if (Number(accionesPorKill) > 8) {
    add('alto', 'balance', `Hacen falta ${accionesPorKill} turnos por enemigo: el combate se hace largo.`,
      'Sube el daño base o baja la vida de los enemigos de nivel bajo.')
  }
  if (m.level < 2) {
    add('alto', 'balance', `Tras ${m.actions} acciones el personaje sigue en nivel ${m.level}.`,
      'La primera subida de nivel debería llegar en los primeros minutos: baja xpForLevel(1).')
  }
  const t5 = m.levelTimes[5]
  if (!t5) {
    add('alto', 'progresión', 'No se alcanzó el nivel 5 dentro del presupuesto de la simulación.',
      'Nivel 5 es el requisito de la primera mazmorra: o baja el requisito a 3, o acelera la curva de experiencia inicial.')
  } else {
    add('ok', 'progresión', `Nivel 5 en ${t5.kills} enemigos (${t5.seg}s de juego automatizado).`)
    if (t5.kills > 25) {
      add('medio', 'progresión', `Llegar a nivel 5 cuesta ${t5.kills} enemigos: demasiado para el primer tramo.`,
        'En el embudo aparecerá como caída entre level_2 y first_dungeon.')
    }
  }
  // La dificultad se mide contra un enemigo por encima de tu nivel, no
  // contra los del tutorial: que las arañas no maten es lo correcto.
  const g = m.riesgo
  if (g) {
    if (g.murio) {
      add('ok', 'dificultad', `Atacar sin bloquear contra un enemigo superior acaba en muerte (${g.turnos} turnos, ${g.bloqueosIgnorados} avisos ignorados).`)
    } else if (g.hpPerdida >= 40) {
      add('ok', 'dificultad', `Atacar sin bloquear contra un enemigo superior cuesta el ${g.hpPerdida}% de la vida: hay castigo real.`)
    } else {
      add('medio', 'dificultad', `Atacar sin pensar contra un enemigo superior solo cuesta el ${g.hpPerdida}% de la vida.`,
        'Si ignorar los ataques anunciados sale gratis, la telegrafía y el bloqueo son decorado. Sube su multiplicador.')
    }
  }
  if (m.deaths > m.kills / 3) {
    add('medio', 'dificultad', `${m.deaths} muertes en ${m.kills} enemigos del tramo inicial: demasiado castigo para empezar.`,
      'Los primeros enemigos deberían perdonar. Baja su daño o su vida.')
  }
  if (m.cgrid === 0) {
    add('bajo', 'economía', 'No se emitió CGRID en la simulación (esperado: solo lo dan jefes y mazmorras).')
  }

  // Un objetivo a 0 puede ser normal (el bot no fue a por ese enemigo). Lo
  // grave es que NADA en el servidor emita esa clave: entonces la misión es
  // imposible de terminar, y eso sí es un fallo.
  const src = fs.readFileSync(path.join(ROOT, 'criptomundo.js'), 'utf8')
  for (const q of r.quests) {
    for (const o of q.objetivos) {
      const clave = o.clave
      const emitida = clave && (
        src.includes(`questKey: '${clave}'`) ||
        src.includes(`emitProgress(char, '${clave}'`) ||
        src.includes(`key: '${clave}'`) && (src.includes('gather_') || src.includes('explore_') || src.includes('dungeon_'))
      )
      if (!emitida) {
        add('alto', 'misiones', `El objetivo "${o.texto}" (${q.id}) no lo emite nada: la misión no se puede terminar.`,
          'Haz que algún evento del juego llame a emitProgress con esa clave.')
      } else if (o.actual === 0) {
        add('bajo', 'misiones', `"${o.texto}" sigue a 0, pero la clave existe: el bot simplemente no hizo esa actividad.`)
      }
    }
  }

  const nombres = {
    mazmorra: 'entrar a la primera mazmorra', arena: 'entrar a la primera arena',
    recolectar: 'recolectar en el pozo', huerto: 'sembrar en el huerto',
    pvp: 'jugar una partida de PvP', mercado: 'abrir el mercado',
    taller: 'fabricar una poción', explorar: 'explorar una zona',
  }
  for (const [k, status] of Object.entries(r.probes)) {
    if (k.endsWith('Motivo')) continue   // es el porqué, no un recorrido
    if (status >= 200 && status < 300) add('ok', 'recorrido', `Un jugador nuevo puede ${nombres[k]}.`)
    else if (k === 'mazmorra' && status === 403) add('medio', 'recorrido', 'Un jugador nuevo NO puede entrar a la primera mazmorra (le falta nivel).',
      'Es el mayor muro del primer día. Considera bajar dng_crypt a nivel 3.')
    else if (k === 'mazmorra' && /herido/i.test(r.probes.mazmorraMotivo || '')) {
      add('ok', 'recorrido', 'La mazmorra se niega a abrirse con el personaje malherido, que es lo correcto.')
    } else add('medio', 'recorrido', `Un jugador nuevo NO puede ${nombres[k]} (${r.probes[k + 'Motivo'] || 'HTTP ' + status}).`)
  }
}

// ── 4. Cobertura de funcionalidad ────────────────────────────────
function coverage() {
  const src = fs.readFileSync(path.join(ROOT, 'criptomundo.js'), 'utf8')
  const pendientes = [
    ['Guerras de gremio', /renderWars/.test(src) && /no est\u00e1n implementadas|todav\u00eda no existen/.test(src)],
    ['Chat en tiempo real (hoy por sondeo)', !/WebSocket|socket\.io/.test(src)],
    ['Grupos y mazmorras cooperativas', !/party/i.test(src)],
    ['Integración on-chain de CGRID', /onChain: false/.test(src)],
    ['Base de datos PostgreSQL conectada', !/require\('pg'\)/.test(src)],
  ]
  for (const [nombre, pendiente] of pendientes) {
    if (pendiente) add('bajo', 'alcance', `Pendiente: ${nombre}.`)
  }
}

// ── Informe ──────────────────────────────────────────────────────
function report() {
  const orden = { alto: 0, medio: 1, bajo: 2, ok: 3 }
  const icono = { alto: '🔴', medio: '🟡', bajo: '🔵', ok: '✅' }
  findings.sort((a, b) => orden[a.level] - orden[b.level])

  const line = '═'.repeat(62)
  console.log('\n' + line)
  console.log('  🩺  CRIPTOMUNDO — INFORME DE DIAGNÓSTICO')
  console.log(line)

  let lastLevel = null
  for (const f of findings) {
    if (f.level !== lastLevel) {
      const titulo = { alto: 'PRIORIDAD ALTA', medio: 'PRIORIDAD MEDIA', bajo: 'PARA MÁS ADELANTE', ok: 'CORRECTO' }[f.level]
      console.log(`\n── ${titulo} ──`)
      lastLevel = f.level
    }
    console.log(`  ${icono[f.level]} [${f.area}] ${f.msg}`)
    if (f.fix) console.log(`      → ${f.fix}`)
  }

  const alto = findings.filter(f => f.level === 'alto').length
  const medio = findings.filter(f => f.level === 'medio').length
  console.log('\n' + line)
  console.log(`  ${alto} de prioridad alta · ${medio} de prioridad media`)
  console.log('\n  Recuerda: esto mide lo medible sin jugadores. La retención,')
  console.log('  la diversión y el abandono real solo salen de gente jugando.')
  console.log(line + '\n')
  return alto
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🩺 Diagnóstico de CriptoMundo — esto tarda un par de minutos…\n')
  staticChecks()
  coverage()

  const child = spawn('node', [path.join(ROOT, 'criptomundo.js')],
    { env: { ...process.env, PORT: String(PORT), DATA_FILE: DATA }, stdio: 'ignore' })

  try {
    await sleep(1400)
    const health = await req('GET', '/api/health')
    if (health.status !== 200) { add('alto', 'servidor', 'El servidor no responde en /api/health.'); }
    else add('ok', 'servidor', `Servidor operativo (Node ${process.version}).`)

    process.stdout.write('   jugando una partida automatizada')
    const timer = setInterval(() => process.stdout.write('.'), 4000)
    const r = await playthrough()
    clearInterval(timer)
    process.stdout.write('\n')
    analyse(r)
  } catch (e) {
    add('alto', 'diagnóstico', 'El diagnóstico se interrumpió: ' + e.message)
  } finally {
    child.kill()
    try { fs.unlinkSync(DATA) } catch {}
  }

  const alto = report()
  process.exit(alto > 0 ? 1 : 0)
}

main()
