
// ═══════════════════════════════════════════════════════════════════
//  DATOS DE JUEGO (catálogo autoritativo del servidor)
// ═══════════════════════════════════════════════════════════════════
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// RNG determinista por semilla (para runs reproducibles y auditables)
function makeRng(seed) {
  let s = typeof seed === 'string' ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) : seed >>> 0
  return function rng() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']

// Plantillas de objeto — la fuente de verdad de nombre/icono/rareza/valor
const ITEM_TEMPLATES = {
  iron_ore:      { name: 'Mineral de Hierro', icon: '🪨', type: 'MATERIAL', rarity: 'COMMON',    value: 12,  tradeable: true },
  herb:          { name: 'Hierba Medicinal',  icon: '🌿', type: 'MATERIAL', rarity: 'COMMON',    value: 5,   tradeable: true },
  wood:          { name: 'Madera',            icon: '🪵', type: 'MATERIAL', rarity: 'COMMON',    value: 4,   tradeable: true },
  water:         { name: 'Agua Pura',         icon: '💧', type: 'MATERIAL', rarity: 'COMMON',    value: 2,   tradeable: true },
  wheat:         { name: 'Trigo',             icon: '🌾', type: 'MATERIAL', rarity: 'COMMON',    value: 3,   tradeable: true },
  leather:       { name: 'Cuero Curtido',     icon: '🟫', type: 'MATERIAL', rarity: 'COMMON',    value: 9,   tradeable: true },
  potion_hp:     { name: 'Poción de Curación I', icon: '🧪', type: 'POTION', rarity: 'COMMON',    value: 20,  tradeable: true, heal: 220 },
  potion_mp:     { name: 'Poción de Maná',    icon: '💊', type: 'POTION',   rarity: 'COMMON',    value: 24,  tradeable: true, mana: 150 },
  bread:         { name: 'Pan de Campo',      icon: '🍞', type: 'FOOD',     rarity: 'COMMON',    value: 6,   tradeable: true, heal: 60 },
  dagger:        { name: 'Daga de Hierro',    icon: '🗡️', type: 'WEAPON',  rarity: 'COMMON',    value: 80,  tradeable: true, slot: 'weapon', stats: { str: 4, agi: 3 } },
  sword_alba:    { name: 'Espada del Alba',   icon: '⚔️', type: 'WEAPON',  rarity: 'UNCOMMON',  value: 340, tradeable: true, slot: 'weapon', stats: { str: 12, def: 2 } },

  // Espadas con dibujo propio (32×32 en assets/items/). El campo
  // `imagen` es opcional: quien no sepa pintarla usa el emoji de
  // `icon`, así que ninguna pantalla se rompe por no conocerlas.
  espada_piedra:   { name: 'Espada de Piedra',   icon: '🗡️', imagen: '/assets/items/espada_piedra.png',
    type: 'WEAPON', rarity: 'COMMON', value: 70,   tradeable: true, slot: 'weapon', stats: { str: 6 } },
  espada_hierro:   { name: 'Espada de Hierro',   icon: '⚔️', imagen: '/assets/items/espada_hierro.png',
    type: 'WEAPON', rarity: 'RARE',   value: 480,  tradeable: true, slot: 'weapon', stats: { str: 15, def: 2 } },
  espada_diamante: { name: 'Espada de Diamante', icon: '💠', imagen: '/assets/items/espada_diamante.png',
    type: 'WEAPON', rarity: 'EPIC',   value: 2600, tradeable: true, slot: 'weapon', stats: { str: 30, agi: 6, def: 4 } },
  elven_bow:     { name: 'Arco Élfico',       icon: '🏹', type: 'WEAPON',  rarity: 'RARE',      value: 950, tradeable: true, slot: 'weapon', stats: { agi: 18, str: 6 } },
  thunder_staff: { name: 'Cetro del Trueno',  icon: '⚡', type: 'WEAPON',  rarity: 'EPIC',      value: 2800,tradeable: true, slot: 'weapon', stats: { int: 30 }, element: 'lightning' },
  arcane_orb:    { name: 'Orbe Arcano',       icon: '🔮', type: 'ACCESSORY',rarity: 'EPIC',     value: 1800,tradeable: true, slot: 'accessory1', stats: { int: 22, mp: 80 } },
  crystal:       { name: 'Cristal de Hielo',  icon: '💎', type: 'MATERIAL', rarity: 'RARE',      value: 420, tradeable: true },
  spy_hood:      { name: 'Capucha del Espía', icon: '🎩', type: 'ARMOR',    rarity: 'RARE',      value: 500, tradeable: true, slot: 'helmet', stats: { agi: 10 } },
  iron_helm:     { name: 'Yelmo de Hierro',   icon: '⛑️', type: 'ARMOR',   rarity: 'COMMON',    value: 120, tradeable: true, slot: 'helmet', stats: { def: 6 } },
  leather_chest: { name: 'Peto de Cuero',     icon: '🦺', type: 'ARMOR',    rarity: 'COMMON',    value: 150, tradeable: true, slot: 'chest', stats: { def: 9, hp: 40 } },
  semilla_trigo:  { name: 'Semilla de Trigo',   icon: '🌾', type: 'SEED', rarity: 'COMMON',   value: 8,  tradeable: true },
  semilla_hierba: { name: 'Semilla de Hierba',  icon: '🌿', type: 'SEED', rarity: 'COMMON',   value: 12, tradeable: true },
  semilla_cristal:{ name: 'Esqueje de Cristal', icon: '💎', type: 'SEED', rarity: 'RARE',     value: 250,tradeable: true },
  // ── Cultivos y comida ──────────────────────────────────────────
  corn:          { name: 'Maíz',               icon: '🌽', type: 'MATERIAL', rarity: 'COMMON',    value: 5,   tradeable: true },
  pumpkin:       { name: 'Calabaza',           icon: '🎃', type: 'MATERIAL', rarity: 'COMMON',    value: 11,  tradeable: true },
  chili:         { name: 'Chile Ardiente',     icon: '🌶️', type: 'MATERIAL', rarity: 'UNCOMMON', value: 26,  tradeable: true },
  honey:         { name: 'Miel Silvestre',     icon: '🍯', type: 'MATERIAL', rarity: 'UNCOMMON',  value: 30,  tradeable: true },
  semilla_maiz:    { name: 'Semilla de Maíz',     icon: '🌽', type: 'SEED', rarity: 'COMMON',    value: 9,  tradeable: true },
  semilla_calabaza:{ name: 'Semilla de Calabaza', icon: '🎃', type: 'SEED', rarity: 'COMMON',    value: 18, tradeable: true },
  semilla_chile:   { name: 'Semilla de Chile',    icon: '🌶️', type: 'SEED', rarity: 'UNCOMMON', value: 45, tradeable: true },

  // La comida cura menos que una poción pero además deja un efecto:
  // es la razón para cocinar en vez de beber pociones todo el rato.
  stew:          { name: 'Guiso de Calabaza',  icon: '🍲', type: 'FOOD', rarity: 'COMMON',   value: 34,  tradeable: true, heal: 180, buff: { stat: 'defense', valor: 6, minutos: 8 } },
  corn_cake:     { name: 'Torta de Maíz',      icon: '🥞', type: 'FOOD', rarity: 'COMMON',   value: 22,  tradeable: true, heal: 120, buff: { stat: 'maxHp', valor: 60, minutos: 10 } },
  spicy_skewer:  { name: 'Brocheta Picante',   icon: '🍢', type: 'FOOD', rarity: 'UNCOMMON', value: 70,  tradeable: true, heal: 150, buff: { stat: 'strength', valor: 6, minutos: 6 } },
  honey_bread:   { name: 'Pan de Miel',        icon: '🍞', type: 'FOOD', rarity: 'UNCOMMON', value: 56,  tradeable: true, heal: 240, buff: { stat: 'intelligence', valor: 6, minutos: 6 } },

  // ── Pociones con efecto temporal ───────────────────────────────
  potion_str:    { name: 'Poción de Fuerza',   icon: '🟥', type: 'POTION', rarity: 'UNCOMMON', value: 90,  tradeable: true, buff: { stat: 'strength', valor: 14, minutos: 5 } },
  potion_spd:    { name: 'Poción de Velocidad',icon: '🟩', type: 'POTION', rarity: 'UNCOMMON', value: 90,  tradeable: true, buff: { stat: 'agility', valor: 14, minutos: 5 } },
  potion_def:    { name: 'Poción de Piedra',   icon: '🟦', type: 'POTION', rarity: 'UNCOMMON', value: 95,  tradeable: true, buff: { stat: 'defense', valor: 16, minutos: 5 } },
  potion_int:    { name: 'Poción de Sabiduría',icon: '🟪', type: 'POTION', rarity: 'UNCOMMON', value: 95,  tradeable: true, buff: { stat: 'intelligence', valor: 14, minutos: 5 } },
  potion_hp_big: { name: 'Poción de Curación III', icon: '🍶', type: 'POTION', rarity: 'RARE',     value: 210, tradeable: true, heal: 1100, mana: 300 },

  // Escalera de curación (§13). Cada escalón sube de rareza y cura
  // bastante más, para que valga la pena guardar las buenas en vez de
  // beberse la primera que aparezca. potion_hp y potion_hp_big ya
  // existían: se quedan con su id para no romper inventarios guardados.
  potion_hp_ii:  { name: 'Poción de Curación II', icon: '🧪', type: 'POTION', rarity: 'UNCOMMON',  value: 70,   tradeable: true, heal: 500 },
  potion_hp_iv:  { name: 'Poción de Curación IV', icon: '⚗️', type: 'POTION', rarity: 'EPIC',      value: 600,  tradeable: true, heal: 2400, mana: 600 },
  potion_hp_v:   { name: 'Poción de Curación V',  icon: '🫙', type: 'POTION', rarity: 'LEGENDARY', value: 1600, tradeable: true, heal: 5000, mana: 1200 },
  elixir_mitico: { name: 'Elixir Mítico',         icon: '🏺', type: 'POTION', rarity: 'MYTHIC',    value: 4200, tradeable: true, heal: 99999, mana: 99999 },

  // ── Armas ──────────────────────────────────────────────────────
  wood_club:     { name: 'Garrote de Roble',   icon: '🏏', type: 'WEAPON', rarity: 'COMMON',    value: 45,   tradeable: true, slot: 'weapon', stats: { str: 3 } },
  iron_axe:      { name: 'Hacha de Leñador',   icon: '🪓', type: 'WEAPON', rarity: 'COMMON',    value: 190,  tradeable: true, slot: 'weapon', stats: { str: 9 } },
  iron_spear:    { name: 'Lanza de Hierro',    icon: '🔱', type: 'WEAPON', rarity: 'UNCOMMON',  value: 300,  tradeable: true, slot: 'weapon', stats: { str: 7, agi: 6 } },
  short_bow:     { name: 'Arco Corto',         icon: '🏹', type: 'WEAPON', rarity: 'COMMON',    value: 160,  tradeable: true, slot: 'weapon', stats: { agi: 8 } },
  crystal_wand:  { name: 'Vara de Cristal',    icon: '🪄', type: 'WEAPON', rarity: 'UNCOMMON',  value: 420,  tradeable: true, slot: 'weapon', stats: { int: 14, mp: 40 } },
  frost_blade:   { name: 'Filo Escarchado',    icon: '❄️', type: 'WEAPON', rarity: 'RARE',      value: 1400, tradeable: true, slot: 'weapon', stats: { str: 16, agi: 8 }, element: 'ice' },

  // ── Armaduras: juegos completos por material ───────────────────
  leather_helm:  { name: 'Capucha de Cuero',   icon: '🧢', type: 'ARMOR', rarity: 'COMMON', value: 80,  tradeable: true, slot: 'helmet',    stats: { def: 4, agi: 2 } },
  leather_gloves:{ name: 'Guantes de Cuero',   icon: '🧤', type: 'ARMOR', rarity: 'COMMON', value: 70,  tradeable: true, slot: 'gloves',    stats: { def: 3, agi: 3 } },
  leather_boots: { name: 'Botas de Cuero',     icon: '🥾', type: 'ARMOR', rarity: 'COMMON', value: 75,  tradeable: true, slot: 'boots',     stats: { def: 3, agi: 4 } },
  iron_chest:    { name: 'Coraza de Hierro',   icon: '🛡️', type: 'ARMOR', rarity: 'UNCOMMON', value: 380, tradeable: true, slot: 'chest',  stats: { def: 16, hp: 90 } },
  iron_gloves:   { name: 'Guanteletes',        icon: '🥊', type: 'ARMOR', rarity: 'UNCOMMON', value: 210, tradeable: true, slot: 'gloves',  stats: { def: 8, str: 4 } },
  iron_boots:    { name: 'Grebas de Hierro',   icon: '👢', type: 'ARMOR', rarity: 'UNCOMMON', value: 230, tradeable: true, slot: 'boots',   stats: { def: 9, hp: 40 } },
  crystal_helm:  { name: 'Yelmo de Cristal',   icon: '👑', type: 'ARMOR', rarity: 'RARE',   value: 900, tradeable: true, slot: 'helmet',    stats: { def: 12, int: 10, mp: 60 } },
  crystal_chest: { name: 'Peto de Cristal',    icon: '🩻', type: 'ARMOR', rarity: 'RARE',   value: 1200,tradeable: true, slot: 'chest',     stats: { def: 22, hp: 140, int: 8 } },

  // ── Accesorios ─────────────────────────────────────────────────
  luck_charm:    { name: 'Amuleto de Trébol',  icon: '🍀', type: 'ACCESSORY', rarity: 'UNCOMMON', value: 260, tradeable: true, slot: 'accessory2', stats: { agi: 8, hp: 30 } },
  bone_ring:     { name: 'Anillo de Hueso',    icon: '💍', type: 'ACCESSORY', rarity: 'RARE',     value: 640, tradeable: true, slot: 'accessory2', stats: { str: 10, def: 6 } },

  soul_shard:    { name: 'Fragmento de Alma', icon: '✨', type: 'MATERIAL', rarity: 'LEGENDARY', value: 5000,tradeable: true },
}
function template(id) { return ITEM_TEMPLATES[id] || null }
function makeItem(itemId, quantity = 1) {
  const t = template(itemId)
  if (!t) return null
  return {
    uid: nextId('itm'), itemId, name: t.name, icon: t.icon, type: t.type,
    rarity: t.rarity, quantity: Math.max(1, Math.floor(quantity)), tradeable: t.tradeable !== false,
  }
}

