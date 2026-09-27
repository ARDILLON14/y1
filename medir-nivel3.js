#!/usr/bin/env node
/**
 * CriptoMundo — cuánto cuesta llegar a nivel 3, antes y después
 *
 *   node medir-nivel3.js                  el código de ahora
 *   node medir-nivel3.js --src <dir>      el de otro árbol (p. ej. una
 *                                         copia de antes del encargo)
 *   node medir-nivel3.js --json           los números en crudo
 *
 * POR QUÉ EXISTE
 * La sección 8 del encargo de combate pide dos mediciones que no hice:
 *   1. ataques para llegar a nivel 3, antes y después;
 *   3. muertes hasta nivel 3 con el robot de banco-balance, adaptado
 *      al mundo.
 * Y la regla R2: si se desvían más de un 15 %, se para y se explica.
 *
 * CÓMO MIDE
 * Igual que banco-balance.js: carga los MÓDULOS REALES del servidor en
 * una máquina virtual y solo les cambia el reloj y el dado (con
 * semilla, para que dos ejecuciones den lo mismo). No reimplementa el
 * combate: juega con él.
 *
 * El robot no hace trampa: decide con lo que ve un cliente —la salida
 * de estadoMundoDe() en el mundo, el resultado de cada turno en los
 * turnos— y actúa por la misma puerta que un cliente. Juega como alguien
 * que ha entendido el juego: bloquea cuando le avisan, bebe por debajo
 * de un tercio de vida, y descansa entre pelea y pelea.
 *
 * Y hay un segundo jugador, el ingenuo: solo pega. Es el que muestra
 * cuánto pesan las dos mecánicas que el STEP 21 demostró que deciden el
 * juego.
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const args = process.argv.slice(2)
const iSrc = args.indexOf('--src')
const SRC = iSrc >= 0 ? path.resolve(args[iSrc + 1]) : path.join(__dirname, 'src', 'server')
const JSON_ = args.includes('--json')
const REPETICIONES = 12

function cargar(semilla) {
  const modulos = fs.readdirSync(SRC)
    .filter(f => f.endsWith('.js') && f !== '00-header.js' && f !== '60-http.js').sort()
  let fuente = fs.readFileSync(path.join(SRC, '00-header.js'), 'utf8') + '\n'
  for (const m of modulos) fuente += fs.readFileSync(path.join(SRC, m), 'utf8') + '\n'
  const RELOJ = 'function now() { return Date.now() }'
  if (!fuente.includes(RELOJ)) { console.error('❌ No encuentro now(): no se puede medir con reloj propio'); process.exit(1) }
  fuente = fuente.replace(RELOJ, 'function now() { return globalThis.__t }')
  const caja = {
    require, console: { log() {}, warn() {}, error() {} }, process, Buffer, URL, TextEncoder, TextDecoder,
    __dirname: path.dirname(SRC), __filename: path.join(SRC, 'x.js'), __t: 1_000_000,
    setInterval: () => ({ unref() {} }), setTimeout: () => ({ unref() {} }),
    clearInterval() {}, clearTimeout() {},
  }
  caja.globalThis = caja
  vm.createContext(caja)
  vm.runInContext(fuente, caja, { filename: 'criptomundo-nivel3.js' })
  const dado = vm.runInContext('makeRng(' + semilla + ')', caja)
  vm.runInContext('Math.random = globalThis.__dado', Object.assign(caja, { __dado: dado }))
  vm.runInContext('persist = function () {}; audit = function () {}', caja)
  const hayMundo = vm.runInContext("typeof entradaMundo === 'function'", caja)
  const api = vm.runInContext(`({
    store, MONSTERS, newCharacter, effectiveStats, startBattle, combatAction,
    regenerarFuera, removeItem, countItem,
    ${hayMundo ? 'mundo, entradaMundo, tickMundo, estadoMundoDe, enCombateMundo, hotbarDe, seleccionarRanura, zonaViva,' : ''}
  })`, caja)
  api.hayMundo = hayMundo
  api.reloj = { avanzar: ms => { caja.__t += ms }, get: () => caja.__t }
  return api
}

// La misma regla que POST /api/player/respawn (60-http.js:285): vuelves
// con la mitad del tope real. Transcrita aquí porque vive dentro del
// endpoint y no en una función que se pueda llamar.
function resucitar(S, char) {
  const st = S.effectiveStats(char)
  char.hp = Math.floor(st.maxHp * 0.5)
  char.mp = Math.floor(st.maxMp * 0.5)
}

// Descansar entre peleas, como haría cualquiera: hasta el 90 %, con el
// ritmo real de recuperación (regenerarFuera, 1 % cada 1.500 ms).
function descansar(S, char, ocupado) {
  let vueltas = 0
  while (char.hp < S.effectiveStats(char).maxHp * 0.9 && vueltas++ < 400) {
    S.reloj.avanzar(1500)
    S.regenerarFuera(char, ocupado ? ocupado() : false)
  }
}

// ── En turnos ──────────────────────────────────────────────────────
function aNivel3Turnos(S, robot, descansa = true) {
  const u = 'n3t_' + Math.random().toString(36).slice(2, 8)
  const char = S.newCharacter(u, 'Guerrero')
  S.store.players[u] = { username: u, character: char }
  let ataques = 0, acciones = 0, muertes = 0, bajas = 0, bloqueos = 0, curas = 0
  let peleas = 0
  while (char.level < 3 && peleas++ < 60) {
    const b = S.startBattle(char, 'm_spider')
    if (!b) break
    let turnos = 0
    while (turnos++ < 80) {
      S.reloj.avanzar(1500)
      let acc = 'attack', obj = null
      if (robot && b.telegraph) { acc = 'block'; bloqueos++ }
      else if (robot && char.hp < S.effectiveStats(char).maxHp * 0.34 &&
               (S.countItem(char, 'potion_hp') > 0 || S.countItem(char, 'potion_hp_ii') > 0)) {
        acc = 'objeto'; curas++
      }
      const r = S.combatAction(char, b, acc, null, obj)
      if (r.error) { if (acc === 'objeto') curas--; if (acc === 'block') bloqueos--; acc = 'attack'; continue }
      acciones++
      if (acc === 'attack') ataques++
      if (r.enemyDied) { bajas++; break }
      if (r.playerDied) { muertes++; resucitar(S, char); break }
    }
    delete S.store.battles[b.id]
    if (descansa) descansar(S, char)
  }
  delete S.store.players[u]
  // El banco de balance da 1.500 ms por turno ("más que
  // ACTION_MIN_INTERVAL_MS"); es la misma cuenta, no una nueva.
  return { llega: char.level >= 3, ataques, acciones, muertes, bajas, bloqueos, curas, segundos: acciones * 1.5 }
}

// ── En el mundo en tiempo real ─────────────────────────────────────
function aNivel3Mundo(S, robot, descansa = true) {
  const u = 'n3m_' + Math.random().toString(36).slice(2, 8)
  const char = S.newCharacter(u, 'Guerrero')
  S.store.players[u] = { username: u, character: char }
  S.hotbarDe(char)                // daga en la 0, poción en la 9
  S.seleccionarRanura(char, 0)
  const pos = { x: 300, y: 300 }  // una esquina del bosque, lejos de todo
  const entrar = () => S.mundo.set(u, { zona: 'forest', x: pos.x, y: pos.y, dir: 0, anim: 'idle', visto: S.reloj.get(), ultimoMov: S.reloj.get() })
  entrar()

  let golpes = 0, muertes = 0, bajas = 0, bloqueos = 0, curas = 0, pasos = 0
  const PASO = 100, VEL = 168     // px/s: lo que anda el cliente (2,8 px por cuadro)
  while (char.level < 3 && pasos++ < 20000) {
    const e = S.mundo.get(u)
    e.visto = S.reloj.get()
    const est = S.estadoMundoDe(u)
    for (const s of est.sucesos) {
      if (s.tipo === 'gesto' && s.de === u) golpes++
      if (s.tipo === 'recompensa') bajas++
      if (s.tipo === 'dano' && s.a === 'yo' && s.bloqueado) bloqueos++
      if (s.tipo === 'objeto') curas++
    }
    if (char.hp <= 0) {
      muertes++
      resucitar(S, char)
      // Resucitas en la entrada de la zona, no encima del bicho.
      pos.x = 300; pos.y = 300; entrar()
      if (descansa) descansar(S, char, () => S.enCombateMundo(u))
      continue
    }

    // El más cercano, que es con quien vas a pelear quieras o no.
    let obj = null, d = Infinity
    for (const m of est.monstruos) {
      const dd = Math.hypot(m.x - pos.x, m.y - pos.y)
      if (dd < d) { d = dd; obj = m }
    }
    const entrada = { ax: 1, ay: 0, pulsado: false, bloquear: false }
    const maxHp = S.effectiveStats(char).maxHp
    const pocion = S.countItem(char, 'potion_hp') + S.countItem(char, 'potion_hp_ii')

    if (!obj) {
      // Nada a la vista: descansar un poco y seguir.
      S.regenerarFuera(char, S.enCombateMundo(u))
    } else {
      const ang = Math.atan2(obj.y - pos.y, obj.x - pos.x)
      entrada.ax = Math.cos(ang); entrada.ay = Math.sin(ang)
      const avisando = est.monstruos.some(m => m.aviso && Math.hypot(m.x - pos.x, m.y - pos.y) < 90)
      if (robot && avisando) {
        entrada.bloquear = true
      } else if (robot && char.hp < maxHp * 0.34 && pocion > 0) {
        // Beber: ranura de la poción y el mismo botón.
        S.seleccionarRanura(char, 9)
        entrada.ranura = 9
        entrada.pulsado = true
      } else {
        if (char.hotbarSel !== 0) { S.seleccionarRanura(char, 0); entrada.ranura = 0 }
        entrada.pulsado = true
        if (d > 45) {                   // acercarse a tiro de daga
          pos.x += Math.cos(ang) * VEL * PASO / 1000
          pos.y += Math.sin(ang) * VEL * PASO / 1000
          e.x = pos.x; e.y = pos.y
        }
      }
    }
    // Si el servidor corrigió la posición (un retroceso), se la cree.
    if (e.corregido) { pos.x = e.x; pos.y = e.y; e.corregido = false }
    S.entradaMundo(u, entrada)
    S.reloj.avanzar(PASO)
    S.tickMundo()
    // Lo que hace el servidor en cada petición: recuperar si toca.
    if (descansa) S.regenerarFuera(char, S.enCombateMundo(u))
    // Tras cada baja, descansar como en los turnos.
    if (descansa && est.sucesos.some(s => s.tipo === 'recompensa') && !est.monstruos.some(m => Math.hypot(m.x - pos.x, m.y - pos.y) < 700)) {
      descansar(S, char, () => S.enCombateMundo(u))
    }
  }
  S.mundo.delete(u)
  delete S.store.players[u]
  return { llega: char.level >= 3, ataques: golpes, muertes, bajas, bloqueos, curas, segundos: pasos * PASO / 1000 }
}

const mediana = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0 }
function tanda(fn, robot, descansa = true) {
  const fuera = []
  for (let i = 0; i < REPETICIONES; i++) {
    const S = cargar(1000 + i * 7919)
    fuera.push(fn(S, robot, descansa))
  }
  return {
    llegan: fuera.filter(r => r.llega).length, de: fuera.length,
    ataques: mediana(fuera.map(r => r.ataques)),
    muertes: mediana(fuera.map(r => r.muertes)),
    muertesMax: Math.max(...fuera.map(r => r.muertes)),
    bajas: mediana(fuera.map(r => r.bajas)),
    bloqueos: mediana(fuera.map(r => r.bloqueos)),
    curas: mediana(fuera.map(r => r.curas)),
    segundos: mediana(fuera.map(r => r.segundos || 0)),
  }
}

const S0 = cargar(1)
// Dos maneras de jugar. DESCANSANDO entre pelea y pelea, que es lo que
// permite la recuperación del STEP 18. Y SIN PARAR, que es la medida
// del STEP 21: con descanso nadie muere y la medición 3 del encargo
// —"muertes hasta nivel 3"— no diría nada.
const res = {
  fuente: path.relative(process.cwd(), SRC) || SRC,
  turnos: {
    ingenuo: tanda(aNivel3Turnos, false), robot: tanda(aNivel3Turnos, true),
    ingenuoSinParar: tanda(aNivel3Turnos, false, false), robotSinParar: tanda(aNivel3Turnos, true, false),
  },
}
if (S0.hayMundo) res.mundo = {
  ingenuo: tanda(aNivel3Mundo, false), robot: tanda(aNivel3Mundo, true),
  ingenuoSinParar: tanda(aNivel3Mundo, false, false), robotSinParar: tanda(aNivel3Mundo, true, false),
}

if (JSON_) { console.log(JSON.stringify(res, null, 2)); process.exit(0) }

const fila = (n, r) => `  ${n.padEnd(22)} ${String(r.llegan + '/' + r.de).padStart(6)}   ${String(r.ataques).padStart(7)}   ${String(r.muertes).padStart(7)} (máx ${r.muertesMax})   ${String(r.bloqueos).padStart(8)}   ${String(r.curas).padStart(5)}`
console.log('\n══ HASTA NIVEL 3, CON UN GUERRERO RECIÉN CREADO ══')
console.log('  código: ' + res.fuente + '   ·   ' + REPETICIONES + ' partidas por fila, dado con semilla, medianas')
console.log('\n                         llegan   ataques   muertes          bloqueos   curas')
console.log('  ─ descansando entre peleas')
console.log(fila('turnos · solo pega', res.turnos.ingenuo))
console.log(fila('turnos · robot', res.turnos.robot))
if (res.mundo) {
  console.log(fila('mundo  · solo pega', res.mundo.ingenuo))
  console.log(fila('mundo  · robot', res.mundo.robot))
}
console.log('  ─ sin parar')
console.log(fila('turnos · solo pega', res.turnos.ingenuoSinParar))
console.log(fila('turnos · robot', res.turnos.robotSinParar))
if (res.mundo) {
  console.log(fila('mundo  · solo pega', res.mundo.ingenuoSinParar))
  console.log(fila('mundo  · robot', res.mundo.robotSinParar))
}
console.log()
// El tiempo de juego sin parar: la única comparación en la misma unidad.
console.log('  tiempo de juego hasta nivel 3, sin parar (medianas):')
console.log('    turnos · solo pega  ' + res.turnos.ingenuoSinParar.segundos.toFixed(0) + ' s   ·   robot ' + res.turnos.robotSinParar.segundos.toFixed(0) + ' s')
if (res.mundo) console.log('    mundo  · solo pega  ' + res.mundo.ingenuoSinParar.segundos.toFixed(0) + ' s   ·   robot ' + res.mundo.robotSinParar.segundos.toFixed(0) + ' s')
console.log()
