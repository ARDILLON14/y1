/**
 * CriptoMundo — descansar sirve para algo, y morir deja de ser la jugada
 * Uso:  PORT=3891 node test-descanso.js --spawn
 *
 * POR QUÉ EXISTE
 * No había NINGUNA forma de recuperar vida salvo morir. Los números del
 * arranque, medidos: un nivel 1 tiene 1.150 de vida, mata a una araña en
 * 5,2 turnos y muere en 12,5 —o sea que una pelea la gana con holgura—
 * pero cada araña le cuesta 478 de vida y entre combate y combate no
 * recuperaba nada. Con las tres pociones de inicio daba para 3,8 arañas,
 * y a partir de ahí morir era el remedio más barato del juego: el 8 % del
 * oro a cambio de media vida, frente a 20 de oro por 220 de curación.
 *
 * El juego premiaba dejarse matar. Eso no es dificultad, es un bucle
 * roto.
 *
 * Lo que esta prueba vigila es que el arreglo no se cuele por donde no
 * debe: descansar cura, pero NO cura dentro de una batalla abierta ni
 * dentro de la arena, y nunca pasa del tope.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3891)
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
const ficha = async () => (await req('GET', '/api/player')).body.character || {}

// Deja al personaje herido peleando de verdad, y sale huyendo para que
// no quede ninguna batalla abierta: con una batalla ACTIVA no se
// regenera, y eso es justo lo que se quiere comprobar por separado.
async function herirseYSalir(fraccion) {
  for (let i = 0; i < 30; i++) {
    const yo = await ficha()
    if (yo.hp <= yo.maxHp * fraccion) break
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (r.status !== 200) break
    if (r.body.playerDied) break
    await dormir(380)
  }
  for (let i = 0; i < 10; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'flee' })
    if (r.status !== 200 || r.body.fled) break
    await dormir(380)
  }
  return ficha()
}

async function run() {
  const u = 'dsc' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── DESCANSAR CURA ──')
  const herido = await herirseYSalir(0.7)
  check('el personaje acaba herido de verdad', herido.hp < herido.maxHp, `${herido.hp} de ${herido.maxHp}`)
  const antes = herido.hp
  await dormir(9000)
  const tras = await ficha()
  check('esperando fuera de combate, la vida sube', tras.hp > antes, `${antes} → ${tras.hp} en 9 s`)
  // El ritmo declarado es 1 % del tope cada segundo y medio: en nueve
  // segundos, seis puntos. Se deja holgura por el reloj real.
  const esperado = Math.round(tras.maxHp * 0.01) * 6
  check('y sube al ritmo declarado, ni más ni menos',
    tras.hp - antes >= esperado * 0.6 && tras.hp - antes <= esperado * 1.6,
    `${tras.hp - antes} · esperado ~${esperado}`)
  check('el maná también se recupera', tras.mp >= herido.mp, `${herido.mp} → ${tras.mp}`)

  console.log('\n── PERO NO DENTRO DE UNA BATALLA ABIERTA ──')
  // Aquí está el agujero evidente: si se regenerara con la batalla
  // abierta, bastaría con dejar de atacar para curarse gratis en mitad
  // de la pelea y ningún enemigo volvería a ganar jamás.
  const golpe = await req('POST', '/api/combat/action', { monsterId: 'm_troll', action: 'attack' })
  check('se abre una batalla', golpe.status === 200 && !!golpe.body.battleId, String(golpe.status))
  const enPelea = await ficha()
  await dormir(9000)
  const trasEsperar = await ficha()
  check('quedarse quieto a mitad de pelea NO cura', trasEsperar.hp <= enPelea.hp,
    `${enPelea.hp} → ${trasEsperar.hp}`)
  // Y al salir de la pelea vuelve a curar, para que no se quede colgado.
  for (let i = 0; i < 10; i++) {
    const r = await req('POST', '/api/combat/action', { monsterId: 'm_troll', action: 'flee' })
    if (r.status !== 200 || r.body.fled) break
    await dormir(380)
  }
  const alHuir = await ficha()
  await dormir(6000)
  const trasHuir = await ficha()
  check('en cuanto se sale de la pelea, vuelve a curar', trasHuir.hp > alHuir.hp,
    `${alHuir.hp} → ${trasHuir.hp}`)

  console.log('\n── NI DENTRO DE LA ARENA ──')
  const ini = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('se entra en la arena', ini.status === 200, ini.raw.slice(0, 80))
  const antesArena = await ficha()
  await dormir(6000)
  const trasArena = await ficha()
  check('la vida de la ficha no se mueve durante la arena', trasArena.hp === antesArena.hp,
    `${antesArena.hp} → ${trasArena.hp}`)
  await req('POST', '/api/arena/abandon', {})

  console.log('\n── Y NUNCA PASA DEL TOPE ──')
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 5 })
  for (let i = 0; i < 5; i++) { await req('POST', '/api/player/use', { itemId: 'potion_hp_v' }); await dormir(120) }
  const lleno = await ficha()
  check('se llega al tope', lleno.hp >= lleno.maxHp * 0.95, `${lleno.hp} de ${lleno.maxHp}`)
  await dormir(5000)
  const seguido = await ficha()
  check('esperar con la vida llena no la desborda', seguido.hp <= seguido.maxHp,
    `${seguido.hp} de ${seguido.maxHp}`)

  console.log('\n── LO QUE NO CAMBIA ──')
  // Lo importante de este arreglo es lo que NO toca. Ninguna pelea es
  // más fácil: el enemigo tiene la misma vida y pega lo mismo.
  const codigo = fs.readFileSync(path.join(__dirname, 'src', 'server', '30-personajes-combate.js'), 'utf8')
  check('la regeneración vive fuera del combate, no dentro',
    /function regenerarFuera\(char, ocupado\)/.test(codigo) && /if \(ocupado \|\| char\.hp <= 0\) return/.test(codigo))
  check('el ritmo está declarado con nombre, no escondido en un número',
    /const REGEN_FRACCION = 0\.01/.test(codigo) && /const REGEN_CADA_MS = \d+/.test(codigo))
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  const arana = mons.find(m => m.id === 'm_spider')
  check('la araña sigue teniendo los mismos números', arana && arana.hp === 285 && arana.level === 3,
    JSON.stringify(arana && { hp: arana.hp, level: arana.level }))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-descanso.json', '/tmp/cm-descanso-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-descanso.json', BACKUP_DIR: '/tmp/cm-descanso-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = http.get({ host: 'localhost', port: puerto, path: '/api/health' }, res => { res.resume(); resolve(true) })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}
function limpiarDatos() {
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
