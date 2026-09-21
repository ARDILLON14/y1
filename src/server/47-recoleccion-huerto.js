
// ═══════════════════════════════════════════════════════════════════
//  RECOLECCIÓN Y HUERTO
//
//  Dos agujeros reales del juego que esto tapa:
//
//  1. El AGUA solo existía en el inventario inicial (10 unidades) y en
//     el mercado. Ninguna criatura la soltaba y no había forma de
//     conseguirla: al gastarla, las pociones quedaban bloqueadas para
//     siempre. Lo mismo con el TRIGO, que hacía falta para el pan y no
//     lo daba absolutamente nada: esa receta era incompletable desde
//     el primer minuto.
//
//  2. No había ninguna actividad que no fuera pelear.
//
//  Los nodos de recolección son por zona y con enfriamiento propio de
//  cada jugador; el huerto es de tiempo real (se siembra, se espera de
//  verdad y se vuelve a cosechar).
// ═══════════════════════════════════════════════════════════════════

// ── Nodos de recolección ───────────────────────────────────────────
//   zona        dónde aparece
//   cooldownMs  espera por jugador y nodo
//   sueltan     [itemId, min, max, probabilidad]
const NODOS = [
  { id: 'pozo',      nombre: 'Pozo del pueblo',  icono: '🪣', zona: 'pueblo', cooldownMs: 60_000,
    descripcion: 'Sacar agua del pozo. Nunca se seca.',
    sueltan: [['water', 2, 4, 1]], xp: 5 },
  { id: 'rio',       nombre: 'Río del bosque',   icono: '🏞️', zona: 'forest', cooldownMs: 90_000,
    descripcion: 'Agua limpia y algún junco.',
    sueltan: [['water', 3, 5, 1], ['herb', 1, 2, 0.4]], xp: 8 },
  { id: 'herbario',  nombre: 'Claro de hierbas', icono: '🌿', zona: 'forest', cooldownMs: 120_000,
    descripcion: 'Hierba medicinal y semillas silvestres.',
    sueltan: [['herb', 2, 4, 1], ['semilla_hierba', 1, 2, 0.5], ['semilla_trigo', 1, 1, 0.3],
              ['semilla_calabaza', 1, 1, 0.25], ['semilla_chile', 1, 1, 0.12]], xp: 10 },
  // El cuero solo caía de las arañas y los trolls, con suerte: las
  // armaduras de cuero dependían de un botín aleatorio y podías
  // quedarte atascado sin poder fabricar ninguna pieza.
  { id: 'cazadero',  nombre: 'Coto de caza',      icono: '🦌', zona: 'forest', cooldownMs: 150_000,
    descripcion: 'Pieles curtibles de la caza menor.',
    sueltan: [['leather', 3, 5, 1], ['wood', 1, 2, 0.4]], xp: 12 },
  { id: 'colmena',   nombre: 'Colmena silvestre', icono: '🐝', zona: 'forest', cooldownMs: 180_000,
    descripcion: 'Miel para las recetas dulces. Cuidado con las abejas.',
    // Daba de 1 a 3 miel, pero la única receta con miel pide 2: una de
    // cada tres visitas dejaba al jugador esperando 3 minutos de
    // enfriamiento sin poder fabricar nada. El mínimo sube a 2.
    sueltan: [['honey', 2, 4, 1], ['herb', 1, 2, 0.4]], xp: 14 },
  { id: 'lena',      nombre: 'Tocones caídos',   icono: '🪵', zona: 'forest', cooldownMs: 90_000,
    descripcion: 'Madera aprovechable.',
    sueltan: [['wood', 2, 4, 1]], xp: 8 },
  { id: 'trigal',    nombre: 'Trigal silvestre', icono: '🌾', zona: 'pueblo', cooldownMs: 150_000,
    descripcion: 'Trigo y semillas. Lo único que daba trigo antes era nada.',
    sueltan: [['wheat', 2, 4, 1], ['semilla_trigo', 1, 2, 0.6], ['semilla_maiz', 1, 2, 0.45]], xp: 10 },
  { id: 'veta',      nombre: 'Veta de hierro',   icono: '⛏️', zona: 'mines', cooldownMs: 150_000,
    descripcion: 'Mineral de hierro y, con suerte, cristal.',
    sueltan: [['iron_ore', 2, 5, 1], ['crystal', 1, 1, 0.12]], xp: 18 },
  { id: 'charca',    nombre: 'Charca subterránea', icono: '💧', zona: 'mines', cooldownMs: 120_000,
    descripcion: 'Agua de filtración.',
    sueltan: [['water', 4, 7, 1]], xp: 12 },
]
const NODO_POR_ID = new Map(NODOS.map(n => [n.id, n]))

