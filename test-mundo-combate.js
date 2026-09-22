/**
 * CriptoMundo — el mundo 2D pelea contra el servidor, no contra sí mismo
 * Uso:  PORT=3975 node test-mundo-combate.js --spawn
 *
 * QUÉ SE ROMPIÓ Y POR QUÉ ESTA PRUEBA EXISTE
 *
 * La pantalla del mundo resolvía el combate entero en el navegador:
 *
 *     const crit = Math.random() < 0.18
 *     const goldGain = roll(...activeCombat.gold)
 *     const dropped  = Math.random() < 0.65
 *
 * El oro, la experiencia y el botín se sumaban a un objeto del
 * navegador y NO se mandaban a ningún sitio. Cualquiera con la consola
 * abierta se ponía el oro que quisiera, y al recargar no quedaba nada.
 *
 * La prueba que debería haberlo cazado miraba otra cosa: comprobaba que
 * el mapa no mandase COMBAT_ACTION por postMessage. El combate falso no
 * usaba postMessage —calculaba en local—, así que pasaba en verde con
 * el agujero abierto. Por eso esta prueba mira el CÓDIGO SERVIDO, no un
 * mecanismo concreto.
 *
 * Y comprueba lo que hacía falta para poder arreglarlo: que todos los
 * bichos del mapa existan en el catálogo del servidor. El Murciélago
 * Oscuro y el Liche Antiguo vivían solo en el cliente, así que en
 * cuanto el combate pasó al servidor dejaban de ser peleables.
 */
