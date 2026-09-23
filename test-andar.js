/**
 * CriptoMundo — el paso: andar sin tira de dibujos
 * Uso:  PORT=3894 node test-andar.js --spawn
 *
 * POR QUÉ EXISTE
 * `npm run arte` dice que faltan 77 archivos y que los seis que más se
 * notan son las animaciones de caminar: seis de los siete aspectos se
 * deslizaban por el mapa sin mover nada. Lo mismo con los demás
 * jugadores, y ahí además había un dato desperdiciado: el servidor
 * manda 'anim' —walk o idle— con cada vecino desde que existe el mundo
 * compartido, y la pantalla no lo leía.
 *
 * Lo que se comprueba aquí NO es que "quede bonito", que no se puede
 * medir. Es lo que sí se puede:
 *   · que estando quieto el cuerpo esté EXACTAMENTE en reposo, y que
 *     al parar vuelva a reposo y se quede ahí;
 *   · que la cadencia dependa de la distancia recorrida y no del
 *     reloj, que es lo que hace que andar despacio se vea andar
 *     despacio y no patalear en el sitio;
 *   · que el balanceo no dé un salto al envolverse la fase;
 *   · que los números estén acotados, o sea que esto no pueda estirar
 *     ni torcer al personaje más allá de lo declarado;
 *   · que la basura de entrada no salga como NaN a la pantalla;
 *   · y que los vecinos lo usen de verdad, ejecutando el módulo del
 *     mundo compartido contra un Phaser de mentira.
 */
const path = require('path'), { spawn } = require('child_process')
const http = require('http'), vm = require('vm'), fs = require('fs')
const PORT = Number(process.env.PORT || 3894)

const pagina = p => new Promise(r => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r(o)) }).on('error', () => r('')))

let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

// Un Phaser de mentira: solo lo que dibuja el mundo compartido.
function objeto(extra) {
  return Object.assign({
    x: 0, y: 0, escalaX: 1, escalaY: 1, angulo: 0, texto: '',
    setOrigin() { return this }, setDepth() { return this },
    setAlpha() { return this }, setVisible() { return this },
    setText(t) { this.texto = t; return this },
    setPosition(x, y) { this.x = x; this.y = y; return this },
    setScale(a, b) { this.escalaX = a; this.escalaY = b === undefined ? a : b; return this },
    setAngle(a) { this.angulo = a; return this },
    destroy() { this.destruido = true },
  }, extra)
}

