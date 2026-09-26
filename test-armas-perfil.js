/**
 * CriptoMundo — FASE B · el perfil de arma
 * Uso:  node test-armas-perfil.js
 *
 * POR QUÉ EXISTE
 * La FASE B del encargo añade campos de arma al catálogo. La auditoría
 * encontró que cinco de los siete YA ESTÁN, medidos y cuadrados contra
 * el precio de cada arma, y que aplicar los valores por defecto del
 * encargo cambiaría el equilibrio de las 14 — lo que choca con la regla
 * R2.
 *
 * Así que `perfilDeArma` no declara armas: las lee. Y lo que más falta
 * comprobar es justo eso: QUE NO CAMBIA NADA. Las primeras 14
 * comprobaciones son una por arma, campo a campo, contra el catálogo.
 *
 * No hace falta servidor: se evalúan los módulos de verdad —el catálogo
 * de objetos, el de armas y el perfil— en un contexto aislado.
 */
const fs = require('fs')
const vm = require('vm')
const path = require('path')

let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

// Los módulos reales, con lo mínimo que necesitan para evaluarse.
function cargar(extra) {
  const ctx = {
    console, Math, Date, JSON, Object, Array, Number, String, Boolean, Set, Map,
    isFinite, parseInt, parseFloat, Buffer,
    setInterval: () => ({ unref() {} }), setTimeout: () => 0,
    clearInterval() {}, clearTimeout() {},
    now: () => Date.now(), nextId: p => p + '_x', today: () => '2026-01-01',
    store: { players: {}, battles: {}, economy: {}, analytics: {}, auditLog: [] },
    audit() {}, track() {}, trackItems() {}, trackCurrency() {}, step() {}, persist() {},
    fs, path,
  }
  ctx.globalThis = ctx
  vm.createContext(ctx)
  const mods = ['30-personajes-combate.js', '31-turnos.js', '57-golpe.js', '58-arena.js', '59-armas-perfil.js', '59-barra.js']
  for (const f of mods) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', 'server', f), 'utf8'), ctx, { filename: f })
  }
  // Las const de un script de vm no se cuelgan del contexto; con var sí.
  vm.runInContext('var __ARMAS = ARMAS; var __ITEMS = ITEM_TEMPLATES; var __INVULN = INVULN_MS; var __PMAX = PROYECTILES_MAX', ctx)
  if (extra) vm.runInContext(extra, ctx)
  return ctx
}

const c = cargar()

console.log('\n── R2: NINGÚN ARMA QUE YA EXISTE CAMBIA DE NADA ──')
const CAMPOS = ['alcance', 'arco', 'cadenciaMs', 'dmg', 'empuje']
const ids = Object.keys(c.__ARMAS)
ok('el catálogo de armas se ha cargado', ids.length === 14, String(ids.length))
for (const id of ids) {
  const base = c.__ARMAS[id]
  const p = c.perfilDeArma(id)
  const iguales = CAMPOS.every(k => p[k] === base[k])
  const proy = JSON.stringify(p.proyectil || null) === JSON.stringify(base.proyectil || null)
  ok(`${id} conserva alcance, arco, cadencia, daño, empuje y proyectil`, iguales && proy,
     CAMPOS.filter(k => p[k] !== base[k]).map(k => `${k}: ${base[k]}→${p[k]}`).join(' ') || (proy ? '' : 'proyectil'))
}

console.log('\n── LOS CUATRO TIPOS SE DEDUCEN, NO SE DECLARAN ──')
const tipos = c.inventarioDeTipos()
ok('lanza = la que tiene gesto de estocada', tipos.lanza.join() === 'iron_spear', tipos.lanza.join())
ok('arco = proyectil sin elemento', tipos.arco.slice().sort().join() === 'elven_bow,short_bow', tipos.arco.join())
ok('magia = proyectil CON elemento', tipos.magia.slice().sort().join() === 'crystal_wand,thunder_staff', tipos.magia.join())
// Nueve, no seis. El hacha y el garrote (tajo_alto) y la daga
// (pinchazo) son gestos distintos, pero la FORMA del impacto es la
// misma que la de la espada: un sector centrado en el apuntado. Solo la
// estocada cambia de forma. El gesto decide cómo se ve; el tipoUso,
// cómo pega.
ok('espada = todo lo que pega en sector, y son nueve', tipos.espada.length === 9, tipos.espada.join())
ok('el hacha y el garrote son sector aunque su gesto sea tajo alto',
   tipos.espada.includes('iron_axe') && tipos.espada.includes('wood_club'))
ok('pero conservan su gesto propio para dibujarse',
   c.perfilDeArma('iron_axe').gesto === 'tajo_alto' && c.perfilDeArma('dagger').gesto === 'pinchazo')
ok('los cuatro tipos suman las 14 armas',
   tipos.espada.length + tipos.lanza.length + tipos.arco.length + tipos.magia.length === 14)
ok('o sea: los cuatro tipos del encargo se pueden usar HOY',
   Object.values(tipos).every(a => a.length > 0))

