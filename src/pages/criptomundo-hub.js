PAGES['criptomundo-hub.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Hub Central</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

/* ─── TOKENS ─────────────────────────────────── */
:root {
  --void:    #05070A;
  --deep:    #090C12;
  --panel:   #0F1219;
  --card:    #161A24;
  --raised:  #1C2030;
  --hover:   #222840;

  --gold:    #C8A84B;
  --gold2:   #F0D070;
  --gold3:   #7A6530;

  /* module accent colours */
  --combat:  #E03030;
  --craft:   #E06020;
  --market:  #2A7FD4;
  --quest:   #8B5CF6;
  --dungeon: #DC2626;
  --pvp:     #7C3AED;

  --green:   #10B981;
  --warn:    #F59E0B;
  --border:  #181C28;
  --brim:    #2E2810;   /* gold border tint */

  --txt:     #E8E0CC;
  --dim:     #7A7060;
  --muted:   #3A3830;

  --r-common:    #9D9D9D;
  --r-uncommon:  #1EFF00;
  --r-rare:      #4090F0;
  --r-epic:      #A335EE;
  --r-legendary: #FF8000;
}

* { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; overflow:hidden; }

body {
  background: var(--void);
  color: var(--txt);
  font-family: 'Crimson Pro', Georgia, serif;
  background-image:
    radial-gradient(ellipse 100% 55% at 50% -5%, rgba(200,168,75,.07) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A84B' fill-opacity='0.012'%3E%3Cpath d='M60 10 L70 45 H105 L78 66 L88 100 L60 79 L32 100 L42 66 L15 45 H50 Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ─── TOPBAR ──────────────────────────────────── */
.topbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--brim);
  background: linear-gradient(180deg, rgba(200,168,75,.09) 0%, transparent 100%);
  position: relative;
  z-index: 30;
  flex-shrink: 0;
}

.logo {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 19px;
  color: var(--gold);
  letter-spacing: 4px;
  text-shadow: 0 0 28px rgba(200,168,75,.35);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.logo-sub {
  font-size: 10px;
  font-weight: 400;
  color: var(--dim);
  letter-spacing: 3px;
  font-family: 'Cinzel', serif;
}

.topbar-center {
  display: flex;
  gap: 4px;
}
.nav-pill {
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 5px 14px;
  font-family: 'Cinzel', serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--dim);
  cursor: pointer;
  transition: all .15s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.nav-pill .np-icon { font-size: 14px; }
.nav-pill:hover { color: var(--txt); background: var(--raised); border-color: var(--border); }
.nav-pill.active { color: var(--gold); border-color: var(--brim); background: rgba(200,168,75,.07); }
.nav-pill.active.c-combat  { color: var(--combat);  border-color: rgba(224,48,48,.3); }
.nav-pill.active.c-craft   { color: var(--craft);   border-color: rgba(224,96,32,.3); }
.nav-pill.active.c-market  { color: var(--market);  border-color: rgba(42,127,212,.3); }
.nav-pill.active.c-quest   { color: var(--quest);   border-color: rgba(139,92,246,.3); }
.nav-pill.active.c-dungeon { color: var(--dungeon); border-color: rgba(220,38,38,.3); }

.topbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
.hud-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.hud-chip b { color: var(--gold); }
.hud-chip span { color: var(--dim); font-size: 9px; }
.hud-chip.crypto b { color: #60C8FF; }
.hud-chip.pvp b { color: #A78BFA; }

/* ─── ROOT LAYOUT ─────────────────────────────── */
.root {
  display: grid;
  grid-template-columns: 220px 1fr 260px;
  grid-template-rows: 1fr;
  height: calc(100vh - 52px);
  overflow: hidden;
}

/* ─── LEFT SIDEBAR ────────────────────────────── */
.left-col {
  background: var(--panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Character card */
.char-card {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(160deg, rgba(200,168,75,.05) 0%, transparent 60%);
  position: relative;
  overflow: hidden;
}
.char-card::before {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200,168,75,.12) 0%, transparent 70%);
  pointer-events: none;
}
.char-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.char-sprite {
  font-size: 44px;
  filter: drop-shadow(0 0 14px rgba(200,168,75,.3));
  flex-shrink: 0;
}
.char-info { flex: 1; min-width: 0; }
.char-name {
  font-family: 'Cinzel', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--gold);
}
.char-class { font-size: 11px; color: var(--dim); margin-top: 1px; }
.char-level {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--combat);
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  margin-top: 5px;
}

/* Bars */
.bars { display: flex; flex-direction: column; gap: 6px; }
.bar-row { display: flex; flex-direction: column; gap: 3px; }
.bar-lbl {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--dim);
  font-family: 'JetBrains Mono', monospace;
}
.bar-lbl span:last-child { color: var(--txt); }
.bar-track {
  height: 6px;
  background: var(--card);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
  position: relative;
}
.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  background-size: 200% 100%;
  animation: shimmer 2.5s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.bar-hp { background: linear-gradient(90deg, #8B1A1A, #E03030); }
.bar-mp { background: linear-gradient(90deg, #1A3A8B, #4090F0); }
.bar-xp { background: linear-gradient(90deg, var(--gold3), var(--gold)); }

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.stat-cell {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
}
.sc-lbl { font-size: 9px; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }
.sc-val { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; color: var(--txt); margin-top: 1px; }

/* Quick equip */
.equip-section { padding: 10px 16px 14px; border-bottom: 1px solid var(--border); }
.section-label {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--dim);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-label::before { content:''; width:2px; height:10px; background:var(--gold); border-radius:1px; }
.equip-row { display: flex; gap: 5px; }
.eq-slot {
  flex: 1;
  aspect-ratio: 1;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all .12s;
  position: relative;
  overflow: hidden;
}
.eq-slot:hover { border-color: var(--gold3); background: var(--hover); }
.eq-slot .es-icon { font-size: 18px; }
.eq-slot .es-lbl { font-size: 8px; color: var(--dim); }
.eq-slot .rarity-pip { position:absolute; bottom:0; left:0; right:0; height:2px; }
.eq-slot.r-epic   { border-color: rgba(163,53,238,.4); box-shadow: 0 0 6px rgba(163,53,238,.1); }
.eq-slot.r-rare   { border-color: rgba(64,144,240,.4); }
.eq-slot.r-uncommon { border-color: rgba(30,255,0,.25); }
.r-epic    .rarity-pip { background: var(--r-epic); }
.r-rare    .rarity-pip { background: var(--r-rare); }
.r-uncommon .rarity-pip { background: var(--r-uncommon); }

/* Mini quest tracker */
.quest-tracker { flex: 1; overflow-y: auto; padding: 10px 16px 14px; }
.qt-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background .12s;
}
.qt-row:last-child { border: none; }
.qt-row:hover { background: var(--hover); margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 5px; }
.qt-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.qt-info { flex: 1; min-width: 0; }
.qt-name { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 600; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qt-prog { font-size: 10px; color: var(--dim); margin-top: 2px; }
.qt-pct  { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--quest); }
.qt-minibar { height: 3px; background: var(--card); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.qt-minifill { height: 100%; background: var(--quest); border-radius: 2px; }

/* ─── MAIN CENTER ─────────────────────────────── */
.main-col { display: flex; flex-direction: column; overflow: hidden; background: var(--deep); }

/* World map / scene */
.world-scene {
  flex: 0 0 auto;
  height: 230px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #060810 0%, #0C1018 55%, #121620 100%);
  border-bottom: 1px solid var(--border);
}
.ws-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 30%, rgba(255,255,255,.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 15%, rgba(255,255,255,.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 45%, rgba(255,255,255,.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 88% 25%, rgba(255,255,255,.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,.2) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 70%, rgba(255,255,255,.25) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 90% 65%, rgba(255,255,255,.3) 0%, transparent 100%);
}
.ws-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  pointer-events: none;
}
.ws-moon { top: 10%; right: 12%; width: 80px; height: 80px; background: rgba(200,168,75,.12); }
.ws-city { bottom: 0; left: 50%; transform: translateX(-50%); width: 60%; height: 60px; background: rgba(200,168,75,.04); filter: blur(30px); }

/* Zone nodes */
.zone-nodes {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 30px 30px;
}
.zone-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform .2s;
}
.zone-node:hover { transform: translateY(-4px); }
.zone-node:hover .zn-icon { filter: drop-shadow(0 0 16px var(--zn-color)); }
.zn-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,.8));
  transition: filter .2s;
}
.zn-label {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--zn-color);
  text-shadow: 0 0 10px var(--zn-color);
  background: rgba(0,0,0,.5);
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid currentColor;
  opacity: .8;
}
.zn-pulse {
  position: absolute;
  top: -4px; right: -4px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }

/* Path lines between zones */
.ws-paths {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ws-paths svg { width: 100%; height: 100%; }
.path-line { stroke: rgba(200,168,75,.12); stroke-width: 1; stroke-dasharray: 4 4; fill: none; animation: dashMove 6s linear infinite; }
@keyframes dashMove { to { stroke-dashoffset: -32; } }

/* Activity feed */
.feed-area { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 5px; }
.feed-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 13px;
  animation: feedIn .3s ease-out;
  transition: background .12s;
  cursor: default;
}
@keyframes feedIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
.feed-entry:hover { background: var(--hover); }
.fe-icon { font-size: 20px; flex-shrink: 0; }
.fe-text { flex: 1; color: var(--dim); line-height: 1.4; }
.fe-text strong { color: var(--txt); }
.fe-text em { color: var(--gold); font-style: normal; }
.fe-time { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }
.fe-badge {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Cinzel', serif;
  flex-shrink: 0;
}
.fb-combat  { background: rgba(224,48,48,.15);  color: var(--combat);  border: 1px solid rgba(224,48,48,.25); }
.fb-craft   { background: rgba(224,96,32,.15);  color: var(--craft);   border: 1px solid rgba(224,96,32,.25); }
.fb-market  { background: rgba(42,127,212,.15); color: var(--market);  border: 1px solid rgba(42,127,212,.25); }
.fb-quest   { background: rgba(139,92,246,.15); color: var(--quest);   border: 1px solid rgba(139,92,246,.25); }
.fb-dungeon { background: rgba(220,38,38,.15);  color: var(--dungeon); border: 1px solid rgba(220,38,38,.25); }
.fb-system  { background: rgba(200,168,75,.1);  color: var(--gold);    border: 1px solid rgba(200,168,75,.2); }

