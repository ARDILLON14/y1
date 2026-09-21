PAGES['criptomundo-arena.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CriptoMundo — Arena</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --void:#05070A; --panel:#12151D; --card:#161A24; --border:#2A2418;
    --gold:#C8A84B; --gold2:#F0D070; --txt:#E8E0CC; --dim:#7A7060;
    --rojo:#E03030; --verde:#30C060;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--void); color:var(--txt); font-family:'JetBrains Mono',monospace; overflow:hidden; }

  .barra { display:flex; align-items:center; gap:12px; padding:8px 14px; background:var(--panel); border-bottom:1px solid var(--border); }
  .titulo { font-family:'Cinzel',serif; color:var(--gold2); font-size:14px; letter-spacing:1px; }
  .dato { font-size:11px; color:var(--dim); }
  .dato b { color:var(--txt); }
  .barra .sep { margin-left:auto; }
  .btn { background:rgba(200,168,75,.14); border:1px solid var(--border); color:var(--gold);
    border-radius:7px; padding:7px 14px; font-size:12px; cursor:pointer; font-family:inherit; min-height:38px; }
  .btn:hover { border-color:var(--gold); }
  .btn.rojo { border-color:#5A1A1A; color:#E88; background:rgba(224,48,48,.12); }

  .escena { position:relative; width:100%; height:calc(100vh - 47px); display:flex; align-items:center; justify-content:center; }
  canvas { background:#0A0D13; border:1px solid var(--border); border-radius:10px; max-width:100%; max-height:100%; touch-action:none; }

  .panel-central { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(5,7,10,.88); }
  .caja { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:22px; max-width:520px; width:92%; max-height:88vh; overflow-y:auto; }
  .caja h2 { font-family:'Cinzel',serif; color:var(--gold2); font-size:19px; margin-bottom:6px; }
  .caja p { font-size:12px; color:var(--dim); line-height:1.6; margin-bottom:14px; }
  .arena-item { background:rgba(10,13,19,.7); border:1px solid var(--border); border-radius:9px; padding:12px; margin-bottom:9px; cursor:pointer; transition:all .15s; }
  .arena-item:hover { border-color:var(--gold); transform:translateY(-2px); }
  .arena-item.bloqueada { opacity:.45; cursor:not-allowed; }
  .ai-nombre { font-family:'Cinzel',serif; font-size:14px; color:var(--gold); }
  .ai-datos { font-size:11px; color:var(--dim); margin-top:4px; line-height:1.6; }
  .ai-enemigos { font-size:16px; margin-top:5px; letter-spacing:2px; }

  .registro { position:absolute; left:12px; bottom:12px; width:230px; max-height:150px; overflow:hidden;
    font-size:11px; color:var(--dim); line-height:1.5; pointer-events:none; }
  .ayuda { position:absolute; right:12px; top:12px; font-size:11px; color:var(--dim); text-align:right; line-height:1.7; }

  /* Mando táctil: mismo criterio que el mapa, solo en pantallas con dedo */
  #mando { display:none; }
  @media (hover:none) and (pointer:coarse) { #mando { display:block; } .ayuda { display:none; } }
  #stick { position:fixed; left:16px; bottom:20px; width:112px; height:112px; border-radius:50%;
    background:rgba(10,13,19,.55); border:1px solid rgba(200,168,75,.35); z-index:20; touch-action:none; }
  #punto { position:absolute; left:50%; top:50%; width:46px; height:46px; margin:-23px 0 0 -23px; border-radius:50%;
    background:rgba(200,168,75,.55); border:1px solid rgba(240,208,112,.7); }
  #atacar, #esquivar { position:fixed; border-radius:50%; z-index:20; touch-action:none;
    border:1px solid rgba(200,168,75,.5); background:rgba(200,168,75,.18); color:var(--gold2); }
  /* La mitad derecha de la pantalla apunta. Va por DEBAJO de los
     botones (z-index menor) para no comerse sus pulsaciones, y deja
     libre la esquina del joystick. */
  #zona-apuntar { position:fixed; right:0; top:47px; width:55%; bottom:0; z-index:10; touch-action:none; }
  #atacar { right:18px; bottom:30px; width:82px; height:82px; font-size:26px; }
  #esquivar { right:112px; bottom:44px; width:60px; height:60px; font-size:18px; }
/* ===== CSS-MOVIL:INICIO (generado por aplicar-css-movil.js) ===== */
  /* El juego se diseñó para pantalla ancha: tres columnas fijas de
     260-300 px. En un móvil eso deja el contenido central en 40 px y la
     página inservible. Aquí las columnas se apilan y las alturas fijas
     pasan a automáticas. */
  @media (max-width: 860px) {
    html, body { overflow-x: hidden; -webkit-text-size-adjust: 100%; }

    /* Tres columnas → una sola, en vertical */
    .layout, .pvp-layout, .creator-body, .main-layout, .content-layout {
      display: block !important;
      height: auto !important;
      overflow: visible !important;
    }

    /* Las barras laterales dejan de ser columnas y pasan a ser bloques
       con altura acotada, para que no haya que hacer scroll eterno */
    .sidebar, .left-panel, .right-panel, .left-sidebar, .right-sidebar,
    .creator-preview, .creator-options, #left-panel, #right-panel,
    #left-sidebar, #right-sidebar {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      max-height: 46vh;
      overflow-y: auto;
      border-left: none !important;
      border-right: none !important;
      border-top: 1px solid var(--border, #2A2418);
    }

    main, .main, .center-panel, #center-panel, .market-main, #market-main {
      width: auto !important;
      min-width: 0 !important;
    }

    /* Alturas atadas a la ventana: en móvil sobra con que crezcan */
    [style*="calc(100vh"], .arena, .arena-scene, .combat-log, .run-log,
    .listings-area, .quest-scroll, .bench, .inv-body {
      height: auto !important;
      max-height: 60vh;
    }

    /* Barras superiores: que envuelvan en vez de desbordar */
    .topbar, .game-topbar, .header, .hdr, .mode-tabs, .zone-tabs, .filters {
      flex-wrap: wrap !important;
      gap: 6px !important;
      padding: 8px 10px !important;
      height: auto !important;
    }

    /* Rejillas apretadas: mínimo más pequeño para que quepan 2 por fila */
    .listings-grid, .inv-pick-grid, .inv-grid, .skin-grid, .skin-modal-grid,
    .ingredients, .dng-act-row, .pvp-act-grid, .action-grid, .rewards-grid {
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)) !important;
    }

    /* Objetivos táctiles: nada por debajo de 40 px de alto */
    button, .action-btn, .dng-btn, .mode-btn, .tab, .qtab, .rtab, .chip {
      min-height: 40px;
    }

    .action-btn, .dng-btn { padding: 8px 6px !important; }
    .a-icon, .db-icon { font-size: 20px !important; }
    .a-cost, .db-cost { font-size: 10px !important; }

    /* Diálogos que en escritorio son ventanas centradas */
    .skin-modal-box, .result-overlay > *, .modal-box, .co-box {
      max-width: 94vw !important;
      max-height: 88vh !important;
      overflow-y: auto;
    }
  }

  /* Pantallas muy estrechas: una sola columna en las rejillas */
  @media (max-width: 480px) {
    .listings-grid, .skin-grid, .ingredients {
      grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)) !important;
    }
    .creator-title, .gtb-name { font-size: 15px !important; }
  }

  /* ── Pulido visual compartido ──────────────────────────
     Detalles baratos que se notan mucho: transiciones suaves,
     tarjetas con algo de profundidad y rarezas con brillo propio. */
  * { -webkit-tap-highlight-color: transparent; }

  button, .chip, .tab, .qtab, .rtab, .mode-btn, .skin-card, .sm-card,
  .listing-card, .listing-row, .recipe-card, .dng-card, .quest-card,
  .npc-card, .guild-card, .mon-btn, .inv-slot, .loot-item {
    transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
  }
  .listing-card:hover, .recipe-card:hover, .dng-card:hover,
  .quest-card:hover, .npc-card:hover, .guild-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,.45);
  }
  button:active, .chip:active, .mon-btn:active { transform: scale(.97); }

  /* Las rarezas altas se distinguen de un vistazo, sin leer */
  .r-epic, .r-legendary, .r-mythic { position: relative; }
  .r-legendary { box-shadow: 0 0 12px rgba(255,128,0,.22); }
  .r-mythic    { box-shadow: 0 0 12px rgba(255,64,64,.24); }
  .r-epic      { box-shadow: 0 0 10px rgba(163,53,238,.20); }

  /* Barras de vida y maná: brillo interior en vez de color plano */
  .hp-bar-fill, .bar-fill.hp, .gtb-bar-fill.hp,
  .mp-bar-fill, .bar-fill.mp, .gtb-bar-fill.mp,
  .xp-bar-fill, .gtb-bar-fill.xp {
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
  }

  /* Aparición suave de los paneles al cargar: quita la sensación de
     pantallazo seco al cambiar de módulo */
  @keyframes entrar { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .sidebar, .listing-card, .recipe-card, .quest-card, .dng-card, .guild-card {
    animation: entrar .22s ease both;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
/* ===== CSS-MOVIL:FIN ===== */
</style>
</head>
<body>

<div class="barra">
  <span class="titulo">⚔️ ARENA</span>
  <span class="dato" id="d-arena">—</span>
  <span class="dato">Oleada <b id="d-oleada">—</b></span>
  <span class="dato">Bajas <b id="d-bajas">0</b></span>
  <span class="dato">Arma <b id="d-arma">—</b></span>
  <span class="dato" id="d-red"></span>
  <span class="sep"></span>
  <button class="btn rojo" id="btn-salir" onclick="abandonar()" style="display:none">Abandonar</button>
</div>

<div class="escena">
  <canvas id="lienzo" width="900" height="600"></canvas>
  <div class="registro" id="registro"></div>
  <div class="ayuda">WASD o flechas · mover<br>ratón · apuntar<br>clic o espacio · atacar<br>Shift · esquivar</div>
  <div class="panel-central" id="menu"></div>
</div>

<div id="mando">
  <div id="zona-apuntar"></div>
  <div id="stick"><div id="punto"></div></div>
  <button id="atacar">⚔️</button>
  <button id="esquivar">💨</button>
</div>

<script>
// ═══════════════════════════════════════════════════════════
//  CLIENTE DE ARENA
//  Aquí NO se simula nada. Se manda lo que el jugador quiere hacer
//  y se dibuja el estado que devuelve el servidor 10 veces por
//  segundo. Si esta pantalla mintiera, el servidor no la creería.
// ═══════════════════════════════════════════════════════════
var lienzo = document.getElementById('lienzo')
var ctx = lienzo.getContext('2d')
var ws = null
var estado = null
var entrada = { mx: 0, my: 0, apuntar: -Math.PI / 2, atacar: false, esquivar: false }
var teclas = {}
var golpes = []      // destellos de golpe, solo visuales
var chispas = []     // impactos de proyectil, solo visuales
var COLOR_EL = { ice: '#7FD4F0', fire: '#F08040', lightning: '#C8A0F0', poison: '#90D070' }
var flotantes = []   // números de daño
var reintentos = 0
var porSocket = false

// Una pantalla congelada no dice nada. Desde el asiento del jugador se
// ve igual que "no me puedo mover", y el error de verdad se queda en
// una consola que nadie mira. Aquí cualquier fallo se pinta en el
// registro: si algo revienta, se lee en pantalla.
var ultimoFallo = ''
// El navegador esconde el código HTTP con el que rechazó el WebSocket:
// ws.onerror no dice nada, por diseño. Así que se lo preguntamos al
// servidor por HTTP, que sí puede contarlo.
// Si el socket no hay manera, se juega por HTTP. El servidor sigue
// decidiendo exactamente lo mismo: cambia el camino, no quién manda.
// El launcher ya hacía esto con el chat; la arena se quedaba muerta.
var pulso = null
function modoHttp(callado) {
  if (pulso) return
  if (!callado) anotar('🌐 sin socket: se juega por HTTP (algo más lento, pero se juega)')
  var mudos = 0
  pulso = setInterval(function () {
    if (!estado) return
    fetch('/api/arena/sync', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entrada: entrada }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d } }) })
      .then(function (r) {
        if (r.d && r.d.fin) { pararPulso(); terminar(r.d.fin); return }
        if (r.ok && r.d && r.d.estado) { mudos = 0; pintarEstado(r.d.estado); return }
        // Ni estado ni resultado. Antes esto se ignoraba y el pulso
        // seguía girando en vacío: el jugador se quedaba mirando un
        // contador de "sin respuesta" que subía y subía. Ahora, tras
        // unos cuantos seguidos, se pregunta qué pasa y se sale.
        if (++mudos >= 12) rendirse()
      })
      .catch(function () { if (++mudos >= 25) rendirse() })
  }, 100)
}

