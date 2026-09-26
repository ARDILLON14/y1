// ═══════════════════════════════════════════════════════════════════
//  COMBATE EN TIEMPO REAL EN EL MUNDO (FASE C)
//
//  QUÉ HABÍA
//  Nada en el servidor. Los monstruos del mapa los inventaba el
//  NAVEGADOR: `ZONES[...].monsters` vivía en la página y cada cliente
//  los colocaba donde le salía, con Phaser.Math.Between. Consecuencias,
//  todas comprobadas en la auditoría:
//
//    · uno por jugador. Dos personas en el mismo bosque veían arañas
//      distintas, en sitios distintos, y no podían pelear con la misma;
//    · no tenían vida: la vida aparecía al abrir la batalla por turnos;
//    · el servidor no sabía dónde estaba ninguno.
//
//  QUÉ HACE ESTO
//  Los monstruos pasan a ser del servidor y COMPARTIDOS por zona. Su
//  posición, su vida, a quién persiguen y cuándo pegan los decide aquí,
//  en un paso fijo de 100 ms, el mismo de la arena y con el mismo motor
//  (57-golpe.js). El cliente manda intención y pinta lo que le llega.
//
//  QUÉ NO TOCA
//  El combate por turnos sigue intacto (decisión D9 de la auditoría):
//  /api/combat/action lo usan 21 archivos de prueba y tres pantallas.
//  Esto se añade AL LADO. Quién abre qué se decide en un paso propio,
//  cuando esto esté en verde.
//
//  DE DÓNDE SALEN LOS NÚMEROS
//  De sitios que ya existían, no de mi criterio:
//    vida, daño, defensa       MONSTERS (30-personajes-combate.js)
//    velocidad, radio, alcance,
//      cadencia, aviso         CONDUCTAS (58-arena.js)
//    radio de aggro            CARACTER.vista (56-ia-enemigos.js)
//    qué bicho vive en qué zona ZONES (40-mundo-mercado.js)
//    fases del golpe, sector,
//      retroceso, separación   57-golpe.js
//  Lo único nuevo es la correa, porque la arena es un ring cerrado y no
//  la necesita. Va marcada y medida.
// ═══════════════════════════════════════════════════════════════════

const MAPA_MUNDO = { ancho: MUNDO_ANCHO, alto: MUNDO_ALTO }

// La correa: a cuánto de su sitio deja de perseguirte un bicho. Es el
// único número que no estaba en ninguna parte. 320 px en un mundo de
// 1.800×1.200 es un octavo del ancho: suficiente para que te persiga un
// buen rato y poco para que te siga hasta la otra punta del mapa.
// NO se cura al volver: el progreso del jugador no se borra, igual que
// decidió el STEP 12.
const CORREA_PX = 320

// Cuánto tarda en volver un monstruo muerto. Lo bastante para que matar
// signifique algo y lo bastante poco para que la zona no se vacíe.
const REAPARECER_MS = 25000

// Cuántos monstruos por zona. El mundo mide 1.800×1.200: con menos, no
// te encuentras nada; con más, no se puede cruzar.
const MONSTRUOS_POR_ZONA = 6

// Entre trago y trago. En turnos el coste de beber es EL TURNO; en
// tiempo real no hay turnos, así que sin esto se bebe a quince por
// segundo (decisión D11 de la auditoría). Se ancla a lo que ya se sabe:
// banco-balance gana el 100 % curándose por debajo de un tercio de
// vida, y una pelea con una araña dura del orden de tres segundos.
const POCION_ENFRIAMIENTO_MS = 3000

// Lo que empuja un golpe al jugador. La FASE C.5 pide "la mitad del que
// recibe un enemigo"; el empuje medio de las armas del catálogo ronda
// 120, así que 60.
const RETROCESO_JUGADOR = 60

// Tope de intenciones por segundo y jugador (sección C.8).
const INTENCIONES_POR_SEG = 15

// ── Las paredes, que hasta ahora solo conocía el navegador ─────────
//
// Los edificios están declarados en la página, en coordenadas de un
// lienzo de 900×650 que luego se reescala al mundo de 1.800×1.200. El
// servidor no los conocía, así que un monstruo suyo cruzaría la forja
// como si no estuviera.
//
// Están copiados, y una copia se desincroniza: por eso hay una prueba
// que compara esta tabla con la de la página y falla si dejan de
// cuadrar. Es la única forma de tener las dos sin que se separen, hasta
// que las estructuras se sirvan desde aquí (que es su propio trabajo,
// porque la página las usa también para dibujar, con color y etiqueta).
const ESC_X = 1800 / 900
const ESC_Y = 1200 / 650
function rect(x, y, w, h) {
  return { x: x * ESC_X, y: y * ESC_Y, w: w * ESC_X, h: h * ESC_Y }
}
const ESTRUCTURAS = {
  pueblo: [rect(280, 160, 120, 80), rect(480, 140, 100, 70), rect(600, 200, 130, 90), rect(140, 280, 150, 100)],
  forest: [rect(200, 150, 60, 60), rect(400, 100, 80, 80), rect(580, 180, 70, 70), rect(320, 280, 90, 90)],
  mines:  [rect(200, 160, 180, 120), rect(500, 150, 160, 110), rect(350, 300, 120, 80)],
  ruins:  [rect(220, 130, 200, 150), rect(520, 160, 150, 120), rect(350, 320, 180, 100)],
}

