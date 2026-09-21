PAGES['criptomundo-misiones.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Misiones & NPCs</title>
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
  --quest:      #8B5CF6;   /* purple — quest accent */
  --quest-dim:  #3B1F6E;
  --npc-green:  #10B981;
  --npc-dim:    #064830;
  --warn:       #F59E0B;
  --red:        #EF4444;
  --red-dim:    #5A1010;
  --border:     #1E2130;
  --border-gold:#4A3A18;
  --txt:        #E8E0CC;
  --txt-dim:    #8A8070;
  --common:    #9D9D9D;
  --uncommon:  #1EFF00;
  --rare:      #4090F0;
  --epic:      #A335EE;
  --legendary: #FF8000;
}
*{margin:0;padding:0;box-sizing:border-box;}
body {
  background:var(--void); color:var(--txt);
  font-family:'Crimson Pro',Georgia,serif;
  min-height:100vh;
  background-image:
    radial-gradient(ellipse 70% 40% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 60%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238B5CF6' fill-opacity='0.015'%3E%3Cpath d='M30 5L35 20H50L38 29L43 44L30 35L17 44L22 29L10 20H25Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── HEADER ── */
header {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 24px;
  background:linear-gradient(180deg,rgba(139,92,246,0.1) 0%,transparent 100%);
  border-bottom:1px solid var(--border-gold);
  position:sticky; top:0; z-index:50;
  backdrop-filter:blur(8px);
}
.logo { font-family:'Cinzel',serif; font-weight:900; font-size:20px; color:var(--gold); letter-spacing:3px; }
.logo em { color:var(--quest); font-style:normal; }
.logo small { display:block; color:var(--txt-dim); font-size:11px; font-weight:400; letter-spacing:2px; margin-top:-2px; }
.hdr-right { display:flex; gap:10px; align-items:center; }
.badge {
  display:flex; align-items:center; gap:6px;
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:5px 12px;
  font-family:'JetBrains Mono',monospace; font-size:12px;
}
.badge b { color:var(--gold); }
.badge.purple b { color:var(--quest); }
.badge span { color:var(--txt-dim); font-size:10px; }

/* ── LAYOUT ── */
.layout {
  display:grid;
  grid-template-columns:280px 1fr 320px;
  height:calc(100vh - 52px);
  overflow:hidden;
}

/* ── PANELS ── */
.sidebar {
  background:var(--panel);
  display:flex; flex-direction:column; overflow:hidden;
  border-right:1px solid var(--border);
}
.sidebar.right { border-right:none; border-left:1px solid var(--border); }

.sec-head {
  font-family:'Cinzel',serif; font-size:10px; font-weight:600;
  color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase;
  padding:13px 16px 10px;
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:8px; justify-content:space-between;
}
.sec-head::before { content:''; width:3px; height:11px; background:var(--gold); border-radius:2px; flex-shrink:0; }

/* ── NPC LIST ── */
.npc-scroll { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px; }

.npc-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; padding:12px;
  cursor:pointer; transition:all 0.15s;
  display:flex; gap:12px; align-items:center;
  position:relative; overflow:hidden;
}
.npc-card::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
  background:var(--npc-color, var(--npc-green));
  transform:scaleY(0); transform-origin:center;
  transition:transform 0.15s; border-radius:3px 0 0 3px;
}
.npc-card:hover::before, .npc-card.selected::before { transform:scaleY(1); }
.npc-card:hover { border-color:var(--border-gold); background:var(--hover); }
.npc-card.selected { border-color:var(--npc-color, var(--npc-green)); }
.npc-avatar { font-size:36px; flex-shrink:0; position:relative; }
.npc-badge {
  position:absolute; top:-4px; right:-4px;
  background:var(--quest); color:#fff;
  font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:600;
  border-radius:8px; padding:1px 5px; min-width:16px; text-align:center;
  border:2px solid var(--panel);
}
.npc-badge.zero { background:var(--border); color:var(--txt-dim); }
.npc-info { flex:1; min-width:0; }
.npc-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; color:var(--txt); }
.npc-role { font-size:11px; color:var(--txt-dim); margin-top:1px; }
.npc-loc  { font-size:10px; color:var(--quest); margin-top:3px; }
.npc-status { font-size:10px; margin-top:2px; }
.npc-status.ready { color:var(--npc-green); }
.npc-status.busy  { color:var(--warn); }

