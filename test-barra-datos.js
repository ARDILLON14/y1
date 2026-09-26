/**
 * CriptoMundo — FASE B · la barra de objetos, como dato
 * Uso:  node test-barra-datos.js
 *
 * POR QUÉ EXISTE
 * La FASE D pondrá los endpoints. Esto comprueba lo de debajo: la forma
 * del dato, la migración de las partidas viejas y las reglas de quién
 * puede ir en qué ranura. Son funciones puras sobre el personaje, así
 * que se prueban sin servidor y sin red.
 *
 * LO QUE MÁS IMPORTA AQUÍ es la decisión de guardar el itemId y no el
 * uid: removeItem() borra la fila del inventario cuando la cantidad
 * llega a cero, así que con uid la última poción se llevaría la ranura
 * por delante. Hay tres comprobaciones sobre eso.
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
  for (const f of ['20-skins.js', '30-personajes-combate.js', '31-turnos.js', '58-arena.js', '59-armas-perfil.js', '59-barra.js', '59-combate-vivo.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8'), ctx, { filename: f })
  }
  vm.runInContext('var __RANURAS = BARRA_RANURAS; var __FUERA = FUERA_COMBATE_MS', ctx)
  return ctx
}
let semilla = 0
const c = cargar()

// Un personaje de verdad, hecho por el propio juego.
const nuevo = () => c.newCharacter('probador' + (++semilla), 'Guerrero')

console.log('\n── LA FORMA DEL DATO ──')
ok('la barra tiene 10 ranuras', c.__RANURAS === 10, String(c.__RANURAS))
const a = nuevo()
ok('un personaje nuevo no trae barra guardada', a.hotbar === undefined)
const b0 = c.barraDe(a)
ok('y se le hace una en cuanto alguien la pide', Array.isArray(a.hotbar) && a.hotbar.length === 10)
ok('con la ranura activa en la 0', b0.ranuraActiva === 0)
ok('pedirla dos veces no la cambia', JSON.stringify(c.barraDe(a).hotbar) === JSON.stringify(b0.hotbar))

console.log('\n── LA MIGRACIÓN (B.4): NADIE APARECE CON LAS MANOS VACÍAS ──')
ok('la ranura 0 trae un arma', !!a.hotbar[0], String(a.hotbar[0]))
ok('y es la daga con la que se empieza', a.hotbar[0] === 'dagger', String(a.hotbar[0]))
ok('la ranura 9 trae una poción', a.hotbar[9] === 'potion_hp', String(a.hotbar[9]))
ok('las ocho de en medio están vacías', a.hotbar.slice(1, 9).every(x => x === null))

// Con un arma EQUIPADA, manda esa y no la mejor de la mochila.
const eq = nuevo()
const espada = c.makeItem('espada_diamante')
eq.inventory.push(espada)
eq.equipment = { weapon: espada.uid }
c.barraDe(eq)
ok('si llevas un arma puesta, esa es la de la ranura 0',
   eq.hotbar[0] === 'espada_diamante', String(eq.hotbar[0]))

// Sin arma ninguna: la ranura 0 se queda vacía, no se inventa nada.
const pelado = nuevo()
pelado.inventory = pelado.inventory.filter(i => !c.ARMAS_TEST_NO)
pelado.inventory = [c.makeItem('herb', 3)]
pelado.equipment = {}
c.barraDe(pelado)
ok('sin ningún arma, la ranura 0 se queda vacía en vez de inventarse una',
   pelado.hotbar[0] === null, String(pelado.hotbar[0]))

console.log('\n── QUÉ PUEDE IR EN UNA RANURA ──')
ok('un arma sí', c.puedeIrEnBarra('espada_hierro'))
ok('una poción sí', c.puedeIrEnBarra('potion_hp'))
// «Bebible» lo decide usableEnCombate(), no el tipo del catálogo. El
// Agua Pura es MATERIAL y no cura: parece bebida y no lo es.
ok('el Agua Pura NO, aunque lo parezca', !c.puedeIrEnBarra('water'))
ok('una poción mejor también sí', c.puedeIrEnBarra('potion_hp_ii'))
ok('una armadura NO', !c.puedeIrEnBarra('iron_helm'))
ok('un material NO', !c.puedeIrEnBarra('iron_ore'))
ok('una semilla NO', !c.puedeIrEnBarra('semilla_trigo'))
ok('algo que no existe NO', !c.puedeIrEnBarra('lo_que_sea'))
ok('null NO', !c.puedeIrEnBarra(null))

console.log('\n── ASIGNAR, MOVER, ELEGIR ──')
const p = nuevo()
c.barraDe(p)
let r = c.asignarEnBarra(p, 3, 'potion_hp_ii')
ok('se puede poner una poción en la 3', !r.error && p.hotbar[3] === 'potion_hp_ii', r.error || '')
r = c.asignarEnBarra(p, 10, 'potion_hp')
ok('la ranura 10 se rechaza', r.error && r.code === 400, JSON.stringify(r))
r = c.asignarEnBarra(p, -1, 'potion_hp')
ok('la ranura −1 se rechaza', !!r.error)
r = c.asignarEnBarra(p, 1.5, 'potion_hp')
ok('una ranura con decimales se rechaza', !!r.error)
r = c.asignarEnBarra(p, 4, 'iron_ore')
ok('un material se rechaza con su motivo', r.error && /armas y consumibles/.test(r.error), r.error)
r = c.asignarEnBarra(p, 4, 'espada_diamante')
ok('un arma que NO tienes se rechaza', r.error && /No tienes/.test(r.error), r.error)

// El mismo objeto no puede estar en dos sitios: se mueve.
c.asignarEnBarra(p, 5, 'potion_hp_ii')
ok('poner el mismo objeto en otra ranura lo MUEVE, no lo duplica',
   p.hotbar[5] === 'potion_hp_ii' && p.hotbar[3] === null,
   JSON.stringify([p.hotbar[3], p.hotbar[5]]))
ok('y no aparece dos veces en toda la barra',
   p.hotbar.filter(x => x === 'potion_hp_ii').length === 1)

c.asignarEnBarra(p, 5, null)
ok('asignar null vacía la ranura', p.hotbar[5] === null)

const antes = [p.hotbar[0], p.hotbar[9]]
c.moverEnBarra(p, 0, 9)
ok('mover intercambia las dos ranuras',
   p.hotbar[0] === antes[1] && p.hotbar[9] === antes[0], JSON.stringify([p.hotbar[0], p.hotbar[9]]))
ok('mover a una ranura inválida se rechaza', !!c.moverEnBarra(p, 0, 99).error)

ok('elegir ranura la cambia', c.elegirRanura(p, 7).ranuraActiva === 7 && p.ranuraActiva === 7)
ok('elegir una ranura inválida se rechaza y no la cambia',
   !!c.elegirRanura(p, 42).error && p.ranuraActiva === 7)

console.log('\n── SE GUARDA EL itemId, NO EL uid: POR QUÉ IMPORTA ──')
const q = nuevo()
c.barraDe(q)
const cuantas = () => (q.inventory.find(i => i.itemId === 'potion_hp') || {}).quantity || 0
ok('empieza con tres pociones en la ranura 9', q.hotbar[9] === 'potion_hp' && cuantas() === 3)
c.removeItem(q, 'potion_hp', 3, 'prueba')
ok('al beberse la última, la FILA del inventario desaparece',
   !q.inventory.some(i => i.itemId === 'potion_hp'))
ok('pero la ranura RECUERDA qué iba ahí', q.hotbar[9] === 'potion_hp', String(q.hotbar[9]))
let res = c.ranuraResuelta(q, 9)
ok('y se enseña agotada, con cantidad 0', res.agotada === true && res.cantidad === 0, JSON.stringify(res))
c.addItem(q, 'potion_hp', 2, 'prueba')
res = c.ranuraResuelta(q, 9)
ok('al conseguir más, la ranura se rellena sola', res.agotada === false && res.cantidad === 2, JSON.stringify(res))

console.log('\n── LA RANURA, RESUELTA CONTRA EL INVENTARIO DE AHORA ──')
res = c.ranuraResuelta(q, 0)
ok('un arma se marca como arma', res.clase === 'arma', res.clase)
ok('y no como apilable', res.apilable === false)
ok('trae nombre, icono y rareza del catálogo',
   res.nombre === 'Daga de Hierro' && !!res.icono && !!res.rareza, JSON.stringify(res))
res = c.ranuraResuelta(q, 9)
ok('una poción se marca como consumible y apilable', res.clase === 'consumible' && res.apilable === true)
ok('una ranura vacía lo dice', c.ranuraResuelta(q, 4).vacia === true)
const todo = c.barraResuelta(q)
ok('la barra entera trae las 10 ranuras resueltas', todo.hotbar.length === 10)
ok('y la ranura activa', Number.isInteger(todo.ranuraActiva))

console.log('\n── UNA BARRA GUARDADA CON BASURA SE LIMPIA SOLA ──')
const roto = nuevo()
roto.hotbar = ['iron_ore', 'no_existe', null, 42, 'dagger', null, null, null, null, null]
roto.ranuraActiva = 99
c.barraDe(roto)
ok('lo que no puede ir en la barra se quita', roto.hotbar[0] === null && roto.hotbar[1] === null)
ok('lo que no es texto también', roto.hotbar[3] === null)
ok('lo válido se queda', roto.hotbar[4] === 'dagger')
ok('y la ranura activa vuelve a la 0', roto.ranuraActiva === 0)
const corto = nuevo()
corto.hotbar = ['dagger']
c.barraDe(corto)
ok('una barra de largo equivocado se rehace entera', corto.hotbar.length === 10)

console.log('\n── EL ESTADO VIVO NO ESTÁ EN EL PERSONAJE (desvío de B.4) ──')
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
ok('quien nunca peleó no está en combate', c.enCombateMundo('nadie_de_nada') === false)

console.log('\n── SIN PERSONAJE NO SE CAE NADA ──')
ok('barraDe(null) devuelve una barra vacía', c.barraDe(null).hotbar.length === 10)
ok('asignar sin personaje se rechaza', !!c.asignarEnBarra(null, 0, 'dagger').error)
ok('mover sin personaje se rechaza', !!c.moverEnBarra(null, 0, 1).error)
ok('elegir sin personaje se rechaza', !!c.elegirRanura(null, 0).error)

console.log('\n══════════════════════════════════════════════')
console.log(`  ${pass} OK · ${fail} fallidas`)
console.log('══════════════════════════════════════════════\n')
process.exit(fail ? 1 : 0)
