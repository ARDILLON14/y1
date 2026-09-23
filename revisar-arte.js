#!/usr/bin/env node
/**
 * CriptoMundo — qué arte falta, con nombre y medidas
 *
 *   node revisar-arte.js            la lista, ordenada por lo que más se ve
 *   node revisar-arte.js --json     lo mismo para una herramienta
 *
 * POR QUÉ EXISTE
 * "Faltan sprites" no es accionable. Lo que hace falta es la lista de
 * archivos concretos: cómo se llama cada uno, dónde va, qué medidas
 * tiene que tener y qué pasa hoy sin él.
 *
 * Y sirve en las dos direcciones. Además de decir qué falta, comprueba
 * lo que YA está: que cada PNG declarado exista, que tenga las medidas
 * que dice su ficha y que las tiras de animación cumplan la convención.
 * Un dibujo con el tamaño equivocado se ve mal y no avisa; esto avisa.
 *
 * El juego no se rompe por nada de esto: todo lo que no tiene dibujo cae
 * a su emoji, y eso es una decisión del proyecto, no un accidente. Esto
 * dice cuánto queda para que deje de hacer falta esa caída.
 */
const fs = require('fs')
const path = require('path')

const RAIZ = __dirname
const ASSETS = process.env.ASSETS_DIR || path.join(RAIZ, 'assets')
const SRC = path.join(RAIZ, 'src', 'server')

// ── Leer un PNG sin librerías ──────────────────────────────────────
// Solo hacen falta el ancho y el alto, y están en los primeros 24 bytes.
function medirPng(ruta) {
  try {
    const buf = fs.readFileSync(ruta)
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null
    return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20), bytes: buf.length }
  } catch { return null }
}

function fuente(archivo) {
  return fs.readFileSync(path.join(SRC, archivo), 'utf8')
}

// ── Qué declara el juego ───────────────────────────────────────────
function catalogoObjetos() {
  const s = fuente('30-personajes-combate.js')
  const out = []
  // Cada línea del catálogo empieza por `  id: { name: '…'` y puede
  // traer `imagen: '/assets/…'`. Se lee de ahí y no de una lista
  // paralela: una lista paralela se queda vieja y nadie se entera.
  for (const m of s.matchAll(/^\s{2}([a-z_0-9]+):\s*\{\s*name: '([^']+)'[^\n]*?(?:icon: '([^']*)')?[^\n]*$/gm)) {
    const [linea, id, nombre] = m
    if (!/type: '(WEAPON|ARMOR|POTION|FOOD|MATERIAL|SEED|ACCESSORY)'/.test(linea) && !/rarity:/.test(linea)) continue
    const img = /imagen: '([^']+)'/.exec(linea)
    const tipo = (/type: '([A-Z]+)'/.exec(linea) || [])[1] || '?'
    out.push({ id, nombre, tipo, imagen: img ? img[1] : null })
  }
  return out
}

function catalogoArmasArena() {
  const s = fuente('58-arena.js')
  const out = []
  for (const m of s.matchAll(/^\s{2}([a-z_0-9]+):\s*\{\s*nombre: '([^']+)'/gm)) {
    out.push({ id: m[1], nombre: m[2] })
  }
  return out
}

function catalogoSkins() {
  const s = fuente('20-skins.js')
  const out = []
  for (const m of s.matchAll(/id: '([a-z_0-9]+)',\s*\n?\s*nombre?: ?'?([^',\n]*)'?/g)) out.push({ id: m[1] })
  // Más fiable: los archivos que declara cada skin.
  const skins = []
  for (const bloque of s.split(/\n\s*\{\s*\n/).slice(1)) {
    const id = (/id: '([a-z_0-9]+)'/.exec(bloque) || [])[1]
    if (!id) continue
    const file = (/file: '([^']+)'/.exec(bloque) || [])[1]
    const portrait = (/portrait: '([^']+)'/.exec(bloque) || [])[1]
    const avatar = (/avatar: '([^']+)'/.exec(bloque) || [])[1]
    const walk = /sprites:\s*\{\s*walk:\s*\{\s*file: '([^']+)', frames: (\d+), ancho: (\d+), alto: (\d+)/.exec(bloque)
    skins.push({ id, file, portrait, avatar, walk: walk ? { file: walk[1], frames: +walk[2], ancho: +walk[3], alto: +walk[4] } : null })
  }
  return skins
}