function nodosDeZona(zonaId) {
  const z = zonaCanonica(zonaId)
  return NODOS.filter(n => n.zona === z)
}

function recolectar(char, nodoId) {
  const nodo = NODO_POR_ID.get(nodoId)
  if (!nodo) return { error: 'Ese sitio no existe', code: 404 }

  char.zonesVisited = char.zonesVisited || []
  if (!char.zonesVisited.includes(nodo.zona)) {
    return { error: `Primero tienes que visitar ${ZONES[nodo.zona].name}`, code: 403 }
  }

  char.recoleccion = char.recoleccion || {}
  const listoEn = char.recoleccion[nodoId] || 0
  if (now() < listoEn) {
    return { error: `Ese sitio se está reponiendo (${Math.ceil((listoEn - now()) / 1000)}s)`, code: 429 }
  }
  char.recoleccion[nodoId] = now() + nodo.cooldownMs

  const obtenido = []
  const questUpdates = []
  for (const [itemId, min, max, prob] of nodo.sueltan) {
    if (Math.random() > prob) continue
    const cantidad = randInt(min, max)
    if (!addItem(char, itemId, cantidad)) continue   // mochila llena
    obtenido.push({ itemId, cantidad, nombre: template(itemId).name, icono: template(itemId).icon })
    questUpdates.push(...emitProgress(char, `gather_${itemId}`, cantidad))
  }
  char.xp += nodo.xp
  char.recursosRecolectados = (char.recursosRecolectados || 0) + obtenido.reduce((a, o) => a + o.cantidad, 0)
  const levelUps = checkLevelUp(char)
  audit('recolectar', char.name, { nodo: nodoId, obtenido })
  track('recolectar', char.name)
  step(char.name, 'first_gather')
  persist()
  return { success: true, nodo: nodo.nombre, obtenido, xp: nodo.xp, levelUps, questUpdates, listoEn: char.recoleccion[nodoId] }
}

// ── Huerto ─────────────────────────────────────────────────────────
// Cada semilla tarda un tiempo REAL en crecer: se siembra, se cierra
// el juego y al volver está lista. El estado se calcula con marcas de
// tiempo, no con un temporizador en el navegador, así que no se puede
// acelerar desde el cliente.
// Los tiempos se pueden acortar para probar: FARM_SPEED=300 convierte
// cinco minutos de crecimiento en un segundo. En producción vale 1.
const FARM_SPEED = Math.max(1, Number(process.env.FARM_SPEED || 1))
const CULTIVOS = {
  semilla_trigo:  { nombre: 'Semilla de trigo',  icono: '🌾', creceMs: (5 * 60_000) / FARM_SPEED,  produce: 'wheat', min: 3, max: 5, xp: 12,
                    extra: { itemId: 'semilla_trigo', prob: 0.5, min: 1, max: 2 } },
  semilla_hierba: { nombre: 'Semilla de hierba', icono: '🌿', creceMs: (8 * 60_000) / FARM_SPEED,  produce: 'herb',  min: 3, max: 6, xp: 16,
                    extra: { itemId: 'semilla_hierba', prob: 0.5, min: 1, max: 2 } },
  semilla_maiz:    { nombre: 'Semilla de maíz',     icono: '🌽', creceMs: (6 * 60_000) / FARM_SPEED,  produce: 'corn',    min: 3, max: 6, xp: 14,
                     extra: { itemId: 'semilla_maiz', prob: 0.5, min: 1, max: 2 } },
  semilla_calabaza:{ nombre: 'Semilla de calabaza', icono: '🎃', creceMs: (12 * 60_000) / FARM_SPEED, produce: 'pumpkin', min: 2, max: 4, xp: 26,
                     extra: { itemId: 'semilla_calabaza', prob: 0.4, min: 1, max: 1 } },
  semilla_chile:   { nombre: 'Semilla de chile',    icono: '🌶️', creceMs: (18 * 60_000) / FARM_SPEED, produce: 'chili',   min: 2, max: 3, xp: 38,
                     extra: { itemId: 'semilla_chile', prob: 0.35, min: 1, max: 1 } },
  semilla_cristal:{ nombre: 'Esqueje de cristal',icono: '💎', creceMs: (45 * 60_000) / FARM_SPEED, produce: 'crystal', min: 1, max: 2, xp: 60 },
}

