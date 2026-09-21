
// ═══════════════════════════════════════════════════════════════════
//  MISIONES (catálogo servidor)
// ═══════════════════════════════════════════════════════════════════
const QUESTS = [
  {
    id: 'q_trolls', npcId: 'npc_aldric', npcName: 'Aldric el Herrero',
    name: 'Purga de los Trolls', type: 'HUNT', icon: '🧟', levelReq: 1,
    description: 'Los Trolls han invadido los campos del norte. Elimínalos.',
    objectives: [
      { id: 'o1', text: 'Eliminar Trolls Sombríos', key: 'kill_troll', required: 8 },
      { id: 'o2', text: 'Eliminar al Troll Jefe', key: 'kill_troll_boss', required: 1 },
    ],
    rewards: [{ gold: 320, xp: 280, cgrid: 0, itemId: 'sword_alba', itemQty: 1 }],
  },
  {
    id: 'q_herbs', npcId: 'npc_lyria', npcName: 'Lyria la Alquimista',
    name: 'Cosecha de Hierbas', type: 'GATHER', icon: '🌿', levelReq: 1,
    description: 'Necesito 10 hierbas medicinales del bosque del este.',
    objectives: [{ id: 'o3', text: 'Recolectar Hierba Medicinal', key: 'gather_herb', required: 10 }],
    rewards: [{ gold: 90, xp: 80, cgrid: 0, itemId: 'potion_mp', itemQty: 5 }],
  },
  {
    id: 'q_patrol', npcId: 'npc_draven', npcName: 'Capitán Draven',
    name: 'Patrulla del Norte', type: 'EXPLORE', icon: '🗺️', levelReq: 5,
    description: 'Explora las zonas del norte y reporta actividad enemiga.',
    objectives: [
      { id: 'o4', text: 'Explorar las Minas', key: 'explore_mines', required: 1 },
      { id: 'o5', text: 'Explorar las Ruinas', key: 'explore_ruins', required: 1 },
    ],
    rewards: [{ gold: 600, xp: 520, cgrid: 1, itemId: 'spy_hood', itemQty: 1 }],
  },
  {
    id: 'q_forge', npcId: 'npc_aldric', npcName: 'Aldric el Herrero',
    name: 'Aprendiz de Forja', type: 'CRAFT', icon: '⚒️', levelReq: 1,
    description: 'Demuestra tu oficio: fabrica 3 dagas de hierro.',
    objectives: [{ id: 'o6', text: 'Fabricar Dagas de Hierro', key: 'craft_dagger', required: 3 }],
    rewards: [{ gold: 200, xp: 180, cgrid: 0, itemId: 'iron_helm', itemQty: 1 }],
  },
  {
    id: 'q_depths', npcId: 'npc_draven', npcName: 'Capitán Draven',
    name: 'Las Profundidades', type: 'DUNGEON', icon: '🏰', levelReq: 5,
    description: 'Completa la Cripta del Eterno y trae pruebas.',
    objectives: [{ id: 'o7', text: 'Completar Cripta del Eterno', key: 'dungeon_mz_cripta', required: 1 }],
    rewards: [{ gold: 800, xp: 700, cgrid: 2, itemId: 'crystal', itemQty: 2 }],
  },
]

const NPCS = [
  { id: 'npc_aldric', name: 'Aldric el Herrero', role: 'Maestro Forjador', zone: 'pueblo', avatar: '⚒️' },
  { id: 'npc_lyria', name: 'Lyria la Alquimista', role: 'Maestra Alquimista', zone: 'pueblo', avatar: '🧪' },
  { id: 'npc_draven', name: 'Capitán Draven', role: 'Comandante', zone: 'castillo', avatar: '🗡️' },
]

