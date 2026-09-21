PAGES['index.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CriptoMundo — Launcher</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --void:#05070A; --deep:#090C12; --panel:#0F1219; --card:#161A24; --hover:#1E2230;
  --gold:#C8A84B; --gold2:#F0D070; --gold3:#7A6530;
  --border:#1A1D28; --brim:#2E2810; --txt:#E8E0CC; --dim:#7A7060;
  --green:#10B981; --red:#EF4444; --blue:#3B82F6; --purple:#8B5CF6;
}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;overflow:hidden;background:var(--void);color:var(--txt);
  font-family:'Crimson Pro',Georgia,serif;}

body {
  background-image:
    radial-gradient(ellipse 100% 60% at 50% -10%, rgba(200,168,75,.09) 0%, transparent 55%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A84B' fill-opacity='0.015'%3E%3Cpath d='M50 5L60 35H90L67 54L76 84L50 65L24 84L33 54L10 35H40Z'/%3E%3C/g%3E%3C/svg%3E");
}

/* ── SCREENS ── */
.screen { position:absolute; inset:0; display:none; flex-direction:column; }
.screen.active { display:flex; }

/* ─────────────────────────────
   LOGIN SCREEN
───────────────────────────── */
#screen-login {
  align-items:center; justify-content:center; gap:0;
}
.login-bg {
  position:absolute; inset:0; overflow:hidden; pointer-events:none;
}
.login-star {
  position:absolute; border-radius:50%; background:rgba(200,168,75,.6);
  animation:twinkle linear infinite;
}
@keyframes twinkle {
  0%,100%{opacity:.2;transform:scale(1)}
  50%{opacity:.8;transform:scale(1.4)}
}
.login-box {
  position:relative; z-index:2;
  background:rgba(9,12,18,.95); border:1px solid rgba(200,168,75,.25);
  border-radius:16px; padding:40px 44px; width:420px; max-width:94vw;
  box-shadow:0 24px 64px rgba(0,0,0,.8), 0 0 80px rgba(200,168,75,.05);
  backdrop-filter:blur(12px);
}
.login-logo {
  text-align:center; margin-bottom:28px;
}
.login-logo .big {
  font-family:'Cinzel',serif; font-weight:900; font-size:32px;
  color:var(--gold); letter-spacing:6px;
  text-shadow:0 0 40px rgba(200,168,75,.4);
  display:block;
}
.login-logo .sub {
  font-size:11px; color:var(--dim); letter-spacing:4px;
  text-transform:uppercase; display:block; margin-top:4px;
}
.login-logo .emblem { font-size:52px; display:block; margin-bottom:10px;
  filter:drop-shadow(0 0 20px rgba(200,168,75,.3)); }

.form-tabs { display:flex; margin-bottom:20px; border-bottom:1px solid var(--border); }
.form-tab {
  flex:1; padding:9px; font-family:'Cinzel',serif; font-size:11px;
  font-weight:600; letter-spacing:1.5px; cursor:pointer; background:none;
  border:none; color:var(--dim); border-bottom:2px solid transparent;
  transition:all .15s; text-align:center;
}
.form-tab.active { color:var(--gold); border-bottom-color:var(--gold); }

.form-group { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
.form-label { font-family:'Cinzel',serif; font-size:10px; color:var(--dim); letter-spacing:2px; text-transform:uppercase; }
.form-input {
  background:var(--card); border:1px solid var(--border); border-radius:8px;
  padding:10px 14px; font-family:'JetBrains Mono',monospace; font-size:13px;
  color:var(--txt); outline:none; transition:border-color .15s; width:100%;
}
.form-input:focus { border-color:var(--gold3); }
.form-input::placeholder { color:var(--dim); }

.form-error { font-size:12px; color:var(--red); margin-bottom:8px; min-height:16px; font-family:'Cinzel',serif; }

.submit-btn {
  width:100%; padding:13px; font-family:'Cinzel',serif; font-size:13px;
  font-weight:600; letter-spacing:2px; text-transform:uppercase;
  background:linear-gradient(135deg,var(--gold3),var(--gold));
  border:none; border-radius:8px; color:var(--void); cursor:pointer;
  transition:all .2s; margin-top:4px;
}
.submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(200,168,75,.3); }
.submit-btn:disabled { opacity:.4; cursor:not-allowed; }

