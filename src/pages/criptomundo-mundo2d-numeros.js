// Los números de daño que suben y se desvanecen.
//
// Otra función pura. Recibe un suceso del servidor y cuántos
// milisegundos hace que llegó, y devuelve dónde se pinta, con qué
// transparencia y de qué tamaño. Nada más.
//
// POR QUÉ IMPORTA QUE SEA PURA
// Un número de daño es la única prueba que tiene el jugador de que su
// golpe hizo algo. Si se pinta mal —se queda clavado, se apila, no se
// va— parece que el juego se ha colgado. Y eso es lo que se puede
// comprobar sin abrir un navegador: que a los 700 ms el alfa sea cero.
PAGES['criptomundo-mundo2d.html'] += `<script>

var NUM_VIDA_MS = 700          // lo que dura un número en pantalla
var NUM_DESVANECE_MS = 250     // los últimos milisegundos, difuminándose
var NUM_SUBIDA_PX = 24         // cuánto sube en toda su vida

// suceso   { cantidad, critico, propio, x, y, desvio }
// edadMs   cuánto hace que llegó
function numeroFlotante(suceso, edadMs) {
  var s = suceso || {}
  var e = Number(edadMs)
  if (!isFinite(e) || e < 0) e = 0
  var vivo = e < NUM_VIDA_MS

  // Sube deprisa al principio y frena: así se lee aunque salgan varios
  // seguidos.
  var p = Math.min(1, e / NUM_VIDA_MS)
  var subida = NUM_SUBIDA_PX * (1 - (1 - p) * (1 - p))

  // El desvanecido es solo el tramo final. Antes, opaco.
  var alfa = 1
  var desde = NUM_VIDA_MS - NUM_DESVANECE_MS
  if (e >= desde) alfa = Math.max(0, 1 - (e - desde) / NUM_DESVANECE_MS)
  if (!vivo) alfa = 0

  var critico = !!s.critico
  var propio = !!s.propio

  return {
    vivo: vivo,
    texto: String(Math.max(0, Math.round(Number(s.cantidad) || 0))),
    x: (Number(s.x) || 0) + (Number(s.desvio) || 0),
    y: (Number(s.y) || 0) - subida,
    alfa: alfa,
    // Un crítico es más grande y amarillo; lo que recibe el jugador, rojo.
    escala: critico ? 1.3 : 1,
    color: propio ? '#F87171' : (critico ? '#F0D070' : '#FFFFFF'),
  }
}

// El desvío lateral al azar, para que dos números seguidos no se tapen.
// Se calcula UNA vez, al nacer el número, no en cada fotograma: si no,
// el número tiembla en vez de subir recto.
function desvioDeNumero() { return (Math.random() * 16) - 8 }

// El temblor de cámara. Dos píxeles, cien milisegundos, y solo cuando el
// jugador recibe daño o da un crítico: si tiembla con todo, deja de
// significar nada y marea.
var TEMBLOR_PX = 2
var TEMBLOR_MS = 100

function temblorDeCamara(edadMs, activo) {
  if (!activo) return { x: 0, y: 0 }
  var e = Number(edadMs)
  if (!isFinite(e) || e < 0 || e >= TEMBLOR_MS) return { x: 0, y: 0 }
  var fuerza = TEMBLOR_PX * (1 - e / TEMBLOR_MS)
  return {
    x: (Math.random() * 2 - 1) * fuerza,
    y: (Math.random() * 2 - 1) * fuerza,
  }
}

// ¿Se puede temblar? Si el sistema pide menos movimiento, no. Y hay un
// ajuste propio para quien lo quiera quitar aunque su sistema no lo pida.
var TEMBLOR_PERMITIDO = true
function temblorActivo() {
  if (!TEMBLOR_PERMITIDO) return false
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  } catch (e) {}
  return true
}
</script>`
