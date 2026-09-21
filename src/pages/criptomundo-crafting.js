PAGES['criptomundo-crafting.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Forja & Alquimia</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --void:       #080A0E;
  --deep:       #0D0F14;
  --panel:      #13161E;
  --card:       #1A1D27;
  --hover:      #22263A;
  --gold:       #C8A84B;
  --gold-dim:   #7A6530;
  --gold-bright:#F0D070;
  --forge:      #E06020;   /* signature: forge orange */
  --forge-dim:  #603010;
  --alch:       #40C090;   /* alchemy teal */
  --alch-dim:   #1A5040;
  --cook:       #D04080;   /* cooking rose */
  --cook-dim:   #601030;
  --border:     #1E2130;
  --border-gold:#4A3A18;
  --txt:        #E8E0CC;
  --txt-dim:    #8A8070;
  --red:        #C03030;
  --green:      #30A060;

  /* rarity */
  --common:    #9D9D9D;
  --uncommon:  #1EFF00;
  --rare:      #4090F0;
  --epic:      #A335EE;
  --legendary: #FF8000;
}

*{margin:0;padding:0;box-sizing:border-box;}

body {
  background: var(--void);
  color: var(--txt);
  font-family: 'Crimson Pro', Georgia, serif;
  min-height: 100vh;
  background-image:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(224,96,32,0.07) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A84B' fill-opacity='0.018'%3E%3Cpath d='M40 0L50 30H80L57 48L66 78L40 60L14 78L23 48L0 30H30Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── HEADER ── */
header {
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 24px;
  background: linear-gradient(180deg, rgba(224,96,32,0.1) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-gold);
  position: sticky; top:0; z-index:50;
  backdrop-filter: blur(8px);
}
.logo { font-family:'Cinzel',serif; font-weight:900; font-size:20px; color:var(--gold); letter-spacing:3px; text-shadow:0 0 24px rgba(200,168,75,0.35); }
.logo em { color:var(--forge); font-style:normal; }
.logo small { display:block; color:var(--txt-dim); font-size:11px; font-weight:400; letter-spacing:2px; margin-top:-2px; }
.hdr-right { display:flex; gap:12px; align-items:center; }
.badge {
  display:flex; align-items:center; gap:6px;
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:5px 12px;
  font-family:'JetBrains Mono',monospace; font-size:12px;
}
.badge b { color:var(--gold); }
.badge span { color:var(--txt-dim); font-size:10px; }

/* ── LAYOUT ── */
.layout {
  display:grid;
  grid-template-columns: 300px 1fr 300px;
  height: calc(100vh - 52px);
  overflow: hidden;
}

/* ── SIDEBAR ── */
.sidebar {
  background:var(--panel);
  border-right:1px solid var(--border);
  display:flex; flex-direction:column;
  overflow:hidden;
}
.sidebar-right { border-right:none; border-left:1px solid var(--border); }

.sec-title {
  font-family:'Cinzel',serif; font-size:10px; font-weight:600;
  color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase;
  padding:13px 16px 10px;
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:8px;
}
.sec-title::before { content:''; width:3px; height:11px; background:var(--gold); border-radius:2px; }

/* ── TAB BAR ── */
.tab-bar { display:flex; border-bottom:1px solid var(--border); }
.tab {
  flex:1; padding:10px 4px; font-family:'Cinzel',serif; font-size:10px;
  letter-spacing:1px; text-transform:uppercase; cursor:pointer;
  background:none; border:none; color:var(--txt-dim);
  border-bottom:2px solid transparent; transition:all 0.15s;
  display:flex; flex-direction:column; align-items:center; gap:3px;
}
.tab .t-icon { font-size:18px; }
.tab:hover { color:var(--txt); background:var(--hover); }
.tab.active { color:var(--gold); border-bottom-color:var(--gold); }
.tab.active.forge  { color:var(--forge);  border-bottom-color:var(--forge); }
.tab.active.alch   { color:var(--alch);   border-bottom-color:var(--alch); }
.tab.active.cook   { color:var(--cook);   border-bottom-color:var(--cook); }

/* ── RECIPE LIST ── */
.recipe-list { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:4px; }
.recipe-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:10px 12px;
  cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; gap:10px;
  position:relative; overflow:hidden;
}
.recipe-card::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
  background: var(--accent, var(--gold));
  transform:scaleY(0); transform-origin:center;
  transition:transform 0.15s;
  border-radius:3px 0 0 3px;
}
.recipe-card:hover::before, .recipe-card.selected::before { transform:scaleY(1); }
.recipe-card:hover { border-color:var(--border-gold); background:var(--hover); }
.recipe-card.selected { border-color:var(--accent,var(--gold)); background:var(--hover); }
.recipe-card.locked { opacity:0.45; cursor:not-allowed; }
.rc-icon { font-size:28px; flex-shrink:0; }
.rc-info { flex:1; min-width:0; }
.rc-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; color:var(--txt); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rc-rarity { font-size:10px; letter-spacing:1px; text-transform:uppercase; margin-top:1px; }
.rc-craftable { font-size:10px; color:var(--green); margin-top:3px; }
.rc-miss { font-size:10px; color:var(--red); margin-top:3px; }
.rc-badge { font-family:'JetBrains Mono',monospace; font-size:9px; padding:2px 6px; border-radius:3px; background:var(--panel); color:var(--txt-dim); white-space:nowrap; }
.rc-level { font-size:10px; color:var(--txt-dim); margin-top:2px; }