/* zone filter */
.zone-tabs { display:flex; gap:4px; padding:8px 10px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.zone-tab {
  background:none; border:1px solid var(--border); border-radius:4px;
  padding:3px 8px; font-size:10px; color:var(--txt-dim); cursor:pointer;
  font-family:'Cinzel',serif; letter-spacing:0.5px; transition:all 0.12s;
}
.zone-tab:hover,.zone-tab.active { background:var(--hover); border-color:var(--quest); color:var(--quest); }

/* ── CENTER: NPC DIALOG + QUEST LIST ── */
.center {
  display:flex; flex-direction:column; overflow:hidden;
  background:var(--deep);
}

/* Dialog box */
.dialog-box {
  flex:0 0 auto;
  padding:20px;
  border-bottom:1px solid var(--border);
  background:linear-gradient(180deg,rgba(139,92,246,0.06) 0%,transparent 100%);
  min-height:180px;
  display:flex; gap:16px; align-items:flex-start;
}
.dialog-npc-portrait {
  flex-shrink:0; width:80px; height:80px;
  background:var(--card); border:2px solid var(--border-gold);
  border-radius:12px; display:flex; align-items:center; justify-content:center;
  font-size:44px; position:relative;
}
.dialog-npc-portrait .portrait-glow {
  position:absolute; inset:-1px; border-radius:12px;
  background:linear-gradient(135deg,rgba(139,92,246,0.3),transparent 60%);
  pointer-events:none;
}
.dialog-content { flex:1; }
.dialog-npc-name { font-family:'Cinzel',serif; font-size:14px; font-weight:600; color:var(--quest); margin-bottom:6px; }
.dialog-bubble {
  background:var(--card); border:1px solid var(--border);
  border-radius:0 10px 10px 10px; padding:12px 14px;
  font-size:14px; line-height:1.7; color:var(--txt);
  position:relative; min-height:60px;
}
.dialog-bubble::before {
  content:''; position:absolute; left:-8px; top:10px;
  border:8px solid transparent;
  border-right-color:var(--border);
}
.dialog-bubble::after {
  content:''; position:absolute; left:-6px; top:11px;
  border:7px solid transparent;
  border-right-color:var(--card);
}
.dialog-cursor {
  display:inline-block; width:2px; height:14px;
  background:var(--quest); margin-left:2px; vertical-align:middle;
  animation:blink 0.8s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.dialog-choices { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
.dialog-choice {
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:6px 12px; font-size:12px; color:var(--txt-dim);
  cursor:pointer; transition:all 0.12s; font-family:'Cinzel',serif; letter-spacing:0.5px;
}
.dialog-choice:hover { border-color:var(--quest); color:var(--quest); background:var(--hover); }

/* Quest list tabs */
.quest-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
.qtab {
  flex:1; padding:9px 4px; font-family:'Cinzel',serif; font-size:10px;
  letter-spacing:1px; text-transform:uppercase; cursor:pointer;
  background:none; border:none; color:var(--txt-dim);
  border-bottom:2px solid transparent; transition:all 0.15s;
  display:flex; flex-direction:column; align-items:center; gap:2px;
}
.qtab .qt-icon { font-size:16px; }
.qtab:hover { color:var(--txt); background:var(--hover); }
.qtab.active { color:var(--quest); border-bottom-color:var(--quest); }

/* Quest cards */
.quest-scroll { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }

.quest-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; overflow:hidden; cursor:pointer;
  transition:all 0.15s; position:relative;
}
.quest-card:hover { border-color:var(--border-gold); }
.quest-card.selected { border-color:var(--quest); box-shadow:0 0 0 1px rgba(139,92,246,0.3); }
.quest-card.completed { opacity:0.6; }

.quest-type-bar { height:3px; }
.qc-body { padding:12px; }
.qc-top { display:flex; align-items:flex-start; gap:10px; }
.qc-icon { font-size:28px; flex-shrink:0; }
.qc-meta { flex:1; }
.qc-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; color:var(--txt); line-height:1.3; }
.qc-giver { font-size:11px; color:var(--txt-dim); margin-top:2px; }
.qc-giver span { color:var(--quest); }
.qc-type-badge {
  font-size:9px; letter-spacing:1px; text-transform:uppercase;
  padding:2px 7px; border-radius:3px; font-family:'Cinzel',serif;
  flex-shrink:0; align-self:flex-start;
}
.type-hunt   { background:rgba(239,68,68,0.15); color:var(--red); border:1px solid rgba(239,68,68,0.3); }
.type-gather { background:rgba(16,185,129,0.15); color:var(--npc-green); border:1px solid rgba(16,185,129,0.3); }
.type-deliver{ background:rgba(245,158,11,0.15); color:var(--warn); border:1px solid rgba(245,158,11,0.3); }
.type-explore{ background:rgba(139,92,246,0.15); color:var(--quest); border:1px solid rgba(139,92,246,0.3); }
.type-craft  { background:rgba(200,168,75,0.15); color:var(--gold); border:1px solid rgba(200,168,75,0.3); }

/* progress bar */
.qc-progress { margin-top:10px; }
.qc-progress-row { display:flex; justify-content:space-between; font-size:11px; color:var(--txt-dim); margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
.qc-bar-track { height:5px; background:var(--panel); border-radius:3px; overflow:hidden; }
.qc-bar-fill { height:100%; border-radius:3px; transition:width 0.5s; }

/* rewards preview */
.qc-rewards { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
.reward-chip {
  background:var(--panel); border:1px solid var(--border);
  border-radius:4px; padding:2px 8px;
  font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt-dim);
  display:flex; align-items:center; gap:4px;
}
.reward-chip.gold-chip { border-color:var(--gold-dim); color:var(--gold); }
.reward-chip.xp-chip   { border-color:rgba(139,92,246,0.4); color:var(--quest); }
.reward-chip.item-chip { border-color:var(--border-gold); color:var(--txt); }

/* ── RIGHT: QUEST DETAIL ── */
.quest-detail { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
.empty-detail { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--txt-dim); padding:40px; text-align:center; }

/* detail sections */
.det-block { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px; }
.det-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.det-title::after { content:''; flex:1; height:1px; background:var(--border); }
.det-quest-name { font-family:'Cinzel',serif; font-size:18px; font-weight:600; color:var(--quest); line-height:1.3; margin-bottom:4px; }
.det-quest-desc { font-size:14px; color:var(--txt-dim); line-height:1.7; font-style:italic; }

/* objectives */
.objective-list { display:flex; flex-direction:column; gap:7px; }
.obj-row { display:flex; align-items:center; gap:10px; }
.obj-check { width:18px; height:18px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:10px; transition:all 0.2s; }
.obj-check.done { border-color:var(--npc-green); background:var(--npc-green); color:#fff; }
.obj-check.active { border-color:var(--quest); animation:pulseRing 1.5s infinite; }
@keyframes pulseRing { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.4)} 50%{box-shadow:0 0 0 5px rgba(139,92,246,0)} }
.obj-text { flex:1; font-size:13px; color:var(--txt-dim); }
.obj-text.done { color:var(--txt-dim); text-decoration:line-through; }
.obj-text.active { color:var(--txt); }
.obj-count { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt-dim); }
.obj-count.done { color:var(--npc-green); }

