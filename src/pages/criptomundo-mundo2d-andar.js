// Andar cuando no hay tira de dibujos.
//
// QUÉ PASABA
// Siete aspectos y una sola tira de caminar (la zarigüeya). Los otros
// seis se dibujan con un emoji al que, al moverse, solo se le cambia la
// posición y se le voltea a izquierda o derecha. Es decir: el personaje
// se desliza por el mapa como una pieza de ajedrez. Y lo mismo pasa con
// los demás jugadores: el servidor ya manda 'anim' con cada vecino
// —walk o idle— y esta pantalla nunca lo leyó.
//
// LA CAUSA
// La animación se escribió como "si hay tira, reprodúcela". El camino
// de al lado, el que se recorre casi siempre, no existe: no hay
// respaldo, hay nada.
//
// QUÉ HACE ESTO
// No dibuja piernas —eso son 77 archivos que no puedo hacer yo— pero
// mueve el cuerpo como se mueve al andar: sube y baja con cada apoyo,
// se ladea hacia la pierna que pisa, se achata al plantar el pie y la
// sombra se estrecha cuando el cuerpo está arriba. Con eso deja de
// deslizarse.
//
// TRES DECISIONES, Y POR QUÉ
//
//   · La cadencia la marca la DISTANCIA recorrida, no el reloj. Si vas
//     despacio —el mando táctil a medio empujar— los pasos se dan
//     despacio. Con un temporizador, andar despacio se vería como
//     patalear en el sitio.
//   · La fuerza entra y sale poco a poco. Al soltar la tecla el cuerpo
//     se posa en vez de congelarse a media zancada.
//   · Se apaga solo. En cuanto un aspecto traiga su tira de verdad,
//     existe playerSprite y nada de esto se aplica. No hay que quitarlo
//     después ni hay dos animaciones peleando.
//
// NO DECIDE NADA DEL JUEGO. Ni posición, ni colisión, ni velocidad: de
// eso sigue mandando el servidor. Esto solo elige cómo se pinta lo que
// ya se decidió, y por eso vive en la pantalla y no en el servidor.
PAGES['criptomundo-mundo2d.html'] += `<script>

// Píxeles por zancada completa (los dos pies). Está anclado a las
// nubecillas de polvo: salen cada 200 ms y a velocidad máxima se
// recorren unos 34 px en ese rato, o sea un apoyo por nubecilla.
var ANDAR_PASO_PX = 68
var ANDAR_SUBIDA  = 3      // píxeles que sube el cuerpo a media zancada
var ANDAR_LADEO   = 4      // grados de balanceo
var ANDAR_APAGADO = 180    // ms en pasar de quieto a andando y al revés

function pasoAndarNuevo() { return { fase: 0, fuerza: 0 } }

// El reposo. Se devuelve tal cual cuando no hay estado o cuando lo que
// llega no son números: una pantalla nunca debe romperse por esto.
function pasoAndarQuieto() {
  return { subida: 0, ladeo: 0, anchoX: 1, altoY: 1, sombra: 1 }
}

// estado    { fase, fuerza }, se modifica en el sitio
// andando   si el cuerpo se está moviendo (lo dice quien llama)
// dist      píxeles recorridos desde el fotograma anterior
// dt        milisegundos desde el fotograma anterior
function pasoAndar(estado, andando, dist, dt) {
  if (!estado) return pasoAndarQuieto()

  var d = Number(dist)
  var ms = Number(dt)
  if (!isFinite(d) || d < 0) d = 0
  if (!isFinite(ms) || ms < 0) ms = 0
  var mueve = !!andando && d > 0.01

  // La fase da una vuelta por zancada. Se envuelve en 2π para que no
  // crezca sin fin y para que el balanceo, que es un seno de la fase,
  // no dé un salto al envolverse: sin(0) y sin(2π) son el mismo punto.
  var VUELTA = Math.PI * 2
  if (mueve) {
    estado.fase = (estado.fase + (d / ANDAR_PASO_PX) * VUELTA) % VUELTA
    if (!isFinite(estado.fase)) estado.fase = 0
  }

  // La fuerza sube y baja a ritmo CONSTANTE, no acercándose a un
  // objetivo por fracciones. Con lo segundo —que fue lo primero que
  // escribí— la cola es exponencial y no termina nunca: medido, el
  // cuerpo seguía botando 1.072 ms después de soltar la tecla, seis
  // veces lo que dice la constante que se llama "apagado". Así el
  // número significa lo que dice: tarda ANDAR_APAGADO en arrancar y lo
  // mismo en posarse, y se posa del todo.
  var avance = ANDAR_APAGADO > 0 ? ms / ANDAR_APAGADO : 1
  var meta = mueve ? 1 : 0
  if (!isFinite(estado.fuerza)) estado.fuerza = 0
  if (estado.fuerza < meta) estado.fuerza = Math.min(meta, estado.fuerza + avance)
  else if (estado.fuerza > meta) estado.fuerza = Math.max(meta, estado.fuerza - avance)

  var f = estado.fuerza
  if (f === 0) return pasoAndarQuieto()

  // Dos apoyos por zancada: el cuerpo sube en medio de cada una y toca
  // el suelo al plantar el pie. El balanceo es el mismo seno con signo,
  // así que se ladea hacia el lado del pie que aguanta.
  var seno = Math.sin(estado.fase)
  var alto = Math.abs(seno)
  var planta = 1 - alto          // 1 justo al plantar el pie

  return {
    subida: alto * ANDAR_SUBIDA * f,
    ladeo:  seno * ANDAR_LADEO * f,
    anchoX: 1 + planta * 0.06 * f,
    altoY:  1 - planta * 0.08 * f,
    sombra: 1 - alto * 0.22 * f,
  }
}

// Ponerle el paso a un cuerpo cualquiera: el tuyo o el de un vecino.
// Se le pasa el dibujo, la sombra (o null), hacia dónde mira y el
// resultado de pasoAndar. Todo va entre try porque un fallo aquí no
// puede llevarse por delante el bucle del mundo.
function pasoAndarPintar(cuerpo, sombra, sentido, p, escala) {
  if (!cuerpo || !p) return
  var s = sentido < 0 ? -1 : 1
  var e = isFinite(Number(escala)) && Number(escala) > 0 ? Number(escala) : 1
  try {
    cuerpo.setScale(s * p.anchoX * e, p.altoY * e)
    cuerpo.setAngle(p.ladeo * s)
  } catch (err) { /* el cuerpo se queda como estaba */ }
  try {
    if (sombra) sombra.setScale(p.sombra, p.sombra)
  } catch (err) { /* la sombra se queda como estaba */ }
}
</script>`
