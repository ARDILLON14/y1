
// ═══════════════════════════════════════════════════════════════════
//  PRIMEROS PASOS
//
//  Por qué existe: el embudo mostraba que solo la mitad de los
//  jugadores llegaba a aceptar una misión y el 40 % a completarla,
//  aunque el juego lo permitía desde el minuto uno. No era un problema
//  de dificultad sino de que nadie sabía qué hacer al entrar.
//
//  Esta lista NO es un tutorial que bloquea: es una guía opcional que
//  se marca sola con lo que el jugador ya hace. El estado sale de los
//  mismos eventos que alimentan la telemetría, así que no hay una
//  segunda fuente de verdad que se pueda desincronizar.
//
//  Para añadir un paso: una entrada aquí y ya aparece en la interfaz.
//    id      identificador estable
//    titulo  qué se le pide al jugador
//    pista   cómo hacerlo, en una línea
//    modulo  a qué pantalla lleva el botón
//    evento  paso del embudo que lo da por hecho
//    oro     recompensa al reclamarlo
// ═══════════════════════════════════════════════════════════════════
const PRIMEROS_PASOS = [
  { id: 'p_combate', titulo: 'Gana tu primer combate', pista: 'Entra en Combate, elige la Araña Venenosa y ataca hasta vencerla.', modulo: 'combat', evento: 'first_kill', oro: 100 },
  // Estos dos van justo después del primer combate y antes que nada más,
  // porque son los que deciden si el juego se vive como difícil o como
  // justo. El banco de balance lo mide: bloqueando el golpe anunciado y
  // bebiendo por debajo de un tercio no se pierde ni una pelea en todo
  // el juego. Sin saberlo, un nivel 1 muere cuatro veces antes del 3.
  { id: 'p_bloquear', titulo: 'Bloquea un golpe anunciado', pista: 'Cuando el enemigo avise de un golpe fuerte, pulsa Bloquear 🛡️: encaja un tercio del daño en vez de todo.', modulo: 'combat', evento: 'first_block', oro: 120 },
  { id: 'p_pocion', titulo: 'Bébete una poción peleando', pista: 'No hace falta esperar a morir: en combate, el botón 🧪 cura sin perder el turno de atacar.', modulo: 'combat', evento: 'first_potion', oro: 120 },
  { id: 'p_mision', titulo: 'Acepta una misión', pista: 'En Misiones, habla con Lyria la Alquimista y acepta "Cosecha de Hierbas".', modulo: 'misiones', evento: 'first_quest_accept', oro: 100 },
  { id: 'p_taller', titulo: 'Fabrica algo en el taller', pista: 'En Taller, la Poción de Vida solo necesita hierbas y agua.', modulo: 'crafting', evento: 'first_craft', oro: 150 },
  { id: 'p_nivel2', titulo: 'Alcanza el nivel 2', pista: 'Un par de combates bastan.', modulo: 'combat', evento: 'level_2', oro: 150 },
  { id: 'p_entrega', titulo: 'Entrega una misión completa', pista: 'El progreso avanza solo con acciones reales; cuando esté al completo, entrégala al NPC.', modulo: 'misiones', evento: 'first_quest_complete', oro: 250 },
  { id: 'p_mercado', titulo: 'Compra algo en el mercado', pista: 'En Mercado hay materiales baratos de otros jugadores.', modulo: 'mercado', evento: 'first_market_buy', oro: 200 },
  { id: 'p_recolectar', titulo: 'Recoge agua del pozo', pista: 'En Huerto, el pozo del pueblo da agua para las pociones.', modulo: 'huerto', evento: 'first_gather', oro: 120 },
  { id: 'p_sembrar', titulo: 'Siembra y cosecha algo', pista: 'En Huerto, siembra una semilla y vuelve cuando haya crecido.', modulo: 'huerto', evento: 'first_harvest', oro: 200 },
  { id: 'p_arena', titulo: 'Gana un combate en la Arena', pista: 'En Arena se pelea moviéndose: acércate, apunta y golpea.', modulo: 'arena', evento: 'first_arena', oro: 300 },
  { id: 'p_mazmorra', titulo: 'Completa una mazmorra', pista: 'En Mazmorras eliges sala en cada piso. El botín solo se cobra si sales con vida.', modulo: 'mazmorras', evento: 'first_dungeon', oro: 500 },
]

const PASOS_POR_ID = new Map(PRIMEROS_PASOS.map(p => [p.id, p]))

function pasosDe(player) {
  const hechos = (store.analytics.users[player.username] || {}).steps || {}
  const reclamados = player.character.pasosReclamados || []
  return PRIMEROS_PASOS.map(p => ({
    id: p.id, titulo: p.titulo, pista: p.pista, modulo: p.modulo, oro: p.oro,
    hecho: !!hechos[p.evento],
    reclamado: reclamados.includes(p.id),
  }))
}

function resumenPasos(player) {
  const pasos = pasosDe(player)
  const hechos = pasos.filter(p => p.hecho).length
  const siguiente = pasos.find(p => !p.hecho) || null
  const porReclamar = pasos.filter(p => p.hecho && !p.reclamado).length
  return {
    pasos, total: pasos.length, hechos, porReclamar,
    siguiente: siguiente ? siguiente.id : null,
    completado: hechos === pasos.length,
  }
}

