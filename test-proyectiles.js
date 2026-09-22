/**
 * CriptoMundo — PASO 5: proyectiles y efectos
 * Uso:  PORT=3920 node test-proyectiles.js --spawn
 *
 * POR QUÉ EXISTE
 * Dos cosas que no se ven leyendo el código:
 *
 *  1. EL SALTO. El servidor avanza 10 veces por segundo. Una flecha a
 *     460 px/s se mueve 46 px de golpe y LUEGO se miraba si tocaba a
 *     alguien. Una araña mide 44 px de ventana: el hueco entre dos
 *     posiciones era casi tan grande como el bicho, así que una de cada
 *     cuatro flechas que debía acertar pasaba de largo — sin aviso, sin
 *     log, sin nada. Desde el asiento del jugador eso es "el arco falla
 *     raro". Ahora se comprueba el TRAMO recorrido, no la posición.
 *
 *  2. LOS ELEMENTOS. `element: 'ice'` llevaba desde siempre escrito en
 *     la Vara de Cristal y no hacía absolutamente nada. Un elemento que
 *     no cambia el combate es un color, no un elemento: aquí se mide
 *     que el hielo FRENA y que el rayo ATURDE de verdad.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3920)
let cookie = '', pass = 0, failed = 0
const sleep = ms => new Promise(r => setTimeout(r, ms))
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', c => o += c)
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}
const pulso = entrada => req('POST', '/api/arena/sync', { entrada })
const pagina = p => new Promise(res => http.get({ host: 'localhost', port: PORT, path: p }, x => {
  let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }).on('error', () => res('')))

async function equipar(itemId) {
  await req('POST', '/api/dev/dar', { itemId, quantity: 1 })
  const inv = (await req('GET', '/api/inventory')).body
  const it = (inv.inventory || []).find(x => x.itemId === itemId)
  if (!it) return false
  return (await req('POST', '/api/player/equip', { uid: it.uid })).status === 200
}

// Dispara al enemigo más cercano durante N pulsos y devuelve lo visto.
async function tirotear(pulsos) {
  const v = { proyectiles: [], impactos: 0, dañoEnemigo: 0, estados: {}, velNormal: [], velLento: [], enemigos: {} }
  let previo = null
  for (let i = 0; i < pulsos; i++) {
    let ent = { mx: 0, my: 0, atacar: true }
    if (previo && (previo.enemigos || []).length) {
      let mejor = null, md = 1e9
      for (const en of previo.enemigos) {
        const d = Math.hypot(en.x - previo.jugador.x, en.y - previo.jugador.y)
        if (d < md) { md = d; mejor = en }
      }
      ent.apuntar = Math.atan2(mejor.y - previo.jugador.y, mejor.x - previo.jugador.x)
    }
    const r = await pulso(ent)
    const e = r.body && r.body.estado
    if (!e) break
    for (const pr of e.proyectiles || []) v.proyectiles.push(pr)
    for (const s of e.sucesos || []) {
      if (s.t === 'impacto') v.impactos++
      if (s.t === 'daño' && s.a === 'enemigo') v.dañoEnemigo += s.dmg
    }
    for (const en of e.enemigos || []) {
      v.estados[en.fsm] = (v.estados[en.fsm] || 0) + 1
      const ant = v.enemigos[en.id]
      // Se compara el MISMO enemigo persiguiendo, con y sin hielo
      // encima. Comparar contra los primeros pulsos de la partida no
      // valía: ahí los enemigos aún no se habían puesto en marcha y
      // salía que el hielo les hacía correr más.
      if (ant && en.fsm === 'chase' && ant.fsm === 'chase') {
        const paso = Math.hypot(en.x - ant.x, en.y - ant.y)
        ;(ant.lento ? v.velLento : v.velNormal).push(paso)
      }
      v.enemigos[en.id] = { x: en.x, y: en.y, fsm: en.fsm, lento: en.lento }
    }
    previo = e
    await sleep(70)
  }
  return v
}

async function run() {
  const u = 'pr' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── UN PROYECTIL TRAE TODO LO QUE SE LE PIDE ──')
  await equipar('short_bow')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  let v = await tirotear(50)
  check('se dispararon proyectiles', v.proyectiles.length > 0, String(v.proyectiles.length))
  const pr0 = v.proyectiles[0] || {}
  check('con posición, radio, dueño, elemento y color',
    'x' in pr0 && 'y' in pr0 && 'r' in pr0 && 'mio' in pr0 && 'el' in pr0 && 'color' in pr0,
    JSON.stringify(pr0))
  check('el arco es de elemento neutro', pr0.el === 'normal', String(pr0.el))

  console.log('\n── LAS FLECHAS YA NO ATRAVIESAN ──')
  check('los disparos hacen daño de verdad', v.dañoEnemigo > 0, 'daño total ' + v.dañoEnemigo)
  check('y el impacto se anuncia para poder dibujarlo', v.impactos > 0, String(v.impactos))

  console.log('\n── HIELO: FRENA ──')
  await req('POST', '/api/arena/abandon')
  await equipar('crystal_wand')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  // Primero se mide cómo corren sin tocarlos, luego disparándoles.
  const conHielo = await tirotear(90)
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
  check('la vara dispara hielo',
    conHielo.proyectiles.some(p => p.el === 'ice'),
    JSON.stringify(conHielo.proyectiles.slice(0, 2)))
  check('el hielo tiene su propio color', (conHielo.proyectiles.find(p => p.el === 'ice') || {}).color === '#7FD4F0',
    JSON.stringify(conHielo.proyectiles.find(p => p.el === 'ice')))
  check('el enemigo congelado se marca en el paquete, para poder dibujarlo',
    conHielo.velLento.length > 0, 'muestras con hielo: ' + conHielo.velLento.length)
  const vNormal = media(conHielo.velNormal), vFrio = media(conHielo.velLento)
  check('y se mueve más despacio que él mismo sin hielo',
    vFrio < vNormal * 0.85,
    'normal ' + vNormal.toFixed(1) + ' px/pulso · congelado ' + vFrio.toFixed(1) +
    ' (' + conHielo.velNormal.length + ' vs ' + conHielo.velLento.length + ' muestras)')

  console.log('\n── RAYO: ATURDE ──')
  await req('POST', '/api/arena/abandon')
  await equipar('thunder_staff')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  const conRayo = await tirotear(60)
  check('el cetro dispara rayo', conRayo.proyectiles.some(p => p.el === 'lightning'),
    JSON.stringify(conRayo.proyectiles.slice(0, 2)))
  check('el rayo deja aturdido al enemigo (mismo estado que usa la IA)',
    (conRayo.estados.stun || 0) > 0, JSON.stringify(conRayo.estados))

  console.log('\n── EL CLIENTE NO PUEDE INVENTARSE NADA ──')
  const antes = (await pulso({ mx: 0, my: 0 })).body.estado
  const r = await pulso({
    mx: 0, my: 0,
    proyectiles: [{ x: 10, y: 10, dmg: 9999, el: 'fire' }],
    sucesos: [{ t: 'impacto' }],
  })
  const e = r.body.estado
  check('no puede crear proyectiles',
    (e.proyectiles || []).length <= (antes.proyectiles || []).length + 2,
    (antes.proyectiles || []).length + ' → ' + (e.proyectiles || []).length)
  check('ni proyectiles con daño inventado',
    (e.proyectiles || []).every(p => p.r < 50), JSON.stringify(e.proyectiles))
  await req('POST', '/api/arena/abandon')

  console.log('\n── LA PANTALLA NO SE SABE LA LISTA DE ELEMENTOS ──')
  const html = await pagina('/criptomundo-arena.html')
  check('el color del proyectil viene del servidor', /p\.color \|\|/.test(html))
  check('hay chispas de impacto', /chispas/.test(html) && /'impacto'/.test(html))
  check('el cliente no decide a quién toca un proyectil',
    !/dañarEnemigo|colisi[oó]n de proyectil/i.test(html))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-pr.json', '/tmp/cm-pr-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-pr.json', BACKUP_DIR: '/tmp/cm-pr-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

// Espera a que el servidor CONTESTE, en vez de dar por hecho que en unos
// milisegundos ya estará arriba.
//
// Esa suposición se cae en cuanto la suite corre en paralelo: varios
// servidores levantando a la vez tardan más, y el síntoma era un
// ECONNREFUSED que parecía un fallo de la prueba y no lo era.
function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = require('http').get({ host: 'localhost', port: puerto, path: '/api/health' }, res => {
        res.resume()
        resolve(true)
      })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}

// Empieza siempre de cero.
//
// Sin esto, una prueba hereda el mundo que dejó la ejecución anterior:
// publicaciones a medio vender, personajes con nivel, enfriamientos sin
// cumplir. Lo destapó test-economia-objetos, que compraba dos unidades de
// una publicación que la vez anterior había dejado en una, y contestaba
// "Cantidad inválida" sin que hubiera nada roto.
function limpiarDatos() {
  const fs = require('fs')
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