async function run() {
  const mapa = await pagina('/criptomundo-mundo2d.html')

  console.log('\n── EL MAPA TRAE EL PASO ──')
  ok('la página se sirve', mapa.length > 5000, String(mapa.length))
  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const codPaso = trozos.find(t => /function pasoAndar\b/.test(t))
  ok('el mapa trae el módulo del paso', !!codPaso, trozos.length + ' scripts')
  ok('la cámara descuenta el bote del cuerpo',
     /setFollowOffset\(0, -this\.desvioCamara\)/.test(mapa))
  // El aspecto se carga por la red: el respaldo corre un rato antes de
  // que llegue la tira. Si el desvío no se pusiera también a cero, el
  // encuadre se quedaba torcido para siempre.
  ok('y lo pone a cero cuando el aspecto sí trae tira de dibujos',
     /this\.desvioCamara = 0/.test(mapa))
  ok('el paso solo se aplica si NO hay tira de dibujos',
     /if \(!this\.playerSprite && typeof pasoAndar === 'function'\)/.test(mapa))
  if (!codPaso) { fin() }

  const ctx = vm.createContext({ Math, Number, isFinite, console, JSON, Object })
  let reventó = null
  try { vm.runInContext(codPaso, ctx, { filename: 'paso-andar', timeout: 5000 }) }
  catch (e) { reventó = e.message }
  ok('el módulo se ejecuta sin reventar', !reventó, String(reventó))
  const { pasoAndar, pasoAndarNuevo, pasoAndarPintar } = ctx
  ok('exporta las tres piezas',
     typeof pasoAndar === 'function' && typeof pasoAndarNuevo === 'function'
     && typeof pasoAndarPintar === 'function')
  if (typeof pasoAndar !== 'function') fin()

  console.log('\n── QUIETO ES QUIETO ──')
  let st = pasoAndarNuevo()
  let p = pasoAndar(st, false, 0, 16)
  ok('parado, el cuerpo no sube', p.subida === 0, String(p.subida))
  ok('parado, el cuerpo no se ladea', p.ladeo === 0, String(p.ladeo))
  ok('parado, no se achata', p.anchoX === 1 && p.altoY === 1, p.anchoX + '/' + p.altoY)
  ok('parado, la sombra está entera', p.sombra === 1, String(p.sombra))
  // Andar y soltar: tiene que POSARSE, no congelarse a media zancada.
  for (let i = 0; i < 40; i++) pasoAndar(st, true, 2.8, 16)
  const enMarcha = pasoAndar(st, true, 2.8, 16)
  ok('andando sí se mueve el cuerpo', enMarcha.subida > 0 || Math.abs(enMarcha.ladeo) > 0,
     JSON.stringify(enMarcha))
  let fotogramas = 0, ultimo = enMarcha
  while (fotogramas < 200 && !(ultimo.subida === 0 && ultimo.ladeo === 0)) {
    ultimo = pasoAndar(st, false, 0, 16); fotogramas++
  }
  ok('al soltar la tecla vuelve a reposo exacto',
     ultimo.subida === 0 && ultimo.ladeo === 0 && ultimo.anchoX === 1 && ultimo.sombra === 1,
     JSON.stringify(ultimo))
  // El apagado declarado son 180 ms; se deja el margen de un fotograma.
  ok('y tarda en posarse lo que dice la constante, no un segundo',
     fotogramas * 16 <= 200, fotogramas * 16 + ' ms')
  ok('no se posa de golpe en un fotograma', fotogramas > 1, String(fotogramas))

  console.log('\n── LA CADENCIA LA MARCA LA DISTANCIA, NO EL RELOJ ──')
  // El mismo recorrido, partido en trozos distintos y con relojes
  // distintos, tiene que dejar la fase en el mismo sitio.
  const a = pasoAndarNuevo(), b = pasoAndarNuevo()
  for (let i = 0; i < 20; i++) pasoAndar(a, true, 5, 16)
  for (let i = 0; i < 50; i++) pasoAndar(b, true, 2, 40)
  ok('100 px recorridos dejan la misma zancada, a 16 ms o a 40 ms',
     Math.abs(a.fase - b.fase) < 1e-9, a.fase + ' vs ' + b.fase)

  // Andar despacio da MENOS apoyos por segundo. Se cuentan los apoyos
  // mirando cuándo el cuerpo pasa por abajo.
  const apoyos = (paso, segundos) => {
    const s = pasoAndarNuevo(); let n = 0, arriba = false
    const fotos = Math.round(segundos * 1000 / 16)
    for (let i = 0; i < fotos; i++) {
      const r = pasoAndar(s, true, paso, 16)
      if (!arriba && r.subida > 2.4) arriba = true
      else if (arriba && r.subida < 0.6) { arriba = false; n++ }
    }
    return n
  }
  const rapido = apoyos(2.8, 3), lento = apoyos(0.9, 3)
  ok('a velocidad máxima se dan varios apoyos por segundo',
     rapido >= 9 && rapido <= 24, rapido + ' en 3 s')
  ok('andando a un tercio de velocidad se dan aproximadamente un tercio de apoyos',
     lento > 0 && lento < rapido / 2, lento + ' vs ' + rapido)

  console.log('\n── SIN SALTOS, SIN DESBORDES, SIN NaN ──')
  const s2 = pasoAndarNuevo()
  // Calentar hasta fuerza 1 para que el salto no se confunda con la
  // entrada suave.
  for (let i = 0; i < 60; i++) pasoAndar(s2, true, 2.8, 16)
  let saltoMax = 0, prev = pasoAndar(s2, true, 2.8, 16)
  let subMax = 0, ladeoMax = 0, anchoMax = 0, altoMin = 2, sombraMin = 2
  let vueltas = 0
  for (let i = 0; i < 4000; i++) {
    const faseAntes = s2.fase
    const r = pasoAndar(s2, true, 2.8, 16)
    if (s2.fase < faseAntes) vueltas++
    saltoMax = Math.max(saltoMax, Math.abs(r.ladeo - prev.ladeo))
    subMax = Math.max(subMax, r.subida); ladeoMax = Math.max(ladeoMax, Math.abs(r.ladeo))
    anchoMax = Math.max(anchoMax, r.anchoX); altoMin = Math.min(altoMin, r.altoY)
    sombraMin = Math.min(sombraMin, r.sombra)
    prev = r
  }
  ok('la fase se envuelve muchas veces en la prueba', vueltas > 50, String(vueltas))
  // Un fotograma avanza 2,8/68 de vuelta ≈ 0,26 rad; el balanceo no
  // puede cambiar más de lo que cambia un seno en ese trozo.
  ok('el balanceo no pega un salto al envolverse la fase', saltoMax < 1.2, String(saltoMax))
  ok('el cuerpo no sube más de lo declarado', subMax <= 3.0001, String(subMax))
  ok('el balanceo no pasa de lo declarado', ladeoMax <= 4.0001, String(ladeoMax))
  ok('no se estira de ancho más de un 6 %', anchoMax <= 1.0601, String(anchoMax))
  ok('no se achata de alto más de un 8 %', altoMin >= 0.9199, String(altoMin))
  ok('la sombra se encoge, pero no desaparece', sombraMin >= 0.7799 && sombraMin < 1,
     String(sombraMin))
  ok('la fase sigue siendo un número después de 4.000 fotogramas',
     isFinite(s2.fase) && !Number.isNaN(s2.fase), String(s2.fase))

  // La sombra se estrecha cuando el cuerpo está ARRIBA, no al azar.
  const s3 = pasoAndarNuevo()
  for (let i = 0; i < 60; i++) pasoAndar(s3, true, 2.8, 16)
  let altoMasAlto = -1, sombraAhi = 1, sombraAbajo = 0, menorSubida = 99
  for (let i = 0; i < 300; i++) {
    const r = pasoAndar(s3, true, 2.8, 16)
    if (r.subida > altoMasAlto) { altoMasAlto = r.subida; sombraAhi = r.sombra }
    if (r.subida < menorSubida) { menorSubida = r.subida; sombraAbajo = r.sombra }
  }
  ok('con el cuerpo arriba la sombra está más pequeña que con el cuerpo abajo',
     sombraAhi < sombraAbajo, sombraAhi + ' vs ' + sombraAbajo)

  const basura = [undefined, null, NaN, Infinity, -5, '7', {}]
  let malo = null
  for (const v of basura) {
    const s = pasoAndarNuevo()
    for (const w of basura) {
      const r = pasoAndar(s, true, v, w)
      for (const k of Object.keys(r)) {
        if (!isFinite(r[k])) malo = k + '=' + r[k] + ' con dist=' + String(v) + ' dt=' + String(w)
      }
    }
    if (!isFinite(s.fase) || !isFinite(s.fuerza)) malo = 'estado ' + s.fase + '/' + s.fuerza
  }
  ok('la basura de entrada no sale como NaN a la pantalla', !malo, String(malo))
  ok('sin estado devuelve reposo en vez de reventar',
     JSON.stringify(pasoAndar(null, true, 5, 16)) ===
     JSON.stringify({ subida: 0, ladeo: 0, anchoX: 1, altoY: 1, sombra: 1 }))

  console.log('\n── PINTAR: VOLTEO Y ACHATE A LA VEZ ──')
  const cuerpo = objeto(), sombra = objeto()
  const q = { subida: 2, ladeo: 3, anchoX: 1.05, altoY: 0.95, sombra: 0.8 }
  pasoAndarPintar(cuerpo, sombra, -1, q)
  ok('mirando a la izquierda el cuerpo va volteado', cuerpo.escalaX < 0, String(cuerpo.escalaX))
  ok('y el achate sigue aplicándose', Math.abs(cuerpo.escalaX) === 1.05 && cuerpo.escalaY === 0.95,
     cuerpo.escalaX + '/' + cuerpo.escalaY)
  ok('el balanceo se refleja con el volteo', cuerpo.angulo === -3, String(cuerpo.angulo))
  ok('la sombra se encoge', sombra.escalaX === 0.8)
  pasoAndarPintar(cuerpo, sombra, 1, q)
  ok('mirando a la derecha no va volteado', cuerpo.escalaX === 1.05, String(cuerpo.escalaX))
  const roto = { setScale() { throw new Error('boom') }, setAngle() {} }
  let explotó = false
  try { pasoAndarPintar(roto, null, 1, q) } catch (e) { explotó = true }
  ok('si el dibujo falla no se lleva por delante el bucle', !explotó)
  ok('sin resultado no toca nada', (pasoAndarPintar(cuerpo, sombra, 1, null), true))

  console.log('\n── LOS VECINOS TAMBIÉN ANDAN ──')
  const codMundo = trozos.find(t => /function mundoInterpolar\b/.test(t))
  ok('el mapa trae el módulo del mundo compartido', !!codMundo)
  if (!codMundo) fin()
  ok('la pantalla lee el anim que manda el servidor', /o\.anim === 'walk'/.test(codMundo))

  const avisos = []
  const ventana = {
    console, Math, Date, JSON, Promise, Number, String, Object, Array, isFinite, setTimeout,
    pasoAndar, pasoAndarNuevo, pasoAndarPintar,
    currentZone: 'pueblo',
    addLog(m) { avisos.push(m) },
    apiPost: async () => ({ ok: false, data: {} }),
    WebSocket: undefined,
    navigator: {}, location: { protocol: 'http:', host: 'x' },
    addEventListener() {},
  }
  ventana.window = ventana; ventana.globalThis = ventana
  ventana.gameScene = {
    MW: 1800, MH: 1200, px: 0, py: 0, lastDir: 'right', andando: false,
    game: { loop: { delta: 16 } },
    add: {
      ellipse() { return objeto({ tipo: 'elipse' }) },
      text(x, y, t) { return objeto({ x, y, texto: t, tipo: 'texto' }) },
    },
  }
  const ctx2 = vm.createContext(ventana)
  let reventó2 = null
  try { vm.runInContext(codMundo, ctx2, { filename: 'mundo-compartido', timeout: 5000 }) }
  catch (e) { reventó2 = e.message }
  ok('el módulo del mundo compartido se ejecuta', !reventó2, String(reventó2))

  const vecino = {
    usuario: 'otro', nombre: 'Otro', nivel: 3, x: 400, y: 300,
    anim: 'walk', dir: 0, aspecto: { emoji: '🧝' }, arma: { icono: '🗡️' },
  }
  ventana.mundoPintarVecinos([vecino])
  const o = ventana.OTROS.otro
  ok('el vecino se dibuja', !!o)
  ok('y se le guarda su propio paso', !!(o && o.paso))
  ok('y el anim que mandó el servidor', o && o.anim === 'walk', o && o.anim)

  // Moverle de verdad y dejar que el bucle interpole unos fotogramas.
  let boteMax = 0, escalaVista = new Set()
  for (let i = 0; i < 120; i++) {
    vecino.x += 6
    ventana.mundoPintarVecinos([vecino])
    ventana.mundoInterpolar(ventana.gameScene)
    boteMax = Math.max(boteMax, Math.abs(o.cuerpo.y - o.y))
    escalaVista.add(Math.round(o.sombra.escalaX * 100))
  }
  ok('al andar, el vecino bota', boteMax > 0.5, String(boteMax))
  ok('y su sombra cambia de tamaño', escalaVista.size > 3, String(escalaVista.size))
  ok('la etiqueta del nombre NO bota', o.etiqueta.y === o.y - 22,
     o.etiqueta.y + ' vs ' + (o.y - 22))
  ok('y mira hacia donde anda', o.sentido === 1, String(o.sentido))

  // Andando hacia atrás se voltea.
  for (let i = 0; i < 20; i++) {
    vecino.x -= 8
    ventana.mundoPintarVecinos([vecino])
    ventana.mundoInterpolar(ventana.gameScene)
  }
  ok('andando hacia la izquierda se voltea', o.sentido === -1, String(o.sentido))
  ok('y el arma le acompaña al otro lado', o.arma.x < o.x, o.arma.x + ' vs ' + o.x)

  // Quieto: el cuerpo tiene que volver a posarse sobre su sitio.
  vecino.anim = 'idle'
  ventana.mundoPintarVecinos([vecino])
  for (let i = 0; i < 80; i++) ventana.mundoInterpolar(ventana.gameScene)
  ok('parado, el vecino deja de botar', Math.abs(o.cuerpo.y - o.y) < 1e-9,
     String(o.cuerpo.y - o.y))
  ok('y su sombra vuelve a estar entera', o.sombra.escalaX === 1, String(o.sombra.escalaX))

  fin()
}

function fin() {
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-andar.json', '/tmp/cm-andar-b')
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-andar.json', BACKUP_DIR: '/tmp/cm-andar-b',
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
