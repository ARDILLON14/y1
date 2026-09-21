#!/usr/bin/env node
/**
 * CriptoMundo — PASO 10: propiedades del balance
 *
 *   node test-balance.js
 *
 * QUÉ FIJA ESTO Y QUÉ NO
 * No fija números. Si mañana la Espada de Diamante pasa de 2,1 a 2,2 de
 * daño, esta prueba tiene que seguir en verde: ajustar balance es
 * normal y una prueba que se rompa cada vez que mueves una coma acaba
 * borrada.
 *
 * Lo que fija son las PROPIEDADES que no pueden volver a romperse,
 * cada una porque ya se rompió una vez y costó encontrarla:
 *
 *   1. Ningún arma rinde menos que ir a puñetazos.
 *      (Los puños ganaban a la Espada de Piedra y al Garrote.)
 *   2. La primera arma que crafteas no te empeora.
 *      (Con la daga de fábrica acababas al 43% de vida; con la Espada
 *      de Piedra, al 9%.)
 *   3. Un arma rápida no apaga al enemigo.
 *      (Pegar cada 300 ms en vez de cada 460 dividía el daño recibido
 *      por 27, porque el enemigo se pasaba la pelea trabado.)
 *   4. El embestidor llega a embestir más de una vez.
 *      (Embestía una sola vez por pelea: la primera, antes de que le
 *      alcanzaras.)
 *   5. Las arenas cuestan vida.
 *      (Se ganaban todas al 100% perdiendo entre el 0% y el 10%.)
 *   6. Las arenas se pueden ganar.
 *      (La otra mitad del equilibrio: un ajuste que las vuelva
 *      imposibles también es un fallo.)
 *   7. Un jefe por turnos dura lo bastante para ser un jefe.
 *      (El Dragón Menor moría en 3 turnos; su cambio de fase a media
 *      vida y su golpe anunciado cada 3 turnos no se veían nunca.)
 *   8. El juego no se hace más fácil según subes de nivel.
 *      (Subía un 4% por nivel mientras el jugador multiplicaba por 5,7
 *      lo que pega.)
 *
 * Todo se mide jugando partidas de verdad con banco-balance.js, que
 * carga el servidor real. Los márgenes son anchos a propósito.
 */
const B = require('./banco-balance.js')

let pass = 0, failed = 0
const check = (n, c, e = '') => {
  c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : '')))
}
const med = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const f1 = n => (Math.round(n * 10) / 10).toFixed(1)

// Semilla fija: dos ejecuciones dan el mismo veredicto. Sin esto, una
// prueba de balance parpadea y deja de creerse.
const S = B.cargarServidor(20260916)
B.añadirArenasDeLaboratorio(S)

// Bancos de laboratorio propios de esta prueba.
S.ARENAS.__aranas = { id: '__aranas', nombre: 'dos arañas', minLevel: 1, zona: 'forest',
                      oleadas: [['m_spider', 'm_spider']], oro: [0, 0], cgrid: 0 }

function jugar(caso, veces) {
  const r = { gana: 0, vida: [], seg: [], recibido: [] }
  for (let i = 0; i < veces; i++) {
    const x = B.jugarArena(S, caso)
    if (x.error) continue
    if (x.motivo === 'victoria') { r.gana++; r.vida.push(100 * x.vidaFinal / x.vidaMax) }
    r.seg.push(x.segundos)
    r.recibido.push(x.dañoRecibido)
  }
  r.victorias = (100 * r.gana) / veces
  r.vidaMedia = med(r.vida)
  return r
}

// El rendimiento de un arma: lo que tarda en limpiar el mismo banco de
// enemigos. Menos segundos es mejor.
function rendimiento(arma, veces = 8) {
  const r = jugar({ arenaId: '__saco', nivel: 10, arma }, veces)
  return { seg: med(r.seg), vida: r.vidaMedia, victorias: r.victorias }
}

