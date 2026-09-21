PAGES['criptomundo-mazmorras-pvp.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Mazmorras & PvP</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --void:        #060809;
  --deep:        #0A0C10;
  --panel:       #11141C;
  --card:        #181B26;
  --hover:       #1F2333;
  --gold:        #C8A84B;
  --gold-dim:    #6A5520;
  --gold-bright: #F0D070;
  --dng:         #DC2626;   /* dungeon red */
  --dng-dim:     #5A0A0A;
  --pvp:         #7C3AED;   /* pvp purple */
  --pvp-dim:     #2E1065;
  --green:       #10B981;
  --green-dim:   #064830;
  --warn:        #F59E0B;
  --border:      #1A1D28;
  --border-gold: #3A2E10;
  --txt:         #E8E0CC;
  --txt-dim:     #7A7060;
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
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(220,38,38,0.08) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23DC2626' fill-opacity='0.015'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── HEADER ── */
header {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 24px;
  background:linear-gradient(180deg,rgba(220,38,38,0.12) 0%,transparent 100%);
  border-bottom:1px solid rgba(220,38,38,0.2);
  position:sticky; top:0; z-index:50; backdrop-filter:blur(8px);
}
.logo { font-family:'Cinzel',serif; font-weight:900; font-size:20px; color:var(--gold); letter-spacing:3px; }
.logo em { color:var(--dng); font-style:normal; }
.logo small { display:block; color:var(--txt-dim); font-size:11px; font-weight:400; letter-spacing:2px; margin-top:-2px; }
.hdr-right { display:flex; gap:10px; align-items:center; }
.badge {
  display:flex; align-items:center; gap:6px;
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:5px 12px;
  font-family:'JetBrains Mono',monospace; font-size:12px;
}
.badge b { color:var(--gold); }
.badge.red b { color:var(--dng); }
.badge.purple b { color:#A78BFA; }
.badge span { color:var(--txt-dim); font-size:10px; }

/* ── MODE TABS ── */
.mode-bar {
  display:flex; border-bottom:1px solid var(--border);
  background:var(--deep);
}
.mode-tab {
  flex:1; padding:14px; font-family:'Cinzel',serif; font-size:12px;
  font-weight:600; letter-spacing:2px; text-transform:uppercase;
  cursor:pointer; background:none; border:none; color:var(--txt-dim);
  border-bottom:3px solid transparent; transition:all 0.15s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.mode-tab .mt-icon { font-size:20px; }
.mode-tab:hover { color:var(--txt); background:var(--hover); }
.mode-tab.active.dng { color:var(--dng); border-bottom-color:var(--dng); background:rgba(220,38,38,0.05); }
.mode-tab.active.pvp { color:#A78BFA; border-bottom-color:#A78BFA; background:rgba(124,58,237,0.05); }

/* ── LAYOUT ── */
.layout {
  display:grid;
  grid-template-columns:300px 1fr 300px;
  height:calc(100vh - 104px);
  overflow:hidden;
}
.sidebar {
  background:var(--panel); display:flex; flex-direction:column; overflow:hidden;
  border-right:1px solid var(--border);
}
.sidebar.right { border-right:none; border-left:1px solid var(--border); }
.sec-head {
  font-family:'Cinzel',serif; font-size:10px; font-weight:600;
  color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase;
  padding:13px 16px 10px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:8px;
}
.sec-head::before { content:''; width:3px; height:11px; background:var(--gold); border-radius:2px; flex-shrink:0; }

/* ── DUNGEON LIST ── */
.dng-scroll { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px; }

.dng-card {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; overflow:hidden; cursor:pointer;
  transition:all 0.15s; position:relative;
}
.dng-card:hover { border-color:rgba(220,38,38,0.4); transform:translateY(-1px); }
.dng-card.selected { border-color:var(--dng); box-shadow:0 0 0 1px rgba(220,38,38,0.3); }
.dng-card.locked { opacity:0.45; cursor:not-allowed; }
.dng-diff-bar { height:3px; }
.dng-body { padding:12px; }
.dng-top { display:flex; align-items:center; gap:10px; }
.dng-icon { font-size:32px; flex-shrink:0; }
.dng-meta { flex:1; }
.dng-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; }
.dng-sub  { font-size:11px; color:var(--txt-dim); margin-top:2px; }
.dng-diff { font-size:9px; letter-spacing:1px; text-transform:uppercase; padding:2px 7px; border-radius:3px; font-family:'Cinzel',serif; flex-shrink:0; }
.diff-normal { background:rgba(16,185,129,0.15); color:var(--green); border:1px solid rgba(16,185,129,0.3); }
.diff-heroic { background:rgba(245,158,11,0.15); color:var(--warn); border:1px solid rgba(245,158,11,0.3); }
.diff-mythic { background:rgba(220,38,38,0.15); color:var(--dng); border:1px solid rgba(220,38,38,0.3); }
.diff-raid   { background:rgba(163,53,238,0.15); color:#A335EE; border:1px solid rgba(163,53,238,0.3); }
.dng-stats { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
.dng-stat { font-size:10px; color:var(--txt-dim); display:flex; align-items:center; gap:3px; }
.dng-stat b { color:var(--txt); font-family:'JetBrains Mono',monospace; }

/* ── CENTER DUNGEON ── */
.center { display:flex; flex-direction:column; overflow:hidden; background:var(--deep); }

/* Dungeon entrance visual */
.dng-entrance {
  flex:0 0 auto; position:relative; height:220px; overflow:hidden;
  background:linear-gradient(180deg,#0A0508 0%,#130A0A 60%,#1A0D0D 100%);
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:center;
}
.entrance-bg {
  position:absolute; inset:0;
  background:radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 65%);
}
.entrance-particles { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.particle {
  position:absolute; border-radius:50%;
  background:rgba(220,38,38,0.6); animation:floatPart linear infinite;
}
@keyframes floatPart {
  0%   { transform:translateY(0) scale(1); opacity:0.8; }
  100% { transform:translateY(-220px) scale(0); opacity:0; }
}
.entrance-gate {
  position:relative; text-align:center; z-index:2;
}
.gate-icon { font-size:80px; filter:drop-shadow(0 0 30px rgba(220,38,38,0.5)); animation:gateBreath 3s ease-in-out infinite; }
@keyframes gateBreath {
  0%,100% { filter:drop-shadow(0 0 20px rgba(220,38,38,0.4)); transform:scale(1); }
  50%     { filter:drop-shadow(0 0 50px rgba(220,38,38,0.7)); transform:scale(1.05); }
}
.gate-name { font-family:'Cinzel',serif; font-size:22px; font-weight:900; color:var(--dng); letter-spacing:3px; text-shadow:0 0 30px rgba(220,38,38,0.5); margin-top:8px; }
.gate-sub  { font-size:12px; color:var(--txt-dim); letter-spacing:2px; margin-top:4px; }

/* Party builder */
.party-section { flex:0 0 auto; padding:14px 16px; border-bottom:1px solid var(--border); }
.party-title { font-family:'Cinzel',serif; font-size:10px; color:var(--txt-dim); letter-spacing:3px; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; }
.party-slots { display:flex; gap:8px; }
.party-slot {
  flex:1; background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:8px 6px; text-align:center;
  transition:all 0.15s; cursor:pointer;
}
.party-slot:hover { border-color:var(--gold-dim); }
.party-slot.filled { border-color:var(--green); background:rgba(16,185,129,0.06); }
.party-slot.you { border-color:var(--gold); background:rgba(200,168,75,0.06); }
.ps-avatar { font-size:24px; margin-bottom:4px; }
.ps-name { font-size:10px; font-family:'Cinzel',serif; color:var(--txt-dim); }
.ps-role { font-size:9px; color:var(--txt-dim); margin-top:1px; }
.ps-hp { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--green); }

/* Run log / combat scroll */
.run-scroll { flex:1; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:5px; }
.run-entry {
  font-size:13px; color:var(--txt-dim); padding:4px 8px;
  border-left:2px solid transparent; border-radius:3px;
  animation:slideIn 0.25s ease-out; line-height:1.5;
}
@keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
.re-boss    { border-color:var(--dng); color:var(--txt); background:rgba(220,38,38,0.05); }
.re-loot    { border-color:var(--gold); color:var(--gold); background:rgba(200,168,75,0.05); }
.re-death   { border-color:#FF4040; color:#FF8080; background:rgba(255,64,64,0.05); }
.re-system  { border-color:#4090F0; color:#70B0FF; }
.re-heal    { border-color:var(--green); color:var(--green); }
.re-damage  { border-color:var(--dng); color:#FF9090; }
.re-victory { border-color:var(--gold); color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:600; background:rgba(200,168,75,0.1); }

/* Boss health */
.boss-bar-section { flex:0 0 auto; padding:10px 16px; border-top:1px solid var(--border); background:var(--panel); }
.boss-name-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
.boss-bar-name { font-family:'Cinzel',serif; font-size:12px; color:var(--dng); }
.boss-bar-hp   { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--txt-dim); }
.boss-track { height:8px; background:var(--card); border-radius:4px; overflow:hidden; border:1px solid var(--border); }
.boss-fill  { height:100%; background:linear-gradient(90deg,#8B0000,var(--dng)); border-radius:4px; transition:width 0.5s cubic-bezier(.4,0,.2,1); }

/* Action bar */
.dng-actions { flex:0 0 auto; padding:12px 16px; border-top:1px solid var(--border); background:var(--panel); }
.dng-act-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.dng-btn {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:10px 6px; cursor:pointer;
  transition:all 0.15s; display:flex; flex-direction:column;
  align-items:center; gap:3px; color:var(--txt);
  font-family:'Cinzel',serif;
}
.dng-btn:hover:not(:disabled) { border-color:var(--dng); transform:translateY(-1px); box-shadow:0 4px 12px rgba(220,38,38,0.25); }
.dng-btn:disabled { opacity:0.3; cursor:not-allowed; }
.dng-btn .db-icon { font-size:22px; }
.dng-btn .db-name { font-size:10px; letter-spacing:0.5px; }
.dng-btn .db-cost { font-size:9px; color:#70B0FF; font-family:'JetBrains Mono',monospace; }
.start-dng-btn {
  width:100%; padding:12px; font-family:'Cinzel',serif; font-size:14px;
  font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--dng-dim),var(--dng));
  border:none; border-radius:8px; color:#fff; cursor:pointer;
  transition:all 0.2s; margin-bottom:8px;
}
.start-dng-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(220,38,38,0.4); }
.start-dng-btn:disabled { opacity:0.35; cursor:not-allowed; }

/* ── RIGHT: Loot & Stats ── */
.right-tabs { display:flex; border-bottom:1px solid var(--border); }
.rtab {
  flex:1; padding:9px 4px; font-family:'Cinzel',serif; font-size:10px;
  letter-spacing:1px; text-transform:uppercase; cursor:pointer;
  background:none; border:none; color:var(--txt-dim);
  border-bottom:2px solid transparent; transition:all 0.15s; text-align:center;
}
.rtab:hover { color:var(--txt); background:var(--hover); }
.rtab.active { color:var(--gold); border-bottom-color:var(--gold); }

.right-scroll { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }

.loot-item {
  background:var(--card); border:1px solid var(--border);
  border-radius:8px; padding:10px 12px;
  display:flex; align-items:center; gap:10px;
  animation:popItem 0.3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes popItem { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
.li-icon { font-size:28px; flex-shrink:0; }
.li-info { flex:1; }
.li-name { font-family:'Cinzel',serif; font-size:12px; font-weight:600; }
.li-rarity { font-size:10px; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
.li-stat { font-size:11px; color:var(--txt-dim); margin-top:3px; }
.li-who { font-size:10px; color:var(--txt-dim); margin-top:2px; }
.li-who span { color:#A78BFA; }
.r-common    { border-color:#2D2D2D; } .r-common .li-rarity    { color:var(--common); }
.r-uncommon  { border-color:#0D3000; } .r-uncommon .li-rarity  { color:var(--uncommon); }
.r-rare      { border-color:#0D2A50; } .r-rare .li-rarity      { color:var(--rare); }
.r-epic      { border-color:#3A1060; } .r-epic .li-rarity      { color:var(--epic); }
.r-legendary { border-color:#5A3000; box-shadow:0 0 8px rgba(255,128,0,0.15); } .r-legendary .li-rarity { color:var(--legendary); }

.stat-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); font-size:13px; }
.stat-row:last-child { border:none; }
.stat-row span { color:var(--txt-dim); }
.stat-row b { font-family:'JetBrains Mono',monospace; color:var(--txt); }
.stat-row b.red { color:var(--dng); }
.stat-row b.green { color:var(--green); }
.stat-row b.gold  { color:var(--gold); }

/* ═══════════════════════════════════════
   PVP SECTION
═══════════════════════════════════════ */
.pvp-layout { display:grid; grid-template-columns:300px 1fr 300px; height:calc(100vh - 104px); overflow:hidden; }

/* Player pool */
.pvp-pool { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px; }

.pvp-player {
  background:var(--card); border:1px solid var(--border);
  border-radius:10px; padding:12px; cursor:pointer;
  transition:all 0.15s; display:flex; gap:10px; align-items:center; position:relative;
}
.pvp-player:hover { border-color:rgba(167,139,250,0.4); }
.pvp-player.selected { border-color:#A78BFA; box-shadow:0 0 0 1px rgba(167,139,250,0.3); }
.pvp-player.online::after {
  content:''; position:absolute; top:8px; right:8px;
  width:7px; height:7px; border-radius:50%; background:var(--green);
  box-shadow:0 0 6px rgba(16,185,129,0.6);
}
.pp-avatar { font-size:32px; flex-shrink:0; }
.pp-info { flex:1; }
.pp-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; }
.pp-class { font-size:11px; color:var(--txt-dim); margin-top:1px; }
.pp-rating { font-family:'JetBrains Mono',monospace; font-size:12px; color:#A78BFA; margin-top:3px; }
.pp-record { font-size:10px; color:var(--txt-dim); margin-top:2px; }
.pp-record .wins { color:var(--green); }
.pp-record .losses { color:var(--dng); }

/* PvP Arena center */
.pvp-center { display:flex; flex-direction:column; overflow:hidden; background:var(--deep); }

.pvp-arena-visual {
  flex:0 0 auto; height:220px; position:relative; overflow:hidden;
  background:linear-gradient(180deg,#050508 0%,#0A0814 60%,#110D1E 100%);
  border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 60px;
}
.pvp-arena-glow-l { position:absolute; left:15%; top:20%; width:200px; height:100px; background:#7C3AED; border-radius:50%; filter:blur(60px); opacity:0.15; pointer-events:none; }
.pvp-arena-glow-r { position:absolute; right:15%; top:20%; width:200px; height:100px; background:var(--dng); border-radius:50%; filter:blur(60px); opacity:0.15; pointer-events:none; }

.pvp-fighter { display:flex; flex-direction:column; align-items:center; gap:8px; }
.pvp-fighter-sprite { font-size:64px; filter:drop-shadow(0 4px 20px rgba(0,0,0,0.8)); }
.pvp-fighter.enemy .pvp-fighter-sprite { transform:scaleX(-1); }
.pvp-fighter.attack .pvp-fighter-sprite { animation:pvpAttack 0.4s ease-in-out; }
.pvp-fighter.enemy.attack .pvp-fighter-sprite { animation:pvpAttackEnemy 0.4s ease-in-out; }
.pvp-fighter.shake .pvp-fighter-sprite { animation:pvpShake 0.35s ease-in-out; }
.pvp-fighter.enemy.shake .pvp-fighter-sprite { animation:pvpShakeEnemy 0.35s ease-in-out; }
@keyframes pvpAttack      { 0%{transform:translateX(0)}  40%{transform:translateX(70px)}  100%{transform:translateX(0)} }
@keyframes pvpAttackEnemy { 0%{transform:scaleX(-1) translateX(0)}  40%{transform:scaleX(-1) translateX(70px)}  100%{transform:scaleX(-1) translateX(0)} }
@keyframes pvpShake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
@keyframes pvpShakeEnemy  { 0%,100%{transform:scaleX(-1)} 25%{transform:scaleX(-1) translateX(-8px)} 75%{transform:scaleX(-1) translateX(8px)} }
.pvp-name-tag { font-family:'Cinzel',serif; font-size:12px; font-weight:600; }
.pvp-hp-bar { width:130px; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
.pvp-hp-fill { height:100%; border-radius:3px; transition:width 0.4s; }
.you-hp  { background:linear-gradient(90deg,#1E40AF,#3B82F6); }
.opp-hp  { background:linear-gradient(90deg,#991B1B,#EF4444); }
.pvp-vs { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:'Cinzel',serif; font-size:26px; font-weight:900; color:rgba(200,168,75,0.5); letter-spacing:4px; }

/* Bet section */
.bet-section {
  flex:0 0 auto; padding:12px 16px; border-bottom:1px solid var(--border);
  background:rgba(124,58,237,0.04);
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
}
.bet-label { font-family:'Cinzel',serif; font-size:11px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; }
.bet-chips { display:flex; gap:6px; flex-wrap:wrap; }
.bet-chip {
  background:var(--card); border:1px solid var(--border);
  border-radius:5px; padding:4px 10px; font-family:'JetBrains Mono',monospace;
  font-size:12px; cursor:pointer; transition:all 0.12s; color:var(--txt-dim);
}
.bet-chip:hover,.bet-chip.active { border-color:#A78BFA; color:#A78BFA; background:rgba(124,58,237,0.1); }
.bet-crypto-chip:hover,.bet-crypto-chip.active { border-color:var(--gold); color:var(--gold); background:rgba(200,168,75,0.1); }
.bet-info { margin-left:auto; font-size:12px; color:var(--txt-dim); }
.bet-info b { color:var(--gold); font-family:'JetBrains Mono',monospace; }

/* PvP log */
.pvp-log { flex:1; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:4px; }

/* PvP actions */
.pvp-action-bar { flex:0 0 auto; padding:12px 16px; border-top:1px solid var(--border); background:var(--panel); }
.pvp-ready-btn {
  width:100%; padding:12px; font-family:'Cinzel',serif; font-size:14px;
  font-weight:600; letter-spacing:2px;
  background:linear-gradient(135deg,var(--pvp-dim),var(--pvp));
  border:none; border-radius:8px; color:#fff; cursor:pointer;
  transition:all 0.2s; margin-bottom:8px;
}
.pvp-ready-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,0.4); }
.pvp-ready-btn:disabled { opacity:0.35; cursor:not-allowed; }
.pvp-act-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }

/* PvP right: challenge + leaderboard */
.challenge-form { padding:12px; display:flex; flex-direction:column; gap:10px; }
.cf-label { font-size:10px; color:var(--txt-dim); letter-spacing:2px; text-transform:uppercase; margin-bottom:3px; }
.cf-input {
  background:var(--card); border:1px solid var(--border);
  border-radius:6px; padding:8px 12px;
  font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--txt);
  outline:none; width:100%; transition:border-color 0.12s;
}
.cf-input:focus { border-color:#A78BFA; }
.challenge-btn {
  width:100%; padding:10px; font-family:'Cinzel',serif; font-size:13px;
  font-weight:600; letter-spacing:1px;
  background:linear-gradient(135deg,var(--pvp-dim),var(--pvp));
  border:none; border-radius:7px; color:#fff; cursor:pointer; transition:all 0.2s;
}
.challenge-btn:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,0.4); }

.lb-row {
  display:flex; align-items:center; gap:8px; padding:7px 0;
  border-bottom:1px solid var(--border); font-size:12px;
}
.lb-row:last-child { border:none; }
.lb-rank { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; width:24px; text-align:center; }
.lb-rank.r1 { color:#FFD700; } .lb-rank.r2 { color:#C0C0C0; } .lb-rank.r3 { color:#CD7F32; }
.lb-avatar { font-size:20px; }
.lb-info { flex:1; }
.lb-name { font-family:'Cinzel',serif; font-size:12px; }
.lb-class { font-size:10px; color:var(--txt-dim); }
.lb-rating { font-family:'JetBrains Mono',monospace; font-size:12px; color:#A78BFA; }
.lb-wins { font-size:10px; color:var(--green); }

/* ── OVERLAYS ── */
.result-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.88);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
  z-index:200; opacity:0; pointer-events:none; transition:opacity 0.4s;
}
.result-overlay.show { opacity:1; pointer-events:all; }
.ro-title { font-family:'Cinzel',serif; font-size:48px; font-weight:900; letter-spacing:4px; animation:pulseGlow 2s infinite; }
.ro-title.victory { color:var(--gold); text-shadow:0 0 60px rgba(200,168,75,0.6); }
.ro-title.defeat  { color:var(--dng);  text-shadow:0 0 60px rgba(220,38,38,0.6); }
@keyframes pulseGlow { 0%,100%{opacity:0.8} 50%{opacity:1} }
.ro-card { background:var(--panel); border:1px solid var(--border-gold); border-radius:12px; padding:20px 40px; min-width:280px; display:flex; flex-direction:column; gap:8px; }
.ro-row { display:flex; align-items:center; gap:10px; font-size:15px; }
.ro-btn {
  padding:12px 40px; font-family:'Cinzel',serif; font-size:13px; font-weight:600; letter-spacing:2px;
  border:none; border-radius:8px; cursor:pointer; transition:all 0.2s;
}
.ro-btn.gold   { background:linear-gradient(135deg,var(--gold-dim),var(--gold)); color:var(--void); }
.ro-btn.red    { background:linear-gradient(135deg,var(--dng-dim),var(--dng));   color:#fff; }
.ro-btn:hover  { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.4); }

/* Floating numbers */
.float-num {
  position:absolute; font-family:'Cinzel',serif; font-weight:900; font-size:22px;
  pointer-events:none; animation:floatUp 1.2s ease-out forwards; z-index:10;
  text-shadow:0 2px 8px rgba(0,0,0,0.8);
}
@keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1.2)} 60%{opacity:1;transform:translateY(-40px)} 100%{opacity:0;transform:translateY(-70px)} }

/* Toast */
.toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px); background:var(--panel); border:1px solid var(--gold); border-radius:8px; padding:10px 20px; font-family:'Cinzel',serif; font-size:13px; color:var(--gold); box-shadow:0 8px 28px rgba(0,0,0,0.6); opacity:0; pointer-events:none; transition:all 0.35s cubic-bezier(.4,0,.2,1); z-index:100; white-space:nowrap; }
.toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
.toast.green { border-color:var(--green); color:var(--green); }
.toast.red   { border-color:var(--dng);   color:var(--dng); }

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
  <div class="logo">CRIPTO<em>MUNDO</em> <small>MAZMORRAS & PVP</small></div>
  <div class="hdr-right">
    <div class="badge red"><span>☠️</span><b id="kills-disp">0</b><span>JEFES</span></div>
    <div class="badge purple"><span>⚔️</span><b id="pvp-wins">0</b><span>VICTORIAS PVP</span></div>
    <div class="badge"><span>🪙</span><b id="gold-disp">1,240</b><span>ORO</span></div>
    <div class="badge"><span>💎</span><b id="crypto-disp">12</b><span>$CGRID</span></div>
  </div>
</header>

<!-- MODE TABS -->
<div class="mode-bar">
  <button class="mode-tab active dng" onclick="setMode('dng',this)">
    <span class="mt-icon">🏰</span> MAZMORRAS
  </button>
  <button class="mode-tab pvp" onclick="setMode('pvp',this)">
    <span class="mt-icon">⚔️</span> PVP — ARENA
  </button>
</div>

<!-- DUNGEON MODE -->
<div id="dng-mode">

<div class="mz-pantalla">
  <div id="mz-cuerpo">Cargando…</div>
  <div class="mz-toast" id="mz-toast"></div>
</div>
<style>
  .mz-pantalla { max-width:820px; margin:0 auto; padding:18px 14px 40px; }
  .mz-titulo { font-family:'Cinzel',serif; font-size:12px; letter-spacing:2px; color:#7A7060;
    text-transform:uppercase; margin:14px 0 10px; }
  .mz-card { display:flex; gap:12px; background:#161A24; border:1px solid #2A2418; border-radius:10px;
    padding:14px; margin-bottom:10px; cursor:pointer; transition:all .15s; }
  .mz-card:hover { border-color:#C8A84B; transform:translateY(-2px); }
  .mz-card.bloq { opacity:.45; cursor:not-allowed; }
  .mz-icono { font-size:34px; }
  .mz-nombre { font-family:'Cinzel',serif; font-size:15px; color:#C8A84B; }
  .mz-datos { font-size:12px; color:#7A7060; margin-top:3px; }
  .mz-enemigos { font-size:17px; margin-top:5px; letter-spacing:3px; }
  .mz-bloq { font-size:11px; color:#E05050; margin-top:5px; }
  .mz-aviso { font-size:12px; color:#7A7060; line-height:1.6; margin-top:14px; }
  .mz-cabecera { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .mz-nombre-run { font-family:'Cinzel',serif; font-size:17px; color:#F0D070; }
  .mz-piso { font-family:'JetBrains Mono',monospace; font-size:12px; color:#7A7060; }
  .mz-vida { display:flex; align-items:center; gap:9px; margin-bottom:8px; font-size:11px; color:#7A7060; }
  .mz-vida-barra { flex:1; height:9px; background:#0A0D13; border-radius:5px; overflow:hidden; }
  .mz-vida-barra i { display:block; height:100%; background:linear-gradient(90deg,#8B1A1A,#30C060); }
  .mz-acumulado { font-size:12px; color:#C8A84B; background:rgba(200,168,75,.08);
    border:1px solid #2A2418; border-radius:7px; padding:8px 11px; margin-bottom:12px; }
  .mz-salas { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; }
  .mz-sala { background:#161A24; border:1px solid #2A2418; border-radius:10px; padding:14px;
    text-align:center; cursor:pointer; transition:all .15s; }
  .mz-sala:hover { border-color:#C8A84B; transform:translateY(-3px); box-shadow:0 6px 18px rgba(0,0,0,.45); }
  .ms-icono { font-size:32px; }
  .ms-nombre { font-family:'Cinzel',serif; font-size:14px; color:#C8A84B; margin:5px 0; }
  .ms-desc { font-size:11px; color:#7A7060; line-height:1.5; }
  .ms-enemigos { font-size:18px; margin-top:7px; letter-spacing:3px; }
  .mz-combate { background:rgba(224,48,48,.1); border:1px solid #5A1A1A; border-radius:9px;
    padding:13px; font-size:13px; color:#E8E0CC; margin-bottom:12px; }
  .mz-registro { margin-top:14px; font-size:11px; color:#7A7060; line-height:1.8;
    border-top:1px solid #2A2418; padding-top:10px; }
  .mz-salir { width:100%; margin-top:14px; background:rgba(200,168,75,.12); border:1px solid #3A3020;
    color:#C8A84B; border-radius:8px; padding:11px; font-size:12px; cursor:pointer; min-height:42px; }
  .mz-fin { text-align:center; padding:26px 14px; }
  .mz-fin h2 { font-family:'Cinzel',serif; color:#F0D070; font-size:20px; margin-bottom:10px; }
  .mz-fin p { font-size:13px; color:#9A9080; line-height:1.7; }
  .mz-nivel { color:#F0D070 !important; }
  .mz-toast { position:fixed; bottom:18px; left:50%; transform:translateX(-50%); background:#12151D;
    border:1px solid #C8A84B; color:#E8E0CC; padding:10px 18px; border-radius:8px; font-size:13px;
    opacity:0; transition:opacity .2s; pointer-events:none; z-index:100; }
  .mz-toast.visible { opacity:1; }
</style>
<script>
// ═══════════════════════════════════════════════════════════
//  MAZMORRAS v21 — salas, decisiones y combate real
//  Nada de esto se decide aquí: el servidor genera el mapa con una
//  semilla, resuelve las salas y lleva la cuenta del botín. Esta
//  pantalla elige y dibuja. Los combates se juegan en la Arena, que
//  es el mismo motor.
// ═══════════════════════════════════════════════════════════
var MZ = { lista: [], run: null }

// Las dos pestañas de arriba llamaban a setMode(), que no existía en
// ninguna parte: pulsar "PVP — ARENA" lanzaba un ReferenceError y no
// pasaba nada. El PvP jugable todavía no tiene pantalla propia (va en
// la fase 13), así que la pestaña lleva al combate en tiempo real, que
// es el que sí funciona, en vez de a un panel vacío.
function setMode(modo, boton) {
  document.querySelectorAll('.mode-tab').forEach(function (b) { b.classList.remove('active') })
  if (boton) boton.classList.add('active')
  var dng = document.getElementById('dng-mode')
  var pvp = document.getElementById('pvp-mode')
  if (dng) dng.style.display = (modo === 'dng') ? '' : 'none'
  if (pvp) pvp.style.display = (modo === 'pvp') ? '' : 'none'
}

async function api(ruta, cuerpo) {
  var o = { credentials: 'include', headers: { 'Content-Type': 'application/json' } }
  if (cuerpo) { o.method = 'POST'; o.body = JSON.stringify(cuerpo) }
  var r = await fetch(ruta, o)
  var d = {}
  try { d = await r.json() } catch (e) {}
  return { ok: r.ok, d: d }
}

async function cargar() {
  var r = await api('/api/mazmorra')
  if (!r.ok) { pintar('<div class="mz-aviso">Inicia sesión para entrar a las mazmorras.</div>'); return }
  MZ.lista = r.d.mazmorras
  MZ.run = r.d.run
  if (MZ.run) pintarRun()
  else pintarLista()
}

function pintar(html) { document.getElementById('mz-cuerpo').innerHTML = html }

function pintarLista() {
  var html = '<div class="mz-titulo">Elige mazmorra</div>'
  MZ.lista.forEach(function (m) {
    var frio = m.enfriamiento > 0
    var min = Math.ceil(m.enfriamiento / 60000)
    html += '<div class="mz-card ' + (m.disponible && !frio ? '' : 'bloq') + '"' +
      (m.disponible && !frio ? ' onclick="entrar(\\'' + m.id + '\\')"' : '') + '>' +
      '<div class="mz-icono">' + m.icono + '</div>' +
      '<div class="mz-info"><div class="mz-nombre">' + m.nombre + '</div>' +
      '<div class="mz-datos">' + m.pisos + ' pisos · recompensa 🪙' + m.oro[0] + '-' + m.oro[1] +
      (m.cgrid ? ' · 💎' + m.cgrid : '') + '</div>' +
      '<div class="mz-enemigos">' + m.enemigos.map(function (e) { return e.icono }).join(' ') + '</div>' +
      (m.disponible ? (frio ? '<div class="mz-bloq">En enfriamiento · ' + min + ' min</div>' : '')
                    : '<div class="mz-bloq">🔒 Nivel ' + m.minLevel + '</div>') +
      '</div></div>'
  })
  html += '<div class="mz-aviso">Dentro eliges entre dos salas en cada piso. Los combates se juegan ' +
    'en tiempo real. El botín se entrega al salir con vida: si caes, lo pierdes.</div>'
  pintar(html)
}

async function entrar(id) {
  var r = await api('/api/mazmorra/entrar', { mazmorraId: id })
  if (!r.ok) { avisar(r.d.error || 'No se pudo entrar'); return }
  MZ.run = r.d.run
  pintarRun()
}

function pintarRun() {
  var run = MZ.run
  var vidaPct = Math.max(0, Math.round(run.vida / run.vidaMax * 100))
  var html = '<div class="mz-cabecera">' +
    '<div class="mz-nombre-run">' + run.icono + ' ' + run.nombre + '</div>' +
    '<div class="mz-piso">Piso ' + run.piso + ' / ' + run.pisos + '</div></div>' +
    '<div class="mz-vida"><div class="mz-vida-barra"><i style="width:' + vidaPct + '%"></i></div>' +
    '<span>' + Math.round(run.vida) + ' / ' + run.vidaMax + '</span></div>' +
    '<div class="mz-acumulado">Acumulado: ⚔️ ' + run.acumulado.bajas + ' bajas · ✨ ' + run.acumulado.xp + ' XP · 📦 ' +
    (run.acumulado.botin.length ? run.acumulado.botin.map(function (b) { return b.icono }).join('') : 'nada') + '</div>'

  if (run.enCombate) {
    html += '<div class="mz-combate">⚔️ Combate en curso. Ve a la <b>Arena</b> para pelear; ' +
      'al terminar vuelve aquí.</div>'
  } else {
    html += '<div class="mz-titulo">Elige por dónde seguir</div><div class="mz-salas">'
    run.opciones.forEach(function (o) {
      html += '<div class="mz-sala" onclick="elegir(\\'' + o.id + '\\')">' +
        '<div class="ms-icono">' + o.icono + '</div>' +
        '<div class="ms-nombre">' + o.nombre + '</div>' +
        '<div class="ms-desc">' + o.desc + '</div>' +
        (o.enemigos.length ? '<div class="ms-enemigos">' + o.enemigos.map(function (e) { return e.icono }).join(' ') + '</div>' : '') +
        '</div>'
    })
    html += '</div>'
  }

  html += '<div class="mz-registro">' + run.registro.map(function (l) { return '<div>' + l + '</div>' }).join('') + '</div>'
  if (!run.enCombate) html += '<button class="mz-salir" onclick="retirarse()">🚪 Retirarse (te llevas la mitad del botín)</button>'
  pintar(html)
}

async function elegir(salaId) {
  var r = await api('/api/mazmorra/sala', { salaId: salaId })
  if (!r.ok) { avisar(r.d.error || 'No se pudo'); return }
  if (r.d.fin) { pintarFin(r.d.fin); return }
  MZ.run = r.d.run
  if (r.d.combate) {
    // El combate vive en la Arena: se abre ahí y al volver se recarga
    pintarRun()
    try { window.parent.postMessage({ type: 'OPEN_MODULE', payload: { module: 'arena' } }, '*') } catch (e) {}
    avisar('⚔️ Combate iniciado: ve a la pestaña Arena')
  } else pintarRun()
}

async function retirarse() {
  if (!confirm('¿Retirarte? Te llevas la mitad del botín acumulado.')) return
  var r = await api('/api/mazmorra/retirarse', {})
  if (r.ok && r.d.fin) pintarFin(r.d.fin)
}

function pintarFin(fin) {
  var titulos = { victoria: '🏆 Mazmorra completada', derrota: '☠️ Has caído', retirada: '🚪 Te has retirado' }
  var html = '<div class="mz-fin"><h2>' + (titulos[fin.motivo] || 'Fin') + '</h2>' +
    '<p>' + fin.pisos + ' pisos · ' + fin.bajas + ' bajas · ✨ ' + fin.xp + ' XP' +
    (fin.oro ? ' · 🪙 ' + fin.oro : '') + (fin.cgrid ? ' · 💎 ' + fin.cgrid : '') + '</p>'
  if ((fin.botin || []).length) {
    html += '<p>Botín: ' + fin.botin.map(function (b) { return b.icono + ' ' + b.nombre + ' ×' + b.quantity }).join(' · ') + '</p>'
  } else html += '<p>Sin botín.</p>'
  if ((fin.levelUps || []).length) html += '<p class="mz-nivel">🎉 ¡Nivel ' + fin.nivel + '!</p>'
  html += '<button class="mz-salir" onclick="cargar()">Volver a las mazmorras</button></div>'
  pintar(html)
  MZ.run = null
  try { window.parent.postMessage({ type: 'REFRESH_CHARACTER' }, '*') } catch (e) {}
}

function avisar(t) {
  var d = document.getElementById('mz-toast')
  if (!d) return
  d.textContent = t
  d.className = 'mz-toast visible'
  setTimeout(function () { d.className = 'mz-toast' }, 3000)
}

cargar()
// Al volver de la Arena, el estado de la run puede haber cambiado
document.addEventListener('visibilitychange', function () { if (!document.hidden) cargar() })
setInterval(function () { if (!document.hidden && MZ.run && MZ.run.enCombate) cargar() }, 4000)

</script>
</div><!-- /dng-mode -->

<!-- ════════ MODO PVP ════════
     El panel que faltaba. setMode('pvp') buscaba un elemento con este
     id y no existía en toda la página: pulsar la pestaña escondía las
     mazmorras y no enseñaba nada. Pantalla en blanco.

     Y había ciento veinte líneas de CSS escritas para él —.pvp-layout,
     .pvp-pool, .pvp-fighter, las animaciones de golpe y sacudida— sin
     una sola etiqueta que las usara. Este panel no inventa estilos: usa
     los que ya estaban ahí esperando.
-->
<div id="pvp-mode" style="display:none">
  <div class="pvp-layout">

    <div class="pvp-pool" id="pvp-pool">
      <div class="cf-label" style="padding:4px 2px">Tu ficha</div>
      <div id="pvp-ficha" style="font-size:12px;color:#7A7060">Cargando…</div>
    </div>

    <div class="pvp-center">
      <div class="pvp-arena-visual">
        <div class="pvp-arena-glow-l"></div>
        <div class="pvp-arena-glow-r"></div>
        <div class="pvp-fighter" id="pvp-tu">
          <div class="pvp-fighter-sprite">🧝</div>
          <div class="pvp-name-tag" id="pvp-tu-nombre">Tú</div>
          <div class="pvp-hp-bar"><div class="pvp-hp-fill you-hp" id="pvp-tu-hp" style="width:100%"></div></div>
        </div>
        <div class="pvp-vs">VS</div>
        <div class="pvp-fighter enemy" id="pvp-rival">
          <div class="pvp-fighter-sprite">🥷</div>
          <div class="pvp-name-tag" id="pvp-rival-nombre">—</div>
          <div class="pvp-hp-bar"><div class="pvp-hp-fill opp-hp" id="pvp-rival-hp" style="width:100%"></div></div>
        </div>
      </div>

      <div class="bet-section">
        <span class="bet-label">Apuesta</span>
        <div class="bet-chips" id="pvp-apuestas"></div>
        <div class="bet-info">Tu oro: <b id="pvp-oro">—</b></div>
      </div>

      <div class="pvp-log" id="pvp-log"></div>

      <div class="pvp-action-bar">
        <button class="pvp-ready-btn" id="pvp-btn" onclick="pvpDuelo()">BUSCAR DUELO</button>
      </div>
    </div>

    <div class="pvp-pool" id="pvp-lb">
      <div class="cf-label" style="padding:4px 2px">Clasificación</div>
      <div id="pvp-lb-cuerpo" style="font-size:12px;color:#7A7060">Cargando…</div>
    </div>

  </div>
</div>
<!-- ===== RED-CLIENTE:FIN ===== -->
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