function pararPulso() { if (pulso) { clearInterval(pulso); pulso = null } }

// El pulso lleva un rato sin traer nada útil. En vez de dejar la
// pantalla congelada, se pregunta al servidor si el combate sigue vivo
// y se actúa: si acabó, se enseña el resultado; si no, se vuelve al
// menú con una explicación. Nunca un callejón sin salida.
function rendirse() {
  pararPulso()
  fetch('/api/arena', { credentials: 'include' })
    .then(function (r) { return r.json() })
    .then(function (d) {
      if (d && d.enCurso) {
        anotar('⚠️ El combate sigue abierto pero no llega estado. Reintentando…')
        estado && modoHttp()
        return
      }
      anotar('El combate ya había terminado.')
      estado = null
      cargarArenas()
    })
    .catch(function () { anotar('❌ El servidor no responde. Recarga la página.') })
}

var yaPregunte = false
function preguntarPorQue() {
  if (yaPregunte) return
  yaPregunte = true
  fetch('/api/diagnostico/socket', { credentials: 'include' })
    .then(function (r) { return r.json() })
    .then(function (d) {
      var ultimo = (d.rechazos || [])[0]
      if (ultimo) anotar('🔎 el servidor rechazó el socket: ' + ultimo.codigo + ' — ' + ultimo.motivo)
      else if (!d.sesion) anotar('🔎 el servidor no reconoce tu sesión')
      else anotar('🔎 el servidor no rechazó nada: sockets abiertos ' + d.socketsAbiertos + ', tuyos ' + d.socketsMios)
    })
    .catch(function () { anotar('🔎 tampoco responde el diagnóstico por HTTP: el servidor no está escuchando') })
}

function fallo(donde, e) {
  var t = donde + ': ' + ((e && e.message) ? e.message : e)
  if (t === ultimoFallo) return
  ultimoFallo = t
  try { anotar('❌ ' + t) } catch (x) {}
  try { console.error('[arena]', t) } catch (x) {}
}
window.addEventListener('error', function (ev) { fallo('script', ev.error || ev.message) })

// Estado de la conexión, siempre a la vista. Con esto "no se mueve"
// deja de ser un misterio: o dice que está en línea y el problema es
// otro, o dice que no llega estado y el problema es el socket.
setInterval(function () {
  var el = document.getElementById('d-red')
  if (!el) return
  if (!estado) { el.textContent = ''; return }
  if (pulso) {
    var e2 = Date.now() - animRecibida
    el.textContent = e2 > 1500 ? '⚠️ sin respuesta (' + Math.round(e2 / 1000) + 's)' : '🌐 modo HTTP'
    return
  }
  if (!ws) { el.textContent = '⛔ sin conexión'; return }
  if (ws.readyState !== 1) { el.textContent = '… conectando'; return }
  var edad = Date.now() - animRecibida
  el.textContent = edad > 1500 ? '⚠️ sin estado (' + Math.round(edad / 1000) + 's)' : '🟢 en línea'
}, 500)

// ── Menú de arenas ────────────────────────────────────────
async function cargarArenas() {
  var menu = document.getElementById('menu')
  menu.style.display = 'flex'
  try {
    var r = await fetch('/api/arena', { credentials: 'include' })
    if (!r.ok) { menu.innerHTML = '<div class="caja"><h2>Inicia sesión</h2><p>Vuelve al launcher para entrar.</p></div>'; return }
    var d = await r.json()
    ponerArmaBarra(d.armaDetalle, d.arma)
    var html = '<div class="caja"><h2>Elige arena</h2>' +
      '<p>Combate en tiempo real: te mueves, esquivas y golpeas. El arma que lleves equipada cambia el alcance, la cadencia y si disparas de lejos. Lo que caiga se queda aunque pierdas.</p>'
    d.arenas.forEach(function (a) {
      html += '<div class="arena-item ' + (a.disponible ? '' : 'bloqueada') + '"' +
        (a.disponible ? ' onclick="empezar(\\'' + a.id + '\\')"' : '') + '>' +
        '<div class="ai-nombre">' + a.nombre + (a.disponible ? '' : ' 🔒 Nv.' + a.minLevel) + '</div>' +
        '<div class="ai-datos">' + a.oleadas + ' oleadas · recompensa 🪙' + a.oro[0] + '-' + a.oro[1] +
        (a.cgrid ? ' · 💎' + a.cgrid : '') + '</div>' +
        '<div class="ai-enemigos">' + a.enemigos.map(function (e) { return e.icono }).join(' ') + '</div>' +
        '</div>'
    })
    menu.innerHTML = html + '</div>'
  } catch (e) {
    menu.innerHTML = '<div class="caja"><h2>Sin conexión</h2><p>No se pudo hablar con el servidor.</p></div>'
  }
}