function chocaConEstructura(zona, x, y, r) {
  for (const c of ESTRUCTURAS[zona] || []) {
    if (x + r > c.x && x - r < c.x + c.w && y + r > c.y && y - r < c.y + c.h) return true
  }
  return false
}

// ── Estado ─────────────────────────────────────────────────────────
const zonasVivas = new Map()   // zona → { monstruos, proyectiles }
const buzon = new Map()        // username → sucesos pendientes de entregar
const intencion = new Map()    // username → última intención + contador

function zonaViva(zona) {
  let z = zonasVivas.get(zona)
  if (!z) { z = { monstruos: [], proyectiles: [], sembrada: false }; zonasVivas.set(zona, z) }
  return z
}

function avisar(username, suceso) {
  if (!username) return
  const b = buzon.get(username) || []
  b.push(suceso)
  // Un buzón que nadie vacía no puede crecer sin fin: si alguien deja la
  // pestaña en segundo plano, se queda con lo último y no con todo.
  buzon.set(username, b.length > 60 ? b.slice(-60) : b)
}
function avisarZona(zona, suceso) {
  for (const u of jugadoresDe(zona)) avisar(u, suceso)
}
function recogerSucesos(username) {
  const b = buzon.get(username) || []
  buzon.set(username, [])
  return b
}

// Quién está en una zona AHORA. Se lee de la presencia del mundo
// (54-mundo-vivo.js), que ya es quien sabe dónde está cada uno y ya
// valida que nadie se teletransporte.
function jugadoresDe(zona) {
  const fuera = []
  const t = now()
  for (const [u, e] of mundo) {
    if (e.zona !== zona) continue
    if (t - e.visto > MUNDO_OLVIDO_MS) continue
    fuera.push(u)
  }
  return fuera
}

// El jugador como CUERPO, para el motor de golpes. Su posición la manda
// la presencia; el resto sale de su ficha.
function cuerpoDe(username) {
  const e = mundo.get(username)
  const p = store.players[username]
  if (!e || !p) return null
  const char = p.character
  const st = effectiveStats(char)
  return {
    usuario: username, id: char.id, x: e.x, y: e.y,
    radio: 15, golpeable: GOLPEABLE_JUGADOR,
    hp: char.hp, def: st.defense, char, zona: e.zona,
  }
}

// ── Los monstruos ──────────────────────────────────────────────────
//
// Reparto determinista: la misma zona siempre coloca a los suyos en los
// mismos sitios. No es cosmético. Con posiciones al azar por arranque,
// una prueba que quiere "una araña cerca" tiene que buscarla, y dos
// servidores de la misma partida no cuadran.
function sitiosDe(zona, cuantos) {
  const fuera = []
  // Una espiral desde el centro, saltando lo que pise un edificio.
  const paso = Math.PI * 2 * 0.618       // proporción áurea: no se agrupan
  let i = 0
  while (fuera.length < cuantos && i < cuantos * 12) {
    const t = i * paso
    const r = 180 + (i / (cuantos * 12)) * (Math.min(MUNDO_ANCHO, MUNDO_ALTO) * 0.38)
    const x = MUNDO_ANCHO / 2 + Math.cos(t) * r
    const y = MUNDO_ALTO / 2 + Math.sin(t) * r
    i++
    if (x < 80 || y < 80 || x > MUNDO_ANCHO - 80 || y > MUNDO_ALTO - 80) continue
    if (chocaConEstructura(zona, x, y, 40)) continue
    fuera.push({ x: Math.round(x), y: Math.round(y) })
  }
  return fuera
}

// Qué bichos hay en una zona. Lo dice ZONES, que es la tabla del
// servidor, y se filtran los que no tienen conducta en tiempo real
// (decisión D10: m_troll_boss, m_bat y m_liche no la tienen todavía).
function bichosDe(zona) {
  const z = ZONES[zona]
  if (!z) return []
  return (z.monsters || []).filter(id => MONSTERS[id] && CONDUCTAS[id])
}

