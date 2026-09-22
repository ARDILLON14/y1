
// ═══════════════════════════════════════════════════════════════════
//  ARENA — COMBATE EN TIEMPO REAL
//
//  El combate por turnos se queda como está: sirve para aprender y
//  para farmear al principio. Esto es lo otro: pelear moviéndose.
//
//  DÓNDE VIVE LA SIMULACIÓN
//  Toda en el servidor, en pasos fijos de 100 ms. El cliente manda
//  ÚNICAMENTE intenciones ("me muevo hacia aquí", "ataco", "esquivo") y
//  recibe el estado para dibujarlo. No puede declarar daño, ni muertes,
//  ni botín: si lo intenta, el mensaje se ignora.
//
//  Es la misma regla que el resto del juego, solo que a 10 pasos por
//  segundo en lugar de una acción por clic.
//
//  QUÉ SE SIMULA
//  Posición, velocidad, colisiones circulares, alcance y arco de los
//  ataques, proyectiles con vida limitada, retroceso, enfriamientos,
//  invulnerabilidad breve tras recibir un golpe, y tres conductas de
//  enemigo distintas.
//
//  DE DÓNDE SALEN LOS NÚMEROS
//  Del personaje real: estadísticas efectivas (con el equipo puesto),
//  el arma equipada decide alcance, cadencia y si dispara. Las
//  recompensas usan las mismas tablas de botín y la misma función de
//  subida de nivel que el combate por turnos.
// ═══════════════════════════════════════════════════════════════════

// ── Física del movimiento ──────────────────────────────────────────
// Cada cuerpo lleva DOS velocidades y se suman para moverlo:
//
//   vx, vy   lo que pides tú (o la IA). Persigue una velocidad
//            objetivo y nunca la pasa: por eso `vel` significa de
//            verdad "píxeles por segundo" y la agilidad se nota.
//   ex, ey   lo que te hacen. Retrocesos, embestidas, empujones al
//            chocar. No obedece a nadie: sale disparado y se apaga.
//
// Antes había una sola velocidad para todo, y eso tenía dos
// consecuencias feas. Una: al recibir un golpe bastaba con seguir
// pulsando la dirección contraria para cancelar el retroceso, así que
// el `empuje` de las armas era casi decorativo. Otra: el rozamiento
// (×0,82) se aplicaba UNA VEZ POR TICK en vez de por segundo, así que
// la velocidad real dependía de si el servidor iba fino o cargado, y
// el tope acababa siendo ~765 px/s con una `vel` nominal de 210. El
// número de la ficha no describía nada.
const ARENA_TICK_MS = 100
const ACEL = 14          // 1/s: cuánto tarda en alcanzar la velocidad pedida
const ROCE_IMPULSO = 6   // 1/s: cuánto tarda en apagarse un empujón
const SEPARACION = 260   // px/s: con cuánta fuerza se despegan dos cuerpos

// Fracción que sobrevive tras `dt` segundos con una caída de ritmo k.
// Es lo que hace que la física no cambie porque un tick llegue tarde.
function decaimiento(k, dt) { return Math.exp(-k * dt) }

// Mueve un cuerpo: persigue lo que pide, arrastra lo que le hacen.
function moverCuerpo(c, objx, objy, dt) {
  const k = 1 - decaimiento(ACEL, dt)
  c.vx += (objx - c.vx) * k
  c.vy += (objy - c.vy) * k
  const r = decaimiento(ROCE_IMPULSO, dt)
  c.ex = (c.ex || 0) * r
  c.ey = (c.ey || 0) * r
  c.x += (c.vx + c.ex) * dt
  c.y += (c.vy + c.ey) * dt
}

// Mueve un cuerpo sin dejarlo salir del mapa y devuelve lo que no cupo,
// para que quien lo empujaba sepa cuánto tiene que apartarse él.
function apartar(c, r, dx, dy) {
  const nx = limitar(c.x + dx, r, ARENA_ANCHO - r)
  const ny = limitar(c.y + dy, r, ARENA_ALTO - r)
  const sobra = { x: (c.x + dx) - nx, y: (c.y + dy) - ny }
  c.x = nx; c.y = ny
  return sobra
}

// Un golpe, un choque, una embestida. Va al carril de impulsos para
// que no se pueda cancelar simplemente andando en sentido contrario.
function impulsar(c, ang, fuerza) {
  c.ex = (c.ex || 0) + Math.cos(ang) * fuerza
  c.ey = (c.ey || 0) + Math.sin(ang) * fuerza
}

// Dos cuerpos no pueden ocupar el mismo sitio. Se separan empujándose,
// no teletransportándose: así un enemigo que te acorrala te desplaza en
// vez de meterse dentro de ti, y la manada deja de apilarse en un punto.
// El peso decide quién cede: el jugador aguanta más que una araña.
function separar(a, b, ra, rb, pesoA, pesoB) {
  const dx = b.x - a.x, dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  const min = ra + rb
  if (d >= min) return
  // Exactamente encima: se elige una dirección cualquiera y se salvan.
  const ang = d > 0.01 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2
  const hueco = min - (d > 0.01 ? d : 0)
  const total = pesoA + pesoB
  const cx = Math.cos(ang), cy = Math.sin(ang)

  // Se separan DE VERDAD, moviéndolos. Solo con impulsos no bastaba: un
  // enemigo que empuja hacia ti todo el rato gana al empujón y se te
  // acaba metiendo dentro. El reparto va por peso, así que la araña
  // cede casi todo y el jugador casi nada.
  //
  // Y lo que uno no puede ceder, lo cede el otro. Acorralado contra la
  // pared, el jugador no tiene hacia dónde apartarse: antes la
  // separación lo sacaba del mapa, el límite lo devolvía dentro, y el
  // enemigo se quedaba metido en él. Ahora el resto que no cabe se lo
  // come el enemigo, que sí tiene sitio.
  const sobra = apartar(a, ra, -cx * hueco * (pesoB / total), -cy * hueco * (pesoB / total))
  apartar(b, rb, cx * hueco * (pesoA / total) - sobra.x, cy * hueco * (pesoA / total) - sobra.y)

  // Y además un empujón, que es lo que hace que chocar se NOTE en vez
  // de parecer que los cuerpos se deslizan pegados.
  const fuerza = SEPARACION * (hueco / min)
  impulsar(a, ang + Math.PI, fuerza * (pesoB / total))
  impulsar(b, ang, fuerza * (pesoA / total))
}
const ARENA_ANCHO = 900
const ARENA_ALTO = 600
const ARENA_MAX_SEGUNDOS = 300

// ── Las dos escalas de la arena ────────────────────────────────────
//
// El mismo bicho vale para los dos combates, pero no puede traer los
// mismos números: en turnos pega UNA VEZ POR TURNO y aquí pega todo el
// rato. Sin bajarle algo, un esqueleto de las tablas te haría papilla
// en dos segundos. Estas dos escalas son las que traducen de un combate
// al otro, y son los dos números más importantes del tiempo real:
//
//   vida      cuánto aguanta un enemigo aquí respecto a su ficha
//   daño      cuánto pega aquí respecto a su ficha
//   seguimiento  cuánto sigue el enemigo al jugador según este crece
//
// Estaban escritas a mano dentro de crearEnemigo, metidas en un
// Math.round donde no se veían. Ahí no había forma de contestar a "¿y
// si la arena está demasiado fácil?" sin releer la función entera.
// Aquí tienen nombre, y el banco de pruebas puede moverlas para medir
// qué pasa antes de dejar puesto un valor.
//
// Es un objeto y no dos constantes sueltas para poder pasárselo entero
// a quien las necesite, y porque así el banco las cambia sin tocar el
// juego.
// Los valores salen del barrido de banco-balance.js, no de mi criterio.
// Antes: vida 0.55 · daño 0.35 · sin seguimiento real (4% por nivel).
// Con aquello, las tres arenas se ganaban el 100% de las veces perdiendo
// entre el 0% y el 10% de la vida, y el Patio de las Ruinas se limpiaba
// en 11 segundos sin un rasguño.
//
//   node banco-balance.js --barrido     vuelve a buscar
//   node banco-balance.js --arenas      comprueba cómo quedó
const ESCALA_ARENA = { vida: 1.4, daño: 0.65, seguimiento: 1 }

// referenciaDeNivel() y seguimientoDe() viven en
// 30-personajes-combate.js, con CLASSES: son un hecho sobre personajes
// y los usan los dos combates. Aquí solo se les pasa ESCALA_ARENA.

