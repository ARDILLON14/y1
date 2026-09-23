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
// El tipo de color va en el byte 25 del IHDR:
//   0 gris · 2 RGB · 3 paleta · 4 gris+alfa · 6 RGBA
// Los tipos 4 y 6 traen canal alfa. El 3 (paleta) solo es transparente
// si además lleva un bloque tRNS, así que hay que buscarlo.
const TIPOS_PNG = { 0: 'gris', 2: 'RGB', 3: 'paleta', 4: 'gris+alfa', 6: 'RGBA' }
function medirPng(ruta) {
  try {
    const buf = fs.readFileSync(ruta)
    if (buf.length < 26 || buf.readUInt32BE(0) !== 0x89504e47) return null
    const tipo = buf[25]
    const alfa = tipo === 4 || tipo === 6 || (tipo === 3 && buf.includes(Buffer.from('tRNS')))
    return {
      ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20), bytes: buf.length,
      tipo, tipoNombre: TIPOS_PNG[tipo] || '?', alfa,
    }
  } catch { return null }
}

function fuente(archivo) {
  return fs.readFileSync(path.join(SRC, archivo), 'utf8')
}

// ── Qué declara el juego ───────────────────────────────────────────
// Cada ficha del catálogo empieza por `  id: { name: '…'`, pero NO
// cabe siempre en una línea: las tres espadas con dibujo propio están
// partidas en dos, y justo esas son las que traen `imagen`.
//
// La primera versión de esto leía línea a línea, así que se saltaba
// exactamente las fichas que tenían arte: el contador decía «10
// archivos puestos» y los diez eran de skins. Ni un solo PNG de objeto
// se había comprobado nunca. Ahora se cuentan las llaves.
function fichasDe(texto) {
  const out = []
  const re = /^ {2}([a-z_0-9]+):\s*\{/gm
  let m
  while ((m = re.exec(texto))) {
    let i = texto.indexOf('{', m.index), nivel = 0, fin = i
    for (; fin < texto.length; fin++) {
      if (texto[fin] === '{') nivel++
      else if (texto[fin] === '}') { nivel--; if (nivel === 0) break }
    }
    out.push({ id: m[1], cuerpo: texto.slice(i, fin + 1) })
    re.lastIndex = fin
  }
  return out
}

function catalogoObjetos() {
  const out = []
  for (const f of fichasDe(fuente('30-personajes-combate.js'))) {
    const nombre = (/name: '([^']+)'/.exec(f.cuerpo) || [])[1]
    if (!nombre) continue
    const tipo = (/type: '([A-Z]+)'/.exec(f.cuerpo) || [])[1]
    if (!tipo || !/rarity:/.test(f.cuerpo)) continue
    const img = /imagen: '([^']+)'/.exec(f.cuerpo)
    out.push({ id: f.id, nombre, tipo, imagen: img ? img[1] : null })
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

// ── Anclaje de cada arma ───────────────────────────────────────────
// La FASE 14 dice, con estas palabras, «nunca asumir que todos los
// sprites tienen el mismo anchor». El mecanismo está: cada arma puede
// declarar su empuñadura y el ángulo al que viene girada su hoja, y el
// dibujante los usa. Lo que no está es que alguien los haya declarado:
// si ninguna los trae, todas caen al mismo valor por defecto, que es
// exactamente la suposición que la fase prohíbe. Esto lo cuenta.
function revisarAnclajes() {
  const out = []
  for (const f of fichasDe(fuente('30-personajes-combate.js'))) {
    const img = /imagen: '([^']+)'/.exec(f.cuerpo)
    if (!img) continue
    out.push({
      id: f.id, imagen: img[1],
      empunadura: /empunadura:/.test(f.cuerpo),
      angulo: /spriteAngulo:/.test(f.cuerpo),
    })
  }
  return out
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
        // Prioridad 2 desde el STEP 22. Antes era 1 y era lo más
        // visible del juego: el personaje se deslizaba. Ahora hay un
        // respaldo que mueve el cuerpo, así que falta el dibujo pero
        // ya no falta el movimiento.
        prioridad: 2,
        qué: `skin ${s.id} · animación de caminar`,
        archivo: `assets/skins/${s.id}_walk.png`,
        medidas: 'una fila de cuadros del mismo tamaño; se declara en 20-skins.js con frames, ancho y alto',
        hoy: 'se mueve el cuerpo al andar (bote, balanceo y sombra) pero sin piernas dibujadas',
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

  // 4. Transparencia. La FASE 14 la pide y no se miraba: un PNG sin
  // canal alfa se pinta con su fondo, y sobre el mundo eso es un
  // rectángulo de color alrededor del dibujo. No revienta nada, así que
  // nadie se entera hasta que se ve.
  for (const x of hay) {
    const abs = path.join(RAIZ, x.archivo)
    const m = medirPng(abs)
    if (m && !m.alfa) {
      rotos.push({
        qué: x.qué, archivo: x.archivo,
        problema: `es ${m.tipoNombre} y no trae transparencia: se pintará con su fondo`,
      })
    }
  }

  faltan.sort((a, b) => a.prioridad - b.prioridad || a.qué.localeCompare(b.qué))
  return { faltan, rotos, hay, anclajes: revisarAnclajes() }
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

const sinAnclaje = (r.anclajes || []).filter(a => !a.empunadura)
if (sinAnclaje.length) {
  console.log(`\n── EL MISMO ANCLAJE PARA TODAS · ${sinAnclaje.length} de ${r.anclajes.length} armas con dibujo ──`)
  console.log('   Cada arma PUEDE declarar su empuñadura y el ángulo de su hoja')
  console.log('   en 30-personajes-combate.js, y el dibujante los usa. Ninguna de')
  console.log('   estas los declara, así que todas se sujetan por el mismo punto.')
  console.log('   Con tres espadas parecidas se aguanta; con un arco o un martillo')
  console.log('   se nota en la mano.\n')
  for (const a of sinAnclaje) {
    console.log(`   · ${a.id}  ${a.imagen}`)
    console.log(`     le falta: empunadura: { x, y }${a.angulo ? '' : ' y spriteAngulo'}`)
  }
}

console.log('\n  Nada de esto rompe el juego: lo que no tiene dibujo cae a su')
console.log('  emoji, y eso es una decisión del proyecto. Esta lista dice')
console.log('  cuánto queda para que deje de hacer falta esa caída.\n')
process.exit(r.rotos.length ? 1 : 0)
