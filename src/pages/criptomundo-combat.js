PAGES['criptomundo-combat.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Combate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --bg-void:      #080A0E;
    --bg-deep:      #0D0F14;
    --bg-panel:     #13161E;
    --bg-card:      #1A1D27;
    --bg-hover:     #22263A;
    --gold:         #C8A84B;
    --gold-dim:     #8A7030;
    --gold-bright:  #F0D070;
    --red:          #8B1A1A;
    --red-bright:   #E03030;
    --green:        #1A6B3A;
    --green-bright: #30C060;
    --blue:         #1A3A8B;
    --blue-bright:  #4090F0;
    --purple:       #6B1A8B;
    --purple-bright:#C040F0;
    --orange:       #C06010;
    --orange-bright:#F0A030;
    --stone:        #3A3D47;
    --stone-light:  #6A6D77;
    --text-primary: #E8E0CC;
    --text-dim:     #9A9080;
    --text-gold:    #C8A84B;
    --border:       #2A2D3A;
    --border-gold:  #5A4A20;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: var(--bg-void);
    color: var(--text-primary);
    font-family: 'Crimson Pro', Georgia, serif;
    min-height: 100vh;
    overflow-x: hidden;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(200,168,75,0.08) 0%, transparent 60%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A84B' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  /* ── HEADER ── */
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: linear-gradient(180deg, rgba(200,168,75,0.12) 0%, transparent 100%);
    border-bottom: 1px solid var(--border-gold);
  }
  .logo {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 22px;
    color: var(--gold);
    letter-spacing: 3px;
    text-shadow: 0 0 30px rgba(200,168,75,0.4);
  }
  .logo span { color: var(--text-dim); font-weight: 400; font-size: 13px; letter-spacing: 2px; display:block; margin-top:-2px; }
  .header-stats {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  .stat-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }
  .stat-badge .icon { font-size: 16px; }
  .stat-badge .val { color: var(--gold); font-weight: 600; }
  .stat-badge .lbl { color: var(--text-dim); font-size: 11px; }

  /* ── MAIN LAYOUT ── */
  .game-layout {
    display: grid;
    grid-template-columns: 260px 1fr 280px;
    grid-template-rows: 1fr;
    height: calc(100vh - 56px);
    gap: 0;
  }

  /* ── PANELS ── */
  .panel {
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--stone) transparent;
  }
  .panel:last-child { border-right: none; border-left: 1px solid var(--border); }
  .panel-title {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dim);
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-title::before {
    content: '';
    width: 3px;
    height: 12px;
    background: var(--gold);
    border-radius: 2px;
  }

  /* ── CHARACTER PANEL ── */
  .char-avatar {
    margin: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-gold);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .char-avatar::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(200,168,75,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .avatar-sprite {
    font-size: 52px;
    line-height: 1;
    margin-bottom: 8px;
    filter: drop-shadow(0 0 16px rgba(200,168,75,0.3));
  }
  .char-name {
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--gold);
    margin-bottom: 2px;
  }
  .char-class {
    font-size: 12px;
    color: var(--text-dim);
    letter-spacing: 1px;
  }
  .char-level {
    display: inline-block;
    background: var(--red);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    margin-top: 6px;
  }

  /* ── BARS ── */
  .bars { padding: 0 16px 8px; display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; flex-direction: column; gap: 4px; }
  .bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
  }
  .bar-label span:last-child { color: var(--text-primary); }
  .bar-track {
    height: 8px;
    background: var(--bg-card);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(.4,0,.2,1);
    position: relative;
  }
  .bar-fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .bar-hp   { background: linear-gradient(90deg, var(--red) 0%, var(--red-bright) 100%); }
  .bar-mp   { background: linear-gradient(90deg, var(--blue) 0%, var(--blue-bright) 100%); }
  .bar-xp   { background: linear-gradient(90deg, var(--gold-dim) 0%, var(--gold) 100%); }

  /* ── STATS GRID ── */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 8px 16px 16px;
  }
  .stat-item {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-item .s-lbl { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }
  .stat-item .s-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* ── EQUIPMENT ── */
  .equip-section { padding: 8px 16px 16px; }
  .equip-title { font-size: 11px; color: var(--text-dim); letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; }
  .equip-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .equip-slot {
    aspect-ratio: 1;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .equip-slot:hover { border-color: var(--gold-dim); background: var(--bg-hover); }
  .equip-slot .e-icon { font-size: 22px; }
  .equip-slot .e-lbl { font-size: 9px; color: var(--text-dim); letter-spacing: 0.5px; }
  .equip-slot.rare   { border-color: var(--blue-bright); box-shadow: 0 0 8px rgba(64,144,240,0.2); }
  .equip-slot.epic   { border-color: var(--purple-bright); box-shadow: 0 0 8px rgba(192,64,240,0.2); }
  .rarity-dot {
    position: absolute;
    top: 4px; right: 4px;
    width: 6px; height: 6px;
    border-radius: 50%;
  }
  .dot-rare   { background: var(--blue-bright); }
  .dot-epic   { background: var(--purple-bright); }
  .dot-uncommon { background: var(--green-bright); }

  /* ── COMBAT ARENA ── */
  .combat-arena {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .arena-scene {
    flex: 0 0 auto;
    position: relative;
    height: 260px;
    background: linear-gradient(180deg, #0A0C10 0%, #141820 60%, #1A1D27 100%);
    overflow: hidden;
    border-bottom: 1px solid var(--border);
  }
  .arena-bg-glow {
    position: absolute;
    width: 300px; height: 150px;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.15;
    pointer-events: none;
  }
  .glow-left  { background: var(--blue-bright); left: 10%; top: 20%; }
  .glow-right { background: var(--red-bright); right: 10%; top: 20%; }

  .fighters {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 20px 60px 40px;
  }

  .fighter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
  }
  .fighter-sprite {
    font-size: 72px;
    line-height: 1;
    filter: drop-shadow(0 4px 20px rgba(0,0,0,0.8));
    transition: transform 0.3s;
    cursor: default;
    user-select: none;
  }
  .fighter.attack-anim .fighter-sprite { animation: attackSlide 0.4s ease-in-out; }
  .fighter.enemy .fighter-sprite { transform: scaleX(-1); }
  .fighter.enemy.attack-anim .fighter-sprite { animation: attackSlideEnemy 0.4s ease-in-out; }
  .fighter.shake .fighter-sprite { animation: shake 0.4s ease-in-out; }

  @keyframes attackSlide {
    0%   { transform: translateX(0); }
    40%  { transform: translateX(60px); }
    100% { transform: translateX(0); }
  }
  @keyframes attackSlideEnemy {
    0%   { transform: scaleX(-1) translateX(0); }
    40%  { transform: scaleX(-1) translateX(60px); }
    100% { transform: scaleX(-1) translateX(0); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%  { transform: translateX(-8px); }
    40%  { transform: translateX(8px); }
    60%  { transform: translateX(-6px); }
    80%  { transform: translateX(6px); }
  }
  .fighter.enemy.shake .fighter-sprite { animation: shakeEnemy 0.4s ease-in-out; }
  @keyframes shakeEnemy {
    0%,100% { transform: scaleX(-1) translateX(0); }
    20%  { transform: scaleX(-1) translateX(-8px); }
    40%  { transform: scaleX(-1) translateX(8px); }
    60%  { transform: scaleX(-1) translateX(-6px); }
    80%  { transform: scaleX(-1) translateX(6px); }
  }

  .fighter-name-tag {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
  }
  .fighter-hp-bar {
    width: 120px;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  .fighter-hp-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(.4,0,.2,1);
  }
  .player-hp-fill { background: linear-gradient(90deg, #C02020, #F03030); }
  .enemy-hp-fill  { background: linear-gradient(90deg, #20A050, #40F080); }

  .vs-text {
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -60%);
    font-family: 'Cinzel', serif;
    font-size: 28px;
    font-weight: 900;
    color: var(--gold);
    text-shadow: 0 0 30px rgba(200,168,75,0.6);
    letter-spacing: 4px;
    opacity: 0.6;
    pointer-events: none;
  }

  /* floating damage numbers */
  .dmg-float {
    position: absolute;
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 22px;
    pointer-events: none;
    animation: floatUp 1.2s ease-out forwards;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    z-index: 10;
  }
  @keyframes floatUp {
    0%   { opacity: 1; transform: translateY(0) scale(1.2); }
    60%  { opacity: 1; transform: translateY(-40px) scale(1); }
    100% { opacity: 0; transform: translateY(-70px) scale(0.8); }
  }
  .dmg-player { color: #F03030; }
  .dmg-enemy  { color: #F0F030; }
  .dmg-heal   { color: var(--green-bright); }
  .dmg-miss   { color: var(--text-dim); font-size: 16px; }

  /* ── COMBAT LOG ── */
  .combat-log {
    flex: 1 1 0;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--stone) transparent;
    min-height: 0;
  }
  .log-entry {
    font-size: 13px;
    color: var(--text-dim);
    padding: 4px 8px;
    border-radius: 4px;
    border-left: 2px solid transparent;
    line-height: 1.4;
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: none; } }
  .log-entry.attack  { border-color: var(--red-bright); color: var(--text-primary); }
  .log-entry.enemy   { border-color: var(--orange-bright); }
  .log-entry.loot    { border-color: var(--gold); background: rgba(200,168,75,0.06); color: var(--gold); }
  .log-entry.heal    { border-color: var(--green-bright); color: var(--green-bright); }
  .log-entry.system  { border-color: var(--blue-bright); color: var(--blue-bright); }
  .log-entry.victory { border-color: var(--gold); background: rgba(200,168,75,0.1); color: var(--gold-bright); font-family: 'Cinzel', serif; font-weight: 600; }
  .log-entry .log-icon { margin-right: 6px; }

  /* ── ACTION BAR ── */
  .action-bar {
    flex: 0 0 auto;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg-panel);
  }
  .action-title {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .action-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 6px 8px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
  }
  .action-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--btn-glow, transparent);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .action-btn:hover:not(:disabled)::before { opacity: 0.08; }
  .action-btn:hover:not(:disabled) {
    border-color: var(--btn-border, var(--gold-dim));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }
  .action-btn:active:not(:disabled) { transform: translateY(0); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn .a-icon { font-size: 24px; }
  .action-btn .a-name { font-size: 11px; font-family: 'Cinzel', serif; letter-spacing: 0.5px; }
  .action-btn .a-cost { font-size: 10px; color: var(--blue-bright); font-family: 'JetBrains Mono', monospace; }
  .action-btn.type-attack { --btn-glow: var(--red-bright); --btn-border: var(--red-bright); }
  .action-btn.type-magic  { --btn-glow: var(--blue-bright); --btn-border: var(--blue-bright); }
  .action-btn.type-heal   { --btn-glow: var(--green-bright); --btn-border: var(--green-bright); }
  .action-btn.type-flee   { --btn-glow: var(--stone-light); --btn-border: var(--stone-light); }

  /* enemy turn overlay */
  .enemy-turn-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    color: var(--orange-bright);
    letter-spacing: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 5;
  }
  .enemy-turn-overlay.active { opacity: 1; pointer-events: all; }

  /* ── INVENTORY PANEL ── */
  .inventory-panel { padding-bottom: 16px; }
  .inv-filter {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .filter-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 10px;
    color: var(--text-dim);
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.15s;
    font-family: 'Crimson Pro', serif;
  }
  .filter-btn:hover, .filter-btn.active {
    background: var(--bg-hover);
    border-color: var(--gold-dim);
    color: var(--gold);
  }

  .inv-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: 10px 12px;
  }
  .inv-slot {
    aspect-ratio: 1;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .inv-slot:hover { border-color: var(--gold-dim); background: var(--bg-hover); }
  .inv-slot.empty { opacity: 0.25; cursor: default; }
  .inv-slot .i-icon { font-size: 20px; }
  .inv-slot .i-qty {
    position: absolute;
    bottom: 2px; right: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    font-weight: 600;
  }
  .inv-slot .rarity-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
  }

  /* RARITY COLORS */
  .r-common   .rarity-bar { background: #9D9D9D; }
  .r-uncommon .rarity-bar { background: #1EFF00; }
  .r-rare     .rarity-bar { background: #0070DD; }
  .r-epic     .rarity-bar { background: #A335EE; }
  .r-legendary .rarity-bar { background: #FF8000; }
  .r-common   { border-color: #3D3D3D; }
  .r-uncommon { border-color: #0F4F00; }
  .r-rare     { border-color: #003F7A; }
  .r-epic     { border-color: #4A1A7A; }
  .r-legendary { border-color: #7A4000; box-shadow: 0 0 8px rgba(255,128,0,0.2); }

  /* tooltip */
  .tooltip {
    position: fixed;
    background: var(--bg-panel);
    border: 1px solid var(--border-gold);
    border-radius: 8px;
    padding: 12px 14px;
    min-width: 180px;
    pointer-events: none;
    z-index: 100;
    opacity: 0;
    transition: opacity 0.15s;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  }
  .tooltip.visible { opacity: 1; }
  .tt-name { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .tt-rarity { font-size: 11px; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; }
  .tt-stat { font-size: 13px; color: var(--text-dim); margin-bottom: 2px; }
  .tt-stat span { color: var(--text-primary); }
  .tt-desc { font-size: 12px; color: var(--text-dim); font-style: italic; margin-top: 8px; border-top: 1px solid var(--border); padding-top: 6px; }
  .r-common .tt-rarity    { color: #9D9D9D; }
  .r-uncommon .tt-rarity  { color: #1EFF00; }
  .r-rare .tt-rarity      { color: #0070DD; }
  .r-epic .tt-rarity      { color: #A335EE; }
  .r-legendary .tt-rarity { color: #FF8000; }

  /* loot notification */
  .loot-notif {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--bg-panel);
    border: 1px solid var(--gold);
    border-radius: 10px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    color: var(--gold);
    box-shadow: 0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(200,168,75,0.15);
    opacity: 0;
    pointer-events: none;
    transition: all 0.4s cubic-bezier(.4,0,.2,1);
    z-index: 200;
    white-space: nowrap;
  }
  .loot-notif.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .loot-notif .ln-icon { font-size: 24px; }

  /* victory overlay */
  .victory-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 300;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s;
  }
  .victory-overlay.show { opacity: 1; pointer-events: all; }
  .victory-title {
    font-family: 'Cinzel', serif;
    font-size: 48px;
    font-weight: 900;
    color: var(--gold);
    text-shadow: 0 0 60px rgba(200,168,75,0.6);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100% { text-shadow: 0 0 40px rgba(200,168,75,0.4); } 50% { text-shadow: 0 0 80px rgba(200,168,75,0.8); } }
  .victory-rewards {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: var(--bg-panel);
    border: 1px solid var(--border-gold);
    border-radius: 12px;
    padding: 20px 40px;
  }
  .victory-rewards h3 { font-family: 'Cinzel', serif; color: var(--text-dim); font-size: 12px; letter-spacing: 3px; margin-bottom: 8px; }
  .reward-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    color: var(--text-primary);
  }
  .victory-btn {
    background: linear-gradient(135deg, var(--gold-dim) 0%, var(--gold) 100%);
    border: none;
    border-radius: 8px;
    padding: 12px 36px;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--bg-void);
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.2s;
    margin-top: 8px;
  }
  .victory-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,168,75,0.3); }

  /* defeat overlay */
  .defeat-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 300;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s;
  }
  .defeat-overlay.show { opacity: 1; pointer-events: all; }
  .defeat-title {
    font-family: 'Cinzel', serif;
    font-size: 48px;
    font-weight: 900;
    color: var(--red-bright);
    text-shadow: 0 0 60px rgba(224,48,48,0.6);
  }
  .defeat-btn {
    background: linear-gradient(135deg, var(--red) 0%, var(--red-bright) 100%);
    border: none;
    border-radius: 8px;
    padding: 12px 36px;
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.2s;
  }
  .defeat-btn:hover { transform: translateY(-2px); }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--stone); border-radius: 2px; }

  /* responsive safety */
  @media (max-width: 900px) {
    .game-layout { grid-template-columns: 1fr; grid-template-rows: auto; height: auto; }
    .panel { border-right: none; border-bottom: 1px solid var(--border); }
    .arena-scene { height: 200px; }
  }

  /* ── v3.1: telegrafía, combo, fases, selector ── */
  .telegraph {
    position: absolute; left: 50%; top: 10px; transform: translateX(-50%) translateY(-14px);
    background: linear-gradient(180deg, rgba(224,48,48,.22), rgba(0,0,0,.65));
    border: 1px solid var(--red-bright); color: #FFD9D9;
    padding: 9px 18px; border-radius: 6px; font-size: 14px; letter-spacing: .4px;
    opacity: 0; pointer-events: none; transition: all .25s ease; z-index: 6; white-space: nowrap;
  }
  .telegraph.show { opacity: 1; transform: translateX(-50%) translateY(0); animation: tgPulse 1s ease-in-out infinite; }
  @keyframes tgPulse { 0%,100% { box-shadow: 0 0 0 rgba(224,48,48,0); } 50% { box-shadow: 0 0 22px rgba(224,48,48,.55); } }

  .badge {
    position: absolute; font-family: 'Cinzel', serif; font-weight: 900; font-size: 13px;
    padding: 5px 12px; border-radius: 4px; opacity: 0; transition: all .2s ease; z-index: 6;
  }
  .badge.show { opacity: 1; }
  .combo-badge { left: 16px; bottom: 14px; color: #0B0D12; background: linear-gradient(180deg,#F0D070,#C8A84B); }
  .phase-badge { right: 16px; top: 14px; color: #FFE0E0; background: rgba(139,26,26,.85); border: 1px solid var(--red-bright); }

  .fighter.charging .fighter-sprite { animation: chargeShake .35s ease-in-out infinite; filter: drop-shadow(0 0 14px rgba(224,48,48,.8)); }
  @keyframes chargeShake { 0%,100% { transform: translateX(0) scale(1.04); } 50% { transform: translateX(4px) scale(1.08); } }

  .action-btn.type-block { --btn-glow: var(--gold-bright); --btn-border: var(--gold-bright); }

  /* El arma equipada, colgada del sprite del jugador. Sale del mismo
     sitio que en la arena: el catalogo del servidor. */
  /* Colgada de .fighter, que ya es position:relative. Antes iba dentro
     de .fighter-sprite y el aplicador de skins la borraba al reescribir
     ese elemento con el aspecto del personaje. */
  .arma-jugador {
    /* Colgando del lado derecho del personaje, a la altura de la mano.
       Centrada quedaba clavada en mitad de la cara. */
    position: absolute; right: -10px; bottom: -6px;
    width: 46px; height: 46px; image-rendering: pixelated;
    font-size: 32px; line-height: 46px; text-align: center;
    transform-origin: 30% 70%; z-index: 4;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,.7));
    pointer-events: none;
  }
  .arma-jugador:empty { display: none; }
  .arma-jugador img { width: 46px; height: 46px; image-rendering: pixelated; }
  /* preparacion -> golpe -> recuperacion, las mismas fases que en la
     arena, para que un arma se sienta igual en los dos combates. */
  @keyframes arma-golpe {
    0%   { transform: rotate(0deg) translateX(0); }
    28%  { transform: rotate(-38deg) translateX(-4px); }
    58%  { transform: rotate(46deg) translateX(16px); }
    100% { transform: rotate(0deg) translateX(0); }
  }
  .arma-jugador.golpe { animation: arma-golpe .42s ease-out; }

  .destello-elemento {
    position: absolute; inset: 0; pointer-events: none;
    animation: destello .5s ease-out forwards;
  }
  @keyframes destello { from { opacity: .9; } to { opacity: 0; } }

  .dmg-crit { color: #F0D070 !important; font-size: 30px !important; text-shadow: 0 0 12px #F0D070; }

  /* Selector de objetos: se abre sobre la escena y se cierra al elegir
     o al tocar fuera. */
  .objetos-panel { display: none; position: absolute; inset: 0; z-index: 30;
    background: rgba(5,7,10,.86); padding: 16px; overflow-y: auto; }
  .objetos-panel.abierto { display: flex; flex-direction: column; gap: 8px; }
  .obj-item { display: flex; align-items: center; gap: 10px; width: 100%;
    background: #161A24; border: 1px solid #2A2418; border-radius: 9px;
    padding: 9px 12px; color: #E8E0CC; cursor: pointer; font-family: inherit;
    text-align: left; min-height: 44px; }
  .obj-item:hover { border-color: #C8A84B; }
  .obj-ico { font-size: 20px; min-width: 24px; }
  .obj-ico img { width: 20px; height: 20px; image-rendering: pixelated; vertical-align: middle; }
  .obj-txt { flex: 1; font-size: 12px; line-height: 1.4; }
  .obj-txt small { color: #7A7060; }
  .obj-cant { color: #C8A84B; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .obj-item.apagado { opacity: .45; cursor: not-allowed; }
  .obj-item.apagado:hover { border-color: #2A2418; }

  /* Efectos activos, uno a cada lado. Los refuerzos y venenos existian
     desde siempre y no se veian en ninguna parte: bebias una pocion de
     fuerza y no habia forma de saber si seguia haciendo efecto. */
  .estados-fila { position: absolute; top: 8px; display: flex; gap: 4px; flex-wrap: wrap;
    max-width: 44%; z-index: 6; pointer-events: none; }
  .estados-izq { left: 10px; }
  .estados-der { right: 10px; justify-content: flex-end; }
  .estado-chip { font-size: 10px; padding: 2px 6px; border-radius: 10px;
    font-family: 'JetBrains Mono', monospace; border: 1px solid; white-space: nowrap; }
  .estado-chip.bueno { color: #7FD4A0; border-color: #2E6B48; background: rgba(48,192,96,.14); }
  .estado-chip.malo  { color: #E89090; border-color: #6B2E2E; background: rgba(224,48,48,.14); }
  .estado-chip.aviso { color: #F0D070; border-color: #6B5A2E; background: rgba(240,208,112,.14); }

  @media (prefers-reduced-motion: reduce) {
    .arma-jugador.golpe, .destello-elemento { animation: none; }
  }
  .action-btn.urgent { animation: urgent .6s ease-in-out infinite; }
  @keyframes urgent { 0%,100% { box-shadow: 0 0 0 rgba(240,208,112,0); } 50% { box-shadow: 0 0 18px rgba(240,208,112,.8); } }

  .monster-picker { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; }
  .mon-btn {
    background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);
    border-radius: 6px; padding: 6px 9px; cursor: pointer; font-size: 19px; line-height: 1;
    display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all .15s ease;
  }
  .mon-btn span { font-size: 9px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }
  .mon-btn:hover:not(:disabled) { border-color: var(--gold); transform: translateY(-2px); }
  .mon-btn.active { border-color: var(--gold-bright); box-shadow: 0 0 12px rgba(240,208,112,.35); }
  .mon-btn.locked, .mon-btn:disabled { opacity: .32; cursor: not-allowed; }
  .keys { font-size: 10px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; margin-left: 8px; letter-spacing: 0; }



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
  <div class="logo">CRIPTOMUNDO<span>ALPHA v0.1</span></div>
  <div class="header-stats">
    <div class="stat-badge">
      <span class="icon">🪙</span>
      <div>
        <div class="val" id="gold-count">1,240</div>
        <div class="lbl">ORO</div>
      </div>
    </div>
    <div class="stat-badge">
      <span class="icon">💎</span>
      <div>
        <div class="val" id="crypto-count">12</div>
        <div class="lbl">$CGRID</div>
      </div>
    </div>
    <div class="stat-badge">
      <span class="icon">⚔️</span>
      <div>
        <div class="val" id="kills-count">0</div>
        <div class="lbl">BAJAS</div>
      </div>
    </div>
  </div>
</header>

<div class="game-layout">

  <!-- ── CHARACTER PANEL ── -->
  <aside class="panel">
    <div class="panel-title">Personaje</div>
    <div class="char-avatar">
      <div class="avatar-sprite" id="avatar-jugador">🧙</div>
      <div class="char-name">Sebastián</div>
      <div class="char-class">Archimago de las Runas</div>
      <div class="char-level">NV. 12</div>
    </div>

    <div class="bars">
      <div class="bar-row">
        <div class="bar-label"><span>❤️ VIDA</span><span id="hp-text">850 / 850</span></div>
        <div class="bar-track"><div class="bar-fill bar-hp" id="hp-bar" style="width:100%"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>🔷 MANÁ</span><span id="mp-text">400 / 400</span></div>
        <div class="bar-track"><div class="bar-fill bar-mp" id="mp-bar" style="width:100%"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label"><span>✨ EXP</span><span id="xp-text">3,200 / 5,000</span></div>
        <div class="bar-track"><div class="bar-fill bar-xp" id="xp-bar" style="width:64%"></div></div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item"><div class="s-lbl">Fuerza</div><div class="s-val" id="stat-str">24</div></div>
      <div class="stat-item"><div class="s-lbl">Inteligencia</div><div class="s-val" id="stat-int">68</div></div>
      <div class="stat-item"><div class="s-lbl">Agilidad</div><div class="s-val" id="stat-agi">31</div></div>
      <div class="stat-item"><div class="s-lbl">Defensa</div><div class="s-val" id="stat-def">42</div></div>
      <div class="stat-item"><div class="s-lbl">Ataque</div><div class="s-val">85–120</div></div>
      <div class="stat-item"><div class="s-lbl">Crítico</div><div class="s-val">18%</div></div>
    </div>

    <div class="equip-section">
      <div class="equip-title">Equipamiento</div>
      <div class="equip-grid">
        <div class="equip-slot epic" title="Vara del Vacío Eterno">
          <div class="rarity-dot dot-epic"></div>
          <div class="e-icon">🪄</div><div class="e-lbl">Arma</div>
        </div>
        <div class="equip-slot rare">
          <div class="rarity-dot dot-rare"></div>
          <div class="e-icon">🎩</div><div class="e-lbl">Cabeza</div>
        </div>
        <div class="equip-slot rare">
          <div class="rarity-dot dot-rare"></div>
          <div class="e-icon">🥋</div><div class="e-lbl">Pecho</div>
        </div>
        <div class="equip-slot" style="border-color:#3A3D47">
          <div class="e-icon">👟</div><div class="e-lbl">Pies</div>
        </div>
        <div class="equip-slot" style="border-color:#3A3D47">
          <div class="e-icon">💍</div><div class="e-lbl">Anillo</div>
        </div>
        <div class="equip-slot rare">
          <div class="rarity-dot dot-uncommon"></div>
          <div class="e-icon">🧣</div><div class="e-lbl">Cuello</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- ── COMBAT ARENA ── -->
  <main class="combat-arena">
    <div class="arena-scene" id="arena">
      <div class="arena-bg-glow glow-left"></div>
      <div class="arena-bg-glow glow-right"></div>

      <div class="vs-text">VS</div>

      <div class="fighters">
        <div class="fighter" id="player-fighter">
          <div class="fighter-name-tag">Sebastián</div>
          <div class="fighter-hp-bar"><div class="fighter-hp-fill player-hp-fill" id="player-sprite-hp" style="width:100%"></div></div>
          <div class="fighter-sprite" id="sprite-jugador">🧙</div>
          <!-- El arma va FUERA del sprite. Dentro no puede estar: el
               aplicador de skins reescribe ese elemento entero
               (el.innerHTML = ...) y se llevaba el arma por delante. -->
          <span class="arma-jugador" id="arma-jugador"></span>
        </div>
        <div class="fighter enemy" id="enemy-fighter">
          <div class="fighter-name-tag" id="enemy-name-tag">Troll Sombrío</div>
          <div class="fighter-hp-bar"><div class="fighter-hp-fill enemy-hp-fill" id="enemy-sprite-hp" style="width:100%"></div></div>
          <div class="fighter-sprite" id="enemy-sprite">🧟</div>
        </div>
      </div>

      <div class="enemy-turn-overlay" id="enemy-turn-overlay">⚡ TURNO ENEMIGO...</div>
      <div class="telegraph" id="telegraph"></div>
      <div class="badge combo-badge" id="combo-badge">COMBO ×0</div>
      <div class="badge phase-badge" id="phase-badge">FASE 1</div>
      <div class="objetos-panel" id="objetos-panel"></div>
      <div class="objetos-panel" id="hab-panel"></div>
      <div class="estados-fila estados-izq" id="estados-jugador"></div>
      <div class="estados-fila estados-der" id="estados-enemigo"></div>
    </div>

    <div class="combat-log" id="combat-log">
      <div class="log-entry system">⚔️ <span class="log-icon"></span>¡Encuentras a un <strong>Troll Sombrío</strong> en las ruinas del norte. El combate comienza.</div>
      <div class="log-entry system">💡 Es tu turno. Elige una acción para atacar.</div>
    </div>

    <div class="action-bar">
      <div class="action-title">Elegir enemigo</div>
      <div class="monster-picker" id="monster-picker"></div>
      <div class="action-title">Acciones de Combate <span class="keys">teclas 1-5</span></div>
      <div class="actions" id="actions">
        <button class="action-btn type-attack" onclick="doAction('attack')">
          <div class="a-icon">⚔️</div>
          <div class="a-name">Golpe</div>
          <div class="a-cost">0 MP</div>
        </button>
        <button class="action-btn type-magic" onclick="abrirHabilidades()">
          <div class="a-icon">✨</div>
          <div class="a-name">Habilidad</div>
          <div class="a-cost" id="hab-cuenta">—</div>
        </button>
        <button class="action-btn type-block" id="btn-block" onclick="doAction('block')">
          <div class="a-icon">🛡️</div>
          <div class="a-name">Bloquear</div>
          <div class="a-cost">+10% MP</div>
        </button>
        <button class="action-btn type-heal" onclick="abrirObjetos()">
          <div class="a-icon">🧪</div>
          <div class="a-name">Objeto</div>
          <div class="a-cost" id="objetos-cuenta">—</div>
        </button>
        <button class="action-btn type-flee" onclick="doAction('flee')">
          <div class="a-icon">💨</div>
          <div class="a-name">Huir</div>
          <div class="a-cost">0 MP</div>
        </button>
      </div>
    </div>
  </main>

  <!-- ── INVENTORY PANEL ── -->
  <aside class="panel inventory-panel">
    <div class="panel-title">Inventario</div>
    <div class="inv-filter">
      <button class="filter-btn active" onclick="filterInv('all',this)">Todo</button>
      <button class="filter-btn" onclick="filterInv('weapon',this)">Armas</button>
      <button class="filter-btn" onclick="filterInv('potion',this)">Pociones</button>
      <button class="filter-btn" onclick="filterInv('material',this)">Mat.</button>
    </div>
    <div class="inv-grid" id="inv-grid"></div>
  </aside>
</div>

<!-- Tooltip -->
<div class="tooltip" id="tooltip">
  <div class="tt-name" id="tt-name"></div>
  <div class="tt-rarity" id="tt-rarity"></div>
  <div class="tt-stat" id="tt-stat1"></div>
  <div class="tt-stat" id="tt-stat2"></div>
  <div class="tt-desc" id="tt-desc"></div>
</div>

<!-- Loot notification -->
<div class="loot-notif" id="loot-notif">
  <span class="ln-icon" id="ln-icon"></span>
  <span id="ln-text"></span>
</div>

<!-- Victory overlay -->
<div class="victory-overlay" id="victory-overlay">
  <div class="victory-title">¡VICTORIA!</div>
  <div class="victory-rewards">
    <h3>RECOMPENSAS OBTENIDAS</h3>
    <div class="reward-row" id="reward-xp">✨ +320 EXP</div>
    <div class="reward-row" id="reward-gold">🪙 +180 Oro</div>
    <div class="reward-row" id="reward-item" style="display:none"></div>
  </div>
  <button class="victory-btn" onclick="nextEnemy()">SIGUIENTE ENEMIGO ▶</button>
</div>

<!-- Defeat overlay -->
<div class="defeat-overlay" id="defeat-overlay">
  <div class="defeat-title">☠️ DERROTA</div>
  <p style="color:#9A9080;font-size:16px;text-align:center">Has caído en combate.<br>Pierdes parte de tu oro.</p>
  <button class="defeat-btn" onclick="respawn()">RESUCITAR EN PUEBLO</button>
</div>

<script>
// ═══════════════════════════════════════════════════════════
//  CLIENTE DE COMBATE v3.1 — cliente fino
//  No calcula nada: todo el combate lo resuelve el servidor.
//  Este archivo solo envía la acción y dibuja la respuesta.
// ═══════════════════════════════════════════════════════════
var STATE = {
  char: null,
  monsters: [],
  monsterIdx: 0,
  monster: null,
  enemyHp: 0, enemyMaxHp: 0,
  battleId: null,
  busy: false,
  over: false,
  telegraph: null,
  combo: 0,
  phase: 1,
  kills: 0,
  inventory: [],
};

var RARITY_ES = { COMMON:'Común', UNCOMMON:'Inusual', RARE:'Raro', EPIC:'Épico', LEGENDARY:'Legendario', MYTHIC:'Mítico' };

function $(id) { return document.getElementById(id); }
function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }
function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }

// ── API ────────────────────────────────────────────────────
async function api(path, opts) {
  var res = await fetch(path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts || {}));
  var data = {};
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data: data };
}

// ── ARRANQUE ───────────────────────────────────────────────

// El apartado de combates enseñaba un mago fijo aunque el jugador
// tuviera otro aspecto. Un mismo personaje en todas las pantallas.
async function pintarAspectoJugador() {
  try {
    const [me, cat] = await Promise.all([
      fetch('/api/player', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/skins', { credentials: 'include' }).then(r => r.json()),
    ])
    const id = me.character && me.character.appearance && me.character.appearance.skinId
    const skin = (cat.skins || []).find(s => s.id === id)
    if (!skin) return
    for (const idEl of ['avatar-jugador', 'sprite-jugador']) {
      const el = document.getElementById(idEl)
      if (!el) continue
      if (skin.avatar || skin.portrait) {
        el.innerHTML = '<img src="' + (skin.avatar || skin.portrait) + '" alt="" ' +
          'style="width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%">'
      } else if (skin.emoji) el.textContent = skin.emoji
    }
  } catch (e) {}
}

async function init() {
  var me = await api('/api/player');
  if (!me.ok) {
    addLog('⚠️ No has iniciado sesión. Vuelve al launcher para entrar.', 'system');
    setActionsEnabled(false);
    return;
  }
  STATE.char = me.data.character;
  renderChar();
  pintarAspectoJugador();

  var inv = await api('/api/inventory');
  if (inv.ok) { STATE.inventory = inv.data.inventory || []; renderInventory(); }

  var ms = await api('/api/monsters');
  STATE.monsters = (ms.data.monsters || []).slice().sort(function(a,b){ return a.level - b.level; });
  renderMonsterPicker();
  spawnEnemy(0);
}

function renderChar() {
  var c = STATE.char;
  setPlayerHp(c.hp, c.maxHp);
  setPlayerMp(c.mp, c.maxMp);
  $('gold-count').textContent = (c.gold || 0).toLocaleString('es');
  $('crypto-count').textContent = (c.cgrid || 0).toLocaleString('es');
  $('kills-count').textContent = (c.monstersKilled || 0).toLocaleString('es');
  $('stat-str').textContent = c.strength;
  $('stat-int').textContent = c.intelligence;
  $('stat-agi').textContent = c.agility;
  $('stat-def').textContent = c.defense;
  $('xp-text').textContent = (c.xp || 0).toLocaleString('es') + ' / ' + (c.xpToNext || 0).toLocaleString('es');
  $('xp-bar').style.width = Math.min(100, (c.xp / c.xpToNext * 100)).toFixed(1) + '%';
}

// ── SELECTOR DE ENEMIGO ────────────────────────────────────
function renderMonsterPicker() {
  var el = $('monster-picker');
  if (!el) return;
  el.innerHTML = STATE.monsters.map(function(m, i) {
    var locked = STATE.char.level + 3 < m.level;
    return '<button class="mon-btn' + (locked ? ' locked' : '') + '" data-idx="' + i + '"' + (locked ? ' disabled' : '') +
      ' onclick="spawnEnemy(' + i + ')" title="' + esc(m.name) + ' — Nv.' + m.level + '">' +
      m.icon + '<span>Nv.' + m.level + '</span></button>';
  }).join('');
}

function spawnEnemy(idx) {
  if (STATE.busy) return;
  $('victory-overlay').classList.remove('show');
  STATE.monsterIdx = idx % STATE.monsters.length;
  var m = STATE.monsters[STATE.monsterIdx];
  STATE.monster = m;
  STATE.enemyMaxHp = m.hp;
  STATE.enemyHp = m.hp;
  STATE.battleId = null;
  STATE.over = false;
  STATE.telegraph = null;
  STATE.combo = 0;
  STATE.phase = 1;

  $('enemy-sprite').textContent = m.icon;
  $('enemy-name-tag').textContent = m.name + (m.isBoss ? ' 👑' : '');
  setEnemyHp(m.hp, m.hp);
  clearTelegraph();
  updateBadges();
  document.querySelectorAll('.mon-btn').forEach(function(b) {
    b.classList.toggle('active', Number(b.dataset.idx) === STATE.monsterIdx);
  });
  $('combat-log').innerHTML = '';
  addLog('⚔️ Aparece <strong>' + esc(m.name) + '</strong> (Nv.' + m.level + ', elemento ' + esc(m.element || '—') + '). HP: ' + m.hp, 'system');
  if (m.isBoss) addLog('👑 Es un jefe: cambiará de fase al 50 % de vida.', 'system');
  setActionsEnabled(true);
}

// ── ACCIÓN: se envía al servidor y se dibuja lo que devuelve ─
async function doAction(action, itemId, skillId) {
  if (STATE.busy || STATE.over || !STATE.monster) return;
  STATE.busy = true;
  setActionsEnabled(false);

  var payload = { monsterId: STATE.monster.id, action: action };
  if (STATE.battleId) payload.battleId = STATE.battleId;
  // La habilidad la elige el jugador. Antes era SIEMPRE la primera de
  // la clase, asi que dos de cada tres no se podian lanzar nunca: un
  // Guerrero no llegaba a usar Golpe de Escudo en toda su vida, que es
  // justo la que el aviso del enemigo te dice que uses.
  if (action === 'magic') payload.skillId = skillId || (STATE.char.skills || [])[0];
  // Qué objeto se bebe lo elige el jugador, y lo valida el servidor.
  if (itemId) payload.itemId = itemId;

  var r = await api('/api/combat/action', { method: 'POST', body: JSON.stringify(payload) });

  if (!r.ok) {
    addLog('⚠️ ' + esc(r.data.error || 'Acción rechazada por el servidor'), 'system');
    STATE.busy = false;
    setActionsEnabled(true);
    return;
  }

  // El servidor manda el turno como un GUION: las escenas en orden, con
  // lo que pasa en cada una y cuanto debe durar. Se reproduce.
  //
  // Si por lo que sea no viniera guion, se pinta como siempre. Una
  // pantalla que se queda muerta porque falta un campo es peor que una
  // pantalla sin animacion.
  if ((r.data.guion || []).length) await reproducirGuion(r.data, action);
  else await render(r.data, action);
  STATE.busy = false;
  if (!STATE.over) setActionsEnabled(true);
}

// ── INVENTARIO (datos reales del servidor) ─────────────────
var INV_FILTER = 'all';
function filterInv(f, btn) {
  INV_FILTER = f;
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderInventory();
}
function renderInventory() {
  var grid = $('inv-grid');
  grid.innerHTML = '';
  var items = STATE.inventory.filter(function(i) {
    if (INV_FILTER === 'all') return true;
    var t = (i.type || '').toUpperCase();
    if (INV_FILTER === 'weapon') return t === 'WEAPON' || t === 'ARMOR' || t === 'ACCESSORY';
    if (INV_FILTER === 'potion') return t === 'POTION' || t === 'FOOD';
    return t === 'MATERIAL';
  });
  for (var i = 0; i < 20; i++) {
    var it = items[i];
    var slot = document.createElement('div');
    if (it) {
      slot.className = 'inv-slot r-' + (it.rarity || 'COMMON').toLowerCase();
      slot.innerHTML = '<div class="i-icon">' + dibujoItem(it, 24) + '</div>' + (it.quantity > 1 ? '<div class="i-qty">×' + it.quantity + '</div>' : '');
      (function(item) {
        slot.addEventListener('mouseenter', function(e){ showTooltip(e, item); });
        slot.addEventListener('mousemove', moveTooltip);
        slot.addEventListener('mouseleave', hideTooltip);
      })(it);
    } else {
      slot.className = 'inv-slot empty';
    }
    grid.appendChild(slot);
  }
}

var tooltip;
function showTooltip(e, item) {
  tooltip = tooltip || $('tooltip');
  $('tt-name').textContent = item.name;
  $('tt-rarity').textContent = RARITY_ES[item.rarity] || item.rarity || 'Común';
  $('tt-stat1').textContent = 'Tipo: ' + (item.type || '—');
  $('tt-stat2').textContent = 'Cantidad: ×' + (item.quantity || 1);
  $('tt-desc').textContent = item.tradeable === false ? 'No comerciable' : 'Comerciable en el mercado';
  tooltip.className = 'tooltip visible r-' + (item.rarity || 'COMMON').toLowerCase();
  moveTooltip(e);
}
function moveTooltip(e) {
  tooltip = tooltip || $('tooltip');
  tooltip.style.left = Math.min(e.clientX + 14, window.innerWidth - 210) + 'px';
  tooltip.style.top = Math.max(0, e.clientY - 20) + 'px';
}
function hideTooltip() { if (tooltip) tooltip.classList.remove('visible'); }

// ── PUENTE CON EL LAUNCHER ─────────────────────────────────
function sendToParent(type, payload) {
  try { window.parent.postMessage({ type: type, payload: payload }, '*'); } catch (e) {}
}
window.addEventListener('message', function(event) {
  var d = event.data || {};
  if (d.type === 'CHARACTER_DATA' && d.data && d.data.character) {
    STATE.char = d.data.character;
    renderChar();
  }
});

// ── ATAJOS DE TECLADO ──────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (STATE.busy || STATE.over) return;
  var map = { '1': 'attack', '2': 'magic', '3': 'block', '4': 'heal', '5': 'flee' };
  if (map[e.key]) { e.preventDefault(); doAction(map[e.key]); }
});

init();
// El arma y los objetos se piden una vez al abrir la pantalla. Van
// después de init() a propósito: dependen del personaje ya cargado.
setTimeout(function () {
  if (typeof pintarArma === 'function') pintarArma();
  if (typeof cargarObjetos === 'function') cargarObjetos();
  if (typeof cargarHabilidades === 'function') cargarHabilidades();
}, 400);

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
