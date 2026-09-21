
// ═══════════════════════════════════════════════════════════════════
//  RECURSOS DEL MUNDO — talar, picar y herramientas
//
//  QUÉ RESUELVE
//  Antes, para conseguir madera había que ir al bosque, abrir la barra
//  del huerto y pulsar "reclamar". El recurso aparecía de la nada. Aquí
//  hay un árbol con vida, un hacha equipada y golpes que se la quitan.
//  Cuando cae, la madera entra al inventario de verdad (§7).
//
//  DÓNDE VIVE LA VERDAD
//  Toda en el servidor. El cliente solo dice "golpeo este nodo"; el
//  daño, la vida restante, el botín y el desgaste de la herramienta se
//  calculan aquí. Mandar mil peticiones no hace caer más madera: el
//  nodo tiene la vida que tiene y luego tarda en reaparecer.
//
//  EL HUERTO ANTIGUO NO SE TOCA (§7)
//  Sigue funcionando exactamente igual, en paralelo. Este sistema es
//  otra forma de conseguir materiales, no su sustituto.
//
//  QUÉ AÑADE
//   §8  seis maderas por rareza
//   §9  siete minerales con progresión
//   §10 picos y hachas fabricados con mango + cabeza, donde las
//       estadísticas SALEN de los materiales usados
//   §11 rareza funcional: mejor material, mejores números
//   §4  ranura de herramienta propia, aparte del arma
// ═══════════════════════════════════════════════════════════════════

// El pico y el hacha no ocupan la mano del arma: se llevan a la vez.
if (!SLOTS.includes('tool')) SLOTS.push('tool')

// ── §8 MADERAS ─────────────────────────────────────────────────────
// Cada una sube de rareza y de valor. La dureza es cuánto cuesta
// sacarla del árbol, no un adorno.
const MADERAS = {
  wood:         { name: 'Madera Común',      icon: '🪵', rarity: 'COMMON',    value: 4,    dureza: 1 },
  wood_roble:   { name: 'Madera de Roble',   icon: '🌰', rarity: 'UNCOMMON',  value: 18,   dureza: 2 },
  wood_ceniza:  { name: 'Madera de Ceniza',  icon: '🌲', rarity: 'RARE',      value: 70,   dureza: 3 },
  wood_sombra:  { name: 'Madera de Sombra',  icon: '🌑', rarity: 'EPIC',      value: 260,  dureza: 4 },
  wood_alba:    { name: 'Madera del Alba',   icon: '🌟', rarity: 'LEGENDARY', value: 900,  dureza: 5 },
  wood_savia:   { name: 'Corazón de Savia',  icon: '💫', rarity: 'MYTHIC',    value: 3200, dureza: 6 },
}

// ── §9 MINERALES ───────────────────────────────────────────────────
const MINERALES = {
  stone:       { name: 'Piedra',            icon: '🪨', rarity: 'COMMON',    value: 2,    dureza: 1 },
  coal:        { name: 'Carbón',            icon: '⚫', rarity: 'COMMON',    value: 8,    dureza: 1 },
  copper_ore:  { name: 'Mineral de Cobre',  icon: '🟠', rarity: 'UNCOMMON',  value: 24,   dureza: 2 },
  // iron_ore ya existía: se respeta su id para no romper inventarios
  silver_ore:  { name: 'Mineral de Plata',  icon: '⚪', rarity: 'RARE',      value: 110,  dureza: 4 },
  gold_ore:    { name: 'Mineral de Oro',    icon: '🟡', rarity: 'EPIC',      value: 380,  dureza: 5 },
  mithril_ore: { name: 'Mithril en Bruto',  icon: '🔷', rarity: 'LEGENDARY', value: 1400, dureza: 6 },
}

