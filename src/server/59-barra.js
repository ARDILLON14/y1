// ═══════════════════════════════════════════════════════════════════
//  LA BARRA DE OBJETOS — una sola, para la recolección y el combate
//
//  DOS SISTEMAS QUE ERAN UNO
//  La barra nació en 48-recursos-mundo.js para la recolección: acceso
//  rápido al hacha y al pico. Ocho ranuras que guardaban el `uid` de una
//  fila del inventario. Tiene endpoints, la usa el cliente y la prueban
//  test-recursos y test-autoridad-servidor.
//
//  En la FASE B del encargo de combate escribí una segunda sin ver la
//  primera, sobre EL MISMO campo `char.hotbar`: diez ranuras con itemId.
//  No reventó nada porque la mía nacía inerte —nadie la llamaba— pero
//  era una mina: en cuanto la FASE D la hubiera conectado, un sistema
//  habría dejado el array de 8 uids y el otro lo habría rehecho de 10
//  itemId, en bucle, en cada petición. Mi auditoría no lo vio.
//
//  LO QUE GANA DE CADA UNA
//
//  · De la vieja, que la barra vale para TODO lo que tengas: semillas,
//    el hacha, el pico. No es la barra de combate, es la de acceso
//    rápido, y esa es su razón de existir. La sección D.1 del encargo
//    dice "solo armas y consumibles"; eso rompería la recolección, así
//    que lo que se restringe es el USO en combate, no lo que cabe.
//  · De la nueva, que se guarde el itemId y no el uid. removeItem()
//    borra la fila del inventario al llegar a cero, así que con uid la
//    última poción se lleva la ranura por delante. Con itemId la ranura
//    recuerda, se pone en gris y se rellena sola: la sección C.6.
//  · Y del encargo, las diez ranuras en vez de ocho.
//
//  COMPATIBILIDAD
//  Las partidas guardadas traen ocho uids. Se migran una vez, mapeando
//  cada uid a su itemId y añadiendo dos ranuras vacías al final. Los
//  endpoints siguen aceptando uid y devolviendo exactamente la misma
//  forma, así que ni el cliente ni las pruebas de recolección se
//  enteran de nada.
// ═══════════════════════════════════════════════════════════════════

const HOTBAR_RANURAS = 10

function ranuraValida(n) { return Number.isInteger(n) && n >= 0 && n < HOTBAR_RANURAS }

// Qué cabe en una ranura: cualquier cosa que tengas de verdad. Un uid o
// un itemId, porque los endpoints viejos mandan uid.
function resolverReferencia(char, ref) {
  if (!ref || typeof ref !== 'string') return null
  const porUid = (char.inventory || []).find(i => i && i.uid === ref)
  if (porUid) return porUid.itemId
  const porItem = (char.inventory || []).some(i => i && i.itemId === ref)
  return porItem ? ref : null
}

// Y qué se puede USAR desde la barra peleando: armas y consumibles. Lo
// de «consumible» lo decide usableEnCombate() (31-turnos.js), que es
// quien ya lo decide para beber en el combate por turnos, para que la
// barra y el combate no puedan discrepar. El Agua Pura es MATERIAL y no
// cura: parece bebida y no lo es.
function esConsumible(itemId) {
  return typeof usableEnCombate === 'function' ? !!usableEnCombate(itemId) : false
}
function esArma(itemId) {
  if (typeof ARMAS === 'object' && ARMAS[itemId]) return true
  const t = typeof template === 'function' ? template(itemId) : null
  return !!t && t.slot === 'weapon'
}
function usableDesdeLaBarra(itemId) { return esArma(itemId) || esConsumible(itemId) }

// ── La migración ───────────────────────────────────────────────────
function valorDe(itemId) {
  const t = typeof template === 'function' ? template(itemId) : null
  return (t && t.value) || 0
}