const PARCELAS_BASE = 4
function parcelasDe(char) {
  // La casa deja de ser solo decoración: cada nivel da una parcela más.
  return PARCELAS_BASE + Math.max(0, (char.house?.level || 1) - 1)
}

function estadoHuerto(char) {
  char.huerto = char.huerto || []
  const total = parcelasDe(char)
  const parcelas = []
  for (let i = 0; i < total; i++) {
    const p = char.huerto[i]
    if (!p || !p.semilla) { parcelas.push({ i, estado: 'vacia' }); continue }
    const c = CULTIVOS[p.semilla]
    const restante = Math.max(0, p.listoEn - now())
    parcelas.push({
      i, estado: restante > 0 ? 'creciendo' : 'lista',
      semilla: p.semilla, nombre: c.nombre, icono: c.icono,
      produce: template(c.produce).name, iconoProduce: template(c.produce).icon,
      restanteMs: restante,
      progreso: Math.min(1, 1 - restante / c.creceMs),
    })
  }
  return {
    parcelas, total,
    semillas: Object.entries(CULTIVOS).map(([id, c]) => ({
      id, nombre: c.nombre, icono: c.icono, creceMs: c.creceMs,
      produce: template(c.produce).name, tengo: countItem(char, id),
    })),
  }
}

function sembrar(char, indice, semillaId) {
  const c = CULTIVOS[semillaId]
  if (!c) return { error: 'Esa semilla no existe', code: 404 }
  const i = intIn(indice, 0, parcelasDe(char) - 1)
  if (i === null) return { error: 'Parcela inválida', code: 400 }
  char.huerto = char.huerto || []
  if (char.huerto[i] && char.huerto[i].semilla) return { error: 'Esa parcela ya está sembrada', code: 409 }
  if (countItem(char, semillaId) < 1) return { error: `No tienes ${c.nombre}`, code: 400 }
  removeItem(char, semillaId, 1)
  char.huerto[i] = { semilla: semillaId, sembradoEn: now(), listoEn: now() + c.creceMs }
  audit('sembrar', char.name, { parcela: i, semilla: semillaId })
  persist()
  return { success: true, huerto: estadoHuerto(char) }
}

function cosechar(char, indice) {
  const i = intIn(indice, 0, parcelasDe(char) - 1)
  if (i === null) return { error: 'Parcela inválida', code: 400 }
  const p = (char.huerto || [])[i]
  if (!p || !p.semilla) return { error: 'Ahí no hay nada sembrado', code: 400 }
  const c = CULTIVOS[p.semilla]
  if (now() < p.listoEn) {
    return { error: `Todavía está creciendo (${Math.ceil((p.listoEn - now()) / 1000)}s)`, code: 400 }
  }

  const obtenido = []
  const cantidad = randInt(c.min, c.max)
  if (addItem(char, c.produce, cantidad)) {
    obtenido.push({ itemId: c.produce, cantidad, nombre: template(c.produce).name, icono: template(c.produce).icon })
  }
  // Devolver semillas de vez en cuando evita que el huerto se agote
  if (c.extra && Math.random() < c.extra.prob) {
    const n = randInt(c.extra.min, c.extra.max)
    if (addItem(char, c.extra.itemId, n)) {
      obtenido.push({ itemId: c.extra.itemId, cantidad: n, nombre: CULTIVOS[c.extra.itemId].nombre, icono: CULTIVOS[c.extra.itemId].icono })
    }
  }
  char.huerto[i] = null
  char.xp += c.xp
  char.cosechas = (char.cosechas || 0) + 1
  char.recursosRecolectados = (char.recursosRecolectados || 0) + obtenido.reduce((a, o) => a + o.cantidad, 0)
  const levelUps = checkLevelUp(char)
  const questUpdates = obtenido.flatMap(o => emitProgress(char, `gather_${o.itemId}`, o.cantidad))
  audit('cosechar', char.name, { parcela: i, obtenido })
  track('cosechar', char.name)
  step(char.name, 'first_harvest')
  persist()
  return { success: true, obtenido, xp: c.xp, levelUps, questUpdates, huerto: estadoHuerto(char) }
}