console.log('\n── 1. NINGÚN ARMA RINDE MENOS QUE LOS PUÑOS ──')
const punos = rendimiento('puños')
const armas = Object.keys(S.ARMAS).filter(a => a !== 'puños')
const peores = []
for (const a of armas) {
  const r = rendimiento(a)
  // Margen del 5%: dos armas casi iguales no deben hacer fallar nada.
  if (r.seg > punos.seg * 1.05) peores.push(S.ARMAS[a].nombre + ' ' + f1(r.seg) + 's')
}
check('todas las armas limpian antes que ir a puñetazos (' + f1(punos.seg) + 's)',
  peores.length === 0, peores.join(' · '))

console.log('\n── 2. LA PRIMERA ARMA QUE CRAFTEAS NO TE EMPEORA ──')
// El personaje sale de fábrica con la Daga de Hierro. La Espada de
// Piedra es lo primero que puede forjar (levelReq 1). Si al equiparla
// le va peor, el juego le está castigando por progresar.
const conDaga = jugar({ arenaId: 'arena_bosque', nivel: 3, arma: 'dagger' }, 12)
const conPiedra = jugar({ arenaId: 'arena_bosque', nivel: 3, arma: 'espada_piedra' }, 12)
check('la Espada de Piedra gana al menos tanto como la daga de fábrica',
  conPiedra.victorias >= conDaga.victorias - 15,
  'daga ' + f1(conDaga.victorias) + '% · piedra ' + f1(conPiedra.victorias) + '%')
check('y no te deja mucho peor de vida',
  conPiedra.vidaMedia >= conDaga.vidaMedia * 0.65,
  'daga ' + f1(conDaga.vidaMedia) + '% · piedra ' + f1(conPiedra.vidaMedia) + '%')

console.log('\n── 3. UN ARMA RÁPIDA NO APAGA AL ENEMIGO ──')
// Se coge UN arma y se le cambia solo la cadencia, dejando el
// rendimiento igual. Si el daño recibido se desploma al acelerarla, es
// que la velocidad está encadenando trabas en vez de pegar más a menudo.
const original = { ...S.ARMAS.espada_piedra }
const porCadencia = {}
for (const cad of [300, 520]) {
  S.ARMAS.espada_piedra.cadenciaMs = cad
  // Mismo daño por segundo en las dos: solo cambia el ritmo.
  S.ARMAS.espada_piedra.dmg = Number(((original.dmg / original.cadenciaMs) * cad).toFixed(3))
  porCadencia[cad] = med(jugar({ arenaId: '__aranas', nivel: 3, arma: 'espada_piedra' }, 12).recibido)
}
Object.assign(S.ARMAS.espada_piedra, original)
const factor = porCadencia[520] / Math.max(1, porCadencia[300])
check('pegar rápido no divide por más de 4 el daño que recibes',
  factor <= 4,
  'a 300 ms recibes ' + porCadencia[300].toFixed(0) + ' y a 520 ms ' + porCadencia[520].toFixed(0) +
  ' (×' + f1(factor) + ')')
check('y pegar rápido sigue teniendo alguna ventaja defensiva',
  factor >= 1.05, '×' + f1(factor))

console.log('\n── 4. EL EMBESTIDOR LLEGA A EMBESTIR ──')
let avisos = 0, embestidas = 0, peleas = 0
for (let i = 0; i < 10; i++) {
  const r = B.jugarArena(S, { arenaId: '__troll', nivel: 10, arma: 'espada_hierro' })
  if (r.error) continue
  const t = r.porTipo.m_troll || {}
  avisos += t.avisos || 0; embestidas += t.embestidas || 0; peleas++
}
check('el troll se prepara más de una vez por pelea',
  avisos / Math.max(1, peleas) > 1.5, f1(avisos / Math.max(1, peleas)) + ' avisos por pelea')
check('y la mayoría de sus preparaciones acaban en embestida',
  embestidas >= avisos * 0.5, embestidas + ' de ' + avisos)

