
// ═══════════════════════════════════════════════════════════════════
//  IA DE ENEMIGOS — máquina de estados
//
//  QUÉ HABÍA ANTES
//  Tres conductas escritas como una cadena de ifs, con el estado
//  guardado en cadenas sueltas ('normal', 'avisando', 'cargando') que
//  solo entendía la conducta que las escribía. Funcionaba, pero:
//
//   · la araña y el esqueleto eran el mismo bicho con otros números;
//   · recibir un golpe no interrumpía nada, así que un enemigo te
//     seguía pegando en mitad de tu combo como si no notara nada;
//   · un embestidor que fallaba y se estampaba contra la pared seguía
//     como si tal cosa: no había ventana para castigarle;
//   · y todos venían a por ti desde el otro lado del mapa en cuanto
//     aparecían, sin un momento de calma.
//
//  QUÉ HAY AHORA
//  Un estado explícito por enemigo y una tabla de transiciones. Los
//  estados comunes son los mismos para todos:
//
//    IDLE      no te ha visto: ronda por su zona
//    CHASE     te ha visto y va a por ti
//    ATTACK    está pegando (dura lo que dura el gesto)
//    HURT      acaba de recibir: se traba un instante
//    STUN      aturdido, sin defensa. Es la ventana para castigar
//    DEAD      se acabó
//
//  Y los que lo necesitan añaden:
//
//    TELEGRAPH aviso antes de un golpe fuerte: tiempo para apartarse
//    CHARGE    embestida en línea recta
//    RANGED    disparo
//    RETREAT   se aparta para recuperar distancia
//
//  POR QUÉ UN MÓDULO APARTE
//  La arena ya es el archivo más grande del servidor, y esta lógica no
//  depende de ella: solo necesita un enemigo, un objetivo y un reloj.
//  El combate por turnos podrá usar los mismos estados más adelante.
//
//  QUIÉN DECIDE: el servidor, como siempre. Esto no se ejecuta nunca
//  en el navegador; al cliente solo le llega en qué estado está cada
//  enemigo, para poder dibujar el aviso o el aturdimiento.
// ═══════════════════════════════════════════════════════════════════

const EST = {
  IDLE: 'idle', CHASE: 'chase', ATTACK: 'attack', HURT: 'hurt',
  STUN: 'stun', DEAD: 'dead', TELEGRAPH: 'telegraph', CHARGE: 'charge',
  RANGED: 'ranged', RETREAT: 'retreat',
}

// Cuánto puede interrumpir cada estado a los demás. Morir gana a todo;
// un aturdimiento gana a un ataque a medias; un ataque no interrumpe a
// otro. Sin esto, recibir un golpe mientras cargas dejaba al enemigo en
// dos estados a la vez según el orden en que se ejecutaran los ifs.
const PESO = {
  [EST.DEAD]: 100, [EST.STUN]: 80,
  // TELEGRAPH y CHARGE por ENCIMA de HURT, y esto es una regla de juego,
  // no un detalle: un movimiento ya comprometido no se cancela con un
  // rasguño, solo con un golpe que aturda.
  //
  // Estaban en 40 y 35, por debajo de HURT (60), así que CUALQUIER
  // golpe que pasara el umbral cortaba el aviso. Medido con un troll a
  // solas: con el Filo Escarchado llegaba a embestir el 17% de las
  // veces y con la Espada de Diamante el 25%. O sea que cuanto mejor
  // era tu arma, menos veías la conducta del bicho — al revés de lo que
  // tiene que pasar.
  //
  // Ahora interrumpir una embestida es una DECISIÓN: hay que meterle un
  // golpe lo bastante gordo como para aturdirlo (más del 30% de su vida
  // máxima, ver herir()). Guardarse el golpe fuerte para el momento del
  // aviso pasa a ser jugar bien, en vez de algo que ocurría solo.
  [EST.HURT]: 60, [EST.TELEGRAPH]: 70, [EST.CHARGE]: 65,
  [EST.ATTACK]: 30, [EST.RANGED]: 30, [EST.RETREAT]: 20,
  [EST.CHASE]: 10, [EST.IDLE]: 0,
}

// Cambia de estado si el nuevo tiene derecho. `hasta` es cuándo expira;
// 0 significa "hasta que algo lo cambie".
function irA(en, estado, ahora, duracionMs) {
  const actual = en.fsm || EST.IDLE
  const enCurso = en.fsmHasta && ahora < en.fsmHasta
  if (enCurso && PESO[actual] > PESO[estado]) return false
  if (actual === estado && enCurso) return false
  en.fsm = estado
  en.fsmDesde = ahora
  en.fsmHasta = duracionMs ? ahora + duracionMs : 0
  // El estado que ve el cliente: solo lo que necesita para dibujar.
  en.estado = estado === EST.TELEGRAPH ? 'avisando'
    : estado === EST.CHARGE ? 'cargando'
    : estado === EST.STUN ? 'aturdido'
    : 'normal'
  return true
}

function expirado(en, ahora) { return en.fsmHasta && ahora >= en.fsmHasta }

