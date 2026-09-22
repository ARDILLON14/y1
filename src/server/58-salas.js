
// ═══════════════════════════════════════════════════════════════════
//  SALAS JUGABLES DE MAZMORRA
//
//  Vive aparte de 58-arena.js porque son dos cosas distintas: allí está
//  la simulación de combate —moverse, pegar, recibir, morir— y aquí
//  está cómo se monta una sala que se gana sin matar a nadie. El motor
//  no necesita saber qué es un cofre, y una sala no necesita saber cómo
//  se resuelve un empujón.
//
//  (También es lo que pide la prueba de compilación: ningún módulo pasa
//  de 70 KB, y el criterio de ese límite está escrito en la propia
//  prueba — si un archivo se pasa, probablemente mezcla dos cosas.)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  SALAS JUGABLES: un encuentro cuyo objetivo no es matar a nadie
//
//  Las salas de cofre, trampa y santuario de las mazmorras eran una
//  tirada instantánea: `Math.random()` decidía si el cofre estaba
//  trampeado, `Math.random()` contra la agilidad decidía si los dardos
//  te daban, y el santuario sumaba vida y avanzaba. Pulsar la sala y
//  leer el resultado era todo el juego que había.
//
//  El motor para que fueran jugables ya estaba aquí: proyectiles con
//  barrido, telegrafía, esquiva, empuje. Lo único que faltaba era poder
//  decir que un encuentro se gana haciendo algo que no es vaciar la
//  sala de enemigos.
//
//  Eso son estas dos piezas:
//    objetivo  un sitio al que ir y en el que aguantar un rato
//    peligros  emisores fijos que avisan y disparan en ciclo
//
//  La recompensa de la sala viaja por donde ya viajaba todo: el botín
//  se mete en `p.botin` y la curación en la vida del jugador, así que
//  `resultadoCombateMazmorra` la recoge sin enterarse de que la sala
//  era distinta.
// ═══════════════════════════════════════════════════════════════════

// El progreso se pierde más despacio de lo que se gana. Si se perdiera
// al mismo ritmo, apartarse un instante de la trampa costaría todo lo
// avanzado y la sala sería un examen de no moverse, que es justo lo
// contrario de lo que se busca.
const SALA_DECAIMIENTO = 0.55

function salaDeMazmorra(tipo, opciones) {
  const o = opciones || {}
  const cx = ARENA_ANCHO / 2
  if (tipo === 'cofre') {
    const cofre = { x: cx, y: 170 }
    // Cuatro lanzadores en cruz alrededor del cofre, disparando a través
    // de él. Forzar la cerradura obliga a estarse quieto encima; los
    // dardos obligan a apartarse. La sala es ese tira y afloja, y por eso
    // solo aparecen si el cofre está trampeado: si no lo está, es un
    // cofre y ya.
    const peligros = o.trampeado ? [
      { x: cofre.x - 250, y: cofre.y, ang: 0 },
      { x: cofre.x + 250, y: cofre.y, ang: Math.PI },
      { x: cofre.x, y: cofre.y - 130, ang: Math.PI / 2 },
      { x: cofre.x, y: cofre.y + 130, ang: -Math.PI / 2 },
    ] : []
    return {
      tipo, nombre: o.nombre || 'Cámara del tesoro',
      objetivo: { ...cofre, radio: 46, usarMs: 1600, icono: '📦', etiqueta: 'Forzar el cofre' },
      // Escalonados para que no lleguen los cuatro a la vez: así hay
      // huecos en los que sí se puede estar encima del cofre.
      peligros: peligros.map((h, i) => crearPeligro(h, { cadaMs: 1500, avisoMs: 520, retraso: i * 375, dmgFrac: 0.07 })),
      recompensa: { botin: o.botin || [] },
    }
  }
  if (tipo === 'trampa') {
    // Pasillo: se entra por abajo y se sale por arriba. Tres filas de
    // lanzadores con fases distintas, para que cruzar sea cuestión de
    // elegir el momento y no de correr en línea recta.
    const filas = [
      { y: 430, izq: true,  retraso: 0 },
      { y: 300, izq: false, retraso: 500 },
      { y: 175, izq: true,  retraso: 1000 },
    ]
    const peligros = []
    for (const f of filas) {
      for (let k = 0; k < 2; k++) {
        peligros.push(crearPeligro(
          { x: f.izq ? 40 : ARENA_ANCHO - 40, y: f.y + (k === 0 ? -34 : 34), ang: f.izq ? 0 : Math.PI },
          { cadaMs: 1700, avisoMs: 480, retraso: f.retraso + k * 260, dmgFrac: o.dmgFrac || 0.12, vel: 330 }))
      }
    }
    return {
      tipo, nombre: o.nombre || 'Pasillo trampeado',
      objetivo: { x: cx, y: 80, radio: 64, usarMs: 400, icono: '🚪', etiqueta: 'Llegar a la salida' },
      peligros,
      recompensa: { botin: o.botin || [] },
    }
  }
  // Santuario. Es la sala sin peligro a propósito: en una mazmorra
  // donde todo lo demás te quita vida, el sitio donde se recupera es el
  // descanso. Lo que cambia respecto a antes es que hay que ir hasta la
  // fuente y quedarse: la vida ya no aparece por pulsar un botón.
  return {
    tipo: 'santuario', nombre: o.nombre || 'Santuario',
    objetivo: { x: cx, y: 300, radio: 72, usarMs: 2200, icono: '⛲', etiqueta: 'Beber del santuario' },
    peligros: [],
    recompensa: { cura: o.cura || 0.35, botin: o.botin || [] },
  }
}

