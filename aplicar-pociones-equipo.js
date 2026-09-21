#!/usr/bin/env node
/**
 * FASE 3 y 10 — pociones por niveles, equipo inicial y una sola verdad
 *
 * Tres cosas medidas en el diagnóstico:
 *
 *  §13  Solo existía UNA poción de curación (potion_hp). No había
 *       niveles I/II/III/IV, así que no había nada que elegir.
 *
 *  §12  El personaje nuevo no arrancaba con NINGÚN objeto equipable.
 *       El sistema de equipo funcionaba, pero era inalcanzable: no se
 *       podía probar ni usar hasta que cayera algo de un enemigo.
 *
 *  §19  /api/inventory devolvía el nombre, el icono y la rareza que se
 *       copiaron dentro del objeto al fabricarlo, no los de la
 *       plantilla. Cambiar una plantilla no cambiaba los objetos ya
 *       existentes: dos verdades para el mismo dato.
 */
const fs = require('fs')
const path = require('path')
const S = f => path.join(__dirname, 'src', 'server', f)

let cambios = 0
function parchear(archivo, antes, despues, etiqueta, marca) {
  const p = S(archivo)
  const s = fs.readFileSync(p, 'utf8')
  if (s.includes(marca)) { console.log(`  ·  ${etiqueta} — ya estaba`); return }
  if (!s.includes(antes)) { console.log(`  ❌ ${etiqueta} — no se encontró el ancla`); process.exitCode = 1; return }
  fs.writeFileSync(p, s.replace(antes, despues), 'utf8')
  console.log(`  ✅ ${etiqueta}`)
  cambios++
}

// ── §13 ESCALERA DE POCIONES ────────────────────────────────────────
// La cantidad curada vive aquí, en datos, y no en ninguna pantalla.
// La rareza sube con el nivel, como pide §11: no es solo un color.
parchear('30-personajes-combate.js',
`  potion_hp_big: { name: 'Poción Mayor',       icon: '🍶', type: 'POTION', rarity: 'RARE',     value: 210, tradeable: true, heal: 600, mana: 300 },`,
`  potion_hp_big: { name: 'Poción de Curación III', icon: '🍶', type: 'POTION', rarity: 'RARE',     value: 210, tradeable: true, heal: 1100, mana: 300 },

  // Escalera de curación (§13). Cada escalón sube de rareza y cura
  // bastante más, para que valga la pena guardar las buenas en vez de
  // beberse la primera que aparezca. potion_hp y potion_hp_big ya
  // existían: se quedan con su id para no romper inventarios guardados.
  potion_hp_ii:  { name: 'Poción de Curación II', icon: '🧪', type: 'POTION', rarity: 'UNCOMMON',  value: 70,   tradeable: true, heal: 500 },
  potion_hp_iv:  { name: 'Poción de Curación IV', icon: '⚗️', type: 'POTION', rarity: 'EPIC',      value: 600,  tradeable: true, heal: 2400, mana: 600 },
  potion_hp_v:   { name: 'Poción de Curación V',  icon: '🫙', type: 'POTION', rarity: 'LEGENDARY', value: 1600, tradeable: true, heal: 5000, mana: 1200 },
  elixir_mitico: { name: 'Elixir Mítico',         icon: '🏺', type: 'POTION', rarity: 'MYTHIC',    value: 4200, tradeable: true, heal: 99999, mana: 99999 },`,
  '§13 pociones de curación I a V + elixir mítico', 'potion_hp_ii')

// El nombre del escalón I se alinea con el resto de la escalera
parchear('30-personajes-combate.js',
`  potion_hp:     { name: 'Poción de Vida',    icon: '🧪', type: 'POTION',   rarity: 'COMMON',    value: 20,  tradeable: true, heal: 220 },`,
`  potion_hp:     { name: 'Poción de Curación I', icon: '🧪', type: 'POTION', rarity: 'COMMON',    value: 20,  tradeable: true, heal: 220 },`,
  '§13 la poción básica pasa a llamarse "I"', "name: 'Poción de Curación I'")

