/**
 * CriptoMundo — pruebas del sistema de compilación
 * Uso: node test-build.js
 *
 * Comprueba que src/ y el archivo generado están sincronizados y que la
 * compilación es reproducible. Corre esto antes de publicar.
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

const ROOT = __dirname
const OUTPUT = path.join(ROOT, 'criptomundo.js')

function run(args) {
  try { return { ok: true, out: execFileSync('node', [path.join(ROOT, 'build.js'), ...args], { encoding: 'utf8' }) } }
  catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') } }
}

console.log('\n── ESTRUCTURA ──')
check('existe src/pages', fs.existsSync(path.join(ROOT, 'src/pages')))
check('existe src/server', fs.existsSync(path.join(ROOT, 'src/server')))
const pages = fs.readdirSync(path.join(ROOT, 'src/pages')).filter(f => f.endsWith('.js'))
const server = fs.readdirSync(path.join(ROOT, 'src/server')).filter(f => f.endsWith('.js'))
check('hay un módulo por página', pages.length >= 13, `${pages.length} archivos`)
check('el núcleo está troceado', server.length >= 6, `${server.length} archivos`)
// El umbral existe para que ningún archivo vuelva a ser inmanejable.
// Si uno se pasa, tócalo: probablemente mezcla dos cosas distintas.
const LIMITE_KB = 70
const gordos = pages.map(f => ['src/pages', f]).concat(server.map(f => ['src/server', f]))
  .filter(([dir, f]) => fs.statSync(path.join(ROOT, dir, f)).size > LIMITE_KB * 1024)
  .map(([, f]) => f)
check(`ningún módulo pasa de ${LIMITE_KB} KB`, gordos.length === 0, gordos.join(', '))

console.log('\n── COMPILACIÓN ──')
let r = run([])
check('build.js compila sin errores', r.ok, r.out)
check('informa de módulos y tamaño', /módulos/.test(r.out))

const first = fs.readFileSync(OUTPUT, 'utf8')
run([])
const second = fs.readFileSync(OUTPUT, 'utf8')
check('la compilación es reproducible', first === second)

r = run(['--check'])
check('--check detecta que está al día', r.ok, r.out)

console.log('\n── DETECCIÓN DE DESFASE ──')
const backup = fs.readFileSync(OUTPUT, 'utf8')
fs.writeFileSync(OUTPUT, backup + '\n// cambio manual\n', 'utf8')
r = run(['--check'])
check('--check detecta un archivo editado a mano', !r.ok)
fs.writeFileSync(OUTPUT, backup, 'utf8')
r = run(['--check'])
check('vuelve a estar al día tras restaurar', r.ok)

console.log('\n── SALIDA ──')
try {
  execFileSync('node', ['--check', OUTPUT])
  check('el archivo generado es JavaScript válido', true)
} catch (e) { check('el archivo generado es JavaScript válido', false, e.message) }

const built = fs.readFileSync(OUTPUT, 'utf8')
check('contiene las 13 páginas', (built.match(/PAGES\['/g) || []).length >= 13)
check('contiene el catálogo de skins', /const SKINS = \[/.test(built))
check('contiene el servidor HTTP', /http\.createServer/.test(built))
check('no quedan marcadores de conflicto', !/<<<<<<<|>>>>>>>/.test(built))

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const v = /const VERSION = '([^']+)'/.exec(built)
check('la versión del código coincide con package.json', !!v && v[1] === pkg.version, v ? `${v[1]} vs ${pkg.version}` : 'no encontrada')
check('el ejecutable se llama como toca', fs.existsSync(path.join(ROOT, 'criptomundo.js')))

console.log('\n── DOCUMENTACIÓN AL DÍA ──')
// Las guías se quedan obsoletas en silencio: nadie las ejecuta. Estas
// comprobaciones son baratas y evitan que alguien siga instrucciones
// que ya no funcionan.
const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md'))
  .map(f => [f, fs.readFileSync(path.join(ROOT, 'docs', f), 'utf8')])
  .concat([['README.md', fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')],
           ['CHANGELOG.md', fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8')]])

// Los CAMBIOS_* son registro histórico: se dejan como estaban
// CHANGELOG e historiales citan nombres antiguos a propósito: son
// registro de lo que pasó, no instrucciones que alguien vaya a seguir.
const vivos = docs.filter(([f]) => !/^CAMBIOS_|^HISTORIA_|^CHANGELOG/.test(f))

const conNombreViejo = vivos.filter(([, c]) => /criptomundo-v3\.js/.test(c)).map(([f]) => f)
check('ninguna guía usa el nombre antiguo del ejecutable', conNombreViejo.length === 0, conNombreViejo.join(', '))

// Cualquier archivo .js que una guía mande ejecutar debe existir
const inexistentes = []
for (const [f, c] of vivos) {
  for (const m of c.matchAll(/node ([a-z0-9\-]+\.js)/g)) {
    if (!fs.existsSync(path.join(ROOT, m[1]))) inexistentes.push(`${f} → ${m[1]}`)
  }
}
check('las guías no mandan ejecutar archivos que no existen', inexistentes.length === 0, inexistentes.join(', '))

// Y cualquier script de npm que citen debe estar declarado
const scripts = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts)
const npmFantasma = []
for (const [f, c] of vivos) {
  for (const m of c.matchAll(/npm run ([a-z\-]+)/g)) {
    if (!scripts.includes(m[1])) npmFantasma.push(`${f} → npm run ${m[1]}`)
  }
}
check('las guías no citan comandos npm inexistentes', npmFantasma.length === 0, npmFantasma.join(', '))

console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
process.exit(failed ? 1 : 0)