/* Simulate progress btn */
.sim-btn {
  background:none; border:1px solid var(--border);
  border-radius:5px; padding:3px 8px; font-size:10px;
  color:var(--txt-dim); cursor:pointer; transition:all 0.12s;
  font-family:'Cinzel',serif; letter-spacing:0.5px;
}
.sim-btn:hover { border-color:var(--quest); color:var(--quest); background:var(--hover); }

/* rewards detail */
.rewards-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.rew-item { background:var(--panel); border:1px solid var(--border); border-radius:7px; padding:10px 12px; display:flex; align-items:center; gap:8px; }
.rew-icon { font-size:24px; }
.rew-label { font-size:11px; color:var(--txt-dim); }
.rew-val   { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; }
.rew-val.gold  { color:var(--gold); }
.rew-val.xp    { color:var(--quest); }
.rew-val.item  { color:var(--txt); font-size:12px; }
.rew-val.crypto{ color:#60C8FF; }

/* action buttons */
.quest-actions { display:flex; flex-direction:column; gap:8px; }
.accept-btn {
  width:100%; padding:12px;
  font-family:'Cinzel',serif; font-size:14px; font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--quest-dim),var(--quest));
  border:none; border-radius:8px; color:#fff; cursor:pointer;
  transition:all 0.2s; position:relative; overflow:hidden;
}
.accept-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); transform:translateX(-100%); }
.accept-btn:hover:not(:disabled)::after { animation:shine 0.5s forwards; }
@keyframes shine { to{transform:translateX(100%)} }
.accept-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(139,92,246,0.4); }
.accept-btn:disabled { opacity:0.4; cursor:not-allowed; }
.turn-btn {
  width:100%; padding:10px;
  font-family:'Cinzel',serif; font-size:13px; font-weight:600; letter-spacing:1px;
  background:linear-gradient(135deg,var(--npc-dim),var(--npc-green));
  border:none; border-radius:8px; color:#fff; cursor:pointer;
  transition:all 0.2s;
}
.turn-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(16,185,129,0.4); }
.turn-btn:disabled { opacity:0.4; cursor:not-allowed; }
.abandon-btn {
  width:100%; padding:8px;
  font-family:'Cinzel',serif; font-size:12px; letter-spacing:1px;
  background:none; border:1px solid var(--red-dim);
  border-radius:8px; color:var(--red); cursor:pointer; transition:all 0.15s;
}
.abandon-btn:hover { background:rgba(239,68,68,0.1); border-color:var(--red); }

