// ═══════════════════════════════════════════════════════════════════
//  NÚCLEO DEL SERVIDOR v3 — SERVER-AUTHORITATIVE
//  Historial de cambios: CHANGELOG.md
//  - Contraseñas con scrypt + salt (nunca texto plano)
//  - Sesiones con crypto.randomBytes, expiración y rotación
//  - CORS cerrado (mismo origen), cabeceras de seguridad
//  - Rate limiting por IP y por acción
//  - Combate / mazmorras / misiones / PvP calculados en el servidor
//  - Mercado con escrow, ownership, comisión y compra atómica
//  - Ledger de CGRID con emisión limitada y auditoría
//  - Persistencia en disco (JSON) como puente hacia PostgreSQL
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto')
const fs     = require('fs')
const path   = require('path')

const NODE_ENV   = process.env.NODE_ENV || 'development'
const IS_PROD    = NODE_ENV === 'production'
const DATA_FILE  = process.env.DATA_FILE || path.join(__dirname, 'criptomundo-data.json')
const ASSETS_DIR = process.env.ASSETS_DIR || path.join(__dirname, 'assets')
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
const MAX_BODY   = 32 * 1024          // 32 KB por petición
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000
// Cuentas nuevas por hora y por IP. Súbelo si tus jugadores comparten red
// (una oficina, una clase, una red móvil detrás de NAT).
const REGISTER_LIMIT_PER_HOUR = Number(process.env.REGISTER_LIMIT_PER_HOUR || 20)
// Peticiones por minuto y por sesión (o por IP si no hay sesión).
const REQUEST_LIMIT_PER_MINUTE = Number(process.env.REQUEST_LIMIT_PER_MINUTE || 300)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
}

// ── Almacén ────────────────────────────────────────────────────────
const store = {
  players: {},            // username → player
  emailIndex: {},         // email → username
  nameIndex: {},          // nombre en minúsculas → username (nombres únicos sin distinguir mayúsculas)
  sessions: {},           // token → { username, expiresAt, createdAt }
  battles: {},            // battleId → BattleSession
  dungeonRuns: {},        // runId → DungeonRun
  pvpMatches: {},         // matchId → PvpMatch
  marketListings: [],     // listings ACTIVE/SOLD/CANCELLED (con escrow)
  marketTransactions: [],
  guilds: {},
  chatMessages: [],
  auditLog: [],
  idempotency: {},        // key → { at, response }
  economy: { day: today(), cgridEmitted: 0, cgridBurned: 0, goldBurned: 0 },
  seq: 0,
}

function today() { return new Date().toISOString().slice(0, 10) }
function nextId(prefix) { store.seq += 1; return `${prefix}_${Date.now().toString(36)}${store.seq.toString(36)}` }
function now() { return Date.now() }

// ── Persistencia ───────────────────────────────────────────────────
// Reglas de esta capa:
//   1. Nunca se escribe directamente sobre el archivo bueno: se escribe
//      un temporal y se renombra. Un corte de luz a mitad de escritura
//      dejaba antes un JSON truncado e ilegible.
//   2. Antes de sobreescribir se guarda una copia rotada en backups/.
//   3. Si el archivo principal está corrupto, al arrancar se prueba con
//      la copia más reciente en lugar de empezar de cero.
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DATA_FILE), 'backups')
const BACKUP_KEEP = Number(process.env.BACKUP_KEEP || 12)
const BACKUP_EVERY_MS = Number(process.env.BACKUP_EVERY_MS || 30 * 60 * 1000)
let lastBackup = 0

function snapshotOf() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    players: store.players, emailIndex: store.emailIndex, nameIndex: store.nameIndex,
    marketListings: store.marketListings, marketTransactions: store.marketTransactions.slice(-2000),
    guilds: store.guilds, economy: store.economy, invites: store.invites,
    feedback: store.feedback,
    auditLog: store.auditLog.slice(-5000), seq: store.seq, analytics: store.analytics,
  }
}

function writeSnapshot(data) {
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data), 'utf8')
  fs.renameSync(tmp, DATA_FILE)   // atómico en el mismo sistema de archivos
}

function rotateBackup(force) {
  try {
    if (!fs.existsSync(DATA_FILE)) return
    if (!force && now() - lastBackup < BACKUP_EVERY_MS) return
    lastBackup = now()
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, `criptomundo-${stamp}.json`))
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('criptomundo-')).sort()
    for (const old of files.slice(0, Math.max(0, files.length - BACKUP_KEEP))) {
      fs.unlinkSync(path.join(BACKUP_DIR, old))
    }
  } catch (e) { console.error('[backup]', e.message) }
}

let saveTimer = null
function persist() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      rotateBackup()
      writeSnapshot(snapshotOf())
    } catch (e) { console.error('[persist]', e.message) }
  }, 1500)
}

function readSnapshotFile(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!d || typeof d !== 'object' || typeof d.players !== 'object') throw new Error('estructura inesperada')
  return d
}