for (const [id, m] of Object.entries(MADERAS)) {
  if (ITEM_TEMPLATES[id]) continue          // 'wood' ya existe: no se pisa
  ITEM_TEMPLATES[id] = { name: m.name, icon: m.icon, type: 'MATERIAL', rarity: m.rarity, value: m.value, tradeable: true }
}
for (const [id, m] of Object.entries(MINERALES)) {
  if (ITEM_TEMPLATES[id]) continue
  ITEM_TEMPLATES[id] = { name: m.name, icon: m.icon, type: 'MATERIAL', rarity: m.rarity, value: m.value, tradeable: true }
}

// ── §10 PIEZAS DE HERRAMIENTA ──────────────────────────────────────
// Un pico es un mango más una cabeza. Cambiar cualquiera de las dos
// cambia el resultado: ese es el objetivo del apartado 10.
const MANGOS = {
  mango_madera: { nombre: 'de madera',  poderMult: 1.00, durMult: 1.0, grado: 0, material: 'wood',        icon: '🪵' },
  mango_roble:  { nombre: 'de roble',   poderMult: 1.20, durMult: 1.6, grado: 1, material: 'wood_roble',  icon: '🌰' },
  mango_ceniza: { nombre: 'de ceniza',  poderMult: 1.45, durMult: 2.4, grado: 2, material: 'wood_ceniza', icon: '🌲' },
}
const CABEZAS = {
  cabeza_piedra: { nombre: 'Piedra', poder: 5,  nivel: 1, grado: 0, material: 'stone',      cantidad: 4, icon: '🪨' },
  cabeza_cobre:  { nombre: 'Cobre',  poder: 9,  nivel: 2, grado: 1, material: 'copper_ore', cantidad: 3, icon: '🟠' },
  cabeza_hierro: { nombre: 'Hierro', poder: 14, nivel: 3, grado: 2, material: 'iron_ore',   cantidad: 3, icon: '⚙️' },
  cabeza_plata:  { nombre: 'Plata',  poder: 21, nivel: 4, grado: 3, material: 'silver_ore', cantidad: 3, icon: '⚪' },
}

// Las piezas son objetos normales del inventario, fabricables con el
// sistema de recetas que ya existía. No hace falta un motor nuevo.
for (const [id, m] of Object.entries(MANGOS)) {
  ITEM_TEMPLATES[id] = {
    name: 'Mango ' + m.nombre, icon: m.icon, type: 'MATERIAL',
    rarity: RARITIES[m.grado], value: 20 * (m.grado + 1), tradeable: true,
  }
  RECIPES.push({
    id: 'rec_' + id, name: 'Mango ' + m.nombre, category: 'forge', station: 'forge',
    levelReq: 1, outputItemId: id, outputQty: 1, successRate: 1,
    ingredients: [{ itemId: m.material, quantity: 2 }], xp: 10, questKey: 'craft_' + id,
  })
}
for (const [id, c] of Object.entries(CABEZAS)) {
  ITEM_TEMPLATES[id] = {
    name: 'Cabeza de ' + c.nombre, icon: c.icon, type: 'MATERIAL',
    rarity: RARITIES[c.grado], value: 45 * (c.grado + 1), tradeable: true,
  }
  RECIPES.push({
    id: 'rec_' + id, name: 'Cabeza de ' + c.nombre, category: 'forge', station: 'forge',
    levelReq: 1, outputItemId: id, outputQty: 1, successRate: 1,
    ingredients: [{ itemId: c.material, quantity: c.cantidad }], xp: 14, questKey: 'craft_' + id,
  })
}

// ── §10 HERRAMIENTAS GENERADAS ─────────────────────────────────────
// Doce picos y doce hachas salen de combinar 3 mangos × 4 cabezas.
// Las estadísticas NO están escritas a mano: se calculan. Añadir un
// mango nuevo crea automáticamente cuatro herramientas más.
const HERRAMIENTAS = {}
const FORJA = {}   // 'pico|mango|cabeza' → itemId

