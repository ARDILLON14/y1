PAGES['criptomundo-huerto.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CriptoMundo — Huerto</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { --void:#05070A; --panel:#12151D; --card:#161A24; --border:#2A2418;
    --gold:#C8A84B; --gold2:#F0D070; --txt:#E8E0CC; --dim:#7A7060; --verde:#30C060; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--void); color:var(--txt); font-family:'JetBrains Mono',monospace; }
  .barra { display:flex; align-items:center; gap:14px; padding:9px 14px; background:var(--panel); border-bottom:1px solid var(--border); }
  .titulo { font-family:'Cinzel',serif; color:var(--gold2); font-size:14px; letter-spacing:1px; }
  .dato { font-size:11px; color:var(--dim); }
  .dato b { color:var(--txt); }
  .cuerpo { display:grid; grid-template-columns:1fr 320px; gap:14px; padding:14px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px; }
  .card h2 { font-family:'Cinzel',serif; font-size:12px; letter-spacing:2px; color:var(--dim);
    text-transform:uppercase; margin-bottom:10px; }
  .parcelas { display:grid; grid-template-columns:repeat(auto-fill,minmax(128px,1fr)); gap:10px; }
  .parcela { background:#0A0D13; border:1px solid var(--border); border-radius:9px; padding:12px; text-align:center; }
  .parcela.lista { border-color:var(--verde); box-shadow:0 0 12px rgba(48,192,96,.18); }
  .parcela.creciendo { border-color:#3A3020; }
  .p-icono { font-size:30px; line-height:1.3; }
  .p-nombre { font-size:11px; color:var(--txt); margin-bottom:4px; }
  .p-estado { font-size:10px; color:var(--dim); margin-bottom:6px; }
  .p-barra { height:5px; background:#05070A; border-radius:3px; overflow:hidden; margin-bottom:8px; }
  .p-barra i { display:block; height:100%; background:linear-gradient(90deg,#1E5A32,#30C060); }
  .btn { width:100%; background:rgba(200,168,75,.14); border:1px solid var(--border); color:var(--gold);
    border-radius:6px; padding:7px; font-size:11px; cursor:pointer; font-family:inherit; min-height:38px; }
  .btn:hover { border-color:var(--gold); }
  .btn.verde { border-color:var(--verde); color:var(--verde); background:rgba(48,192,96,.14); }
  .btn:disabled { opacity:.4; cursor:not-allowed; }
  .semillas { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
  .semilla { background:#0A0D13; border:1px solid var(--border); border-radius:7px; padding:7px 10px; font-size:11px; cursor:pointer; }
  .semilla.sel { border-color:var(--gold2); color:var(--gold2); }
  .semilla.sin { opacity:.4; cursor:not-allowed; }
  .nodo { background:#0A0D13; border:1px solid var(--border); border-radius:9px; padding:10px; margin-bottom:8px; }
  .n-nombre { font-size:12px; color:var(--gold); }
  .n-desc { font-size:11px; color:var(--dim); line-height:1.5; margin:4px 0 7px; }
  .zonas { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:10px; }
  .zona { background:#0A0D13; border:1px solid var(--border); color:var(--dim); border-radius:6px;
    padding:5px 10px; font-size:11px; cursor:pointer; }
  .zona.sel { border-color:var(--gold); color:var(--gold); }
  .registro { font-size:11px; color:var(--dim); line-height:1.7; max-height:170px; overflow-y:auto; }
  .aviso { font-size:11px; color:var(--dim); line-height:1.6; margin-top:10px; }
  @media (max-width:860px) { .cuerpo { grid-template-columns:1fr; } }
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
  <span class="titulo">🌾 HUERTO Y RECOLECCIÓN</span>
  <span class="dato">Parcelas <b id="d-parcelas">—</b></span>
  <span class="dato">Cosechas <b id="d-cosechas">0</b></span>
</div>

<div class="cuerpo">
  <div>
    <div class="card">
      <h2>Parcelas</h2>
      <div class="semillas" id="semillas"></div>
      <div class="parcelas" id="parcelas"></div>
      <div class="aviso">Las plantas crecen en tiempo real aunque cierres el juego: el servidor
      guarda cuándo sembraste. Al cosechar puedes recuperar semillas, así que el huerto no se agota.</div>
    </div>
  </div>

  <div>
    <div class="card">
      <h2>Recolectar</h2>
      <div class="zonas" id="zonas"></div>
      <div id="nodos"></div>
      <div class="aviso">Cada sitio se repone al cabo de un rato. Para recolectar en una zona
      tienes que haberla visitado antes en el mapa.</div>
    </div>
    <div class="card" style="margin-top:12px">
      <h2>Registro</h2>
      <div class="registro" id="registro">Sin actividad todavía.</div>
    </div>
  </div>
</div>

<script>
// El estado del huerto y de los nodos lo lleva el servidor: aquí solo
// se pide, se pinta y se mandan las acciones. Los tiempos que se ven
// son los que devuelve el servidor, no un contador del navegador.
var HUERTO = null
var SEMILLA = null
var ZONA = 'pueblo'
var ZONAS = [
  { id: 'pueblo', nombre: '🏘️ Pueblo' },
  { id: 'forest', nombre: '🌲 Bosque' },
  { id: 'mines', nombre: '⛏️ Minas' },
]

function anotar(t) {
  var r = document.getElementById('registro')
  if (r.textContent === 'Sin actividad todavía.') r.textContent = ''
  var d = document.createElement('div')
  d.textContent = t
  r.insertBefore(d, r.firstChild)
  while (r.children.length > 14) r.removeChild(r.lastChild)
}

async function api(ruta, cuerpo) {
  var o = { credentials: 'include', headers: { 'Content-Type': 'application/json' } }
  if (cuerpo) { o.method = 'POST'; o.body = JSON.stringify(cuerpo) }
  var r = await fetch(ruta, o)
  var d = {}
  try { d = await r.json() } catch (e) {}
  return { ok: r.ok, d: d }
}

async function cargarHuerto() {
  var r = await api('/api/farm')
  if (!r.ok) { document.getElementById('parcelas').innerHTML = '<div class="aviso">Inicia sesión para usar el huerto.</div>'; return }
  HUERTO = r.d
  document.getElementById('d-parcelas').textContent = HUERTO.total
  pintarSemillas()
  pintarParcelas()
}

function pintarSemillas() {
  document.getElementById('semillas').innerHTML = HUERTO.semillas.map(function (s) {
    return '<div class="semilla ' + (SEMILLA === s.id ? 'sel' : '') + (s.tengo ? '' : ' sin') + '"' +
      (s.tengo ? ' onclick="elegirSemilla(\\'' + s.id + '\\')"' : '') + '>' +
      s.icono + ' ' + s.nombre + ' ×' + s.tengo + '</div>'
  }).join('')
}
function elegirSemilla(id) { SEMILLA = id; pintarSemillas() }

function pintarParcelas() {
  document.getElementById('parcelas').innerHTML = HUERTO.parcelas.map(function (p) {
    if (p.estado === 'vacia') {
      return '<div class="parcela"><div class="p-icono">🟫</div>' +
        '<div class="p-nombre">Parcela ' + (p.i + 1) + '</div>' +
        '<div class="p-estado">Vacía</div>' +
        '<button class="btn" onclick="sembrar(' + p.i + ')">Sembrar</button></div>'
    }
    var seg = Math.ceil(p.restanteMs / 1000)
    var lista = p.estado === 'lista'
    return '<div class="parcela ' + p.estado + '">' +
      '<div class="p-icono">' + (lista ? p.iconoProduce : p.icono) + '</div>' +
      '<div class="p-nombre">' + p.produce + '</div>' +
      '<div class="p-estado">' + (lista ? 'Listo para cosechar' : 'Crece · ' + seg + 's') + '</div>' +
      '<div class="p-barra"><i style="width:' + Math.round(p.progreso * 100) + '%"></i></div>' +
      '<button class="btn ' + (lista ? 'verde' : '') + '" ' + (lista ? '' : 'disabled') +
      ' onclick="cosechar(' + p.i + ')">' + (lista ? 'Cosechar' : 'Creciendo') + '</button></div>'
  }).join('')
}

async function sembrar(i) {
  if (!SEMILLA) { anotar('⚠️ Elige antes una semilla'); return }
  var r = await api('/api/farm/plant', { parcela: i, semilla: SEMILLA })
  if (!r.ok) { anotar('⚠️ ' + (r.d.error || 'No se pudo sembrar')); return }
  HUERTO = r.d.huerto
  anotar('🌱 Sembrado en la parcela ' + (i + 1))
  pintarSemillas(); pintarParcelas()
}

async function cosechar(i) {
  var r = await api('/api/farm/harvest', { parcela: i })
  if (!r.ok) { anotar('⚠️ ' + (r.d.error || 'Todavía no')); return }
  HUERTO = r.d.huerto
  anotar('🌾 Cosechado: ' + r.d.obtenido.map(function (o) { return o.icono + ' ' + o.nombre + ' ×' + o.cantidad }).join(', ') + ' (+' + r.d.xp + ' XP)')
  ;(r.d.levelUps || []).forEach(function (l) { anotar('🎉 ¡Nivel ' + l.level + '!') })
  var c = document.getElementById('d-cosechas')
  c.textContent = (parseInt(c.textContent, 10) || 0) + 1
  pintarSemillas(); pintarParcelas()
  avisarPadre()
}

// ── Recolección ───────────────────────────────────────────
function pintarZonas() {
  document.getElementById('zonas').innerHTML = ZONAS.map(function (z) {
    return '<div class="zona ' + (ZONA === z.id ? 'sel' : '') + '" onclick="cambiarZona(\\'' + z.id + '\\')">' + z.nombre + '</div>'
  }).join('')
}
function cambiarZona(z) { ZONA = z; pintarZonas(); cargarNodos() }

async function cargarNodos() {
  var r = await api('/api/gather?zona=' + ZONA)
  if (!r.ok) return
  var ahora = Date.now()
  document.getElementById('nodos').innerHTML = (r.d.nodos || []).map(function (n) {
    var espera = Math.max(0, Math.ceil((n.listoEn - ahora) / 1000))
    return '<div class="nodo"><div class="n-nombre">' + n.icono + ' ' + n.nombre + '</div>' +
      '<div class="n-desc">' + n.descripcion + '</div>' +
      '<button class="btn" ' + (espera ? 'disabled' : '') + ' onclick="recolectar(\\'' + n.id + '\\')">' +
      (espera ? 'Se repone en ' + espera + 's' : 'Recolectar') + '</button></div>'
  }).join('') || '<div class="aviso">Sin sitios de recolección en esta zona.</div>'
}

async function recolectar(id) {
  var r = await api('/api/gather', { nodoId: id })
  if (!r.ok) { anotar('⚠️ ' + (r.d.error || 'No se pudo')); return }
  anotar('🧺 ' + r.d.nodo + ': ' + r.d.obtenido.map(function (o) { return o.icono + ' ' + o.nombre + ' ×' + o.cantidad }).join(', ') + ' (+' + r.d.xp + ' XP)')
  ;(r.d.levelUps || []).forEach(function (l) { anotar('🎉 ¡Nivel ' + l.level + '!') })
  cargarNodos(); cargarHuerto()
  avisarPadre()
}

function avisarPadre() { try { window.parent.postMessage({ type: 'REFRESH_CHARACTER' }, '*') } catch (e) {} }

pintarZonas()
cargarNodos()
cargarHuerto()
// Refresco suave: los tiempos que se ven vienen del servidor
setInterval(function () { if (!document.hidden) { cargarHuerto(); cargarNodos() } }, 5000)
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