/* Bottom quick-actions */
.quick-bar {
  flex: 0 0 auto;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--panel);
  display: flex;
  gap: 8px;
}
.mod-btn {
  flex: 1;
  padding: 11px 6px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all .15s;
  position: relative;
  overflow: hidden;
}
.mod-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--mb-glow, transparent);
  opacity: 0;
  transition: opacity .15s;
}
.mod-btn:hover::before { opacity: .08; }
.mod-btn:hover { border-color: var(--mb-border, var(--gold3)); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
.mb-icon { font-size: 22px; }
.mb-label { font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: var(--dim); }
.mb-count {
  position: absolute;
  top: 4px; right: 5px;
  background: var(--combat);
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  border-radius: 8px;
  padding: 1px 5px;
  min-width: 16px;
  text-align: center;
}
.mb-combat  { --mb-glow: var(--combat);  --mb-border: rgba(224,48,48,.4); }
.mb-craft   { --mb-glow: var(--craft);   --mb-border: rgba(224,96,32,.4); }
.mb-market  { --mb-glow: var(--market);  --mb-border: rgba(42,127,212,.4); }
.mb-quest   { --mb-glow: var(--quest);   --mb-border: rgba(139,92,246,.4); }
.mb-dungeon { --mb-glow: var(--dungeon); --mb-border: rgba(220,38,38,.4); }

/* ─── RIGHT SIDEBAR ───────────────────────────── */
.right-col {
  background: var(--panel);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Economy panel */
.econ-panel { padding: 14px 16px; border-bottom: 1px solid var(--border); }
.econ-main {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.econ-coin {
  flex: 1;
  background: var(--card);
  border: 1px solid var(--brim);
  border-radius: 8px;
  padding: 10px 12px;
  position: relative;
  overflow: hidden;
}
.econ-coin::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 100% 0%, rgba(200,168,75,.06) 0%, transparent 60%);
  pointer-events: none;
}
.ec-lbl { font-size: 9px; color: var(--dim); letter-spacing: 2px; text-transform: uppercase; font-family: 'Cinzel', serif; }
.ec-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; color: var(--gold); line-height: 1.1; margin-top: 2px; }
.ec-change { font-size: 10px; margin-top: 3px; }
.ec-change.up { color: var(--green); }
.ec-change.dn { color: var(--combat); }
.econ-crypto {
  flex: 1;
  background: var(--card);
  border: 1px solid rgba(96,200,255,.15);
  border-radius: 8px;
  padding: 10px 12px;
}
.ec-val.crypto { color: #60C8FF; }

/* Mini price chart */
.mini-chart { margin-top: 4px; }
.mc-label { font-size: 9px; color: var(--dim); letter-spacing: 2px; text-transform: uppercase; font-family: 'Cinzel', serif; margin-bottom: 6px; }
.mc-bars { display: flex; align-items: flex-end; gap: 2px; height: 36px; }
.mc-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; transition: height .3s; cursor: pointer; }
.mc-bar:hover { filter: brightness(1.3); }

/* Inventory snapshot */
.inv-snap { flex: 1; overflow-y: auto; padding: 12px 16px; }
.inv-snap-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.is-slot {
  aspect-ratio: 1;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all .12s;
  font-size: 16px;
}
.is-slot:hover { border-color: var(--gold3); background: var(--hover); transform: scale(1.08); }
.is-slot.empty { opacity: .18; cursor: default; }
.is-slot .is-qty { position: absolute; bottom: 1px; right: 3px; font-family: 'JetBrains Mono', monospace; font-size: 8px; color: var(--dim); }
.is-slot .is-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
.ir-common   .is-bar { background: var(--r-common); }
.ir-uncommon .is-bar { background: var(--r-uncommon); }
.ir-rare     .is-bar { background: var(--r-rare); }
.ir-epic     .is-bar { background: var(--r-epic); }
.ir-legendary .is-bar { background: var(--r-legendary); }

/* Leaderboard */
.leaderboard { padding: 12px 16px 14px; border-top: 1px solid var(--border); }
.lb-list { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
.lb-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  transition: background .12s;
  cursor: default;
}
.lb-entry:hover { background: var(--hover); }
.lb-entry.you { border-color: var(--gold3); background: rgba(200,168,75,.05); }
.lb-rank { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; width: 20px; text-align: center; }
.lb-rank.r1 { color: #FFD700; }
.lb-rank.r2 { color: #C0C0C0; }
.lb-rank.r3 { color: #CD7F32; }
.lb-avatar { font-size: 18px; }
.lb-name { flex: 1; font-family: 'Cinzel', serif; font-size: 11px; }
.lb-score { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--gold); }

/* ─── NOTIFICATION TOAST ──────────────────────── */
.toast-stack {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: 200;
  pointer-events: none;
}
.toast-item {
  background: var(--panel);
  border: 1px solid var(--gold3);
  border-radius: 9px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel', serif;
  font-size: 12px;
  color: var(--gold);
  box-shadow: 0 8px 28px rgba(0,0,0,.7);
  transform: translateX(20px);
  opacity: 0;
  transition: all .35s cubic-bezier(.4,0,.2,1);
  pointer-events: auto;
  max-width: 280px;
}
.toast-item.show { transform: translateX(0); opacity: 1; }
.toast-item.green { border-color: rgba(16,185,129,.4); color: var(--green); }
.toast-item.purple { border-color: rgba(139,92,246,.4); color: #A78BFA; }
.toast-item.red { border-color: rgba(220,38,38,.4); color: #F87171; }
.ti-icon { font-size: 18px; flex-shrink: 0; }

/* ─── ACTIVE MODULE OVERLAY ───────────────────── */
.module-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5,7,10,.96);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s;
}
.module-overlay.open { opacity: 1; pointer-events: all; }
.mo-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.mo-title { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: var(--gold); letter-spacing: 2px; }
.mo-close {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 14px;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  color: var(--dim);
  cursor: pointer;
  letter-spacing: 1px;
  transition: all .12s;
}
.mo-close:hover { border-color: var(--gold3); color: var(--txt); }
.mo-frame {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.mo-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--deep);
}
.mo-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--dim);
  font-family: 'Cinzel', serif;
  font-size: 14px;
  letter-spacing: 2px;
}
.mo-spinner { font-size: 40px; animation: spin 1.2s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* scrollbars */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }



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

