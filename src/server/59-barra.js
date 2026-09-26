// ═══════════════════════════════════════════════════════════════════
//  BARRA DE OBJETOS — el modelo de datos (FASE B.4 y las reglas de D.1)
//
//  Aquí NO hay endpoints: eso es la FASE D. Aquí están la forma del
//  dato, la migración de las partidas viejas y las operaciones, que son
//  funciones puras sobre el personaje y se pueden probar sin servidor.
//
//  QUÉ SE GUARDA, Y POR QUÉ ES EL itemId Y NO EL uid
//
//  El encargo dice "ids de objeto". Hay dos candidatos y la diferencia
//  importa: `equipment.weapon` guarda el uid de una fila concreta del
//  inventario, mientras que las cosas apilables (pociones) viven en una
//  sola fila con cantidad.
//
//  removeItem() BORRA la fila cuando la cantidad llega a cero
//  (30-personajes-combate.js:486). Con uid, beberse la última poción
//  mataría el uid y la ranura apuntaría a algo que ya no existe. Con
//  itemId, la ranura sigue diciendo "aquí van pociones", se pone a cero
//  y en gris, y se rellena sola al conseguir más. Que es exactamente lo
//  que pide la sección C.6.
//
//  DESVÍO DEL ENCARGO, DICHO EN VOZ ALTA
//  La sección D.1 dice que vender un objeto "vacía su ranura". C.6 dice
//  que una ranura agotada "queda en gris y se rellena sola". Son dos
//  cosas distintas y no pueden ser las dos. Me quedo con C.6 para todo:
//  la ranura RECUERDA. Vender tu espada deja la ranura en gris, no la
//  borra, y si vuelves a comprar una espada igual, vuelve. Es mejor
//  para quien juega y no tiene ningún caso raro.
//
//  QUÉ NO SE GUARDA
//  Solo `hotbar` y `ranuraActiva` viven en el personaje. El estado vivo
//  del combate (el golpe en curso, la invulnerabilidad) NO está aquí:
//  está en 59-combate-vivo.js, fuera del personaje, porque snapshotOf()
//  vuelca el personaje ENTERO (10-infra.js:108) y un campo "que no se
//  guarda" dentro de algo que se guarda es una regla que alguien romperá.
// ═══════════════════════════════════════════════════════════════════

const BARRA_RANURAS = 10

// Qué puede ir en una ranura: armas y consumibles. Ni armaduras, ni
// materiales, ni semillas. El resto se rechaza con su motivo.
//
// «Consumible» no se decide por el `type` del catálogo. Se pregunta a
// usableEnCombate() (31-turnos.js:92), que es quien ya lo decide para
// beber en el combate por turnos: tiene heal, mana o buff. Así la barra
// y el combate no pueden discrepar sobre qué es bebible, que es
// justamente lo que pasaría con dos listas paralelas. Y de paso descarta
// cosas que parecen bebida y no lo son: el Agua Pura es MATERIAL y no
// cura nada.
function puedeIrEnBarra(itemId) {
  if (!itemId || typeof itemId !== 'string') return false
  if (typeof ARMAS === 'object' && ARMAS[itemId]) return true
  const t = typeof template === 'function' ? template(itemId) : null
  if (!t) return false
  if (t.slot === 'weapon') return true
  return esConsumible(itemId)
}

function ranuraValida(n) {
  return Number.isInteger(n) && n >= 0 && n < BARRA_RANURAS
}

// ── La migración ───────────────────────────────────────────────────
// Una partida guardada de antes no trae barra. Se le hace una en el
// primer momento en que alguien la pide, no al arrancar: así da igual
// si los datos vinieron del archivo principal, de una copia de
// seguridad o de un personaje creado antes de que esto existiera.
// Es idempotente: pasar dos veces no cambia nada.
function sembrarBarra(char) {
  const barra = new Array(BARRA_RANURAS).fill(null)
  if (!char) return barra

  // Ranura 0: el arma equipada. Si no lleva ninguna, la mejor que
  // tenga en la mochila, para que nadie aparezca con las manos vacías.
  const uid = (char.equipment || {}).weapon
  const puesta = uid && (char.inventory || []).find(i => i && i.uid === uid)
  let arma = puesta && puedeIrEnBarra(puesta.itemId) ? puesta.itemId : null
  if (!arma) {
    const candidatas = (char.inventory || [])
      .filter(i => i && i.itemId && typeof ARMAS === 'object' && ARMAS[i.itemId])
      .sort((a, b) => valorDe(b.itemId) - valorDe(a.itemId))
    arma = candidatas.length ? candidatas[0].itemId : null
  }
  if (arma) barra[0] = arma

  // Ranura 9: la poción. La más floja que tenga, que es la que se
  // querría gastar primero, igual que elige el combate por turnos.
  const pociones = (char.inventory || [])
    .filter(i => i && i.quantity > 0 && esConsumible(i.itemId))
    .sort((a, b) => valorDe(a.itemId) - valorDe(b.itemId))
  if (pociones.length) barra[9] = pociones[0].itemId

  return barra
}