/* NPC map */
.npc-map { padding:12px; }
.map-title { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.map-zones { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.map-zone {
  background:var(--card); border:1px solid var(--border); border-radius:7px;
  padding:8px 10px; font-size:11px; color:var(--txt-dim);
  display:flex; align-items:center; gap:6px;
}
.map-zone.active { border-color:var(--quest); color:var(--quest); background:rgba(139,92,246,0.08); }
.mz-dot { width:6px; height:6px; border-radius:50%; background:var(--border); flex-shrink:0; }
.mz-dot.active { background:var(--quest); box-shadow:0 0 6px rgba(139,92,246,0.6); }

/* toast */
.toast {
  position:fixed; bottom:24px; left:50%;
  transform:translateX(-50%) translateY(20px);
  background:var(--panel); border:1px solid var(--quest);
  border-radius:8px; padding:10px 20px;
  font-family:'Cinzel',serif; font-size:13px; color:var(--quest);
  box-shadow:0 8px 28px rgba(0,0,0,0.6);
  opacity:0; pointer-events:none; transition:all 0.35s cubic-bezier(.4,0,.2,1);
  z-index:100; white-space:nowrap;
}
.toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
.toast.green { border-color:var(--npc-green); color:var(--npc-green); }
.toast.gold  { border-color:var(--gold); color:var(--gold); }

/* Complete overlay */
.complete-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.85);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
  z-index:200; opacity:0; pointer-events:none; transition:opacity 0.4s;
}
.complete-overlay.show { opacity:1; pointer-events:all; }
.co-title { font-family:'Cinzel',serif; font-size:42px; font-weight:900; color:var(--gold); text-shadow:0 0 50px rgba(200,168,75,0.5); animation:pulseGlow 2s infinite; }
@keyframes pulseGlow { 0%,100%{text-shadow:0 0 30px rgba(200,168,75,0.4)} 50%{text-shadow:0 0 70px rgba(200,168,75,0.8)} }
.co-quest { font-family:'Cinzel',serif; font-size:16px; color:var(--txt-dim); letter-spacing:2px; }
.co-rewards { background:var(--panel); border:1px solid var(--border-gold); border-radius:12px; padding:20px 40px; display:flex; flex-direction:column; gap:8px; min-width:280px; }
.co-rew-row { display:flex; align-items:center; gap:10px; font-size:15px; }
.co-btn { padding:12px 40px; font-family:'Cinzel',serif; font-size:13px; font-weight:600; letter-spacing:2px; background:linear-gradient(135deg,var(--gold-dim),var(--gold)); border:none; border-radius:8px; color:var(--void); cursor:pointer; transition:all 0.2s; }
.co-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,168,75,0.3); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }



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
  <div class="logo">CRIPTO<em>MUNDO</em> <small>MISIONES & NPCs</small></div>
  <div class="hdr-right">
    <div class="badge purple"><span>📜</span><b id="active-count">0</b><span>ACTIVAS</span></div>
    <div class="badge"><span>✅</span><b id="done-count">0</b><span>COMPLETADAS</span></div>
    <div class="badge"><span>🪙</span><b id="gold-disp">1,240</b><span>ORO</span></div>
    <div class="badge"><span>✨</span><b id="xp-disp">3,200</b><span>EXP</span></div>
  </div>
</header>