const SLOTS = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'accessory1', 'accessory2']

// ── Clases: identidad real, no los mismos números ──────────────────
const CLASSES = {
  Guerrero:  { base: { strength: 38, intelligence: 12, agility: 20, defense: 42, maxHp: 1150, maxMp: 200 },
               growth: { strength: 4, intelligence: 1, agility: 2, defense: 4, hp: 75, mp: 10 },
               primary: 'strength', resource: 'rage', skills: ['embestida', 'golpe_escudo', 'grito_guerra'] },
  Mago:      { base: { strength: 10, intelligence: 46, agility: 18, defense: 18, maxHp: 720, maxMp: 620 },
               growth: { strength: 1, intelligence: 5, agility: 2, defense: 2, hp: 38, mp: 35 },
               primary: 'intelligence', resource: 'mana', skills: ['bola_fuego', 'nova_hielo', 'escudo_arcano'] },
  Asesino:   { base: { strength: 26, intelligence: 16, agility: 44, defense: 22, maxHp: 850, maxMp: 300 },
               growth: { strength: 3, intelligence: 1, agility: 5, defense: 2, hp: 50, mp: 18 },
               primary: 'agility', resource: 'energy', skills: ['puñalada', 'sombra', 'veneno'] },
  Archimago: { base: { strength: 12, intelligence: 44, agility: 22, defense: 24, maxHp: 850, maxMp: 500 },
               growth: { strength: 1, intelligence: 4, agility: 2, defense: 2, hp: 45, mp: 28 },
               primary: 'intelligence', resource: 'mana', skills: ['bola_fuego', 'rayo', 'escudo_arcano'] },
}
const SKILLS = {
  embestida:     { name: 'Embestida',      cost: 20, cooldownMs: 6000,  power: 1.6, scale: 'strength',     element: 'physical' },
  golpe_escudo:  { name: 'Golpe de Escudo',cost: 25, cooldownMs: 9000,  power: 1.1, scale: 'defense',      element: 'physical', stun: true },
  grito_guerra:  { name: 'Grito de Guerra',cost: 30, cooldownMs: 20000, power: 0,   scale: 'strength',     buff: { atk: 0.25, turns: 3 } },
  bola_fuego:    { name: 'Bola de Fuego',  cost: 40, cooldownMs: 4000,  power: 2.0, scale: 'intelligence', element: 'fire' },
  nova_hielo:    { name: 'Nova de Hielo',  cost: 45, cooldownMs: 11000, power: 1.4, scale: 'intelligence', element: 'ice', slow: true },
  rayo:          { name: 'Rayo Arcano',    cost: 35, cooldownMs: 5000,  power: 1.9, scale: 'intelligence', element: 'lightning' },
  escudo_arcano: { name: 'Escudo Arcano',  cost: 35, cooldownMs: 18000, power: 0,   scale: 'intelligence', buff: { def: 0.4, turns: 3 } },
  puñalada:      { name: 'Puñalada',       cost: 20, cooldownMs: 5000,  power: 1.8, scale: 'agility',      element: 'physical', critBonus: 0.25 },
  sombra:        { name: 'Manto de Sombra',cost: 30, cooldownMs: 16000, power: 0,   scale: 'agility',      buff: { eva: 0.3, turns: 2 } },
  veneno:        { name: 'Veneno',         cost: 25, cooldownMs: 10000, power: 0.6, scale: 'agility',      element: 'nature', dot: { dmg: 0.3, turns: 3 } },
}