.demo-btn {
  width:100%; padding:9px; font-family:'Cinzel',serif; font-size:11px;
  letter-spacing:1px; background:rgba(200,168,75,.06);
  border:1px solid rgba(200,168,75,.2); border-radius:8px;
  color:var(--gold); cursor:pointer; transition:all .15s; margin-top:8px;
}
.demo-btn:hover { background:rgba(200,168,75,.12); }

.server-status {
  display:flex; align-items:center; gap:6px; justify-content:center;
  margin-top:16px; font-size:11px; color:var(--dim); font-family:'Cinzel',serif; letter-spacing:1px;
}
.status-dot { width:6px; height:6px; border-radius:50%; background:var(--dim); }
.status-dot.online  { background:var(--green); box-shadow:0 0 6px var(--green); animation:pulse 2s infinite; }
.status-dot.offline { background:var(--red); }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }

/* ─────────────────────────────
   GAME SCREEN
───────────────────────────── */
#screen-game { flex-direction:row; }

/* Sidebar nav */
.game-nav {
  width:72px; background:var(--panel); border-right:1px solid var(--border);
  display:flex; flex-direction:column; align-items:center;
  padding:10px 0; gap:4px; flex-shrink:0; z-index:20;
}
.nav-logo-sm {
  font-family:'Cinzel',serif; font-size:9px; color:var(--gold3);
  letter-spacing:2px; writing-mode:vertical-rl; text-orientation:mixed;
  transform:rotate(180deg); padding:8px 0 12px; border-bottom:1px solid var(--border); width:100%; text-align:center;
}
.nav-item {
  width:52px; display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:8px 4px; border-radius:8px; cursor:pointer; transition:all .12s;
  border:1px solid transparent; position:relative;
}
.nav-item:hover { background:var(--hover); border-color:var(--border); }
.nav-item.active { background:rgba(200,168,75,.08); border-color:var(--brim); }
.nav-item .ni-icon { font-size:22px; }
.nav-item .ni-label { font-family:'Cinzel',serif; font-size:8px; color:var(--dim); letter-spacing:.5px; text-align:center; line-height:1.2; }
.nav-item.active .ni-label { color:var(--gold); }
.nav-badge {
  position:absolute; top:4px; right:4px; background:var(--red); color:#fff;
  font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700;
  border-radius:8px; padding:1px 4px; min-width:14px; text-align:center;
  border:1px solid var(--panel);
}
.nav-sep { width:40px; height:1px; background:var(--border); margin:4px 0; }
.nav-bottom { margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:4px; width:100%; padding-top:8px; border-top:1px solid var(--border); }

/* Main area (iframe) */
.game-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }

/* Top HUD bar */
.game-topbar {
  height:44px; background:var(--deep); border-bottom:1px solid var(--border);
  display:flex; align-items:center; padding:0 14px; gap:10px; flex-shrink:0;
  background:linear-gradient(180deg,rgba(200,168,75,.06) 0%,var(--deep) 100%);
}
.gtb-char { display:flex; align-items:center; gap:7px; }
.gtb-perfil { display:flex; align-items:center; gap:8px; cursor:pointer; padding:3px 6px;
  border-radius:8px; transition:background .15s; }
