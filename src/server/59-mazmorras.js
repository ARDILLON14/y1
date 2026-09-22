
// ═══════════════════════════════════════════════════════════════════
//  MAZMORRAS JUGABLES
//
//  Las de antes eran un botón "Avanzar" que no hacía nada: se pulsaba
//  tres veces y se cobraba. Estas usan el motor de combate en tiempo
//  real (58-arena.js), que es exactamente lo que les faltaba: hasta
//  ahora no había CON QUÉ hacer que una sala fuera algo más que un
//  cambio de pantalla.
//
//  CÓMO FUNCIONA
//  Al entrar se genera un mapa con semilla: varios pisos, y en cada
//  piso DOS salas entre las que elegir. La elección importa porque los
//  tipos de sala dan cosas distintas y cuestan cosas distintas.
//
//  Tipos de sala:
//    combate    oleada de enemigos, se pelea de verdad en la arena
//    elite      un enemigo duro, más botín
//    cofre      botín seguro, pero puede estar trampeado
//    trampa     daño evitable según agilidad
//    santuario  cura una parte de la vida
//    jefe       última sala, obligatoria
//
//  El botín y la XP se acumulan en la run y se entregan al terminar.
//  Si mueres peleando, pierdes lo acumulado de esa run: por eso el
//  santuario y la retirada son decisiones reales.
// ═══════════════════════════════════════════════════════════════════

const MAZMORRAS = {
  mz_cripta: {
    id: 'mz_cripta', nombre: 'Cripta del Eterno', icono: '💀', minLevel: 3, pisos: 4,
    enemigos: ['m_skeleton', 'm_spider'], elite: 'm_troll', jefe: 'm_troll',
    oro: [150, 300], cgrid: 0, cooldownMs: 5 * 60_000, botin: ['iron_ore', 'potion_hp', 'iron_helm'],
  },
  mz_minas: {
    id: 'mz_minas', nombre: 'Galerías Profundas', icono: '⛏️', minLevel: 8, pisos: 5,
    enemigos: ['m_skeleton', 'm_troll'], elite: 'm_golem', jefe: 'm_golem',
    oro: [400, 700], cgrid: 1, cooldownMs: 15 * 60_000, botin: ['crystal', 'sword_alba', 'leather_chest'],
  },
  mz_ruinas: {
    id: 'mz_ruinas', nombre: 'Santuario Caído', icono: '🏛️', minLevel: 15, pisos: 6,
    enemigos: ['m_troll', 'm_golem'], elite: 'm_dragon', jefe: 'm_demon',
    oro: [1200, 2200], cgrid: 3, cooldownMs: 60 * 60_000, botin: ['crystal', 'arcane_orb', 'thunder_staff', 'soul_shard', 'elixir_mitico'],
  },
}

const runs = new Map()   // username → run

const TIPOS_SALA = {
  combate:   { nombre: 'Sala de guardia', icono: '⚔️', desc: 'Un grupo de enemigos bloquea el paso.' },
  elite:     { nombre: 'Guardián', icono: '💢', desc: 'Un enemigo muy superior. Más peligro, más botín.' },
  cofre:     { nombre: 'Cámara del tesoro', icono: '📦', desc: 'Un cofre antiguo. Puede estar trampeado.' },
  trampa:    { nombre: 'Pasillo trampeado', icono: '🪤', desc: 'Placas de presión y dardos. La agilidad ayuda.' },
  santuario: { nombre: 'Santuario', icono: '⛲', desc: 'Agua limpia. Recupera parte de la vida.' },
  jefe:      { nombre: 'Sala del jefe', icono: '👑', desc: 'No hay vuelta atrás.' },
}

