// La pose del arma mientras golpeas.
//
// QUÉ RESUELVE
// El servidor dice CUÁNDO empieza un golpe, cuánto dura su anticipación
// y cuánto su parte activa (57-golpe.js). Lo que no dice —ni debe— es
// dónde se dibuja el arma en cada instante. Eso es esto.
//
// Es una función PURA: se le da el tipo de arma, en qué fase va, cuánto
// ha avanzado y hacia dónde apuntas, y devuelve cuatro números. No mira
// el reloj, no toca el DOM y no pide nada. Por eso se prueba sin
// navegador, igual que el paso de andar.
//
// LAS UNIDADES, OTRA VEZ
// El ángulo que devuelve es RELATIVO a la dirección de apuntado y va en
// radianes. Quien dibuja suma: apuntado + pose − spriteAngulo. Esa resta
// del final es porque los PNG del juego llevan la hoja en diagonal y lo
// declaran en su ficha (ver la decisión D8 de la auditoría).
PAGES['criptomundo-mundo2d.html'] += `<script>

// Reposo: el arma colgando, un poco hacia abajo y atrás.
var POSE_REPOSO = { angulo: -0.52, offsetX: 0, offsetY: 0, escala: 1 }

function poseReposo() { return { angulo: POSE_REPOSO.angulo, offsetX: 0, offsetY: 0, escala: 1 } }

// tipoUso    'espada' | 'lanza' | 'arco' | 'magia'
// fase       'anticipacion' | 'activa' | 'recuperacion' | otra cosa = reposo
// progreso   0 a 1 dentro de esa fase
// arco       semi-apertura del arma EN RADIANES (la misma que el servidor)
function poseArma(tipoUso, fase, progreso, arco) {
  var p = Number(progreso)
  if (!isFinite(p)) p = 0
  if (p < 0) p = 0
  if (p > 1) p = 1
  var a = Number(arco)
  if (!isFinite(a) || a <= 0) a = 1.05
  var t = String(tipoUso || 'espada')
  var f = String(fase || 'reposo')
  if (f !== 'anticipacion' && f !== 'activa' && f !== 'recuperacion') return poseReposo()

  if (t === 'lanza') return poseLanza(f, p, a)
  if (t === 'arco') return poseArco(f, p)
  if (t === 'magia') return poseMagia(f, p)
  return poseEspada(f, p, a)
}

// Espada: se echa atrás hasta pasarse del arco, barre de un extremo al
// otro acelerando al principio, y vuelve a reposo.
function poseEspada(f, p, arco) {
  var medio = arco
  if (f === 'anticipacion') {
    return { angulo: -(medio + 0.35) * suave(p), offsetX: 0, offsetY: 0, escala: 1 }
  }
  if (f === 'activa') {
    // Acelera al principio: el filo cruza rápido y frena al final, que
    // es como se siente el peso de un barrido.
    var k = 1 - (1 - p) * (1 - p)
    return { angulo: -(medio + 0.35) + (2 * medio + 0.35) * k, offsetX: 0, offsetY: 0, escala: 1 }
  }
  return { angulo: medio * (1 - p) + POSE_REPOSO.angulo * p, offsetX: 0, offsetY: 0, escala: 1 }
}

// Lanza: no gira, sale disparada por el eje de puntería y vuelve.
function poseLanza(f, p, arco) {
  if (f === 'anticipacion') return { angulo: 0.10 * p, offsetX: -8 * p, offsetY: 0, escala: 1 }
  if (f === 'activa') {
    var k = Math.sqrt(p)
    return { angulo: 0.10 - 0.10 * k, offsetX: -8 + 34 * k, offsetY: 0, escala: 1 }
  }
  return { angulo: 0, offsetX: 26 * (1 - p), offsetY: 0, escala: 1 }
}

// Arco: se tensa encogiéndose, suelta, y vuelve.
function poseArco(f, p) {
  if (f === 'anticipacion') return { angulo: 0, offsetX: -4 * p, offsetY: 0, escala: 1 - 0.1 * p }
  if (f === 'activa') return { angulo: 0, offsetX: -4 + 6 * p, offsetY: 0, escala: 0.9 + 0.1 * p }
  return { angulo: POSE_REPOSO.angulo * p, offsetX: 0, offsetY: 0, escala: 1 }
}

// Magia: el arma sube y brilla, destella, y baja.
function poseMagia(f, p) {
  if (f === 'anticipacion') return { angulo: -0.3 * p, offsetX: 0, offsetY: -4 * p, escala: 1 + 0.08 * p }
  if (f === 'activa') return { angulo: -0.3, offsetX: 0, offsetY: -4, escala: 1.08 + 0.22 * p }
  return { angulo: -0.3 * (1 - p) + POSE_REPOSO.angulo * p, offsetX: 0, offsetY: -4 * (1 - p), escala: 1.3 - 0.3 * p }
}

function suave(p) { return p * p * (3 - 2 * p) }

// En qué fase va un golpe, según los tiempos que mandó el servidor.
// Devuelve también el progreso dentro de la fase, que es lo que come
// poseArma(). Si el golpe ya terminó, reposo.
function faseDeGolpe(golpe, ahora) {
  if (!golpe) return { fase: 'reposo', progreso: 0 }
  var ini = Number(golpe.inicio), des = Number(golpe.desde), has = Number(golpe.hasta)
  var t = Number(ahora)
  if (!isFinite(ini) || !isFinite(des) || !isFinite(has) || !isFinite(t)) return { fase: 'reposo', progreso: 0 }
  if (t < des) {
    var d1 = des - ini
    return { fase: 'anticipacion', progreso: d1 > 0 ? (t - ini) / d1 : 1 }
  }
  if (t <= has) {
    var d2 = has - des
    return { fase: 'activa', progreso: d2 > 0 ? (t - des) / d2 : 1 }
  }
  // La recuperación no la manda el servidor: es lo que queda hasta
  // poder volver a pegar. Se le da una duración fija para que el arma
  // vuelva a su sitio en vez de quedarse plantada a media zancada.
  var d3 = 180
  var p3 = (t - has) / d3
  if (p3 >= 1) return { fase: 'reposo', progreso: 0 }
  return { fase: 'recuperacion', progreso: p3 }
}

// Si el personaje mira a la izquierda, el arma se voltea EN VERTICAL, no
// en horizontal: así el filo sigue mirando arriba. Es lo mismo que ya
// hace la arena (criptomundo-arena.js), y es lo que hace cualquier juego
// 2D con sprites laterales.
function volteoDeArma(dirApuntado) {
  return Math.cos(Number(dirApuntado) || 0) < 0 ? -1 : 1
}
</script>`
