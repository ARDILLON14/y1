#!/usr/bin/env node
/**
 * CriptoMundo — recorta el fondo de los dibujos de arma
 *
 * POR QUÉ EXISTE
 * Las tres espadas de assets/items/ se guardaron con el fondo OPACO
 * (blanco en la de piedra, gris azulado en las otras dos). En una
 * casilla de inventario eso ya se ve mal: un cuadrado gris alrededor
 * del dibujo. En la arena, dibujadas encima del suelo y además
 * giradas, se ven directamente como una caja que tapa al personaje.
 *
 * Es decir: el bug de "las espadas no se ven" tenía dos mitades. Una
 * era que nadie las dibujaba. La otra es esta, y no se arregla con
 * código de dibujado: hay que arreglar el PNG.
 *
 * QUÉ HACE
 * Toma el color de las cuatro esquinas, y todo píxel que sea ese color
 * (con margen, por si el PNG venía de un JPG) y esté conectado al
 * borde pasa a alpha 0. Se usa relleno por inundación desde el borde,
 * no "todo píxel de ese color": así un brillo blanco DENTRO de la hoja
 * no se convierte en un agujero.
 *
 * SEGURIDAD DEL CAMBIO
 * El original se copia antes a assets/items/originales/ (misma
 * costumbre que assets/skins/originales/). El nombre, el tamaño y la
 * ruta del archivo no cambian: nada que ya apunte a la espada se
 * entera de nada.
 *
 * Uso:  node aplicar-transparencia-armas.js [--check]
 *       --check  no escribe: solo dice cuáles tienen el fondo opaco
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const DIR = path.join(__dirname, 'assets', 'items')
const COPIAS = path.join(DIR, 'originales')
const TOLERANCIA = 22          // margen por canal para considerar "mismo color"

// ── PNG: leer ──────────────────────────────────────────────────────
function leerPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('no es un PNG')
  let i = 8, idat = [], w = 0, h = 0, prof = 0, tipo = 0
  while (i < buf.length) {
    const len = buf.readUInt32BE(i)
    const tag = buf.toString('ascii', i + 4, i + 8)
    const datos = buf.slice(i + 8, i + 8 + len)
    if (tag === 'IHDR') { w = datos.readUInt32BE(0); h = datos.readUInt32BE(4); prof = datos[8]; tipo = datos[9] }
    if (tag === 'IDAT') idat.push(datos)
    i += 12 + len
  }
  if (prof !== 8 || (tipo !== 6 && tipo !== 2)) throw new Error(`solo 8 bits RGB/RGBA (prof=${prof} tipo=${tipo})`)
  const canales = tipo === 6 ? 4 : 3
  const crudo = zlib.inflateSync(Buffer.concat(idat))
  const px = Buffer.alloc(w * h * 4, 255)
  const linea = w * canales
  let k = 0
  let previa = Buffer.alloc(linea)
  for (let y = 0; y < h; y++) {
    const f = crudo[k++]
    const act = Buffer.from(crudo.slice(k, k + linea)); k += linea
    for (let x = 0; x < linea; x++) {
      const a = x >= canales ? act[x - canales] : 0
      const b = previa[x]
      const c = x >= canales ? previa[x - canales] : 0
      if (f === 1) act[x] = (act[x] + a) & 255
      else if (f === 2) act[x] = (act[x] + b) & 255
      else if (f === 3) act[x] = (act[x] + ((a + b) >> 1)) & 255
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        act[x] = (act[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    for (let x = 0; x < w; x++) {
      px[(y * w + x) * 4] = act[x * canales]
      px[(y * w + x) * 4 + 1] = act[x * canales + 1]
      px[(y * w + x) * 4 + 2] = act[x * canales + 2]
      px[(y * w + x) * 4 + 3] = canales === 4 ? act[x * canales + 3] : 255
    }
    previa = act
  }
  return { w, h, px }
}

// ── PNG: escribir (RGBA, filtro 0) ─────────────────────────────────
function trozo(tag, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length, 0)
  const cuerpo = Buffer.concat([Buffer.from(tag, 'ascii'), datos])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo) >>> 0, 0)
  return Buffer.concat([len, cuerpo, crc])
}
let TABLA = null
function crc32(buf) {
  if (!TABLA) {
    TABLA = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      TABLA[n] = c
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABLA[(c ^ buf[i]) & 255] ^ (c >>> 8)
  return c ^ 0xffffffff
}
function escribirPng(w, h, px) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const crudo = Buffer.alloc(h * (1 + w * 4))
  for (let y = 0; y < h; y++) {
    crudo[y * (1 + w * 4)] = 0
    px.copy(crudo, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

// ── El recorte ─────────────────────────────────────────────────────
function fondoOpaco({ w, h, px }) {
  // Opaco en las cuatro esquinas y las cuatro del mismo color:
  // así no se toca un PNG que ya venía bien.
  const esq = [0, w - 1, (h - 1) * w, h * w - 1].map(i => px.slice(i * 4, i * 4 + 4))
  if (esq.some(c => c[3] < 250)) return null
  const base = esq[0]
  if (esq.some(c => Math.abs(c[0] - base[0]) + Math.abs(c[1] - base[1]) + Math.abs(c[2] - base[2]) > TOLERANCIA)) return null
  return base
}

function recortar({ w, h, px }, base) {
  const parecido = i =>
    Math.abs(px[i * 4] - base[0]) <= TOLERANCIA &&
    Math.abs(px[i * 4 + 1] - base[1]) <= TOLERANCIA &&
    Math.abs(px[i * 4 + 2] - base[2]) <= TOLERANCIA

  // Inundación desde el borde. Solo se vacía lo que el fondo toca:
  // un reflejo claro en mitad de la hoja se queda como está.
  const visto = new Uint8Array(w * h)
  const cola = []
  for (let x = 0; x < w; x++) { cola.push(x); cola.push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { cola.push(y * w); cola.push(y * w + w - 1) }
  let n = 0
  while (cola.length) {
    const i = cola.pop()
    if (visto[i] || !parecido(i)) continue
    visto[i] = 1; px[i * 4 + 3] = 0; n++
    const x = i % w, y = (i / w) | 0
    if (x > 0) cola.push(i - 1)
    if (x < w - 1) cola.push(i + 1)
    if (y > 0) cola.push(i - w)
    if (y < h - 1) cola.push(i + w)
  }
  return n
}

function main() {
  const soloMirar = process.argv.includes('--check')
  if (!fs.existsSync(DIR)) { console.log('No hay assets/items/'); return }
  const archivos = fs.readdirSync(DIR).filter(f => f.endsWith('.png'))
  let tocados = 0
  for (const f of archivos) {
    const ruta = path.join(DIR, f)
    let img
    try { img = leerPng(fs.readFileSync(ruta)) } catch (e) { console.log(`   ·  ${f}: ${e.message}`); continue }
    const base = fondoOpaco(img)
    if (!base) { console.log(`   ✓  ${f} ya tiene el fondo recortado`); continue }
    tocados++
    if (soloMirar) { console.log(`   ⚠️  ${f} tiene el fondo OPACO rgb(${base[0]},${base[1]},${base[2]})`); continue }
    fs.mkdirSync(COPIAS, { recursive: true })
    const copia = path.join(COPIAS, f)
    if (!fs.existsSync(copia)) fs.copyFileSync(ruta, copia)
    const vaciados = recortar(img, base)
    fs.writeFileSync(ruta, escribirPng(img.w, img.h, img.px))
    console.log(`   ✂️  ${f}: ${vaciados} píxeles de fondo a transparente (original en items/originales/)`)
  }
  if (soloMirar) process.exit(tocados ? 1 : 0)
  console.log(tocados ? `\n✅ ${tocados} dibujo(s) recortado(s)` : '\n✅ No había nada que recortar')
}

main()
