// Los otros jugadores, en el mundo.
//
// QUÉ HABÍA
// Nada. El mundo 2D era estrictamente de un jugador: dos personas en el
// mismo bosque no se veían, no se cruzaban y no sabían la una de la
// otra. El WebSocket llevaba chat y "presencia", que era literalmente
// una lista de nombres y niveles, sin una sola coordenada.
//
// QUÉ HACE ESTO
// Manda dónde estás diez veces por segundo y dibuja a quien tengas en
// la misma zona: su nombre, su nivel, su aspecto, hacia dónde mira y
// qué arma lleva.
//
// LOS DOS CAMINOS
// Por socket si hay socket, y por HTTP si no. No es paranoia: la v29 y
// la v30 se fueron en diagnosticar "entro y no me puedo mover" y el
// problema estaba fuera del código —un antivirus, un proxy, una
// extensión— y no se arreglaba desde aquí. La arena ya tenía el pulso
// por HTTP; el mundo lo necesita por lo mismo.
//
// LA INTERPOLACIÓN, Y POR QUÉ
// Llegan diez posiciones por segundo y se dibuja a sesenta. Poniendo a
// cada uno donde diga el último paquete, los demás avanzan a tirones de
// diez por segundo. Aquí cada jugador guarda a dónde va y se le lleva
// suavemente, así que se mueven como se mueven las cosas y no como una
// presentación de diapositivas.
PAGES['criptomundo-mundo2d.html'] += `<script>

var OTROS = {}            // usuario → { dibujo, objetivo, datos }
var MUNDO_SOCK = null
var MUNDO_ULT = 0
var MUNDO_ESPACIO = { ancho: 1800, alto: 1200 }
var MUNDO_CORREGIDO = 0

// Cada cuánto se le cuenta al servidor dónde estás. Diez por segundo es
// lo mismo que usa la arena: suficiente para que se vea fluido con
// interpolación y poco para la red.
var MUNDO_PULSO_MS = 100

function mundoAbrirSocket() {
  if (MUNDO_SOCK || typeof WebSocket === 'undefined') return
  try {
    var proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
    MUNDO_SOCK = new WebSocket(proto + location.host + '/ws')
    MUNDO_SOCK.onmessage = function (ev) {
      var m = null
      try { m = JSON.parse(ev.data) } catch (e) { return }
      if (m && m.type === 'mundo') mundoRecibir(m)
    }
    MUNDO_SOCK.onclose = function () { MUNDO_SOCK = null }
    MUNDO_SOCK.onerror = function () { MUNDO_SOCK = null }
  } catch (e) { MUNDO_SOCK = null }
}

// El servidor contesta con dónde estás DE VERDAD y con quién tienes al
// lado. Si corrigió tu posición, se te recoloca: es la señal de que el
// salto no le pareció humano.
function mundoRecibir(m) {
  if (m.tu && m.tu.corregido && gameScene) {
    MUNDO_CORREGIDO++
    gameScene.px = m.tu.x * (gameScene.MW / MUNDO_ESPACIO.ancho)
    gameScene.py = m.tu.y * (gameScene.MH / MUNDO_ESPACIO.alto)
    if (gameScene.playerText) gameScene.playerText.setPosition(gameScene.px, gameScene.py)
  }
  mundoPintarVecinos(m.vecinos || [])
}

async function mundoPulso() {
  if (!gameScene || typeof gameScene.px !== 'number') return
  var ahora = Date.now()
  if (ahora - MUNDO_ULT < MUNDO_PULSO_MS) return
  MUNDO_ULT = ahora

  var pos = {
    zona: currentZone,
    x: gameScene.px / (gameScene.MW / MUNDO_ESPACIO.ancho),
    y: gameScene.py / (gameScene.MH / MUNDO_ESPACIO.alto),
    dir: gameScene.lastDir === 'left' ? Math.PI : gameScene.lastDir === 'up' ? -Math.PI / 2
       : gameScene.lastDir === 'down' ? Math.PI / 2 : 0,
    anim: gameScene.andando ? 'walk' : 'idle',
  }

  if (MUNDO_SOCK && MUNDO_SOCK.readyState === 1) {
    try { MUNDO_SOCK.send(JSON.stringify({ type: 'mundo_entrada', pos: pos })); return }
    catch (e) { MUNDO_SOCK = null }
  }
  // Sin socket, por HTTP. Mismo servidor decidiendo lo mismo.
  var r = await apiPost('/api/mundo/sync', { pos: pos })
  if (r.ok) mundoRecibir(r.data)
}

// Dibujar a los demás. Lo único que decide esta pantalla es el dibujo:
// dónde están lo dice el servidor.
function mundoPintarVecinos(lista) {
  if (!gameScene || !gameScene.add) return
  var escalaX = gameScene.MW / MUNDO_ESPACIO.ancho
  var escalaY = gameScene.MH / MUNDO_ESPACIO.alto
  var vistos = {}

  lista.forEach(function (v) {
    vistos[v.usuario] = true
    var o = OTROS[v.usuario]
    var x = v.x * escalaX, y = v.y * escalaY

    if (!o) {
      var emoji = (v.aspecto && v.aspecto.emoji) || '🧝'
      o = {
        sombra: gameScene.add.ellipse(x, y + 14, 26, 9, 0x000000, 0.3).setDepth(6),
        cuerpo: gameScene.add.text(x, y, emoji, { fontSize: '24px', resolution: 2 })
          .setOrigin(0.5).setDepth(7),
        etiqueta: gameScene.add.text(x, y - 22, v.nombre + ' Nv.' + v.nivel, {
          fontFamily: 'Cinzel', fontSize: '9px', color: '#8BB8F8',
          stroke: '#05070A', strokeThickness: 2, resolution: 2,
        }).setOrigin(0.5).setDepth(8),
        arma: gameScene.add.text(x + 14, y + 2, (v.arma && v.arma.icono) || '', {
          fontSize: '12px', resolution: 2,
        }).setOrigin(0.5).setDepth(7),
        x: x, y: y, destinoX: x, destinoY: y,
        // El paso de los demás. El servidor ya manda 'anim' con cada
        // vecino —walk o idle— desde que existe el mundo compartido, y
        // esta pantalla no lo leía: los otros jugadores se deslizaban
        // igual que te deslizabas tú.
        paso: typeof pasoAndarNuevo === 'function' ? pasoAndarNuevo() : null,
        anim: v.anim || 'idle', sentido: 1,
      }
      OTROS[v.usuario] = o
      addLog('👋 ' + v.nombre + ' anda por aquí.', 'system')
    }
    // No se le planta en el sitio: se le apunta a dónde va y el bucle
    // lo lleva. Si no, los demás avanzan a diez tirones por segundo.
    // Hacia dónde va y hacia dónde mira: lo uno para llevarle suave y
    // lo otro para voltearle. Los dos los decide el servidor.
    if (x < o.destinoX - 0.5) o.sentido = -1
    else if (x > o.destinoX + 0.5) o.sentido = 1
    o.destinoX = x
    o.destinoY = y
    o.anim = v.anim || 'idle'
    o.etiqueta.setText(v.nombre + ' Nv.' + v.nivel)
    o.arma.setText((v.arma && v.arma.icono) || '')
    o.cuerpo.setText((v.aspecto && v.aspecto.emoji) || '🧝')
  })

  // Quien ya no está en la lista se ha ido de la zona o del juego.
  Object.keys(OTROS).forEach(function (u) {
    if (vistos[u]) return
    mundoQuitar(u)
  })
}

function mundoQuitar(u) {
  var o = OTROS[u]
  if (!o) return
  ;['sombra', 'cuerpo', 'etiqueta', 'arma'].forEach(function (k) {
    if (o[k]) { try { o[k].destroy() } catch (e) {} }
  })
  delete OTROS[u]
}

function mundoLimpiar() {
  Object.keys(OTROS).forEach(mundoQuitar)
}

// La interpolación propiamente dicha. Se llama desde el bucle del
// mundo, que va a sesenta por segundo.
function mundoInterpolar(escena) {
  var k = Math.min(1, (escena.game.loop.delta / 1000) * 12)
  Object.keys(OTROS).forEach(function (u) {
    var o = OTROS[u]
    var antesX = o.x, antesY = o.y
    o.x += (o.destinoX - o.x) * k
    o.y += (o.destinoY - o.y) * k

    // El paso. Quien manda es el 'anim' del servidor; el recorrido de
    // este fotograma solo marca la cadencia. Sin la primera condición,
    // la interpolación —que se acerca al destino sin llegar nunca—
    // dejaría a los demás temblando de pie para siempre.
    var subida = 0
    if (o.paso && typeof pasoAndar === 'function') {
      var rec = Math.hypot(o.x - antesX, o.y - antesY)
      var p = pasoAndar(o.paso, o.anim === 'walk', rec, escena.game.loop.delta)
      subida = p.subida
      pasoAndarPintar(o.cuerpo, o.sombra, o.sentido, p)
    }

    o.cuerpo.setPosition(o.x, o.y - subida)
    o.sombra.setPosition(o.x, o.y + 14)
    // La etiqueta NO bota: un nombre temblando encima de la cabeza se
    // lee peor y marea. Se queda quieta sobre el sitio, no sobre el
    // cuerpo.
    o.etiqueta.setPosition(o.x, o.y - 22)
    o.arma.setPosition(o.x + 14 * o.sentido, o.y + 2 - subida)
  })
}

// Abrir el socket en cuanto la pantalla esté viva. Si no se puede, el
// pulso se va solo por HTTP: no hay nada que decidir aquí.
window.addEventListener('load', function () { setTimeout(mundoAbrirSocket, 400) })

// Al cerrar la pestaña, desaparecer del mundo de los demás en vez de
// quedarse de pie hasta que caduque.
window.addEventListener('beforeunload', function () {
  try {
    if (MUNDO_SOCK && MUNDO_SOCK.readyState === 1) {
      MUNDO_SOCK.send(JSON.stringify({ type: 'mundo_salir' }))
    } else if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/mundo/salir', new Blob(['{}'], { type: 'application/json' }))
    }
  } catch (e) {}
})
</script>`