<div class="layout">

  <!-- LEFT: NPC list -->
  <aside class="sidebar">
    <div class="sec-head"><span style="margin-right:auto">Aldeanos & Personajes</span></div>
    <div class="zone-tabs" id="zone-tabs">
      <button class="zone-tab active" onclick="filterZone('all',this)">Todos</button>
      <button class="zone-tab" onclick="filterZone('pueblo',this)">🏘️ Pueblo</button>
      <button class="zone-tab" onclick="filterZone('bosque',this)">🌲 Bosque</button>
      <button class="zone-tab" onclick="filterZone('minas',this)">⛏️ Minas</button>
      <button class="zone-tab" onclick="filterZone('castillo',this)">🏰 Castillo</button>
    </div>
    <div class="npc-scroll" id="npc-list"></div>
  </aside>

  <!-- CENTER: Dialog + Quests -->
  <main class="center">
    <!-- Dialog box -->
    <div class="dialog-box" id="dialog-box">
      <div class="dialog-npc-portrait" id="dialog-portrait">
        <span id="portrait-emoji">🧙</span>
        <div class="portrait-glow"></div>
      </div>
      <div class="dialog-content">
        <div class="dialog-npc-name" id="dialog-npc-name">Aldeano Desconocido</div>
        <div class="dialog-bubble">
          <span id="dialog-text">Acércate a un NPC para hablar con él y aceptar misiones...</span>
          <span class="dialog-cursor" id="dialog-cursor"></span>
        </div>
        <div class="dialog-choices" id="dialog-choices"></div>
      </div>
    </div>

    <!-- Quest list -->
    <div class="quest-tabs">
      <button class="qtab active" onclick="switchQTab('available',this)">
        <span class="qt-icon">📋</span>Disponibles
      </button>
      <button class="qtab" onclick="switchQTab('active',this)">
        <span class="qt-icon">⚔️</span>En Curso
      </button>
      <button class="qtab" onclick="switchQTab('completed',this)">
        <span class="qt-icon">✅</span>Completadas
      </button>
    </div>
    <div class="quest-scroll" id="quest-scroll"></div>
  </main>

  <!-- RIGHT: Quest detail -->
  <aside class="sidebar right">
    <div class="sec-head"><span style="margin-right:auto" id="det-head">Detalles de la Misión</span></div>
    <div id="right-content" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;">
      <div class="empty-detail">
        <div style="font-size:48px;opacity:0.25">📜</div>
        <p style="font-size:13px">Selecciona una misión para ver sus objetivos y recompensas</p>
      </div>
    </div>
  </aside>
</div>

<!-- Complete overlay -->
<div class="complete-overlay" id="complete-overlay">
  <div class="co-title">¡MISIÓN COMPLETADA!</div>
  <div class="co-quest" id="co-quest-name"></div>
  <div class="co-rewards" id="co-rewards"></div>
  <button class="co-btn" onclick="closeComplete()">¡Reclamar Recompensas!</button>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// ═══════════════════════════════════════════════════════════
//  MISIONES v3.1 — cliente fino
//  El progreso lo genera el servidor con eventos reales de
//  juego. Desde aquí solo se acepta y se entrega.
// ═══════════════════════════════════════════════════════════
var QUEST_TYPES = {
  HUNT:    { label: 'Caza',        bar: 'linear-gradient(90deg,#8B1A1A,#E03030)' },
  GATHER:  { label: 'Recolección', bar: 'linear-gradient(90deg,#1A5A2A,#30C060)' },
  EXPLORE: { label: 'Exploración', bar: 'linear-gradient(90deg,#1A3A6A,#4090F0)' },
  CRAFT:   { label: 'Artesanía',   bar: 'linear-gradient(90deg,#6A4A10,#C8A84B)' },
  DUNGEON: { label: 'Mazmorra',    bar: 'linear-gradient(90deg,#4A1A6A,#A335EE)' },
};
var ZONE_NAME = { pueblo: 'Pueblo de Valdris', forest: 'Bosque del Este', mines: 'Minas Profundas', crypt: 'Cripta Antigua', castillo: 'Castillo de Hierro', ruins: 'Ruinas Malditas' };

var Q = {
  char: null, npcs: [], available: [], active: [], completed: [],
  selectedNpc: null, selectedQuest: null, tab: 'available', zone: 'all', busy: false,
};

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
  if (!me.ok) { $('quest-scroll').innerHTML = msgBox('Inicia sesión para ver tus misiones'); return; }
  Q.char = me.data.character;
  var npc = await api('/api/npcs');
  Q.npcs = npc.data.npcs || [];
  await reloadQuests();
  renderNPCs();
  renderQuests();
  renderDetailEmpty();
}

async function reloadQuests() {
  var a = await api('/api/quests?status=available');
  var b = await api('/api/quests?status=active');
  var c = await api('/api/quests?status=completed');
  Q.available = a.data.quests || [];
  Q.active = b.data.quests || [];
  Q.completed = c.data.quests || [];
  var g = $('gold-count'); if (g) g.textContent = n(Q.char.gold);
  var x = $('xp-count'); if (x) x.textContent = n(Q.char.xp);
  $('active-count').textContent = Q.active.length;
  $('done-count').textContent = Q.completed.length;
}

