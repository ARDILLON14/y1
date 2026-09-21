PAGES['criptomundo-mercado.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Mercado</title>
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
  --market:     #2A7FD4;   /* market blue — signature accent */
  --market-dim: #0F3060;
  --sell:       #30A860;
  --sell-dim:   #0D4020;
  --red:        #C03030;
  --red-dim:    #501010;
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
  background:var(--void);
  color:var(--txt);
  font-family:'Crimson Pro',Georgia,serif;
  min-height:100vh;
  background-image:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(42,127,212,0.07) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A84B' fill-opacity='0.015'%3E%3Cpath d='M20 0L24 16H40L27 25L31 40L20 31L9 40L13 25L0 16H16Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── HEADER ── */
header {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 24px;
  background:linear-gradient(180deg,rgba(42,127,212,0.1) 0%,transparent 100%);
  border-bottom:1px solid var(--border-gold);
  position:sticky; top:0; z-index:50;
  backdrop-filter:blur(8px);
}
.logo { font-family:'Cinzel',serif; font-weight:900; font-size:20px; color:var(--gold); letter-spacing:3px; }
.logo em { color:var(--market); font-style:normal; }
.logo small { display:block; color:var(--txt-dim); font-size:11px; font-weight:400; letter-spacing:2px; margin-top:-2px; }
.hdr-badges { display:flex; gap:10px; align-items:center; }
.badge {
  display:flex; align-items:center; gap:6px;
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:5px 12px;
  font-family:'JetBrains Mono',monospace; font-size:12px;
}
.badge b { color:var(--gold); }
.badge span { color:var(--txt-dim); font-size:10px; }
.badge.blue b { color:var(--market); }
.nav-btn {
  background:none; border:1px solid var(--border); border-radius:6px;
  padding:5px 14px; color:var(--txt-dim); font-family:'Cinzel',serif;
  font-size:11px; letter-spacing:1px; cursor:pointer; transition:all 0.15s;
}
.nav-btn:hover,.nav-btn.active { background:var(--hover); border-color:var(--gold-dim); color:var(--gold); }
.nav-btn.active { border-color:var(--market); color:var(--market); background:rgba(42,127,212,0.08); }

/* ── LAYOUT ── */
.layout {
  display:grid;
  grid-template-columns:260px 1fr 300px;
  height:calc(100vh - 52px);
  overflow:hidden;
}

/* ── SIDEBAR ── */
.sidebar {
  background:var(--panel);
  border-right:1px solid var(--border);
  display:flex; flex-direction:column; overflow:hidden;
}
.sidebar.right { border-right:none; border-left:1px solid var(--border); }

.sec-head {
  font-family:'Cinzel',serif; font-size:10px; font-weight:600;
  color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase;
  padding:13px 16px 10px;
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
}
.sec-head::before { content:''; width:3px; height:11px; background:var(--gold); border-radius:2px; }

/* ── FILTER PANEL ── */
.filter-section { padding:10px 12px; border-bottom:1px solid var(--border); }
.filter-label { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
.filter-chips { display:flex; flex-wrap:wrap; gap:4px; }
.chip {
  background:var(--card); border:1px solid var(--border);
  border-radius:4px; padding:3px 9px;
  font-size:11px; color:var(--txt-dim); cursor:pointer;
  transition:all 0.12s; white-space:nowrap;
}
.chip:hover { border-color:var(--gold-dim); color:var(--txt); }
.chip.active { background:var(--hover); border-color:var(--market); color:var(--market); }

.sort-row { display:flex; gap:4px; margin-top:8px; }
.sort-btn {
  flex:1; background:var(--card); border:1px solid var(--border);
  border-radius:4px; padding:4px 6px; font-size:10px; color:var(--txt-dim);
  cursor:pointer; text-align:center; transition:all 0.12s; font-family:'Cinzel',serif; letter-spacing:0.5px;
}
.sort-btn:hover,.sort-btn.active { border-color:var(--gold-dim); color:var(--gold); background:var(--hover); }

/* price range */
.price-range { margin-top:10px; }
.range-row { display:flex; gap:6px; margin-top:4px; }
.range-input {
  flex:1; background:var(--card); border:1px solid var(--border);
  border-radius:4px; padding:4px 8px; font-family:'JetBrains Mono',monospace;
  font-size:11px; color:var(--txt); outline:none;
  transition:border-color 0.12s;
}
.range-input:focus { border-color:var(--gold-dim); }

/* market stats */
.mkt-stats { padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
.mkt-stat-row {
  display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:var(--txt-dim);
}
.mkt-stat-row b { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--txt); }
.mkt-stat-row b.up { color:var(--sell); }
.mkt-stat-row b.down { color:var(--red); }

/* trending */
.trending { padding:8px 12px; flex:1; overflow-y:auto; }
.trend-title { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.trend-item {
  display:flex; align-items:center; gap:8px;
  padding:6px 8px; border-radius:6px;
  border:1px solid transparent;
  cursor:pointer; transition:all 0.12s; margin-bottom:4px;
}
.trend-item:hover { background:var(--card); border-color:var(--border); }
.trend-icon { font-size:20px; }
.trend-info { flex:1; }
.trend-name { font-size:12px; color:var(--txt); font-family:'Cinzel',serif; }
.trend-price { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--gold); }
.trend-change { font-family:'JetBrains Mono',monospace; font-size:10px; }
.up { color:var(--sell); }
.down { color:var(--red); }

/* ── MAIN MARKET ── */
.market-main {
  display:flex; flex-direction:column; overflow:hidden;
  background:var(--deep);
}

/* search bar */
.search-bar {
  padding:12px 16px; border-bottom:1px solid var(--border);
  display:flex; gap:8px; align-items:center;
  background:linear-gradient(180deg,rgba(42,127,212,0.05) 0%,transparent 100%);
}
.search-input {
  flex:1; background:var(--card); border:1px solid var(--border);
  border-radius:7px; padding:8px 14px;
  font-family:'Crimson Pro',serif; font-size:14px; color:var(--txt);
  outline:none; transition:border-color 0.15s;
}
.search-input:focus { border-color:var(--market); }
.search-input::placeholder { color:var(--txt-dim); }
.list-grid-toggle {
  display:flex; gap:4px;
}
.tgl-btn {
  background:var(--card); border:1px solid var(--border);
  border-radius:5px; padding:6px 10px; cursor:pointer;
  font-size:14px; color:var(--txt-dim); transition:all 0.12s;
}
.tgl-btn.active,.tgl-btn:hover { border-color:var(--market); color:var(--market); background:var(--hover); }

/* listing area */
.listings-area { flex:1; overflow-y:auto; padding:12px; }

/* grid mode */
.listings-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:10px;
}
/* list mode */
.listings-list { display:flex; flex-direction:column; gap:6px; }

/* ── LISTING CARD (grid) ── */
.listing-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; overflow:hidden;
  cursor:pointer; transition:all 0.15s;
  position:relative;
}
.listing-card:hover { border-color:var(--market); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.4); }
.listing-card.selected { border-color:var(--market); box-shadow:0 0 0 2px rgba(42,127,212,0.3); }
.lc-rarity-bar { height:3px; }
.lc-body { padding:12px 12px 10px; }
.lc-icon { font-size:36px; margin-bottom:8px; display:block; }
.lc-name { font-family:'Cinzel',serif; font-size:12px; font-weight:600; color:var(--txt); line-height:1.3; margin-bottom:3px; }
.lc-rarity { font-size:10px; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
.lc-seller { font-size:11px; color:var(--txt-dim); margin-bottom:8px; }
.lc-seller span { color:var(--market); }
.lc-price-row { display:flex; align-items:center; justify-content:space-between; gap:4px; }
.lc-price { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; color:var(--gold); }
.lc-price small { font-size:10px; color:var(--txt-dim); font-weight:400; }
.lc-qty-badge { background:var(--panel); border:1px solid var(--border); border-radius:3px; padding:1px 6px; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--txt-dim); }

