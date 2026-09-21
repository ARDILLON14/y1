/**
 * CriptoMundo — PASO 4: la IA de los enemigos
 * Uso:  PORT=3910 node test-ia-enemigos.js --spawn
 *
 * POR QUÉ EXISTE
 * "Cada enemigo debe sentirse diferente" no se comprueba leyendo el
 * código: se comprueba MIDIENDO lo que hacen. Antes, la araña y el
 * esqueleto eran el mismo bicho con otros números, y desde fuera no
 * había manera de demostrar que eso había cambiado.
 *
 * Aquí se juegan partidas de verdad y se observa el estado de cada
 * enemigo tick a tick. Si mañana alguien simplifica la IA y los deja a
 * todos persiguiendo en línea recta, estas pruebas caen.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3910)
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

// Observa una arena durante N pulsos y devuelve todo lo visto: por qué
// estados pasó cada enemigo, cuánto se movió, y qué sucesos hubo.
async function observar(arenaId, entradaDe, pulsos) {
  await req('POST', '/api/arena/abandon')
  const ini = await req('POST', '/api/arena/start', { arenaId })
  if (ini.status !== 200) return null
  const visto = { estados: {}, sucesos: {}, rastro: {}, oleadas: new Set(), muestras: 0 }
  let previo = null
  for (let i = 0; i < pulsos; i++) {
    const r = await pulso(entradaDe(i, previo))
    previo = r.body && r.body.estado
    const e = r.body && r.body.estado
    if (!e) break
    visto.oleadas.add(e.oleada)
    visto.muestras++
    for (const s of e.sucesos || []) visto.sucesos[s.t] = (visto.sucesos[s.t] || 0) + 1
    for (const en of e.enemigos || []) {
      const k = en.nombre
      ;(visto.estados[k] = visto.estados[k] || {})[en.fsm] = (visto.estados[k][en.fsm] || 0) + 1
      const r2 = (visto.rastro[en.id] = visto.rastro[en.id] || { nombre: k, pts: [] })
      r2.pts.push({ x: en.x, y: en.y, jx: e.jugador.x, jy: e.jugador.y })
    }
    await sleep(60)
  }
  await req('POST', '/api/arena/abandon')
  return visto
}

// Apunta al enemigo más cercano y camina hacia él. Sin esto, el test
// daba vueltas golpeando al aire, no mataba las dos primeras oleadas y
// el embestidor —que es quien tiene los estados interesantes— no
// llegaba a salir nunca.
function irAPorElMasCercano(e, atacar) {
  if (!e || !(e.enemigos || []).length) return { mx: 0, my: 0, atacar: !!atacar }
  let mejor = null, mejorD = 1e9
  for (const en of e.enemigos) {
    const d = Math.hypot(en.x - e.jugador.x, en.y - e.jugador.y)
    if (d < mejorD) { mejorD = d; mejor = en }
  }
  const ang = Math.atan2(mejor.y - e.jugador.y, mejor.x - e.jugador.x)
  const lejos = mejorD > 55
  return { mx: lejos ? Math.cos(ang) : 0, my: lejos ? Math.sin(ang) : 0, apuntar: ang, atacar: !!atacar }
}

// Cuánto se desvía un enemigo de la línea recta hacia el jugador.
// 0 = va derecho como una flecha; alto = se acerca haciendo eses.
function rectitud(pts) {
  let suma = 0, n = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const mov = Math.hypot(b.x - a.x, b.y - a.y)
    if (mov < 1.5) continue
    const haciaJ = Math.atan2(a.jy - a.y, a.jx - a.x)
    const seMueve = Math.atan2(b.y - a.y, b.x - a.x)
    let dif = Math.abs(haciaJ - seMueve)
    if (dif > Math.PI) dif = 2 * Math.PI - dif
    suma += dif; n++
  }
  return n ? suma / n : 0
}

async function run() {
  const u = 'ia' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  // Un personaje recién hecho pega tan flojo que no llega a la tercera
  // oleada ni traba a nadie. Se le da una espada decente por la ruta de
  // pruebas: esto mide la IA, no lo dura que es la progresión.
  await req('POST', '/api/dev/dar', { itemId: 'espada_diamante', quantity: 1 })
  const invIni = (await req('GET', '/api/inventory')).body
  const esp = (invIni.inventory || []).find(i => i.itemId === 'espada_diamante')
  if (esp) await req('POST', '/api/player/equip', { uid: esp.uid })

  console.log('\n── LOS ENEMIGOS TIENEN ESTADOS, NO UN SOLO MODO ──')
  // Quieto en una esquina: da tiempo a verlos acercarse y avisar.
  const quieto = await observar('arena_bosque', () => ({ mx: 0, my: 0, apuntar: -1.57 }), 110)
  check('la partida se pudo observar', !!quieto && quieto.muestras > 40, quieto && String(quieto.muestras))
  const todos = Object.values(quieto.estados).reduce((a, m) => { for (const k in m) a[k] = (a[k] || 0) + m[k]; return a }, {})
  check('se ven varios estados distintos, no solo "normal"',
    Object.keys(todos).length >= 2, JSON.stringify(todos))
  check('pasan por perseguir y por atacar, que son estados distintos',
    (todos.chase || 0) > 0 && (todos.attack || 0) > 0, JSON.stringify(todos))
  check('la araña muerde y salta atrás en vez de quedarse pegada',
    (todos.retreat || 0) > 0, JSON.stringify(todos))

  console.log('\n── EL EMBESTIDOR SE ATURDE SI FALLA ──')
  // Moverse sin parar: así el troll carga y se estampa contra la pared
  // en vez de acertar. Ese aturdimiento es la ventana para castigarle.
  // Hay que matar las dos primeras oleadas para que salga el troll, así
  // que aquí sí se pelea: se ataca sin parar mientras se da vueltas.
  // Primero se limpian las dos primeras oleadas a espadazos; cuando
  // sale el embestidor se DEJA de atacar y se le da vueltas.
  //
  // No es un capricho del test: con la espada de diamante equipada, el
  // troll encadena aturdimientos y no llega a cargar nunca. Eso es un
  // dato de balance (BUG DETECTADO, ver informe), pero aquí lo que se
  // quiere medir es si la carga y su castigo existen, y para eso hay
  // que dejarle jugar su turno.
  const esEmbestidor = e => (e.enemigos || []).some(en => /troll|golem/i.test(en.nombre))
  const huyendo = await observar('arena_bosque', (i, e) => {
    if (!e) return { mx: 0, my: 0 }
    if (!esEmbestidor(e)) return irAPorElMasCercano(e, true)
    // Girar alrededor: obliga a fallar la embestida y estamparse.
    const a = i / 4
    return { mx: Math.cos(a), my: Math.sin(a), apuntar: a, atacar: false }
  }, 460)
  const est = huyendo ? Object.values(huyendo.estados).reduce((a, m) => { for (const k in m) a[k] = (a[k] || 0) + m[k]; return a }, {}) : {}
  check('el embestidor avisa antes de cargar',
    (est.telegraph || 0) > 0 || (huyendo.sucesos.aviso || 0) > 0,
    'estados=' + JSON.stringify(est) + ' sucesos=' + JSON.stringify(huyendo.sucesos))
  check('y la embestida dura lo suficiente para verse y esquivarse',
    (est.charge || 0) > 0, JSON.stringify(est))
  check('si falla la carga se queda aturdido: esa es la ventana',
    (est.stun || 0) > 0 || (huyendo.sucesos.aturdido || 0) > 0,
    'estados=' + JSON.stringify(est) + ' sucesos=' + JSON.stringify(huyendo.sucesos))

  console.log('\n── LA ARAÑA NO VIENE EN LÍNEA RECTA ──')
  const arañas = Object.values(quieto.rastro).filter(r => /ara/i.test(r.nombre))
  const otros = Object.values(quieto.rastro).filter(r => !/ara/i.test(r.nombre))
  check('se siguió el rastro de alguna araña', arañas.length > 0, String(arañas.length))
  const desvioAraña = arañas.length ? arañas.map(r => rectitud(r.pts)).reduce((a, b) => a + b, 0) / arañas.length : 0
  check('la araña se acerca haciendo eses, no en línea recta',
    desvioAraña > 0.12, 'desvío medio ' + desvioAraña.toFixed(3) + ' rad')
  if (otros.length) {
    const desvioOtro = otros.map(r => rectitud(r.pts)).reduce((a, b) => a + b, 0) / otros.length
    check('y se mueve distinto que los demás enemigos',
      Math.abs(desvioAraña - desvioOtro) > 0.05,
      'araña=' + desvioAraña.toFixed(3) + ' otros=' + desvioOtro.toFixed(3))
  }

  console.log('\n── PEGARLES LES INTERRUMPE ──')
  // Atacando sin parar: los enemigos deberían pasar tiempo trabados en
  // vez de seguir a lo suyo. Antes te pegaban en mitad de tu combo.
  const pegando = await observar('arena_bosque', (i, e) => irAPorElMasCercano(e, true), 150)
  const estP = Object.values(pegando.estados).reduce((a, m) => { for (const k in m) a[k] = (a[k] || 0) + m[k]; return a }, {})
  check('golpear genera sucesos de daño al enemigo',
    (pegando.sucesos['daño'] || 0) > 0, JSON.stringify(pegando.sucesos))
  check('y les traba: pasan por el estado de dolor',
    (estP.hurt || 0) > 0 || (estP.stun || 0) > 0, JSON.stringify(estP))

  console.log('\n── LA MÁQUINA DE ESTADOS ES DEL SERVIDOR ──')
  const trampa = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('se puede empezar otra vez', trampa.status === 200)
  const r = await pulso({ mx: 0, my: 0, enemigos: [{ estado: 'aturdido', hp: 1 }] })
  const e = r.body.estado
  check('el cliente no puede aturdir a los enemigos',
    (e.enemigos || []).every(en => en.estado !== 'aturdido'),
    JSON.stringify((e.enemigos || []).map(x => x.estado)))
  check('ni bajarles la vida',
    (e.enemigos || []).every(en => en.hp > 1), JSON.stringify((e.enemigos || []).map(x => x.hp)))
  await req('POST', '/api/arena/abandon')

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-ia.json', BACKUP_DIR: '/tmp/cm-ia-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1500)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
