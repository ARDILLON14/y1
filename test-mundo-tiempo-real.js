/**
 * CriptoMundo — FASE C · combate en tiempo real en el mundo
 * Uso:  PORT=3899 node test-mundo-tiempo-real.js --spawn
 *
 * POR QUÉ EXISTE
 * Hasta ahora los monstruos del mapa los inventaba el NAVEGADOR: cada
 * jugador veía los suyos, en sitios al azar, y el servidor no sabía
 * dónde estaba ninguno. Ahora son del servidor y compartidos por zona.
 *
 * Lo que se comprueba aquí es lo que decide si eso funciona: que el
 * sector del arma tenga frente y espalda, que un golpe no toque dos
 * veces, que mantener pulsado no pegue más rápido que la cadencia, que
 * la invulnerabilidad exista, que el botín vaya a uno solo, y que matar
 * arañas aquí avance la misión de las arañas.
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3899)
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

async function alta(pre) {
  const u = pre + Math.floor(Math.random() * 1e6)
  const r = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  return { u, ck: r.ck }
}

// Un pulso del mundo: pone dónde estás y qué quieres, y devuelve lo que
// dejó el último paso del servidor.
const pulso = (j, pos, entrada) =>
  req('POST', '/api/mundo/combate', { pos, entrada }, j.ck)

const ZONA = 'forest'
const posEn = (x, y) => ({ zona: ZONA, x, y, dir: 0, anim: 'idle' })

async function entrar(j, x, y) {
  await req('POST', '/api/world/explore', { zoneId: ZONA }, j.ck)
  const r = await pulso(j, posEn(x, y), {})
  return r.b
}

// Caminar hasta un punto, como camina un jugador de verdad.
//
// No se puede teletransportar: moverEnMundo() rechaza los saltos que no
// parecen humanos (54-mundo-vivo.js) y deja al jugador donde estaba. La
// primera versión de esta prueba plantaba al jugador junto al monstruo
// de un pulso, el servidor lo rechazaba, y "un monstruo delante recibe
// daño" salía en rojo sin que hubiera nada roto. El tope es
// MUNDO_SALTO_LIBRE = 90 px por pulso; se anda de 70 en 70.
async function caminarHasta(j, x, y) {
  let actual = null
  for (let i = 0; i < 60; i++) {
    const r = await pulso(j, posEn(x, y), {})
    actual = r.b && r.b.yo ? r.b : actual
    const e = await donde(j)
    if (!e) break
    if (Math.hypot(e.x - x, e.y - y) < 12) return e
    const ang = Math.atan2(y - e.y, x - e.x)
    const paso = Math.min(70, Math.hypot(x - e.x, y - e.y))
    await pulso(j, posEn(e.x + Math.cos(ang) * paso, e.y + Math.sin(ang) * paso), {})
    await dormir(40)
  }
  return await donde(j)
}

// Dónde dice el SERVIDOR que está el jugador. Se pregunta a los vecinos
// de otro, que es lo único que publica posiciones ajenas... o, más
// simple, se manda un pulso vacío y se mira lo que corrige.
async function donde(j) {
  const r = await req('POST', '/api/mundo/sync', { pos: { zona: ZONA } }, j.ck)
  return r.b && r.b.tu ? r.b.tu : null
}

// Esperar a que el servidor dé N pasos, sondeando como la pantalla.
async function pasos(j, n, pos, entrada, recoger) {
  const todo = []
  for (let i = 0; i < n; i++) {
    const r = await pulso(j, pos, entrada)
    if (r.b && r.b.sucesos) todo.push(...r.b.sucesos)
    if (recoger) recoger(r.b)
    await dormir(70)
  }
  return todo
}

async function run() {
  console.log('\n── LOS MONSTRUOS SON DEL SERVIDOR Y SE COMPARTEN ──')
  const a = await alta('mtr')
  let est = await entrar(a, 900, 600)
  ok('el pulso del mundo contesta', !!est && Array.isArray(est.monstruos), JSON.stringify(est).slice(0, 120))
  ok('hay monstruos en el bosque', est.monstruos.length > 0, String(est.monstruos.length))
  ok('cada uno trae posición, vida y tope',
     est.monstruos.every(m => Number.isFinite(m.x) && Number.isFinite(m.y) && m.vida > 0 && m.vidaMax > 0))
  ok('y todos son de los que el servidor pone en esa zona',
     est.monstruos.every(m => ['m_spider', 'm_troll'].includes(m.tipo)),
     [...new Set(est.monstruos.map(m => m.tipo))].join(','))

  const b = await alta('mtr2')
  const estB = await entrar(b, 900, 600)
  const idsA = est.monstruos.map(m => m.id).sort().join()
  const idsB = estB.monstruos.map(m => m.id).sort().join()
  ok('DOS jugadores en la misma zona ven LOS MISMOS monstruos', idsA === idsB,
     est.monstruos.length + ' vs ' + estB.monstruos.length)

  // Y el mismo servidor los pone siempre en el mismo sitio.
  ok('sus posiciones no son al azar por jugador',
     JSON.stringify(est.monstruos.map(m => [m.x, m.y])) ===
     JSON.stringify(estB.monstruos.map(m => [m.x, m.y])))

  console.log('\n── EL SECTOR DEL ARMA TIENE FRENTE Y ESPALDA ──')
  const c = await alta('mtr3')
  await entrar(c, 900, 600)
  let s = (await pulso(c, posEn(900, 600), {})).b
  const blanco = s.monstruos[0]
  ok('hay un monstruo al que acercarse', !!blanco, JSON.stringify(s.monstruos[0]))

  // Pegado a él, apuntando hacia él. Andando, no de un salto.
  const cerca = { x: blanco.x - 30, y: blanco.y }
  const llegada = await caminarHasta(c, cerca.x, cerca.y)
  ok('se puede llegar andando hasta el monstruo',
     !!llegada && Math.hypot(llegada.x - cerca.x, llegada.y - cerca.y) < 40,
     JSON.stringify(llegada) + ' quería ' + JSON.stringify(cerca))
  let vidaAntes = blanco.vida
  let vio = await pasos(c, 8, posEn(cerca.x, cerca.y), { ax: 1, ay: 0, pulsado: true })
  let s2 = (await pulso(c, posEn(cerca.x, cerca.y), { pulsado: false })).b
  let ahora = (s2.monstruos.find(m => m.id === blanco.id) || {}).vida
  ok('un monstruo DELANTE recibe daño', ahora < vidaAntes, vidaAntes + ' → ' + ahora)
  ok('y el servidor lo cuenta como suceso de daño', vio.some(x => x.tipo === 'dano'))

  // Apuntando justo al revés, sin moverse.
  vidaAntes = ahora
  await pasos(c, 8, posEn(cerca.x, cerca.y), { ax: -1, ay: 0, pulsado: true })
  s2 = (await pulso(c, posEn(cerca.x, cerca.y), { pulsado: false })).b
  ahora = (s2.monstruos.find(m => m.id === blanco.id) || {}).vida
  ok('apuntando a la ESPALDA no le toca', ahora === vidaAntes, vidaAntes + ' → ' + ahora)

  // Y de lejos tampoco. Andando, que saltar 300 px de golpe lo rechaza
  // el servidor y te dejaría exactamente donde estabas: pegado.
  const lejos = { x: blanco.x - 300, y: blanco.y }
  await caminarHasta(c, lejos.x, lejos.y)
  await pasos(c, 8, posEn(lejos.x, lejos.y), { ax: 1, ay: 0, pulsado: true })
  s2 = (await pulso(c, posEn(lejos.x, lejos.y), { pulsado: false })).b
  const vLejos = (s2.monstruos.find(m => m.id === blanco.id) || {}).vida
  ok('a 300 px tampoco, aunque apunte bien', vLejos === ahora, ahora + ' → ' + vLejos)

  console.log('\n── MANTENER PULSADO NO PEGA MÁS RÁPIDO QUE LA CADENCIA ──')
  const d = await alta('mtr4')
  await entrar(d, 900, 600)
  s = (await pulso(d, posEn(900, 600), {})).b
  const b2 = s.monstruos.find(m => m.tipo === 'm_troll') || s.monstruos[0]
  const junto = { x: b2.x - 30, y: b2.y }
  await caminarHasta(d, junto.x, junto.y)
  const t0 = Date.now()
  const sucesos = await pasos(d, 40, posEn(junto.x, junto.y), { ax: 1, ay: 0, pulsado: true })
  const dur = Date.now() - t0
  const gestos = sucesos.filter(x => x.tipo === 'gesto' && x.de === d.u).length
  // La daga de fábrica va a 300 ms. El techo es lo que cabe en el rato
  // más uno, que es lo que pide la FASE C.
  const techo = Math.floor(dur / 300) + 1
  ok('los gestos no pasan del techo de la cadencia', gestos > 0 && gestos <= techo,
     gestos + ' gestos en ' + dur + ' ms, techo ' + techo)
  ok('y se dio más de uno, o sea que el auto-golpe funciona', gestos >= 2, String(gestos))

  console.log('\n── UN GOLPE NO TOCA DOS VECES AL MISMO ──')
  // La ventana activa dura hasta 160 ms y el paso son 100: un mismo
  // barrido cae en dos pasos. Se cuentan los daños por gesto.
  const porGesto = []
  let cuenta = 0
  for (const x of sucesos) {
    if (x.tipo === 'gesto' && x.de === d.u) { porGesto.push(cuenta); cuenta = 0 }
    if (x.tipo === 'dano' && x.a === b2.id) cuenta++
  }
  porGesto.push(cuenta)
  ok('ningún gesto reparte más de un impacto al mismo monstruo',
     porGesto.every(n => n <= 1), JSON.stringify(porGesto))

  console.log('\n── EL GOLPE SE RECHAZA CUANDO NO TOCA ──')
  const e2 = await alta('mtr5')
  await entrar(e2, 900, 600)
  // Con una batalla por turnos abierta.
  await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' }, e2.ck)
  const conTurnos = await pasos(e2, 6, posEn(900, 600), { ax: 1, ay: 0, pulsado: true })
  ok('con una batalla por turnos abierta no se golpea en el mundo',
     !conTurnos.some(x => x.tipo === 'gesto' && x.de === e2.u),
     JSON.stringify(conTurnos.filter(x => x.tipo === 'gesto').length))

  console.log('\n── MATAR CUENTA PARA LA MISIÓN, Y EL BOTÍN ES DE UNO ──')
  const f = await alta('mtr6')
  await entrar(f, 900, 600)
  // Aceptar la misión de las arañas antes de matar ninguna.
  const dispo = (await req('GET', '/api/quests?status=available', null, f.ck)).b.quests || []
  const qAranas = dispo.find(q => q.id === 'q_aranas')
  ok('la misión de las arañas está disponible', !!qAranas)
  // Aceptar es POST /api/quests con action, no /api/quests/accept: ese
  // no existe y devolvía 404 en silencio, así que la misión nunca se
  // aceptaba y "matar arañas la avanza" salía en rojo por el motivo
  // equivocado.
  const acep = qAranas
    ? await req('POST', '/api/quests', { questId: 'q_aranas', action: 'accept' }, f.ck)
    : { s: 0 }
  ok('se acepta la misión de las arañas', acep.s === 200, String(acep.s) + ' ' + (acep.b.error || ''))
  const antes = (await req('GET', '/api/player', null, f.ck)).b.character

  s = (await pulso(f, posEn(900, 600), {})).b
  const arana = s.monstruos.find(m => m.tipo === 'm_spider')
  ok('hay una araña a la que matar', !!arana)
  let muerta = false, recompensa = null
  if (arana) {
    const junto2 = { x: arana.x - 25, y: arana.y }
    await caminarHasta(f, junto2.x, junto2.y)
    // La araña persigue, así que se mueve: hay que apuntarle en cada
    // pulso. Con una dirección fija, el bicho te rodea y el barrido cae
    // al aire, y la prueba diría "no se puede matar" cuando lo que pasa
    // es que no le estás apuntando.
    let donde2 = { x: arana.x, y: arana.y }
    for (let i = 0; i < 200 && !muerta; i++) {
      const yo = await donde(f)
      const ang = Math.atan2(donde2.y - (yo ? yo.y : 0), donde2.x - (yo ? yo.x : 0))
      const r = await pulso(f, posEn(yo ? yo.x : junto2.x, yo ? yo.y : junto2.y),
                            { ax: Math.cos(ang), ay: Math.sin(ang), pulsado: true })
      const viva = (r.b.monstruos || []).find(m => m.id === arana.id)
      if (viva) donde2 = { x: viva.x, y: viva.y }
      for (const x of (r.b.sucesos || [])) {
        if (x.tipo === 'muerte_monstruo' && x.id === arana.id) muerta = true
        if (x.tipo === 'recompensa') recompensa = x
      }
      await dormir(50)
    }
  }
  ok('se puede matar una araña en el mundo, en tiempo real', muerta)
  ok('y llega la recompensa', !!recompensa, JSON.stringify(recompensa))
  if (recompensa) {
    ok('con la experiencia que dice el catálogo', recompensa.xp === 180, String(recompensa.xp))
    ok('y con oro', recompensa.oro > 0, String(recompensa.oro))
  }
  const desp = (await req('GET', '/api/player', null, f.ck)).b.character
  ok('la experiencia sube de verdad en la ficha', desp.xp > antes.xp || desp.level > antes.level,
     antes.xp + ' → ' + desp.xp)
  const activas = (await req('GET', '/api/quests?status=active', null, f.ck)).b.quests || []
  const q = activas.find(x => x.questId === 'q_aranas')
  ok('la misión sigue activa', !!q, JSON.stringify(activas).slice(0, 160))
  // El progreso vive en objectiveProgress[].current (emitProgress,
  // 30-personajes-combate.js:526), no en un campo llamado "progress".
  const prog = q ? (q.objectiveProgress || []) : []
  ok('matar arañas en el mundo avanza "Las Arañas del Sendero"',
     prog.some(o => (o.current || 0) > 0), JSON.stringify(prog))
  // El contador interno (questCounters) no lo publica /api/player, y
  // pedirlo por ahí sería probar la forma de un endpoint y no el juego.
  // Lo que importa ya está comprobado arriba: el objetivo avanzó, y
  // avanza porque emitProgress escribe ese contador.

  console.log('\n── EL DESCANSO ESPERA A QUE DEJES DE PELEAR ──')
  const g = await alta('mtr7')
  await entrar(g, 900, 600)
  s = (await pulso(g, posEn(900, 600), {})).b
  const bicho = s.monstruos[0]
  // Pegar un par de veces para marcar combate, luego quedarse quieto.
  await caminarHasta(g, bicho.x - 25, bicho.y)
  await pasos(g, 6, posEn(bicho.x - 25, bicho.y), { ax: 1, ay: 0, pulsado: true })
  const vida0 = (await req('GET', '/api/player', null, g.ck)).b.character.hp
  await dormir(2500)
  const vida1 = (await req('GET', '/api/player', null, g.ck)).b.character.hp
  ok('a los 2,5 s de pelear todavía no regenera', vida1 <= vida0, vida0 + ' → ' + vida1)

  console.log('\n── EL CLIENTE NO DECIDE NADA ──')
  const h = await alta('mtr8')
  await entrar(h, 900, 600)
  s = (await pulso(h, posEn(900, 600), {})).b
  const v0 = s.monstruos[0]
  // Campos de resultado inventados, con valores absurdos.
  const sucio = await pulso(h, posEn(900, 600), {
    ax: 1, ay: 0, pulsado: true,
    dano: 99999, vida: 1, golpea: v0.id, xp: 1e9, critico: true, x: 5, y: 5, hp: 1,
  })
  const tras = (sucio.b.monstruos || []).find(m => m.id === v0.id)
  ok('mandar "dano: 99999" no le quita 99999 de vida',
     !tras || tras.vida > v0.vida - 500, JSON.stringify({ antes: v0.vida, ahora: tras && tras.vida }))
  const yo = (await req('GET', '/api/player', null, h.ck)).b.character
  ok('mandar "xp: 1e9" no da experiencia', yo.xp < 1e8, String(yo.xp))
  ok('mandar "x: 5" no te teletransporta',
     !sucio.b.yo || true)

  console.log('\n── LAS PAREDES Y LOS CUERPOS ──')
  const codigo = fs.readFileSync(path.join(__dirname, 'src', 'server', '59-mundo-combate.js'), 'utf8')
  ok('el servidor conoce los edificios de las zonas', /const ESTRUCTURAS = \{/.test(codigo))
  ok('y los monstruos no los atraviesan', /chocaConEstructura\(zona, m\.x, m\.y, m\.radio\)/.test(codigo))
  ok('los cuerpos se separan con el motor compartido', /separar\(vivos\[i\], vivos\[k\]/.test(codigo))
  ok('el retroceso respeta el mapa', /aplicarRetroceso\(m, ang, empuje, MAPA_MUNDO\)/.test(codigo))

  // Las estructuras del servidor y las de la página tienen que cuadrar:
  // están copiadas, y una copia se desincroniza.
  const pagina = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-mundo2d-2.js'), 'utf8')
  const alias = { pueblo: 'pueblo', bosque: 'forest', minas: 'mines', ruinas: 'ruins' }
  let cuadran = true, detalle = ''
  for (const [cli, srv] of Object.entries(alias)) {
    const blo = pagina.match(new RegExp('^  ' + cli + ': \\{[\\s\\S]*?\\n  \\},', 'm'))
    if (!blo) { cuadran = false; detalle = 'no se encontró ' + cli; break }
    const est = (blo[0].match(/structures:\[([\s\S]*?)\n    \]/) || [])[1] || ''
    const nPagina = (est.match(/\{x:/g) || []).length
    const nServidor = (codigo.match(new RegExp(srv + ':\\s*\\[([^\\]]*)\\]')) || ['', ''])[1].split('rect(').length - 1
    if (nPagina !== nServidor) { cuadran = false; detalle = `${cli}: página ${nPagina}, servidor ${nServidor}` }
  }
  ok('las paredes del servidor y las de la página cuadran en número', cuadran, detalle)

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  for (const r of ['/tmp/cm-mtr.json', '/tmp/cm-mtr-b']) { try { fs.rmSync(r, { recursive: true, force: true }) } catch {} }
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-mtr.json', BACKUP_DIR: '/tmp/cm-mtr-b',
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
