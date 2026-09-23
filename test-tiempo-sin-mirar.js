/**
 * CriptoMundo — lo que pasa mientras nadie mira
 * Uso:  PORT=3896 node test-tiempo-sin-mirar.js --spawn
 *
 * POR QUÉ EXISTE
 * La FASE 21 pide dos flujos que ninguna prueba tocaba, y los dos
 * comparten la misma dificultad: no se pueden ver sin dejar pasar el
 * tiempo. Aquí el tiempo se deja pasar de la única manera honesta que
 * cabe en una prueba: se para el servidor, se envejecen los datos en
 * disco y se vuelve a arrancar.
 *
 *   · «market · expiration». Al publicar, el objeto SALE del inventario
 *     (escrow). Cancelar lo devuelve, vender se lo da al comprador y
 *     caducar... no hacía nada: el objeto se quedaba dentro de la
 *     publicación para siempre. Y como el estado solo pasaba a EXPIRED
 *     dentro de buyListing, una publicación caducada a la que nadie
 *     picara seguía anunciándose en la tienda como comprable.
 *
 *   · «farming · offline growth» y «duplicate harvest». El huerto crece
 *     por marcas de tiempo, así que cerrar el navegador —o apagar el
 *     servidor— no debería detenerlo. Estaba escrito así y nadie lo
 *     había comprobado nunca.
 *
 * Y de paso «invalid seed», que tampoco estaba: solo se probaba la
 * parcela inválida, no la semilla.
 */
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3896)
const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-sinmirar-'))
const DATA_FILE = path.join(BASE, 'datos.json')
const BACKUP_DIR = path.join(BASE, 'backups')

let cookie = '', pass = 0, failed = 0, hijo = null
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body, ck) {
  return new Promise(resolve => {
    const d = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    const galleta = ck === undefined ? cookie : ck
    if (galleta) h.Cookie = galleta
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', c => o += c)
      res.on('end', () => {
        if (res.headers['set-cookie'] && ck === undefined) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (d) r.write(d)
    r.end()
  })
}

async function arrancar() {
  hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE, BACKUP_DIR }),
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    await dormir(200)
    if ((await req('GET', '/api/auth/mode', null, '')).status === 200) return true
  }
  return false
}
async function parar() {
  if (!hijo) return
  const p = hijo; hijo = null
  await new Promise(r => { p.once('exit', r); try { p.kill() } catch { r() } })
  await dormir(250)
}
const leerDatos = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
const escribirDatos = d => fs.writeFileSync(DATA_FILE, JSON.stringify(d))
const cuantos = (inv, id) => (inv || []).filter(i => i.itemId === id).reduce((a, i) => a + (i.quantity || 1), 0)