// Ranura 0: el arma equipada, o la mejor que lleve encima. Ranura 9: la
// poción más floja, que es la que se querría gastar primero, igual que
// elige el combate por turnos. Así nadie aparece con las manos vacías.
function sembrarBarra(char) {
  const barra = new Array(HOTBAR_RANURAS).fill(null)
  if (!char) return barra
  const uid = (char.equipment || {}).weapon
  const puesta = uid && (char.inventory || []).find(i => i && i.uid === uid)
  let arma = puesta && esArma(puesta.itemId) ? puesta.itemId : null
  if (!arma) {
    const cand = (char.inventory || []).filter(i => i && esArma(i.itemId))
      .sort((a, b) => valorDe(b.itemId) - valorDe(a.itemId))
    arma = cand.length ? cand[0].itemId : null
  }
  if (arma) barra[0] = arma
  const pociones = (char.inventory || [])
    .filter(i => i && i.quantity > 0 && esConsumible(i.itemId))
    .sort((a, b) => valorDe(a.itemId) - valorDe(b.itemId))
  if (pociones.length) barra[9] = pociones[0].itemId
  return barra
}

// Devuelve la barra, migrándola y saneándola. Todo lo demás pasa por
// aquí: nadie lee char.hotbar a pelo.
function hotbarDe(char) {
  if (!char) return new Array(HOTBAR_RANURAS).fill(null)
  if (!Array.isArray(char.hotbar)) {
    char.hotbar = sembrarBarra(char)
    return char.hotbar
  }
  // Una barra guardada de antes: ocho ranuras con uids. Se traduce cada
  // uid a su itemId y se alarga a diez. Un uid que ya no existe se
  // pierde, porque de un uid muerto no se puede sacar qué había.
  const fuera = new Array(HOTBAR_RANURAS).fill(null)
  for (let i = 0; i < Math.min(char.hotbar.length, HOTBAR_RANURAS); i++) {
    const v = char.hotbar[i]
    if (typeof v !== 'string' || !v) continue
    const porUid = (char.inventory || []).find(x => x && x.uid === v)
    if (porUid) { fuera[i] = porUid.itemId; continue }
    // Ya es un itemId, y solo se conserva si es un objeto de verdad.
    if (typeof template === 'function' && template(v)) fuera[i] = v
  }
  char.hotbar = fuera
  if (!ranuraValida(char.hotbarSel)) char.hotbarSel = 0
  return char.hotbar
}

// ── Lo que ve el cliente ───────────────────────────────────────────
// La misma forma de siempre: `ranuras` y `seleccionada`. La cantidad no
// se guarda, se CUENTA contra el inventario de ahora, así que una
// ranura nunca miente.
function ranuraResuelta(char, i) {
  if (!char) return null
  const barra = hotbarDe(char)
  const itemId = barra[i]
  if (!itemId) return null
  const t = (typeof template === 'function' && template(itemId)) || {}
  const filas = (char.inventory || []).filter(x => x && x.itemId === itemId)
  const cantidad = filas.reduce((a, x) => a + (x.quantity || 0), 0)
  const uid = (filas[0] || {}).uid || null
  return {
    uid, itemId,
    nombre: t.name || itemId, icono: t.icon || null, imagen: t.imagen || null,
    rareza: t.rarity || 'COMMON', tipo: t.type || null,
    cantidad,
    equipable: !!t.slot, slot: t.slot || null,
    consumible: esConsumible(itemId),
    arma: esArma(itemId),
    usableEnCombate: usableDesdeLaBarra(itemId),
    equipado: uid ? isEquipped(char, uid) : false,
    durabilidad: (filas[0] || {}).durabilidad != null ? filas[0].durabilidad : null,
    // Sin existencias: se pinta en gris, pero la ranura RECUERDA. Antes
    // se borraba sola y beberte la última poción te vaciaba el hueco.
    agotada: cantidad === 0,
  }
}

function verHotbar(char) {
  if (!char) return { ranuras: new Array(HOTBAR_RANURAS).fill(null), seleccionada: 0 }
  const barra = hotbarDe(char)
  return {
    ranuras: barra.map((_, i) => ranuraResuelta(char, i)),
    seleccionada: char.hotbarSel || 0,
  }
}

