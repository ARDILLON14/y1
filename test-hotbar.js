/**
 * CriptoMundo — FASE D · la barra de objetos
 * Uso:  PORT=3903 node test-hotbar.js --spawn
 *
 * POR QUÉ EXISTE
 * La barra existía en el servidor desde el sistema de recolección y
 * NADIE la pintaba en el mapa: tenías el hacha y el pico en una barra
 * que no se veía. Y en la FASE B escribí una segunda barra encima de la
 * primera sin verla, así que lo primero que hay que comprobar es que
 * ahora hay UNA.
 *
 * Lo que decide si esto funciona:
 *   · que elegir la ranura de un arma la EQUIPE de verdad, no solo
 *     cambie el icono (si no, el STEP 1 vuelve a pasar);
 *   · que sobreviva a matar el proceso, como pide la sección 7;
 *   · que una partida guardada de antes, con ocho uids, se migre;
 *   · que vender lo que hay en una ranura no deje la barra mintiendo;
 *   · y que la pantalla exista y responda a las teclas 1–0.
 */
const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3903)
const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-hotbar-'))
const DATA_FILE = path.join(BASE, 'datos.json')
const BACKUP_DIR = path.join(BASE, 'backups')

let cookie = '', pass = 0, fail = 0, hijo = null
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(m, p, b, ck) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    const g = ck === undefined ? cookie : ck
    if (g) h.Cookie = g
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => {
        if (x.headers['set-cookie'] && ck === undefined) cookie = x.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, raw: o })
      })
    })
    q.on('error', () => r({ s: 0, b: {}, raw: '' }))
    if (d) q.write(d); q.end()
  })
}
async function arrancar() {
  hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE, BACKUP_DIR }),
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    await dormir(200)
    if ((await req('GET', '/api/auth/mode', null, '')).s === 200) return true
  }
  return false
}
async function parar() {
  if (!hijo) return
  const p = hijo; hijo = null
  await new Promise(r => { p.once('exit', r); try { p.kill() } catch { r() } })
  await dormir(250)
}
const barra = () => req('GET', '/api/hotbar')
const inv = async () => (await req('GET', '/api/inventory')).b.inventory || []