/* ── LISTING ROW (list) ── */
.listing-row {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:10px 14px;
  display:flex; align-items:center; gap:12px;
  cursor:pointer; transition:all 0.12s;
}
.listing-row:hover { border-color:var(--market); background:var(--hover); }
.listing-row.selected { border-color:var(--market); }
.lr-icon { font-size:28px; flex-shrink:0; }
.lr-info { flex:1; min-width:0; }
.lr-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lr-meta { font-size:11px; color:var(--txt-dim); margin-top:2px; }
.lr-meta .seller { color:var(--market); }
.lr-price { font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:600; color:var(--gold); text-align:right; }
.lr-price small { display:block; font-size:10px; color:var(--txt-dim); font-weight:400; text-align:right; }
.lr-qty { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt-dim); width:40px; text-align:center; }

/* empty */
.empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--txt-dim); padding:40px; }
.empty-state .es-icon { font-size:48px; opacity:0.3; }

/* ── RIGHT PANEL ── */
.detail-panel { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:14px; }
.empty-detail { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--txt-dim); }
.empty-detail .ed-icon { font-size:42px; opacity:0.25; }

/* item detail */
.detail-item-preview {
  background:var(--card); border:1px solid var(--border-gold);
  border-radius:10px; padding:16px;
  display:flex; gap:14px; align-items:flex-start;
  position:relative; overflow:hidden;
}
.detail-item-preview::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 20% 50%, rgba(200,168,75,0.05) 0%, transparent 60%);
  pointer-events:none;
}
.d-icon { font-size:48px; filter:drop-shadow(0 0 16px rgba(200,168,75,0.25)); flex-shrink:0; }
.d-info { flex:1; }
.d-name { font-family:'Cinzel',serif; font-size:16px; font-weight:600; line-height:1.2; margin-bottom:3px; }
.d-rarity { font-size:10px; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.d-stats { display:flex; flex-wrap:wrap; gap:5px; }
.d-stat { background:var(--panel); border:1px solid var(--border); border-radius:4px; padding:2px 8px; font-family:'JetBrains Mono',monospace; font-size:11px; }
.d-desc { font-size:12px; color:var(--txt-dim); font-style:italic; margin-top:8px; }

/* price history mini chart */
.price-history { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:12px; }
.ph-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
.ph-chart { display:flex; align-items:flex-end; gap:3px; height:50px; }
.ph-bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; }
.ph-bar { width:100%; border-radius:2px 2px 0 0; min-height:3px; transition:height 0.3s; }
.ph-lbl { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--txt-dim); }
.ph-summary { display:flex; justify-content:space-between; margin-top:8px; font-family:'JetBrains Mono',monospace; font-size:11px; }

/* purchase section */
.purchase-section { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:14px; }
.ps-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; }
.ps-price-big { font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:600; color:var(--gold); margin-bottom:4px; }
.ps-price-each { font-size:12px; color:var(--txt-dim); margin-bottom:12px; }
.qty-selector { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.qty-selector label { font-size:12px; color:var(--txt-dim); flex:1; }
.qty-ctrl { display:flex; align-items:center; gap:0; }
.qty-btn {
  background:var(--panel); border:1px solid var(--border);
  width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:16px; color:var(--txt-dim); transition:all 0.12s;
}
.qty-btn:hover { background:var(--hover); color:var(--txt); }
.qty-btn:first-child { border-radius:4px 0 0 4px; }
.qty-btn:last-child  { border-radius:0 4px 4px 0; }
.qty-val {
  background:var(--card); border:1px solid var(--border);
  border-left:none; border-right:none;
  width:40px; height:28px;
  font-family:'JetBrains Mono',monospace; font-size:13px;
  color:var(--txt); text-align:center; outline:none;
}
.buy-btn {
  width:100%; padding:12px;
  font-family:'Cinzel',serif; font-size:14px; font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--market-dim),var(--market));
  border:none; border-radius:7px; color:#fff; cursor:pointer;
  transition:all 0.2s; margin-bottom:6px;
  position:relative; overflow:hidden;
}
.buy-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent); transform:translateX(-100%); }
.buy-btn:hover:not(:disabled)::after { animation:shine 0.5s forwards; }
@keyframes shine { to { transform:translateX(100%); } }
.buy-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(42,127,212,0.4); }
.buy-btn:disabled { opacity:0.35; cursor:not-allowed; }
.watchlist-btn {
  width:100%; padding:8px;
  font-family:'Cinzel',serif; font-size:12px; letter-spacing:1px;
  background:none; border:1px solid var(--border);
  border-radius:7px; color:var(--txt-dim); cursor:pointer;
  transition:all 0.15s;
}
.watchlist-btn:hover { border-color:var(--gold-dim); color:var(--gold); }
.watchlist-btn.watching { border-color:var(--gold); color:var(--gold); background:rgba(200,168,75,0.06); }
.commission-note { font-size:11px; color:var(--txt-dim); text-align:center; margin-top:6px; }

