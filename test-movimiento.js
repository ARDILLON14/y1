/**
 * CriptoMundo — PASO 3: movimiento, colisiones y mando
 * Uso:  PORT=3880 node test-movimiento.js --spawn
 *
 * POR QUÉ EXISTE
 * El movimiento era "se suma a la velocidad y se multiplica por 0,82".
 * Funcionaba, en el sentido de que el personaje se desplazaba. Pero:
 *
 *   · el rozamiento se aplicaba una vez por TICK, no por segundo, así
 *     que la velocidad real dependía de si el servidor iba cargado;
 *   · el tope acababa en ~765 px/s con una `vel` nominal de 210, o sea
 *     que el número de la ficha no describía nada y la agilidad se
 *     diluía en un factor inventado;
 *   · el retroceso se cancelaba andando en sentido contrario, lo que
 *     dejaba el `empuje` de las armas en adorno;
 *   · y los cuerpos no chocaban: media docena de enemigos se apilaban
 *     en el mismo píxel encima del jugador.
 *
 * Todo eso se ve jugando, pero no se demuestra jugando. Aquí se mide.
 */
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3880)
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
const pagina = p => new Promise(res => http.get({ host: 'localhost', port: PORT, path: p }, x => {
  let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }).on('error', () => res('')))

// Un pulso de arena: manda la intención, devuelve el estado.
const pulso = entrada => req('POST', '/api/arena/sync', { entrada })