function applySnapshot(d) {
  Object.assign(store, {
    players: d.players || {}, emailIndex: d.emailIndex || {},
    nameIndex: d.nameIndex || Object.fromEntries(Object.keys(d.players || {}).map(u => [u.toLowerCase(), u])),
    marketListings: d.marketListings || [], marketTransactions: d.marketTransactions || [],
    guilds: d.guilds || {}, economy: d.economy || store.economy,
    invites: d.invites || store.invites || {},
    feedback: d.feedback || store.feedback || [],
    auditLog: d.auditLog || [], seq: d.seq || 0,
    analytics: (d.analytics && d.analytics.users) ? d.analytics : store.analytics,
  })
}

function loadSnapshot() {
  if (!fs.existsSync(DATA_FILE)) return false
  try {
    applySnapshot(readSnapshotFile(DATA_FILE))
    // Copia del estado con el que arranca la sesión: si algo sale mal
    // hoy, siempre queda el punto de partida de esta ejecución.
    rotateBackup(true)
    return true
  } catch (e) {
    console.error(`[load] ${DATA_FILE} ilegible (${e.message}). Buscando copia de seguridad…`)
  }
  // El archivo principal está roto: se intenta con las copias, de la más
  // reciente a la más antigua, y se aparta el archivo dañado sin borrarlo.
  try {
    const files = fs.existsSync(BACKUP_DIR)
      ? fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('criptomundo-')).sort().reverse()
      : []
    for (const f of files) {
      try {
        applySnapshot(readSnapshotFile(path.join(BACKUP_DIR, f)))
        fs.renameSync(DATA_FILE, DATA_FILE + '.corrupto-' + Date.now())
        console.error(`[load] Recuperado desde backups/${f}. El archivo dañado se guardó con sufijo .corrupto-…`)
        return true
      } catch {}
    }
  } catch (e) { console.error('[load] no se pudo leer backups:', e.message) }
  console.error('[load] No hay ninguna copia utilizable. Se arranca vacío; el archivo dañado NO se ha borrado.')
  return false
}

// ── Auditoría ──────────────────────────────────────────────────────
function audit(type, actor, data) {
  store.auditLog.push({ id: nextId('aud'), type, actor: actor || 'system', data, at: new Date().toISOString() })
  if (store.auditLog.length > 20000) store.auditLog.splice(0, 10000)
  persist()
}

// ── Contraseñas: scrypt + salt (sustituye texto plano) ─────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')
  return { algo: 'scrypt', N: 16384, salt, hash }
}
function verifyPassword(password, rec) {
  if (!rec || !rec.salt || !rec.hash) return false
  const hash = crypto.scryptSync(password, rec.salt, 64, { N: rec.N || 16384, r: 8, p: 1 })
  const stored = Buffer.from(rec.hash, 'hex')
  return stored.length === hash.length && crypto.timingSafeEqual(stored, hash)
}

// ── Sesiones ───────────────────────────────────────────────────────
function genToken() { return crypto.randomBytes(32).toString('base64url') }
function createSession(username) {
  const token = genToken()
  store.sessions[token] = { username, createdAt: now(), expiresAt: now() + SESSION_TTL_MS }
  return token
}
// En producción la cookie lleva `Secure`, así que el navegador SOLO la
// envía por HTTPS. Si alguien despliega con NODE_ENV=production y sin
// TLS por delante, el registro parece funcionar y a partir de ahí todo
// responde "no autorizado": el síntoma no se parece en nada a la causa.
// Por eso se avisa en cuanto se detecta, una sola vez.
let avisadoSinTls = false
function sessionCookie(token, req) {
  const parts = [`cm_token=${token}`, 'Path=/', `Max-Age=${SESSION_TTL_MS / 1000}`, 'HttpOnly', 'SameSite=Strict']
  if (IS_PROD) {
    parts.push('Secure')
    if (!avisadoSinTls && !peticionSegura(req)) {
      avisadoSinTls = true
      console.error('\n' + '!'.repeat(58))
      console.error('  AVISO: NODE_ENV=production sirve la cookie de sesión con')
      console.error('  Secure, pero esta petición ha llegado por HTTP sin cifrar.')
      console.error('  Los navegadores descartarán la sesión y los jugadores no')
      console.error('  podrán entrar. Pon HTTPS por delante (nginx, Caddy,')
      console.error('  Cloudflare) o arranca sin NODE_ENV=production para probar.')
      console.error('!'.repeat(58) + '\n')
    }
  }
  return parts.join('; ')
}