// Cada enemigo tiene su carácter. No son números distintos: son formas
// distintas de acercarse, de esperar y de reaccionar a que les peguen.
const CARACTER = {
  // Araña: rápida y nerviosa. Se acerca a tirones, muerde y salta hacia
  // atrás. Nunca se queda a cambiar golpes contigo.
  m_spider: { vista: 620, zigzag: 0.9, retirada: 40, retiradaMs: 420, trabaMs: 160 },
  // Esqueleto: lento y tozudo. No retrocede jamás, pero levanta el arma
  // antes de pegar, y ese aviso es tu momento para apartarte.
  m_skeleton: { vista: 560, avisoAtaque: 320, retirada: 0, trabaMs: 220, aguante: 1.4 },
  // Troll: embiste. Si falla y se estampa, se queda aturdido: ahí es
  // cuando se le castiga.
  m_troll: { vista: 700, aturdirAlFallar: 1100, trabaMs: 200, aguante: 1.6 },
  // Golem: como el troll pero más lento, más duro y con un aviso más
  // largo. Aturdirse le cuesta más caro porque tarda más en volver.
  m_golem: { vista: 700, aturdirAlFallar: 1500, trabaMs: 260, aguante: 2.4 },
  // Dragón: mantiene la distancia. Si te acercas, se aparta disparando.
  m_dragon: { vista: 760, retirada: 150, retiradaMs: 600, avisoAtaque: 260, trabaMs: 180, aguante: 1.8 },
  m_demon: { vista: 780, retirada: 140, retiradaMs: 520, avisoAtaque: 220, trabaMs: 160, aguante: 1.6 },
}

function caracterDe(id) { return CARACTER[id] || { vista: 600, trabaMs: 200 } }

// Cuánto descansa un enemigo entre trabas, en múltiplos de lo que dura
// la traba. En 2,5 una araña (160 ms de traba) queda 400 ms libre: le
// da para una mordida. Subirlo hace a los enemigos más difíciles de
// encadenar; bajarlo a 1 devuelve el comportamiento de antes, en el que
// un arma rápida los apagaba del todo.
const DESCANSO_TRABA = 2.5

// Las distancias de vista son generosas a propósito. La arena mide
// 900×600 y los enemigos aparecen a unos 420 px del jugador: con una
// vista de 420 se quedaban titubeando justo en el borde, entrando y
// saliendo de IDLE. El estado IDLE no está para que no te vean —están
// en un foso contigo—, sino para que no salgan disparados en el mismo
// instante en que aparecen.

// Apartarse de un salto. No andando de espaldas: un impulso, como el
// del jugador al esquivar.
//
// Sin esto, "retirarse" era una intención sin efecto — el que se
// retiraba iba a 96 px/s y el jugador a 210, así que no se separaba
// nunca. Lo usan dos conductas por razones distintas: el tirador para
// recuperar su distancia de tiro, y el embestidor para hacerse el
// hueco que su embestida necesita.
function saltarAtras(en, ang, ahora, car) {
  irA(en, EST.RETREAT, ahora, (car && car.retiradaMs) || 400)
  // El impulso vive en la arena (impulsar), que es quien mueve cuerpos.
  // Aquí solo se pide; si un día no estuviera, la retirada sigue
  // funcionando andando, peor pero sin romperse.
  if (typeof impulsar === 'function') impulsar(en, ang + Math.PI, (car && car.empujeRetirada) || 300)
  return true
}

// Un enemigo recibe un golpe. Devuelve true si le ha trabado, para que
// quien llama sepa que ha interrumpido lo que estuviera haciendo.
//
// No toda herida traba: un rasguño a un golem no le hace ni cosquillas.
// Se compara el daño con su vida máxima y con su aguante, así que los
// bichos grandes encajan y los pequeños se descomponen.
//
// ── POR QUÉ HAY UN DESCANSO ENTRE TRABAS ───────────────────────────
//
// Porque sin él, un arma rápida dejaba al enemigo SIN JUGAR.
//
// La traba dura `trabaMs` (160 ms en una araña). Con una daga que pega
// cada 300 ms, el siguiente golpe llegaba antes de que la araña
// terminara de recuperarse, y el siguiente, y el siguiente: se pasaba
// la pelea trabada sin llegar a morder nunca.
//
// Lo que se veía en el banco, mismo jugador, misma arena, dos arañas,
// cambiando SOLO la cadencia del arma:
//
//     cada 300 ms  →   20 de daño recibido
//     cada 460 ms  →  543 de daño recibido
//
// Veintisiete veces más por pegar medio segundo más lento. Eso no es
// un arma peor: es que la rápida apagaba al enemigo y la lenta no. De
// ahí venía que la Daga de fábrica ganara a seis armas de tiers
// superiores, y que craftear tu primera espada te dejara al 9% de vida
// cuando con la daga acababas al 43%.
//
// Ahora, tras recuperarse de una traba, el enemigo tiene una ventana
// en la que no se le puede volver a trabar. Le da tiempo a hacer algo
// —una mordida, un paso, un aviso— antes de volver a encajar.
//
// El ATURDIMIENTO por golpe gordo NO pasa por aquí: ese sigue
// funcionando siempre, porque es la recompensa por meter un golpazo y
// es la forma que tiene el jugador de interrumpir una embestida.
function herir(en, dañoReal, ahora) {
  const car = caracterDe(en.tipoId)
  if (en.hp <= 0) return irA(en, EST.DEAD, ahora, 0)
  const peso = dañoReal / Math.max(1, en.hpMax)
  const umbral = 0.06 * (car.aguante || 1)
  if (peso < umbral) return false
  // Un golpe muy gordo no traba: aturde. Y eso se nota, porque en
  // aturdido no se defiende ni contraataca. El aturdimiento se salta el
  // descanso a propósito: es la jugada del jugador, no un accidente.
  if (peso > 0.30) {
    en.proxTraba = ahora + DESCANSO_TRABA * (car.trabaMs || 200)
    return irA(en, EST.STUN, ahora, 700)
  }
  if (en.proxTraba && ahora < en.proxTraba) return false
  en.proxTraba = ahora + DESCANSO_TRABA * (car.trabaMs || 200)
  return irA(en, EST.HURT, ahora, car.trabaMs || 200)
}