console.log('\n── 5. LAS ARENAS CUESTAN VIDA ──')
const CASOS = [
  { arenaId: 'arena_bosque', nivel: 1, arma: 'dagger', etq: 'bosque nv1' },
  { arenaId: 'arena_bosque', nivel: 6, arma: 'espada_hierro', etq: 'bosque nv6' },
  { arenaId: 'arena_minas', nivel: 11, arma: 'iron_axe', etq: 'minas nv11' },
  { arenaId: 'arena_ruinas', nivel: 18, arma: 'espada_diamante', etq: 'ruinas nv18' },
]
const medidas = CASOS.map(c => ({ ...c, ...jugar(c, 12) }))
for (const m of medidas) {
  check(m.etq + ': salir de la arena cuesta vida',
    m.vidaMedia <= 92, 'termina con el ' + f1(m.vidaMedia) + '%')
}
check('y la partida dura algo más que un anuncio',
  medidas.every(m => med(m.seg) >= 12),
  medidas.map(m => m.etq + ' ' + f1(med(m.seg)) + 's').join(' · '))

console.log('\n── 6. LAS ARENAS SE PUEDEN GANAR ──')
for (const m of medidas) {
  check(m.etq + ': un jugador competente la gana',
    m.victorias >= 60, f1(m.victorias) + '% de victorias')
}

console.log('\n── 7. UN JEFE DURA LO QUE DURA UN JEFE ──')
// Los jefes anuncian un golpe fuerte cada 3 turnos y cambian de fase a
// media vida. Si la pelea acaba en 3 turnos, ninguna de las dos cosas
// llega a verse: es contenido escrito y nunca mostrado.
for (const [mid, nivel, nombre] of [['m_troll_boss', 7, 'Grommash'], ['m_dragon', 15, 'Dragón'], ['m_demon', 20, 'Demonio']]) {
  const t = [], f2 = []
  for (let i = 0; i < 10; i++) {
    const r = B.jugarTurnos(S, { monsterId: mid, nivel, arma: nivel >= 10 ? 'espada_diamante' : 'espada_hierro' })
    if (r.error) continue
    t.push(r.turnos); f2.push(r.fase2 ? 1 : 0)
  }
  check(nombre + ': dura lo bastante para ser un jefe (8 turnos o más)',
    med(t) >= 8, f1(med(t)) + ' turnos')
  check(nombre + ': se llega a ver su cambio de fase',
    med(f2) >= 0.8, f1(med(f2) * 100) + '% de las peleas')
}

console.log('\n── 8. EL JUEGO NO SE ABLANDA AL SUBIR DE NIVEL ──')
// Un jugador de nivel alto le saca mucho más a un bicho pensado para
// nivel bajo que uno recién llegado. Eso tiene que notarse en el
// escalado, o el veterano pasea.
const pl = B.crearJugador(S, { nivel: 20 })
const cerca = S.seguimientoDe(pl.character, S.ESCALA_ARENA, 18)
const lejos = S.seguimientoDe(pl.character, S.ESCALA_ARENA, 3)
const igual = S.seguimientoDe(pl.character, S.ESCALA_ARENA, 20)
delete S.store.players[pl.username]
check('a un bicho de su propio nivel no se le sube nada',
  Math.abs(igual.vida - 1) < 0.01 && Math.abs(igual.daño - 1) < 0.01,
  'vida ×' + igual.vida.toFixed(2) + ' daño ×' + igual.daño.toFixed(2))
check('cuanto más nivel le saca el jugador, más se le sube al bicho',
  lejos.vida > cerca.vida && cerca.vida >= 1,
  'nv3 ×' + lejos.vida.toFixed(2) + ' · nv18 ×' + cerca.vida.toFixed(2))
check('y la vida del bicho sube más deprisa que su daño',
  lejos.vida > lejos.daño,
  'vida ×' + lejos.vida.toFixed(2) + ' · daño ×' + lejos.daño.toFixed(2))

console.log(`\n══════════════════════════════════════════════`)
console.log(`  ${pass} OK · ${failed} fallidas`)
console.log(`══════════════════════════════════════════════\n`)
process.exit(failed ? 1 : 0)