// ── Zonas del mundo (progresión por nivel + exploración verificada) ─
// El mapa del cliente usa nombres en español (bosque, minas, ruinas) y
// el servidor los tenía en inglés. Al validar el viaje contra esta
// tabla, "bosque" y "minas" devolvían 404 y el jugador se quedaba
// encerrado en el pueblo. Los alias arreglan la causa sin renombrar
// nada en ninguno de los dos lados.
const ALIAS_ZONA = {
  bosque: 'forest', bosques: 'forest', este: 'forest',
  minas: 'mines', mina: 'mines', norte: 'mines',
  ruinas: 'ruins', cripta: 'crypt', pueblo: 'pueblo', castillo: 'castillo',
}
function zonaCanonica(id) {
  const k = String(id || '').toLowerCase()
  return ZONES[k] ? k : (ALIAS_ZONA[k] || null)
}

const ZONES = {
  pueblo:   { name: 'Pueblo de Valdris', levelReq: 1,  monsters: [], key: 'explore_pueblo' },
  forest:   { name: 'Bosque del Este',   levelReq: 1,  monsters: ['m_spider', 'm_troll'], key: 'explore_forest' },
  mines:    { name: 'Minas Profundas',   levelReq: 5,  monsters: ['m_golem'], key: 'explore_mines' },
  crypt:    { name: 'Cripta Antigua',    levelReq: 4,  monsters: ['m_skeleton'], key: 'explore_crypt' },
  castillo: { name: 'Castillo de Hierro',levelReq: 8,  monsters: [], key: 'explore_castillo' },
  ruins:    { name: 'Ruinas Malditas',   levelReq: 12, monsters: ['m_dragon', 'm_demon'], key: 'explore_ruins' },
}