function generarMapa(mz, semilla, nivel) {
  const rng = makeRng(semilla)
  const pisos = []
  for (let p = 0; p < mz.pisos - 1; p++) {
    // Los primeros pisos son más suaves; a partir de la mitad entran
    // élites y trampas. Siempre hay dos opciones: elegir es el juego.
    const pool = p < 1
      ? ['combate', 'cofre', 'combate', 'santuario']
      : p < mz.pisos - 2
        ? ['combate', 'cofre', 'trampa', 'elite', 'santuario']
        : ['elite', 'combate', 'trampa', 'cofre']
    const a = pool[Math.floor(rng() * pool.length)]
    let b = pool[Math.floor(rng() * pool.length)]
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length]
    pisos.push([crearSala(a, mz, rng, nivel), crearSala(b, mz, rng, nivel)])
  }
  pisos.push([crearSala('jefe', mz, rng, nivel)])
  return pisos
}

function crearSala(tipo, mz, rng, nivel) {
  const s = { tipo, ...TIPOS_SALA[tipo], id: nextId('sala'), hecha: false }
  if (tipo === 'combate') {
    const n = 2 + Math.floor(rng() * 2)
    s.enemigos = Array.from({ length: n }, () => mz.enemigos[Math.floor(rng() * mz.enemigos.length)])
  } else if (tipo === 'elite') {
    s.enemigos = [mz.elite]
  } else if (tipo === 'jefe') {
    s.enemigos = [mz.jefe, mz.enemigos[0]]
  } else if (tipo === 'cofre') {
    s.trampeado = rng() < 0.35
    s.objeto = mz.botin[Math.floor(rng() * mz.botin.length)]
  } else if (tipo === 'trampa') {
    s.daño = 0.12 + rng() * 0.1
    s.objeto = rng() < 0.5 ? mz.botin[0] : null
  } else if (tipo === 'santuario') {
    s.cura = 0.35
  }
  return s
}

function estadoRun(run) {
  const opciones = run.terminada ? [] : (run.mapa[run.piso] || []).map(s => ({
    id: s.id, tipo: s.tipo, nombre: s.nombre, icono: s.icono, desc: s.desc,
    enemigos: (s.enemigos || []).map(m => ({ nombre: MONSTERS[m].name, icono: MONSTERS[m].icon })),
  }))
  return {
    id: run.id, mazmorra: run.mz.id, nombre: run.mz.nombre, icono: run.mz.icono,
    piso: run.piso + 1, pisos: run.mz.pisos,
    opciones, enCombate: run.enCombate,
    // Qué sala se está jugando ahora mismo. Sin esto la pantalla solo
    // sabe "hay algo en curso" y tiene que llamarlo combate, aunque lo
    // que haya delante sea un cofre o una fuente.
    salaEnCurso: run.enCombate && run.salaActual ? run.salaActual.tipo : null,
    acumulado: {
      xp: run.xp, bajas: run.bajas,
      botin: run.botin.map(b => ({ ...b, nombre: template(b.itemId).name, icono: template(b.itemId).icon })),
    },
    vida: run.vidaActual, vidaMax: run.vidaMax,
    registro: run.registro.slice(-8),
    terminada: run.terminada || false,
  }
}

function entrarMazmorra(player, mazmorraId) {
  const mz = MAZMORRAS[mazmorraId]
  const char = player.character
  if (!mz) return { error: 'Esa mazmorra no existe', code: 404 }
  if (char.level < mz.minLevel) return { error: `Necesitas nivel ${mz.minLevel}`, code: 403 }
  if (runs.has(player.username)) return { error: 'Ya estás dentro de una mazmorra', code: 409 }
  if (partidas.has(player.username)) return { error: 'Termina el combate que tienes en curso', code: 409 }
  if (char.hp < effectiveStats(char).maxHp * 0.25) return { error: 'Estás demasiado herido para entrar', code: 400 }

  char.cooldownsMazmorra = char.cooldownsMazmorra || {}
  const cd = char.cooldownsMazmorra[mazmorraId] || 0
  if (now() < cd) return { error: `En enfriamiento (${Math.ceil((cd - now()) / 60000)} min)`, code: 429 }

  const semilla = crypto.randomBytes(8).toString('hex')
  const run = {
    id: nextId('mzr'), usuario: player.username, mz, semilla,
    mapa: generarMapa(mz, semilla, char.level),
    piso: 0, xp: 0, bajas: 0, botin: [], registro: [],
    vidaActual: char.hp, vidaMax: effectiveStats(char).maxHp,
    enCombate: false, inicio: now(),
  }
  run.registro.push(`Entras en ${mz.nombre}. ${mz.pisos} pisos por delante.`)
  runs.set(player.username, run)
  audit('mazmorra_entrar', char.name, { mazmorra: mazmorraId, semilla })
  return { run: estadoRun(run) }
}

