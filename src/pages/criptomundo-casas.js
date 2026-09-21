PAGES['criptomundo-casas.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Mi Casa</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --void:    #060809;
  --deep:    #090C12;
  --panel:   #0F1219;
  --card:    #161A24;
  --hover:   #1E2230;
  --gold:    #C8A84B;
  --gold2:   #F0D070;
  --gold3:   #7A6530;
  --house:   #D4721A;   /* warm amber — house accent */
  --house2:  #6A3208;
  --green:   #10B981;
  --red:     #EF4444;
  --border:  #1A1D28;
  --brim:    #2E2810;
  --txt:     #E8E0CC;
  --dim:     #7A7060;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--void);color:var(--txt);font-family:'Crimson Pro',Georgia,serif;height:100vh;overflow:hidden;
  background-image:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(212,114,26,.07) 0%,transparent 55%);}

/* ── HEADER ── */
header{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 24px;height:52px;
  background:linear-gradient(180deg,rgba(212,114,26,.1) 0%,transparent 100%);
  border-bottom:1px solid rgba(212,114,26,.2);
  position:sticky;top:0;z-index:50;backdrop-filter:blur(8px);
}
.logo{font-family:'Cinzel',serif;font-weight:900;font-size:19px;color:var(--gold);letter-spacing:3px;}
.logo em{color:var(--house);font-style:normal;}
.logo small{display:block;color:var(--dim);font-size:10px;font-weight:400;letter-spacing:2px;margin-top:-2px;}
.hdr-right{display:flex;gap:8px;align-items:center;}
.badge{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;}
.badge b{color:var(--gold);}
.badge span{color:var(--dim);font-size:9px;}

/* ── LAYOUT ── */
.layout{display:grid;grid-template-columns:260px 1fr 280px;height:calc(100vh - 52px);overflow:hidden;}
.sidebar{background:var(--panel);display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border);}
.sidebar.right{border-right:none;border-left:1px solid var(--border);}
.sec-title{font-family:'Cinzel',serif;font-size:10px;font-weight:600;color:var(--dim);letter-spacing:3px;text-transform:uppercase;
  padding:12px 16px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;}
.sec-title::before{content:'';width:3px;height:11px;background:var(--gold);border-radius:2px;flex-shrink:0;}

/* ── HOUSE CANVAS ── */
.house-main{display:flex;flex-direction:column;overflow:hidden;background:var(--deep);}
.house-toolbar{
  display:flex;align-items:center;gap:8px;padding:10px 16px;
  border-bottom:1px solid var(--border);
  background:linear-gradient(180deg,rgba(212,114,26,.05) 0%,transparent 100%);
  flex-shrink:0;
}
.tool-btn{
  background:var(--card);border:1px solid var(--border);border-radius:7px;
  padding:7px 14px;font-family:'Cinzel',serif;font-size:10px;font-weight:600;
  letter-spacing:1px;color:var(--dim);cursor:pointer;transition:all .12s;
  display:flex;align-items:center;gap:5px;
}
.tool-btn:hover{border-color:var(--gold3);color:var(--gold);}
.tool-btn.active{border-color:var(--house);color:var(--house);background:rgba(212,114,26,.06);}
.tool-sep{width:1px;height:24px;background:var(--border);}
.house-canvas-wrap{flex:1;overflow:hidden;position:relative;cursor:crosshair;}
#house-canvas{display:block;}
.canvas-hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
  font-family:'Cinzel',serif;font-size:10px;color:var(--dim);letter-spacing:2px;
  background:rgba(9,12,18,.8);border:1px solid var(--border);border-radius:5px;padding:5px 12px;
  pointer-events:none;}

/* ── FURNITURE SHOP ── */
.furniture-scroll{flex:1;overflow-y:auto;padding:8px;}
.furn-cat-label{font-family:'Cinzel',serif;font-size:9px;color:var(--dim);letter-spacing:2px;
  text-transform:uppercase;padding:8px 8px 4px;}
.furn-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:0 4px 8px;}
.furn-item{
  background:var(--card);border:1px solid var(--border);border-radius:7px;
  padding:8px;cursor:pointer;transition:all .12s;
  display:flex;flex-direction:column;align-items:center;gap:4px;
  position:relative;overflow:hidden;
}
.furn-item:hover{border-color:var(--house);background:var(--hover);transform:scale(1.02);}
.furn-item.selected{border-color:var(--house);box-shadow:0 0 8px rgba(212,114,26,.2);}
.furn-item.locked{opacity:.4;cursor:not-allowed;}
.furn-icon{font-size:26px;}
.furn-name{font-family:'Cinzel',serif;font-size:10px;color:var(--txt);text-align:center;line-height:1.3;}
.furn-cost{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--gold);}
.furn-lock-badge{position:absolute;top:4px;right:4px;font-size:9px;color:var(--dim);}

