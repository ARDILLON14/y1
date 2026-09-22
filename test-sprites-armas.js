/**
 * CriptoMundo — la animación de arma que nadie había probado nunca
 * Uso:  PORT=3887 node test-sprites-armas.js --spawn
 *
 * POR QUÉ EXISTE
 * `tiraDe()` busca tiras de animación en assets/items/anim/<id>.png y el
 * código dice, con estas palabras: "Añadir la animación será copiar un
 * archivo, no tocar el renderer". Esa carpeta NO EXISTE. Así que ese
 * camino jamás se ha ejecutado con un archivo de verdad: si tuviera un
 * fallo, nadie lo sabría hasta que alguien dibujara la primera animación
 * y se encontrara con que no aparece.
 *
 * Esta prueba no dibuja arte. Fabrica un PNG válido con la forma que el
 * renderer espera —cuadros cuadrados en fila—, lo deja en una carpeta de
 * assets aparte, arranca el servidor apuntando ahí y comprueba que el
 * arma lo anuncia con los cuadros bien contados y que el archivo se
 * sirve. Y comprueba lo de al lado: que un arma SIN tira sigue cayendo
 * al gesto calculado en vez de romperse.
 */
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3887)
let cookie = '', pass = 0, failed = 0, hijo = null
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

// ── Un PNG de verdad, hecho a mano ─────────────────────────────────
// Node no trae encoder de imágenes, pero sí zlib, y un PNG sin filtros
// es poco más que las filas en crudo comprimidas. Hace falta que sea un
// PNG DE VERDAD porque el servidor lee el ancho y el alto del propio
// archivo: con un fichero inventado no se probaría nada.
const CRC_TABLA = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = CRC_TABLA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function trozo(tipo, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}
function png(ancho, alto) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0   // 8 bits, RGBA
  const fila = ancho * 4 + 1
  const crudo = Buffer.alloc(fila * alto)
  for (let y = 0; y < alto; y++) {
    crudo[y * fila] = 0                       // sin filtro
    for (let x = 0; x < ancho; x++) {
      const o = y * fila + 1 + x * 4
      crudo[o] = (x * 3) & 255; crudo[o + 1] = (y * 5) & 255; crudo[o + 2] = 200; crudo[o + 3] = 255
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(crudo)),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      const trozos = []
      res.on('data', c => trozos.push(c))
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        const buf = Buffer.concat(trozos)
        let j = {}; try { j = JSON.parse(buf.toString('utf8')) } catch {}
        resolve({ status: res.statusCode, body: j, raw: buf.toString('utf8'), bytes: buf, headers: res.headers })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '', bytes: Buffer.alloc(0), headers: {} }))
    if (data) r.write(data)
    r.end()
  })
}

// Carpeta de assets aparte: enlaces a lo real y una copia de `items`
// donde sí se puede escribir. Así no se toca nada del repositorio.
const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-assets-'))
const REAL = path.join(__dirname, 'assets')
const CUADROS = 4, LADO = 48
const ARMA = 'espada_hierro'
const ARMA_TORCIDA = 'iron_axe'

function prepararAssets() {
  for (const d of fs.readdirSync(REAL)) {
    if (d === 'items') continue
    fs.symlinkSync(path.join(REAL, d), path.join(BASE, d))
  }
  fs.mkdirSync(path.join(BASE, 'items', 'anim'), { recursive: true })
  for (const f of fs.readdirSync(path.join(REAL, 'items'))) {
    if (f === 'anim') continue
    fs.symlinkSync(path.join(REAL, 'items', f), path.join(BASE, 'items', f))
  }
  fs.writeFileSync(path.join(BASE, 'items', 'anim', ARMA + '.png'), png(LADO * CUADROS, LADO))
  // Y una tira que NO cumple la convención, para comprobar que se
  // rechaza en vez de dibujarse mal. 150×70 no son ni dos cuadros ni
  // tres: la división no es exacta.
  //
  // (Mi primer intento aquí fue 140×70, y estaba mal: eso SÍ son dos
  // cuadros de 70 y la tira es perfectamente válida. La comprobación lo
  // dijo en rojo, que es para lo que está.)
  fs.writeFileSync(path.join(BASE, 'items', 'anim', ARMA_TORCIDA + '.png'), png(150, 70))
}

