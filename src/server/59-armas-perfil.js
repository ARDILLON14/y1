// ═══════════════════════════════════════════════════════════════════
//  PERFIL DE ARMA — lo que la FASE B pide, SIN un catálogo paralelo
//
//  El encargo propone añadir al catálogo `tipoUso`, `alcance`, `arco`,
//  `retroceso`, `autoGolpe`, `proyectil` y `costeMp`. La auditoría
//  (docs/AUDITORIA_COMBATE_V32.md) encontró que cinco de los siete YA
//  ESTÁN, con otros nombres y otras unidades, medidos y cuadrados
//  contra el precio de cada arma:
//
//      encargo        lo que hay        dónde
//      ───────────────────────────────────────────────────────
//      alcance        alcance           ARMAS, 58-arena.js:217
//      arco           arco              ídem, pero RADIANES y SEMI
//      retroceso      empuje            ídem, y es un impulso, no px
//      proyectil      proyectil         ídem
//      tipoUso        gesto + proyectil ídem, repartido en dos
//      autoGolpe      —                 no existe
//      costeMp        —                 no existe
//
//  Añadir los siete campos otra vez crearía un tercer catálogo que se
//  desincroniza, que es exactamente lo que el comentario de
//  58-arena.js:239 dice que no se haga. Así que esto NO declara armas:
//  las lee y completa lo que falta.
//
//  REGLA DE PRECEDENCIA (decisión D1 de la auditoría):
//      ARMAS  >  lo que declare el objeto  >  el defecto de su tipo
//  O sea: ningún arma que ya existe cambia de nada. Los valores por
//  defecto de la sección B.2 del encargo solo se aplican a un arma que
//  NO tenga entrada en ARMAS, que hoy no hay ninguna.
// ═══════════════════════════════════════════════════════════════════

// ── Unidades, dichas en voz alta (decisión D2) ─────────────────────
// `arco` es la SEMI-apertura EN RADIANES: resolverGolpe compara
// `dif > arma.arco` con dif entre 0 y π. O sea que arco 1.6 es un
// barrido de 183°, no de 1,6°, y desde luego no de 1,6 grados totales.
//
// Leer "arco: 120" como el valor del campo serían 120 RADIANES: el arma
// acertaría en cualquier dirección, incluso a la espalda. Por eso las
// dos conversiones viven aquí y en ningún otro sitio.
function arcoAGrados(radianesSemi) { return radianesSemi * 2 * 180 / Math.PI }
function gradosAArco(gradosTotales) { return (gradosTotales / 2) * Math.PI / 180 }

// La invulnerabilidad tras encajar un golpe (decisión D4). Ya existía en
// la arena con este valor; el mundo usará el MISMO, leído de aquí. Dos
// números distintos para lo mismo es cómo empiezan a separarse dos
// sistemas que deberían sentirse igual.
const INVULN_MS = 450

// ── Los cuatro tipos ───────────────────────────────────────────────
// No es un campo nuevo: se deduce de lo que el arma ya declara.
//   proyectil con elemento  → magia
//   proyectil sin elemento  → arco
//   gesto 'estocada'        → lanza
//   todo lo demás           → espada
function tipoUsoDe(a) {
  if (!a) return 'espada'
  if (a.proyectil) return a.proyectil.element ? 'magia' : 'arco'
  if (a.gesto === 'estocada') return 'lanza'
  return 'espada'
}

// Valores por defecto de la sección B.2, traducidos a las unidades de
// verdad. SOLO se usan para un arma sin entrada en ARMAS.
//
// El `arco` sale de convertir los grados del encargo: 120° totales son
// 1,047 rad de semi-apertura, y 30° son 0,262. El `empuje` NO es el
// "retroceso en px" del encargo —son unidades distintas— así que se
// toma la mediana de las armas reales de cada tipo, que es el único
// número que no me estoy inventando.
const POR_TIPO = {
  espada: { alcance: 56, arco: gradosAArco(120), cadenciaMs: 460, dmg: 1.0, empuje: 150, autoGolpe: true, costeMp: 0 },
  lanza:  { alcance: 80, arco: gradosAArco(30),  cadenciaMs: 440, dmg: 1.0, empuje: 120, autoGolpe: true, costeMp: 0 },
  arco:   { alcance: 340, arco: gradosAArco(23), cadenciaMs: 560, dmg: 1.0, empuje: 55,  autoGolpe: true, costeMp: 0,
            proyectil: { vel: 480, radio: 6, vidaMs: 1200 } },
  magia:  { alcance: 320, arco: gradosAArco(34), cadenciaMs: 520, dmg: 1.0, empuje: 80,  autoGolpe: true, costeMp: 0,
            proyectil: { vel: 360, radio: 8, vidaMs: 1500, element: 'ice' } },
}