function crearMonstruo(zona, monsterId, sitio) {
  const m = MONSTERS[monsterId]
  const c = CONDUCTAS[monsterId]
  const car = caracterDe(monsterId)
  return {
    id: nextId('mon'), monsterId, zona,
    nombre: m.name, icono: m.icon, nivel: m.level,
    x: sitio.x, y: sitio.y, casaX: sitio.x, casaY: sitio.y,
    vx: 0, vy: 0, ex: 0, ey: 0,
    // La vida y el daño son LOS MISMOS del combate por turnos. Sin
    // escalas: la arena tiene la suya porque una arena es un encuentro
    // entero, y el mundo no lo es.
    hp: m.hp, hpMax: m.hp,
    dmg: Math.round((m.atk[0] + m.atk[1]) / 2),
    def: m.def,
    radio: c.radio, golpeable: c.radio,
    vel: c.vel, alcance: c.alcance, cadenciaMs: c.cadenciaMs,
    // El aviso del golpe, que es LA ventana para bloquear.
    //
    // Medido: de pulsar a ver el gesto pasan 121 ms de media (336 el
    // peor), y otro tanto tarda en llegar la intención de vuelta. Con
    // los 300 ms que salían de la tabla, al jugador le quedaban menos de
    // 60 ms para decidir: o sea, bloquear era imposible y la mecánica
    // que el STEP 21 demostró que decide el juego no existía aquí.
    //
    // El suelo es 500: 121 de ver + 250 de reaccionar + 121 de que
    // llegue. No es un número redondo elegido a ojo, es la suma de tres
    // cosas medidas. Quien declare un aviso más largo (el troll, 700; el
    // gólem, 900) conserva el suyo.
    avisoMs: Math.max(500, c.avisoMs || car.avisoAtaque || 0),
    vista: car.vista || 600,
    estado: 'reposo', objetivo: null,
    proxAtaque: 0, avisandoHasta: 0, invulnHasta: 0,
    trabadoHasta: 0, proxTraba: 0,
    muertoHasta: 0,
    // Quién le ha hecho cuánto daño. Decide el botín y la experiencia.
    daños: {}, ultimoGolpe: null,
  }
}

function sembrarZona(zona) {
  const z = zonaViva(zona)
  if (z.sembrada) return z
  z.sembrada = true
  const bichos = bichosDe(zona)
  if (!bichos.length) return z
  const sitios = sitiosDe(zona, MONSTRUOS_POR_ZONA)
  for (let i = 0; i < sitios.length; i++) {
    z.monstruos.push(crearMonstruo(zona, bichos[i % bichos.length], sitios[i]))
  }
  return z
}

// ── La intención que manda el cliente ──────────────────────────────
//
// Solo intención. Los campos de más —vida, daño, x, y, golpea, xp— se
// ignoran sin decir nada: no hay ninguna rama que los lea. Eso lo
// comprueba test-autoridad-servidor.
function entradaMundo(username, e) {
  if (!username) return { error: 'Sin sesión', code: 401 }
  const t = now()
  let i = intencion.get(username)
  if (!i) { i = { ventana: t, cuenta: 0 }; intencion.set(username, i) }
  // Tope de intenciones por segundo. Lo que pase se descarta y se
  // cuenta: si alguien acelera, se ve en la telemetría en vez de
  // notarse en el servidor.
  if (t - i.ventana >= 1000) { i.ventana = t; i.cuenta = 0 }
  if (++i.cuenta > INTENCIONES_POR_SEG) {
    if (typeof track === 'function') track('mundo_intencion_descartada', username)
    return { descartada: true }
  }

  const d = e || {}
  // La dirección de apuntado se NORMALIZA: el módulo que mande el
  // cliente da igual, solo cuenta hacia dónde.
  const ax = Number(d.ax), ay = Number(d.ay)
  const largo = Math.hypot(ax || 0, ay || 0)
  if (Number.isFinite(largo) && largo > 0.001) {
    i.apuntar = Math.atan2(ay / largo, ax / largo)
  }
  i.pulsado = !!d.pulsado
  i.bloquear = !!d.bloquear
  if (Number.isInteger(d.ranura) && d.ranura >= 0 && d.ranura < HOTBAR_RANURAS) i.ranura = d.ranura
  if (Number.isFinite(Number(d.seq))) i.seq = Number(d.seq)
  return { ok: true }
}