async function empezar(arenaId) {
  var r = await fetch('/api/arena/start', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arenaId: arenaId }),
  })
  var d = await r.json()
  if (!r.ok) { anotar('⚠️ ' + (d.error || 'No se pudo entrar')); return }
  estado = d.partida
  document.getElementById('menu').style.display = 'none'
  document.getElementById('btn-salir').style.display = ''
  document.getElementById('d-arena').textContent = d.partida.nombre
  anotar('⚔️ Empieza el combate')
  animRecibida = Date.now()
  // Se juega desde el primer instante por HTTP y el socket se intenta a
  // la vez. Esperar a que el socket fracase para caer al pulso tenía un
  // agujero: si no falla sino que se queda COLGADO —lo que hace una red
  // que se traga el paquete— no hay onerror ni onclose, nadie da la
  // orden de caer, y la pantalla se queda en "… conectando" para
  // siempre. El socket no es un requisito para empezar: es una mejora.
  modoHttp(true)
  // Y si ya se sabe que en esta sesión no abre, ni se intenta: cada
  // intento dejaba una conexión colgada más.
  if (!socketImposible) conectar()
}

// ── Socket ────────────────────────────────────────────────
// Un socket que NUNCA abre no es lo mismo que uno que falla.
//
// Cuando algo en medio -un cortafuegos, un antivirus, una VPN- se traga
// el paquete en vez de rechazarlo, el WebSocket se queda en
// "conectando" para siempre: no abre, no da error y no se cierra. Y
// como cada batalla hacia "ws = new WebSocket(...)" sin cerrar el
// anterior, cada partida dejaba una conexion colgada mas. El navegador
// da unas seis por servidor: a la tercera o cuarta batalla no quedaba
// ninguna libre y TODAS las peticiones se quedaban en cola. La pantalla
// dejaba de cargar sin un solo mensaje de error.
//
// Tres reglas para que no pueda repetirse:
//   1. antes de abrir uno, se cierra el que hubiera;
//   2. el que no abre en unos segundos se cierra solo;
//   3. cuando ya se sabe que en esta sesion no va a abrir, se deja de
//      intentarlo y se juega por HTTP, que funciona.
var socketVigilante = null
var socketImposible = false
var ESPERA_SOCKET_MS = 4000

function cerrarSocket() {
  if (socketVigilante) { clearTimeout(socketVigilante); socketVigilante = null }
  if (!ws) return
  var viejo = ws
  ws = null
  // Se le quitan los manejadores antes de cerrar: un socket que ya no
  // usamos no debe poder reactivar la reconexion al morir.
  viejo.onopen = viejo.onmessage = viejo.onerror = viejo.onclose = null
  try { viejo.close() } catch (e) {}
}

function conectar() {
  if (socketImposible) { modoHttp(true); return }
  if (ws && ws.readyState === 1) return
  cerrarSocket()

  var proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  var sock
  try { sock = new WebSocket(proto + '//' + location.host + '/ws') }
  catch (e) { socketImposible = true; modoHttp(true); return }
  ws = sock

  // El vigilante: si en cuatro segundos no ha abierto, no va a abrir.
  // Esta es la pieza que faltaba: sin ella un socket colgado no se
  // cierra nunca, porque colgado significa justamente que no avisa.
  socketVigilante = setTimeout(function () {
    socketVigilante = null
    if (sock.readyState === 1) return
    if (ws === sock) cerrarSocket()
    else { try { sock.close() } catch (e) {} }
    rendirseConElSocket('el socket no abrio en ' + (ESPERA_SOCKET_MS / 1000) + 's')
  }, ESPERA_SOCKET_MS)

  sock.onopen = function () {
    reintentos = 0
    if (socketVigilante) { clearTimeout(socketVigilante); socketVigilante = null }
  }
  sock.onmessage = function (ev) {
    var d
    try { d = JSON.parse(ev.data) } catch (e) { return }
    if (d.type === 'arena_estado') { porSocket = true; pintarEstado(d.estado) }
    else if (d.type === 'arena_fin') terminar(d)
  }
  sock.onerror = function () { preguntarPorQue() }
  sock.onclose = function () {
    if (ws === sock) ws = null
    if (socketVigilante) { clearTimeout(socketVigilante); socketVigilante = null }
    if (!estado || socketImposible) return
    if (reintentos >= 3) { rendirseConElSocket('se perdio la conexion'); return }
    reintentos++
    modoHttp(true)                 // jugar nunca espera al socket
    setTimeout(conectar, 400 * reintentos)
  }
}

// Se acabo el socket por hoy. No es un error: el juego sigue, solo que
// por el otro camino. Se dice una vez y no se vuelve a insistir, que es
// lo que evita seguir abriendo conexiones que nadie va a contestar.
function rendirseConElSocket(motivo) {
  if (socketImposible) return
  socketImposible = true
  cerrarSocket()
  preguntarPorQue()
  anotar('\u26a0\ufe0f ' + motivo + '; se juega por HTTP el resto de la sesion')
  modoHttp(true)
}

var ultimoEnvio = 0
function enviarEntrada() {
  if (!ws || ws.readyState !== 1 || !estado) return
  ultimoEnvio = Date.now()
  ws.send(JSON.stringify({ type: 'arena_entrada', entrada: entrada }))
  entrada.esquivar = false
}
setInterval(enviarEntrada, 100)

// La intencion sale EN CUANTO CAMBIA, no en el siguiente latido.
//
// Con solo el latido de 100 ms, pulsar una tecla podia esperar hasta
// 100 ms parada en el navegador antes de salir, y luego otros 100 hasta
// el siguiente tick del servidor. Hasta dos decimas entre apretar y
// ver, la mitad de ellas por nada: el paquete estaba listo y esperando
// al reloj.
//
// No sube el gasto de red en marcha, que es lo que hay que cuidar:
// andando en linea recta la intencion no cambia y esto no manda nada
// de mas. Solo adelanta los momentos en los que el jugador hace algo
// —empezar a andar, parar, atacar, esquivar—, que son justo los que se
// notan. El tope de 30 ms evita que aporrear el teclado se convierta
// en una rafaga.
function intencionCambio() {
  if (Date.now() - ultimoEnvio >= 30) enviarEntrada()
}

function pintarEstado(e) {
  estado = e
  animRecibida = Date.now()
  // Si el estado vino por socket, el pulso HTTP ya no hace falta: se
  // retira sin ruido. Si el socket se cae luego, onclose lo levanta.
  if (porSocket && pulso) { clearInterval(pulso); pulso = null; anotar('🟢 socket al habla: se deja el modo HTTP') }
  porSocket = false
  document.getElementById('d-oleada').textContent = e.oleada + '/' + e.oleadas
  document.getElementById('d-bajas').textContent = e.bajas
  ;(e.sucesos || []).forEach(function (s) {
    if (s.t === 'golpe') golpes.push({ x: s.x, y: s.y, ang: s.ang, r: s.alcance, t: 0 })
    if (s.t === 'impacto') chispas.push({ x: s.x, y: s.y, t: 0, semilla: Math.random() * 6.28, color: COLOR_EL[s.el] || '#F0D070' })
    else if (s.t === 'daño') flotantes.push({ x: s.x, y: s.y, txt: '-' + s.dmg, mio: s.a === 'jugador', t: 0 })
    else if (s.t === 'muerte') { flotantes.push({ x: s.x, y: s.y, txt: '☠', mio: false, t: 0 }); anotar('☠️ ' + s.nombre + ' derrotado') }
    else if (s.t === 'oleada') anotar('🌊 Oleada ' + s.n + ' de ' + s.total)
    else if (s.t === 'aviso') anotar('⚠️ ¡Se prepara para embestir!')
    // El empujon TIENE que decirse. Mueve al jugador sin que el jugador
    // haya tocado nada, y un desplazamiento sin explicacion se lee como
    // "el personaje se mueve solo" — ya paso una vez y me costo dos
    // versiones entender de que hablaba el reporte.
    else if (s.t === 'empujon') anotar('🫸 ¡Te aparta de un empujón para tomar carrerilla!')
    else if (s.t === 'esquiva') anotar('💨 Esquivado')
  })
}

function terminar(d) {
  var titulos = { victoria: '🏆 ¡Victoria!', derrota: '☠️ Derrota', abandono: 'Combate abandonado', tiempo: '⏱️ Se acabó el tiempo' }
  var html = '<div class="caja"><h2>' + (titulos[d.motivo] || 'Fin') + '</h2>' +
    '<p>Bajas: <b>' + d.bajas + '</b> · XP <b>+' + d.xp + '</b>' +
    (d.oro ? ' · 🪙 <b>+' + d.oro + '</b>' : '') + (d.cgrid ? ' · 💎 <b>+' + d.cgrid + '</b>' : '') + '</p>'
  if ((d.botin || []).length) {
    html += '<p>Botín: ' + d.botin.map(function (b) { return dibujoItem(b) + ' ' + b.name + ' ×' + b.quantity }).join(' · ') + '</p>'
  }
  if ((d.levelUps || []).length) html += '<p style="color:#F0D070">🎉 ¡Nivel ' + d.nivel + '!</p>'
  html += '<button class="btn" onclick="cargarArenas()">Volver a elegir</button></div>'
  document.getElementById('menu').innerHTML = html
  document.getElementById('menu').style.display = 'flex'
  document.getElementById('btn-salir').style.display = 'none'
  estado = null
  // Al acabar una partida se sueltan las dos vías. Sin esto, cada
  // batalla dejaba su conexión detrás.
  pararPulso()
  cerrarSocket()
  try { window.parent.postMessage({ type: 'REFRESH_CHARACTER' }, '*') } catch (e) {}
}

