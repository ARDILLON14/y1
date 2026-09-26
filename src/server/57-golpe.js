// ═══════════════════════════════════════════════════════════════════
//  EL MOTOR DE UN GOLPE — compartido por la arena y el mundo
//
//  Todo esto vivía dentro de 58-arena.js y no tenía nada de arena: son
//  las reglas de cómo se mueve un cuerpo, cómo se reparte un empujón y
//  cuándo un golpe toca. La arena las estrenó; el mundo en tiempo real
//  las necesita iguales, y «iguales» tiene que significar EL MISMO
//  CÓDIGO, no dos copias que se parecen hoy.
//
//  Esta extracción no cambia ni un número. Las pruebas de la arena
//  pasan sin tocar una sola expectativa; si alguna cambiara, la
//  extracción estaría mal.
//
//  LO QUE SIGUE EN LA ARENA: oleadas, el ring de 900×600, las escalas
//  de dificultad, el jefe. Eso sí es de la arena.
// ═══════════════════════════════════════════════════════════════════

// El paso de la simulación. Uno solo para los dos sistemas: si el mundo
// fuera a otro ritmo, una misma arma se sentiría distinta según dónde
// pelees, y eso es exactamente lo que esto viene a evitar.
const PASO_MS = 100

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
// se aplicaba UNA VEZ POR TICK en vez de por segundo, así que la
// velocidad real dependía de si el servidor iba fino o cargado.
const ACEL = 14          // 1/s: cuánto tarda en alcanzar la velocidad pedida
const ROCE_IMPULSO = 6   // 1/s: cuánto tarda en apagarse un empujón
const SEPARACION = 260   // px/s: con cuánta fuerza se despegan dos cuerpos
// Cuánto se pasa de largo el guardia de centros, para que el redondeo
// del estado que viaja al cliente no convierta un 15,05 en un 14,3.
const MARGEN_CENTRO = 1.5

// Fracción que sobrevive tras `dt` segundos con una caída de ritmo k.
// Es lo que hace que la física no cambie porque un tick llegue tarde.
function decaimiento(k, dt) { return Math.exp(-k * dt) }