// ═══════════════════════════════════════════════════════════════════
//  RECETAS (validadas en servidor)
// ═══════════════════════════════════════════════════════════════════
const RECIPES = [
  { id: 'rec_dagger', name: 'Daga de Hierro', category: 'forge', station: 'forge', levelReq: 1, outputItemId: 'dagger', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'iron_ore', quantity: 3 }, { itemId: 'wood', quantity: 2 }], xp: 40, questKey: 'craft_dagger' },
  { id: 'rec_potion', name: 'Poción de Vida', category: 'alch', station: 'alchemy', levelReq: 1, outputItemId: 'potion_hp', outputQty: 3, successRate: 1,
    ingredients: [{ itemId: 'herb', quantity: 3 }, { itemId: 'water', quantity: 2 }], xp: 25, questKey: 'craft_potion' },
  { id: 'rec_bread', name: 'Pan de Campo', category: 'cook', station: 'kitchen', levelReq: 1, outputItemId: 'bread', outputQty: 5, successRate: 1,
    ingredients: [{ itemId: 'wheat', quantity: 3 }, { itemId: 'water', quantity: 1 }], xp: 15, questKey: 'craft_bread' },
  { id: 'rec_helm', name: 'Yelmo de Hierro', category: 'forge', station: 'forge', levelReq: 3, outputItemId: 'iron_helm', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'iron_ore', quantity: 6 }, { itemId: 'leather', quantity: 2 }], xp: 80, questKey: 'craft_helm' },
  { id: 'rec_chest', name: 'Peto de Cuero', category: 'forge', station: 'forge', levelReq: 5, outputItemId: 'leather_chest', outputQty: 1, successRate: 0.85,
    ingredients: [{ itemId: 'leather', quantity: 8 }, { itemId: 'iron_ore', quantity: 2 }], xp: 120, questKey: 'craft_chest' },

  // ── Armas ──────────────────────────────────────────────────────
  { id: 'rec_club', name: 'Garrote de Roble', category: 'forge', station: 'forge', levelReq: 1, outputItemId: 'wood_club', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'wood', quantity: 4 }, { itemId: 'leather', quantity: 1 }], xp: 25, questKey: 'craft_club' },
  { id: 'rec_bow', name: 'Arco Corto', category: 'forge', station: 'forge', levelReq: 3, outputItemId: 'short_bow', outputQty: 1, successRate: 0.95,
    ingredients: [{ itemId: 'wood', quantity: 6 }, { itemId: 'leather', quantity: 3 }], xp: 70, questKey: 'craft_bow' },
  { id: 'rec_axe', name: 'Hacha de Leñador', category: 'forge', station: 'forge', levelReq: 4, outputItemId: 'iron_axe', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'iron_ore', quantity: 7 }, { itemId: 'wood', quantity: 3 }], xp: 95, questKey: 'craft_axe' },
  { id: 'rec_spear', name: 'Lanza de Hierro', category: 'forge', station: 'forge', levelReq: 6, outputItemId: 'iron_spear', outputQty: 1, successRate: 0.88,
    ingredients: [{ itemId: 'iron_ore', quantity: 6 }, { itemId: 'wood', quantity: 5 }, { itemId: 'leather', quantity: 2 }], xp: 130, questKey: 'craft_spear' },
  { id: 'rec_wand', name: 'Vara de Cristal', category: 'forge', station: 'forge', levelReq: 8, outputItemId: 'crystal_wand', outputQty: 1, successRate: 0.8,
    ingredients: [{ itemId: 'crystal', quantity: 2 }, { itemId: 'wood', quantity: 4 }], xp: 190, questKey: 'craft_wand' },
  { id: 'rec_frost', name: 'Filo Escarchado', category: 'forge', station: 'forge', levelReq: 12, outputItemId: 'frost_blade', outputQty: 1, successRate: 0.7,
    ingredients: [{ itemId: 'crystal', quantity: 5 }, { itemId: 'iron_ore', quantity: 10 }, { itemId: 'soul_shard', quantity: 1 }], xp: 420, questKey: 'craft_frost' },

  // ── Armaduras ──────────────────────────────────────────────────
  { id: 'rec_lhelm', name: 'Capucha de Cuero', category: 'forge', station: 'forge', levelReq: 2, outputItemId: 'leather_helm', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'leather', quantity: 3 }], xp: 45, questKey: 'craft_lhelm' },
  { id: 'rec_lgloves', name: 'Guantes de Cuero', category: 'forge', station: 'forge', levelReq: 2, outputItemId: 'leather_gloves', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'leather', quantity: 3 }], xp: 40, questKey: 'craft_lgloves' },
  { id: 'rec_lboots', name: 'Botas de Cuero', category: 'forge', station: 'forge', levelReq: 2, outputItemId: 'leather_boots', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'leather', quantity: 4 }, { itemId: 'wood', quantity: 1 }], xp: 45, questKey: 'craft_lboots' },
  { id: 'rec_ichest', name: 'Coraza de Hierro', category: 'forge', station: 'forge', levelReq: 7, outputItemId: 'iron_chest', outputQty: 1, successRate: 0.85,
    ingredients: [{ itemId: 'iron_ore', quantity: 12 }, { itemId: 'leather', quantity: 4 }], xp: 200, questKey: 'craft_ichest' },
  { id: 'rec_igloves', name: 'Guanteletes', category: 'forge', station: 'forge', levelReq: 6, outputItemId: 'iron_gloves', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'iron_ore', quantity: 6 }, { itemId: 'leather', quantity: 2 }], xp: 120, questKey: 'craft_igloves' },
  { id: 'rec_iboots', name: 'Grebas de Hierro', category: 'forge', station: 'forge', levelReq: 6, outputItemId: 'iron_boots', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'iron_ore', quantity: 7 }, { itemId: 'leather', quantity: 2 }], xp: 125, questKey: 'craft_iboots' },
  { id: 'rec_chelm', name: 'Yelmo de Cristal', category: 'forge', station: 'forge', levelReq: 10, outputItemId: 'crystal_helm', outputQty: 1, successRate: 0.75,
    ingredients: [{ itemId: 'crystal', quantity: 3 }, { itemId: 'iron_ore', quantity: 6 }], xp: 260, questKey: 'craft_chelm' },
  { id: 'rec_cchest', name: 'Peto de Cristal', category: 'forge', station: 'forge', levelReq: 12, outputItemId: 'crystal_chest', outputQty: 1, successRate: 0.7,
    ingredients: [{ itemId: 'crystal', quantity: 5 }, { itemId: 'iron_ore', quantity: 10 }], xp: 340, questKey: 'craft_cchest' },
  { id: 'rec_charm', name: 'Amuleto de Trébol', category: 'forge', station: 'forge', levelReq: 5, outputItemId: 'luck_charm', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'herb', quantity: 6 }, { itemId: 'leather', quantity: 2 }], xp: 110, questKey: 'craft_charm' },
  { id: 'rec_ring', name: 'Anillo de Hueso', category: 'forge', station: 'forge', levelReq: 9, outputItemId: 'bone_ring', outputQty: 1, successRate: 0.8,
    ingredients: [{ itemId: 'crystal', quantity: 1 }, { itemId: 'iron_ore', quantity: 4 }, { itemId: 'leather', quantity: 3 }], xp: 175, questKey: 'craft_ring' },

  // ── Pociones con efecto ────────────────────────────────────────
  { id: 'rec_str', name: 'Poción de Fuerza', category: 'alch', station: 'alchemy', levelReq: 3, outputItemId: 'potion_str', outputQty: 2, successRate: 0.95,
    ingredients: [{ itemId: 'chili', quantity: 2 }, { itemId: 'water', quantity: 2 }, { itemId: 'herb', quantity: 2 }], xp: 75, questKey: 'craft_potion_str' },
  { id: 'rec_spd', name: 'Poción de Velocidad', category: 'alch', station: 'alchemy', levelReq: 3, outputItemId: 'potion_spd', outputQty: 2, successRate: 0.95,
    ingredients: [{ itemId: 'honey', quantity: 2 }, { itemId: 'water', quantity: 2 }, { itemId: 'herb', quantity: 2 }], xp: 75, questKey: 'craft_potion_spd' },
  { id: 'rec_def', name: 'Poción de Piedra', category: 'alch', station: 'alchemy', levelReq: 5, outputItemId: 'potion_def', outputQty: 2, successRate: 0.9,
    ingredients: [{ itemId: 'iron_ore', quantity: 3 }, { itemId: 'water', quantity: 3 }, { itemId: 'herb', quantity: 2 }], xp: 100, questKey: 'craft_potion_def' },
  { id: 'rec_int', name: 'Poción de Sabiduría', category: 'alch', station: 'alchemy', levelReq: 6, outputItemId: 'potion_int', outputQty: 2, successRate: 0.9,
    ingredients: [{ itemId: 'crystal', quantity: 1 }, { itemId: 'water', quantity: 3 }, { itemId: 'herb', quantity: 3 }], xp: 120, questKey: 'craft_potion_int' },
  { id: 'rec_hp_big', name: 'Poción Mayor', category: 'alch', station: 'alchemy', levelReq: 8, outputItemId: 'potion_hp_big', outputQty: 2, successRate: 0.85,
    ingredients: [{ itemId: 'herb', quantity: 8 }, { itemId: 'honey', quantity: 2 }, { itemId: 'water', quantity: 4 }], xp: 160, questKey: 'craft_potion_big' },

  // ── Los dos escalones de arriba de la escalera de curación ─────
  //
  // La escalera tiene seis peldaños (I, II, III, IV, V y el Elixir) y
  // los DOS ÚLTIMOS no se conseguían de ninguna manera: no los soltaba
  // ningún bicho, no había receta y no los daba ninguna misión. Estaban
  // en el catálogo con su nombre, su rareza y su curación, y eran
  // inalcanzables. Lo cazó revisar-materiales.js cerrando el grafo.
  //
  // La Poción de Curación V se fabrica; el Elixir Mítico no, porque a
  // ese nivel una receta lo convertiría en un consumible más. Ese sale
  // del botín de la mazmorra de las Ruinas, que es donde vive el
  // material de nivel mítico.
  { id: 'rec_hp_v', name: 'Poción de Curación V', category: 'alch', station: 'alchemy', levelReq: 14, outputItemId: 'potion_hp_v', outputQty: 1, successRate: 0.8,
    ingredients: [{ itemId: 'herb', quantity: 14 }, { itemId: 'crystal', quantity: 2 }, { itemId: 'honey', quantity: 4 }, { itemId: 'water', quantity: 6 }],
    xp: 320, questKey: 'craft_potion_v' },

  // ── El esqueje de cristal ──────────────────────────────────────
  //
  // El huerto sabe hacer crecer un esqueje de cristal y convertirlo en
  // cristal (47-recoleccion-huerto.js), pero el esqueje NO SALÍA DE
  // NINGUNA PARTE: esa rama del huerto estaba escrita y muerta.
  //
  // Se saca de un cristal, que es lo que tiene sentido: encuentras uno
  // picando o matando, y a partir de ahí puedes cultivarlos. Cierra el
  // bucle sin regalar nada, porque cuesta un cristal producir uno o dos.
  { id: 'rec_semilla_cristal', name: 'Esqueje de Cristal', category: 'alch', station: 'alchemy', levelReq: 8, outputItemId: 'semilla_cristal', outputQty: 1, successRate: 0.9,
    ingredients: [{ itemId: 'crystal', quantity: 1 }, { itemId: 'water', quantity: 4 }], xp: 90, questKey: 'craft_esqueje' },

  // ── Cocina ─────────────────────────────────────────────────────
  { id: 'rec_corncake', name: 'Torta de Maíz', category: 'cook', station: 'kitchen', levelReq: 1, outputItemId: 'corn_cake', outputQty: 3, successRate: 1,
    ingredients: [{ itemId: 'corn', quantity: 3 }, { itemId: 'water', quantity: 1 }], xp: 30, questKey: 'craft_corncake' },
  { id: 'rec_stew', name: 'Guiso de Calabaza', category: 'cook', station: 'kitchen', levelReq: 3, outputItemId: 'stew', outputQty: 2, successRate: 1,
    ingredients: [{ itemId: 'pumpkin', quantity: 2 }, { itemId: 'water', quantity: 2 }, { itemId: 'herb', quantity: 1 }], xp: 55, questKey: 'craft_stew' },
  { id: 'rec_skewer', name: 'Brocheta Picante', category: 'cook', station: 'kitchen', levelReq: 5, outputItemId: 'spicy_skewer', outputQty: 2, successRate: 1,
    ingredients: [{ itemId: 'chili', quantity: 2 }, { itemId: 'leather', quantity: 1 }, { itemId: 'wood', quantity: 1 }], xp: 85, questKey: 'craft_skewer' },
  { id: 'rec_honeybread', name: 'Pan de Miel', category: 'cook', station: 'kitchen', levelReq: 4, outputItemId: 'honey_bread', outputQty: 2, successRate: 1,
    ingredients: [{ itemId: 'wheat', quantity: 4 }, { itemId: 'honey', quantity: 2 }, { itemId: 'water', quantity: 1 }], xp: 70, questKey: 'craft_honeybread' },
]