// ── La vida de los bichos sigue una curva ──────────────────────────
//
//   vida ≈ 130 × nivel^0,71     ×1,7 si es jefe
//
// No es una regla que yo haya impuesto: la araña, el troll y Grommash
// caen encima de ella con un error del 3%. Estaba ya en la tabla.
//
// Y medida contra ella salieron dos agujeros: el Dragón Menor tenía el
// 46% de la vida que le tocaba y el Demonio Abismal el 59%. A los dos
// les faltaba, sencillamente, el multiplicador de jefe que Grommash sí
// tenía. El Dragón —jefe de nivel 15— tenía EXACTAMENTE la misma vida
// que el Gólem de nivel 8.
//
// Lo que se veía jugando: Grommash duraba 20 turnos y el Demonio
// Abismal, el jefe final, duraba 6. Las dos mecánicas de jefe —el golpe
// anunciado cada 3 turnos y el cambio de fase a media vida— no llegaban
// a darse contra los jefes de arriba.
//
// Antes: m_dragon 700 · m_demon 1100.   Comprobado con banco-balance.js.
const MONSTERS = {
  m_spider:   { id: 'm_spider',   name: 'Araña Venenosa',  icon: '🕷️', level: 3,  hp: 285,  atk: [48, 82],   def: 10, xp: 180, gold: [30, 70],    zone: 'forest', element: 'nature',    questKey: 'kill_spider' },
  m_skeleton: { id: 'm_skeleton', name: 'Esqueleto',       icon: '💀', level: 4,  hp: 250,  atk: [52, 88],   def: 15, xp: 160, gold: [25, 65],    zone: 'crypt',  element: 'dark',      questKey: 'kill_skeleton' },
  m_troll:    { id: 'm_troll',    name: 'Troll Sombrío',   icon: '🧟', level: 5,  hp: 420,  atk: [64, 100],   def: 20, xp: 280, gold: [60, 130],   zone: 'forest', element: 'dark',      questKey: 'kill_troll' },
  m_golem:    { id: 'm_golem',    name: 'Gólem de Piedra', icon: '🗿', level: 8,  hp: 700,  atk: [85, 125],  def: 55, xp: 520, gold: [100, 200],  zone: 'mines',  element: 'earth',     questKey: 'kill_golem' },
  m_troll_boss: { id: 'm_troll_boss', name: 'Grommash, Troll Jefe', icon: '👹', level: 7, hp: 900, atk: [70, 110], def: 28, xp: 520, gold: [120, 260], zone: 'forest', element: 'dark', isBoss: true, questKey: 'kill_troll_boss' },
  m_dragon:   { id: 'm_dragon',   name: 'Dragón Menor',    icon: '🐉', level: 15, hp: 1500,  atk: [95, 155],  def: 30, xp: 680, gold: [180, 380],  zone: 'ruins',  element: 'fire',      isBoss: true, questKey: 'kill_dragon' },
  m_demon:    { id: 'm_demon',    name: 'Demonio Abismal', icon: '👿', level: 20, hp: 1850, atk: [115, 175], def: 40, xp: 900, gold: [280, 480],  zone: 'ruins',  element: 'dark',      isBoss: true, questKey: 'kill_demon' },

  // ── Los dos que vivían solo en el mapa ─────────────────────────
  //
  // El Murciélago Oscuro y el Liche Antiguo estaban declarados en el
  // mundo 2D —con nivel, vida, ataque, oro y experiencia— y NO en esta
  // tabla. Mientras el mapa se peleaba solo en el navegador daba igual;
  // en cuanto el combate pasa por el servidor, un bicho que el catálogo
  // no conoce no se puede pelear. O se borraban del mapa o entraban
  // aquí. Entran, porque son contenido que ya estaba diseñado.
  //
  // De dónde salen los números, para que no parezcan de mi cosecha:
  //
  //   m_bat    tal cual los declaraba el mapa. Encajan sin tocarlos: un
  //            nivel 4 flojo con 200 de vida queda justo por debajo del
  //            Esqueleto (nivel 4, 250), que es lo que pretende ser.
  //
  //   m_liche  el mapa le daba 850 de vida, pero ese número venía de la
  //            escala del cliente, no de esta tabla. Aquí manda la curva
  //            documentada arriba —vida ≈ 130 × nivel^0,71— que para
  //            nivel 18 da 1.005. No lleva el ×1,7 de jefe porque no es
  //            un jefe: es un enemigo duro de zona. Ataque y defensa se
  //            interpolan entre el Dragón (15) y el Demonio (20), que lo
  //            rodean. La experiencia y el oro son los del mapa, y ya
  //            caían entre los de esos dos.
  m_bat:      { id: 'm_bat',      name: 'Murciélago Oscuro', icon: '🦇', level: 4,  hp: 200,  atk: [30, 50],   def: 6,  xp: 100, gold: [10, 30],   zone: 'mines',  element: 'dark', questKey: 'kill_bat' },
  m_liche:    { id: 'm_liche',    name: 'Liche Antiguo',     icon: '🧛', level: 18, hp: 1005, atk: [100, 160], def: 34, xp: 780, gold: [200, 400], zone: 'ruins',  element: 'dark', questKey: 'kill_liche' },
}
// Tabla de botín server-side (el cliente nunca decide qué cae)
const LOOT_TABLES = {
  m_spider:   [{ id: 'herb', w: 45, q: [1, 2] }, { id: 'leather', w: 30, q: [1, 1] }, { id: 'potion_hp', w: 10, q: [1, 1] }],
  m_skeleton: [{ id: 'iron_ore', w: 40, q: [1, 2] }, { id: 'wood', w: 25, q: [1, 2] }, { id: 'iron_helm', w: 5, q: [1, 1] }],
  m_troll:    [{ id: 'iron_ore', w: 40, q: [1, 3] }, { id: 'leather', w: 25, q: [1, 2] }, { id: 'leather_chest', w: 6, q: [1, 1] }],
  m_golem:    [{ id: 'iron_ore', w: 50, q: [2, 4] }, { id: 'crystal', w: 12, q: [1, 1] }, { id: 'sword_alba', w: 4, q: [1, 1] }, { id: 'potion_hp_ii', w: 18, q: [1, 2] }],
  m_troll_boss: [{ id: 'leather', w: 60, q: [2, 4] }, { id: 'iron_ore', w: 45, q: [2, 4] }, { id: 'sword_alba', w: 12, q: [1, 1] }],
  m_dragon:   [{ id: 'crystal', w: 35, q: [1, 2] }, { id: 'thunder_staff', w: 3, q: [1, 1] }, { id: 'soul_shard', w: 1, q: [1, 1] }, { id: 'potion_hp_big', w: 14, q: [1, 1] }],
  m_demon:    [{ id: 'crystal', w: 30, q: [1, 3] }, { id: 'arcane_orb', w: 4, q: [1, 1] }, { id: 'soul_shard', w: 2, q: [1, 1] }, { id: 'potion_hp_iv', w: 8, q: [1, 1] }],
  m_bat:      [{ id: 'leather', w: 40, q: [1, 2] }, { id: 'herb', w: 25, q: [1, 1] }],
  // El Anillo de Hueso se fabricaba (rec_ring, nivel 9) y no caía de
  // NADA. Un accesorio raro que solo sale de la forja deja la mitad
  // del recorrido sin usar: ahora también se puede arrancar de un
  // liche, que es de donde debería salir un anillo de hueso.
  m_liche:    [{ id: 'crystal', w: 28, q: [1, 2] }, { id: 'bone_ring', w: 6, q: [1, 1] }, { id: 'soul_shard', w: 1, q: [1, 1] }, { id: 'potion_hp_iv', w: 6, q: [1, 1] }],
}
const ELEMENT_CHART = { // atacante → defensor con esa resistencia
  fire:   { ice: 1.3, nature: 1.3, water: 0.7, fire: 0.6 },
  ice:    { nature: 1.3, fire: 0.7, ice: 0.6 },
  lightning: { water: 1.4, earth: 0.7, lightning: 0.6 },
  nature: { earth: 1.3, water: 1.2, fire: 0.7 },
  dark:   { light: 1.4, dark: 0.6 },
  light:  { dark: 1.4, light: 0.6 },
  physical: {},
}
function elementMult(atkEl, defEl) {
  if (!atkEl || !defEl) return 1
  return (ELEMENT_CHART[atkEl] && ELEMENT_CHART[atkEl][defEl]) || 1
}

