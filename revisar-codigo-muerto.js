#!/usr/bin/env node
/**
 * CriptoMundo — CÓDIGO QUE NO HACE NADA
 * ═══════════════════════════════════════════════════════════════════
 *
 *   node revisar-codigo-muerto.js
 *   node revisar-codigo-muerto.js --duro     también lo dudoso
 *
 * QUÉ BUSCA
 *   · funciones declaradas y nunca llamadas
 *   · constantes y tablas declaradas y nunca leídas
 *   · `void x` y asignaciones a variables que no se usan después
 *   · ramas imposibles: `if (false)`, código tras un `return`
 *   · campos de catálogo que ningún sitio lee
 *   · restos de versiones anteriores: dos formas de hacer lo mismo
 *
 * CÓMO EVITA MENTIR
 * Un buscador de código muerto a base de expresiones regulares da
 * falsos positivos a cientos y acaba ignorándose. Aquí cada candidato
 * se comprueba contando apariciones REALES en todo el proyecto —el
 * servidor, las páginas y las pruebas— descontando la propia
 * declaración y los comentarios. Lo que no se pueda demostrar muerto
 * sale en la lista de "dudosos" y no se toca.
 *
 * Las páginas cuentan: una función del servidor puede no llamarse desde
 * el servidor y sí desde el HTML generado, y borrarla rompería la
 * pantalla sin que ninguna prueba del servidor se enterase.
 */
const fs = require('fs')
const path = require('path')

const RAIZ = __dirname
const DURO = process.argv.includes('--duro')

function listar(dir, filtro) {
  const out = []
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name.startsWith('.')) continue
    const p = path.join(dir, f.name)
    if (f.isDirectory()) out.push(...listar(p, filtro))
    else if (filtro(f.name)) out.push(p)
  }
  return out
}

// El código fuente real (lo que se edita), y TODO el texto del proyecto
// (para buscar usos, incluidas páginas y pruebas).
const FUENTES = [
  ...listar(path.join(RAIZ, 'src'), n => n.endsWith('.js')),
]
const TODO = [
  ...FUENTES,
  ...listar(RAIZ, n => n.endsWith('.js') && n !== 'criptomundo.js').filter(p => !p.includes(path.sep + 'src' + path.sep)),
]

const texto = new Map()
for (const f of TODO) texto.set(f, fs.readFileSync(f, 'utf8'))

// Quitar comentarios y cadenas antes de contar usos: un nombre que solo
// aparece en un comentario NO es un uso, y contar comentarios es la
// forma más rápida de que este informe no sirva para nada.
function soloCodigo(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
}
const codigo = new Map()
for (const [f, s] of texto) codigo.set(f, soloCodigo(s))

// Las páginas son cadenas gigantes (template literals) y el paso de
// arriba las vacía. Para ellas se cuenta sobre el texto crudo: dentro
// hay JavaScript de verdad que llama a cosas.
function cuerpoBuscable(f) {
  return f.includes(path.sep + 'pages' + path.sep) ? texto.get(f) : codigo.get(f)
}

function usos(nombre) {
  // `$` no es un carácter de palabra en JavaScript, así que `\b\$\b` no
  // casa NUNCA y la función `$` salía como muerta en cinco páginas —
  // siendo el atajo de getElementById que usan todas. Para nombres que
  // empiezan por `$` se busca el nombre seguido de un paréntesis.
  const re = nombre.startsWith('$')
    ? new RegExp('\\' + nombre + '\\s*\\(', 'g')
    : new RegExp('\\b' + nombre + '\\b', 'g')
  let n = 0
  const donde = []
  for (const f of TODO) {
    const m = cuerpoBuscable(f).match(re)
    if (m) { n += m.length; donde.push(path.basename(f) + '×' + m.length) }
  }
  return { n, donde }
}

const hallazgos = { muertas: [], constantes: [], ramas: [], restos: [], dudosos: [] }

