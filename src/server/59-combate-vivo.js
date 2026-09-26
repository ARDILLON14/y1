// ═══════════════════════════════════════════════════════════════════
//  ESTADO VIVO DEL COMBATE EN EL MUNDO (FASE B.4)
//
//  El encargo lista `golpe`, `invulnerableHasta`, `ultimoCombateEn` y
//  `bloqueando` como campos del personaje, y añade que NO se guardan.
//
//  Aquí no están en el personaje, y ese es el desvío. El motivo es
//  concreto: snapshotOf() vuelca `store.players` entero
//  (10-infra.js:108). Un campo que vive dentro de algo que se guarda y
//  que "no se guarda" solo se cumple mientras alguien se acuerde de
//  quitarlo a mano, y en cuanto se olvide, un reinicio revivirá a un
//  jugador a medio golpe y con invulnerabilidad de hace tres días.
//
//  Viviendo en un Map aparte, "no se guarda" deja de ser una regla y
//  pasa a ser un hecho. Es el mismo patrón que ya usan la presencia del
//  mundo (`mundo` en 54-mundo-vivo.js) y las partidas de arena.
//
//  Y trae dos cosas gratis: reiniciar el servidor te deja FUERA de
//  combate, que es lo correcto, y quien se desconecta suelta su estado.
// ═══════════════════════════════════════════════════════════════════

const VIVO = new Map()   // username → estado vivo

// Cuánto hace falta sin dar ni recibir daño para considerarte fuera de
// combate en el mundo (sección C.7 del encargo). El ritmo de
// recuperación NO cambia: sigue en 1 % cada 1.500 ms.
const FUERA_COMBATE_MS = 5000

function vivoNuevo() {
  return {
    golpe: null,              // { ranura, inicio, desde, hasta, dirX, dirY, tocados: [] }
    invulnerableHasta: 0,
    ultimoCombateEn: 0,
    bloqueando: false,
    ranuraPedida: null,       // cambio de ranura en espera: no corta el golpe
    proxGolpe: 0,
    proxPocion: 0,
  }
}

function vivoDe(username) {
  if (!username) return vivoNuevo()
  let v = VIVO.get(username)
  if (!v) { v = vivoNuevo(); VIVO.set(username, v) }
  return v
}

function vivoOlvidar(username) { VIVO.delete(username) }

// Marca que acabas de dar o recibir daño en el mundo. Es lo único que
// mueve el reloj del descanso.
function marcarCombate(username, ahora) {
  if (!username) return
  vivoDe(username).ultimoCombateEn = Number.isFinite(ahora) ? ahora : now()
}

// ¿Peleando ahora mismo en el mundo? La condición del STEP 18 se amplía
// con esto, pero NO se sustituye: batalla por turnos, arena y mazmorra
// siguen contando, y se comprueban donde siempre (60-http.js:217).
function enCombateMundo(username, ahora) {
  const v = VIVO.get(username)
  if (!v || !v.ultimoCombateEn) return false
  const t = Number.isFinite(ahora) ? ahora : now()
  return (t - v.ultimoCombateEn) < FUERA_COMBATE_MS
}

// Limpieza: quien lleva media hora sin aparecer no necesita que le
// guardemos un golpe a medias. Sin esto el Map crece para siempre.
const VIVO_OLVIDO_MS = 30 * 60 * 1000
setInterval(() => {
  const t = now()
  for (const [u, v] of VIVO) {
    const ultimo = Math.max(v.ultimoCombateEn || 0, v.proxGolpe || 0)
    if (t - ultimo > VIVO_OLVIDO_MS) VIVO.delete(u)
  }
}, 60_000).unref?.()
