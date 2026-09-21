
// ═══════════════════════════════════════════════════════════════════
//  COMBATE POR TURNOS — máquina de estados y guion del turno
//
//  QUÉ HABÍA
//  Un solo `combatAction` que hacía todo de una vez: leía la acción,
//  calculaba el daño, aplicaba venenos, dejaba responder al enemigo,
//  miraba si alguien había muerto y repartía el botín. Devolvía un
//  paquete plano —`playerDmg`, `enemyDmg`, `crit`…— y la pantalla lo
//  pintaba entero de golpe.
//
//  Las reglas estaban bien. El problema era que el turno no tenía
//  FORMA: no había manera de saber en qué orden pasaron las cosas, así
//  que no se podía reproducir. Un combate por turnos que resuelve todo
//  en un fotograma se lee como una hoja de cálculo, no como una pelea.
//
//  QUÉ HAY AHORA
//  Las mismas reglas, en el mismo sitio, pero anotando lo que ocurre a
//  medida que ocurre. El turno sale como un GUION ordenado:
//
//    BATTLE_START · PLAYER_TURN · PLAYER_ACTION · PLAYER_ANIMATION
//    STATUS_EFFECTS · ENEMY_TURN · ENEMY_ACTION · CHECK_VICTORY
//    BATTLE_END
//
//  Cada escena dice qué pasó y cuánto debería durar en pantalla. El
//  servidor sigue decidiendo TODO —el cliente no calcula ni un punto de
//  daño—, pero ahora puede contarlo en vez de soltarlo.
//
//  El paso 8 usará este guion para animar el combate. Este paso solo
//  lo produce, sin tocar una sola regla de daño.
// ═══════════════════════════════════════════════════════════════════

const FASE = {
  BATTLE_START: 'BATTLE_START',
  PLAYER_TURN: 'PLAYER_TURN',
  PLAYER_ACTION: 'PLAYER_ACTION',
  PLAYER_ANIMATION: 'PLAYER_ANIMATION',
  ENEMY_TURN: 'ENEMY_TURN',
  ENEMY_ACTION: 'ENEMY_ACTION',
  STATUS_EFFECTS: 'STATUS_EFFECTS',
  CHECK_VICTORY: 'CHECK_VICTORY',
  BATTLE_END: 'BATTLE_END',
}

// Cuánto dura cada escena en pantalla, en milisegundos. Vive aquí y no
// en la página porque el ritmo es parte de cómo se juega: un crítico
// que se ve igual que un golpe normal no es un crítico.
const DURACION = {
  [FASE.BATTLE_START]: 600,
  [FASE.PLAYER_TURN]: 0,
  [FASE.PLAYER_ACTION]: 220,
  [FASE.PLAYER_ANIMATION]: 420,
  [FASE.STATUS_EFFECTS]: 380,
  [FASE.ENEMY_TURN]: 180,
  [FASE.ENEMY_ACTION]: 480,
  [FASE.CHECK_VICTORY]: 200,
  [FASE.BATTLE_END]: 700,
}

// El guion. Se le va contando lo que pasa y al final entrega la lista
// ordenada. Deliberadamente tonto: no decide nada, solo anota.
function nuevoGuion() {
  const fases = []
  return {
    fases,
    // `datos` es libre: cada fase lleva lo suyo. Lo único obligatorio
    // es la fase y cuánto dura.
    anota(fase, datos) {
      if (!FASE[fase]) throw new Error('Fase desconocida: ' + fase)
      fases.push(Object.assign({ fase, ms: DURACION[fase] || 200 }, datos || {}))
      return fases[fases.length - 1]
    },
    // Para ajustar la última escena cuando el resultado se sabe después
    // de haberla anotado (un golpe que resulta ser mortal, por ejemplo).
    ultima() { return fases[fases.length - 1] || null },
    // Cuánto dura el turno entero. La pantalla lo usa para saber cuándo
    // volver a dejar pulsar botones.
    total() { return fases.reduce((a, f) => a + (f.ms || 0), 0) },
  }
}

// ── Objetos usables en combate ─────────────────────────────────────
//
// Antes la acción de curarse buscaba literalmente `potion_hp`, la
// Poción de Curación I. El juego tiene once pociones, una escalera de
// curación de seis escalones y comida con efectos: nada de eso se podía
// usar peleando. Tenías el Elixir Mítico en la mochila y bebías agua
// sucia porque era lo único que el combate sabía reconocer.
//
// Un objeto sirve en combate si cura, da maná o deja un efecto. No hace
// falta una lista aparte: la plantilla del objeto ya lo dice.
function usableEnCombate(itemId) {
  const t = typeof template === 'function' ? template(itemId) : null
  if (!t) return null
  if (!t.heal && !t.mana && !t.buff) return null
  return t
}

