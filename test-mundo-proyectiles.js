/**
 * CriptoMundo — los proyectiles del MUNDO
 * Uso:  PORT=3907 node test-mundo-proyectiles.js --spawn
 *
 * POR QUÉ EXISTE
 * test-proyectiles.js prueba los de la ARENA. Los del mundo en tiempo
 * real los escribí en la FASE C y no comprobé ninguna de las seis cosas
 * que pide la sección 7 del encargo. Aquí están las seis:
 *
 *   1. los mueve el servidor a la velocidad declarada;
 *   2. chocan con los edificios;
 *   3. caducan a su vidaMs;
 *   4. no tocan dos veces;
 *   5. no pasan de 8 vivos por jugador;
 *   6. magia sin maná, rechazada.
 *
 * Las cuatro primeras van contra el servidor de verdad, con el arco que
 * ya existe en el catálogo, dado con /api/dev/dar (la misma puerta que
 * usa la prueba de la arena, cerrada en producción).
 *
 * Las dos últimas NO se pueden hacer así, y lo digo: con las armas que
 * hay, un arco dispara cada 560 ms y su flecha vive 1.100, así que nunca
 * hay más de dos a la vez; y NINGÚN arma del juego gasta maná. Para esas
 * dos se evalúan los módulos del servidor en un contexto aislado con
 * armas que solo existen dentro de la prueba, que es exactamente lo que
 * pide el encargo cuando el catálogo no tiene lo que hace falta.
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3907)
let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(m, p, b, ck) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, ck: x.headers['set-cookie'] ? x.headers['set-cookie'][0].split(';')[0] : ck })
      })
    })
    q.on('error', () => r({ s: 0, b: {}, ck }))
    if (d) q.write(d); q.end()
  })
}

// Un jugador con el arco en la mano, colocado donde se diga. La primera
// posición en una zona se acepta tal cual; después habría que andar.
async function arquero(zona, x, y) {
  const u = 'pr' + Math.floor(Math.random() * 1e7)
  const reg = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const j = { u, ck: reg.ck, zona, x, y }
  await req('POST', '/api/dev/dar', { itemId: 'short_bow', quantity: 1 }, j.ck)
  await req('POST', '/api/hotbar/asignar', { ranura: 1, idObjeto: 'short_bow' }, j.ck)
  const e = await req('POST', '/api/hotbar/elegir', { ranura: 1 }, j.ck)
  j.equipado = e.s === 200
  await req('POST', '/api/mundo/sync', { pos: { zona, x, y } }, j.ck)
  return j
}
const pulso = (j, entrada) =>
  req('POST', '/api/mundo/combate', { pos: { zona: j.zona, x: j.x, y: j.y }, entrada }, j.ck)

// Disparar una vez hacia `dir` y seguir la flecha hasta que desaparezca.
// Devuelve las observaciones: [{ t, x, y }] con la hora del SERVIDOR.
async function seguirFlecha(j, dir) {
  // Soltar y dejar pasar la recuperación, para que el disparo sea limpio.
  for (let i = 0; i < 8; i++) { await pulso(j, { pulsado: false }); await dormir(80) }
  let id = null
  const vistas = []
  for (let i = 0; i < 80; i++) {
    const disparar = !id && i < 6
    const r = await pulso(j, { ax: Math.cos(dir), ay: Math.sin(dir), pulsado: disparar })
    const prs = (r.b && r.b.proyectiles) || []
    if (!id && prs.length) id = prs[0].id
    if (id) {
      const p = prs.find(x => x.id === id)
      if (p) vistas.push({ t: r.b.t, x: p.x, y: p.y })
      else if (vistas.length) break          // ya no está: murió
    }
    await dormir(35)
  }
  return vistas
}

async function http_() {
  console.log('\n── 1 · VELOCIDAD: LA QUE DICE EL CATÁLOGO ──')
  // En el pueblo no hay monstruos que se crucen, y a y=1000 no hay
  // edificios: la flecha vuela libre hasta que se le acaba la vida.
  const a = await arquero('pueblo', 900, 1000)
  ok('el arquero tiene el arco en la mano', a.equipado)
  const v = await seguirFlecha(a, 0)
  ok('se ve la flecha en varios pasos', v.length >= 4, String(v.length))
  if (v.length >= 2) {
    // Se toman las dos observaciones más separadas en el tiempo. El
    // error es de un paso (100 ms) en cada punta, sobre más de 800 ms.
    const p0 = v[0], p1 = v[v.length - 1]
    const dt = (p1.t - p0.t) / 1000
    const d = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    const vel = dt > 0 ? d / dt : 0
    // short_bow: vel 400 en ARMAS. Con un paso de error en cada punta
    // sobre la vida entera, ±25 % es lo que mide el método, no el juego.
    ok('vuela a los 400 px/s que declara el arco corto',
       vel > 300 && vel < 500, Math.round(vel) + ' px/s en ' + Math.round(dt * 1000) + ' ms')
    ok('y en línea recta: no se desvía en vertical', Math.abs(p1.y - p0.y) <= 2,
       (p1.y - p0.y) + ' px')
    ok('hacia donde se apuntó', p1.x > p0.x)

    console.log('\n── 3 · CADUCA A SU vidaMs ──')
    const vida = p1.t - p0.t
    // Vive 1.100 ms. Se observa desde el primer paso en que aparece
    // hasta el último en que sigue: el margen es de dos pasos.
    ok('dura lo que declara el arco (1.100 ms)', vida > 800 && vida < 1400, vida + ' ms')
    ok('y se acabó sin chocar con nada: ha recorrido su vida entera',
       Math.hypot(p1.x - p0.x, p1.y - p0.y) > 300, Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y)) + ' px')
  }

  console.log('\n── 2 · CHOCA CON LOS EDIFICIOS ──')
  // El segundo edificio del pueblo empieza en x=960 a esa altura. Desde
  // x=900, disparando al este, la flecha tiene 60 px antes de la pared.
  const b = await arquero('pueblo', 900, 330)
  const w = await seguirFlecha(b, 0)
  ok('se ve la flecha', w.length >= 1, String(w.length))
  if (w.length) {
    const ult = w[w.length - 1]
    ok('no atraviesa la pared', ult.x < 1000, 'último x = ' + ult.x)
    const vida = w[w.length - 1].t - w[0].t
    ok('y muere mucho antes que su vida entera', vida < 500, vida + ' ms')
  }

  console.log('\n── 4 · NO TOCA DOS VECES ──')
  // Contra monstruos de verdad, en el bosque. Cada disparo puede dar,
  // como mucho, un impacto: perfora 0.
  const c = await arquero('forest', 900, 600)
  let st = (await pulso(c, {})).b
  const blanco = (st.monstruos || [])[0]
  ok('hay algo a lo que disparar', !!blanco)
  let disparos = 0, daños = 0
  if (blanco) {
    let obj = { x: blanco.x, y: blanco.y }
    for (let i = 0; i < 60; i++) {
      const dir = Math.atan2(obj.y - c.y, obj.x - c.x)
      const r = await pulso(c, { ax: Math.cos(dir), ay: Math.sin(dir), pulsado: true })
      for (const s of (r.b.sucesos || [])) {
        if (s.tipo === 'disparo' && s.de === c.u) disparos++
        if (s.tipo === 'dano' && s.a !== 'yo') daños++
      }
      const m = (r.b.monstruos || []).find(x => x.id === blanco.id)
      if (m) obj = { x: m.x, y: m.y }
      if (r.b.yo && r.b.yo.hp <= 0) break
      await dormir(50)
    }
  }
  ok('se ha disparado varias veces', disparos >= 3, String(disparos))
  ok('y se ha acertado alguna', daños >= 1, String(daños))
  ok('ningún disparo ha dado más de un impacto', daños <= disparos,
     daños + ' impactos para ' + disparos + ' disparos')
}

// ── 5 y 6 · en aislado ─────────────────────────────────────────────
function aislado() {
  console.log('\n── LOS MÓDULOS DEL SERVIDOR, EN AISLADO ──')
  const ahora = { t: 1_000_000 }
  const sucesos = []
  const ctx = {
    console, Math, Date, JSON, Object, Array, Number, String, Boolean, Set, Map,
    isFinite, parseInt, parseFloat, Buffer,
    setInterval: () => ({ unref() {} }), setTimeout: () => 0, clearInterval() {}, clearTimeout() {},
    now: () => ahora.t, nextId: (() => { let n = 0; return p => p + '_' + (++n) })(), today: () => '2026-01-01',
    store: { players: {}, battles: {}, economy: {}, analytics: {}, auditLog: [], marketListings: [] },
    audit() {}, track() {}, trackItems() {}, trackCurrency() {}, step() {}, persist() {},
    fs, path, ASSETS_DIR: path.join(__dirname, 'assets'),
    // Lo que el mundo compartido le da al combate.
    MUNDO_ANCHO: 1800, MUNDO_ALTO: 1200, MUNDO_OLVIDO_MS: 8000,
    ZONES: { forest: { monsters: ['m_spider'] }, pueblo: { monsters: [] } },
  }
  ctx.globalThis = ctx
  vm.createContext(ctx)
  vm.runInContext('var mundo = new Map()', ctx)
  const mods = ['20-skins.js', '30-personajes-combate.js', '31-turnos.js', '56-ia-enemigos.js',
    '57-golpe.js', '57-proyectiles.js', '58-arena.js', '59-armas-perfil.js', '59-barra.js',
    '59-combate-vivo.js', '59-mundo-combate.js']
  let reventó = null
  for (const f of mods) {
    try { vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8'), ctx, { filename: f }) }
    catch (e) { reventó = f + ': ' + e.message; break }
  }
  ok('los módulos del combate se cargan en aislado', !reventó, String(reventó))
  if (reventó) return

  // Armas que SOLO existen dentro de esta prueba. Ninguna del catálogo
  // gasta maná, y ninguna dispara tan rápido como para llegar a ocho
  // flechas vivas: sin estas dos, las comprobaciones 5 y 6 no se pueden
  // hacer.
  vm.runInContext(`
    ITEM_TEMPLATES.varita_prueba = {
      name: 'Varita de Prueba', icon: '✨', type: 'WEAPON', rarity: 'EPIC', value: 1,
      slot: 'weapon', combate: { tipoUso: 'magia', costeMp: 30 },
    }
    ITEM_TEMPLATES.metralleta_prueba = {
      name: 'Arco de Prueba', icon: '🏹', type: 'WEAPON', rarity: 'EPIC', value: 1,
      slot: 'weapon', combate: { tipoUso: 'arco', cadenciaMs: 60, proyectil: { vel: 50, radio: 4, vidaMs: 60000 } },
    }
  `, ctx)

  function jugador(nombre, itemId, mp) {
    const char = ctx.newCharacter(nombre, 'Guerrero')
    char.inventory.push(ctx.makeItem(itemId, 1))
    char.mp = mp
    ctx.store.players[nombre] = { username: nombre, character: char }
    ctx.mundo.set(nombre, { zona: 'pueblo', x: 900, y: 1000, visto: ahora.t, ultimoMov: ahora.t })
    ctx.ponerEnHotbar(char, 0, itemId)
    ctx.seleccionarRanura(char, 0)
    return char
  }
  // Varios jugadores a la vez: cada uno manda su intención y el mundo da
  // UN paso para todos, que es como funciona de verdad.
  function pasos(n, quienes) {
    for (let i = 0; i < n; i++) {
      for (const [nombre, entrada] of Object.entries(quienes)) {
        ctx.mundo.get(nombre).visto = ahora.t
        ctx.entradaMundo(nombre, entrada)
      }
      ahora.t += 100
      ctx.tickMundo()
      for (const nombre of Object.keys(quienes)) sucesos.push(...ctx.recogerSucesos(nombre))
    }
  }

  console.log('\n── 6 · MAGIA SIN MANÁ, RECHAZADA ──')
  const mago = jugador('mago', 'varita_prueba', 10)
  const perfil = ctx.perfilDeArma('varita_prueba')
  ok('la varita de prueba es de magia y gasta 30 de maná',
     perfil.tipoUso === 'magia' && perfil.costeMp === 30, JSON.stringify({ t: perfil.tipoUso, mp: perfil.costeMp }))
  sucesos.length = 0
  pasos(12, { mago: { ax: 1, ay: 0, pulsado: true } })
  const zp = ctx.zonaViva('pueblo')
  ok('con 10 de maná no sale ningún proyectil',
     zp.proyectiles.filter(p => p.dueño === 'mago').length === 0,
     String(zp.proyectiles.filter(p => p.dueño === 'mago').length))
  ok('el jugador se entera: le llega el aviso de sin maná',
     sucesos.some(s => s.tipo === 'sin_mana' && s.costeMp === 30), JSON.stringify(sucesos.map(s => s.tipo)))
  ok('y no se le cobra el maná que no tiene', mago.mp === 10, String(mago.mp))
  mago.mp = 100
  sucesos.length = 0
  pasos(6, { mago: { ax: 1, ay: 0, pulsado: true } })
  // Se anota AHORA, mientras vuelan: la magia vive 1.500 ms y la
  // siguiente sección adelanta el reloj cuatro segundos. La primera
  // versión lo comprobaba después y las flechas ya habían caducado.
  const disparoDelMago = zp.proyectiles.some(p => p.dueño === 'mago')
  ok('con 100 sí dispara', disparoDelMago,
     String(zp.proyectiles.filter(p => p.dueño === 'mago').length))
  ok('y se le cobran los 30 por disparo', mago.mp <= 70, String(mago.mp))

  console.log('\n── 5 · NO MÁS DE OCHO VIVOS POR JUGADOR ──')
  jugador('tirador', 'metralleta_prueba', 100)
  // Cadencia de 60 ms, vida de un minuto, y lenta: en 40 pasos dispara
  // de sobra para pasar de ocho si nadie lo impidiera. Y el mago dispara
  // A LA VEZ, con maná de sobra, para comprobar que el tope es de cada
  // uno y no de la zona.
  mago.mp = 10000
  let maxTirador = 0
  sucesos.length = 0
  for (let k = 0; k < 40; k++) {
    pasos(1, {
      tirador: { ax: 0, ay: -1, pulsado: true },
      mago: { ax: -1, ay: 0, pulsado: true },
    })
    maxTirador = Math.max(maxTirador, zp.proyectiles.filter(p => p.dueño === 'tirador').length)
  }
  const suyos = zp.proyectiles.filter(p => p.dueño === 'tirador').length
  const delMago = zp.proyectiles.filter(p => p.dueño === 'mago').length
  const intentos = sucesos.filter(s => s.tipo === 'gesto' && s.de === 'tirador').length
  ok('intenta disparar muchas más de ocho veces', intentos > 8, String(intentos))
  ok('pero en ningún paso ha tenido más de ocho vivos', maxTirador <= 8, String(maxTirador))
  ok('y tiene los ocho: el tope no se come disparos que caben', suyos === 8, String(suyos))
  ok('el tope es de cada jugador: el mago tiene los suyos a la vez',
     delMago > 0, 'tirador ' + suyos + ' · mago ' + delMago)
  ok('y entre los dos pasan de ocho en la misma zona', suyos + delMago > 8,
     String(suyos + delMago))

  console.log('\n── Y UN ARMA QUE SOLO ESTÁ EN EL CATÁLOGO SE PUEDE USAR ──')
  // Es la promesa de la sección B.2: un arma sin entrada en ARMAS usa
  // los valores de su tipo. Si el mundo la tratara como puños, esa
  // promesa sería de papel.
  ok('la varita de prueba no está en la tabla de armas de la arena',
     !vm.runInContext('!!ARMAS.varita_prueba', ctx))
  ok('y aun así se ha disparado con ella, como arma de magia y no como puños',
     disparoDelMago)
}

async function run() {
  await http_()
  aislado()
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  for (const r of ['/tmp/cm-mpr.json', '/tmp/cm-mpr-b']) { try { fs.rmSync(r, { recursive: true, force: true }) } catch {} }
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-mpr.json', BACKUP_DIR: '/tmp/cm-mpr-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  ;(async () => {
    for (let i = 0; i < 60; i++) { await dormir(200); if ((await req('GET', '/api/health')).s === 200) break }
    run().catch(e => { console.error(e); process.exit(1) })
  })()
} else { run().catch(e => { console.error(e); process.exit(1) }) }