console.log('\n── LAS UNIDADES DEL ARCO (decisión D2) ──')
ok('arco es SEMI-apertura en radianes: 1,6 son 183°',
   Math.abs(c.arcoAGrados(1.6) - 183.346) < 0.01, String(c.arcoAGrados(1.6)))
ok('los 120° del encargo son 1,047 rad, no 120',
   Math.abs(c.gradosAArco(120) - 1.0472) < 0.001, String(c.gradosAArco(120)))
ok('ida y vuelta no pierde nada',
   Math.abs(c.gradosAArco(c.arcoAGrados(1.37)) - 1.37) < 1e-12)
ok('el perfil trae el arco también en grados, y es el doble del semi',
   Math.abs(c.perfilDeArma('espada_hierro').arcoGrados - 1.6 * 2 * 180 / Math.PI) < 1e-9)
// La trampa que esto existe para evitar: 120 leído como radianes acierta
// en cualquier dirección, incluso a la espalda.
ok('120 radianes abarcarían más de una vuelta entera (por eso no se confunden)',
   c.arcoAGrados(120) > 360, String(Math.round(c.arcoAGrados(120))))

console.log('\n── LA INVULNERABILIDAD ES UN SOLO NÚMERO (decisión D4) ──')
ok('INVULN_MS vale 450, que es lo que ya usaba la arena', c.__INVULN === 450, String(c.__INVULN))
const arena = fs.readFileSync(path.join(__dirname, 'src', 'server', '58-arena.js'), 'utf8')
ok('y la arena sigue usando ese mismo valor', /invulnHasta = ahora \+ 450/.test(arena))

console.log('\n── LOS DEFECTOS SOLO VALEN PARA UN ARMA QUE NO EXISTE (decisión D1) ──')
const inv = c.perfilDeArma('arma_que_no_existe')
ok('un arma desconocida no revienta', !!inv)
ok('y coge el defecto de espada, no los números de los puños',
   inv.alcance === 56 && inv.tipoUso === 'espada', inv.alcance + ' / ' + inv.tipoUso)
ok('los puños siguen teniendo los suyos', c.perfilDeArma('puños').alcance === 46,
   String(c.perfilDeArma('puños').alcance))

// Un arma nueva declarada SOLO en el catálogo de objetos: ahí sí mandan
// los defectos de su tipo, que es lo que pide la sección B.2.
const c2 = cargar(`ITEM_TEMPLATES.pica_prueba = {
  name: 'Pica de Prueba', icon: '🔱', type: 'WEAPON', rarity: 'RARE', value: 100,
  slot: 'weapon', tradeable: true, stats: { str: 5 },
  combate: { tipoUso: 'lanza' },
}`)
const pica = c2.perfilDeArma('pica_prueba')
ok('un arma solo del catálogo toma el tipo que declara', pica.tipoUso === 'lanza', pica.tipoUso)
ok('y con él, el alcance por defecto de la lanza', pica.alcance === 80, String(pica.alcance))
ok('y su arco de 30° totales', Math.abs(pica.arcoGrados - 30) < 1e-9, String(pica.arcoGrados))
ok('pero el nombre y el icono salen del catálogo', pica.nombre === 'Pica de Prueba' && pica.icono === '🔱')

const c3 = cargar(`ITEM_TEMPLATES.varita_prueba = {
  name: 'Varita de Prueba', icon: '✨', type: 'WEAPON', rarity: 'EPIC', value: 400,
  slot: 'weapon', tradeable: true,
  combate: { tipoUso: 'magia', costeMp: 12, alcance: 300 },
}`)
const vp = c3.perfilDeArma('varita_prueba')
ok('lo que el objeto declara gana al defecto de su tipo', vp.alcance === 300, String(vp.alcance))
ok('un arma puede gastar maná si lo dice', vp.costeMp === 12, String(vp.costeMp))
ok('y le viene su proyectil por ser de magia', !!vp.proyectil && vp.tipo === 'ranged')

console.log('\n── LO QUE SÍ ES NUEVO, Y EMPIEZA INERTE ──')
ok('hoy NINGÚN arma del juego gasta maná: eso movería el equilibrio',
   ids.every(id => c.perfilDeArma(id).costeMp === 0))
ok('todas admiten mantener pulsado', ids.every(id => c.perfilDeArma(id).autoGolpe === true))
ok('el tope de proyectiles vivos es 8', c.__PMAX === 8, String(c.__PMAX))

console.log('\n── BASURA DE ENTRADA ──')
for (const v of [null, undefined, 0, 123, {}, [], '']) {
  const r = c.perfilDeArma(v)
  if (!(r === null || (r && typeof r === 'object'))) { ok('basura: ' + String(v), false); break }
}
ok('cualquier entrada devuelve un perfil o null, nunca una excepción', true)
ok('el perfil de un personaje sin arma equipada son los puños',
   c.perfilArmaDe({ equipment: {}, inventory: [] }).id === 'puños')
ok('y el de un personaje inexistente también', c.perfilArmaDe(null).id === 'puños')

console.log('\n══════════════════════════════════════════════')
console.log(`  ${pass} OK · ${fail} fallidas`)
console.log('══════════════════════════════════════════════\n')
process.exit(fail ? 1 : 0)
