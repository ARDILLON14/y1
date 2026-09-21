// Los recursos del mundo, en el mundo.
//
// El sistema entero —árboles y vetas con vida, herramienta requerida,
// durabilidad, botín y reaparición— ya estaba escrito en el servidor y
// probado con 47 comprobaciones en verde. Lo que no tenía era pantalla:
// /api/recursos y /api/recursos/golpear no los llamaba NADIE, y hasta
// las coordenadas de cada nodo venían con un comentario que decía que
// el cliente las usaba para dibujarlos. No las usaba nadie.
//
// Mientras tanto, la única forma de conseguir madera era entrar al
// bosque, abrir el huerto y pulsar "reclamar": el recurso aparecía de
// la nada. Esto es lo otro, que es lo que se pedía: ves el árbol, te
// acercas y lo talas.
//
// QUÉ DECIDE CADA UNO
// El cliente dibuja y dice "golpeo este nodo, y estoy aquí". El daño,
// la vida que le queda, el botín, el desgaste de la herramienta y el
// reloj de reaparición los decide el servidor. Mandar mil peticiones no
// tira más madera: el nodo tiene la vida que tiene, hay que recuperar
// el golpe entre uno y otro, y luego tarda en volver.
PAGES['criptomundo-mundo2d.html'] += `<script>

var NODOS_REC = []          // lo que dice el servidor, ya en coordenadas de pantalla
var DIBUJO_REC = []         // los objetos de Phaser, en el mismo orden
var ESCALA_REC = { x: 1, y: 1 }
var ALCANCE_REC = 90
var HERRAMIENTA_REC = null
var nodoCerca = null
var golpeEnVuelo = false
// Cuántas veces se ha pedido cargar. Cambiar de zona dos veces seguidas
// lanza dos peticiones, y gana la que conteste la última: sin esto, una
// respuesta lenta del bosque podía pintar árboles encima de las minas.
var cargaRec = 0

// El servidor dice en qué espacio están sus coordenadas, así que no hay
// que suponer ninguna escala: se convierte y ya está. Si mañana el mapa
// crece, los nodos siguen donde toca sin tocar nada.
function escalarNodo(n) {
  return { x: n.x * ESCALA_REC.x, y: n.y * ESCALA_REC.y }
}

async function cargarRecursos(escena) {
  var mia = ++cargaRec
  limpiarRecursos(escena)
  var r = await apiGet('/api/recursos')
  // Mientras se esperaba, el jugador cambió de zona otra vez: esta
  // respuesta ya no vale y pintarla dejaría nodos de otro sitio.
  if (mia !== cargaRec) return
  if (!r.ok) return
  var d = r.data
  HERRAMIENTA_REC = d.herramienta || null
  ALCANCE_REC = d.alcance || 90
  if (d.espacio && d.espacio.ancho && escena) {
    ESCALA_REC = { x: escena.MW / d.espacio.ancho, y: escena.MH / d.espacio.alto }
  }
  // La zona la dice el servidor, no el nombre que use esta pantalla:
  // aquí se llaman bosque y minas, y allí forest y mines.
  NODOS_REC = (d.nodos || []).filter(function (n) { return n.zona === d.zonaActual })
  NODOS_REC.forEach(function (n) { dibujarNodo(escena, n) })
}

function limpiarRecursos(escena) {
  DIBUJO_REC.forEach(function (g) {
    ;['icono', 'sombra', 'nombre', 'barraFondo', 'barra', 'aviso'].forEach(function (k) {
      if (g[k]) { try { g[k].destroy() } catch (e) {} }
    })
  })
  DIBUJO_REC = []
  NODOS_REC = []
  nodoCerca = null
}

function dibujarNodo(escena, n) {
  if (!escena || !escena.add) return
  var p = escalarNodo(n)
  var apagado = !!n.agotado

  var sombra = escena.add.ellipse(p.x, p.y + 14, 30, 10, 0x000000, 0.3).setDepth(5)
  var icono = escena.add.text(p.x, p.y, n.icono, { fontSize: '26px', resolution: 2 })
    .setOrigin(0.5).setDepth(6).setAlpha(apagado ? 0.28 : 1)
  var nombre = escena.add.text(p.x, p.y - 20, n.nombre, {
    fontFamily: 'Cinzel', fontSize: '8px', color: '#8BC88B99',
    stroke: '#05070A', strokeThickness: 2, resolution: 2,
  }).setOrigin(0.5).setDepth(6)

  // La barra solo aparece cuando el nodo está tocado: un bosque entero
  // con quince barras llenas es ruido, no información.
  var barraFondo = escena.add.rectangle(p.x, p.y + 22, 34, 4, 0x0F1219).setDepth(6).setVisible(false)
  var barra = escena.add.rectangle(p.x - 17, p.y + 22, 34, 4, 0x4CAF50).setOrigin(0, 0.5).setDepth(7).setVisible(false)

  var aviso = escena.add.text(p.x, p.y + 34, '', {
    fontFamily: 'Cinzel', fontSize: '9px', color: '#C8A84B',
    stroke: '#05070A', strokeThickness: 3, resolution: 2,
  }).setOrigin(0.5).setDepth(11)

  DIBUJO_REC.push({ n: n, icono: icono, sombra: sombra, nombre: nombre,
                    barraFondo: barraFondo, barra: barra, aviso: aviso, p: p })
  pintarVidaNodo(DIBUJO_REC[DIBUJO_REC.length - 1])
}

function pintarVidaNodo(g) {
  var n = g.n
  var tocado = n.vida < n.vidaMax && !n.agotado
  g.barraFondo.setVisible(tocado)
  g.barra.setVisible(tocado)
  if (tocado) {
    var frac = Math.max(0, Math.min(1, n.vida / n.vidaMax))
    g.barra.width = 34 * frac
    g.barra.fillColor = frac > 0.5 ? 0x4CAF50 : frac > 0.25 ? 0xC8A84B : 0xE03030
  }
  g.icono.setAlpha(n.agotado ? 0.28 : 1)
  g.sombra.setAlpha(n.agotado ? 0.12 : 0.3)
}

// Qué poner encima del nodo que tienes delante. Es el sitio donde el
// jugador se entera de que le falta un hacha, de que su pico es flojo o
// de cuánto queda para que el árbol vuelva.
function textoAviso(n) {
  if (n.agotado) return 'vuelve en ' + n.reapareceEn + 's'
  var util = n.util === 'hacha' ? 'un hacha' : 'un pico'
  if (!HERRAMIENTA_REC) return 'necesitas ' + util
  if (HERRAMIENTA_REC.tipo !== n.util) return 'necesitas ' + util
  if (HERRAMIENTA_REC.nivel < n.nivel) return 'tu ' + HERRAMIENTA_REC.tipo + ' es demasiado básico'
  return '[ESPACIO] ' + (n.util === 'hacha' ? 'talar' : 'picar') +
         '  ·  ' + HERRAMIENTA_REC.icono + ' ' + HERRAMIENTA_REC.durabilidad
}

// Se llama desde el bucle del mundo. Decide cuál tienes delante y
// mantiene los rótulos donde toca.
function actualizarRecursos(escena) {
  nodoCerca = null
  var mejor = Infinity
  DIBUJO_REC.forEach(function (g) {
    var d = Phaser.Math.Distance.Between(escena.px, escena.py, g.p.x, g.p.y)
    var dentro = d < ALCANCE_REC * ESCALA_REC.x
    g.aviso.setVisible(dentro)
    if (dentro) {
      g.aviso.setText(textoAviso(g.n))
      if (d < mejor) { mejor = d; nodoCerca = g }
    }
    // El contador de reaparición baja a la vista en vez de quedarse
    // clavado en el número que traía la última petición.
    if (g.n.agotado && g.n.reapareceEn > 0) {
      g.n.reapareceEn = Math.max(0, g.n.reapareceEn - escena.game.loop.delta / 1000)
      g.n.reapareceEn = Math.round(g.n.reapareceEn * 10) / 10
      if (g.n.reapareceEn <= 0) { g.n.agotado = false; g.n.vida = g.n.vidaMax; pintarVidaNodo(g) }
    }
  })
}

// ¿Hay algo que golpear delante? Tiene que poder contestarse SIN
// esperar al servidor: quien pregunta es la tecla ESPACIO, que decide
// en el acto si esto es talar o atacar. golpearNodoCercano() es async y
// devuelve una promesa, que siempre es cierta: preguntándole a ella,
// ESPACIO no volvería a atacar a un monstruo jamás.
function hayNodoDelante() {
  return !!nodoCerca
}

// El golpe. Manda la intención y pinta lo que conteste el servidor.
async function golpearNodoCercano(escena) {
  if (!nodoCerca || golpeEnVuelo) return false
  var g = nodoCerca
  golpeEnVuelo = true
  var r = await apiPost('/api/recursos/golpear', {
    nodoId: g.n.id,
    // La posición va en el espacio del SERVIDOR, deshaciendo la escala.
    pos: { x: escena.px / ESCALA_REC.x, y: escena.py / ESCALA_REC.y },
  })
  golpeEnVuelo = false

  if (!r.ok) {
    // "Todavía estás recuperando el golpe" es normal al machacar la
    // tecla: no merece un aviso en mitad de la pantalla.
    if (r.data.error && /recuperando/i.test(r.data.error)) return true
    showToast('⚠️ ' + (r.data.error || 'No se pudo golpear'))
    return true
  }

  var d = r.data
  g.n.vida = d.vida
  g.n.vidaMax = d.vidaMax
  g.n.agotado = !!d.agotado
  pintarVidaNodo(g)
  HERRAMIENTA_REC = d.herramienta || null

  sacudirNodo(escena, g)
  numeroDeGolpe(escena, g, d.golpe)
  astillas(escena, g)

  if (d.rota) {
    showToast('💥 ¡Tu herramienta se ha roto!')
    addLog('💥 Tu herramienta se ha roto.', 'system')
  }
  if (d.agotado) {
    ;(d.obtenido || []).forEach(function (o) {
      addLog(o.icono + ' ' + o.nombre + ' ×' + o.cantidad, 'loot')
    })
    if ((d.obtenido || []).length) {
      showToast((d.obtenido[0].icono || '📦') + ' ' +
        d.obtenido.map(function (o) { return o.nombre + ' ×' + o.cantidad }).join(', '))
    } else {
      showToast('🍂 No cayó nada aprovechable')
    }
    if (d.xp) addLog('✨ +' + d.xp + ' XP por recolectar', 'loot')
    ;(d.levelUps || []).forEach(function (lu) { addLog('⭐ Nivel ' + lu.level, 'loot') })
    ;(d.questUpdates || []).forEach(function (q) {
      addLog('📜 Misión: objetivo ' + q.current + '/' + q.required, 'loot')
    })
    // La vida y la XP cambian en el servidor: se vuelve a preguntar.
    syncCharacter()
    // Y el nodo trae su propio reloj de vuelta.
    refrescarUnNodo(g)
  }
  return true
}

// Tras agotar un nodo, el tiempo de reaparición lo sabe el servidor.
async function refrescarUnNodo(g) {
  var r = await apiGet('/api/recursos')
  if (!r.ok) return
  var fresco = (r.data.nodos || []).find(function (x) { return x.id === g.n.id })
  if (!fresco) return
  g.n.reapareceEn = fresco.reapareceEn
  g.n.agotado = fresco.agotado
  g.n.vida = fresco.vida
  pintarVidaNodo(g)
}

// ── Que el golpe se NOTE ───────────────────────────────────────────
function sacudirNodo(escena, g) {
  escena.tweens.add({
    targets: g.icono, x: g.p.x + 4, duration: 55, yoyo: true, repeat: 1,
    onComplete: function () { g.icono.x = g.p.x },
  })
}

function numeroDeGolpe(escena, g, dmg) {
  if (!dmg) return
  var t = escena.add.text(g.p.x + Phaser.Math.Between(-8, 8), g.p.y - 6, '-' + dmg, {
    fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#F0D070',
    stroke: '#05070A', strokeThickness: 3, resolution: 2,
  }).setOrigin(0.5).setDepth(14)
  escena.tweens.add({
    targets: t, y: g.p.y - 34, alpha: 0, duration: 650,
    onComplete: function () { t.destroy() },
  })
}

function astillas(escena, g) {
  for (var i = 0; i < 5; i++) {
    // let, no var: con var las cinco astillas comparten la misma
    // variable y al acabar la animación se destruye cinco veces la
    // última, dejando cuatro cuadraditos clavados en el suelo.
    let a = Math.random() * Math.PI * 2
    let trozo = escena.add.rectangle(g.p.x, g.p.y, 3, 3, 0xC8A84B).setDepth(13)
    escena.tweens.add({
      targets: trozo,
      x: g.p.x + Math.cos(a) * Phaser.Math.Between(14, 30),
      y: g.p.y + Math.sin(a) * Phaser.Math.Between(10, 24),
      alpha: 0, duration: Phaser.Math.Between(260, 460),
      onComplete: function () { trozo.destroy() },
    })
  }
}
</script>`