// ── §13 Que las pociones altas se puedan conseguir ──────────────────
// Una poción que no cae de ningún sitio es una entrada en una tabla.
parchear('30-personajes-combate.js',
`  m_golem:    [{ id: 'iron_ore', w: 50, q: [2, 4] }, { id: 'crystal', w: 12, q: [1, 1] }, { id: 'sword_alba', w: 4, q: [1, 1] }],`,
`  m_golem:    [{ id: 'iron_ore', w: 50, q: [2, 4] }, { id: 'crystal', w: 12, q: [1, 1] }, { id: 'sword_alba', w: 4, q: [1, 1] }, { id: 'potion_hp_ii', w: 18, q: [1, 2] }],`,
  '§13 la poción II cae de los gólems', "potion_hp_ii', w: 18")

parchear('30-personajes-combate.js',
`  m_dragon:   [{ id: 'crystal', w: 35, q: [1, 2] }, { id: 'thunder_staff', w: 3, q: [1, 1] }, { id: 'soul_shard', w: 1, q: [1, 1] }],`,
`  m_dragon:   [{ id: 'crystal', w: 35, q: [1, 2] }, { id: 'thunder_staff', w: 3, q: [1, 1] }, { id: 'soul_shard', w: 1, q: [1, 1] }, { id: 'potion_hp_big', w: 14, q: [1, 1] }],`,
  '§13 la poción III cae de los dragones', "potion_hp_big', w: 14")

parchear('30-personajes-combate.js',
`  m_demon:    [{ id: 'crystal', w: 30, q: [1, 3] }, { id: 'arcane_orb', w: 4, q: [1, 1] }, { id: 'soul_shard', w: 2, q: [1, 1] }],`,
`  m_demon:    [{ id: 'crystal', w: 30, q: [1, 3] }, { id: 'arcane_orb', w: 4, q: [1, 1] }, { id: 'soul_shard', w: 2, q: [1, 1] }, { id: 'potion_hp_iv', w: 8, q: [1, 1] }],`,
  '§13 la poción IV cae de los demonios', "potion_hp_iv', w: 8")

// ── §12 EQUIPO INICIAL ──────────────────────────────────────────────
parchear('30-personajes-combate.js',
`    inventory: [makeItem('iron_ore', 5), makeItem('herb', 8), makeItem('wood', 6), makeItem('potion_hp', 3), makeItem('water', 10), makeItem('semilla_trigo', 3), makeItem('semilla_hierba', 2)],`,
`    // Arranca con algo que ponerse. Antes el personaje nuevo no tenía
    // NADA equipable, así que el sistema de equipo existía pero no se
    // podía tocar hasta que cayera un objeto: parecía roto (§12).
    inventory: [
      makeItem('dagger'), makeItem('leather_helm'), makeItem('leather_boots'),
      makeItem('iron_ore', 5), makeItem('herb', 8), makeItem('wood', 6),
      makeItem('potion_hp', 3), makeItem('potion_hp_ii', 1), makeItem('water', 10),
      makeItem('semilla_trigo', 3), makeItem('semilla_hierba', 2),
    ],`,
  '§12 el personaje nuevo arranca con daga, casco y botas', "makeItem('dagger'), makeItem('leather_helm')")

// ── §19 UNA SOLA FUENTE DE VERDAD ───────────────────────────────────
parchear('60-http.js',
`      const t = template(i.itemId) || {}
      return {
        ...i,
        slot: t.slot || null,`,
`      const t = template(i.itemId) || {}
      return {
        ...i,
        // El nombre, el icono y la rareza se leen SIEMPRE de la
        // plantilla, no de la copia que se guardó al fabricar el
        // objeto. Si no, retocar una plantilla dejaba los objetos
        // antiguos con los datos viejos: dos verdades para lo mismo.
        name: t.name || i.name,
        icon: t.icon || i.icon,
        rarity: t.rarity || i.rarity,
        type: t.type || i.type,
        slot: t.slot || null,`,
  '§19 el inventario lee nombre/icono/rareza de la plantilla', 'name: t.name || i.name')

console.log(`\n${cambios} cambio(s) aplicados`)