for (const tipo of ['pico', 'hacha']) {
  const etiqueta = tipo === 'pico' ? 'Pico' : 'Hacha'
  for (const [mid, m] of Object.entries(MANGOS)) {
    for (const [cid, c] of Object.entries(CABEZAS)) {
      const itemId = `${tipo}_${mid.replace('mango_', '')}_${cid.replace('cabeza_', '')}`
      const poder = Math.round(c.poder * m.poderMult)
      const durabilidad = Math.round((60 + c.nivel * 40) * m.durMult)
      const grado = Math.min(RARITIES.length - 1, m.grado + c.grado)
      HERRAMIENTAS[itemId] = { tipo, poder, nivel: c.nivel, durabilidad }
      ITEM_TEMPLATES[itemId] = {
        name: `${etiqueta} de ${c.nombre} ${m.nombre}`,
        icon: tipo === 'pico' ? '⛏️' : '🪓',
        type: 'TOOL', rarity: RARITIES[grado],
        value: Math.round((c.poder * 18 + durabilidad) * (1 + m.grado * 0.4)),
        tradeable: true, slot: 'tool',
        // El mango también pega un poco: una herramienta buena sirve
        // de arma de emergencia.
        stats: { str: Math.round(poder * 0.4) },
        herramienta: { tipo, poder, nivel: c.nivel, durabilidad },
      }
      FORJA[`${tipo}|${mid}|${cid}`] = itemId
      RECIPES.push({
        id: `rec_${itemId}`, name: ITEM_TEMPLATES[itemId].name,
        category: 'forge', station: 'forge', levelReq: 1,
        outputItemId: itemId, outputQty: 1, successRate: 1,
        ingredients: [{ itemId: mid, quantity: 1 }, { itemId: cid, quantity: 1 }],
        xp: 30 + grado * 20, questKey: 'craft_herramienta',
      })
    }
  }
}

// ── NODOS_RECURSO DEL MUNDO ────────────────────────────────────────────────
// Cada tipo dice qué herramienta hace falta, cuánta vida tiene y qué
// suelta. La progresión está aquí: sin un pico decente no se saca
// plata, por mucho que se insista.
// Las espadas cierran el bucle del §17: se pican los minerales, se
// forja el mango, y de ahí sale el arma. Cuanto mejor la espada, más
// adentro hay que meterse para conseguir los materiales.
RECIPES.push(
  { id: 'rec_espada_piedra', name: 'Espada de Piedra', category: 'forge', station: 'forge',
    levelReq: 1, outputItemId: 'espada_piedra', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'stone', quantity: 5 }, { itemId: 'mango_madera', quantity: 1 }],
    xp: 40, questKey: 'craft_espada' },
  { id: 'rec_espada_hierro', name: 'Espada de Hierro', category: 'forge', station: 'forge',
    levelReq: 4, outputItemId: 'espada_hierro', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'iron_ore', quantity: 5 }, { itemId: 'mango_roble', quantity: 1 }],
    xp: 120, questKey: 'craft_espada' },
  { id: 'rec_espada_diamante', name: 'Espada de Diamante', category: 'forge', station: 'forge',
    levelReq: 10, outputItemId: 'espada_diamante', outputQty: 1, successRate: 1,
    ingredients: [{ itemId: 'crystal', quantity: 3 }, { itemId: 'gold_ore', quantity: 2 }, { itemId: 'mango_ceniza', quantity: 1 }],
    xp: 400, questKey: 'craft_espada' },
)

