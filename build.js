#!/usr/bin/env node
/**
 * CriptoMundo — script de compilación (0 dependencias)
 *
 *   node build.js            compila src/ → criptomundo.js
 *   node build.js --check    compila y avisa si el archivo actual está desfasado
 *   node build.js --watch    recompila al guardar cualquier archivo de src/
 *
 * Por qué existe: el juego se distribuye como UN archivo ejecutable sin
 * dependencias, pero editar 14.000 líneas en un solo fichero es frágil.
 * Aquí se trabaja por módulos y el archivo único se genera.
 *
 * El orden importa y es este:
 *   1. src/server/00-header.js   cabecera y `const PAGES = {}`
 *   2. src/pages/*.js            una página HTML embebida por archivo
 *   3. src/server/NN-*.js        núcleo del servidor, por número
 *
 * Para añadir una página nueva: crea src/pages/mi-pagina.js con
 * `PAGES['mi-pagina.html'] = ` + template literal, y recompila.
 */
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const SRC = path.join(ROOT, 'src')
const OUTPUT = path.join(ROOT, 'criptomundo.js')

// El orden de las páginas no afecta al funcionamiento, pero se mantiene
// estable para que las diferencias entre compilaciones sean legibles.
const PAGE_ORDER = [
  'index',
  'index-2',
  'criptomundo-mundo2d',
  'criptomundo-mundo2d-2',
  'criptomundo-mundo2d-3',
  'criptomundo-mundo2d-4',
  'criptomundo-combat',
  'criptomundo-combat-2',
  'criptomundo-arena',
  'criptomundo-huerto',
  'criptomundo-crafting',
  'criptomundo-mercado',
  'criptomundo-misiones',
  'criptomundo-mazmorras-pvp',
  'criptomundo-mazmorras-pvp-2',
  'criptomundo-casas',
  'criptomundo-guilds',
  'criptomundo-hub',
  'criptomundo-perfil',
  '_extra-header',
  'economia',
  'admin',
]

function read(p) {
  const texto = fs.readFileSync(p, 'utf8')
  if (p.includes(path.join('src', 'pages'))) comprobarComillas(p, texto)
  return texto
}

// Cada página vive dentro de un template literal. Una comilla invertida
// suelta ahí dentro —aunque sea en un comentario— cierra la cadena antes
// de tiempo y parte el archivo generado. Al escribirlo no se nota nada;
// al arrancar, el servidor no compila. Lo he cometido dos veces, así que
// ahora se caza donde duele menos: al compilar.
function comprobarComillas(ruta, texto) {
  const abre = texto.indexOf('`')
  const cierra = texto.lastIndexOf('`')
  if (abre < 0 || abre === cierra) return
  const cuerpo = texto.slice(abre + 1, cierra)
  const m = cuerpo.match(/(?<!\\)`/g)
  if (!m) return
  const pos = cuerpo.search(/(?<!\\)`/)
  const linea = texto.slice(0, abre + 1 + pos).split('\n').length
  console.error('')
  console.error('❌ ' + path.basename(ruta) + ': ' + m.length + ' comilla(s) invertida(s) dentro de la página.')
  console.error('   La primera en la línea ' + linea + '.')
  console.error('   Dentro de una página no puede haber ninguna, ni en un comentario:')
  console.error('   cierra el template literal y parte el archivo generado en dos.')
  console.error('')
  process.exit(1)
}

function collect() {
  const files = []

  files.push(path.join(SRC, 'server', '00-header.js'))

  const pageDir = path.join(SRC, 'pages')
  const present = fs.readdirSync(pageDir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3))
  for (const name of PAGE_ORDER) {
    if (present.includes(name)) files.push(path.join(pageDir, name + '.js'))
  }
  // Páginas nuevas que no estén en PAGE_ORDER se añaden al final por orden alfabético
  for (const name of present.sort()) {
    if (!PAGE_ORDER.includes(name)) files.push(path.join(pageDir, name + '.js'))
  }

  const serverDir = path.join(SRC, 'server')
  const core = fs.readdirSync(serverDir).filter(f => f.endsWith('.js') && f !== '00-header.js').sort()
  for (const f of core) files.push(path.join(serverDir, f))

  return files
}

// La versión vivía copiada en tres sitios y acabó divergiendo (el
// banner decía v9 cuando package.json iba por la v11). Ahora se
// comprueba en cada compilación.
function comprobarVersion(out) {
  const pkg = JSON.parse(read(path.join(ROOT, 'package.json')))
  const m = /const VERSION = '([^']+)'/.exec(out)
  if (!m) { console.warn('⚠️  No se encontró VERSION en src/server/00-header.js') ; return }
  if (m[1] !== pkg.version) {
    console.error(`❌ Versión descuadrada: código ${m[1]} vs package.json ${pkg.version}`)
    process.exit(1)
  }
}

function build() {
  const files = collect()
  // Una línea en blanco entre módulos para que el archivo generado se lea bien
  const out = files.map(f => read(f).replace(/\n*$/, '\n')).join('\n')
  return { out, files }
}

function main() {
  const args = process.argv.slice(2)
  const { out, files } = build()
  comprobarVersion(out)

  if (args.includes('--check')) {
    const current = fs.existsSync(OUTPUT) ? read(OUTPUT) : ''
    if (current === out) { console.log('✅ criptomundo.js está al día'); process.exit(0) }
    console.error('❌ criptomundo.js NO coincide con src/. Ejecuta: node build.js')
    process.exit(1)
  }

  fs.writeFileSync(OUTPUT, out, 'utf8')
  const lines = out.split('\n').length
  console.log(`✅ ${path.basename(OUTPUT)} — ${files.length} módulos · ${lines.toLocaleString('es')} líneas · ${Math.round(out.length / 1024)} KB`)

  if (args.includes('--watch')) {
    console.log('👀 Vigilando src/ … (Ctrl+C para salir)')
    let timer = null
    const rebuild = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          const r = build()
          fs.writeFileSync(OUTPUT, r.out, 'utf8')
          console.log(`   ↻ recompilado (${new Date().toLocaleTimeString('es')})`)
        } catch (e) { console.error('   ✗ error:', e.message) }
      }, 120)
    }
    for (const dir of [path.join(SRC, 'pages'), path.join(SRC, 'server')]) {
      fs.watch(dir, rebuild)
    }
  }
}

main()