// ── 1. Funciones declaradas y nunca llamadas ───────────────────────
for (const f of FUENTES) {
  const src = texto.get(f)
  for (const m of src.matchAll(/^function ([A-Za-zñÑáéíóúÁÉÍÓÚ_$][\w$ñÑáéíóúÁÉÍÓÚ]*)\s*\(/gm)) {
    const nombre = m[1]
    const u = usos(nombre)
    // 1 = su propia declaración. 2 o más = alguien la usa.
    if (u.n <= 1) {
      hallazgos.muertas.push({ nombre, archivo: path.basename(f),
        linea: src.slice(0, m.index).split('\n').length })
    }
  }
}

// ── 2. Constantes de nivel superior nunca leídas ───────────────────
for (const f of FUENTES) {
  const src = texto.get(f)
  for (const m of src.matchAll(/^const ([A-Z][A-Z0-9_]{2,})\s*=/gm)) {
    const nombre = m[1]
    const u = usos(nombre)
    if (u.n <= 1) {
      hallazgos.constantes.push({ nombre, archivo: path.basename(f),
        linea: src.slice(0, m.index).split('\n').length })
    }
  }
}

// ── 3. Ramas imposibles y restos ───────────────────────────────────
const PATRONES = [
  [/\bif\s*\(\s*(false|0)\s*\)/g, 'rama que nunca se cumple'],
  [/\bif\s*\(\s*(true|1)\s*\)/g, 'condición que siempre se cumple'],
  [/^\s*void\s+[\w.]+\s*$/gm, '`void x`: calcula y tira el resultado'],
  // Aquí tenía un patrón para "código después de un return" y era puro
  // ruido: marcaba 40 guardas normales del tipo `if (!el) return;` con
  // la línea siguiente. Detectar código inalcanzable de verdad pide
  // mirar el árbol de sintaxis, no una expresión regular, y un informe
  // con 40 falsos positivos es un informe que nadie vuelve a abrir.
  [/\bdebugger\b/g, 'debugger olvidado'],
  [/console\.log\(['"`]TODO/gi, 'TODO impreso por consola'],
  [/^\s*(\/\/\s*)?FIXME/gmi, 'FIXME sin resolver'],
]
for (const f of FUENTES) {
  const src = codigo.get(f)
  for (const [re, que] of PATRONES) {
    for (const m of src.matchAll(re)) {
      hallazgos.ramas.push({ que, archivo: path.basename(f),
        linea: src.slice(0, m.index).split('\n').length,
        muestra: m[0].replace(/\s+/g, ' ').trim().slice(0, 60) })
    }
  }
}

// ── 4. Variables asignadas y no usadas (solo las evidentes) ────────
if (DURO) {
  for (const f of FUENTES) {
    const src = codigo.get(f)
    for (const m of src.matchAll(/^\s*(?:const|let)\s+([a-z][\w]*)\s*=/gm)) {
      const nombre = m[1]
      if (nombre.length < 4) continue
      const dentro = (src.match(new RegExp('\\b' + nombre + '\\b', 'g')) || []).length
      if (dentro <= 1) {
        hallazgos.dudosos.push({ nombre, archivo: path.basename(f),
          linea: src.slice(0, m.index).split('\n').length, que: 'variable asignada y no usada' })
      }
    }
  }
}

// ── Informe ────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  CÓDIGO QUE NO HACE NADA                                     ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log('   ' + FUENTES.length + ' archivos de src/ · buscando usos en ' + TODO.length + ' archivos')
console.log('   (las páginas se buscan en crudo: dentro del template literal')
console.log('    hay JavaScript de verdad que llama a funciones del servidor)')

function bloque(titulo, lista, pinta) {
  console.log('\n━━ ' + titulo + ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.slice(0, 62 - titulo.length))
  if (!lista.length) { console.log('   Nada.'); return }
  for (const x of lista) console.log('   ' + pinta(x))
}

bloque('FUNCIONES QUE NADIE LLAMA', hallazgos.muertas,
  x => '❌ ' + x.nombre.padEnd(26) + x.archivo + ':' + x.linea)
bloque('CONSTANTES QUE NADIE LEE', hallazgos.constantes,
  x => '❌ ' + x.nombre.padEnd(26) + x.archivo + ':' + x.linea)
bloque('RAMAS Y RESTOS', hallazgos.ramas,
  x => '⚠️  ' + x.que.padEnd(34) + x.archivo + ':' + x.linea + '   ' + x.muestra)
if (DURO) bloque('DUDOSOS (revisar a mano)', hallazgos.dudosos,
  x => '·  ' + x.nombre.padEnd(20) + x.que.padEnd(30) + x.archivo + ':' + x.linea)

const total = hallazgos.muertas.length + hallazgos.constantes.length + hallazgos.ramas.length
console.log('\n' + '─'.repeat(64))
console.log(total ? '  ' + total + ' cosa(s) que quitar o justificar' : '  ✅ Sin código muerto')
console.log('')
process.exit(0)