function abandonar() {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'arena_abandonar' }))
  else fetch('/api/arena/abandon', { method: 'POST', credentials: 'include' }).then(cargarArenas)
}

// Un objeto con dibujo propio se pinta; uno sin dibujo se queda con su
// emoji de siempre. Objetos antiguos incluidos: por eso el fallback no
// es opcional, es la regla.
function dibujoItem(it) {
  if (it && it.imagen) {
    return '<img src="' + it.imagen + '" alt="' + (it.icon || it.icono || '📦') + '" ' +
      'width="18" height="18" style="image-rendering:pixelated;vertical-align:-3px">'
  }
  return (it && (it.icon || it.icono)) || '📦'
}

function ponerArmaBarra(detalle, nombre) {
  var el = document.getElementById('d-arma')
  if (!el) return
  if (detalle && detalle.imagen) {
    el.innerHTML = '<img src="' + detalle.imagen + '" alt="' + (detalle.icono || '') + '" width="16" height="16" ' +
      'style="image-rendering:pixelated;vertical-align:-3px"> ' + (detalle.nombre || nombre || '')
  } else {
    el.textContent = ((detalle && detalle.icono) ? detalle.icono + ' ' : '') + (nombre || '—')
  }
}

// ── Sprites ───────────────────────────────────
// Almacen perezoso de imagenes. Regla de la casa: si el objeto trae
// dibujo se pinta el dibujo; si no trae, o si el archivo falla al
// cargar, se cae al emoji. Un PNG que no exista NO puede dejar la
// pantalla en negro, asi que el fallo se marca una vez y no se
// reintenta en cada cuadro.
var SPRITES = {}
function sprite(url) {
  if (!url) return null
  var s = SPRITES[url]
  if (s) return s.roto ? null : (s.img.complete && s.img.naturalWidth ? s.img : null)
  var img = new Image()
  s = SPRITES[url] = { img: img, roto: false }
  img.onerror = function () { s.roto = true; anotar('⚠️ No se pudo cargar ' + url + '; se usa el icono') }
  img.src = url
  return null
}

// ── Tiras de cuadros ────────────────────────────────
// Un solo dibujante para cualquier tira: la de un arma, la de una
// skin, la de lo que venga. Recibe lo que pide el encargo —dibujo,
// cuántos cuadros tiene, en qué punto de la animación estamos y a qué
// tamaño pintarlo— y no sabe nada de armas ni de combate.
//
// El cuadro NO se toma tal cual del servidor. El servidor cuenta los
// cuadros que declara su catálogo de animaciones (walk = 4), y una
// tira concreta puede tener otros (la Zarigüeya tiene 3). Se usa el
// avance de la animación (0 a 1) y se reparte entre los cuadros que
// esa tira tenga de verdad: así una tira de 3, de 6 o de 12 funciona
// sin tocar nada.
// El alto de destino manda y el ancho sale de la proporcion del cuadro:
// una tira de 140x70 dibujada en un cuadrado salia aplastada.
function dibujarTira(img, tira, avance, x, y, altoDestino, espejo) {
  var n = Math.max(1, tira.cuadros || 1)
  var i = Math.min(n - 1, Math.max(0, Math.floor((avance % 1) * n)))
  // El servidor manda el ancho de CADA cuadro, medido sobre el archivo.
  // Si aun así no cuadra con la imagen cargada, manda la imagen: es la
  // única fuente que no puede equivocarse.
  var cw = tira.anchoCuadro || Math.round(img.naturalWidth / n)
  if (Math.abs(cw * n - img.naturalWidth) > n) cw = Math.round(img.naturalWidth / n)
  var ch = tira.alto || img.naturalHeight
  var anchoDestino = altoDestino * (cw / Math.max(1, ch))
  ctx.save()
  ctx.translate(x, y)
  if (espejo) ctx.scale(-1, 1)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, i * cw, 0, cw, ch, -anchoDestino / 2, -altoDestino / 2, anchoDestino, altoDestino)
  ctx.restore()
}

// ── Reloj de animacion del cliente ─────────────────
// El servidor manda 10 estados por segundo. Si el gesto del arma solo
// avanzara con cada paquete se veria a tirones. Aqui se adelanta el
// cronometro localmente entre paquete y paquete, pero NUNCA se elige
// la animacion: eso lo decide el servidor y llega en anim.n.
var animRecibida = 0
function animLocal() {
  var a = (estado && estado.jugador && estado.jugador.anim) || { n: 'idle', t: 0, d: 900 }
  var d = a.d || 900
  var t = (a.t || 0) + (Date.now() - animRecibida)
  if (a.n === 'idle' || a.n === 'walk') t = t % d
  else if (t > d) t = d
  return { n: a.n, t: t, d: d, p: Math.min(1, t / d), f: a.f || 0 }
}

// ── Gestos ───────────────────────────────────────
// Un hacha no barre igual que una lanza. Con un solo movimiento para
// todas, cambiar de arma se notaba en los números y no en las manos.
//
// Cada gesto recibe el avance del ataque (0 a 1) y el arco del arma, y
// devuelve tres cosas que el dibujante aplica sin saber de qué arma se
// trata: cuánto se desvía del punto de mira, cuánto se aleja de la
// mano, y cuánto crece. Quién usa cada gesto lo dice el servidor.
//
// Ojo: esto es SOLO presentación. El daño, el alcance real y a quién
// alcanza el golpe siguen decidiéndose en el servidor; que el hacha se
// vea subir por encima de la cabeza no cambia a quién toca.
var FASES = { preparacion: 0.28, golpe: 0.30, recuperacion: 0.42 }

function tramo(p) {
  if (p < FASES.preparacion) return [0, p / FASES.preparacion]
  if (p < FASES.preparacion + FASES.golpe) return [1, (p - FASES.preparacion) / FASES.golpe]
  return [2, (p - FASES.preparacion - FASES.golpe) / FASES.recuperacion]
}

var GESTOS = {
  // Espadas: se echa atrás y barre el arco de lado a lado.
  barrido: function (p, arco) {
    var amp = Math.max(0.5, arco), t = tramo(p)
    if (t[0] === 0) return { ang: -amp * 0.7 * t[1], dist: 0, escala: 1 }
    if (t[0] === 1) return { ang: -amp * 0.7 + amp * 1.55 * t[1], dist: 0, escala: 1 }
    return { ang: amp * 0.85 * (1 - t[1]), dist: 0, escala: 1 }
  },
  // Hacha y garrote: sube por encima del hombro y cae a plomo. Pesa,
  // así que la subida es lenta y la caída corta y seca.
  tajo_alto: function (p, arco) {
    var t = tramo(p)
    if (t[0] === 0) return { ang: -2.0 * t[1], dist: -3 * t[1], escala: 1 + 0.12 * t[1] }
    if (t[0] === 1) {
      var k = t[1] * t[1]                       // acelera al caer
      return { ang: -2.0 + 2.7 * k, dist: -3 + 12 * k, escala: 1.12 + 0.18 * k }
    }
    return { ang: 0.7 * (1 - t[1]), dist: 9 * (1 - t[1]), escala: 1.3 - 0.3 * t[1] }
  },
  // Lanza: no gira, sale disparada por el eje de puntería y vuelve.
  estocada: function (p, arco, alcance) {
    var fuera = Math.max(24, alcance * 0.55), t = tramo(p)
    if (t[0] === 0) return { ang: 0.12 * t[1], dist: -10 * t[1], escala: 1 }
    if (t[0] === 1) return { ang: 0.12 - 0.12 * t[1], dist: -10 + (fuera + 10) * Math.sqrt(t[1]), escala: 1 }
    return { ang: 0, dist: fuera * (1 - t[1]), escala: 1 }
  },
  // Daga: como la lanza pero corta y nerviosa, con un giro de muñeca.
  pinchazo: function (p, arco, alcance) {
    var fuera = Math.max(14, alcance * 0.32), t = tramo(p)
    if (t[0] === 0) return { ang: -0.5 * t[1], dist: -6 * t[1], escala: 1 }
    if (t[0] === 1) return { ang: -0.5 + 0.7 * t[1], dist: -6 + (fuera + 6) * t[1], escala: 1 }
    return { ang: 0.2 * (1 - t[1]), dist: fuera * (1 - t[1]), escala: 1 }
  },
  // Arcos y varas: se tensa hacia atrás y se suelta de golpe.
  disparo: function (p) {
    var t = tramo(p)
    if (t[0] === 0) return { ang: -0.25 * t[1], dist: -7 * t[1], escala: 1 - 0.05 * t[1] }
    if (t[0] === 1) return { ang: -0.25 + 0.3 * t[1], dist: -7 + 11 * t[1], escala: 0.95 + 0.1 * t[1] }
    return { ang: 0.05 * (1 - t[1]), dist: 4 * (1 - t[1]), escala: 1.05 - 0.05 * t[1] }
  },
}