const TIPOS_RECURSO = {
  arbol_joven:  { nombre: 'Roble joven',      icono: '🌳', util: 'hacha', nivel: 1, vida: 30,  zona: 'forest', xp: 6,
    suelta: [['wood', 2, 4, 1], ['wood_roble', 1, 1, 0.2]], reapareceMs: 45_000 },
  arbol_viejo:  { nombre: 'Roble centenario', icono: '🌲', util: 'hacha', nivel: 2, vida: 70,  zona: 'forest', xp: 14,
    suelta: [['wood', 3, 5, 1], ['wood_roble', 1, 3, 0.7], ['wood_ceniza', 1, 1, 0.15]], reapareceMs: 90_000 },
  arbol_sombrio:{ nombre: 'Fresno sombrío',   icono: '🌑', util: 'hacha', nivel: 3, vida: 130, zona: 'ruins',  xp: 40,
    suelta: [['wood_ceniza', 2, 4, 1], ['wood_sombra', 1, 2, 0.5], ['wood_alba', 1, 1, 0.08]], reapareceMs: 150_000 },

  roca_piedra:  { nombre: 'Afloramiento',     icono: '🪨', util: 'pico', nivel: 1, vida: 40,  zona: 'forest', xp: 7,
    suelta: [['stone', 2, 5, 1], ['coal', 1, 2, 0.35]], reapareceMs: 45_000 },
  veta_cobre:   { nombre: 'Veta de cobre',    icono: '🟠', util: 'pico', nivel: 2, vida: 80,  zona: 'mines',  xp: 18,
    suelta: [['stone', 1, 3, 1], ['copper_ore', 2, 4, 0.9], ['coal', 1, 2, 0.4]], reapareceMs: 90_000 },
  veta_hierro:  { nombre: 'Veta de hierro',   icono: '⚙️', util: 'pico', nivel: 3, vida: 140, zona: 'mines',  xp: 34,
    suelta: [['iron_ore', 2, 4, 1], ['coal', 1, 3, 0.5], ['silver_ore', 1, 1, 0.12]], reapareceMs: 120_000 },
  veta_plata:   { nombre: 'Filón de plata',   icono: '⚪', util: 'pico', nivel: 4, vida: 220, zona: 'mines',  xp: 70,
    suelta: [['silver_ore', 2, 3, 1], ['gold_ore', 1, 1, 0.25]], reapareceMs: 180_000 },
  veta_dorada:  { nombre: 'Filón dorado',     icono: '🟡', util: 'pico', nivel: 4, vida: 320, zona: 'ruins',  xp: 130,
    suelta: [['gold_ore', 1, 3, 1], ['mithril_ore', 1, 1, 0.1]], reapareceMs: 240_000 },
}

// Instancias colocadas en el mundo. Se generan por zona para que haya
// varios de cada cosa y no una sola piedra peleada por todos.
const NODOS_RECURSO = {}
for (const [tipoId, t] of Object.entries(TIPOS_RECURSO)) {
  const cuantos = t.nivel <= 1 ? 5 : t.nivel === 2 ? 4 : 3
  for (let i = 0; i < cuantos; i++) {
    const id = `${tipoId}#${i}`
    // Posiciones repartidas: el cliente las usa para dibujarlos.
    NODOS_RECURSO[id] = {
      id, tipoId, tipo: t, zona: t.zona,
      x: 220 + ((i * 173 + tipoId.length * 61) % 900),
      y: 180 + ((i * 227 + tipoId.length * 43) % 520),
    }
  }
}

// Catálogo para la pantalla de forja: qué sale de cada combinación y
// con qué números. Deja ver de un vistazo que el mango importa.
function catalogoHerramientas() {
  return Object.entries(HERRAMIENTAS).map(([itemId, h]) => {
    const t = ITEM_TEMPLATES[itemId]
    const [tipo, mango, cabeza] = itemId.split('_')
    return {
      itemId, nombre: t.name, icono: t.icon, rareza: t.rarity, valor: t.value,
      tipo: h.tipo, poder: h.poder, nivel: h.nivel, durabilidad: h.durabilidad,
      mango: 'mango_' + mango, cabeza: 'cabeza_' + cabeza,
      receta: 'rec_' + itemId,
    }
  })
}

function estadoNodo(char, id) {
  char.nodos = char.nodos || {}
  const n = NODOS_RECURSO[id]
  if (!n) return null
  let e = char.nodos[id]
  // Sin registro, o ya repuesto: el nodo está entero otra vez.
  if (!e || (e.vida <= 0 && now() >= (e.listoEn || 0))) {
    e = { vida: n.tipo.vida, listoEn: 0 }
    char.nodos[id] = e
  }
  return e
}