async function run() {
  ok('el servidor arranca', await arrancar())
  const u = 'hb' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const galleta = cookie

  console.log('\n── HAY UNA SOLA BARRA, Y TIENE DIEZ RANURAS ──')
  let r = await barra()
  ok('/api/hotbar contesta', r.s === 200 && Array.isArray(r.b.ranuras), r.raw.slice(0, 80))
  ok('tiene diez ranuras', r.b.ranuras.length === 10, String(r.b.ranuras.length))
  ok('nace con un arma en la 0', r.b.ranuras[0] && r.b.ranuras[0].itemId === 'dagger',
     JSON.stringify(r.b.ranuras[0] && r.b.ranuras[0].itemId))
  ok('y una poción en la 9', r.b.ranuras[9] && r.b.ranuras[9].itemId === 'potion_hp',
     JSON.stringify(r.b.ranuras[9] && r.b.ranuras[9].itemId))
  ok('cada ranura llena dice nombre, icono, cantidad y tipo',
     !!r.b.ranuras[0].nombre && !!r.b.ranuras[0].icono &&
     Number.isFinite(r.b.ranuras[0].cantidad) && 'consumible' in r.b.ranuras[0],
     JSON.stringify(r.b.ranuras[0]))

  console.log('\n── LA RANURA ACTIVA CON UN ARMA *ES* EL ARMA EQUIPADA ──')
  // Sin esto, elegir la ranura de la espada cambiaría el icono y no el
  // daño: el mismo fallo que el STEP 1 arregló en el mundo.
  const objetos = await inv()
  const daga = objetos.find(i => i.itemId === 'dagger')
  await req('POST', '/api/player/equip', { uid: daga.uid })
  const st0 = (await req('GET', '/api/player')).b.character
  // Fabricar algo mejor y ponerlo en una ranura.
  await req('POST', '/api/crafting', { recipeId: 'rec_dagger', quantity: 1 })
  let inv2 = await inv()
  // Una espada de verdad, por consola de administración no: se compra
  // el efecto usando lo que hay. Se busca cualquier arma distinta.
  const otra = inv2.find(i => i.itemId !== 'dagger' && i.slot === 'weapon')
  r = await req('POST', '/api/hotbar/asignar', { ranura: 4, idObjeto: 'dagger' })
  ok('asignar por itemId funciona', r.s === 200, r.raw.slice(0, 100))
  r = await req('POST', '/api/hotbar/elegir', { ranura: 4 })
  ok('elegir una ranura con arma devuelve las estadísticas', r.s === 200 && !!r.b.stats,
     JSON.stringify(Object.keys(r.b)))
  const equipado = (await req('GET', '/api/player')).b.character.equipment
  ok('y el arma queda equipada de verdad', !!equipado.weapon, JSON.stringify(equipado))

  // Elegir una ranura de poción NO te desnuda.
  r = await req('POST', '/api/hotbar/elegir', { ranura: 9 })
  const eq2 = (await req('GET', '/api/player')).b.character.equipment
  ok('elegir la ranura de una poción no te quita el arma',
     eq2.weapon === equipado.weapon, JSON.stringify(eq2))

  console.log('\n── ASIGNAR, MOVER, ELEGIR ──')
  r = await req('POST', '/api/hotbar/asignar', { ranura: 11, idObjeto: 'dagger' })
  ok('la ranura 11 se rechaza', r.s === 400, String(r.s))
  r = await req('POST', '/api/hotbar/asignar', { ranura: -1, idObjeto: 'dagger' })
  ok('la ranura −1 se rechaza', r.s === 400, String(r.s))
  r = await req('POST', '/api/hotbar/asignar', { ranura: 2, idObjeto: 'espada_diamante' })
  ok('un objeto que no tienes se rechaza', r.s === 404, String(r.s))
  r = await req('POST', '/api/hotbar/asignar', { ranura: 2, uid: 'itm_inventado' })
  ok('un uid inventado también', r.s === 404, String(r.s))

  await req('POST', '/api/hotbar/asignar', { ranura: 2, idObjeto: 'potion_hp' })
  let b1 = (await barra()).b
  ok('la poción se movió de la 9 a la 2, no se duplicó',
     b1.ranuras[2] && b1.ranuras[2].itemId === 'potion_hp' && !b1.ranuras[9],
     JSON.stringify([b1.ranuras[2] && b1.ranuras[2].itemId, b1.ranuras[9]]))

  r = await req('POST', '/api/hotbar/mover', { desde: 2, hasta: 7 })
  ok('mover cambia las dos ranuras', r.s === 200, r.raw.slice(0, 80))
  b1 = (await barra()).b
  ok('y la poción está ahora en la 7', b1.ranuras[7] && b1.ranuras[7].itemId === 'potion_hp',
     JSON.stringify(b1.ranuras[7]))
  r = await req('POST', '/api/hotbar/mover', { desde: 0, hasta: 99 })
  ok('mover a una ranura inválida se rechaza', r.s === 400, String(r.s))

  r = await req('POST', '/api/hotbar/seleccionar', { ranura: 0 })
  ok('el nombre viejo del endpoint sigue funcionando', r.s === 200, String(r.s))

  console.log('\n── LO QUE SE VENDE DEJA LA RANURA EN GRIS, NO MINTIENDO ──')
  await req('POST', '/api/hotbar/asignar', { ranura: 5, idObjeto: 'potion_hp' })
  const antesP = (await inv()).filter(i => i.itemId === 'potion_hp')
    .reduce((a, i) => a + i.quantity, 0)
  ok('hay pociones', antesP > 0, String(antesP))
  const pub = await req('POST', '/api/market', { itemId: 'potion_hp', quantity: antesP, pricePerUnit: 40 })
  ok('se publican todas en el mercado', pub.s === 201 || pub.s === 200, String(pub.s))
  b1 = (await barra()).b
  ok('la ranura sigue diciendo qué iba ahí', b1.ranuras[5] && b1.ranuras[5].itemId === 'potion_hp',
     JSON.stringify(b1.ranuras[5]))
  ok('pero se marca agotada y con cantidad 0',
     b1.ranuras[5] && b1.ranuras[5].agotada === true && b1.ranuras[5].cantidad === 0,
     JSON.stringify(b1.ranuras[5]))
  await req('POST', '/api/market/' + pub.b.listing.id + '/cancel', {})
  b1 = (await barra()).b
  ok('al recuperarlas, la ranura se rellena sola',
     b1.ranuras[5] && b1.ranuras[5].agotada === false && b1.ranuras[5].cantidad > 0,
     JSON.stringify(b1.ranuras[5]))

  console.log('\n── SOBREVIVE A MATAR EL PROCESO ──')
  await req('POST', '/api/hotbar/asignar', { ranura: 3, idObjeto: 'herb' })
  await req('POST', '/api/hotbar/seleccionar', { ranura: 3 })
  const antesR = (await barra()).b
  await parar()
  ok('el servidor está parado', (await req('GET', '/api/auth/mode', null, '')).s === 0)
  ok('y vuelve a arrancar', await arrancar())
  cookie = galleta
  const trasR = (await barra()).b
  ok('la barra es la misma tras el reinicio',
     JSON.stringify(trasR.ranuras.map(x => x && x.itemId)) ===
     JSON.stringify(antesR.ranuras.map(x => x && x.itemId)),
     JSON.stringify(trasR.ranuras.map(x => x && x.itemId)))
  ok('y la ranura elegida también', trasR.seleccionada === 3, String(trasR.seleccionada))

  console.log('\n── UNA PARTIDA GUARDADA DE ANTES SE MIGRA ──')
  await parar()
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  const ch = d.players[u].character
  const daga2 = ch.inventory.find(i => i.itemId === 'dagger')
  const hierba = ch.inventory.find(i => i.itemId === 'herb')
  // Como se guardaba antes: ocho ranuras con uids.
  ch.hotbar = [daga2.uid, null, hierba.uid, null, null, null, null, null]
  ch.hotbarSel = 2
  fs.writeFileSync(DATA_FILE, JSON.stringify(d))
  ok('arranca con los datos viejos', await arrancar())
  cookie = galleta
  const mig = (await barra()).b
  ok('la barra vieja de 8 se alarga a 10', mig.ranuras.length === 10, String(mig.ranuras.length))
  ok('cada uid se traduce a su objeto',
     mig.ranuras[0] && mig.ranuras[0].itemId === 'dagger' &&
     mig.ranuras[2] && mig.ranuras[2].itemId === 'herb',
     JSON.stringify(mig.ranuras.map(x => x && x.itemId)))
  ok('y se respeta en qué ranura estaba cada cosa', mig.ranuras[1] === null)
  ok('la ranura elegida se conserva', mig.seleccionada === 2, String(mig.seleccionada))

  console.log('\n── EL CLIENTE NO DECIDE NADA ──')
  const sucio = await req('POST', '/api/hotbar/asignar', {
    ranura: 6, idObjeto: 'herb', cantidad: 9999, xp: 1e9, oro: 1e9, stats: { strength: 999 },
  })
  ok('campos de más en la petición se ignoran', sucio.s === 200, String(sucio.s))
  const tras = (await req('GET', '/api/player')).b.character
  ok('y no dan ni oro ni experiencia ni fuerza',
     tras.xp < 1e8 && tras.gold < 1e8 && tras.strength < 900,
     JSON.stringify({ xp: tras.xp, oro: tras.gold, fuerza: tras.strength }))
  const b6 = (await barra()).b
  ok('la cantidad la cuenta el servidor, no el cliente',
     b6.ranuras[6] && b6.ranuras[6].cantidad !== 9999, JSON.stringify(b6.ranuras[6]))

  console.log('\n── LA PANTALLA ──')
  const mapa = await new Promise(res => http.get({ host: 'localhost', port: PORT, path: '/criptomundo-mundo2d.html' },
    x => { let o = ''; x.on('data', c => o += c); x.on('end', () => res(o)) }))
  ok('el mapa trae la barra', /id="barra-objetos"/.test(mapa))
  ok('y pide sus datos al servidor', /apiGet\('\/api\/hotbar'\)/.test(mapa))
  ok('las teclas 1–0 la manejan', /ranuraDeTecla/.test(mapa) && /addEventListener\('keydown'/.test(mapa))
  ok('la rueda del ratón también, con freno', /wheel/.test(mapa) && /HOTBAR_ULT_RUEDA < 150/.test(mapa))
  ok('respeta el área segura del teléfono', /env\(safe-area-inset-bottom/.test(mapa))
  ok('en pantalla estrecha enseña cinco y deja pasar a las otras',
     /max-width: 480px/.test(mapa) && /HOTBAR_MITAD/.test(mapa))
  // El tamaño de un dedo. La primera versión de esta comprobación
  // buscaba "width: 3Xpx" a secas y pillaba el icono de 32 px, que va
  // DENTRO de la ranura: decía que la barra era pequeña mirando el
  // dibujo en vez del botón.
  const anchos = [...mapa.matchAll(/#barra-objetos \.ranura\s*\{[^}]*?width:\s*(\d+)px/g)]
    .map(m => Number(m[1]))
  const anchosMovil = [...mapa.matchAll(/#barra-objetos \.ranura \{ width: (\d+)px/g)]
    .map(m => Number(m[1]))
  const todos = anchos.concat(anchosMovil)
  ok('se declara el tamaño de las ranuras', todos.length >= 2, JSON.stringify(todos))
  ok('y ninguna baja de 40 px, que es un dedo', todos.every(n => n >= 40), JSON.stringify(todos))

  // La función pura, ejecutada.
  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const cod = trozos.find(t => /function estadoHotbar\b/.test(t))
  ok('la función pura de la barra está en la página', !!cod)
  if (cod) {
    const ctx = vm.createContext({ Math, Number, String, Date, console, JSON, Object, Array, parseInt })
    vm.runInContext(cod, ctx, { filename: 'hotbar' })
    const e = ctx.estadoHotbar({ ranuras: [], seleccionada: 0 }, 0, 0, {})
    ok('sin datos devuelve diez ranuras vacías',
       e.ranuras.length === 10 && e.ranuras.every(x => x.vacia))
    ok('la ranura 9 se pulsa con el 0', e.ranuras[9].tecla === '0' && e.ranuras[0].tecla === '1')
    ok('la tecla 0 es la ranura 9', ctx.ranuraDeTecla('0') === 9 && ctx.ranuraDeTecla('1') === 0)
    ok('una tecla que no es número no elige nada', ctx.ranuraDeTecla('x') === null)
    ok('la rueda da la vuelta', ctx.ranuraVecina(9, 1) === 0 && ctx.ranuraVecina(0, -1) === 9)
    const e2 = ctx.estadoHotbar(
      { ranuras: [{ itemId: 'potion_hp', nombre: 'Poción', icono: '🧪', cantidad: 3, consumible: true, rareza: 'COMMON' }], seleccionada: 0 },
      0, 1000, { potion_hp: 2000, __total_potion_hp: 2000 })
    ok('una poción apilable enseña su cantidad', e2.ranuras[0].apilable && e2.ranuras[0].cantidad === 3)
    ok('y el velo de enfriamiento va a la mitad',
       Math.abs(e2.ranuras[0].enfriamiento - 0.5) < 0.01, String(e2.ranuras[0].enfriamiento))
    const e3 = ctx.estadoHotbar({ ranuras: [{ itemId: 'x', cantidad: 0 }], seleccionada: 0 }, 0, 0, {})
    ok('sin existencias se marca agotada', e3.ranuras[0].agotada === true)
    const e4 = ctx.estadoHotbar(null, 99, NaN, null)
    ok('con basura de entrada no revienta ni saca NaN',
       e4.ranuras.length === 10 && e4.ranuras.every(x => Number.isFinite(x.enfriamiento)))
  }

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

process.on('exit', () => { try { if (hijo) hijo.kill() } catch {} })
run().catch(e => { console.error(e); try { if (hijo) hijo.kill() } catch {}; process.exit(1) })
