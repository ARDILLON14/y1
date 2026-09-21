PAGES['index.html'] += `<script>
// ─── CONFIG ───────────────────────────────────────
const API = ''  // same origin
const MODULES = {
  hub:       'criptomundo-hub.html',
  combat:    'criptomundo-combat.html',
  arena:     'criptomundo-arena.html',
  huerto:    'criptomundo-huerto.html',
  crafting:  'criptomundo-crafting.html',
  mercado:   'criptomundo-mercado.html',
  misiones:  'criptomundo-misiones.html',
  mazmorras: 'criptomundo-mazmorras-pvp.html',
  casas:     'criptomundo-casas.html',
  guilds:    'criptomundo-guilds.html',
  mundo2d:   'criptomundo-mundo2d.html',
  perfil:    'criptomundo-perfil.html',
}

// ─── STATE ────────────────────────────────────────
let character = null
let currentModule = null
let notifOpen = false
let npTab = 'chat'
let chatMessages = []
let feedEvents = []
let leaderboard = []
let chatPollTimer = null
let playerPollTimer = null

// ─── LOGIN SCREEN ─────────────────────────────────
function switchTab(tab) {
  document.getElementById('form-login').style.display    = tab==='login'    ? '' : 'none'
  document.getElementById('form-register').style.display = tab==='register' ? '' : 'none'
  document.getElementById('tab-login').classList.toggle('active',    tab==='login')
  document.getElementById('tab-register').classList.toggle('active', tab==='register')
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim()
  const pass  = document.getElementById('login-pass').value
  const errEl = document.getElementById('login-error')
  const btn   = document.getElementById('login-btn')
  errEl.textContent = ''
  if (!email || !pass) { errEl.textContent = 'Completa todos los campos'; return }
  btn.disabled = true; btn.textContent = '⏳ Entrando...'
  try {
    const res  = await fetch(\`\${API}/api/auth/login\`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pass }), credentials:'include',
    })
    const data = await res.json()
    if (!res.ok) { errEl.textContent = data.error || 'Error al iniciar sesión'; return }
    character = data.character
    enterGame()
  } catch {
    errEl.textContent = 'No se puede conectar al servidor'
  } finally {
    btn.disabled = false; btn.textContent = '⚔️ ENTRAR AL MUNDO'
  }
}


// Avatar de la barra: usa la skin elegida en el creador
var SKIN_CACHE = null

// Efectos temporales en la barra superior. Sin esto, beber una poción
// de fuerza no se distingue de no beberla: el jugador no tiene forma
// de saber si sigue activa ni cuánto le queda.
var ICONO_EFECTO = { strength: '💪', agility: '💨', defense: '🛡️', intelligence: '🧠', maxHp: '❤️', maxMp: '🔷' }

function pintarEfectos() {
  var cont = document.getElementById('efectos-hud')
  if (!cont) return
  var lista = (character && character.efectos) || []
  cont.innerHTML = lista.map(function (e) {
    var seg = Math.round(e.restanteMs / 1000)
    var texto = seg >= 60 ? Math.ceil(seg / 60) + 'm' : seg + 's'
    return '<div class="efecto-chip ' + (seg < 30 ? 'acaba' : '') + '" title="' + e.nombre + ' +' + e.valor + '">' +
      (ICONO_EFECTO[e.stat] || '✨') + '<span class="nom">+' + e.valor + '</span> ' + texto + '</div>'
  }).join('')
}

async function renderAvatar() {
  const el = document.getElementById('gtb-avatar')
  if (!el || !character) return
  const skinId = (character.appearance && character.appearance.skinId) || 'aventurero'
  if (!SKIN_CACHE) {
    try { SKIN_CACHE = (await (await fetch(\`\${API}/api/skins\`)).json()).skins } catch { return }
  }
  const skin = SKIN_CACHE.filter(s => s.id === skinId)[0]
  if (!skin) return
  el.innerHTML = (skin.avatar || skin.image) ? \`<img src="\${skin.avatar || skin.image}" alt="">\` : skin.emoji
}
// ═══ CREADOR DE PERSONAJE ═══════════════════════════
// Para añadir opciones nuevas basta con tocar SKINS en el servidor:
// esta pantalla se construye sola a partir de /api/skins.
var CREATOR = { skins: [], skinId: null, className: 'Archimago', palette: {}, paletteKeys: [] }

var CLASS_INFO = {
  Guerrero:  { icon: '⚔️', desc: 'Mucha vida y defensa. El ataque escala con Fuerza. Aguanta los golpes fuertes de los jefes.' },
  Mago:      { icon: '🔮', desc: 'Poco aguante, mucho daño mágico. El ataque escala con Inteligencia y vive de sus hechizos.' },
  Asesino:   { icon: '🗡️', desc: 'Rápido y esquivo. El ataque escala con Agilidad y saca muchos críticos.' },
  Archimago: { icon: '✨', desc: 'Equilibrio entre magia y aguante. Buena opción si es tu primera partida.' },
}

var nameTimer = null

// ─── MODO DE REGISTRO ─────────────────────────────
// El servidor decide si la beta es cerrada. Si lo es, se pide código;
// si viene en el enlace (?invite=...) se rellena solo.
var inviteOnly = false
async function comprobarModoRegistro() {
  try {
    const res = await fetch(\`\${API}/api/auth/mode\`)
    const d = await res.json()
    inviteOnly = !!d.inviteOnly
  } catch {}
  const grupo = document.getElementById('invite-group')
  if (grupo) grupo.style.display = inviteOnly ? '' : 'none'
  const delEnlace = new URLSearchParams(location.search).get('invite')
  if (delEnlace) {
    const campo = document.getElementById('reg-invite')
    if (campo) campo.value = delEnlace.toUpperCase()
    switchTab('register')
  }
}

async function checkName() {
  const el = document.getElementById('reg-username')
  const hint = document.getElementById('name-hint')
  const name = el.value.trim()
  clearTimeout(nameTimer)
  if (name.length < 3) {
    hint.className = 'name-hint'
    hint.textContent = 'Entre 3 y 20 caracteres. Cada nombre es único en el mundo.'
    return
  }
  hint.className = 'name-hint'
  hint.textContent = 'Comprobando disponibilidad...'
  nameTimer = setTimeout(async () => {
    try {
      const res = await fetch(\`\${API}/api/auth/check-name?username=\${encodeURIComponent(name)}\`)
      const d = await res.json()
      if (d.available) { hint.className = 'name-hint ok'; hint.textContent = '✓ "' + name + '" está libre' }
      else { hint.className = 'name-hint bad'; hint.textContent = '✗ ' + (d.reason || 'Ese nombre ya está en uso') }
    } catch { hint.className = 'name-hint'; hint.textContent = '' }
  }, 350)
}

async function openCreator() {
  const username = document.getElementById('reg-username').value.trim()
  const email = document.getElementById('reg-email').value.trim()
  const pass = document.getElementById('reg-pass').value
  const errEl = document.getElementById('reg-error')
  errEl.textContent = ''
  if (!username || !email || !pass) { errEl.textContent = 'Completa todos los campos'; return }
  if (pass.length < 8) { errEl.textContent = 'Contraseña mínimo 8 caracteres'; return }
  if (inviteOnly && !(document.getElementById('reg-invite') || {}).value.trim()) {
    errEl.textContent = 'Hace falta un código de invitación'; return
  }

  try {
    const res = await fetch(\`\${API}/api/auth/check-name?username=\${encodeURIComponent(username)}\`)
    const d = await res.json()
    if (!d.available) { errEl.textContent = d.reason || 'Ese nombre ya está en uso'; return }
  } catch {}

  if (!CREATOR.skins.length) {
    try {
      const res = await fetch(\`\${API}/api/skins\`)
      const d = await res.json()
      CREATOR.skins = d.skins || []
      CREATOR.paletteKeys = d.paletteKeys || ['skin', 'hair', 'outfit', 'accent']
      CREATOR.skinId = d.defaultSkin
    } catch { errEl.textContent = 'No se pueden cargar los aspectos'; return }
  }

  document.getElementById('creator-name').textContent = username
  showScreen('creator')
  pickSkin(CREATOR.skinId, true)
  renderClasses()
  renderSkins()
}

function closeCreator() { showScreen('login') }

function showScreen(which) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  const id = which === 'creator' ? 'screen-creator' : which === 'game' ? 'screen-game' : 'screen-login'
  document.getElementById(id).classList.add('active')
}

function renderClasses() {
  const grid = document.getElementById('class-grid')
  grid.innerHTML = Object.keys(CLASS_INFO).map(k =>
    \`<div class="opt-chip \${CREATOR.className === k ? 'active' : ''}" onclick="pickClass('\${k}')">\${CLASS_INFO[k].icon} \${k}</div>\`
  ).join('')
  document.getElementById('class-desc').textContent = CLASS_INFO[CREATOR.className].desc
}
function pickClass(k) { CREATOR.className = k; renderClasses() }

function renderSkins() {
  const grid = document.getElementById('skin-grid')
  grid.innerHTML = CREATOR.skins.map(s => {
    const art = (s.portrait || s.image) ? \`<img src="\${s.portrait || s.image}" alt="">\` : s.emoji
    return \`<div class="skin-card \${CREATOR.skinId === s.id ? 'active' : ''} \${s.unlocked ? '' : 'locked'}"
      \${s.unlocked ? \`onclick="pickSkin('\${s.id}')"\` : ''}>
      <div class="sc-art">\${art}</div>
      <div class="sc-name">\${s.name}</div>
      \${s.unlocked ? '' : '<div class="sc-lock">🔒 Bloqueado</div>'}
    </div>\`
  }).join('')
}

function pickSkin(id, keepColors) {
  const skin = CREATOR.skins.filter(s => s.id === id)[0]
  if (!skin || !skin.unlocked) return
  CREATOR.skinId = id
  if (!keepColors || !Object.keys(CREATOR.palette).length) CREATOR.palette = Object.assign({}, skin.palette)
  const img = document.getElementById('preview-img')
  const emo = document.getElementById('preview-emoji')
  const anim = document.getElementById('preview-anim')
  // Si la skin trae animación de caminar, se muestra debajo de la
  // ilustración: da idea de cómo se verá en el mapa.
  if (anim) {
    const w = skin.sprites && skin.sprites.walk
    if (w) {
      anim.style.display = ''
      anim.style.backgroundImage = 'url(' + w.url + ')'
      anim.style.width = w.ancho + 'px'
      anim.style.height = w.alto + 'px'
      anim.style.setProperty('--frames', w.frames)
      anim.style.setProperty('--ancho', w.ancho + 'px')
    } else {
      anim.style.display = 'none'
    }
  }
  if (skin.image) { img.src = skin.image; img.style.display = ''; emo.style.display = 'none' }
  else { img.style.display = 'none'; emo.style.display = ''; emo.textContent = skin.emoji }
  document.getElementById('preview-skin-name').textContent = skin.name
  document.getElementById('preview-lore').textContent = skin.lore || ''
  renderSkins()
  renderPalette(skin)
}

var PALETTE_LABEL = { skin: 'Piel', hair: 'Pelo', outfit: 'Ropa', accent: 'Detalle' }
function renderPalette(skin) {
  const sec = document.getElementById('palette-section')
  const row = document.getElementById('palette-row')
  if (!skin.tint) {
    row.innerHTML = '<div class="palette-note">Este aspecto es una ilustración fija: sus colores no se pueden cambiar.</div>'
    return
  }
  row.innerHTML = CREATOR.paletteKeys.map(k =>
    \`<div class="palette-item"><label>\${PALETTE_LABEL[k] || k}</label>
     <input type="color" value="\${CREATOR.palette[k] || skin.palette[k]}" oninput="setColor('\${k}', this.value)"></div>\`
  ).join('')
}
function setColor(k, v) { CREATOR.palette[k] = v }

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim()
  const email = document.getElementById('reg-email').value.trim()
  const pass = document.getElementById('reg-pass').value
  const errEl = document.getElementById('creator-error')
  const btn = document.getElementById('creator-btn')
  errEl.textContent = ''
  btn.disabled = true; btn.textContent = '⏳ Creando personaje...'
  try {
    const res = await fetch(\`\${API}/api/auth/register\`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username, email, password: pass,
        invite: (document.getElementById('reg-invite') || {}).value || '',
        className: CREATOR.className,
        appearance: { skinId: CREATOR.skinId, palette: CREATOR.palette },
      }),
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) { errEl.textContent = data.error || 'Error al registrar'; return }
    character = data.character
    toast(\`🌟 ¡Bienvenido \${character.name}! Personaje creado.\`, 'green')
    enterGame()
  } catch {
    errEl.textContent = 'No se puede conectar al servidor'
  } finally {
    btn.disabled = false; btn.textContent = '⚔️ ENTRAR AL MUNDO'
  }
}


async function doDemo() {
  // Auto-register a demo account
  const rand = Math.floor(Math.random()*9999)
  const body = { username:\`Aventurero\${rand}\`, email:\`demo\${rand}@test.com\`, password:'demo1234' }
  try {
    const res  = await fetch(\`\${API}/api/auth/register\`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body), credentials:'include',
    })
    const data = await res.json()
    if (res.ok) {
      character = data.character
      toast(\`⚡ Demo activo como \${character.name}\`, 'green')
      enterGame()
    } else {
      document.getElementById('login-error').textContent = data.error
    }
  } catch {
    document.getElementById('login-error').textContent = 'Servidor no disponible. Abre los HTML directamente.'
  }
}

async function doLogout() {
  await fetch(\`\${API}/api/auth/logout\`, { method:'POST', credentials:'include' }).catch(()=>{})
  character = null
  currentModule = null
  clearInterval(chatPollTimer)
  clearInterval(playerPollTimer)
  document.getElementById('screen-game').classList.remove('active')
  document.getElementById('screen-login').classList.add('active')
  document.getElementById('game-iframe').src = ''
}

// ─── ENTER GAME ───────────────────────────────────
// Al irse, se manda la última señal: así el tramo de la pantalla en la
// que estaba se cierra y cuenta como el sitio donde lo dejó.
window.addEventListener('pagehide', function () {
  if (window.moduloActual) avisarPantalla(window.moduloActual)
})

function enterGame() {
  document.getElementById('screen-login').classList.remove('active')
  document.getElementById('screen-game').classList.add('active')
  updateHUD()
  loadModule('mundo2d')
  startPolling()
  toast(\`⚔️ ¡Bienvenido a CriptoMundo, \${character.name}!\`, 'green')
  fetchFeed()
  fetchLeaderboard()
  fetchChat()
  cargarPasos()
}


// ─── PRIMEROS PASOS ───────────────────────────────
// La lista la define el servidor y se marca con lo que el jugador ya
// hizo. Aquí no se guarda progreso: solo se pinta y se reclama.
var pasos = null
var pasosCerrado = false

async function cargarPasos() {
  try {
    const res = await fetch(\`\${API}/api/onboarding\`, { credentials: 'include' })
    if (!res.ok) return
    pasos = await res.json()
    renderPasos()
  } catch {}
}

function togglePasos() {
  pasosCerrado = !pasosCerrado
  document.getElementById('pp-panel').classList.toggle('cerrado', pasosCerrado)
  document.getElementById('pp-toggle').textContent = pasosCerrado ? '▸' : '▾'
}

function renderPasos() {
  const panel = document.getElementById('pp-panel')
  if (!panel || !pasos) return
  // Cuando ya no queda nada por hacer ni por cobrar, el panel se va solo.
  if (pasos.completado && pasos.porReclamar === 0) { panel.classList.add('hidden'); return }
  panel.classList.remove('hidden')
  document.getElementById('pp-count').textContent = \`\${pasos.hechos}/\${pasos.total}\`

  const siguiente = pasos.siguiente
  document.getElementById('pp-body').innerHTML = pasos.pasos.map(p => {
    const acciones = []
    if (p.hecho && !p.reclamado) acciones.push(\`<button class="pp-btn claim" onclick="reclamarPaso('\${p.id}')">Cobrar 🪙\${p.oro}</button>\`)
    if (!p.hecho) acciones.push(\`<button class="pp-btn" onclick="loadModule('\${p.modulo}')">Ir</button>\`)
    return \`<div class="pp-step \${p.hecho ? 'hecho' : ''} \${p.id === siguiente ? 'actual' : ''}">
      <div class="pp-mark">\${p.hecho ? '✓' : ''}</div>
      <div class="pp-info">
        <div class="pp-txt">\${escHtml(p.titulo)}</div>
        \${!p.hecho && p.id === siguiente ? \`<div class="pp-hint">\${escHtml(p.pista)}</div>\` : ''}
        \${acciones.length ? \`<div class="pp-actions">\${acciones.join('')}</div>\` : ''}
      </div>
    </div>\`
  }).join('')
}

async function reclamarPaso(id) {
  try {
    const res = await fetch(\`\${API}/api/onboarding/claim\`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'paso-' + id },
      body: JSON.stringify({ id }),
    })
    const d = await res.json()
    if (!res.ok) { toast(d.error || 'No se pudo cobrar', 'red'); return }
    toast(\`🪙 +\${d.oro} de oro\`, 'green')
    pasos = d.resumen
    if (character) character.gold = d.newGold
    updateHUD()
    renderPasos()
  } catch { toast('Error de conexión', 'red') }
}

// ─── HUD UPDATE ───────────────────────────────────
function updateHUD() {
  if (!character) return
  renderAvatar()
  pintarEfectos()
  document.getElementById('gtb-name').textContent    = character.name
  document.getElementById('gtb-level').textContent   = \`Nv.\${character.level} · \${character.class || 'Archimago'}\`
  document.getElementById('gtb-gold').textContent    = (character.gold || 0).toLocaleString()
  document.getElementById('gtb-crypto').textContent  = character.cgrid || 0
  document.getElementById('gtb-hp-txt').textContent  = \`\${character.hp}/\${character.maxHp}\`
  document.getElementById('gtb-mp-txt').textContent  = \`\${character.mp}/\${character.maxMp}\`
  document.getElementById('gtb-xp-txt').textContent  = \`\${character.xp}/\${character.xpToNext}\`
  document.getElementById('gtb-hp').style.width      = (character.hp/character.maxHp*100).toFixed(1)+'%'
  document.getElementById('gtb-mp').style.width      = (character.mp/character.maxMp*100).toFixed(1)+'%'
  document.getElementById('gtb-xp').style.width      = (character.xp/character.xpToNext*100).toFixed(1)+'%'
}

// ─── MODULE LOADING ───────────────────────────────
// Avisar de la pantalla en la que está el jugador. Sin esto no hay
// forma de saber DÓNDE deja de jugar la gente, que es lo primero que
// hay que mirar tras una prueba.
function avisarPantalla(modulo) {
  try {
    fetch(\`\${API}/api/telemetria/pantalla\`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modulo: modulo }),
      keepalive: true,
    }).catch(function () {})
  } catch (e) {}
}

function loadModule(key) {
  window.moduloActual = key
  avisarPantalla(key)
  if (currentModule === key) return
  currentModule = key

  document.querySelectorAll('.nav-item[id^="nav-"]').forEach(n => n.classList.remove('active'))
  const navEl = document.getElementById('nav-' + key)
  if (navEl) navEl.classList.add('active')

  const src = MODULES[key]
  if (!src) return

  document.getElementById('frame-loading').classList.remove('hidden')
  document.getElementById('game-iframe').src = src
}

// Se engancha por codigo y no con onload="" en el HTML.
//
// El iframe nace con src="" y el navegador dispara su onload al
// parsear la etiqueta — antes de que este archivo se haya ejecutado,
// porque la pagina es index.js + index-2.js concatenados. Resultado:
// "onFrameLoad is not defined" en la consola en CADA carga. No rompia
// nada visible, pero un error fijo en consola tapa los que si
// importan: lo encontre midiendo el render, no buscandolo.
//
// El primer disparo (el del src vacio) tampoco queria hacer nada, asi
// que ademas se ignora.
function onFrameLoad() {
  var f = document.getElementById('game-iframe')
  if (!f || !f.src) return
  document.getElementById('frame-loading').classList.add('hidden')
  enfocarJuego()
}
document.addEventListener('DOMContentLoaded', function () {
  var f = document.getElementById('game-iframe')
  if (f) f.addEventListener('load', onFrameLoad)
})

// ─── FOCO Y TECLADO DEL MÓDULO ────────────────────
// El módulo activo vive en un iframe. Si el foco del teclado se queda
// en esta ventana (basta con pulsar el chat o las notificaciones), la
// pantalla de dentro no recibe ni un keydown: en la arena eso se ve
// como un personaje que no anda ni ataca. Se enfoca al cargar y,
// además, se reenvían las teclas por si el foco se vuelve a escapar.
function enfocarJuego() {
  const f = document.getElementById('game-iframe')
  if (!f) return
  try { f.focus() } catch (e) {}
  try { f.contentWindow.focus() } catch (e) {}
}

const TECLAS_JUEGO = {
  w: 1, a: 1, s: 1, d: 1, q: 1, e: 1, r: 1, ' ': 1, shift: 1,
  arrowup: 1, arrowleft: 1, arrowdown: 1, arrowright: 1,
}
function escribiendoEnUnCampo(e) {
  const t = e.target
  if (!t) return false
  const n = (t.tagName || '').toLowerCase()
  return n === 'input' || n === 'textarea' || n === 'select' || t.isContentEditable
}
function reenviarTecla(e, abajo) {
  if (escribiendoEnUnCampo(e)) return
  if (!TECLAS_JUEGO[String(e.key).toLowerCase()]) return
  const f = document.getElementById('game-iframe')
  if (!f || !f.src || !f.contentWindow) return
  if (String(e.key) === ' ') e.preventDefault()
  try {
    f.contentWindow.postMessage({ type: 'TECLA', key: e.key, abajo: abajo }, '*')
  } catch (err) {}
}
window.addEventListener('keydown', function (e) { reenviarTecla(e, true) })
window.addEventListener('keyup', function (e) { reenviarTecla(e, false) })
// Volver a enfocar en cuanto se toca la zona del juego
document.addEventListener('pointerdown', function (e) {
  const zona = document.getElementById('game-iframe')
  if (zona && e.target === zona) enfocarJuego()
})

// ─── POLLING ──────────────────────────────────────
function startPolling() {
  // Refresh player every 10s and push to active iframe
  playerPollTimer = setInterval(async () => {
    try {
      const res  = await fetch(\`\${API}/api/player\`, { credentials:'include' })
      if (res.ok) {
        const data = await res.json()
        character = data.character
        updateHUD()
        // Push fresh character data to the active module
        const iframe = document.getElementById('game-iframe')
        try { iframe.contentWindow?.postMessage({ type: 'CHARACTER_DATA', data: { character } }, '*') } catch {}
        cargarPasos()
      }
    } catch {}
  }, 10000)

  // El chat ya no se sondea: llega por WebSocket. El sondeo queda
  // solo como red de seguridad si el socket no llega a abrirse.
  connectRealtime()
}

// ─── SOCIAL PANEL ─────────────────────────────────
function toggleNotif() {
  notifOpen = !notifOpen
  document.getElementById('notif-panel').classList.toggle('open', notifOpen)
  if (notifOpen) { const b = document.getElementById('chat-unread'); if (b) b.style.display = 'none' }
  if (notifOpen) renderNpTab()
}

function switchNpTab(tab) {
  npTab = tab
  document.querySelectorAll('.np-tab').forEach(t => t.classList.remove('active'))
  document.getElementById('npt-' + tab)?.classList.add('active')
  renderNpTab()
}

function renderNpTab() {
  const body = document.getElementById('np-body')
  if (npTab === 'chat') {
    body.innerHTML = \`
      <div class="chat-area" style="height:100%">
        <div class="chat-msgs" id="chat-msgs" style="flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:3px;"></div>
        <div class="chat-input-row">
          <input class="chat-inp" id="chat-inp" placeholder="Escribe un mensaje..." maxlength="200"
            onkeydown="if(event.key==='Enter')sendChat()">
          <button class="chat-send" onclick="sendChat()">↑</button>
        </div>
      </div>\`
    renderChatMessages()
  } else if (npTab === 'feed') {
    body.innerHTML = '<div id="feed-body">' + feedEvents.map(e => \`
      <div class="feed-entry">
        <div class="fe-icon">\${typeIcon(e.type)}</div>
        <div class="fe-msg">\${e.message}</div>
        <div class="fe-time">\${timeAgo(e.createdAt)}</div>
      </div>\`).join('') + '</div>'
  } else if (npTab === 'rank') {
    body.innerHTML = leaderboard.map((p,i) => \`
      <div class="lb-row">
        <div class="lbr-rank" style="color:\${i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--dim)'}">\${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
        <div class="lbr-name">\${p.name} \${p.name===character?.name?'<span style="color:var(--gold);font-size:10px">(tú)</span>':''}</div>
        <div>
          <div class="lbr-stat">Nv.\${p.level}</div>
          <div style="font-size:10px;color:var(--dim)">☠️\${p.monstersKilled}</div>
        </div>
      </div>\`).join('')
  }
}

function renderChatMessages() {
  const el = document.getElementById('chat-msgs')
  if (!el) return
  el.innerHTML = chatMessages.map(m => \`
    <div class="chat-msg">
      <span class="cm-name" style="color:\${m.username===character?.name?'var(--gold)':'var(--blue)'}">
        [\${m.level}] \${m.username}:
      </span>
      <span class="cm-text"> \${escHtml(m.message)}</span>
    </div>\`).join('')
  el.scrollTop = el.scrollHeight
}

async function sendChat() {
  const inp = document.getElementById('chat-inp')
  if (!inp || !inp.value.trim()) return
  const msg = inp.value.trim()
  inp.value = ''
  // Por socket si está abierto; si no, por HTTP como antes.
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'chat', message: msg, channel: 'global' }))
    return
  }
  try {
    await fetch(\`\${API}/api/chat\`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg, channel:'global' }), credentials:'include',
    })
    await fetchChat()
  } catch {}
}


// ─── TIEMPO REAL (WebSocket) ──────────────────────
// Se reconecta solo con espera creciente. Si nunca llega a conectar
// (proxy que no admite WebSocket), se vuelve al sondeo de siempre.
var ws = null
var wsRetry = 0
var wsFallback = null
var onlinePlayers = []

function connectRealtime() {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return
  let sock
  try {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    sock = new WebSocket(proto + '//' + location.host + '/ws')
  } catch { startChatFallback(); return }
  ws = sock

  sock.onopen = () => {
    wsRetry = 0
    if (wsFallback) { clearInterval(wsFallback); wsFallback = null }
    setOnlineBadge('conectado')
  }

  sock.onmessage = (ev) => {
    let d
    try { d = JSON.parse(ev.data) } catch { return }
    if (d.type === 'hello') {
      chatMessages = d.messages || []
      if (notifOpen && npTab === 'chat') renderChatMessages()
    } else if (d.type === 'chat' && d.message) {
      chatMessages.push(d.message)
      if (chatMessages.length > 200) chatMessages.shift()
      if (notifOpen && npTab === 'chat') renderChatMessages()
      else if (d.message.username !== (character && character.name)) markChatUnread()
    } else if (d.type === 'presence') {
      onlinePlayers = d.online || []
      setOnlineBadge(onlinePlayers.length + ' en línea')
    } else if (d.type === 'error') {
      toast(d.error, 'red')
    }
  }

  sock.onclose = () => {
    ws = null
    setOnlineBadge('desconectado')
    wsRetry++
    if (wsRetry > 5) { startChatFallback(); return }
    setTimeout(connectRealtime, Math.min(15000, 1000 * Math.pow(2, wsRetry)))
  }
  sock.onerror = () => { try { sock.close() } catch {} }
}

function startChatFallback() {
  if (wsFallback) return
  setOnlineBadge('modo sondeo')
  wsFallback = setInterval(fetchChat, 5000)
  fetchChat()
}

function setOnlineBadge(text) {
  const el = document.getElementById('online-badge')
  if (el) el.textContent = text
}

function markChatUnread() {
  const b = document.getElementById('chat-unread')
  if (b) b.style.display = ''
}

async function fetchChat() {
  try {
    const res  = await fetch(\`\${API}/api/chat\`, { credentials:'include' })
    if (res.ok) {
      const data = await res.json()
      chatMessages = data.messages || []
      if (notifOpen && npTab === 'chat') renderChatMessages()
    }
  } catch {}
}

async function fetchFeed() {
  try {
    const res  = await fetch(\`\${API}/api/player/feed\`, { credentials:'include' })
    if (res.ok) {
      const data = await res.json()
      feedEvents = data.events || []
    }
  } catch {}
}

async function fetchLeaderboard() {
  try {
    const res  = await fetch(\`\${API}/api/leaderboard\`, { credentials:'include' })
    if (res.ok) {
      const data = await res.json()
      leaderboard = data.leaderboard || []
    }
  } catch {}
}

// ─── SERVER STATUS ────────────────────────────────
async function checkServer() {
  try {
    const res = await fetch(\`\${API}/api/player/feed\`)
    const online = res.status !== 0
    document.getElementById('status-dot').className  = 'status-dot online'
    document.getElementById('status-text').textContent = 'Servidor activo — localhost:3000'
  } catch {
    document.getElementById('status-dot').className  = 'status-dot offline'
    document.getElementById('status-text').textContent = 'Servidor offline — ejecuta: node server.js'
  }
}

// ─── STARS BACKGROUND ─────────────────────────────
function initStars() {
  const bg = document.getElementById('login-bg')
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div')
    const size = Math.random() * 2 + 1
    s.className = 'login-star'
    s.style.cssText = \`
      width:\${size}px; height:\${size}px;
      left:\${Math.random()*100}vw; top:\${Math.random()*100}vh;
      animation-duration:\${2+Math.random()*4}s;
      animation-delay:\${Math.random()*4}s;
    \`
    bg.appendChild(s)
  }
}

// ─── TOAST ────────────────────────────────────────
function toast(msg, type='') {
  const stack = document.getElementById('toast-stack')
  const el = document.createElement('div')
  el.className = \`t-item \${type}\`
  el.textContent = msg
  el.onclick = () => el.remove()
  stack.appendChild(el)
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')))
  setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(),350) }, 4000)
}

// ─── UTILS ────────────────────────────────────────
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function typeIcon(t) {
  return {combat:'⚔️',market:'🏪',quest:'📜',dungeon:'🏰',craft:'⚒️',pvp:'🥊',loot:'💎',blockchain:'💎',system:'📡'}[t] || '🔔'
}
function timeAgo(ts) {
  const d = Math.floor((Date.now()-new Date(ts).getTime())/1000)
  if (d<60) return d+'s'
  if (d<3600) return Math.floor(d/60)+'m'
  return Math.floor(d/3600)+'h'
}

// ─── IFRAME BRIDGE ────────────────────────────────
window.addEventListener('message', async (event) => {
  if (event.origin !== window.location.origin && event.origin !== '') return
  const { type, payload } = event.data || {}
  const iframe = document.getElementById('game-iframe')

  function sendToFrame(data) {
    try { iframe.contentWindow?.postMessage(data, '*') } catch {}
  }

  // Helper: refresh character from API then send to frame and update HUD
  async function refreshCharacter() {
    try {
      const res  = await fetch(\`\${API}/api/player\`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        character  = data.character
        updateHUD()
      }
    } catch {}
  }

  switch (type) {

    case 'GET_CHARACTER': {
      if (character) {
        sendToFrame({ type: 'CHARACTER_DATA', data: { character } })
      } else {
        await refreshCharacter()
        sendToFrame({ type: 'CHARACTER_DATA', data: { character } })
      }
      break
    }

    case 'COMBAT_ACTION': {
      const { monsterId, action, monsterCurrentHp } = payload || {}
      try {
        const res  = await fetch(\`\${API}/api/combat/action\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monsterId, action, monsterCurrentHp }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'COMBAT_RESULT', data })
        // Update local character state
        if (data.newHp !== undefined && character) {
          character.hp   = data.newHp
          character.mp   = data.newMp ?? character.mp
          if (data.goldEarned) character.gold += data.goldEarned
          if (data.xpEarned)   character.xp   += data.xpEarned
          if (data.newLevel)   { character.level = data.newLevel; character.xpToNext = data.newXpToNext }
          if (data.levelUps?.length) {
            data.levelUps.forEach(lu => toast(\`🎉 ¡NIVEL \${lu.level}! +HP +MP +Atributos\`, 'gold'))
            character.maxHp = data.levelUps[data.levelUps.length-1].maxHp ?? character.maxHp
            character.maxMp = data.levelUps[data.levelUps.length-1].maxMp ?? character.maxMp
          }
          updateHUD()
        }
      } catch (e) {
        sendToFrame({ type: 'COMBAT_RESULT', error: e.message })
      }
      break
    }

    case 'QUEST_ACTION': {
      const { questId, action, objectiveKey, increment } = payload || {}
      try {
        const res  = await fetch(\`\${API}/api/quests\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questId, action, objectiveKey, increment }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'QUEST_RESULT', data })
        if (data.rewards && character) {
          character.gold  += data.rewards.gold  || 0
          character.xp    += data.rewards.xp    || 0
          character.cgrid += data.rewards.cgrid || 0
          if (data.newLevel) character.level = data.newLevel
          if (data.levelUps?.length) data.levelUps.forEach(lu => toast(\`🎉 ¡NIVEL \${lu.level}! ¡Subiste de nivel!\`, 'gold'))
          updateHUD()
        }
      } catch (e) {
        sendToFrame({ type: 'QUEST_RESULT', error: e.message })
      }
      break
    }

    case 'CRAFT_ACTION': {
      const { recipeId, quantity } = payload || {}
      try {
        const res  = await fetch(\`\${API}/api/crafting\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipeId, quantity: quantity || 1 }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'CRAFT_RESULT', data })
        if (data.success) await refreshCharacter()
      } catch (e) {
        sendToFrame({ type: 'CRAFT_RESULT', error: e.message })
      }
      break
    }

    // El puente de mazmorras se retiró en la v25: la pantalla nueva
    // habla directamente con /api/mazmorra y no necesita intermediario.
    case 'MARKET_BUY': {
      const { listingId, quantity } = payload || {}
      try {
        const res  = await fetch(\`\${API}/api/market/\${listingId}/buy\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: quantity || 1 }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'MARKET_RESULT', data })
        if (data.success && character) {
          character.gold -= data.totalCost || 0
          updateHUD()
        }
      } catch (e) {
        sendToFrame({ type: 'MARKET_RESULT', error: e.message })
      }
      break
    }

    case 'ZONE_CHANGE': {
      // Zone changes are informational — log to feed
      const { zone } = payload || {}
      if (zone) {
        feedEvents.unshift({
          id: 'z' + Date.now(),
          type: 'system',
          message: \`\${character?.name || 'Jugador'} entró a la zona: \${zone}\`,
          createdAt: new Date().toISOString(),
        })
      }
      sendToFrame({ type: 'ZONE_ACK', data: { zone } })
      break
    }

    case 'REFRESH': {
      await refreshCharacter()
      sendToFrame({ type: 'CHARACTER_DATA', data: { character } })
      break
    }

    case 'TOAST': {
      const { message, toastType } = payload || {}
      if (message) toast(message, toastType || '')
      break
    }

    case 'GUILD_ACTION': {
      const { action, guildId, guildName, name, emblem, description, amount } = payload || {}
      try {
        const res = await fetch(\`\${API}/api/guilds\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, guildId, name, emblem, description, amount }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'GUILD_RESULT', data })
        if (data.success && character) {
          if (action === 'join')   { character.guildId = guildId; character.guildName = guildName; toast(\`🛡️ Unido a \${guildName}\`, 'green') }
          if (action === 'leave')  { character.guildId = null; character.guildName = null }
          if (action === 'create') { character.guildId = data.guild?.id; character.guildName = name; toast(\`🛡️ Guild "\${name}" creada\`, 'green') }
        }
      } catch (e) {
        sendToFrame({ type: 'GUILD_RESULT', error: e.message })
      }
      break
    }

    case 'HOUSE_ACTION': {
      const { action, placed, furnitureId, cost } = payload || {}
      try {
        const res = await fetch(\`\${API}/api/house\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, placed, furnitureId, cost }),
          credentials: 'include',
        })
        const data = await res.json()
        sendToFrame({ type: 'HOUSE_RESULT', data })
        if (data.success && character && data.newGold !== undefined) {
          character.gold = data.newGold
          updateHUD()
        }
      } catch (e) {
        sendToFrame({ type: 'HOUSE_RESULT', error: e.message })
      }
      break
    }

    case 'LOOT_RARE': {
      const { itemName, rarity } = payload || {}
      const rarityColors = { epic:'#A335EE', legendary:'#FF8000' }
      const col = rarityColors[rarity?.toLowerCase()] || '#C8A84B'
      toast(\`💎 \${character?.name || 'Jugador'} obtuvo: \${itemName} (\${rarity})\`, 'gold')
      feedEvents.unshift({
        id: 'lr' + Date.now(),
        type: 'loot',
        message: \`\${character?.name || 'Jugador'} obtuvo \${itemName} (\${rarity?.toUpperCase()})\`,
        createdAt: new Date().toISOString(),
      })
      break
    }
  }
})

// ─── INIT ─────────────────────────────────────────
initStars()
checkServer()
comprobarModoRegistro()

// Enter on input
document.addEventListener('keydown', e => {
  if (e.key==='Enter') {
    if (document.getElementById('form-login').style.display !== 'none') doLogin()
    else doRegister()
  }
})
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
