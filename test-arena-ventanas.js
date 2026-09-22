/**
 * CriptoMundo — un golpe de la arena dura algo
 * Uso:  PORT=3977 node test-arena-ventanas.js --spawn
 *
 * QUÉ CAMBIÓ Y POR QUÉ SE PRUEBA
 *
 * El daño de la arena se aplicaba EN EL MISMO INSTANTE en que llegaba
 * la intención de atacar. Pulsabas y el enemigo perdía vida. Eso hacía
 * dos cosas malas a la vez:
 *
 *   · todas las armas se sentían igual. Un mandoble de 620 ms y una
 *     daga de 300 impactan los dos al instante; lo único distinto era
 *     cuánto tardabas en volver a pulsar.
 *   · no había nada que esquivar. Sin anticipación no hay ventana en la
 *     que apartarse.
 *
 * Ahora el golpe tiene anticipación, ventana activa y recuperación, y
 * los tres suman la cadencia del arma: el daño por segundo no se mueve.
 * Lo que se comprueba aquí es justo eso, porque es lo que distingue un
 * arreglo de un cambio de números:
 *
 *   1. el daño NO llega en el mismo paso en que se pulsa
 *   2. pero llega poco después, y el enemigo muere igual
 *   3. un arma lenta se anticipa más que una rápida
 *   4. un solo golpe no pega dos veces al mismo enemigo aunque su
 *      ventana activa abarque dos pasos del servidor
 */
