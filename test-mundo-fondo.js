/**
 * CriptoMundo — los trolls del bosque, en el fondo y no en la entrada
 * Uso:  node test-mundo-fondo.js
 *
 * POR QUÉ EXISTE
 * El bosque es una zona de nivel 1 y el troll es de nivel 5. En el mundo
 * en tiempo real la espiral que reparte los monstruos los dejaba a unos
 * 200 px de donde aparece el jugador, con una vista de 700: tres trolls
 * encima nada más entrar. Se decidió (opción 2) dejarlos en la zona pero
 * en el fondo.
 *
 * Esta prueba comprueba la promesa entera, no solo que se movieron:
 *   - que la entrada es la que dice la página, no una que me invento;
 *   - que ningún troll ve la entrada, ni los puntos por donde se llega
 *     desde otra zona, ni el camino hacia las salidas (sacadas también
 *     de la página: si alguien añade una salida, esto lo nota);
 *   - que las arañas siguen EXACTAMENTE donde estaban (la calibración
 *     R2 se hizo con ellas ahí) y que la zona tiene los mismos bichos;
 *   - y, jugando con el servidor real, que quien se queda en la entrada
 *     no atrae a ningún troll, y quien se acerca a uno sí.
 *
 * No levanta servidor: carga los módulos reales con reloj propio, como
 * test-mundo-equilibrio.js.
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { cargar } = require('./medir-nivel3.js')

let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

const S = cargar(1)
const leer = expr => vm.runInContext(expr, S.caja)
const pagina = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'criptomundo-mundo2d-2.js'), 'utf8')
const W = leer('MUNDO_ANCHO'), H = leer('MUNDO_ALTO')
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
function aSegmento(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy || 1)))
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy))
}

console.log('\n── LA ZONA NO CAMBIA DE BICHOS ──')
ok('ZONES.forest sigue siendo araña y troll (de ahí salen también los turnos)',
   JSON.stringify(leer('ZONES.forest.monsters')) === '["m_spider","m_troll"]', JSON.stringify(leer('ZONES.forest.monsters')))
ok('el troll del catálogo sigue siendo de nivel 5 y 420 de vida',
   leer('MONSTERS.m_troll.level') === 5 && leer('MONSTERS.m_troll.hp') === 420)
const z = leer("sembrarZona('forest')")
const aranas = z.monstruos.filter(m => m.monsterId === 'm_spider')
const trolls = z.monstruos.filter(m => m.monsterId === 'm_troll')
ok('seis monstruos, como antes', z.monstruos.length === leer('MONSTRUOS_POR_ZONA'), String(z.monstruos.length))
ok('tres arañas y tres trolls, como antes', aranas.length === 3 && trolls.length === 3, `${aranas.length}/${trolls.length}`)

console.log('\n── LAS ARAÑAS, DONDE ESTABAN ──')
const espiral = leer("sitiosDe('forest', MONSTRUOS_POR_ZONA)")
ok('cada araña en su sitio de la espiral de siempre (0, 2 y 4)',
   [0, 2, 4].every((i, k) => aranas[k] && aranas[k].casaX === espiral[i].x && aranas[k].casaY === espiral[i].y),
   JSON.stringify(aranas.map(a => [a.casaX, a.casaY])))

console.log('\n── LA ENTRADA ES LA DE LA PÁGINA ──')
ok('la página coloca al jugador en el centro al cargar la zona',
   /loadZone\([\s\S]*?this\.sitioLibre\(W \/ 2, H \/ 2, W, H\)/.test(pagina))
const entrada = leer('ENTRADA_ZONA')
ok('y el servidor dice lo mismo: (' + entrada.x + ', ' + entrada.y + ')', entrada.x === W / 2 && entrada.y === H / 2)
const bloque = (pagina.match(/^  bosque: \{[\s\S]*?\n  \},/m) || [''])[0]
const salidasTxt = (bloque.match(/exits:\{([^}]*)\}/) || ['', ''])[1]
const salidas = {}
for (const [, lado, dest] of salidasTxt.matchAll(/(north|south|east|west):'(\w+)'/g)) salidas[lado] = dest
ok('las salidas del bosque salen de la página', Object.keys(salidas).length > 0, salidasTxt)
// Adónde apunta cada flecha de salida (loadZone) y dónde apareces si
// llegas por ese lado (changeZone): los dos, en coordenadas de mundo.
const flecha = { north: { x: W / 2, y: 70 }, south: { x: W / 2, y: H - 40 }, east: { x: W - 90, y: H / 2 }, west: { x: 90, y: H / 2 } }
const llegada = { north: { x: W / 2, y: 80 }, south: { x: W / 2, y: H - 80 }, east: { x: W - 80, y: H / 2 }, west: { x: 80, y: H / 2 } }

console.log('\n── NINGÚN TROLL VE LA ENTRADA NI EL CAMINO ──')
const MARGEN = 80
for (const t of trolls) {
  const casa = { x: t.casaX, y: t.casaY }
  const n = `el troll de (${casa.x}, ${casa.y})`
  ok(n + ' está a más de su vista (' + t.vista + ') + ' + MARGEN + ' de la entrada',
     d(casa, entrada) > t.vista + MARGEN, Math.round(d(casa, entrada)) + ' px')
  for (const lado of Object.keys(salidas)) {
    ok(n + ' no ve dónde apareces al llegar por el ' + lado,
       d(casa, llegada[lado]) > t.vista + MARGEN, Math.round(d(casa, llegada[lado])) + ' px')
    ok(n + ' no ve el camino de la entrada a la salida ' + lado + ' (' + salidas[lado] + ')',
       aSegmento(casa, entrada, flecha[lado]) > t.vista, Math.round(aSegmento(casa, entrada, flecha[lado])) + ' px')
  }
  ok(n + ' está dentro del mapa y fuera de los árboles',
     casa.x >= 80 && casa.y >= 80 && casa.x <= W - 80 && casa.y <= H - 80 && !leer('chocaConEstructura')('forest', casa.x, casa.y, t.radio))
}

console.log('\n── JUGANDO: EN LA ENTRADA NO VIENEN; SI VAS, SÍ ──')
// Sin arañas, para que lo único que pueda venir sea un troll.
z.monstruos = trolls
const u = 'fondo_' + Math.random().toString(36).slice(2, 7)
const char = S.newCharacter(u, 'Guerrero')
S.store.players[u] = { username: u, character: char }
char.hp = 1e6                                    // que nadie muera: se mira quién viene
const estar = (x, y) => S.mundo.set(u, { zona: 'forest', x, y, dir: 0, anim: 'idle', visto: S.reloj.get(), ultimoMov: S.reloj.get() })
estar(entrada.x, entrada.y)
let alguno = false
for (let i = 0; i < 300; i++) {               // 30 s de juego
  S.mundo.get(u).visto = S.reloj.get()
  S.reloj.avanzar(100); S.tickMundo()
  if (trolls.some(t => t.objetivo === u)) alguno = true
}
ok('30 s quieto en la entrada: ningún troll te persigue', !alguno)
ok('y ninguno se ha movido de su sitio', trolls.every(t => t.x === t.casaX && t.y === t.casaY),
   JSON.stringify(trolls.map(t => [Math.round(t.x), Math.round(t.y)])))
const guarida = trolls[0]
estar(guarida.casaX + 400, guarida.casaY + 200)
for (let i = 0; i < 20; i++) { S.mundo.get(u).visto = S.reloj.get(); S.reloj.avanzar(100); S.tickMundo() }
ok('acercándote a la guarida, el troll sí te ve y viene', guarida.objetivo === u && d(guarida, { x: guarida.casaX, y: guarida.casaY }) > 20,
   guarida.estado + ' · objetivo ' + guarida.objetivo)

console.log('\n── AL REAPARECER, VUELVE AL FONDO ──')
// Con el jugador de vuelta en la entrada: una zona sin nadie no avanza.
estar(entrada.x, entrada.y)
leer('matarMonstruo')('forest', guarida, S.reloj.get())
S.reloj.avanzar(leer('REAPARECER_MS') + 100)
S.mundo.get(u).visto = S.reloj.get()
S.tickMundo()
ok('el troll muerto reaparece en la guarida, no en la entrada',
   guarida.hp === guarida.hpMax && guarida.x === guarida.casaX && d(guarida, entrada) > guarida.vista + MARGEN,
   `hp ${guarida.hp} en (${Math.round(guarida.x)}, ${Math.round(guarida.y)})`)

console.log('\n══════════════════════════════════════════════')
console.log(`  ${pass} OK · ${fail} fallidas`)
console.log('══════════════════════════════════════════════\n')
process.exit(fail ? 1 : 0)
