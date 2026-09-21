/**
 * CriptoMundo v7 — pruebas del sistema de invitaciones
 * Uso: PORT=3981 node test-invitaciones.js --spawn
 *
 * Arranca DOS servidores: uno con la beta abierta y otro cerrada, para
 * comprobar que activarla no rompe el registro normal.
 */
const http = require('http')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3000)     // abierto
const PORT_CERRADO = PORT + 1                      // con INVITE_ONLY=1
const TOKEN = 'token-de-prueba'
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }

function req(port, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}
const nuevo = () => 'Inv' + Math.floor(Math.random() * 1e9)

async function run() {
  console.log('\n── BETA ABIERTA (sin INVITE_ONLY) ──')
  let r = await req(PORT, 'GET', '/api/auth/mode')
  check('el servidor declara que el registro está abierto', r.body.inviteOnly === false)

  let u = nuevo()
  r = await req(PORT, 'POST', '/api/auth/register', { username: u, email: u + '@t.com', password: 'clave-segura-1' })
  check('se puede registrar sin código', r.status === 201)

  console.log('\n── BETA CERRADA (INVITE_ONLY=1) ──')
  r = await req(PORT_CERRADO, 'GET', '/api/auth/mode')
  check('el servidor declara que hace falta invitación', r.body.inviteOnly === true)

  u = nuevo()
  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: u, email: u + '@t.com', password: 'clave-segura-1' })
  check('sin código no se puede entrar', r.status === 403)

  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: u, email: u + '@t.com', password: 'clave-segura-1', invite: 'AAAAA-BBBBB' })
  check('un código inventado no vale', r.status === 403)

  console.log('\n── CREAR CÓDIGOS ──')
  r = await req(PORT_CERRADO, 'POST', '/api/admin/invites', { cantidad: 3, etiqueta: 'discord' })
  check('sin ADMIN_TOKEN no se pueden crear', r.status === 403)

  r = await req(PORT_CERRADO, 'POST', '/api/admin/invites', { cantidad: 3, etiqueta: 'discord' }, { 'X-Admin-Token': TOKEN })
  check('con ADMIN_TOKEN se crean', r.status === 201 && r.body.codigos.length === 3)
  const codigos = r.body.codigos
  check('los códigos no usan caracteres ambiguos', codigos.every(c => !/[01OI]/.test(c)), codigos.join(','))

  r = await req(PORT_CERRADO, 'POST', '/api/admin/invites', { cantidad: 9999, etiqueta: 'x'.repeat(200) }, { 'X-Admin-Token': TOKEN })
  check('la cantidad y la etiqueta se acotan', r.body.creados <= 200)

  console.log('\n── USO ──')
  u = nuevo()
  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: u, email: u + '@t.com', password: 'clave-segura-1', invite: codigos[0].toLowerCase() })
  check('el código funciona aunque se escriba en minúsculas', r.status === 201, JSON.stringify(r.body).slice(0, 80))

  const u2 = nuevo()
  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: u2, email: u2 + '@t.com', password: 'clave-segura-1', invite: codigos[0] })
  check('un código de un solo uso no se puede reutilizar', r.status === 403)

  // Un registro que falla por otro motivo no debe quemar el código
  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: 'x', email: 'malo', password: '123', invite: codigos[1] })
  check('un registro inválido se rechaza', r.status === 400)
  const u3 = nuevo()
  r = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: u3, email: u3 + '@t.com', password: 'clave-segura-1', invite: codigos[1] })
  check('ese código seguía intacto tras el fallo', r.status === 201)

  console.log('\n── CÓDIGOS DE VARIOS USOS ──')
  r = await req(PORT_CERRADO, 'POST', '/api/admin/invites', { cantidad: 1, etiqueta: 'prensa', maxUsos: 3 }, { 'X-Admin-Token': TOKEN })
  const multi = r.body.codigos[0]
  let ok = 0
  for (let i = 0; i < 4; i++) {
    const un = nuevo()
    const rr = await req(PORT_CERRADO, 'POST', '/api/auth/register', { username: un, email: un + '@t.com', password: 'clave-segura-1', invite: multi })
    if (rr.status === 201) ok++
  }
  check('un código de 3 usos admite exactamente 3', ok === 3, `admitió ${ok}`)

  console.log('\n── SEGUIMIENTO ──')
  r = await req(PORT_CERRADO, 'GET', '/api/admin/invites', null, { 'X-Admin-Token': TOKEN })
  check('el listado requiere token', (await req(PORT_CERRADO, 'GET', '/api/admin/invites')).status === 403)
  check('se sabe cuántos códigos hay y cuántos se usaron', r.body.total > 0 && r.body.usados > 0)
  check('se agrupan por etiqueta', !!r.body.porEtiqueta.discord && !!r.body.porEtiqueta.prensa)
  check('se registra quién usó cada código', r.body.invitaciones.some(i => i.usadoPor.length > 0))

  console.log('\n── INTERFAZ ──')
  const idx = await new Promise(res => http.get(`http://localhost:${PORT_CERRADO}/`, x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('el launcher tiene campo de invitación', /reg-invite/.test(idx))
  check('el launcher acepta el código por enlace', /invite=|\?invite/.test(idx) || /searchParams/.test(idx))

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const abierto = spawn('node', [__dirname + '/criptomundo.js'],
    { env: { ...process.env, PORT: String(PORT), DATA_FILE: '/tmp/cm-inv-abierto.json', BACKUP_DIR: '/tmp/cm-inv-b1' }, stdio: 'ignore' })
  const cerrado = spawn('node', [__dirname + '/criptomundo.js'],
    { env: { ...process.env, PORT: String(PORT_CERRADO), INVITE_ONLY: '1', ADMIN_TOKEN: TOKEN, DATA_FILE: '/tmp/cm-inv-cerrado.json', BACKUP_DIR: '/tmp/cm-inv-b2' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => { abierto.kill(); cerrado.kill() }), 3500)
} else run()
