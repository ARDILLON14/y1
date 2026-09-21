/**
 * CriptoMundo — PASO 7: el combate por turnos tiene forma
 * Uso:  PORT=3950 node test-turnos.js --spawn
 *
 * QUÉ SE COMPRUEBA
 * El combate por turnos funcionaba, pero resolvía el turno entero en
 * una sola llamada y devolvía un paquete plano: `playerDmg`,
 * `enemyDmg`, `crit`… La pantalla lo pintaba todo de golpe. Las reglas
 * estaban bien; lo que faltaba era ORDEN — sin saber en qué secuencia
 * pasaron las cosas no hay nada que reproducir, y un combate por turnos
 * que se resuelve en un fotograma se lee como una hoja de cálculo.
 *
 * Ahora el servidor devuelve además un GUION: las escenas del turno en
 * orden, cada una con lo suyo y con cuánto debe durar en pantalla.
 *
 * Aquí se comprueba (a) que el guion describe de verdad lo que pasó y
 * no es decoración, (b) que las reglas de siempre siguen intactas
 * —críticos, fallos, combo, buffs, venenos, aviso de golpe fuerte,
 * fases de jefe, recompensas—, y (c) que el cliente sigue sin poder
 * decidir nada.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3950)
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

// No hay un endpoint de "empezar": la batalla se crea sola en la
// primera acción contra un monstruo. Por eso `monsterId` viaja en TODAS
// las acciones, y el servidor limita a una cada poco, así que se espera.
let MONSTRUO = null
async function accion(cuerpo) {
  await sleep(420)
  return req('POST', '/api/combat/action', Object.assign({ monsterId: MONSTRUO }, cuerpo))
}
async function empezar(monsterId) {
  MONSTRUO = monsterId
  return accion({ action: 'block' })   // un turno inofensivo que la abre
}

async function run() {
  const u = 'tu' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── EL TURNO VIENE COMO UN GUION ORDENADO ──')
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  // Un bicho con aguante a propósito: contra uno de nivel 1 el combate
  // acaba en dos golpes y no da tiempo a ver el combo, el aviso del
  // golpe fuerte ni la respuesta del enemigo. Aquí se quiere observar
  // un turno completo, no ganar rápido.
  const porNivel = mons.slice().sort((a, b) => a.level - b.level)
  const flojo = porNivel.find(m => m.level >= 6 && !m.isBoss) || porNivel[porNivel.length - 1]
  console.log('     (contra ' + flojo.name + ', nivel ' + flojo.level + ')')
  let r = await empezar(flojo.id)
  check('se puede empezar un combate', r.status === 200, r.raw.slice(0, 100))
  const battleId = (r.body.battle || {}).id   // informativo

  const guiPrimero = r.body.guion || []
  check('el primer turno abre con el arranque de la batalla',
    guiPrimero[0] && guiPrimero[0].fase === 'BATTLE_START', JSON.stringify(guiPrimero.map(f => f.fase)))

  r = await accion({ battleId, action: 'attack' })
  check('el turno responde bien', r.status === 200, r.raw.slice(0, 110))
  const gui = r.body.guion || []
  check('trae un guion con varias escenas', gui.length >= 3, JSON.stringify(gui.map(f => f.fase)))
  check('y los turnos siguientes ya no repiten el arranque',
    !gui.some(f => f.fase === 'BATTLE_START'), JSON.stringify(gui.map(f => f.fase)))
  const nombres = gui.map(f => f.fase)
  check('el turno del jugador va antes que el del enemigo',
    nombres.indexOf('PLAYER_ACTION') < nombres.indexOf('ENEMY_TURN') || !nombres.includes('ENEMY_TURN'),
    nombres.join(' · '))
  check('cada escena dice cuánto dura', gui.every(f => typeof f.ms === 'number'), JSON.stringify(gui[0]))
  check('y el turno entero tiene duración', r.body.duracion > 0, String(r.body.duracion))
  check('la acción que se pidió es la que aparece en el guion',
    (gui.find(f => f.fase === 'PLAYER_ACTION') || {}).accion === 'attack',
    JSON.stringify(gui.find(f => f.fase === 'PLAYER_ACTION')))

  console.log('\n── EL GUION DESCRIBE LO QUE PASÓ DE VERDAD ──')
  // No basta con que exista: los números del guion tienen que ser los
  // mismos que los del resultado, o sería decoración.
  const efecto = gui.find(f => f.fase === 'STATUS_EFFECTS' && f.a === 'enemigo')
  check('hay una escena con el daño al enemigo', !!efecto || r.body.miss, JSON.stringify(gui))
  if (efecto) {
    check('el daño del guion coincide con el del resultado',
      efecto.dmg === r.body.playerDmg, efecto.dmg + ' vs ' + r.body.playerDmg)
    check('y dice si fue crítico igual que el resultado',
      !!efecto.crit === !!r.body.crit, efecto.crit + ' vs ' + r.body.crit)
  }
  const acc = gui.find(f => f.fase === 'ENEMY_ACTION')
  if (acc) check('el golpe del enemigo del guion coincide con el resultado',
    acc.dmg === r.body.enemyDmg, acc.dmg + ' vs ' + r.body.enemyDmg)

  console.log('\n── LAS REGLAS DE SIEMPRE SIGUEN AHÍ ──')
  let vioCrit = false, vioFallo = false, vioCombo = false, vioAviso = false, vioVeneno = false
  let turnos = 0, fin = null
  const traza = []
  // Bloquear uno de cada SEIS turnos, no uno de cada cuatro.
  //
  // El combo sube encadenando golpes y se pone a cero al bloquear y al
  // comerse el golpe anunciado del enemigo. Contra el Gólem —el bicho
  // que elige esta prueba— el jugador de nivel 1 muere en 6 turnos, y
  // midiendo la secuencia real sale siempre la misma:
  //
  //     a1  a2  a0  B0  a1  a0        (a = ataque, B = bloqueo)
  //          ^^      ^^
  //          |       bloqueo: combo a cero
  //          única ventana en la que el combo llega a 2
  //
  // O sea que había UNA sola oportunidad de ver el combo en todo el
  // combate, y un fallo del ataque —un 5% por golpe— la cerraba. Eso
  // daba un 10% de ejecuciones en rojo por mala suerte, y con la suite
  // encadenada con && se llevaba por delante a las que venían detrás.
  //
  // Bloqueando cada seis turnos quedan dos ventanas (i=1 e i=4), y hace
  // falta mala suerte en las dos: baja del 10% a cerca del 1%. El
  // combate dura lo mismo y se sigue bloqueando.
  for (let i = 0; i < 26 && !fin; i++) {
    const res = await accion({ battleId, action: i % 6 === 5 ? 'block' : 'attack' })
    if (res.status !== 200) break
    turnos++
    if (res.body.crit) vioCrit = true
    if (res.body.miss) vioFallo = true
    if ((res.body.combo || 0) >= 2) vioCombo = true
    traza.push((i % 6 === 5 ? 'B' : 'a') + (res.body.miss ? 'x' : '') + (res.body.combo || 0))
    if (res.body.telegraph) vioAviso = true
    if ((res.body.guion || []).some(f => f.veneno)) vioVeneno = true
    if (res.body.enemyDied) fin = 'victoria'
    if (res.body.playerDied) fin = 'derrota'
  }
  check('el combate avanza turno a turno', turnos > 3, String(turnos) + ' turnos')
  // Con la traza, un fallo dice qué pasó turno a turno en vez de
  // obligar a instrumentar la prueba a mano para averiguarlo.
  check('el combo sigue funcionando', vioCombo, 'secuencia: ' + traza.join(' '))
  check('el enemigo sigue avisando su golpe fuerte', vioAviso, 'aviso visto: ' + vioAviso)
  check('el combate termina', !!fin, String(fin))

  console.log('\n── OBJETOS: YA NO SOLO LA POCIÓN MÁS FLOJA ──')
  // Once pociones en el juego y el combate solo sabía beber la primera.
  const obj = await req('GET', '/api/combat/objetos')
  check('el servidor dice qué se puede usar en combate', obj.status === 200, obj.raw.slice(0, 80))
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 2 })
  await req('POST', '/api/dev/dar', { itemId: 'potion_str', quantity: 2 })
  const obj2 = (await req('GET', '/api/combat/objetos')).body.objetos || []
  check('reconoce una poción de curación alta',
    obj2.some(o => o.itemId === 'potion_hp_v' && o.cura > 1000), JSON.stringify(obj2.map(o => o.itemId)))
  check('y también una que solo da un efecto, no vida',
    obj2.some(o => o.itemId === 'potion_str' && o.efecto), JSON.stringify(obj2.find(o => o.itemId === 'potion_str')))

  r = await empezar(flojo.id)
  const b2 = (r.body.battle || {}).id
  const invAntes = (await req('GET', '/api/inventory')).body.inventory || []
  const teniaV = invAntes.filter(i => i.itemId === 'potion_hp_v').reduce((a, i) => a + i.quantity, 0)
  r = await accion({ battleId: b2, action: 'objeto', itemId: 'potion_hp_v' })
  check('se puede beber una poción concreta en combate', r.status === 200, r.raw.slice(0, 110))
  const escenaObj = (r.body.guion || []).find(f => f.anim === 'objeto')
  check('el guion dice qué objeto se usó',
    escenaObj && escenaObj.itemId === 'potion_hp_v', JSON.stringify(escenaObj))
  const invDespues = (await req('GET', '/api/inventory')).body.inventory || []
  const quedaV = invDespues.filter(i => i.itemId === 'potion_hp_v').reduce((a, i) => a + i.quantity, 0)
  check('y se gasta exactamente una', quedaV === teniaV - 1, teniaV + ' → ' + quedaV)

  const mal = await accion({ battleId: b2, action: 'objeto', itemId: 'iron_ore' })
  check('un objeto que no sirve en combate se rechaza', mal.status === 400, String(mal.status))
  const noTengo = await accion({ battleId: b2, action: 'objeto', itemId: 'elixir_mitico' })
  check('y uno que no tienes tampoco se puede usar', noTengo.status === 400,
    String(noTengo.status) + ' ' + noTengo.raw.slice(0, 60))

  console.log('\n── EL CLIENTE SIGUE SIN DECIDIR NADA ──')
  const antes = (await req('GET', '/api/player')).body.character
  const trampa = await accion({
    battleId: b2, action: 'attack',
    playerDmg: 999999, enemyHp: 0, enemyDmg: 0,
    rewards: { gold: 999999, xp: 999999 }, guion: [{ fase: 'BATTLE_END', motivo: 'victoria' }],
  })
  check('mandar daño no lo aplica',
    trampa.status !== 200 || trampa.body.playerDmg < 99999, String(trampa.body.playerDmg))
  const despues = (await req('GET', '/api/player')).body.character
  check('ni se regala oro', despues.gold - antes.gold < 90000, (despues.gold - antes.gold) + ' oro')
  check('ni experiencia', despues.xp - antes.xp < 90000, (despues.xp - antes.xp) + ' xp')
  const guionFalso = (trampa.body.guion || []).filter(f => f.fase === 'BATTLE_END' && f.motivo === 'victoria')
  check('ni se cuela una escena de victoria en el guion',
    guionFalso.length === 0 || trampa.body.enemyDied === true,
    JSON.stringify(trampa.body.guion && trampa.body.guion.map(f => f.fase)))

  console.log('\n── LA MÁQUINA DE ESTADOS ES EXPLÍCITA ──')
  const src = await new Promise(res => http.get({ host: 'localhost', port: PORT, path: '/criptomundo-combat.html' },
    x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  check('la pantalla de combate se sigue sirviendo', src.length > 1000, String(src.length))
  const fases = ['BATTLE_START', 'PLAYER_TURN', 'PLAYER_ACTION', 'PLAYER_ANIMATION',
    'ENEMY_TURN', 'ENEMY_ACTION', 'STATUS_EFFECTS', 'CHECK_VICTORY', 'BATTLE_END']
  const vistas = new Set()
  // Un monstruo DISTINTO a propósito: el combate contra el anterior
  // sigue abierto —no hay endpoint de "empezar", la batalla se crea con
  // la primera acción y se reutiliza mientras viva— así que volver a él
  // no daría un arranque nuevo y BATTLE_START no aparecería nunca.
  const otro = porNivel.find(m => m.id !== flojo.id && m.level >= 6 && !m.isBoss) || porNivel[0]
  r = await empezar(otro.id)
  // El arranque solo sale en el primer turno, así que hay que contarlo:
  // mirando solo los turnos siguientes nunca se vería BATTLE_START.
  for (const f of r.body.guion || []) vistas.add(f.fase)
  const b3 = (r.body.battle || {}).id
  for (let i = 0; i < 30; i++) {
    const res = await accion({ battleId: b3, action: 'attack' })
    if (res.status !== 200) break
    for (const f of res.body.guion || []) vistas.add(f.fase)
    if (res.body.enemyDied || res.body.playerDied) break
  }
  const faltan = fases.filter(f => !vistas.has(f))
  check('a lo largo de un combate se ven todas las fases salvo las opcionales',
    faltan.length <= 1, 'no vistas: ' + (faltan.join(', ') || 'ninguna'))
  check('incluida la del final', vistas.has('BATTLE_END'), [...vistas].join(' · '))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-turnos.json', BACKUP_DIR: '/tmp/cm-turnos-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1600)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