// ═══════════════════════════════════════════════════════════════════
//  PERSONAJE: progresión, inventario, equipo (server-side)
// ═══════════════════════════════════════════════════════════════════
// Curva de experiencia. Los primeros niveles son baratos a propósito:
// el diagnóstico mostraba que llegar a nivel 5 (requisito de la primera
// mazmorra) costaba 29 enemigos, demasiado para el arranque.
function xpForLevel(level) {
  if (level <= 4) return Math.floor(450 * Math.pow(1.28, level - 1))
  return Math.floor(1000 * Math.pow(1.32, level - 4))
}

function newCharacter(username, className) {
  const cls = CLASSES[className] ? className : 'Archimago'
  const b = CLASSES[cls].base
  const char = {
    id: 'char_' + username, name: username, class: cls,
    level: 1, xp: 0, xpToNext: xpForLevel(1),
    hp: b.maxHp, maxHp: b.maxHp, mp: b.maxMp, maxMp: b.maxMp,
    gold: 500, cgrid: 0, cgridToday: 0, cgridDay: today(),
    pvpRating: 1200, pvpWins: 0, pvpLosses: 0,
    strength: b.strength, intelligence: b.intelligence, agility: b.agility, defense: b.defense,
    monstersKilled: 0, bossesKilled: 0, dungeonsCleared: 0,
    // Arranca con algo que ponerse. Antes el personaje nuevo no tenía
    // NADA equipable, así que el sistema de equipo existía pero no se
    // podía tocar hasta que cayera un objeto: parecía roto (§12).
    inventory: [
      makeItem('dagger'), makeItem('leather_helm'), makeItem('leather_boots'),
      // Un hacha y un pico básicos. Sin ellos el jugador se queda
      // encerrado: la cabeza de piedra pide piedra, y la piedra solo
      // sale de rocas que piden un pico. Se arranca con las dos.
      makeItem('hacha_madera_piedra'), makeItem('pico_madera_piedra'),
      makeItem('iron_ore', 5), makeItem('herb', 8), makeItem('wood', 6),
      makeItem('potion_hp', 3), makeItem('potion_hp_ii', 1), makeItem('water', 10),
      makeItem('semilla_trigo', 3), makeItem('semilla_hierba', 2),
    ],
    equipment: {}, skills: CLASSES[cls].skills.slice(), cooldowns: {},
    activeQuests: [], completedQuests: [], questCounters: {},
    achievements: [], zonesVisited: ['pueblo'],
    guildId: null, guildName: null, house: { level: 1, placed: [], owned: [] },
    appearance: { skinId: DEFAULT_SKIN, palette: Object.assign({}, (SKINS.find(x => x.id === DEFAULT_SKIN) || SKINS[0]).palette) },
    createdAt: new Date().toISOString(),
  }
  return char
}

// ── Efectos temporales ─────────────────────────────────────────────
// Una poción de fuerza que no cambia el daño es un icono bonito. Estos
// efectos se guardan con su hora de caducidad y entran en el cálculo
// de estadísticas, así que valen para todo: turnos, arena y mazmorras.
const NOMBRE_STAT = {
  strength: 'Fuerza', intelligence: 'Inteligencia', agility: 'Agilidad',
  defense: 'Defensa', maxHp: 'Vida máxima', maxMp: 'Maná máximo',
}

function aplicarEfecto(char, buff, origen) {
  if (!buff || !NOMBRE_STAT[buff.stat]) return null
  char.efectos = (char.efectos || []).filter(e => e.hasta > now())
  const hasta = now() + buff.minutos * 60_000
  // Tomar dos del mismo tipo no acumula: renueva y se queda el mejor.
  const previo = char.efectos.find(e => e.stat === buff.stat)
  if (previo) {
    previo.valor = Math.max(previo.valor, buff.valor)
    previo.hasta = Math.max(previo.hasta, hasta)
    previo.origen = origen
    return previo
  }
  const efecto = { stat: buff.stat, valor: buff.valor, hasta, origen, nombre: NOMBRE_STAT[buff.stat] }
  char.efectos.push(efecto)
  return efecto
}

function efectosActivos(char) {
  if (!char.efectos) return []
  char.efectos = char.efectos.filter(e => e.hasta > now())
  return char.efectos.map(e => ({
    stat: e.stat, nombre: e.nombre, valor: e.valor, origen: e.origen,
    restanteMs: Math.max(0, e.hasta - now()),
  }))
}

