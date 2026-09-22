/**
 * CriptoMundo — dos personas en el mismo bosque se ven
 * Uso:  PORT=3980 node test-mundo-multijugador.js --spawn
 *
 * QUÉ NO HABÍA
 * Nada. El mundo 2D era estrictamente de un jugador. El WebSocket
 * llevaba chat, "presencia" —una lista de nombres y niveles, sin una
 * sola coordenada— y las entradas de la arena. Dos personas en el mismo
 * bosque no se veían, no se cruzaban y no sabían la una de la otra.
 *
 * QUÉ SE COMPRUEBA
 *   1. dos jugadores en la misma zona se ven, con nombre y nivel
 *   2. moverse uno mueve lo que ve el otro
 *   3. cambiar de zona te saca de la vista de quien se queda
 *   4. el servidor CORRIGE los saltos imposibles en vez de guardarlos
 *   5. irse te borra del mundo de los demás
 *   6. y la recolección ya usa la posición que sabe el servidor, no la
 *      que manda el cliente
 */
const http = require('http'), path = require('path'), { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3980)

function cliente() {
  let ck = ''
  return {
    get cookie() { return ck },
    req(m, p, b) {
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
    },
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  let pass = 0, fail = 0
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

  const ana = cliente(), beto = cliente()
  const ua = 'ana' + Math.floor(Math.random() * 1e6)
  const ub = 'beto' + Math.floor(Math.random() * 1e6)
  await ana.req('POST', '/api/auth/register', { username: ua, email: ua + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  await beto.req('POST', '/api/auth/register', { username: ub, email: ub + '@t.io', password: 'Prueba12345', className: 'Mago' })

  console.log('\n── DOS EN EL MISMO BOSQUE ──')
  await ana.req('POST', '/api/world/explore', { zoneId: 'forest' })
  await beto.req('POST', '/api/world/explore', { zoneId: 'forest' })

  let ra = await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 400, y: 400, dir: 0, anim: 'idle' } })
  ok('el mundo acepta a la primera', ra.s === 200 && !!ra.b.tu, ra.raw.slice(0, 90))
  ok('y al principio no ve a nadie', (ra.b.vecinos || []).length === 0, JSON.stringify(ra.b.vecinos))

  let rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400, dir: 0, anim: 'idle' } })
  ok('el segundo ve al primero', (rb.b.vecinos || []).length === 1,
     JSON.stringify((rb.b.vecinos || []).map(v => v.nombre)))
  const visto = (rb.b.vecinos || [])[0] || {}
  ok('con su nombre', visto.nombre === ua, String(visto.nombre))
  ok('con su nivel', visto.nivel >= 1, String(visto.nivel))
  ok('con su aspecto', !!visto.aspecto, JSON.stringify(visto.aspecto && visto.aspecto.id))
  ok('y con el arma que lleva', visto.arma !== undefined, JSON.stringify(visto.arma))
  ok('donde está de verdad', visto.x === 400 && visto.y === 400, visto.x + ',' + visto.y)

  ra = await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 400, y: 400 } })
  ok('y el primero ve al segundo', (ra.b.vecinos || []).length === 1,
     JSON.stringify((ra.b.vecinos || []).map(v => v.nombre)))

  console.log('\n── MOVERSE SE VE ──')
  await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 430, y: 400 } })
  await sleep(120)
  await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 455, y: 400 } })
  rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400 } })
  const ahora = (rb.b.vecinos || [])[0] || {}
  ok('el otro la ve en su sitio nuevo', ahora.x > 400, 'x ' + ahora.x)

  console.log('\n── UN SALTO IMPOSIBLE NO SE GUARDA ──')
  // De 455 a 1700 en un instante son mil doscientos píxeles. Nadie
  // corre tanto: el servidor devuelve la posición buena.
  const salto = await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 1700, y: 1100 } })
  ok('el servidor avisa de que corrigió', salto.b.tu && salto.b.tu.corregido === true,
     JSON.stringify(salto.b.tu))
  ok('y no se queda con la posición inventada', salto.b.tu && salto.b.tu.x < 1000,
     'x ' + (salto.b.tu && salto.b.tu.x))
  rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400 } })
  ok('así que el otro tampoco la ve teletransportada',
     ((rb.b.vecinos || [])[0] || {}).x < 1000,
     'x ' + (((rb.b.vecinos || [])[0] || {}).x))

  console.log('\n── ANDAR SÍ VALE ──')
  // Lo mismo pero a velocidad humana y esperando: tiene que aceptarse.
  let x = 455, aceptados = 0
  for (let i = 0; i < 5; i++) {
    await sleep(110)
    const r = await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: x + 25, y: 400 } })
    if (r.b.tu && !r.b.tu.corregido) { aceptados++; x += 25 }
  }
  ok('andar paso a paso se acepta', aceptados === 5, aceptados + ' de 5')

  console.log('\n── CAMBIAR DE ZONA TE SACA DE LA VISTA ──')
  await ana.req('POST', '/api/world/explore', { zoneId: 'mines' })
  await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'mines', x: 300, y: 300 } })
  rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400 } })
  ok('quien se queda ya no la ve', (rb.b.vecinos || []).length === 0,
     JSON.stringify((rb.b.vecinos || []).map(v => v.nombre)))
  ra = await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'mines', x: 300, y: 300 } })
  ok('y ella tampoco a él', (ra.b.vecinos || []).length === 0,
     JSON.stringify((ra.b.vecinos || []).map(v => v.nombre)))

  console.log('\n── IRSE TE BORRA ──')
  await ana.req('POST', '/api/world/explore', { zoneId: 'forest' })
  await ana.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 480, y: 400 } })
  rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400 } })
  ok('vuelve a verse al volver', (rb.b.vecinos || []).length === 1)
  await ana.req('POST', '/api/mundo/salir', {})
  rb = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: 500, y: 400 } })
  ok('y al salir desaparece', (rb.b.vecinos || []).length === 0,
     JSON.stringify((rb.b.vecinos || []).map(v => v.nombre)))

  console.log('\n── LA RECOLECCIÓN YA NO SE CREE AL CLIENTE ──')
  // Situarse LEJOS del nodo en el mundo y luego mentir en la petición
  // de golpe: el servidor sabe dónde estás y no cuela.
  const nodos = (await beto.req('GET', '/api/recursos?zona=forest')).b.nodos || []
  const arbol = nodos.find(n => n.util === 'hacha' && n.nivel === 1 && !n.agotado)
  ok('hay un árbol en el bosque', !!arbol)
  const hacha = ((await beto.req('GET', '/api/inventory')).b.inventory || [])
    .find(i => i.itemId === 'hacha_madera_piedra')
  await beto.req('POST', '/api/player/equip', { uid: hacha.uid })

  // Beto está en 500,400; el árbol, donde esté. Se coloca lejos a
  // propósito y luego miente diciendo que está encima.
  const lejos = { x: (arbol.x + 800) % 1700, y: (arbol.y + 600) % 1100 }
  await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: lejos.x, y: lejos.y } })
  const mentira = await beto.req('POST', '/api/recursos/golpear',
    { nodoId: arbol.id, pos: { x: arbol.x, y: arbol.y } })
  ok('mentir sobre dónde estás ya no cuela', mentira.s === 403 && /lejos/i.test(mentira.b.error || ''),
     mentira.raw.slice(0, 110))

  // Y estando de verdad al lado, sí. Ojo: NO se puede saltar hasta el
  // árbol, porque el control de velocidad lo rechaza y te deja donde
  // estabas. Eso es lo correcto, así que aquí se llega como se llega en
  // el juego: cambiando de zona, que sí es un salto legítimo porque el
  // mapa entero cambia, y apareciendo junto al árbol.
  await beto.req('POST', '/api/world/explore', { zoneId: 'mines' })
  await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'mines', x: 300, y: 300 } })
  await beto.req('POST', '/api/world/explore', { zoneId: 'forest' })
  const llegada = await beto.req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: arbol.x, y: arbol.y } })
  ok('cambiar de zona sí permite aparecer en otro sitio',
     llegada.b.tu && !llegada.b.tu.corregido, JSON.stringify(llegada.b.tu))

  const deVerdad = await beto.req('POST', '/api/recursos/golpear', { nodoId: arbol.id, pos: { x: 0, y: 0 } })
  ok('y estando al lado sí se tala, aunque mandes cero',
     deVerdad.s === 200, deVerdad.raw.slice(0, 110))

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-mp.json', '/tmp/cm-mp-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-mp.json', BACKUP_DIR: '/tmp/cm-mp-b' }),
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
