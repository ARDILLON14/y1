/**
 * CriptoMundo — los recursos del mundo, vistos desde la pantalla
 * Uso:  PORT=3976 node test-mundo-recursos.js --spawn
 *
 * POR QUÉ EXISTE
 * El sistema de recolección física llevaba versiones entero y probado
 * en el servidor —árboles con vida, herramienta requerida, durabilidad,
 * botín y reaparición, 47 comprobaciones en verde— y NO LO LLAMABA
 * NADIE. /api/recursos y /api/recursos/golpear no aparecían en ninguna
 * pantalla, y hasta las coordenadas de cada nodo traían un comentario
 * diciendo que el cliente las usaba para dibujarlos.
 *
 * test-recursos.js ya comprueba las reglas hablando con el servidor a
 * pelo. Lo que no podía comprobar es que exista una pantalla que las
 * use, que es justo donde estaba el agujero. Aquí se descarga el mapa,
 * se saca su módulo de recursos y SE EJECUTA contra el servidor de
 * verdad: si no pide los nodos, si no manda la posición o si no lee la
 * respuesta, sale aquí.
 */
const path = require('path'), { spawn } = require('child_process')
const http = require('http'), vm = require('vm')
const PORT = Number(process.env.PORT || 3976); let ck = ''
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
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

  const mapa = await pagina('/criptomundo-mundo2d.html')

  console.log('\n── EL MAPA YA CONOCE LOS RECURSOS ──')
  ok('el mapa pide los nodos al servidor', /\/api\/recursos/.test(mapa))
  ok('y manda el golpe', /\/api\/recursos\/golpear/.test(mapa))
  ok('manda dónde está el jugador', /pos: \{ x: escena\.px/.test(mapa))
  ok('los carga al entrar en una zona', /cargarRecursos\(this\)/.test(mapa))
  ok('los mantiene en el bucle del mundo', /actualizarRecursos\(this\)/.test(mapa))
  ok('ESPACIO tala si hay un nodo delante', /hayNodoDelante\(\)\) golpearNodoCercano/.test(mapa))
  ok('y sigue atacando si no lo hay', /else triggerAction\('attack'\)/.test(mapa))

  console.log('\n── EL CÓDIGO DE LA PÁGINA, EJECUTADO ──')
  const u = 'rc' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  await req('POST', '/api/world/explore', { zoneId: 'forest' })

  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const codigo = trozos.find(t => /async function cargarRecursos/.test(t))
  ok('la página trae el módulo de recursos', !!codigo, trozos.length + ' scripts')
  if (!codigo) { console.log('\n  ' + pass + ' OK · ' + fail + ' fallidas\n'); process.exit(1) }

  // Un Phaser de mentira: solo lo que el módulo usa para dibujar.
  const creados = []
  const nuevo = extra => Object.assign({
    setOrigin() { return this }, setDepth() { return this }, setAlpha() { return this },
    setVisible(v) { this.visible = v; return this }, setText(t) { this.text = t; return this },
    destroy() { this.destruido = true },
  }, extra)
  const escena = {
    MW: 1800, MH: 1200, px: 0, py: 0,
    game: { loop: { delta: 16 } },
    add: {
      text(x, y, t) { const o = nuevo({ x, y, text: t, tipo: 'texto' }); creados.push(o); return o },
      ellipse(x, y) { const o = nuevo({ x, y, tipo: 'elipse' }); creados.push(o); return o },
      rectangle(x, y) { const o = nuevo({ x, y, tipo: 'rect' }); creados.push(o); return o },
    },
    tweens: { add(o) { if (o.onComplete) o.onComplete() } },
  }
  const avisos = []
  const ventana = {
    console, setTimeout, clearTimeout, Math, Date, JSON, Promise, Number, String, Object, Array, Infinity,
    Phaser: {
      Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2) },
        Between: (a, b) => Math.floor((a + b) / 2),
      },
    },
    showToast(m) { avisos.push(m) },
    addLog(m) { avisos.push(m) },
    async syncCharacter() { ventana.sincronizado = (ventana.sincronizado || 0) + 1 },
    async apiGet(ruta) { const x = await req('GET', ruta); return { ok: x.s >= 200 && x.s < 300, data: x.b } },
    async apiPost(ruta, cuerpo) { const x = await req('POST', ruta, cuerpo); return { ok: x.s >= 200 && x.s < 300, data: x.b } },
  }
  ventana.window = ventana; ventana.globalThis = ventana
  const ctx = vm.createContext(ventana)
  let reventó = null
  try { vm.runInContext(codigo, ctx, { filename: 'mundo-recursos', timeout: 5000 }) }
  catch (e) { reventó = e.message }
  ok('el módulo se ejecuta sin reventar', !reventó, String(reventó))

  await ventana.cargarRecursos(escena)
  ok('la pantalla se trae los nodos del bosque', ventana.NODOS_REC.length > 0, String(ventana.NODOS_REC.length))
  ok('todos son de la zona en la que estás',
     ventana.NODOS_REC.every(n => n.zona === 'forest'),
     [...new Set(ventana.NODOS_REC.map(n => n.zona))].join(','))
  ok('y los dibuja', creados.length > 0, String(creados.length))
  ok('usa la escala que dice el servidor', ventana.ESCALA_REC.x > 0, JSON.stringify(ventana.ESCALA_REC))

  // Equipar el hacha de fábrica y plantarse junto a un árbol.
  const inv = (await req('GET', '/api/inventory')).b.inventory || []
  const hacha = inv.find(i => i.itemId === 'hacha_madera_piedra')
  ok('el personaje trae un hacha de fábrica', !!hacha)
  await req('POST', '/api/player/equip', { uid: hacha.uid })
  await ventana.cargarRecursos(escena)
  ok('la pantalla sabe qué herramienta llevas puesta',
     ventana.HERRAMIENTA_REC && ventana.HERRAMIENTA_REC.tipo === 'hacha',
     JSON.stringify(ventana.HERRAMIENTA_REC))

  const arbol = ventana.NODOS_REC.find(n => n.util === 'hacha' && n.nivel === 1 && !n.agotado)
  ok('hay un árbol que talar', !!arbol)

  console.log('\n── DE LEJOS NO, DE CERCA SÍ ──')
  escena.px = 10; escena.py = 10
  ventana.actualizarRecursos(escena)
  ok('lejos de todo no hay nada que golpear', !ventana.hayNodoDelante())

  // Plantarse encima del árbol, en coordenadas de pantalla.
  escena.px = arbol.x * ventana.ESCALA_REC.x
  escena.py = arbol.y * ventana.ESCALA_REC.y
  ventana.actualizarRecursos(escena)
  ok('delante del árbol sí lo hay', ventana.hayNodoDelante())

  const vidaAntes = arbol.vida
  await ventana.golpearNodoCercano(escena)
  ok('el árbol pierde vida de verdad', arbol.vida < vidaAntes, vidaAntes + ' → ' + arbol.vida)
  ok('y la herramienta se gasta',
     ventana.HERRAMIENTA_REC && ventana.HERRAMIENTA_REC.durabilidad < ventana.HERRAMIENTA_REC.durabilidadMax,
     JSON.stringify(ventana.HERRAMIENTA_REC))

  console.log('\n── HASTA QUE CAE Y LA MADERA ENTRA EN EL INVENTARIO ──')
  const maderaAntes = ((await req('GET', '/api/inventory')).b.inventory || [])
    .filter(i => i.itemId === 'wood').reduce((a, i) => a + i.quantity, 0)
  let vueltas = 0
  while (!arbol.agotado && vueltas++ < 40) {
    await sleep(480)
    ventana.actualizarRecursos(escena)
    await ventana.golpearNodoCercano(escena)
  }
  ok('el árbol acaba cayendo', arbol.agotado, 'tras ' + vueltas + ' golpes')
  const maderaDespues = ((await req('GET', '/api/inventory')).b.inventory || [])
    .filter(i => i.itemId === 'wood').reduce((a, i) => a + i.quantity, 0)
  ok('la madera entra en el inventario REAL', maderaDespues > maderaAntes,
     maderaAntes + ' → ' + maderaDespues)
  ok('la pantalla avisa de lo que has conseguido', avisos.length > 0, avisos.slice(-2).join(' | '))
  ok('y vuelve a preguntar el personaje al servidor', !!ventana.sincronizado)

  console.log('\n── CAMBIAR DE ZONA DOS VECES SEGUIDAS ──')
  // Dos cargas a la vez: gana la última. Sin el contador, la respuesta
  // lenta de una zona pintaba sus nodos encima de la otra.
  await req('POST', '/api/world/explore', { zoneId: 'mines' })
  const aLaVez = ventana.cargarRecursos(escena)
  await req('POST', '/api/world/explore', { zoneId: 'forest' })
  const segunda = ventana.cargarRecursos(escena)
  await Promise.all([aLaVez, segunda])
  ok('solo quedan los nodos de la zona en la que acabas',
     ventana.NODOS_REC.length > 0 && ventana.NODOS_REC.every(n => n.zona === 'forest'),
     [...new Set(ventana.NODOS_REC.map(n => n.zona))].join(',') + ' · ' + ventana.NODOS_REC.length)

  console.log('\n── EL CLIENTE NO DECIDE NADA ──')
  // Decir que estás al lado sin estarlo lo rechaza el servidor, no la
  // pantalla: la comprobación vive donde no se puede tocar.
  const otro = ventana.NODOS_REC.find(n => n.util === 'hacha' && !n.agotado && n.id !== arbol.id)
  if (otro) {
    const lejos = await req('POST', '/api/recursos/golpear',
      { nodoId: otro.id, pos: { x: otro.x + 900, y: otro.y + 700 } })
    ok('golpear desde lejos lo rechaza el servidor', lejos.s === 403, lejos.raw.slice(0, 90))
  } else ok('golpear desde lejos lo rechaza el servidor', true, '(sin nodo libre)')

  const sinPos = await req('POST', '/api/recursos/golpear', { nodoId: arbol.id })
  ok('y sin decir dónde estás, también', sinPos.s === 400, sinPos.raw.slice(0, 90))

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-mundo-rec.json', '/tmp/cm-mr-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-mundo-rec.json', BACKUP_DIR: '/tmp/cm-mr-b' }),
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
