PAGES['criptomundo-mundo2d.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Mundo 2D</title>
<!-- Phaser se sirve DESDE AQUÍ, no desde un CDN.
     Estaba enlazado a cdnjs y el resultado, comprobado en un navegador
     real sin salida a internet, es "Phaser is not defined" y la
     pantalla del mundo entera en negro. No a tirones: muerta.
     Y no es un caso raro: este proyecto es "un ejecutable, cero
     dependencias" y se juega en redes que ya nos han dado problemas
     (el WebSocket de la v30). Depender de que un servidor de terceros
     conteste para poder ver el mundo es regalar el juego a la red.
     El CDN queda de respaldo por si el archivo local faltara. -->
<script src="/assets/vendor/phaser.min.js"></script>
<script>
  if (!window.Phaser) {
    document.write('<scr' + 'ipt src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js"><\/scr' + 'ipt>')
  }
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap');

*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:#05070A;}

#game-container { position:relative; width:100vw; height:100vh; }
#phaser-canvas   { display:block; }

/* ── HUD overlay ── */
#hud {
  position:absolute; top:0; left:0; right:0; bottom:0;
  pointer-events:none;
  font-family:'Cinzel',serif;
}

/* Topbar */
#topbar {
  position:absolute; top:0; left:0; right:0;
  height:48px;
  background:linear-gradient(180deg,rgba(5,7,10,.95) 0%,rgba(5,7,10,.7) 100%);
  border-bottom:1px solid rgba(200,168,75,.2);
  display:flex; align-items:center;
  padding:0 16px; gap:12px;
  backdrop-filter:blur(4px);
}
.logo-small {
  font-size:15px; font-weight:900; color:#C8A84B;
  letter-spacing:3px; text-shadow:0 0 20px rgba(200,168,75,.4);
}
.hud-sep { width:1px; height:20px; background:rgba(200,168,75,.2); }
.hud-stat {
  display:flex; align-items:center; gap:5px;
  background:rgba(22,26,36,.8); border:1px solid rgba(26,29,40,.9);
  border-radius:6px; padding:4px 10px;
  font-family:'JetBrains Mono',monospace; font-size:11px;
}
.hud-stat b { color:#C8A84B; }
.hud-stat span { color:#7A7060; font-size:9px; }
#zone-name {
  margin-left:auto; font-size:11px; color:#C8A84B;
  letter-spacing:2px; text-transform:uppercase;
  text-shadow:0 0 12px rgba(200,168,75,.4);
}
.hud-btn {
  pointer-events:all; cursor:pointer;
  background:rgba(22,26,36,.85); border:1px solid rgba(26,29,40,.9);
  border-radius:6px; padding:5px 12px;
  font-family:'Cinzel',serif; font-size:10px; font-weight:600;
  letter-spacing:1px; color:#7A7060;
  transition:all .15s; text-transform:uppercase;
}
.hud-btn:hover { border-color:rgba(200,168,75,.4); color:#C8A84B; }

/* Minimap */
#minimap-wrap {
  position:absolute; top:60px; right:12px;
  background:rgba(5,7,10,.9); border:1px solid rgba(200,168,75,.25);
  border-radius:8px; overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,.6);
}
#minimap-canvas { display:block; }
#minimap-label {
  text-align:center; padding:4px 0 5px;
  font-size:9px; color:#7A7060; letter-spacing:2px;
}