const http = require('http'), path = require('path'), { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3977); let ck = ''
function req(m, p, body) {
  return new Promise(r => {
    const d = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d); if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => {
        if (x.headers['set-cookie']) ck = x.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ status: x.statusCode, body: j, raw: o })
      })
    })
    q.on('error', () => r({ status: 0, body: {} })); if (d) q.write(d); q.end()
  })
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  let pass = 0, fail = 0
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + '  → ' + e)) }

  const u = 'vt' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  // Pegarse al enemigo más cercano y atacar una sola vez, mirando paso
  // a paso qué llega y cuándo.
  async function pulso(entrada) { return req('POST', '/api/arena/sync', { entrada: entrada || {} }) }

  const ini = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  ok('empieza el combate', ini.status === 200, ini.raw.slice(0, 80))

  // Acercarse hasta tenerlo a tiro, sin atacar todavía.
  let s = await pulso({ mx: 0, my: 0 })
  let cerca = false
  for (let i = 0; i < 60 && !cerca; i++) {
    const e = s.body.estado
    if (!e || !(e.enemigos || []).length) break
    const j = e.jugador
    let mejor = null, md = 1e9
    for (const en of e.enemigos) {
      const d = Math.hypot(en.x - j.x, en.y - j.y)
      if (d < md) { md = d; mejor = en }
    }
    const ang = Math.atan2(mejor.y - j.y, mejor.x - j.x)
    cerca = md < 45
    await sleep(100)
    s = await pulso({ mx: cerca ? 0 : Math.cos(ang), my: cerca ? 0 : Math.sin(ang), apuntar: ang, atacar: false })
  }
  ok('se puede llegar hasta un enemigo', cerca)

  console.log('\n── EL GOLPE SE PREPARA ANTES DE TOCAR ──')
  // OJO CON EL RELOJ: el servidor simula en pasos fijos de 100 ms por
  // su cuenta, y cada paso vacía la lista de sucesos. El pulso HTTP no
  // provoca un paso: solo deja la intención y recoge lo que dejó el
  // último. Así que el gesto no sale en la misma respuesta en la que se
  // pide atacar, sino en la siguiente. Buscarlo ahí era la forma
  // equivocada de preguntarlo.
  await pulso({ mx: 0, my: 0, atacar: true, apuntar: (s.body.estado.jugador.mirando || 0) })

  let gesto = null, pasoDelGesto = -1, dañoVisto = 0, pasoDelDaño = -1
  for (let i = 0; i < 10; i++) {
    await sleep(100)
    const r = await pulso({ mx: 0, my: 0, atacar: false })
    const sucesos = (r.body.estado || {}).sucesos || []
    for (const x of sucesos) {
      if (x.t === 'gesto' && !gesto) { gesto = x; pasoDelGesto = i }
      if (x.t === 'daño' && x.a === 'enemigo' && pasoDelDaño < 0) { dañoVisto += x.dmg; pasoDelDaño = i }
    }
    if (gesto && pasoDelDaño >= 0) break
  }

  ok('el servidor anuncia el gesto', !!gesto, 'no llegó ningún suceso de gesto')
  ok('y dice cuánto dura la anticipación', gesto && gesto.ms > 0, JSON.stringify(gesto))
  ok('y cuánto dura la parte que hace daño', gesto && gesto.activo > 0, JSON.stringify(gesto))

  console.log('\n── PERO LLEGA POCO DESPUÉS, NO A LA VEZ ──')
  ok('el golpe acaba haciendo daño', dañoVisto > 0, 'daño ' + dañoVisto)
  // Esto es lo que distingue el arreglo de un cambio de números: el
  // daño NO comparte paso con el anuncio del gesto.
  ok('el daño no llega en el mismo paso que el gesto',
     pasoDelGesto >= 0 && pasoDelDaño > pasoDelGesto,
     'gesto en el paso ' + pasoDelGesto + ', daño en el ' + pasoDelDaño)
  ok('y no tarda una eternidad', pasoDelDaño - pasoDelGesto <= 3,
     (pasoDelDaño - pasoDelGesto) + ' pasos de diferencia')

  console.log('\n── UN GOLPE NO PEGA DOS VECES AL MISMO ──')
  // Golpe nuevo, quieto y pegado: se cuentan los impactos de ESE golpe
  // durante toda su ventana. Con la ventana activa abarcando dos pasos
  // del servidor, sin control de duplicados saldrían dos.
  await sleep(600)
  let impactos = 0
  const g2 = await pulso({ mx: 0, my: 0, atacar: true })
  for (const x of ((g2.body.estado || {}).sucesos || [])) {
    if (x.t === 'daño' && x.a === 'enemigo') impactos++
  }
  for (let i = 0; i < 4; i++) {
    await sleep(100)
    const r = await pulso({ mx: 0, my: 0, atacar: false })
    for (const x of ((r.body.estado || {}).sucesos || [])) {
      if (x.t === 'daño' && x.a === 'enemigo') impactos++
    }
  }
  ok('un solo golpe toca como mucho una vez a cada enemigo a tiro',
     impactos <= (g2.body.estado.enemigos || []).length, impactos + ' impactos')

  console.log('\n── Y SE SIGUE PUDIENDO MATAR ──')
  // Mismo patrón que test-arena.js, que lleva versiones funcionando:
  // perseguir al más cercano y atacar en cuanto está a tiro.
  //
  // El presupuesto importa y el primero que puse se quedó corto. Con
  // 90 pasos pasaba en aislado y fallaba dentro de la suite: a puños
  // —el personaje nuevo no lleva nada equipado— una araña aguanta trece
  // golpes de cadencia 420, o sea más de cinco segundos SOLO de pegar,
  // sin contar acercarse. La anticipación del golpe nuevo se come
  // además un swing del presupuesto. Con 180 sobra de largo y sigue
  // midiendo lo mismo: que atacar mata.
  let bajas = 0, vueltas = 0
  while (bajas === 0 && vueltas++ < 180) {
    const e = s.body.estado
    if (!e) break
    if (e.bajas > 0) { bajas = e.bajas; break }
    const en = (e.enemigos || [])[0]
    if (!en) { await sleep(110); s = await pulso({ mx: 0, my: 0 }); continue }
    const j = e.jugador
    const dx = en.x - j.x, dy = en.y - j.y
    const d = Math.hypot(dx, dy) || 1
    s = await pulso({ mx: dx / d, my: dy / d, apuntar: Math.atan2(dy, dx), atacar: d < 90 })
    if (s.body.fin) break
    await sleep(110)
  }
  ok('atacar sigue matando enemigos', bajas > 0, 'bajas ' + bajas + ' tras ' + vueltas + ' vueltas')

  await req('POST', '/api/arena/abandon', {})

  console.log('\n── UN ARMA LENTA SE ANTICIPA MÁS ──')
  // Las ventanas salen de la cadencia del arma, así que comparar dos
  // armas es comparar dos cadencias. Se lee del propio código para no
  // depender de tener las dos armas en el inventario.
  const src = require('fs').readFileSync(path.join(__dirname, 'src/server/58-arena.js'), 'utf8')
  ok('las ventanas se derivan de la cadencia', /c \* 0\.30/.test(src) && /c \* 0\.22/.test(src))
  const m = src.match(/function ventanasDe\(arma\) \{[\s\S]*?\n\}/)
  ok('la función existe', !!m)
  if (m) {
    const ventanasDe = new Function('limitar', 'return ' + m[0])((v, a, b) => v < a ? a : v > b ? b : v)
    const daga = ventanasDe({ cadenciaMs: 300 })
    const cetro = ventanasDe({ cadenciaMs: 620 })
    ok('el cetro se anticipa más que la daga',
       cetro.anticipacion > daga.anticipacion, JSON.stringify({ daga, cetro }))
    ok('los tres tiempos suman la cadencia de la daga',
       daga.anticipacion + daga.activo + daga.recuperacion === 300, JSON.stringify(daga))
    ok('y los del cetro también',
       cetro.anticipacion + cetro.activo + cetro.recuperacion === 620, JSON.stringify(cetro))
    ok('ninguna ventana activa es cero', daga.activo > 0 && cetro.activo > 0)
  }

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-ventanas.json', '/tmp/cm-vt-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-ventanas.json', BACKUP_DIR: '/tmp/cm-vt-b' }),
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