// ── El paso del jugador ────────────────────────────────────────────
function pasoJugador(zona, j, ahora) {
  const v = vivoDe(j.usuario)
  const i = intencion.get(j.usuario) || {}
  const char = j.char

  // Bloquear: mientras bloqueas no atacas. El efecto sobre el daño se
  // aplica al recibirlo, con la MISMA reducción que el combate por
  // turnos, que se lee de allí y no se copia.
  v.bloqueando = !!i.bloquear

  // El cambio de ranura NO corta el golpe: se apunta y se aplica al
  // terminar la recuperación.
  if (Number.isInteger(i.ranura) && i.ranura !== char.hotbarSel) {
    if (v.golpe) v.ranuraPedida = i.ranura
    else elegirRanura(char, i.ranura)
  }
  if (v.ranuraPedida != null && !v.golpe) {
    elegirRanura(char, v.ranuraPedida)
    v.ranuraPedida = null
  }

  if (v.golpe) { resolverGolpeMundo(zona, j, v, ahora); return }
  if (!i.pulsado || v.bloqueando) return
  // Dónde NO se pelea en el mundo (sección C.4). Estar en dos combates a
  // la vez no es una posibilidad: es un jugador repartiendo el doble de
  // daño y recibiendo la mitad de atención.
  if (char.hp <= 0) return
  if (peleandoEnOtroSitio(j.usuario, char)) return
  if (ahora < v.proxGolpe) return

  const ranura = ranuraActivaDe(char)
  if (ranura.vacia || ranura.agotada || !ranura.usableEnCombate) return

  // Una poción en la ranura activa se BEBE con el mismo botón.
  if (ranura.clase === 'consumible') { beberDeLaBarra(j, v, ranura, ahora); return }

  const arma = perfilArmaDe(char)
  // El arma de la ranura tiene que ser la que se empuña: si la ranura
  // dice una y el equipo otra, manda la ranura (sección D.1).
  const usar = ARMAS[ranura.itemId] ? perfilDeArma(ranura.itemId) : arma
  if (usar.costeMp > 0 && char.mp < usar.costeMp) {
    avisar(j.usuario, { tipo: 'sin_mana', costeMp: usar.costeMp })
    return
  }

  const f = fasesDeGolpe(usar.cadenciaMs)
  v.proxGolpe = ahora + usar.cadenciaMs
  v.golpe = {
    armaId: usar.id, ranura: char.hotbarSel,
    inicio: ahora, desde: ahora + f.anticipacion, hasta: ahora + f.anticipacion + f.activa,
    dir: Number.isFinite(i.apuntar) ? i.apuntar : 0,
    tocados: [], disparado: false,
  }
  if (usar.costeMp > 0) char.mp = Math.max(0, char.mp - usar.costeMp)
  avisarZona(zona, {
    tipo: 'gesto', de: j.usuario, arma: usar.id, tipoUso: usar.tipoUso,
    ms: f.anticipacion, activa: f.activa, dir: v.golpe.dir,
  })
}

function beberDeLaBarra(j, v, ranura, ahora) {
  if (ahora < v.proxPocion) return
  const char = j.char
  const plantilla = typeof usableEnCombate === 'function' ? usableEnCombate(ranura.itemId) : null
  if (!plantilla) return
  if (!removeItem(char, ranura.itemId, 1, 'consumo')) return
  v.proxPocion = ahora + POCION_ENFRIAMIENTO_MS
  const st = effectiveStats(char)
  const cura = plantilla.heal || 0
  if (cura) char.hp = Math.min(st.maxHp, char.hp + cura)
  if (plantilla.mana) char.mp = Math.min(st.maxMp, char.mp + plantilla.mana)
  if (plantilla.buff && typeof aplicarEfecto === 'function') aplicarEfecto(char, plantilla.buff)
  avisar(j.usuario, { tipo: 'objeto', itemId: ranura.itemId, cura, hp: char.hp })
  // El mismo paso del tutorial que el combate por turnos.
  if (typeof step === 'function') step(j.usuario, 'first_potion')
  persist()
}

// Resolver el golpe en curso. Se llama en CADA paso, no al pulsar: por
// eso un bicho que se mete en el barrido mientras el filo está fuera se
// lo come, que es lo que se espera de un arco de ataque.
function resolverGolpeMundo(zona, j, v, ahora) {
  const g = v.golpe
  if (ahora < g.desde) return
  if (ahora > g.hasta) { v.golpe = null; return }

  const arma = perfilDeArma(g.armaId)
  const z = zonaViva(zona)

  if (arma.proyectil) {
    if (g.disparado) return
    g.disparado = true
    const mios = z.proyectiles.filter(p => p.dueño === j.usuario).length
    if (mios >= PROYECTILES_MAX) return
    z.proyectiles.push(crearProyectil({
      dueño: j.usuario, x: j.x, y: j.y, dir: g.dir,
      vel: arma.proyectil.vel, radio: arma.proyectil.radio,
      dmg: Math.round(poderDe(j.char) * arma.dmg), empuje: arma.empuje,
      elemento: arma.proyectil.element, vidaMs: arma.proyectil.vidaMs,
    }))
    avisarZona(zona, { tipo: 'disparo', de: j.usuario, x: j.x, y: j.y, dir: g.dir })
    return
  }

  let tocado = false
  for (const m of z.monstruos) {
    if (m.hp <= 0) continue
    if (yaTocado(g, m.id)) continue
    if (!dentroDeSector(j, g.dir, arma.alcance, arma.arco, m)) continue
    const ang = Math.atan2(m.y - j.y, m.x - j.x)
    dañarMonstruo(zona, j, m, Math.round(poderDe(j.char) * arma.dmg), arma.empuje, ang, ahora)
    anotarTocado(g, m.id)
    tocado = true
  }
  if (!g.avisado) {
    g.avisado = true
    avisarZona(zona, { tipo: 'golpe', de: j.usuario, acierto: tocado, x: j.x, y: j.y, dir: g.dir, alcance: arma.alcance })
  }
}