async function run() {
  console.log('\n── ARRANQUE ──')
  check('el servidor arranca', await arrancar())

  const u = 'sinm' + Math.floor(Math.random() * 1e6)
  const reg = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  check('se puede crear una cuenta', reg.status === 201 || reg.status === 200, String(reg.status))
  const miGalleta = cookie

  console.log('\n── SEMBRAR Y PUBLICAR, Y LUEGO IRSE ──')
  const huerto0 = await req('GET', '/api/farm')
  const semilla = (huerto0.body.semillas || []).find(s => s.tengo > 0)
  check('el personaje empieza con semillas', !!semilla, JSON.stringify((huerto0.body.semillas || []).map(s => s.id + ':' + s.tengo)))

  // Semilla que no existe: la FASE 21 la pide y solo se probaba la parcela.
  let r = await req('POST', '/api/farm/plant', { parcela: 0, semilla: 'semilla_de_la_nada' })
  check('una semilla inventada se rechaza', r.status === 404, String(r.status))
  r = await req('POST', '/api/farm/plant', { parcela: 0, semilla: 'potion_hp' })
  check('un objeto que no es semilla tampoco vale', r.status === 404, String(r.status))

  r = await req('POST', '/api/farm/plant', { parcela: 0, semilla: semilla.id })
  check('se siembra', r.status === 200, String(r.status) + ' ' + (r.body.error || ''))
  r = await req('POST', '/api/farm/harvest', { parcela: 0 })
  check('recién sembrado no se cosecha', r.status === 400, String(r.status))

  // Publicar algo real en el mercado. El objeto SALE del inventario.
  const inv0 = (await req('GET', '/api/inventory')).body.inventory || []
  const vendible = inv0.find(i => i.itemId === 'potion_hp') || inv0[0]
  check('hay algo que publicar', !!vendible, JSON.stringify(inv0.slice(0, 3).map(i => i.itemId)))
  const antesDePublicar = cuantos(inv0, vendible.itemId)
  const pub = await req('POST', '/api/market', { itemId: vendible.itemId, quantity: 1, pricePerUnit: 50 })
  check('se publica', pub.status === 201 || pub.status === 200, String(pub.status) + ' ' + (pub.body.error || ''))
  const anuncio = pub.body.listing
  const trasPublicar = cuantos((await req('GET', '/api/inventory')).body.inventory, vendible.itemId)
  check('publicar SACA el objeto del inventario (escrow)', trasPublicar === antesDePublicar - 1,
        antesDePublicar + ' → ' + trasPublicar)

  console.log('\n── PASA EL TIEMPO CON EL SERVIDOR APAGADO ──')
  await parar()
  check('el servidor está parado', (await req('GET', '/api/auth/mode', null, '')).status === 0)

  const d = leerDatos()
  const jugador = d.players[u]
  check('el personaje está en disco', !!jugador)
  // Envejecer el cultivo: listo hace una hora.
  jugador.character.huerto[0].listoEn = Date.now() - 3600_000
  jugador.character.huerto[0].sembradoEn = Date.now() - 7200_000
  // Y caducar la publicación: venció ayer.
  const enDisco = d.marketListings.find(l => l.id === anuncio.id)
  check('la publicación está en disco', !!enDisco)
  enDisco.expiresAt = new Date(Date.now() - 86400_000).toISOString()
  escribirDatos(d)
  check('vuelve a arrancar con los datos envejecidos', await arrancar())
  cookie = miGalleta

  console.log('\n── EL HUERTO CRECIÓ SIN NADIE DELANTE ──')
  const huerto1 = await req('GET', '/api/farm')
  const parcela = (huerto1.body.parcelas || [])[0]
  check('la parcela sigue sembrada tras el reinicio', !!(parcela && parcela.semilla), JSON.stringify(parcela))
  // El progreso va de 0 a 1, no de 0 a 100: se lee del estado que
  // devuelve el servidor, no del que uno se imagina.
  check('y el servidor la da por lista',
        parcela && (parcela.estado === 'lista' || parcela.restanteMs === 0),
        JSON.stringify(parcela))

  const invAntes = (await req('GET', '/api/inventory')).body.inventory || []
  const cosecha = await req('POST', '/api/farm/harvest', { parcela: 0 })
  check('se cosecha lo que creció mientras el servidor estaba apagado',
        cosecha.status === 200, String(cosecha.status) + ' ' + (cosecha.body.error || ''))
  const obtenido = (cosecha.body.obtenido || cosecha.body.items || [])
  check('y da producto de verdad', obtenido.length > 0, JSON.stringify(cosecha.body).slice(0, 200))
  if (obtenido.length) {
    const id = obtenido[0].itemId
    const invDespues = (await req('GET', '/api/inventory')).body.inventory || []
    check('el producto llega al inventario', cuantos(invDespues, id) > cuantos(invAntes, id),
          cuantos(invAntes, id) + ' → ' + cuantos(invDespues, id))
  }

  const repetida = await req('POST', '/api/farm/harvest', { parcela: 0 })
  check('la misma parcela NO se cosecha dos veces', repetida.status === 400, String(repetida.status))

  console.log('\n── LA PUBLICACIÓN CADUCADA NO SE QUEDA EL OBJETO ──')
  const tienda = await req('GET', '/api/market', null, '')
  const sigueOfrecida = (tienda.body.listings || []).some(l => l.id === anuncio.id)
  check('la tienda ya no la ofrece', !sigueOfrecida,
        'listings: ' + (tienda.body.listings || []).length)

  const invFinal = (await req('GET', '/api/inventory')).body.inventory || []
  check('el objeto en escrow VUELVE al vendedor al caducar',
        cuantos(invFinal, vendible.itemId) === antesDePublicar,
        antesDePublicar + ' esperado · ' + cuantos(invFinal, vendible.itemId) + ' real')

  // Y no puede volver dos veces: el barrido corre en cada visita a la tienda.
  await req('GET', '/api/market', null, '')
  await req('GET', '/api/market', null, '')
  const invFinal2 = (await req('GET', '/api/inventory')).body.inventory || []
  check('y vuelve UNA sola vez, por mucho que se mire la tienda',
        cuantos(invFinal2, vendible.itemId) === antesDePublicar,
        String(cuantos(invFinal2, vendible.itemId)))

  // Comprarla desde otra cuenta tiene que fallar, no cobrar.
  const v = 'comp' + Math.floor(Math.random() * 1e6)
  cookie = ''
  await req('POST', '/api/auth/register', { username: v, email: v + '@t.io', password: 'Prueba12345', className: 'Mago' })
  const oroAntes = (await req('GET', '/api/player')).body.character.gold
  const compra = await req('POST', '/api/market/' + anuncio.id + '/buy', { quantity: 1 })
  check('una publicación caducada no se puede comprar', compra.status === 409, String(compra.status))
  const oroDespues = (await req('GET', '/api/player')).body.character.gold
  check('y el intento no cuesta oro', oroDespues === oroAntes, oroAntes + ' → ' + oroDespues)

  console.log('\n── LO QUE NUNCA FUE DE NADIE NO SE REGALA ──')
  // Las publicaciones de arranque (npc) nunca salieron de un inventario:
  // al caducar no tienen nada que devolver y no deben inventarlo.
  await parar()
  const d2 = leerDatos()
  const dOtro = d2.marketListings.filter(l => l.npc)
  check('hay publicaciones de arranque', dOtro.length > 0, String(dOtro.length))
  for (const l of dOtro) l.expiresAt = new Date(Date.now() - 86400_000).toISOString()
  const oroNpcAntes = JSON.stringify(d2.players[u].character.inventory || []).length
  escribirDatos(d2)
  check('arranca otra vez', await arrancar())
  const tienda2 = await req('GET', '/api/market', null, '')
  check('las de arranque caducadas también se retiran',
        !(tienda2.body.listings || []).some(l => l.npc), JSON.stringify((tienda2.body.listings || []).length))
  await parar()
  const d3 = leerDatos()
  check('y no le aparece nada nuevo a nadie en el inventario',
        JSON.stringify(d3.players[u].character.inventory || []).length === oroNpcAntes)
  check('todas quedan marcadas como devueltas, así que el barrido no reintenta para siempre',
        d3.marketListings.filter(l => l.status === 'EXPIRED').every(l => l.escrowDevuelto === true),
        JSON.stringify(d3.marketListings.filter(l => l.status === 'EXPIRED').map(l => l.escrowDevuelto)))

  fin()
}

function fin() {
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

process.on('exit', () => { try { if (hijo) hijo.kill() } catch {} })
run().catch(e => { console.error(e); try { if (hijo) hijo.kill() } catch {} ; process.exit(1) })
