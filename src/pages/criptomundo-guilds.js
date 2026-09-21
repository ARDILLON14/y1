PAGES['criptomundo-guilds.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Guilds & Guerras</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --void:#060809;--deep:#090C12;--panel:#0F1219;--card:#161A24;--hover:#1E2230;
  --gold:#C8A84B;--gold2:#F0D070;--gold3:#7A6530;
  --guild:#E63E2A;  /* guild war red — signature */
  --guild2:#6A1208;
  --ally:#2A7FD4;
  --green:#10B981;--warn:#F59E0B;
  --border:#1A1D28;--brim:#2E2810;--txt:#E8E0CC;--dim:#7A7060;
  --r-common:#9D9D9D;--r-uncommon:#1EFF00;--r-rare:#4090F0;--r-epic:#A335EE;--r-legendary:#FF8000;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--void);color:var(--txt);font-family:'Crimson Pro',Georgia,serif;height:100vh;overflow:hidden;
  background-image:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(230,62,42,.07) 0%,transparent 55%);}

header{display:flex;align-items:center;justify-content:space-between;padding:10px 24px;height:52px;
  background:linear-gradient(180deg,rgba(230,62,42,.1) 0%,transparent 100%);
  border-bottom:1px solid rgba(230,62,42,.2);position:sticky;top:0;z-index:50;backdrop-filter:blur(8px);}
.logo{font-family:'Cinzel',serif;font-weight:900;font-size:19px;color:var(--gold);letter-spacing:3px;}
.logo em{color:var(--guild);font-style:normal;}
.logo small{display:block;color:var(--dim);font-size:10px;font-weight:400;letter-spacing:2px;margin-top:-2px;}
.hdr-right{display:flex;gap:8px;align-items:center;}
.badge{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;}
.badge b{color:var(--gold);}
.badge.red b{color:var(--guild);}
.badge span{color:var(--dim);font-size:9px;}

/* ── MODE TABS ── */
.mode-bar{display:flex;border-bottom:1px solid var(--border);background:var(--deep);flex-shrink:0;}
.mode-tab{flex:1;padding:12px;font-family:'Cinzel',serif;font-size:11px;font-weight:600;letter-spacing:2px;
  text-transform:uppercase;cursor:pointer;background:none;border:none;color:var(--dim);
  border-bottom:3px solid transparent;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px;}
.mode-tab:hover{color:var(--txt);background:var(--hover);}
.mode-tab.active{color:var(--guild);border-bottom-color:var(--guild);}
.mode-tab.active.ally{color:var(--ally);border-bottom-color:var(--ally);}
.mode-tab.active.rank{color:var(--gold);border-bottom-color:var(--gold);}

/* ── LAYOUT ── */
.layout{display:grid;grid-template-columns:280px 1fr 280px;height:calc(100vh - 100px);overflow:hidden;}
.sidebar{background:var(--panel);display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border);}
.sidebar.right{border-right:none;border-left:1px solid var(--border);}
.sec-title{font-family:'Cinzel',serif;font-size:10px;font-weight:600;color:var(--dim);letter-spacing:3px;text-transform:uppercase;
  padding:12px 16px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;}
.sec-title::before{content:'';width:3px;height:11px;background:var(--gold);border-radius:2px;}

/* ── GUILD CARD ── */
.guild-scroll{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:5px;}
.guild-card{background:var(--card);border:1px solid var(--border);border-radius:9px;overflow:hidden;
  cursor:pointer;transition:all .15s;position:relative;}
