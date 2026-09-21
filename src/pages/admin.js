PAGES['admin.html'] = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CriptoMundo — Analítica</title>
<style>
:root{--void:#05070A;--card:#161A24;--gold:#C8A84B;--gold2:#F0D070;--border:#1A1D28;--txt:#E8E0CC;--dim:#7A7060}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--void);color:var(--txt);font-family:Georgia,serif;padding:24px;line-height:1.55}
.wrap{max-width:1000px;margin:0 auto}
h1{font-size:24px;color:var(--gold2);margin-bottom:14px}
input{background:#0a0d13;border:1px solid var(--border);color:var(--txt);padding:9px 12px;border-radius:5px;font-family:monospace;width:280px}
button{background:var(--gold);color:#0a0d13;border:0;padding:9px 18px;border-radius:5px;font-weight:700;cursor:pointer;margin-left:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
.card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px}
.card .k{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px}
.card .v{font-size:24px;color:var(--gold2);font-family:monospace}
.sec{font-size:13px;color:var(--gold);text-transform:uppercase;letter-spacing:2px;margin:24px 0 10px;border-bottom:1px solid var(--border);padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--border)}
th{color:var(--dim);font-size:11px;text-transform:uppercase}
td.num{font-family:monospace;text-align:right}
.bar{height:16px;background:#0a0d13;border-radius:3px;overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#7A6530,#F0D070)}
.hint{color:var(--dim);font-size:12px;margin-top:8px}
.drop{color:#EF4444;font-family:monospace}



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
</style></head><body><div class="wrap">
<h1>Panel de analítica</h1>
<div><input id="tok" placeholder="ADMIN_TOKEN" type="password"><button onclick="load()">Ver</button></div>
<div class="hint">Arranca el servidor con <code>ADMIN_TOKEN=tu_clave node criptomundo.js</code></div>
<div id="out"></div>
</div>
<script>
const n = x => (x==null?'—':x.toLocaleString('es'))
function load(){
  const tok = document.getElementById('tok').value
  fetch('/api/admin/analytics', { headers:{ 'X-Admin-Token': tok } }).then(r=>r.json()).then(d=>{
    if(d.error){ document.getElementById('out').innerHTML='<p class="hint">'+d.error+'</p>'; return }
    const s=d.resumen, maxF=Math.max(1,...d.embudo.map(x=>x.usuarios))
    document.getElementById('out').innerHTML =
    '<div class="grid">' + [
      ['Usuarios totales', n(s.usuariosTotales)],
      ['Activos hoy', n(s.activosHoy)],
      ['Sesiones hoy', n(s.sesionesHoy)],
      ['Minutos (mediana)', n(s.minutosMedianaPorJugador)],
      ['Juegan +40 min', n(s.jugadoresQueSuperan40min)],
      ['Volvieron alguna vez', d.retencion.volvieronAlgunaVez + ' %'],
    ].map(([k,v])=>\`<div class="card"><div class="k">\${k}</div><div class="v">\${v}</div></div>\`).join('') + '</div>'

    + '<div class="sec">Avisos de los jugadores</div><div id="avisos-lista">cargando\u2026</div>'
    + '<div class="sec">Dónde pasan el rato y dónde lo dejan</div>'
    + (d.pantallas && d.pantallas.pantallas.length
        ? '<table><tr><th>Pantalla</th><th>Minutos totales</th><th>Se fueron desde aquí</th><th style="width:32%"></th></tr>'
          + (function () {
              var maxMin = Math.max.apply(null, d.pantallas.pantallas.map(function (x) { return x.minutos }).concat([1]))
              return d.pantallas.pantallas.map(function (x) {
                return '<tr><td>' + x.pantalla + '</td><td class="num">' + Math.round(x.minutos) + '</td>'
                  + '<td class="num drop">' + (x.abandonos || '') + '</td>'
                  + '<td><div class="bar"><i style="width:' + (x.minutos / maxMin * 100) + '%"></i></div></td></tr>'
              }).join('')
            })()
          + '</table><div class="hint">La columna roja es la respuesta a "¿en qué momento dejaste de tener ganas?", '
          + 'sin tener que preguntarlo. '
          + (d.pantallas.dondeSeVan ? 'Ahora mismo la gente se va sobre todo desde <b>' + d.pantallas.dondeSeVan + '</b>.' : '')
          + '</div>'
        : '<div class="hint">Sin datos todavía: hacen falta jugadores moviéndose entre pantallas.</div>')

    + '<div class="sec">Embudo de onboarding — dónde se pierde la gente</div><table>'
    + '<tr><th>Paso</th><th>Usuarios</th><th>%</th><th>Se quedan aquí</th><th style="width:32%"></th></tr>'
    + d.embudo.map(x=>\`<tr><td>\${x.paso}</td><td class="num">\${n(x.usuarios)}</td><td class="num">\${x.porcentaje}%</td>
        <td class="num drop">\${x.abandonanAqui||''}</td><td><div class="bar"><i style="width:\${x.usuarios/maxF*100}%"></i></div></td></tr>\`).join('')
    + '</table><div class="hint">La columna roja es la señal más útil: es donde la gente deja de avanzar. Arregla ese paso antes que cualquier otra cosa.</div>'

    + '<div class="sec">Retención por cohorte</div><table>'
    + '<tr><th>Cohorte (alta)</th><th>Tamaño</th><th>D1</th><th>D7</th><th>D30</th></tr>'
    + Object.entries(d.retencion.porCohorte).map(([k,v])=>\`<tr><td>\${k}</td><td class="num">\${v.cohorte}</td><td class="num">\${v.d1}%</td><td class="num">\${v.d7}%</td><td class="num">\${v.d30}%</td></tr>\`).join('')
    + '</table><div class="hint">Referencia sana en RPG de navegador: D1 &gt; 30 %, D7 &gt; 12 %. Por debajo, el bucle de juego no engancha todavía.</div>'

    + '<div class="sec">Curva de economía por hora</div><table>'
    + '<tr><th>Hora (UTC)</th><th>Oro creado</th><th>Oro quemado</th><th>Neto</th><th>Oro/hora jugada</th><th>CGRID</th><th>Kills</th></tr>'
    + d.economia.slice().reverse().map(x=>\`<tr><td>\${x.hora.replace('T',' ')}h</td><td class="num">\${n(x.oroCreado)}</td><td class="num">\${n(x.oroQuemado)}</td>
        <td class="num" style="color:\${x.neto>0?'#EF4444':'#10B981'}">\${n(x.neto)}</td><td class="num">\${n(x.oroPorHoraJugada)}</td><td class="num">\${n(x.cgrid)}</td><td class="num">\${n(x.kills)}</td></tr>\`).join('')
    + '</table><div class="hint">Si "oro/hora jugada" sube con el tiempo sin que suban los sinks, la economía se está inflando.</div>'

    + '<div class="sec">Actividad diaria</div><table>'
    + '<tr><th>Día</th><th>Nuevos</th><th>Activos</th><th>Sesiones</th><th>Minutos</th><th>Oro creado</th><th>Oro quemado</th><th>CGRID</th></tr>'
    + d.diario.slice().reverse().map(x=>\`<tr><td>\${x.dia}</td><td class="num">\${n(x.newUsers)}</td><td class="num">\${n(x.activeUsers)}</td>
        <td class="num">\${n(x.sessions)}</td><td class="num">\${Math.round(x.playMinutes)}</td><td class="num">\${n(x.goldFaucet)}</td><td class="num">\${n(x.goldSink)}</td><td class="num">\${n(x.cgridMint)}</td></tr>\`).join('')
    + '</table>'
    cargarAvisos(tok)
  }).catch(e=>{document.getElementById('out').innerHTML='<p class="hint">Error: '+e.message+'</p>'})
}
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
</body></html>`
