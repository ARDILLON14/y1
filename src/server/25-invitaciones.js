
// ═══════════════════════════════════════════════════════════════════
//  INVITACIONES (beta cerrada)
//
//  Para qué: cuando el juego esté en internet vas a querer meter a diez
//  personas concretas, no a quien pase por ahí. Con INVITE_ONLY=1 el
//  registro exige un código; sin esa variable todo funciona como antes
//  y esto no molesta.
//
//  Además sirve para saber QUIÉN es cada quien en la analítica: cada
//  código lleva una etiqueta ("discord", "amigos", "reddit") y queda
//  registrada en el jugador, así se puede ver qué grupo se queda y
//  cuál se va.
//
//  Uso:
//    INVITE_ONLY=1 ADMIN_TOKEN=... node criptomundo.js
//    node invitaciones.js crear 10 --etiqueta=discord
// ═══════════════════════════════════════════════════════════════════
const INVITE_ONLY = process.env.INVITE_ONLY === '1'

store.invites = store.invites || {}   // código → { etiqueta, usos, maxUsos, creadoEn, usadoPor[] }

// Sin caracteres que se confundan al dictarlos por voz o chat (0/O, 1/I).
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo() {
  const bytes = crypto.randomBytes(10)
  let out = ''
  for (let i = 0; i < 10; i++) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length]
    if (i === 4) out += '-'
  }
  return out
}

function crearInvitaciones(cantidad, etiqueta, maxUsos) {
  const n = Math.max(1, Math.min(200, Math.floor(cantidad) || 1))
  const usos = Math.max(1, Math.min(500, Math.floor(maxUsos) || 1))
  const tag = String(etiqueta || 'general').slice(0, 32).replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]/g, '')
  const creados = []
  for (let i = 0; i < n; i++) {
    let codigo
    do { codigo = generarCodigo() } while (store.invites[codigo])
    store.invites[codigo] = { etiqueta: tag, usos: 0, maxUsos: usos, creadoEn: new Date().toISOString(), usadoPor: [] }
    creados.push(codigo)
  }
  audit('invites_create', 'admin', { cantidad: n, etiqueta: tag, maxUsos: usos })
  persist()
  return creados
}

function invitacionValida(codigo) {
  const inv = store.invites[String(codigo || '').trim().toUpperCase()]
  if (!inv) return { ok: false, error: 'Código de invitación no válido' }
  if (inv.usos >= inv.maxUsos) return { ok: false, error: 'Ese código ya se ha usado' }
  return { ok: true, inv }
}

function consumirInvitacion(codigo, username) {
  const key = String(codigo || '').trim().toUpperCase()
  const inv = store.invites[key]
  if (!inv) return null
  inv.usos += 1
  inv.usadoPor.push({ username, en: new Date().toISOString() })
  audit('invite_used', username, { codigo: key, etiqueta: inv.etiqueta })
  return inv
}

function resumenInvitaciones() {
  const lista = Object.entries(store.invites).map(([codigo, i]) => ({
    codigo, etiqueta: i.etiqueta, usos: i.usos, maxUsos: i.maxUsos,
    creadoEn: i.creadoEn, usadoPor: i.usadoPor.map(u => u.username),
  }))
  const porEtiqueta = {}
  for (const i of lista) {
    porEtiqueta[i.etiqueta] = porEtiqueta[i.etiqueta] || { emitidos: 0, usados: 0 }
    porEtiqueta[i.etiqueta].emitidos += 1
    if (i.usos > 0) porEtiqueta[i.etiqueta].usados += 1
  }
  return {
    inviteOnly: INVITE_ONLY,
    total: lista.length,
    usados: lista.filter(i => i.usos > 0).length,
    libres: lista.filter(i => i.usos < i.maxUsos).length,
    porEtiqueta,
    invitaciones: lista.sort((a, b) => a.creadoEn < b.creadoEn ? 1 : -1),
  }
}