function msgBox(t) {
  return '<div style="padding:30px;text-align:center;color:var(--txt-dim);font-size:13px">' + esc(t) + '</div>';
}

// ── NPCs ───────────────────────────────────────────────────
function renderNPCs() {
  var list = $('npc-list');
  list.innerHTML = '';
  var npcs = Q.zone === 'all' ? Q.npcs : Q.npcs.filter(function (x) { return x.zone === Q.zone; });
  if (!npcs.length) { list.innerHTML = msgBox('Sin NPCs en esta zona'); return; }
  npcs.forEach(function (npc) {
    var count = Q.available.filter(function (q) { return q.npcId === npc.id; }).length;
    var div = document.createElement('div');
    div.className = 'npc-card' + (Q.selectedNpc && Q.selectedNpc.id === npc.id ? ' selected' : '');
    div.innerHTML =
      '<div class="npc-avatar">' + npc.avatar + '<div class="npc-badge' + (count === 0 ? ' zero' : '') + '">' + count + '</div></div>' +
      '<div class="npc-info">' +
        '<div class="npc-name">' + esc(npc.name) + '</div>' +
        '<div class="npc-role">' + esc(npc.role) + '</div>' +
        '<div class="npc-loc">📍 ' + esc(ZONE_NAME[npc.zone] || npc.zone) + '</div>' +
        '<div class="npc-status ' + (count > 0 ? 'ready' : 'busy') + '">' + (count > 0 ? '● Tiene misiones disponibles' : '○ Sin misiones nuevas') + '</div>' +
      '</div>';
    div.addEventListener('click', function () { selectNPC(npc); });
    list.appendChild(div);
  });
}

function selectNPC(npc) {
  Q.selectedNpc = (Q.selectedNpc && Q.selectedNpc.id === npc.id) ? null : npc;
  renderNPCs();
  renderQuests();
}

function filterZone(z, btn) {
  Q.zone = z;
  document.querySelectorAll('.zone-tab').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderNPCs();
}

// ── LISTA DE MISIONES ──────────────────────────────────────
function switchQTab(tab, btn) {
  Q.tab = tab;
  document.querySelectorAll('.qtab').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderQuests();
}

function questsForTab() {
  var list;
  if (Q.tab === 'available') list = Q.available.map(function (q) { return { quest: q, state: 'available' }; });
  else if (Q.tab === 'active') list = Q.active.map(function (aq) { return { quest: aq.quest, state: 'active', progress: aq.objectiveProgress }; });
  else list = Q.completed.map(function (id) {
    var q = [].concat(Q.available, Q.active.map(function (a) { return a.quest; })).filter(function (x) { return x && x.id === id; })[0];
    return { quest: q || { id: id, name: id, icon: '✅', type: 'HUNT', npcName: '—', levelReq: 1, objectives: [], rewards: [{ gold: 0, xp: 0 }] }, state: 'done' };
  });
  if (Q.selectedNpc) list = list.filter(function (e) { return e.quest.npcId === Q.selectedNpc.id; });
  return list;
}

function progressOf(entry) {
  var q = entry.quest;
  if (!q.objectives || !q.objectives.length) return { done: 0, total: 0, pct: entry.state === 'done' ? 100 : 0 };
  var done = 0;
  q.objectives.forEach(function (obj) {
    var cur = current(entry, obj);
    if (cur >= obj.required) done++;
  });
  return { done: done, total: q.objectives.length, pct: Math.round(done / q.objectives.length * 100) };
}
function current(entry, obj) {
  if (entry.state === 'done') return obj.required;
  if (!entry.progress) return 0;
  var p = entry.progress.filter(function (x) { return x.objectiveId === obj.id; })[0];
  return p ? p.current : 0;
}