/* ── RIGHT PANEL ── */
.house-info{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}

.info-block{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:13px;}
.ib-title{font-family:'Cinzel',serif;font-size:9px;color:var(--dim);letter-spacing:2px;
  text-transform:uppercase;margin-bottom:9px;display:flex;align-items:center;gap:5px;}
.ib-title::after{content:'';flex:1;height:1px;background:var(--border);}

.house-level-badge{
  display:flex;align-items:center;justify-content:center;gap:10px;
  background:rgba(212,114,26,.06);border:1px solid rgba(212,114,26,.2);
  border-radius:8px;padding:10px;margin-bottom:8px;
}
.hl-icon{font-size:36px;filter:drop-shadow(0 0 12px rgba(212,114,26,.3));}
.hl-info{}
.hl-name{font-family:'Cinzel',serif;font-size:15px;font-weight:600;color:var(--house);}
.hl-level{font-size:11px;color:var(--dim);margin-top:2px;}

.stat-row{display:flex;justify-content:space-between;align-items:center;
  font-size:12px;color:var(--dim);padding:4px 0;border-bottom:1px solid var(--border);}
.stat-row:last-child{border:none;}
.stat-row b{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt);}
.stat-row b.gold{color:var(--gold);}
.stat-row b.green{color:var(--green);}
.stat-row b.house{color:var(--house);}

/* storage grid */
.storage-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;}
.storage-slot{
  aspect-ratio:1;background:var(--panel);border:1px solid var(--border);
  border-radius:5px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;font-size:14px;position:relative;cursor:pointer;
  transition:all .12s;
}
.storage-slot:hover{border-color:var(--gold3);background:var(--hover);}
.storage-slot.empty{opacity:.2;cursor:default;}
.slot-qty{position:absolute;bottom:1px;right:3px;font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--dim);}

/* upgrade btn */
.upgrade-btn{
  width:100%;padding:11px;font-family:'Cinzel',serif;font-size:13px;font-weight:600;
  letter-spacing:2px;background:linear-gradient(135deg,var(--house2),var(--house));
  border:none;border-radius:8px;color:#fff;cursor:pointer;transition:all .2s;
}
.upgrade-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(212,114,26,.35);}
.upgrade-btn:disabled{opacity:.35;cursor:not-allowed;}

/* place confirm */
.place-confirm{
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  background:var(--panel);border:1px solid var(--house);
  border-radius:9px;padding:10px 20px;
  display:flex;align-items:center;gap:12px;
  font-family:'Cinzel',serif;font-size:12px;color:var(--house);
  box-shadow:0 8px 24px rgba(0,0,0,.7);
  opacity:0;pointer-events:none;transition:all .3s;z-index:100;
}
.place-confirm.show{opacity:1;pointer-events:all;}
.pc-icon{font-size:20px;}
.pc-btn{
  background:rgba(212,114,26,.2);border:1px solid var(--house);
  border-radius:5px;padding:4px 12px;font-family:'Cinzel',serif;
  font-size:10px;color:var(--house);cursor:pointer;letter-spacing:1px;
  transition:all .12s;
}
.pc-btn:hover{background:rgba(212,114,26,.35);}
.pc-btn.cancel{border-color:var(--dim);color:var(--dim);}
.pc-btn.cancel:hover{background:rgba(122,112,96,.2);}

/* toast */
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);
  background:var(--panel);border:1px solid var(--house);border-radius:8px;
  padding:9px 20px;font-family:'Cinzel',serif;font-size:12px;color:var(--house);
  box-shadow:0 8px 24px rgba(0,0,0,.7);opacity:0;pointer-events:none;
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
  <div class="logo">CRIPTO<em>MUNDO</em><small>MI CASA</small></div>
  <div class="hdr-right">
    <div class="badge"><span>🏠</span><b id="house-lvl-badge">Cabaña Nv.2</b></div>
    <div class="badge"><span>📦</span><b id="storage-badge">18/25</b><span>ALMACENAMIENTO</span></div>
    <div class="badge"><span>🪙</span><b id="gold-badge">1,240</b><span>ORO</span></div>
  </div>
</header>

