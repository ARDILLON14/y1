#!/usr/bin/env node
/**
 * CriptoMundo — BANCO DE BALANCE
 * ═══════════════════════════════════════════════════════════════════
 *
 *   node banco-balance.js              todas las medidas
 *   node banco-balance.js --troll      solo el troll (el fallo abierto)
 *   node banco-balance.js --armas      solo la progresión de armas
 *   node banco-balance.js --arenas     solo victorias y duración
 *   node banco-balance.js --turnos     solo el combate por turnos
 *   node banco-balance.js --json       saca los números en crudo
 *
 * POR QUÉ EXISTE
 * Ajustar balance a ojo es la forma más rápida de romper un juego que
 * funcionaba. "El troll se aturde demasiado" no es un dato: es una
 * impresión. El dato es "el troll llega a embestir 4 veces de cada 100
 * intentos con la Espada de Diamante y 71 de cada 100 con los puños".
 * Con eso se puede decidir; con la impresión, solo se puede adivinar.
 *
 * CÓMO FUNCIONA
 * No reimplementa nada. Carga los MÓDULOS REALES del servidor en una
 * máquina virtual y les cambia una sola cosa: el reloj. `now()` deja de
 * ser Date.now() y pasa a ser un contador que avanza cuando yo se lo
 * digo. Con eso, un combate de 40 segundos se juega en 3 milisegundos y
 * 600 combates caben en un café.
 *
 * Es el mismo tick(), la misma IA, el mismo herir(), el mismo daño. Si
 * el banco dice que el troll no embiste, es que no embiste de verdad.
 *
 * EL ROBOT NO HACE TRAMPA
 * Decide mirando EXACTAMENTE lo que ve un cliente —la salida de
 * resumen()— y actúa mandando EXACTAMENTE lo que puede mandar un
 * cliente —mx, my, apuntar, atacar, esquivar— por la misma puerta,
 * entradaArena(). No toca posiciones, no lee vida que no se publique y
 * no puede escribir daño. Si pudiera, las medidas no valdrían nada.
 *
 * Las mediciones sí miran dentro: para contar cuántas veces un troll
 * llega a CHARGE hay que mirar su máquina de estados. Pero eso es el
 * termómetro, no el jugador.
 *
 * LO QUE ESTO NO MIDE
 * Si es divertido. Un troll que embiste el 40% de las veces puede ser
 * un fastidio y uno que embiste el 12% puede estar perfecto. El banco
 * dice qué pasa; si eso está bien o mal lo dice quien juega.
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

// ── El servidor real, con un reloj que yo controlo ─────────────────
//
// Se cargan todos los módulos menos 60-http.js, que abre un puerto y no
// hace falta para medir. El orden es el mismo que usa build.js, porque
// aquí también importa: las constantes de un módulo las usa el
// siguiente.
function cargarServidor(semilla) {
  const dir = path.join(__dirname, 'src', 'server')
  const modulos = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && f !== '00-header.js' && f !== '60-http.js')
    .sort()
  let fuente = fs.readFileSync(path.join(dir, '00-header.js'), 'utf8') + '\n'
  for (const m of modulos) fuente += fs.readFileSync(path.join(dir, m), 'utf8') + '\n'

  // El único cambio al código del juego: el reloj. Si esta sustitución
  // dejara de encajar, el banco se para en vez de medir con Date.now()
  // y dar números que no significan nada.
  const RELOJ_VIEJO = 'function now() { return Date.now() }'
  if (!fuente.includes(RELOJ_VIEJO)) {
    console.error('❌ No encuentro now() en 10-infra.js. El banco mide con reloj propio;')
    console.error('   sin poder sustituirlo, las medidas no valdrían. Revisa la firma.')
    process.exit(1)
  }
  fuente = fuente.replace(RELOJ_VIEJO, 'function now() { return globalThis.__t }')

  const caja = {
    require, console, process, Buffer, URL, TextEncoder, TextDecoder,
    __dirname, __filename,
    __t: 1_000_000,
    // Los temporizadores del juego (el bucle de la arena, las copias de
    // seguridad) no deben dispararse: aquí el tiempo lo muevo yo.
    setInterval: () => ({ unref() {} }),
    setTimeout: () => ({ unref() {} }),
    clearInterval: () => {}, clearTimeout: () => {},
  }
  caja.globalThis = caja
  vm.createContext(caja)
  vm.runInContext(fuente, caja, { filename: 'criptomundo-banco.js' })

  // Dado con semilla: dos ejecuciones del banco dan el mismo número.
  // Sin esto, "ha subido un 3%" podría ser el ruido de la tirada.
  const dado = vm.runInContext('makeRng(' + semilla + ')', caja)
  vm.runInContext('Math.random = globalThis.__dado', Object.assign(caja, { __dado: dado }))
  // Nada de escribir en disco: esto es un banco de pruebas.
  vm.runInContext('persist = function () {}; audit = function () {}', caja)

  // Las constantes (`const ARENAS = …`) no son propiedades del global,
  // pero sí están en el ámbito léxico del contexto: se piden así.
  const api = vm.runInContext(`({
    store, ARENAS, ARMAS, MONSTERS, CLASSES, SKILLS, CARACTER, CONDUCTAS, EST,
    ITEM_TEMPLATES, ARENA_TICK_MS, ESCALA_ARENA, ESCALA_TURNOS,
    newCharacter, makeItem, addItem, effectiveStats, armaDe, armaVista, checkLevelUp,
    referenciaDeNivel, seguimientoDe,
    iniciarArena, entradaArena, tick, resumen, partidas, abandonarArena,
    startBattle, combatAction, herir, caracterDe,
  })`, caja)
  api.reloj = {
    get: () => caja.__t,
    set: v => { caja.__t = v },
    avanzar: ms => { caja.__t += ms },
  }
  api.caja = caja
  return api
}

// ── Un jugador de mentira, con ficha de verdad ─────────────────────
function crearJugador(S, { nivel = 10, clase = 'Guerrero', arma = null } = {}) {
  const usuario = 'banco_' + Math.random().toString(36).slice(2, 9)
  const char = S.newCharacter(usuario, clase)
  // Subir de nivel a mano sería transcribir la progresión, y una
  // transcripción se desincroniza. Se le da experiencia y sube con la
  // MISMA función que usa el juego: si mañana cambian las subidas, el
  // banco mide las nuevas sin tocar una línea.
  let vueltas = 0
  while (char.level < nivel && vueltas++ < 500) {
    char.xp += char.xpToNext
    S.checkLevelUp(char)
  }
  char.hp = char.maxHp; char.mp = char.maxMp
  // 'puños' no es un objeto: es no llevar nada. Pedirle una ficha al
  // catálogo devuelve null, y eso es correcto, no un fallo.
  const it = arma ? S.makeItem(arma) : null
  if (it) {
    char.inventory.push(it)
    char.equipment.weapon = it.uid
  }
  const player = { username: usuario, character: char, createdAt: '' }
  S.store.players[usuario] = player
  return player
}

// ═══════════════════════════════════════════════════════════════════
//  EL ROBOT
//
//  Juega igual con todas las armas. Si cambiara de táctica según el
//  arma, la comparación entre armas mediría al robot, no a las armas.
//
//  Solo ve `resumen(p)` —lo que se manda al navegador— y solo manda
//  intenciones. Es deliberadamente de andar por casa: se acerca al más
//  cercano, pega sin parar, y se aparta cuando le avisan. Un jugador
//  bueno lo hará mejor; lo que importa es que lo haga IGUAL con todas.
// ═══════════════════════════════════════════════════════════════════
// Un robot TORPE, para poner cota por abajo.
//
// El de arriba ataca en cuanto alcanza, esquiva todo aviso y nunca se
// equivoca de objetivo: juega mejor que una persona. Si la arena le
// resulta fácil, puede ser culpa suya. Este otro tarda en reaccionar,
// no esquiva, y a veces se queda quieto: juega peor que una persona.
//
// Entre los dos queda encerrado el jugador de verdad. Si los DOS ganan
// el 100% sin despeinarse, ya no es el robot: es la arena.
function decidirTorpe(vista, arma, memoria) {
  memoria.espera = (memoria.espera || 0) - 1
  if (memoria.espera > 0) return memoria.ultima || { mx: 0, my: 0, atacar: false, esquivar: false, apuntar: vista.jugador.mirando }
  // Reacciona cada ~400 ms en vez de cada 100: el retardo de alguien
  // que está mirando la pantalla, no leyéndola.
  memoria.espera = 4
  const d = decidir(vista, arma)
  d.esquivar = false          // no esquiva: no ve venir el aviso
  if (Math.random() < 0.15) { d.mx = 0; d.my = 0 }   // se queda pensando
  memoria.ultima = d
  return d
}

function decidir(vista, arma) {
  const j = vista.jugador
  const vivos = vista.enemigos
  if (!vivos.length) return { mx: 0, my: 0, atacar: false, esquivar: false, apuntar: j.mirando }

  let obj = vivos[0], mejor = Infinity
  for (const e of vivos) {
    const d = Math.hypot(e.x - j.x, e.y - j.y)
    if (d < mejor) { mejor = d; obj = e }
  }
  const ang = Math.atan2(obj.y - j.y, obj.x - j.x)

  // A cuánto quiere estar: pegado si es cuerpo a cuerpo, a media
  // distancia si dispara. Se deja margen para no entrar y salir del
  // alcance en cada tick.
  const aDistancia = arma.tipo === 'ranged'
  const ideal = aDistancia ? arma.alcance * 0.55 : Math.max(26, arma.alcance - obj.radio - 6)
  const holgura = aDistancia ? 60 : 10

  let mx = 0, my = 0
  if (mejor > ideal + holgura) { mx = Math.cos(ang); my = Math.sin(ang) }
  else if (mejor < ideal - holgura) { mx = -Math.cos(ang); my = -Math.sin(ang) }

  // Apartarse de un aviso o de una embestida. Es la reacción que el
  // juego pide al jugador; sin ella, el robot mide un saco de arena.
  let esquivar = false
  for (const e of vivos) {
    const d = Math.hypot(e.x - j.x, e.y - j.y)
    if ((e.fsm === 'charge' && d < 190) || (e.estado === 'avisando' && d < 150)) {
      esquivar = true
      // Apartarse de lado, no hacia atrás: hacia atrás te sigue.
      mx = Math.cos(ang + Math.PI / 2); my = Math.sin(ang + Math.PI / 2)
    }
  }
  for (const pr of vista.proyectiles || []) {
    if (pr.mio) continue
    if (Math.hypot(pr.x - j.x, pr.y - j.y) < 70) {
      esquivar = true
      mx = Math.cos(ang + Math.PI / 2); my = Math.sin(ang + Math.PI / 2)
    }
  }

  // Pega solo cuando alcanza DE VERDAD: el mismo umbral que usa
  // golpear() en el servidor, sin margen.
  //
  // Tenía 6 px de más "por si acaso" y eso falseaba la medida. Un arma
  // lenta paga carísimo cada golpe al aire: con 6 px de margen, la
  // Espada de Piedra acertaba el 83% de las veces y la daga el 97%, y
  // yo estuve a punto de subirle el alcance al arma para arreglar un
  // fallo que era mío. El robot tiene que fallar por jugar mal, no por
  // apuntar distinto a como cuenta el servidor.
  const atacar = mejor <= arma.alcance + obj.radio
  return { mx, my, atacar, esquivar, apuntar: ang }
}

// ── Una partida completa, medida ───────────────────────────────────
//
// Devuelve el resultado y el termómetro: qué hizo cada enemigo, cuánto
// tiempo pasó en cada estado y cuántas veces llegó a hacer lo suyo.
function jugarArena(S, { arenaId, nivel, arma, clase = 'Guerrero', topeSegundos = 300, torpe = false }) {
  const player = crearJugador(S, { nivel, clase, arma })
  const r = S.iniciarArena(player, arenaId)
  if (r.error) return { error: r.error }
  const p = S.partidas.get(player.username)
  const armaVis = S.armaDe(player.character)
  const TICK = S.ARENA_TICK_MS

  // El termómetro. `intentos` cuenta cuántas veces un embestidor empezó
  // el aviso previo; `logrados`, cuántas de esas llegó a embestir de
  // verdad. La diferencia entre los dos números ES el fallo abierto.
  const med = {
    ticks: 0, dañoHecho: 0, dañoRecibido: 0, golpes: 0, aciertos: 0,
    porTipo: {},
  }
  const deTipo = id => med.porTipo[id] || (med.porTipo[id] = {
    vistos: 0, muertos: 0, avisos: 0, embestidas: 0, aturdimientos: 0,
    msAturdido: 0, msVivo: 0, trabas: 0,
    // La pregunta del fallo abierto: un aviso empezado, ¿en qué acaba?
    // Si acaba en CHARGE, el enemigo hizo lo suyo. Si acaba en otra
    // cosa, alguien se lo cortó, y aquí se apunta QUIÉN.
    avisosRotos: 0, rotoPor: {},
    // Cuánto tiempo pasa lo bastante lejos como para poder plantearse
    // una embestida. Si es cero, el problema no es el aturdimiento:
    // es que el jugador nunca se separa y la conducta no llega a darse.
    msLejos: 0,
  })
  const previo = new Map()

  let fin = null
  const memoria = {}
  const maxTicks = Math.ceil((topeSegundos * 1000) / TICK)
  while (!fin && med.ticks < maxTicks) {
    const vista = S.resumen(p)
    S.entradaArena(player.username,
      torpe ? decidirTorpe(vista, armaVis, memoria) : decidir(vista, armaVis))

    const hpEnemigosAntes = p.enemigos.reduce((a, e) => a + e.hp, 0)
    const hpJugadorAntes = p.jugador.hp

    S.reloj.avanzar(TICK)
    try { fin = S.tick(p) } catch (e) { return { error: 'tick: ' + e.message } }
    med.ticks++

    // Transiciones de la máquina de estados. Se leen de dentro a
    // propósito: es el termómetro, no el jugador.
    for (const en of p.enemigos) {
      const t = deTipo(en.monsterId)
      const antes = previo.get(en.id)
      if (antes === undefined) t.vistos++
      t.msVivo += TICK
      if (en.fsm === S.EST.STUN) t.msAturdido += TICK
      // "Lejos" para un embestidor es lo que el propio motor pide para
      // plantearse una carga: más de 2,2 cuerpos y menos de 460 px.
      const d = Math.hypot(en.x - p.jugador.x, en.y - p.jugador.y)
      const cuerpos = en.cfg.radio + p.jugador.radio
      if (d > cuerpos * 2.2 && d < 460) t.msLejos += TICK
      if (antes !== en.fsm) {
        if (en.fsm === S.EST.TELEGRAPH) t.avisos++
        if (en.fsm === S.EST.CHARGE) t.embestidas++
        if (en.fsm === S.EST.STUN) t.aturdimientos++
        if (en.fsm === S.EST.HURT) t.trabas++
        // Un aviso que no acaba en embestida es un aviso roto. Importa
        // por qué: si lo rompe HURT, lo corta cualquier golpe flojo; si
        // lo rompe STUN, lo corta un golpe gordo. Son dos arreglos
        // distintos y sin este dato se elige a ciegas.
        if (antes === S.EST.TELEGRAPH && en.fsm !== S.EST.CHARGE) {
          t.avisosRotos++
          t.rotoPor[en.fsm] = (t.rotoPor[en.fsm] || 0) + 1
        }
      }
      previo.set(en.id, en.fsm)
    }

    for (const s of p.sucesos || []) {
      if (s.t === 'golpe') { med.golpes++; if (s.acierto) med.aciertos++ }
      if (s.t === 'daño' && s.a === 'enemigo') med.dañoHecho += s.dmg
      if (s.t === 'daño' && s.a === 'jugador') med.dañoRecibido += s.dmg
      if (s.t === 'muerte') {
        const en = [...previo.keys()]
        const caido = p.restos.find(x => x.id === s.id)
        void en; void caido
      }
    }
    // Las bajas por tipo se cuentan comparando quién ya no está.
    void hpEnemigosAntes; void hpJugadorAntes
  }

  // Bajas por tipo: lo que entró menos lo que quedó vivo al acabar.
  for (const [, t] of Object.entries(med.porTipo)) t.muertos = t.vistos
  for (const en of p.enemigos || []) {
    const t = med.porTipo[en.monsterId]
    if (t) t.muertos--
  }

  S.abandonarArena(player.username)
  delete S.store.players[player.username]

  return {
    motivo: fin ? fin.motivo : 'tope',
    segundos: (med.ticks * TICK) / 1000,
    oleada: p.oleada, oleadas: p.arena.oleadas.length,
    vidaFinal: Math.max(0, Math.round(p.jugador.hp)),
    vidaMax: p.jugador.hpMax,
    ...med,
  }
}

// ── Estadística mínima ─────────────────────────────────────────────
const media = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const mediana = a => {
  if (!a.length) return 0
  const s = a.slice().sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const pct = (n, d) => (d ? (100 * n) / d : 0)
const f1 = n => (Math.round(n * 10) / 10).toFixed(1)

function barra(v, max, ancho = 22) {
  const n = Math.max(0, Math.min(ancho, Math.round((v / (max || 1)) * ancho)))
  return '█'.repeat(n) + '·'.repeat(ancho - n)
}

// ═══════════════════════════════════════════════════════════════════
//  MEDIDA 1 — EL TROLL: ¿llega a embestir?
//
//  El fallo documentado en el paso 9: con la Espada de Diamante el
//  troll encadena aturdimientos y no carga nunca. Aquí se cuenta.
//
//  Se le pone un troll solo delante de cada arma y se mira cuántas
//  veces empieza el aviso y cuántas llega a la embestida.
// ═══════════════════════════════════════════════════════════════════
function medirEmbestidores(S, { repeticiones = 20 } = {}) {
  // Las armas que un jugador puede tener en la mano cuando se cruza con
  // un troll, de la peor a la mejor. La comparación entre la primera y
  // la última es la que responde al fallo abierto.
  const armas = ['puños', 'espada_piedra', 'espada_hierro', 'iron_axe',
                 'frost_blade', 'espada_diamante', 'short_bow', 'thunder_staff']
  // El troll es de nivel 5 y está en la tercera oleada de la primera
  // arena, que se abre a nivel 1. Un jugador lo ve por primera vez
  // sobre el nivel 5 y lo sigue viendo mucho después.
  const niveles = [5, 10, 16]
  const filas = []
  for (const nivel of niveles) {
    for (const arma of armas) {
      const acc = { avisos: 0, embestidas: 0, rotos: 0, rotoPor: {}, aturdimientos: 0,
                    msAturdido: 0, msVivo: 0, msLejos: 0, seg: [], gana: 0 }
      for (let i = 0; i < repeticiones; i++) {
        const r = jugarArena(S, { arenaId: '__troll', nivel, arma })
        if (r.error) { console.error('  ⚠️ ' + r.error); continue }
        const t = r.porTipo.m_troll || {}
        acc.avisos += t.avisos || 0
        acc.embestidas += t.embestidas || 0
        acc.rotos += t.avisosRotos || 0
        for (const [k, v] of Object.entries(t.rotoPor || {})) acc.rotoPor[k] = (acc.rotoPor[k] || 0) + v
        acc.aturdimientos += t.aturdimientos || 0
        acc.msAturdido += t.msAturdido || 0
        acc.msVivo += t.msVivo || 0
        acc.msLejos += t.msLejos || 0
        acc.seg.push(r.segundos)
        if (r.motivo === 'victoria') acc.gana++
      }
      filas.push({
        nivel, arma, nombre: S.ARMAS[arma].nombre, dmg: S.ARMAS[arma].dmg,
        avisos: acc.avisos, embestidas: acc.embestidas, rotos: acc.rotos,
        rotoPor: acc.rotoPor,
        llega: pct(acc.embestidas, acc.avisos),
        aturdido: pct(acc.msAturdido, acc.msVivo),
        lejos: pct(acc.msLejos, acc.msVivo),
        avisosPorPelea: acc.avisos / Math.max(1, repeticiones),
        segundos: mediana(acc.seg),
        victorias: pct(acc.gana, repeticiones),
      })
    }
  }
  return filas
}

// ═══════════════════════════════════════════════════════════════════
//  MEDIDA 2 — PROGRESIÓN DE ARMAS
//
//  La pregunta: ¿una espada mejor mata antes? Si la de diamante no bate
//  a la de hierro, la progresión es decorativa y el jugador que ahorró
//  para comprarla hizo el tonto.
// ═══════════════════════════════════════════════════════════════════
function medirArmas(S, { repeticiones = 10, nivel = 14 } = {}) {
  const armas = Object.keys(S.ARMAS)
  const filas = []
  for (const arma of armas) {
    const seg = [], dps = [], vida = [], gana = []
    for (let i = 0; i < repeticiones; i++) {
      const r = jugarArena(S, { arenaId: '__saco', nivel, arma })
      if (r.error) continue
      seg.push(r.segundos)
      dps.push(r.dañoHecho / Math.max(0.1, r.segundos))
      vida.push(pct(r.vidaFinal, r.vidaMax))
      gana.push(r.motivo === 'victoria' ? 1 : 0)
    }
    const a = S.ARMAS[arma]
    filas.push({
      arma, nombre: a.nombre, dmg: a.dmg, alcance: a.alcance, cadencia: a.cadenciaMs,
      tipo: a.proyectil ? 'lejos' : 'cerca',
      segundos: mediana(seg), dps: media(dps),
      vidaRestante: media(vida), victorias: pct(media(gana) * repeticiones, repeticiones),
    })
  }
  return filas.sort((x, y) => x.dps - y.dps)
}

// ═══════════════════════════════════════════════════════════════════
//  MEDIDA 3 — LAS ARENAS DE VERDAD
//
//  Con el arma que un jugador tendría a ese nivel, no con la mejor del
//  juego. Una arena que solo se gana con el equipo de arriba de la
//  tabla está rota para quien acaba de llegar.
// ═══════════════════════════════════════════════════════════════════
function medirArenas(S, { repeticiones = 20 } = {}) {
  const casos = [
    { arenaId: 'arena_bosque', nivel: 1,  arma: 'dagger' },
    { arenaId: 'arena_bosque', nivel: 3,  arma: 'espada_piedra' },
    { arenaId: 'arena_bosque', nivel: 6,  arma: 'espada_hierro' },
    { arenaId: 'arena_minas',  nivel: 7,  arma: 'espada_hierro' },
    { arenaId: 'arena_minas',  nivel: 11, arma: 'iron_axe' },
    { arenaId: 'arena_ruinas', nivel: 13, arma: 'frost_blade' },
    { arenaId: 'arena_ruinas', nivel: 18, arma: 'espada_diamante' },
  ]
  const filas = []
  for (const c of casos) {
    for (const torpe of [false, true]) {
      const seg = [], vida = [], recibido = []
      let gana = 0, pierde = 0, tiempo = 0
      const oleada = []
      for (let i = 0; i < repeticiones; i++) {
        const r = jugarArena(S, { ...c, torpe })
        if (r.error) continue
        if (r.motivo === 'victoria') { gana++; seg.push(r.segundos); vida.push(pct(r.vidaFinal, r.vidaMax)) }
        else if (r.motivo === 'derrota') pierde++
        else tiempo++
        recibido.push(pct(r.dañoRecibido, r.vidaMax))
        oleada.push(r.oleada)
      }
      filas.push({
        ...c, torpe, nombre: S.ARENAS[c.arenaId].nombre,
        victorias: pct(gana, repeticiones), derrotas: pct(pierde, repeticiones),
        porTiempo: pct(tiempo, repeticiones),
        segundos: mediana(seg), vidaRestante: media(vida),
        dañoRecibido: media(recibido),
        oleadaMedia: media(oleada), oleadas: S.ARENAS[c.arenaId].oleadas.length,
      })
    }
  }
  return filas
}

// ═══════════════════════════════════════════════════════════════════
//  MEDIDA 4 — COMBATE POR TURNOS
//
//  Aquí la pregunta es el ritmo: cuántos turnos dura una pelea. Tres
//  turnos es un trámite; veinticinco es una tarea.
// ═══════════════════════════════════════════════════════════════════
// Una pelea por turnos entera, jugada como la juega alguien que ha
// entendido el juego: bloquea cuando le avisan de un golpe fuerte
// —que es exactamente lo que el aviso le dice que haga—, se cura por
// debajo de un tercio de vida y por lo demás pega.
//
// Importa que bloquee: el enemigo anuncia un golpe cada 3 turnos y los
// jefes cambian de fase al 50%. Un robot que solo pegara mediría un
// juego sin esas dos mecánicas, y son la mitad de lo que hay.
function jugarTurnos(S, { monsterId, nivel, arma = 'espada_hierro', clase = 'Guerrero', pociones = 5 }) {
  const player = crearJugador(S, { nivel, clase, arma })
  const char = player.character
  S.addItem(char, 'potion_hp_ii', pociones)
  const battle = S.startBattle(char, monsterId)
  if (!battle) { delete S.store.players[player.username]; return { error: 'sin batalla' } }

  let turnos = 0, fin = null, bloqueos = 0, curas = 0, fases = 1, avisos = 0
  while (turnos < 80) {
    turnos++
    S.reloj.avanzar(1500)   // más que ACTION_MIN_INTERVAL_MS
    let accion = 'attack', objeto = null
    if (battle.telegraph) { accion = 'block'; bloqueos++ }
    else if (char.hp < char.maxHp * 0.34) { accion = 'objeto'; objeto = 'potion_hp_ii'; curas++ }
    const r = S.combatAction(char, battle, accion, null, objeto)
    if (r.error) {
      // Sin pociones: se sigue peleando, que es lo que haría cualquiera.
      if (accion === 'objeto') { curas--; continue }
      break
    }
    if (battle.phase > fases) fases = battle.phase
    if (r.telegraph) avisos++
    if (r.enemyDied || r.playerDied) { fin = r; break }
  }
  const res = {
    turnos, bloqueos, curas, avisos, fase2: fases > 1,
    gana: !!(fin && fin.enemyDied), pierde: !!(fin && fin.playerDied),
    vidaFinal: pct(char.hp, char.maxHp),
  }
  delete S.store.players[player.username]
  delete S.store.battles[battle.id]
  return res
}

function medirTurnos(S, { repeticiones = 25 } = {}) {
  const filas = []
  for (const monsterId of Object.keys(S.MONSTERS)) {
    const m = S.MONSTERS[monsterId]
    // Se pelea al nivel del bicho, no dos por encima: es cuando te lo
    // encuentras. Y con el arma que tocaría a ese nivel.
    const nivel = Math.max(1, m.level)
    const arma = nivel >= 10 ? 'espada_diamante' : nivel >= 4 ? 'espada_hierro' : 'espada_piedra'
    const t = [], v = []
    let gana = 0, pierde = 0, conFase2 = 0, bloq = 0
    for (let i = 0; i < repeticiones; i++) {
      const r = jugarTurnos(S, { monsterId, nivel, arma })
      if (r.error) continue
      t.push(r.turnos); v.push(r.vidaFinal)
      if (r.gana) gana++
      if (r.pierde) pierde++
      if (r.fase2) conFase2++
      bloq += r.bloqueos
    }
    filas.push({
      monsterId, nombre: m.name, nivel: m.level, jefe: !!m.isBoss, arma,
      turnos: mediana(t), victorias: pct(gana, repeticiones), derrotas: pct(pierde, repeticiones),
      vidaFinal: media(v), bloqueos: bloq / Math.max(1, repeticiones),
      fase2: pct(conFase2, repeticiones),
    })
  }
  return filas.sort((a, b) => a.nivel - b.nivel)
}

// ═══════════════════════════════════════════════════════════════════
//  MEDIDA 5 — BARRIDO DE ESCALAS
//
//  La parte que evita adivinar. En vez de elegir dos números y ver qué
//  tal, se recorre una rejilla entera de valores, se juegan cientos de
//  partidas en cada casilla y se mira cuál cumple los objetivos.
//
//  LOS OBJETIVOS, dichos en voz alta para que se puedan discutir:
//
//    · un jugador competente gana casi siempre —entre el 80% y el 95%—
//      pero termina TOCADO: entre el 35% y el 65% de vida. Ganar sin
//      perder vida no es ganar, es esperar.
//    · un jugador descuidado pierde a menudo: gana entre el 30% y el
//      70%. Si el descuidado también gana siempre, no hay nada que
//      aprender; si no gana nunca, no hay quien entre.
//    · una arena de tres oleadas dura entre 40 y 90 segundos. Diez es
//      un trámite; tres minutos es una tarea.
//
//  Estos rangos son un juicio, no una medida: los pongo yo. Lo que NO
//  es un juicio es qué escalas los cumplen. Cámbialos y el banco vuelve
//  a buscar.
// ═══════════════════════════════════════════════════════════════════
const OBJETIVO = {
  victoriasBueno: [80, 95],
  vidaBueno: [35, 65],
  victoriasTorpe: [30, 70],
  duracion: [40, 90],
}

// Cuánto se sale un valor de su rango, en tantos por ciento del rango.
// Cero significa dentro. Se suman los cuadrados para que quedarse muy
// lejos en una cosa pese más que quedarse un poco fuera en tres.
function fuera(v, [min, max]) {
  if (v >= min && v <= max) return 0
  const d = v < min ? min - v : v - max
  return (d / Math.max(1, max - min)) ** 2
}

function medirCaso(S, caso, repeticiones) {
  const b = { gana: 0, total: 0, vida: [], seg: [] }
  const t = { gana: 0, total: 0 }
  for (let i = 0; i < repeticiones; i++) {
    const rb = jugarArena(S, { ...caso, torpe: false })
    if (!rb.error) {
      b.total++
      if (rb.motivo === 'victoria') { b.gana++; b.vida.push(pct(rb.vidaFinal, rb.vidaMax)) }
      b.seg.push(rb.segundos)
    }
    const rt = jugarArena(S, { ...caso, torpe: true })
    if (!rt.error) { t.total++; if (rt.motivo === 'victoria') t.gana++ }
  }
  const vb = pct(b.gana, b.total)
  return {
    victoriasBueno: vb, victoriasTorpe: pct(t.gana, t.total),
    // Si nunca gana no hay "vida al terminar" que medir: se cuenta como
    // cero, que es exactamente lo que le queda.
    vidaRestante: b.vida.length ? media(b.vida) : 0,
    duracion: mediana(b.seg),
  }
}

// Cuánto se aleja UN caso de los objetivos. Se puntúa caso por caso y
// luego se suman: promediar los cuatro primero escondía justo lo que
// hay que ver. Con la rejilla de arriba, el jugador de nivel 3 moría el
// 100% de las veces y el conjunto seguía marcando "75% de victorias",
// porque los otros tres casos lo tapaban. Un ajuste que mata a los
// principiantes y mima a los veteranos no puede salir "bien" en una
// media.
function puntuar(m) {
  return fuera(m.victoriasBueno, OBJETIVO.victoriasBueno) +
         fuera(m.vidaRestante, OBJETIVO.vidaBueno) +
         fuera(m.victoriasTorpe, OBJETIVO.victoriasTorpe) +
         fuera(m.duracion, OBJETIVO.duracion)
}

const CASOS_BARRIDO = [
  { arenaId: 'arena_bosque', nivel: 3,  arma: 'dagger', etiqueta: 'bosque nv3 (daga de fábrica)' },
  { arenaId: 'arena_bosque', nivel: 6,  arma: 'espada_hierro', etiqueta: 'bosque nv6' },
  { arenaId: 'arena_minas',  nivel: 7,  arma: 'espada_hierro', etiqueta: 'minas nv7' },
  { arenaId: 'arena_minas',  nivel: 11, arma: 'iron_axe',      etiqueta: 'minas nv11' },
  { arenaId: 'arena_ruinas', nivel: 13, arma: 'frost_blade',   etiqueta: 'ruinas nv13' },
  { arenaId: 'arena_ruinas', nivel: 18, arma: 'espada_diamante', etiqueta: 'ruinas nv18 (veterano)' },
]

function barrerEscalas(S, { repeticiones = 8, vidas, daños, niveles } = {}) {
  vidas = vidas || [0.9, 1.2, 1.5, 1.8]
  daños = daños || [0.5, 0.75, 1.0, 1.25, 1.5]
  // El tercer mando: cuánto sube el bicho por cada nivel de ventaja.
  // Sin él, el barrido solo podía elegir entre matar al principiante o
  // aburrir al veterano, porque los dos comparten los otros dos.
  niveles = niveles || [0, 0.5, 0.75, 1]
  const original = { ...S.ESCALA_ARENA }
  const rejilla = []
  for (const vida of vidas) {
    for (const daño of daños) {
    for (const porNivel of niveles) {
      S.ESCALA_ARENA.vida = vida
      S.ESCALA_ARENA.daño = daño
      S.ESCALA_ARENA.seguimiento = porNivel
      const porCaso = CASOS_BARRIDO.map(c => ({ ...c, ...medirCaso(S, c, repeticiones) }))
      for (const p of porCaso) p.error = puntuar(p)
      rejilla.push({
        vida, daño, porNivel, porCaso,
        error: porCaso.reduce((a, p) => a + p.error, 0) / porCaso.length,
        // El caso que peor sale. Un ajuste con media buena y un caso
        // horrible es un ajuste malo: alguien vive en ese caso.
        peor: porCaso.reduce((a, p) => (p.error > a.error ? p : a), porCaso[0]),
      })
    }
    }
  }
  Object.assign(S.ESCALA_ARENA, original)
  return rejilla.sort((a, b) => a.error - b.error)
}

// ── Arenas de laboratorio ──────────────────────────────────────────
//
// Dos bancos de pruebas que no existen en el juego: uno con un troll
// solo (para verle la máquina de estados sin ruido) y otro con un saco
// de golpes (para medir armas sin que la suerte de la IA decida).
// Se añaden al catálogo en memoria, no al código del juego.
function añadirArenasDeLaboratorio(S) {
  S.ARENAS.__troll = {
    id: '__troll', nombre: 'Banco: un troll', minLevel: 1, zona: 'forest',
    oleadas: [['m_troll']], oro: [0, 0], cgrid: 0,
  }
  S.ARENAS.__saco = {
    id: '__saco', nombre: 'Banco: saco de golpes', minLevel: 1, zona: 'forest',
    oleadas: [['m_skeleton', 'm_skeleton', 'm_troll']], oro: [0, 0], cgrid: 0,
  }
}

// ── Informe ────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2)
  const soloJson = args.includes('--json')
  const todo = !args.some(a => ['--troll', '--armas', '--arenas', '--turnos', '--barrido'].includes(a))
  const quiere = k => todo || args.includes('--' + k)

  const t0 = Date.now()
  const S = cargarServidor(20260916)
  añadirArenasDeLaboratorio(S)
  const salida = {}

  if (!soloJson) {
    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║  BANCO DE BALANCE — CriptoMundo                              ║')
    console.log('║  Servidor real · reloj virtual · dado con semilla            ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
  }

  if (quiere('troll')) {
    salida.embestidores = medirEmbestidores(S)
    if (!soloJson) {
      console.log('\n━━ 1. LOS EMBESTIDORES: ¿LLEGAN A EMBESTIR? ━━━━━━━━━━━━━━━━━')
      console.log('   Un troll solo contra cada arma, 20 peleas por casilla.')
      console.log('   "avisos" = veces que empieza a prepararse.  "llega" = de esas,')
      console.log('   cuántas acaban en embestida.  "roto" dice quién se lo cortó.\n')
      let nivelActual = null
      for (const f of salida.embestidores) {
        if (f.nivel !== nivelActual) {
          nivelActual = f.nivel
          console.log('   ┌─ jugador de nivel ' + f.nivel + ' ' + '─'.repeat(52))
          console.log('   │ arma                dmg  avisos/pelea  llega   roto por      aturdido  dura')
        }
        const roto = Object.entries(f.rotoPor).sort((a, b) => b[1] - a[1])
          .map(([k, v]) => k + '×' + v).slice(0, 2).join(' ') || '—'
        console.log('   │ ' + f.nombre.padEnd(19) + String(f.dmg).padStart(4) + '  ' +
          f1(f.avisosPorPelea).padStart(11) + '  ' + (f1(f.llega) + '%').padStart(6) + '  ' +
          roto.padEnd(13) + ' ' + (f1(f.aturdido) + '%').padStart(7) + '  ' +
          (f1(f.segundos) + 's').padStart(6))
      }
      console.log('   └' + '─'.repeat(74))
    }
  }

  if (quiere('armas')) {
    salida.armas = medirArmas(S)
    if (!soloJson) {
      console.log('\n━━ 2. PROGRESIÓN DE ARMAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   Mismo banco de enemigos, mismo robot, mismo nivel.')
      console.log('   Ordenadas por daño por segundo REAL, no por el número del catálogo.\n')
      console.log('   arma                  dmg  cad   tipo    dps    limpia en   vida')
      console.log('   ───────────────────────────────────────────────────────────────────')
      const maxDps = Math.max(...salida.armas.map(a => a.dps))
      for (const f of salida.armas) {
        console.log('   ' + f.nombre.padEnd(21) + ' ' +
          String(f.dmg).padStart(4) + ' ' + String(f.cadencia).padStart(4) + '  ' +
          f.tipo.padEnd(6) + ' ' + f1(f.dps).padStart(6) + '   ' +
          (f1(f.segundos) + 's').padStart(8) + '  ' + (f1(f.vidaRestante) + '%').padStart(6) +
          '  ' + barra(f.dps, maxDps, 12))
      }
    }
  }

  if (quiere('arenas')) {
    salida.arenas = medirArenas(S)
    if (!soloJson) {
      console.log('\n━━ 3. LAS ARENAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   Con el arma que tendría un jugador a ese nivel, 20 partidas por')
      console.log('   casilla. Dos robots: uno que juega bien y uno que juega mal.')
      console.log('   "daño" = cuánta vida le quitan en toda la partida, en % de la suya.\n')
      console.log('   arena                 nv  robot   gana   pierde   dura     daño   vida final')
      console.log('   ────────────────────────────────────────────────────────────────────────────')
      for (const f of salida.arenas) {
        console.log('   ' + (f.torpe ? ' '.repeat(21) + '  ' : f.nombre.padEnd(21) + ' ' + String(f.nivel).padStart(2)) + '  ' +
          (f.torpe ? 'torpe ' : 'bueno ').padEnd(6) + ' ' +
          (f1(f.victorias) + '%').padStart(6) + '  ' + (f1(f.derrotas) + '%').padStart(6) + '  ' +
          (f1(f.segundos) + 's').padStart(7) + ' ' + (f1(f.dañoRecibido) + '%').padStart(7) + '  ' +
          (f1(f.vidaRestante) + '%').padStart(7) +
          '  ' + barra(f.dañoRecibido, 100, 10))
      }
    }
  }

  if (quiere('turnos')) {
    salida.turnos = medirTurnos(S)
    if (!soloJson) {
      console.log('\n━━ 4. COMBATE POR TURNOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   Al nivel del bicho, con el arma que tocaría, bloqueando los')
      console.log('   golpes anunciados y curándose por debajo de un tercio de vida.')
      console.log('   "fase 2" = cuántas veces se llegó a ver el cambio de fase del')
      console.log('   jefe, que ocurre a media vida.\n')
      console.log('   enemigo              nv  jefe  turnos   gana   pierde  vida-fin  bloqueos  fase2')
      console.log('   ────────────────────────────────────────────────────────────────────────────────')
      for (const f of salida.turnos) {
        console.log('   ' + f.nombre.padEnd(20) + ' ' + String(f.nivel).padStart(2) + '  ' +
          (f.jefe ? ' 👑 ' : '    ') + ' ' + f1(f.turnos).padStart(5) + '  ' +
          (f1(f.victorias) + '%').padStart(6) + '  ' + (f1(f.derrotas) + '%').padStart(6) + '  ' +
          (f1(f.vidaFinal) + '%').padStart(7) + '  ' + f1(f.bloqueos).padStart(7) + '  ' +
          (f.jefe ? (f1(f.fase2) + '%').padStart(6) : '     —'))
      }
    }
  }

  if (args.includes('--barrido')) {
    salida.barrido = barrerEscalas(S)
    if (!soloJson) {
      console.log('\n━━ 5. BARRIDO DE ESCALAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   Seis situaciones, del recién llegado al veterano, con los dos')
      console.log('   robots. Se puntúa CADA UNA y se suman: una media buena con un')
      console.log('   caso horrible es un ajuste malo, porque alguien vive en ese caso.')
      console.log('   Objetivos: bueno gana ' + OBJETIVO.victoriasBueno.join('-') + '%, acaba con ' +
        OBJETIVO.vidaBueno.join('-') + '% de vida; torpe gana ' + OBJETIVO.victoriasTorpe.join('-') +
        '%; dura ' + OBJETIVO.duracion.join('-') + ' s.\n')
      console.log('   vida  daño  sigue   aleja   peor caso                   así sale')
      console.log('   ──────────────────────────────────────────────────────────────────────')
      for (const f of salida.barrido.slice(0, 10)) {
        const p = f.peor
        console.log('   ' + f.vida.toFixed(2).padStart(4) + '  ' + f.daño.toFixed(2).padStart(4) + '  ' +
          f.porNivel.toFixed(2).padStart(5) + '  ' +
          f.error.toFixed(2).padStart(6) + '   ' + p.etiqueta.padEnd(26) + '  ' +
          f1(p.victoriasBueno) + '% gana · ' + f1(p.vidaRestante) + '% vida · ' + f1(p.duracion) + 's')
      }
      console.log('   ' + '─'.repeat(70))
      const mejor = salida.barrido[0]
      console.log('\n   La mejor casilla, caso por caso  (vida ' + mejor.vida + ' · daño ' + mejor.daño +
        ' · sigue ' + f1(mejor.porNivel * 100) + '%):\n')
      console.log('   situación                     gana(bueno)  vida-fin  gana(torpe)   dura')
      console.log('   ──────────────────────────────────────────────────────────────────────')
      for (const p of mejor.porCaso) {
        console.log('   ' + p.etiqueta.padEnd(28) + ' ' + (f1(p.victoriasBueno) + '%').padStart(9) + '  ' +
          (f1(p.vidaRestante) + '%').padStart(8) + '  ' + (f1(p.victoriasTorpe) + '%').padStart(10) + '  ' +
          (f1(p.duracion) + 's').padStart(7))
      }
      console.log('\n   actual en el juego: vida ' + S.ESCALA_ARENA.vida + ' · daño ' + S.ESCALA_ARENA.daño +
        ' · sigue ' + f1(S.ESCALA_ARENA.seguimiento * 100) + '%')
    }
  }

  if (soloJson) console.log(JSON.stringify(salida, null, 2))
  else console.log('\n   medido en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s\n')
}

if (require.main === module) main()
module.exports = { cargarServidor, jugarArena, jugarTurnos, crearJugador, añadirArenasDeLaboratorio, medirCaso, CASOS_BARRIDO }
