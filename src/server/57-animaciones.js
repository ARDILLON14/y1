
// ═══════════════════════════════════════════════════════════════════
//  ANIMACIONES — reloj compartido, independiente del combate
//
//  POR QUÉ ESTÁ SEPARADO
//  La animación no es una consecuencia del golpe: es un estado propio
//  que dura un rato y que el dibujante consulta. Si se mete dentro de
//  golpear() acaba habiendo una animación por cada función de ataque y
//  ninguna se puede reutilizar. Aquí vive el reloj; quien pega solo
//  dice "empieza a atacar" y se olvida.
//
//  QUIÉN DECIDE
//  El servidor. La animación que se está reproduciendo forma parte del
//  estado, igual que la vida o la posición, y viaja en el mismo
//  paquete. El cliente NO elige animación: solo la dibuja, y como
//  máximo adelanta el cronómetro entre dos paquetes para que el
//  movimiento no vaya a saltos de 100 ms.
//
//  CÓMO SE USA
//    animIniciar(ente, 'attack', ahora, duracionMs)
//    animPublica(ente, ahora, 'idle')  → { n, t, d, f, fase }
//
//  Vale para cualquier ente que tenga un campo `anim`: jugador de
//  arena, enemigo, y más adelante los sprites del combate por turnos.
//  No sabe nada de daño, ni de armas, ni de HP: por eso sirve para los
//  dos combates sin duplicarse.
// ═══════════════════════════════════════════════════════════════════

// `prio` decide quién puede cortar a quién. Recibir un golpe interrumpe
// un ataque; un ataque no interrumpe el recibir. Sin esto, encadenar
// clics dejaba la animación reiniciándose y nunca se veía entera.
//
// `fases` solo la tiene el ataque, y son fracciones de la duración:
// preparación → golpe → recuperación. El daño ya lo aplica el servidor
// cuando toca; estas fracciones existen para que el arma se vea salir
// y volver en vez de teletransportarse.
const ANIMACIONES = {
  idle:   { dur: 900, cuadros: 2, bucle: true,  prio: 0 },
  walk:   { dur: 520, cuadros: 4, bucle: true,  prio: 1 },
  attack: { dur: 320, cuadros: 3, bucle: false, prio: 3,
            fases: { preparacion: 0.28, golpe: 0.30, recuperacion: 0.42 } },
  dodge:  { dur: 260, cuadros: 2, bucle: false, prio: 4 },
  hurt:   { dur: 240, cuadros: 2, bucle: false, prio: 5 },
  death:  { dur: 700, cuadros: 3, bucle: false, prio: 9 },
}

function animDef(nombre) { return ANIMACIONES[nombre] || ANIMACIONES.idle }

// Arranca una animación. Devuelve la que quede activa, que puede ser
// la de antes si la nueva no tenía derecho a interrumpirla.
function animIniciar(ente, nombre, ahora, duracionMs) {
  const def = ANIMACIONES[nombre]
  if (!ente || !def) return null
  const act = ente.anim
  if (act) {
    const defAct = animDef(act.n)
    const enCurso = !defAct.bucle && ahora < act.ini + act.dur
    if (enCurso && defAct.prio > def.prio) return act
  }
  ente.anim = { n: nombre, ini: ahora, dur: duracionMs > 0 ? Math.round(duracionMs) : def.dur }
  return ente.anim
}

// En qué tramo del ataque estamos. Fuera del ataque siempre 'activa':
// el dibujante no tiene que saber de fases para pintar un idle.
function animFase(nombre, t, dur) {
  const def = animDef(nombre)
  if (!def.fases || dur <= 0) return 'activa'
  const p = t / dur
  if (p < def.fases.preparacion) return 'preparacion'
  if (p < def.fases.preparacion + def.fases.golpe) return 'golpe'
  return 'recuperacion'
}

function animCuadro(nombre, t, dur) {
  const def = animDef(nombre)
  if (dur <= 0) return 0
  const p = def.bucle ? (t % dur) / dur : Math.min(0.999, t / dur)
  return Math.min(def.cuadros - 1, Math.floor(p * def.cuadros))
}

// Lo que viaja al cliente. Corto a propósito: son 10 paquetes por
// segundo y esto va dentro de cada uno.
//   n     nombre de la animación
//   t     milisegundos transcurridos
//   d     duración total
//   f     número de cuadro (cuando haya tiras de sprites, es el índice)
//   fase  preparacion / golpe / recuperacion / activa
function animPublica(ente, ahora, reposo) {
  const base = ANIMACIONES[reposo] ? reposo : 'idle'
  const a = ente && ente.anim
  let nombre = base
  let t = 0
  let dur = animDef(base).dur
  if (a) {
    const def = animDef(a.n)
    const pasado = ahora - a.ini
    if (def.bucle || pasado < a.dur) {
      nombre = a.n
      dur = a.dur
      t = def.bucle ? pasado % a.dur : Math.max(0, pasado)
    } else {
      // Terminó y nadie la reemplazó: se vuelve al reposo sin dejar
      // el ente congelado en el último cuadro del golpe.
      t = (ahora - (a.ini + a.dur)) % dur
    }
  }
  return {
    n: nombre, t: Math.round(t), d: Math.round(dur),
    f: animCuadro(nombre, t, dur), fase: animFase(nombre, t, dur),
  }
}

