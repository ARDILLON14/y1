/**
 * CriptoMundo — el equilibrio del mundo en tiempo real
 * Uso:  node test-mundo-equilibrio.js
 *
 * POR QUÉ EXISTE
 * La regla R2 del encargo de combate dice que el equilibrio no se toca,
 * y que si se desvía más de un 15 % se para y se explica. Medido, el
 * mundo nuevo era muchísimo más fácil que los turnos, y la causa no era
 * un número: era que cada golpe del jugador le cortaba el aviso al
 * monstruo, así que la araña NO MORDÍA NUNCA. Una pelea entera a nivel
 * 1 sin perder un punto de vida, y bloquear salía más caro que no
 * bloquear.
 *
 * Arreglado eso, se calibró un solo dial —ESCALA_MUNDO.daño— hasta que
 * una pelea contra una araña cuesta lo mismo en los dos sistemas. Esta
 * prueba es lo que impide que eso se deshaga en silencio: si alguien
 * cambia el daño, la vida o la regla de la traba, salta aquí con el
 * porcentaje.
 *
 * No levanta servidor: carga los módulos reales con reloj propio, igual
 * que banco-balance.js y medir-nivel3.js, y usa las mismas funciones de
 * medida que npm run nivel3.
 */
const vm = require('vm')
const { cargar, tandaPelea, peleaTurnos, peleaMundo } = require('./medir-nivel3.js')

let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const VECES = 20

console.log('\n── LO QUE YA EXISTÍA NO SE HA MOVIDO ──')
const S = cargar(1)
const leer = expr => vm.runInContext(expr, S.caja)
ok('la escala de los turnos sigue en vida ×1,6 y daño ×1,4',
   leer('ESCALA_TURNOS.vida') === 1.6 && leer('ESCALA_TURNOS.daño') === 1.4,
   JSON.stringify(leer('ESCALA_TURNOS')))
ok('la de la arena, en vida ×1,4 y daño ×0,65',
   leer('ESCALA_ARENA.vida') === 1.4 && leer('ESCALA_ARENA.daño') === 0.65)
ok('bloquear sigue dejando pasar el 30 %', leer('REDUCCION_BLOQUEO') === 0.3)
ok('la araña del catálogo sigue siendo la misma',
   leer('MONSTERS.m_spider.hp') === 285 && leer('MONSTERS.m_spider.atk[0]') === 48 && leer('MONSTERS.m_spider.atk[1]') === 82)

console.log('\n── LA ESCALA DEL MUNDO ──')
ok('el mundo tiene su propia escala de daño', leer("typeof ESCALA_MUNDO") === 'object')
ok('calibrada en ×5', leer('ESCALA_MUNDO.daño') === 5, String(leer('ESCALA_MUNDO.daño')))
const ar = leer("(() => { const z = sembrarZona('forest'); return z.monstruos.find(m => m.monsterId === 'm_spider') })()")
ok('una araña del mundo muerde (48+82)/2 × 5 = 325', ar && ar.dmg === 325, String(ar && ar.dmg))
ok('y su vida es la del catálogo, sin escalar', ar && ar.hpMax === 285, String(ar && ar.hpMax))

console.log('\n── UN RASGUÑO NO CORTA UN GOLPE COMPROMETIDO ──')
// La regla que la arena se ganó midiendo y que el mundo había perdido.
const m = leer("(() => { const z = sembrarZona('forest'); return z.monstruos.find(m => m.monsterId === 'm_spider') })()")
m.estado = 'avisa'; m.trabadoHasta = 0; m.proxTraba = 0
leer('trabar')(m, 26, 1_000_000)          // un golpe de daga: el 9 % de su vida
ok('un golpe de daga NO le corta el aviso a la araña', m.estado === 'avisa', m.estado)
ok('ni la deja trabada', !(m.trabadoHasta > 1_000_000), String(m.trabadoHasta))
leer('trabar')(m, 120, 1_000_000)         // un golpe del 42 %: aturde
ok('un golpe que aturde (más del 30 %) sí se lo corta', m.estado === 'persigue', m.estado)
ok('y la deja aturdida 700 ms', m.trabadoHasta === 1_000_700, String(m.trabadoHasta))
const m2 = leer("(() => { const z = sembrarZona('forest'); return z.monstruos.filter(m => m.monsterId === 'm_spider')[1] })()")
m2.estado = 'persigue'; m2.trabadoHasta = 0; m2.proxTraba = 0
leer('trabar')(m2, 26, 2_000_000)
ok('fuera del aviso, un golpe normal sí traba', m2.trabadoHasta > 2_000_000, String(m2.trabadoHasta))

console.log('\n── UNA PELEA CUESTA LO MISMO EN LOS DOS SISTEMAS (R2) ──')
const t = tandaPelea(peleaTurnos, false, VECES)
const w = tandaPelea(peleaMundo, false, VECES)
const wr = tandaPelea(peleaMundo, true, VECES)
const desvio = (w.mediana / t.mediana - 1) * 100
ok('en el mundo la araña LLEGA A MORDER: se pierde vida', w.mediana > 0,
   'mediana ' + Math.round(w.mediana) + ' (antes del arreglo: 0)')
ok('la vida perdida por pelea no se desvía más de un 15 % de la de los turnos',
   Math.abs(desvio) <= 15,
   `turnos ${Math.round(t.mediana)} · mundo ${Math.round(w.mediana)} · ${desvio >= 0 ? '+' : ''}${desvio.toFixed(1)} %`)
ok('nadie muere en una sola pelea contra una araña a nivel 1, en ninguno de los dos',
   t.muertes === 0 && w.muertes === 0, `turnos ${t.muertes} · mundo ${w.muertes}`)

console.log('\n── Y BLOQUEAR SALE A CUENTA ──')
// Antes del arreglo era al revés: el robot que bloqueaba perdía MÁS que
// el que solo pegaba, porque dejar de pegar le dejaba terminar el golpe.
ok('bloqueando se pierde menos que sin bloquear', wr.mediana < w.mediana,
   `bloqueando ${Math.round(wr.mediana)} · sin bloquear ${Math.round(w.mediana)}`)
ok('bastante menos: al menos un 30 %', wr.mediana < w.mediana * 0.7,
   `ahorra ${Math.round((1 - wr.mediana / w.mediana) * 100)} %`)

console.log('\n══════════════════════════════════════════════')
console.log(`  ${pass} OK · ${fail} fallidas`)
console.log('══════════════════════════════════════════════\n')
process.exit(fail ? 1 : 0)