function crearPeligro(base, cfg) {
  return {
    id: nextId('pel'),
    x: base.x, y: base.y, ang: base.ang,
    cadaMs: cfg.cadaMs || 1500,
    avisoMs: cfg.avisoMs || 500,
    vel: cfg.vel || 300,
    dmgFrac: cfg.dmgFrac || 0.08,
    // El primer disparo se retrasa para escalonar el ciclo. Sin esto
    // todos los emisores de la sala disparan a la vez y no hay hueco
    // por el que pasar.
    prox: now() + (cfg.retraso || 0) + (cfg.avisoMs || 500),
    avisando: true,
  }
}

// Ciclo de un emisor: avisa, y al acabar el aviso dispara. El aviso NO
// es decoración: es el tiempo que tiene el jugador para leerlo y
// apartarse, igual que el telegrafiado de un enemigo.
function pasoPeligros(p, ahora) {
  for (const h of p.sala.peligros) {
    if (ahora < h.prox) continue
    if (h.avisando) {
      h.avisando = false
      p.proyectiles.push(crearProyectil({
        dueño: 'enemigo', x: h.x, y: h.y, dir: h.ang,
        vel: h.vel, radio: 7,
        dmg: Math.max(1, Math.round(p.jugador.hpMax * h.dmgFrac)),
        empuje: 70, vidaMs: 3000,
      }))
      p.sucesos.push({ t: 'peligro', id: h.id, x: Math.round(h.x), y: Math.round(h.y) })
      h.prox = ahora + h.cadaMs
    } else {
      h.avisando = true
      p.sucesos.push({ t: 'aviso_peligro', id: h.id, ms: h.avisoMs })
      h.prox = ahora + h.avisoMs
    }
  }
}

function pasoObjetivo(p, ahora, dt) {
  const o = p.sala.objetivo
  // La sala del jefe tiene peligros pero no objetivo: se gana matando.
  if (!o || o.hecho) return null
  const j = p.jugador
  const dentro = Math.hypot(j.x - o.x, j.y - o.y) <= o.radio
  if (dentro) o.progreso = Math.min(o.usarMs, (o.progreso || 0) + dt * 1000)
  else o.progreso = Math.max(0, (o.progreso || 0) - dt * 1000 * SALA_DECAIMIENTO)
  if (o.progreso < o.usarMs) return null

  o.hecho = true
  const r = p.sala.recompensa || {}
  for (const b of r.botin || []) p.botin.push({ itemId: b.itemId, quantity: b.quantity })
  if (r.cura) {
    const antes = j.hp
    j.hp = Math.min(j.hpMax, j.hp + Math.round(j.hpMax * r.cura))
    p.sucesos.push({ t: 'cura', dmg: Math.round(j.hp - antes), x: j.x, y: j.y })
  }
  p.sucesos.push({ t: 'sala_hecha', tipo: p.sala.tipo })
  return terminar(p, 'victoria')
}