.guild-card:hover{border-color:rgba(230,62,42,.3);transform:translateY(-1px);}
.guild-card.selected{border-color:var(--guild);box-shadow:0 0 0 1px rgba(230,62,42,.2);}
.guild-card.my-guild{border-color:var(--gold3);}
.gc-banner{height:5px;}
.gc-body{padding:10px 12px;}
.gc-top{display:flex;align-items:center;gap:10px;}
.gc-emblem{font-size:28px;flex-shrink:0;}
.gc-meta{flex:1;min-width:0;}
.gc-name{font-family:'Cinzel',serif;font-size:13px;font-weight:600;color:var(--txt);}
.gc-tag{font-size:10px;color:var(--dim);font-family:'JetBrains Mono',monospace;}
.gc-level{font-size:9px;letter-spacing:1px;padding:2px 6px;border-radius:3px;font-family:'Cinzel',serif;flex-shrink:0;}
.gc-stats{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;}
.gs-chip{font-size:10px;color:var(--dim);display:flex;align-items:center;gap:3px;}
.gs-chip b{font-family:'JetBrains Mono',monospace;color:var(--txt);}
.gc-desc{font-size:11px;color:var(--dim);margin-top:5px;font-style:italic;line-height:1.4;}

/* ── GUILD HQ (CENTER) ── */
.guild-hq{display:flex;flex-direction:column;overflow:hidden;background:var(--deep);}

/* Guild banner */
.guild-banner{flex:0 0 auto;padding:18px 20px;border-bottom:1px solid var(--border);
  background:linear-gradient(135deg,rgba(230,62,42,.06) 0%,transparent 60%);
  display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;}
.guild-banner::before{content:'';position:absolute;right:-20px;top:-20px;width:120px;height:120px;
  border-radius:50%;background:radial-gradient(circle,rgba(230,62,42,.12) 0%,transparent 70%);pointer-events:none;}
.gb-emblem{font-size:52px;filter:drop-shadow(0 0 20px rgba(230,62,42,.3));}
.gb-info{flex:1;}
.gb-name{font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:var(--guild);letter-spacing:2px;}
.gb-tag{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--dim);margin-top:2px;}
.gb-desc{font-size:13px;color:var(--txt);margin-top:6px;font-style:italic;}
.gb-stats{display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;}
.gbs-item{display:flex;flex-direction:column;gap:1px;}
.gbs-val{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;color:var(--gold);}
.gbs-val.red{color:var(--guild);}
.gbs-val.blue{color:var(--ally);}
.gbs-lbl{font-size:9px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;}

/* Inner tabs */
.inner-tabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;}
.itab{flex:1;padding:9px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:1px;
  text-transform:uppercase;cursor:pointer;background:none;border:none;color:var(--dim);
  border-bottom:2px solid transparent;transition:all .12s;text-align:center;}
.itab:hover{color:var(--txt);background:var(--hover);}
.itab.active{color:var(--guild);border-bottom-color:var(--guild);}

.tab-content{flex:1;overflow-y:auto;padding:14px;}

/* Members table */
.members-table{width:100%;border-collapse:collapse;}
.members-table th{font-family:'Cinzel',serif;font-size:9px;color:var(--dim);letter-spacing:2px;
  text-transform:uppercase;padding:6px 8px;border-bottom:1px solid var(--border);text-align:left;}
.members-table td{padding:8px;border-bottom:1px solid var(--border);font-size:12px;color:var(--dim);}
.members-table tr:last-child td{border:none;}
.members-table tr:hover td{background:var(--hover);}
.member-avatar{font-size:18px;}
.member-name{font-family:'Cinzel',serif;font-size:12px;color:var(--txt);}
.member-rank-badge{font-size:9px;letter-spacing:1px;padding:1px 6px;border-radius:3px;font-family:'Cinzel',serif;}
.online-dot{width:6px;height:6px;border-radius:50%;display:inline-block;}

/* War timeline */
.war-entry{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;
  margin-bottom:8px;display:flex;gap:12px;align-items:center;}