function renderQuests() {
  var scroll = $('quest-scroll');
  scroll.innerHTML = '';
  var list = questsForTab();
  if (!list.length) {
    scroll.innerHTML = msgBox(
      Q.tab === 'available' ? 'No hay misiones disponibles' + (Q.selectedNpc ? ' de este NPC' : '') + '.'
      : Q.tab === 'active' ? 'No tienes misiones activas. ¡Acepta una!'
      : 'Aún no has completado ninguna misión.');
    return;
  }
  list.forEach(function (entry) {
    var q = entry.quest;
    var t = QUEST_TYPES[q.type] || QUEST_TYPES.HUNT;
    var pr = progressOf(entry);
    var rw = (q.rewards && q.rewards[0]) || { gold: 0, xp: 0 };
    var div = document.createElement('div');
    div.className = 'quest-card' + (Q.selectedQuest && Q.selectedQuest.quest.id === q.id ? ' selected' : '') + (entry.state === 'done' ? ' completed' : '');
    div.innerHTML =
      '<div class="quest-type-bar" style="background:' + t.bar + '"></div>' +
      '<div class="qc-body">' +
        '<div class="qc-top">' +
          '<div class="qc-icon">' + (q.icon || '📜') + '</div>' +
          '<div class="qc-meta">' +
            '<div class="qc-name">' + (entry.state === 'done' ? '✅ ' : '') + '"' + esc(q.name) + '"</div>' +
            '<div class="qc-giver">📍 <span>' + esc(q.npcName || '—') + '</span> · Nv.' + (q.levelReq || 1) + '</div>' +
          '</div>' +
          '<div class="qc-type-badge type-' + (q.type || '').toLowerCase() + '">' + t.label + '</div>' +
        '</div>' +
        (entry.state === 'active'
          ? '<div class="qc-progress"><div class="qc-progress-row"><span>Progreso</span><span>' + pr.done + '/' + pr.total + ' objetivos</span></div>' +
            '<div class="qc-bar-track"><div class="qc-bar-fill" style="width:' + pr.pct + '%;background:' + t.bar + '"></div></div></div>'
          : '') +
        '<div class="qc-rewards">' +
          '<div class="reward-chip gold-chip">🪙 ' + n(rw.gold) + '</div>' +
          '<div class="reward-chip xp-chip">✨ ' + n(rw.xp) + ' EXP</div>' +
          (rw.cgrid ? '<div class="reward-chip" style="border-color:#60C8FF;color:#60C8FF">💎 ' + rw.cgrid + ' $CGRID</div>' : '') +
        '</div>' +
      '</div>';
    div.addEventListener('click', function () { selectQuest(entry); });
    scroll.appendChild(div);
  });
}

// ── DETALLE ────────────────────────────────────────────────
function renderDetailEmpty() {
  $('det-head').textContent = 'Detalles de la Misión';
  $('right-content').innerHTML = msgBox('Selecciona una misión de la lista');
}

function selectQuest(entry) {
  Q.selectedQuest = entry;
  renderQuests();
  renderQuestDetail(entry);
}

function renderQuestDetail(entry) {
  var q = entry.quest;
  var t = QUEST_TYPES[q.type] || QUEST_TYPES.HUNT;
  var pr = progressOf(entry);
  var rw = (q.rewards && q.rewards[0]) || { gold: 0, xp: 0 };
  var allDone = pr.total > 0 && pr.done === pr.total;

  $('det-head').textContent = entry.state === 'done' ? '✅ Misión Completada' : 'Detalles de la Misión';

  var objs = (q.objectives || []).map(function (obj) {
    var cur = current(entry, obj);
    var done = cur >= obj.required;
    return '<div class="obj-row">' +
      '<div class="obj-check ' + (done ? 'done' : entry.state === 'active' ? 'active' : '') + '">' + (done ? '✓' : '') + '</div>' +
      '<div class="obj-text ' + (done ? 'done' : '') + '">' + esc(obj.text) + '</div>' +
      '<div class="obj-count ' + (done ? 'done' : '') + '">' + Math.min(cur, obj.required) + '/' + obj.required + '</div>' +
    '</div>';
  }).join('') || msgBox('Sin objetivos');

  var action;
  if (entry.state === 'available') {
    var locked = Q.char.level < (q.levelReq || 1);
    action = '<button class="accept-btn" onclick="acceptQuest(\\'' + q.id + '\\')"' + (locked ? ' disabled' : '') + '>' +
      (locked ? '🔒 Requiere nivel ' + q.levelReq : '📜 ACEPTAR MISIÓN') + '</button>';
  } else if (entry.state === 'active') {
    action = '<button class="accept-btn" onclick="turnInQuest(\\'' + q.id + '\\')"' + (allDone ? '' : ' disabled') + '>' +
      (allDone ? '🏆 ENTREGAR MISIÓN' : '⏳ Objetivos incompletos') + '</button>' +
      '<div style="font-size:11px;color:var(--txt-dim);margin-top:10px;line-height:1.6">' +
      'El progreso avanza solo con acciones reales de juego: matar al enemigo correcto, fabricar la receta indicada, ' +
      'explorar la zona o completar la mazmorra. No se puede marcar a mano.</div>';
  } else {
    action = '<div style="font-size:13px;color:var(--gold);text-align:center;padding:10px">Misión completada</div>';
  }

  $('right-content').innerHTML =
    '<div style="padding:18px">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
        '<div style="font-size:38px">' + (q.icon || '📜') + '</div>' +
        '<div><div style="font-family:\\'Cinzel\\',serif;font-size:17px;color:var(--gold)">' + esc(q.name) + '</div>' +
        '<div style="font-size:12px;color:var(--txt-dim)">' + esc(q.npcName || '') + ' · ' + t.label + ' · Nv.' + (q.levelReq || 1) + '</div></div>' +
      '</div>' +
      '<div style="font-size:13px;color:var(--txt-dim);line-height:1.7;margin-bottom:16px">' + esc(q.description || '') + '</div>' +
      '<div style="font-family:\\'Cinzel\\',serif;font-size:10px;letter-spacing:2px;color:var(--txt-dim);text-transform:uppercase;margin-bottom:8px">Objetivos</div>' +
      objs +
      '<div style="font-family:\\'Cinzel\\',serif;font-size:10px;letter-spacing:2px;color:var(--txt-dim);text-transform:uppercase;margin:16px 0 8px">Recompensas</div>' +
      '<div class="qc-rewards">' +
        '<div class="reward-chip gold-chip">🪙 ' + n(rw.gold) + '</div>' +
        '<div class="reward-chip xp-chip">✨ ' + n(rw.xp) + ' EXP</div>' +
        (rw.cgrid ? '<div class="reward-chip" style="border-color:#60C8FF;color:#60C8FF">💎 ' + rw.cgrid + ' $CGRID</div>' : '') +
      '</div>' +
      '<div style="margin-top:18px">' + action + '</div>' +
    '</div>';
}

