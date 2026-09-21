
// ═══════════════════════════════════════════════════════════════════
//  PROYECTILES — un solo sitio donde nacen, se mueven y chocan
//
//  QUÉ HABÍA ANTES
//  Dos trozos de código que empujaban objetos sueltos a una lista: uno
//  en el ataque del jugador y otro en el de los enemigos, cada uno con
//  sus campos. El `element` de la Vara de Cristal y del Cetro del
//  Trueno estaba escrito en el catálogo desde siempre y no hacía
//  absolutamente nada.
//
//  Y había un fallo de verdad, invisible leyendo el código:
//
//  EL PROBLEMA DEL SALTO. El servidor avanza 10 veces por segundo, así
//  que una flecha a 460 px/s se mueve 46 px de golpe y LUEGO se mira si
//  toca a alguien. Una araña mide 32 px de ancho: el hueco que deja la
//  flecha entre una posición y la siguiente es mayor que el bicho. Solo
//  acertaban los disparos que caían casi en el centro; los demás
//  pasaban de largo sin que nadie se enterara, ni el jugador ni el log.
//
//  QUÉ HACE AHORA
//  No se pregunta "¿estoy encima de alguien?" sino "¿he pasado por
//  encima de alguien?": se comprueba el SEGMENTO entre la posición
//  anterior y la nueva contra el círculo del objetivo. El tamaño del
//  blanco vuelve a ser su tamaño de verdad, independientemente de lo
//  rápido que vaya el proyectil o de lo cargado que esté el servidor.
//
//  QUIÉN DECIDE: el servidor. El cliente recibe posiciones y colores
//  para dibujar; el impacto, el daño y a quién le toca no se consultan
//  jamás al navegador.
// ═══════════════════════════════════════════════════════════════════

// Los elementos dejan de ser una etiqueta decorativa. Cada uno tiene un
// efecto real y un color, y el color sale de aquí para que la pantalla
// no tenga que saberse la lista.
const ELEMENTOS = {
  normal:    { color: '#F0D070' },
  ice:       { color: '#7FD4F0', lentoMs: 1400, lentoFactor: 0.55 },
  fire:      { color: '#F08040', quemaMs: 2400, quemaCada: 600, quemaFrac: 0.10 },
  lightning: { color: '#C8A0F0', aturdeMs: 500 },
  poison:    { color: '#90D070', quemaMs: 3600, quemaCada: 900, quemaFrac: 0.06 },
}

function elemento(nombre) { return ELEMENTOS[nombre] || ELEMENTOS.normal }

// Un proyectil, con todo lo que se le pide: de dónde sale, hacia dónde,
// cuánto pega, a quién, de qué tamaño, cuánto vive, de qué elemento,
// cuánto empuja y cómo se dibuja.
function crearProyectil(cfg) {
  const el = elemento(cfg.elemento)
  const vel = cfg.vel || 380
  const dir = cfg.dir != null ? cfg.dir : Math.atan2(cfg.vy || 0, cfg.vx || 1)
  return {
    id: nextId('pr'),
    dueño: cfg.dueño || 'jugador',      // 'jugador' | 'enemigo'
    deJugador: (cfg.dueño || 'jugador') === 'jugador',
    x: cfg.x, y: cfg.y,
    prevX: cfg.x, prevY: cfg.y,          // para el barrido: dónde estaba
    dir, vel,
    vx: Math.cos(dir) * vel, vy: Math.sin(dir) * vel,
    radio: cfg.radio || 6,
    dmg: cfg.dmg || 1,
    empuje: cfg.empuje || 60,
    elemento: cfg.elemento || 'normal',
    color: el.color,
    sprite: cfg.sprite || null,          // cuando haya dibujos, aquí van
    atraviesa: cfg.atraviesa || 0,       // cuántos enemigos puede cruzar
    tocados: [],
    muereEn: now() + (cfg.vidaMs || 1200),
    muerto: false,
  }
}

function avanzarProyectil(pr, dt) {
  pr.prevX = pr.x; pr.prevY = pr.y
  pr.x += pr.vx * dt
  pr.y += pr.vy * dt
}

// ¿El tramo recorrido este tick cruza el círculo (cx, cy, r)?
//
// Es la diferencia entre "¿estoy encima?" y "¿he pasado por encima?".
// Lo primero se salta blancos enteros cuando el proyectil va rápido;
// lo segundo no se salta ninguno, vaya a la velocidad que vaya.
function cruza(pr, cx, cy, r) {
  const alcanceTotal = r + pr.radio
  const dx = pr.x - pr.prevX, dy = pr.y - pr.prevY
  const fx = pr.prevX - cx, fy = pr.prevY - cy
  const a = dx * dx + dy * dy
  if (a < 0.0001) return fx * fx + fy * fy <= alcanceTotal * alcanceTotal
  // Punto del segmento más cercano al centro, recortado a [0,1]
  let t = -(fx * dx + fy * dy) / a
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const px = pr.prevX + dx * t - cx
  const py = pr.prevY + dy * t - cy
  return px * px + py * py <= alcanceTotal * alcanceTotal
}

// ── Efectos que dejan los elementos ────────────────────────────────
// Se guardan en el propio ente. Nadie más necesita saber que existen:
// quien pregunte por la velocidad ya recibe la velocidad frenada.
function aplicarElemento(ente, nombre, ahora, dmgBase) {
  const el = elemento(nombre)
  if (el.lentoMs) {
    ente.lentoHasta = ahora + el.lentoMs
    ente.lentoFactor = el.lentoFactor
  }
  if (el.quemaMs) {
    ente.quemaHasta = ahora + el.quemaMs
    ente.quemaCada = el.quemaCada
    ente.quemaDmg = Math.max(1, Math.round(dmgBase * el.quemaFrac))
    ente.quemaProx = ahora + el.quemaCada
  }
  return el
}

// Velocidad de un ente teniendo en cuenta si va frenado.
function velConEfectos(ente, base, ahora) {
  if (ente.lentoHasta && ahora < ente.lentoHasta) return base * (ente.lentoFactor || 0.6)
  return base
}

// Daño por quemadura/veneno que toca soltar ahora, o 0. Devolver el
// daño en vez de aplicarlo mantiene este módulo sin saber nada de
// vidas, botín ni animaciones.
function tocaQuemar(ente, ahora) {
  if (!ente.quemaHasta || ahora > ente.quemaHasta) return 0
  if (ahora < (ente.quemaProx || 0)) return 0
  ente.quemaProx = ahora + (ente.quemaCada || 700)
  return ente.quemaDmg || 0
}