<div class="layout">

  <!-- LEFT: Furniture shop -->
  <aside class="sidebar">
    <div class="sec-title">Tienda de Muebles</div>
    <div class="furniture-scroll" id="furn-scroll"></div>
  </aside>

  <!-- CENTER: House canvas -->
  <main class="house-main">
    <div class="house-toolbar">
      <button class="tool-btn active" id="tool-move"   onclick="setTool('move')">  ✋ Mover</button>
      <button class="tool-btn"        id="tool-place"  onclick="setTool('place')"> ➕ Colocar</button>
      <button class="tool-btn"        id="tool-remove" onclick="setTool('remove')">🗑️ Eliminar</button>
      <div class="tool-sep"></div>
      <button class="tool-btn" onclick="clearAll()">🔄 Limpiar</button>
      <button class="tool-btn" onclick="saveLayout()" style="margin-left:auto;border-color:var(--gold3);color:var(--gold)">💾 Guardar</button>
    </div>
    <div class="house-canvas-wrap" id="canvas-wrap">
      <canvas id="house-canvas"></canvas>
      <div class="canvas-hint" id="canvas-hint">Selecciona un mueble y haz clic para colocarlo</div>
    </div>
  </main>

  <!-- RIGHT: House info & storage -->
  <aside class="sidebar right">
    <div class="sec-title">Mi Casa</div>
    <div class="house-info" id="house-info"></div>
  </aside>

</div>

<!-- Place confirm bar -->
<div class="place-confirm" id="place-confirm">
  <span class="pc-icon" id="pc-icon">🛋️</span>
  <span id="pc-text">Clic para colocar</span>
  <button class="pc-btn cancel" onclick="cancelPlace()">Cancelar</button>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// ─── DATA ─────────────────────────────────────────
const HOUSE_LEVELS = [
  { level:1, name:'Tienda de Campaña',  icon:'⛺', rooms:1, slots:10, cost:0,    storageSlots:10, unlocks:[]  },
  { level:2, name:'Cabaña de Madera',   icon:'🏚️', rooms:2, slots:20, cost:500,  storageSlots:25, unlocks:['bed','table','fireplace'] },
  { level:3, name:'Casa de Piedra',     icon:'🏠', rooms:3, slots:30, cost:2000, storageSlots:50, unlocks:['shelf','chest','crafting_table'] },
  { level:4, name:'Mansión',            icon:'🏡', rooms:4, slots:45, cost:8000, storageSlots:100,unlocks:['vault','trophy','garden'] },
  { level:5, name:'Castillo Personal',  icon:'🏰', rooms:6, slots:64, cost:25000,storageSlots:200,unlocks:['throne','fountain','dungeon_portal'] },
]

const FURNITURE = [
  // Basic
  { id:'bed',       icon:'🛏️', name:'Cama',             cat:'Básico',    cost:80,   w:2,h:2, color:'#5A4020', level:2 },
  { id:'table',     icon:'🪑', name:'Mesa y Sillas',    cat:'Básico',    cost:60,   w:2,h:2, color:'#6A4A18', level:2 },
  { id:'fireplace', icon:'🔥', name:'Chimenea',         cat:'Básico',    cost:150,  w:1,h:2, color:'#8B3010', level:2 },
  { id:'chest',     icon:'📦', name:'Cofre',            cat:'Básico',    cost:200,  w:1,h:1, color:'#8B6A20', level:3 },
  { id:'shelf',     icon:'📚', name:'Estantería',       cat:'Básico',    cost:100,  w:2,h:1, color:'#5A3A10', level:3 },
  { id:'carpet',    icon:'🟫', name:'Alfombra',         cat:'Básico',    cost:40,   w:3,h:2, color:'#6A3A1A', level:2 },
  // Crafting
  { id:'crafting_table',icon:'⚒️',name:'Mesa de Forja', cat:'Artesanía', cost:350,  w:2,h:2, color:'#4A3010', level:3 },
  { id:'alchemy_lab',   icon:'🧪',name:'Lab. Alquimia', cat:'Artesanía', cost:400,  w:2,h:2, color:'#1A3A4A', level:3 },
  { id:'kitchen',       icon:'🍳',name:'Cocina',        cat:'Artesanía', cost:300,  w:3,h:2, color:'#4A2A10', level:3 },
  // Decoration
  { id:'trophy',   icon:'🏆', name:'Vitrina Trofeos',  cat:'Decoración', cost:500,  w:2,h:2, color:'#6A5010', level:4 },
  { id:'painting', icon:'🖼️', name:'Pintura',          cat:'Decoración', cost:120,  w:1,h:1, color:'#2A1A3A', level:2 },
  { id:'statue',   icon:'🗿', name:'Estatua',           cat:'Decoración', cost:800,  w:1,h:2, color:'#3A3A3A', level:3 },
  { id:'garden',   icon:'🌸', name:'Jardín Interior',  cat:'Decoración', cost:600,  w:3,h:3, color:'#1A3A14', level:4 },
  { id:'fountain', icon:'⛲', name:'Fuente',            cat:'Especial',   cost:2000, w:3,h:3, color:'#1A2A4A', level:5 },
  { id:'vault',    icon:'🔐', name:'Bóveda Secreta',   cat:'Especial',   cost:5000, w:2,h:2, color:'#2A1A08', level:4 },
  { id:'throne',   icon:'👑', name:'Trono',            cat:'Especial',   cost:10000,w:2,h:3, color:'#6A4A08', level:5 },
  { id:'dungeon_portal',icon:'🌀',name:'Portal Mazmorra',cat:'Especial', cost:15000,w:2,h:2, color:'#1A0A2A', level:5 },
]