// Cuántos proyectiles vivos puede tener un jugador a la vez. El encargo
// pide 8 por tipo; aquí es 8 en total, que es más fácil de defender: el
// tope existe para que nadie ahogue el paso del servidor, y al paso le
// da igual de qué tipo sea cada uno.
const PROYECTILES_MAX = 8

// ── El perfil completo ─────────────────────────────────────────────
// Se apoya en armaVista(), que ya junta ARMAS con lo visual del
// catálogo. Aquí solo se añade lo que falta y se rellenan los huecos.
function perfilDeArma(id) {
  const vista = typeof armaVista === 'function' ? armaVista(id) : null
  if (!vista) return null

  // Un arma que no está en ARMAS: armaVista le presta los números de
  // los puños. En ese caso, y SOLO en ese caso, mandan los defectos de
  // su tipo, y el tipo lo dice el objeto.
  const conocida = typeof ARMAS === 'object' && !!ARMAS[id]
  const t = (typeof template === 'function' && template(id)) || null
  const dicho = (t && t.combate) || {}
  const tipoUso = dicho.tipoUso || tipoUsoDe(conocida ? vista : dicho)
  const def = POR_TIPO[tipoUso] || POR_TIPO.espada

  const elegir = (campo) => {
    if (conocida && vista[campo] !== undefined) return vista[campo]
    if (dicho[campo] !== undefined) return dicho[campo]
    return def[campo]
  }

  const perfil = {
    ...vista,
    tipoUso,
    alcance: elegir('alcance'),
    arco: elegir('arco'),
    cadenciaMs: elegir('cadenciaMs'),
    dmg: elegir('dmg'),
    empuje: elegir('empuje'),
    proyectil: conocida ? vista.proyectil : (dicho.proyectil || def.proyectil || null),
    // Los dos campos que sí son nuevos. Por defecto se puede mantener
    // pulsado —es lo que pide el encargo— y ningún arma gasta maná, que
    // es como está hoy el juego: cambiarlo movería el equilibrio.
    autoGolpe: dicho.autoGolpe !== undefined ? !!dicho.autoGolpe : def.autoGolpe,
    costeMp: Number.isFinite(dicho.costeMp) ? Math.max(0, Math.round(dicho.costeMp)) : def.costeMp,
  }
  perfil.tipo = perfil.proyectil ? 'ranged' : 'melee'
  // Cortesía para quien lea el perfil desde fuera y piense en grados.
  perfil.arcoGrados = arcoAGrados(perfil.arco)
  return perfil
}

// El perfil del arma que lleva puesta un personaje.
//
// Se llama perfilArmaDe y no perfilDe porque perfilDe YA EXISTE: es el
// que sirve /api/profile (45-primeros-pasos.js:120). Como todo el
// servidor se concatena en un archivo, declarar otra funcion con ese
// nombre no da error: la pisa. Lo hice, y /api/profile empezo a
// devolver el arma equipada en vez del perfil del jugador.
//
// El guardia del principio no sobra: armaDe() lee char.equipment sin
// mirar si hay personaje, y desde la arena siempre lo hay. Desde aquí no
// necesariamente, y un perfil de arma no es sitio para que se caiga una
// petición. Sin personaje, puños.
function perfilArmaDe(char) {
  if (!char || typeof char !== 'object') return perfilDeArma('puños')
  const a = typeof armaDe === 'function' ? armaDe(char) : null
  return a ? perfilDeArma(a.id) : perfilDeArma('puños')
}

// Cuántas armas de cada tipo se pueden usar hoy con el catálogo real.
// Lo pregunta la sección B.3 del encargo, y lo contesta el catálogo, no
// yo: si mañana se añade una lanza, esto lo dice solo.
function inventarioDeTipos() {
  const fuera = { espada: [], lanza: [], arco: [], magia: [] }
  if (typeof ARMAS !== 'object') return fuera
  for (const id of Object.keys(ARMAS)) {
    const p = perfilDeArma(id)
    if (p && fuera[p.tipoUso]) fuera[p.tipoUso].push(id)
  }
  return fuera
}
