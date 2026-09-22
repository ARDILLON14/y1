/**
 * CriptoMundo — morir ya no borra todo lo que llevabas hecho
 * Uso:  PORT=3886 node test-muerte-progreso.js --spawn
 *
 * POR QUÉ EXISTE
 * Al morir se BORRABA la batalla. El siguiente intento empezaba contra
 * un bicho intacto, así que toda la vida que le habías quitado se iba a
 * la basura. Medido en el arranque —de nivel 1 a nivel 3 matando
 * arañas—: el 41 % de todo el daño del jugador se tiraba, y el mismo
 * camino costaba entre 40 y 59 ataques según la suerte.
 *
 * Ese factor no es dificultad: es ruido. La misma acción cuesta cosas
 * muy distintas por motivos que el jugador no ve ni controla.
 *
 * Ahora el enemigo se cura media vida máxima y se queda donde estaba.
 * La cura es una fracción del MÁXIMO a propósito: así solo progresa
 * quien le quita más de medio depósito entre muerte y muerte, y un
 * nivel 1 no puede matar a un dragón muriendo cuarenta veces. Esta
 * prueba comprueba las dos mitades: que el avance se conserva y que el
 * agujero está cerrado.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3886)
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

const pegar = (monstruo, extra) => req('POST', '/api/combat/action', Object.assign({ monsterId: monstruo, action: 'attack' }, extra || {}))

async function cuenta() {
  const u = 'mrt' + Math.floor(Math.random() * 1e9)
  cookie = ''
  const r = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return r.body.character
}

async function run() {
  await cuenta()

  console.log('\n── PELEAR HASTA MORIR ──')
  // Se pelea contra un troll: pega lo bastante fuerte como para matar a
  // un nivel 1 antes de que lo mate a él, que es justo el caso que
  // antes borraba el trabajo hecho.
  // Se pelea contra un troll: pega lo bastante fuerte como para matar a
  // un nivel 1 antes de que lo mate a él, que es justo el caso que antes
  // borraba el trabajo hecho.
  //
  // Se aguanta a través de VARIAS muertes a propósito. La cura está
  // topada a la vida máxima, así que si te matan cuando el enemigo
  // todavía está por encima de la mitad, medio depósito lo devuelve al
  // tope y "no vuelve a estar intacto" sería falso — con razón. Lo que
  // se quiere comprobar es el caso que importa: cuando ya le has quitado
  // más de la mitad, esa mitad NO se le devuelve. Y como ahora el daño
  // se acumula entre muertes, basta con seguir pegando.
  let trasMorir = null, antesDeMorir = null, maxEnemigo = 0
  let batallaAntes = null, muertesVistas = 0, turnos = 0
  let ultimoHp = null, bajoLaMitad = null
  for (let i = 0; i < 90; i++) {
    await dormir(380)
    const r = await pegar('m_troll')
    if (r.status !== 200) continue
    turnos++
    maxEnemigo = r.body.enemyMaxHp || maxEnemigo
    if (r.body.playerDied) {
      muertesVistas++
      batallaAntes = r.body.battleId
      trasMorir = r.body
      // La vida del enemigo JUSTO ANTES de curarse no es la del turno
      // anterior: en el turno de la muerte el jugador pega primero y el
      // enemigo contesta. Hay que descontar ese golpe o la cuenta sale
      // corta por exactamente el daño de ese ataque.
      const previo = ultimoHp == null ? null : Math.max(0, ultimoHp - (r.body.playerDmg || 0))
      antesDeMorir = { newMonsterHp: previo }
      // El caso que interesa: estaba por debajo de la mitad al morir.
      if (previo != null && previo < maxEnemigo * 0.5) { bajoLaMitad = { antes: previo, despues: r.body.enemyHpTrasMorir }; break }
      ultimoHp = r.body.enemyHpTrasMorir
      continue
    }
    // Si el troll muere antes que tú, empieza otro y se sigue. Romper
    // aquí dejaba la prueba sin ninguna muerte que mirar una de cada
    // tres ejecuciones.
    if (r.body.enemyDied) { ultimoHp = null; continue }
    if (typeof r.body.newMonsterHp === 'number') ultimoHp = r.body.newMonsterHp
  }
  check('el jugador llega a morir', muertesVistas > 0, turnos + ' turnos')
  if (!trasMorir) { console.log(`\n  ${pass} OK · ${failed} fallidas\n`); process.exit(1) }

  check('antes de morir le había quitado vida al enemigo',
    antesDeMorir.newMonsterHp != null && antesDeMorir.newMonsterHp < maxEnemigo,
    `${antesDeMorir.newMonsterHp} de ${maxEnemigo}`)
  check('el servidor dice con cuánta vida se queda el enemigo',
    trasMorir.enemyHpTrasMorir > 0, String(trasMorir.enemyHpTrasMorir))
  check('la cura nunca pasa del tope', trasMorir.enemyHpTrasMorir <= maxEnemigo,
    `${trasMorir.enemyHpTrasMorir} de ${maxEnemigo}`)
  check('se cura media vida máxima, ni más ni menos',
    Math.abs(trasMorir.enemyHpTrasMorir - Math.min(maxEnemigo, antesDeMorir.newMonsterHp + Math.round(maxEnemigo * 0.5))) <= 1,
    `${antesDeMorir.newMonsterHp} + ${Math.round(maxEnemigo * 0.5)} = ${trasMorir.enemyHpTrasMorir}`)
  // Y el caso que de verdad demuestra que el avance no se borra.
  check('se llegó a morir con el enemigo por debajo de la mitad', !!bajoLaMitad,
    `${muertesVistas} muertes · último hp ${ultimoHp} de ${maxEnemigo}`)
  check('ahí el enemigo NO vuelve a estar intacto',
    !!bajoLaMitad && bajoLaMitad.despues < maxEnemigo,
    bajoLaMitad ? `${bajoLaMitad.antes} → ${bajoLaMitad.despues} de ${maxEnemigo}` : 'no medido')

  console.log('\n── Y SIGUE SIENDO LA MISMA PELEA ──')
  await dormir(400)
  const seguir = await pegar('m_troll')
  check('se puede seguir peleando', seguir.status === 200, seguir.status + ' ' + seguir.raw.slice(0, 90))
  batallaDespues = seguir.body.battleId
  check('es LA MISMA batalla, no una nueva', !!batallaAntes && batallaDespues === batallaAntes,
    `${batallaAntes} → ${batallaDespues}`)
  check('el enemigo sigue herido donde lo dejaste',
    seguir.body.newMonsterHp < maxEnemigo, `${seguir.body.newMonsterHp} de ${maxEnemigo}`)
  check('el combo del asalto perdido no se hereda', (seguir.body.combo || 0) <= 1, String(seguir.body.combo))

  console.log('\n── LO QUE SÍ SE PIERDE AL MORIR ──')
  check('morir cuesta oro', trasMorir.goldLost > 0, String(trasMorir.goldLost))
  const yo = (await req('GET', '/api/player')).body.character
  check('y te deja a media vida', yo.hp > 0 && yo.hp <= Math.ceil(yo.maxHp * 0.5) + 1,
    `${yo.hp} de ${yo.maxHp}`)

  console.log('\n── EL AGUJERO ESTÁ CERRADO ──')
  // Si la herida se guardara tal cual, un nivel 1 podría matar a un
  // dragón muriendo cuarenta veces. Curando medio depósito por muerte,
  // solo progresa quien le quita MÁS de medio depósito entre muerte y
  // muerte: contra un bicho que te queda grande, nunca.
  await cuenta()
  let muertes = 0, mato = false, hpMin = Infinity, hpMax = 0, golpes = 0
  for (let i = 0; i < 45; i++) {
    await dormir(380)
    const r = await pegar('m_dragon')
    if (r.status !== 200) continue
    golpes++
    hpMax = Math.max(hpMax, r.body.enemyMaxHp || 0)
    if (typeof r.body.newMonsterHp === 'number') hpMin = Math.min(hpMin, r.body.newMonsterHp)
    if (r.body.enemyDied) { mato = true; break }
    if (r.body.playerDied) muertes++
  }
  check('un nivel 1 muere muchas veces contra un dragón', muertes >= 5, String(muertes))
  check('y NO lo mata a base de morir', !mato, 'golpes ' + golpes)
  check('el dragón nunca baja de la mitad de su vida', hpMin > hpMax * 0.5,
    `mínimo ${hpMin} de ${hpMax}`)

  console.log('\n── LA PANTALLA LO EXPLICA ──')
  // La barra del enemigo SUBE al morir. Un cambio de estado sin
  // explicación se lee como un fallo del juego.
  const fs = require('fs')
  const combate = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-combat-2.js'), 'utf8')
  const mapa = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-mundo2d-3.js'), 'utf8')
  check('la pantalla de combate lo dice', /enemyHpTrasMorir/.test(combate) && /sigue herido/.test(combate))
  check('y el mapa también', /enemyHpTrasMorir/.test(mapa) && /Sigue herido/.test(mapa))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-muerte.json', BACKUP_DIR: '/tmp/cm-muerte-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 2000)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