/* ── CRAFTING BENCH (CENTER) ── */
.bench {
  display:flex; flex-direction:column; overflow:hidden;
  background:var(--deep);
}
.bench-header {
  padding:16px 20px 12px;
  border-bottom:1px solid var(--border);
  background: linear-gradient(180deg, rgba(224,96,32,0.06) 0%, transparent 100%);
}
.bench-recipe-name {
  font-family:'Cinzel',serif; font-size:20px; font-weight:900;
  color:var(--gold); letter-spacing:1px;
}
.bench-recipe-name.forge-color { color:var(--forge); }
.bench-recipe-name.alch-color  { color:var(--alch); }
.bench-recipe-name.cook-color  { color:var(--cook); }
.bench-recipe-sub { font-size:13px; color:var(--txt-dim); margin-top:3px; }

.bench-body { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:20px; }

/* Result preview */
.result-preview {
  background:var(--panel); border:1px solid var(--border-gold);
  border-radius:12px; padding:20px;
  display:flex; align-items:center; gap:20px;
  position:relative; overflow:hidden;
}
.result-preview::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 30% 50%, rgba(200,168,75,0.06) 0%, transparent 60%);
  pointer-events:none;
}
.result-icon { font-size:56px; filter:drop-shadow(0 0 20px rgba(200,168,75,0.3)); }
.result-info { flex:1; }
.result-name { font-family:'Cinzel',serif; font-size:18px; font-weight:600; }
.result-rarity { font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:4px 0 8px; }
.result-stats { display:flex; flex-wrap:wrap; gap:6px; }
.stat-pill {
  background:var(--card); border:1px solid var(--border);
  border-radius:4px; padding:3px 9px;
  font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt);
}
.result-desc { font-size:12px; color:var(--txt-dim); font-style:italic; margin-top:8px; }
.result-qty-badge {
  background:var(--card); border:1px solid var(--border-gold);
  border-radius:8px; padding:8px 14px; text-align:center;
}
.result-qty-badge .qty-num { font-family:'Cinzel',serif; font-size:22px; font-weight:900; color:var(--gold); }
.result-qty-badge .qty-lbl { font-size:10px; color:var(--txt-dim); letter-spacing:1px; }

/* Ingredients */
.ing-title { font-family:'Cinzel',serif; font-size:11px; color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase; margin-bottom:10px; }
.ingredients { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; }
.ing-slot {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:12px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  position:relative; transition:all 0.15s;
}
.ing-slot.has  { border-color:var(--green); }
.ing-slot.miss { border-color:var(--red); }
.ing-icon  { font-size:28px; }
.ing-name  { font-size:11px; text-align:center; color:var(--txt); line-height:1.3; }
.ing-need  { font-family:'JetBrains Mono',monospace; font-size:10px; }
.ing-need.ok  { color:var(--green); }
.ing-need.bad { color:var(--red); }
.ing-check { position:absolute; top:5px; right:6px; font-size:11px; }

