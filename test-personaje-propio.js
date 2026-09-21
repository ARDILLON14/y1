/**
 * CriptoMundo v23 — pruebas de "sube tu personaje"
 * Uso: PORT=3470 node test-personaje-propio.js --spawn
 *
 * Se generan PNG de verdad (a mano, con zlib) para probar los casos
 * buenos y los malos: sin transparencia, no cuadrada, demasiado
 * pequeña, demasiado grande, un JPEG disfrazado de PNG y basura.
 */
const http = require('http')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data)
    r.end()
  })
}

// ── Generador de PNG mínimo (sin dependencias) ─────────────────────
function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = c ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function trozo(tipo, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([len, cuerpo, crc])
}
function png(ancho, alto, tipoColor) {
  const canales = tipoColor === 6 ? 4 : 3
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8; ihdr[9] = tipoColor; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const filas = []
  for (let y = 0; y < alto; y++) {
    const fila = Buffer.alloc(1 + ancho * canales)
    for (let x = 0; x < ancho; x++) {
      const o = 1 + x * canales
      fila[o] = 120; fila[o + 1] = 90; fila[o + 2] = 60
      if (canales === 4) fila[o + 3] = 255
    }
    filas.push(fila)
  }
  const idat = zlib.deflateSync(Buffer.concat(filas))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr), trozo('IDAT', idat), trozo('IEND', Buffer.alloc(0)),
  ])
}
const comoDataUrl = buf => 'data:image/png;base64,' + buf.toString('base64')

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  await req('POST', '/api/auth/register', { username: `Sub${rand}`, email: `s${rand}@t.com`, password: 'clave-segura-1' })

  console.log('\n── RECHAZOS ──')
  let r = await req('POST', '/api/character/upload', {})
  check('sin imagen se rechaza', r.status === 400)

  r = await req('POST', '/api/character/upload', { imagen: 'data:image/png;base64,bm8gc295IHVuIHBuZw==' })
  check('basura con cabecera falsa se rechaza', r.status === 400)

  const jpegFalso = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)])
  r = await req('POST', '/api/character/upload', { imagen: 'data:image/png;base64,' + jpegFalso.toString('base64') })
  check('un JPEG renombrado a PNG se rechaza', r.status === 400 && /PNG/.test(r.body.error))

  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(256, 256, 2)) })
  check('sin transparencia se rechaza', r.status === 400 && /transparencia/i.test(r.body.error), r.body.error)

  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(256, 128, 6)) })
  check('no cuadrada se rechaza', r.status === 400 && /cuadrada/i.test(r.body.error), r.body.error)

  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(16, 16, 6)) })
  check('demasiado pequeña se rechaza', r.status === 400 && /nimo/i.test(r.body.error), r.body.error)

  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(1024, 1024, 6)) })
  check('demasiado grande se rechaza', r.status === 400 || r.status === 413, `status ${r.status}`)

  r = await req('POST', '/api/character/upload', { imagen: 'data:text/html;base64,PHNjcmlwdD4=' })
  check('otro tipo de dato se rechaza', r.status === 400)

  const antes = (await req('GET', '/api/player')).body.character.appearance.skinId
  check('tras los rechazos el aspecto sigue intacto', antes !== 'propio', antes)

  console.log('\n── SUBIDA BUENA ──')
  const valida = png(256, 256, 6)
  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(valida) })
  check('un PNG cuadrado con alfa se acepta', r.status === 200, JSON.stringify(r.body).slice(0, 90))
  check('devuelve la skin lista para usar', r.body.personaje && r.body.personaje.id === 'propio')
  const url = r.body.personaje.image
  check('la imagen se sirve por URL propia', /^\/assets\/propios\//.test(url))

  const bajada = await new Promise(res => http.get(`http://localhost:${PORT}${url}`, x => {
    let len = 0; x.on('data', c => len += c.length); x.on('end', () => res({ status: x.statusCode, tipo: x.headers['content-type'], len }))
  }))
  check('la imagen subida se descarga igual', bajada.status === 200 && bajada.tipo === 'image/png' && bajada.len === valida.length,
    `${bajada.len} vs ${valida.length}`)

  const per = (await req('GET', '/api/player')).body.character
  check('el personaje pasa a usarla', per.appearance.skinId === 'propio')

  const skins = (await req('GET', '/api/skins')).body.skins
  check('aparece en el catálogo como una skin más', skins[0].id === 'propio' && skins[0].unlocked === true)
  check('se puede usar en el mapa (va recortada en círculo)', skins[0].usableEnMapa === true)

  console.log('\n── SUSTITUIR Y QUITAR ──')
  const dir = path.join(__dirname, 'assets', 'propios')
  const antesN = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(200, 200, 6)) })
  check('subir otra la sustituye', r.status === 200)
  const despuesN = fs.readdirSync(dir).length
  check('no se acumulan archivos por jugador', despuesN <= antesN, `${antesN} → ${despuesN}`)

  r = await req('DELETE', '/api/character/upload')
  check('se puede quitar', r.status === 200)
  check('al quitarla vuelve a una skin normal', r.body.appearance.skinId !== 'propio')
  r = await req('DELETE', '/api/character/upload')
  check('quitar dos veces avisa', r.status === 404)

  const skins2 = (await req('GET', '/api/skins')).body.skins
  check('desaparece del catálogo', !skins2.some(s => s.id === 'propio'))

  console.log('\n── SEGURIDAD ──')
  cookie = ''
  r = await req('POST', '/api/character/upload', { imagen: comoDataUrl(png(64, 64, 6)) })
  check('sin sesión no se puede subir', r.status === 401)

  const fuera = await new Promise(res => http.get(`http://localhost:${PORT}/assets/propios/../../package.json`, x => res({ status: x.statusCode })))
  check('no se puede salir de la carpeta de subidas', fuera.status !== 200)

  console.log('\n── INTERFAZ ──')
  const perfil = await new Promise(res => http.get(`http://localhost:${PORT}/criptomundo-perfil.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el perfil tiene el botón de subir', /Subir mi personaje/.test(perfil))
  check('recorta en círculo antes de subir', /recortarEnCirculo/.test(perfil))
  check('limita el tamaño en el navegador', /MAX_ORIGINAL_MB/.test(perfil))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-subida.json', BACKUP_DIR: '/tmp/cm-subida-b' }, stdio: 'ignore' })
  // El servidor se mataba en un .finally() detrás de run(), y run()
  // termina en process.exit(): ese .finally() NO llega a ejecutarse
  // nunca, así que cada ejecución dejaba un servidor vivo con su
  // puerto ocupado. La siguiente no podía escuchar ahí, hablaba sin
  // saberlo con el servidor viejo —con las cuentas y los contadores de
  // la anterior— y fallaba por cosas que no tenían nada que ver.
  // 'exit' sí se dispara con process.exit().
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
