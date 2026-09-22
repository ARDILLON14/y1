/**
 * CriptoMundo — el jefe de mazmorra tiene fases
 * Uso:  PORT=3885 node test-mazmorra-jefe.js --spawn
 *
 * POR QUÉ EXISTE
 * El jefe era una oleada más: un bicho con más vida y un acompañante,
 * peleando exactamente igual desde el primer segundo hasta el último.
 * La última sala de una mazmorra se jugaba igual que la primera. El
 * combate por turnos SÍ tiene fases para los jefes —está en su propio
 * código— pero el de la arena no tenía ninguna.
 *
 * Esta prueba no mira el código: entra a la sala del jefe y le baja la
 * vida hasta cruzar los dos umbrales, comprobando que la guarida
 * despierta y que llegan refuerzos. Y comprueba lo que NO debe cambiar:
 * que la sala se sigue ganando matando y no por un objetivo.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3885)
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

// Llega hasta la sala del jefe. Es la última de la mazmorra, así que
// hay que despejar todos los pisos anteriores. Se eligen siempre las
// salas baratas (cofre, santuario) y si no hay más remedio se pelea.
async function llegarAlJefe() {
  const ent = await req('POST', '/api/mazmorra/entrar', { mazmorraId: 'mz_cripta' })
  let run = ent.body.run
  if (!run) return null
  for (let piso = 0; piso < 8 && run && !run.terminada; piso++) {
    const jefe = (run.opciones || []).find(o => o.tipo === 'jefe')
    if (jefe) return { salaId: jefe.id, run }
    const barata = (run.opciones || []).find(o => o.tipo === 'santuario' || o.tipo === 'cofre')
                || (run.opciones || []).find(o => o.tipo === 'trampa')
                || (run.opciones || [])[0]
    if (!barata) return null
    const el = await req('POST', '/api/mazmorra/sala', { salaId: barata.id })
    if (!el.body.combate) return null
    const ok = await despejar(240)
    const est = await req('GET', '/api/mazmorra')
    run = est.body.run
    if (!ok || !run || run.enCombate) return null
  }
  return null
}

// Juega lo que haya delante: si hay objetivo va a por él, y si hay
// enemigos los mata. Devuelve true si la sala terminó.
//
// UN pulso por vuelta, no dos. La primera versión mandaba un pulso con
// la entrada anterior y otro con la nueva, así que el de parar cancelaba
// al de moverse y el personaje se quedaba casi en el sitio: la sala del
// cofre no se despejaba en 240 pasos y parecía que estaba rota.
async function despejar(pasos) {
  let entrada = { mx: 0, my: 0, apuntar: 0, atacar: true }
  for (let i = 0; i < pasos; i++) {
    const s = await req('POST', '/api/arena/sync', { entrada })
    await dormir(100)
    if (s.status !== 200 || !s.body.estado) return true
    const e = s.body.estado
    if (e.jugador.hp <= 0) return true
    const o = e.sala && e.sala.objetivo
    if (o && !o.hecho) {
      const dx = o.x - e.jugador.x, dy = o.y - e.jugador.y, d = Math.hypot(dx, dy)
      entrada = d < o.radio * 0.5
        ? { mx: 0, my: 0, apuntar: 0 }
        : { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx) }
      continue
    }
    const vivo = (e.enemigos || []).filter(x => x.hp > 0)[0]
    if (!vivo) { entrada = { mx: 0, my: 0, apuntar: 0, atacar: true }; continue }
    const dx = vivo.x - e.jugador.x, dy = vivo.y - e.jugador.y, d = Math.hypot(dx, dy)
    entrada = { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx), atacar: true }
  }
  return false
}

async function run() {
  const u = 'jfe' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const nivel = await subirANivel(3, 250)
  check('el personaje llega al nivel que pide la Cripta', nivel >= 3, 'nivel ' + nivel)
  // Se entra sano y con pociones: lo que se quiere medir son las fases
  // del jefe, no si un nivel 3 aguanta una mazmorra entera.
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 30 })
  for (let i = 0; i < 6; i++) await req('POST', '/api/player/use', { itemId: 'potion_hp_v' })

  console.log('\n── SE LLEGA A LA SALA DEL JEFE ──')
  const destino = await llegarAlJefe()
  check('se llega hasta la sala del jefe', !!destino)
  if (!destino) {
    console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
    process.exit(1)
  }
  const el = await req('POST', '/api/mazmorra/sala', { salaId: destino.salaId })
  check('la sala del jefe abre un combate', el.body.combate === true, JSON.stringify(el.body).slice(0, 120))

  let s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
  const sala = (s.body.estado || {}).sala
  check('la sala del jefe se publica como sala', !!sala, JSON.stringify((s.body.estado || {}).sala))
  check('empieza en la fase 1', sala && sala.jefeFase === 1, String(sala && sala.jefeFase))
  // Lo que NO debe cambiar: se gana matando, no yendo a ningún sitio.
  check('no tiene objetivo: se gana matando', sala && sala.objetivo === null,
    JSON.stringify((sala || {}).objetivo))
  check('y empieza sin emisores encendidos', sala && (sala.peligros || []).length === 0,
    String((sala || {}).peligros && sala.peligros.length))

  console.log('\n── AL BAJARLE LA VIDA, LA GUARIDA DESPIERTA ──')
  let fases = [1], maxPeligros = 0, maxEnemigos = 0, avisos = []
  let fase2Con = null, fase3Con = null
  let entradaJefe = { mx: 0, my: 0, apuntar: 0, atacar: true }
  for (let i = 0; i < 700; i++) {
    const r = await req('POST', '/api/arena/sync', { entrada: entradaJefe })
    await dormir(100)
    if (r.status !== 200 || !r.body.estado) break
    const e = r.body.estado
    const sa = e.sala || {}
    if (sa.jefeFase && fases[fases.length - 1] !== sa.jefeFase) {
      fases.push(sa.jefeFase)
      if (sa.jefeFase === 2) fase2Con = (sa.peligros || []).length
      if (sa.jefeFase === 3) fase3Con = (e.enemigos || []).filter(x => x.hp > 0).length
    }
    maxPeligros = Math.max(maxPeligros, (sa.peligros || []).length)
    maxEnemigos = Math.max(maxEnemigos, (e.enemigos || []).filter(x => x.hp > 0).length)
    for (const su of e.sucesos || []) if (su.t === 'jefe_fase') avisos.push(su.fase + ':' + su.texto)

    // Ir a por el jefe y pegarle. Curarse no hace falta: la prueba
    // aguanta con las pociones de antes si hace falta.
    const vivo = (e.enemigos || []).filter(x => x.hp > 0).sort((a, b) => b.hpMax - a.hpMax)[0]
    if (!vivo) break
    const dx = vivo.x - e.jugador.x, dy = vivo.y - e.jugador.y, d = Math.hypot(dx, dy)
    entradaJefe = { mx: dx / (d || 1), my: dy / (d || 1), apuntar: Math.atan2(dy, dx), atacar: true }
    if (e.jugador.hp <= 0) break
    if (fases.includes(3)) break
  }
  check('el jefe pasa a la fase 2', fases.includes(2), 'fases vistas: ' + fases.join('→'))
  check('y al llegar la fase 2 se encienden los emisores', fase2Con > 0, String(fase2Con))
  check('el jefe llega a la fase 3', fases.includes(3), 'fases vistas: ' + fases.join('→'))
  check('la fase 3 trae refuerzos', maxEnemigos > 2, 'máximo de enemigos vivos: ' + maxEnemigos)
  check('cada cambio de fase se anuncia', avisos.length >= 2, avisos.join(' | '))
  check('las fases van en orden y no saltan atrás',
    fases.every((f, i) => i === 0 || f > fases[i - 1]), fases.join('→'))

  console.log('\n── LA PANTALLA SABE PINTARLO ──')
  const codigo = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-arena.js'), 'utf8')
  check('la arena anuncia el cambio de fase', /jefe_fase/.test(codigo))
  check('y sabe pintar una sala sin objetivo',
    /if \(!o\) \{ pintarPeligros\(sala\); return \}/.test(codigo))

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  await req('POST', '/api/arena/abandon')
  await req('POST', '/api/mazmorra/retirarse', {})
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-jefe.json', '/tmp/cm-jefe-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-jefe.json', BACKUP_DIR: '/tmp/cm-jefe-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
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