// Reclamar es explícito: el jugador ve la recompensa al pulsar, en vez
// de que le aparezca oro de la nada sin saber por qué.
function reclamarPaso(player, id) {
  const paso = PASOS_POR_ID.get(id)
  if (!paso) return { error: 'Paso desconocido', code: 404 }
  const hechos = (store.analytics.users[player.username] || {}).steps || {}
  if (!hechos[paso.evento]) return { error: 'Todavía no has completado ese paso', code: 400 }
  const char = player.character
  char.pasosReclamados = char.pasosReclamados || []
  if (char.pasosReclamados.includes(id)) return { error: 'Recompensa ya recibida', code: 409 }
  char.pasosReclamados.push(id)
  char.gold += paso.oro
  trackCurrency(char.name, 'gold', paso.oro, 'primeros_pasos')
  audit('primeros_pasos', char.name, { paso: id, oro: paso.oro })
  persist()
  return { success: true, oro: paso.oro, newGold: char.gold, resumen: resumenPasos(player) }
}


// ═══════════════════════════════════════════════════════════════════
//  MEDALLAS
//  Se calculan a partir de contadores reales del personaje; no se
//  guardan por separado para que no puedan desincronizarse de los
//  hechos. Si matas 50 monstruos, la medalla existe; si el contador
//  baja, deja de existir. Una sola fuente de verdad.
// ═══════════════════════════════════════════════════════════════════
const MEDALLAS = [
  { id: 'primera_sangre', nombre: 'Primera sangre',   icono: '🩸', desc: 'Derrota a tu primer enemigo',       mide: c => c.monstersKilled || 0, meta: 1 },
  { id: 'cazador',        nombre: 'Cazador',          icono: '🏹', desc: 'Derrota 50 enemigos',               mide: c => c.monstersKilled || 0, meta: 50 },
  { id: 'exterminador',   nombre: 'Exterminador',     icono: '💀', desc: 'Derrota 250 enemigos',              mide: c => c.monstersKilled || 0, meta: 250 },
  { id: 'matajefes',      nombre: 'Matajefes',        icono: '👑', desc: 'Derrota 5 jefes',                   mide: c => c.bossesKilled || 0, meta: 5 },
  { id: 'espeleologo',    nombre: 'Espeleólogo',      icono: '🏰', desc: 'Completa 3 mazmorras',              mide: c => c.dungeonsCleared || 0, meta: 3 },
  { id: 'veterano',       nombre: 'Veterano',         icono: '⭐', desc: 'Alcanza el nivel 10',               mide: c => c.level || 1, meta: 10 },
  { id: 'artesano',       nombre: 'Artesano',         icono: '⚒️', desc: 'Fabrica 25 objetos',                mide: c => c.objetosFabricados || 0, meta: 25 },
  { id: 'hortelano',      nombre: 'Hortelano',        icono: '🌾', desc: 'Cosecha 20 veces',                  mide: c => c.cosechas || 0, meta: 20 },
  { id: 'recolector',     nombre: 'Recolector',       icono: '🧺', desc: 'Reúne 200 recursos',                mide: c => c.recursosRecolectados || 0, meta: 200 },
  { id: 'explorador',     nombre: 'Explorador',       icono: '🗺️', desc: 'Visita las 6 zonas',               mide: c => (c.zonesVisited || []).length, meta: 6 },
  { id: 'mercader',       nombre: 'Mercader',         icono: '🪙', desc: 'Acumula 10.000 de oro',             mide: c => c.gold || 0, meta: 10000 },
  { id: 'duelista',       nombre: 'Duelista',         icono: '⚔️', desc: 'Gana 10 combates PvP',              mide: c => c.pvpWins || 0, meta: 10 },
]

function medallasDe(char) {
  return MEDALLAS.map(m => {
    const valor = m.mide(char)
    return {
      id: m.id, nombre: m.nombre, icono: m.icono, desc: m.desc,
      progreso: Math.min(valor, m.meta), meta: m.meta,
      conseguida: valor >= m.meta,
    }
  })
}

// Retrato completo del jugador con datos reales, sin nada inventado.
function perfilDe(player) {
  const c = player.character
  const st = effectiveStats(c)
  const medallas = medallasDe(c)
  const u = (store.analytics.users || {})[player.username] || {}
  return {
    nombre: c.name, clase: c.class, nivel: c.level,
    xp: c.xp, xpSiguiente: c.xpToNext,
    apariencia: c.appearance,
    creadoEn: c.createdAt,
    minutosJugados: Math.round(u.playMinutes || 0),
    diasActivos: (u.activeDays || []).length,
    estadisticas: {
      fuerza: st.strength, inteligencia: st.intelligence, agilidad: st.agility,
      defensa: st.defense, vidaMax: st.maxHp, manaMax: st.maxMp,
    },
    contadores: {
      bajas: c.monstersKilled || 0,
      jefes: c.bossesKilled || 0,
      mazmorras: c.dungeonsCleared || 0,
      muertes: c.muertes || 0,
      objetosFabricados: c.objetosFabricados || 0,
      recursosRecolectados: c.recursosRecolectados || 0,
      cosechas: c.cosechas || 0,
      consumiblesUsados: c.consumiblesUsados || 0,
      misionesCompletadas: (c.completedQuests || []).length,
      zonasVisitadas: (c.zonesVisited || []).length,
      pvp: { victorias: c.pvpWins || 0, derrotas: c.pvpLosses || 0, puntuacion: c.pvpRating || 1200 },
    },
    equipo: c.equipment || {},
    medallas,
    medallasConseguidas: medallas.filter(m => m.conseguida).length,
  }
}
