/**
 * CriptoMundo v3.2 — pruebas de creador de personaje, skins y nombres únicos
 * Uso: PORT=3975 node test-personajes.js --spawn
 */
const http = require('http')
const { spawn } = require('child_process')
const PORT = process.env.PORT || 3000
let pass = 0, failed = 0

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, cookie ? { Cookie: cookie } : {}) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : cookie, raw: o, headers: res.headers }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

async function run() {
  const rand = Math.floor(Math.random() * 1e9)
  const name = `Heroe${rand}`

  console.log('\n── CATÁLOGO DE ASPECTOS ──')
  let r = await req('GET', '/api/skins')
  check('el catálogo de skins es público', r.status === 200 && (r.body.skins || []).length > 0)
  const skins = r.body.skins
  check('incluye los personajes ilustrados', skins.some(s => s.id === 'stone_pepe') && skins.some(s => s.id === 'holy_pepe'))
  check('incluye la Zarigüeya Laureada', skins.some(s => s.id === 'laurel_possum'))
  const possum = skins.find(s => s.id === 'laurel_possum')
  check('la zarigüeya trae animación de caminar', !!(possum && possum.sprites && possum.sprites.walk))
  check('la animación declara fotogramas y medidas', !!(possum.sprites.walk.frames >= 2 && possum.sprites.walk.ancho > 0 && possum.sprites.walk.alto > 0))
  check('la tira de animación tiene URL servible', possum.sprites.walk.url.startsWith('/assets/skins/'))
  check('las skins sin animación devuelven null', skins.find(s => s.id === 'aventurero').sprites === null)
  check('las skins ilustradas traen imagen', skins.find(s => s.id === 'holy_pepe').image.startsWith('/assets/skins/'))
  check('las skins traen retrato y avatar ligeros', !!skins.find(s => s.id === 'holy_pepe').portrait && !!skins.find(s => s.id === 'holy_pepe').avatar)
  check('las skins sin archivo caen al emoji', skins.find(s => s.id === 'aventurero').image === null)
  check('las skins ilustradas no son recoloreables', skins.find(s => s.id === 'stone_pepe').tint === false)
  check('las skins base sí son recoloreables', skins.find(s => s.id === 'aventurero').tint === true)

  const sizes = {}
  for (const v of ['full', 'portrait', 'avatar']) {
    sizes[v] = await new Promise(res => http.get(`http://localhost:${PORT}/assets/skins/holy_pepe_${v}.png`, x => {
      let len = 0; x.on('data', c => len += c.length); x.on('end', () => res({ status: x.statusCode, type: x.headers['content-type'], len }))
    }))
  }
  check('el PNG del personaje se sirve', sizes.full.status === 200 && sizes.full.type === 'image/png' && sizes.full.len > 1000)
  check('el avatar pesa mucho menos que la ilustración', sizes.avatar.len < sizes.full.len / 5, `${sizes.avatar.len} vs ${sizes.full.len}`)
  check('el avatar baja de 50 KB', sizes.avatar.len < 50 * 1024, `${Math.round(sizes.avatar.len / 1024)} KB`)

  const bad = await new Promise(res => http.get(`http://localhost:${PORT}/assets/../criptomundo-data.json`, x => res({ status: x.statusCode })))
  check('no se puede salir de la carpeta de assets', bad.status !== 200)

  console.log('\n── NOMBRES ÚNICOS ──')
  r = await req('GET', `/api/auth/check-name?username=${name}`)
  check('el nombre está libre antes de registrar', r.body.available === true)

  r = await req('GET', '/api/auth/check-name?username=ab')
  check('nombre demasiado corto rechazado', r.body.available === false)

  r = await req('POST', '/api/auth/register', { username: name, email: `h${rand}@t.com`, password: 'clave-segura-1', className: 'Guerrero', appearance: { skinId: 'holy_pepe' } })
  const cookie = r.cookie
  check('registro con clase y aspecto', r.status === 201, JSON.stringify(r.body).slice(0, 120))
  check('la clase elegida se aplica', r.body.character.class === 'Guerrero')
  check('el aspecto elegido se aplica', r.body.character.appearance.skinId === 'holy_pepe')

  r = await req('GET', `/api/auth/check-name?username=${name}`)
  check('el nombre deja de estar libre', r.body.available === false)

  r = await req('POST', '/api/auth/register', { username: name.toLowerCase(), email: `z${rand}@t.com`, password: 'clave-segura-1' })
  check('no se puede repetir nombre cambiando mayúsculas', r.status === 409)

  r = await req('POST', '/api/auth/register', { username: `Otro${rand}`, email: `h${rand}@t.com`, password: 'clave-segura-1' })
  check('no se puede repetir email', r.status === 409)

  console.log('\n── CAMBIO DE ASPECTO ──')
  r = await req('POST', '/api/character/appearance', { skinId: 'stone_pepe' }, cookie)
  check('cambiar de skin', r.status === 200 && r.body.appearance.skinId === 'stone_pepe')

  r = await req('POST', '/api/character/appearance', { skinId: 'godzilla' }, cookie)
  check('skin inexistente rechazada', r.status === 404)

  r = await req('POST', '/api/character/appearance', { skinId: 'aventurero', palette: { skin: '<script>alert(1)</script>', hair: '#123456' } }, cookie)
  check('color inválido se sustituye por el de la skin', r.body.appearance.palette.skin.startsWith('#'))
  check('color válido se conserva', r.body.appearance.palette.hair === '#123456')

  r = await req('POST', '/api/character/appearance', { skinId: 'stone_pepe', palette: { skin: '#ff0000' } }, cookie)
  check('las skins fijas ignoran el recoloreado', r.body.appearance.palette.skin !== '#ff0000')

  r = await req('POST', '/api/character/appearance', { skinId: 'aventurero' })
  check('cambiar aspecto requiere sesión', r.status === 401)

  r = await req('GET', '/api/player', null, cookie)
  check('el personaje expone su aspecto', !!r.body.character.appearance.skinId)

  const tira = await new Promise(res => http.get(`http://localhost:${PORT}${possum.sprites.walk.url}`, x => {
    let len = 0; x.on('data', c => len += c.length); x.on('end', () => res({ status: x.statusCode, len }))
  }))
  check('la tira de animación se sirve', tira.status === 200 && tira.len > 1000)

  r = await req('POST', '/api/character/appearance', { skinId: 'laurel_possum' }, cookie)
  check('se puede elegir la zarigüeya', r.status === 200 && r.body.appearance.skinId === 'laurel_possum')

  console.log('\n── INTERFAZ ──')
  const perfil = await new Promise(r2 => http.get(`http://localhost:${PORT}/criptomundo-perfil.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2(o)) }))
  check('el perfil permite cambiar de aspecto', /change-skin-btn/.test(perfil) && /applySkin/.test(perfil))
  const mundo = await new Promise(r2 => http.get(`http://localhost:${PORT}/criptomundo-mundo2d.html`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2(o)) }))
  check('el mapa usa la skin elegida', /cargarSkinMapa/.test(mundo))
  check('el mapa anima la caminata', /'andar'/.test(mundo))
  const idx = await new Promise(r2 => http.get(`http://localhost:${PORT}/`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r2(o)) }))
  check('el launcher tiene pantalla de creador', /screen-creator/.test(idx))
  check('el launcher comprueba el nombre en vivo', /check-name/.test(idx))
  check('el creador construye la lista desde la API', /api\/skins/.test(idx))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [__dirname + '/criptomundo.js'], { env: { ...process.env, PORT, DATA_FILE: '/tmp/cm-personajes-' + Date.now() + '.json' }, stdio: 'ignore' })
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