/* other listings */
.other-listings { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:12px; }
.ol-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.ol-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid var(--border); font-size:12px; color:var(--txt-dim); }
.ol-row:last-child { border:none; }
.ol-seller { flex:1; color:var(--market); }
.ol-qty { font-family:'JetBrains Mono',monospace; color:var(--txt-dim); width:30px; text-align:right; }
.ol-price { font-family:'JetBrains Mono',monospace; color:var(--gold); width:80px; text-align:right; }
.ol-buy { background:rgba(42,127,212,0.15); border:1px solid var(--market); border-radius:4px; padding:2px 8px; font-size:10px; color:var(--market); cursor:pointer; transition:all 0.12s; font-family:'Cinzel',serif; }
.ol-buy:hover { background:rgba(42,127,212,0.3); }

/* ── SELL TAB ── */
.sell-panel { padding:14px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; }
.sp-pick-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.inv-pick-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
.inv-pick-slot {
  aspect-ratio:1; background:var(--card); border:1px solid var(--border);
  border-radius:6px; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  cursor:pointer; transition:all 0.12s; position:relative; overflow:hidden;
}
.inv-pick-slot:hover { border-color:var(--gold-dim); background:var(--hover); }
.inv-pick-slot.selected { border-color:var(--gold); box-shadow:0 0 8px rgba(200,168,75,0.25); }
.inv-pick-slot .ps-icon { font-size:20px; }
.inv-pick-slot .ps-qty { position:absolute; bottom:2px; right:3px; font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--txt-dim); }
.inv-pick-slot .rarity-bar { position:absolute; bottom:0; left:0; right:0; height:2px; }
.r-common    .rarity-bar { background:var(--common); }
.r-uncommon  .rarity-bar { background:var(--uncommon); }
.r-rare      .rarity-bar { background:var(--rare); }
.r-epic      .rarity-bar { background:var(--epic); }
.r-legendary .rarity-bar { background:var(--legendary); }

.sell-form { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:10px; }
.sf-row { display:flex; flex-direction:column; gap:4px; }
.sf-label { font-size:11px; color:var(--txt-dim); letter-spacing:1px; text-transform:uppercase; }
.sf-input {
  background:var(--panel); border:1px solid var(--border);
  border-radius:6px; padding:8px 12px;
  font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--txt);
  outline:none; width:100%; transition:border-color 0.12s;
}
.sf-input:focus { border-color:var(--gold-dim); }
.sf-hint { font-size:11px; color:var(--txt-dim); }
.sf-hint b { color:var(--gold); }
.sell-submit {
  width:100%; padding:12px;
  font-family:'Cinzel',serif; font-size:14px; font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--sell-dim),var(--sell));
  border:none; border-radius:7px; color:#fff; cursor:pointer;
  transition:all 0.2s;
}
.sell-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(48,168,96,0.4); }
.sell-submit:disabled { opacity:0.35; cursor:not-allowed; }
.my-listings { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:12px; }
.ml-row { display:flex; align-items:center; gap:8px; padding:6px 4px; border-bottom:1px solid var(--border); }
.ml-row:last-child { border:none; }
.ml-icon { font-size:20px; }
.ml-info { flex:1; }
.ml-name { font-size:12px; font-family:'Cinzel',serif; color:var(--txt); }
.ml-meta { font-size:10px; color:var(--txt-dim); }
.ml-price { font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--gold); }
.ml-cancel { background:rgba(192,48,48,0.15); border:1px solid var(--red); border-radius:4px; padding:2px 8px; font-size:10px; color:var(--red); cursor:pointer; transition:all 0.12s; font-family:'Cinzel',serif; }
.ml-cancel:hover { background:rgba(192,48,48,0.3); }

/* notification toast */
.toast {
  position:fixed; bottom:24px; left:50%;
  transform:translateX(-50%) translateY(20px);
  background:var(--panel); border:1px solid var(--gold);
  border-radius:8px; padding:10px 20px;
  font-family:'Cinzel',serif; font-size:13px; color:var(--gold);
  box-shadow:0 8px 28px rgba(0,0,0,0.6);
  opacity:0; pointer-events:none;
  transition:all 0.35s cubic-bezier(.4,0,.2,1);
  z-index:100; white-space:nowrap;
}
.toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
.toast.green { border-color:var(--sell); color:var(--sell); }
.toast.red   { border-color:var(--red);  color:var(--red); }

/* scrollbars */
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
  <div class="logo">CRIPTO<em>MUNDO</em> <small>MERCADO DE JUGADORES</small></div>
  <div class="hdr-badges">
    <button class="nav-btn active" onclick="setMode('buy',this)" id="mode-buy">🛒 Comprar</button>
    <button class="nav-btn" onclick="setMode('sell',this)" id="mode-sell">💰 Vender</button>
    <div class="badge"><span>🪙</span><b id="gold-disp">1,240</b><span>ORO</span></div>
    <div class="badge blue"><span>💎</span><b id="crypto-disp">12</b><span>$CGRID</span></div>
  </div>
</header>