const path = require('path'), { spawn } = require('child_process')
const http = require('http'); const PORT = Number(process.env.PORT || 3975); let ck = ''
function req(m, p, b) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null; const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d); if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c); x.on('end', () => {
        if (x.headers['set-cookie']) ck = x.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, raw: o })
      })
    }); q.on('error', () => r({ s: 0, b: {}, raw: '' })); if (d) q.write(d); q.end()
  })
}
const pagina = p => new Promise(r => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r(o)) }))
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  let pass = 0, fail = 0
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + '  → ' + e)) }

  const mapa = await pagina('/criptomundo-mundo2d.html')

  console.log('\n── EL MAPA YA NO DECIDE NADA ──')
  ok('el mapa no tira el dado del crítico', !/const crit\s*=\s*Math\.random/.test(mapa))
  ok('el mapa no tira el dado del fallo', !/const miss\s*=\s*Math\.random/.test(mapa))
  ok('el mapa no tira el dado de la huida', !/const fled\s*=\s*Math\.random/.test(mapa))
  ok('el mapa no se reparte el oro', !/const goldGain\s*=/.test(mapa))
  ok('el mapa no elige el botín', !/LOOT_ITEMS/.test(mapa))
  ok('el mapa no tiene su propio generador de números', !/function roll\(min, max\)/.test(mapa))
  ok('la poción del atajo ya no cura de la nada', !/roll\(120,200\)/.test(mapa))
  // Los bichos del mapa traían su propia vida, ataque, oro y experiencia,
  // con otra escala que la del servidor. Eran los números con los que se
  // repartía el botín él solo.
  ok('los bichos del mapa ya no traen sus propios números de combate',
     !/name:'Troll Sombr[^']*',\s*level:5,\s*hp:/.test(mapa))

  console.log('\n── Y SÍ LE PREGUNTA AL SERVIDOR ──')
  ok('el mapa pide el turno a /api/combat/action', /\/api\/combat\/action/.test(mapa))
  ok('manda el id de monstruo del servidor', /monsterId: activeCombat\.servidor/.test(mapa))
  ok('encadena el combate por battleId', /battleId: activeCombat\.battleId/.test(mapa))
  ok('la poción del atajo pasa por /api/player/use', /\/api\/player\/use/.test(mapa))
  ok('enseña el error que devuelve el servidor', /r\.data\.error/.test(mapa))

  console.log('\n── TODOS LOS BICHOS DEL MAPA EXISTEN EN EL SERVIDOR ──')
  const cat = (await req('GET', '/api/monsters')).b.monsters || []
  const conocidos = new Set(cat.map(m => m.id))
  ok('el catálogo del servidor responde', cat.length > 0, 'devolvió ' + cat.length)

  // Cada monstruo declarado en el mapa lleva su id de servidor al lado.
  const declarados = [...mapa.matchAll(/servidor:'(m_[a-z_]+)'/g)].map(m => m[1])
  ok('el mapa declara a qué monstruo del servidor corresponde cada uno',
     declarados.length >= 8, 'encontrados ' + declarados.length)
  const huerfanos = declarados.filter(id => !conocidos.has(id))
  ok('ninguno apunta a un monstruo que el servidor no conoce',
     huerfanos.length === 0, huerfanos.join(', '))

  ok('el Murciélago Oscuro existe en el catálogo', conocidos.has('m_bat'))
  ok('el Liche Antiguo existe en el catálogo', conocidos.has('m_liche'))

  console.log('\n── Y SE PELEAN DE VERDAD ──')
  const u = 'mc' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  const antes = (await req('GET', '/api/player')).b.character
  let r = await req('POST', '/api/combat/action', { monsterId: 'm_bat', action: 'attack' })
  ok('se puede atacar al murciélago', r.s === 200, r.raw.slice(0, 80))
  ok('el servidor devuelve la vida que le queda', typeof r.b.newMonsterHp === 'number', String(r.b.newMonsterHp))
  ok('y su vida máxima escalada a este jugador', r.b.enemyMaxHp > 0, String(r.b.enemyMaxHp))
  const battleId = r.b.battleId
  ok('devuelve un identificador de combate', !!battleId)

  // Hasta matarlo: el oro y la experiencia tienen que subir EN EL SERVIDOR.
  let guard = 0, muerto = false
  while (!muerto && guard++ < 60) {
    await sleep(380)
    r = await req('POST', '/api/combat/action', { monsterId: 'm_bat', battleId, action: 'attack' })
    if (r.s !== 200) continue
    if (r.b.playerDied) { await req('POST', '/api/player/respawn', {}); continue }
    muerto = !!r.b.enemyDied
  }
  ok('el murciélago se puede matar', muerto, 'tras ' + guard + ' ataques')
  ok('el servidor reparte el oro', r.b.goldEarned > 0, String(r.b.goldEarned))
  ok('el servidor reparte la experiencia', r.b.xpEarned > 0, String(r.b.xpEarned))

  const despues = (await req('GET', '/api/player')).b.character
  ok('el oro quedó guardado en el personaje', despues.gold > antes.gold,
     antes.gold + ' → ' + despues.gold)
  ok('la baja quedó contada en el personaje', despues.monstersKilled > antes.monstersKilled,
     antes.monstersKilled + ' → ' + despues.monstersKilled)

  console.log('\n── EL CLIENTE NO PUEDE INVENTARSE UN ENEMIGO ──')
  r = await req('POST', '/api/combat/action', { monsterId: 'm_inventado', action: 'attack' })
  ok('un monstruo que no existe se rechaza', r.s === 404, String(r.s))

  console.log('\n── LOS BICHOS NUEVOS SUELTAN ALGO ──')
  // Un enemigo sin tabla de botín no suelta nada nunca, que es una
  // forma silenciosa de que el contenido nuevo no valga para nada.
  const fuente = require('fs').readFileSync(path.join(__dirname, 'src/server/30-personajes-combate.js'), 'utf8')
  // Solo dentro de LOOT_TABLES: la tabla de MONSTERS empieza igual y
  // buscar por el id a secas encontraba la ficha del bicho, no su botín.
  const tablas = fuente.slice(fuente.indexOf('const LOOT_TABLES'))
  const tabla = id => (tablas.split('\n').find(l => l.trim().startsWith(id + ':')) || '')
  ok('el murciélago tiene tabla de botín', tabla('m_bat').includes('leather'), tabla('m_bat').slice(0, 60))
  ok('el liche tiene tabla de botín', tabla('m_liche').includes('crystal'), tabla('m_liche').slice(0, 60))
  ok('el Anillo de Hueso ya cae de un enemigo, no solo de la forja',
     tabla('m_liche').includes('bone_ring'))

  // ─────────────────────────────────────────────────────────────────
  //  Y AHORA EJECUTANDO EL CÓDIGO DE LA PÁGINA DE VERDAD
  //
  //  Todo lo de arriba mira el texto del archivo servido. Eso caza que
  //  el combate falso ya no está, pero no demuestra que el nuevo
  //  funcione: es exactamente el error que documenta
  //  test-arena-navegador.js —"la prueba no ejecutaba el código de la
  //  página"— y que costó la v29.
  //
  //  Aquí se saca el <script> del combate de la página servida y se
  //  ejecuta en un DOM de mentira contra el servidor de verdad. Si
  //  combatAction() manda mal la petición, lee mal la respuesta o
  //  revienta, sale aquí.
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── EL CÓDIGO DE LA PÁGINA, EJECUTADO ──')

  const vm = require('vm')
  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const codigo = trozos.find(t => /async function combatAction/.test(t))
  ok('la página trae el módulo de combate', !!codigo, trozos.length + ' scripts')
  if (!codigo) { console.log('\n  ' + pass + ' OK · ' + fail + ' fallidas\n'); process.exit(1) }

  const elem = () => ({
    textContent: '', innerHTML: '', style: {}, className: '',
    classList: { toggle(c, on) { this._on = on }, add() {}, remove() {} },
    appendChild() {}, scrollTop: 0, scrollHeight: 0,
  })
  const els = {}
  const anotado = []
  const botones = [elem(), elem(), elem(), elem()]
  const escena = {
    monsterData: [{ label: { destroy() {} }, sombra: { destroy() {} } }],
    monsterTexts: [{}], monsterWalkTimers: [0],
    tweens: { add(o) { if (o.onComplete) o.onComplete() } },
    changeZone() { escena.zonaPedida = true },
  }

  const ventana = {
    document: {
      getElementById(id) { return els[id] || (els[id] = elem()) },
      querySelectorAll() { return botones },
      createElement() { return elem() },
    },
    console, setTimeout, clearTimeout, Math, Date, JSON, Promise, Number, String, Object, Array,
    PLAYER: { hp: 0, mp: 0, maxHp: 1, maxMp: 1, gold: 0 },
    activeCombat: null,
    combatBusy: false,
    gameScene: escena,
    addCombatLog(m, t) { anotado.push(m) },
    addLog(m, t) { anotado.push(m) },
    updateBars() {},
    showToast(m) { anotado.push(m) },
    async syncCharacter() { ventana.sincronizado = (ventana.sincronizado || 0) + 1 },
    closeCombat() { ventana.activeCombat = null; ventana.combatBusy = false },
    async apiPost(ruta, cuerpo) {
      const x = await req('POST', ruta, cuerpo)
      return { ok: x.s >= 200 && x.s < 300, data: x.b }
    },
  }
  ventana.window = ventana; ventana.globalThis = ventana
  const ctx = vm.createContext(ventana)
  let reventó = null
  try { vm.runInContext(codigo, ctx, { filename: 'mundo-combate', timeout: 5000 }) }
  catch (e) { reventó = e.message }
  ok('el módulo de combate se ejecuta sin reventar', !reventó, String(reventó))
  ok('define combatAction', typeof ventana.combatAction === 'function')

  // Un turno real contra el murciélago, llamando a la función de la página.
  ventana.activeCombat = { servidor: 'm_bat', sprite: '🦇', name: 'Murciélago Oscuro', level: 4, index: 0 }
  const oroAntes = (await req('GET', '/api/player')).b.character.gold
  await ventana.combatAction('attack')
  await sleep(50)

  ok('el turno deja un identificador de combate', !!ventana.activeCombat && !!ventana.activeCombat.battleId,
     String(ventana.activeCombat && ventana.activeCombat.battleId))
  ok('la vida del enemigo se pinta con números del servidor',
     /^\d+ \/ \d+ HP$/.test(els['cp-hp-txt'].textContent), els['cp-hp-txt'].textContent)
  ok('la vida del jugador la trae el servidor', ventana.PLAYER.hp > 0, String(ventana.PLAYER.hp))
  ok('el turno queda anotado en el registro', anotado.length > 0, anotado.slice(0, 2).join(' | '))
  ok('los botones se vuelven a habilitar tras el turno', ventana.combatBusy === false)

  // El enemigo anuncia un golpe fuerte cada 3 turnos. El aviso llega en
  // `telegraph.name`, y leyéndolo como `telegraph.nombre` no salía nunca:
  // la mecánica existía, estaba probada en el servidor y el jugador no
  // la veía.
  // Se insiste hasta VERLO, y se vuelve a empezar si el bicho muere
  // antes de anunciar nada.
  //
  // Antes eran tres turnos fijos. El enemigo anuncia su golpe cada tres
  // turnos suyos, y el murciélago se muere en cuatro golpes —en tres si
  // cae un crítico—, así que la ventana era justa y una de cada tantas
  // ejecuciones terminaba la pelea sin haber visto el aviso. En rojo sin
  // que hubiera nada roto: la cuarta vez que este repositorio tropieza
  // con lo mismo.
  let turnos = 0
  const nuevoMurcielago = () => ({ servidor: 'm_bat', sprite: '🦇', name: 'Murciélago Oscuro', level: 4, index: 0 })
  while (!anotado.some(m => /prepara/i.test(m)) && turnos++ < 40) {
    if (!ventana.activeCombat) { ventana.activeCombat = nuevoMurcielago(); ventana.sincronizado = false }
    await sleep(380)
    await ventana.combatAction('attack')
  }
  ok('el aviso de golpe fuerte llega a la pantalla',
     anotado.some(m => /prepara/i.test(m)), `tras ${turnos} turnos · ` + anotado.slice(-3).join(' | ').slice(0, 110))
  if (!ventana.activeCombat) { ventana.activeCombat = nuevoMurcielago(); ventana.sincronizado = false }

  // Y hasta matarlo: el oro tiene que subir EN EL SERVIDOR, no en PLAYER.
  let vueltas = 0
  while (ventana.activeCombat && !ventana.sincronizado && vueltas++ < 80) {
    await sleep(380)
    await ventana.combatAction('attack')
    if (ventana.PLAYER.hp <= 0) break
  }
  const oroDespues = (await req('GET', '/api/player')).b.character.gold
  ok('matando desde la página el oro sube en el servidor', oroDespues > oroAntes,
     oroAntes + ' → ' + oroDespues + ' tras ' + vueltas + ' turnos')
  ok('la página pide el personaje al servidor tras ganar', !!ventana.sincronizado)

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-mundo-combate.json', '/tmp/cm-mc-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-mundo-combate.json', BACKUP_DIR: '/tmp/cm-mc-b' }),
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