// ═══════════════════════════════════════════════════════════════════
//  (Las mazmorras viven en 59-mazmorras.js desde la v22)
//
//  Aquí había un sistema de mazmorras de "pulsar Avanzar" con su
//  catálogo, sus DungeonRun y sus tiempos mínimos. Se sustituyó por el
//  de salas y combate real. Antes de retirarlo se comprobó que ninguna
//  página lo llamaba: el único resto era un puente huérfano en el
//  launcher que nadie invocaba desde que se reescribió la pantalla.
//
//  Se retira en vez de dejarlo desconectado porque código muerto que
//  parece vivo ya nos costó un diagnóstico equivocado: el doctor
//  probaba este endpoint y no el que usa el juego.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  PvP — resultado determinado por el servidor (sin apuestas reales)
// ═══════════════════════════════════════════════════════════════════
const PVP_MAX_GOLD_WAGER = 2000     // apuesta simbólica de oro, nunca CGRID
function simulatePvp(char, opponent, seed) {
  const rng = makeRng(seed)
  const a = effectiveStats(char)
  const b = opponent.stats
  let hpA = a.maxHp, hpB = b.maxHp
  const rounds = []
  for (let i = 0; i < 40 && hpA > 0 && hpB > 0; i++) {
    const dmgA = Math.max(1, Math.floor((a.strength + a.intelligence + a.agility) * (0.7 + rng() * 0.6) - b.defense * 0.8))
    hpB -= dmgA
    if (hpB <= 0) { rounds.push({ turn: i, dmgA, dmgB: 0 }); break }
    const dmgB = Math.max(1, Math.floor((b.strength + b.intelligence + b.agility) * (0.7 + rng() * 0.6) - a.defense * 0.8))
    hpA -= dmgB
    rounds.push({ turn: i, dmgA, dmgB })
  }
  return { win: hpA > 0 && hpB <= 0, hpA: Math.max(0, hpA), hpB: Math.max(0, hpB), rounds }
}