.we-vs{display:flex;align-items:center;gap:8px;flex:1;}
.we-guild{text-align:center;min-width:80px;}
.we-guild-name{font-family:'Cinzel',serif;font-size:11px;color:var(--txt);}
.we-guild-emblem{font-size:24px;}
.we-vs-sep{font-family:'Cinzel',serif;font-size:14px;font-weight:900;color:var(--gold);letter-spacing:2px;}
.we-score{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;}
.we-result{font-size:9px;letter-spacing:1px;padding:2px 8px;border-radius:3px;font-family:'Cinzel',serif;flex-shrink:0;}
.we-result.win{background:rgba(16,185,129,.15);color:var(--green);border:1px solid rgba(16,185,129,.3);}
.we-result.loss{background:rgba(230,62,42,.15);color:var(--guild);border:1px solid rgba(230,62,42,.3);}
.we-result.draw{background:rgba(245,158,11,.15);color:var(--warn);border:1px solid rgba(245,158,11,.3);}
.we-result.active{background:rgba(163,53,238,.15);color:#A335EE;border:1px solid rgba(163,53,238,.3);}

/* War declaration */
.declare-war{background:var(--card);border:1px solid rgba(230,62,42,.2);border-radius:9px;padding:14px;margin-bottom:10px;}
.dw-title{font-family:'Cinzel',serif;font-size:11px;font-weight:600;color:var(--guild);letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.dw-targets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.dw-target{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:5px 10px;
  font-family:'Cinzel',serif;font-size:10px;color:var(--dim);cursor:pointer;transition:all .12s;}
.dw-target:hover{border-color:rgba(230,62,42,.4);color:var(--guild);}
.dw-target.selected{border-color:var(--guild);color:var(--guild);background:rgba(230,62,42,.08);}
.war-btn{width:100%;padding:10px;font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:2px;
  background:linear-gradient(135deg,var(--guild2),var(--guild));border:none;border-radius:7px;
  color:#fff;cursor:pointer;transition:all .2s;}
.war-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(230,62,42,.35);}
.war-btn:disabled{opacity:.35;cursor:not-allowed;}

/* Treasury */
.treasury-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
.treas-item{background:var(--panel);border:1px solid var(--border);border-radius:7px;padding:10px 12px;}
.ti-lbl{font-size:9px;color:var(--dim);letter-spacing:2px;text-transform:uppercase;font-family:'Cinzel',serif;}
.ti-val{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:600;margin-top:2px;}
.ti-val.gold{color:var(--gold);}
.ti-val.blue{color:#60C8FF;}
.donate-row{display:flex;gap:6px;margin-top:8px;}
.donate-input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:5px;
  padding:6px 10px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt);outline:none;
  transition:border-color .12s;}
.donate-input:focus{border-color:var(--gold3);}
.donate-btn{background:rgba(200,168,75,.15);border:1px solid var(--gold3);border-radius:5px;
  padding:6px 14px;font-family:'Cinzel',serif;font-size:10px;color:var(--gold);cursor:pointer;
  letter-spacing:1px;transition:all .12s;}
.donate-btn:hover{background:rgba(200,168,75,.25);}

/* Ranking */
.rank-row{display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid var(--border);
  cursor:pointer;transition:background .12s;}
.rank-row:last-child{border:none;}
.rank-row:hover{background:var(--hover);}
.rank-row.my{background:rgba(200,168,75,.04);border-color:var(--brim);}
.rr-num{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;width:26px;text-align:center;}
.rr-num.r1{color:#FFD700;}.rr-num.r2{color:#C0C0C0;}.rr-num.r3{color:#CD7F32;}
.rr-emblem{font-size:22px;}
.rr-info{flex:1;}
.rr-name{font-family:'Cinzel',serif;font-size:12px;color:var(--txt);}
.rr-tag{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);}
.rr-score{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--gold);}
.rr-wins{font-size:10px;color:var(--green);}

/* Right panel */
.right-scroll{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;}
.info-block{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:13px;}
.ib-title{font-family:'Cinzel',serif;font-size:9px;color:var(--dim);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:5px;}
.ib-title::after{content:'';flex:1;height:1px;background:var(--border);}

