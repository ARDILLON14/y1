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
const zlib = require('zlib')

const RAIZ = __dirname
const ASSETS = process.env.ASSETS_DIR || path.join(RAIZ, 'assets')
const SRC = path.join(RAIZ, 'src', 'server')

// ── Leer un PNG sin librerías ──────────────────────────────────────
// Solo hacen falta el ancho y el alto, y están en los primeros 24 bytes.
// El tipo de color va en el byte 25 del IHDR:
//   0 gris · 2 RGB · 3 paleta · 4 gris+alfa · 6 RGBA
// Los tipos 4 y 6 traen canal alfa. El 3 (paleta) solo es transparente
// si además lleva un bloque tRNS, así que hay que buscarlo.
// Los dibujos de objeto son cuadrados de este tamaño. No es una
// convención inventada: es lo que miden las tres espadas que hay y lo
// que dice docs/GUIA_PIXEL_ART_ARMAS.md.
const TAMANO_OBJETO = 32

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

// ── Leer los píxeles de un PNG, sin librerías ──────────────────────
//
// medirPng() se queda en la cabecera y con eso basta para las medidas.
// Para los avisos que pide la FASE G —píxeles semitransparentes, y si
// la empuñadura cae sobre un hueco— hace falta el canal alfa de verdad,
// o sea descomprimir e invertir el filtrado de cada línea.
//
// Es menos de lo que parece: zlib viene con Node, el filtrado son cinco
// casos y solo hace falta el alfa. Solo se lee lo que tiene alfa de 8
// bits (tipos 4 y 6); lo demás se devuelve sin alfa y quien llame se
// abstiene de opinar, que es mejor que inventarse un dato.
function alfaPng(ruta) {
  try {
    const buf = fs.readFileSync(ruta)
    if (buf.length < 26 || buf.readUInt32BE(0) !== 0x89504e47) return null
    const ancho = buf.readUInt32BE(16), alto = buf.readUInt32BE(20)
    const prof = buf[24], tipo = buf[25]
    if (prof !== 8) return null
    const canales = tipo === 6 ? 4 : tipo === 4 ? 2 : 0
    if (!canales) return null

    // Juntar los IDAT, que pueden venir partidos en varios trozos.
    const trozos = []
    let i = 8
    while (i + 8 <= buf.length) {
      const largo = buf.readUInt32BE(i)
      const clase = buf.toString('ascii', i + 4, i + 8)
      if (clase === 'IDAT') trozos.push(buf.subarray(i + 8, i + 8 + largo))
      if (clase === 'IEND') break
      i += 12 + largo
    }
    if (!trozos.length) return null
    const crudo = zlib.inflateSync(Buffer.concat(trozos))

    // Deshacer el filtrado línea a línea. Cada línea empieza con un byte
    // que dice con qué filtro se guardó.
    const bpp = canales
    const anchoLinea = ancho * bpp
    const alfa = new Uint8Array(ancho * alto)
    const anterior = Buffer.alloc(anchoLinea)
    let actual = Buffer.alloc(anchoLinea)
    let pos = 0
    for (let y = 0; y < alto; y++) {
      if (pos >= crudo.length) return null
      const filtro = crudo[pos++]
      crudo.copy(actual, 0, pos, pos + anchoLinea)
      pos += anchoLinea
      for (let x = 0; x < anchoLinea; x++) {
        const a = x >= bpp ? actual[x - bpp] : 0
        const b = anterior[x]
        const c = x >= bpp ? anterior[x - bpp] : 0
        let v = actual[x]
        if (filtro === 1) v += a
        else if (filtro === 2) v += b
        else if (filtro === 3) v += (a + b) >> 1
        else if (filtro === 4) {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
        }
        actual[x] = v & 0xff
      }
      for (let x = 0; x < ancho; x++) alfa[y * ancho + x] = actual[x * bpp + (bpp - 1)]
      actual.copy(anterior)
      actual = Buffer.alloc(anchoLinea)
    }
    return { ancho, alto, alfa }
  } catch { return null }
}