function botOpponent(rating, level) {
  const scale = Math.max(0.6, rating / 1400)
  return {
    name: ['VoidWalker', 'IronForge', 'DragonHeart', 'FrostMage', 'NightBlade'][randInt(0, 4)],
    rating, level,
    stats: {
      strength: Math.floor(18 * scale + level * 2), intelligence: Math.floor(18 * scale + level * 2),
      agility: Math.floor(16 * scale + level * 2), defense: Math.floor(20 * scale + level * 2),
      maxHp: Math.floor(700 * scale + level * 45),
    },
  }
}

function runPvpMatch(char, wagerGold) {
  char.pvpLast = char.pvpLast || 0
  if (now() - char.pvpLast < 5000) return { error: 'Espera antes de otro combate', code: 429 }
  char.pvpLast = now()
  const wager = Math.min(Math.max(0, Math.floor(wagerGold || 0)), PVP_MAX_GOLD_WAGER, Math.floor(char.gold * 0.2))
  const opp = botOpponent(Math.max(800, (char.pvpRating || 1200) + randInt(-120, 120)), char.level)
  const seed = crypto.randomBytes(8).toString('hex')
  const sim = simulatePvp(char, opp, seed)
  const expected = 1 / (1 + Math.pow(10, (opp.rating - char.pvpRating) / 400))
  const K = 32
  const delta = Math.round(K * ((sim.win ? 1 : 0) - expected))
  char.pvpRating = Math.max(800, (char.pvpRating || 1200) + delta)
  if (sim.win) { char.pvpWins = (char.pvpWins || 0) + 1; char.gold += wager }
  else { char.pvpLosses = (char.pvpLosses || 0) + 1; char.gold = Math.max(0, char.gold - wager) }
  const match = { id: nextId('pvp'), owner: char.id, seed, opponent: opp.name, result: sim.win ? 'win' : 'loss', delta, wager, at: new Date().toISOString() }
  store.pvpMatches[match.id] = match
  audit('pvp_match', char.name, { result: match.result, delta, wager, opponent: opp.name, seed })
  track('pvp_match', char.name)
  step(char.name, 'first_pvp')
  persist()
  const st = effectiveStats(char)
  return {
    success: true, matchId: match.id, opponent: opp.name, opponentRating: opp.rating,
    result: match.result, newRating: char.pvpRating, ratingChange: delta,
    newGold: char.gold, newCgrid: char.cgrid, wager, rounds: sim.rounds.length, levelUps: [],
    // El combate, no solo el veredicto.
    //
    // Se devolvían únicamente el resultado y el número de asaltos, así
    // que la pantalla solo podía decir "has ganado". El servidor ya
    // calcula el intercambio asalto a asalto —lo necesita para saber
    // quién gana—, y tirarlo obliga a quien dibuje a inventarse la
    // pelea o a no enseñarla. Aquí va tal cual, igual que el guion del
    // combate por turnos: el cliente lo REPRODUCE, no lo decide.
    duelo: {
      semilla: seed,
      tu: { nombre: char.name, nivel: char.level, hpMax: st.maxHp, rating: char.pvpRating - delta },
      rival: { nombre: opp.name, nivel: opp.level, hpMax: opp.stats.maxHp, rating: opp.rating },
      asaltos: sim.rounds,
      hpFinalTuyo: sim.hpA, hpFinalRival: sim.hpB,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════
//  MERCADO — escrow, ownership, comisión, compra atómica
// ═══════════════════════════════════════════════════════════════════
const MARKET_MAX_PRICE = 10_000_000
function seedMarket() {
  if (store.marketListings.length) return
  const seeds = [
    ['sword_alba', 2, 340, 'ArkaneX'], ['crystal', 3, 420, 'IronForge'], ['iron_ore', 20, 15, 'StarDust'],
    ['potion_hp', 10, 22, 'FrostMage'], ['arcane_orb', 1, 1800, 'VoidWalker'], ['elven_bow', 1, 950, 'NightBlade'],
    ['thunder_staff', 1, 2800, 'DragonHeart'], ['herb', 15, 5, 'Elara'],
  ]
  for (const [itemId, qty, price, seller] of seeds) {
    const t = template(itemId)
    store.marketListings.push({
      id: nextId('lst'), sellerId: 'npc_' + seller, seller: { name: seller }, npc: true,
      itemId, quantity: qty, pricePerUnit: price, currency: 'gold',
      item: { itemId, name: t.name, icon: t.icon, rarity: t.rarity, type: t.type },
      status: 'ACTIVE', createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    })
  }
}

function createListing(char, itemId, quantity, pricePerUnit) {
  const t = template(itemId)
  if (!t) return { error: 'Objeto desconocido', code: 400 }
  if (t.tradeable === false) return { error: 'Objeto no comerciable', code: 400 }
  const qty = intIn(quantity, 1, 999)
  const price = intIn(pricePerUnit, 1, MARKET_MAX_PRICE)
  if (!qty || !price) return { error: 'Cantidad o precio inválido', code: 400 }
  if (countItem(char, itemId) < qty) return { error: 'Ítems insuficientes', code: 400 }
  const mine = store.marketListings.filter(l => l.sellerId === char.id && l.status === 'ACTIVE').length
  if (mine >= 20) return { error: 'Máximo 20 publicaciones activas', code: 429 }
  removeItem(char, itemId, qty)   // ESCROW: el objeto sale del inventario
  const listing = {
    id: nextId('lst'), sellerId: char.id, seller: { name: char.name },
    itemId, quantity: qty, pricePerUnit: price, currency: 'gold',
    item: { itemId, name: t.name, icon: t.icon, rarity: t.rarity, type: t.type },
    status: 'ACTIVE', createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  }
  store.marketListings.push(listing)
  audit('market_list', char.name, { listingId: listing.id, itemId, qty, price })
  persist()
  return { listing }
}

// Sin await en el cuerpo → la operación es atómica en el loop de Node
function buyListing(char, listingId, quantity) {
  const listing = store.marketListings.find(l => l.id === listingId)
  if (!listing) return { error: 'Publicación no encontrada', code: 404 }
  if (listing.status !== 'ACTIVE') return { error: 'Publicación no disponible', code: 409 }
  if (new Date(listing.expiresAt).getTime() < now()) { listing.status = 'EXPIRED'; return { error: 'Publicación expirada', code: 409 } }
  if (listing.sellerId === char.id) return { error: 'No puedes comprar tu propia publicación', code: 400 }
  const qty = intIn(quantity, 1, listing.quantity)
  if (!qty) return { error: 'Cantidad inválida', code: 400 }
  // EL PRECIO SIEMPRE SALE DEL LISTING, NUNCA DEL CLIENTE
  const cost = listing.pricePerUnit * qty
  if (char.gold < cost) return { error: 'Oro insuficiente', code: 400 }

  char.gold -= cost
  listing.quantity -= qty
  if (listing.quantity <= 0) listing.status = 'SOLD'
  const added = addItem(char, listing.itemId, qty)
  if (!added) { char.gold += cost; listing.quantity += qty; listing.status = 'ACTIVE'; return { error: 'Inventario lleno', code: 400 } }

  const fee = Math.floor(cost * ECONOMY.MARKET_FEE)
  store.economy.goldBurned += fee
  const seller = Object.values(store.players).find(p => p.character.id === listing.sellerId)
  if (seller) seller.character.gold += (cost - fee)

  const tx = { id: nextId('tx'), listingId, buyer: char.name, seller: listing.seller.name, itemId: listing.itemId, quantity: qty, unitPrice: listing.pricePerUnit, total: cost, fee, at: new Date().toISOString() }
  store.marketTransactions.push(tx)
  // El historial completo no cabe en memoria para siempre: se conservan
  // las últimas 2000, que es lo que además se vuelca a disco.
  if (store.marketTransactions.length > 2000) store.marketTransactions.splice(0, 500)
  audit('market_buy', char.name, tx)
  trackCurrency(char.name, 'gold', -cost, 'market_buy')
  if (seller) trackCurrency(seller.character.name, 'gold', cost - fee, 'market_sale')
  track('market_buy', char.name)
  step(char.name, 'first_market_buy')
  persist()
  return { success: true, totalCost: cost, fee, currency: 'gold', transaction: tx, newGold: char.gold }
}

function cancelListing(char, listingId) {
  const l = store.marketListings.find(x => x.id === listingId)
  if (!l) return { error: 'No encontrada', code: 404 }
  if (l.sellerId !== char.id) return { error: 'No es tu publicación', code: 403 }
  if (l.status !== 'ACTIVE') return { error: 'No está activa', code: 409 }
  l.status = 'CANCELLED'
  addItem(char, l.itemId, l.quantity)   // devuelve el escrow
  audit('market_cancel', char.name, { listingId })
  persist()
  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════
//  GREMIOS — permisos, capacidad, coste, tesorería
// ═══════════════════════════════════════════════════════════════════
const GUILD_CREATE_COST = 5000
const GUILD_ROLES = { LEADER: 3, OFFICER: 2, MEMBER: 1 }
function seedGuilds() {
  if (Object.keys(store.guilds).length) return
  const base = [
    ['Guardianes del Nexo', '[GDN]', '🌀', 12, 'ArkaneX'],
    ['Legión de Hierro', '[LDH]', '⚔️', 9, 'IronLord'],
    ['Orden Oscura', '[OO]', '💀', 6, 'DarkMage'],
  ]
  for (const [name, tag, emblem, level, leader] of base) {
    const id = nextId('g')
    store.guilds[id] = { id, name, tag, emblem, level, leader, desc: '', members: [{ name: leader, role: 'LEADER', joinedAt: new Date().toISOString() }], maxMembers: 20 + level, treasury: { gold: 0, cgrid: 0 }, xp: 0, wins: 0, losses: 0, draws: 0, founded: new Date().toISOString().slice(0, 10), npc: true }
  }
}
function guildPublic(g) {
  return { id: g.id, name: g.name, tag: g.tag, emblem: g.emblem, level: g.level, leader: g.leader, desc: g.desc, members: g.members.length, maxMembers: g.maxMembers, treasury: g.treasury, wins: g.wins, losses: g.losses, draws: g.draws, founded: g.founded, power: g.level * 12000 + g.members.length * 1500 }
}
function guildRole(g, char) {
  const m = g.members.find(x => x.name === char.name)
  return m ? m.role : null
}