/* Create guild form */
.create-form{display:flex;flex-direction:column;gap:8px;}
.cf-label{font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;font-family:'Cinzel',serif;}
.cf-input{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:8px 12px;
  font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--txt);outline:none;width:100%;
  transition:border-color .12s;}
.cf-input:focus{border-color:var(--guild);}
.emoji-picker{display:flex;gap:5px;flex-wrap:wrap;}
.emoji-opt{font-size:20px;cursor:pointer;padding:4px;border-radius:5px;border:1px solid transparent;transition:all .12s;}
.emoji-opt:hover,.emoji-opt.selected{border-color:var(--gold3);background:var(--hover);}
.create-btn{width:100%;padding:10px;font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:2px;
  background:linear-gradient(135deg,var(--guild2),var(--guild));border:none;border-radius:7px;color:#fff;cursor:pointer;transition:all .2s;}
.create-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(230,62,42,.35);}

/* perks */
.perk-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;}
.perk-row:last-child{border:none;}
.pr-icon{font-size:18px;flex-shrink:0;}
.pr-info{flex:1;color:var(--dim);}
.pr-info strong{color:var(--txt);}
.pr-level{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--gold);}

.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);
  background:var(--panel);border:1px solid var(--guild);border-radius:8px;padding:9px 20px;
  font-family:'Cinzel',serif;font-size:12px;color:var(--guild);opacity:0;pointer-events:none;
  transition:all .3s cubic-bezier(.4,0,.2,1);z-index:200;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.toast.green{border-color:var(--green);color:var(--green);}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}



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

<header>
  <div class="logo">CRIPTO<em>MUNDO</em><small>GUILDS & GUERRAS</small></div>
  <div class="hdr-right">
    <div class="badge red"><span>⚔️</span><b id="war-badge">1 activa</b><span>GUERRA</span></div>
    <div class="badge"><span>🛡️</span><b id="my-guild-badge">Guardianes del Vacío</b><span>MI GUILD</span></div>
    <div class="badge"><span>🏆</span><b id="guild-rank-badge">#4</b><span>RANKING</span></div>
    <div class="badge"><span>🪙</span><b id="gold-badge">1,240</b><span>ORO</span></div>
  </div>
</header>

<div class="mode-bar">
  <button class="mode-tab active" onclick="setMode('guild',this)">🛡️ Mi Guild</button>
  <button class="mode-tab ally"   onclick="setMode('guilds',this)">📋 Directorio</button>
  <button class="mode-tab"        onclick="setMode('war',this)">⚔️ Guerras</button>
  <button class="mode-tab rank"   onclick="setMode('ranking',this)">🏆 Ranking</button>
</div>

<div class="layout">

  <!-- LEFT -->
  <aside class="sidebar" id="left-panel"></aside>

  <!-- CENTER -->
  <main class="guild-hq" id="center-panel"></main>

  <!-- RIGHT -->
  <aside class="sidebar right" id="right-panel"></aside>

</div>

<div class="toast" id="toast"></div>

<script>
// ═══════════════════════════════════════════════════════════
//  GREMIOS v3.1 — cliente fino
//  Membresía, permisos, coste y tesorería los valida el servidor.
// ═══════════════════════════════════════════════════════════
var GU = { char: null, guilds: [], myGuild: null, mode: 'guild', selected: null, innerTab: 'members', emblem: '🛡️', busy: false };

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
function n(x) { return (x || 0).toLocaleString('es'); }

async function api(path, opts) {
  var res = await fetch(path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts || {}));
  var d = {};
  try { d = await res.json(); } catch (e) {}
  return { ok: res.ok, data: d };
}

async function init() {
  var me = await api('/api/player');
  if (!me.ok) { $('center-panel').innerHTML = panelMsg('Inicia sesión para ver los gremios'); return; }
  GU.char = me.data.character;
  await refresh();
}