// Lo que se aplica cuando NO se está atacando: guardia, esquiva, etc.
var REPOSO = {
  dodge:  { ang: -0.5, dist: -4, escala: 0.9 },
  hurt:   { ang: 0.35, dist: -3, escala: 0.95 },
}

function gestoDe(a, w) {
  if (a.n === 'attack') {
    var f = GESTOS[w.gesto] || GESTOS.barrido
    return f(a.p, w.arco, w.alcance)
  }
  if (REPOSO[a.n]) return REPOSO[a.n]
  // En reposo el arma respira un poco: quieta del todo parece pegada.
  return { ang: Math.sin(a.t / 260) * 0.05, dist: 0, escala: 1 }
}

function dibujarArma(j, a) {
  var w = j.armaVis || { alcance: 46, arco: 1.4, icono: '👊', imagen: null, spriteAngulo: -2.356, gesto: 'barrido' }
  var g = gestoDe(a, w)
  var ang = j.mirando + g.ang
  var largo = Math.max(20, Math.min(w.alcance, 90))

  ctx.save()
  ctx.translate(j.x, j.y)
  ctx.rotate(ang)

  // Estela del golpe, con la forma del gesto: la espada deja un arco,
  // la lanza una línea recta. Se apaga sola conforme avanza el ataque.
  if (a.n === 'attack') {
    var tinta = 'rgba(240,208,112,' + (0.5 * (1 - a.p)) + ')'
    ctx.strokeStyle = tinta; ctx.lineWidth = 5
    if (w.gesto === 'estocada' || w.gesto === 'pinchazo' || w.gesto === 'disparo') {
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(14 + largo * 0.8, 0); ctx.stroke()
    } else {
      ctx.beginPath(); ctx.arc(0, 0, largo, -0.35, 0.35); ctx.stroke()
    }
  }

  ctx.translate(11 + (g.dist || 0), 0)

  // Apuntando a la izquierda, girar el dibujo lo deja boca abajo: la
  // hoja mirando al suelo y el mango arriba. Se espeja en vertical, que
  // es lo que hace cualquier juego 2D con sprites laterales.
  if (Math.cos(j.mirando) < 0) ctx.scale(1, -1)

  var lado = largo * 0.95 * (g.escala || 1)
  // El dibujo se coloca por su EMPUÑADURA, no por su centro. Antes se
  // centraba y el arma quedaba flotando medio sprite por delante del
  // personaje: se veía como un objeto suelto al lado, no como algo que
  // se está sujetando.
  var ex = (w.empunadura && w.empunadura.x != null ? w.empunadura.x : 0.79)
  var ey = (w.empunadura && w.empunadura.y != null ? w.empunadura.y : 0.79)
  var tira = w.tira && sprite(w.tira.url)
  var img = sprite(w.imagen)

  if (tira) {
    // Tira de cuadros: todos cuadrados y en fila. El cuadro lo decide
    // el servidor (anim.f); aquí solo se recorta y se pinta.
    var alto = w.tira.alto || tira.naturalHeight || 32
    var i = Math.min(w.tira.cuadros - 1, Math.max(0, a.f || 0))
    ctx.rotate(-(w.spriteAngulo != null ? w.spriteAngulo : -2.356))
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tira, i * alto, 0, alto, alto, -lado * ex, -lado * ey, lado, lado)
  } else if (img) {
    // El PNG lleva la hoja en diagonal: se compensa con el ángulo que
    // declara el arma, no con un número mágico metido aquí dentro.
    ctx.rotate(-(w.spriteAngulo != null ? w.spriteAngulo : -2.356))
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, -lado * ex, -lado * ey, lado, lado)
  } else if (w.tipo === 'ranged') {
    ctx.beginPath(); ctx.arc(0, 0, largo * 0.16, -1.2, 1.2)
    ctx.strokeStyle = '#F0D070'; ctx.lineWidth = 3; ctx.stroke()
    ctx.font = '17px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.rotate(Math.PI / 4); ctx.fillText(w.icono || '🏹', 0, 0)
  } else if (w.id === 'puños') {
    // A mano desnuda no se pinta un emoji: el 👊 en serif salía como un
    // borrón amarillo pegado al personaje, indistinguible de cualquier
    // otra cosa. Dos nudillos se leen al instante como "sin arma".
    ctx.fillStyle = '#E8C88A'
    ctx.beginPath(); ctx.arc(2, -3, 5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(2, 3, 5, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke()
  } else {
    // Arma sin dibujo propio: su emoji, girado como si fuera la hoja.
    ctx.font = Math.round(22 * (g.escala || 1)) + 'px serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.rotate(Math.PI / 4)
    ctx.fillText(w.icono || '⚔️', 0, 0)
  }
  ctx.restore()
}

// ── Suavizado de posiciones ───────────────────────────────
// El servidor manda 10 posiciones por segundo y la pantalla dibuja 60
// veces. Pintando la posición cruda, el personaje da un salto cada
// 100 ms y se queda quieto entre medias: se ve a tirones aunque la
// simulación sea perfecta.
//
// Aquí cada cuerpo tiene una posición dibujada que persigue a la que
// manda el servidor. No se inventa hacia dónde va nadie (eso sería
// predecir, y al fallar da tirones peores): solo se recorta la
// distancia que queda, un poco en cada cuadro. Es presentación pura;
// los golpes se siguen resolviendo con la posición del servidor.
var SUAVE = {}
var SUAVIDAD = 18        // 1/s. Más alto = más pegado al servidor
function suavizar(clave, x, y, dt) {
  var s = SUAVE[clave]
  if (!s) { s = SUAVE[clave] = { x: x, y: y } }
  // Si el salto es enorme (reaparición, teletransporte, primer cuadro)
  // no se suaviza: se salta. Arrastrar eso se vería como un planeo.
  if (Math.hypot(x - s.x, y - s.y) > 220) { s.x = x; s.y = y; return s }
  var k = 1 - Math.exp(-SUAVIDAD * dt)
  s.x += (x - s.x) * k
  s.y += (y - s.y) * k
  s.vista = true
  return s
}
function olvidarNoVistos() {
  for (var k in SUAVE) { if (!SUAVE[k].vista) delete SUAVE[k]; else SUAVE[k].vista = false }
}

// ── Dibujo ────────────────────────────────────────────────
// El bucle va aparte de lo que pinta, a propósito. Si pintar fallaba,
// se rompía la cadena de requestAnimationFrame y el lienzo se quedaba
// congelado en el último cuadro bueno: exactamente lo que se describe
// como "aparece la espada pero no se mueve nada". Ahora un error
// estropea un cuadro, se anuncia, y el siguiente sigue.
function dibujar() {
  try { pintarEscena() } catch (e) { fallo('dibujo', e) }
  requestAnimationFrame(dibujar)
}

var ultimoCuadro = 0
function pintarEscena() {
  var ahoraMs = Date.now()
  var dtCuadro = Math.min(0.1, (ahoraMs - ultimoCuadro) / 1000) || 0.016
  ultimoCuadro = ahoraMs
  ctx.clearRect(0, 0, 900, 600)
  ctx.fillStyle = '#0A0D13'
  ctx.fillRect(0, 0, 900, 600)

  // Suelo con rejilla tenue, para que se note el movimiento
  ctx.strokeStyle = 'rgba(200,168,75,.05)'
  for (var x = 0; x < 900; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke() }
  for (var y = 0; y < 600; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(900, y); ctx.stroke() }

  if (estado) {
    ;(estado.proyectiles || []).forEach(function (p) {
      // El color lo manda el servidor con el elemento. Aquí no hay una
      // tabla de elementos paralela: si mañana hay uno nuevo, se pinta
      // solo sin tocar esta pantalla.
      var c = p.color || (p.mio ? '#F0D070' : '#E05050')
      // Estela: da sensación de velocidad y, sobre todo, deja ver por
      // dónde ha pasado algo que se mueve más rápido que los cuadros.
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6)
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = c; ctx.fill()
    })

    // Restos: enemigos que acaban de morir, apagándose. Vienen en su
    // propia lista porque un muerto ya no es un enemigo — no recibe
    // golpes, no cuenta para la oleada y no debería confundir a nadie
    // que lea la lista de enemigos.
    ;(estado.restos || []).forEach(function (r) {
      var op = Math.max(0, 1 - r.p)
      var esc = 1 - 0.45 * r.p
      ctx.globalAlpha = op
      ctx.beginPath(); ctx.ellipse(r.x, r.y + r.radio * 0.8, r.radio * esc, r.radio * 0.35, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fill()
      ctx.save()
      ctx.translate(r.x, r.y + r.p * 6)
      ctx.rotate(r.p * 1.2)
      if (r.dir === 'izq') ctx.scale(-1, 1)
      ctx.font = (r.radio * 1.9 * esc) + 'px serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(r.icono, 0, 0)
      ctx.restore()
      ctx.globalAlpha = 1
    })

    ;(estado.enemigos || []).forEach(function (en) {
      // Posición suavizada para dibujar; la de verdad sigue siendo la
      // del servidor, que es con la que se calculan los golpes.
      var s = suavizar('e' + en.id, en.x, en.y, dtCuadro)
      if (en.estado === 'avisando') {
        ctx.beginPath(); ctx.arc(s.x, s.y, en.radio + 14, 0, Math.PI * 2)
        ctx.strokeStyle = '#E03030'; ctx.lineWidth = 2; ctx.stroke()
      }
      // Aturdido: es la ventana para castigarle, así que tiene que
      // verse de un vistazo. Sin señal, el jugador no sabe que acaba de
      // ganarse un segundo gratis.
      if (en.estado === 'aturdido') {
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('💫', s.x, s.y - en.radio - 16)
        ctx.beginPath(); ctx.arc(s.x, s.y, en.radio + 6, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(240,208,112,.6)'; ctx.lineWidth = 2; ctx.stroke()
      }
      // El estado de animación que manda el servidor también vale para
      // los enemigos. Antes llegaba y no se usaba: un emoji quieto que
      // se deslizaba por el suelo, pegara, recibiera o muriera.
      var ea = en.anim || { n: 'idle', t: 0, d: 900 }
      var ap = Math.min(1, (ea.t || 0) / (ea.d || 1))
      var escala = 1, opac = 1, empujeX = 0, empujeY = 0, giro = 0

      if (ea.n === 'attack') {
        // Se echa atrás y se lanza hacia el jugador: el golpe se ve
        // venir en vez de aparecer como un número rojo de la nada.
        var haciaJ = Math.atan2(estado.jugador.y - en.y, estado.jugador.x - en.x)
        var salto = ap < 0.35 ? -6 * (ap / 0.35) : 14 * (1 - (ap - 0.35) / 0.65)
        empujeX = Math.cos(haciaJ) * salto
        empujeY = Math.sin(haciaJ) * salto
        escala = 1 + 0.12 * Math.sin(ap * Math.PI)
      } else if (ea.n === 'hurt') {
        escala = 0.82 + 0.18 * ap
      } else if (ea.n === 'walk') {
        empujeY = -Math.abs(Math.sin((ea.t || 0) / 80)) * 2.5
      } else {
        escala = 1 + Math.sin((ea.t || 0) / 150) * 0.04
      }

      ctx.globalAlpha = opac
      ctx.beginPath(); ctx.ellipse(s.x, s.y + en.radio * 0.8, en.radio * escala, en.radio * 0.35, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill()
      ctx.save()
      ctx.translate(s.x + empujeX, s.y + empujeY)
      ctx.rotate(giro)
      if (en.dir === 'izq') ctx.scale(-1, 1)
      ctx.font = (en.radio * 1.9 * escala) + 'px serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(en.icono, 0, 0)
      ctx.restore()
      // Congelado o ardiendo: un halo del color del elemento. Sin esto,
      // el jugador aplica un efecto y no tiene forma de saberlo.
      if (en.lento || en.quema) {
        ctx.beginPath(); ctx.arc(s.x, s.y, en.radio + 4, 0, Math.PI * 2)
        ctx.strokeStyle = en.lento ? 'rgba(127,212,240,.75)' : 'rgba(240,128,64,.75)'
        ctx.lineWidth = 2; ctx.stroke()
      }
      var w = en.radio * 2.4
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(s.x - w / 2, s.y - en.radio - 12, w, 4)
      ctx.fillStyle = '#E03030'; ctx.fillRect(s.x - w / 2, s.y - en.radio - 12, w * (en.hp / en.hpMax), 4)
    })
    olvidarNoVistos()

    var real = estado.jugador
    var sj = suavizar('jugador', real.x, real.y, dtCuadro)
    // Copia con la posición dibujada: lo que se pinta va suave, lo que
    // se envía y se decide sigue siendo lo del servidor.
    var j = { x: sj.x, y: sj.y, hp: real.hp, hpMax: real.hpMax, mirando: real.mirando,
              armaVis: real.armaVis, esquivando: real.esquivando }
    var a = animLocal()
    ctx.beginPath(); ctx.ellipse(j.x, j.y + 12, 15, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill()

    // El cuerpo respira, se encoge al recibir y se inclina al esquivar.
    // Todo sale del estado de animación que manda el servidor: aquí no
    // se decide cuándo pasa nada, solo cómo se ve cuando pasa.
    var pulso = a.n === 'hurt' ? 0.86 : a.n === 'idle' ? 1 + Math.sin(a.t / 140) * 0.03 : 1
    var brinco = a.n === 'walk' ? Math.abs(Math.sin(a.t / 90)) * 3 : 0
    var mirandoIzq = Math.cos(real.mirando) < 0
    var asp = real.aspecto || {}
    var tira = asp.tira && sprite(asp.tira.url)
    // Para verse pequeño está el avatar. La ilustración grande es para
    // la ficha: encajada en 44 px se veía como un borrón.
    var retrato = !tira ? sprite(asp.avatar || asp.imagen) : null

    ctx.save()
    ctx.translate(0, -brinco)
    if (a.n === 'dodge') { ctx.translate(j.x, j.y); ctx.rotate(-0.25); ctx.translate(-j.x, -j.y) }
    if (a.n === 'hurt') { ctx.globalAlpha = 0.75 }

    if (tira) {
      // Con tira se dibuja SIEMPRE: caminando recorre los cuadros y
      // quieto se queda en el primero. Antes solo se usaba al caminar y
      // el resto del tiempo salía la ilustración grande, así que el
      // personaje cambiaba de aspecto cada vez que te parabas.
      var avance = a.n === 'walk' ? (a.t / a.d) : 0
      dibujarTira(tira, asp.tira, avance, j.x, j.y, 46 * pulso, mirandoIzq)
    } else if (retrato) {
      ctx.save(); ctx.translate(j.x, j.y)
      if (mirandoIzq) ctx.scale(-1, 1)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(retrato, -22 * pulso, -24 * pulso, 44 * pulso, 48 * pulso)
      ctx.restore()
    } else if (asp.emoji) {
      ctx.font = Math.round(30 * pulso) + 'px serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(asp.emoji, j.x, j.y)
    } else {
      // Sin skin ni emoji: el círculo de siempre. Nunca una pantalla
      // en blanco porque falte un dibujo.
      ctx.beginPath(); ctx.arc(j.x, j.y, 15 * pulso, 0, Math.PI * 2)
      ctx.fillStyle = '#C8A84B'; ctx.fill()
    }
    if (a.n === 'hurt') {
      ctx.beginPath(); ctx.arc(j.x, j.y, 18, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(224,80,80,.45)'; ctx.fill()
    }
    if (j.esquivando) {
      ctx.beginPath(); ctx.arc(j.x, j.y, 20, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(240,208,112,.55)'; ctx.lineWidth = 2; ctx.stroke()
    }
    ctx.restore()

    // El arma equipada, visible y orientada. Este era el bug: aqui solo
    // habia una raya amarilla.
    dibujarArma(j, a)

    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(j.x - 22, j.y - 28, 44, 5)
    ctx.fillStyle = '#30C060'; ctx.fillRect(j.x - 22, j.y - 28, 44 * Math.max(0, j.hp / j.hpMax), 5)
  }

  // Chispas de impacto: el servidor avisa dónde y de qué elemento.
  chispas = chispas.filter(function (c) { return c.t < 10 })
  chispas.forEach(function (c) {
    var a = 1 - c.t / 10
    for (var i = 0; i < 5; i++) {
      var ang = c.semilla + i * 1.257
      var r = 4 + c.t * 2.4
      ctx.beginPath()
      ctx.arc(c.x + Math.cos(ang) * r, c.y + Math.sin(ang) * r, 2.4 * a, 0, Math.PI * 2)
      ctx.fillStyle = c.color
      ctx.globalAlpha = a
      ctx.fill()
    }
    ctx.globalAlpha = 1
    c.t++
  })

  golpes = golpes.filter(function (g) { return g.t < 6 })
  golpes.forEach(function (g) {
    ctx.beginPath()
    ctx.arc(g.x, g.y, g.r, g.ang - 0.9, g.ang + 0.9)
    ctx.strokeStyle = 'rgba(240,208,112,' + (0.6 - g.t * 0.1) + ')'
    ctx.lineWidth = 4; ctx.stroke()
    g.t++
  })

  flotantes = flotantes.filter(function (f) { return f.t < 22 })
  flotantes.forEach(function (f) {
    ctx.font = 'bold 15px JetBrains Mono, monospace'; ctx.textAlign = 'center'
    ctx.fillStyle = f.mio ? 'rgba(224,80,80,' + (1 - f.t / 22) + ')' : 'rgba(240,208,112,' + (1 - f.t / 22) + ')'
    ctx.fillText(f.txt, f.x, f.y - 22 - f.t)
    f.t++
  })
}

function anotar(t) {
  var r = document.getElementById('registro')
  var d = document.createElement('div')
  d.textContent = t
  r.insertBefore(d, r.firstChild)
  while (r.children.length > 7) r.removeChild(r.lastChild)
}

// ── Controles ─────────────────────────────────────────────
var MAPA_TECLAS = { w: 'up', a: 'left', s: 'down', d: 'right', arrowup: 'up', arrowleft: 'left', arrowdown: 'down', arrowright: 'right' }
// El manejo de teclas se separa del evento para poder alimentarlo
// también desde el launcher (ver más abajo). Es idempotente: recibir
// dos veces la misma tecla deja el mismo estado.
function pulsarTecla(key) {
  var k = String(key).toLowerCase()
  if (MAPA_TECLAS[k]) teclas[MAPA_TECLAS[k]] = true
  if (k === ' ') { entrada.atacar = true; intencionCambio() }
  if (k === 'shift') { entrada.esquivar = true; intencionCambio() }
  actualizarMovimiento()
}
function soltarTecla(key) {
  var k = String(key).toLowerCase()
  if (MAPA_TECLAS[k]) teclas[MAPA_TECLAS[k]] = false
  if (k === ' ') { entrada.atacar = false; intencionCambio() }
  actualizarMovimiento()
}
document.addEventListener('keydown', function (e) {
  var k = e.key.toLowerCase()
  if (MAPA_TECLAS[k] || k === ' ') e.preventDefault()
  pulsarTecla(e.key)
})
document.addEventListener('keyup', function (e) { soltarTecla(e.key) })

// Esta pantalla corre dentro del iframe del launcher. Si el foco del
// teclado se queda fuera no llega ni un keydown y el personaje se
// queda clavado: era la causa de "entro a la arena y no me puedo
// mover". Se pide el foco y se aceptan las teclas que reenvía el
// launcher, para que deje de depender de dónde esté el cursor.
// Solo tiene sentido robar el foco si estamos empotrados en el
// launcher. Si la página se abre suelta, el foco ya es nuestro.
function empotrado() { try { return window.parent && window.parent !== window } catch (e) { return true } }
function pedirFoco() { if (!empotrado()) return; try { window.focus() } catch (e) {} }
pedirFoco()
window.addEventListener('load', pedirFoco)
document.addEventListener('pointerdown', pedirFoco)
window.addEventListener('message', function (ev) {
  if (ev.origin !== location.origin && ev.origin !== 'null') return
  var d = ev.data
  if (!d || d.type !== 'TECLA') return
  if (d.abajo) pulsarTecla(d.key); else soltarTecla(d.key)
})
function actualizarMovimiento() {
  var antesX = entrada.mx, antesY = entrada.my
  entrada.mx = (teclas.right ? 1 : 0) - (teclas.left ? 1 : 0)
  entrada.my = (teclas.down ? 1 : 0) - (teclas.up ? 1 : 0)
  // Empezar a andar y parar de andar son los dos momentos que mas se
  // notan. Solo se adelanta el envio si la direccion ha CAMBIADO: si no,
  // esto se llamaria en cada repeticion de tecla sin decir nada nuevo.
  if (entrada.mx !== antesX || entrada.my !== antesY) intencionCambio()
}
lienzo.addEventListener('mousemove', function (e) {
  if (!estado) return
  var r = lienzo.getBoundingClientRect()
  var x = (e.clientX - r.left) * (900 / r.width)
  var y = (e.clientY - r.top) * (600 / r.height)
  entrada.apuntar = Math.atan2(y - estado.jugador.y, x - estado.jugador.x)
})
lienzo.addEventListener('mousedown', function () { entrada.atacar = true; intencionCambio() })
window.addEventListener('mouseup', function () { entrada.atacar = false; intencionCambio() })

// ── Mando táctil ─────────────────────────────────
// Tenía tres fallos que hacían el juego injugable en móvil:
//
//  1. Apuntar iba pegado al joystick: te podías mover o apuntar, pero
//     no las dos cosas. En un juego donde retroceder mientras golpeas
//     es media pelea, eso es no tener controles.
//  2. Se leía el primer toque del evento sin mirar de qué dedo era.
//     Con dos
//     dedos en la pantalla, el de la derecha movía el joystick.
//  3. El botón de esquivar dejaba la esquiva activada y NADIE la volvía a
//     poner en false: tras tocarlo una vez, el personaje esquivaba solo
//     cada vez que se le pasaba el enfriamiento, para siempre.
//
// Ahora cada dedo se sigue por su identificador y cada zona hace lo
// suyo, todas a la vez.
;(function () {
  var base = document.getElementById('stick'), punto = document.getElementById('punto')
  var zona = document.getElementById('zona-apuntar')
  var dedoStick = null, centro = { x: 0, y: 0 }
  var dedoMira = null

  // De la lista de toques del evento, el que nos interesa: el nuestro.
  function dedo(ev, id) {
    var l = ev.changedTouches || []
    for (var i = 0; i < l.length; i++) if (l[i].identifier === id) return l[i]
    return null
  }

  // —— Joystick izquierdo: mover ——
  function stickIni(ev) {
    if (dedoStick !== null) return
    var t = ev.changedTouches[0]
    dedoStick = t.identifier
    var r = base.getBoundingClientRect()
    centro = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    stickMov(ev)
    ev.preventDefault()
  }
  function stickMov(ev) {
    if (dedoStick === null) return
    var t = dedo(ev, dedoStick)
    if (!t) return
    var dx = t.clientX - centro.x, dy = t.clientY - centro.y
    var d = Math.hypot(dx, dy) || 1, lim = Math.min(d, 40)
    var nx = (dx / d) * lim, ny = (dy / d) * lim
    punto.style.transform = 'translate(' + nx + 'px,' + ny + 'px)'
    entrada.mx = Math.abs(nx) < 6 ? 0 : nx / 40
    entrada.my = Math.abs(ny) < 6 ? 0 : ny / 40
    // Si nadie está apuntando a mano, se mira hacia donde se anda. En
    // cuanto un dedo toca la zona derecha, manda ese.
    if (dedoMira === null && (entrada.mx || entrada.my)) entrada.apuntar = Math.atan2(entrada.my, entrada.mx)
    ev.preventDefault()
  }
  function stickFin(ev) {
    if (dedoStick !== null && ev && ev.changedTouches && !dedo(ev, dedoStick)) return
    dedoStick = null
    entrada.mx = 0; entrada.my = 0
    punto.style.transform = 'translate(0,0)'
  }
  base.addEventListener('touchstart', stickIni, { passive: false })
  base.addEventListener('touchmove', stickMov, { passive: false })
  base.addEventListener('touchend', stickFin)
  base.addEventListener('touchcancel', stickFin)

  // —— Zona derecha: apuntar ——
  // El ángulo sale de dónde está el dedo respecto al personaje en el
  // lienzo, igual que con el ratón. Así apuntar se hace igual en las
  // dos plataformas y no hay dos formas de calcular lo mismo.
  function mirar(t) {
    if (!estado) return
    var r = lienzo.getBoundingClientRect()
    var x = (t.clientX - r.left) * (900 / r.width)
    var y = (t.clientY - r.top) * (600 / r.height)
    var dx = x - estado.jugador.x, dy = y - estado.jugador.y
    if (Math.hypot(dx, dy) < 8) return     // encima del personaje: no hay dirección
    entrada.apuntar = Math.atan2(dy, dx)
  }
  zona.addEventListener('touchstart', function (ev) {
    if (dedoMira !== null) return
    dedoMira = ev.changedTouches[0].identifier
    mirar(ev.changedTouches[0]); ev.preventDefault()
  }, { passive: false })
  zona.addEventListener('touchmove', function (ev) {
    var t = dedo(ev, dedoMira)
    if (t) { mirar(t); ev.preventDefault() }
  }, { passive: false })
  function miraFin(ev) { if (!ev || !ev.changedTouches || dedo(ev, dedoMira)) dedoMira = null }
  zona.addEventListener('touchend', miraFin)
  zona.addEventListener('touchcancel', miraFin)

  // —— Botones ——
  var at = document.getElementById('atacar')
  at.addEventListener('touchstart', function (e) { entrada.atacar = true; intencionCambio(); e.preventDefault() }, { passive: false })
  at.addEventListener('touchend', function () { entrada.atacar = false; intencionCambio() })
  at.addEventListener('touchcancel', function () { entrada.atacar = false })
  var es = document.getElementById('esquivar')
  es.addEventListener('touchstart', function (e) { entrada.esquivar = true; intencionCambio(); e.preventDefault() }, { passive: false })
  // Esto faltaba. Sin soltar, se esquivaba sola cada 1,4 s para siempre.
  es.addEventListener('touchend', function () { entrada.esquivar = false })
  es.addEventListener('touchcancel', function () { entrada.esquivar = false })

  // Salir de la pantalla con dedos puestos dejaba teclas pegadas.
  window.addEventListener('blur', function () {
    stickFin(); dedoMira = null
    entrada.atacar = false; entrada.esquivar = false
  })
})()

// El bucle arranca aquí, con los controles ya enganchados. Antes se
// llamaba en mitad del archivo: un fallo al pintar impedía registrar el
// ratón y el mando táctil, y la pantalla quedaba muda y sorda a la vez.
dibujar()
cargarArenas()
</script>
<!-- ===== RED-CLIENTE:INICIO (generado por aplicar-red-cliente.js) ===== -->
<style>
  #aviso-red {
    position: fixed; left: 50%; top: 0; transform: translate(-50%, -110%);
    background: #8B1A1A; color: #FFE8E8; border: 1px solid #E03030; border-top: none;
    border-radius: 0 0 8px 8px; padding: 9px 18px; font-size: 13px; z-index: 9999;
    font-family: system-ui, sans-serif; transition: transform .25s ease;
    display: flex; align-items: center; gap: 10px; max-width: 92vw;
  }
  #aviso-red.visible { transform: translate(-50%, 0); }
  #aviso-red.ok { background: #14532D; border-color: #30C060; color: #DCFCE7; }
  #aviso-red button {
    background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
    color: inherit; border-radius: 5px; padding: 3px 10px; font-size: 12px; cursor: pointer;
  }
  /* Foco visible: sin esto no se puede navegar con teclado */
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid #F0D070; outline-offset: 2px;
  }
</style>
<div id="aviso-red" role="status" aria-live="polite"></div>
<script>
(function () {
  if (window.__redCliente) return
  window.__redCliente = true

  var caido = false
  var original = window.fetch.bind(window)

  function aviso(texto, ok, conBoton) {
    var el = document.getElementById('aviso-red')
    if (!el) return
    el.className = 'visible' + (ok ? ' ok' : '')
    el.innerHTML = ''
    el.appendChild(document.createTextNode(texto))
    if (conBoton) {
      var b = document.createElement('button')
      b.textContent = 'Reintentar'
      b.onclick = function () { location.reload() }
      el.appendChild(b)
    }
    if (ok) setTimeout(function () { el.className = '' }, 2500)
  }

  function esLectura(init) {
    var m = (init && init.method ? init.method : 'GET').toUpperCase()
    return m === 'GET' || m === 'HEAD'
  }

  var dormir = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  window.fetch = async function (entrada, init) {
    var intentos = esLectura(init) ? 3 : 1   // las escrituras NO se repiten
    var ultimoError
    for (var i = 0; i < intentos; i++) {
      try {
        var res = await original(entrada, init)
        // Un 5xx en una lectura suele ser pasajero: merece otro intento
        if (res.status >= 500 && esLectura(init) && i < intentos - 1) {
          await dormir(400 * Math.pow(2, i))
          continue
        }
        if (caido) { caido = false; aviso('Conexión restablecida', true) }
        return res
      } catch (e) {
        ultimoError = e
        if (i < intentos - 1) await dormir(400 * Math.pow(2, i))
      }
    }
    if (!caido) {
      caido = true
      aviso('Sin conexión con el servidor. Tus últimos cambios pueden no haberse guardado.', false, true)
    }
    throw ultimoError
  }

  window.addEventListener('offline', function () {
    caido = true
    aviso('Te has quedado sin internet.', false, false)
  })
  window.addEventListener('online', function () {
    caido = false
    aviso('Conexión restablecida', true)
  })
})()
</script>
<!-- ===== RED-CLIENTE:FIN ===== -->
<!-- ===== AVISOS:INICIO (generado por aplicar-avisos.js) ===== -->
<style>
  #btn-aviso {
    position: fixed; right: 12px; top: 12px; z-index: 500;
    background: rgba(10,13,19,.72); border: 1px solid rgba(200,168,75,.4);
    color: #C8A84B; border-radius: 20px; padding: 6px 12px; font-size: 12px;
    cursor: pointer; font-family: system-ui, sans-serif; opacity: .55;
    transition: opacity .15s ease;
  }
  #btn-aviso:hover { opacity: 1; }
  #caja-aviso {
    position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 9998;
    display: none; align-items: center; justify-content: center; padding: 18px;
  }
  #caja-aviso.abierta { display: flex; }
  #caja-aviso .cuadro {
    background: #12151D; border: 1px solid #2A2418; border-radius: 12px;
    padding: 18px; width: 100%; max-width: 460px;
    font-family: system-ui, sans-serif; color: #E8E0CC;
  }
  #caja-aviso h3 { margin: 0 0 4px; font-size: 16px; color: #F0D070; }
  #caja-aviso .ayuda { font-size: 12px; color: #7A7060; margin-bottom: 12px; line-height: 1.5; }
  #caja-aviso .tipos { display: flex; gap: 6px; margin-bottom: 10px; }
  #caja-aviso .tipos button {
    flex: 1; background: rgba(20,24,34,.8); border: 1px solid #2A2418; color: #E8E0CC;
    border-radius: 7px; padding: 8px; font-size: 12px; cursor: pointer; min-height: 40px;
  }
  #caja-aviso .tipos button.sel { border-color: #F0D070; color: #F0D070; }
  #caja-aviso textarea {
    width: 100%; min-height: 110px; background: #0A0D13; border: 1px solid #2A2418;
    border-radius: 7px; color: #E8E0CC; padding: 9px; font-family: inherit; font-size: 13px;
    resize: vertical; box-sizing: border-box;
  }
  #caja-aviso .pie { display: flex; gap: 8px; margin-top: 12px; }
  #caja-aviso .pie button { flex: 1; border-radius: 7px; padding: 10px; font-size: 13px; cursor: pointer; min-height: 42px; }
  #caja-aviso .enviar { background: #C8A84B; border: 0; color: #0A0D13; font-weight: 700; }
  #caja-aviso .cerrar { background: none; border: 1px solid #2A2418; color: #7A7060; }
  #caja-aviso .contexto { font-size: 11px; color: #5A5449; margin-top: 10px; line-height: 1.5; }
