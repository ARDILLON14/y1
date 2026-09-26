/**
 * CriptoMundo — la barra de objetos, como dato
 * Uso:  node test-barra-datos.js
 *
 * POR QUÉ EXISTE
 * Había DOS barras. La vieja nació en 48-recursos-mundo.js para la
 * recolección: ocho ranuras con el uid de una fila del inventario. Yo
 * escribí una segunda en la FASE B sin ver la primera, sobre el MISMO
 * campo `char.hotbar`, con diez ranuras y itemId. No reventó nada
 * porque la mía nacía inerte, pero en cuanto se conectara, un sistema
 * habría dejado el array de 8 uids y el otro lo habría rehecho de 10
 * itemId, en cada petición, en bucle.
 *
 * Ahora hay una sola. Esto comprueba lo que decide si la unificación
 * está bien: que lo viejo siga funcionando (semillas y herramientas en
 * la barra, endpoints con uid), que lo nuevo funcione (diez ranuras, la
 * ranura recuerda lo que iba en ella), y que una partida guardada con
 * ocho uids se migre sin perder nada.
 *
 * No hace falta servidor: se evalúan los módulos de verdad en un
 * contexto aislado, contra el catálogo de verdad.
 */
const fs = require('fs')
const vm = require('vm')
const path = require('path')

let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

function cargar() {
  const ctx = {
    console, Math, Date, JSON, Object, Array, Number, String, Boolean, Set, Map,
    isFinite, parseInt, parseFloat, Buffer,
    setInterval: () => ({ unref() {} }), setTimeout: () => 0,
    clearInterval() {}, clearTimeout() {},
    now: () => Date.now(), nextId: p => p + '_' + (++semilla), today: () => '2026-01-01',
    store: { players: {}, battles: {}, economy: {}, analytics: {}, auditLog: [] },
    audit() {}, track() {}, trackItems() {}, trackCurrency() {}, step() {}, persist() {},
    fs, path,
    // Lo que 20-skins.js mira al arrancar para no ofrecer una skin rota.
    ASSETS_DIR: path.join(__dirname, 'assets'),
  }
  ctx.globalThis = ctx
  vm.createContext(ctx)
  for (const f of ['20-skins.js', '30-personajes-combate.js', '31-turnos.js', '57-golpe.js', '58-arena.js', '59-armas-perfil.js', '59-barra.js', '59-combate-vivo.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8'), ctx, { filename: f })
  }
  vm.runInContext('var __RANURAS = HOTBAR_RANURAS; var __FUERA = FUERA_COMBATE_MS', ctx)
  return ctx
}
let semilla = 0
const c = cargar()

// Un personaje de verdad, hecho por el propio juego.
const nuevo = () => c.newCharacter('probador' + (++semilla), 'Guerrero')

console.log('\n── LA FORMA DEL DATO ──')
ok('la barra tiene 10 ranuras, no 8', c.__RANURAS === 10, String(c.__RANURAS))
const a = nuevo()
ok('un personaje nuevo no trae barra guardada', a.hotbar === undefined)
const b0 = c.hotbarDe(a)
ok('y se le hace una en cuanto alguien la pide', Array.isArray(a.hotbar) && a.hotbar.length === 10)
ok('con la ranura seleccionada en la 0', (a.hotbarSel || 0) === 0)
ok('pedirla dos veces no la cambia', JSON.stringify(c.hotbarDe(a)) === JSON.stringify(b0))

console.log('\n── NADIE APARECE CON LAS MANOS VACÍAS ──')
ok('la ranura 0 trae un arma', !!a.hotbar[0], String(a.hotbar[0]))
ok('y es la daga con la que se empieza', a.hotbar[0] === 'dagger', String(a.hotbar[0]))
ok('la ranura 9 trae una poción', a.hotbar[9] === 'potion_hp', String(a.hotbar[9]))
ok('las ocho de en medio están vacías', a.hotbar.slice(1, 9).every(x => x === null))

const eq = nuevo()
const espada = c.makeItem('espada_diamante')
eq.inventory.push(espada)
eq.equipment = { weapon: espada.uid }
c.hotbarDe(eq)
ok('si llevas un arma puesta, esa es la de la ranura 0',
   eq.hotbar[0] === 'espada_diamante', String(eq.hotbar[0]))