async function refresh() {
  var g = await api('/api/guilds');
  GU.guilds = g.data.guilds || [];
  GU.myGuild = GU.guilds.filter(function (x) { return x.id === GU.char.guildId; })[0] || null;
  renderHeader();
  render();
}

function renderHeader() {
  $('war-badge').textContent = 'no disponible';
  $('my-guild-badge').textContent = GU.myGuild ? GU.myGuild.name : 'Sin gremio';
  var rank = GU.myGuild ? (GU.guilds.slice().sort(function (a, b) { return b.power - a.power; })
    .findIndex(function (x) { return x.id === GU.myGuild.id; }) + 1) : 0;
  $('guild-rank-badge').textContent = rank ? '#' + rank : '—';
  $('gold-badge').textContent = n(GU.char.gold);
}

function panelMsg(msg) {
  return '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--txt-dim);font-size:13px;padding:40px;text-align:center">' + esc(msg) + '</div>';
}

function setMode(m, btn) {
  GU.mode = m;
  document.querySelectorAll('.mode-tab').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  render();
}

function render() {
  if (GU.mode === 'guild') return renderMyGuild();
  if (GU.mode === 'guilds') return renderDirectory();
  if (GU.mode === 'war') return renderWars();
  return renderRanking();
}

// ── DIRECTORIO ─────────────────────────────────────────────
function renderDirectory() {
  $('left-panel').innerHTML =
    '<div style="padding:12px"><div style="font-family:\\'Cinzel\\',serif;font-size:10px;letter-spacing:2px;color:var(--txt-dim);text-transform:uppercase;margin-bottom:10px">Gremios (' + GU.guilds.length + ')</div>' +
    GU.guilds.map(function (g) {
      return '<div class="guild-card' + (GU.myGuild && g.id === GU.myGuild.id ? ' my-guild' : '') + (GU.selected && GU.selected.id === g.id ? ' selected' : '') + '" onclick="selectGuild(\\'' + g.id + '\\')">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="font-size:26px">' + g.emblem + '</div>' +
          '<div style="flex:1"><div style="font-family:\\'Cinzel\\',serif;font-size:13px;color:var(--gold)">' + esc(g.name) + ' <span style="color:var(--txt-dim);font-size:11px">' + esc(g.tag || '') + '</span></div>' +
          '<div style="font-size:11px;color:var(--txt-dim)">Nv.' + g.level + ' · ' + g.members + '/' + g.maxMembers + ' miembros · Poder ' + n(g.power) + '</div></div>' +
        '</div></div>';
    }).join('') + '</div>';

  $('center-panel').innerHTML = GU.selected ? guildDetail(GU.selected) : panelMsg('Selecciona un gremio del directorio');
  $('right-panel').innerHTML = createFormOrInfo();
}

function selectGuild(id) {
  GU.selected = GU.guilds.filter(function (g) { return g.id === id; })[0] || null;
  renderDirectory();
}

function guildDetail(g) {
  var mine = GU.myGuild && GU.myGuild.id === g.id;
  var full = g.members >= g.maxMembers;
  return '<div style="padding:20px">' +
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">' +
      '<div style="font-size:44px">' + g.emblem + '</div>' +
      '<div><div style="font-family:\\'Cinzel\\',serif;font-size:20px;color:var(--gold)">' + esc(g.name) + '</div>' +
      '<div style="font-size:12px;color:var(--txt-dim)">' + esc(g.tag || '') + ' · Líder: ' + esc(g.leader) + ' · Fundado ' + esc(g.founded) + '</div></div>' +
    '</div>' +
    (g.desc ? '<div style="font-size:13px;color:var(--txt-dim);margin-bottom:14px">' + esc(g.desc) + '</div>' : '') +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">' +
      statBox('Nivel', g.level) + statBox('Miembros', g.members + '/' + g.maxMembers) +
      statBox('Poder', n(g.power)) + statBox('Tesoro', '🪙' + n(g.treasury.gold)) +
    '</div>' +
    (mine
      ? '<div style="font-size:13px;color:var(--gold)">Ya perteneces a este gremio.</div>'
      : GU.char.guildId
        ? '<div style="font-size:13px;color:var(--txt-dim)">Sal de tu gremio actual para poder unirte a otro.</div>'
        : full
          ? '<div style="font-size:13px;color:var(--red)">Gremio lleno.</div>'
          : '<button class="war-btn" onclick="joinGuild(\\'' + g.id + '\\')">⚔️ UNIRSE AL GREMIO</button>') +
  '</div>';
}