// Elegir sala: aquí está la decisión que antes no existía
function elegirSala(player, salaId) {
  const run = runs.get(player.username)
  if (!run) return { error: 'No estás en ninguna mazmorra', code: 404 }
  if (run.enCombate) return { error: 'Termina el combate primero', code: 409 }
  const sala = (run.mapa[run.piso] || []).find(s => s.id === salaId)
  if (!sala) return { error: 'Esa sala no está en este piso', code: 404 }

  const char = player.character

  if (sala.tipo === 'combate' || sala.tipo === 'elite' || sala.tipo === 'jefe') {
    // El combate lo lleva el motor de arena, con la vida que traes.
    //
    // La sala del jefe además lleva fases: al bajarle la vida, la
    // guarida despierta y luego el jefe llama refuerzos. Sin esto, la
    // última sala de una mazmorra se peleaba igual que la primera.
    const r = iniciarEncuentro(player, {
      oleadas: [sala.enemigos],
      nombre: `${run.mz.nombre} · ${sala.nombre}`,
      origen: 'mazmorra', runId: run.id, vidaInicial: run.vidaActual,
      sala: sala.tipo === 'jefe' ? salaDelJefe(run.mz) : null,
    })
    if (r.error) return r
    run.enCombate = true
    run.salaActual = sala
    run.registro.push(`${sala.icono} ${sala.nombre}: ${sala.enemigos.length} enemigo(s).`)
    return { combate: true, run: estadoRun(run), partida: r.partida }
  }

  // Cofre, trampa y santuario: también se juegan.
  //
  // Antes esto era una tirada instantánea. `Math.random()` decidía si el
  // cofre estaba trampeado, `Math.random()` contra la agilidad decidía
  // si los dardos te daban, y el santuario sumaba vida y avanzaba. El
  // jugador pulsaba una sala y leía el resultado: no había nada que
  // hacer bien ni mal.
  //
  // Ahora las tres abren una sala en el mismo motor de arena que ya
  // usaban las de combate, con un objetivo que no es matar: ir a un
  // sitio y aguantar. Los dardos avisan antes de salir y se esquivan
  // moviéndose, que es lo que pedía la FASE 15.
  //
  // Lo que NO cambia: el botín que da cada sala, la curación del
  // santuario y el daño que puede costar una trampa. Los números
  // siguen siendo los de antes; lo que cambia es que ahora dependen de
  // lo que haga el jugador y no de un dado.
  const cfgSala = salaDeMazmorra(sala.tipo, {
    nombre: sala.nombre,
    trampeado: !!sala.trampeado,
    dmgFrac: sala.daño,
    cura: sala.cura,
    botin: sala.objeto ? [{ itemId: sala.objeto, quantity: 1 + Math.floor(Math.random() * 2) }] : [],
  })
  const rs = iniciarEncuentro(player, {
    oleadas: [[]],
    nombre: `${run.mz.nombre} · ${sala.nombre}`,
    origen: 'mazmorra', runId: run.id, vidaInicial: run.vidaActual,
    nivelBase: char.level,
    sala: cfgSala,
  })
  if (rs.error) return rs
  run.enCombate = true
  run.salaActual = sala
  sala.hecha = true
  run.registro.push(`${sala.icono} ${sala.nombre}: ${cfgSala.objetivo.etiqueta}.`)
  return { combate: true, sala: sala.tipo, run: estadoRun(run), partida: rs.partida }
}

function avanzarPiso(player, run) {
  run.piso++
  if (run.piso >= run.mz.pisos) return { fin: terminarRun(player, run, 'victoria') }
  run.registro.push(`Bajas al piso ${run.piso + 1} de ${run.mz.pisos}.`)
  return { run: estadoRun(run) }
}