// ── El informe ─────────────────────────────────────────────────────
function revisar() {
  const faltan = [], rotos = [], hay = []

  // 1. Objetos con dibujo declarado: tiene que existir y medir algo.
  const objetos = catalogoObjetos()
  const conImagen = objetos.filter(o => o.imagen)
  for (const o of conImagen) {
    const ruta = path.join(ASSETS, o.imagen.replace(/^\/assets\//, ''))
    const m = medirPng(ruta)
    if (!m) rotos.push({ qué: `objeto ${o.id}`, archivo: o.imagen, problema: 'declarado y no existe, o no es un PNG' })
    else hay.push({ qué: `objeto ${o.id}`, archivo: o.imagen, medidas: `${m.ancho}×${m.alto}` })
  }
  const sinImagen = objetos.filter(o => !o.imagen)
  for (const o of sinImagen) {
    faltan.push({
      prioridad: o.tipo === 'WEAPON' || o.tipo === 'ARMOR' ? 2 : 3,
      qué: `objeto ${o.id} (${o.nombre})`,
      archivo: `assets/items/${o.id}.png`,
      medidas: '64×64, PNG con transparencia',
      hoy: 'se dibuja su emoji',
    })
  }

  // 2. Skins: retrato, avatar, cuerpo entero y tira de caminar.
  for (const s of catalogoSkins()) {
    for (const [campo, archivo] of [['cuerpo', s.file], ['retrato', s.portrait], ['avatar', s.avatar]]) {
      if (!archivo) continue
      const m = medirPng(path.join(ASSETS, 'skins', archivo))
      if (!m) rotos.push({ qué: `skin ${s.id} · ${campo}`, archivo: `assets/skins/${archivo}`, problema: 'declarado y no existe' })
      else hay.push({ qué: `skin ${s.id} · ${campo}`, archivo: `assets/skins/${archivo}`, medidas: `${m.ancho}×${m.alto}` })
    }
    if (!s.walk) {
      faltan.push({
        prioridad: 1,
        qué: `skin ${s.id} · animación de caminar`,
        archivo: `assets/skins/${s.id}_walk.png`,
        medidas: 'una fila de cuadros del mismo tamaño; se declara en 20-skins.js con frames, ancho y alto',
        hoy: 'el personaje se desliza sin mover las piernas',
      })
    } else {
      const m = medirPng(path.join(ASSETS, 'skins', s.walk.file))
      if (!m) rotos.push({ qué: `skin ${s.id} · caminar`, archivo: `assets/skins/${s.walk.file}`, problema: 'declarada y no existe' })
      else if (m.ancho !== s.walk.ancho * s.walk.frames || m.alto !== s.walk.alto) {
        rotos.push({
          qué: `skin ${s.id} · caminar`, archivo: `assets/skins/${s.walk.file}`,
          problema: `mide ${m.ancho}×${m.alto} y su ficha declara ${s.walk.ancho * s.walk.frames}×${s.walk.alto}`,
        })
      } else hay.push({ qué: `skin ${s.id} · caminar`, archivo: `assets/skins/${s.walk.file}`, medidas: `${m.ancho}×${m.alto} · ${s.walk.frames} cuadros` })
    }
  }

  // 3. Armas de la arena: animación de golpe.
  const dirAnim = path.join(ASSETS, 'items', 'anim')
  for (const a of catalogoArmasArena()) {
    if (a.id === 'puños') continue
    const ruta = path.join(dirAnim, a.id + '.png')
    const m = medirPng(ruta)
    if (!m) {
      faltan.push({
        prioridad: 2,
        qué: `arma ${a.id} (${a.nombre}) · animación de golpe`,
        archivo: `assets/items/anim/${a.id}.png`,
        medidas: 'cuadros CUADRADOS en fila: el ancho tiene que ser múltiplo exacto del alto',
        hoy: 'se dibuja el gesto calculado, que funciona pero es el mismo para todas',
      })
    } else if (m.alto <= 0 || m.ancho % m.alto !== 0) {
      rotos.push({ qué: `arma ${a.id} · animación`, archivo: `assets/items/anim/${a.id}.png`,
                   problema: `mide ${m.ancho}×${m.alto} y el ancho no es múltiplo del alto: el servidor la rechaza` })
    } else hay.push({ qué: `arma ${a.id} · animación`, archivo: `assets/items/anim/${a.id}.png`, medidas: `${m.ancho}×${m.alto} · ${m.ancho / m.alto} cuadros` })
  }

  faltan.sort((a, b) => a.prioridad - b.prioridad || a.qué.localeCompare(b.qué))
  return { faltan, rotos, hay }
}

const r = revisar()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(r, null, 2))
  process.exit(r.rotos.length ? 1 : 0)
}

console.log('\n══════════════════════════════════════════════')
console.log('  ARTE DE CRIPTOMUNDO')
console.log('══════════════════════════════════════════════')
console.log(`\n  Ya está:  ${r.hay.length} archivos`)
console.log(`  Falta:    ${r.faltan.length}`)
console.log(`  Rotos:    ${r.rotos.length}`)

if (r.rotos.length) {
  console.log('\n── ESTO SÍ ES UN PROBLEMA ──')
  console.log('   Declarado en el código y mal en el disco. El juego cae a su')
  console.log('   respaldo, pero alguien creyó que estaba puesto.\n')
  for (const x of r.rotos) console.log(`   ❌ ${x.qué}\n      ${x.archivo}\n      ${x.problema}`)
}

const porPrioridad = { 1: 'LO QUE MÁS SE NOTA', 2: 'LO SIGUIENTE', 3: 'DETALLE' }
for (const p of [1, 2, 3]) {
  const lote = r.faltan.filter(x => x.prioridad === p)
  if (!lote.length) continue
  console.log(`\n── ${porPrioridad[p]} · ${lote.length} archivos ──`)
  for (const x of lote.slice(0, 12)) {
    console.log(`   · ${x.qué}`)
    console.log(`     archivo: ${x.archivo}`)
    console.log(`     medidas: ${x.medidas}`)
    console.log(`     hoy:     ${x.hoy}`)
  }
  if (lote.length > 12) console.log(`   … y ${lote.length - 12} más (usa --json para la lista entera)`)
}

console.log('\n  Nada de esto rompe el juego: lo que no tiene dibujo cae a su')
console.log('  emoji, y eso es una decisión del proyecto. Esta lista dice')
console.log('  cuánto queda para que deje de hacer falta esa caída.\n')
process.exit(r.rotos.length ? 1 : 0)