// Armas: lo que cambia de verdad al equiparse otra cosa.
//   alcance   distancia útil del golpe
//   arco      amplitud del barrido, en radianes
//   cadenciaMs entre golpes
//   proyectil si dispara en vez de golpear de cerca
//
// ── DE DÓNDE SALEN LOS `dmg` ───────────────────────────────────────
//
// No de mi criterio. El juego YA dice lo que vale cada arma: su precio
// en ITEM_TEMPLATES.value. Eso es la declaración de intenciones del
// diseño, y lo que un arma rinde debería seguirla.
//
// Lo que rinde de verdad es dmg ÷ cadencia, no el `dmg` suelto: una
// daga de 1.0 cada 300 ms pega más por segundo que una espada de 1.1
// cada 520. Midiendo eso contra el precio salió esta curva:
//
//     rendimiento = 2,15 + 0,06 × √precio        (×0,75 si dispara)
//
// Y la curva pasa CLAVADA por los puños, la Lanza de Hierro, la Vara de
// Cristal, la Espada de Hierro y la de Diamante. O sea: no me la he
// inventado, estaba ya dentro del juego. Las armas que se salían eran
// las que estaban mal, y eran ocho.
//
// Lo que arreglaba, medido con banco-balance.js:
//   · los PUÑOS pegaban más por segundo que la Espada de Piedra y que
//     el Garrote. Craftear tu primera arma te hacía más débil.
//   · la Daga de Hierro, que viene DE FÁBRICA, ganaba a seis armas de
//     tiers superiores, entre ellas el Cetro del Trueno de 2.800 de oro.
//   · el Arco Corto quedaba por debajo de pelear a puñetazos.
//
// El ×0,75 de las armas a distancia es un juicio, y lo digo: quien
// dispara no recibe casi nada —en las medidas termina con el 100% de
// la vida—, y eso vale un descuento en daño.
//
// ── Y DE DÓNDE SALEN LOS `alcance` ─────────────────────────────────
//
// Un arma lenta te tiene más rato plantado delante del bicho, y el
// bicho aprovecha. Lo que compensa eso es el alcance: poder pegarle
// desde donde él no llega. O sea que alcance y cadencia van juntos.
//
// Mirando alcance÷cadencia, las armas del juego se partían en dos
// grupos limpios: seis entre 0,154 y 0,218, y cuatro en 0,110-0,115.
// Los cuatro de abajo eran los PUÑOS —que deben ser malos— y el
// Garrote, la Espada de Piedra y el Hacha. Otra vez las mismas.
//
// Lo que se veía jugando, medido a nivel 3 en el Claro del Bosque:
//   · con la Daga de fábrica ganabas el 100% y acababas al 42%
//   · con la Espada de Piedra, que pega casi el doble, ganabas el 88%
//     y acababas al 11%
// Pegaba más fuerte y te dejaba medio muerto, porque entre golpe y
// golpe te comías 520 ms de mordiscos a 60 px del bicho.
//
// Los tres se han acercado a 0,15 haciéndolos algo más rápidos y algo
// más largos, BAJANDO el `dmg` a la vez para que su rendimiento siga
// exactamente donde lo puso la curva de precios. No son más fuertes:
// reparten lo mismo de otra forma.
const ARMAS = {
  puños:         { nombre: 'Puños',            alcance: 46,  arco: 1.4, cadenciaMs: 420, dmg: 0.9, empuje: 90 },
  dagger:        { nombre: 'Daga de Hierro',   alcance: 54,  arco: 1.1, cadenciaMs: 300, dmg: 0.8, empuje: 80, gesto: 'pinchazo' },
  sword_alba:    { nombre: 'Espada del Alba',  alcance: 74,  arco: 1.6, cadenciaMs: 480, dmg: 1.6, empuje: 160 },
  // Sin estas tres entradas, armaDe() devolvería 'puños' y la espada
  // equipada no cambiaría nada al pelear: pura decoración.
  espada_piedra:   { nombre: 'Espada de Piedra',   alcance: 70 , arco: 1.5, cadenciaMs: 460, dmg: 1.24, empuje: 130 },
  espada_hierro:   { nombre: 'Espada de Hierro',   alcance: 72, arco: 1.6, cadenciaMs: 460, dmg: 1.6, empuje: 165 },
  espada_diamante: { nombre: 'Espada de Diamante', alcance: 84, arco: 1.7, cadenciaMs: 400, dmg: 2.1, empuje: 205 },
  wood_club:     { nombre: 'Garrote de Roble',  alcance: 68 , arco: 1.5, cadenciaMs: 450, dmg: 1.15, empuje: 130, gesto: 'tajo_alto' },
  iron_axe:      { nombre: 'Hacha de Leñador',  alcance: 76 , arco: 1.3, cadenciaMs: 500, dmg: 1.49, empuje: 180, gesto: 'tajo_alto' },
  iron_spear:    { nombre: 'Lanza de Hierro',   alcance: 96,  arco: 0.5, cadenciaMs: 440, dmg: 1.4, empuje: 120, gesto: 'estocada' },
  short_bow:     { nombre: 'Arco Corto',        alcance: 340, arco: 0.2, cadenciaMs: 560, dmg: 1.2, empuje: 50, proyectil: { vel: 400, radio: 5, vidaMs: 1100 } },
  crystal_wand:  { nombre: 'Vara de Cristal',   alcance: 320, arco: 0.3, cadenciaMs: 520, dmg: 1.3, empuje: 80, proyectil: { vel: 360, radio: 8, vidaMs: 1200, element: 'ice' } },
  frost_blade:   { nombre: 'Filo Escarchado',   alcance: 80,  arco: 1.5, cadenciaMs: 400, dmg: 1.8, empuje: 170 },
  elven_bow:     { nombre: 'Arco Élfico',      alcance: 420, arco: 0.2, cadenciaMs: 520, dmg: 1.6, empuje: 60, proyectil: { vel: 460, radio: 6, vidaMs: 1200 } },
  thunder_staff: { nombre: 'Cetro del Trueno', alcance: 380, arco: 0.3, cadenciaMs: 620, dmg: 2.5, empuje: 110, proyectil: { vel: 380, radio: 9, vidaMs: 1400, element: 'lightning' } },
}
// Una sola verdad por arma, repartida en dos sitios a propósito:
//   ARMAS            cómo pega   (alcance, arco, cadencia, empuje)
//   ITEM_TEMPLATES   cómo se ve  (nombre, icono, dibujo, rareza)
// Aquí se juntan. No hay un tercer catálogo con sprites: si mañana la
// Espada de Hierro cambia de dibujo, se toca ITEM_TEMPLATES y ya está,
// y lo ven el inventario, el perfil y la arena a la vez.
function armaDe(char) {
  const uid = (char.equipment || {}).weapon
  const it = uid && (char.inventory || []).find(i => i.uid === uid)
  const id = it && ARMAS[it.itemId] ? it.itemId : 'puños'
  return armaVista(id)
}

// El aspecto del jugador, tal y como lo entiende el resto del juego.
// No hay un catálogo de dibujos propio de la arena: se lee el mismo que
// usan el creador de personaje y el perfil. Si una skin trae tira de
// caminar, viene con ella; si solo trae emoji, viene el emoji; si no
// trae nada, el que dibuja se las apaña con un círculo. Ninguna de las
// tres posibilidades puede romper la pantalla.
function aspectoDe(char) {
  const propia = typeof skinPropiaDe === 'function' ? skinPropiaDe(char) : null
  const id = (char.appearance && char.appearance.skinId) || DEFAULT_SKIN
  const sk = propia && id === 'propio' ? propia : skinById(id)
  if (!sk) return { emoji: '\u{1F9DD}', imagen: null, tira: null }
  const tira = sk.sprites && sk.sprites.walk
  return {
    id: sk.id,
    emoji: sk.emoji || '\u{1F9DD}',
    // El avatar es el dibujo pensado para verse pequeño. La ilustración
    // grande (`file`) es para la ficha del personaje: metida en 44 px
    // dentro del combate se veía como un cuadro borroso —"una imagen de
    // una rata"—, que es justo lo que no queremos.
    avatar: sk.avatar ? '/assets/skins/' + sk.avatar : null,
    imagen: sk.file ? '/assets/skins/' + sk.file : (sk.imagen || null),
    paleta: (char.appearance && char.appearance.palette) || sk.palette || null,
    tira: tira ? geometriaTira('/assets/skins/' + tira.file, tira.frames) : null,
  }
}

// La geometría de una tira se saca del PROPIO archivo, no del catálogo.
//
// El catálogo decía `ancho: 140` para una tira de 420×70 con 3 cuadros.
// ¿140 es el ancho de cada cuadro o el total? Las dos lecturas son
// razonables y yo elegí la equivocada: dibujaba un tercio de cuadro y
// en pantalla salía medio bicho. Preguntándoselo al PNG no hay nada que
// interpretar: el ancho total lo dice el archivo y el de cada cuadro es
// una división.
const GEOM = new Map()
function geometriaTira(url, cuadros) {
  const clave = url + '#' + cuadros
  if (GEOM.has(clave)) return GEOM.get(clave)
  let r = null
  try {
    const buf = fs.readFileSync(path.join(ASSETS_DIR, url.replace('/assets/', '')))
    if (buf.readUInt32BE(0) === 0x89504e47) {
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
      const n = Math.max(1, cuadros || 1)
      r = { url, cuadros: n, anchoCuadro: Math.round(w / n), alto: h, anchoTotal: w, anim: 'walk' }
    }
  } catch { r = null }
  GEOM.set(clave, r)
  return r
}

// ¿Hay una tira de animación para esta arma? La convención es
// assets/items/anim/<id>.png con los cuadros en fila, todos cuadrados:
// el número de cuadros sale de dividir el ancho entre el alto, así que
// el archivo se explica solo y no hay que declararlo en ningún sitio.
const TIRAS = new Map()
function tiraDe(id) {
  if (TIRAS.has(id)) return TIRAS.get(id)
  let r = null
  try {
    const ruta = path.join(ASSETS_DIR, 'items', 'anim', id + '.png')
    const buf = fs.readFileSync(ruta)
    if (buf.readUInt32BE(0) === 0x89504e47) {
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
      const cuadros = Math.max(1, Math.round(w / Math.max(1, h)))
      r = { url: '/assets/items/anim/' + id + '.png', cuadros, alto: h }
    }
  } catch { r = null }
  TIRAS.set(id, r)
  return r
}

