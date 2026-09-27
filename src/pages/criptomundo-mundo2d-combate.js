// El combate en tiempo real, en pantalla.
//
// QUÉ HABÍA
// La FASE C puso los monstruos en el servidor —compartidos por zona, con
// su vida y su posición— y NADIE los dibujaba. El mapa seguía inventando
// los suyos en el navegador y abriendo batallas por turnos al tocarlos.
// Dos mundos a la vez, y el bueno invisible.
//
// QUÉ HACE ESTO
// Pulsa /api/mundo/combate diez veces por segundo, dibuja lo que
// conteste el servidor y manda la intención: hacia dónde apuntas y si
// tienes pulsado. No decide nada. El daño, la vida, el botín y a quién
// toca el golpe siguen saliendo del servidor.
//
// Y APAGA EL MUNDO FALSO donde el servidor sí simula. Si una zona le
// devuelve monstruos, el navegador deja de poner los suyos y de abrir
// batallas por turnos ahí. Donde el servidor no simula —el pueblo, la
// cripta, el castillo— todo sigue exactamente como estaba.
//
// LA PREDICCIÓN, Y POR QUÉ NO ES UN ADORNO
// Medido en la FASE A: de pulsar a ver el gesto pasan 98 ms sin hacer
// nada. Si el arma no se moviera hasta que contesta el servidor, el
// botón se sentiría roto. Así que el GESTO arranca al pulsar, en local.
// El daño, el número y el destello NO: esos solo se pintan cuando llega
// el suceso del servidor. Si el servidor rechaza el golpe, el arma
// vuelve a reposo y no ha pasado nada.
PAGES['criptomundo-mundo2d.html'] += `<script>

var MC = {
  activo: false,          // ¿el servidor simula esta zona?
  monstruos: {},          // id → { dibujo, vida, destino, ... }
  proyectiles: {},
  numeros: [],
  ultimoPulso: 0,
  apuntar: 0,
  pulsado: false,
  bloquear: false,
  golpeLocal: null,       // predicción: el gesto arranca aquí
  golpeServidor: null,
  temblorDesde: 0,
  temblorActivo: false,
  arma: { tipoUso: 'espada', arco: 1.05, imagen: null, empunadura: { x: 0.79, y: 0.79 }, spriteAngulo: -2.356 },
  seq: 0,
}

var MC_PULSO_MS = 100
var MC_RETRASO_MS = 100     // interpolación: se dibuja un paso por detrás

// ── El pulso ───────────────────────────────────────────────────────
async function mcPulso() {
  if (!gameScene || typeof gameScene.px !== 'number') return
  var ahora = Date.now()
  if (ahora - MC.ultimoPulso < MC_PULSO_MS) return
  MC.ultimoPulso = ahora
  MC.seq++

  var pos = {
    zona: currentZone,
    x: gameScene.px / (gameScene.MW / MUNDO_ESPACIO.ancho),
    y: gameScene.py / (gameScene.MH / MUNDO_ESPACIO.alto),
    dir: MC.apuntar,
    anim: gameScene.andando ? 'walk' : 'idle',
  }
  var entrada = {
    seq: MC.seq,
    ax: Math.cos(MC.apuntar), ay: Math.sin(MC.apuntar),
    pulsado: !!MC.pulsado, bloquear: !!MC.bloquear,
  }
  var r = await apiPost('/api/mundo/combate', { pos: pos, entrada: entrada })
  if (r.ok) mcRecibir(r.data)
}

function mcRecibir(d) {
  if (!d) return
  var habia = MC.activo
  MC.activo = (d.monstruos || []).length > 0 || Object.keys(MC.monstruos).length > 0
  // La primera vez que una zona resulta estar simulada, se apagan los
  // monstruos de mentira del navegador.
  if (!habia && MC.activo && typeof mcApagarFalsos === 'function') mcApagarFalsos()

  mcPintarMonstruos(d.monstruos || [])
  mcPintarProyectiles(d.proyectiles || [])
  if (d.yo) {
    MC.golpeServidor = d.yo.golpe || null
    if (typeof PLAYER_HP_SYNC === 'function') PLAYER_HP_SYNC(d.yo)
  }
  for (var i = 0; i < (d.sucesos || []).length; i++) mcSuceso(d.sucesos[i])
}

function mcSuceso(s) {
  if (!s) return
  if (s.tipo === 'dano') {
    var m = MC.monstruos[s.a]
    mcNumero(s.cantidad, false, m ? m.x : gameScene.px, m ? m.y : gameScene.py, false)
    if (m) mcDestello(m)
  } else if (s.tipo === 'dano_jugador' || (s.tipo === 'dano' && s.a === 'yo')) {
    mcNumero(s.cantidad, false, gameScene.px, gameScene.py, true)
    mcTemblar()
    if (s.bloqueado) addLog('🛡️ Bloqueaste el golpe.', 'combat')
  } else if (s.tipo === 'muerte_monstruo') {
    mcQuitarMonstruo(s.id)
  } else if (s.tipo === 'aviso') {
    var a = MC.monstruos[s.de]
    if (a) a.avisandoHasta = Date.now() + (s.ms || 500)
    addLog('⚠️ ¡Prepara un golpe fuerte! Bloquea con el clic derecho.', 'combat')
  } else if (s.tipo === 'recompensa') {
    addLog('💰 +' + s.oro + ' oro · +' + s.xp + ' XP', 'reward')
    for (var i = 0; i < (s.botin || []).length; i++) {
      addLog('🎁 ' + (s.botin[i].itemId) + ' ×' + (s.botin[i].quantity || 1), 'reward')
    }
    if ((s.subidas || []).length) addLog('⭐ ¡Nivel ' + s.nivel + '!', 'reward')
    if (typeof syncCharacter === 'function') syncCharacter()
    if (typeof cargarHotbar === 'function') cargarHotbar()
  } else if (s.tipo === 'muerte') {
    addLog('💀 Has caído. Pierdes ' + s.oroPerdido + ' de oro.', 'combat')
    addLog('El enemigo se recupera a medias, no del todo.', 'system')
    if (typeof syncCharacter === 'function') syncCharacter()
  } else if (s.tipo === 'sin_mana') {
    addLog('🔵 No tienes maná suficiente.', 'system')
  } else if (s.tipo === 'objeto') {
    addLog('🧪 Bebes. +' + s.cura + ' de vida.', 'combat')
    if (typeof syncCharacter === 'function') syncCharacter()
    if (typeof cargarHotbar === 'function') cargarHotbar()
  }
}

// ── Dibujar ────────────────────────────────────────────────────────
function mcEscala() {
  return { x: gameScene.MW / MUNDO_ESPACIO.ancho, y: gameScene.MH / MUNDO_ESPACIO.alto }
}

function mcPintarMonstruos(lista) {
  var e = mcEscala()
  var vistos = {}
  for (var i = 0; i < lista.length; i++) {
    var v = lista[i]
    vistos[v.id] = true
    var x = v.x * e.x, y = v.y * e.y
    var m = MC.monstruos[v.id]
    if (!m) {
      m = {
        x: x, y: y, destinoX: x, destinoY: y,
        cuerpo: gameScene.add.text(x, y, v.icono || '👾', { fontSize: '24px', resolution: 2 })
          .setOrigin(0.5).setDepth(7),
        sombra: gameScene.add.ellipse(x, y + 13, 24, 8, 0x000000, 0.3).setDepth(6),
        barra: gameScene.add.graphics().setDepth(8),
        destelloHasta: 0, avisandoHasta: 0,
      }
      MC.monstruos[v.id] = m
    }
    // Interpolación con un paso de retraso: llegan diez posiciones por
    // segundo y se dibuja a sesenta. Poniéndolos donde diga el último
    // paquete, avanzan a tirones.
    m.destinoX = x; m.destinoY = y
    m.vida = v.vida; m.vidaMax = v.vidaMax
    m.avisando = !!v.aviso
    m.cuerpo.setText(v.icono || '👾')
  }
  var ids = Object.keys(MC.monstruos)
  for (var k = 0; k < ids.length; k++) if (!vistos[ids[k]]) mcQuitarMonstruo(ids[k])
}

function mcQuitarMonstruo(id) {
  var m = MC.monstruos[id]
  if (!m) return
  try { m.cuerpo.destroy(); m.sombra.destroy(); m.barra.destroy() } catch (e) {}
  delete MC.monstruos[id]
}

function mcPintarProyectiles(lista) {
  var e = mcEscala()
  var vistos = {}
  for (var i = 0; i < lista.length; i++) {
    var v = lista[i]
    vistos[v.id] = true
    var x = v.x * e.x, y = v.y * e.y
    var p = MC.proyectiles[v.id]
    if (!p) {
      p = { dibujo: gameScene.add.circle(x, y, 4, 0xF0D070).setDepth(9), x: x, y: y }
      MC.proyectiles[v.id] = p
    }
    p.destinoX = x; p.destinoY = y
  }
  var ids = Object.keys(MC.proyectiles)
  for (var k = 0; k < ids.length; k++) {
    if (vistos[ids[k]]) continue
    try { MC.proyectiles[ids[k]].dibujo.destroy() } catch (e) {}
    delete MC.proyectiles[ids[k]]
  }
}

function mcDestello(m) { m.destelloHasta = Date.now() + 80 }

function mcNumero(cantidad, critico, x, y, propio) {
  MC.numeros.push({
    nacido: Date.now(),
    suceso: { cantidad: cantidad, critico: !!critico, propio: !!propio, x: x, y: y, desvio: desvioDeNumero() },
    dibujo: gameScene.add.text(x, y, String(cantidad), {
      fontFamily: 'Cinzel', fontSize: critico ? '16px' : '13px',
      color: propio ? '#F87171' : (critico ? '#F0D070' : '#FFFFFF'),
      stroke: '#05070A', strokeThickness: 3, resolution: 2,
    }).setOrigin(0.5).setDepth(20),
  })
  if (critico) mcTemblar()
}

function mcTemblar() {
  if (!temblorActivo()) return
  MC.temblorDesde = Date.now()
  MC.temblorActivo = true
}

// ── El bucle de dibujo ─────────────────────────────────────────────
// Se llama desde el update() del mundo, a sesenta por segundo.
function mcActualizar(escena) {
  if (!escena || !escena.game) return
  var ahora = Date.now()
  var k = Math.min(1, (escena.game.loop.delta / 1000) * 10)   // 100 ms de retraso

  var ids = Object.keys(MC.monstruos)
  for (var i = 0; i < ids.length; i++) {
    var m = MC.monstruos[ids[i]]
    m.x += (m.destinoX - m.x) * k
    m.y += (m.destinoY - m.y) * k
    m.cuerpo.setPosition(m.x, m.y)
    m.sombra.setPosition(m.x, m.y + 13)
    // Destello blanco al encajar, 80 ms.
    m.cuerpo.setAlpha(ahora < m.destelloHasta ? 0.35 : 1)
    // Aviso de golpe: se tiñe para que se vea que va a pegar. Es LA
    // señal para bloquear, y sin ella el aviso de 500 ms no sirve.
    m.cuerpo.setScale(m.avisando ? 1.25 : 1)
    // Barra de vida: solo cuando NO está entera.
    m.barra.clear()
    if (m.vidaMax && m.vida < m.vidaMax) {
      var w = 26, frac = Math.max(0, m.vida / m.vidaMax)
      m.barra.fillStyle(0x05070A, 0.8); m.barra.fillRect(m.x - w / 2 - 1, m.y - 20, w + 2, 5)
      m.barra.fillStyle(frac > 0.5 ? 0x4AC94A : frac > 0.25 ? 0xF0D070 : 0xF87171, 1)
      m.barra.fillRect(m.x - w / 2, m.y - 19, w * frac, 3)
    }
  }

  var pid = Object.keys(MC.proyectiles)
  for (var j = 0; j < pid.length; j++) {
    var p = MC.proyectiles[pid[j]]
    p.x += (p.destinoX - p.x) * k
    p.y += (p.destinoY - p.y) * k
    p.dibujo.setPosition(p.x, p.y)
  }

  // Los números
  var vivos = []
  for (var n = 0; n < MC.numeros.length; n++) {
    var num = MC.numeros[n]
    var f = numeroFlotante(num.suceso, ahora - num.nacido)
    if (!f.vivo) { try { num.dibujo.destroy() } catch (e) {} ; continue }
    num.dibujo.setPosition(f.x, f.y)
    num.dibujo.setAlpha(f.alfa)
    vivos.push(num)
  }
  MC.numeros = vivos

  // El temblor de cámara
  if (MC.temblorActivo) {
    var t = temblorDeCamara(ahora - MC.temblorDesde, true)
    if (t.x === 0 && t.y === 0) {
      MC.temblorActivo = false
      escena.cameras.main.setScroll(escena.cameras.main.scrollX, escena.cameras.main.scrollY)
    } else {
      escena.cameras.main.setScroll(escena.cameras.main.scrollX + t.x, escena.cameras.main.scrollY + t.y)
    }
  }

  mcDibujarArma(escena, ahora)
  mcAvisoEscudo()
  mcPulso()
}

// ── El arma en la mano ─────────────────────────────────────────────
function mcDibujarArma(escena, ahora) {
  if (!escena.armaDibujo) {
    escena.armaDibujo = escena.add.text(0, 0, '', { fontSize: '17px', resolution: 2 })
      .setOrigin(0.5).setDepth(11)
  }
  var arma = MC.arma
  // La predicción manda mientras el servidor no haya contestado; en
  // cuanto contesta, manda él.
  var g = MC.golpeServidor || MC.golpeLocal
  var f = faseDeGolpe(g, ahora)
  if (f.fase === 'reposo' && MC.golpeLocal && ahora > MC.golpeLocal.hasta + 200) MC.golpeLocal = null
  var pose = poseArma(arma.tipoUso, f.fase, f.progreso, arma.arco)
  var v = volteoDeArma(MC.apuntar)

  var dist = 13 + pose.offsetX
  var x = escena.px + Math.cos(MC.apuntar) * dist
  var y = escena.py + Math.sin(MC.apuntar) * dist + pose.offsetY
  escena.armaDibujo.setText(arma.icono || '⚔️')
  escena.armaDibujo.setPosition(x, y)
  escena.armaDibujo.setRotation(MC.apuntar + pose.angulo * v)
  escena.armaDibujo.setScale(pose.escala, pose.escala * v)
  escena.armaDibujo.setVisible(MC.activo)
}

// ── Apuntar y pegar ────────────────────────────────────────────────
//
// RATÓN: la dirección va del centro del personaje al cursor, y el
// personaje se voltea hacia el cursor aunque camine hacia el otro lado.
// Es lo que hace que puedas retroceder pegando.
function mcRaton(escena, punteroX, punteroY) {
  var cam = escena.cameras.main
  var mx = punteroX + cam.scrollX
  var my = punteroY + cam.scrollY
  MC.apuntar = Math.atan2(my - escena.py, mx - escena.px)
}

// TÁCTIL: si arrastras el dedo desde el botón, esa es la dirección. Si
// solo tocas, apunta al monstruo vivo más cercano dentro de vez y media
// el alcance del arma; y si no hay ninguno, hacia donde miras.
//
// El apuntado automático no es una comodidad: con un dedo tapando media
// pantalla no se puede apuntar fino, y sin él pelear en el móvil sería
// dar golpes al aire. Vez y media el alcance es a propósito: apunta a
// lo que casi podrías tocar, no a lo que hay al otro lado del mapa.
//
// Devuelve si encontró a alguien, para que el botón pueda decirlo.
function mcApuntarTactil(escena, dx, dy) {
  if (Math.hypot(dx || 0, dy || 0) > 0.2) { MC.apuntar = Math.atan2(dy, dx); return true }
  var mejor = null, d = Infinity
  var alcance = (MC.arma.alcance || 60) * 1.5
  var ids = Object.keys(MC.monstruos)
  for (var i = 0; i < ids.length; i++) {
    var m = MC.monstruos[ids[i]]
    var dd = Math.hypot(m.x - escena.px, m.y - escena.py)
    if (dd < d && dd <= alcance) { d = dd; mejor = m }
  }
  if (mejor) { MC.apuntar = Math.atan2(mejor.y - escena.py, mejor.x - escena.px); return true }
  var dir = { right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2 }
  MC.apuntar = dir[escena.lastDir] != null ? dir[escena.lastDir] : 0
  return false
}

// Empezar a pegar. La animación arranca AQUÍ, en local: medido, de
// pulsar a ver el gesto pasan 98 ms si se espera al servidor, y eso se
// siente como un botón roto. El daño no se predice: ese llega cuando
// llega.
function mcPulsar(si) {
  MC.pulsado = !!si
  if (!si || !MC.activo) return
  var ahora = Date.now()
  if (MC.golpeLocal && ahora < MC.golpeLocal.hasta) return
  if (MC.golpeServidor && ahora < MC.golpeServidor.hasta) return
  var cad = MC.arma.cadenciaMs || 420
  var ant = Math.round(Math.max(60, Math.min(220, cad * 0.30)))
  var act = Math.round(Math.max(60, Math.min(160, cad * 0.22)))
  MC.golpeLocal = { inicio: ahora, desde: ahora + ant, hasta: ahora + ant + act }
}

function mcBloquear(si) { MC.bloquear = !!si }

// De qué arma se trata. Sale de la barra, que es quien sabe cuál llevas
// puesta; sus números vienen del servidor.
async function mcCargarArma() {
  var r = await apiGet('/api/hotbar')
  if (!r.ok) return
  var sel = (r.data.ranuras || [])[r.data.seleccionada || 0]
  if (!sel || !sel.arma) { MC.arma.icono = '👊'; return }
  MC.arma.icono = sel.icono || '⚔️'
  MC.arma.imagen = sel.imagen || null
  var p = await apiGet('/api/armas/' + sel.itemId)
  if (p.ok && p.data && p.data.perfil) {
    MC.arma.tipoUso = p.data.perfil.tipoUso
    MC.arma.arco = p.data.perfil.arco
    MC.arma.alcance = p.data.perfil.alcance
    MC.arma.cadenciaMs = p.data.perfil.cadenciaMs
    MC.arma.spriteAngulo = p.data.perfil.spriteAngulo
    MC.arma.empunadura = p.data.perfil.empunadura
  }
}

// Apagar el mundo de mentira donde el servidor sí simula.
function mcApagarFalsos() {
  if (!gameScene) return
  addLog('⚔️ Los monstruos de esta zona son de verdad y los ves todos igual.', 'system')
  for (var i = 0; i < (gameScene.monsterTexts || []).length; i++) {
    try { gameScene.monsterTexts[i].destroy() } catch (e) {}
    var d = (gameScene.monsterData || [])[i]
    if (d) { try { d.label && d.label.destroy(); d.sombra && d.sombra.destroy() } catch (e) {} }
  }
  gameScene.monsterTexts = []
  gameScene.monsterData = []
  gameScene.monsterWalkTimers = []
}

// ── Controles ──────────────────────────────────────────────────────
window.addEventListener('load', function () {
  setTimeout(function () {
    mcCargarArma()
    if (!gameScene || !gameScene.input) return
    gameScene.input.on('pointermove', function (p) { mcRaton(gameScene, p.x, p.y) })
    gameScene.input.on('pointerdown', function (p) {
      mcRaton(gameScene, p.x, p.y)
      if (p.rightButtonDown && p.rightButtonDown()) mcBloquear(true)
      else mcPulsar(true)
    })
    gameScene.input.on('pointerup', function () { mcPulsar(false); mcBloquear(false) })
    // Sin esto, el clic derecho abre el menú del navegador en mitad de
    // la pelea y te deja bloqueando para siempre.
    var lienzo = document.getElementById('phaser-canvas')
    if (lienzo) lienzo.addEventListener('contextmenu', function (e) { e.preventDefault() })
  }, 600)
})
// Cambiar de arma en la barra cambia lo que se dibuja en la mano.
window.addEventListener('cm-arma-cambiada', function () { mcCargarArma() })

// ── Los botones del dedo ───────────────────────────────────────────
//
// R4 del encargo: "táctil tan jugable como ratón". Hasta aquí no lo era:
// en un teléfono te movías por el mundo y no podías dar un golpe. La
// función de apuntado táctil estaba escrita y no la llamaba nadie.
//
// El botón de atacar hace dos cosas con el mismo dedo: si lo tocas y
// sueltas, pega hacia el bicho más cercano; si arrastras sin soltar,
// apuntas hacia donde arrastres y sigues pegando. Es lo que pide la
// sección E.2 y lo que hace que se pueda retroceder pegando.
function mcMontarBotonesTactiles() {
  var atacar = document.getElementById('btn-atacar')
  var escudo = document.getElementById('btn-escudo')
  if (!atacar || !escudo) return

  var centroAtacar = null

  function dondeEmpieza(el) {
    var r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  function puntoDe(ev) {
    var t = ev.changedTouches ? ev.changedTouches[0] : ev
    return { x: t.clientX, y: t.clientY }
  }

  function apuntarDesde(ev) {
    if (!gameScene || !centroAtacar) return
    var p = puntoDe(ev)
    var dx = p.x - centroAtacar.x, dy = p.y - centroAtacar.y
    // Menos de 18 px es un toque, no un arrastre: el dedo se mueve solo.
    if (Math.hypot(dx, dy) < 18) mcApuntarTactil(gameScene, 0, 0)
    else mcApuntarTactil(gameScene, dx, dy)
  }

  function empezarAtaque(ev) {
    centroAtacar = dondeEmpieza(atacar)
    atacar.classList.add('pulsado')
    apuntarDesde(ev)
    mcPulsar(true)
    ev.preventDefault()
  }
  function seguirAtaque(ev) {
    if (!centroAtacar) return
    apuntarDesde(ev)
    // Mantener pulsado repite el golpe; el servidor no deja pasar de la
    // cadencia, así que aquí solo hay que no soltar.
    mcPulsar(true)
    ev.preventDefault()
  }
  function soltarAtaque(ev) {
    centroAtacar = null
    atacar.classList.remove('pulsado')
    mcPulsar(false)
    if (ev && ev.preventDefault) ev.preventDefault()
  }

  atacar.addEventListener('touchstart', empezarAtaque, { passive: false })
  atacar.addEventListener('touchmove', seguirAtaque, { passive: false })
  atacar.addEventListener('touchend', soltarAtaque, { passive: false })
  atacar.addEventListener('touchcancel', soltarAtaque, { passive: false })
  // Con ratón también, para poder probarlo sin un teléfono delante.
  atacar.addEventListener('mousedown', empezarAtaque)
  window.addEventListener('mouseup', function (e) { if (centroAtacar) soltarAtaque(e) })

  function empezarEscudo(ev) { escudo.classList.add('pulsado'); mcBloquear(true); ev.preventDefault() }
  function soltarEscudo(ev) { escudo.classList.remove('pulsado'); mcBloquear(false); if (ev && ev.preventDefault) ev.preventDefault() }
  escudo.addEventListener('touchstart', empezarEscudo, { passive: false })
  escudo.addEventListener('touchend', soltarEscudo, { passive: false })
  escudo.addEventListener('touchcancel', soltarEscudo, { passive: false })
  escudo.addEventListener('mousedown', empezarEscudo)
  window.addEventListener('mouseup', soltarEscudo)

  // Si el dedo se va de la pantalla o la pestaña pierde el foco, se
  // sueltan los dos. Sin esto te quedabas bloqueando para siempre.
  window.addEventListener('blur', function () { soltarAtaque(); soltarEscudo() })
}

// El escudo se resalta cuando algún monstruo anuncia. Es lo único que
// hace visible la ventana de 500 ms en un teléfono, donde no hay
// registro de texto que leer mientras peleas.
function mcAvisoEscudo() {
  var escudo = document.getElementById('btn-escudo')
  if (!escudo) return
  var alguno = false
  var ids = Object.keys(MC.monstruos)
  for (var i = 0; i < ids.length; i++) if (MC.monstruos[ids[i]].avisando) alguno = true
  escudo.classList.toggle('avisa', alguno)
}

window.addEventListener('load', function () { setTimeout(mcMontarBotonesTactiles, 700) })
</script>`
