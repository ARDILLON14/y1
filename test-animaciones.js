/**
 * CriptoMundo — PASO 6: animaciones completas
 * Uso:  PORT=3930 node test-animaciones.js --spawn
 *
 * POR QUÉ EXISTE
 * El reloj de animación existía desde el paso 1 y viajaba en cada
 * paquete. Lo que faltaba era que alguien lo USARA:
 *
 *  · El jugador era un círculo dorado. Tenía una skin elegida en el
 *    creador de personaje —con su dibujo, su emoji y hasta su tira de
 *    caminar— y en la arena no se veía ninguna.
 *  · A los enemigos les llegaba su estado de animación y el renderer lo
 *    ignoraba: un emoji quieto que se deslizaba por el suelo, pegara,
 *    recibiera o muriera.
 *  · Y la animación de muerte no se veía JAMÁS. El enemigo se borraba
 *    de la lista en el mismo tick en que moría: se arrancaba el gesto y
 *    en el siguiente paquete ya no había a quién dibujárselo.
 *
 * Las dos primeras se comprueban mirando lo que manda el servidor y lo
 * que hace la página. La tercera se mide: hay que ver cadáveres.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3930)
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

async function run() {
  const u = 'an' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  await req('POST', '/api/dev/dar', { itemId: 'espada_diamante', quantity: 1 })
  const inv = (await req('GET', '/api/inventory')).body
  const esp = (inv.inventory || []).find(i => i.itemId === 'espada_diamante')
  if (esp) await req('POST', '/api/player/equip', { uid: esp.uid })

  console.log('\n── EL JUGADOR TIENE ASPECTO, NO SOLO UN CÍRCULO ──')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  let r = await pulso({ mx: 0, my: 0 })
  const j = r.body.estado.jugador
  check('el paquete trae el aspecto del jugador', !!j.aspecto, JSON.stringify(j.aspecto))
  check('con emoji de reserva siempre', !!(j.aspecto || {}).emoji, String((j.aspecto || {}).emoji))
  check('y campos para dibujo y tira, aunque vengan vacíos',
    j.aspecto && 'imagen' in j.aspecto && 'tira' in j.aspecto, JSON.stringify(j.aspecto))
  check('sale del mismo catálogo de skins que el resto del juego',
    !!(j.aspecto || {}).id, String((j.aspecto || {}).id))
  check('el jugador manda su dirección en cuatro lados',
    ['der', 'izq', 'arriba', 'abajo'].includes(j.dir), String(j.dir))

  console.log('\n── UNA SKIN CON TIRA SE ANUNCIA CON SUS CUADROS ──')
  const skins = (await req('GET', '/api/skins')).body.skins || []
  const conTira = skins.find(sk => sk.id === 'laurel_possum')
  if (conTira) {
    await req('POST', '/api/character/appearance', { skinId: 'laurel_possum' })
    await req('POST', '/api/arena/abandon')
    await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
    const a2 = (await pulso({ mx: 0, my: 0 })).body.estado.jugador.aspecto
    check('la Zarigüeya trae su tira de caminar', !!(a2 && a2.tira), JSON.stringify(a2))
      // El catálogo declaraba `ancho: 140` para una tira de 420×70 con 3
    // cuadros. ¿140 es cada cuadro o el total? Las dos lecturas son
    // razonables y elegí la mala: dibujaba un tercio de cuadro y salía
    // medio bicho. Ahora la geometría se mide sobre el PNG, donde no
    // hay nada que interpretar.
    check('la geometría sale del archivo, no del catálogo',
      a2.tira && a2.tira.anchoTotal === 420 && a2.tira.alto === 70,
      JSON.stringify(a2.tira))
    check('cada cuadro mide el total entre el número de cuadros',
      a2.tira && a2.tira.anchoCuadro === 140 && a2.tira.cuadros === 3,
      JSON.stringify(a2.tira))
    check('la skin trae avatar para verse pequeña, no solo la ilustración grande',
      !!a2.avatar, JSON.stringify({ avatar: a2.avatar, imagen: a2.imagen }))
  } else { check('existe una skin con tira para probar', false) }

  console.log('\n── LOS ENEMIGOS SE ANIMAN Y SE MUEREN A LA VISTA ──')
  // Pelear de verdad: hace falta matar para ver cadáveres.
  let cadaveres = 0, animsVistas = {}, previo = null, muestras = 0
  for (let i = 0; i < 220; i++) {
    let ent = { mx: 0, my: 0, atacar: true }
    if (previo && (previo.enemigos || []).length) {
      const vivos = previo.enemigos
      if (vivos.length) {
        let mejor = null, md = 1e9
        for (const en of vivos) {
          const d = Math.hypot(en.x - previo.jugador.x, en.y - previo.jugador.y)
          if (d < md) { md = d; mejor = en }
        }
        const ang = Math.atan2(mejor.y - previo.jugador.y, mejor.x - previo.jugador.x)
        ent = { mx: md > 50 ? Math.cos(ang) : 0, my: md > 50 ? Math.sin(ang) : 0, apuntar: ang, atacar: true }
      }
    }
    const res = await pulso(ent)
    const e = res.body && res.body.estado
    if (!e) break
    muestras++
    for (const en of e.enemigos || []) {
      animsVistas[(en.anim || {}).n] = (animsVistas[(en.anim || {}).n] || 0) + 1
    }
    cadaveres += (e.restos || []).length
    previo = e
    await sleep(55)
  }
  check('se observó la pelea', muestras > 60, String(muestras))
  check('los enemigos mandan su animación', Object.keys(animsVistas).length >= 2, JSON.stringify(animsVistas))
  check('se ve la animación de dolor al pegarles',
    (animsVistas.hurt || 0) > 0, JSON.stringify(animsVistas))

  // El ataque del enemigo hay que verlo SIN matarlos: con la espada de
  // diamante equipada caen antes de llegar a pegar, así que en la
  // observación de arriba casi no aparece. Aquí se les deja atacar.
  await req('POST', '/api/arena/abandon')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  const quietas = {}
  for (let i = 0; i < 90; i++) {
    const e = (await pulso({ mx: 0, my: 0 })).body.estado
    if (!e) break
    for (const en of e.enemigos || []) quietas[(en.anim || {}).n] = (quietas[(en.anim || {}).n] || 0) + 1
    await sleep(60)
  }
  check('dejándoles pegar, se ve su animación de ataque',
    (quietas.attack || 0) > 0, JSON.stringify(quietas))
  // Esto es lo que antes era imposible: un enemigo muerto que todavía
  // está en el paquete, terminando su gesto.
  check('el cadáver se queda en pantalla a terminar su muerte',
    cadaveres > 0, cadaveres + ' restos vistos')
  check('los muertos NO ensucian la lista de enemigos',
    !(animsVistas.death > 0), JSON.stringify(animsVistas))
  await req('POST', '/api/arena/abandon')

  console.log('\n── LA BAJA SE CUENTA UNA SOLA VEZ ──')
  // El cadáver que sigue en la lista no puede volver a dar XP ni botín.
  const antes = (await req('GET', '/api/player')).body.character
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  let bajasFin = 0
  previo = null
  for (let i = 0; i < 200; i++) {
    let ent = { mx: 0, my: 0, atacar: true }
    if (previo && (previo.enemigos || []).length) {
      const vivos = previo.enemigos
      let mejor = vivos[0], md = 1e9
      for (const en of vivos) {
        const d = Math.hypot(en.x - previo.jugador.x, en.y - previo.jugador.y)
        if (d < md) { md = d; mejor = en }
      }
      const ang = Math.atan2(mejor.y - previo.jugador.y, mejor.x - previo.jugador.x)
      ent = { mx: md > 50 ? Math.cos(ang) : 0, my: md > 50 ? Math.sin(ang) : 0, apuntar: ang, atacar: true }
    }
    const res = await pulso(ent)
    if (res.body && res.body.fin) { bajasFin = res.body.fin.bajas; break }
    previo = res.body && res.body.estado
    if (!previo) break
    await sleep(55)
  }
  const despues = (await req('GET', '/api/player')).body.character
  check('las bajas contadas son un número razonable, no el doble',
    bajasFin === 0 || bajasFin <= 8, 'bajas: ' + bajasFin)
  check('el personaje no ganó XP imposible',
    despues.xp - antes.xp < 5000, (despues.xp - antes.xp) + ' xp')
  await req('POST', '/api/arena/abandon')

  console.log('\n── LA PANTALLA USA TODO ESO ──')
  const html = await pagina('/criptomundo-arena.html')
  check('hay un dibujante de tiras compartido', /function dibujarTira/.test(html))
  check('reparte los cuadros según los que tenga la tira, no los del catálogo',
    /tira\.cuadros \|\| 1/.test(html) && /avance % 1/.test(html))
  check('el jugador se dibuja con su skin', /real\.aspecto/.test(html) && /asp\.emoji/.test(html))
  check('prefiere el avatar a la ilustración grande', /asp\.avatar \|\| asp\.imagen/.test(html))
  check('la tira se usa también parado, no solo al caminar',
    /avance = a\.n === 'walk'/.test(html))
  check('el cuadro se dibuja con su proporción, no aplastado',
    /anchoDestino = altoDestino \* \(cw \/ Math\.max\(1, ch\)\)/.test(html))
  check('y cae al círculo si no hay ni dibujo ni emoji', /Sin skin ni emoji/.test(html))
  check('los enemigos usan su animación', /en\.anim \|\| \{ n: 'idle'/.test(html))
  check('el golpe del enemigo se ve venir', /haciaJ/.test(html) && /'attack'/.test(html))
  check('la muerte se desvanece y encoge', /1 - r\.p/.test(html) && /estado\.restos/.test(html))
  check('el cliente sigue sin decidir nada: solo dibuja',
    !/hp -=|\.hp = .*-/.test(html))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-anim.json', '/tmp/cm-anim-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-anim.json', BACKUP_DIR: '/tmp/cm-anim-b' }),
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