// Estadísticas efectivas = base + equipo + efectos temporales
// (calculadas SIEMPRE en el servidor)
function effectiveStats(char) {
  const s = { strength: char.strength, intelligence: char.intelligence, agility: char.agility, defense: char.defense, maxHp: char.maxHp, maxMp: char.maxMp }
  for (const slot of SLOTS) {
    const uid = char.equipment?.[slot]
    if (!uid) continue
    const it = (char.inventory || []).find(i => i.uid === uid)
    const t = it && template(it.itemId)
    if (!t?.stats) continue
    s.strength += t.stats.str || 0
    s.intelligence += t.stats.int || 0
    s.agility += t.stats.agi || 0
    s.defense += t.stats.def || 0
    s.maxHp += t.stats.hp || 0
    s.maxMp += t.stats.mp || 0
  }
  for (const e of efectosActivos(char)) {
    if (s[e.stat] !== undefined) s[e.stat] += e.valor
  }
  return s
}

// ── La vida máxima de VERDAD ───────────────────────────────────────
//
// `char.maxHp` es la vida BASE: la que dan la clase y el nivel, sin
// equipo y sin efectos. Es el número que hay que guardar, porque el
// equipo se quita y se pone.
//
// El problema es que el combate por turnos lo usaba como si fuera el
// tope real. Y no lo es: effectiveStats() suma el `hp` del equipo, y
// hay cinco piezas que lo dan —Peto de Cuero +40, Coraza de Hierro +90,
// Grebas +40, Peto de Cristal +140, Amuleto de Trébol +30— más la
// Torta de Maíz, cuyo ÚNICO efecto es +60 de vida máxima durante diez
// minutos.
//
// Resultado: con peto de cristal y grebas llevabas +180 de vida que la
// arena sí contaba y los turnos no. La barra se llenaba antes de
// tiempo, curarse desperdiciaba media poción y morir te devolvía a la
// mitad de la vida BASE. Craft → equipar → estadísticas funcionaba y se
// rompía en el último eslabón, que es el que se ve jugando.
//
// Estas dos funciones contestan a "¿cuánto aguanta AHORA MISMO?" y
// recalculan cada vez a propósito: beberse una Torta de Maíz en mitad
// del combate tiene que subir el tope en ese mismo turno.
function maxHpDe(char) { return effectiveStats(char).maxHp }
function maxMpDe(char) { return effectiveStats(char).maxMp }

// Y esto para cuando el tope BAJA: al quitarse la coraza, la vida que
// sobra se recorta. Sin esto quedaba un personaje con 1.150 de 970.
function ajustarATope(char) {
  const st = effectiveStats(char)
  if (char.hp > st.maxHp) char.hp = st.maxHp
  if (char.mp > st.maxMp) char.mp = st.maxMp
  return st
}

// ── Cuánto pega y aguanta un jugador POR SER DE SU NIVEL ───────────
//
// Sin contar arma ni armadura: solo la clase y el nivel. Lo usan los
// DOS combates para escalar a los enemigos, y vive aquí —con CLASSES—
// porque es un hecho sobre personajes, no sobre arenas.
//
// EL PROBLEMA QUE RESUELVE, medido con banco-balance.js:
//
//   nv  arma                pega  vida  │ golpes que le das  golpes que aguantas
//    3  Daga de Hierro        50  1300  │        4                   57
//   18  Espada de Diamante   286  2425  │        1                   68
//
// El jugador multiplica por 5,7 lo que pega y solo por 1,9 lo que
// aguanta. Los enemigos subían un 4% por nivel en la arena y un 5% en
// los turnos, así que el juego se hacía MÁS FÁCIL según avanzabas.
//
// POR QUÉ SIN EL EQUIPO: si el enemigo siguiera también al arma, una
// espada mejor no mataría antes —el bicho subiría con ella— y todo el
// progreso del equipo sería decorativo. Siguiendo solo al nivel, subir
// de nivel te mantiene en tu sitio y MEJORAR EL EQUIPO es lo que te
// hace más fuerte. Que es lo que queremos que sienta quien juega.
function referenciaDeNivel(char) {
  const cls = CLASSES[char.class] || CLASSES.Archimago
  const g = cls.growth || {}
  const subidas = Math.max(0, (char.level || 1) - 1)
  return {
    poder: cls.base[cls.primary] + (g[cls.primary] || 0) * subidas,
    vida: cls.base.maxHp + (g.hp || 0) * subidas,
  }
}

// Cuánto hay que subir a un enemigo para ESTE jugador.
//
// La pregunta correcta no es "cuánto ha crecido el jugador desde el
// nivel 1", sino "cuánto le saca al nivel para el que está pensado este
// bicho". La primera versión usaba la de arriba y el resultado fue
// absurdo: un Demonio Abismal de nivel 20 recibía el mismo ×3 que una
// araña de nivel 3, encima de los 1.100 de vida que ya trae su ficha.
// Salían jefes de 8.500 de vida, imposibles de matar. La tabla ya dice
// que un demonio es más duro que una araña; multiplicar otra vez por el
// nivel del jugador lo contaba dos veces.
//
// `nivelBase` es el nivel al que está pensado el enemigo. Si el jugador
// está por debajo, no se toca nada: el bicho vale lo que dice su ficha
// y venir con poco nivel tiene que doler.
//
// La vida del enemigo sigue a lo que el jugador PEGA y su daño a lo que
// el jugador AGUANTA: son dos cosas que crecen a ritmos muy distintos y
// antes compartían un solo multiplicador.
function seguimientoDe(char, escala, nivelBase) {
  const s = (escala && escala.seguimiento) || 0
  const mio = referenciaDeNivel(char)
  const suyo = referenciaDeNivel({ class: char.class, level: Math.max(1, nivelBase || 1) })
  return {
    vida: 1 + Math.max(0, mio.poder / Math.max(1, suyo.poder) - 1) * s,
    daño: 1 + Math.max(0, mio.vida / Math.max(1, suyo.vida) - 1) * s,
  }
}

function checkLevelUp(char) {
  const events = []
  const g = (CLASSES[char.class] || CLASSES.Archimago).growth
  let guard = 0
  while (char.xp >= char.xpToNext && guard++ < 200) {
    char.xp -= char.xpToNext
    char.level += 1
    char.xpToNext = xpForLevel(char.level)
    char.maxHp += g.hp; char.maxMp += g.mp
    // Subir de nivel cura, pero no del todo: si no, el daño nunca se
    // acumula entre combates y las pociones no sirven para nada.
    // La mitad del tope REAL, con el equipo puesto: si no, subir de
    // nivel llevando una coraza buena curaba proporcionalmente menos.
    const tope = effectiveStats(char)
    char.hp = Math.min(tope.maxHp, char.hp + Math.floor(tope.maxHp * 0.5))
    char.mp = Math.min(tope.maxMp, char.mp + Math.floor(tope.maxMp * 0.5))
    char.strength += g.strength; char.intelligence += g.intelligence
    char.agility += g.agility; char.defense += g.defense
    events.push({ level: char.level, maxHp: tope.maxHp, maxMp: tope.maxMp })
  }
  return events
}