.gtb-perfil:hover { background:rgba(200,168,75,.14); }
.gtb-avatar { font-size:22px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .gtb-avatar img { width:30px; height:30px; object-fit:cover; object-position:top center; border-radius:50%; border:1px solid var(--gold); }
.gtb-name { font-family:'Cinzel',serif; font-size:13px; font-weight:600; color:var(--gold); }
.efectos-hud { display:flex; gap:5px; align-items:center; margin-left:10px; }
.efecto-chip { display:flex; align-items:center; gap:4px; font-size:10px; color:#F0D070;
  background:rgba(240,208,112,.12); border:1px solid rgba(200,168,75,.4);
  border-radius:11px; padding:2px 8px; font-family:'JetBrains Mono',monospace; }
.efecto-chip.acaba { animation:parpadeo 1s ease-in-out infinite; }
@keyframes parpadeo { 0%,100% { opacity:1 } 50% { opacity:.45 } }
@media (max-width:860px) { .efecto-chip span.nom { display:none } }
.gtb-level { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--dim); }
.gtb-sep { width:1px; height:24px; background:var(--border); }
.gtb-stat { display:flex; align-items:center; gap:4px; }
.gtb-bar-wrap { display:flex; flex-direction:column; gap:2px; }
.gtb-bar { height:4px; border-radius:2px; overflow:hidden; background:var(--card); width:80px; }
.gtb-bar-fill { height:100%; border-radius:2px; transition:width .4s; }
.gtb-bar-fill.hp { background:linear-gradient(90deg,#8B1A1A,#E03030); }
.gtb-bar-fill.mp { background:linear-gradient(90deg,#1A3A8B,#4090F0); }
.gtb-bar-fill.xp { background:linear-gradient(90deg,var(--gold3),var(--gold)); }
.gtb-bar-label { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--dim); }
.gtb-currency { display:flex; align-items:center; gap:4px; font-family:'JetBrains Mono',monospace; font-size:12px; }
.gtb-currency b { color:var(--gold); }
.pp-panel {
  position:fixed; right:16px; bottom:16px; width:290px; z-index:90;
  background:var(--panel,#12151D); border:1px solid var(--border-gold,#3A3020);
  border-radius:10px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,.5);
  transition:transform .25s ease;
}
.pp-panel.hidden { transform:translateY(calc(100% + 24px)); }
.pp-head { display:flex; align-items:center; gap:8px; padding:11px 13px; cursor:pointer; background:rgba(200,168,75,.08); }
.pp-title { font-family:'Cinzel',serif; font-size:12px; color:var(--gold,#C8A84B); letter-spacing:1px; flex:1; }
.pp-count { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--dim,#7A7060); }
.pp-toggle { color:var(--dim,#7A7060); font-size:11px; }
.pp-body { max-height:320px; overflow-y:auto; }
.pp-panel.cerrado .pp-body { display:none; }
.pp-step { display:flex; gap:9px; padding:10px 13px; border-top:1px solid var(--border,#2A2418); align-items:flex-start; }
.pp-step.hecho .pp-txt { color:var(--dim,#7A7060); text-decoration:line-through; }
.pp-step.actual { background:rgba(200,168,75,.06); }
.pp-mark { width:16px; height:16px; border-radius:50%; border:1px solid var(--border-gold,#3A3020); flex-shrink:0; margin-top:2px; font-size:10px; display:flex; align-items:center; justify-content:center; color:#30C060; }
.pp-step.hecho .pp-mark { border-color:#30C060; }
.pp-info { flex:1; min-width:0; }
.pp-txt { font-size:12px; color:var(--txt,#E8E0CC); line-height:1.35; }
.pp-hint { font-size:11px; color:var(--dim,#7A7060); margin-top:3px; line-height:1.4; }
.pp-actions { display:flex; gap:6px; margin-top:6px; }
.pp-btn { background:rgba(200,168,75,.14); border:1px solid var(--border-gold,#3A3020); color:var(--gold,#C8A84B); border-radius:5px; padding:4px 9px; font-size:11px; cursor:pointer; font-family:inherit; }
.pp-btn:hover { border-color:var(--gold,#C8A84B); }
.pp-btn.claim { background:rgba(48,192,96,.16); border-color:#30C060; color:#30C060; }
.pp-done { padding:14px 13px; font-size:12px; color:var(--dim,#7A7060); line-height:1.5; }
.online-badge {
  font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--dim);
  border:1px solid var(--border); border-radius:12px; padding:3px 9px; margin-right:8px;
}
.chat-unread { color:#30C060; margin-left:5px; font-size:10px; }
.gtb-zone { margin-left:auto; font-family:'Cinzel',serif; font-size:10px; color:var(--dim); letter-spacing:2px; }
.gtb-notif-btn {
  background:none; border:1px solid var(--border); border-radius:6px;
  padding:4px 10px; font-family:'Cinzel',serif; font-size:10px; color:var(--dim);
  cursor:pointer; transition:all .12s; position:relative;
}
.gtb-notif-btn:hover { border-color:var(--gold3); color:var(--gold); }
.logout-btn {
  background:none; border:1px solid var(--border); border-radius:6px;
  padding:4px 10px; font-family:'Cinzel',serif; font-size:10px; color:var(--dim);
  cursor:pointer; transition:all .12s;
}
.logout-btn:hover { border-color:var(--red); color:var(--red); }

/* iframe area */
.game-frame-area { flex:1; position:relative; overflow:hidden; }
#game-iframe { width:100%; height:100%; border:none; background:var(--deep); }

/* Loading overlay */
.frame-loading {
  position:absolute; inset:0; background:var(--deep);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
  pointer-events:none; transition:opacity .3s; z-index:5;
}
.frame-loading.hidden { opacity:0; pointer-events:none; }
.fl-spinner { font-size:36px; animation:spin 1.2s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.fl-label { font-family:'Cinzel',serif; font-size:13px; color:var(--dim); letter-spacing:3px; }

/* Notification panel */
.notif-panel {
  position:absolute; top:44px; right:0; width:320px; height:calc(100% - 44px);
  background:var(--panel); border-left:1px solid var(--border);
  display:flex; flex-direction:column; transform:translateX(100%);
  transition:transform .25s cubic-bezier(.4,0,.2,1); z-index:30;
}
.notif-panel.open { transform:translateX(0); }
.np-head { padding:12px 16px; border-bottom:1px solid var(--border); font-family:'Cinzel',serif; font-size:10px; color:var(--dim); letter-spacing:3px; text-transform:uppercase; display:flex; align-items:center; justify-content:space-between; }
.np-close { background:none; border:none; color:var(--dim); cursor:pointer; font-size:16px; }
.np-tabs { display:flex; border-bottom:1px solid var(--border); }
.np-tab { flex:1; padding:8px; font-family:'Cinzel',serif; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; background:none; border:none; color:var(--dim); border-bottom:2px solid transparent; transition:all .12s; text-align:center; }
.np-tab.active { color:var(--gold); border-bottom-color:var(--gold); }
.np-body { flex:1; overflow-y:auto; }

/* Chat */
.chat-area { display:flex; flex-direction:column; height:100%; }
.chat-msgs { flex:1; overflow-y:auto; padding:8px 12px; display:flex; flex-direction:column; gap:3px; }
.chat-msg { font-size:12px; line-height:1.4; }
.chat-msg .cm-name { font-family:'Cinzel',serif; font-weight:600; }
.chat-msg .cm-text { color:var(--dim); }
.chat-input-row { padding:8px 10px; border-top:1px solid var(--border); display:flex; gap:6px; }
.chat-inp { flex:1; background:var(--card); border:1px solid var(--border); border-radius:5px; padding:6px 10px; font-family:'Crimson Pro',serif; font-size:13px; color:var(--txt); outline:none; transition:border-color .12s; }
.chat-inp:focus { border-color:var(--gold3); }
.chat-send { background:rgba(200,168,75,.15); border:1px solid var(--gold3); border-radius:5px; padding:6px 12px; font-family:'Cinzel',serif; font-size:10px; color:var(--gold); cursor:pointer; letter-spacing:1px; transition:all .12s; }
.chat-send:hover { background:rgba(200,168,75,.25); }

/* Feed */
.feed-entry { display:flex; gap:8px; align-items:flex-start; padding:7px 12px; border-bottom:1px solid var(--border); font-size:12px; animation:fadeIn .25s ease-out; }
@keyframes fadeIn { from{opacity:0;transform:translateX(6px)} to{opacity:1;transform:none} }
.fe-icon { font-size:18px; flex-shrink:0; }
.fe-msg { flex:1; color:var(--dim); line-height:1.4; }
.fe-time { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--dim); flex-shrink:0; margin-top:2px; }

/* Leaderboard */
.lb-row { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid var(--border); font-size:12px; }
.lbr-rank { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; width:24px; }
.lbr-name { flex:1; font-family:'Cinzel',serif; font-size:11px; color:var(--txt); }
.lbr-stat { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--gold); }

/* Toast stack */
.toast-stack { position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column-reverse; gap:6px; z-index:999; pointer-events:none; }
.t-item {
  background:var(--panel); border:1px solid var(--brim); border-radius:8px;
  padding:9px 16px; display:flex; align-items:center; gap:8px;
  font-family:'Cinzel',serif; font-size:11px; color:var(--gold);
  box-shadow:0 8px 24px rgba(0,0,0,.7); max-width:280px;
  pointer-events:auto; cursor:pointer;
  transform:translateX(20px); opacity:0;
  transition:all .3s cubic-bezier(.4,0,.2,1);
}
.t-item.show { transform:translateX(0); opacity:1; }
.t-item.green { border-color:rgba(16,185,129,.4); color:var(--green); }
.t-item.red   { border-color:rgba(239,68,68,.4);  color:var(--red); }
.t-item.blue  { border-color:rgba(59,130,246,.4); color:var(--blue); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }

  /* ── Creador de personaje ─────────────────────────── */
  .name-hint { font-size: 11px; color: var(--txt-dim, #7A7060); margin-top: 5px; }
  .name-hint.ok { color: #30C060; }
  .name-hint.bad { color: #E05050; }

  .creator-wrap {
    max-width: 900px; margin: 0 auto; padding: 24px 18px 32px;
    height: 100%; overflow-y: auto; display: flex; flex-direction: column;
  }
  .creator-head { text-align: center; margin-bottom: 18px; }
  .creator-title { font-family: 'Cinzel', serif; font-size: 24px; color: #F0D070; letter-spacing: 1px; }
  .creator-sub { font-size: 13px; color: #9A9080; margin-top: 4px; }

  .creator-body { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
  @media (max-width: 720px) { .creator-body { grid-template-columns: 1fr; } }

  .creator-preview {
    background: rgba(10,13,19,.65); border: 1px solid #2A2418; border-radius: 12px;
    padding: 16px; text-align: center; align-self: start;
  }
  .preview-stage {
    height: 260px; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 50% 45%, rgba(200,168,75,.14), transparent 70%);
    border-radius: 10px; overflow: hidden;
  }
  .preview-img { max-height: 250px; max-width: 100%; object-fit: contain; }
  .preview-emoji { font-size: 110px; line-height: 1; }
  .preview-name { font-family: 'Cinzel', serif; font-size: 15px; color: #C8A84B; margin-top: 10px; }
  .preview-lore { font-size: 12px; color: #7A7060; margin-top: 4px; line-height: 1.5; }

  .opt-section { margin-bottom: 18px; }
  .opt-title {
    font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: #7A7060; margin-bottom: 8px;
  }
  .opt-grid { display: flex; gap: 8px; flex-wrap: wrap; }
  .opt-chip {
    background: rgba(20,24,34,.8); border: 1px solid #2A2418; border-radius: 8px;
    padding: 9px 14px; cursor: pointer; color: #E8E0CC; font-size: 13px; transition: all .15s ease;
  }
  .opt-chip:hover { border-color: #C8A84B; }
  .opt-chip.active { border-color: #F0D070; background: rgba(200,168,75,.14); color: #F0D070; }
  .opt-desc { font-size: 12px; color: #7A7060; margin-top: 8px; line-height: 1.6; min-height: 32px; }

  .skin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .skin-card {
    background: rgba(20,24,34,.8); border: 1px solid #2A2418; border-radius: 10px;
    padding: 10px 6px; text-align: center; cursor: pointer; transition: all .15s ease; position: relative;
  }
  .skin-card:hover { border-color: #C8A84B; transform: translateY(-2px); }
  .skin-card.active { border-color: #F0D070; box-shadow: 0 0 14px rgba(240,208,112,.3); }
  .skin-card.locked { opacity: .4; cursor: not-allowed; }
  .skin-card .sc-art { height: 56px; display: flex; align-items: center; justify-content: center; font-size: 34px; }
  .skin-card .sc-art img { max-height: 56px; max-width: 100%; object-fit: contain; }
  .skin-card .sc-name { font-size: 11px; color: #E8E0CC; margin-top: 6px; }
  .skin-card .sc-lock { font-size: 10px; color: #9A9080; margin-top: 2px; }

  .palette-row { display: flex; gap: 14px; flex-wrap: wrap; }
  .palette-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .palette-item label { font-size: 11px; color: #7A7060; }
  .palette-item input {
    width: 42px; height: 34px; border: 1px solid #2A2418; border-radius: 6px;
    background: none; cursor: pointer; padding: 2px;
  }
  .palette-note { font-size: 11px; color: #7A7060; }

  .creator-error { color: #E05050; font-size: 13px; min-height: 18px; text-align: center; margin-top: 12px; }
  .creator-actions { display: flex; gap: 10px; align-items: center; margin-top: 6px; }
  .creator-actions .submit-btn { flex: 1; }
  .creator-back {
    background: none; border: 1px solid #2A2418; color: #9A9080; border-radius: 8px;
    padding: 12px 18px; cursor: pointer; font-size: 13px;
  }
  .creator-back:hover { border-color: #C8A84B; color: #C8A84B; }


  /* ── Launcher en móvil ──────────────────────────────────
     La barra superior lleva nombre, nivel, tres barras, oro, CGRID,
     zona, presencia y chat. En 380 px no cabe: se ocultan las piezas
     prescindibles y las barras se estrechan. */
  @media (max-width: 860px) {
    .game-topbar { height: auto; padding: 6px 8px; }
    .gtb-bar { width: 54px; }
    .gtb-sep, .gtb-zone, .gtb-bar-label { display: none; }
    .gtb-level { font-size: 9px; }
    .online-badge { font-size: 9px; padding: 2px 6px; margin-right: 4px; }

    /* El panel de chat ocupa la pantalla entera: en móvil no tiene
       sentido una columna de 320 px sobre el juego */
    .notif-panel { width: 100%; top: 0; height: 100%; border-left: none; }

    /* Primeros pasos: barra inferior, no ventana flotante que tape */
    .pp-panel { right: 0; left: 0; bottom: 0; width: auto; border-radius: 0; border-left: none; border-right: none; }
    .pp-body { max-height: 44vh; }

    /* El creador: la vista previa arriba y las opciones debajo */
    .creator-wrap { padding: 14px 10px 24px; }
    .preview-stage { height: 190px; }
    .preview-emoji { font-size: 80px; }
  }

  /* Vista previa animada: las skins que traen tira de caminar se mueven
     en el creador. Las demás siguen mostrando su ilustración fija. */
  .preview-anim {
    background-repeat: no-repeat;
    background-size: auto 100%;
    image-rendering: auto;
    animation: caminar steps(var(--frames, 3)) 0.75s infinite;
  }
  @keyframes caminar {
    from { background-position-x: 0; }
    to   { background-position-x: calc(var(--frames, 3) * var(--ancho, 140px) * -1); }
  }



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

<!-- ── LOGIN SCREEN ── -->
<div class="screen active" id="screen-login">
  <div class="login-bg" id="login-bg"></div>
  <div class="login-box">
    <div class="login-logo">
      <span class="emblem">⚔️</span>
      <span class="big">CRIPTOMUNDO</span>
      <span class="sub">MMORPG Blockchain · Alpha v0.1</span>
    </div>

    <div class="form-tabs">
      <button class="form-tab active" id="tab-login"    onclick="switchTab('login')">Iniciar Sesión</button>
      <button class="form-tab"        id="tab-register" onclick="switchTab('register')">Registro</button>
    </div>

    <!-- Login -->
    <div id="form-login">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="login-email" type="email" placeholder="tu@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña</label>
        <input class="form-input" id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password">
      </div>
      <div class="form-error" id="login-error"></div>
      <button class="submit-btn" id="login-btn" onclick="doLogin()">⚔️ ENTRAR AL MUNDO</button>
      <button class="demo-btn" onclick="doDemo()">⚡ Prueba Demo (sin registro)</button>
    </div>

    <!-- Register -->
    <div id="form-register" style="display:none">
      <div class="form-group" id="invite-group" style="display:none">
        <label class="form-label">Código de invitación</label>
        <input class="form-input" id="reg-invite" type="text" placeholder="ABCDE-FGHIJ" maxlength="12" style="text-transform:uppercase">
        <div class="name-hint">Esta beta es cerrada. Si no tienes código, pídelo en el Discord.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre de Aventurero</label>
        <input class="form-input" id="reg-username" type="text" placeholder="NombreÉpico123" maxlength="20" oninput="checkName()">
        <div class="name-hint" id="name-hint">Entre 3 y 20 caracteres. Cada nombre es único en el mundo.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="reg-email" type="email" placeholder="tu@email.com">
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña</label>
        <input class="form-input" id="reg-pass" type="password" placeholder="Mínimo 8 caracteres">
      </div>
      <div class="form-error" id="reg-error"></div>
      <button class="submit-btn" id="reg-btn" onclick="openCreator()">🌟 CREAR PERSONAJE</button>
    </div>

    <div class="server-status">
      <div class="status-dot" id="status-dot"></div>
      <span id="status-text">Comprobando servidor...</span>
    </div>
  </div>
</div>

<!-- ── GAME SCREEN ── -->

<!-- ═══ CREADOR DE PERSONAJE ═══ -->
<div class="screen" id="screen-creator">
  <div class="creator-wrap">
    <div class="creator-head">
      <div class="creator-title">Crea tu personaje</div>
      <div class="creator-sub" id="creator-name">—</div>
    </div>

    <div class="creator-body">
      <div class="creator-preview">
        <div class="preview-stage" id="preview-stage">
          <img class="preview-img" id="preview-img" alt="" style="display:none">
          <div class="preview-emoji" id="preview-emoji">🧝</div>
        </div>
        <div class="preview-anim" id="preview-anim" style="display:none;margin:6px auto 0"></div>
        <div style="display:none">
        </div>
        <div class="preview-name" id="preview-skin-name">Aventurero</div>
        <div class="preview-lore" id="preview-lore"></div>
      </div>

      <div class="creator-options">
        <div class="opt-section">
          <div class="opt-title">Clase</div>
          <div class="opt-grid" id="class-grid"></div>
          <div class="opt-desc" id="class-desc"></div>
        </div>

        <div class="opt-section">
          <div class="opt-title">Aspecto</div>
          <div class="skin-grid" id="skin-grid"></div>
        </div>

        <div class="opt-section" id="palette-section">
          <div class="opt-title">Colores</div>
          <div class="palette-row" id="palette-row"></div>
        </div>
      </div>
    </div>

    <div class="creator-error" id="creator-error"></div>
    <div class="creator-actions">
      <button class="creator-back" onclick="closeCreator()">← Volver</button>
      <button class="submit-btn" id="creator-btn" onclick="doRegister()">⚔️ ENTRAR AL MUNDO</button>
    </div>
  </div>
</div>

<div class="screen" id="screen-game">

  <!-- Sidebar navigation -->
  <nav class="game-nav">
    <div class="nav-logo-sm">CM</div>

    <div class="nav-item active" id="nav-mundo2d"   onclick="loadModule('mundo2d')">
      <div class="ni-icon">🗺️</div>
      <div class="ni-label">Mundo</div>
    </div>
    <div class="nav-item" id="nav-combat"    onclick="loadModule('combat')">
      <div class="ni-icon">⚔️</div>
      <div class="ni-label">Combate</div>
      <div class="nav-badge" id="badge-combat" style="display:none">!</div>
    </div>
    <div class="nav-item" id="nav-arena"     onclick="loadModule('arena')">
      <div class="ni-icon">🏟️</div>
      <div class="ni-label">Arena</div>
    </div>
    <div class="nav-item" id="nav-huerto"    onclick="loadModule('huerto')">
      <div class="ni-icon">🌾</div>
      <div class="ni-label">Huerto</div>
    </div>
    <div class="nav-item" id="nav-crafting"  onclick="loadModule('crafting')">
      <div class="ni-icon">⚒️</div>
      <div class="ni-label">Forja</div>
    </div>
    <div class="nav-sep"></div>
    <div class="nav-item" id="nav-mercado"   onclick="loadModule('mercado')">
      <div class="ni-icon">🏪</div>
      <div class="ni-label">Mercado</div>
    </div>
    <div class="nav-item" id="nav-misiones"  onclick="loadModule('misiones')">
      <div class="ni-icon">📜</div>
      <div class="ni-label">Misiones</div>
      <div class="nav-badge" id="badge-misiones">2</div>
    </div>
    <div class="nav-sep"></div>
    <div class="nav-item" id="nav-mazmorras" onclick="loadModule('mazmorras')">
      <div class="ni-icon">🏰</div>
      <div class="ni-label">Maz & PvP</div>
    </div>
    <div class="nav-item" id="nav-casas"     onclick="loadModule('casas')">
      <div class="ni-icon">🏠</div>
      <div class="ni-label">Casa</div>
    </div>
    <div class="nav-item" id="nav-guilds"    onclick="loadModule('guilds')">
      <div class="ni-icon">🛡️</div>
      <div class="ni-label">Guild</div>
    </div>
    <div class="nav-sep"></div>
    <div class="nav-item" id="nav-hub"       onclick="loadModule('hub')">
      <div class="ni-icon">🌐</div>
      <div class="ni-label">Hub</div>
    </div>
    <div class="nav-item" id="nav-perfil"    onclick="loadModule('perfil')">
      <div class="ni-icon">👤</div>
      <div class="ni-label">Perfil</div>
    </div>

    <div class="nav-bottom">
      <div class="nav-item" onclick="toggleNotif()">
        <div class="ni-icon">💬</div>
        <div class="ni-label">Chat</div>
      </div>
      <div class="nav-item" onclick="doLogout()">
        <div class="ni-icon">🚪</div>
        <div class="ni-label">Salir</div>
      </div>
    </div>
  </nav>

  <!-- Main area -->
  <div class="game-main">

    <!-- Top HUD -->
    <div class="game-topbar">
      <div class="gtb-char">
        <div class="gtb-perfil" id="gtb-perfil" onclick="loadModule('perfil')" title="Abrir tu perfil y equipamiento"><div class="gtb-avatar" id="gtb-avatar">🧙</div></div>
        <div>
          <div class="gtb-name" id="gtb-name">Cargando...</div>
          <div class="gtb-level" id="gtb-level">Nv.1 · Archimago</div>
        </div>
      </div>
      <div class="gtb-sep"></div>

      <!-- HP bar -->
      <div class="gtb-stat">
        <span style="font-size:12px">❤️</span>
        <div class="gtb-bar-wrap">
          <div class="gtb-bar-label" id="gtb-hp-txt">850/850</div>
          <div class="gtb-bar"><div class="gtb-bar-fill hp" id="gtb-hp" style="width:100%"></div></div>
        </div>
      </div>

      <!-- MP bar -->
      <div class="gtb-stat">
        <span style="font-size:12px">🔷</span>
        <div class="gtb-bar-wrap">
          <div class="gtb-bar-label" id="gtb-mp-txt">400/400</div>
          <div class="gtb-bar"><div class="gtb-bar-fill mp" id="gtb-mp" style="width:100%"></div></div>
        </div>
      </div>

      <!-- XP bar -->
      <div class="gtb-stat">
        <span style="font-size:12px">✨</span>
        <div class="gtb-bar-wrap">
          <div class="gtb-bar-label" id="gtb-xp-txt">0/1000</div>
          <div class="gtb-bar"><div class="gtb-bar-fill xp" id="gtb-xp" style="width:0%"></div></div>
        </div>
      </div>

      <div class="gtb-sep"></div>
      <div class="gtb-currency">🪙 <b id="gtb-gold">500</b></div>
      <div class="gtb-currency">💎 <b id="gtb-crypto">0</b></div>
      <div class="efectos-hud" id="efectos-hud"></div>
      <div class="gtb-zone" id="gtb-zone">🏘️ Pueblo Central</div>
      <div class="online-badge" id="online-badge">conectando…</div>
      <button class="gtb-notif-btn" onclick="toggleNotif()">💬 Chat<span class="chat-unread" id="chat-unread" style="display:none">●</span></button>
      <button class="logout-btn" onclick="doLogout()">Salir</button>
    </div>

    <!-- iframe -->
    <div class="game-frame-area">
      <div class="frame-loading" id="frame-loading">
        <div class="fl-spinner">⚙️</div>
        <div class="fl-label">CARGANDO MÓDULO...</div>
      </div>
      <iframe id="game-iframe" src="" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
    </div>
  </div>

  <!-- Notification / Chat panel -->
  <!-- Primeros pasos: guía opcional, se marca sola -->
  <div class="pp-panel" id="pp-panel">
    <div class="pp-head" onclick="togglePasos()">
      <span class="pp-title">🧭 Primeros pasos</span>
      <span class="pp-count" id="pp-count">0/7</span>
      <span class="pp-toggle" id="pp-toggle">▾</span>
    </div>
    <div class="pp-body" id="pp-body"></div>
  </div>

  <div class="notif-panel" id="notif-panel">
    <div class="np-head">
      Panel Social
      <button class="np-close" onclick="toggleNotif()">✕</button>
    </div>
    <div class="np-tabs">
      <button class="np-tab active" id="npt-chat"  onclick="switchNpTab('chat')">💬 Chat</button>
      <button class="np-tab"        id="npt-feed"  onclick="switchNpTab('feed')">📡 Feed</button>
      <button class="np-tab"        id="npt-rank"  onclick="switchNpTab('rank')">🏆 Ranking</button>
    </div>
    <div class="np-body" id="np-body">
      <div class="chat-area">
        <div class="chat-msgs" id="chat-msgs"></div>
        <div class="chat-input-row">
          <input class="chat-inp" id="chat-inp" placeholder="Escribe un mensaje..." maxlength="200"
            onkeydown="if(event.key==='Enter')sendChat()">
          <button class="chat-send" onclick="sendChat()">↑</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Toast stack -->
<div class="toast-stack" id="toast-stack"></div>

`

// El launcher es la página más larga: se parte en dos módulos para
// que ningún archivo del proyecto sea inmanejable. La segunda parte
// se concatena en index-2.js.