function herramientaEquipada(char) {
  const uid = (char.equipment || {}).tool
  if (!uid) return null
  const it = (char.inventory || []).find(i => i.uid === uid)
  if (!it) return null
  const t = template(it.itemId)
  if (!t || !t.herramienta) return null
  return { item: it, plantilla: t, ...t.herramienta }
}

function listarRecursos(char, zona) {
  const fuera = []
  for (const n of Object.values(NODOS_RECURSO)) {
    if (zona && n.zona !== zona) continue
    const e = estadoNodo(char, n.id)
    fuera.push({
      id: n.id, tipo: n.tipoId, nombre: n.tipo.nombre, icono: n.tipo.icono,
      util: n.tipo.util, nivel: n.tipo.nivel, zona: n.zona, x: n.x, y: n.y,
      vida: e.vida, vidaMax: n.tipo.vida,
      agotado: e.vida <= 0,
      reapareceEn: e.vida <= 0 ? Math.max(0, Math.ceil((e.listoEn - now()) / 1000)) : 0,
      suelta: n.tipo.suelta.map(([id]) => ({ itemId: id, nombre: template(id).name, icono: template(id).icon, rareza: template(id).rarity })),
    })
  }
  return fuera
}

// El golpe: una petición, un golpe. Es lo único que puede pedir el
// cliente, y todo lo demás se decide aquí.
function golpearRecurso(char, nodoId) {
  const n = NODOS_RECURSO[nodoId]
  if (!n) return { error: 'Ahí no hay nada que golpear', code: 404 }

  char.zonesVisited = char.zonesVisited || []
  if (!char.zonesVisited.includes(n.zona)) {
    return { error: `Primero tienes que llegar a ${ZONES[n.zona].name}`, code: 403 }
  }

  const e = estadoNodo(char, nodoId)
  if (e.vida <= 0) {
    return { error: `Ya lo has agotado. Vuelve en ${Math.ceil((e.listoEn - now()) / 1000)}s`, code: 429 }
  }

  const h = herramientaEquipada(char)
  if (!h) {
    const q = n.tipo.util === 'hacha' ? 'un hacha' : 'un pico'
    return { error: `Necesitas ${q} equipado para esto`, code: 400 }
  }
  if (h.tipo !== n.tipo.util) {
    return { error: `Con ${h.tipo === 'pico' ? 'un pico' : 'un hacha'} no se puede: aquí hace falta ${n.tipo.util === 'hacha' ? 'un hacha' : 'un pico'}`, code: 400 }
  }
  if (h.nivel < n.tipo.nivel) {
    return { error: `Tu herramienta es demasiado básica para ${n.tipo.nombre} (hace falta nivel ${n.tipo.nivel})`, code: 403 }
  }

  // Desgaste: una herramienta que no se gasta nunca hace que mejorar
  // no sirva de nada.
  const it = h.item
  if (it.durabilidad == null) it.durabilidad = h.durabilidad
  if (it.durabilidad <= 0) return { error: 'Tu herramienta está rota', code: 400 }

  const st = effectiveStats(char)
  const daño = Math.max(1, h.poder + Math.floor(st.strength / 12))
  e.vida = Math.max(0, e.vida - daño)
  it.durabilidad -= 1

  let rota = false
  if (it.durabilidad <= 0) {
    // Se rompe: desaparece del inventario y de la ranura.
    delete char.equipment.tool
    char.inventory = char.inventory.filter(x => x.uid !== it.uid)
    rota = true
  }

  const obtenido = []
  let xp = 0
  const questUpdates = []
  if (e.vida <= 0) {
    e.listoEn = now() + n.tipo.reapareceMs
    for (const [itemId, min, max, prob] of n.tipo.suelta) {
      if (Math.random() > prob) continue
      const cantidad = randInt(min, max)
      if (!addItem(char, itemId, cantidad)) continue      // mochila llena
      const t = template(itemId)
      obtenido.push({ itemId, cantidad, nombre: t.name, icono: t.icon, rareza: t.rarity })
      questUpdates.push(...emitProgress(char, `gather_${itemId}`, cantidad))
    }
    xp = n.tipo.xp
    char.xp += xp
    char.recursosRecolectados = (char.recursosRecolectados || 0) + 1
    audit('recurso_agotado', char.name, { nodoId, obtenido: obtenido.map(o => o.itemId) })
  }

  const levelUps = e.vida <= 0 ? checkLevelUp(char) : []
  persist()
  return {
    success: true, nodoId, golpe: daño,
    vida: e.vida, vidaMax: n.tipo.vida, agotado: e.vida <= 0,
    obtenido, xp, levelUps, questUpdates,
    herramienta: rota ? null : { itemId: it.itemId, durabilidad: it.durabilidad, durabilidadMax: h.durabilidad },
    rota,
    mensaje: rota ? '¡Tu herramienta se ha roto!'
      : e.vida <= 0
        ? (obtenido.length ? 'Has conseguido: ' + obtenido.map(o => `${o.icono} ${o.nombre} ×${o.cantidad}`).join(', ') : 'No cayó nada aprovechable')
        : `Golpe de ${daño}. Le quedan ${e.vida} de ${n.tipo.vida}`,
  }
}