// ¿Está peleando en otro sitio? Batalla por turnos abierta, partida de
// arena o mazmorra. Son los mismos tres que ya decidían si descansas
// (60-http.js), leídos del mismo sitio para que no puedan discrepar.
function peleandoEnOtroSitio(username, char) {
  for (const b of Object.values(store.battles)) {
    if (b.owner === char.id && b.state === 'ACTIVE') return true
  }
  if (typeof partidas !== 'undefined' && partidas.has && partidas.has(username)) return true
  if (typeof runs !== 'undefined' && runs.has && runs.has(username)) return true
  return false
}

// El poder del jugador. EXACTAMENTE la misma expresión que la arena
// (58-arena.js:401): la estadística que manda en su clase, sin inventar
// una media ponderada nueva. Una fórmula distinta aquí sería un tercer
// catálogo, y la misma arma pegaría distinto según dónde peleas.
function poderDe(char) {
  const st = effectiveStats(char)
  return st[(CLASSES[char.class] || CLASSES.Archimago).primary || 'strength']
}

// ── Daño ───────────────────────────────────────────────────────────
function dañarMonstruo(zona, j, m, dmg, empuje, ang, ahora) {
  const real = Math.max(1, dmg - Math.round(m.def * 0.4))
  m.hp -= real
  aplicarRetroceso(m, ang, empuje, MAPA_MUNDO)
  m.daños[j.usuario] = (m.daños[j.usuario] || 0) + real
  m.ultimoGolpe = j.usuario
  // Pegar también cuenta como estar en combate: el descanso no puede
  // empezar mientras repartes.
  marcarCombate(j.usuario, ahora)
  if (typeof step === 'function') step(j.usuario, 'first_world_hit')
  avisarZona(zona, { tipo: 'dano', a: m.id, cantidad: real, critico: false, x: m.x, y: m.y })
  if (m.hp <= 0) matarMonstruo(zona, m, ahora)
  else trabar(m, real, ahora)
}

function dañarJugadorMundo(zona, j, m, dmg, ang, ahora) {
  const v = vivoDe(j.usuario)
  if (ahora < v.invulnerableHasta) return
  const char = j.char
  const st = effectiveStats(char)
  let real = Math.max(1, Math.round(dmg * (1 - Math.min(0.7, st.defense / 250))))
  // Bloquear reduce EXACTAMENTE lo mismo que en el combate por turnos:
  // ×0,3. El número se lee de allí, no se copia a mano.
  let bloqueado = false
  if (v.bloqueando) {
    real = Math.max(1, Math.floor(real * REDUCCION_BLOQUEO))
    bloqueado = true
  }
  char.hp = Math.max(0, char.hp - real)
  v.invulnerableHasta = ahora + INVULN_MS
  marcarCombate(j.usuario, ahora)
  // El retroceso del jugador es la mitad del que recibe un enemigo. Y
  // tiene que mover su posición DE VERDAD, o sea la que guarda la
  // presencia del mundo: escribirlo en un objeto de paso no empujaba a
  // nadie. Se marca corregido para que el cliente se recoloque, que es
  // el mismo camino que ya usa el control de velocidad.
  const e = mundo.get(j.usuario)
  if (e) {
    const cuerpo = { x: e.x, y: e.y, ex: 0, ey: 0, radio: j.radio }
    aplicarRetroceso(cuerpo, ang, RETROCESO_JUGADOR, MAPA_MUNDO)
    // Se aplica de golpe: aquí no hay carril de impulsos porque quien
    // mueve al jugador es su propio cliente, paso a paso.
    const nx = limitar(e.x + cuerpo.ex * 0.1, 0, MUNDO_ANCHO)
    const ny = limitar(e.y + cuerpo.ey * 0.1, 0, MUNDO_ALTO)
    if (!chocaConEstructura(zona, nx, ny, j.radio)) { e.x = nx; e.y = ny; e.corregido = true }
  }
  avisar(j.usuario, { tipo: 'dano', a: 'yo', cantidad: real, bloqueado, hp: char.hp })
  avisarZona(zona, { tipo: 'dano_jugador', de: m.id, a: j.usuario, cantidad: real, bloqueado })
  if (bloqueado && typeof step === 'function') step(j.usuario, 'first_block')
  if (char.hp <= 0) morirEnElMundo(zona, j, m, ahora)
}

// La misma regla del STEP 12: al matarte, el enemigo se cura MEDIA vida
// máxima y se queda herido. No se cura entero, que era lo que convertía
// morir en borrar el trabajo hecho.
function morirEnElMundo(zona, j, m, ahora) {
  const char = j.char
  m.hp = Math.min(m.hpMax, Math.round(m.hpMax * CURA_AL_MORIR))
  m.daños = {}
  const perdido = Math.floor(char.gold * 0.1)
  char.gold = Math.max(0, char.gold - perdido)
  avisar(j.usuario, { tipo: 'muerte', oroPerdido: perdido, enemigoHp: m.hp, enemigoHpMax: m.hpMax })
  if (typeof audit === 'function') audit('muerte_mundo', j.usuario, { zona, monstruo: m.monsterId, oro: perdido })
  persist()
}

