/**
 * CriptoMundo v17 — pruebas del sistema de avisos
 * Uso: PORT=3994 node test-avisos.js --spawn
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
const TOKEN = 'token-avisos'
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(method, p, body, headers = {}) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = Object.assign({ 'Content-Type': 'application/json' }, headers)
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : headers.Cookie }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data)
    r.end()
  })
}

async function run() {
  const rand = Math.floor(Math.random() * 1e9)

  console.log('\n── ENVIAR ──')
  let r = await req('POST', '/api/feedback', { tipo: 'fallo', texto: 'el mercado se queda cargando', pagina: '/criptomundo-mercado.html' })
  check('se puede avisar sin haber iniciado sesión', r.status === 201, `status ${r.status}`)

  r = await req('POST', '/api/feedback', { texto: 'x' })
  check('un texto vacío se rechaza', r.status === 400)

  const reg = await req('POST', '/api/auth/register', { username: `Av${rand}`, email: `a${rand}@t.com`, password: 'clave-segura-1' })
  r = await req('POST', '/api/feedback',
    { tipo: 'idea', texto: 'estaría bien poder ver el mapa completo', pagina: '/criptomundo-mundo2d.html', pantalla: '390x844' },
    { Cookie: reg.cookie })
  check('con sesión también', r.status === 201)

  r = await req('POST', '/api/feedback', { tipo: 'inventado', texto: 'probando un tipo que no existe' })
  check('un tipo desconocido no rompe nada', r.status === 201)

  r = await req('POST', '/api/feedback', { tipo: 'fallo', texto: '<script>alert(1)</script> roto' })
  check('el texto se escapa', r.status === 201)

  console.log('\n── CONSULTAR ──')
  r = await req('GET', '/api/admin/feedback')
  check('el listado exige ADMIN_TOKEN', r.status === 403)

  r = await req('GET', '/api/admin/feedback', null, { 'X-Admin-Token': TOKEN })
  const d = r.body
  check('se listan los avisos', d.total >= 4, `${d.total}`)
  check('se agrupan por tipo', !!d.porTipo.fallo && !!d.porTipo.idea)
  check('el tipo desconocido cae en "otro"', !!d.porTipo.otro)

  const conXss = d.avisos.find(a => /roto/.test(a.texto))
  check('el XSS quedó escapado', conXss && !conXss.texto.includes('<script'), conXss && conXss.texto)

  const conSesion = d.avisos.find(a => a.jugador)
  check('el aviso guarda quién lo envió', !!conSesion && conSesion.jugador.startsWith('Av'))
  check('guarda el nivel del personaje', !!conSesion && typeof conSesion.nivel === 'number')
  check('guarda la página donde ocurrió', !!conSesion && conSesion.pagina.includes('mundo2d'))
  check('guarda la versión del juego', !!conSesion && /^\d+\./.test(conSesion.version))
  check('guarda el tamaño de pantalla', !!conSesion && conSesion.pantalla === '390x844')
  check('los más recientes van primero', new Date(d.avisos[0].at) >= new Date(d.avisos[d.avisos.length - 1].at))

  console.log('\n── RESOLVER ──')
  const uno = d.avisos[0]
  r = await req('POST', '/api/admin/feedback', { id: uno.id, resuelto: true }, { 'X-Admin-Token': TOKEN })
  check('se marca como resuelto', r.status === 200 && r.body.aviso.resuelto === true)

  r = await req('GET', '/api/admin/feedback', null, { 'X-Admin-Token': TOKEN })
  check('el contador de pendientes baja', r.body.sinResolver === r.body.total - 1, `${r.body.sinResolver}/${r.body.total}`)

  r = await req('POST', '/api/admin/feedback', { id: 'fb_inventado', resuelto: true }, { 'X-Admin-Token': TOKEN })
  check('un id inexistente se rechaza', r.status === 404)

  r = await req('POST', '/api/admin/feedback', { id: uno.id, resuelto: false }, { 'X-Admin-Token': TOKEN })
  check('se puede reabrir', r.status === 200 && r.body.aviso.resuelto === false)

  console.log('\n── LÍMITE ──')
  let limitado = false
  for (let i = 0; i < 14; i++) {
    const rr = await req('POST', '/api/feedback', { texto: 'spam de avisos número ' + i })
    if (rr.status === 429) { limitado = true; break }
  }
  check('hay límite de avisos por IP', limitado)

  console.log('\n── INTERFAZ ──')
  const paginas = ['', 'criptomundo-combat.html', 'criptomundo-mercado.html', 'criptomundo-mundo2d.html']
  const cuerpos = {}
  for (const p of paginas) {
    cuerpos[p || 'index'] = await new Promise(res => http.get(`http://localhost:${PORT}/${p}`, x => {
      let o = ''; x.on('data', c => o += c); x.on('end', () => res(o))
    }))
  }
  const sinBoton = Object.entries(cuerpos).filter(([, b]) => !b.includes('btn-aviso')).map(([k]) => k)
  check('el botón está en las páginas de juego', sinBoton.length === 0, sinBoton.join(', '))

  const admin = await new Promise(res => http.get(`http://localhost:${PORT}/admin.html`, x => {
    let o = ''; x.on('data', c => o += c); x.on('end', () => res(o))
  }))
  check('el panel de administración NO lleva el botón', !admin.includes('btn-aviso'))
  check('el panel muestra la lista de avisos', admin.includes('avisos-lista'))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, ADMIN_TOKEN: TOKEN, DATA_FILE: '/tmp/cm-avisos.json', BACKUP_DIR: '/tmp/cm-avisos-b' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