// ─── STATE ────────────────────────────────────────
const STATE = {
  houseLevel: 1,
  gold: 0,
  owned: [],
  busy: false,
  placed: [],         // {id, furniture, gridX, gridY, color}
  selectedFurn: null,
  tool: 'move',
  dragging: null,
  dragOffX: 0,
  dragOffY: 0,
  storage: [
    {icon:'⚔️',qty:2},{icon:'🧪',qty:8},{icon:'🪨',qty:12},{icon:'💎',qty:2},
    {icon:'✨',qty:9},{icon:'🍞',qty:5},{icon:'🏹',qty:1},{icon:'💊',qty:4},
    {icon:'🔮',qty:1},{icon:'🛡️',qty:1},{icon:'🌿',qty:15},{icon:'💧',qty:20},
    {icon:'🍄',qty:3},{icon:'🥩',qty:7},{icon:'🌾',qty:10},{icon:'🥕',qty:6},
    {icon:'🧶',qty:5},{icon:'🪵',qty:8},
  ],
}

// ─── CANVAS SETUP ────────────────────────────────
const canvas = document.getElementById('house-canvas')
const ctx    = canvas.getContext('2d')
const TILE   = 48

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap')
  canvas.width  = wrap.clientWidth
  canvas.height = wrap.clientHeight
  draw()
}

// Grid dimensions
function gridCols() { return Math.floor(canvas.width  / TILE) }
function gridRows() { return Math.floor((canvas.height) / TILE) }