function matarMonstruo(zona, m, ahora) {
  m.hp = 0
  m.estado = 'muerto'
  m.muertoHasta = ahora + REAPARECER_MS
  m.objetivo = null

  // Botín y experiencia para QUIEN MÁS DAÑO LE HIZO; si empatan, el que
  // dio el último golpe. No se reparte ni se duplica: repartir crearía
  // experiencia y objetos de más, y el STEP 10 lo mediría.
  let mejor = null, top = -1
  for (const [u, d] of Object.entries(m.daños)) {
    if (d > top || (d === top && u === m.ultimoGolpe)) { top = d; mejor = u }
  }
  avisarZona(zona, { tipo: 'muerte_monstruo', id: m.id, monsterId: m.monsterId, de: mejor })
  m.daños = {}
  if (!mejor) return
  const p = store.players[mejor]
  if (!p) return
  const char = p.character
  const mon = MONSTERS[m.monsterId]

  char.xp += mon.xp
  const oro = randInt(mon.gold[0], mon.gold[1])
  char.gold += oro
  char.monstersKilled = (char.monstersKilled || 0) + 1
  const botin = rollLoot(m.monsterId)
  for (const it of botin) addItem(char, it.itemId, it.quantity, 'botin')
  const subidas = checkLevelUp(char)
  // Cuenta para las misiones, con la misma clave que el combate por
  // turnos: por eso matar arañas aquí avanza "Las Arañas del Sendero".
  const misiones = mon.questKey ? emitProgress(char, mon.questKey, 1) : []
  if (typeof trackCurrency === 'function') trackCurrency(mejor, 'gold', oro, 'mundo_kill')
  avisar(mejor, {
    tipo: 'recompensa', monsterId: m.monsterId, xp: mon.xp, oro,
    botin, subidas, misiones, nivel: char.level,
  })
  persist()
}

// Encajar un golpe interrumpe lo que estuviera haciendo, si el golpe da
// para tanto: un bicho que sigue pegándote en mitad de tu combo como si
// no notara nada se siente mal.
//
// NO se usa herir() de 56-ia-enemigos.js, aunque hace justo esto. Es de
// la máquina de estados de la arena: le escribe al bicho un `estado`
// ('normal', 'hurt', 'stun') que este bucle no conoce, y medido, el
// monstruo se quedaba clavado a 80 px sin perseguir y sin atacar
// —fuera del alcance de la daga— para el resto de la pelea. La araña
// pasaba de 285 a 129 de vida y ahí se quedaba.
//
// Los umbrales son los mismos que los suyos, para que encajar un golpe
// se sienta igual en los dos sitios.
function trabar(m, dañoReal, ahora) {
  const car = caracterDe(m.monsterId)
  const peso = dañoReal / Math.max(1, m.hpMax)
  if (peso < 0.06 * (car.aguante || 1)) return
  if (m.proxTraba && ahora < m.proxTraba) return
  m.proxTraba = ahora + 2.5 * (car.trabaMs || 200)
  // Un golpe muy gordo aturde en vez de trabar, y dura más.
  m.trabadoHasta = ahora + (peso > 0.30 ? 700 : (car.trabaMs || 200))
  // Y retrasa su siguiente ataque: es la jugada del jugador.
  m.proxAtaque = Math.max(m.proxAtaque, m.trabadoHasta)
  if (m.estado === 'avisa') m.estado = 'persigue'
}