async function run() {
  const u = 'mov' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── LA VELOCIDAD DE LA FICHA ES LA VELOCIDAD REAL ──')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  let r = await pulso({ mx: 0, my: 0 })
  const inicio = { x: r.body.estado.jugador.x, y: r.body.estado.jugador.y }

  // Andar hacia arriba un segundo largo y medir cuánto se recorrió.
  let anterior = inicio, maxPaso = 0
  for (let i = 0; i < 16; i++) {
    r = await pulso({ mx: 0, my: -1, apuntar: -1.57 })
    const j = r.body.estado.jugador
    const paso = Math.hypot(j.x - anterior.x, j.y - anterior.y)
    if (i > 4) maxPaso = Math.max(maxPaso, paso)   // tras acelerar
    anterior = j
    await sleep(100)
  }
  // 210 px/s nominales · ~0,1 s por pulso ≈ 21 px por paso. Se deja
  // margen porque el reloj real no es exacto, pero 765 px/s (el tope
  // de antes) daría pasos de ~76 y no pasaría.
  const velReal = maxPaso * 10
  check('la velocidad tope se parece a los 210 px/s declarados',
    velReal > 120 && velReal < 330, Math.round(velReal) + ' px/s')

  console.log('\n── DIAGONAL NO ES MÁS RÁPIDO QUE RECTO ──')
  const medir = async (mx, my) => {
    let prev = (await pulso({ mx, my })).body.estado.jugador, top = 0
    for (let i = 0; i < 12; i++) {
      const j = (await pulso({ mx, my })).body.estado.jugador
      if (i > 4) top = Math.max(top, Math.hypot(j.x - prev.x, j.y - prev.y))
      prev = j
      await sleep(100)
    }
    return top
  }
  const recto = await medir(1, 0)
  const diagonal = await medir(0.7071, 0.7071)
  check('la diagonal no corre más que la horizontal',
    diagonal <= recto * 1.2, `recto=${recto.toFixed(1)} diagonal=${diagonal.toFixed(1)}`)

  console.log('\n── LOS CUERPOS NO SE ATRAVIESAN ──')
  // Empujarse contra los enemigos un rato y comprobar que en ningún
  // momento un enemigo acaba dentro del jugador.
  // Qué se exige y qué no, con los números medidos delante:
  //
  // Los cuerpos son muelles, no muros. Acorralado contra una pared por
  // dos enemigos a la vez, el jugador no tiene hacia dónde apartarse y
  // los cuerpos se comprimen: se midió hasta un 37% de solape en el 13%
  // de los instantes, mediana de 4,6 px sobre 31. Eso se ve bien y es
  // lo que hace cualquier juego de acción 2D.
  //
  // Lo que NO puede pasar nunca es que el centro de un enemigo quede
  // dentro del cuerpo del jugador: ahí ya no se sabe quién empuja a
  // quién, el golpe se vuelve ambiguo y visualmente se solapan los
  // dibujos. Antes de este paso no había colisiones en absoluto y los
  // enemigos se posaban justo encima.
  let solapeMax = 0, medidas = 0, centrosDentro = 0
  for (let i = 0; i < 45; i++) {
    const e = (await pulso({ mx: 0, my: -1, apuntar: -1.57 })).body.estado
    if (!e) break
    for (const en of e.enemigos || []) {
      const d = Math.hypot(en.x - e.jugador.x, en.y - e.jugador.y)
      const min = 15 + en.radio
      if (d < min) solapeMax = Math.max(solapeMax, min - d)
      if (d < 15) centrosDentro++
      medidas++
    }
    await sleep(70)
  }
  check('se midieron distancias de verdad', medidas > 20, String(medidas))
  check('NUNCA hay un enemigo con el centro dentro del jugador',
    centrosDentro === 0, centrosDentro + ' de ' + medidas)
  check('y la compresión máxima se queda por debajo del 40%',
    solapeMax < 0.4 * 31, 'solape máximo ' + solapeMax.toFixed(1) + ' px de 31')

  console.log('\n── NADIE SE SALE DEL MAPA ──')
  // Arena nueva: la anterior pudo acabarse peleando, y medir el
  // deslizamiento contra la pared en una partida muerta no dice nada.
  await req('POST', '/api/arena/abandon')
  await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  let fuera = 0, limite = null, viaje = []
  for (let i = 0; i < 45; i++) {
    const e = (await pulso({ mx: -1, my: -1, apuntar: 3.14 })).body.estado
    if (!e) break
    limite = e.jugador
    if (i % 9 === 0) viaje.push(Math.round(e.jugador.x))
    if (e.jugador.x < 14 || e.jugador.y < 14 || e.jugador.x > 886 || e.jugador.y > 586) fuera++
    for (const en of e.enemigos || []) {
      if (en.x < en.radio - 1 || en.y < en.radio - 1 || en.x > 900 - en.radio + 1 || en.y > 600 - en.radio + 1) fuera++
    }
    await sleep(70)
  }
  check('empujando contra la esquina nadie se sale',
    fuera === 0, fuera + ' salidas · jugador en ' + JSON.stringify(limite && { x: limite.x, y: limite.y }))
  check('empujando a la izquierda se llega a la pared',
    limite && limite.x <= 40, 'x=' + (limite && limite.x) + ' · recorrido: ' + viaje.join(' → '))

  await req('POST', '/api/arena/abandon')

  console.log('\n── EL MANDO TÁCTIL, LOS TRES FALLOS ──')
  const html = await pagina('/criptomundo-arena.html')
  check('hay una zona de puntería separada del joystick',
    /id="zona-apuntar"/.test(html))
  check('apuntar ya no va pegado al movimiento',
    /dedoMira/.test(html) && /function mirar/.test(html))
  check('cada dedo se sigue por su identificador',
    /identifier === id/.test(html) && /dedoStick/.test(html))
  check('el botón de esquivar se suelta (antes se quedaba pegado)',
    /es\.addEventListener\('touchend', function \(\) \{ entrada\.esquivar = false \}\)/.test(html))
  check('el de atacar también', /at\.addEventListener\('touchend'/.test(html))
  check('salir de la pantalla suelta todos los controles',
    /'blur', function \(\) \{[\s\S]{0,160}entrada\.esquivar = false/.test(html))

  console.log('\n── EL MOVIMIENTO SE VE FLUIDO ──')
  check('la pantalla suaviza las posiciones entre paquetes',
    /function suavizar/.test(html) && /SUAVIDAD/.test(html))
  check('el suavizado depende del tiempo, no del número de cuadros',
    /Math\.exp\(-SUAVIDAD \* dt\)/.test(html))
  check('un salto grande no se arrastra, se salta',
    /> 220\) \{ s\.x = x; s\.y = y/.test(html))
  check('no se inventa hacia dónde va nadie (no hay predicción)',
    !/predic|extrapol/i.test(html))
  check('lo que se dibuja no es lo que se decide: el servidor manda',
    /var real = estado\.jugador/.test(html))

  console.log(`\n  ${pass} OK · ${failed} fallidas\n`)
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-mov.json', BACKUP_DIR: '/tmp/cm-mov-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1500)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