function limitar(v, min, max) { return v < min ? min : v > max ? max : v }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }

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
//
// `mapa` es { ancho, alto }. Antes esto leía las medidas de la arena
// directamente, que es justo lo que impedía reutilizarlo en el mundo.
// Sin mapa, no hay paredes: el cuerpo va donde le empujen.
function apartar(c, r, dx, dy, mapa) {
  const nx = mapa ? limitar(c.x + dx, r, mapa.ancho - r) : c.x + dx
  const ny = mapa ? limitar(c.y + dy, r, mapa.alto - r) : c.y + dy
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

// El retroceso con nombre propio, que es como lo pide la FASE C.1. Es
// `impulsar` más el mapa: el empujón no puede meter a nadie en una
// pared, porque quien lo recibe se frena contra ella en el mismo paso.
//
// OJO CON LAS UNIDADES (decisión D3 de la auditoría): `fuerza` NO son
// píxeles. Es velocidad añadida al carril de impulsos, que se apaga con
// ROCE_IMPULSO. Un empuje de 130 no desplaza 130 px.
function aplicarRetroceso(cuerpo, ang, fuerza, mapa) {
  if (!cuerpo || !Number.isFinite(ang) || !Number.isFinite(fuerza)) return
  impulsar(cuerpo, ang, fuerza)
  if (!mapa) return
  const r = Number.isFinite(cuerpo.radio) ? cuerpo.radio : 0
  cuerpo.x = limitar(cuerpo.x, r, mapa.ancho - r)
  cuerpo.y = limitar(cuerpo.y, r, mapa.alto - r)
}

// Dos cuerpos no pueden ocupar el mismo sitio. Se separan empujándose,
// no teletransportándose: así un enemigo que te acorrala te desplaza en
// vez de meterse dentro de ti, y la manada deja de apilarse en un punto.
// El peso decide quién cede: el jugador aguanta más que una araña.
function separar(a, b, ra, rb, pesoA, pesoB, mapa) {
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
  const sobra = apartar(a, ra, -cx * hueco * (pesoB / total), -cy * hueco * (pesoB / total), mapa)
  apartar(b, rb, cx * hueco * (pesoA / total) - sobra.x, cy * hueco * (pesoA / total) - sobra.y, mapa)

  // Y además un empujón, que es lo que hace que chocar se NOTE en vez
  // de parecer que los cuerpos se deslizan pegados.
  const fuerza = SEPARACION * (hueco / min)
  impulsar(a, ang + Math.PI, fuerza * (pesoB / total))
  impulsar(b, ang, fuerza * (pesoA / total))
}

// ── Cuerpo y zona golpeable son DOS cosas distintas ────────────────
//
// Hasta el STEP 8, `radio` hacía tres trabajos a la vez: empujar
// cuerpos para que no se apilen, frenar contra la pared, y decidir si
// un golpe toca. Mezclarlos obliga a elegir: un cuerpo generoso para
// que no se solapen los sprites significaba también una zona golpeable
// generosa, así que rozar a un enemigo por el borde contaba como
// recibir el golpe entero. Eso es justo lo que hace que esquivar no se
// sienta como esquivar.
//
//   radio      cuerpo físico: separación entre cuerpos y límite de pared
//   golpeable  zona vulnerable: lo único que decide si un golpe entra
//
// El jugador tiene la zona golpeable MÁS PEQUEÑA que su cuerpo (11 de
// 15). Los enemigos la conservan igual a su cuerpo a propósito:
// encogerla cambiaría el daño por segundo del jugador.
const GOLPEABLE_JUGADOR = 11

function golpeableDe(c) {
  return Number.isFinite(c && c.golpeable) ? c.golpeable : GOLPEABLE_JUGADOR
}
function golpeableEn(en) {
  if (!en) return 0
  if (Number.isFinite(en.golpeable)) return en.golpeable
  return (en.cfg && en.cfg.radio) || 16
}

// ── Las tres fases de un golpe ─────────────────────────────────────
//
// Antes el daño se aplicaba EN EL MISMO INSTANTE en que llegaba la
// intención de atacar. Eso tiene dos consecuencias feas: todas las
// armas se sienten igual, y no hay nada que esquivar.
//
//   ANTICIPACIÓN   el gesto arranca, todavía no toca a nadie
//   ACTIVA         el filo está fuera: aquí y solo aquí hace daño
//   RECUPERACIÓN   el resto, hasta poder volver a pegar
//
// Los tres SUMAN la cadencia, así que el daño por segundo no se mueve
// ni un punto. Lo que cambia no es cuánto pegas, es cuándo llega. Los
// topes evitan los dos extremos: que una daga tenga una anticipación
// imperceptible y que un cetro se congele medio segundo antes de tocar.
function fasesDeGolpe(cadenciaMs) {
  const c = Number.isFinite(cadenciaMs) && cadenciaMs > 0 ? cadenciaMs : 420
  const anticipacion = Math.round(limitar(c * 0.30, 60, 220))
  const activa = Math.round(limitar(c * 0.22, 60, 160))
  return { anticipacion, activa, recuperacion: Math.max(0, c - anticipacion - activa) }
}

// ── ¿Entra el golpe? ───────────────────────────────────────────────
//
// `arco` es la SEMI-apertura EN RADIANES, no los grados totales. Un
// arco de 1,6 barre 183°. Ver la decisión D2 de la auditoría y las
// conversiones de 59-armas-perfil.js: aquí no se convierte nada, se
// compara, y por eso importa que el que llama sepa qué está pasando.
//
// El alcance se mide contra la zona GOLPEABLE del objetivo, no contra
// su cuerpo. Un golpe que roza el borde del cuerpo pero no llega al
// torso, no entra.
function dentroDeSector(origen, dir, alcance, arco, objetivo) {
  if (!origen || !objetivo) return false
  if (!Number.isFinite(dir) || !Number.isFinite(alcance) || !Number.isFinite(arco)) return false
  if (dist(origen, objetivo) > alcance + golpeableEn(objetivo)) return false
  const ang = Math.atan2(objetivo.y - origen.y, objetivo.x - origen.x)
  return anguloEntre(ang, dir) <= arco
}

// Diferencia angular más corta entre dos direcciones, siempre de 0 a π.
// Escrito una vez: la fórmula con el módulo y el desplazamiento de 3π es
// fácil de copiar mal, y copiada mal falla solo cuando apuntas al oeste.
function anguloEntre(a, b) {
  return Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
}

// ── Un golpe, un impacto por objetivo ──────────────────────────────
//
// La ventana activa dura hasta 160 ms y el paso son 100, así que un
// mismo barrido cae en dos pasos y pegaría dos veces al mismo bicho.
// El registro vive en el golpe, no en el objetivo: así dos golpes
// seguidos sí pueden tocar al mismo, que es lo que se espera.
function yaTocado(golpe, id) {
  return !!golpe && Array.isArray(golpe.tocados) && golpe.tocados.includes(id)
}
function anotarTocado(golpe, id) {
  if (!golpe) return
  if (!Array.isArray(golpe.tocados)) golpe.tocados = []
  if (!golpe.tocados.includes(id)) golpe.tocados.push(id)
}