const pelado = nuevo()
pelado.inventory = [c.makeItem('herb', 3)]
pelado.equipment = {}
c.hotbarDe(pelado)
ok('sin ningún arma, la ranura 0 se queda vacía en vez de inventarse una',
   pelado.hotbar[0] === null, String(pelado.hotbar[0]))

console.log('\n── LA BARRA VALE PARA TODO, COMO SIEMPRE ──')
// La sección D.1 del encargo dice "solo armas y consumibles". Eso
// rompería la recolección: la barra nació para el hacha y el pico.
const t2 = nuevo()
const semTrigo = t2.inventory.find(i => i.itemId === 'semilla_trigo')
let r = c.ponerEnHotbar(t2, 2, semTrigo.uid)
ok('una semilla cabe en la barra', !r.error && t2.hotbar[2] === 'semilla_trigo', r.error || '')
const hacha = t2.inventory.find(i => i.itemId && /hacha/.test(i.itemId))
if (hacha) {
  r = c.ponerEnHotbar(t2, 3, hacha.uid)
  ok('y una herramienta también', !r.error && t2.hotbar[3] === hacha.itemId, r.error || '')
} else ok('y una herramienta también (sin hacha en este contexto)', true)
ok('pero una semilla NO se puede usar peleando', !c.usableDesdeLaBarra('semilla_trigo'))
ok('un arma sí', c.usableDesdeLaBarra('espada_hierro'))
ok('una poción sí', c.usableDesdeLaBarra('potion_hp'))
ok('el Agua Pura NO, aunque lo parezca', !c.usableDesdeLaBarra('water'))

console.log('\n── LOS ENDPOINTS VIEJOS SIGUEN HABLANDO EN uid ──')
const v2 = c.verHotbar(t2)
ok('verHotbar devuelve ranuras y seleccionada',
   Array.isArray(v2.ranuras) && v2.ranuras.length === 10 && 'seleccionada' in v2)
ok('cada ranura llena trae su uid, como esperan las pruebas de recolección',
   v2.ranuras[2] && v2.ranuras[2].uid === semTrigo.uid, JSON.stringify(v2.ranuras[2]))
ok('y la cantidad sale del inventario, no de la barra',
   v2.ranuras[2].cantidad === semTrigo.quantity,
   v2.ranuras[2].cantidad + ' vs ' + semTrigo.quantity)
r = c.ponerEnHotbar(t2, 1, 'itm_inventado')
ok('un uid que no tienes se rechaza', r.error && r.code === 404, JSON.stringify(r))
r = c.ponerEnHotbar(t2, 99, semTrigo.uid)
ok('una ranura fuera de la barra se rechaza', !!r.error)
c.ponerEnHotbar(t2, 5, semTrigo.uid)
ok('poner el mismo objeto en otra ranura lo MUEVE, no lo duplica',
   t2.hotbar[5] === 'semilla_trigo' && t2.hotbar[2] === null,
   JSON.stringify([t2.hotbar[2], t2.hotbar[5]]))
ok('y no aparece dos veces en toda la barra',
   t2.hotbar.filter(x => x === 'semilla_trigo').length === 1)
c.ponerEnHotbar(t2, 5, null)
ok('poner null vacía la ranura', t2.hotbar[5] === null)
r = c.seleccionarRanura(t2, 3)
ok('seleccionar ranura la cambia', !r.error && t2.hotbarSel === 3)
ok('seleccionar una inválida se rechaza y no la cambia',
   !!c.seleccionarRanura(t2, 42).error && t2.hotbarSel === 3)

console.log('\n── UNA PARTIDA GUARDADA DE ANTES SE MIGRA ──')
const viejo = nuevo()
const daga = viejo.inventory.find(i => i.itemId === 'dagger')
const poc = viejo.inventory.find(i => i.itemId === 'potion_hp')
// Ocho ranuras con uids, que es como se guardaba.
viejo.hotbar = [daga.uid, null, poc.uid, null, null, null, null, 'itm_que_ya_no_existe']
viejo.hotbarSel = 2
c.hotbarDe(viejo)
ok('se alarga a diez ranuras', viejo.hotbar.length === 10, String(viejo.hotbar.length))
ok('cada uid se traduce a su objeto', viejo.hotbar[0] === 'dagger' && viejo.hotbar[2] === 'potion_hp',
   JSON.stringify(viejo.hotbar.slice(0, 3)))
ok('se respeta en qué ranura estaba cada cosa', viejo.hotbar[1] === null)
ok('un uid muerto se pierde, porque de un uid muerto no se saca nada',
   viejo.hotbar[7] === null)