async function run() {
  console.log('\n── EL SERVIDOR ENCUENTRA LA TIRA ──')
  const u = 'spr' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const cat = await req('GET', '/api/arena')
  check('el catálogo de armas responde', cat.status === 200 && (cat.body.armas || []).length > 0, String(cat.status))
  const armas = cat.body.armas || []
  const conTira = armas.find(a => a.id === ARMA)
  check('el arma de la prueba está en el catálogo', !!conTira, armas.map(a => a.id).join(',').slice(0, 120))
  check('y anuncia su tira de animación', !!(conTira && conTira.tira), JSON.stringify((conTira || {}).tira))
  check('con los cuadros contados del propio archivo',
    conTira && conTira.tira && conTira.tira.cuadros === CUADROS,
    `${(conTira || {}).tira && conTira.tira.cuadros} esperados ${CUADROS}`)
  check('y el alto del propio archivo',
    conTira && conTira.tira && conTira.tira.alto === LADO,
    `${(conTira || {}).tira && conTira.tira.alto} esperados ${LADO}`)
  check('la ruta apunta a donde está el archivo',
    conTira && conTira.tira && conTira.tira.url === '/assets/items/anim/' + ARMA + '.png',
    (conTira || {}).tira && conTira.tira.url)

  console.log('\n── Y UN ARMA SIN TIRA SIGUE FUNCIONANDO ──')
  const sinTira = armas.find(a => a.id !== ARMA && a.id !== ARMA_TORCIDA && !a.tira)
  check('hay armas sin tira, que es lo normal hoy', !!sinTira, armas.filter(a => a.tira).map(a => a.id).join(','))
  check('no se inventan una tira vacía', !sinTira || sinTira.tira === null, JSON.stringify((sinTira || {}).tira))
  check('pero sí traen gesto calculado, que es el respaldo',
    !!(sinTira && sinTira.gesto), (sinTira || {}).gesto)

  console.log('\n── UNA TIRA QUE NO CUMPLE LA CONVENCIÓN SE RECHAZA ──')
  // 150×70 no es un número entero de cuadros cuadrados. Adivinar se ve
  // como medio arma recortada y no hay forma de saber por qué. Mejor no
  // animarla —que es lo que pasa hoy sin archivo— y decirlo por consola.
  const torcida = armas.find(a => a.id === ARMA_TORCIDA)
  check('el arma de la tira torcida está en el catálogo', !!torcida, ARMA_TORCIDA)
  check('no se acepta una tira de cuadros no cuadrados',
    !!torcida && !torcida.tira, JSON.stringify((torcida || {}).tira))
  check('y se queda con el gesto calculado', !!(torcida && torcida.gesto), (torcida || {}).gesto)

  console.log('\n── EL ARCHIVO SE SIRVE DE VERDAD ──')
  const img = await req('GET', '/assets/items/anim/' + ARMA + '.png')
  check('el PNG se descarga', img.status === 200, String(img.status))
  check('con el tipo correcto', /image\/png/.test(img.headers['content-type'] || ''), img.headers['content-type'])
  check('y es el archivo entero', img.bytes.length > 100 && img.bytes.readUInt32BE(0) === 0x89504E47,
    img.bytes.length + ' bytes')
  check('con las medidas que declara el servidor',
    img.bytes.readUInt32BE(16) === LADO * CUADROS && img.bytes.readUInt32BE(20) === LADO,
    img.bytes.readUInt32BE(16) + 'x' + img.bytes.readUInt32BE(20))

  console.log('\n── LA TIRA LLEGA A LA PARTIDA, NO SOLO AL CATÁLOGO ──')
  // El catálogo es una cosa y lo que ve el renderer durante el combate
  // es otra. Si la tira se quedara en el catálogo, el arma se seguiría
  // dibujando sin animar y nadie lo notaría desde aquí.
  const inv = (await req('GET', '/api/inventory')).body.inventory || []
  let mia = inv.find(i => i.itemId === ARMA)
  if (!mia) {
    await req('POST', '/api/dev/dar', { itemId: ARMA, quantity: 1 })
    mia = ((await req('GET', '/api/inventory')).body.inventory || []).find(i => i.itemId === ARMA)
  }
  check('se consigue el arma', !!mia, inv.map(i => i.itemId).join(',').slice(0, 120))
  if (mia) {
    await req('POST', '/api/player/equip', { uid: mia.uid })
    const ini = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
    check('empieza el combate con esa arma', ini.status === 200, ini.raw.slice(0, 90))
    const s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
    const vis = ((s.body.estado || {}).jugador || {}).armaVis || {}
    check('la partida manda el arma equipada', vis.id === ARMA, vis.id)
    check('y manda su tira, no solo el nombre', !!vis.tira && vis.tira.cuadros === CUADROS,
      JSON.stringify(vis.tira))
    await req('POST', '/api/arena/abandon')
  }

  console.log('\n── LA PANTALLA SABE DIBUJARLA ──')
  const pagina = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-arena.js'), 'utf8')
  check('el renderer prefiere la tira a la imagen fija', /var tira = w\.tira && sprite\(w\.tira\.url\)/.test(pagina))
  check('recorta cuadros cuadrados en fila', /drawImage\(tira, i \* alto, 0, alto, alto/.test(pagina))
  check('y el cuadro lo elige el servidor, no la pantalla', /a\.f \|\| 0/.test(pagina))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

function limpiar() {
  try { fs.rmSync(BASE, { recursive: true, force: true }) } catch {}
  try { hijo && hijo.kill() } catch {}
}

if (process.argv.includes('--spawn')) {
  prepararAssets()
  hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test', ASSETS_DIR: BASE,
      DATA_FILE: '/tmp/cm-test-sprites.json', BACKUP_DIR: '/tmp/cm-sprites-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', limpiar)
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 2000)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