<!-- ── TOP BAR ── -->
<header class="topbar">
  <div class="logo">
    CRIPTOMUNDO
    <span class="logo-sub">HUB CENTRAL</span>
  </div>

  <nav class="topbar-center">
    <button class="nav-pill active" onclick="openModule('combat')" id="npill-combat">
      <span class="np-icon">⚔️</span> Combate
    </button>
    <button class="nav-pill" onclick="openModule('craft')" id="npill-craft">
      <span class="np-icon">⚒️</span> Forja
    </button>
    <button class="nav-pill" onclick="openModule('market')" id="npill-market">
      <span class="np-icon">🏪</span> Mercado
    </button>
    <button class="nav-pill" onclick="openModule('quest')" id="npill-quest">
      <span class="np-icon">📜</span> Misiones
    </button>
    <button class="nav-pill" onclick="openModule('dungeon')" id="npill-dungeon">
      <span class="np-icon">🏰</span> Mazmorras
    </button>
  </nav>

  <div class="topbar-right">
    <div class="hud-chip"><span>🪙</span><b id="hud-gold">1,240</b><span>ORO</span></div>
    <div class="hud-chip crypto"><span>💎</span><b id="hud-crypto">12</b><span>$CGRID</span></div>
    <div class="hud-chip pvp"><span>⭐</span><b id="hud-rating">1,450</b><span>RATING</span></div>
  </div>
</header>