<div class="layout">

  <!-- LEFT: Filters / stats / trending -->
  <aside class="sidebar" id="left-sidebar">
    <div class="sec-head"><span style="margin-right:auto">Filtros</span></div>

    <div class="filter-section">
      <div class="filter-label">Categoría</div>
      <div class="filter-chips" id="cat-chips">
        <div class="chip active" onclick="setFilter('cat','all',this)">Todo</div>
        <div class="chip" onclick="setFilter('cat','weapon',this)">⚔️ Armas</div>
        <div class="chip" onclick="setFilter('cat','armor',this)">🛡️ Armadura</div>
        <div class="chip" onclick="setFilter('cat','potion',this)">🧪 Pociones</div>
        <div class="chip" onclick="setFilter('cat','material',this)">🪨 Materiales</div>
        <div class="chip" onclick="setFilter('cat','food',this)">🍖 Comida</div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-label">Raridad</div>
      <div class="filter-chips" id="rar-chips">
        <div class="chip active" onclick="setFilter('rar','all',this)">Todas</div>
        <div class="chip" onclick="setFilter('rar','common',this)" style="color:var(--common)">Común</div>
        <div class="chip" onclick="setFilter('rar','uncommon',this)" style="color:var(--uncommon)">Inusual</div>
        <div class="chip" onclick="setFilter('rar','rare',this)" style="color:var(--rare)">Raro</div>
        <div class="chip" onclick="setFilter('rar','epic',this)" style="color:var(--epic)">Épico</div>
        <div class="chip" onclick="setFilter('rar','legendary',this)" style="color:var(--legendary)">Legendario</div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-label">Ordenar por</div>
      <div class="sort-row">
        <div class="sort-btn active" onclick="setSort('price_asc',this)">Precio ↑</div>
        <div class="sort-btn" onclick="setSort('price_desc',this)">Precio ↓</div>
        <div class="sort-btn" onclick="setSort('newest',this)">Nuevo</div>
      </div>
      <div class="price-range">
        <div class="filter-label">Rango de precio</div>
        <div class="range-row">
          <input class="range-input" type="number" placeholder="Mín" id="price-min" oninput="applyFilters()">
          <input class="range-input" type="number" placeholder="Máx" id="price-max" oninput="applyFilters()">
        </div>
      </div>
    </div>

    <div class="mkt-stats">
      <div class="filter-label">Estadísticas del mercado</div>
      <div class="mkt-stat-row"><span>Listados activos</span><b id="stat-active">—</b></div>
      <div class="mkt-stat-row"><span>Transacciones hoy</span><b class="up">+147</b></div>
      <div class="mkt-stat-row"><span>Volumen (oro)</span><b class="up">48,320</b></div>
      <div class="mkt-stat-row"><span>Comisión del juego</span><b>5%</b></div>
    </div>

    <div class="trending">
      <div class="trend-title">📈 En tendencia</div>
      <div id="trending-list"></div>
    </div>
  </aside>

  <!-- CENTER: Listings -->
  <main class="market-main" id="market-main">
    <div class="search-bar">
      <input class="search-input" type="text" placeholder="Buscar ítem, jugador o estadística..." id="search-input" oninput="applyFilters()">
      <div class="list-grid-toggle">
        <button class="tgl-btn active" onclick="setView('grid',this)" title="Cuadrícula">⊞</button>
        <button class="tgl-btn" onclick="setView('list',this)" title="Lista">☰</button>
      </div>
    </div>
    <div class="listings-area" id="listings-area"></div>
  </main>

  <!-- RIGHT: Detail / actions -->
  <aside class="sidebar right" id="right-sidebar">
    <div class="sec-head"><span style="margin-right:auto" id="rp-title">Detalle del Ítem</span></div>
    <div id="right-content">
      <div class="empty-detail" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--txt-dim);padding:40px">
        <div class="ed-icon" style="font-size:42px;opacity:0.25">🏪</div>
        <p style="font-size:13px;text-align:center">Selecciona un ítem para ver detalles y comprarlo</p>
      </div>
    </div>
  </aside>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// ═══════════════════════════════════════════════════════════
//  MERCADO v3.1 — cliente fino
//  El precio, la propiedad, el escrow y la comisión los lleva
//  el servidor. Aquí no se calcula ni un solo saldo.
// ═══════════════════════════════════════════════════════════
var RARITY_COLOR = { COMMON: '#9D9D9D', UNCOMMON: '#1EFF00', RARE: '#4090F0', EPIC: '#A335EE', LEGENDARY: '#FF8000', MYTHIC: '#FF4040' };
var RARITY_LABEL = { COMMON: 'Común', UNCOMMON: 'Inusual', RARE: 'Raro', EPIC: 'Épico', LEGENDARY: 'Legendario', MYTHIC: 'Mítico' };
var TYPE_CAT = { WEAPON: 'weapon', ARMOR: 'armor', ACCESSORY: 'armor', POTION: 'potion', MATERIAL: 'material', FOOD: 'food' };

var M = {
  char: null,
  listings: [],
  filtered: [],
  inventory: [],
  history: [],
  selected: null,
  buyQty: 1,
  viewMode: 'grid',
  mode: 'buy',
  sellItem: null,
  busy: false,
  filters: { cat: 'all', rar: 'all', sort: 'price_asc', search: '', minPrice: '', maxPrice: '' },
};

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
function n(x) { return (x || 0).toLocaleString('es'); }

async function api(path, opts) {
  var res = await fetch(path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts || {}));
  var data = {};
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data: data };
}

// ── ARRANQUE ───────────────────────────────────────────────
async function init() {
  var me = await api('/api/player');
  if (!me.ok) { showToast('Inicia sesión para usar el mercado', 'red'); return; }
  M.char = me.data.character;
  renderHeader();
  await refreshAll();
  renderRight(null);
}

async function refreshAll() {
  var mk = await api('/api/market');
  M.listings = (mk.data.listings || []).map(normalize);
  var inv = await api('/api/inventory');
  M.inventory = inv.ok ? (inv.data.inventory || []) : [];
  var h = await api('/api/market/history');
  M.history = h.ok ? (h.data.transactions || []) : [];
  applyFilters();
  renderStats();
  renderTrending();
}