// ═══════════════════════════════════════════════════════════════════
//  SALA DEL JEFE: fases
//
//  El jefe era una oleada más. Un bicho con más vida y un acompañante,
//  peleando exactamente igual desde el primer segundo hasta el último.
//  El combate por turnos SÍ tiene fases para los jefes —lo dice su
//  propio código, `battle.phase`—, pero el de la arena no tenía nada:
//  la última sala de una mazmorra se jugaba igual que la primera.
//
//  Esto no añade un sistema nuevo: usa los peligros que ya montan las
//  salas de trampa y los enemigos que ya trae la mazmorra. Lo único que
//  hace falta es un reloj que mire la vida del jefe y encienda cosas al
//  pasar por ciertos puntos.
//
//    fase 1   como siempre
//    fase 2   por debajo del 66 %, la guarida despierta: cuatro
//             emisores en las paredes empiezan a barrer la sala, así
//             que ya no se puede pelear parado en un sitio
//    fase 3   por debajo del 33 %, el jefe llama refuerzos y los
//             emisores aprietan
//
//  Lo que NO cambia: la recompensa, el botín y el enfriamiento de la
//  mazmorra. El jefe pega lo mismo; lo que cambia es que la sala deja
//  de ser un sitio neutro.
// ═══════════════════════════════════════════════════════════════════

function salaDelJefe(mz) {
  const cx = ARENA_ANCHO / 2, cy = ARENA_ALTO / 2
  // Cuatro emisores en las paredes, barriendo por el centro. No
  // aparecen hasta la fase 2: en la ficha están apagados.
  const emisores = [
    { x: 30, y: cy - 90, ang: 0 },
    { x: ARENA_ANCHO - 30, y: cy + 90, ang: Math.PI },
    { x: cx - 120, y: 30, ang: Math.PI / 2 },
    { x: cx + 120, y: ARENA_ALTO - 30, ang: -Math.PI / 2 },
  ]
  return {
    tipo: 'jefe', nombre: 'Sala del jefe',
    // Sin objetivo: esta sala se gana como siempre, matando. Los
    // peligros son el añadido, no la condición de victoria.
    objetivo: null,
    peligros: [],
    recompensa: {},
    jefe: {
      fase: 1,
      // Los refuerzos salen del mismo grupo de enemigos que ya usa la
      // mazmorra en sus otras salas. No se inventa ningún bicho.
      // UN refuerzo, no dos. Con dos, medido contra la versión sin
      // fases, la pelea pasaba de costar unos 450 de vida a costar 867:
      // el doble. Y la mayor parte no venía de los emisores sino de que
      // matar a dos bichos más alarga el combate, y un combate más largo
      // es más daño recibido. Las fases están para cambiar cómo se
      // pelea, no para duplicar la factura.
      refuerzos: [mz.enemigos[0]],
      // Las dos fichas de emisores, ya escaladas. La fase 3 dispara más
      // seguido y avisa un pelín menos, que es lo que la hace apretar.
      emisoresFase2: emisores.map((h, i) => ({ base: h, cfg: { cadaMs: 2200, avisoMs: 620, retraso: i * 550, dmgFrac: 0.04, vel: 300 } })),
      emisoresFase3: emisores.map((h, i) => ({ base: h, cfg: { cadaMs: 1500, avisoMs: 520, retraso: i * 375, dmgFrac: 0.04, vel: 340 } })),
    },
  }
}

// Reloj de fases. Se llama en cada tick de una sala con jefe.
//
// El umbral se mira sobre el enemigo con más vida máxima, que es el
// jefe: es más robusto que guardar su id, porque si algún día la sala
// trae dos jefes sigue funcionando sin tocarlo.
function pasoJefe(p, ahora) {
  const j = p.sala.jefe
  const vivos = p.enemigos.filter(e => !e.muerto)
  if (!vivos.length) return
  const jefe = vivos.reduce((a, e) => (e.hpMax > a.hpMax ? e : a), vivos[0])
  const frac = jefe.hp / Math.max(1, jefe.hpMax)

  if (j.fase === 1 && frac <= 0.66) {
    j.fase = 2
    p.sala.peligros = j.emisoresFase2.map(e => crearPeligro(e.base, e.cfg))
    p.sucesos.push({ t: 'jefe_fase', fase: 2, nombre: jefe.nombre,
                     texto: 'La guarida despierta: las paredes empiezan a disparar' })
    return
  }
  if (j.fase === 2 && frac <= 0.33) {
    j.fase = 3
    p.sala.peligros = j.emisoresFase3.map(e => crearPeligro(e.base, e.cfg))
    // Refuerzos: entran por las esquinas, lejos del jugador, para que
    // no aparezcan encima y le quiten vida antes de poder reaccionar.
    const esquinas = [{ x: 90, y: 90 }, { x: ARENA_ANCHO - 90, y: 90 }]
    j.refuerzos.forEach((id, i) => {
      const e = esquinas[i % esquinas.length]
      p.enemigos.push(crearEnemigo(id, e.x, e.y, p.seguimiento))
    })
    p.sucesos.push({ t: 'jefe_fase', fase: 3, nombre: jefe.nombre,
                     texto: '¡Llama a sus guardias!' })
  }
}