<!-- ── MAIN ROOT ── -->
<div class="root">

  <!-- ── LEFT: Character & Quests ── -->
  <aside class="left-col">
    <div class="char-card">
      <div class="char-avatar-wrap">
        <div class="char-sprite">🧙</div>
        <div class="char-info">
          <div class="char-name">Sebastián</div>
          <div class="char-class">Archimago de las Runas</div>
          <div class="char-level">⚔️ NV. 12</div>
        </div>
      </div>
      <div class="bars">
        <div class="bar-row">
          <div class="bar-lbl"><span>❤️ HP</span><span id="hp-txt">850 / 850</span></div>
          <div class="bar-track"><div class="bar-fill bar-hp" id="hp-bar" style="width:100%"></div></div>
        </div>
        <div class="bar-row">
          <div class="bar-lbl"><span>🔷 MP</span><span id="mp-txt">400 / 400</span></div>
          <div class="bar-track"><div class="bar-fill bar-mp" id="mp-bar" style="width:100%"></div></div>
        </div>
        <div class="bar-row">
          <div class="bar-lbl"><span>✨ EXP</span><span id="xp-txt">3,200 / 5,000</span></div>
          <div class="bar-track"><div class="bar-fill bar-xp" id="xp-bar" style="width:64%"></div></div>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-cell"><div class="sc-lbl">Ataque</div><div class="sc-val">85–120</div></div>
      <div class="stat-cell"><div class="sc-lbl">Defensa</div><div class="sc-val">42</div></div>
      <div class="stat-cell"><div class="sc-lbl">Inteligencia</div><div class="sc-val">68</div></div>
      <div class="stat-cell"><div class="sc-lbl">Crítico</div><div class="sc-val">18%</div></div>
    </div>

    <div class="equip-section">
      <div class="section-label">Equipado</div>
      <div class="equip-row">
        <div class="eq-slot r-epic" title="Vara del Vacío Eterno">
          <div class="es-icon">🪄</div><div class="es-lbl">Arma</div>
          <div class="rarity-pip"></div>
        </div>
        <div class="eq-slot r-rare" title="Sombrero de Mago">
          <div class="es-icon">🎩</div><div class="es-lbl">Cabeza</div>
          <div class="rarity-pip"></div>
        </div>
        <div class="eq-slot r-rare" title="Túnica Arcana">
          <div class="es-icon">🥋</div><div class="es-lbl">Pecho</div>
          <div class="rarity-pip"></div>
        </div>
        <div class="eq-slot r-uncommon" title="Bota Élfica">
          <div class="es-icon">👟</div><div class="es-lbl">Pies</div>
          <div class="rarity-pip"></div>
        </div>
        <div class="eq-slot" title="Sin anillo">
          <div class="es-icon">💍</div><div class="es-lbl">Anillo</div>
          <div class="rarity-pip"></div>
        </div>
      </div>
    </div>

    <div class="quest-tracker">
      <div class="section-label">Misiones Activas</div>
      <div id="quest-tracker-list"></div>
    </div>
  </aside>

  <!-- ── CENTER: World & Feed ── -->
  <main class="main-col">

    <!-- World map -->
    <div class="world-scene">
      <div class="ws-stars"></div>
      <div class="ws-glow ws-moon"></div>
      <div class="ws-glow ws-city"></div>

      <div class="ws-paths">
        <svg><polyline class="path-line" points="14%,75% 28%,60% 50%,55% 72%,60% 86%,75%"/></svg>
      </div>

      <div class="zone-nodes">
        <div class="zone-node" style="--zn-color:#10B981" onclick="openModule('quest'); showToast('🏘️ Pueblo Central — NPCs disponibles', 'green')">
          <div style="position:relative">
            <div class="zn-icon">🏘️</div>
            <div class="zn-pulse"></div>
          </div>
          <div class="zn-label">Pueblo</div>
        </div>
        <div class="zone-node" style="--zn-color:#4090F0" onclick="openModule('combat'); showToast('🌲 Bosque del Este — Monstruos Nv.5–15', '')">
          <div class="zn-icon">🌲</div>
          <div class="zn-label">Bosque</div>
        </div>
        <div class="zone-node" style="--zn-color:#C8A84B" onclick="openModule('dungeon'); showToast('🏰 Ruinas Antiguas — Mazmorras abiertas', 'purple')">
          <div style="position:relative">
            <div class="zn-icon">🏰</div>
            <div class="zn-pulse" style="background:var(--gold);box-shadow:0 0 8px var(--gold)"></div>
          </div>
          <div class="zn-label">Ruinas</div>
        </div>
        <div class="zone-node" style="--zn-color:#9D9D9D" onclick="openModule('craft'); showToast('⛏️ Minas del Norte — Minerales raros', '')">
          <div class="zn-icon">⛏️</div>
          <div class="zn-label">Minas</div>
        </div>
        <div class="zone-node" style="--zn-color:#E03030" onclick="openModule('dungeon'); showToast('🌋 Tierras Oscuras — Solo para valientes', 'red')">
          <div class="zn-icon">🌋</div>
          <div class="zn-label">Tierras Oscuras</div>
        </div>
      </div>
    </div>

    <!-- Activity feed -->
    <div class="feed-area" id="feed-area"></div>

    <!-- Quick access bar -->
    <div class="quick-bar">
      <button class="mod-btn mb-combat" onclick="openModule('combat')">
        <div class="mb-icon">⚔️</div>
        <div class="mb-label">Combate</div>
        <div class="mb-count" id="cnt-combat">3</div>
      </button>
      <button class="mod-btn mb-craft" onclick="openModule('craft')">
        <div class="mb-icon">⚒️</div>
        <div class="mb-label">Forja</div>
      </button>
      <button class="mod-btn mb-market" onclick="openModule('market')">
        <div class="mb-icon">🏪</div>
        <div class="mb-label">Mercado</div>
        <div class="mb-count" id="cnt-market" style="background:var(--market)">12</div>
      </button>
      <button class="mod-btn mb-quest" onclick="openModule('quest')">
        <div class="mb-icon">📜</div>
        <div class="mb-label">Misiones</div>
        <div class="mb-count" id="cnt-quest" style="background:var(--quest)">2</div>
      </button>
      <button class="mod-btn mb-dungeon" onclick="openModule('dungeon')">
        <div class="mb-icon">🏰</div>
        <div class="mb-label">Mazmorra</div>
      </button>
    </div>

  </main>

  <!-- ── RIGHT: Economy & Inventory ── -->
  <aside class="right-col">
    <div class="econ-panel">
      <div class="section-label">Economía</div>
      <div class="econ-main">
        <div class="econ-coin">
          <div class="ec-lbl">🪙 Oro</div>
          <div class="ec-val" id="econ-gold">1,240</div>
          <div class="ec-change up" id="econ-gold-change">▲ +180 hoy</div>
        </div>
        <div class="econ-crypto">
          <div class="ec-lbl">💎 $CGRID</div>
          <div class="ec-val crypto" id="econ-crypto">12</div>
          <div class="ec-change up" id="econ-crypto-change">▲ +3 esta semana</div>
        </div>
      </div>
      <div class="mini-chart">
        <div class="mc-label">Oro — 7 días</div>
        <div class="mc-bars" id="mc-bars"></div>
      </div>
    </div>

    <div class="inv-snap">
      <div class="section-label">Inventario Rápido</div>
      <div class="inv-snap-grid" id="inv-snap-grid"></div>
    </div>

    <div class="leaderboard">
      <div class="section-label">Clasificación Global</div>
      <div class="lb-list" id="lb-list"></div>
    </div>
  </aside>

</div>

<!-- ── MODULE OVERLAY ── -->
<div class="module-overlay" id="module-overlay">
  <div class="mo-topbar">
    <div class="mo-title" id="mo-title">Módulo</div>
    <button class="mo-close" onclick="closeModule()">✕ CERRAR</button>
  </div>
  <div class="mo-frame">
    <div class="mo-loading" id="mo-loading">
      <div class="mo-spinner">⚙️</div>
      <div>CARGANDO MÓDULO...</div>
    </div>
    <iframe class="mo-iframe" id="mo-iframe" style="display:none"></iframe>
  </div>