// ── La conducta de un monstruo ─────────────────────────────────────
//
// Cuatro estados y nada más. La máquina de estados completa de la arena
// (56-ia-enemigos.js) tiene zigzag, retiradas, embestidas y aturdimiento,
// y está atada a la partida de arena. Aquí hace falta lo mínimo que hace
// que el combate se pueda jugar, con el GOLPE ANUNCIADO, que es lo que
// da sentido a bloquear.
//
//   reposo      quieto en su sitio
//   persigue    te ha visto y va a por ti
//   avisa       levanta el arma: aquí es cuando bloqueas
//   vuelve      te has ido demasiado lejos; regresa SIN curarse
function pasoMonstruo(zona, m, jugadores, ahora, dt) {
  if (m.hp <= 0) {
    if (ahora >= m.muertoHasta) reaparecer(m, ahora)
    return
  }

  // ¿A quién persigue? Al vivo más cercano dentro de su vista.
  let cerca = null, dcerca = Infinity
  for (const j of jugadores) {
    if (j.char.hp <= 0) continue
    const d = dist(m, j)
    if (d < dcerca) { dcerca = d; cerca = j }
  }

  const deCasa = Math.hypot(m.x - m.casaX, m.y - m.casaY)
  if (deCasa > CORREA_PX) {
    m.estado = 'vuelve'
    m.objetivo = null
  } else if (cerca && dcerca <= m.vista) {
    m.objetivo = cerca.usuario
    if (m.estado === 'vuelve' || m.estado === 'reposo') m.estado = 'persigue'
  } else if (m.estado !== 'vuelve') {
    m.estado = 'reposo'
    m.objetivo = null
  }

  let objx = 0, objy = 0
  // Trabado: ni se mueve ni pega. Dura lo que dura y se sale solo.
  if (m.trabadoHasta && ahora < m.trabadoHasta) {
    moverCuerpo(m, 0, 0, dt)
    m.x = limitar(m.x, m.radio, MUNDO_ANCHO - m.radio)
    m.y = limitar(m.y, m.radio, MUNDO_ALTO - m.radio)
    return
  }
  if (m.estado === 'vuelve') {
    const ang = Math.atan2(m.casaY - m.y, m.casaX - m.x)
    objx = Math.cos(ang) * m.vel
    objy = Math.sin(ang) * m.vel
    // Llegar a casa NO le cura: el progreso del jugador no se borra.
    if (deCasa < 24) { m.estado = 'reposo'; objx = objy = 0 }
  } else if (m.estado === 'avisa') {
    if (ahora >= m.avisandoHasta) {
      // El golpe cae ahora. Si te has apartado, falla: ese es el premio
      // de haberte movido durante el aviso.
      const j = jugadores.find(x => x.usuario === m.objetivo)
      if (j && dist(m, j) <= m.alcance + golpeableDe(j)) {
        const ang = Math.atan2(j.y - m.y, j.x - m.x)
        dañarJugadorMundo(zona, j, m, m.dmg, ang, ahora)
      } else {
        avisarZona(zona, { tipo: 'fallo', de: m.id })
      }
      m.estado = 'persigue'
      m.proxAtaque = ahora + m.cadenciaMs
    }
  } else if (m.estado === 'persigue' && cerca) {
    const tope = Math.max(m.alcance * 0.8, m.radio + cerca.radio)
    if (dcerca > tope) {
      const ang = Math.atan2(cerca.y - m.y, cerca.x - m.x)
      objx = Math.cos(ang) * m.vel
      objy = Math.sin(ang) * m.vel
    } else if (ahora >= m.proxAtaque) {
      // Anunciar. Es lo único que hace que bloquear valga para algo.
      m.estado = 'avisa'
      m.avisandoHasta = ahora + m.avisoMs
      avisarZona(zona, { tipo: 'aviso', de: m.id, ms: m.avisoMs, a: cerca.usuario })
    }
  }

  const antesX = m.x, antesY = m.y
  moverCuerpo(m, objx, objy, dt)
  // Paredes del mundo y edificios. Sin esto un bicho cruzaría la forja.
  m.x = limitar(m.x, m.radio, MUNDO_ANCHO - m.radio)
  m.y = limitar(m.y, m.radio, MUNDO_ALTO - m.radio)
  if (chocaConEstructura(zona, m.x, antesY, m.radio)) m.x = antesX
  if (chocaConEstructura(zona, m.x, m.y, m.radio)) m.y = antesY
}

function reaparecer(m, ahora) {
  m.hp = m.hpMax
  m.x = m.casaX; m.y = m.casaY
  m.vx = m.vy = m.ex = m.ey = 0
  m.estado = 'reposo'
  m.objetivo = null
  m.daños = {}
  m.ultimoGolpe = null
  m.proxAtaque = ahora
  avisarZona(m.zona, { tipo: 'aparece', id: m.id, monsterId: m.monsterId, x: m.x, y: m.y })
}

// ── Los proyectiles ────────────────────────────────────────────────
function pasoProyectilesMundo(zona, z, jugadores, ahora, dt) {
  const vivos = []
  for (const pr of z.proyectiles) {
    // prevX/prevY es lo que usa cruza() para mirar el SEGMENTO y no el
    // punto: a 480 px/s un paso son 48 px y una araña mide 32, así que
    // preguntando solo por dónde está ahora, la flecha la salta entera.
    pr.prevX = pr.x; pr.prevY = pr.y
    pr.x += Math.cos(pr.dir) * pr.vel * dt
    pr.y += Math.sin(pr.dir) * pr.vel * dt
    if (ahora > pr.muereEn) { avisarZona(zona, { tipo: 'proyectil_fin', id: pr.id }); continue }
    if (pr.x < 0 || pr.y < 0 || pr.x > MUNDO_ANCHO || pr.y > MUNDO_ALTO) {
      avisarZona(zona, { tipo: 'proyectil_fin', id: pr.id }); continue
    }
    if (chocaConEstructura(zona, pr.x, pr.y, pr.radio)) {
      avisarZona(zona, { tipo: 'proyectil_fin', id: pr.id }); continue
    }
    let chocado = false
    for (const m of z.monstruos) {
      if (m.hp <= 0) continue
      if (!cruza(pr, m.x, m.y, golpeableEn(m))) continue
      const j = jugadores.find(x => x.usuario === pr.dueño)
      if (j) dañarMonstruo(zona, j, m, pr.dmg, pr.empuje, pr.dir, ahora)
      chocado = true
      break
    }
    if (chocado) { avisarZona(zona, { tipo: 'proyectil_fin', id: pr.id }); continue }
    vivos.push(pr)
  }
  z.proyectiles = vivos
}