// Detrás de un proxy TLS la petición llega en claro al proceso, pero el
// proxy lo indica con esta cabecera.
function peticionSegura(req) {
  if (!req) return true
  if (req.socket && req.socket.encrypted) return true
  const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim()
  return proto === 'https'
}
function getToken(req) {
  const cookie = req.headers.cookie || ''
  const m = cookie.match(/cm_token=([^;]+)/)
  if (m) return m[1]
  const auth = req.headers.authorization || ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : ''
}
function getPlayer(req) {
  const token = getToken(req)
  if (!token) return null
  const s = store.sessions[token]
  if (!s) return null
  if (s.expiresAt < now()) { delete store.sessions[token]; return null }
  return store.players[s.username] || null
}
function sweepSessions() {
  const t = now()
  for (const [k, s] of Object.entries(store.sessions)) if (s.expiresAt < t) delete store.sessions[k]
  for (const [k, b] of Object.entries(store.battles)) if (b.updatedAt < t - 30 * 60 * 1000) delete store.battles[k]
  for (const [k, r] of Object.entries(store.dungeonRuns)) if (r.startedAt < t - 6 * 3600 * 1000) delete store.dungeonRuns[k]
  for (const [k, v] of Object.entries(store.idempotency)) if (v.at < t - 3600 * 1000) delete store.idempotency[k]

  // Contadores de rate limiting: cada IP y cada acción crea una entrada.
  // Antes se limpiaban con una comprobación suelta que solo se evaluaba
  // al arrancar el proceso, así que en la práctica NUNCA se limpiaban y
  // el mapa crecía sin techo mientras el servidor estuviera vivo.
  for (const [k, b] of buckets) if (b.reset < t) buckets.delete(k)
}
setInterval(sweepSessions, 5 * 60 * 1000).unref?.()

// ── Rate limiting ──────────────────────────────────────────────────
const buckets = new Map()
function rateLimit(key, limit, windowMs) {
  const t = now()
  let b = buckets.get(key)
  if (!b || b.reset < t) { b = { count: 0, reset: t + windowMs }; buckets.set(key, b) }
  b.count += 1
  return b.count <= limit
}
function clientIp(req) {
  return (req.socket.remoteAddress || 'unknown')
}

// ── Validación de entrada ──────────────────────────────────────────
function isStr(v, min = 1, max = 64) { return typeof v === 'string' && v.length >= min && v.length <= max }
function intIn(v, min, max, def = null) {
  const n = Number(v)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return def
  if (n < min || n > max) return def
  return n
}
function sanitize(s) {
  return String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]))
}
const USERNAME_RE = /^[a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]{3,20}$/
// Nombres únicos: dos jugadores no pueden llamarse igual ni cambiando mayúsculas
function nameTaken(name) {
  const k = String(name).toLowerCase()
  return !!(store.nameIndex && store.nameIndex[k]) || !!store.players[name]
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// ── Utilidades HTTP ────────────────────────────────────────────────
function json(res, data, status = 200, headers = {}) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers))
  res.end(JSON.stringify(data))
}
function fail(res, msg, status = 400) { return json(res, { error: msg }, status) }

function readBody(req, limite) {
  const tope = limite || MAX_BODY
  return new Promise((resolve, reject) => {
    let body = '', size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > tope) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); return }
      body += chunk
    })
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) } })
    req.on('error', reject)
  })
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
}

// ── Economía: CGRID con emisión limitada + sinks ────────────────────
const ECONOMY = {
  CGRID_DAILY_GLOBAL_CAP: 500,     // emisión máxima diaria del servidor
  CGRID_DAILY_PLAYER_CAP: 15,      // emisión máxima diaria por jugador
  MARKET_FEE: 0.05,                // 5% de comisión (sink de oro)
  DEATH_GOLD_PENALTY: 0.08,
}
function rollDay() {
  if (store.economy.day !== today()) {
    store.economy = { day: today(), cgridEmitted: 0, cgridBurned: 0, goldBurned: 0 }
  }
}
function creditCgrid(char, amount, reason) {
  rollDay()
  const amt = Math.max(0, Math.floor(amount))
  if (!amt) return 0
  if (char.cgridDay !== today()) { char.cgridDay = today(); char.cgridToday = 0 }
  const playerRoom = Math.max(0, ECONOMY.CGRID_DAILY_PLAYER_CAP - (char.cgridToday || 0))
  const globalRoom = Math.max(0, ECONOMY.CGRID_DAILY_GLOBAL_CAP - store.economy.cgridEmitted)
  const granted = Math.min(amt, playerRoom, globalRoom)
  if (granted > 0) {
    char.cgrid = (char.cgrid || 0) + granted
    char.cgridToday = (char.cgridToday || 0) + granted
    store.economy.cgridEmitted += granted
    audit('cgrid_mint', char.name, { amount: granted, requested: amt, reason })
    trackCurrency(char.name, 'cgrid', granted, reason)
  }
  return granted
}
function burnGold(char, amount, reason) {
  const amt = Math.max(0, Math.floor(amount))
  if (char.gold < amt) return false
  char.gold -= amt
  store.economy.goldBurned += amt
  audit('gold_sink', char.name, { amount: amt, reason })
  trackCurrency(char.name, 'gold', -amt, reason)
  return true
}
