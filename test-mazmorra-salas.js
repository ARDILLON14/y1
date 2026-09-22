/**
 * CriptoMundo — las salas de cofre, trampa y santuario se juegan
 * Uso:  PORT=3883 node test-mazmorra-salas.js --spawn
 *
 * POR QUÉ EXISTE
 * Estas tres salas eran una tirada instantánea. `Math.random()` decidía
 * si el cofre estaba trampeado, `Math.random()` contra la agilidad
 * decidía si los dardos te daban, y el santuario sumaba vida y avanzaba
 * de piso. El jugador pulsaba y leía el resultado: no había nada que
 * hacer bien ni mal.
 *
 * Ahora abren una sala en el mismo motor de arena que ya usaban las de
 * combate, con un objetivo que no es matar. Esta prueba las JUEGA por
 * HTTP —se mueve hasta el objetivo, aguanta, y comprueba que el
 * servidor da la sala por superada— porque lo único que demuestra que
 * una sala es jugable es jugarla.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3883)
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

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

// Camina hacia el objetivo y se queda encima hasta que la sala termina.
// Es lo que haría un jugador: no hay atajo por el que pedirle al
// servidor que dé la sala por hecha.
async function jugarSala(pasos) {
  let ultimo = null, terminada = false, vioAviso = false, vioProgreso = false, maxProgreso = 0
  for (let i = 0; i < pasos; i++) {
    const s = await req('POST', '/api/arena/sync', { entrada: ultimo ? ultimo.entrada : { mx: 0, my: 0 } })
    await dormir(100)
    if (s.status !== 200) { terminada = true; break }
    const e = s.body.estado
    if (!e || !e.sala) { terminada = true; break }
    const o = e.sala.objetivo
    maxProgreso = Math.max(maxProgreso, o.progreso)
    if (o.progreso > 0) vioProgreso = true
    if ((e.sala.peligros || []).some(h => h.avisando)) vioAviso = true
    const dx = o.x - e.jugador.x, dy = o.y - e.jugador.y
    const d = Math.hypot(dx, dy)
    // Dentro del objetivo se para: el progreso solo sube estando quieto
    // dentro. Fuera, va derecho hacia él.
    const entrada = d < o.radio * 0.5
      ? { mx: 0, my: 0, apuntar: 0 }
      : { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx) }
    ultimo = { entrada }
    if (o.hecho) { terminada = true; break }
  }
  return { terminada, vioAviso, vioProgreso, maxProgreso }
}

// Baja por la mazmorra hasta encontrar una sala del tipo pedido.
//
// Las salas salen de una semilla, así que no se puede exigir que la
// primera sea la que hace falta. Y el reparto no es plano: el pasillo
// trampeado NO puede salir en el primer piso —su pool no lo incluye—,
// así que buscarlo obliga a bajar, y bajar obliga a superar una sala.
// Esta prueba las supera jugándolas, que es justo lo que quiere medir.
//
// Si un piso solo ofrece pelea, se abandona la run y se prueba otra
// semilla: pelear aquí no aporta nada y cuesta medio minuto.
async function buscarSala(tipo, intentos) {
  for (let n = 0; n < intentos; n++) {
    await req('POST', '/api/arena/abandon', {})
    await req('POST', '/api/mazmorra/retirarse', {})
    const ent = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' })
    let run = ent.body.run
    if (!run) continue
    for (let piso = 0; piso < 5 && run && !run.terminada; piso++) {
      const op = (run.opciones || []).find(o => o.tipo === tipo)
      if (op) return { salaId: op.id, run }
      // Ninguna vale: se baja por la más barata de despejar. Cofre y
      // santuario se juegan en segundos; una pelea, no.
      const barata = (run.opciones || []).find(o => o.tipo === 'santuario' || o.tipo === 'cofre')
      if (!barata) break
      const el = await req('POST', '/api/mazmorra/sala', { salaId: barata.id })
      if (!el.body.combate) break
      const j = await jugarSala(140)
      if (!j.terminada) break
      const est = await req('GET', '/api/mazmorra')
      run = est.body.run
      if (!run || run.enCombate) break
    }
  }
  return null
}

// Sube a nivel 3, que es lo que pide la Cripta. Se hace peleando porque
// no hay ningún atajo de servidor para dar niveles, y no se va a abrir
// uno solo para esto. Presupuesto medido en otras pruebas de este
// repositorio: entre 47 y 110 ataques, con muertes por el camino.
async function subirANivel(objetivo, presupuesto) {
  let nivel = 1
  for (let i = 0; i < presupuesto && nivel < objetivo; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (r.status === 200) {
      if (r.body.newLevel) nivel = r.body.newLevel
      if (r.body.playerDied) await req('POST', '/api/player/respawn', {})
    }
    await dormir(370)
  }
  return nivel
}

// Deja la vida dentro de una franja antes del santuario.
//
// Hace falta porque una fuente no puede curar a quien ya está al tope:
// la comprobación daba 1300 → 1300 y fallaba, con razón. Pero tampoco
// vale llegar medio muerto: la Cripta no deja entrar por debajo del
// 25 %, y una versión anterior de esto pegaba con un troll, se pasaba
// de frenada hasta el 21 % y entonces fallaba TODO lo demás por no
// poder entrar.
//
// Así que en vez de bajar a ciegas, se corrige en los dos sentidos: se
// encaja con arañas, que pegan flojo, y si se pasa se bebe.
async function ponerVidaEn(minFrac, maxFrac) {
  for (let i = 0; i < 30; i++) {
    const yo = (await req('GET', '/api/player')).body.character || {}
    const f = yo.hp / (yo.maxHp || 1)
    if (f >= minFrac && f <= maxFrac) return f
    if (f > maxFrac) {
      const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'block' })
      if (r.status === 200 && r.body.playerDied) await req('POST', '/api/player/respawn', {})
    } else {
      await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 1 })
      await req('POST', '/api/player/use', { itemId: 'potion_hp_v' })
    }
    await dormir(380)
  }
  // Salir del combate sin matar a la araña: lo que se quería era el daño.
  for (let i = 0; i < 8; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'flee' })
    if (r.status !== 200 || r.body.fled) break
    await dormir(380)
  }
  const yo = (await req('GET', '/api/player')).body.character || {}
  return yo.hp / (yo.maxHp || 1)
}

async function run() {
  const u = 'mzs' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const nivel = await subirANivel(3, 250)
  check('el personaje llega al nivel que pide la Cripta', nivel >= 3, 'nivel ' + nivel)
  // Entrar herido está prohibido, y se llega tocado de tanto pelear.
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 5 })
  for (let i = 0; i < 4; i++) await req('POST', '/api/player/use', { itemId: 'potion_hp_v' })

  console.log('\n── EL MOTOR SABE MONTAR UNA SALA ──')
  // El motor de combate y el montaje de las salas viven en archivos
  // distintos a propósito: 58-arena.js simula el combate y 58-salas.js
  // describe salas que se ganan sin matar a nadie.
  const codigo = fs.readFileSync(path.join(__dirname, 'src', 'server', '58-arena.js'), 'utf8')
  const salas = fs.readFileSync(path.join(__dirname, 'src', 'server', '58-salas.js'), 'utf8')
  check('existe el constructor de salas', /function salaDeMazmorra\(/.test(salas))
  check('una sala se gana por su objetivo, no vaciándola',
    /!p\.enemigos\.length && p\.estado === 'activa' && !p\.sala/.test(codigo))
  check('los emisores avisan antes de disparar',
    /aviso_peligro/.test(salas) && /h\.avisando/.test(salas))
  const mz = fs.readFileSync(path.join(__dirname, 'src', 'server', '59-mazmorras.js'), 'utf8')
  // Lo que se estaba quitando: los dados que resolvían la sala sin que
  // el jugador hiciera nada.
  check('el cofre ya no se resuelve con un dado',
    !/esquiva = Math\.random\(\) < Math\.min\(0\.6/.test(mz))
  check('la trampa tampoco',
    !/esquiva = Math\.random\(\) < Math\.min\(0\.7/.test(mz))
  check('y el santuario ya no cura por pulsar',
    !/run\.vidaActual = Math\.min\(run\.vidaMax, run\.vidaActual \+ cura\)/.test(mz))

  console.log('\n── SANTUARIO: HAY QUE IR HASTA LA FUENTE ──')
  const fraccion = await ponerVidaEn(0.45, 0.75)
  check('se llega al santuario herido pero en pie', fraccion > 0.3 && fraccion < 0.95,
    Math.round(fraccion * 100) + '% de vida')
  const sant = await buscarSala('santuario', 25)
  check('aparece un santuario en alguna semilla', !!sant)
  if (sant) {
    const el = await req('POST', '/api/mazmorra/sala', { salaId: sant.salaId })
    check('elegirlo abre una sala, no la resuelve', el.body.combate === true && el.body.sala === 'santuario',
      JSON.stringify(el.body).slice(0, 120))
    let s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
    const sala = (s.body.estado || {}).sala
    check('el servidor publica el objetivo de la sala', !!sala && !!sala.objetivo, JSON.stringify(sala).slice(0, 100))
    check('el santuario no tiene emisores de dardos', sala && (sala.peligros || []).length === 0,
      JSON.stringify((sala || {}).peligros))
    const vidaAntes = (s.body.estado || {}).jugador.hp
    const pisoAntes = sant.run.piso
    const j = await jugarSala(120)
    check('se puede completar caminando hasta la fuente', j.terminada && j.vioProgreso,
      `progreso máx ${j.maxProgreso}`)
    // Y el efecto real: la curación llega por donde llegaba antes.
    //
    // Sin exigir que la run EXISTA, un `!est.body.run ||` delante de
    // cada comprobación las dejaría pasar solas si la run hubiera
    // muerto: verde sin haber mirado nada. Es el modo de fallo que ya
    // se coló una vez en este repositorio.
    const est = await req('GET', '/api/mazmorra')
    check('la run sigue viva tras la sala', !!est.body.run, JSON.stringify(est.body).slice(0, 120))
    check('la sala avanza el piso al completarse',
      !!est.body.run && est.body.run.piso > pisoAntes,
      `piso ${pisoAntes} → ${est.body.run && est.body.run.piso}`)
    check('beber cura de verdad', !!est.body.run && est.body.run.vida > vidaAntes,
      `${vidaAntes} → ${est.body.run && est.body.run.vida}`)
    await req('POST', '/api/mazmorra/retirarse', {})
  }

  console.log('\n── TRAMPA: LOS DARDOS AVISAN Y SE ESQUIVAN ──')
  const tr = await buscarSala('trampa', 25)
  check('aparece un pasillo trampeado en alguna semilla', !!tr)
  if (tr) {
    const el = await req('POST', '/api/mazmorra/sala', { salaId: tr.salaId })
    check('el pasillo abre una sala', el.body.combate === true && el.body.sala === 'trampa',
      JSON.stringify(el.body).slice(0, 120))
    let s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
    const sala = (s.body.estado || {}).sala
    check('el pasillo tiene emisores', sala && (sala.peligros || []).length >= 4,
      String((sala || {}).peligros && sala.peligros.length))
    check('cada emisor dice hacia dónde apunta',
      sala && sala.peligros.every(h => Number.isFinite(h.ang) && Number.isFinite(h.x)),
      JSON.stringify((sala || {}).peligros || []).slice(0, 120))
    // Los dardos tienen que doler. Un aviso bonito y un proyectil que
    // atraviesa al jugador sin quitarle nada sería peor que la tirada
    // de dados de antes: parecería una sala y no lo sería.
    //
    // Se hace plantándose EN la línea de la primera fila de emisores.
    // El punto de entrada está por debajo de todas las filas a
    // propósito, así que quedarse quieto donde apareces es seguro: el
    // daño llega por meterse en la trayectoria, no por existir.
    const fila = sala.peligros.reduce((a, h) => (h.y > a.y ? h : a), sala.peligros[0])
    let hpAntes = (s.body.estado || {}).jugador.hp, hpAhora = hpAntes, pasos = 0
    let dyMin = 1e9, dardosVistos = 0
    for (let i = 0; i < 90 && hpAhora >= hpAntes; i++) {
      const e0 = (s.body.estado || {}).jugador || {}
      const dy = fila.y - (e0.y || 0)
      dyMin = Math.min(dyMin, Math.abs(dy))
      dardosVistos = Math.max(dardosVistos, ((s.body.estado || {}).proyectiles || []).length)
      s = await req('POST', '/api/arena/sync', {
        entrada: { mx: 0, my: Math.abs(dy) > 6 ? Math.sign(dy) : 0, apuntar: 0 },
      })
      await dormir(100)
      if (s.status !== 200 || !s.body.estado) break
      pasos++
      hpAhora = s.body.estado.jugador.hp
    }
    // Si esto falla alguna vez, el mensaje tiene que decir POR QUÉ: si
    // no se llegó a la línea, si no llegó a salir un solo dardo, o si
    // salieron y no tocaron. Sin eso hay que instrumentar a mano.
    check('un dardo en la trayectoria hace daño de verdad', hpAhora < hpAntes,
      `${hpAntes} → ${hpAhora} en ${pasos} pasos · a ${Math.round(dyMin)} px de la línea · ${dardosVistos} dardos a la vez`)

    const j = await jugarSala(150)
    check('avisan antes de disparar', j.vioAviso)
    check('se puede cruzar hasta la salida', j.terminada && j.vioProgreso, `progreso máx ${j.maxProgreso}`)
    await req('POST', '/api/mazmorra/retirarse', {})
  }

  console.log('\n── COFRE: HAY QUE FORZARLO ──')
  const co = await buscarSala('cofre', 25)
  check('aparece una cámara del tesoro en alguna semilla', !!co)
  if (co) {
    const el = await req('POST', '/api/mazmorra/sala', { salaId: co.salaId })
    check('el cofre abre una sala', el.body.combate === true && el.body.sala === 'cofre',
      JSON.stringify(el.body).slice(0, 120))
    const j = await jugarSala(150)
    check('se puede forzar el cofre', j.terminada && j.vioProgreso, `progreso máx ${j.maxProgreso}`)
    const est = await req('GET', '/api/mazmorra')
    check('la run sigue viva tras el cofre', !!est.body.run, JSON.stringify(est.body).slice(0, 120))
    check('el botín del cofre se acumula en la run',
      !!est.body.run && (est.body.run.acumulado.botin || []).length > 0,
      JSON.stringify((est.body.run || {}).acumulado))
    await req('POST', '/api/mazmorra/retirarse', {})
  }

  console.log('\n── EL CLIENTE SIGUE SIN DECIDIR NADA ──')
  const ent = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' })
  const op = ((ent.body.run || {}).opciones || [])[0]
  if (op) {
    await req('POST', '/api/mazmorra/sala', { salaId: op.id })
    const trampa = await req('POST', '/api/arena/sync', {
      entrada: { mx: 0, my: 0 },
      sala: { objetivo: { progreso: 99999, hecho: true } },
      estado: { sala: { objetivo: { hecho: true } } },
    })
    const sala2 = (trampa.body.estado || {}).sala
    check('mandar el objetivo hecho no lo da por hecho',
      !sala2 || !sala2.objetivo.hecho || trampa.status !== 200,
      JSON.stringify(sala2 && sala2.objetivo))
  }
  await req('POST', '/api/arena/abandon')
  await req('POST', '/api/mazmorra/retirarse', {})

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-mzsalas.json', BACKUP_DIR: '/tmp/cm-mzsalas-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 2000)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