function statBox(label, val) {
  return '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px">' +
    '<div style="font-size:10px;color:var(--txt-dim);letter-spacing:1px;text-transform:uppercase">' + label + '</div>' +
    '<div style="font-family:monospace;font-size:18px;color:var(--gold)">' + val + '</div></div>';
}

// ── MI GREMIO ──────────────────────────────────────────────
function renderMyGuild() {
  if (!GU.myGuild) {
    $('left-panel').innerHTML = '<div style="padding:14px;font-size:12px;color:var(--txt-dim)">No perteneces a ningún gremio. Únete desde el directorio o crea el tuyo.</div>';
    $('center-panel').innerHTML = panelMsg('Sin gremio');
    $('right-panel').innerHTML = createFormOrInfo();
    return;
  }
  var g = GU.myGuild;
  $('left-panel').innerHTML = '<div style="padding:14px">' +
    '<div style="text-align:center;font-size:44px">' + g.emblem + '</div>' +
    '<div style="text-align:center;font-family:\\'Cinzel\\',serif;font-size:16px;color:var(--gold);margin:6px 0">' + esc(g.name) + '</div>' +
    '<div style="text-align:center;font-size:11px;color:var(--txt-dim);margin-bottom:14px">' + esc(g.tag || '') + ' · Nivel ' + g.level + '</div>' +
    statBox('Miembros', g.members + '/' + g.maxMembers) + '<div style="height:8px"></div>' +
    statBox('Tesoro', '🪙' + n(g.treasury.gold)) + '<div style="height:8px"></div>' +
    statBox('Poder', n(g.power)) +
    '<button class="war-btn" style="margin-top:14px;background:rgba(139,26,26,.4)" onclick="leaveGuild()">Salir del gremio</button>' +
  '</div>';

  $('center-panel').innerHTML =
    '<div class="inner-tabs" style="display:flex;gap:6px;padding:12px;border-bottom:1px solid var(--border)">' +
      '<button class="itab' + (GU.innerTab === 'members' ? ' active' : '') + '" onclick="setInnerTab(\\'members\\')">👥 Miembros</button>' +
      '<button class="itab' + (GU.innerTab === 'treasury' ? ' active' : '') + '" onclick="setInnerTab(\\'treasury\\')">💰 Tesoro</button>' +
    '</div><div class="tab-content" id="inner-content"></div>';
  renderInnerTab();
  $('right-panel').innerHTML = guildRules();
}

function setInnerTab(t) { GU.innerTab = t; renderMyGuild(); }

function renderInnerTab() {
  var g = GU.myGuild;
  var el = $('inner-content');
  if (!el) return;
  if (GU.innerTab === 'members') {
    el.innerHTML = '<div style="padding:14px">' +
      '<div style="font-size:12px;color:var(--txt-dim);margin-bottom:10px">' + g.members + ' de ' + g.maxMembers + ' plazas ocupadas. El servidor valida capacidad y permisos en cada operación.</div>' +
      '<div style="font-size:12px;color:var(--txt-dim)">La lista detallada de miembros y la expulsión requieren rango de oficial o superior.</div>' +
    '</div>';
    return;
  }
  el.innerHTML = '<div style="padding:14px">' +
    statBox('Oro en el tesoro', n(g.treasury.gold)) +
    '<div style="margin-top:14px;display:flex;gap:8px">' +
      '<input class="donate-input" type="number" placeholder="Cantidad de oro" id="donate-input" min="1" style="flex:1">' +
      '<button class="donate-btn" onclick="donate()">🪙 Donar</button>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--txt-dim);margin-top:10px">Cada 100 de oro donado da 1 punto de experiencia al gremio. Al subir de nivel aumenta el límite de miembros.</div>' +
  '</div>';
}