// Qué puede beberse ahora mismo, para que la pantalla lo ofrezca sin
// adivinar. Se agrupa por tipo de objeto y se suman las cantidades.
function objetosDeCombate(char) {
  const fuera = new Map()
  for (const i of char.inventory || []) {
    const t = usableEnCombate(i.itemId)
    if (!t) continue
    const y = fuera.get(i.itemId)
    if (y) { y.cantidad += i.quantity; continue }
    fuera.set(i.itemId, {
      itemId: i.itemId, nombre: t.name, icono: t.icon,
      imagen: t.imagen || null, cantidad: i.quantity,
      cura: t.heal || 0, mana: t.mana || 0,
      efecto: t.buff ? { stat: t.buff.stat, valor: t.buff.valor, minutos: t.buff.minutos } : null,
    })
  }
  return [...fuera.values()]
}

// ── Habilidades de un personaje, con su estado real ────────────────
//
// POR QUÉ HACE FALTA
// Cada clase tiene TRES habilidades y la pantalla solo sabía mandar la
// primera: `skillId = char.skills[0]`. Un Guerrero solo podía usar
// Embestida jamás, y Golpe de Escudo —la única que interrumpe el ataque
// anunciado del enemigo, la que el propio aviso te dice que uses— era
// inalcanzable. Estaba en el catálogo, tenía coste, enfriamiento y
// efecto, y no había forma de lanzarla.
//
// Aquí se publica lo que el jugador necesita para elegir: qué sabe
// hacer, cuánto cuesta, si le llega el maná y cuánto le queda de
// enfriamiento. El servidor lo vuelve a validar al usarla; esto es para
// que la pantalla pueda enseñarlo, no para que decida.
function habilidadesDe(char, ahora) {
  const t = ahora || now()
  const propias = (char.skills && char.skills.length)
    ? char.skills
    : ((CLASSES[char.class] || CLASSES.Archimago).skills || [])
  return propias.filter(id => SKILLS[id]).map(id => {
    const sk = SKILLS[id]
    const hasta = (char.cooldowns || {})[id] || 0
    const restante = Math.max(0, hasta - t)
    return {
      id, nombre: sk.name, coste: sk.cost,
      enfriamientoMs: sk.cooldownMs, restanteMs: restante,
      elemento: sk.element || 'physical',
      // Qué hace, en una línea, para que la pantalla no tenga que
      // interpretar los números del catálogo.
      efecto: sk.buff ? 'refuerzo' : sk.dot ? 'veneno' : sk.stun ? 'aturde' : sk.slow ? 'ralentiza' : 'daño',
      aturde: !!sk.stun, ralentiza: !!sk.slow,
      refuerzo: sk.buff || null, veneno: sk.dot || null,
      critExtra: sk.critBonus || 0,
      // Si se puede lanzar AHORA. La pantalla apaga el botón; el
      // servidor lo vuelve a comprobar de todos modos.
      lista: restante <= 0 && char.mp >= sk.cost,
      porQueNo: restante > 0 ? 'enfriando' : (char.mp < sk.cost ? 'sin maná' : null),
    }
  })
}

// Los efectos que hay encima ahora mismo, de los dos lados. Sin esto el
// jugador bebe una poción de fuerza y no tiene forma de saber si sigue
// haciendo efecto.
function estadosDe(char, battle, ahora) {
  const t = ahora || now()
  const mios = []
  for (const b of (battle && battle.buffs) || []) {
    if (b.atk) mios.push({ nombre: 'Ataque +' + Math.round(b.atk * 100) + '%', turnos: b.turns, tipo: 'bueno', icono: '⚔️' })
    if (b.def) mios.push({ nombre: 'Defensa +' + Math.round(b.def * 100) + '%', turnos: b.turns, tipo: 'bueno', icono: '🛡️' })
    if (b.eva) mios.push({ nombre: 'Evasión +' + Math.round(b.eva * 100) + '%', turnos: b.turns, tipo: 'bueno', icono: '💨' })
  }
  // Los efectos de poción/comida viven en el personaje, no en la
  // batalla: duran minutos y sobreviven al combate.
  for (const e of (char.efectos || [])) {
    if (e.hasta && e.hasta < t) continue
    mios.push({
      nombre: (NOMBRE_STAT && NOMBRE_STAT[e.stat] ? NOMBRE_STAT[e.stat] : e.stat) + ' +' + e.valor,
      segundos: Math.max(0, Math.round(((e.hasta || t) - t) / 1000)), tipo: 'bueno', icono: '🧪',
    })
  }
  const suyos = []
  for (const d of (battle && battle.dots) || []) {
    suyos.push({ nombre: 'Veneno ' + d.dmg + '/turno', turnos: d.turns, tipo: 'malo', icono: '🧪' })
  }
  if (battle && battle.telegraph) {
    suyos.push({ nombre: 'Prepara ' + battle.telegraph.name, turnos: 1, tipo: 'aviso', icono: '⚠️' })
  }
  return { jugador: mios, enemigo: suyos }
}
