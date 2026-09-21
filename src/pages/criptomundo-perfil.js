PAGES['criptomundo-perfil.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Perfil</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {
  --void:        #05070A;
  --deep:        #080C12;
  --panel:       #0D1420;
  --card:        #111928;
  --hover:       #151f30;
  --border:      #1E2D45;
  --border-gold: #3A2C10;
  --gold:        #C8A84B;
  --gold-dim:    #7A6530;
  --gold-bright: #F0D070;
  --txt:         #C8D4E8;
  --txt-dim:     #6A7A95;
  --green:       #30C060;
  --red:         #E04040;
  --blue:        #4090F0;
  --purple:      #A335EE;
  --orange:      #FF8000;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--void);
  color: var(--txt);
  font-family: 'Crimson Pro', serif;
  font-size: 15px;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── HEADER ── */
.top-bar {
  background: var(--panel);
  border-bottom: 1px solid var(--border-gold);
  padding: 0 24px;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.logo { font-family: 'Cinzel', serif; font-weight: 900; font-size: 18px; color: var(--gold); letter-spacing: 3px; }
.logo span { color: var(--txt-dim); font-size: 12px; font-family: 'Crimson Pro', serif; margin-left: 8px; letter-spacing: 1px; }
.badges { display: flex; gap: 10px; margin-left: auto; }
.badge {
  display: flex; align-items: center; gap: 5px;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 6px; padding: 4px 10px;
  font-size: 13px; color: var(--txt-dim);
}
.badge b { color: var(--gold); font-weight: 600; }

/* ── LAYOUT ── */
.layout {
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  gap: 16px;
  padding: 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
}
@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; }
}

/* ── SECTION HEADER ── */
.sec-head {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 600;
  color: var(--txt-dim); letter-spacing: 2px; text-transform: uppercase;
  margin-bottom: 12px;
}
.sec-head::before { content: ''; width: 3px; height: 11px; background: var(--gold); border-radius: 2px; flex-shrink: 0; }

/* ── AVATAR CARD ── */
.avatar-card {
  background: var(--panel);
  border: 1px solid var(--border-gold);
  border-radius: 12px;
  padding: 28px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.avatar-card::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%);
  pointer-events: none;
}
.avatar-emoji {
  font-size: 72px;
  display: block;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 20px rgba(200,168,75,0.3));
}
.char-name {
  font-family: 'Cinzel', serif;
  font-size: 22px; font-weight: 900;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(200,168,75,0.4);
  margin-bottom: 4px;
}
.char-class {
  font-size: 13px; color: var(--txt-dim); letter-spacing: 1px;
  margin-bottom: 20px;
}
.level-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--gold-dim), var(--gold));
  color: var(--void);
  font-family: 'Cinzel', serif; font-weight: 900; font-size: 13px;
  padding: 3px 14px; border-radius: 20px;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