// Los dos puntos de paso por los que entra y sale TODO objeto del juego.
//
// Por eso son también el único sitio donde se puede contar cuántos
// objetos se crean y se destruyen sin que se escape ninguno. Contarlo en
// cada sitio que reparte botín sería contar quince veces y olvidarse de
// la decimosexta.
//
// `motivo` dice de dónde viene o a dónde va, y sirve para dos cosas: ver
// qué grifo está abierto de más, y distinguir lo que de verdad se crea
// de lo que solo CAMBIA DE MANOS. Comprar en el mercado no crea nada: el
// objeto sale del escrow del vendedor y entra en la mochila del
// comprador. Si eso contara como creación, el mercado parecería una
// fábrica de objetos y las cifras mentirían justo donde más se miran.
function addItem(char, itemId, quantity = 1, motivo = 'otro') {
  const t = template(itemId)
  if (!t) return null
  const stackable = ['MATERIAL', 'POTION', 'FOOD', 'SEED'].includes(t.type)
  let dado = null
  if (stackable) {
    const ex = char.inventory.find(i => i.itemId === itemId && !char.equipment?.[i.uid])
    if (ex) { ex.quantity += quantity; dado = ex }
  }
  if (!dado) {
    if (char.inventory.length >= 120) return null   // límite de mochila
    dado = makeItem(itemId, quantity)
    char.inventory.push(dado)
  }
  // Solo se cuenta lo que de verdad entró: si la mochila estaba llena,
  // arriba ya se devolvió null y aquí no se llega.
  if (typeof trackItems === 'function') trackItems('creado', itemId, quantity, motivo)
  return dado
}
function removeItem(char, itemId, quantity, motivo = 'otro') {
  let left = quantity
  for (const it of [...char.inventory]) {
    if (it.itemId !== itemId) continue
    if (isEquipped(char, it.uid)) continue
    const take = Math.min(it.quantity, left)
    it.quantity -= take; left -= take
    if (it.quantity <= 0) char.inventory = char.inventory.filter(i => i.uid !== it.uid)
    if (left <= 0) break
  }
  // Se cuenta lo que se quitó de verdad, no lo que se pidió quitar.
  const quitado = quantity - left
  if (quitado > 0 && typeof trackItems === 'function') trackItems('destruido', itemId, quitado, motivo)
  return left <= 0
}
function countItem(char, itemId) {
  return char.inventory.filter(i => i.itemId === itemId && !isEquipped(char, i.uid)).reduce((a, i) => a + i.quantity, 0)
}
function isEquipped(char, uid) {
  return Object.values(char.equipment || {}).includes(uid)
}

function rollLoot(monsterId, rng = Math.random) {
  const table = LOOT_TABLES[monsterId] || []
  const out = []
  for (const entry of table) {
    if (rng() * 100 < entry.w) out.push({ itemId: entry.id, quantity: randInt(entry.q[0], entry.q[1]) })
  }
  return out
}

// ── Progreso de misión: SOLO por eventos generados en el servidor ──
function emitProgress(char, key, amount = 1) {
  char.questCounters = char.questCounters || {}
  char.questCounters[key] = (char.questCounters[key] || 0) + amount
  const updated = []
  for (const aq of char.activeQuests || []) {
    const q = QUESTS.find(x => x.id === aq.questId)
    if (!q) continue
    for (const obj of q.objectives) {
      if (obj.key !== key) continue
      const prog = aq.objectiveProgress.find(p => p.objectiveId === obj.id)
      if (!prog) continue
      if (prog.current < obj.required) {
        prog.current = Math.min(obj.required, prog.current + amount)
        updated.push({ questId: q.id, objectiveId: obj.id, current: prog.current, required: obj.required })
      }
    }
  }
  return updated
}

// ═══════════════════════════════════════════════════════════════════
//  MOTOR DE COMBATE — BattleSession (autoridad total del servidor)
// ═══════════════════════════════════════════════════════════════════
const ACTION_MIN_INTERVAL_MS = 350   // anti-bot / anti-macro básico

// ── Las escalas del combate por turnos ─────────────────────────────
//
// El gemelo de ESCALA_ARENA, y aparte a propósito: aquí se pega una vez
// por turno y allí sin parar, así que los dos combates necesitan sus
// propios números aunque compartan las tablas de bichos.
//
// LO QUE ARREGLA, medido: el Dragón Menor —un JEFE— moría en 3 turnos y
// el Demonio Abismal en 3. Nadie perdía nunca. Y como el enemigo avisa
// de un golpe fuerte cada 3 turnos y los jefes cambian de fase al 50%
// de vida, esas dos mecánicas estaban escritas, probadas… y no se veían
// JAMÁS: la pelea se acababa antes de que llegaran. Igual que pasaba
// con el Golpe de Escudo en el paso 9.
//
//   node banco-balance.js --turnos     comprueba cómo quedó
// Los valores salen del barrido de banco-balance.js. Antes no existían:
// la vida era m.hp + 5% por nivel de ventaja y el daño iba tal cual.
const ESCALA_TURNOS = { vida: 1.6, daño: 1.4, seguimiento: 1 }

function startBattle(char, monsterId) {
  const m = MONSTERS[monsterId]
  if (!m) return null
  const seg = seguimientoDe(char, ESCALA_TURNOS, m.level)
  const battle = {
    id: nextId('btl'), owner: char.id, monsterId,
    // Antes: m.hp + 5% por cada nivel de ventaja. Ese 5% no seguía el
    // ritmo al que crece el jugador ni de lejos.
    enemyMaxHp: Math.round(m.hp * ESCALA_TURNOS.vida * seg.vida),
    // Cuánto pega este bicho a ESTE jugador. Se guarda en la batalla
    // para no recalcularlo en cada turno y para que no cambie a mitad
    // de pelea si el jugador sube de nivel.
    escalaDaño: ESCALA_TURNOS.daño * seg.daño,
    enemyHp: 0, turn: 0, state: 'ACTIVE',
    seed: crypto.randomBytes(8).toString('hex'),
    buffs: [], dots: [], lastActionAt: 0,
    phase: 1, combo: 0, telegraph: null, enemyTurn: 0, blocking: false,
    startedAt: now(), updatedAt: now(),
  }
  battle.enemyHp = battle.enemyMaxHp
  store.battles[battle.id] = battle
  return battle
}
// Las batallas guardadas antes de que existiera `escalaDaño` no lo
// traen. Sin este respaldo, una partida a medias se quedaba con un
// enemigo que pegaba NaN y le quitaba toda la vida al jugador de golpe.
function escalaDaño(battle) {
  return battle && Number.isFinite(battle.escalaDaño) ? battle.escalaDaño : 1
}

function findBattle(char, battleId, monsterId) {
  if (battleId && store.battles[battleId] && store.battles[battleId].owner === char.id) return store.battles[battleId]
  return Object.values(store.battles).find(b => b.owner === char.id && b.monsterId === monsterId && b.state === 'ACTIVE') || null
}

