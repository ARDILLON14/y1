// ═══════════════════════════════════════════════════════════════════
//  EL MUNDO COMPARTIDO — dónde está cada jugador
//
//  QUÉ HABÍA
//  Nada. El WebSocket llevaba chat, presencia y las entradas de la
//  arena, y presencia era literalmente una lista de nombres y niveles.
//  Ni una coordenada. El mundo 2D era estrictamente de un jugador: dos
//  personas en el mismo bosque no se veían, no se cruzaban y no sabían
//  la una de la otra.
//
//  QUÉ HAY AHORA
//  El servidor lleva la posición de cada jugador y se la cuenta a los
//  que están en su misma zona. Diez veces por segundo, como la arena.
//
//  HASTA DÓNDE MANDA EL SERVIDOR, DICHO CLARO
//  El cliente propone la posición y el servidor la ACEPTA O LA CORRIGE.
//  No simula el movimiento —eso obligaría a portar al servidor las
//  colisiones con los edificios del mapa, que es otro trabajo—, pero sí
//  comprueba lo que se puede comprobar sin simular:
//
//    · que la coordenada es un número y cae dentro del mundo
//    · que la zona es una de verdad
//    · que NO te has movido más rápido de lo humanamente posible
//
//  Ese último control es el que importa. Si alguien manda un salto de
//  600 px de golpe, el servidor no lo guarda: devuelve la última
//  posición buena y el cliente se recoloca. No es lo mismo que simular,
//  y no lo vendo como tal: un cliente modificado todavía puede moverse
//  a la velocidad máxima en línea recta. Lo que ya no puede es
//  teletransportarse, que era lo que dejaba sin sentido la comprobación
//  de distancia de la recolección.
//
//  Y ESO ARREGLA OTRA COSA
//  golpearRecurso() pedía al cliente que dijera dónde estaba. Ahora el
//  servidor lo sabe, así que la comprobación de distancia deja de
//  fiarse de lo que le cuenten.
// ═══════════════════════════════════════════════════════════════════

// El mismo espacio que declaran los nodos de recurso: un solo mundo,
// unas solas coordenadas.
const MUNDO_ANCHO = MUNDO_RECURSOS.ancho
const MUNDO_ALTO = MUNDO_RECURSOS.alto

// Velocidad máxima admitida, en píxeles por segundo. El personaje anda
// a 210 en la arena y la agilidad lo sube hasta un 45%; aquí se deja un
// margen generoso porque un navegador que se congela medio segundo y
// vuelve manda un salto legítimo grande.
const MUNDO_VEL_MAX = 210 * 1.45
const MUNDO_MARGEN = 2.5        // cuánto se perdona por encima del tope
const MUNDO_SALTO_LIBRE = 90    // saltos cortos que no vale la pena pelear

// Cuánto se guarda a alguien que se calla. Si no manda nada en este
// tiempo, desaparece del mundo de los demás: es lo que evita que quede
// un muñeco clavado en mitad del pueblo.
const MUNDO_OLVIDO_MS = 8000

const mundo = new Map()   // username → { zona, x, y, dir, anim, visto, ultimoMov }

function zonaValida(z) {
  const c = zonaCanonica(z)
  return c && ZONES[c] ? c : null
}

// Lo que ve el resto de la gente. Deliberadamente corto: nombre, nivel,
// dónde está, hacia dónde mira y qué lleva puesto. Nada de inventario,
// oro ni misiones, que no son asunto de quien pasa por al lado.
function retratoDe(username, e) {
  const p = store.players[username]
  if (!p) return null
  const char = p.character
  const arma = typeof armaDe === 'function' ? armaDe(char) : null
  return {
    usuario: username,
    nombre: char.name,
    nivel: char.level,
    clase: char.class,
    x: Math.round(e.x), y: Math.round(e.y),
    dir: e.dir || 0,
    anim: e.anim || 'idle',
    aspecto: typeof aspectoDe === 'function' ? aspectoDe(char) : null,
    arma: arma ? { id: arma.id, nombre: arma.nombre, icono: arma.icono, imagen: arma.imagen } : null,
  }
}

// Dónde está alguien AHORA, según el servidor. Lo usa la recolección
// para no tener que creerse la posición que mande el cliente.
function posicionDe(username) {
  const e = mundo.get(username)
  if (!e) return null
  if (now() - e.visto > MUNDO_OLVIDO_MS) return null
  return { zona: e.zona, x: e.x, y: e.y }
}

// El cliente propone; aquí se acepta o se corrige.
//
// Devuelve siempre la posición BUENA: si la propuesta valía, es la
// suya; si no, la anterior. El cliente se recoloca con lo que reciba,
// así que un salto rechazado se ve como un tirón hacia atrás y no como
// un movimiento que no pasa nada.
function moverEnMundo(username, datos) {
  const p = store.players[username]
  if (!p) return null
  const char = p.character
  const zona = zonaValida(datos && datos.zona) || zonaCanonica(char.zonaActual || 'pueblo')
  if (!zona) return null

  const t = now()
  const previo = mundo.get(username)
  const x = Number(datos && datos.x)
  const y = Number(datos && datos.y)

  let nx, ny, corregido = false
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    nx = previo ? previo.x : MUNDO_ANCHO / 2
    ny = previo ? previo.y : MUNDO_ALTO / 2
    corregido = !!previo
  } else {
    nx = limitarMundo(x, 0, MUNDO_ANCHO)
    ny = limitarMundo(y, 0, MUNDO_ALTO)
    if (nx !== x || ny !== y) corregido = true
  }

  // El control de velocidad. Solo aplica si seguimos en la misma zona:
  // cambiar de zona es un salto legítimo, porque el mapa entero cambia.
  if (previo && previo.zona === zona) {
    const dt = Math.max(0.016, (t - (previo.ultimoMov || t)) / 1000)
    const recorrido = Math.hypot(nx - previo.x, ny - previo.y)
    const tope = Math.max(MUNDO_SALTO_LIBRE, MUNDO_VEL_MAX * MUNDO_MARGEN * dt)
    if (recorrido > tope) {
      nx = previo.x; ny = previo.y
      corregido = true
    }
  }

  const e = {
    zona, x: nx, y: ny,
    dir: Number.isFinite(Number(datos && datos.dir)) ? Number(datos.dir) : (previo ? previo.dir : 0),
    anim: typeof (datos && datos.anim) === 'string' ? String(datos.anim).slice(0, 12) : 'idle',
    visto: t,
    ultimoMov: t,
  }
  mundo.set(username, e)
  return { x: e.x, y: e.y, zona, corregido }
}

function limitarMundo(v, min, max) { return v < min ? min : v > max ? max : v }

// Quiénes están en la misma zona, sin contarte a ti.
function vecinosDe(username) {
  const yo = mundo.get(username)
  if (!yo) return []
  const t = now()
  const fuera = []
  for (const [otro, e] of mundo) {
    if (otro === username) continue
    if (e.zona !== yo.zona) continue
    if (t - e.visto > MUNDO_OLVIDO_MS) continue
    const r = retratoDe(otro, e)
    if (r) fuera.push(r)
  }
  return fuera
}

function salirDelMundo(username) { mundo.delete(username) }

// Limpieza de los que se fueron sin avisar. Sin esto, cerrar la pestaña
// dejaba tu muñeco de pie en el pueblo para siempre.
setInterval(() => {
  const t = now()
  for (const [u, e] of mundo) if (t - e.visto > MUNDO_OLVIDO_MS) mundo.delete(u)
}, 4000).unref?.()
