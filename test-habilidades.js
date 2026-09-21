/**
 * CriptoMundo — PASO 9: habilidades, objetos y estados
 * Uso:  PORT=3970 node test-habilidades.js --spawn
 *
 * EL FALLO GORDO QUE CAZA
 * Cada clase sabe TRES habilidades. La pantalla mandaba siempre la
 * primera:
 *
 *     if (action === 'magic') payload.skillId = char.skills[0]
 *
 * Así que dos de cada tres no se podían lanzar nunca. Un Guerrero no
 * llegaba a usar Golpe de Escudo en toda su vida — la única que aturde
 * e interrumpe el ataque anunciado del enemigo, y la que el propio
 * aviso en pantalla te decía que usaras. Estaba en el catálogo, tenía
 * coste, enfriamiento y efecto, y era inalcanzable.
 *
 * Y los estados: los refuerzos y venenos existían desde siempre y no se
 * veían en ninguna parte. Bebías una Poción de Fuerza y no había forma
 * de saber si seguía haciendo efecto ni cuánto le quedaba.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3970)
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
let MONSTRUO = null
async function accion(cuerpo) {
  await sleep(420)
  return req('POST', '/api/combat/action', Object.assign({ monsterId: MONSTRUO }, cuerpo))
}
const pagina = p => new Promise(res => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }).on('error', () => res('')))

async function run() {
  const u = 'p9' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── LAS TRES HABILIDADES, NO SOLO LA PRIMERA ──')
  let r = await req('GET', '/api/combat/habilidades')
  check('el servidor publica las habilidades', r.status === 200, r.raw.slice(0, 90))
  const habs = r.body.habilidades || []
  check('un Guerrero sabe tres', habs.length === 3, habs.map(h => h.id).join(', '))
  check('entre ellas Golpe de Escudo, que antes era inalcanzable',
    habs.some(h => h.id === 'golpe_escudo'), habs.map(h => h.id).join(', '))
  check('cada una dice coste, enfriamiento y qué hace',
    habs.every(h => h.coste > 0 && h.enfriamientoMs > 0 && h.efecto), JSON.stringify(habs[0]))
  check('y si se puede lanzar ahora mismo',
    habs.every(h => typeof h.lista === 'boolean'), JSON.stringify(habs.map(h => [h.id, h.lista])))
  check('el aturdimiento de Golpe de Escudo se anuncia',
    (habs.find(h => h.id === 'golpe_escudo') || {}).aturde === true)

  console.log('\n── SE PUEDEN LANZAR LAS TRES ──')
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  const porNivel = mons.slice().sort((a, b) => a.level - b.level)
  const bicho = porNivel.find(m => m.level >= 6 && !m.isBoss) || porNivel[porNivel.length - 1]
  MONSTRUO = bicho.id
  const lanzadas = {}
  for (const h of habs) {
    // Maná de sobra para no confundir "no se puede elegir" con "no
    // llega el maná", que son dos fallos distintos.
    await req('POST', '/api/dev/dar', { itemId: 'potion_mp', quantity: 5 })
    const res = await accion({ action: 'magic', skillId: h.id })
    const escena = (res.body.guion || []).find(f => f.anim === 'habilidad')
    lanzadas[h.id] = escena ? escena.habilidad : (res.body.result && res.body.result.log || []).join(' ')
  }
  check('Embestida se lanza', /Embestida/.test(lanzadas.embestida || ''), String(lanzadas.embestida))
  check('Golpe de Escudo se lanza (esto antes era imposible)',
    /Golpe de Escudo/.test(lanzadas.golpe_escudo || ''), String(lanzadas.golpe_escudo))
  check('Grito de Guerra se lanza', /Grito de Guerra/.test(lanzadas.grito_guerra || ''), String(lanzadas.grito_guerra))
  check('cada una es distinta de las demás',
    new Set(Object.values(lanzadas)).size === 3, JSON.stringify(lanzadas))

  console.log('\n── LOS ENFRIAMIENTOS SON DE VERDAD ──')
  r = await accion({ action: 'magic', skillId: 'grito_guerra' })
  check('no se puede repetir una habilidad recién lanzada',
    r.status === 400 && /enfriamiento/i.test(r.raw), r.status + ' ' + r.raw.slice(0, 80))
  const tras = (await req('GET', '/api/combat/habilidades')).body.habilidades || []
  const grito = tras.find(h => h.id === 'grito_guerra') || {}
  check('y el servidor dice cuánto le queda', grito.restanteMs > 0, grito.restanteMs + ' ms')
  check('marcándola como no disponible', grito.lista === false, JSON.stringify(grito))
  check('y por qué', grito.porQueNo === 'enfriando' || grito.porQueNo === 'sin maná', String(grito.porQueNo))

  console.log('\n── LOS ESTADOS SE VEN ──')
  const est = (await req('GET', '/api/combat/habilidades')).body.estados || {}
  check('el refuerzo del Grito de Guerra está activo',
    (est.jugador || []).some(e => /Ataque/.test(e.nombre)), JSON.stringify(est.jugador))
  check('con los turnos que le quedan',
    (est.jugador || []).every(e => e.turnos != null || e.segundos != null), JSON.stringify(est.jugador))

  // Una poción de efecto: dura minutos y sobrevive al combate.
  await req('POST', '/api/dev/dar', { itemId: 'potion_str', quantity: 1 })
  await accion({ action: 'objeto', itemId: 'potion_str' })
  const est2 = (await req('GET', '/api/combat/habilidades')).body.estados || {}
  check('una poción de efecto también aparece como estado',
    (est2.jugador || []).some(e => e.icono === '🧪'), JSON.stringify(est2.jugador))

  console.log('\n── EL SERVIDOR SIGUE MANDANDO ──')
  const antesMp = (await req('GET', '/api/player')).body.character.mp
  const trampa = await accion({ action: 'magic', skillId: 'bola_fuego' })
  check('no se puede lanzar una habilidad de otra clase',
    trampa.status !== 200 || !/Bola de Fuego/.test(JSON.stringify(trampa.body.guion || [])),
    trampa.status + ' ' + JSON.stringify((trampa.body.guion || []).find(f => f.anim === 'habilidad')))
  const inventada = await accion({ action: 'magic', skillId: 'rayo_de_la_muerte' })
  check('ni una inventada', inventada.status !== 200 || !/rayo_de_la_muerte/.test(inventada.raw),
    String(inventada.status))
  const despuesMp = (await req('GET', '/api/player')).body.character.mp
  check('el maná no sube solo', despuesMp <= antesMp + 400, antesMp + ' → ' + despuesMp)

  console.log('\n── LA PANTALLA LO OFRECE ──')
  const html = await pagina('/criptomundo-combat.html')
  check('hay un selector de habilidades', /function abrirHabilidades/.test(html))
  check('el botón de magia lo abre', /onclick="abrirHabilidades\(\)"/.test(html))
  check('ya no manda siempre la primera de la clase',
    /payload\.skillId = skillId \|\|/.test(html))
  check('hay sitio para los estados de los dos lados',
    /id="estados-jugador"/.test(html) && /id="estados-enemigo"/.test(html))
  check('y se pintan con lo que manda el servidor', /function pintarEstados/.test(html))
  // El panel de objetos leía solo `icon` y el catálogo de combate manda
  // `icono`: medio panel salía con la caja de objeto desconocido.
  check('los iconos se leen de las dos formas que conviven',
    /it\.icon \|\| it\.icono/.test(html))
  check('una habilidad que no se puede lanzar se ve apagada',
    /apagado/.test(html) && /h\.lista/.test(html))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-p9.json', BACKUP_DIR: '/tmp/cm-p9-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1600)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
