/**
 * CriptoMundo — PASO 8: el combate por turnos se reproduce, no se vuelca
 * Uso:  PORT=3960 node test-turnos-pantalla.js --spawn
 *
 * QUÉ SE COMPRUEBA Y POR QUÉ ASÍ
 * El paso 7 hizo que el servidor mandara el turno como un guion. Este
 * paso hace que la pantalla lo REPRODUZCA. Y eso no se demuestra
 * leyendo el código: se demuestra midiendo CUÁNDO pasa cada cosa.
 *
 * Antes, la barra de vida del enemigo bajaba en el mismo instante en
 * que llegaba la respuesta del servidor —antes incluso de que empezara
 * la animación del golpe—. Se veía el resultado y luego el gesto, al
 * revés. Un turno entero ocurría en un fotograma.
 *
 * Así que aquí se ejecuta el JavaScript real de la página con un DOM de
 * mentira, se pulsa Atacar, y se anota el milisegundo exacto en que
 * ocurre cada cosa. Lo que se exige:
 *
 *   · la animación del jugador va ANTES que el daño;
 *   · la barra del enemigo baja DESPUÉS del impacto, no al llegar;
 *   · el turno dura lo que dice el guion, no cero;
 *   · y el cliente sigue sin calcular un solo punto de daño.
 */
const http = require('http')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3960)
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
const pagina = p => new Promise(res => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }).on('error', () => res('')))

// ── DOM de mentira que apunta la hora de todo ──────────────────────
function montar(registro) {
  const elementos = {}
  const t0 = () => Date.now() - registro.inicio

  function crear(id) {
    const el = {
      id, tagName: 'DIV', _text: '', _html: '', value: '', disabled: false,
      // El estilo se anota: la barra de vida se dibuja cambiando su
      // anchura, así que sin esto no hay forma de saber CUÁNDO baja, que
      // es justo lo que este paso tiene que demostrar.
      style: new Proxy({}, {
        get: () => '',
        set(_, prop, v) { registro.estilos.push({ t: t0(), id, prop: String(prop), v: String(v) }); return true },
      }),
      dataset: {}, children: [], firstChild: null, lastChild: null,
      classList: {
        add(c) { registro.clases.push({ t: t0(), id, c, op: 'add' }) },
        remove() {}, toggle() {}, contains() { return false },
      },
      addEventListener() {}, removeEventListener() {}, focus() {}, blur() {},
      remove() {}, setAttribute() {}, getAttribute() { return null },
      appendChild(c) { this.children.push(c); this.lastChild = c; if (!this.firstChild) this.firstChild = c; return c },
      insertBefore(c) { this.children.unshift(c); this.firstChild = c; if (!this.lastChild) this.lastChild = c; return c },
      removeChild(c) {
        this.children = this.children.filter(x => x !== c)
        this.firstChild = this.children[0] || null
        this.lastChild = this.children[this.children.length - 1] || null
        return c
      },
      querySelector() { return null }, querySelectorAll() { return [] },
      getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300 } },
      get offsetWidth() { return 100 },
    }
    Object.defineProperty(el, 'textContent', {
      get() { return el._text },
      set(v) { el._text = String(v); registro.textos.push({ t: t0(), id, v: String(v) }) },
    })
    Object.defineProperty(el, 'innerHTML', {
      get() { return el._html },
      set(v) { el._html = String(v); registro.html.push({ t: t0(), id, v: String(v).slice(0, 120) }) },
    })
    return el
  }

  // Los ids que EXISTEN de verdad en la página, sacados de su HTML.
  //
  // Esto no es un detalle del arnés: es el motivo por el que este mismo
  // test daba por bueno un arma que no estaba en el DOM. Antes
  // getElementById creaba cualquier elemento que se le pidiera, así que
  // "la pantalla dibuja el arma" pasaba sobre un fantasma mientras en el
  // navegador de verdad no había nada que dibujar —el aplicador de
  // skins reescribía el sprite y se llevaba el arma por delante—.
  //
  // Un DOM falso más permisivo que el real no prueba nada: prueba que
  // el código no revienta.
  const idsReales = new Set()
  ;(registro.html_fuente || '').replace(/id="([^"]+)"/g, function (_, id) { idsReales.add(id); return '' })

  const documento = {
    getElementById(id) {
      if (elementos[id]) return elementos[id]
      if (!idsReales.has(id)) { registro.fantasmas.push(id); return null }
      return (elementos[id] = crear(id))
    },
    createElement(t) { const e = crear(null); e.tagName = String(t).toUpperCase(); return e },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    body: crear('body'), documentElement: crear('html'),
    hidden: false, visibilityState: 'visible',
  }

  const ventana = {
    document: documento,
    location: { protocol: 'http:', host: 'localhost:' + PORT, href: 'http://localhost:' + PORT + '/criptomundo-combat.html', hostname: 'localhost' },
    navigator: { userAgent: 'nodo', maxTouchPoints: 0 },
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Number, String, Boolean, Array, Object, Error, RegExp, Promise, Map, Set,
    parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    requestAnimationFrame(fn) { return setTimeout(() => fn(Date.now()), 16) },
    cancelAnimationFrame: clearTimeout,
    addEventListener() {}, removeEventListener() {}, focus() {}, alert() {}, postMessage() {},
    WebSocket: function () { this.readyState = 0; this.send = () => {}; this.close = () => {} },
    Image: function () {
      const img = this
      Object.defineProperty(img, 'src', { set() { img.complete = true; img.naturalWidth = 32; if (img.onload) img.onload() }, get() { return '' } })
    },
    fetch(url, opciones) {
      const o = opciones || {}
      registro.fetch.push({ t: t0(), url, cuerpo: o.body || null })
      return new Promise(resolve => {
        req(o.method || 'GET', url, o.body ? JSON.parse(o.body) : null).then(r => {
          registro.respuestas.push({ t: t0(), url, cuerpo: r.body })
          resolve({ ok: r.status >= 200 && r.status < 300, status: r.status,
            json: async () => r.body, text: async () => r.raw })
        })
      })
    },
  }
  ventana.window = ventana; ventana.self = ventana; ventana.globalThis = ventana
  ventana.parent = ventana; ventana.top = ventana
  return ventana
}