// Lo llama el motor de arena cuando acaba un combate de mazmorra
function resultadoCombateMazmorra(username, resultado) {
  const run = runs.get(username)
  const player = store.players[username]
  if (!run || !player) return null
  run.enCombate = false
  run.xp += resultado.xp || 0
  run.bajas += resultado.bajas || 0
  for (const b of resultado.botinCrudo || []) run.botin.push(b)
  run.vidaActual = Math.max(0, resultado.vidaFinal || 0)

  if (resultado.motivo !== 'victoria') {
    run.registro.push('☠️ Caes en combate. Pierdes lo que llevabas acumulado.')
    return { fin: terminarRun(player, run, 'derrota') }
  }
  run.registro.push(`✅ Sala despejada (${resultado.bajas} bajas).`)
  if (run.vidaActual <= 0) return { fin: terminarRun(player, run, 'derrota') }
  return avanzarPiso(player, run)
}

function terminarRun(player, run, motivo) {
  const char = player.character
  runs.delete(run.usuario)
  run.terminada = true
  char.hp = Math.max(1, Math.round(run.vidaActual))

  let oro = 0, cgrid = 0
  const botinFinal = []

  if (motivo === 'victoria') {
    oro = randInt(run.mz.oro[0], run.mz.oro[1])
    char.gold += oro
    trackCurrency(char.name, 'gold', oro, 'mazmorra')
    cgrid = creditCgrid(char, run.mz.cgrid || 0, `mazmorra:${run.mz.id}`)
    char.dungeonsCleared = (char.dungeonsCleared || 0) + 1
    char.cooldownsMazmorra = char.cooldownsMazmorra || {}
    char.cooldownsMazmorra[run.mz.id] = now() + run.mz.cooldownMs
    // El botín solo se entrega si sales con vida: es lo que hace que
    // retirarse a tiempo sea una decisión y no un trámite.
    for (const b of run.botin) {
      if (addItem(char, b.itemId, b.quantity, 'botin')) {
        botinFinal.push({ ...b, nombre: template(b.itemId).name, icono: template(b.itemId).icon })
      }
    }
    char.xp += run.xp
    emitProgress(char, `dungeon_${run.mz.id}`, 1)
  } else if (motivo === 'derrota') {
    char.muertes = (char.muertes || 0) + 1
    const perdido = Math.floor(char.gold * 0.08)
    char.gold = Math.max(0, char.gold - perdido)
    // La XP de lo que sí mataste se conserva: el esfuerzo no se borra
    char.xp += Math.round(run.xp * 0.5)
  } else {
    // Retirada voluntaria: te llevas la mitad del botín
    for (const b of run.botin.slice(0, Math.ceil(run.botin.length / 2))) {
      if (addItem(char, b.itemId, b.quantity, 'botin')) {
        botinFinal.push({ ...b, nombre: template(b.itemId).name, icono: template(b.itemId).icon })
      }
    }
    char.xp += Math.round(run.xp * 0.7)
  }

  const levelUps = checkLevelUp(char)
  audit('mazmorra_fin', char.name, { mazmorra: run.mz.id, motivo, pisos: run.piso, bajas: run.bajas, oro })
  track('mazmorra_fin', char.name)
  if (motivo === 'victoria') step(char.name, 'first_dungeon')
  persist()
  return {
    motivo, pisos: run.piso, bajas: run.bajas, xp: run.xp, oro, cgrid,
    botin: botinFinal, levelUps, nivel: char.level, registro: run.registro.slice(-10),
  }
}

function retirarse(player) {
  const run = runs.get(player.username)
  if (!run) return { error: 'No estás en ninguna mazmorra', code: 404 }
  if (run.enCombate) return { error: 'No puedes retirarte en mitad de un combate', code: 409 }
  return { fin: terminarRun(player, run, 'retirada') }
}

function estadoMazmorraDe(username) {
  const run = runs.get(username)
  return run ? estadoRun(run) : null
}