/* ── BARS ── */
.bars { display: flex; flex-direction: column; gap: 10px; text-align: left; }
.bar-row { display: flex; flex-direction: column; gap: 4px; }
.bar-label {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--txt-dim);
}
.bar-label span:last-child { color: var(--txt); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.bar-track {
  height: 8px; background: var(--border);
  border-radius: 4px; overflow: hidden;
}
.bar-fill {
  height: 100%; border-radius: 4px;
  transition: width 0.6s ease;
}
.bar-fill.hp  { background: linear-gradient(90deg, #C02020, #E04040); }
.bar-fill.mp  { background: linear-gradient(90deg, #2040C0, #4090F0); }
.bar-fill.xp  { background: linear-gradient(90deg, var(--gold-dim), var(--gold)); }

/* ── PANEL ── */
.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 14px;
}
.panel:last-child { margin-bottom: 0; }

/* ── STATS GRID ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.stat-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
}
.stat-box .val {
  font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900;
  color: var(--gold); display: block; margin-bottom: 4px;
}
.stat-box .lbl { font-size: 11px; color: var(--txt-dim); letter-spacing: 0.5px; }

/* ── COMBAT STATS ── */
.combat-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.cs-row {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 6px; padding: 8px 12px;
  font-size: 13px;
}
.cs-row .cs-label { color: var(--txt-dim); }
.cs-row .cs-val { color: var(--txt); font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }

/* ── INVENTORY ── */
.inv-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}
.inv-slot {
  aspect-ratio: 1;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.inv-slot:hover { background: var(--hover); }
.inv-slot.empty { opacity: 0.3; }
.inv-slot .i-icon { font-size: 22px; line-height: 1; }
.inv-slot .i-qty {
  position: absolute; bottom: 2px; right: 4px;
  font-size: 10px; color: var(--txt-dim);
  font-family: 'JetBrains Mono', monospace; font-weight: 600;
}
.inv-slot .rarity-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 2px; border-radius: 0 0 6px 6px;
}
/* rarity borders */
.inv-slot.r-common    { border-color: #2A3A2A; }
.inv-slot.r-uncommon  { border-color: #1EFF0044; }
.inv-slot.r-rare      { border-color: #4090F044; }
.inv-slot.r-epic      { border-color: #A335EE44; }
.inv-slot.r-legendary { border-color: #FF800044; }
.inv-slot.r-common    .rarity-bar { background: #9D9D9D; }
.inv-slot.r-uncommon  .rarity-bar { background: #1EFF00; }
.inv-slot.r-rare      .rarity-bar { background: #4090F0; }
.inv-slot.r-epic      .rarity-bar { background: #A335EE; }
.inv-slot.r-legendary .rarity-bar { background: #FF8000; }

/* ── QUESTS ── */
.quest-item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  display: flex; gap: 10px; align-items: flex-start;
}
.quest-item:last-child { margin-bottom: 0; }
.quest-icon { font-size: 20px; flex-shrink: 0; }
.quest-info { flex: 1; }
.quest-name { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
.quest-status {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; display: inline-block;
}
.quest-status.active     { background: rgba(200,168,75,0.15); color: var(--gold); }
.quest-status.completed  { background: rgba(48,192,96,0.15);  color: var(--green); }

/* ── HISTORY ── */
.hist-item {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 8px 0; border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.hist-item:last-child { border-bottom: none; padding-bottom: 0; }
.hist-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.hist-text { flex: 1; color: var(--txt); }
.hist-time { color: var(--txt-dim); font-size: 11px; white-space: nowrap; }

/* ── RIGHT COLUMN ── */
.right-col { display: flex; flex-direction: column; gap: 14px; }

/* ── PVP CARD ── */
.pvp-rating {
  text-align: center; padding: 16px 0;
}
.pvp-rating .rating-num {
  font-family: 'Cinzel', serif; font-size: 48px; font-weight: 900;
  color: var(--gold); line-height: 1;
}
.pvp-rating .rating-lbl { color: var(--txt-dim); font-size: 12px; letter-spacing: 1px; margin-top: 4px; }
.pvp-rank-badge {
  display: inline-block; margin-top: 10px;
  background: linear-gradient(135deg, #6A1F9A, #A335EE);
  color: #fff; border-radius: 20px;
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
  padding: 3px 14px; letter-spacing: 1px;
}

/* ── BLOCKCHAIN ── */
.blockchain-row {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px; margin-bottom: 8px;
}
.blockchain-row:last-child { margin-bottom: 0; }
.br-label { font-size: 13px; color: var(--txt-dim); }
.br-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--gold); }

/* ── LOADING ── */
.loading-state {
  text-align: center; padding: 60px 20px;
  color: var(--txt-dim); font-size: 13px; letter-spacing: 1px;
}
.loading-state .spin {
  font-size: 36px; display: block; margin-bottom: 14px;
  animation: spin 1.5s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TOOLTIP ── */
.tooltip {
  position: fixed; z-index: 1000;
  background: var(--panel); border: 1px solid var(--border-gold);
  border-radius: 8px; padding: 10px 14px;
  pointer-events: none; opacity: 0; transition: opacity 0.1s;
  min-width: 160px; max-width: 200px;
}
.tooltip.visible { opacity: 1; }
.tt-name { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: var(--gold); margin-bottom: 4px; }
.tt-rarity { font-size: 11px; margin-bottom: 6px; }
.tt-stats { font-size: 12px; color: var(--txt-dim); display: flex; flex-direction: column; gap: 2px; }
.tooltip.r-common    { border-color: #9D9D9D55; } .tooltip.r-common    .tt-rarity { color: #9D9D9D; }
.tooltip.r-uncommon  { border-color: #1EFF0055; } .tooltip.r-uncommon  .tt-rarity { color: #1EFF00; }
.tooltip.r-rare      { border-color: #4090F055; } .tooltip.r-rare      .tt-rarity { color: #4090F0; }
.tooltip.r-epic      { border-color: #A335EE55; } .tooltip.r-epic      .tt-rarity { color: #A335EE; }
.tooltip.r-legendary { border-color: #FF800055; } .tooltip.r-legendary .tt-rarity { color: #FF8000; }

/* ── TOAST ── */
.toast {
  position: fixed; bottom: 20px; right: 20px; z-index: 200;
  background: var(--panel); border: 1px solid var(--border-gold);
  border-radius: 8px; padding: 10px 16px;
  font-size: 13px; color: var(--txt);
  transform: translateY(20px); opacity: 0;
  transition: all 0.3s; pointer-events: none;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast.green { border-color: var(--green); color: var(--green); }
.toast.red   { border-color: var(--red); color: var(--red); }

/* ── REFRESH BTN ── */
.refresh-btn {
  background: var(--card); border: 1px solid var(--border-gold);
  color: var(--gold); font-family: 'Cinzel', serif; font-size: 10px;
  font-weight: 600; letter-spacing: 1px; padding: 4px 12px;
  border-radius: 6px; cursor: pointer; margin-left: auto;
  transition: background 0.15s;
}
.refresh-btn:hover { background: var(--hover); }

  .change-skin-btn {
    background: rgba(200,168,75,.12); border: 1px solid #3A3020; color: #C8A84B;
    border-radius: 8px; padding: 7px 14px; font-size: 12px; cursor: pointer;
    margin-bottom: 12px; transition: all .15s ease; font-family: inherit;
  }
  .change-skin-btn:hover { border-color: #C8A84B; background: rgba(200,168,75,.2); }

  .skin-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,.78); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    opacity: 0; pointer-events: none; transition: opacity .2s ease;
  }
  .skin-modal.show { opacity: 1; pointer-events: all; }
  .skin-modal-box {
    background: #12151D; border: 1px solid #2A2418; border-radius: 12px;
    width: 100%; max-width: 560px; max-height: 82vh; overflow-y: auto; padding: 18px;
  }
  .skin-modal-head {
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'Cinzel', serif; font-size: 15px; color: #F0D070; margin-bottom: 14px;
  }
  .skin-modal-close { background: none; border: 0; color: #7A7060; font-size: 18px; cursor: pointer; }
  .skin-modal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
  .sm-card {
    background: rgba(20,24,34,.8); border: 1px solid #2A2418; border-radius: 10px;
    padding: 10px 6px; text-align: center; cursor: pointer; transition: all .15s ease;
  }
  .sm-card:hover { border-color: #C8A84B; transform: translateY(-2px); }
  .sm-card.active { border-color: #F0D070; box-shadow: 0 0 12px rgba(240,208,112,.3); }
  .sm-card.locked { opacity: .4; cursor: not-allowed; }
  .sm-card .sm-art { height: 58px; display: flex; align-items: center; justify-content: center; font-size: 34px; }
  .sm-card .sm-art img { max-height: 58px; max-width: 100%; object-fit: contain; border-radius: 6px; }
  .sm-card .sm-name { font-size: 11px; color: #E8E0CC; margin-top: 6px; }
  .sm-card .sm-lock { font-size: 10px; color: #9A9080; }
  .skin-modal-note { font-size: 12px; color: #7A7060; margin-top: 14px; line-height: 1.6; }




  .eq-slots { display:grid; grid-template-columns:repeat(auto-fill,minmax(78px,1fr)); gap:6px; margin-bottom:12px; }
  .eq-slot { background:#0A0D13; border:1px solid #2A2418; border-radius:7px; padding:7px 4px; text-align:center; cursor:pointer; }
  .eq-slot.lleno { border-color:#C8A84B; }
  .eq-slot .s-nombre { font-size:9px; color:#7A7060; text-transform:uppercase; letter-spacing:1px; }
  .eq-slot .s-icono { font-size:20px; line-height:1.4; }
  .inv-filtros { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px; }
  .inv-f { background:#0A0D13; border:1px solid #2A2418; color:#9A9080; border-radius:6px; padding:5px 10px; font-size:11px; cursor:pointer; }
  .inv-f.activo { border-color:#C8A84B; color:#C8A84B; }
  .inv-rejilla { display:grid; grid-template-columns:repeat(auto-fill,minmax(52px,1fr)); gap:6px; max-height:230px; overflow-y:auto; }
  .inv-celda { position:relative; background:#0A0D13; border:1px solid #2A2418; border-radius:7px; padding:8px 2px; text-align:center; cursor:pointer; }
  .inv-celda:hover { border-color:#C8A84B; }
  .inv-celda.sel { border-color:#F0D070; box-shadow:0 0 10px rgba(240,208,112,.3); }
  .inv-celda .qty { position:absolute; right:3px; bottom:2px; font-size:9px; color:#9A9080; font-family:'JetBrains Mono',monospace; }
  .inv-celda .eq { position:absolute; left:3px; top:2px; font-size:9px; color:#30C060; }
  .inv-detalle { margin-top:10px; font-size:12px; color:#9A9080; line-height:1.6; border-top:1px solid #2A2418; padding-top:10px; }
  .inv-detalle .acciones { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
  .inv-detalle button { background:rgba(200,168,75,.14); border:1px solid #3A3020; color:#C8A84B; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; min-height:36px; }
  .inv-detalle button:hover { border-color:#C8A84B; }
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

<div class="top-bar">
  <div class="logo">CRIPTOMUNDO <span>PERFIL</span></div>
  <div class="badges">
    <div class="badge"><span>🪙</span><b id="hdr-gold">—</b><span>ORO</span></div>
    <div class="badge"><span>💎</span><b id="hdr-cgrid">—</b><span>CGRID</span></div>
  </div>
  <button class="refresh-btn" onclick="requestCharacter()">↻ SYNC</button>
</div>

<!-- Loading state -->
<div id="loading-view" class="loading-state" style="margin-top:60px">
  <span class="spin">⏳</span>
  Cargando perfil del jugador...
</div>

<!-- Main layout (hidden until data loaded) -->
<div id="main-layout" class="layout" style="display:none">

  <!-- LEFT: Avatar + bars -->
  <div>
    <div class="avatar-card">
      <span class="avatar-emoji" id="avatar-emoji">🧙</span>
      <button class="change-skin-btn" onclick="openSkinPicker()">🎨 Cambiar aspecto</button>
      <button class="change-skin-btn" onclick="abrirSubida()">🖼️ Subir mi personaje</button>
      <input type="file" id="archivo-personaje" accept="image/png,image/jpeg,image/webp" style="display:none" onchange="procesarArchivo(event)">
      <div class="char-name" id="char-name">—</div>
      <div class="char-class" id="char-class">—</div>
      <div class="level-badge" id="level-badge">Nv. —</div>
      <div class="bars">
        <div class="bar-row">
          <div class="bar-label">
            <span>❤️ Vida</span>
            <span id="hp-txt">—</span>
          </div>
          <div class="bar-track"><div class="bar-fill hp" id="hp-bar" style="width:0%"></div></div>
        </div>
        <div class="bar-row">
          <div class="bar-label">
            <span>🔷 Maná</span>
            <span id="mp-txt">—</span>
          </div>
          <div class="bar-track"><div class="bar-fill mp" id="mp-bar" style="width:0%"></div></div>
        </div>
        <div class="bar-row">
          <div class="bar-label">
            <span>✨ Experiencia</span>
            <span id="xp-txt">—</span>
          </div>
          <div class="bar-track"><div class="bar-fill xp" id="xp-bar" style="width:0%"></div></div>
        </div>
      </div>
    </div>

    <!-- PvP -->
    <div class="panel" style="margin-top:14px">
      <div class="sec-head">⚔️ CLASIFICACIÓN PVP</div>
      <div class="pvp-rating">
        <div class="rating-num" id="pvp-rating">—</div>
        <div class="rating-lbl">PUNTOS DE RATING</div>
        <div class="pvp-rank-badge" id="pvp-rank">—</div>
      </div>
    </div>

    <!-- Blockchain -->
    <div class="panel">
      <div class="sec-head">💎 BLOCKCHAIN</div>
      <div class="blockchain-row">
        <span class="br-label">$CGRID Balance</span>
        <span class="br-val" id="bc-cgrid">0 CGRID</span>
      </div>
      <div class="blockchain-row">
        <span class="br-label">NFT Items</span>
        <span class="br-val" id="bc-nft">0 ítems</span>
      </div>
      <div class="blockchain-row">
        <span class="br-label">Red</span>
        <span class="br-val" style="color:var(--green)">Polygon</span>
      </div>
    </div>
  </div>

  <!-- CENTER: Stats + Inventory + Quests -->
  <div>
    <!-- Achievement stats -->
    <div class="panel">
      <div class="sec-head">📊 ESTADÍSTICAS</div>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="val" id="stat-kills">0</span>
          <span class="lbl">Monstruos</span>
        </div>
        <div class="stat-box">
          <span class="val" id="stat-bosses">0</span>
          <span class="lbl">Bosses</span>
        </div>
        <div class="stat-box">
          <span class="val" id="stat-dungeons">0</span>
          <span class="lbl">Mazmorras</span>
        </div>
        <div class="stat-box">
          <span class="val" id="stat-gold">0</span>
          <span class="lbl">Oro total</span>
        </div>
        <div class="stat-box">
          <span class="val" id="stat-cgrid">0</span>
          <span class="lbl">$CGRID</span>
        </div>
        <div class="stat-box">
          <span class="val" id="stat-quests">0</span>
          <span class="lbl">Misiones</span>
        </div>
      </div>
    </div>

    <!-- Combat attributes -->
    <div class="panel">
      <div class="sec-head">⚔️ ATRIBUTOS DE COMBATE</div>
      <div class="combat-stats">
        <div class="cs-row"><span class="cs-label">💪 Fuerza</span>     <span class="cs-val" id="attr-str">—</span></div>
        <div class="cs-row"><span class="cs-label">🧠 Inteligencia</span><span class="cs-val" id="attr-int">—</span></div>
        <div class="cs-row"><span class="cs-label">🏃 Agilidad</span>   <span class="cs-val" id="attr-agi">—</span></div>
        <div class="cs-row"><span class="cs-label">🛡️ Defensa</span>    <span class="cs-val" id="attr-def">—</span></div>
        <div class="cs-row"><span class="cs-label">❤️ HP Máx</span>     <span class="cs-val" id="attr-hp">—</span></div>
        <div class="cs-row"><span class="cs-label">🔷 MP Máx</span>     <span class="cs-val" id="attr-mp">—</span></div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card-title">🎒 Inventario y equipo</div>
        <div class="eq-slots" id="eq-slots"></div>
        <div class="inv-filtros">
          <button class="inv-f activo" onclick="filtrarInv('todo', this)">Todo</button>
          <button class="inv-f" onclick="filtrarInv('equipable', this)">Equipable</button>
          <button class="inv-f" onclick="filtrarInv('consumible', this)">Consumible</button>
          <button class="inv-f" onclick="filtrarInv('material', this)">Material</button>
        </div>
        <div class="inv-rejilla" id="inv-rejilla"></div>
        <div class="inv-detalle" id="inv-detalle">Selecciona un objeto para ver qué hace.</div>
      </div>
    </div>

    <!-- Inventory -->
    <div class="panel">
      <div class="sec-head">🎒 INVENTARIO</div>
      <div class="inv-grid" id="inv-grid">
        <!-- populated by JS -->
      </div>
    </div>
  </div>

  <!-- RIGHT: Quests + History -->
  <div class="right-col">

    <!-- Active quests -->
    <div class="panel">
      <div class="sec-head">📜 MISIONES ACTIVAS</div>
      <div id="quests-active">
        <div style="color:var(--txt-dim);font-size:13px;padding:12px 0">Sin misiones activas.</div>
      </div>
    </div>

    <!-- Completed quests -->
    <div class="panel">
      <div class="sec-head">✅ MISIONES COMPLETADAS</div>
      <div id="quests-completed">
        <div style="color:var(--txt-dim);font-size:13px;padding:12px 0">Ninguna completada aún.</div>
      </div>
    </div>

    <!-- Recent history -->
    <div class="panel">
      <div class="sec-head">📋 HISTORIAL RECIENTE</div>
      <div id="history-list">
        <div style="color:var(--txt-dim);font-size:13px;padding:12px 0">Sin actividad reciente.</div>
      </div>
    </div>

  </div>
</div>

<!-- Tooltip -->
<div class="tooltip" id="tooltip">
  <div class="tt-name" id="tt-name"></div>
  <div class="tt-rarity" id="tt-rarity"></div>
  <div class="tt-stats" id="tt-stats"></div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// ── CONFIG ──
const API = ''

// ── STATE ──
let character = null
let inventory = []

// ── CLASS AVATARS ──
const CLASS_AVATARS = {
  'Archimago':  '🧙',
  'Guerrero':   '⚔️',
  'Ladron':     '🗡️',
  'Sacerdote':  '✨',
  'Ranger':     '🏹',
  'Paladin':    '🛡️',
}

// ── RARITY LABELS ──
const RARITY_LABEL = { COMMON:'Común', UNCOMMON:'Inusual', RARE:'Raro', EPIC:'Épico', LEGENDARY:'Legendario' }

// ── PVP RANK ──

// Avatar del perfil: la skin elegida, con el emoji de clase de respaldo
let SKIN_LIST = null
async function renderProfileAvatar(c) {
  const el = document.getElementById('avatar-emoji')
  if (!el) return
  el.textContent = CLASS_AVATARS[c.class] || '🧙'
  const skinId = c.appearance && c.appearance.skinId
  if (!skinId) return
  if (!SKIN_LIST) {
    try { SKIN_LIST = (await (await fetch('/api/skins', { credentials: 'include' })).json()).skins } catch { return }
  }
  const skin = (SKIN_LIST || []).filter(s => s.id === skinId)[0]
  if (!skin) return
  if (skin.portrait || skin.image) el.innerHTML = '<img src="' + (skin.portrait || skin.image) + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%">'
  else el.textContent = skin.emoji
}

// ── Selector de aspecto (usa el mismo catálogo que el creador) ──
async function openSkinPicker() {
  const modal = document.getElementById('skin-modal')
  modal.classList.add('show')
  const grid = document.getElementById('skin-modal-grid')
  grid.innerHTML = '<div style="color:#7A7060;font-size:12px;padding:10px">Cargando aspectos...</div>'
  if (!SKIN_LIST) {
    try { SKIN_LIST = (await (await fetch('/api/skins', { credentials: 'include' })).json()).skins } catch {
      grid.innerHTML = '<div style="color:#E05050;font-size:12px;padding:10px">No se pudo cargar el catálogo</div>'
      return
    }
  }
  renderSkinPicker()
  var propia = (SKIN_LIST || []).some(function (s) { return s.propia })
  document.getElementById('skin-modal-note').innerHTML =
    'Cambiar de aspecto es gratis y no afecta a tus estadísticas: es solo apariencia.' +
    (propia ? '<br><button class="sm-quitar" onclick="quitarPersonajePropio()">Quitar mi personaje subido</button>' : '')
}
function closeSkinPicker() { document.getElementById('skin-modal').classList.remove('show') }

function renderSkinPicker() {
  const current = character && character.appearance && character.appearance.skinId
  document.getElementById('skin-modal-grid').innerHTML = (SKIN_LIST || []).map(s => {
    const art = (s.portrait || s.image) ? '<img src="' + (s.portrait || s.image) + '" alt="">' : s.emoji
    return '<div class="sm-card ' + (current === s.id ? 'active' : '') + ' ' + (s.unlocked ? '' : 'locked') + '"' +
      (s.unlocked ? ' onclick="applySkin(\\'' + s.id + '\\')"' : '') + '>' +
      '<div class="sm-art">' + art + '</div>' +
      '<div class="sm-name">' + s.name + '</div>' +
      (s.unlocked ? '' : '<div class="sm-lock">🔒</div>') + '</div>'
  }).join('')
}

async function applySkin(skinId) {
  try {
    const res = await fetch('/api/character/appearance', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skinId }),
    })
    const d = await res.json()
    if (!res.ok) { showToast(d.error || 'No se pudo cambiar el aspecto', 'red'); return }
    character.appearance = d.appearance
    renderProfileAvatar(character)
    renderSkinPicker()
    showToast('✓ Aspecto actualizado', 'green')
    sendToParent('REFRESH_CHARACTER', {})
  } catch {
    showToast('Error de conexión', 'red')
  }
}


// ─── INVENTARIO Y EQUIPO ──────────────────────────
// Todo lo de aquí llama al servidor: equipar cambia de verdad las
// estadísticas del personaje y usar una poción consume el objeto.
// Antes existía el endpoint /api/player/equip pero NINGUNA pantalla
// lo llamaba: por eso no se podía equipar nada de lo fabricado.
var INV = { items: [], equipo: {}, slots: [], sel: null, filtro: 'todo' }

var NOMBRE_SLOT = {
  weapon: 'Arma', helmet: 'Casco', chest: 'Pecho', gloves: 'Guantes',
  boots: 'Botas', accessory1: 'Accesorio 1', accessory2: 'Accesorio 2',
}

async function cargarInventario() {
  try {
    const r = await fetch('/api/inventory', { credentials: 'include' })
    if (!r.ok) return
    const d = await r.json()
    INV.items = d.inventory || []
    INV.equipo = d.equipment || {}
    INV.slots = d.slots || []
    pintarEquipo()
    pintarInventario()
  } catch {}
}

function pintarEquipo() {
  const cont = document.getElementById('eq-slots')
  if (!cont) return
  cont.innerHTML = INV.slots.map(slot => {
    const uid = INV.equipo[slot]
    const it = INV.items.find(i => i.uid === uid)
    return '<div class="eq-slot ' + (it ? 'lleno' : '') + '"' +
      (it ? ' onclick="quitarEquipo(\\'' + slot + '\\')" title="Quitar ' + it.name + '"' : '') + '>' +
      '<div class="s-icono">' + (it ? dibujo(it) : '·') + '</div>' +
      '<div class="s-nombre">' + (NOMBRE_SLOT[slot] || slot) + '</div></div>'
  }).join('')
}

function filtrarInv(f, btn) {
  INV.filtro = f
  document.querySelectorAll('.inv-f').forEach(b => b.classList.remove('activo'))
  if (btn) btn.classList.add('activo')
  pintarInventario()
}

function pintarInventario() {
  const cont = document.getElementById('inv-rejilla')
  if (!cont) return
  const lista = INV.items.filter(i =>
    INV.filtro === 'todo' ? true :
    INV.filtro === 'equipable' ? i.equipable :
    INV.filtro === 'consumible' ? i.consumible :
    !i.equipable && !i.consumible)
  if (!lista.length) { cont.innerHTML = '<div style="grid-column:1/-1;font-size:12px;color:#7A7060;padding:8px">Nada de este tipo.</div>'; return }
  cont.innerHTML = lista.map(i =>
    '<div class="inv-celda ' + (INV.sel === i.uid ? 'sel' : '') + '" onclick="verObjeto(\\'' + i.uid + '\\')">' +
    (i.equipado ? '<span class="eq">●</span>' : '') +
    '<div style="font-size:19px">' + dibujo(i) + '</div>' +
    (i.quantity > 1 ? '<span class="qty">' + i.quantity + '</span>' : '') + '</div>').join('')
}

// Un objeto puede traer dibujo propio o quedarse con su emoji. Los
// objetos antiguos no traen imagen, asi que siguen igual que siempre:
// esto no obliga a dibujar nada que no exista.
// (Ojo: esta pagina vive dentro de un template literal. Nada de
//  comillas invertidas aqui, ni en los comentarios: cierran la cadena
//  y se lleva por delante el archivo entero.)
function dibujo(i) {
  if (i && i.imagen) {
    return '<img src="' + i.imagen + '" alt="" width="28" height="28" ' +
      'style="image-rendering:pixelated;vertical-align:middle">'
  }
  return (i && i.icon) || '📦'
}

function verObjeto(uid) {
  INV.sel = uid
  pintarInventario()
  const i = INV.items.find(x => x.uid === uid)
  const det = document.getElementById('inv-detalle')
  if (!i || !det) return

  const partes = []
  partes.push('<b style="color:#C8A84B">' + dibujo(i) + ' ' + i.name + '</b> · ' + (i.rarity || '') + (i.quantity > 1 ? ' ×' + i.quantity : ''))
  if (i.equipable) partes.push('Se equipa en: <b>' + (NOMBRE_SLOT[i.slot] || i.slot) + '</b>')
  if (i.stats) {
    const mapa = { str: 'Fuerza', int: 'Inteligencia', agi: 'Agilidad', def: 'Defensa', hp: 'Vida máx', mp: 'Maná máx' }
    partes.push('Mejora: ' + Object.entries(i.stats).map(([k, v]) => (mapa[k] || k) + ' +' + v).join(' · '))
  }
  if (i.consumible) partes.push('Al usarlo: ' + [i.cura ? '+' + i.cura + ' vida' : '', i.mana ? '+' + i.mana + ' maná' : ''].filter(Boolean).join(' y '))
  if (i.usadoEnRecetas && i.usadoEnRecetas.length) partes.push('Se usa para fabricar: ' + i.usadoEnRecetas.join(', '))
  partes.push(i.vendible ? 'Se puede vender (valor base 🪙' + i.valor + ')' : 'No se puede vender')

  const acciones = []
  if (i.equipable && !i.equipado) acciones.push('<button onclick="equipar(\\'' + i.uid + '\\')">Equipar</button>')
  if (i.equipado) acciones.push('<button onclick="quitarEquipo(\\'' + i.slot + '\\')">Quitar</button>')
  if (i.consumible) acciones.push('<button onclick="usarObjeto(\\'' + i.uid + '\\')">Usar</button>')

  det.innerHTML = partes.join('<br>') + (acciones.length ? '<div class="acciones">' + acciones.join('') + '</div>' : '')
}

async function equipar(uid) {
  const r = await fetch('/api/player/equip', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
  const d = await r.json()
  if (!r.ok) { showToast(d.error || 'No se pudo equipar', 'red'); return }
  showToast('✓ Equipado', 'green')
  await recargarTodo()
}

async function quitarEquipo(slot) {
  const r = await fetch('/api/player/equip', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot, unequip: true }),
  })
  if (!r.ok) { showToast('No se pudo quitar', 'red'); return }
  showToast('Objeto retirado')
  await recargarTodo()
}

async function usarObjeto(uid) {
  const r = await fetch('/api/player/use', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
  const d = await r.json()
  if (!r.ok) { showToast(d.error || 'No se pudo usar', 'red'); return }
  showToast('✓ ' + [d.curado ? '+' + d.curado + ' vida' : '', d.restaurado ? '+' + d.restaurado + ' maná' : ''].filter(Boolean).join(' · '), 'green')
  await recargarTodo()
}

// Al equipar cambian las estadísticas: se recarga el personaje entero
// para que lo que se ve en pantalla sea lo que tiene el servidor.
async function recargarTodo() {
  INV.sel = null
  await cargarInventario()
  try {
    const r = await fetch('/api/player', { credentials: 'include' })
    if (r.ok) { const d = await r.json(); character = d.character; render(character) }
  } catch {}
  try { window.parent.postMessage({ type: 'REFRESH_CHARACTER' }, '*') } catch {}
}

function showToast(msg, tipo) {
  let t = document.getElementById('toast-perfil')
  if (!t) {
    t = document.createElement('div')
    t.id = 'toast-perfil'
    t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#12151D;border:1px solid #C8A84B;color:#E8E0CC;padding:10px 18px;border-radius:8px;font-size:13px;z-index:200;transition:opacity .2s'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.style.borderColor = tipo === 'red' ? '#E03030' : tipo === 'green' ? '#30C060' : '#C8A84B'
  t.style.opacity = '1'
  clearTimeout(window._tp)
  window._tp = setTimeout(() => { t.style.opacity = '0' }, 2600)
}


// ─── SUBIR PERSONAJE PROPIO ───────────────────────
// El recorte a círculo con fondo transparente se hace AQUÍ, antes de
// subir nada. Es lo que evita repetir el error de las ilustraciones
// con fondo incrustado, que en el mapa se veían como un cuadrado.
// El servidor comprueba después que lo que llega es lo que se pidió.
var MAX_ORIGINAL_MB = 8
var LADO_FINAL = 256

function abrirSubida() { document.getElementById('archivo-personaje').click() }

function procesarArchivo(ev) {
  var f = ev.target.files && ev.target.files[0]
  ev.target.value = ''
  if (!f) return
  if (!/^image\\/(png|jpeg|webp)$/.test(f.type)) { showToast('Solo PNG, JPG o WebP', 'red'); return }
  if (f.size > MAX_ORIGINAL_MB * 1024 * 1024) { showToast('La imagen no puede pasar de ' + MAX_ORIGINAL_MB + ' MB', 'red'); return }

  var lector = new FileReader()
  lector.onerror = function () { showToast('No se pudo leer el archivo', 'red') }
  lector.onload = function () {
    var img = new Image()
    img.onerror = function () { showToast('Ese archivo no es una imagen válida', 'red') }
    img.onload = function () {
      if (img.width < 48 || img.height < 48) { showToast('La imagen es demasiado pequeña (mínimo 48px)', 'red'); return }
      try { subir(recortarEnCirculo(img)) }
      catch (e) { showToast('No se pudo procesar la imagen', 'red') }
    }
    img.src = lector.result
  }
  lector.readAsDataURL(f)
}

function recortarEnCirculo(img) {
  var c = document.createElement('canvas')
  c.width = LADO_FINAL; c.height = LADO_FINAL
  var g = c.getContext('2d')
  // Recorte cuadrado centrado: si la foto es apaisada no se deforma
  var lado = Math.min(img.width, img.height)
  var sx = (img.width - lado) / 2, sy = (img.height - lado) / 2
  g.save()
  g.beginPath()
  g.arc(LADO_FINAL / 2, LADO_FINAL / 2, LADO_FINAL / 2 - 1, 0, Math.PI * 2)
  g.closePath()
  g.clip()
  g.drawImage(img, sx, sy, lado, lado, 0, 0, LADO_FINAL, LADO_FINAL)
  g.restore()
  // Borde dorado, para que se integre con el resto del juego
  g.beginPath()
  g.arc(LADO_FINAL / 2, LADO_FINAL / 2, LADO_FINAL / 2 - 2, 0, Math.PI * 2)
  g.strokeStyle = '#C8A84B'
  g.lineWidth = 4
  g.stroke()
  return c.toDataURL('image/png')
}

async function subir(dataUrl) {
  showToast('Subiendo…')
  try {
    var r = await fetch('/api/character/upload', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen: dataUrl }),
    })
    var d = await r.json()
    if (!r.ok) { showToast('✗ ' + (d.error || 'No se pudo subir'), 'red'); return }
    showToast('✓ Personaje subido y en uso', 'green')
    SKIN_LIST = null
    if (character) { character.appearance = character.appearance || {}; character.appearance.skinId = 'propio' }
    await recargarTodo()
    renderProfileAvatar(character)
  } catch (e) { showToast('Error de conexión', 'red') }
}

async function quitarPersonajePropio() {
  var r = await fetch('/api/character/upload', { method: 'DELETE', credentials: 'include' })
  var d = await r.json()
  if (!r.ok) { showToast(d.error || 'No se pudo quitar', 'red'); return }
  showToast('Personaje propio retirado')
  SKIN_LIST = null
  if (character) character.appearance = d.appearance
  await recargarTodo()
  renderProfileAvatar(character)
}

function pvpRank(rating) {
  if (rating >= 2200) return '🔥 Gran Maestro'
  if (rating >= 1900) return '💜 Maestro'
  if (rating >= 1600) return '💙 Diamante'
  if (rating >= 1400) return '🥇 Platino'
  if (rating >= 1200) return '🥈 Oro'
  return '🥉 Plata'
}

// ── RENDER ──
function render(c, inv) {
  // Header
  document.getElementById('hdr-gold').textContent  = (c.gold || 0).toLocaleString()
  document.getElementById('hdr-cgrid').textContent = c.cgrid || 0

  // Avatar
  renderProfileAvatar(c)
  document.getElementById('char-name').textContent    = c.name
  document.getElementById('char-class').textContent   = c.class || 'Archimago'
  document.getElementById('level-badge').textContent  = \`Nv. \${c.level}\`

  // Bars
  const hpPct = Math.min(100, (c.hp / c.maxHp * 100)).toFixed(1)
  const mpPct = Math.min(100, (c.mp / c.maxMp * 100)).toFixed(1)
  const xpPct = Math.min(100, (c.xp / c.xpToNext * 100)).toFixed(1)
  document.getElementById('hp-bar').style.width  = hpPct + '%'
  document.getElementById('mp-bar').style.width  = mpPct + '%'
  document.getElementById('xp-bar').style.width  = xpPct + '%'
  document.getElementById('hp-txt').textContent  = \`\${c.hp} / \${c.maxHp}\`
  document.getElementById('mp-txt').textContent  = \`\${c.mp} / \${c.maxMp}\`
  document.getElementById('xp-txt').textContent  = \`\${c.xp} / \${c.xpToNext}\`

  // PvP
  const rating = c.pvpRating || 1200
  document.getElementById('pvp-rating').textContent = rating.toLocaleString()
  document.getElementById('pvp-rank').textContent   = pvpRank(rating)

  // Blockchain
  document.getElementById('bc-cgrid').textContent = \`\${c.cgrid || 0} CGRID\`
  document.getElementById('bc-nft').textContent   = \`\${inv.length} ítems\`

  // Stats
  document.getElementById('stat-kills').textContent    = (c.monstersKilled || 0).toLocaleString()
  document.getElementById('stat-bosses').textContent   = (c.bossesKilled   || 0).toLocaleString()
  document.getElementById('stat-dungeons').textContent = (c.dungeonsCleared|| 0).toLocaleString()
  document.getElementById('stat-gold').textContent     = (c.gold || 0).toLocaleString()
  document.getElementById('stat-cgrid').textContent    = (c.cgrid || 0).toLocaleString()
  const completedCount = (c.completedQuests || []).length
  document.getElementById('stat-quests').textContent   = completedCount

  // Attributes
  document.getElementById('attr-str').textContent = c.strength     || '—'
  document.getElementById('attr-int').textContent = c.intelligence || '—'
  document.getElementById('attr-agi').textContent = c.agility      || '—'
  document.getElementById('attr-def').textContent = c.defense      || '—'
  document.getElementById('attr-hp').textContent  = c.maxHp        || '—'
  document.getElementById('attr-mp').textContent  = c.maxMp        || '—'

  // Inventory grid
  renderInventory(inv)

  // Quests
  renderQuests(c)

  // History feed
  renderHistory(c)

  // Show layout
  document.getElementById('loading-view').style.display = 'none'
  document.getElementById('main-layout').style.display  = ''
}

function renderInventory(inv) {
  const grid = document.getElementById('inv-grid')
  grid.innerHTML = ''
  const slots = 24
  for (let i = 0; i < slots; i++) {
    const item = inv[i]
    const slot = document.createElement('div')
    if (item) {
      const r = (item.rarity || 'COMMON').toLowerCase()
      slot.className = \`inv-slot r-\${r}\`
      slot.innerHTML = \`
        <div class="i-icon">\${item.icon || '📦'}</div>
        \${item.quantity > 1 ? \`<div class="i-qty">×\${item.quantity}</div>\` : ''}
        <div class="rarity-bar"></div>
      \`
      slot.addEventListener('mouseenter', (e) => showTooltip(e, item))
      slot.addEventListener('mouseleave',  hideTooltip)
      slot.addEventListener('mousemove',  (e) => moveTooltip(e))
    } else {
      slot.className = 'inv-slot empty'
      slot.innerHTML = '<div class="rarity-bar"></div>'
    }
    grid.appendChild(slot)
  }
}

function renderQuests(c) {
  const activeEl    = document.getElementById('quests-active')
  const completedEl = document.getElementById('quests-completed')

  const activeQuests    = c.activeQuests    || []
  const completedQuests = c.completedQuests || []

  if (activeQuests.length === 0) {
    activeEl.innerHTML = '<div style="color:var(--txt-dim);font-size:13px;padding:8px 0">Sin misiones activas.</div>'
  } else {
    activeEl.innerHTML = activeQuests.map(aq => {
      const q = aq.quest || aq
      const name = q.name || (typeof aq === 'string' ? aq : 'Misión')
      return \`
        <div class="quest-item">
          <div class="quest-icon">📜</div>
          <div class="quest-info">
            <div class="quest-name">\${name}</div>
            <span class="quest-status active">En progreso</span>
          </div>
        </div>\`
    }).join('')
  }

  if (completedQuests.length === 0) {
    completedEl.innerHTML = '<div style="color:var(--txt-dim);font-size:13px;padding:8px 0">Ninguna completada aún.</div>'
  } else {
    // Show last 5 completed
    const shown = completedQuests.slice(-5).reverse()
    completedEl.innerHTML = shown.map(qid => \`
      <div class="quest-item">
        <div class="quest-icon">✅</div>
        <div class="quest-info">
          <div class="quest-name">\${typeof qid === 'string' ? qid.replace(/_/g, ' ') : qid}</div>
          <span class="quest-status completed">Completada</span>
        </div>
      </div>\`
    ).join('')
  }
}

function renderHistory(c) {
  const el = document.getElementById('history-list')
  const events = []

  if (c.monstersKilled > 0) events.push({ icon:'⚔️', text:\`\${c.monstersKilled} monstruos eliminados en total\`, time:'historial' })
  if (c.dungeonsCleared > 0) events.push({ icon:'🏰', text:\`\${c.dungeonsCleared} mazmorras completadas\`, time:'historial' })
  if (c.gold > 0) events.push({ icon:'🪙', text:\`Oro actual: \${c.gold.toLocaleString()}\`, time:'ahora' })
  if (c.cgrid > 0) events.push({ icon:'💎', text:\`\${c.cgrid} $CGRID acumulados\`, time:'historial' })
  if ((c.activeQuests||[]).length > 0) events.push({ icon:'📜', text:\`\${c.activeQuests.length} misión(es) en progreso\`, time:'activo' })
  if ((c.completedQuests||[]).length > 0) events.push({ icon:'✅', text:\`\${c.completedQuests.length} misión(es) completadas\`, time:'historial' })

  if (events.length === 0) {
    el.innerHTML = '<div style="color:var(--txt-dim);font-size:13px;padding:8px 0">Sin actividad reciente.</div>'
    return
  }

  el.innerHTML = events.map(e => \`
    <div class="hist-item">
      <div class="hist-icon">\${e.icon}</div>
      <div class="hist-text">\${e.text}</div>
      <div class="hist-time">\${e.time}</div>
    </div>\`
  ).join('')
}

// ── TOOLTIP ──
const ttEl = document.getElementById('tooltip')
function showTooltip(e, item) {
  const r = (item.rarity || 'COMMON').toLowerCase()
  ttEl.className = \`tooltip r-\${r} visible\`
  document.getElementById('tt-name').textContent   = item.name
  document.getElementById('tt-rarity').textContent = RARITY_LABEL[item.rarity] || item.rarity || 'Común'
  document.getElementById('tt-stats').innerHTML    = \`
    <span>Tipo: \${item.type || '—'}</span>
    <span>Cantidad: ×\${item.quantity || 1}</span>
  \`
  moveTooltip(e)
}
function moveTooltip(e) {
  const x = e.clientX + 14, y = e.clientY - 20
  ttEl.style.left = Math.min(x, window.innerWidth - 220) + 'px'
  ttEl.style.top  = Math.max(0, y) + 'px'
}
function hideTooltip() { ttEl.classList.remove('visible') }

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className = \`toast \${type} show\`
  setTimeout(() => t.classList.remove('show'), 3000)
}

// ── API FETCH ──
async function fetchProfile() {
  try {
    const [playerRes, invRes] = await Promise.all([
      fetch(\`\${API}/api/player\`,    { credentials: 'include' }),
      fetch(\`\${API}/api/inventory\`, { credentials: 'include' }),
    ])
    if (!playerRes.ok) throw new Error('No autorizado')
    const playerData = await playerRes.json()
    const invData    = invRes.ok ? await invRes.json() : { inventory: [] }
    character  = playerData.character
    inventory  = invData.inventory || character.inventory || []
    render(character, inventory)
  } catch (err) {
    document.getElementById('loading-view').innerHTML = \`
      <span style="font-size:36px;display:block;margin-bottom:14px">⚠️</span>
      <div style="color:var(--txt-dim)">No se pudo cargar el perfil.<br>Asegúrate de haber iniciado sesión.</div>
    \`
  }
}

// ── POSTMESSAGE BRIDGE ──
function sendToParent(type, payload) {
  window.parent.postMessage({ type, payload }, '*')
}

function requestCharacter() {
  // Try API first, then fall back to parent bridge
  fetchProfile().catch(() => sendToParent('GET_CHARACTER', {}))
}

window.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  if (type === 'CHARACTER_DATA' && data?.character) {
    character = data.character
    cargarInventario()
    inventory = character.inventory || []
    render(character, inventory)
  }
})

// ── INIT ──
// Try direct API first (works when logged in); if not, ask parent
window.addEventListener('load', async () => {
  try {
    const res = await fetch(\`\${API}/api/player\`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      character  = data.character
      // Also fetch inventory
      const invRes = await fetch(\`\${API}/api/inventory\`, { credentials: 'include' })
      inventory = invRes.ok ? (await invRes.json()).inventory || [] : character.inventory || []
      render(character, inventory)
    } else {
      // Not authorized directly — ask parent launcher
      sendToParent('GET_CHARACTER', {})
    }
  } catch {
    sendToParent('GET_CHARACTER', {})
  }
})
</script>

<!-- Selector de aspecto -->
<div class="skin-modal" id="skin-modal">
  <div class="skin-modal-box">
    <div class="skin-modal-head">
      <span>Cambiar aspecto</span>
      <button class="skin-modal-close" onclick="closeSkinPicker()">✕</button>
    </div>
    <div class="skin-modal-grid" id="skin-modal-grid"></div>
    <div class="skin-modal-note" id="skin-modal-note"></div>
  </div>
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