// ═══════════════════════════════════════════════════════════════════
//  §5 HOTBAR — acceso rápido conectado al inventario REAL
//
//  No guarda objetos: guarda referencias (uid) a los que ya están en
//  el inventario. Si el objeto se gasta o se vende, la ranura se
//  queda vacía sola. Así no puede existir una segunda copia falsa del
//  inventario, que es justo lo que pedía evitarse.
// ═══════════════════════════════════════════════════════════════════
const HOTBAR_RANURAS = 8

function hotbarDe(char) {
  if (!Array.isArray(char.hotbar) || char.hotbar.length !== HOTBAR_RANURAS) {
    char.hotbar = new Array(HOTBAR_RANURAS).fill(null)
  }
  // Limpieza: referencias a objetos que ya no existen
  char.hotbar = char.hotbar.map(uid =>
    uid && (char.inventory || []).some(i => i.uid === uid) ? uid : null)
  return char.hotbar
}

function verHotbar(char) {
  const uids = hotbarDe(char)
  return {
    ranuras: uids.map(uid => {
      if (!uid) return null
      const i = (char.inventory || []).find(x => x.uid === uid)
      if (!i) return null
      const t = template(i.itemId) || {}
      return {
        uid, itemId: i.itemId, nombre: t.name || i.name, icono: t.icon || i.icon,
        imagen: t.imagen || null,
        rareza: t.rarity || i.rarity, tipo: t.type || i.type,
        cantidad: i.quantity, equipable: !!t.slot, slot: t.slot || null,
        consumible: !!(t.heal || t.mana || t.buff),
        equipado: isEquipped(char, uid),
        durabilidad: i.durabilidad != null ? i.durabilidad : null,
      }
    }),
    seleccionada: char.hotbarSel || 0,
  }
}

function ponerEnHotbar(char, ranura, uid) {
  const r = intIn(ranura, 0, HOTBAR_RANURAS - 1, null)
  if (r === null) return { error: 'Ranura inválida', code: 400 }
  hotbarDe(char)
  if (uid === null || uid === undefined || uid === '') {
    char.hotbar[r] = null
    persist()
    return { success: true, hotbar: verHotbar(char) }
  }
  if (!(char.inventory || []).some(i => i.uid === uid)) {
    return { error: 'Ese objeto no está en tu inventario', code: 404 }
  }
  // Un mismo objeto no puede ocupar dos ranuras
  char.hotbar = char.hotbar.map(x => (x === uid ? null : x))
  char.hotbar[r] = uid
  persist()
  return { success: true, hotbar: verHotbar(char) }
}

function seleccionarRanura(char, ranura) {
  const r = intIn(ranura, 0, HOTBAR_RANURAS - 1, null)
  if (r === null) return { error: 'Ranura inválida', code: 400 }
  char.hotbarSel = r
  persist()
  return { success: true, seleccionada: r, hotbar: verHotbar(char) }
}