// Descriptor completo de un arma. Se construye nuevo cada vez: ARMAS
// es catálogo de solo lectura y escribirle encima le cambiaría el
// arma a todo el mundo.
function armaVista(id) {
  const base = ARMAS[id] || ARMAS['puños']
  const t = (typeof template === 'function' && template(id)) || null
  return {
    id, ...base,
    nombre: (t && t.name) || base.nombre,
    icono: (t && t.icon) || '👊',
    imagen: (t && t.imagen) || null,
    // Los PNG de espada tienen la hoja en diagonal exacta: la punta en
    // (8,8) y el pomo en (29,29), o sea -135°. El dibujante necesita
    // saberlo para girarlo bien; si un sprite futuro apunta a otro
    // lado, se declara aquí y no se toca el renderer.
    spriteAngulo: t && t.spriteAngulo != null ? t.spriteAngulo : -2.356,
    // Dónde agarra la mano el dibujo, en fracción de su propio tamaño.
    // Sin esto el arma se dibujaba centrada y quedaba flotando medio
    // sprite por delante del personaje, como si la llevara a rastras.
    empunadura: (t && t.empunadura) || { x: 0.79, y: 0.79 },
    tipo: base.proyectil ? 'ranged' : 'melee',
    // Cómo se mueve el arma al golpear. Un hacha no barre igual que una
    // lanza, y con un solo gesto para todas el arma equipada se nota en
    // los números pero no en las manos. Se declara donde se declara el
    // resto de su conducta; si un arma nueva no lo dice, se deduce de
    // sus propios números en vez de quedarse sin gesto.
    gesto: base.gesto || (base.proyectil ? 'disparo' : base.arco <= 0.6 ? 'estocada' : 'barrido'),
    // Tira de cuadros, si algún día existe. Mientras no haya PNG, el
    // gesto se calcula; cuando lo haya, se dibuja. Añadir la animación
    // será copiar un archivo, no tocar el renderer.
    tira: tiraDe(id),
  }
}

// Cuerpo y zona golpeable son DOS cosas distintas.
//
// Hasta ahora `radio` hacia tres trabajos a la vez: empujar cuerpos para
// que no se apilen, frenar contra la pared, y decidir si un golpe toca.
// Mezclarlos obliga a elegir: un cuerpo generoso para que no se solapen
// los sprites significaba tambien una zona golpeable generosa, asi que
// rozar a un enemigo por el borde contaba como recibir el golpe entero.
// Eso es justo lo que hace que esquivar no se sienta como esquivar.
//
//   radio      cuerpo fisico: separacion entre cuerpos y limite de pared
//   golpeable  zona vulnerable: lo unico que decide si un golpe entra
//
// El jugador tiene la zona golpeable MAS PEQUENA que su cuerpo (11 de
// 15). Es la convencion de todo juego de accion y tiene un motivo: lo
// vulnerable es el torso, no la huella entera del personaje. Pasar
// rozando deja de costar vida, pero plantarse delante de un enemigo
// sigue costando exactamente lo mismo, porque el enemigo se acerca
// hasta tener al jugador a tiro de todas formas.
//
// Los enemigos conservan zona golpeable igual a su cuerpo a proposito:
// encogerla cambiaria el dano por segundo del jugador, y esto es un
// arreglo de sensaciones, no de balance. El gancho queda puesto por si
// algun bicho concreto lo necesita (`golpeable` en su ficha).
const GOLPEABLE_JUGADOR = 11

function golpeableDe(c) {
  return Number.isFinite(c && c.golpeable) ? c.golpeable : GOLPEABLE_JUGADOR
}
function golpeableEn(en) {
  const c = en.cfg || {}
  return Number.isFinite(c.golpeable) ? c.golpeable : c.radio
}

// Conductas: lo que distingue a un enemigo de otro más allá de sus números
//   perseguidor  va a por ti y golpea de cerca
//   tirador      mantiene distancia y dispara
//   embestidor   se para, se prepara y carga en línea recta
const CONDUCTAS = {
  m_spider:   { tipo: 'perseguidor', vel: 108, radio: 16, alcance: 34, cadenciaMs: 900 },
  m_skeleton: { tipo: 'perseguidor', vel: 92,  radio: 17, alcance: 36, cadenciaMs: 1000 },
  m_troll:    { tipo: 'embestidor',  vel: 78,  radio: 22, alcance: 40, cadenciaMs: 1600, cargaVel: 320, avisoMs: 700 },
  m_golem:    { tipo: 'embestidor',  vel: 62,  radio: 26, alcance: 46, cadenciaMs: 2000, cargaVel: 280, avisoMs: 900 },
  m_dragon:   { tipo: 'tirador',     vel: 96,  radio: 24, alcance: 320, cadenciaMs: 1300, proyectilVel: 300, distanciaIdeal: 220 },
  m_demon:    { tipo: 'tirador',     vel: 104, radio: 24, alcance: 340, cadenciaMs: 1100, proyectilVel: 340, distanciaIdeal: 200 },
}

// Oleadas: cada arena es una lista de tandas. Terminar la última gana.
const ARENAS = {
  arena_bosque: {
    id: 'arena_bosque', nombre: 'Claro del Bosque', minLevel: 1, zona: 'forest',
    oleadas: [['m_spider', 'm_spider'], ['m_spider', 'm_spider', 'm_skeleton'], ['m_troll']],
    oro: [60, 140], cgrid: 0,
  },
  arena_minas: {
    id: 'arena_minas', nombre: 'Galería Derrumbada', minLevel: 5, zona: 'mines',
    oleadas: [['m_skeleton', 'm_skeleton'], ['m_troll', 'm_spider', 'm_spider'], ['m_golem']],
    oro: [180, 320], cgrid: 0,
  },
  arena_ruinas: {
    id: 'arena_ruinas', nombre: 'Patio de las Ruinas', minLevel: 12, zona: 'ruins',
    oleadas: [['m_skeleton', 'm_skeleton', 'm_troll'], ['m_golem', 'm_golem'], ['m_dragon'], ['m_demon']],
    oro: [500, 900], cgrid: 2,
  },
}

const partidas = new Map()   // username → partida

// El nivel para el que está pensada una arena.
//
// Lo dice ella misma: `minLevel` es el nivel al que se abre, o sea el
// nivel al que se supone que la peleas. Probé primero con el nivel del
// bicho más gordo y salía mal: el Patio de las Ruinas se abre a nivel
// 12 pero tiene un demonio de nivel 20, así que a un jugador de 18 se
// le trataba como si fuera corto de nivel y no se le subía nada. Con
// `minLevel` se le sube por los 6 niveles que le saca a la entrada, que
// es lo que de verdad ha crecido desde que pudo entrar.
//
// `nivelBase` es el escape para los encuentros de mazmorra, que no
// tienen minLevel propio: ahí manda el nivel de sus bichos.
function nivelDeArena(a) {
  if (a.nivelBase) return a.nivelBase
  return Math.max(1, a.minLevel || 1)
}

function nivelDeLasOleadas(oleadas) {
  let n = 1
  for (const oleada of oleadas || []) {
    for (const id of oleada) {
      const m = MONSTERS[id]
      if (m && m.level > n) n = m.level
    }
  }
  return n
}

function limitar(v, min, max) { return v < min ? min : v > max ? max : v }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }

function crearEnemigo(monsterId, x, y, seg) {
  const m = MONSTERS[monsterId]
  const c = CONDUCTAS[monsterId] || CONDUCTAS.m_spider
  // `seg` viene de seguimientoDe(char): cuánto sube este bicho para
  // este jugador. La vida sigue a lo que el jugador PEGA y el daño a lo
  // que el jugador AGUANTA, que son dos cosas que crecen a ritmos muy
  // distintos y antes compartían un solo multiplicador.
  //
  // El sitio del bicho en la tabla se respeta: un gólem sigue siendo
  // mucho más duro que una araña. Lo que cambia es la escala entera.
  const e = seg || { vida: 1, daño: 1 }
  return {
    id: nextId('en'), monsterId, nombre: m.name, icono: m.icon,
    x, y, vx: 0, vy: 0,
    hp: Math.round(m.hp * e.vida * ESCALA_ARENA.vida), hpMax: Math.round(m.hp * e.vida * ESCALA_ARENA.vida),
    dmg: Math.round((m.atk[0] + m.atk[1]) / 2 * e.daño * ESCALA_ARENA.daño),
    // tipoId es la clave del catálogo (m_spider, m_troll...). La IA la
    // necesita para saber de qué carácter es: sin ella, caracterDe()
    // devuelve el genérico y TODOS vuelven a comportarse igual.
    def: m.def, conducta: c.tipo, cfg: c, tipoId: monsterId,
    proxAtaque: 0, estado: 'normal', cargaHasta: 0, dir: 0,
    invulnHasta: 0,
    ex: 0, ey: 0, objx: 0, objy: 0,
    // Estado de la máquina y semilla propia: sin la semilla, todas las
    // arañas zigzaguean en el mismo instante y parecen una sola.
    fsm: null, fsmDesde: 0, fsmHasta: 0, semilla: Math.random() * 6.28,
    // El reloj de animación vive en 57-animaciones.js. Aquí solo se
    // guarda el campo: quien la arranque dirá cuál y cuándo.
    anim: null,
  }
}

