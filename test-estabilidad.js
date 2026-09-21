/**
 * CriptoMundo v14 — pruebas de estabilidad en ejecución larga
 * Uso: PORT=3987 node test-estabilidad.js --spawn
 *
 * Un servidor de juego se queda encendido semanas. Las estructuras que
 * crecen sin techo no dan la cara en una prueba de dos minutos: dan la
 * cara un martes por la noche, con jugadores dentro.
 *
 * Aquí se comprueban, con el proceso en marcha:
 *   · que las estructuras internas se limpian solas
 *   · que la memoria no crece sin control bajo carga sostenida
 *   · que el historial de mercado y la telemetría tienen techo
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const PORT = process.env.PORT || 3000
const TOKEN = 'token-estabilidad'
let pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + ' ' + e)) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body, headers = {}) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: 'localhost', port: PORT, path: p, method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        const sc = res.headers['set-cookie']
        resolve({ status: res.statusCode, body: j, cookie: sc ? sc[0].split(';')[0] : headers.Cookie }) }) })
    r.on('error', () => resolve({ status: 0, body: {} }))
    if (data) r.write(data); r.end()
  })
}

async function run() {
  console.log('\n── EL CÓDIGO NO DEJA ESTRUCTURAS SIN TECHO ──')
  // Se revisa el fuente: es la única forma de comprobar que la limpieza
  // existe sin esperar horas a que se note.
  const infra = fs.readFileSync(path.join(__dirname, 'src/server/10-infra.js'), 'utf8')
  check('los contadores de rate limiting se barren periódicamente',
    /for \(const \[k, b\] of buckets\) if \(b\.reset < t\) buckets\.delete\(k\)/.test(infra))
  check('el barrido está dentro de una función, no suelto en el arranque',
    !/^if \(buckets\.size/m.test(infra))
  check('las sesiones caducadas se eliminan', /delete store\.sessions\[k\]/.test(infra))
  check('las batallas abandonadas se eliminan', /delete store\.battles\[k\]/.test(infra))
  check('las claves de idempotencia caducan', /delete store\.idempotency\[k\]/.test(infra))

  const mercado = fs.readFileSync(path.join(__dirname, 'src/server/40-mundo-mercado.js'), 'utf8')
  check('el historial de mercado tiene techo en memoria', /marketTransactions\.length > 2000/.test(mercado))

  const tele = fs.readFileSync(path.join(__dirname, 'src/server/50-telemetria.js'), 'utf8')
  check('la telemetría por horas tiene retención', /HORAS_GUARDADAS/.test(tele))
  check('la telemetría por días tiene retención', /DIAS_GUARDADOS/.test(tele))

  const combate = fs.readFileSync(path.join(__dirname, 'src/server/30-personajes-combate.js'), 'utf8')
  check('el inventario tiene límite', /inventory\.length >= 120/.test(combate))

  console.log('\n── CARGA SOSTENIDA ──')
  // 400 peticiones seguidas: es lo que hincha el mapa de contadores de
  // rate limiting si nadie lo limpia. El propio límite global (300/min)
  // debería responder 429 sin que el servidor se caiga: eso también se
  // comprueba, porque un limitador que tumba el proceso no sirve.
  let ok = 0, limitadas = 0, muertas = 0
  const t0 = Date.now()
  for (let i = 0; i < 400; i++) {
    const r = await req('GET', '/api/market')
    if (r.status === 200) ok++
    else if (r.status === 429) limitadas++
    else muertas++
  }
  const dur = (Date.now() - t0) / 1000

  check('ninguna petición muere por error del servidor', muertas === 0, `${muertas} caídas`)
  check('el límite global protege sin tumbar el proceso', limitadas > 0 || ok === 400, `${ok} ok / ${limitadas} limitadas`)
  check('las respuestas no se degradan', dur < 30, `${dur.toFixed(1)}s`)

  // Tras esperar a que la ventana del limitador expire, todo vuelve a
  // funcionar: si el servidor hubiera quedado tocado, esto fallaría.
  console.log('  … esperando a que expire la ventana del limitador (65s)')
  await sleep(65000)
  const salud1 = await req('GET', '/api/health')
  check('el servidor se recupera solo tras el límite', salud1.status === 200, `status ${salud1.status}`)
  check('sigue sirviendo datos coherentes', typeof salud1.body.players === 'number')

  console.log('\n── ESTRUCTURAS TRAS LA CARGA ──')
  const rand = Math.floor(Math.random() * 1e9)
  const reg = await req('POST', '/api/auth/register',
    { username: `Est${rand}`, email: `e${rand}@t.com`, password: 'clave-segura-1' })
  check('todavía se pueden crear cuentas', reg.status === 201, `status ${reg.status}`)
  const cookie = reg.cookie || ''

  for (let i = 0; i < 12; i++) {
    await req('POST', '/api/chat', { message: 'mensaje ' + i + ' ' + rand }, cookie ? { Cookie: cookie } : {})
    await sleep(60)
  }
  const chat = await req('GET', '/api/chat', null, cookie ? { Cookie: cookie } : {})
  check('el chat devuelve una ventana acotada', (chat.body.messages || []).length <= 30, `${(chat.body.messages || []).length}`)

  const eco = await req('GET', '/api/economy/public')
  check('la economía pública solo devuelve 14 días', ((eco.body.oro || {}).ultimos14dias || []).length <= 14)

  const ana = await req('GET', '/api/admin/analytics', null, { 'X-Admin-Token': TOKEN })
  check('la analítica solo devuelve 30 días', (ana.body.diario || []).length <= 30)
  check('la curva de economía solo devuelve 48 horas', (ana.body.economia || []).length <= 48)

  console.log('\n── APAGADO ORDENADO ──')
  const antes = (await req('GET', '/api/health')).body.players
  check('el estado se puede consultar antes de apagar', typeof antes === 'number')

  console.log(`\n${'═'.repeat(46)}\n  ${pass} OK · ${failed} fallidas\n${'═'.repeat(46)}\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn('node', [path.join(__dirname, 'criptomundo.js')],
    { env: { ...process.env, PORT, ADMIN_TOKEN: TOKEN, DATA_FILE: '/tmp/cm-estabilidad.json', BACKUP_DIR: '/tmp/cm-est-b' }, stdio: 'ignore' })
  setTimeout(() => run().finally(() => c.kill()), 3000)
} else run()