function normalize(l) {
  var it = l.item || {};
  return {
    id: l.id,
    itemId: l.itemId,
    name: it.name || l.itemId,
    icon: it.icon || '📦',
    rarity: (it.rarity || 'COMMON').toUpperCase(),
    type: (it.type || '').toUpperCase(),
    price: l.pricePerUnit,
    qty: l.quantity,
    seller: (l.seller && l.seller.name) || '—',
    sellerId: l.sellerId,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
    mine: M.char && l.sellerId === M.char.id,
  };
}

function renderHeader() {
  $('gold-disp').textContent = n(M.char.gold);
  $('crypto-disp').textContent = n(M.char.cgrid);
}

// ── FILTROS ────────────────────────────────────────────────
function setFilter(type, val, el) {
  M.filters[type] = val;
  var group = type === 'cat' ? 'cat-chips' : 'rar-chips';
  $(group).querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  applyFilters();
}
function setSort(val, el) {
  M.filters.sort = val;
  document.querySelectorAll('.sort-btn').forEach(function (b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  applyFilters();
}
function setView(v, btn) {
  M.viewMode = v;
  document.querySelectorAll('.tgl-btn').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderListings();
}
function applyFilters() {
  var f = M.filters;
  f.search = ($('search-input') && $('search-input').value || '').toLowerCase();
  f.minPrice = $('price-min') && $('price-min').value;
  f.maxPrice = $('price-max') && $('price-max').value;

  M.filtered = M.listings.filter(function (l) {
    if (f.cat !== 'all' && l.type && TYPE_CAT[l.type] !== f.cat) return false;
    if (f.rar !== 'all' && l.rarity.toLowerCase() !== f.rar) return false;
    if (f.search && l.name.toLowerCase().indexOf(f.search) < 0 && l.seller.toLowerCase().indexOf(f.search) < 0) return false;
    if (f.minPrice && l.price < Number(f.minPrice)) return false;
    if (f.maxPrice && l.price > Number(f.maxPrice)) return false;
    return true;
  });

  if (f.sort === 'price_asc') M.filtered.sort(function (a, b) { return a.price - b.price; });
  else if (f.sort === 'price_desc') M.filtered.sort(function (a, b) { return b.price - a.price; });
  else M.filtered.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  renderListings();
}

// ── LISTADOS ───────────────────────────────────────────────
function renderListings() {
  var area = $('listings-area');
  if (!M.filtered.length) {
    area.innerHTML = '<div class="empty-state"><div class="es-icon">🔍</div><p style="font-size:13px">Sin publicaciones para estos filtros</p></div>';
    return;
  }
  area.innerHTML = '<div class="listings-' + (M.viewMode === 'grid' ? 'grid' : 'list') + '" id="listings-wrap"></div>';
  var wrap = $('listings-wrap');
  M.filtered.forEach(function (l) {
    wrap.appendChild(M.viewMode === 'grid' ? makeGridCard(l) : makeListRow(l));
  });
}

function makeGridCard(l) {
  var div = document.createElement('div');
  div.className = 'listing-card' + (M.selected && M.selected.id === l.id ? ' selected' : '');
  div.innerHTML =
    '<div class="lc-rarity-bar" style="background:' + RARITY_COLOR[l.rarity] + '"></div>' +
    '<div class="lc-body">' +
      '<span class="lc-icon">' + l.icon + '</span>' +
      '<div class="lc-name">' + esc(l.name) + '</div>' +
      '<div class="lc-rarity" style="color:' + RARITY_COLOR[l.rarity] + '">' + RARITY_LABEL[l.rarity] + '</div>' +
      '<div class="lc-seller">Vendedor: <span>' + esc(l.seller) + '</span></div>' +
      (l.mine ? '<div class="lc-mia">TU PUBLICACIÓN</div>' : '') +
      '<div class="lc-price-row">' +
        '<div class="lc-price">🪙 ' + n(l.price) + ' <small>oro</small></div>' +
        '<div class="lc-qty-badge">×' + l.qty + '</div>' +
      '</div>' +
    '</div>';
  div.addEventListener('click', function () { select(l); });
  return div;
}

function makeListRow(l) {
  var hours = Math.max(0, Math.round((Date.now() - new Date(l.createdAt)) / 3600000));
  var div = document.createElement('div');
  div.className = 'listing-row' + (M.selected && M.selected.id === l.id ? ' selected' : '');
  div.innerHTML =
    '<div class="lr-icon">' + l.icon + '</div>' +
    '<div class="lr-info">' +
      '<div class="lr-name" style="color:' + RARITY_COLOR[l.rarity] + '">' + esc(l.name) + '</div>' +
      '<div class="lr-meta"><span class="seller">' + esc(l.seller) + '</span> · ' + hours + 'h · ' + RARITY_LABEL[l.rarity] + (l.mine ? ' · <b style="color:#F0D070">TUYA</b>' : '') + '</div>' +
    '</div>' +
    '<div class="lr-qty">×' + l.qty + '</div>' +
    '<div class="lr-price">🪙 ' + n(l.price) + ' <small>por unidad</small></div>';
  div.addEventListener('click', function () { select(l); });
  return div;
}

function select(l) {
  M.selected = l;
  M.buyQty = 1;
  renderListings();
  renderRight(l);
}
function quickSelect(id) {
  var l = M.listings.filter(function (x) { return x.id === id; })[0];
  if (l) select(l);
}

// ── PANEL DE DETALLE ───────────────────────────────────────
function renderRight(l) {
  var rc = $('right-content');
  if (!l) {
    rc.innerHTML = '<div class="empty-detail" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--txt-dim);padding:40px"><div class="ed-icon" style="font-size:42px;opacity:0.25">🏪</div><p style="font-size:13px;text-align:center">Selecciona una publicación</p></div>';
    return;
  }

  var others = M.listings.filter(function (x) { return x.itemId === l.itemId && x.id !== l.id; })
    .sort(function (a, b) { return a.price - b.price; }).slice(0, 4);

  // Historial real de ventas de este objeto
  var sales = M.history.filter(function (t) { return t.itemId === l.itemId; }).slice(-7);
  var histHTML;
  if (sales.length >= 2) {
    var prices = sales.map(function (s) { return s.unitPrice; });
    var maxH = Math.max.apply(null, prices), minH = Math.min.apply(null, prices);
    var bars = prices.map(function (v, i) {
      var h = Math.round(((v - minH) / (maxH - minH || 1)) * 40) + 10;
      var color = i === prices.length - 1 ? 'var(--market)' : 'var(--border-gold)';
      return '<div class="ph-bar-wrap"><div class="ph-bar" style="height:' + h + 'px;background:' + color + '"></div><div class="ph-lbl">' + (i + 1) + '</div></div>';
    }).join('');
    var up = prices[prices.length - 1] > prices[0];
    var pct = Math.abs(Math.round((prices[prices.length - 1] - prices[0]) / prices[0] * 100));
    histHTML =
      '<div class="price-history"><div class="ph-title">Últimas ' + prices.length + ' ventas reales</div>' +
      '<div class="ph-chart">' + bars + '</div>' +
      '<div class="ph-summary"><span style="color:var(--txt-dim)">Mín: 🪙' + n(minH) + '</span>' +
      '<span class="' + (up ? 'up' : 'down') + '">' + (up ? '▲' : '▼') + ' ' + pct + '%</span>' +
      '<span style="color:var(--txt-dim)">Máx: 🪙' + n(maxH) + '</span></div></div>';
  } else {
    histHTML = '<div class="price-history"><div class="ph-title">Historial de precios</div>' +
      '<div style="font-size:12px;color:var(--txt-dim);padding:10px 0">Todavía no hay suficientes ventas registradas de este objeto. El historial se construye con transacciones reales, no con datos de ejemplo.</div></div>';
  }

  var othersHTML = others.length ? others.map(function (o) {
    return '<div class="ol-row"><span class="ol-seller">' + esc(o.seller) + '</span>' +
      '<span class="ol-qty">×' + o.qty + '</span>' +
      '<span class="ol-price">🪙 ' + n(o.price) + '</span>' +
      '<button class="ol-buy" onclick="quickSelect(\\'' + o.id + '\\')">Ver</button></div>';
  }).join('') : '<div style="font-size:12px;color:var(--txt-dim);padding:4px 0">Sin otros vendedores</div>';

  var total = l.price * M.buyQty;
  var canAfford = M.char.gold >= total && !l.mine;

  rc.innerHTML =
    '<div class="detail-panel" id="detail-panel">' +
      '<div class="detail-item-preview">' +
        '<div class="d-icon">' + l.icon + '</div>' +
        '<div class="d-info">' +
          '<div class="d-name" style="color:' + RARITY_COLOR[l.rarity] + '">' + esc(l.name) + '</div>' +
          '<div class="d-rarity" style="color:' + RARITY_COLOR[l.rarity] + '">' + RARITY_LABEL[l.rarity] + '</div>' +
          '<div class="d-desc">Publicado por ' + esc(l.seller) + (l.mine ? ' — es tu publicación' : '') + '</div>' +
        '</div>' +
      '</div>' +
      histHTML +
      '<div class="purchase-section">' +
        '<div class="ps-title">' + (l.mine ? 'Tu publicación' : 'Comprar de ' + esc(l.seller)) + '</div>' +
        '<div class="ps-price-big" id="total-price">🪙 ' + n(total) + '</div>' +
        '<div class="ps-price-each">🪙 ' + n(l.price) + ' por unidad · Disponible: ×' + l.qty + '</div>' +
        (l.mine
          ? '<button class="buy-btn" onclick="cancelMyListing(\\'' + l.id + '\\')">✗ CANCELAR Y RECUPERAR</button>'
          : '<div class="qty-selector"><label>Cantidad</label><div class="qty-ctrl">' +
              '<button class="qty-btn" onclick="changeQty(-1)">−</button>' +
              '<input class="qty-val" type="number" id="buy-qty" value="' + M.buyQty + '" min="1" max="' + l.qty + '" onchange="setQty(this.value)">' +
              '<button class="qty-btn" onclick="changeQty(1)">+</button>' +
            '</div></div>' +
            '<button class="buy-btn" id="buy-btn" onclick="executeBuy()"' + (canAfford ? '' : ' disabled') + '>' +
              (canAfford ? '🛒 COMPRAR ×' + M.buyQty : '✗ Oro insuficiente') +
            '</button>') +
        '<div class="commission-note">El precio y la propiedad los valida el servidor. Comisión del 5 % al vendedor, quemada como sumidero de oro.</div>' +
      '</div>' +
      '<div class="other-listings"><div class="ol-title">Otros vendedores</div>' + othersHTML + '</div>' +
    '</div>';
}

function changeQty(d) {
  if (!M.selected) return;
  M.buyQty = Math.max(1, Math.min(M.selected.qty, M.buyQty + d));
  $('buy-qty').value = M.buyQty;
  updateBuyTotal();
}
function setQty(v) {
  if (!M.selected) return;
  M.buyQty = Math.max(1, Math.min(M.selected.qty, parseInt(v, 10) || 1));
  $('buy-qty').value = M.buyQty;
  updateBuyTotal();
}
function updateBuyTotal() {
  if (!M.selected) return;
  var total = M.selected.price * M.buyQty;
  var can = M.char.gold >= total;
  $('total-price').textContent = '🪙 ' + n(total);
  var b = $('buy-btn');
  if (b) {
    b.disabled = !can;
    b.textContent = can ? '🛒 COMPRAR ×' + M.buyQty : '✗ Oro insuficiente';
  }
}

// ── COMPRA (el servidor decide precio y disponibilidad) ────
async function executeBuy() {
  if (!M.selected || M.busy) return;
  M.busy = true;
  var b = $('buy-btn');
  if (b) { b.disabled = true; b.textContent = 'Procesando…'; }

  var r = await api('/api/market/' + M.selected.id + '/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'buy-' + M.selected.id + '-' + Date.now() },
    body: JSON.stringify({ quantity: M.buyQty }),
  });
  M.busy = false;

  if (!r.ok) {
    showToast('✗ ' + (r.data.error || 'Compra rechazada'), 'red');
    await refreshAll();
    var still = M.listings.filter(function (x) { return x.id === M.selected.id; })[0];
    M.selected = still || null;
    renderRight(M.selected);
    return;
  }

  showToast('✓ Comprado por 🪙' + n(r.data.totalCost) + ' (comisión 🪙' + n(r.data.fee) + ')', 'green');
  M.char.gold = r.data.newGold;
  renderHeader();
  await refreshAll();
  var upd = M.listings.filter(function (x) { return x.id === M.selected.id; })[0];
  M.selected = upd || null;
  M.buyQty = 1;
  renderListings();
  renderRight(M.selected);
  sendToParent('REFRESH_CHARACTER', {});
}

async function cancelMyListing(id) {
  if (M.busy) return;
  M.busy = true;
  var r = await api('/api/market/' + id + '/cancel', { method: 'POST', body: JSON.stringify({}) });
  M.busy = false;
  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo cancelar'), 'red'); return; }
  showToast('✓ Publicación cancelada, objeto devuelto', 'green');
  M.selected = null;
  await refreshAll();
  renderRight(null);
  if (M.mode === 'sell') renderSellPanel();
  sendToParent('REFRESH_CHARACTER', {});
}

// ── ESTADÍSTICAS Y TENDENCIAS (datos reales) ───────────────
function renderStats() {
  var el = $('stat-active');
  if (el) el.textContent = n(M.listings.length);
  var box = el && el.parentElement && el.parentElement.parentElement;
  if (!box) return;
  var vol = M.history.reduce(function (a, t) { return a + t.total; }, 0);
  var fees = M.history.reduce(function (a, t) { return a + (t.fee || 0); }, 0);
  var extra = box.querySelector('.mkt-extra');
  if (!extra) {
    extra = document.createElement('div');
    extra.className = 'mkt-extra';
    box.appendChild(extra);
  }
  extra.innerHTML =
    '<div class="mkt-stat-row"><span>Ventas registradas</span><b>' + n(M.history.length) + '</b></div>' +
    '<div class="mkt-stat-row"><span>Volumen acumulado</span><b>🪙' + n(vol) + '</b></div>' +
    '<div class="mkt-stat-row"><span>Comisión quemada</span><b>🪙' + n(fees) + '</b></div>';
}

function renderTrending() {
  var el = $('trending-list');
  if (!el) return;
  var counts = {};
  M.history.forEach(function (t) {
    if (!counts[t.itemId]) counts[t.itemId] = { qty: 0, total: 0, n: 0 };
    counts[t.itemId].qty += t.quantity;
    counts[t.itemId].total += t.total;
    counts[t.itemId].n += t.quantity;
  });
  var rows = Object.keys(counts).map(function (k) {
    var l = M.listings.filter(function (x) { return x.itemId === k; })[0];
    return { itemId: k, name: (l && l.name) || k, icon: (l && l.icon) || '📦', qty: counts[k].qty, avg: Math.round(counts[k].total / counts[k].n), id: l && l.id };
  }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

  if (!rows.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--txt-dim);padding:6px 0">Sin ventas todavía. Esta lista se llena con transacciones reales.</div>';
    return;
  }
  el.innerHTML = rows.map(function (r) {
    return '<div class="trend-item"' + (r.id ? ' onclick="quickSelect(\\'' + r.id + '\\')"' : '') + '>' +
      '<span style="font-size:18px">' + r.icon + '</span>' +
      '<div style="flex:1"><div style="font-size:12px">' + esc(r.name) + '</div>' +
      '<div style="font-size:10px;color:var(--txt-dim)">' + r.qty + ' vendidos · media 🪙' + n(r.avg) + '</div></div></div>';
  }).join('');
}

// ── MODO VENTA ─────────────────────────────────────────────
function setMode(mode, btn) {
  M.mode = mode;
  document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var sp = $('sell-area');
  if (mode === 'buy') {
    $('market-main').style.display = '';
    $('left-sidebar').style.display = '';
    $('right-sidebar').style.display = '';
    if (sp) sp.style.display = 'none';
    document.querySelector('.layout').style.gridTemplateColumns = '';
    refreshAll();
  } else {
    renderSellPanel();
  }
}

function sellable() {
  return M.inventory.filter(function (i) { return i.tradeable !== false; });
}

function renderSellPanel() {
  $('market-main').style.display = 'none';
  $('left-sidebar').style.display = 'none';
  $('right-sidebar').style.display = 'none';
  document.querySelector('.layout').style.gridTemplateColumns = '1fr';

  var sp = $('sell-area');
  if (!sp) {
    sp = document.createElement('div');
    sp.id = 'sell-area';
    sp.style.cssText = 'flex:1;overflow:auto;display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 52px);';
    document.querySelector('.layout').appendChild(sp);
  }
  sp.style.display = 'grid';

  var items = sellable();
  var picker = items.map(function (item, i) {
    return '<div class="inv-pick-slot r-' + item.rarity.toLowerCase() + (M.sellItem && M.sellItem.uid === item.uid ? ' selected' : '') + '" onclick="pickSellItem(' + i + ')">' +
      '<div class="ps-icon">' + (item.icon || '📦') + '</div>' +
      '<div class="ps-qty">×' + item.quantity + '</div>' +
      '<div class="rarity-bar"></div></div>';
  }).join('') || '<div style="font-size:12px;color:var(--txt-dim);padding:8px">No tienes objetos comerciables.</div>';

  var mine = M.listings.filter(function (l) { return l.mine; });
  var mineHTML = mine.map(function (ml) {
    var hoursLeft = Math.max(0, Math.round((new Date(ml.expiresAt) - Date.now()) / 3600000));
    return '<div class="ml-row"><span class="ml-icon">' + ml.icon + '</span>' +
      '<div class="ml-info"><div class="ml-name">' + esc(ml.name) + ' ×' + ml.qty + '</div>' +
      '<div class="ml-meta">Expira en ' + hoursLeft + 'h</div></div>' +
      '<span class="ml-price">🪙' + n(ml.price) + '</span>' +
      '<button class="ml-cancel" onclick="cancelMyListing(\\'' + ml.id + '\\')">Cancelar</button></div>';
  }).join('');

  var form;
  if (M.sellItem) {
    var suggested = suggestPrice(M.sellItem.itemId);
    form =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
        '<span style="font-size:32px">' + (M.sellItem.icon || '📦') + '</span>' +
        '<div><div style="font-family:\\'Cinzel\\',serif;font-size:14px;color:' + RARITY_COLOR[M.sellItem.rarity] + '">' + esc(M.sellItem.name) + '</div>' +
        '<div style="font-size:11px;color:var(--txt-dim)">En inventario: ×' + M.sellItem.quantity + '</div></div>' +
      '</div>' +
      '<div class="sf-row"><div class="sf-label">Cantidad a vender</div>' +
        '<input class="sf-input" type="number" id="sell-qty" value="1" min="1" max="' + M.sellItem.quantity + '" oninput="updateSellPreview()"></div>' +
      '<div class="sf-row"><div class="sf-label">Precio por unidad (oro)</div>' +
        '<input class="sf-input" type="number" id="sell-price" value="' + suggested + '" min="1" oninput="updateSellPreview()">' +
        '<div class="sf-hint" id="sell-hint">' + (suggested ? 'Media de ventas reales: <b>🪙' + suggested + '</b>' : 'Sin ventas previas de este objeto') + '</div></div>' +
      '<div class="sf-row"><div class="sf-label">Recibirás (tras comisión 5 %)</div>' +
        '<div id="sell-net" style="font-family:\\'JetBrains Mono\\',monospace;font-size:18px;color:var(--sell)">🪙' + Math.floor(suggested * 0.95) + '</div></div>' +
      '<button class="sell-submit" id="sell-submit-btn" onclick="submitListing()">💰 PUBLICAR EN MERCADO</button>';
  } else {
    form = '<div style="text-align:center;color:var(--txt-dim);font-size:13px;padding:20px">Selecciona un objeto del inventario</div>';
  }

  sp.innerHTML =
    '<div class="sell-panel">' +
      '<div class="sp-pick-title">Selecciona objeto para vender</div>' +
      '<div class="inv-pick-grid">' + picker + '</div>' +
      '<div class="sell-form" id="sell-form">' + form + '</div>' +
    '</div>' +
    '<div class="sell-panel">' +
      '<div class="my-listings">' +
        '<div style="font-family:\\'Cinzel\\',serif;font-size:10px;color:var(--txt-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Mis publicaciones activas (' + mine.length + ')</div>' +
        (mine.length ? mineHTML : '<div style="font-size:12px;color:var(--txt-dim);padding:4px 0">No tienes objetos en venta</div>') +
      '</div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:12px">' +
        '<div style="font-family:\\'Cinzel\\',serif;font-size:10px;color:var(--txt-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Reglas del mercado</div>' +
        '<div style="font-size:12px;color:var(--txt-dim);line-height:1.8">' +
          '📌 Comisión del 5 %, quemada como sumidero de oro<br>' +
          '🔒 Al publicar, el objeto sale de tu inventario (escrow) y vuelve si cancelas<br>' +
          '⏱️ Las publicaciones expiran en 48 horas<br>' +
          '🚫 Máximo 20 publicaciones activas a la vez<br>' +
          '💰 El servidor valida precio y propiedad en cada compra' +
        '</div>' +
      '</div>' +
    '</div>';
}

function suggestPrice(itemId) {
  var sales = M.history.filter(function (t) { return t.itemId === itemId; });
  if (sales.length) return Math.round(sales.reduce(function (a, t) { return a + t.unitPrice; }, 0) / sales.length);
  var act = M.listings.filter(function (l) { return l.itemId === itemId; });
  if (act.length) return Math.round(act.reduce(function (a, l) { return a + l.price; }, 0) / act.length);
  return 10;
}

window.pickSellItem = function (i) {
  M.sellItem = sellable()[i];
  renderSellPanel();
};

function updateSellPreview() {
  var q = Math.max(1, parseInt($('sell-qty').value, 10) || 1);
  var p = Math.max(1, parseInt($('sell-price').value, 10) || 1);
  $('sell-net').textContent = '🪙' + n(Math.floor(p * q * 0.95));
}

async function submitListing() {
  if (!M.sellItem || M.busy) return;
  var q = Math.max(1, parseInt($('sell-qty').value, 10) || 1);
  var p = Math.max(1, parseInt($('sell-price').value, 10) || 1);
  M.busy = true;
  $('sell-submit-btn').disabled = true;

  var r = await api('/api/market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'sell-' + M.sellItem.uid + '-' + Date.now() },
    body: JSON.stringify({ itemId: M.sellItem.itemId, quantity: q, pricePerUnit: p }),
  });
  M.busy = false;

  if (!r.ok) { showToast('✗ ' + (r.data.error || 'No se pudo publicar'), 'red'); renderSellPanel(); return; }
  showToast('✓ Publicado ×' + q + ' a 🪙' + n(p) + ' cada uno', 'green');
  M.sellItem = null;
  await refreshAll();
  renderSellPanel();
  sendToParent('REFRESH_CHARACTER', {});
}

// ── UTILIDADES ─────────────────────────────────────────────
function showToast(msg, type) {
  var t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

function sendToParent(type, payload) {
  try { window.parent.postMessage({ type: type, payload: payload }, '*'); } catch (e) {}
}
window.addEventListener('message', function (event) {
  var d = event.data || {};
  if (d.type === 'CHARACTER_DATA' && d.data && d.data.character) { M.char = d.data.character; renderHeader(); }
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
