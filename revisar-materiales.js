#!/usr/bin/env node
/**
 * CriptoMundo — ¿SE PUEDE CONSEGUIR TODO?
 * ═══════════════════════════════════════════════════════════════════
 *
 *   node revisar-materiales.js            informe completo
 *   node revisar-materiales.js --armas    solo las armas
 *   node revisar-materiales.js --huerfanos  solo lo que no tiene origen
 *
 * LA PREGUNTA
 * Una receta puede estar perfectamente escrita y ser imposible. Pide
 * madera de ceniza; la madera de ceniza sale de un árbol que solo se
 * tala con un hacha de nivel 3; esa hacha necesita una cabeza de
 * hierro; el hierro sale de una veta que pide un pico de nivel 3… Si
 * un solo eslabón de esa cadena no tiene origen, el arma del final es
 * decorativa y nadie se entera hasta que un jugador lo intenta.
 *
 * CÓMO SE CONTESTA
 * No leyendo las tablas a ojo: cerrando un grafo. Se parte de lo que se
 * consigue SIN fabricar nada —lo que traes de fábrica, lo que se
 * recolecta a mano, lo que sueltan los bichos— y se va añadiendo todo
 * lo que ya se puede fabricar con lo que hay, una vuelta tras otra,
 * hasta que deja de crecer. Lo que quede fuera es inalcanzable, y el
 * informe dice POR QUÉ: qué ingrediente concreto falta.
 *
 * LAS HERRAMIENTAS SON PARTE DEL GRAFO
 * Es lo que hace que esto no sea trivial. Un nodo del mundo pide un
 * pico o un hacha de cierto nivel, y esas herramientas se fabrican con
 * materiales que a su vez salen de otros nodos. La cadena se cierra
 * sola o no se cierra, y sin calcularlo no hay forma de saberlo.
 *
 * LO QUE ESTO NO DICE
 * Si conseguirlo es RAZONABLE. Un material que cae al 8% de un bicho
 * que aparece en una arena de nivel 12 es "alcanzable" y puede ser una
 * tortura. Por eso el informe imprime la probabilidad del eslabón más
 * raro de cada cadena: alcanzable y cómodo no son lo mismo.
 */
const { cargarServidor } = require('./banco-balance.js')

const S = cargarServidor(1)
const C = S.caja   // el ámbito del servidor: ahí viven los catálogos

// Los catálogos que no exporta el banco se piden directamente al
// ámbito del servidor. Si alguno cambiara de nombre, esto avisa en vez
// de dar un informe vacío y tranquilizador.
const vm = require('vm')
function pedir(nombre) {
  try { return vm.runInContext(nombre, C) } catch { return null }
}
const RECIPES = pedir('RECIPES')
const NODOS = pedir('NODOS')
const TIPOS_RECURSO = pedir('TIPOS_RECURSO')
const LOOT_TABLES = pedir('LOOT_TABLES')
const HERRAMIENTAS = pedir('HERRAMIENTAS')
const CULTIVOS = pedir('CULTIVOS') || pedir('SEMILLAS') || null
const T = S.ITEM_TEMPLATES

const faltan = []
for (const [n, v] of [['RECIPES', RECIPES], ['NODOS', NODOS], ['TIPOS_RECURSO', TIPOS_RECURSO],
                      ['LOOT_TABLES', LOOT_TABLES], ['HERRAMIENTAS', HERRAMIENTAS]]) {
  if (!v) faltan.push(n)
}
if (faltan.length) {
  console.error('❌ No encuentro estos catálogos: ' + faltan.join(', '))
  console.error('   Sin ellos el informe diría que todo está bien sin haber mirado nada.')
  process.exit(1)
}

const nombre = id => (T[id] && T[id].name) || id

// ── De dónde sale cada cosa ────────────────────────────────────────
// origen[id] = [{ via, detalle, prob }]
const origen = new Map()
function apuntar(id, via, detalle, prob) {
  if (!origen.has(id)) origen.set(id, [])
  origen.get(id).push({ via, detalle, prob: prob == null ? 1 : prob })
}

// 1. Lo que traes de fábrica.
const inicial = S.newCharacter('analisis', 'Guerrero')
for (const it of inicial.inventory) apuntar(it.itemId, 'inicio', 'viene de fábrica', 1)

// 2. Recolección a mano: no pide herramienta.
for (const n of NODOS) {
  for (const [id, , , prob] of n.sueltan || []) apuntar(id, 'recoleccion', n.nombre, prob == null ? 1 : prob)
}

// 3. Botín de los bichos.
for (const [mid, tabla] of Object.entries(LOOT_TABLES)) {
  for (const l of tabla) {
    const m = S.MONSTERS[mid]
    apuntar(l.id, 'botin', (m ? m.name : mid) + ' (nv.' + (m ? m.level : '?') + ')', (l.w || 0) / 100)
  }
}