function iniciarArena(player, arenaId) {
  const a = ARENAS[arenaId]
  const char = player.character
  if (!a) return { error: 'Esa arena no existe', code: 404 }
  if (char.level < a.minLevel) return { error: `Necesitas nivel ${a.minLevel}`, code: 403 }
  if (char.hp <= 0) return { error: 'Estás derrotado: descansa antes de entrar', code: 400 }
  if (partidas.has(player.username)) return { error: 'Ya tienes un combate en curso', code: 409 }

  const st = effectiveStats(char)
  const p = {
    usuario: player.username, arena: a, oleada: 0,
    jugador: {
      x: ARENA_ANCHO / 2, y: ARENA_ALTO - 90, vx: 0, vy: 0, radio: 15, golpeable: GOLPEABLE_JUGADOR,
      ex: 0, ey: 0, objx: 0, objy: 0,
      hp: char.hp, hpMax: st.maxHp, def: st.defense,
      // El daño sale de la estadística principal de la clase, igual
      // que en el combate por turnos: un mago pega con inteligencia.
      poder: st[(CLASSES[char.class] || CLASSES.Archimago).primary || 'strength'],
      agilidad: st.agility,
      arma: armaDe(char), aspecto: aspectoDe(char),
      proxGolpe: 0, invulnHasta: 0, mirando: -Math.PI / 2,
      esquivarHasta: 0, proxEsquiva: 0,
    },
    enemigos: [], restos: [], proyectiles: [], sucesos: [],
    entrada: { mx: 0, my: 0, atacar: false, apuntar: -Math.PI / 2, esquivar: false },
    inicio: now(), ultimoTick: now(), estado: 'activa',
    bajas: 0, botin: [], xp: 0,
  }
  // El nivel de referencia es el de la ARENA, no el de cada bicho: una
  // arena es un encuentro entero, y escalando bicho a bicho la araña de
  // la primera oleada subiría más que el gólem de la última.
  p.seguimiento = seguimientoDe(char, ESCALA_ARENA, nivelDeArena(a))
  lanzarOleada(p)
  partidas.set(player.username, p)
  audit('arena_inicio', char.name, { arena: arenaId })
  return { partida: resumen(p) }
}

// Un encuentro suelto con las oleadas que le pasen. Lo usan las
// mazmorras: la sala decide qué enemigos hay y el motor es el mismo.
function iniciarEncuentro(player, cfg) {
  const char = player.character
  if (partidas.has(player.username)) return { error: 'Ya tienes un combate en curso', code: 409 }
  const st = effectiveStats(char)
  const falsaArena = {
    id: cfg.origen || 'encuentro', nombre: cfg.nombre || 'Encuentro',
    oleadas: cfg.oleadas, oro: [0, 0], cgrid: 0, minLevel: 1,
    // Una sala de mazmorra no declara nivel de entrada, así que el suyo
    // es el de los bichos que trae.
    nivelBase: cfg.nivelBase || nivelDeLasOleadas(cfg.oleadas),
  }
  const p = {
    usuario: player.username, arena: falsaArena, oleada: 0,
    origen: cfg.origen || 'arena', runId: cfg.runId || null,
    jugador: {
      x: ARENA_ANCHO / 2, y: ARENA_ALTO - 90, vx: 0, vy: 0, radio: 15, golpeable: GOLPEABLE_JUGADOR,
      ex: 0, ey: 0, objx: 0, objy: 0,
      hp: cfg.vidaInicial != null ? cfg.vidaInicial : char.hp, hpMax: st.maxHp, def: st.defense,
      poder: st[(CLASSES[char.class] || CLASSES.Archimago).primary || 'strength'],
      agilidad: st.agility,
      arma: armaDe(char), aspecto: aspectoDe(char),
      proxGolpe: 0, invulnHasta: 0, mirando: -Math.PI / 2,
      esquivarHasta: 0, proxEsquiva: 0,
    },
    enemigos: [], restos: [], proyectiles: [], sucesos: [],
    entrada: { mx: 0, my: 0, atacar: false, apuntar: -Math.PI / 2, esquivar: false },
    inicio: now(), ultimoTick: now(), estado: 'activa',
    bajas: 0, botin: [], xp: 0,
    // Una sala jugable (cofre, trampa, santuario). Cuando la hay, el
    // encuentro se gana cumpliendo su objetivo y no vaciando la sala.
    sala: cfg.sala || null,
  }
  p.seguimiento = seguimientoDe(char, ESCALA_ARENA, nivelDeArena(falsaArena))
  lanzarOleada(p)
  partidas.set(player.username, p)
  return { partida: resumen(p) }
}

function lanzarOleada(p) {
  const lista = p.arena.oleadas[p.oleada] || []
  p.enemigos = lista.map((id, i) => {
    const ang = (i / lista.length) * Math.PI * 2
    // El seguimiento se calcula UNA VEZ al empezar la partida y vive en
    // `p`. Antes cada oleada volvía a mirar el nivel del jugador en el
    // almacén, y en la última oleada eso obligaba a un `player ? … : 1`
    // que le ponía enemigos de nivel 1 a quien se hubiera desconectado.
    return crearEnemigo(id, ARENA_ANCHO / 2 + Math.cos(ang) * 220, 150 + Math.sin(ang) * 90, p.seguimiento)
  })
  p.sucesos.push({ t: 'oleada', n: p.oleada + 1, total: p.arena.oleadas.length })
}

// El cliente solo puede decir esto, y todo se sanea.
// El pulso por HTTP: misma intención, mismo servidor decidiendo, misma
// respuesta que iría por socket. La diferencia es solo el transporte.
function sincronizarArena(username, entrada) {
  const p = partidas.get(username)
  // La partida ya no está: o acabó entre dos pulsos —y su resultado
  // espera en el buzón— o nunca existió. Lo primero NO es un error.
  if (!p) {
    const fin = recogerFinal(username)
    return fin ? { fin } : null
  }
  entradaArena(username, entrada)
  p.ultimoContacto = now()
  if (p.estado !== 'activa') return { fin: recogerFinal(username) || { motivo: p.estado, bajas: p.bajas, xp: p.xp } }
  return { estado: resumen(p) }
}

function entradaArena(username, entrada) {
  const p = partidas.get(username)
  if (!p || p.estado !== 'activa') return
  const e = p.entrada
  const mx = Number(entrada.mx), my = Number(entrada.my)
  if (Number.isFinite(mx) && Number.isFinite(my)) {
    const n = Math.hypot(mx, my) || 1
    // Se normaliza: mandar un vector gigante no hace correr más.
    e.mx = limitar(mx / (n > 1 ? n : 1), -1, 1)
    e.my = limitar(my / (n > 1 ? n : 1), -1, 1)
  }
  if (Number.isFinite(Number(entrada.apuntar))) e.apuntar = Number(entrada.apuntar)
  e.atacar = !!entrada.atacar
  e.esquivar = !!entrada.esquivar
}

// ── UN GOLPE DURA ALGO ─────────────────────────────────────────────
//
// Antes el daño se aplicaba EN EL MISMO INSTANTE en que llegaba la
// intención de atacar. Pulsabas y el enemigo perdía vida, sin más. Eso
// tiene dos consecuencias feas:
//
//   · todas las armas se sienten igual. Un mandoble de 620 ms y una
//     daga de 300 impactan los dos al instante; lo único que cambia es
//     cuánto tardas en volver a pulsar. El peso del arma no existe.
//   · no hay nada que esquivar. Si el golpe no tiene anticipación, no
//     hay ventana en la que apartarse, y el combate se reduce a quién
//     pulsa más rápido.
//
// Ahora un golpe tiene tres tiempos: se prepara, está vivo, y se
// recupera. El daño solo existe mientras está VIVO.
//
//   ANTICIPACIÓN   el gesto arranca, todavía no toca a nadie
//   ACTIVO         el filo está fuera: aquí y solo aquí hace daño
//   RECUPERACIÓN   el resto, hasta poder volver a pegar
//
// DE DÓNDE SALEN LOS NÚMEROS
// De la cadencia del arma, que ya está en el catálogo: un arma lenta se
// prepara más. Y los tres tiempos SUMAN la cadencia, así que el daño
// por segundo no se mueve ni un punto. Lo que cambia no es cuánto
// pegas, es cuándo llega. Los topes evitan los dos extremos: que una
// daga tenga una anticipación imperceptible y que un cetro se quede
// congelado medio segundo antes de tocar.
function ventanasDe(arma) {
  const c = arma.cadenciaMs
  const anticipacion = Math.round(limitar(c * 0.30, 60, 220))
  const activo = Math.round(limitar(c * 0.22, 60, 160))
  return { anticipacion, activo, recuperacion: Math.max(0, c - anticipacion - activo) }
}

// Empezar el gesto. Aquí NO se hace daño a nadie: solo se apunta cuándo
// empieza y cuándo acaba la parte que sí lo hace.
function golpear(p, ahora) {
  const j = p.jugador
  const arma = j.arma
  if (ahora < j.proxGolpe) return
  j.proxGolpe = ahora + arma.cadenciaMs
  const v = ventanasDe(arma)
  j.golpe = {
    desde: ahora + v.anticipacion,
    hasta: ahora + v.anticipacion + v.activo,
    // A quién ya ha tocado ESTE golpe. Sin esto, una ventana activa de
    // 160 ms abarca dos pasos de 100 y el mismo barrido pegaría dos
    // veces al mismo bicho.
    tocados: [],
    disparado: false,
    ang: j.mirando,
  }
  // El arma decide cuánto dura el gesto, pero con techo: con una
  // cadencia de 620 ms el mandoble se veía en cámara lenta.
  animIniciar(j, 'attack', ahora, Math.max(180, Math.min(arma.cadenciaMs * 0.8, 420)))
  // La pantalla necesita saber que el gesto ha empezado para pintar la
  // anticipación; antes solo se enteraba del impacto.
  p.sucesos.push({ t: 'gesto', ms: v.anticipacion, activo: v.activo, arma: arma.id })
}