</div>

<!-- ── TOAST STACK ── -->
<div class="toast-stack" id="toast-stack"></div>

<script>
// ──────────────────────────────────────────────────
// MODULE MAP  (paths to the HTML files we built)
// ──────────────────────────────────────────────────
const MODULE_META = {
  combat:  { title:'⚔️  COMBATE & LOOT',         src:'criptomundo-combat.html',          color:'var(--combat)',  pill:'c-combat'  },
  craft:   { title:'⚒️  FORJA & ALQUIMIA',        src:'criptomundo-crafting.html',        color:'var(--craft)',   pill:'c-craft'   },
  market:  { title:'🏪  MERCADO DE JUGADORES',    src:'criptomundo-mercado.html',         color:'var(--market)',  pill:'c-market'  },
  quest:   { title:'📜  MISIONES & NPCs',         src:'criptomundo-misiones.html',        color:'var(--quest)',   pill:'c-quest'   },
  dungeon: { title:'🏰  MAZMORRAS & PVP',         src:'criptomundo-mazmorras-pvp.html',   color:'var(--dungeon)', pill:'c-dungeon' },
};

function openModule(key) {
  const meta = MODULE_META[key];
  if (!meta) return;
  const overlay = document.getElementById('module-overlay');
  const iframe  = document.getElementById('mo-iframe');
  const loading = document.getElementById('mo-loading');
  document.getElementById('mo-title').textContent = meta.title;
  iframe.style.display = 'none';
  loading.style.display = 'flex';
  overlay.classList.add('open');
  iframe.src = meta.src;

  // highlight nav pill
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active','c-combat','c-craft','c-market','c-quest','c-dungeon'));
  const pill = document.getElementById('npill-' + key);
  if (pill) { pill.classList.add('active', meta.pill); }

  addFeedEntry({ icon:'🔗', text:\`Abriste el módulo <strong>\${meta.title.replace(/[⚔️⚒️🏪📜🏰]\\s*/,'')}</strong>\`, badge:'system', badgeCls:'fb-system', time: 'ahora' });
}

function onFrameLoad() {
  const f = document.getElementById('mo-iframe');
  if (!f || !f.src) return;       // el disparo del src vacio no cuenta
  f.style.display = 'block';
  document.getElementById('mo-loading').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('mo-iframe');
  if (f) f.addEventListener('load', onFrameLoad);
});

function closeModule() {
  const overlay = document.getElementById('module-overlay');
  overlay.classList.remove('open');
  document.getElementById('mo-iframe').src = '';
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active','c-combat','c-craft','c-market','c-quest','c-dungeon'));
}

// ──────────────────────────────────────────────────
// TOAST STACK
// ──────────────────────────────────────────────────
function showToast(msg, type='') {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = \`toast-item \${type}\`;
  el.innerHTML = \`<span class="ti-icon">\${type==='green'?'✅':type==='red'?'⚠️':type==='purple'?'💜':'🔔'}</span><span>\${msg}</span>\`;
  stack.appendChild(el);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3500);
}

// ──────────────────────────────────────────────────
// ACTIVITY FEED
// ──────────────────────────────────────────────────
const FEED_SEED = [
  { icon:'⚔️', text:'Derrotaste a un <strong>Troll Sombrío</strong> — obtienes <em>+85 oro</em>', badge:'Combate', badgeCls:'fb-combat', time:'2m' },
  { icon:'🧪', text:'<strong>Lyria la Alquimista</strong> tiene una nueva misión disponible', badge:'Misión', badgeCls:'fb-quest', time:'5m' },
  { icon:'🏪', text:'Tu <strong>Espada del Alba</strong> se vendió por <em>🪙 340 oro</em>', badge:'Mercado', badgeCls:'fb-market', time:'8m' },
  { icon:'⚒️', text:'Forjaste <strong>Escudo de Roble</strong> — DEF +70', badge:'Forja', badgeCls:'fb-craft', time:'12m' },
  { icon:'💀', text:'<strong>ArkaneX</strong> derrotó al jefe de la <em>Torre del Abismo</em>', badge:'Mazmorra', badgeCls:'fb-dungeon', time:'15m' },
  { icon:'🌟', text:'¡Nuevo ítem <strong>Legendario</strong> disponible en el Mercado!', badge:'Mercado', badgeCls:'fb-market', time:'18m' },
  { icon:'📜', text:'Completaste la misión <strong>"Purga de los Trolls"</strong> — +280 EXP', badge:'Misión', badgeCls:'fb-quest', time:'22m' },
  { icon:'💎', text:'Obtuviste <em>+3 $CGRID</em> al completar la Forja del Dragón', badge:'Mazmorra', badgeCls:'fb-dungeon', time:'31m' },
  { icon:'⚔️', text:'<strong>VoidWalker</strong> te desafió al PvP y espera tu respuesta', badge:'PvP', badgeCls:'fb-dungeon', time:'45m' },
  { icon:'🪙', text:'El mercado reporta <em>+12% en el precio</em> del Cristal de Hielo', badge:'Mercado', badgeCls:'fb-market', time:'1h' },
];

function addFeedEntry({ icon, text, badge, badgeCls, time }) {
  const area = document.getElementById('feed-area');
  const el = document.createElement('div');
  el.className = 'feed-entry';
  el.innerHTML = \`
    <div class="fe-icon">\${icon}</div>
    <div class="fe-text">\${text}</div>
    \${badge ? \`<div class="fe-badge \${badgeCls}">\${badge}</div>\` : ''}
    <div class="fe-time">\${time}</div>\`;
  area.insertBefore(el, area.firstChild);
  // keep max 25
  while (area.children.length > 25) area.removeChild(area.lastChild);
}

function initFeed() {
  FEED_SEED.forEach(e => addFeedEntry(e));
}

// Live feed simulation
const LIVE_EVENTS = [
  () => ({ icon:'⚔️', text:\`<strong>CryptoKnight</strong> eliminó a 3 Arañas Venenosas\`, badge:'Combate', badgeCls:'fb-combat', time:'ahora' }),
  () => ({ icon:'🏪', text:\`<strong>StarDust</strong> publicó un <em>Orbe Arcano</em> por 🪙1,750\`, badge:'Mercado', badgeCls:'fb-market', time:'ahora' }),
  () => ({ icon:'📜', text:\`Nueva misión disponible en el <strong>Bosque Sombrío</strong>\`, badge:'Misión', badgeCls:'fb-quest', time:'ahora' }),
  () => ({ icon:'💀', text:\`<strong>IronForge</strong> completó la Mazmorra <em>Cripta del Eterno</em>\`, badge:'Mazmorra', badgeCls:'fb-dungeon', time:'ahora' }),
  () => ({ icon:'⚒️', text:\`<strong>FrostMage</strong> forjó un arma <em>Épica</em>\`, badge:'Forja', badgeCls:'fb-craft', time:'ahora' }),
  () => ({ icon:'⚔️', text:\`<strong>DragonHeart</strong> ganó un duelo PvP apostando 💎2 $CGRID\`, badge:'PvP', badgeCls:'fb-dungeon', time:'ahora' }),
];
let liveIdx = 0;
setInterval(() => {
  const fn = LIVE_EVENTS[liveIdx++ % LIVE_EVENTS.length];
  addFeedEntry(fn());
}, 7000);

// ──────────────────────────────────────────────────
// MINI PRICE CHART
// ──────────────────────────────────────────────────
function renderMiniChart() {
  const vals = [820, 950, 1050, 980, 1100, 1200, 1240];
  const max = Math.max(...vals);
  const bars = document.getElementById('mc-bars');
  bars.innerHTML = '';
  vals.forEach((v, i) => {
    const h = Math.round((v / max) * 32) + 4;
    const isLast = i === vals.length - 1;
    const b = document.createElement('div');
    b.className = 'mc-bar';
    b.style.cssText = \`height:\${h}px;background:\${isLast ? 'var(--gold)' : 'var(--gold3)'};\`;
    b.title = \`🪙 \${v.toLocaleString()}\`;
    bars.appendChild(b);
  });
}

// ──────────────────────────────────────────────────
// INVENTORY SNAPSHOT
// ──────────────────────────────────────────────────
const INV_ITEMS = [
  { icon:'⚔️', qty:2,  rarity:'uncommon' },
  { icon:'🧪', qty:8,  rarity:'common'   },
  { icon:'🪨', qty:12, rarity:'common'   },
  { icon:'💎', qty:2,  rarity:'rare'     },
  { icon:'✨', qty:9,  rarity:'uncommon' },
  { icon:'🍞', qty:5,  rarity:'common'   },
  { icon:'🏹', qty:1,  rarity:'rare'     },
  { icon:'💊', qty:4,  rarity:'uncommon' },
  { icon:'🔮', qty:1,  rarity:'epic'     },
  { icon:'🛡️', qty:1,  rarity:'rare'     },
];

function renderInvSnap() {
  const grid = document.getElementById('inv-snap-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const item = INV_ITEMS[i];
    const slot = document.createElement('div');
    if (item) {
      slot.className = \`is-slot ir-\${item.rarity}\`;
      slot.innerHTML = \`\${item.icon}\${item.qty > 1 ? \`<div class="is-qty">×\${item.qty}</div>\` : ''}<div class="is-bar"></div>\`;
      slot.title = item.icon;
    } else {
      slot.className = 'is-slot empty';
      slot.innerHTML = '<div class="is-bar"></div>';
    }
    grid.appendChild(slot);
  }
}

// ──────────────────────────────────────────────────
// QUEST TRACKER
// ──────────────────────────────────────────────────
const ACTIVE_QUESTS = [
  { icon:'🧟', name:'Purga de los Trolls', prog:3, total:9, pct:33 },
  { icon:'🌿', name:'Cosecha de Hierbas',  prog:7, total:20, pct:35 },
];

function renderQuestTracker() {
  const list = document.getElementById('quest-tracker-list');
  list.innerHTML = '';
  if (!ACTIVE_QUESTS.length) {
    list.innerHTML = \`<div style="color:var(--dim);font-size:12px;padding:8px 0">Sin misiones activas.<br>Habla con un NPC.</div>\`;
    return;
  }
  ACTIVE_QUESTS.forEach(q => {
    const div = document.createElement('div');
    div.className = 'qt-row';
    div.innerHTML = \`
      <div class="qt-icon">\${q.icon}</div>
      <div class="qt-info">
        <div class="qt-name">\${q.name}</div>
        <div class="qt-prog">\${q.prog} / \${q.total} objetivos <span class="qt-pct">\${q.pct}%</span></div>
        <div class="qt-minibar"><div class="qt-minifill" style="width:\${q.pct}%"></div></div>
      </div>\`;
    div.addEventListener('click', () => openModule('quest'));
    list.appendChild(div);
  });
}

// ──────────────────────────────────────────────────
// LEADERBOARD
// ──────────────────────────────────────────────────
const LEADERS = [
  { rank:1,  avatar:'🌀', name:'VoidWalker',  score:'2,250', wins:'90V' },
  { rank:2,  avatar:'⚒️', name:'IronForge',   score:'2,100', wins:'78V' },
  { rank:3,  avatar:'🐉', name:'DragonHeart', score:'1,950', wins:'60V' },
  { rank:4,  avatar:'⭐', name:'ArkaneX',     score:'1,820', wins:'42V' },
  { rank:12, avatar:'🧙', name:'Sebastián',   score:'1,450', wins:'8V', you:true },
];

function renderLeaderboard() {
  const lb = document.getElementById('lb-list');
  lb.innerHTML = '';
  LEADERS.forEach(p => {
    const div = document.createElement('div');
    div.className = \`lb-entry \${p.you ? 'you' : ''}\`;
    div.innerHTML = \`
      <div class="lb-rank \${p.rank<=3?'r'+p.rank:''}">\${p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:p.rank}</div>
      <div class="lb-avatar">\${p.avatar}</div>
      <div class="lb-name">\${p.name}\${p.you?' (tú)':''}</div>
      <div>
        <div class="lb-score">\${p.score}</div>
        <div style="font-size:10px;color:var(--green)">\${p.wins}</div>
      </div>\`;
    lb.appendChild(div);
  });
}

// ──────────────────────────────────────────────────
// ECONOMY PULSE (simulated live updates)
// ──────────────────────────────────────────────────
let gold = 1240, crypto = 12;
setInterval(() => {
  const delta = Math.floor(Math.random() * 60) - 10;
  gold = Math.max(0, gold + delta);
  document.getElementById('hud-gold').textContent    = gold.toLocaleString();
  document.getElementById('econ-gold').textContent   = gold.toLocaleString();
  const ch = document.getElementById('econ-gold-change');
  ch.textContent = (delta >= 0 ? '▲ +' : '▼ ') + Math.abs(delta) + ' reciente';
  ch.className   = \`ec-change \${delta >= 0 ? 'up' : 'dn'}\`;
}, 5000);

// ──────────────────────────────────────────────────
// ── POSTMESSAGE BRIDGE ──
function sendToParent(type, payload) {
  window.parent.postMessage({ type, payload }, '*');
}

window.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  if (type === 'CHARACTER_DATA' && data?.character) {
    const c = data.character;
    gold   = c.gold   ?? gold;
    crypto = c.cgrid  ?? crypto;

    document.getElementById('econ-gold').textContent   = gold.toLocaleString();
    document.getElementById('econ-crypto').textContent = crypto;

    // Sync inventory snapshot
    if (c.inventory?.length) {
      const rarityMap = { COMMON:'common', UNCOMMON:'uncommon', RARE:'rare', EPIC:'epic', LEGENDARY:'legendary' };
      INV_ITEMS.length = 0;
      c.inventory.forEach(item => INV_ITEMS.push({
        icon:   item.icon || '📦',
        qty:    item.quantity || 1,
        rarity: rarityMap[item.rarity] || 'common',
        name:   item.name,
      }));
    }
    renderInvSnap();

    // Sync active quests
    if (c.activeQuests?.length) {
      ACTIVE_QUESTS.length = 0;
      c.activeQuests.forEach(aq => {
        const q    = aq.quest || {};
        const prog = aq.objectiveProgress || [];
        const done = prog.reduce((s, p) => s + (p.current || 0), 0);
        const total= prog.reduce((s, p) => s + (p.required || 1), 0) || 1;
        ACTIVE_QUESTS.push({ icon: q.icon || '📜', name: q.name || aq.questId, prog: done, total, pct: Math.round(done/total*100) });
      });
    }
    renderQuestTracker();

    // Update leaderboard "you" row
    const youRow = LEADERS.find(l => l.you);
    if (youRow && c.name) { youRow.name = c.name; youRow.score = (c.pvpRating||1200).toLocaleString(); renderLeaderboard(); }
  }
});

window.addEventListener('load', () => {
  sendToParent('GET_CHARACTER', {});
});

// INIT
// ──────────────────────────────────────────────────
initFeed();
renderMiniChart();
renderInvSnap();
renderQuestTracker();
renderLeaderboard();

// Welcome toasts
setTimeout(() => showToast('¡Bienvenido a CriptoMundo, Sebastián!', 'green'), 600);
setTimeout(() => showToast('📜 Tienes 2 misiones activas pendientes', 'purple'), 2000);
setTimeout(() => showToast('🏪 Tu Espada del Alba se vendió por 🪙340', ''), 3800);
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