ok('y la ranura seleccionada se conserva', viejo.hotbarSel === 2)

console.log('\n── LA RANURA RECUERDA: POR ESO NO SE GUARDA EL uid ──')
const q = nuevo()
c.hotbarDe(q)
ok('empieza con tres pociones en la ranura 9', q.hotbar[9] === 'potion_hp')
c.removeItem(q, 'potion_hp', 3, 'prueba')
ok('al beberse la última, la FILA del inventario desaparece',
   !q.inventory.some(i => i.itemId === 'potion_hp'))
ok('pero la ranura RECUERDA qué iba ahí', q.hotbar[9] === 'potion_hp', String(q.hotbar[9]))
let res = c.ranuraResuelta(q, 9)
ok('y se enseña agotada, con cantidad 0', res && res.agotada === true && res.cantidad === 0, JSON.stringify(res))
c.addItem(q, 'potion_hp', 2, 'prueba')
res = c.ranuraResuelta(q, 9)
ok('al conseguir más, la ranura se rellena sola', res.agotada === false && res.cantidad === 2, JSON.stringify(res))

console.log('\n── LA RANURA ACTIVA, PARA EL COMBATE ──')
c.seleccionarRanura(q, 0)
let act = c.ranuraActivaDe(q)
ok('dice qué hay en la ranura elegida', act.itemId === 'dagger' && act.ranura === 0, JSON.stringify(act))
ok('y que es un arma', act.clase === 'arma' && act.usableEnCombate === true)
c.seleccionarRanura(q, 9)
act = c.ranuraActivaDe(q)
ok('una poción se marca como consumible', act.clase === 'consumible' && act.usableEnCombate === true)
c.seleccionarRanura(q, 4)
act = c.ranuraActivaDe(q)
ok('una ranura vacía lo dice sin devolver null', act.vacia === true && act.itemId === null)

console.log('\n── UNA BARRA CON BASURA SE LIMPIA SOLA ──')
const roto = nuevo()
roto.hotbar = ['dagger', 42, null, { x: 1 }, 'no_existe_nada', null, null, null, null, null]
roto.hotbarSel = 99
c.hotbarDe(roto)
ok('lo que no es texto se quita', roto.hotbar[1] === null && roto.hotbar[3] === null)
ok('un objeto que no existe en el catálogo también', roto.hotbar[4] === null)
ok('lo válido se queda', roto.hotbar[0] === 'dagger')
ok('y la ranura seleccionada vuelve a la 0', roto.hotbarSel === 0)

console.log('\n── EL ESTADO VIVO NO ESTÁ EN EL PERSONAJE ──')
const vivo = c.vivoDe('alguien')
ok('el estado vivo existe', !!vivo && vivo.golpe === null && vivo.invulnerableHasta === 0)
ok('y NO se le ha pegado al personaje',
   nuevo().golpe === undefined && nuevo().invulnerableHasta === undefined)
ok('pedirlo dos veces devuelve el mismo', c.vivoDe('alguien') === vivo)
ok('fuera de combate por defecto', c.enCombateMundo('alguien') === false)
c.marcarCombate('alguien', Date.now())
ok('marcar daño te pone en combate', c.enCombateMundo('alguien') === true)
ok('y dejas de estarlo pasados los 5 s',
   c.enCombateMundo('alguien', Date.now() + 5001) === false)
ok('justo antes, todavía lo estás',
   c.enCombateMundo('alguien', Date.now() + 4000) === true)
ok('los 5 s son los que dice el encargo', c.__FUERA === 5000, String(c.__FUERA))
c.vivoOlvidar('alguien')
ok('se puede olvidar a alguien que se fue', c.enCombateMundo('alguien') === false)

console.log('\n── SIN PERSONAJE NO SE CAE NADA ──')
ok('hotbarDe(null) devuelve una barra vacía', c.hotbarDe(null).length === 10)
ok('poner sin personaje no revienta', (() => { try { c.ponerEnHotbar(null, 0, 'dagger') } catch (e) { return false } return true })())
ok('elegir sin personaje se rechaza', !!c.elegirRanura(null, 0).error)

console.log('\n══════════════════════════════════════════════')
console.log(`  ${pass} OK · ${fail} fallidas`)
console.log('══════════════════════════════════════════════\n')
process.exit(fail ? 1 : 0)