function ponerEnHotbar(char, ranura, ref) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  const r = ranuraValida(ranura) ? ranura : null
  if (r === null) return { error: 'Ranura inválida', code: 400 }
  hotbarDe(char)
  if (ref === null || ref === undefined || ref === '') {
    char.hotbar[r] = null
    persist()
    return { success: true, hotbar: verHotbar(char) }
  }
  const itemId = resolverReferencia(char, ref)
  if (!itemId) return { error: 'Ese objeto no está en tu inventario', code: 404 }
  // Un mismo objeto no puede ocupar dos ranuras: se mueve.
  char.hotbar = char.hotbar.map(x => (x === itemId ? null : x))
  char.hotbar[r] = itemId
  persist()
  return { success: true, hotbar: verHotbar(char) }
}

function seleccionarRanura(char, ranura) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  if (!ranuraValida(ranura)) return { error: 'Ranura inválida', code: 400 }
  hotbarDe(char)
  const antes = char.hotbarSel || 0
  char.hotbarSel = ranura
  const res = ranuraResuelta(char, ranura)

  // LA RANURA ACTIVA CON UN ARMA *ES* EL ARMA EQUIPADA (sección D.1).
  // No es un detalle de interfaz: armaDe() lee char.equipment.weapon, así
  // que sin esto elegir la ranura de la espada cambiaría el icono y no el
  // daño, que es exactamente el fallo que el STEP 1 arregló en el mundo.
  //
  // Si la ranura está vacía, o tiene algo que no es arma, el arma que
  // llevas puesta SIGUE puesta: quedarse en calzoncillos por elegir la
  // ranura de las pociones no lo espera nadie.
  let equipo = null
  if (res && res.arma && res.uid && !res.agotada) {
    const r = equiparObjeto(char, res.uid)
    if (!r.error) equipo = r
  }

  if (antes !== ranura && res && res.arma && typeof step === 'function') {
    step(char.name, 'first_hotbar_switch')
  }
  persist()
  const fuera = { success: true, seleccionada: ranura, hotbar: verHotbar(char) }
  if (equipo) { fuera.equipment = equipo.equipment; fuera.stats = equipo.stats; fuera.hp = equipo.hp; fuera.mp = equipo.mp }
  return fuera
}

// ── Mover y asignar, que es lo que pide la sección D.1 ─────────────
function moverEnHotbar(char, desde, hasta) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  if (!ranuraValida(desde) || !ranuraValida(hasta)) {
    return { error: 'Ranura inválida', code: 400 }
  }
  hotbarDe(char)
  const t = char.hotbar[desde]
  char.hotbar[desde] = char.hotbar[hasta]
  char.hotbar[hasta] = t
  // Mover puede cambiar lo que hay bajo la ranura activa, y con ello el
  // arma equipada. Se vuelve a elegir la misma para que cuadren.
  const sel = ranuraValida(char.hotbarSel) ? char.hotbarSel : 0
  if (sel === desde || sel === hasta) return seleccionarRanura(char, sel)
  persist()
  return { success: true, hotbar: verHotbar(char) }
}

// ── Para el combate en tiempo real ─────────────────────────────────
// Qué hay en la ranura elegida, ya resuelto. Devuelve siempre algo, con
// `vacia` y `agotada` dichos, para que quien lo use no tenga que
// comprobar nulos.
function ranuraActivaDe(char) {
  const i = ranuraValida(char && char.hotbarSel) ? char.hotbarSel : 0
  const r = ranuraResuelta(char, i)
  if (!r) return { ranura: i, itemId: null, vacia: true, agotada: true, clase: null }
  return {
    ...r, ranura: i, vacia: false,
    clase: r.arma ? 'arma' : (r.consumible ? 'consumible' : 'otro'),
  }
}

// Elegir ranura sin pasar por el endpoint: lo usa el pulso del mundo.
function elegirRanura(char, ranura) {
  if (!char) return { error: 'Sin personaje', code: 400 }
  return seleccionarRanura(char, ranura)
}