// 4. Cultivos del huerto, si el catálogo existe con ese nombre.
if (CULTIVOS) {
  for (const [sid, c] of Object.entries(CULTIVOS)) {
    if (c && c.produce) apuntar(c.produce, 'huerto', 'sembrando ' + nombre(sid), 1)
  }
}

// 5. Recompensas de misión. Casi me las dejo fuera, y el informe daba
// por inalcanzables la Poción de Maná y la Capucha del Espía, que se
// entregan por misiones. Una fuente olvidada convierte este análisis en
// una fábrica de falsos positivos: seis de los siete "fallos" de la
// primera versión eran míos, no del juego.
const QUESTS = pedir('QUESTS')
for (const q of QUESTS || []) {
  for (const r of q.rewards || []) {
    if (r.itemId) apuntar(r.itemId, 'mision', 'misión «' + (q.name || q.id) + '»', 1)
  }
}

// 6. Botín de mazmorra: cada mazmorra tiene su lista.
const MAZMORRAS = pedir('MAZMORRAS')
for (const mz of Object.values(MAZMORRAS || {})) {
  for (const id of mz.botin || []) apuntar(id, 'mazmorra', mz.nombre + ' (nivel ' + mz.minLevel + ')', 1)
}

// 7. El mercado inicial. Es una fuente floja a propósito —son unidades
// contadas que se agotan y luego ya no vuelven—, así que se apunta con
// probabilidad baja para que salga marcada como frágil en vez de pasar
// por una vía normal.
const seeds = pedir('seedMarket') ? String(pedir('seedMarket')) : ''
for (const m of seeds.matchAll(/\['([a-z_]+)',\s*(\d+),\s*(\d+)/g)) {
  apuntar(m[1], 'mercado', 'mercado inicial (' + m[2] + ' uds. a ' + m[3] + ' de oro)', 0.15)
}

// ── El cierre ──────────────────────────────────────────────────────
// Se empieza con lo que no necesita fabricar nada y se va ampliando.
const alcanzable = new Set(origen.keys())

// Nivel de pico y de hacha que se pueden tener ahora mismo.
function nivelHerramienta(tipo) {
  let mejor = 0
  for (const [id, h] of Object.entries(HERRAMIENTAS)) {
    if (h.tipo !== tipo) continue
    if (alcanzable.has(id) && h.nivel > mejor) mejor = h.nivel
  }
  return mejor
}

let vueltas = 0
let crecio = true
while (crecio && vueltas++ < 60) {
  crecio = false

  // Nodos del mundo que ya se pueden explotar con las herramientas que
  // se tienen.
  const nivelPico = nivelHerramienta('pico')
  const nivelHacha = nivelHerramienta('hacha')
  for (const [tid, t] of Object.entries(TIPOS_RECURSO)) {
    const tengo = t.util === 'pico' ? nivelPico : nivelHacha
    if (tengo < t.nivel) continue
    for (const [id, , , prob] of t.suelta || []) {
      if (!alcanzable.has(id)) { alcanzable.add(id); crecio = true }
      apuntar(id, 'nodo', t.nombre + ' (' + t.util + ' nv.' + t.nivel + ')', prob == null ? 1 : prob)
    }
  }

  // Recetas cuyos ingredientes ya están todos.
  for (const r of RECIPES) {
    if (alcanzable.has(r.outputItemId)) continue
    if ((r.ingredients || []).every(i => alcanzable.has(i.itemId))) {
      alcanzable.add(r.outputItemId)
      apuntar(r.outputItemId, 'receta', r.name + ' (nivel ' + r.levelReq + ')', 1)
      crecio = true
    }
  }
}

// ── Informe ────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const soloArmas = args.includes('--armas')
const soloHuerfanos = args.includes('--huerfanos')
let problemas = 0

// La cadena más rara: el eslabón menos probable con el que se puede
// conseguir algo. Un 8% no es un fallo, pero conviene verlo.
function mejorProb(id) {
  const o = origen.get(id) || []
  return o.reduce((a, x) => Math.max(a, x.prob), 0)
}
function comoSeConsigue(id) {
  const o = (origen.get(id) || []).slice().sort((a, b) => b.prob - a.prob)
  if (!o.length) return 'SIN ORIGEN'
  return o.slice(0, 2).map(x => x.detalle + (x.prob < 1 ? ' ' + Math.round(x.prob * 100) + '%' : '')).join(' · ')
}

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  ¿SE PUEDE CONSEGUIR TODO?  —  cierre del grafo de materiales║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log('   ' + alcanzable.size + ' objetos alcanzables · ' + RECIPES.length + ' recetas · ' +
  Object.keys(T).length + ' objetos en el catálogo')

if (!soloHuerfanos) {
  console.log('\n━━ LAS ARMAS, ESLABÓN A ESLABÓN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const armasCraft = RECIPES.filter(r => T[r.outputItemId] && T[r.outputItemId].slot === 'weapon')
    .sort((a, b) => (T[a.outputItemId].value || 0) - (T[b.outputItemId].value || 0))
  for (const r of armasCraft) {
    const ok = alcanzable.has(r.outputItemId)
    if (!ok) problemas++
    const rotos = (r.ingredients || []).filter(i => !alcanzable.has(i.itemId))
    console.log('\n   ' + (ok ? '✅' : '❌') + ' ' + nombre(r.outputItemId) +
      '   (nivel ' + r.levelReq + ', ' + (T[r.outputItemId].value || 0) + ' de oro)')
    for (const i of r.ingredients || []) {
      const p = mejorProb(i.itemId)
      const marca = !alcanzable.has(i.itemId) ? '❌' : p < 0.2 ? '⚠️ ' : '  '
      console.log('      ' + marca + ' ' + String(i.quantity).padStart(2) + '× ' +
        nombre(i.itemId).padEnd(22) + comoSeConsigue(i.itemId))
    }
    if (rotos.length) console.log('      └─ IMPOSIBLE: falta ' + rotos.map(x => nombre(x.itemId)).join(', '))
  }
}

if (!soloArmas) {
  console.log('\n━━ RECETAS IMPOSIBLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const rotas = RECIPES.filter(r => !alcanzable.has(r.outputItemId))
  if (!rotas.length) console.log('   Ninguna: todas las recetas del juego se pueden completar.')
  for (const r of rotas) {
    problemas++
    const faltan = (r.ingredients || []).filter(i => !alcanzable.has(i.itemId))
    console.log('   ❌ ' + r.name.padEnd(28) + ' falta: ' + faltan.map(i => nombre(i.itemId)).join(', '))
  }

  console.log('\n━━ MATERIALES SIN ORIGEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('   Objetos del catálogo que no caen de nada, no se recolectan')
  console.log('   y no se fabrican. Existen solo en la tabla.\n')
  const huerfanos = Object.keys(T).filter(id => !alcanzable.has(id))
  if (!huerfanos.length) console.log('   Ninguno.')
  for (const id of huerfanos) {
    // Un objeto huérfano es un problema si algo lo NECESITA, si es
    // equipable, o si es algo que el jugador USA —una poción, comida,
    // una semilla—. Solo miré `slot` la primera vez y el informe daba
    // por leve que la Poción de Maná no se consiguiera de ninguna
    // forma; con las habilidades costando maná, eso no es un adorno.
    // Un material decorativo que nadie pide sí es ruido y no un fallo.
    const loPiden = RECIPES.filter(r => (r.ingredients || []).some(i => i.itemId === id))
    const seUsa = !!(T[id].heal || T[id].mana || T[id].buff || T[id].type === 'SEED')
    const grave = loPiden.length > 0 || !!T[id].slot || seUsa
    if (grave) problemas++
    console.log('   ' + (grave ? '❌' : '·  ') + ' ' + nombre(id).padEnd(26) +
      (loPiden.length ? 'lo piden ' + loPiden.length + ' receta(s): ' + loPiden.map(r => r.name).join(', ')
        : T[id].slot ? 'es equipable (' + T[id].slot + ') y no se consigue'
        : seUsa ? 'el jugador lo USA y no hay forma de conseguirlo'
        : 'no lo pide nadie'))
  }

  console.log('\n━━ ESLABONES FRÁGILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('   Se consiguen, pero por una sola vía y con poca suerte.\n')
  let fragiles = 0
  for (const r of RECIPES) {
    for (const i of r.ingredients || []) {
      const o = origen.get(i.itemId) || []
      const p = mejorProb(i.itemId)
      if (p >= 0.25 || !o.length) continue
      fragiles++
      console.log('   ⚠️  ' + nombre(i.itemId).padEnd(24) + Math.round(p * 100) + '% · ' +
        comoSeConsigue(i.itemId) + '  → hace falta para ' + r.name)
    }
  }
  if (!fragiles) console.log('   Ninguno.')
}

console.log('\n' + '─'.repeat(64))
console.log(problemas ? '  ⚠️  ' + problemas + ' problema(s) que bloquean o dejan objetos muertos'
                      : '  ✅ Todo lo que el juego promete se puede conseguir')
console.log('')
// Sale con error si hay algo GRAVE —una receta imposible, un equipable
// o un consumible sin origen—, para que esto valga como prueba y no
// solo como informe. Un material decorativo que nadie pide no rompe
// nada y no hace fallar la comprobación.
process.exit(problemas ? 1 : 0)