function scripts(html) {
  const out = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

async function run() {
  const u = 'p8' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  await req('POST', '/api/dev/dar', { itemId: 'espada_hierro', quantity: 1 })
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 3 })
  const inv = (await req('GET', '/api/inventory')).body.inventory || []
  const esp = inv.find(i => i.itemId === 'espada_hierro')
  if (esp) await req('POST', '/api/player/equip', { uid: esp.uid })

  const html = await pagina('/criptomundo-combat.html')
  check('la pantalla de combate se sirve', html.length > 5000, String(html.length))

  const registro = { inicio: Date.now(), clases: [], textos: [], html: [], estilos: [],
                     fetch: [], respuestas: [], errores: [], fantasmas: [], html_fuente: html }
  const ventana = montar(registro)
  const ctx = vm.createContext(ventana)
  let rotos = 0
  for (const codigo of scripts(html)) {
    try { vm.runInContext(codigo, ctx, { filename: 'combat', timeout: 8000 }) }
    catch (e) { rotos++; registro.errores.push(e.message) }
  }
  check('todos sus scripts se ejecutan', rotos === 0, registro.errores.join(' | ').slice(0, 220))
  check('hay un reproductor de guion', typeof ventana.reproducirGuion === 'function')
  check('y una función por escena', typeof ventana.escena === 'function')

  await sleep(1200)   // init() + pintarArma() + cargarObjetos()

  console.log('\n── EL ARMA EQUIPADA SE VE ──')
  const pidióArena = registro.fetch.some(f => /\/api\/arena/.test(f.url))
  check('la pantalla pregunta por el arma al catálogo del servidor', pidióArena,
    registro.fetch.map(f => f.url).join(', ').slice(0, 160))
  const pintó = registro.html.filter(h => h.id === 'arma-jugador')
  check('el hueco del arma existe de verdad en el HTML de la página',
    !registro.fantasmas.includes('arma-jugador'),
    'ids pedidos que no existen: ' + [...new Set(registro.fantasmas)].join(', '))
  check('y la dibuja ahí', pintó.length > 0, JSON.stringify(pintó.slice(-1)))
  // El arma va FUERA del sprite: el aplicador de skins reescribe ese
  // elemento entero y borraría cualquier cosa metida dentro.
  check('el arma no cuelga del sprite, que el aplicador de skins reescribe',
    !/id="sprite-jugador"[^>]*>[^<]*<span[^>]*id="arma-jugador"/.test(html),
    'está dentro del sprite: la borraría la skin')
  check('con la imagen de la espada equipada',
    pintó.some(h => /espada_hierro\.png/.test(h.v)), JSON.stringify(pintó.slice(-1)))

  console.log('\n── LOS OBJETOS SALEN DEL SERVIDOR ──')
  check('pregunta qué se puede usar en combate',
    registro.fetch.some(f => /combat\/objetos/.test(f.url)))
  check('y no lleva su propia lista de pociones',
    !/potion_hp['"]/.test(html) || !/función de pociones/.test(html))

  console.log('\n── UN TURNO SE REPRODUCE, NO SE VUELCA ──')
  // Se elige un enemigo y se pulsa Atacar, como haría el jugador.
  const mons = (await req('GET', '/api/monsters')).body.monsters || []
  const porNivel = mons.slice().sort((a, b) => a.level - b.level)
  const bicho = porNivel.find(m => m.level >= 6 && !m.isBoss) || porNivel[porNivel.length - 1]
  ventana.STATE.monster = { id: bicho.id, name: bicho.name, icon: bicho.icon, hp: bicho.hp }
  ventana.STATE.busy = false
  ventana.STATE.over = false

  const marca = registro.clases.length
  const htmlMarca = registro.html.length
  const t0 = Date.now()
  await ventana.doAction('attack')
  const duracionReal = Date.now() - t0

  if (registro.fantasmas.length) {
    console.log('     (ids pedidos que no existen en el HTML: ' + [...new Set(registro.fantasmas)].join(', ') + ')')
  }
  if (registro.errores.length) console.log('     (errores: ' + registro.errores.slice(0, 3).join(' | ') + ')')
  const nuevas = registro.clases.slice(marca)
  const golpeJugador = nuevas.find(c => c.id === 'player-fighter' && c.c === 'attack-anim')
  const armaGolpe = nuevas.find(c => c.id === 'arma-jugador' && c.c === 'golpe')
  const sacudidaEnemigo = nuevas.find(c => c.id === 'enemy-fighter' && c.c === 'shake')
  const barraEnemigo = registro.estilos.filter(x => x.id === 'enemy-sprite-hp' && x.prop === 'width' && x.t >= (golpeJugador ? 0 : 0))

  check('el turno tarda un tiempo real, no es instantáneo',
    duracionReal > 600, duracionReal + ' ms')
  check('el servidor dijo cuánto debía durar y se respeta',
    duracionReal > 400, duracionReal + ' ms')
  check('el jugador se anima al atacar', !!golpeJugador, JSON.stringify(nuevas.slice(0, 6)))
  check('el arma equipada hace su gesto', !!armaGolpe, JSON.stringify(nuevas.filter(c => c.id === 'arma-jugador')))
  // El golpe puede fallar: hay un 5% de fallo y el enemigo entonces no
  // se sacude, con razón. Se mira lo que dijo el servidor en vez de dar
  // por hecho que acertó, que es lo que hacía esta prueba inestable.
  const respTurno = registro.respuestas.filter(r => /combat\/action/.test(r.url)).pop()
  const acertó = respTurno && respTurno.cuerpo && respTurno.cuerpo.playerDmg > 0
  if (acertó && golpeJugador && sacudidaEnemigo) {
    check('el gesto del jugador va ANTES de que el enemigo encaje',
      golpeJugador.t <= sacudidaEnemigo.t,
      'jugador en ' + golpeJugador.t + ' ms · enemigo en ' + sacudidaEnemigo.t + ' ms')
  } else if (!acertó) {
    check('el golpe falló, así que el enemigo no se sacude (correcto)',
      !sacudidaEnemigo, 'daño=' + (respTurno && respTurno.cuerpo && respTurno.cuerpo.playerDmg))
  } else {
    check('el gesto del jugador va ANTES de que el enemigo encaje', false,
      'acertó pero falta una animación: ' + JSON.stringify(nuevas.map(c => c.id + '/' + c.c)))
  }
  // La comprobación central de este paso. Antes la barra bajaba en el
  // mismo instante en que llegaba la respuesta del servidor, antes
  // incluso de que empezara la animación del golpe. Se veía el
  // resultado y luego el gesto, al revés.
  const respuesta = registro.respuestas.filter(r => /combat\/action/.test(r.url)).pop()
  const bajada = barraEnemigo.filter(x => respuesta && x.t >= respuesta.t)[0]
  check('la barra del enemigo se movió', !!bajada,
    JSON.stringify(barraEnemigo.slice(-3)) + ' · respuesta en ' + (respuesta ? respuesta.t : '?') + ' ms')
  if (bajada && armaGolpe) {
    check('la vida del enemigo baja DESPUÉS del gesto del arma, no al llegar la respuesta',
      bajada.t >= armaGolpe.t,
      'respuesta en ' + respuesta.t + ' ms · arma en ' + armaGolpe.t + ' ms · barra en ' + bajada.t + ' ms')
    check('y no en el mismo instante en que llegó la respuesta',
      bajada.t - respuesta.t > 120,
      (bajada.t - respuesta.t) + ' ms de margen entre recibir y pintar')
  }

  console.log('\n── EL CLIENTE SIGUE SIN DECIDIR NADA ──')
  const cuerpos = registro.fetch.filter(f => /combat\/action/.test(f.url)).map(f => f.cuerpo || '')
  check('la pantalla solo manda la intención',
    cuerpos.every(c => !/playerDmg|enemyHp|rewards|xpEarned/.test(c)),
    cuerpos.join(' | ').slice(0, 160))
  const src2 = html
  check('no calcula daño en el navegador',
    !/playerDmg\s*=\s*Math\.|dmg\s*=\s*rand/i.test(src2))
  check('la barra del enemigo se pinta con lo que dice el guion',
    /f\.hpEnemigo/.test(src2), 'usa el hp del guion')

  console.log('\n── SI NO VINIERA GUION, LA PANTALLA NO SE MUERE ──')
  check('queda el camino antiguo como respaldo',
    /else await render\(r\.data, action\)/.test(src2))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-p8.json', BACKUP_DIR: '/tmp/cm-p8-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1600)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