// ── GUERRAS / RANKING ──────────────────────────────────────
function renderWars() {
  $('left-panel').innerHTML = '';
  $('right-panel').innerHTML = '';
  $('center-panel').innerHTML =
    '<div style="padding:28px;max-width:560px;margin:0 auto;text-align:center">' +
      '<div style="font-size:48px;opacity:.25">⚔️</div>' +
      '<div style="font-family:\\'Cinzel\\',serif;font-size:18px;color:var(--gold);margin:12px 0">Guerras de gremio: todavía no implementadas</div>' +
      '<div style="font-size:13px;color:var(--txt-dim);line-height:1.7">Antes había una pantalla de guerras con datos inventados. Se ha retirado: el servidor no tiene sistema de guerras, y mostrar batallas falsas no ayuda a nadie.<br><br>Está en el plan, después de validar que el bucle base engancha.</div>' +
    '</div>';
}

function renderRanking() {
  $('left-panel').innerHTML = '';
  $('right-panel').innerHTML = '';
  var sorted = GU.guilds.slice().sort(function (a, b) { return b.power - a.power; });
  $('center-panel').innerHTML = '<div style="padding:18px">' +
    '<div style="font-family:\\'Cinzel\\',serif;font-size:16px;color:var(--gold);margin-bottom:14px">Clasificación de gremios</div>' +
    sorted.map(function (g, i) {
      return '<div class="guild-card" style="cursor:default"><div style="display:flex;align-items:center;gap:12px">' +
        '<div style="font-family:monospace;font-size:18px;color:var(--gold);width:32px">' + (i === 0 ? '👑' : '#' + (i + 1)) + '</div>' +
        '<div style="font-size:24px">' + g.emblem + '</div>' +
        '<div style="flex:1"><div style="font-family:\\'Cinzel\\',serif;font-size:13px;color:var(--gold)">' + esc(g.name) + '</div>' +
        '<div style="font-size:11px;color:var(--txt-dim)">Nv.' + g.level + ' · ' + g.members + ' miembros</div></div>' +
        '<div style="font-family:monospace;font-size:14px;color:var(--gold)">' + n(g.power) + '</div>' +
      '</div></div>';
    }).join('') +
    '<div style="font-size:11px;color:var(--txt-dim);margin-top:12px">El poder se calcula a partir del nivel y el número de miembros del gremio.</div>' +
  '</div>';
}

// ── CREAR / UNIRSE / SALIR / DONAR ─────────────────────────
function createFormOrInfo() {
  if (GU.char.guildId) return '<div style="padding:14px;font-size:12px;color:var(--txt-dim)">Ya perteneces a un gremio. Sal de él para crear uno nuevo.</div>';
  var emojis = ['🛡️', '⚔️', '💀', '🐉', '🔥', '🌀', '🔮', '👑'];
  return '<div style="padding:14px">' +
    '<div style="font-family:\\'Cinzel\\',serif;font-size:11px;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:12px">Crear gremio</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
      emojis.map(function (e) { return '<span class="emoji-opt' + (GU.emblem === e ? ' selected' : '') + '" onclick="selectEmoji(\\'' + e + '\\')" style="font-size:22px;cursor:pointer;padding:4px;border-radius:6px;border:1px solid ' + (GU.emblem === e ? 'var(--gold)' : 'transparent') + '">' + e + '</span>'; }).join('') +
    '</div>' +
    '<input class="cf-input" type="text" placeholder="Nombre del gremio" id="guild-name-input" maxlength="32">' +
    '<input class="cf-input" type="text" placeholder="Descripción (opcional)" id="guild-desc-input" maxlength="80" style="margin-top:8px">' +
    '<button class="create-btn" onclick="createGuild()" style="margin-top:10px">⚔️ CREAR POR 🪙5.000</button>' +
    '<div style="font-size:11px;color:var(--txt-dim);margin-top:10px">El coste lo cobra el servidor y se destruye como sumidero de oro. La etiqueta se genera a partir del nombre.</div>' +
  '</div>';
}