function combatAction(char, battle, action, skillId, itemId) {
  const m = MONSTERS[battle.monsterId]
  const st = effectiveStats(char)
  const t = now()
  if (t - battle.lastActionAt < ACTION_MIN_INTERVAL_MS) return { error: 'Demasiado rápido', code: 429 }
  battle.lastActionAt = t
  battle.turn += 1
  battle.updatedAt = t

  // El guion del turno. Las reglas de abajo no cambian: solo se anota
  // lo que van haciendo, en orden, para que la pantalla pueda
  // reproducirlo en vez de pintarlo todo de golpe.
  const g = nuevoGuion()
  if (battle.turn === 1) {
    g.anota('BATTLE_START', {
      enemigo: { id: m.id, nombre: m.name, icono: m.icon, nivel: m.level, esJefe: !!m.isBoss },
      hpEnemigo: battle.enemyHp, hpEnemigoMax: battle.enemyMaxHp,
      hpJugador: char.hp, hpJugadorMax: st.maxHp,
    })
  }
  g.anota('PLAYER_TURN', { turno: battle.turn, combo: battle.combo })
  g.anota('PLAYER_ACTION', { accion: action, skillId: skillId || null, itemId: itemId || null })

  const log = []
  let playerDmg = 0, playerHeal = 0, crit = false, miss = false, element = 'physical'
  const atkBuff = battle.buffs.filter(b => b.atk).reduce((a, b) => a + b.atk, 0)
  const defBuff = battle.buffs.filter(b => b.def).reduce((a, b) => a + b.def, 0)
  const evaBuff = battle.buffs.filter(b => b.eva).reduce((a, b) => a + b.eva, 0)

  if (action === 'flee') {
    const chance = 0.4 + Math.min(0.4, st.agility / 200)
    if (Math.random() < chance) {
      battle.state = 'FLED'
      g.anota('PLAYER_ANIMATION', { anim: 'huir', exito: true })
      g.anota('BATTLE_END', { motivo: 'huida' })
      return { fled: true, battle, log: ['Escapaste del combate'], guion: g.fases, duracion: g.total() }
    }
    g.anota('PLAYER_ANIMATION', { anim: 'huir', exito: false })
    log.push('¡No lograste huir!')
  } else if (action === 'attack') {
    const critChance = 0.08 + Math.min(0.25, st.agility / 300)
    crit = Math.random() < critChance
    miss = Math.random() < 0.05
    if (!miss) {
      // El ataque básico escala con la estadística principal de la clase
      const primary = (CLASSES[char.class] || CLASSES.Archimago).primary || 'strength'
      const main = st[primary]
      const base = randInt(Math.floor(main * 1.6), Math.floor(main * 2.3)) + char.level * 4
      playerDmg = Math.max(1, Math.floor((base * (1 + atkBuff)) - m.def * 0.6))
      if (crit) playerDmg = Math.floor(playerDmg * 1.8)
    } else log.push('¡Fallaste!')
    g.anota('PLAYER_ANIMATION', { anim: 'atacar', arma: (typeof armaDe === 'function' ? armaDe(char).nombre : null), fallo: miss, crit })
  } else if (action === 'magic' || action === 'skill') {
    // Solo las que el personaje SABE.
    //
    // Antes bastaba con que la habilidad existiera en el catálogo:
    // `SKILLS[skillId] ? skillId : ...`. Un Guerrero podía lanzar Bola
    // de Fuego mandando el id a mano, y con ella el daño de un mago
    // escalado por SU inteligencia. Existía desde siempre; al añadir el
    // selector de habilidades solo lo dejé a la vista.
    const sabe = (char.skills && char.skills.length)
      ? char.skills
      : ((CLASSES[char.class] || CLASSES.Archimago).skills || [])
    const sid = (skillId && sabe.includes(skillId) && SKILLS[skillId])
      ? skillId
      : sabe.find(s => SKILLS[s] && SKILLS[s].power > 0) || sabe[0]
    if (!sid || !SKILLS[sid]) return { error: 'No conoces esa habilidad', code: 400 }
    const sk = SKILLS[sid]
    const cdUntil = char.cooldowns?.[sid] || 0
    if (t < cdUntil) return { error: `${sk.name} en enfriamiento`, code: 400 }
    if (char.mp < sk.cost) return { error: 'Maná insuficiente', code: 400 }
    char.mp -= sk.cost
    char.cooldowns = char.cooldowns || {}
    char.cooldowns[sid] = t + sk.cooldownMs
    element = sk.element || 'physical'
    if (sk.buff) {
      battle.buffs.push({ ...sk.buff, turns: sk.buff.turns })
      log.push(`${sk.name} activado`)
    }
    if (sk.dot) battle.dots.push({ dmg: Math.floor(st[sk.scale] * sk.dot.dmg), turns: sk.dot.turns })
    if (sk.power > 0) {
      crit = Math.random() < (0.08 + (sk.critBonus || 0) + Math.min(0.2, st.agility / 350))
      const base = randInt(Math.floor(st[sk.scale] * sk.power), Math.floor(st[sk.scale] * (sk.power + 0.6))) + char.level * 4
      playerDmg = Math.max(1, Math.floor(base * (1 + atkBuff) * elementMult(element, m.element) - m.def * 0.4))
      if (crit) playerDmg = Math.floor(playerDmg * 1.7)
    }
    g.anota('PLAYER_ANIMATION', { anim: 'habilidad', habilidad: sk.name, elemento: element, crit, ms: 520 })
  } else if (action === 'block') {
    battle.blocking = true
    char.mp = Math.min(st.maxMp, char.mp + Math.floor(st.maxMp * 0.1))
    battle.combo = 0
    g.anota('PLAYER_ANIMATION', { anim: 'defender' })
    log.push('Te preparas para bloquear')
  } else if (action === 'heal' || action === 'objeto') {
    // Antes esto buscaba literalmente `potion_hp`, la Poción de
    // Curación I. El juego tiene once pociones, una escalera de
    // curación de seis escalones y comida con efectos, y nada de eso se
    // podía usar peleando: llevabas el Elixir Mítico en la mochila y
    // bebías la poción más floja porque era la única que el combate
    // sabía reconocer.
    //
    // Ahora vale cualquier objeto que cure, dé maná o deje un efecto, y
    // si no se dice cuál se coge la mejor curación que se tenga. Sigue
    // validándose aquí, en el servidor: pedir un objeto que no está en
    // el inventario no lo crea.
    let usar = itemId
    if (!usar) {
      const candidatos = (char.inventory || [])
        .filter(i => i.quantity > 0 && usableEnCombate(i.itemId) && usableEnCombate(i.itemId).heal)
        .sort((a, b) => usableEnCombate(a.itemId).heal - usableEnCombate(b.itemId).heal)
      // La que menos cure de las que sirvan: no se gasta el elixir en un
      // rasguño. Si ninguna llega, se usa la más fuerte que haya.
      const falta = st.maxHp - char.hp
      usar = (candidatos.find(i => usableEnCombate(i.itemId).heal >= falta) ||
              candidatos[candidatos.length - 1] || {}).itemId
    }
    const plantilla = usar && usableEnCombate(usar)
    if (!plantilla) return { error: 'Ese objeto no se puede usar en combate', code: 400 }
    const tengo = (char.inventory || []).find(i => i.itemId === usar && i.quantity > 0)
    if (!tengo) return { error: 'No tienes ese objeto', code: 400 }
    removeItem(char, usar, 1, 'consumo')
    playerHeal = plantilla.heal || 0
    if (plantilla.mana) char.mp = Math.min(maxMpDe(char), char.mp + plantilla.mana)
    if (plantilla.buff && typeof aplicarEfecto === 'function') aplicarEfecto(char, plantilla.buff)
    g.anota('PLAYER_ANIMATION', {
      anim: 'objeto', itemId: usar, nombre: plantilla.name, icono: plantilla.icon,
      imagen: plantilla.imagen || null, cura: playerHeal, mana: plantilla.mana || 0,
    })
    log.push('Usaste ' + plantilla.name)
  } else {
    return { error: 'Acción inválida', code: 400 }
  }

  // Combo: golpes encadenados suben el daño hasta +25 %
  if (playerDmg > 0 && !miss) {
    battle.combo = Math.min(5, battle.combo + 1)
    playerDmg = Math.floor(playerDmg * (1 + 0.05 * (battle.combo - 1)))
    if (battle.combo >= 3) log.push(`¡Combo ×${battle.combo}!`)
  } else if (miss || action === 'heal') battle.combo = 0

  // Interrupción: un aturdimiento cancela el ataque telegrafiado
  const usedStun = action !== 'attack' && SKILLS[skillId]?.stun
  if (usedStun && battle.telegraph) { log.push(`¡Interrumpiste ${battle.telegraph.name}!`); battle.telegraph = null }

  // Daño por veneno/DOT
  let dañoVeneno = 0
  for (const d of battle.dots) { if (d.turns > 0) { battle.enemyHp -= d.dmg; dañoVeneno += d.dmg; d.turns--; log.push(`Veneno: ${d.dmg}`) } }
  battle.dots = battle.dots.filter(d => d.turns > 0)

  // El golpe del jugador, ya resuelto: cuánto, si fue crítico y con qué
  // elemento. Va antes que los venenos en el guion porque es lo que el
  // jugador acaba de hacer, aunque en el cálculo el orden dé igual.
  if (playerDmg > 0 || playerHeal > 0 || miss) {
    g.anota('STATUS_EFFECTS', {
      a: 'enemigo', dmg: playerDmg, crit, miss, elemento: element,
      cura: playerHeal, combo: battle.combo,
      hpEnemigo: Math.max(0, battle.enemyHp - playerDmg), hpEnemigoMax: battle.enemyMaxHp,
    })
  }
  if (dañoVeneno > 0) {
    g.anota('STATUS_EFFECTS', { a: 'enemigo', dmg: dañoVeneno, veneno: true, elemento: 'nature' })
  }

  battle.enemyHp = Math.max(0, battle.enemyHp - playerDmg)

  // Respuesta del enemigo
  let enemyDmg = 0
  let incoming = null
  // ¿El golpe de este turno fue el ataque anunciado? Lo necesita el
  // guion para que la pantalla lo pinte distinto de un zarpazo normal.
  let golpePesado = null
  if (battle.enemyHp > 0 && battle.state === 'ACTIVE') {
    battle.enemyTurn += 1
    g.anota('ENEMY_TURN', { nombre: m.name, icono: m.icon, hp: battle.enemyHp, hpMax: battle.enemyMaxHp })

    // Fases de jefe: al 50 % de vida cambia de comportamiento
    if (m.isBoss && battle.phase === 1 && battle.enemyHp <= battle.enemyMaxHp * 0.5) {
      battle.phase = 2
      log.push(`¡${m.name} entra en su segunda fase!`)
    }
    const phaseMult = battle.phase === 2 ? 1.3 : 1

    const dodge = Math.random() < Math.min(0.35, st.agility / 400 + evaBuff)
    if (battle.telegraph) {
      // El ataque anunciado se resuelve ahora
      const raw = (randInt(m.atk[0], m.atk[1]) + m.level * 2) * battle.telegraph.mult * phaseMult * escalaDaño(battle)
      let dmg = Math.max(1, Math.floor(raw * (1 - Math.min(0.7, (st.defense * (1 + defBuff)) / 250))))
      if (battle.blocking) { dmg = Math.floor(dmg * 0.3); log.push(`¡Bloqueaste ${battle.telegraph.name}!`) }
      else {
        // Comerse el ataque anunciado también rompe el ritmo: se pierde
        // el combo y parte del maná. Bloquear o interrumpir compensa.
        log.push(`¡${battle.telegraph.name} te golpea de lleno!`)
        battle.combo = 0
        char.mp = Math.max(0, char.mp - Math.floor(st.maxMp * 0.2))
      }
      enemyDmg = dodge ? 0 : dmg
      if (dodge) log.push('¡Esquivaste el ataque pesado!')
      golpePesado = battle.telegraph.name
      battle.telegraph = null
    } else if (!dodge) {
      const raw = (randInt(m.atk[0], m.atk[1]) + m.level * 2) * phaseMult * escalaDaño(battle)
      enemyDmg = Math.max(1, Math.floor(raw * (1 - Math.min(0.7, (st.defense * (1 + defBuff)) / 250))))
    } else log.push('¡Esquivaste el ataque!')

    // Telegrafía: cada 3 turnos (2 en fase de jefe) anuncia un ataque fuerte
    const cadence = battle.phase === 2 ? 2 : 3
    if (!battle.telegraph && battle.enemyTurn % cadence === 0) {
      const names = { fire: 'Aliento Ardiente', ice: 'Ventisca', dark: 'Zarpazo Sombrío', earth: 'Puño de Roca', nature: 'Enjambre Tóxico', lightning: 'Descarga' }
      battle.telegraph = { name: names[m.element] || 'Golpe Devastador', mult: m.isBoss ? 3.2 : 2.6, turns: 1 }
      incoming = battle.telegraph
      log.push(`⚠️ ${m.name} prepara ${battle.telegraph.name} — bloquea o interrumpe`)
    }
    g.anota('ENEMY_ACTION', {
      dmg: enemyDmg, esquivado: dodge, bloqueado: !!battle.blocking && enemyDmg > 0,
      pesado: golpePesado, fase: battle.phase,
      avisa: incoming ? { nombre: incoming.name, mult: incoming.mult } : null,
      hpJugador: Math.max(0, char.hp + playerHeal - enemyDmg), hpJugadorMax: maxHpDe(char),
    })
    battle.blocking = false
  }

  // El tope se vuelve a preguntar AQUÍ en vez de reutilizar el `st` del
  // principio del turno: si el jugador acaba de beberse una Torta de
  // Maíz, su vida máxima ya ha subido y la curación tiene que contarlo.
  char.hp = Math.max(0, Math.min(maxHpDe(char), char.hp + playerHeal - enemyDmg))
  battle.buffs = battle.buffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0)

  // Los campos planos de siempre se quedan: la pantalla actual los usa
  // y romperla no era el encargo. El guion se añade al lado; el paso 8
  // cambiará la pantalla para reproducirlo.
  const out = { playerDmg, enemyDmg, playerHeal, crit, miss, element, log, battle, combo: battle.combo, phase: battle.phase, telegraph: incoming || battle.telegraph }

  g.anota('CHECK_VICTORY', {
    hpJugador: char.hp, hpJugadorMax: maxHpDe(char),
    hpEnemigo: battle.enemyHp, hpEnemigoMax: battle.enemyMaxHp,
    vivos: battle.enemyHp > 0 && char.hp > 0,
  })

  if (battle.enemyHp <= 0) {
    battle.state = 'WON'
    const gold = randInt(m.gold[0], m.gold[1])
    const xp = m.xp
    char.gold += gold
    char.xp += xp
    char.monstersKilled += 1
    if (m.isBoss) char.bossesKilled += 1
    const loot = rollLoot(battle.monsterId)
    const questUpdates = []
    for (const l of loot) {
      addItem(char, l.itemId, l.quantity, 'botin')
      // Las misiones de recolección avanzan con el botín real
      questUpdates.push(...emitProgress(char, `gather_${l.itemId}`, l.quantity))
    }
    questUpdates.push(...emitProgress(char, m.questKey || `kill_${battle.monsterId}`, 1))
    trackCurrency(char.name, 'gold', gold, 'combat_win')
    track('kill', char.name, { kill: true })
    step(char.name, 'first_kill')
    // CGRID solo en jefes y con tope diario
    const cgrid = m.isBoss ? creditCgrid(char, 1, `boss_kill:${m.id}`) : 0
    out.enemyDied = true
    // `imagen` viaja junto al icono: quien sepa pintarla la pinta y
    // quien no, se queda con el emoji. Un objeto sin dibujo manda null
    // y nadie se rompe.
    out.rewards = { gold, xp, cgrid, loot: loot.map(l => ({ ...l, name: template(l.itemId).name, icon: template(l.itemId).icon, imagen: template(l.itemId).imagen || null, rarity: template(l.itemId).rarity })) }
    out.levelUps = checkLevelUp(char)
    for (const lu of out.levelUps) {
      if (lu.level === 2) step(char.name, 'level_2')
      if (lu.level === 5) step(char.name, 'level_5')
      if (lu.level === 10) step(char.name, 'level_10')
    }
    out.questUpdates = questUpdates
    audit('combat_win', char.name, { monster: m.id, gold, xp, cgrid })
    g.anota('BATTLE_END', { motivo: 'victoria', oro: gold, xp, cgrid,
      botin: out.rewards.loot, subidas: out.levelUps, nivel: char.level })
    delete store.battles[battle.id]
  } else if (char.hp <= 0) {
    battle.state = 'LOST'
    const lost = Math.floor(char.gold * ECONOMY.DEATH_GOLD_PENALTY)
    char.gold = Math.max(0, char.gold - lost)
    store.economy.goldBurned += lost
    trackCurrency(char.name, 'gold', -lost, 'death_penalty')
    track('player_death', char.name)
    char.muertes = (char.muertes || 0) + 1
    char.hp = Math.floor(maxHpDe(char) * 0.5)
    out.playerDied = true
    out.goldLost = lost
    audit('combat_loss', char.name, { monster: m.id, goldLost: lost })
    g.anota('BATTLE_END', { motivo: 'derrota', oroPerdido: lost, hpJugador: char.hp })
    delete store.battles[battle.id]
  }
  out.guion = g.fases
  out.duracion = g.total()
  persist()
  return out
}