// La ficha del artista: assets/items/<id>.json, al lado del dibujo.
// Gana sobre lo que diga el catálogo, que gana sobre el valor por
// defecto, para que quien dibuja no tenga que tocar código.
function fichaDe(id) {
  const ruta = path.join(ASSETS, 'items', id + '.json')
  if (!fs.existsSync(ruta)) return { hay: false }
  try {
    return { hay: true, datos: JSON.parse(fs.readFileSync(ruta, 'utf8')) }
  } catch (e) {
    return { hay: true, rota: String(e.message) }
  }
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
    const e = /empunadura:\s*\{\s*x:\s*([\d.]+)\s*,\s*y:\s*([\d.]+)/.exec(f.cuerpo)
    out.push({
      id: f.id, imagen: img[1],
      empunadura: /empunadura:/.test(f.cuerpo),
      empunaduraDeclarada: e ? [Number(e[1]), Number(e[2])] : null,
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
    if (!m) { rotos.push({ qué: `objeto ${o.id}`, archivo: o.imagen, problema: 'declarado y no existe, o no es un PNG' }); continue }
    // La medida. Los dibujos de objeto son de 32×32 y el juego los
    // escala desde ahí: uno de 20×20 se ve borroso y descolocado, y
    // hasta la FASE G no lo miraba nadie. Es lo primero que pide la
    // lista de avisos de esa fase y era el único que faltaba.
    if (m.ancho !== TAMANO_OBJETO || m.alto !== TAMANO_OBJETO) {
      rotos.push({
        qué: `objeto ${o.id}`, archivo: o.imagen,
        problema: `mide ${m.ancho}×${m.alto} y los dibujos de objeto son de ${TAMANO_OBJETO}×${TAMANO_OBJETO}`,
      })
      continue
    }
    hay.push({ qué: `objeto ${o.id}`, archivo: o.imagen, medidas: `${m.ancho}×${m.alto}` })
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
      continue
    }

    // 4b. Píxeles a medio camino. Un borde con alfa 120 se ve como un
    // halo gris alrededor del dibujo cuando el juego lo escala con
    // filtro NEAREST. En pixel art un píxel está o no está.
    //
    // SOLO en lo que es pixel art, o sea los objetos de assets/items.
    // Las ilustraciones de personaje (assets/skins) están PINTADAS a
    // 587×500 con bordes suaves: ahí el medio alfa es correcto y
    // avisarlo sería dar por roto lo que está bien. La primera versión
    // de esto las marcaba las cuatro.
    if (!/^\/?assets\/items\//.test(x.archivo)) continue
    const px = alfaPng(abs)
    if (!px) continue
    let medios = 0
    for (let i = 0; i < px.alfa.length; i++) {
      const a = px.alfa[i]
      if (a > 0 && a < 255) medios++
    }
    if (medios > px.alfa.length * 0.02) {
      rotos.push({
        qué: x.qué, archivo: x.archivo,
        problema: `${medios} píxeles a medio transparente (${(medios / px.alfa.length * 100).toFixed(1)} %): con filtro NEAREST se ven como un halo`,
      })
    }
  }

  // 5. La ficha del artista y la empuñadura.
  for (const a of revisarAnclajes()) {
    const f = fichaDe(a.id)
    if (f.rota) {
      rotos.push({
        qué: `arma ${a.id} · ficha`, archivo: `assets/items/${a.id}.json`,
        problema: `no se puede leer: ${f.rota}`,
      })
      continue
    }
    // Dónde agarra la mano: la ficha manda, luego el catálogo, luego el
    // valor por defecto. Es el orden que pide la FASE G.
    const emp = (f.datos && f.datos.empunadura) || a.empunaduraDeclarada || [0.79, 0.79]
    const ex = Array.isArray(emp) ? emp[0] : emp.x
    const ey = Array.isArray(emp) ? emp[1] : emp.y
    if (!(ex >= 0 && ex <= 1 && ey >= 0 && ey <= 1)) {
      rotos.push({
        qué: `arma ${a.id} · empuñadura`, archivo: `assets/items/${a.id}.json`,
        problema: `está en (${ex}, ${ey}) y tiene que ir entre 0 y 1: es una fracción del dibujo, no píxeles`,
      })
      continue
    }
    const abs = path.join(RAIZ, a.imagen.replace(/^\//, ''))
    const px = alfaPng(abs)
    if (!px) continue
    const cx = Math.min(px.ancho - 1, Math.max(0, Math.round(ex * px.ancho)))
    const cy = Math.min(px.alto - 1, Math.max(0, Math.round(ey * px.alto)))
    if (px.alfa[cy * px.ancho + cx] === 0) {
      rotos.push({
        qué: `arma ${a.id} · empuñadura`, archivo: a.imagen,
        problema: `la mano agarra el píxel (${cx}, ${cy}) y ahí no hay dibujo: el arma saldrá flotando`,
      })
    }
  }

  // 6. Una tira de golpe sin dibujo base. El gesto se pinta encima del
  // arma; sin arma, la tira no se ve en ninguna parte.
  const dirAnim2 = path.join(ASSETS, 'items', 'anim')
  if (fs.existsSync(dirAnim2)) {
    for (const f of fs.readdirSync(dirAnim2).filter(x => x.endsWith('.png'))) {
      const id = f.replace(/\.png$/, '')
      const t = (typeof id === 'string') && objetos.find(o => o.id === id)
      if (t && !t.imagen) {
        rotos.push({
          qué: `arma ${id} · tira sin dibujo`, archivo: `assets/items/anim/${f}`,
          problema: 'hay animación de golpe pero el arma no declara `imagen`: la tira no se pinta en ningún sitio',
        })
      }
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