</style>
<button id="btn-aviso" onclick="abrirAviso()" title="Contar un fallo o una idea">💬 Aviso</button>
<div id="caja-aviso" role="dialog" aria-modal="true" aria-label="Enviar un aviso">
  <div class="cuadro">
    <h3>¿Qué ha pasado?</h3>
    <div class="ayuda">Cuéntalo con tus palabras. Si es un fallo, di qué estabas haciendo justo antes: eso es lo que más ayuda.</div>
    <div class="tipos">
      <button data-tipo="fallo" class="sel" onclick="tipoAviso('fallo', this)">🐛 Un fallo</button>
      <button data-tipo="idea" onclick="tipoAviso('idea', this)">💡 Una idea</button>
      <button data-tipo="otro" onclick="tipoAviso('otro', this)">💭 Otra cosa</button>
    </div>
    <textarea id="texto-aviso" placeholder="Ejemplo: al comprar en el mercado se quedó cargando y perdí el oro"></textarea>
    <div class="pie">
      <button class="cerrar" onclick="cerrarAviso()">Cancelar</button>
      <button class="enviar" id="enviar-aviso" onclick="enviarAviso()">Enviar</button>
    </div>
    <div class="contexto" id="contexto-aviso"></div>
  </div>
</div>
<script>
(function () {
  if (window.__avisos) return
  window.__avisos = true
  var tipo = 'fallo'

  window.tipoAviso = function (t, btn) {
    tipo = t
    var b = document.querySelectorAll('#caja-aviso .tipos button')
    for (var i = 0; i < b.length; i++) b[i].className = ''
    btn.className = 'sel'
  }

  window.abrirAviso = function () {
    document.getElementById('caja-aviso').classList.add('abierta')
    document.getElementById('contexto-aviso').textContent =
      'Se enviará también: página ' + (location.pathname || '/') +
      ' · pantalla ' + window.innerWidth + '×' + window.innerHeight + ' · tu navegador.'
    document.getElementById('texto-aviso').focus()
  }
  window.cerrarAviso = function () {
    document.getElementById('caja-aviso').classList.remove('abierta')
  }

  window.enviarAviso = async function () {
    var area = document.getElementById('texto-aviso')
    var boton = document.getElementById('enviar-aviso')
    var texto = (area.value || '').trim()
    if (texto.length < 3) { area.focus(); return }
    boton.disabled = true
    boton.textContent = 'Enviando...'
    try {
      var res = await fetch('/api/feedback', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipo, texto: texto,
          pagina: location.pathname,
          pantalla: window.innerWidth + 'x' + window.innerHeight,
        }),
      })
      if (res.ok) {
        area.value = ''
        boton.textContent = '¡Gracias!'
        setTimeout(function () { window.cerrarAviso(); boton.textContent = 'Enviar'; boton.disabled = false }, 900)
      } else {
        var d = await res.json()
        boton.textContent = (d && d.error) || 'No se pudo enviar'
        setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
      }
    } catch (e) {
      boton.textContent = 'Sin conexión'
      setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.cerrarAviso()
  })
})()
</script>
<!-- ===== AVISOS:FIN ===== -->
</body>
</html>`
