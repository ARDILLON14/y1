/**
 * Revisa el JavaScript que el servidor manda REALMENTE al navegador.
 *
 * Por qué: los tests actuales comprueban el servidor y comprueban que la
 * página "contiene" ciertos textos. Ninguno comprueba que el script de la
 * página se pueda ejecutar. Un solo error de sintaxis deja la pantalla
 * entera muerta: no hay teclado, no hay socket, no hay dibujado. Desde el
 * asiento del jugador eso se ve exactamente como "no me puedo mover".
 */
const http = require('http')
const vm = require('vm')

const PORT = process.env.PORT || 3777
const PAGINAS = [
  '/', '/index.html',
  '/criptomundo-mundo2d.html',
  '/criptomundo-combat.html', '/criptomundo-arena.html',
  '/criptomundo-huerto.html', '/criptomundo-crafting.html',
  '/criptomundo-mercado.html', '/criptomundo-misiones.html',
  '/criptomundo-mazmorras-pvp.html', '/criptomundo-casas.html',
  '/criptomundo-guilds.html', '/criptomundo-hub.html',
  '/criptomundo-perfil.html', '/economia.html', '/admin.html',
]

function get(p) {
  return new Promise(resolve => {
    http.get({ host: 'localhost', port: PORT, path: p }, res => {
      let o = ''
      res.on('data', c => o += c)
      res.on('end', () => resolve({ status: res.statusCode, body: o }))
    }).on('error', () => resolve({ status: 0, body: '' }))
  })
}

// Extrae los <script> sin src, con la línea del documento en la que empiezan
function scripts(html) {
  const out = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    out.push({ code: m[1], linea: html.slice(0, m.index).split('\n').length })
  }
  return out
}

// Funciones citadas en onclick="..." / onchange="..." dentro del HTML
function manejadoresInline(html) {
  const nombres = new Set()
  const re = /\bon(?:click|change|input|submit|keyup|keydown|mousedown)\s*=\s*"([^"]*)"/gi
  let m
  while ((m = re.exec(html))) {
    const f = /([A-Za-z_$][\w$]*)\s*\(/.exec(m[1])
    // `if`, `for`, `return`... no son funciones: son palabras del
    // lenguaje que también van seguidas de un paréntesis. Un
    // onclick="if (x) hazAlgo()" hacía que el revisor avisara de una
    // función llamada "if" que, efectivamente, no existe en ninguna
    // parte.
    const PALABRAS = ['if', 'for', 'while', 'switch', 'return', 'typeof',
                      'new', 'delete', 'void', 'do', 'catch', 'function']
    if (f && !PALABRAS.includes(f[1])) nombres.add(f[1])
  }
  return nombres
}

async function main() {
  let fallos = 0, revisadas = 0
  // Las páginas partidas en dos (`x-2.js`) no se sirven por separado:
  // se concatenan dentro de `x.html`. Pedirlas devuelve 404 y parece un
  // fallo que no lo es.
  for (const p of PAGINAS) {
    const r = await get(p)
    if (r.status !== 200) { console.log(`⚠️  ${p} → HTTP ${r.status}`); continue }
    revisadas++
    const bloques = scripts(r.body)
    const declaradas = new Set()
    let malo = false

    bloques.forEach((b, i) => {
      try {
        new vm.Script(b.code, { filename: `${p}#script${i + 1}` })
      } catch (e) {
        malo = true; fallos++
        console.log(`\n❌ ${p} — script #${i + 1} (empieza en la línea ~${b.linea}) NO COMPILA`)
        console.log(`   ${e.message}`)
        const ln = /:(\d+)$/.exec((e.stack || '').split('\n')[0] || '')
        const lineas = b.code.split('\n')
        const idx = ln ? Number(ln[1]) - 1 : -1
        if (idx >= 0) {
          for (let k = Math.max(0, idx - 2); k <= Math.min(lineas.length - 1, idx + 2); k++) {
            console.log(`   ${k === idx ? '→' : ' '} ${b.linea + k}| ${lineas[k].slice(0, 150)}`)
          }
        }
      }
      // función declarada arriba del todo: function nombre( ...
      const re = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
      let m
      while ((m = re.exec(b.code))) declaradas.add(m[1])
      const re2 = /(?:^|\n)\s*(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g
      while ((m = re2.exec(b.code))) declaradas.add(m[1])
      // `window.nombre = function ...`, que es como se declaran las que
      // tienen que ser visibles desde un onclick del HTML.
      //
      // Sin esta línea el revisor daba por huérfanas abrirAviso,
      // cerrarAviso, enviarAviso y tipoAviso en DIEZ pantallas, y
      // pickSellItem en el mercado. Ninguna lo estaba: todas se asignan
      // a window. Un revisor que grita en diez pantallas sanas enseña a
      // ignorarlo, y entonces ya no sirve para la que sí esté rota.
      const re3 = /(?:^|\n|;)\s*window\.([A-Za-z_$][\w$]*)\s*=/g
      while ((m = re3.exec(b.code))) declaradas.add(m[1])
    })

    // onclick que llama a algo que no existe en ningún script de la página
    const usadas = manejadoresInline(r.body)
    const huerfanas = [...usadas].filter(n => !declaradas.has(n) && !['alert', 'confirm', 'history', 'window', 'location', 'event'].includes(n))
    if (huerfanas.length) {
      console.log(`\n⚠️  ${p} — onclick llama a funciones no definidas en la página: ${huerfanas.join(', ')}`)
    }

    if (!malo && !huerfanas.length) console.log(`✅ ${p} — ${bloques.length} script(s) compilan`)
  }
  console.log(`\n── ${revisadas} páginas revisadas · ${fallos} script(s) rotos ──`)
  if (!revisadas) {
    console.log('   ⚠️  No se ha podido leer NINGUNA página: no hay servidor en el')
    console.log('      puerto ' + PORT + '. Lanza el servidor o usa --spawn.')
  }
  process.exit(fallos || !revisadas ? 1 : 0)
}

// --spawn levanta el servidor y lo apaga al terminar, como hacen las
// demás pruebas. Antes había que acordarse de arrancarlo a mano, y si
// se olvidaba salía "0 páginas revisadas · 0 scripts rotos" — que se lee
// como aprobado y es exactamente lo contrario.
if (process.argv.includes('--spawn')) {
  const { spawn } = require('child_process')
  const path = require('path')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), DATA_FILE: '/tmp/cm-revisar-cliente.json', BACKUP_DIR: '/tmp/cm-rc-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => main().catch(e => { console.error(e); process.exit(1) }), 1800)
} else main()