function valorDe(itemId) {
  const t = typeof template === 'function' ? template(itemId) : null
  return (t && t.value) || 0
}
function esConsumible(itemId) {
  return typeof usableEnCombate === 'function' ? !!usableEnCombate(itemId) : false
}

// Devuelve la barra del personaje, creándola si no la tiene. Todo el
// resto del código pasa por aquí y nadie lee char.hotbar a pelo.
function barraDe(char) {
  if (!char) return { hotbar: new Array(BARRA_RANURAS).fill(null), ranuraActiva: 0 }
  if (!Array.isArray(char.hotbar) || char.hotbar.length !== BARRA_RANURAS) {
    char.hotbar = sembrarBarra(char)
  }
  // Una barra guardada puede traer basura si alguien tocó el archivo.
  for (let i = 0; i < BARRA_RANURAS; i++) {
    if (char.hotbar[i] != null && !puedeIrEnBarra(char.hotbar[i])) char.hotbar[i] = null
  }
  if (!ranuraValida(char.ranuraActiva)) char.ranuraActiva = 0
  return { hotbar: char.hotbar, ranuraActiva: char.ranuraActiva }
}

// ── Las operaciones ────────────────────────────────────────────────
// Devuelven { error, code } como el resto del servidor. No persisten:
// de eso se encarga quien las llame, que es quien sabe si hubo cambio.

function asignarEnBarra(char, ranura, itemId) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  if (!ranuraValida(ranura)) return { error: 'Ranura fuera de la barra', code: 400 }
  const { hotbar } = barraDe(char)

  if (itemId == null) { hotbar[ranura] = null; return { hotbar, ranuraActiva: char.ranuraActiva } }
  if (typeof itemId !== 'string') return { error: 'Objeto inválido', code: 400 }
  if (!puedeIrEnBarra(itemId)) {
    return { error: 'En la barra solo caben armas y consumibles', code: 400 }
  }
  // Tiene que ser suyo. Pedir un objeto que no está en el inventario no
  // lo crea: la misma regla que el combate por turnos.
  const tiene = (char.inventory || []).some(i => i && i.itemId === itemId)
  if (!tiene) return { error: 'No tienes ese objeto', code: 400 }

  // El mismo objeto no puede estar en dos ranuras: se MUEVE.
  const antes = hotbar.indexOf(itemId)
  if (antes !== -1 && antes !== ranura) hotbar[antes] = null
  hotbar[ranura] = itemId
  return { hotbar, ranuraActiva: char.ranuraActiva }
}

function moverEnBarra(char, desde, hasta) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  if (!ranuraValida(desde) || !ranuraValida(hasta)) {
    return { error: 'Ranura fuera de la barra', code: 400 }
  }
  const { hotbar } = barraDe(char)
  const t = hotbar[desde]
  hotbar[desde] = hotbar[hasta]
  hotbar[hasta] = t
  return { hotbar, ranuraActiva: char.ranuraActiva }
}

// Cambiar de ranura NO cancela el golpe en curso: se apunta y lo aplica
// quien lleve el reloj, al terminar la recuperación. Aquí solo se
// registra la intención; el golpe vive en 59-combate-vivo.js.
function elegirRanura(char, ranura) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  if (!ranuraValida(ranura)) return { error: 'Ranura fuera de la barra', code: 400 }
  barraDe(char)
  char.ranuraActiva = ranura
  return { hotbar: char.hotbar, ranuraActiva: ranura }
}

// Qué hay en la ranura activa, resuelto contra el inventario de AHORA.
// La cantidad no se guarda: se cuenta. Así una ranura nunca miente.
function ranuraResuelta(char, ranura) {
  const { hotbar } = barraDe(char)
  const i = ranuraValida(ranura) ? ranura : char.ranuraActiva
  const itemId = hotbar[i]
  if (!itemId) return { ranura: i, itemId: null, cantidad: 0, vacia: true }
  const t = typeof template === 'function' ? template(itemId) : null
  const filas = (char.inventory || []).filter(x => x && x.itemId === itemId)
  const cantidad = filas.reduce((a, x) => a + (x.quantity || 0), 0)
  return {
    ranura: i, itemId,
    nombre: (t && t.name) || itemId,
    icono: (t && t.icon) || null,
    imagen: (t && t.imagen) || null,
    rareza: (t && t.rarity) || 'COMMON',
    // Un arma es lo que se empuña; un consumible es lo que se bebe.
    clase: (typeof ARMAS === 'object' && ARMAS[itemId]) || (t && t.slot === 'weapon') ? 'arma' : 'consumible',
    apilable: esConsumible(itemId),
    cantidad,
    // Sin existencias: se pinta en gris, pero la ranura RECUERDA.
    agotada: cantidad === 0,
    uid: (filas[0] || {}).uid || null,
  }
}

function barraResuelta(char) {
  const { ranuraActiva } = barraDe(char)
  const fuera = []
  for (let i = 0; i < BARRA_RANURAS; i++) fuera.push(ranuraResuelta(char, i))
  return { hotbar: fuera, ranuraActiva }
}