/* Craft button */
.craft-zone {
  display:flex; flex-direction:column; align-items:center; gap:10px;
  padding:4px 0 8px;
}
.craft-btn {
  width:100%; max-width:340px;
  padding:14px 0;
  font-family:'Cinzel',serif; font-size:15px; font-weight:600; letter-spacing:2px;
  border:none; border-radius:10px; cursor:pointer;
  transition:all 0.2s;
  position:relative; overflow:hidden;
}
.craft-btn::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
  transform:translateX(-100%);
}
.craft-btn:hover:not(:disabled)::after { animation:shine 0.5s forwards; }
@keyframes shine { to{ transform:translateX(100%); } }
.craft-btn.forge-btn { background:linear-gradient(135deg,#8B3010,var(--forge)); color:#fff; }
.craft-btn.alch-btn  { background:linear-gradient(135deg,#0D4030,var(--alch));  color:#fff; }
.craft-btn.cook-btn  { background:linear-gradient(135deg,#601030,var(--cook));  color:#fff; }
.craft-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.5); }
.craft-btn:disabled { opacity:0.35; cursor:not-allowed; }
.craft-hint { font-size:12px; color:var(--txt-dim); text-align:center; }

/* Craft animation overlay */
.craft-overlay {
  position:fixed; inset:0; z-index:200;
  background:rgba(0,0,0,0.75);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
  opacity:0; pointer-events:none; transition:opacity 0.3s;
}
.craft-overlay.show { opacity:1; pointer-events:all; }
.craft-anim { font-size:72px; animation:spinPop 1.5s ease-in-out infinite; }
@keyframes spinPop {
  0%   { transform:scale(1) rotate(0deg); filter:drop-shadow(0 0 10px rgba(200,168,75,0.3)); }
  50%  { transform:scale(1.3) rotate(180deg); filter:drop-shadow(0 0 40px rgba(200,168,75,0.8)); }
  100% { transform:scale(1) rotate(360deg); filter:drop-shadow(0 0 10px rgba(200,168,75,0.3)); }
}
.craft-label { font-family:'Cinzel',serif; font-size:18px; color:var(--gold); letter-spacing:3px; }
.craft-bar-wrap { width:240px; height:6px; background:var(--card); border-radius:3px; overflow:hidden; }
.craft-bar { height:100%; background:linear-gradient(90deg,var(--gold-dim),var(--gold-bright)); border-radius:3px; width:0%; transition:width 1.4s linear; }

/* Result flash */
.result-flash {
  position:fixed; inset:0; z-index:300;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
  opacity:0; pointer-events:none; transition:opacity 0.4s;
  background:rgba(0,0,0,0.85);
}
.result-flash.show { opacity:1; pointer-events:all; }
.rf-icon { font-size:88px; animation:popIn 0.5s cubic-bezier(.34,1.56,.64,1); filter:drop-shadow(0 0 40px rgba(200,168,75,0.6)); }
@keyframes popIn { from{transform:scale(0.3);opacity:0;} to{transform:scale(1);opacity:1;} }
.rf-name { font-family:'Cinzel',serif; font-size:26px; font-weight:900; color:var(--gold); text-align:center; }
.rf-rarity { font-size:13px; letter-spacing:3px; text-transform:uppercase; }
.rf-stats { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.rf-continue {
  margin-top:8px; padding:10px 32px;
  font-family:'Cinzel',serif; font-size:13px; font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--gold-dim),var(--gold));
  border:none; border-radius:8px; color:var(--void); cursor:pointer;
  transition:all 0.2s;
}
.rf-continue:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(200,168,75,0.3); }

/* ── INVENTORY (right) ── */
.inv-search {
  padding:8px 12px;
  border-bottom:1px solid var(--border);
  display:flex; gap:6px;
}
.inv-search input {
  flex:1; background:var(--card); border:1px solid var(--border);
  border-radius:5px; padding:5px 10px; font-family:'Crimson Pro',serif;
  font-size:13px; color:var(--txt); outline:none;
  transition:border-color 0.15s;
}
.inv-search input:focus { border-color:var(--gold-dim); }
.inv-search input::placeholder { color:var(--txt-dim); }

.inv-body { flex:1; overflow-y:auto; padding:8px; }
.inv-section-label { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; padding:6px 4px 4px; }
.inv-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:10px; }

.inv-item {
  aspect-ratio:1; background:var(--card); border:1px solid var(--border);
  border-radius:6px; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:1px;
  position:relative; overflow:hidden; cursor:pointer;
  transition:all 0.12s;
}
.inv-item:hover { border-color:var(--gold-dim); background:var(--hover); transform:scale(1.04); }
.inv-item .ii-icon { font-size:20px; }
.inv-item .ii-qty {
  position:absolute; bottom:2px; right:4px;
  font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--txt-dim); font-weight:600;
}
.inv-item .rarity-bar { position:absolute; bottom:0; left:0; right:0; height:2px; }
.r-common    .rarity-bar { background:var(--common); }
.r-uncommon  .rarity-bar { background:var(--uncommon); }
.r-rare      .rarity-bar { background:var(--rare); }
.r-epic      .rarity-bar { background:var(--epic); }
.r-legendary .rarity-bar { background:var(--legendary); }
.r-common    { border-color:#2D2D2D; }
.r-uncommon  { border-color:#0D3000; }
.r-rare      { border-color:#0D2A50; }
.r-epic      { border-color:#3A1060; }
.r-legendary { border-color:#5A3000; box-shadow:0 0 6px rgba(255,128,0,0.15); }

/* highlight when used in recipe */
.inv-item.in-recipe { border-color:var(--gold); box-shadow:0 0 8px rgba(200,168,75,0.25); }

/* Tooltip */
.tooltip {
  position:fixed; background:var(--panel); border:1px solid var(--border-gold);
  border-radius:8px; padding:12px 14px; min-width:170px;
  pointer-events:none; z-index:999; opacity:0; transition:opacity 0.12s;
  box-shadow:0 8px 28px rgba(0,0,0,0.7);
}
.tooltip.visible { opacity:1; }
.tt-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; margin-bottom:3px; }
.tt-rar  { font-size:10px; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
.tt-stat { font-size:12px; color:var(--txt-dim); }
.tt-stat span { color:var(--txt); }
.tt-qty  { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--gold); margin-top:4px; }

/* ── CRAFTED LOG ── */
.crafted-log { padding:0 8px 8px; }
.cl-title { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; padding:8px 4px 4px; }
.cl-entry {
  display:flex; align-items:center; gap:8px;
  padding:5px 6px; border-radius:5px;
  font-size:12px; color:var(--txt-dim);
  animation:fadeSlide 0.3s ease-out;
}
@keyframes fadeSlide { from{opacity:0;transform:translateY(4px);} to{opacity:1;transform:none;} }
.cl-entry .ce-icon { font-size:18px; }
.cl-entry .ce-name { color:var(--txt); }
.cl-entry .ce-time { margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; }

/* scrollbars */
::-webkit-scrollbar { width:4px; } 
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

/* empty state */
.empty-bench {
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:12px; color:var(--txt-dim);
}
.empty-bench .eb-icon { font-size:56px; opacity:0.3; }
.empty-bench p { font-size:14px; }



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
  <div class="logo">CRIPTO<em>MUNDO</em> <small>FORJA & ALQUIMIA</small></div>
  <div class="hdr-right">
    <div class="badge"><span>🧪</span> <b id="mat-count">18</b> <span>MATERIALES</span></div>
    <div class="badge"><span>🪙</span> <b id="gold-count">1,240</b> <span>ORO</span></div>
    <div class="badge"><span>🔨</span> <b id="crafted-count">0</b> <span>CREADOS</span></div>
  </div>
</header>

<div class="layout">

  <!-- LEFT: Recipe browser -->
  <aside class="sidebar">
    <div class="tab-bar" id="tab-bar">
      <button class="tab active forge" data-tab="forge" onclick="switchTab('forge',this)">
        <span class="t-icon">🔨</span>Forja
      </button>
      <button class="tab alch" data-tab="alch" onclick="switchTab('alch',this)">
        <span class="t-icon">🧪</span>Alquimia
      </button>
      <button class="tab cook" data-tab="cook" onclick="switchTab('cook',this)">
        <span class="t-icon">🍳</span>Cocina
      </button>
    </div>
    <div class="recipe-list" id="recipe-list"></div>
  </aside>

  <!-- CENTER: Crafting bench -->
  <main class="bench" id="bench">
    <div class="empty-bench" id="empty-bench">
      <div class="eb-icon">⚒️</div>
      <p>Selecciona una receta para comenzar</p>
    </div>
    <!-- filled by JS -->
  </main>

  <!-- RIGHT: Inventory -->
  <aside class="sidebar sidebar-right">
    <div class="sec-title">Materiales & Recursos</div>
    <div class="inv-search">
      <input type="text" placeholder="Buscar material..." oninput="filterInventory(this.value)" id="inv-search">
    </div>
    <div class="inv-body" id="inv-body"></div>
    <div class="crafted-log">
      <div class="cl-title">Últimas creaciones</div>
      <div id="crafted-log-list"></div>
    </div>
  </aside>

</div>

<!-- Crafting animation -->
<div class="craft-overlay" id="craft-overlay">
  <div class="craft-anim" id="craft-anim-icon">⚒️</div>
  <div class="craft-label" id="craft-label">FORJANDO...</div>
  <div class="craft-bar-wrap"><div class="craft-bar" id="craft-bar"></div></div>
</div>

<!-- Result flash -->
<div class="result-flash" id="result-flash">
  <div class="rf-icon" id="rf-icon"></div>
  <div class="rf-name" id="rf-name"></div>
  <div class="rf-rarity" id="rf-rarity"></div>
  <div class="rf-stats" id="rf-stats"></div>
  <button class="rf-continue" onclick="closeFlash()">¡Continuar!</button>
</div>

<!-- Tooltip -->
<div class="tooltip" id="tooltip">
  <div class="tt-name" id="tt-name"></div>
  <div class="tt-rar"  id="tt-rar"></div>
  <div class="tt-stat" id="tt-stat"></div>
  <div class="tt-qty"  id="tt-qty"></div>
</div>

<script>
// ═══════════════════════════════════════════════════════════
//  CRAFTING v3.1 — cliente fino
//  Recetas, materiales y resultado los valida el servidor.
// ═══════════════════════════════════════════════════════════
var RARITY_COLOR = { COMMON: '#9D9D9D', UNCOMMON: '#1EFF00', RARE: '#4090F0', EPIC: '#A335EE', LEGENDARY: '#FF8000', MYTHIC: '#FF4040' };
var RARITY_LABEL = { COMMON: 'Común', UNCOMMON: 'Inusual', RARE: 'Raro', EPIC: 'Épico', LEGENDARY: 'Legendario', MYTHIC: 'Mítico' };
var CAT_LABEL = { forge: { action: '⚒️ FORJAR', doing: 'FORJANDO...', icon: '⚒️', color: 'forge-color', btn: 'forge-btn', accent: 'var(--forge)' },
                  alch:  { action: '🧪 MEZCLAR', doing: 'MEZCLANDO...', icon: '🧪', color: 'alch-color', btn: 'alch-btn', accent: 'var(--alch)' },
                  cook:  { action: '🍳 COCINAR', doing: 'COCINANDO...', icon: '🍳', color: 'cook-color', btn: 'cook-btn', accent: 'var(--cook)' } };

var C = { char: null, recipes: [], inventory: [], tab: 'forge', selected: null, qty: 1, crafted: 0, busy: false, log: [] };

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
function n(x) { return (x || 0).toLocaleString('es'); }

async function api(path, opts) {
  var res = await fetch(path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts || {}));
  var d = {};
  try { d = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data: d };
}

async function init() {
  var me = await api('/api/player');
  if (!me.ok) { showEmptyBench('Inicia sesión para usar el taller'); return; }
  C.char = me.data.character;
  var r = await api('/api/crafting');
  C.recipes = r.data.recipes || [];
  await refreshInventory();
  renderHeader();
  renderRecipes();
  showEmptyBench();
}

async function refreshInventory() {
  var inv = await api('/api/inventory');
  C.inventory = inv.ok ? (inv.data.inventory || []) : [];
  renderInventory($('inv-search') ? $('inv-search').value : '');
}

function renderHeader() {
  var mats = C.inventory.filter(function (i) { return i.type === 'MATERIAL'; }).reduce(function (a, i) { return a + i.quantity; }, 0);
  $('mat-count').textContent = n(mats);
  $('gold-count').textContent = n(C.char.gold);
  $('crafted-count').textContent = n(C.crafted);
}

function have(itemId) {
  return C.inventory.filter(function (i) { return i.itemId === itemId; }).reduce(function (a, i) { return a + i.quantity; }, 0);
}
function missing(recipe) {
  return recipe.ingredients.filter(function (ing) { return have(ing.itemId) < ing.quantity * C.qty; });
}
function canCraft(recipe) {
  return C.char.level >= recipe.levelReq && missing(recipe).length === 0;
}

// ── LISTA DE RECETAS ───────────────────────────────────────
function switchTab(tab, btn) {
  C.tab = tab;
  document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  C.selected = null;
  renderRecipes();
  showEmptyBench();
}

function renderRecipes() {
  var list = $('recipe-list');
  list.innerHTML = '';
  var recipes = C.recipes.filter(function (r) { return r.category === C.tab; });
  if (!recipes.length) {
    list.innerHTML = '<div style="padding:16px;font-size:12px;color:var(--txt-dim)">Sin recetas en esta estación todavía.</div>';
    return;
  }
  recipes.forEach(function (recipe) {
    var out = recipe.outputItem || {};
    var rarity = (out.rarity || 'COMMON').toUpperCase();
    var levelOk = C.char.level >= recipe.levelReq;
    var ok = canCraft(recipe);
    var miss = missing(recipe);
    var div = document.createElement('div');
    div.className = 'recipe-card' + (C.selected && C.selected.id === recipe.id ? ' selected' : '');
    div.style.setProperty('--accent', CAT_LABEL[C.tab].accent);
    div.innerHTML =
      '<div class="rc-icon">' + (out.icon || '📦') + '</div>' +
      '<div class="rc-info">' +
        '<div class="rc-name">' + esc(recipe.name) + '</div>' +
        '<div class="rc-rarity" style="color:' + RARITY_COLOR[rarity] + '">' + RARITY_LABEL[rarity] + '</div>' +
        (!levelOk
          ? '<div class="rc-miss">🔒 Requiere nivel ' + recipe.levelReq + '</div>'
          : ok
            ? '<div class="rc-craftable">✓ Puedes crear</div>'
            : '<div class="rc-miss">✗ Faltan ' + miss.length + ' ingrediente' + (miss.length > 1 ? 's' : '') + '</div>') +
      '</div>' +
      '<div class="rc-badge">Nv.' + recipe.levelReq + '</div>';
    div.addEventListener('click', function () { selectRecipe(recipe); });
    list.appendChild(div);
  });
}

function showEmptyBench(msg) {
  $('bench').innerHTML =
    '<div class="empty-bench" id="empty-bench">' +
      '<div style="font-size:56px;opacity:0.2">' + CAT_LABEL[C.tab].icon + '</div>' +
      '<p style="font-size:13px;color:var(--txt-dim);margin-top:10px">' + esc(msg || 'Selecciona una receta de la lista') + '</p>' +
    '</div>';
}

function selectRecipe(recipe) {
  C.selected = recipe;
  C.qty = 1;
  renderRecipes();
  renderBench(recipe);
}

function renderBench(recipe) {
  var meta = CAT_LABEL[C.tab];
  var out = recipe.outputItem || {};
  var rarity = (out.rarity || 'COMMON').toUpperCase();
  var levelOk = C.char.level >= recipe.levelReq;
  var ok = canCraft(recipe);

  var maxQty = 20;
  recipe.ingredients.forEach(function (ing) {
    maxQty = Math.min(maxQty, Math.floor(have(ing.itemId) / ing.quantity) || 0);
  });
  maxQty = Math.max(1, maxQty);

  var ings = recipe.ingredients.map(function (ing) {
    var h = have(ing.itemId);
    var need = ing.quantity * C.qty;
    var good = h >= need;
    var t = ing.item || {};
    return '<div class="ing-slot ' + (good ? 'has' : 'miss') + '">' +
      '<span class="ing-check">' + (good ? '✓' : '✗') + '</span>' +
      '<div class="ing-icon">' + (t.icon || '📦') + '</div>' +
      '<div class="ing-name">' + esc(t.name || ing.itemId) + '</div>' +
      '<div class="ing-need ' + (good ? 'ok' : 'bad') + '">' + h + ' / ' + need + '</div>' +
    '</div>';
  }).join('');

  var successPct = Math.round((recipe.successRate != null ? recipe.successRate : 1) * 100);

  $('bench').innerHTML =
    '<div class="bench-header">' +
      '<div class="bench-recipe-name ' + meta.color + '">' + (out.icon || '📦') + ' ' + esc(recipe.name) + '</div>' +
      '<div class="bench-recipe-sub">' + RARITY_LABEL[rarity] + ' · Nivel ' + recipe.levelReq + ' · Produce ×' + recipe.outputQty + ' · Éxito ' + successPct + '% · +' + recipe.xp + ' EXP</div>' +
    '</div>' +
    '<div class="bench-body">' +
      '<div class="result-preview">' +
        '<div class="result-icon">' + (out.icon || '📦') + '</div>' +
        '<div class="result-info">' +
          '<div class="result-name" style="color:' + RARITY_COLOR[rarity] + '">' + esc(out.name || recipe.outputItemId) + '</div>' +
          '<div class="result-rarity" style="color:' + RARITY_COLOR[rarity] + '">' + RARITY_LABEL[rarity] + '</div>' +
          '<div class="result-stats">' + (successPct < 100 ? '<div class="stat-pill">⚠️ ' + (100 - successPct) + '% de fallo por intento</div>' : '<div class="stat-pill">Éxito garantizado</div>') + '</div>' +
          '<div class="result-desc">El servidor descuenta los materiales y decide el resultado.</div>' +
        '</div>' +
        '<div class="result-qty-badge"><div class="qty-num">×' + (recipe.outputQty * C.qty) + '</div><div class="qty-lbl">PRODUCE</div></div>' +
      '</div>' +
      '<div>' +
        '<div class="ing-title">Ingredientes necesarios</div>' +
        '<div class="ingredients">' + ings + '</div>' +
      '</div>' +
      '<div class="craft-zone">' +
        '<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:10px">' +
          '<span style="font-size:12px;color:var(--txt-dim)">Tandas</span>' +
          '<button class="craft-btn" style="padding:4px 12px;font-size:14px" onclick="changeQty(-1)">−</button>' +
          '<b style="font-family:monospace;font-size:18px">' + C.qty + '</b>' +
          '<button class="craft-btn" style="padding:4px 12px;font-size:14px" onclick="changeQty(1)">+</button>' +
          '<span style="font-size:11px;color:var(--txt-dim)">máx. ' + maxQty + '</span>' +
        '</div>' +
        '<button class="craft-btn ' + meta.btn + '" id="craft-btn" onclick="startCraft()"' + (ok ? '' : ' disabled') + '>' +
          (!levelOk ? '🔒 Requiere nivel ' + recipe.levelReq : (ok ? meta.action : '✗ Materiales insuficientes')) +
        '</button>' +
        '<div class="craft-hint"' + (ok ? '' : ' style="color:var(--red)"') + '>' +
          (ok ? 'Tienes todo lo necesario · clic para crear' : 'Consigue los ingredientes faltantes en combate o en el mercado') +
        '</div>' +
      '</div>' +
    '</div>';

  window._craftMeta = { label: meta.doing, icon: meta.icon };
}

function changeQty(d) {
  if (!C.selected) return;
  C.qty = Math.max(1, Math.min(20, C.qty + d));
  renderBench(C.selected);
}

// ── FABRICAR (el servidor decide) ──────────────────────────
async function startCraft() {
  if (!C.selected || C.busy) return;
  C.busy = true;
  var meta = window._craftMeta || { label: 'CREANDO...', icon: '⚒️' };
  $('craft-anim-icon').textContent = meta.icon;
  $('craft-label').textContent = meta.label;
  $('craft-bar').style.width = '0%';
  $('craft-overlay').classList.add('show');
  setTimeout(function () { $('craft-bar').style.width = '100%'; }, 50);

  var r = await api('/api/crafting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'craft-' + C.selected.id + '-' + Date.now() },
    body: JSON.stringify({ recipeId: C.selected.id, quantity: C.qty }),
  });

  await new Promise(function (res) { setTimeout(res, 900); });
  $('craft-overlay').classList.remove('show');
  C.busy = false;

  if (!r.ok) {
    showEmptyBench('✗ ' + (r.data.error || 'El servidor rechazó la fabricación'));
    await refreshInventory();
    renderRecipes();
    return;
  }

  var d = r.data;
  C.crafted += d.made;
  var out = C.selected.outputItem || {};

  if (d.made > 0) showFlash(out, d.made, d.failed);
  else showEmptyBench('Todos los intentos fallaron. Los materiales se consumieron igualmente.');

  (d.levelUps || []).forEach(function (lu) {
    C.log.unshift({ icon: '🎉', text: '¡Nivel ' + lu.level + '!' });
  });
  (d.questUpdates || []).forEach(function (q) {
    C.log.unshift({ icon: '📜', text: 'Misión: ' + q.current + '/' + q.required });
  });
  if (d.made) C.log.unshift({ icon: out.icon || '📦', text: esc(out.name || '') + ' ×' + d.made });
  if (d.failed) C.log.unshift({ icon: '💥', text: d.failed + ' intento(s) fallido(s)' });
  renderLog();

  var me = await api('/api/player');
  if (me.ok) C.char = me.data.character;
  await refreshInventory();
  renderHeader();
  renderRecipes();
  if (C.selected) renderBench(C.selected);
  sendToParent('REFRESH_CHARACTER', {});
}

function showFlash(out, made, failed) {
  var rarity = (out.rarity || 'COMMON').toUpperCase();
  $('rf-icon').textContent = out.icon || '📦';
  $('rf-name').textContent = (out.name || 'Objeto') + ' ×' + made;
  $('rf-rarity').textContent = RARITY_LABEL[rarity];
  $('rf-rarity').style.color = RARITY_COLOR[rarity];
  $('rf-stats').innerHTML = failed
    ? '<div class="stat-pill" style="color:var(--red)">' + failed + ' intento(s) fallido(s)</div>'
    : '<div class="stat-pill">Añadido a tu inventario</div>';
  $('result-flash').classList.add('show');
}
function closeFlash() { $('result-flash').classList.remove('show'); }

function renderLog() {
  var el = $('crafted-log-list');
  if (!el) return;
  if (!C.log.length) { el.innerHTML = '<div style="font-size:12px;color:var(--txt-dim);padding:6px 0">Sin actividad todavía.</div>'; return; }
  el.innerHTML = C.log.slice(0, 12).map(function (l) {
    return '<div style="display:flex;gap:8px;align-items:center;padding:5px 0;font-size:12px"><span>' + l.icon + '</span><span>' + l.text + '</span></div>';
  }).join('');
}

// ── INVENTARIO REAL ────────────────────────────────────────
function renderInventory(filter) {
  var body = $('inv-body');
  if (!body) return;
  var f = (filter || '').toLowerCase();
  var items = C.inventory.filter(function (i) { return !f || (i.name || '').toLowerCase().indexOf(f) >= 0; });
  if (!items.length) { body.innerHTML = '<div style="padding:14px;font-size:12px;color:var(--txt-dim)">Sin materiales.</div>'; return; }

  var needed = {};
  if (C.selected) C.selected.ingredients.forEach(function (ing) { needed[ing.itemId] = true; });

  body.innerHTML = '';
  items.forEach(function (item) {
    var div = document.createElement('div');
    var rarity = (item.rarity || 'COMMON').toUpperCase();
    div.className = 'inv-item' + (needed[item.itemId] ? ' highlight' : '');
    div.innerHTML =
      '<div class="ii-icon">' + (item.icon || '📦') + '</div>' +
      '<div class="ii-info"><div class="ii-name" style="color:' + RARITY_COLOR[rarity] + '">' + esc(item.name) + '</div>' +
      '<div class="ii-rar">' + RARITY_LABEL[rarity] + '</div></div>' +
      '<div class="ii-qty">×' + item.quantity + '</div>';
    div.addEventListener('mouseenter', function (e) { showTT(e, item); });
    div.addEventListener('mousemove', moveT);
    div.addEventListener('mouseleave', hideT);
    body.appendChild(div);
  });
}
function filterInventory(v) { renderInventory(v); }

var TT;
function showTT(e, item) {
  TT = TT || $('tooltip');
  var rarity = (item.rarity || 'COMMON').toUpperCase();
  $('tt-name').textContent = item.name;
  $('tt-rar').textContent = RARITY_LABEL[rarity];
  $('tt-rar').style.color = RARITY_COLOR[rarity];
  $('tt-stat').textContent = 'Tipo: ' + (item.type || '—');
  $('tt-qty').textContent = 'Cantidad: ×' + item.quantity;
  TT.classList.add('visible');
  moveT(e);
}
function moveT(e) {
  TT = TT || $('tooltip');
  TT.style.left = Math.min(e.clientX + 14, window.innerWidth - 210) + 'px';
  TT.style.top = Math.max(0, e.clientY - 20) + 'px';
}
function hideT() { if (TT) TT.classList.remove('visible'); }

function sendToParent(type, payload) {
  try { window.parent.postMessage({ type: type, payload: payload }, '*'); } catch (e) {}
}
window.addEventListener('message', function (event) {
  var d = event.data || {};
  if (d.type === 'CHARACTER_DATA' && d.data && d.data.character) { C.char = d.data.character; renderHeader(); }
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
