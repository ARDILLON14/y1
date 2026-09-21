#!/usr/bin/env node
/**
 * Las tres espadas con dibujo propio (piedra → hierro → diamante)
 *
 * No basta con meter la imagen. Una espada que se ve pero pega como los
 * puños es justo lo que el apartado 21 pide evitar, así que cada una
 * entra por cuatro sitios:
 *
 *   1. ITEM_TEMPLATES  nombre, rareza, estadísticas, valor y dibujo
 *   2. ARMAS (arena)   alcance, arco, cadencia y empuje propios; sin
 *                      esto armaDe() cae en 'puños' y la espada sería
 *                      decorativa dentro del combate en tiempo real
 *   3. RECIPES         se fabrican con lo que se saca minando, así el
 *                      bucle recolectar → forjar → combatir se cierra
 *   4. /api/inventory  el campo `imagen` viaja al cliente
 *
 * Rareza, como se pidió: piedra la más común, diamante la menos.
 */
const fs = require('fs')
const path = require('path')

let hechos = 0
function parchear(archivo, antes, despues, etiqueta, marca) {
  const p = path.join(__dirname, archivo)
  const s = fs.readFileSync(p, 'utf8')
  if (s.includes(marca)) { console.log(`  ·  ${etiqueta} — ya estaba`); return }
  if (!s.includes(antes)) { console.log(`  ❌ ${etiqueta} — no se encontró el ancla`); process.exitCode = 1; return }
  fs.writeFileSync(p, s.replace(antes, despues), 'utf8')
  console.log(`  ✅ ${etiqueta}`)
  hechos++
}

// ── 1. Plantillas ──────────────────────────────────────────────────
parchear('src/server/30-personajes-combate.js',
`  sword_alba:    { name: 'Espada del Alba',   icon: '⚔️', type: 'WEAPON',  rarity: 'UNCOMMON',  value: 340, tradeable: true, slot: 'weapon', stats: { str: 12, def: 2 } },`,
`  sword_alba:    { name: 'Espada del Alba',   icon: '⚔️', type: 'WEAPON',  rarity: 'UNCOMMON',  value: 340, tradeable: true, slot: 'weapon', stats: { str: 12, def: 2 } },

  // Espadas con dibujo propio (32×32 en assets/items/). El campo
  // \`imagen\` es opcional: quien no sepa pintarla usa el emoji de
  // \`icon\`, así que ninguna pantalla se rompe por no conocerlas.
  espada_piedra:   { name: 'Espada de Piedra',   icon: '🗡️', imagen: '/assets/items/espada_piedra.png',
    type: 'WEAPON', rarity: 'COMMON', value: 70,   tradeable: true, slot: 'weapon', stats: { str: 6 } },
  espada_hierro:   { name: 'Espada de Hierro',   icon: '⚔️', imagen: '/assets/items/espada_hierro.png',
    type: 'WEAPON', rarity: 'RARE',   value: 480,  tradeable: true, slot: 'weapon', stats: { str: 15, def: 2 } },
  espada_diamante: { name: 'Espada de Diamante', icon: '💠', imagen: '/assets/items/espada_diamante.png',
    type: 'WEAPON', rarity: 'EPIC',   value: 2600, tradeable: true, slot: 'weapon', stats: { str: 30, agi: 6, def: 4 } },`,
  'plantillas de las tres espadas', 'espada_diamante:')

// ── 2. Comportamiento en el combate en tiempo real ─────────────────
parchear('src/server/58-arena.js',
`  sword_alba:    { nombre: 'Espada del Alba',  alcance: 74,  arco: 1.6, cadenciaMs: 480, dmg: 1.5, empuje: 160 },`,
`  sword_alba:    { nombre: 'Espada del Alba',  alcance: 74,  arco: 1.6, cadenciaMs: 480, dmg: 1.5, empuje: 160 },
  // Sin estas tres entradas, armaDe() devolvería 'puños' y la espada
  // equipada no cambiaría nada al pelear: pura decoración.
  espada_piedra:   { nombre: 'Espada de Piedra',   alcance: 60, arco: 1.5, cadenciaMs: 520, dmg: 1.1, empuje: 130 },
  espada_hierro:   { nombre: 'Espada de Hierro',   alcance: 72, arco: 1.6, cadenciaMs: 460, dmg: 1.6, empuje: 165 },
  espada_diamante: { nombre: 'Espada de Diamante', alcance: 84, arco: 1.7, cadenciaMs: 400, dmg: 2.1, empuje: 205 },`,
  'las espadas pegan distinto en la arena', "espada_diamante: { nombre: 'Espada de Diamante'")

// ── 3. Se fabrican con lo que se mina ──────────────────────────────
parchear('src/server/48-recursos-mundo.js',
`const TIPOS_RECURSO = {`,
`// Las espadas cierran el bucle del §17: se pican los minerales, se
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

const TIPOS_RECURSO = {`,
  'recetas: se forjan con lo que se mina', 'rec_espada_diamante')

// ── 4. El dibujo llega al cliente ──────────────────────────────────
parchear('src/server/60-http.js',
`        name: t.name || i.name,
        icon: t.icon || i.icon,`,
`        name: t.name || i.name,
        icon: t.icon || i.icon,
        imagen: t.imagen || null,`,
  'el inventario expone la imagen del objeto', 'imagen: t.imagen || null,')

parchear('src/server/48-recursos-mundo.js',
`        uid, itemId: i.itemId, nombre: t.name || i.name, icono: t.icon || i.icon,`,
`        uid, itemId: i.itemId, nombre: t.name || i.name, icono: t.icon || i.icon,
        imagen: t.imagen || null,`,
  'la hotbar también expone la imagen', 'imagen: t.imagen || null,\n        rareza')

// ── 5. El perfil la pinta ──────────────────────────────────────────
parchear('src/pages/criptomundo-perfil.js',
`      '<div class="s-icono">' + (it ? it.icon : '·') + '</div>' +`,
`      '<div class="s-icono">' + (it ? dibujo(it) : '·') + '</div>' +`,
  'perfil: la ranura de equipo pinta el dibujo', "dibujo(it) : '·'")

parchear('src/pages/criptomundo-perfil.js',
`    '<div style="font-size:19px">' + i.icon + '</div>' +`,
`    '<div style="font-size:19px">' + dibujo(i) + '</div>' +`,
  'perfil: la rejilla del inventario pinta el dibujo', "'<div style=\"font-size:19px\">' + dibujo(i)")

parchear('src/pages/criptomundo-perfil.js',
`  partes.push('<b style="color:#C8A84B">' + i.icon + ' ' + i.name + '</b> · '`,
`  partes.push('<b style="color:#C8A84B">' + dibujo(i) + ' ' + i.name + '</b> · '`,
  'perfil: el detalle pinta el dibujo', "'<b style=\"color:#C8A84B\">' + dibujo(i)")

parchear('src/pages/criptomundo-perfil.js',
`function verObjeto(uid) {`,
`// Un objeto puede traer dibujo propio o quedarse con su emoji. Los
// objetos antiguos no tienen \`imagen\`, así que siguen igual que
// siempre: esto no obliga a dibujar nada que no exista.
function dibujo(i) {
  if (i && i.imagen) {
    return '<img src="' + i.imagen + '" alt="" width="28" height="28" ' +
      'style="image-rendering:pixelated;vertical-align:middle">'
  }
  return (i && i.icon) || '📦'
}

function verObjeto(uid) {`,
  'perfil: función dibujo()', 'function dibujo(i) {')

console.log(`\n${hechos} cambio(s) aplicados`)