/* Status bars (bottom-left) */
#status-bars {
  position:absolute; bottom:70px; left:12px;
  display:flex; flex-direction:column; gap:5px;
}
.bar-wrap {
  display:flex; flex-direction:column; gap:2px;
  background:rgba(5,7,10,.85); border:1px solid rgba(26,29,40,.9);
  border-radius:7px; padding:7px 10px; min-width:160px;
  backdrop-filter:blur(4px);
}
.bar-row { display:flex; justify-content:space-between; font-size:9px; color:#7A7060; font-family:'JetBrains Mono',monospace; margin-bottom:3px; }
.bar-row span { color:#E8E0CC; }
.bar-track { height:6px; background:#0F1219; border-radius:3px; overflow:hidden; border:1px solid rgba(26,29,40,.9); }
.bar-fill { height:100%; border-radius:3px; transition:width .5s; }
#hp-fill  { background:linear-gradient(90deg,#8B1A1A,#E03030); }
#mp-fill  { background:linear-gradient(90deg,#1A3A8B,#4090F0); }
#xp-fill  { background:linear-gradient(90deg,#7A6530,#C8A84B); }

/* Action bar */
#action-bar {
  position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
  display:flex; gap:6px; align-items:center;
  background:rgba(5,7,10,.9); border:1px solid rgba(200,168,75,.2);
  border-radius:10px; padding:8px 12px;
  backdrop-filter:blur(6px);
  pointer-events:all;
}
.action-key {
  display:flex; flex-direction:column; align-items:center; gap:3px;
  cursor:pointer;
  background:rgba(22,26,36,.8); border:1px solid rgba(26,29,40,.9);
  border-radius:7px; padding:7px 10px;
  transition:all .12s; min-width:52px;
}
.action-key:hover { border-color:rgba(200,168,75,.4); background:rgba(34,38,58,.8); transform:translateY(-1px); }
.action-key:active { transform:translateY(0); }
.ak-icon { font-size:20px; }
.ak-label { font-size:9px; color:#7A7060; letter-spacing:.5px; }
.ak-key {
  font-family:'JetBrains Mono',monospace; font-size:8px;
  color:#3A3830; background:#0F1219; border-radius:3px;
  padding:1px 4px; margin-top:1px;
}
.action-sep { width:1px; height:36px; background:rgba(200,168,75,.12); }

/* Event log */
#event-log {
  position:absolute; bottom:70px; right:12px;
  width:240px;
  background:rgba(5,7,10,.88); border:1px solid rgba(26,29,40,.9);
  border-radius:8px; overflow:hidden;
  backdrop-filter:blur(4px);
}
#event-log-title {
  padding:6px 10px; font-size:9px; color:#7A7060;
  letter-spacing:2px; border-bottom:1px solid rgba(26,29,40,.9);
  display:flex; align-items:center; gap:5px;
}
#event-log-title::before { content:''; width:5px; height:5px; border-radius:50%; background:#10B981; box-shadow:0 0 5px #10B981; }
#event-log-entries {
  padding:6px 8px; display:flex; flex-direction:column; gap:3px;
  max-height:120px; overflow-y:auto;
}
.log-e {
  font-size:11px; color:#7A7060; padding:2px 4px;
  border-left:2px solid transparent; border-radius:2px;
  font-family:'Crimson Pro',serif; line-height:1.4;
  animation:fadeIn .25s ease-out;
}
@keyframes fadeIn { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:none} }
.log-e.combat { border-color:#E03030; color:#FCA5A5; }
.log-e.loot   { border-color:#C8A84B; color:#C8A84B; }
.log-e.npc    { border-color:#8B5CF6; color:#C4B5FD; }
.log-e.system { border-color:#4090F0; color:#93C5FD; }
.log-e.zone   { border-color:#10B981; color:#6EE7B7; }

/* Zone transition */
#zone-transition {
  position:absolute; inset:0;
  background:rgba(5,7,10,0);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:10px; pointer-events:none;
  transition:background .5s;
}
#zone-transition.active { background:rgba(5,7,10,.95); }
#zone-title-big {
  font-family:'Cinzel',serif; font-size:32px; font-weight:900;
  color:#C8A84B; letter-spacing:6px; text-transform:uppercase;
  text-shadow:0 0 40px rgba(200,168,75,.5);
  opacity:0; transition:opacity .4s .2s;
}
#zone-sub-big {
  font-size:13px; color:#7A7060; letter-spacing:3px;
  opacity:0; transition:opacity .4s .35s;
}
#zone-transition.active #zone-title-big,
#zone-transition.active #zone-sub-big { opacity:1; }

/* NPC dialogue */
#dialogue-box {
  position:absolute; bottom:130px; left:50%; transform:translateX(-50%);
  width:520px; max-width:90vw;
  background:rgba(9,12,18,.96); border:1px solid rgba(200,168,75,.3);
  border-radius:12px; padding:16px 18px;
  backdrop-filter:blur(8px);
  box-shadow:0 8px 32px rgba(0,0,0,.7);
  display:none;
  pointer-events:all;
  animation:popUp .25s cubic-bezier(.34,1.56,.64,1);
}
@keyframes popUp { from{transform:translateX(-50%) scale(.92);opacity:0} to{transform:translateX(-50%) scale(1);opacity:1} }
#dialogue-box.open { display:block; }
.dlg-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.dlg-avatar { font-size:36px; }
.dlg-name { font-family:'Cinzel',serif; font-size:14px; font-weight:600; color:#C8A84B; }
.dlg-role  { font-size:11px; color:#7A7060; margin-top:1px; }
#dialogue-text {
  font-family:'Crimson Pro',serif; font-size:14px; color:#E8E0CC;
  line-height:1.7; min-height:40px; margin-bottom:12px;
}
.dlg-cursor { display:inline-block; width:2px; height:13px; background:#C8A84B; margin-left:2px; vertical-align:middle; animation:blink .8s infinite; }
@keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
.dlg-choices { display:flex; gap:6px; flex-wrap:wrap; }
.dlg-choice {
  background:rgba(22,26,36,.9); border:1px solid rgba(26,29,40,.9);
  border-radius:6px; padding:5px 12px; font-family:'Cinzel',serif;
  font-size:11px; color:#7A7060; cursor:pointer; transition:all .12s;
  letter-spacing:.5px;
}
.dlg-choice:hover { border-color:rgba(200,168,75,.4); color:#C8A84B; }

/* Combat popup */
#combat-popup {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  background:rgba(9,12,18,.97); border:1px solid rgba(220,38,38,.3);
  border-radius:12px; padding:18px 24px; min-width:300px;
  display:none; pointer-events:all;
  box-shadow:0 8px 32px rgba(0,0,0,.8), 0 0 40px rgba(220,38,38,.1);
  animation:popUp .25s cubic-bezier(.34,1.56,.64,1);
}
#combat-popup.open { display:block; }
.cp-title { font-family:'Cinzel',serif; font-size:14px; font-weight:600; color:#E03030; letter-spacing:2px; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
.cp-enemy { display:flex; align-items:center; gap:10px; margin-bottom:12px; background:rgba(22,26,36,.8); border-radius:8px; padding:10px 12px; border:1px solid rgba(26,29,40,.9); }
.cp-enemy-sprite { font-size:32px; }
.cp-enemy-name { font-family:'Cinzel',serif; font-size:13px; color:#E8E0CC; }
.cp-enemy-hp { font-family:'JetBrains Mono',monospace; font-size:11px; color:#7A7060; margin-top:2px; }
.cp-hp-track { height:5px; background:#0F1219; border-radius:3px; overflow:hidden; margin-top:5px; width:140px; }
.cp-hp-fill { height:100%; background:linear-gradient(90deg,#8B1A1A,#E03030); border-radius:3px; transition:width .4s; }
.cp-actions { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.cp-action {
  background:rgba(22,26,36,.9); border:1px solid rgba(26,29,40,.9);
  border-radius:7px; padding:8px; cursor:pointer; transition:all .12s;
  display:flex; flex-direction:column; align-items:center; gap:3px;
  font-family:'Cinzel',serif;
}
.cp-action:hover { border-color:rgba(220,38,38,.4); transform:translateY(-1px); }
.cp-action:disabled { opacity:.3; cursor:not-allowed; }
.cp-a-icon { font-size:20px; }
.cp-a-name { font-size:10px; color:#E8E0CC; letter-spacing:.5px; }
.cp-a-cost { font-size:9px; color:#4090F0; font-family:'JetBrains Mono',monospace; }
.cp-log { margin-top:10px; font-family:'Crimson Pro',serif; font-size:12px; color:#7A7060; max-height:60px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
.cp-log-entry { padding:2px 0; border-left:2px solid transparent; padding-left:6px; }
.cp-log-entry.hit { border-color:#E03030; color:#FCA5A5; }
.cp-log-entry.heal { border-color:#10B981; color:#6EE7B7; }
.cp-log-entry.miss { color:#4A4A50; }
.cp-close { margin-top:10px; width:100%; padding:8px; background:rgba(139,26,26,.3); border:1px solid rgba(220,38,38,.3); border-radius:7px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:1px; color:#F87171; cursor:pointer; transition:all .12s; }
.cp-close:hover { background:rgba(139,26,26,.5); }

/* Notification toast */
.notif-toast {
  position:absolute; top:60px; left:50%; transform:translateX(-50%) translateY(-10px);
  background:rgba(9,12,18,.95); border:1px solid rgba(200,168,75,.3);
  border-radius:8px; padding:8px 18px;
  font-family:'Cinzel',serif; font-size:12px; color:#C8A84B;
  pointer-events:none; white-space:nowrap;
  animation:toastIn .3s cubic-bezier(.34,1.56,.64,1) forwards, toastOut .3s ease .2s forwards;
  box-shadow:0 4px 16px rgba(0,0,0,.6);
}
@keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes toastOut { to{opacity:0;transform:translateX(-50%) translateY(-6px)} }

::-webkit-scrollbar { width:3px; }
::-webkit-scrollbar-thumb { background:#1A1D28; border-radius:2px; }


/* ── Mando táctil ─────────────────────────────────────────
   El mapa se movía solo con WASD y flechas, lo que en un móvil
   significa que no se movía. Esto aparece únicamente en
   dispositivos táctiles: con ratón y teclado no molesta. */
#mando-tactil { display:none; }
@media (hover: none) and (pointer: coarse) {
  #mando-tactil { display:block; }
}
#joystick {
  position:fixed; left:18px; bottom:22px; width:118px; height:118px;
  border-radius:50%; background:rgba(10,13,19,.5);
  border:1px solid rgba(200,168,75,.35); z-index:60;
  touch-action:none; pointer-events:all;
}
#joystick-punto {
  position:absolute; left:50%; top:50%; width:48px; height:48px; margin:-24px 0 0 -24px;
  border-radius:50%; background:rgba(200,168,75,.55);
  border:1px solid rgba(240,208,112,.7); transition:transform .06s linear;
}
#btn-accion {
  position:fixed; right:20px; bottom:34px; width:78px; height:78px; border-radius:50%;
  background:rgba(200,168,75,.18); border:1px solid rgba(200,168,75,.5);
  color:#F0D070; font-size:28px; z-index:60; cursor:pointer;
  touch-action:none; pointer-events:all;
}
#btn-accion:active { background:rgba(200,168,75,.34); }



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
<div id="game-container">
  <!-- Mando táctil: solo aparece en pantallas con dedo, no con ratón -->
  <div id="mando-tactil">
    <div id="joystick"><div id="joystick-punto"></div></div>
    <button id="btn-accion" aria-label="Interactuar">✋</button>
  </div>

  <canvas id="phaser-canvas"></canvas>

  <!-- HUD -->
  <div id="hud">

    <!-- Topbar -->
    <div id="topbar">
      <div class="logo-small">CRIPTOMUNDO</div>
      <div class="hud-sep"></div>
      <div class="hud-stat">🧙 <b>Sebastián</b> <span>NV.12</span></div>
      <div class="hud-stat">🪙 <b id="hud-gold">1,240</b> <span>ORO</span></div>
      <div class="hud-stat">💎 <b id="hud-crypto">12</b> <span>$CGRID</span></div>
      <div class="hud-stat">☠️ <b id="hud-kills">0</b> <span>BAJAS</span></div>
      <div id="zone-name">🏘️ Pueblo Central</div>
      <div class="hud-sep"></div>
      <button class="hud-btn" onclick="openModule('combat')">⚔️ Combate</button>
      <button class="hud-btn" onclick="openModule('market')">🏪 Mercado</button>
      <button class="hud-btn" onclick="openModule('quests')">📜 Misiones</button>
    </div>

    <!-- Minimap -->
    <div id="minimap-wrap">
      <canvas id="minimap-canvas" width="130" height="100"></canvas>
      <div id="minimap-label">MAPA MUNDIAL</div>
    </div>

    <!-- Status bars -->
    <div id="status-bars">
      <div class="bar-wrap">
        <div class="bar-row"><span>❤️ HP</span><span id="hp-txt">850 / 850</span></div>
        <div class="bar-track"><div class="bar-fill" id="hp-fill" style="width:100%"></div></div>
        <div class="bar-row" style="margin-top:5px"><span>🔷 MP</span><span id="mp-txt">400 / 400</span></div>
        <div class="bar-track"><div class="bar-fill" id="mp-fill" style="width:100%"></div></div>
        <div class="bar-row" style="margin-top:5px"><span>✨ EXP</span><span id="xp-txt">3,200 / 5,000</span></div>
        <div class="bar-track"><div class="bar-fill" id="xp-fill" style="width:64%"></div></div>
      </div>
    </div>

    <!-- Action bar -->
    <div id="action-bar">
      <div class="action-key" onclick="triggerAction('interact')">
        <div class="ak-icon">💬</div>
        <div class="ak-label">Hablar</div>
        <div class="ak-key">E</div>
      </div>
      <div class="action-key" onclick="triggerAction('attack')">
        <div class="ak-icon">⚔️</div>
        <div class="ak-label">Atacar</div>
        <div class="ak-key">SPACE</div>
      </div>
      <div class="action-sep"></div>
      <div class="action-key" onclick="triggerAction('potion')">
        <div class="ak-icon">🧪</div>
        <div class="ak-label">Poción</div>
        <div class="ak-key">Q</div>
      </div>
      <div class="action-key" onclick="triggerAction('magic')">
        <div class="ak-icon">🔥</div>
        <div class="ak-label">Magia</div>
        <div class="ak-key">R</div>
      </div>
      <div class="action-sep"></div>
      <div class="action-key" onclick="openModule('inventory')">
        <div class="ak-icon">🎒</div>
        <div class="ak-label">Bolsa</div>
        <div class="ak-key">I</div>
      </div>
      <div class="action-key" onclick="openModule('map')">
        <div class="ak-icon">🗺️</div>
        <div class="ak-label">Mapa</div>
        <div class="ak-key">M</div>
      </div>
    </div>

    <!-- Event log -->
    <div id="event-log">
      <div id="event-log-title">REGISTRO</div>
      <div id="event-log-entries"></div>
    </div>

    <!-- Zone transition overlay -->
    <div id="zone-transition">
      <div id="zone-title-big"></div>
      <div id="zone-sub-big"></div>
    </div>

    <!-- NPC Dialogue -->
    <div id="dialogue-box">
      <div class="dlg-head">
        <div class="dlg-avatar" id="dlg-avatar">🧙</div>
        <div>
          <div class="dlg-name" id="dlg-name">NPC</div>
          <div class="dlg-role" id="dlg-role">Aldeano</div>
        </div>
      </div>
      <div id="dialogue-text"></div>
      <div class="dlg-choices" id="dlg-choices"></div>
    </div>

    <!-- Combat popup -->
    <div id="combat-popup">
      <div class="cp-title">⚔️ ENCUENTRO DE COMBATE</div>
      <div class="cp-enemy">
        <div class="cp-enemy-sprite" id="cp-sprite">🧟</div>
        <div>
          <div class="cp-enemy-name" id="cp-name">Troll Sombrío</div>
          <div class="cp-enemy-hp" id="cp-hp-txt">520 / 520 HP</div>
          <div class="cp-hp-track"><div class="cp-hp-fill" id="cp-hp-bar" style="width:100%"></div></div>
        </div>
      </div>
      <div class="cp-actions">
        <div class="cp-action" onclick="combatAction('attack')"><div class="cp-a-icon">⚔️</div><div class="cp-a-name">Golpe</div><div class="cp-a-cost">0 MP</div></div>
        <div class="cp-action" onclick="combatAction('magic')"><div class="cp-a-icon">🔥</div><div class="cp-a-name">Magia</div><div class="cp-a-cost">40 MP</div></div>
        <div class="cp-action" onclick="combatAction('heal')"><div class="cp-a-icon">💚</div><div class="cp-a-name">Sanar</div><div class="cp-a-cost">30 MP</div></div>
        <div class="cp-action" onclick="combatAction('flee')"><div class="cp-a-icon">💨</div><div class="cp-a-name">Huir</div><div class="cp-a-cost">0 MP</div></div>
      </div>
      <div class="cp-log" id="cp-log"></div>
      <button class="cp-close" id="cp-close" onclick="closeCombat()" style="display:none">✓ Continuar</button>
    </div>

  </div><!-- /hud -->
</div>

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
`

// El mapa es la página más larga: se parte en dos módulos para que
// ningún archivo del proyecto pase del límite que vigila test-build.