function selectEmoji(e) { GU.emblem = e; render(); }

async function createGuild() {
  if (GU.busy) return;
  var name = ($('guild-name-input') || {}).value || '';
  var desc = ($('guild-desc-input') || {}).value || '';
  GU.busy = true;
  var r = await api('/api/guilds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'guild-create-' + Date.now() },
    body: JSON.stringify({ action: 'create', name: name, emblem: GU.emblem, description: desc }),
  });
  GU.busy = false;
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo crear'), 'red'); return; }
  showToast('✓ Gremio creado', 'green');
  await reloadChar();
  setMode('guild', document.querySelector('.mode-tab'));
}

async function joinGuild(id) {
  if (GU.busy) return;
  GU.busy = true;
  var r = await api('/api/guilds', { method: 'POST', body: JSON.stringify({ action: 'join', guildId: id }) });
  GU.busy = false;
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo unir'), 'red'); return; }
  showToast('✓ Te uniste al gremio', 'green');
  await reloadChar();
}

async function leaveGuild() {
  if (!confirm('¿Salir del gremio?')) return;
  var r = await api('/api/guilds', { method: 'POST', body: JSON.stringify({ action: 'leave' }) });
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo salir'), 'red'); return; }
  showToast('Has salido del gremio');
  await reloadChar();
}

async function donate() {
  var amt = parseInt(($('donate-input') || {}).value, 10);
  if (!amt || amt < 1) { showToast('Cantidad inválida', 'red'); return; }
  var r = await api('/api/guilds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'donate-' + Date.now() },
    body: JSON.stringify({ action: 'donate', amount: amt }),
  });
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo donar'), 'red'); return; }
  showToast('✓ Donaste 🪙' + n(amt), 'green');
  await reloadChar();
}

function guildRules() {
  return '<div style="padding:14px;font-size:12px;color:var(--txt-dim);line-height:1.8">' +
    '<div style="font-family:\\'Cinzel\\',serif;font-size:11px;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:10px">Reglas</div>' +
    '· Crear un gremio cuesta 🪙5.000, que se destruyen.<br>' +
    '· Solo puedes pertenecer a un gremio a la vez.<br>' +
    '· Rangos: líder, oficial y miembro. El servidor comprueba los permisos.<br>' +
    '· El líder no puede salir sin transferir el liderazgo.<br>' +
    '· Cada 100 de oro donado da 1 punto de experiencia al gremio.<br>' +
    '· Las guerras de gremio todavía no existen.' +
  '</div>';
}

async function reloadChar() {
  var me = await api('/api/player');
  if (me.ok) GU.char = me.data.character;
  await refresh();
  sendToParent('REFRESH_CHARACTER', {});
}

function showToast(msg, type) {
  var t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(function () { t.classList.remove('show'); }, 2800);
}
function sendToParent(type, payload) {
  try { window.parent.postMessage({ type: type, payload: payload }, '*'); } catch (e) {}
}
window.addEventListener('message', function (event) {
  var d = event.data || {};
  if (d.type === 'CHARACTER_DATA' && d.data && d.data.character) { GU.char = d.data.character; renderHeader(); }
});

init();

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
</html>
`