// ─── DRAW ─────────────────────────────────────────
function draw() {
  const W = canvas.width, H = canvas.height
  const houseData = HOUSE_LEVELS[STATE.houseLevel - 1]

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = '#0A0C10'
  ctx.fillRect(0, 0, W, H)

  // House footprint (limited by level)
  const maxCols = Math.min(gridCols(), houseData.rooms * 4 + 4)
  const maxRows = Math.min(gridRows(), houseData.rooms * 3 + 2)
  const offX = Math.floor((gridCols() - maxCols) / 2) * TILE
  const offY = Math.floor((gridRows() - maxRows) / 2) * TILE

  // Floor
  ctx.fillStyle = '#1A1410'
  ctx.fillRect(offX, offY, maxCols * TILE, maxRows * TILE)

  // Floor tiles pattern
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const x = offX + c * TILE, y = offY + r * TILE
      ctx.fillStyle = (r + c) % 2 === 0 ? '#1E1810' : '#161208'
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
    }
  }

  // Grid lines inside house
  ctx.strokeStyle = 'rgba(200,168,75,0.08)'
  ctx.lineWidth = 1
  for (let c = 0; c <= maxCols; c++) {
    ctx.beginPath()
    ctx.moveTo(offX + c * TILE, offY)
    ctx.lineTo(offX + c * TILE, offY + maxRows * TILE)
    ctx.stroke()
  }
  for (let r = 0; r <= maxRows; r++) {
    ctx.beginPath()
    ctx.moveTo(offX, offY + r * TILE)
    ctx.lineTo(offX + maxCols * TILE, offY + r * TILE)
    ctx.stroke()
  }

  // Walls
  ctx.strokeStyle = 'rgba(200,168,75,0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(offX, offY, maxCols * TILE, maxRows * TILE)

  // Door
  const doorX = offX + Math.floor(maxCols / 2) * TILE
  ctx.fillStyle = '#6A3A10'
  ctx.fillRect(doorX, offY + maxRows * TILE - TILE + 4, TILE, TILE - 4)
  ctx.font = \`\${TILE - 8}px serif\`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🚪', doorX + TILE/2, offY + maxRows * TILE - TILE/2 + 2)

  // Outside (darkened)
  ctx.fillStyle = 'rgba(5,7,10,0.7)'
  ctx.fillRect(0, 0, offX, H)
  ctx.fillRect(offX + maxCols * TILE, 0, W - (offX + maxCols * TILE), H)
  ctx.fillRect(0, 0, W, offY)
  ctx.fillRect(0, offY + maxRows * TILE, W, H - (offY + maxRows * TILE))

  // Store offsets for click mapping
  STATE.offX = offX
  STATE.offY = offY
  STATE.maxCols = maxCols
  STATE.maxRows = maxRows

  // Placed furniture
  STATE.placed.forEach((item, idx) => {
    const px = offX + item.gridX * TILE
    const py = offY + item.gridY * TILE
    const pw = item.furniture.w * TILE
    const ph = item.furniture.h * TILE

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(px + 4, py + 4, pw, ph)

    // Body
    ctx.fillStyle = item.furniture.color
    ctx.beginPath()
    const r = 5
    ctx.roundRect(px, py, pw, ph, r)
    ctx.fill()

    // Border
    ctx.strokeStyle = STATE.dragging?.idx === idx ? '#C8A84B' : 'rgba(200,168,75,0.2)'
    ctx.lineWidth = STATE.dragging?.idx === idx ? 2 : 1
    ctx.stroke()

    // Icon
    ctx.font = \`\${Math.min(pw, ph) * 0.55}px serif\`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.furniture.icon, px + pw/2, py + ph/2)

    // Remove X in remove mode
    if (STATE.tool === 'remove') {
      ctx.fillStyle = 'rgba(239,68,68,0.8)'
      ctx.beginPath()
      ctx.arc(px + pw - 6, py + 6, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px Cinzel'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('×', px + pw - 6, py + 6)
    }
  })

  // Ghost preview while placing
  if (STATE.tool === 'place' && STATE.selectedFurn && STATE.ghostX !== undefined) {
    const f  = STATE.selectedFurn
    const px = STATE.offX + STATE.ghostX * TILE
    const py = STATE.offY + STATE.ghostY * TILE
    ctx.fillStyle = STATE.ghostValid ? 'rgba(212,114,26,0.3)' : 'rgba(239,68,68,0.3)'
    ctx.strokeStyle = STATE.ghostValid ? '#D4721A' : '#EF4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(px, py, f.w * TILE, f.h * TILE, 5)
    ctx.fill()
    ctx.stroke()
    ctx.font = \`\${Math.min(f.w, f.h) * TILE * 0.5}px serif\`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.icon, px + f.w * TILE / 2, py + f.h * TILE / 2)
  }

  ctx.textBaseline = 'alphabetic'
}

// ─── TOOLS ────────────────────────────────────────
function setTool(t) {
  STATE.tool = t
  document.querySelectorAll('.tool-btn[id^="tool-"]').forEach(b => b.classList.remove('active'))
  document.getElementById(\`tool-\${t}\`)?.classList.add('active')
  canvas.style.cursor = t === 'remove' ? 'no-drop' : t === 'place' ? 'crosshair' : 'grab'
  if (t !== 'place') { STATE.selectedFurn = null; hidePlaceConfirm() }
  draw()
}

// ─── FURNITURE SELECTION ─────────────────────────
function selectFurniture(furn) {
  if (furn.level > STATE.houseLevel) { showToast(\`🔒 Requiere Casa Nv.\${furn.level}\`); return }
  if (STATE.gold < furn.cost) { showToast('🪙 Oro insuficiente', ''); return }
  STATE.selectedFurn = furn
  STATE.tool = 'place'
  document.querySelectorAll('.tool-btn[id^="tool-"]').forEach(b => b.classList.remove('active'))
  document.getElementById('tool-place')?.classList.add('active')
  document.querySelectorAll('.furn-item').forEach(el => el.classList.remove('selected'))
  document.querySelector(\`.furn-item[data-id="\${furn.id}"]\`)?.classList.add('selected')
  showPlaceConfirm(furn)
  draw()
}

function showPlaceConfirm(furn) {
  document.getElementById('pc-icon').textContent = furn.icon
  document.getElementById('pc-text').textContent = \`Colocar: \${furn.name} — 🪙 \${furn.cost}\`
  document.getElementById('place-confirm').classList.add('show')
}
function hidePlaceConfirm() { document.getElementById('place-confirm').classList.remove('show') }
function cancelPlace() { STATE.selectedFurn = null; setTool('move'); hidePlaceConfirm() }

// ─── CANVAS EVENTS ───────────────────────────────
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const gx = Math.floor((mx - STATE.offX) / TILE)
  const gy = Math.floor((my - STATE.offY) / TILE)

  if (STATE.tool === 'place' && STATE.selectedFurn) {
    STATE.ghostX = gx
    STATE.ghostY = gy
    STATE.ghostValid = isValidPlacement(gx, gy, STATE.selectedFurn, -1)
    draw()
  }

  if (STATE.dragging && STATE.tool === 'move') {
    const newGx = Math.round((mx - STATE.offX) / TILE - STATE.dragging.fw / 2)
    const newGy = Math.round((my - STATE.offY) / TILE - STATE.dragging.fh / 2)
    const item  = STATE.placed[STATE.dragging.idx]
    if (item && isValidPlacement(newGx, newGy, item.furniture, STATE.dragging.idx)) {
      item.gridX = newGx
      item.gridY = newGy
    }
    draw()
  }
})

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const gx = Math.floor((mx - STATE.offX) / TILE)
  const gy = Math.floor((my - STATE.offY) / TILE)

  if (STATE.tool === 'place' && STATE.selectedFurn) {
    if (isValidPlacement(gx, gy, STATE.selectedFurn, -1) && isInsideHouse(gx, gy, STATE.selectedFurn)) {
      placeFurniture(gx, gy, STATE.selectedFurn)
    } else {
      showToast('⚠️ No se puede colocar ahí')
    }
    return
  }

  if (STATE.tool === 'move') {
    for (let i = STATE.placed.length - 1; i >= 0; i--) {
      const item = STATE.placed[i]
      if (gx >= item.gridX && gx < item.gridX + item.furniture.w &&
          gy >= item.gridY && gy < item.gridY + item.furniture.h) {
        STATE.dragging = { idx: i, fw: item.furniture.w, fh: item.furniture.h }
        canvas.style.cursor = 'grabbing'
        break
      }
    }
  }

  if (STATE.tool === 'remove') {
    for (let i = STATE.placed.length - 1; i >= 0; i--) {
      const item = STATE.placed[i]
      if (gx >= item.gridX && gx < item.gridX + item.furniture.w &&
          gy >= item.gridY && gy < item.gridY + item.furniture.h) {
        const refund = Math.floor(item.furniture.cost * 0.5)
        STATE.gold += refund
        STATE.placed.splice(i, 1)
        document.getElementById('gold-badge').textContent = STATE.gold.toLocaleString()
        showToast(\`🔄 Eliminado. Reembolso: 🪙 \${refund}\`, 'green')
        draw(); updateRightPanel()
        break
      }
    }
  }
})

canvas.addEventListener('mouseup', () => {
  STATE.dragging = null
  canvas.style.cursor = STATE.tool === 'remove' ? 'no-drop' : STATE.tool === 'place' ? 'crosshair' : 'grab'
  draw()
})

canvas.addEventListener('mouseleave', () => {
  STATE.ghostX = undefined
  STATE.dragging = null
  draw()
})

// ─── PLACEMENT LOGIC ─────────────────────────────
function isInsideHouse(gx, gy, furn) {
  return gx >= 0 && gy >= 0 &&
    gx + furn.w <= STATE.maxCols &&
    gy + furn.h <= STATE.maxRows - 1  // leave bottom row for door
}

function isValidPlacement(gx, gy, furn, skipIdx) {
  if (!isInsideHouse(gx, gy, furn)) return false
  for (let i = 0; i < STATE.placed.length; i++) {
    if (i === skipIdx) continue
    const p = STATE.placed[i]
    if (gx < p.gridX + p.furniture.w && gx + furn.w > p.gridX &&
        gy < p.gridY + p.furniture.h && gy + furn.h > p.gridY) return false
  }
  return true
}

async function placeFurniture(gx, gy, furn) {
  if (STATE.busy) return
  STATE.busy = true
  // El precio y el cobro los decide el servidor: se coloca solo si acepta la compra
  const tentative = STATE.placed.concat([{ id: Date.now(), furniture: furn, gridX: gx, gridY: gy }])
  const r = await apiPost('/api/house', {
    action: 'buy', furnitureId: furn.id,
    placed: tentative.map(p => ({ furnitureId: p.furniture.id, gridX: p.gridX, gridY: p.gridY })),
  })
  STATE.busy = false
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'Compra rechazada'), 'red'); return }
  STATE.gold = r.data.newGold
  STATE.owned = r.data.owned || STATE.owned
  STATE.placed = tentative
  document.getElementById('gold-badge').textContent = STATE.gold.toLocaleString()
  showToast('✅ ' + furn.icon + ' ' + furn.name + ' colocado (🪙' + r.data.cost.toLocaleString() + ')', 'green')
  addLog('Colocaste: ' + furn.name)
  draw(); updateRightPanel(); renderFurnitureShop()
  sendToParent('REFRESH_CHARACTER', {})
}

async function clearAll() {
  if (!confirm('¿Quitar todos los muebles del diseño? No hay reembolso: los muebles comprados siguen siendo tuyos y puedes volver a colocarlos.')) return
  STATE.placed = []
  await apiPost('/api/house', { action: 'save', placed: [] })
  showToast('🔄 Diseño vaciado')
  draw(); updateRightPanel(); renderFurnitureShop()
}

async function saveLayout() {
  const r = await apiPost('/api/house', {
    action: 'save',
    placed: STATE.placed.map(p => ({ furnitureId: p.furniture.id, gridX: p.gridX, gridY: p.gridY })),
  })
  if (r.ok) showToast('💾 Diseño guardado (' + (r.data.placed || []).length + ' muebles)', 'green')
  else showToast('✗ ' + (r.data.error || 'No se pudo guardar'), 'red')
}

// ─── UPGRADE ─────────────────────────────────────
async function upgradeHouse() {
  if (STATE.busy) return
  STATE.busy = true
  const r = await apiPost('/api/house', { action: 'upgrade' })
  STATE.busy = false
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo mejorar'), 'red'); return }
  STATE.gold = r.data.newGold
  STATE.houseLevel = r.data.newLevel
  const lvl = HOUSE_LEVELS[Math.min(HOUSE_LEVELS.length, STATE.houseLevel) - 1]
  document.getElementById('gold-badge').textContent = STATE.gold.toLocaleString()
  document.getElementById('house-lvl-badge').textContent = (lvl ? lvl.name : 'Casa') + ' Nv.' + STATE.houseLevel
  showToast('🏠 ¡Casa mejorada a nivel ' + STATE.houseLevel + '!', 'green')
  draw(); updateRightPanel(); renderFurnitureShop()
  sendToParent('REFRESH_CHARACTER', {})
}

// ─── FURNITURE SHOP RENDER ────────────────────────
function renderFurnitureShop() {
  const cats = {}
  FURNITURE.forEach(f => { if (!cats[f.cat]) cats[f.cat] = []; cats[f.cat].push(f) })
  const scroll = document.getElementById('furn-scroll')
  scroll.innerHTML = ''
  Object.entries(cats).forEach(([cat, items]) => {
    const lbl = document.createElement('div')
    lbl.className = 'furn-cat-label'
    lbl.textContent = cat
    scroll.appendChild(lbl)
    const grid = document.createElement('div')
    grid.className = 'furn-grid'
    items.forEach(f => {
      const locked = f.level > STATE.houseLevel
      const div = document.createElement('div')
      div.className = \`furn-item \${locked ? 'locked' : ''} \${STATE.selectedFurn?.id === f.id ? 'selected' : ''}\`
      div.dataset.id = f.id
      div.innerHTML = \`
        <div class="furn-icon">\${f.icon}</div>
        <div class="furn-name">\${f.name}</div>
        <div class="furn-cost">\${locked ? \`🔒 Nv.\${f.level}\` : \`🪙 \${f.cost.toLocaleString()}\`}</div>\`
      if (!locked) div.addEventListener('click', () => selectFurniture(f))
      grid.appendChild(div)
    })
    scroll.appendChild(grid)
  })
}

// ─── RIGHT PANEL ──────────────────────────────────
const logEntries = []
function addLog(msg) { logEntries.unshift(msg); if (logEntries.length > 6) logEntries.pop(); updateRightPanel() }

function updateRightPanel() {
  const hd   = HOUSE_LEVELS[STATE.houseLevel - 1]
  const next = HOUSE_LEVELS[STATE.houseLevel]
  const usedSlots = STATE.placed.reduce((s, p) => s + p.furniture.w * p.furniture.h, 0)
  const maxSlots  = hd.slots
  const storageUsed = STATE.storage.length
  const storageMax  = hd.storageSlots
  document.getElementById('storage-badge').textContent = \`\${storageUsed}/\${storageMax}\`

  const rc = document.getElementById('house-info')
  rc.innerHTML = ''

  // House overview
  const overview = document.createElement('div')
  overview.className = 'info-block'
  overview.innerHTML = \`
    <div class="ib-title">Tu Hogar</div>
    <div class="house-level-badge">
      <div class="hl-icon">\${hd.icon}</div>
      <div class="hl-info">
        <div class="hl-name">\${hd.name}</div>
        <div class="hl-level">Nivel \${STATE.houseLevel} de \${HOUSE_LEVELS.length}</div>
      </div>
    </div>
    <div class="stat-row"><span>Habitaciones</span><b class="house">\${hd.rooms}</b></div>
    <div class="stat-row"><span>Espacio usado</span><b>\${usedSlots} / \${maxSlots} tiles</b></div>
    <div class="stat-row"><span>Muebles colocados</span><b class="house">\${STATE.placed.length}</b></div>
    <div class="stat-row"><span>Almacenamiento</span><b>\${storageUsed} / \${storageMax} ítems</b></div>
    \${next ? \`
    <button class="upgrade-btn" onclick="upgradeHouse()" style="margin-top:10px"
      \${STATE.gold < next.cost ? 'disabled' : ''}>
      ⬆️ Mejorar → \${next.name} (🪙\${next.cost.toLocaleString()})
    </button>\` : \`<div style="text-align:center;color:var(--gold);font-family:'Cinzel',serif;font-size:11px;margin-top:8px;padding:8px;border:1px solid var(--gold3);border-radius:6px">🏰 ¡Nivel Máximo!</div>\`}\`
  rc.appendChild(overview)

  // Storage
  const storageBlock = document.createElement('div')
  storageBlock.className = 'info-block'
  storageBlock.innerHTML = \`<div class="ib-title">Almacenamiento (\${storageUsed}/\${storageMax})</div>\`
  const grid = document.createElement('div')
  grid.className = 'storage-grid'
  for (let i = 0; i < Math.min(storageMax, 20); i++) {
    const item = STATE.storage[i]
    const slot = document.createElement('div')
    slot.className = \`storage-slot \${!item ? 'empty' : ''}\`
    slot.innerHTML = item
      ? \`\${item.icon}<div class="slot-qty">×\${item.qty}</div>\`
      : ''
    grid.appendChild(slot)
  }
  storageBlock.appendChild(grid)
  if (storageMax > 20) {
    const more = document.createElement('div')
    more.style.cssText = 'font-size:11px;color:var(--dim);text-align:center;margin-top:6px;'
    more.textContent = \`+ \${storageMax - 20} slots más disponibles\`
    storageBlock.appendChild(more)
  }
  rc.appendChild(storageBlock)

  // Activity log
  if (logEntries.length) {
    const logBlock = document.createElement('div')
    logBlock.className = 'info-block'
    logBlock.innerHTML = \`<div class="ib-title">Actividad</div>\` +
      logEntries.map(e => \`<div style="font-size:12px;color:var(--dim);padding:3px 0;border-bottom:1px solid var(--border)">🏠 \${e}</div>\`).join('')
    rc.appendChild(logBlock)
  }
}

// ─── TOAST ────────────────────────────────────────
function showToast(msg, type='') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className   = \`toast \${type} show\`
  setTimeout(() => t.classList.remove('show'), 3000)
}

// ─── POSTMESSAGE BRIDGE ───────────────────────────
async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'house-' + Date.now() + '-' + Math.random().toString(36).slice(2) },
    body: JSON.stringify(body),
  })
  let data = {}
  try { data = await res.json() } catch (e) {}
  return { ok: res.ok, data }
}
async function apiGet(path) {
  const res = await fetch(path, { credentials: 'include' })
  let data = {}
  try { data = await res.json() } catch (e) {}
  return { ok: res.ok, data }
}

async function loadHouse() {
  const me = await apiGet('/api/player')
  if (!me.ok) { showToast('Inicia sesión para editar tu casa', 'red'); return }
  STATE.gold = me.data.character.gold
  const h = await apiGet('/api/house')
  if (h.ok) {
    STATE.houseLevel = h.data.house.level || 1
    STATE.owned = h.data.house.owned || []
    STATE.placed = (h.data.house.placed || []).map(x => {
      const furn = FURNITURE.find(f => f.id === (x.furnitureId || x.id))
      return furn ? { id: Date.now() + Math.random(), furniture: furn, gridX: x.gridX || 0, gridY: x.gridY || 0 } : null
    }).filter(Boolean)
  }
  const lvl = HOUSE_LEVELS[Math.min(HOUSE_LEVELS.length, STATE.houseLevel) - 1]
  document.getElementById('gold-badge').textContent = STATE.gold.toLocaleString()
  document.getElementById('house-lvl-badge').textContent = (lvl ? lvl.name : 'Casa') + ' Nv.' + STATE.houseLevel
  draw(); updateRightPanel(); renderFurnitureShop()
}

function sendToParent(type, payload) {
  window.parent.postMessage({ type, payload }, '*')
}

window.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  if (type === 'CHARACTER_DATA' && data?.character) {
    const c = data.character
    STATE.gold = c.gold ?? STATE.gold
    document.getElementById('gold-badge').textContent = STATE.gold.toLocaleString()
    renderFurnitureShop()
    updateRightPanel()
  }
})

window.addEventListener('load', loadHouse)

// ─── INIT ─────────────────────────────────────────
window.addEventListener('resize', resizeCanvas)
resizeCanvas()
renderFurnitureShop()
updateRightPanel()

// El diseño inicial ya no es de ejemplo: loadHouse() lo trae del servidor.
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