// Resolver el gesto en curso. Se llama en CADA paso, no al pulsar: por
// eso un enemigo que se mete en el barrido mientras el filo está fuera
// se lo come, que es lo que se espera de un arco de ataque.
function resolverGolpe(p, ahora) {
  const j = p.jugador
  const g = j.golpe
  if (!g) return
  if (ahora < g.desde) return          // todavía se está preparando
  if (ahora > g.hasta) { j.golpe = null; return }   // ya se recupera

  const arma = j.arma

  if (arma.proyectil) {
    // Se dispara UNA vez, al abrirse la ventana. La flecha sale cuando
    // el arco termina de tensarse, no cuando se pulsa.
    if (g.disparado) return
    g.disparado = true
    p.proyectiles.push(crearProyectil({
      dueño: 'jugador', x: j.x, y: j.y, dir: j.mirando,
      vel: arma.proyectil.vel, radio: arma.proyectil.radio,
      dmg: Math.round(j.poder * arma.dmg), empuje: arma.empuje,
      elemento: arma.proyectil.element,
      vidaMs: arma.proyectil.vidaMs,
    }))
    p.sucesos.push({ t: 'disparo' })
    return
  }

  // Golpe cuerpo a cuerpo: alcance y arco alrededor de hacia dónde mira
  let tocado = false
  for (const en of p.enemigos) {
    if (en.muerto) continue
    if (g.tocados.includes(en.id)) continue
    if (dist(j, en) > arma.alcance + golpeableEn(en)) continue
    const ang = Math.atan2(en.y - j.y, en.x - j.x)
    let dif = Math.abs(((ang - j.mirando + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
    if (dif > arma.arco) continue
    dañarEnemigo(p, en, Math.round(j.poder * arma.dmg), arma.empuje, ang, ahora)
    g.tocados.push(en.id)
    tocado = true
  }
  // El aviso de golpe sale la primera vez que la ventana se abre, haya
  // acertado o no: es lo que la pantalla usa para pintar el barrido.
  if (!g.avisado) {
    g.avisado = true
    p.sucesos.push({ t: 'golpe', acierto: tocado, x: j.x, y: j.y, ang: j.mirando, alcance: arma.alcance })
  } else if (tocado) {
    p.sucesos.push({ t: 'golpe', acierto: true, x: j.x, y: j.y, ang: j.mirando, alcance: arma.alcance })
  }
}

function dañarEnemigo(p, en, dmg, empuje, ang, ahora) {
  const real = Math.max(1, dmg - Math.round(en.def * 0.4))
  en.hp -= real
  impulsar(en, ang, empuje)
  p.sucesos.push({ t: 'daño', a: 'enemigo', id: en.id, dmg: real, x: en.x, y: en.y })
  if (en.hp <= 0) { en.muerto = true; animIniciar(en, 'death', ahora); irA(en, EST.DEAD, ahora, 0) }
  else {
    animIniciar(en, 'hurt', ahora)
    // Encajar un golpe interrumpe lo que estuviera haciendo, si el
    // golpe da para tanto. Antes seguían pegándote en mitad de tu
    // combo como si no notaran nada.
    herir(en, real, ahora)
  }
}

function dañarJugador(p, dmg, empuje, ang, ahora) {
  const j = p.jugador
  if (ahora < j.invulnHasta) return
  if (ahora < j.esquivarHasta) { p.sucesos.push({ t: 'esquiva' }); return }
  const real = Math.max(1, Math.round(dmg * (1 - Math.min(0.7, j.def / 250))))
  j.hp -= real
  impulsar(j, ang, empuje)
  j.invulnHasta = ahora + 450
  animIniciar(j, 'hurt', ahora)
  p.sucesos.push({ t: 'daño', a: 'jugador', dmg: real, x: j.x, y: j.y })
}

// La IA vive en 56-ia-enemigos.js: estados, pesos y carácter. Aquí
// está lo que cada estado HACE dentro de la arena, que es lo único que
// necesita saber de proyectiles, daño y posiciones.
function pasoIA(p, en, ahora, dt) {
  const j = p.jugador
  const d = dist(en, j)
  const ang = Math.atan2(j.y - en.y, j.x - en.x)
  const c = en.cfg
  const car = caracterDe(en.tipoId)
  const cuerpos = c.alcance + golpeableDe(j)
  // Velocidad del enemigo con sus efectos encima. Se calcula una vez y
  // se usa en todas las ramas: si se leyera c.vel a pelo en cada una,
  // el hielo frenaría al perseguidor y no al tirador.
  const vel = velConEfectos(en, c.vel, ahora)

  if (!en.fsm) irA(en, EST.IDLE, ahora, 0)
  en.objx = 0; en.objy = 0

  // —— Estados que mandan sobre todo lo demás ——
  if (en.fsm === EST.DEAD) return
  if (en.fsm === EST.STUN || en.fsm === EST.HURT) {
    // Aturdido o trabado no se mueve ni pega. Ese es el sentido: es la
    // ventana en la que se le puede castigar sin recibir.
    if (expirado(en, ahora)) irA(en, d < car.vista ? EST.CHASE : EST.IDLE, ahora, 0)
    return
  }

  // —— IDLE: todavía no te ha visto ——
  if (en.fsm === EST.IDLE) {
    // Ronda despacio en vez de quedarse clavado como un mueble.
    if (!en.rondaHasta || ahora > en.rondaHasta) {
      en.rondaDir = Math.random() * Math.PI * 2
      en.rondaHasta = ahora + 900 + Math.random() * 1200
    }
    en.objx = Math.cos(en.rondaDir) * vel * 0.25
    en.objy = Math.sin(en.rondaDir) * vel * 0.25
    if (d < car.vista) irA(en, EST.CHASE, ahora, 0)
    return
  }

  // Mordió y toca saltar atrás. Se mira aquí y no dentro del ataque
  // para que la retirada empiece cuando el gesto acaba, no a la vez.
  if (en.retirarseEn && ahora >= en.retirarseEn) {
    en.retirarseEn = 0
    if (car.retirada && irA(en, EST.RETREAT, ahora, car.retiradaMs)) return
  }

  // —— ATTACK / RANGED: el gesto ya está lanzado ——
  // El daño se aplicó al entrar; aquí solo se espera a que acabe. Así
  // el enemigo no puede encadenar dos golpes sin recuperarse.
  if (en.fsm === EST.ATTACK || en.fsm === EST.RANGED) {
    if (expirado(en, ahora)) irA(en, EST.CHASE, ahora, 0)
    return
  }

  // —— TELEGRAPH: se prepara, y se nota ——
  if (en.fsm === EST.TELEGRAPH) {
    if (!expirado(en, ahora)) return
    if (en.avisaCarga) {
      en.avisaCarga = false
      en.dir = ang                 // la dirección se fija AQUÍ, no al chocar:
      en.chocado = false           // por eso esquivar a tiempo funciona
      irA(en, EST.CHARGE, ahora, 700)
    } else {
      golpeCuerpo(p, en, ang, ahora)
    }
    return
  }

  // —— CHARGE: embestida en línea recta ——
  if (en.fsm === EST.CHARGE) {
    impulsar(en, en.dir, c.cargaVel * dt * 8)
    if (d < cuerpos && !en.chocado) {
      en.chocado = true
      dañarJugador(p, Math.round(en.dmg * 1.6), 220, en.dir, ahora)
      en.proxAtaque = ahora + c.cadenciaMs
      irA(en, EST.CHASE, ahora, 0)
      return
    }
    // Contra la pared, o al acabarse el impulso sin tocar a nadie: se
    // queda aturdido. Fallar tiene precio, y ese precio es tu turno.
    // La embestida tiene un mínimo: sin él, arrancar ya tocando la
    // pared la terminaba en el mismo instante en que empezaba.
    const lanzada = ahora - en.fsmDesde > 180
    const pegado = en.x <= c.radio + 1 || en.y <= c.radio + 1 ||
                   en.x >= ARENA_ANCHO - c.radio - 1 || en.y >= ARENA_ALTO - c.radio - 1
    if ((lanzada && pegado) || expirado(en, ahora)) {
      en.proxAtaque = ahora + c.cadenciaMs
      if (car.aturdirAlFallar && !en.chocado) {
        irA(en, EST.STUN, ahora, car.aturdirAlFallar)
        p.sucesos.push({ t: 'aturdido', id: en.id, x: en.x, y: en.y })
      } else irA(en, EST.CHASE, ahora, 0)
    }
    return
  }

  // —— RETREAT: se aparta ——
  //
  // Antes esto no servía para nada contra un jugador, y se puede
  // demostrar con dos números: el dragón se aparta a 96 px/s y el
  // jugador corre a 210. Retroceder andando de espaldas delante de
  // alguien que va al doble de velocidad es quedarse quieto.
  //
  // Medido: el Patio de las Ruinas —dos gólems, un dragón y un
  // demonio— se ganaba el 100% de las veces perdiendo el 3% de la
  // vida. Los dos jefes son tiradores; les bastaba con que te
  // acercaras para dejar de ser peligrosos. Su conducta entera —
  // mantener la distancia y castigarte desde lejos— no podía darse.
  //
  // Ahora la retirada es un SALTO, no un paseo: un impulso de verdad
  // que gana terreno. Y se dispara mientras se retrocede, que es lo
  // que convierte "huir" en "hostigar".
  if (en.fsm === EST.RETREAT) {
    en.objx = -Math.cos(ang) * vel
    en.objy = -Math.sin(ang) * vel
    if (en.conducta === 'tirador' && ahora >= en.proxAtaque && d < c.alcance) {
      disparar(p, en, ang, ahora)
      // Disparar no interrumpe la retirada: el estado de disparo dura
      // menos, así que se vuelve a ella en cuanto acaba el gesto.
      irA(en, EST.RETREAT, ahora, Math.max(120, (en.fsmHasta || ahora) - ahora))
    }
    if (expirado(en, ahora) || d > (car.retirada || 0) * 2.2) irA(en, EST.CHASE, ahora, 0)
    return
  }

  // —— CHASE: lo que hace cada uno cuando va a por ti ——
  if (d > car.vista * 1.35) { irA(en, EST.IDLE, ahora, 0); return }

  if (en.conducta === 'tirador') {
    const dif = d - c.distanciaIdeal
    // Demasiado cerca: se aparta disparando. Es lo que lo hace distinto
    // de un perseguidor con arco.
    if (car.retirada && d < car.retirada) { saltarAtras(en, ang, ahora, car); return }
    if (Math.abs(dif) > 30) {
      const s = dif > 0 ? 1 : -1
      en.objx = Math.cos(ang) * vel * s
      en.objy = Math.sin(ang) * vel * s
    }
    if (ahora >= en.proxAtaque && d < c.alcance) {
      if (car.avisoAtaque) { irA(en, EST.TELEGRAPH, ahora, car.avisoAtaque); en.avisaCarga = false; return }
      disparar(p, en, ang, ahora)
    }
    return
  }

  if (en.conducta === 'embestidor') {
    // Se embiste desde LEJOS. Antes bastaba con estar fuera del alcance
    // de su golpe, así que el troll cargaba pegado al jugador: la
    // embestida duraba menos de un tick, no se veía, y acababa
    // aturdiéndose contra la pared sin que nadie entendiera por qué.
    //
    // Pero exigir distancia trajo lo contrario: pegado al troll, la
    // embestida NO PODÍA DARSE NUNCA. Medido, un troll a solas embestía
    // una vez —la primera, antes de que le alcanzaras— y ni una más en
    // toda la pelea. Su única conducta propia dependía de que el
    // jugador tuviera la gentileza de apartarse.
    //
    // Ahora se hace sitio él: si tiene la embestida lista y le tienes
    // encima, TE QUITA DE EN MEDIO de un empujón. Un manotazo que hace
    // poco daño y te manda lejos, y en el hueco que abre cabe la
    // embestida. El troll te aparta, ruge y carga.
    //
    // Probé primero a que saltara él hacia atrás y no funcionaba, y los
    // números dicen por qué: un troll va a 78 px/s y el jugador a 210,
    // así que en lo que tarda en apartarse 45 px el jugador le ha
    // recortado 84. Empujando al jugador da igual quién corra más.
    if (ahora >= en.proxAtaque && d <= cuerpos * 2.2) {
      dañarJugador(p, Math.max(1, Math.round(en.dmg * 0.35)), 520, ang, ahora)
      p.sucesos.push({ t: 'empujon', id: en.id, x: en.x, y: en.y })
      // Y encadena el aviso SIN esperar a la siguiente ventana. El
      // empujón y la carrerilla son un solo movimiento: si el empujón
      // quedara suelto, el jugador vuelve a pegarse antes de que al
      // troll le toque otra vez y se pasa la pelea dando manotazos sin
      // llegar a cargar nunca — que es el fallo que se estaba
      // arreglando, con un paso más.
      en.avisaCarga = true
      irA(en, EST.TELEGRAPH, ahora, c.avisoMs)
      p.sucesos.push({ t: 'aviso', id: en.id })
      return
    }
    if (d > cuerpos * 2.2 && ahora >= en.proxAtaque && d < 460) {
      en.avisaCarga = true
      irA(en, EST.TELEGRAPH, ahora, c.avisoMs)
      p.sucesos.push({ t: 'aviso', id: en.id })
      return
    }
    if (d > cuerpos) { en.objx = Math.cos(ang) * vel; en.objy = Math.sin(ang) * vel; return }
    if (ahora >= en.proxAtaque) golpeCuerpo(p, en, ang, ahora)
    return
  }

  // Perseguidor. El carácter decide cómo se acerca:
  //   zigzag        no viene en línea recta (araña)
  //   avisoAtaque   levanta el arma antes de pegar (esqueleto)
  //   retirada      salta hacia atrás tras morder (araña)
  const tope = Math.max(c.alcance, c.radio + j.radio)
  if (d > tope) {
    let a = ang
    if (car.zigzag) a += Math.sin(ahora / 260 + (en.semilla || 0)) * car.zigzag * 0.5
    en.objx = Math.cos(a) * vel
    en.objy = Math.sin(a) * vel
  }
  if (d <= cuerpos && ahora >= en.proxAtaque) {
    if (car.avisoAtaque) { irA(en, EST.TELEGRAPH, ahora, car.avisoAtaque); en.avisaCarga = false; return }
    golpeCuerpo(p, en, ang, ahora)
  }
}

// Un golpe cuerpo a cuerpo: daño, gesto y enfriamiento. Lo comparten
// todas las conductas para que un cambio de reglas valga para todas.
function golpeCuerpo(p, en, ang, ahora) {
  const c = en.cfg
  const car = caracterDe(en.tipoId)
  en.proxAtaque = ahora + c.cadenciaMs
  const dur = Math.min(c.cadenciaMs * 0.7, 400)
  animIniciar(en, 'attack', ahora, dur)
  irA(en, EST.ATTACK, ahora, dur)
  // El empujón va con lo que pega. Antes era 130 fijo para todos, así
  // que el mordisco de una araña te desplazaba 20 px igual que un
  // mandoble: de pie y quieto parecía que el personaje se movía solo.
  // Un bicho pequeño ahora te hace cosquillas; el que pega fuerte, no.
  dañarJugador(p, en.dmg, Math.min(150, 30 + en.dmg * 2), ang, ahora)
  // Morder y saltar atrás: la araña no se queda a cambiar golpes.
  if (car.retirada && car.retiradaMs) {
    en.retirarseEn = ahora + dur
  }
}

function disparar(p, en, ang, ahora) {
  const c = en.cfg
  en.proxAtaque = ahora + c.cadenciaMs
  const dur = Math.min(c.cadenciaMs * 0.7, 400)
  animIniciar(en, 'attack', ahora, dur)
  irA(en, EST.RANGED, ahora, dur)
  p.proyectiles.push(crearProyectil({
    dueño: 'enemigo', x: en.x, y: en.y, dir: ang,
    vel: c.proyectilVel, radio: 8, dmg: en.dmg, empuje: 90,
    elemento: c.elemento, vidaMs: 2000,
  }))
  p.sucesos.push({ t: 'disparo_enemigo', id: en.id })
}

function tick(p) {
  const ahora = now()
  const dt = Math.min(0.25, (ahora - p.ultimoTick) / 1000)
  p.ultimoTick = ahora
  p.sucesos = []
  const j = p.jugador
  const e = p.entrada

  // Movimiento del jugador
  // La agilidad mueve de verdad: 210 de base y hasta +45% con mucha
  // agilidad. Así una Poción de Velocidad se nota al andar y no solo
  // en el número de la ficha.
  const bonoAgi = Math.min(0.45, (j.agilidad || 0) / 200)
  // El hielo frena al jugador también: los efectos valen para los dos
  // lados o no valen. Un enemigo con vara de hielo tiene que poder
  // castigarte igual que tú a él.
  const vel = velConEfectos(j, 210 * (1 + bonoAgi), ahora)
  // La esquiva ya no es "andar más rápido": es un impulso seco en la
  // dirección que llevabas. Se nota como un tirón y se apaga solo, que
  // es lo que hace que sirva para salir de un apuro y no para viajar.
  j.objx = e.mx * vel
  j.objy = e.my * vel
  if (e.mx || e.my) j.mirando = Math.atan2(e.my, e.mx)
  if (Number.isFinite(e.apuntar)) j.mirando = e.apuntar
  if (e.esquivar && ahora >= j.proxEsquiva) {
    j.esquivarHasta = ahora + 220
    j.proxEsquiva = ahora + 1400
    // Hacia donde te mueves; si estás quieto, hacia donde miras.
    impulsar(j, (e.mx || e.my) ? Math.atan2(e.my, e.mx) : j.mirando, 620)
    animIniciar(j, 'dodge', ahora, 220)
    p.sucesos.push({ t: 'esquiva_inicio' })
  }
  if (e.atacar) golpear(p, ahora)
  // El gesto se resuelve en cada paso, no al pulsar: el daño vive en la
  // ventana activa, y quien se meta en ella mientras dura lo encaja.
  resolverGolpe(p, ahora)

  moverCuerpo(j, j.objx || 0, j.objy || 0, dt)
  for (const en of p.enemigos) if (!en.muerto) pasoIA(p, en, ahora, dt)
  for (const en of p.enemigos) moverCuerpo(en, en.objx || 0, en.objy || 0, dt)

  // Los cuerpos se estorban. Sin esto, media docena de enemigos se
  // apilaban en el mismo píxel encima del jugador y el combate era
  // pelearse con un borrón.
  //
  // Se resuelve VARIAS VECES a propósito. Separar al jugador de una
  // araña y luego separar esa araña de otra la devolvía encima del
  // jugador: cada pareja se arreglaba sola y rompía la anterior. Tres
  // pasadas bastan para que se acomoden todos, y con media docena de
  // cuerpos eso no se nota en el reloj.
  const vivos = p.enemigos.filter(en => !en.muerto)
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    // El jugador pesa mucho más que un bicho a propósito. Con el 3 a 1
    // de antes absorbía la cuarta parte de cada choque y, con dos o
    // tres enemigos pegados, se iba solo por el mapa: 48 px de deriva
    // en doce segundos SIN tocar una tecla. Un empujón tiene que venir
    // de un golpe o de una embestida, no de que alguien te roce.
    for (const en of vivos) separar(j, en, j.radio, en.cfg.radio, 14, 1)
    for (let i = 0; i < vivos.length; i++) {
      for (let k = i + 1; k < vivos.length; k++) {
        separar(vivos[i], vivos[k], vivos[i].cfg.radio, vivos[k].cfg.radio, 1, 1)
      }
    }
  }

  // Las paredes cuentan desde el borde del cuerpo, no desde su centro:
  // antes medio enemigo grande se quedaba fuera del mapa.
  for (const c of [j, ...p.enemigos]) {
    const r = c === j ? j.radio : c.cfg.radio
    const nx = limitar(c.x, r, ARENA_ANCHO - r)
    const ny = limitar(c.y, r, ARENA_ALTO - r)
    // Contra la pared se pierde la velocidad hacia ella, no toda: así
    // se puede seguir deslizando a lo largo del borde.
    if (nx !== c.x) { c.vx = 0; c.ex = 0 }
    if (ny !== c.y) { c.vy = 0; c.ey = 0 }
    c.x = nx; c.y = ny
  }

  // Proyectiles.
  //
  // La colisión se hace contra el TRAMO recorrido, no contra la
  // posición final. Antes se avanzaba 46 px de golpe y luego se
  // preguntaba "¿estoy encima de alguien?": con una araña de 32 px de
  // ancho, solo acertaban los disparos casi centrados y el resto pasaba
  // de largo sin dejar rastro. Ahora se pregunta si ha pasado POR
  // ENCIMA, que es la pregunta correcta.
  for (const pr of p.proyectiles) {
    avanzarProyectil(pr, dt)
    if (ahora > pr.muereEn) { pr.muerto = true; continue }
    if (pr.x < 0 || pr.x > ARENA_ANCHO || pr.y < 0 || pr.y > ARENA_ALTO) {
      pr.muerto = true
      p.sucesos.push({ t: 'impacto', x: Math.round(pr.x), y: Math.round(pr.y), el: pr.elemento })
      continue
    }
    if (pr.deJugador) {
      for (const en of p.enemigos) {
        if (en.muerto || pr.tocados.includes(en.id)) continue
        if (!cruza(pr, en.x, en.y, golpeableEn(en))) continue
        dañarEnemigo(p, en, pr.dmg, pr.empuje, pr.dir, ahora)
        if (pr.elemento !== 'normal') {
          aplicarElemento(en, pr.elemento, ahora, pr.dmg)
          // El rayo aturde de verdad: reutiliza el mismo estado que
          // usa la IA, así que el enemigo deja de pegar y de moverse.
          const el = elemento(pr.elemento)
          if (el.aturdeMs) irA(en, EST.STUN, ahora, el.aturdeMs)
        }
        pr.tocados.push(en.id)
        p.sucesos.push({ t: 'impacto', x: Math.round(pr.x), y: Math.round(pr.y), el: pr.elemento })
        if (pr.tocados.length > pr.atraviesa) { pr.muerto = true; break }
      }
    } else if (cruza(pr, j.x, j.y, golpeableDe(j))) {
      dañarJugador(p, pr.dmg, pr.empuje, pr.dir, ahora)
      if (pr.elemento !== 'normal') aplicarElemento(j, pr.elemento, ahora, pr.dmg)
      pr.muerto = true
      p.sucesos.push({ t: 'impacto', x: Math.round(pr.x), y: Math.round(pr.y), el: pr.elemento })
    }
  }
  p.proyectiles = p.proyectiles.filter(x => !x.muerto)
  if (p.restos && p.restos.length) p.restos = p.restos.filter(r => ahora < r.hasta)

  // Quemaduras y venenos: el elemento sigue haciendo daño cuando el
  // proyectil ya no existe. Es lo que separa un elemento de un color.
  for (const en of p.enemigos) {
    if (en.muerto) continue
    const q = tocaQuemar(en, ahora)
    if (q) dañarEnemigo(p, en, q, 0, 0, ahora)
  }
  const qj = tocaQuemar(j, ahora)
  if (qj) {
    j.hp = Math.max(0, j.hp - qj)
    p.sucesos.push({ t: 'daño', a: 'jugador', dmg: qj, x: j.x, y: j.y })
  }

  // Bajas: el botín y la XP se calculan aquí, con las mismas tablas
  // que el combate por turnos.
  // Solo se cuentan una vez, aunque el cadáver siga en pantalla
  // terminando su animación de muerte.
  const caidos = p.enemigos.filter(en => en.muerto)
  if (caidos.length) {
    const player = store.players[p.usuario]
    for (const en of caidos) {
      const m = MONSTERS[en.monsterId]
      p.bajas++
      p.xp += Math.round(m.xp * 0.6)
      for (const l of rollLoot(en.monsterId)) p.botin.push(l)
      p.sucesos.push({ t: 'muerte', id: en.id, x: en.x, y: en.y, nombre: en.nombre })
      if (player) {
        player.character.monstersKilled = (player.character.monstersKilled || 0) + 1
        if (m.isBoss) player.character.bossesKilled = (player.character.bossesKilled || 0) + 1
        emitProgress(player.character, m.questKey || `kill_${en.monsterId}`, 1)
      }
    }
    // Antes el enemigo desaparecía en el mismo tick en que moría, así
    // que la animación de muerte no se veía JAMÁS: se arrancaba y en el
    // siguiente paquete ya no existía a quien dibujarla.
    //
    // El cadáver se queda, pero en su propia lista. Dejarlo dentro de
    // `enemigos` obligaba a todo el que lee esa lista —las oleadas, la
    // puntería, las pruebas— a acordarse de saltarse los muertos, y
    // quien se olvidara se pondría a pegarle a un cadáver. Un muerto ya
    // no es un enemigo: es un dibujo que se está apagando.
    for (const en of caidos) {
      p.restos.push({ id: en.id, icono: en.icono, x: en.x, y: en.y,
                      radio: en.cfg.radio, dir: lado(Math.atan2(en.vy || 0, en.vx || 0)),
                      desde: ahora, hasta: ahora + (ANIMACIONES.death.dur || 700) })
    }
    p.enemigos = p.enemigos.filter(en => !en.muerto)
  }

  // Salas jugables: los peligros disparan y el objetivo avanza. Va
  // aquí, después de mover proyectiles, para que un dardo recién
  // lanzado no atraviese medio mapa en su primer tick.
  if (p.sala && p.estado === 'activa') {
    pasoPeligros(p, ahora)
    const finSala = pasoObjetivo(p, ahora, dt)
    if (finSala) return finSala
  }

  // Fin de oleada / de arena
  //
  // Una sala jugable se gana por el objetivo, no por vaciarla: sin este
  // `!p.sala` un pasillo de trampas —que no tiene un solo enemigo— se
  // daría por ganado en el primer tick, antes de que al jugador le diera
  // tiempo a moverse.
  if (!p.enemigos.length && p.estado === 'activa' && !p.sala) {
    p.oleada++
    if (p.oleada >= p.arena.oleadas.length) return terminar(p, 'victoria')
    lanzarOleada(p)
  }

  if (j.hp <= 0) return terminar(p, 'derrota')
  if ((ahora - p.inicio) / 1000 > ARENA_MAX_SEGUNDOS) return terminar(p, 'tiempo')
  return null
}

// Buzón de resultados terminados y aún sin recoger.
//
// terminar() borra la partida del mapa. Si en ese instante no había un
// socket escuchando —porque se está jugando por HTTP, o porque la
// conexión se cayó justo entonces— el resultado se perdía y el jugador
// se quedaba mirando un contador de "sin respuesta" para siempre: la
// partida ya no existía, así que el pulso solo recibía 404.
//
// Ahora el final espera aquí a que alguien lo recoja, venga por donde
// venga. Se recoge una sola vez —el oro y el botín ya están dados: esto
// es solo la noticia— y caduca solo, para que un jugador que cierra la
// pestaña no deje un resto guardado eternamente.
const finales = new Map()
const FINAL_TTL_MS = 120000

function guardarFinal(usuario, fin) {
  finales.set(usuario, { fin, cuando: now() })
  for (const [u, f] of finales) if (now() - f.cuando > FINAL_TTL_MS) finales.delete(u)
}

function recogerFinal(usuario) {
  const f = finales.get(usuario)
  if (!f) return null
  finales.delete(usuario)
  return now() - f.cuando > FINAL_TTL_MS ? null : f.fin
}

function terminar(p, motivo) {
  p.estado = motivo
  const player = store.players[p.usuario]
  if (!player) { partidas.delete(p.usuario); return guardar(p.usuario, { motivo }) }
  const char = player.character
  const a = p.arena

  // Combate dentro de una mazmorra: no se paga aquí. El botín y la XP
  // se acumulan en la run y se cobran (o se pierden) al salir.
  if (p.origen === 'mazmorra') {
    partidas.delete(p.usuario)
    char.hp = Math.max(1, Math.round(p.jugador.hp))
    const res = resultadoCombateMazmorra(p.usuario, {
      motivo, bajas: p.bajas, xp: p.xp,
      botinCrudo: p.botin, vidaFinal: p.jugador.hp,
    })
    persist()
    return guardar(p.usuario, { motivo, origen: 'mazmorra', bajas: p.bajas, xp: p.xp, mazmorra: res })
  }

  char.hp = Math.max(1, Math.round(p.jugador.hp))
  let oro = 0, cgrid = 0
  const botinFinal = []

  if (motivo === 'victoria') {
    oro = randInt(a.oro[0], a.oro[1])
    char.gold += oro
    trackCurrency(char.name, 'gold', oro, 'arena')
    cgrid = creditCgrid(char, a.cgrid || 0, `arena:${a.id}`)
    char.arenasGanadas = (char.arenasGanadas || 0) + 1
    step(char.name, 'first_arena')
  }
  // El botín de los enemigos derrotados se entrega aunque se pierda:
  // lo que ya mataste, ya lo mataste.
  for (const l of p.botin) {
    if (addItem(char, l.itemId, l.quantity)) {
      botinFinal.push({ itemId: l.itemId, quantity: l.quantity, name: template(l.itemId).name,
        icon: template(l.itemId).icon, imagen: template(l.itemId).imagen || null })
    }
  }
  char.xp += p.xp
  if (motivo === 'derrota') {
    char.muertes = (char.muertes || 0) + 1
    const perdido = Math.floor(char.gold * 0.05)
    char.gold = Math.max(0, char.gold - perdido)
  }
  const levelUps = checkLevelUp(char)
  audit('arena_fin', char.name, { arena: a.id, motivo, bajas: p.bajas, oro, xp: p.xp })
  track('arena_fin', char.name)
  persist()
  partidas.delete(p.usuario)
  return guardar(p.usuario, { motivo, bajas: p.bajas, xp: p.xp, oro, cgrid, botin: botinFinal, levelUps, nivel: char.level })
}

// Deja copia en el buzón y devuelve el mismo objeto, para que quien
// llamó a terminar() lo use tal cual y quien llegue después también
// pueda recogerlo.
function guardar(usuario, fin) { guardarFinal(usuario, fin); return fin }

function abandonarArena(username) {
  const p = partidas.get(username)
  // Si la partida ya había acabado sola, se entrega ese resultado en vez
  // de decir que no había nada: es lo que el jugador está esperando ver.
  if (!p) return recogerFinal(username)
  const fin = terminar(p, 'abandono')
  recogerFinal(username)
  return fin
}

// Ángulo → uno de cuatro lados. Cuando haya tiras con una fila por
// dirección, esto dice qué fila toca; mientras tanto sirve para saber
// si el personaje mira a izquierda o derecha y espejar el dibujo.
function lado(ang) {
  const a = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  if (a < Math.PI / 4 || a >= Math.PI * 7 / 4) return 'der'
  if (a < Math.PI * 3 / 4) return 'abajo'
  if (a < Math.PI * 5 / 4) return 'izq'
  return 'arriba'
}

// La animación de reposo no se "arranca": se deduce. Si el jugador se
// está moviendo camina, y si no, respira. Así no hay que mandar un
// animIniciar('walk') en cada tick.
function reposoJugador(p, ahora) {
  const j = p.jugador
  if (ahora < j.esquivarHasta) return 'dodge'
  const e = p.entrada
  return (e.mx || e.my) ? 'walk' : 'idle'
}

// Estado que se manda al cliente: lo justo para dibujar.
function resumen(p) {
  const ahora = now()
  return {
    arena: p.arena.id, nombre: p.arena.nombre,
    oleada: p.oleada + 1, oleadas: p.arena.oleadas.length,
    ancho: ARENA_ANCHO, alto: ARENA_ALTO,
    jugador: {
      x: Math.round(p.jugador.x), y: Math.round(p.jugador.y),
      hp: Math.round(p.jugador.hp), hpMax: p.jugador.hpMax,
      // Los dos circulos del jugador, por separado. De los enemigos ya
      // viajaba `radio`; del jugador no viajaba ninguno, asi que la
      // pantalla no podia dibujar su propia huella con el mismo criterio
      // que la de los demas. Y sin que crucen el cable, una prueba no
      // puede comprobar que de verdad son dos cosas distintas.
      radio: p.jugador.radio,
      golpeable: golpeableDe(p.jugador),
      mirando: Number(p.jugador.mirando.toFixed(2)),
      arma: p.jugador.arma.nombre,
      // Con el nombre solo no se puede dibujar nada. Esto es lo que
      // necesita el renderer para poner la espada en la mano: qué
      // dibujo, hacia dónde apunta el dibujo, y cuánto mide el golpe.
      armaVis: {
        id: p.jugador.arma.id, nombre: p.jugador.arma.nombre,
        imagen: p.jugador.arma.imagen, icono: p.jugador.arma.icono,
        alcance: p.jugador.arma.alcance, arco: p.jugador.arma.arco,
        spriteAngulo: p.jugador.arma.spriteAngulo, tipo: p.jugador.arma.tipo,
        empunadura: p.jugador.arma.empunadura,
        gesto: p.jugador.arma.gesto, tira: p.jugador.arma.tira,
      },
      anim: animPublica(p.jugador, ahora, reposoJugador(p, ahora)),
      aspecto: p.jugador.aspecto,
      // Dirección en cuatro sentidos, lista para tiras de sprites que
      // tengan una fila por lado. Se calcula aquí para que no haya dos
      // formas distintas de redondear el mismo ángulo.
      dir: lado(p.jugador.mirando),
      esquivando: ahora < p.jugador.esquivarHasta,
    },
    // La sala, cuando la hay. El cliente necesita saber a dónde ir,
    // cuánto lleva aguantando y dónde están los emisores para poder
    // pintar el aviso antes del dardo: sin el aviso dibujado, la
    // telegrafía del servidor no sirve de nada.
    sala: p.sala ? {
      tipo: p.sala.tipo, nombre: p.sala.nombre,
      objetivo: {
        x: p.sala.objetivo.x, y: p.sala.objetivo.y, radio: p.sala.objetivo.radio,
        icono: p.sala.objetivo.icono, etiqueta: p.sala.objetivo.etiqueta,
        progreso: Math.min(1, (p.sala.objetivo.progreso || 0) / p.sala.objetivo.usarMs),
        hecho: !!p.sala.objetivo.hecho,
      },
      peligros: p.sala.peligros.map(h => ({
        id: h.id, x: Math.round(h.x), y: Math.round(h.y), ang: Number(h.ang.toFixed(2)),
        // Cuánto queda para lo siguiente y si lo siguiente es un
        // disparo. Con esto la pantalla puede pintar la cuenta atrás.
        avisando: h.avisando, restanteMs: Math.max(0, h.prox - ahora),
      })),
    } : null,

    // Restos: solo para dibujar. No tienen vida, no reciben golpes y no
    // cuentan para nada. El cliente los pinta apagándose.
    restos: (p.restos || []).map(r => ({
      id: r.id, icono: r.icono, x: Math.round(r.x), y: Math.round(r.y),
      radio: r.radio, dir: r.dir,
      p: Math.min(1, (ahora - r.desde) / Math.max(1, r.hasta - r.desde)),
    })),
    enemigos: p.enemigos.map(e => ({
      id: e.id, icono: e.icono, nombre: e.nombre,
      x: Math.round(e.x), y: Math.round(e.y),
      hp: Math.round(e.hp), hpMax: e.hpMax, radio: e.cfg.radio,
      estado: e.estado,
      // El estado real de la máquina, no solo el resumen para dibujar.
      // `estado` colapsa casi todo en 'normal' porque al renderer solo
      // le hacía falta saber si avisa o si está aturdido; con eso, ni
      // la pantalla ni las pruebas podían ver si la IA hace algo o se
      // limita a perseguir. Ahora se puede mirar.
      fsm: e.fsm || 'idle',
      dir: lado(Math.atan2(e.vy || 0, e.vx || 0)),
      // Efectos encima, para poder dibujarlos. Un enemigo congelado que
      // se ve igual que uno normal es un elemento que el jugador no
      // sabe que ha aplicado.
      lento: !!(e.lentoHasta && ahora < e.lentoHasta),
      quema: !!(e.quemaHasta && ahora < e.quemaHasta),
      anim: animPublica(e, ahora, Math.abs(e.vx) + Math.abs(e.vy) > 12 ? 'walk' : 'idle'),
    })),
    proyectiles: p.proyectiles.map(pr => ({
      x: Math.round(pr.x), y: Math.round(pr.y), r: pr.radio, mio: pr.deJugador,
      // El color lo decide el elemento, y el elemento vive en el
      // catálogo del servidor: la pantalla no se sabe la lista.
      el: pr.elemento, color: pr.color,
    })),
    sucesos: p.sucesos,
    bajas: p.bajas, xp: p.xp,
  }
}

// ── Bucle: un solo temporizador para todas las partidas ────────────
setInterval(() => {
  for (const [usuario, p] of partidas) {
    if (p.estado !== 'activa') { partidas.delete(usuario); continue }
    let fin = null
    try { fin = tick(p) } catch (e) {
      console.error('[arena]', e.message)
      fin = terminar(p, 'error')
    }
    // ⚠️ Aquí estaba el fallo que dejaba la arena injugable.
    // Se enviaba el estado al PRIMER socket del jugador, y en el juego
    // real el primero es el del launcher (chat y presencia): la página
    // de la arena, que abre el suyo dentro del iframe, no recibía nada.
    // Resultado desde el asiento del jugador: pantalla congelada, no se
    // mueve, no ataca. Las entradas sí llegaban al servidor, pero el
    // estado volvía a la ventana equivocada.
    //
    // Ahora se manda a TODOS los sockets del jugador. El launcher
    // ignora los mensajes de arena y la pantalla de arena los pinta.
    const clientes = [...wsClients].filter(c => c.username === usuario)
    if (!clientes.length) {
      // Sin socket no se acaba la partida: puede estar jugando por HTTP.
      // Lo que la cierra es dejar de dar señales de vida por CUALQUIER
      // vía. Antes se comparaba contra ultimoTick, que el propio bucle
      // acababa de refrescar, así que la condición no se cumplía nunca
      // y una partida abandonada giraba para siempre.
      // El resultado, si lo hubo, ya quedó en el buzón dentro de
      // terminar(): aquí no hay que guardarlo aparte.
      if (!fin && now() - (p.ultimoContacto || p.inicio) > 20000) terminar(p, 'abandono')
      continue
    }
    p.ultimoContacto = now()
    if (fin) recogerFinal(usuario)   // entregado por socket: fuera del buzón
    const mensaje = fin ? { type: 'arena_fin', ...fin } : { type: 'arena_estado', estado: resumen(p) }
    for (const c of clientes) wsSend(c, mensaje)
  }
}, ARENA_TICK_MS).unref?.()