// ── ACCIONES ───────────────────────────────────────────────
async function acceptQuest(qid) {
  if (Q.busy) return;
  Q.busy = true;
  var r = await api('/api/quests', { method: 'POST', body: JSON.stringify({ questId: qid, action: 'accept' }) });
  Q.busy = false;
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo aceptar'), 'red'); return; }
  showToast('📜 Misión aceptada', 'green');
  await reloadQuests();
  Q.tab = 'active';
  document.querySelectorAll('.qtab').forEach(function (b, i) { b.classList.toggle('active', i === 1); });
  var entry = Q.active.filter(function (a) { return a.questId === qid; })[0];
  renderNPCs();
  renderQuests();
  if (entry) selectQuest({ quest: entry.quest, state: 'active', progress: entry.objectiveProgress });
  sendToParent('REFRESH_CHARACTER', {});
}

async function turnInQuest(qid) {
  if (Q.busy) return;
  Q.busy = true;
  var r = await api('/api/quests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'quest-' + qid + '-' + Date.now() },
    body: JSON.stringify({ questId: qid, action: 'turnin' }),
  });
  Q.busy = false;
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo entregar'), 'red'); return; }

  var rw = r.data.rewards || {};
  showCompleteOverlay(rw, r.data.levelUps || []);
  var me = await api('/api/player');
  if (me.ok) Q.char = me.data.character;
  await reloadQuests();
  Q.selectedQuest = null;
  renderNPCs();
  renderQuests();
  renderDetailEmpty();
  sendToParent('REFRESH_CHARACTER', {});
}

function showCompleteOverlay(rw, levelUps) {
  var ov = $('complete-overlay');
  if (!ov) { showToast('🏆 Misión completada: 🪙' + n(rw.gold) + ' · ✨' + n(rw.xp), 'green'); return; }
  var body = $('co-rewards');
  if (body) {
    body.innerHTML =
      '<div class="reward-chip gold-chip">🪙 ' + n(rw.gold) + '</div>' +
      '<div class="reward-chip xp-chip">✨ ' + n(rw.xp) + ' EXP</div>' +
      (rw.cgrid ? '<div class="reward-chip" style="border-color:#60C8FF;color:#60C8FF">💎 ' + rw.cgrid + ' $CGRID</div>' : '') +
      (levelUps.length ? '<div class="reward-chip" style="border-color:#F0D070;color:#F0D070">🎉 ¡Nivel ' + levelUps[levelUps.length - 1].level + '!</div>' : '');
  }
  ov.classList.add('show');
}
function closeComplete() { var o = $('complete-overlay'); if (o) o.classList.remove('show'); }

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
  if (d.type === 'CHARACTER_DATA' && d.data && d.data.character) { Q.char = d.data.character; }
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