// ── El paso de una zona ────────────────────────────────────────────
//
// El orden es el del STEP 12 y el mismo de la arena, y no es arbitrario:
// aplicar el daño ANTES de resolver colisiones dejaba enemigos muertos
// empujando, y mover después de comprobar el invariante lo rompía justo
// después de comprobarlo.
//
//   1. intenciones  (ya depositadas por entradaMundo)
//   2. mover jugadores y monstruos, resolver colisiones
//   3. avanzar golpes en curso
//   4. mover proyectiles y resolver impactos
//   5. daño, retroceso, muertes, botín
//   6. comprobación final del invariante de cuerpos
//   7. emitir a los jugadores de la zona
function pasoZona(zona, ahora, dt) {
  const z = sembrarZona(zona)
  const jugadores = []
  for (const u of jugadoresDe(zona)) {
    const c = cuerpoDe(u)
    if (c) jugadores.push(c)
  }
  if (!jugadores.length) return false   // zona sin nadie: no se simula

  for (const m of z.monstruos) pasoMonstruo(zona, m, jugadores, ahora, dt)
  for (const j of jugadores) pasoJugador(zona, j, ahora)
  pasoProyectilesMundo(zona, z, jugadores, ahora, dt)

  // Los cuerpos no se apilan. Enemigo contra enemigo primero y el
  // jugador al final: el orden importa, porque la última separación es
  // la que gana (lo midió el STEP 8).
  const vivos = z.monstruos.filter(m => m.hp > 0)
  for (let i = 0; i < vivos.length; i++) {
    for (let k = i + 1; k < vivos.length; k++) {
      separar(vivos[i], vivos[k], vivos[i].radio, vivos[k].radio, 1, 1, MAPA_MUNDO)
    }
  }
  return true
}

// ── El bucle ───────────────────────────────────────────────────────
// Uno solo para todas las zonas. Una zona sin jugadores no se simula:
// no es una optimización, es que sin nadie delante no pasa nada que
// merezca la pena contar.
let ultimoPasoMundo = 0
function tickMundo() {
  const ahora = now()
  const dt = Math.min(0.5, (ahora - (ultimoPasoMundo || ahora - PASO_MS)) / 1000)
  ultimoPasoMundo = ahora
  if (dt <= 0) return

  const conGente = new Set()
  const t = now()
  for (const [, e] of mundo) {
    if (t - e.visto > MUNDO_OLVIDO_MS) continue
    conGente.add(e.zona)
  }
  for (const zona of conGente) {
    try { pasoZona(zona, ahora, dt) } catch (e) {
      // Una zona que revienta no puede llevarse las demás por delante.
      if (typeof audit === 'function') audit('mundo_paso_error', 'sistema', { zona, error: String(e && e.message) })
    }
  }
}
setInterval(tickMundo, PASO_MS).unref?.()

// ── Lo que ve el cliente ───────────────────────────────────────────
// Solo su zona, y solo lo que el servidor ha decidido.
function estadoMundoDe(username) {
  const e = mundo.get(username)
  if (!e) return { monstruos: [], proyectiles: [], sucesos: [] }
  // Se siembra AQUÍ además de en el paso. El primer pulso de quien entra
  // en una zona llega antes de que el bucle haya dado un solo paso, y
  // sin esto la pantalla se pintaba vacía durante los primeros 100 ms:
  // entrabas al bosque y no había nada.
  const z = sembrarZona(e.zona)
  const i = intencion.get(username) || {}
  const p = store.players[username]
  const char = p && p.character
  const v = vivoDe(username)
  return {
    t: now(),
    ack: i.seq || 0,
    zona: e.zona,
    monstruos: (z ? z.monstruos : []).filter(m => m.hp > 0).map(m => ({
      id: m.id, tipo: m.monsterId, nombre: m.nombre, icono: m.icono,
      x: Math.round(m.x), y: Math.round(m.y),
      vida: m.hp, vidaMax: m.hpMax,
      aviso: m.estado === 'avisa', estado: m.estado,
    })),
    proyectiles: (z ? z.proyectiles : []).map(pr => ({
      id: pr.id, x: Math.round(pr.x), y: Math.round(pr.y), color: pr.color,
    })),
    yo: char ? {
      hp: char.hp, maxHp: maxHpDe(char), mp: char.mp, maxMp: maxMpDe(char),
      ranura: char.hotbarSel || 0,
      golpe: v.golpe ? { arma: v.golpe.armaId, dir: v.golpe.dir, desde: v.golpe.desde, hasta: v.golpe.hasta } : null,
      bloqueando: !!v.bloqueando,
      invulnerable: now() < v.invulnerableHasta,
    } : null,
    sucesos: recogerSucesos(username),
  }
}

// Al salir de la zona o del juego: que no se quede un golpe a medias ni
// un buzón creciendo.
function olvidarDelMundoCombate(username) {
  buzon.delete(username)
  intencion.delete(username)
  vivoOlvidar(username)
}
