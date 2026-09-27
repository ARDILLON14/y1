/**
 * CriptoMundo — pelear con el dedo
 * Uso:  PORT=3906 node test-tactil-combate.js --spawn
 *
 * POR QUÉ EXISTE
 * La regla R4 del encargo dice "táctil tan jugable como ratón", y no lo
 * era: en un teléfono te movías por el mundo y NO PODÍAS DAR UN GOLPE.
 * La función de apuntado táctil estaba escrita y no la llamaba nadie —
 * código muerto que parecía hecho, que es peor que código que falta.
 *
 * Lo que se comprueba aquí es lo que decide si se puede jugar con el
 * dedo: que los botones existan y sean de un tamaño que un dedo acierte,
 * que tocar apunte al bicho más cercano, que arrastrar apunte hacia
 * donde arrastras, que el escudo avise cuando el enemigo anuncia, y que
 * ninguno se quede pulsado si el dedo se va de la pantalla.
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3906)
let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const pagina = p => new Promise(r => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r(o)) }).on('error', () => r('')))

// Un DOM de mentira con lo justo: elementos con clases, oyentes y
// rectángulo. Suficiente para ejecutar los botones de verdad.
function hacerDom() {
  const oyentes = {}
  const hecho = {}
  function elemento(id, rect) {
    return {
      id,
      _clases: new Set(),
      classList: {
        add: c => elementos[id]._clases.add(c),
        remove: c => elementos[id]._clases.delete(c),
        contains: c => elementos[id]._clases.has(c),
        toggle: (c, v) => v ? elementos[id]._clases.add(c) : elementos[id]._clases.delete(c),
      },
      addEventListener(t, f) { (oyentes[id + ':' + t] = oyentes[id + ':' + t] || []).push(f) },
      getBoundingClientRect: () => rect,
    }
  }
  const elementos = {
    'btn-atacar': null, 'btn-escudo': null,
  }
  elementos['btn-atacar'] = elemento('btn-atacar', { left: 300, top: 500, width: 72, height: 72 })
  elementos['btn-escudo'] = elemento('btn-escudo', { left: 220, top: 470, width: 56, height: 56 })
  return { elementos, oyentes,
    disparar(id, tipo, ev) {
      for (const f of (oyentes[id + ':' + tipo] || [])) f(ev)
    },
    dispararVentana(tipo, ev) { for (const f of (oyentes['__win:' + tipo] || [])) f(ev) },
    registrarVentana(t, f) { (oyentes['__win:' + t] = oyentes['__win:' + t] || []).push(f) },
  }
}

async function run() {
  const mapa = await pagina('/criptomundo-mundo2d.html')
  ok('el mapa se sirve', mapa.length > 5000, String(mapa.length))

  console.log('\n── LOS BOTONES EXISTEN Y SE PUEDEN PULSAR CON UN DEDO ──')
  ok('hay botón de atacar', /id="btn-atacar"/.test(mapa))
  ok('y de bloquear', /id="btn-escudo"/.test(mapa))
  ok('los dos dentro del mando táctil, que solo sale con dedo',
     /id="mando-tactil"[\s\S]{0,400}id="btn-atacar"/.test(mapa))
  ok('el mando táctil se esconde si hay ratón',
     /@media \(hover: none\) and \(pointer: coarse\)/.test(mapa))
  const tam = id => {
    const m = new RegExp('#' + id + ' \\{[^}]*?width:(\\d+)px; height:(\\d+)px').exec(mapa)
    return m ? [Number(m[1]), Number(m[2])] : null
  }
  const ta = tam('btn-atacar'), te = tam('btn-escudo')
  ok('el de atacar mide los 72 px que pide el encargo',
     ta && ta[0] === 72 && ta[1] === 72, JSON.stringify(ta))
  ok('el de bloquear no baja de 44, que es un dedo',
     te && te[0] >= 44 && te[1] >= 44, JSON.stringify(te))
  // Y que no se pisen entre ellos ni con lo que ya había.
  const pos = id => {
    const m = new RegExp('#' + id + ' \\{[^}]*?right:(\\d+)px; bottom:(\\d+)px').exec(mapa)
    return m ? { right: Number(m[1]), bottom: Number(m[2]) } : null
  }
  const pa = pos('btn-atacar'), pe = pos('btn-escudo')
  const paccion = pos('btn-accion')
  ok('atacar no se solapa con el botón de interactuar que ya estaba',
     pa && paccion && (pa.bottom - paccion.bottom) >= 72,
     JSON.stringify({ atacar: pa, accion: paccion }))
  ok('y el escudo no se solapa con atacar',
     pa && pe && (pe.right - pa.right) >= (ta ? ta[0] : 72) - 8,
     JSON.stringify({ atacar: pa, escudo: pe }))
  ok('el escudo se resalta cuando el enemigo anuncia',
     /#btn-escudo\.avisa/.test(mapa) && /latido-escudo/.test(mapa))

  console.log('\n── EL CÓDIGO, EJECUTADO CON TOQUES DE MENTIRA ──')
  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const cod = trozos.find(t => /function mcMontarBotonesTactiles\b/.test(t))
  ok('el módulo del combate está en la página', !!cod)
  if (!cod) return fin()

  const dom = hacerDom()
  const ctx = {
    Math, Number, String, Date, console, JSON, Object, Array, isFinite, parseInt,
    setTimeout: (f) => { f(); return 0 }, setInterval: () => 0,
    document: {
      getElementById: id => dom.elementos[id] || null,
      addEventListener: () => {},
    },
    window: { addEventListener: (t, f) => dom.registrarVentana(t, f), innerWidth: 400, innerHeight: 800 },
    apiGet: async () => ({ ok: false }), apiPost: async () => ({ ok: false }),
    addLog: () => {}, currentZone: 'forest',
    MUNDO_ESPACIO: { ancho: 1800, alto: 1200 },
    gameScene: { px: 900, py: 600, lastDir: 'right', andando: false, MW: 1800, MH: 1200 },
    desvioDeNumero: () => 0, numeroFlotante: () => ({ vivo: false }),
    temblorDeCamara: () => ({ x: 0, y: 0 }), temblorActivo: () => false,
    poseArma: () => ({ angulo: 0, offsetX: 0, offsetY: 0, escala: 1 }),
    faseDeGolpe: () => ({ fase: 'reposo', progreso: 0 }), volteoDeArma: () => 1,
  }
  ctx.globalThis = ctx
  vm.createContext(ctx)
  let reventó = null
  try { vm.runInContext(cod, ctx, { filename: 'combate' }) } catch (e) { reventó = e.message }
  ok('el módulo se ejecuta sin reventar', !reventó, String(reventó))

  ctx.mcMontarBotonesTactiles()
  ctx.MC.activo = true
  ctx.MC.arma = { tipoUso: 'espada', arco: 1.6, alcance: 72, cadenciaMs: 400, icono: '⚔️' }

  // Un monstruo a la izquierda del jugador, dentro del alcance útil.
  ctx.MC.monstruos = { m1: { x: 830, y: 600, avisando: false } }

  const toque = (x, y) => ({ changedTouches: [{ clientX: x, clientY: y, identifier: 1 }], preventDefault() {} })
  // El centro del botón de atacar está en (336, 536).
  dom.disparar('btn-atacar', 'touchstart', toque(336, 536))
  ok('tocar el botón deja el ataque pulsado', ctx.MC.pulsado === true)
  ok('y apunta solo al monstruo más cercano, que está a la izquierda',
     Math.abs(Math.abs(ctx.MC.apuntar) - Math.PI) < 0.01, String(ctx.MC.apuntar))
  ok('el botón se marca como pulsado', dom.elementos['btn-atacar'].classList.contains('pulsado'))
  ok('y arranca el gesto sin esperar al servidor', !!ctx.MC.golpeLocal)

  // Arrastrar hacia la derecha: manda el arrastre, no el bicho.
  dom.disparar('btn-atacar', 'touchmove', toque(436, 536))
  ok('arrastrar apunta hacia donde arrastras, no al bicho',
     Math.abs(ctx.MC.apuntar) < 0.01, String(ctx.MC.apuntar))
  ok('y se sigue pegando mientras no sueltes', ctx.MC.pulsado === true)
  // Hacia arriba.
  dom.disparar('btn-atacar', 'touchmove', toque(336, 436))
  ok('arrastrar hacia arriba apunta hacia arriba',
     Math.abs(ctx.MC.apuntar + Math.PI / 2) < 0.01, String(ctx.MC.apuntar))
  // Un movimiento minúsculo es el dedo temblando, no un arrastre.
  dom.disparar('btn-atacar', 'touchmove', toque(344, 540))
  ok('un temblor de 8 px no cuenta como arrastre: vuelve al automático',
     Math.abs(Math.abs(ctx.MC.apuntar) - Math.PI) < 0.01, String(ctx.MC.apuntar))

  dom.disparar('btn-atacar', 'touchend', toque(336, 536))
  ok('al soltar deja de pegar', ctx.MC.pulsado === false)
  ok('y el botón deja de estar marcado', !dom.elementos['btn-atacar'].classList.contains('pulsado'))

  console.log('\n── SIN NADIE CERCA, SE APUNTA HACIA DONDE MIRAS ──')
  ctx.MC.monstruos = {}
  ctx.gameScene.lastDir = 'up'
  dom.disparar('btn-atacar', 'touchstart', toque(336, 536))
  ok('sin monstruos, apunta hacia donde mira el personaje',
     Math.abs(ctx.MC.apuntar + Math.PI / 2) < 0.01, String(ctx.MC.apuntar))
  dom.disparar('btn-atacar', 'touchend', toque(336, 536))
  // Y uno lejísimos no cuenta.
  ctx.MC.monstruos = { lejos: { x: 1700, y: 600, avisando: false } }
  ctx.gameScene.lastDir = 'down'
  dom.disparar('btn-atacar', 'touchstart', toque(336, 536))
  ok('un monstruo a 800 px no se apunta solo: está fuera del alcance útil',
     Math.abs(ctx.MC.apuntar - Math.PI / 2) < 0.01, String(ctx.MC.apuntar))
  dom.disparar('btn-atacar', 'touchend', toque(336, 536))

  console.log('\n── EL ESCUDO ──')
  dom.disparar('btn-escudo', 'touchstart', toque(248, 498))
  ok('tocar el escudo bloquea', ctx.MC.bloquear === true)
  ok('y se marca', dom.elementos['btn-escudo'].classList.contains('pulsado'))
  dom.disparar('btn-escudo', 'touchend', toque(248, 498))
  ok('al soltar deja de bloquear', ctx.MC.bloquear === false)

  ctx.MC.monstruos = { m1: { x: 830, y: 600, avisando: true } }
  ctx.mcAvisoEscudo()
  ok('cuando un monstruo anuncia, el escudo se resalta',
     dom.elementos['btn-escudo'].classList.contains('avisa'))
  ctx.MC.monstruos.m1.avisando = false
  ctx.mcAvisoEscudo()
  ok('y deja de resaltarse cuando pasa el aviso',
     !dom.elementos['btn-escudo'].classList.contains('avisa'))

  console.log('\n── NADA SE QUEDA PULSADO ──')
  // El caso que deja a un jugador bloqueando para siempre: el dedo se
  // va de la pantalla, o la pestaña pierde el foco, y nadie suelta.
  dom.disparar('btn-atacar', 'touchstart', toque(336, 536))
  dom.disparar('btn-escudo', 'touchstart', toque(248, 498))
  ok('los dos están pulsados', ctx.MC.pulsado === true && ctx.MC.bloquear === true)
  dom.dispararVentana('blur', {})
  ok('perder el foco suelta el ataque', ctx.MC.pulsado === false)
  ok('y el escudo', ctx.MC.bloquear === false)
  ok('y los dos se desmarcan',
     !dom.elementos['btn-atacar'].classList.contains('pulsado') &&
     !dom.elementos['btn-escudo'].classList.contains('pulsado'))
  dom.disparar('btn-atacar', 'touchstart', toque(336, 536))
  dom.disparar('btn-atacar', 'touchcancel', toque(336, 536))
  ok('cancelar el toque también suelta', ctx.MC.pulsado === false)

  console.log('\n── SI NO HAY BOTONES, NO SE CAE NADA ──')
  const ctx2 = Object.assign({}, ctx)
  ctx2.document = { getElementById: () => null, addEventListener: () => {} }
  let reventó2 = null
  try { ctx.mcMontarBotonesTactiles.call(null) } catch (e) { reventó2 = e.message }
  ok('montar los botones dos veces no revienta', !reventó2, String(reventó2))

  fin()
}

function fin() {
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  for (const r of ['/tmp/cm-tac.json', '/tmp/cm-tac-b']) { try { fs.rmSync(r, { recursive: true, force: true }) } catch {} }
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-tac.json', BACKUP_DIR: '/tmp/cm-tac-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  const esperar = () => new Promise(res => {
    const hasta = Date.now() + 30000
    const probar = () => {
      const r = http.get({ host: 'localhost', port: PORT, path: '/api/health' }, x => { x.resume(); res(true) })
      r.on('error', () => { if (Date.now() > hasta) res(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
  esperar().then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }
