
// ═══════════════════════════════════════════════════════════════════
//  TELEMETRÍA — retención, embudo, abandono y curva de economía
//  Objetivo: no construir a ciegas. Todo lo que se mide aquí sirve
//  para decidir qué de la checklist merece la pena construir.
// ═══════════════════════════════════════════════════════════════════
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''

store.analytics = (store.analytics && store.analytics.users) ? store.analytics : {
  users: {},     // username → { firstSeen, lastSeen, activeDays[], sessions, playMinutes, steps{}, lastStep }
  daily: {},     // YYYY-MM-DD → { newUsers, activeUsers[], events{}, goldFaucet, goldSink, cgridMint, sessions, playMinutes }
  funnel: {},    // paso → nº de usuarios distintos que lo alcanzaron
  dropoff: {},   // último paso alcanzado → nº de usuarios
  hourly: {},    // YYYY-MM-DDTHH → { goldFaucet, goldSink, cgridMint, kills, playMinutes }
}

// El orden importa: define el embudo de onboarding que queremos vigilar
const FUNNEL_STEPS = [
  'register', 'first_combat', 'first_kill', 'level_2', 'first_quest_accept',
  'first_craft', 'first_quest_complete', 'level_5', 'first_market_buy',
  'first_gather', 'first_harvest', 'first_arena',
  'first_dungeon', 'first_pvp', 'level_10', 'day_2_return',
]

function day(d = new Date()) { return d.toISOString().slice(0, 10) }
function hourKey(d = new Date()) { return d.toISOString().slice(0, 13) }

function dailyBucket(k = day()) {
  const a = store.analytics.daily
  if (!a[k]) {
    a[k] = { newUsers: 0, activeUsers: [], events: {}, goldFaucet: 0, goldSink: 0, cgridMint: 0, sessions: 0, playMinutes: 0,
             itemsCreados: 0, itemsDestruidos: 0, itemsPorMotivo: {} }
    const claves = Object.keys(a).sort()
    for (const vieja of claves.slice(0, Math.max(0, claves.length - DIAS_GUARDADOS))) delete a[vieja]
  }
  return a[k]
}
// Retención de la telemetría. Sin esto, un servidor encendido un año
// acumula 8.760 entradas por hora y 365 por día que nadie va a mirar:
// los informes solo usan las últimas 48 horas y los últimos 30 días.
const HORAS_GUARDADAS = 72
const DIAS_GUARDADOS = 90

function hourlyBucket(k = hourKey()) {
  const h = store.analytics.hourly
  if (!h[k]) {
    h[k] = { goldFaucet: 0, goldSink: 0, cgridMint: 0, kills: 0, playMinutes: 0, itemsCreados: 0, itemsDestruidos: 0 }
    const claves = Object.keys(h).sort()
    for (const vieja of claves.slice(0, Math.max(0, claves.length - HORAS_GUARDADAS))) delete h[vieja]
  }
  return h[k]
}

function userRecord(username) {
  const u = store.analytics.users
  if (!u[username]) u[username] = { firstSeen: day(), lastSeen: day(), activeDays: [day()], sessions: 0, playMinutes: 0, steps: {}, lastStep: null }
  return u[username]
}

// ── Evento genérico ────────────────────────────────────────────────
function track(type, username, data = {}) {
  const b = dailyBucket()
  b.events[type] = (b.events[type] || 0) + 1
  if (!username) return
  const u = userRecord(username)
  const d = day()
  if (u.lastSeen !== d) {
    u.lastSeen = d
    if (!u.activeDays.includes(d)) u.activeDays.push(d)
    if (u.activeDays.length === 2) step(username, 'day_2_return')
  }
  if (!b.activeUsers.includes(username)) b.activeUsers.push(username)
  if (data.kill) hourlyBucket().kills += 1
}

// ── Paso del embudo (solo la primera vez por usuario) ──────────────
function step(username, name) {
  if (!username || !FUNNEL_STEPS.includes(name)) return
  const u = userRecord(username)
  if (u.steps[name]) return
  u.steps[name] = new Date().toISOString()
  store.analytics.funnel[name] = (store.analytics.funnel[name] || 0) + 1
  // el "último paso" define dónde abandona la gente
  const prev = u.lastStep
  if (prev && store.analytics.dropoff[prev]) store.analytics.dropoff[prev] -= 1
  const idx = FUNNEL_STEPS.indexOf(name)
  const prevIdx = prev ? FUNNEL_STEPS.indexOf(prev) : -1
  if (idx > prevIdx) {
    u.lastStep = name
    store.analytics.dropoff[name] = (store.analytics.dropoff[name] || 0) + 1
    if (prev) store.analytics.dropoff[prev] = Math.max(0, (store.analytics.dropoff[prev] || 1) - 1)
  } else if (prev) {
    store.analytics.dropoff[prev] = (store.analytics.dropoff[prev] || 0) + 1
  }
}

// ── Flujo de moneda: cada faucet y cada sink queda medido ──────────
function trackCurrency(username, currency, amount, reason) {
  const b = dailyBucket(), h = hourlyBucket()
  if (currency === 'cgrid') { b.cgridMint += amount; h.cgridMint += amount }
  else if (amount >= 0) { b.goldFaucet += amount; h.goldFaucet += amount }
  else { b.goldSink += -amount; h.goldSink += -amount }
  track('currency_' + currency, username, {})
  if (store.analytics.currencyLog) {
    store.analytics.currencyLog.push({ at: Date.now(), username, currency, amount, reason })
    if (store.analytics.currencyLog.length > 5000) store.analytics.currencyLog.splice(0, 2500)
  } else store.analytics.currencyLog = []
}

// ── Flujo de objetos: cuántos entran y cuántos salen del juego ─────
//
// Faltaba de la lista de la FASE 18, y es la mitad que explica la otra.
// El oro creado por hora ya se medía; sin saber cuántos objetos se
// crean y se destruyen, un mercado con precios que bajan no se puede
// distinguir de uno con demasiados jugadores vendiendo lo mismo.
//
// Lo llama addItem/removeItem, que son los dos puntos de paso por los
// que entra y sale todo objeto del juego. Se quedan fuera dos motivos:
//   mercado   comprar y vender no crea ni destruye, solo cambia de mano
//   dev       la ruta de pruebas, que en producción ni existe
const MOTIVOS_SIN_CONTAR = ['mercado', 'dev']

function trackItems(sentido, itemId, cantidad, motivo) {
  if (!cantidad || cantidad <= 0) return
  if (MOTIVOS_SIN_CONTAR.includes(motivo)) return
  const b = dailyBucket(), h = hourlyBucket()
  const campo = sentido === 'creado' ? 'itemsCreados' : 'itemsDestruidos'
  // Los `|| 0` existen porque un servidor que arranca de un archivo
  // guardado antes de este cambio trae huecos donde ahora hay contador.
  b[campo] = (b[campo] || 0) + cantidad
  h[campo] = (h[campo] || 0) + cantidad
  if (!b.itemsPorMotivo) b.itemsPorMotivo = {}
  const clave = sentido + ':' + (motivo || 'otro')
  b.itemsPorMotivo[clave] = (b.itemsPorMotivo[clave] || 0) + cantidad
}

// ── Sesiones de juego (minutos reales, no logins) ──────────────────
const liveSessions = new Map()   // username → { startedAt, lastPing }
function touchSession(username) {
  if (!username) return
  const t = now()
  const s = liveSessions.get(username)
  if (!s || t - s.lastPing > 15 * 60 * 1000) {
    liveSessions.set(username, { startedAt: t, lastPing: t })
    userRecord(username).sessions += 1
    dailyBucket().sessions += 1
    return
  }
  const delta = (t - s.lastPing) / 60000
  s.lastPing = t
  userRecord(username).playMinutes += delta
  dailyBucket().playMinutes += delta
  hourlyBucket().playMinutes += delta
}

// ── Tiempo por pantalla y dónde se abandona ────────────────────────
// La pregunta que más importa en una beta es "¿en qué momento dejaste
// de tener ganas?". El jugador rara vez sabe contestarla con
// precisión, pero el servidor sí puede: basta con saber en qué
// pantalla estaba cada uno cuando dejó de dar señales de vida.
const PANTALLAS_VALIDAS = new Set([
  'mundo2d', 'combat', 'arena', 'huerto', 'crafting', 'mercado',
  'misiones', 'mazmorras', 'casas', 'guilds', 'hub', 'perfil', 'launcher',
])

function registrarPantalla(username, modulo) {
  if (!username || !PANTALLAS_VALIDAS.has(modulo)) return
  const u = userRecord(username)
  u.pantallas = u.pantallas || {}
  const t = now()
  // Se cierra el tramo anterior antes de abrir el nuevo
  if (u.pantallaActual && u.pantallaDesde && t - u.pantallaDesde < 30 * 60_000) {
    const min = (t - u.pantallaDesde) / 60000
    u.pantallas[u.pantallaActual] = (u.pantallas[u.pantallaActual] || 0) + min
  }
  u.pantallaActual = modulo
  u.pantallaDesde = t
  u.ultimaPantalla = modulo
  track('pantalla_' + modulo, username)
}

function pantallasReport() {
  const tiempo = {}, abandono = {}
  const t = now()
  for (const [nombre, u] of Object.entries(store.analytics.users)) {
    for (const [p, min] of Object.entries(u.pantallas || {})) {
      tiempo[p] = (tiempo[p] || 0) + min
    }
    // Se considera abandono si lleva más de 10 minutos sin dar señales
    if (u.ultimaPantalla && (!u.pantallaDesde || t - u.pantallaDesde > 10 * 60_000)) {
      abandono[u.ultimaPantalla] = (abandono[u.ultimaPantalla] || 0) + 1
    }
  }
  const filas = [...new Set([...Object.keys(tiempo), ...Object.keys(abandono)])].map(p => ({
    pantalla: p,
    // Con un decimal: en una sesión corta, redondear a entero deja
    // todas las pantallas a 0 y el panel parece vacío.
    minutos: Math.round((tiempo[p] || 0) * 10) / 10,
    abandonos: abandono[p] || 0,
  })).sort((a, b) => b.minutos - a.minutos)
  const peor = filas.slice().sort((a, b) => b.abandonos - a.abandonos)[0]
  return { pantallas: filas, dondeSeVan: peor && peor.abandonos ? peor.pantalla : null }
}

// ── Métricas derivadas ─────────────────────────────────────────────
function retention() {
  const users = Object.values(store.analytics.users)
  const cohorts = {}
  for (const u of users) {
    const c = cohorts[u.firstSeen] || (cohorts[u.firstSeen] = { size: 0, d1: 0, d7: 0, d30: 0 })
    c.size += 1
    const first = new Date(u.firstSeen)
    for (const d of u.activeDays) {
      const diff = Math.round((new Date(d) - first) / 86400000)
      if (diff === 1) c.d1 += 1
      if (diff >= 6 && diff <= 8) c.d7 += 1
      if (diff >= 28 && diff <= 32) c.d30 += 1
    }
  }
  const out = {}
  for (const [date, c] of Object.entries(cohorts)) {
    out[date] = { cohorte: c.size, d1: pct(c.d1, c.size), d7: pct(c.d7, c.size), d30: pct(c.d30, c.size) }
  }
  const total = users.length
  const anyD1 = users.filter(u => u.activeDays.length > 1).length
  return { porCohorte: out, totalUsuarios: total, volvieronAlgunaVez: pct(anyD1, total) }
}
function pct(a, b) { return b ? Math.round((a / b) * 1000) / 10 : 0 }

// Ventas de mercado agrupadas por hora.
//
// No hay un contador aparte a propósito: cada venta ya queda escrita en
// store.marketTransactions con su hora, su total y su comisión. Un
// contador paralelo solo añadiría una segunda verdad que se puede
// desincronizar de la primera, y entonces habría que decidir cuál de las
// dos es la buena.
function mercadoPorHora() {
  const out = {}
  for (const t of store.marketTransactions) {
    const k = String(t.at).slice(0, 13)
    if (!out[k]) out[k] = { ventas: 0, volumen: 0, comision: 0, unidades: 0 }
    out[k].ventas += 1
    out[k].volumen += t.total || 0
    out[k].comision += t.fee || 0
    out[k].unidades += t.quantity || 0
  }
  return out
}

function goldPerHourCurve() {
  const keys = Object.keys(store.analytics.hourly).sort().slice(-48)
  const mercado = mercadoPorHora()
  return keys.map(k => {
    const h = store.analytics.hourly[k]
    const horas = h.playMinutes / 60
    const m = mercado[k] || { ventas: 0, volumen: 0, comision: 0, unidades: 0 }
    // Los `|| 0` de los objetos: un archivo guardado antes de que esto
    // existiera trae horas sin esos contadores.
    const creados = h.itemsCreados || 0, destruidos = h.itemsDestruidos || 0
    return {
      hora: k,
      oroCreado: h.goldFaucet, oroQuemado: h.goldSink, neto: h.goldFaucet - h.goldSink,
      cgrid: h.cgridMint, kills: h.kills,
      oroPorHoraJugada: horas > 0.05 ? Math.round(h.goldFaucet / horas) : null,
      objetosCreados: creados, objetosDestruidos: destruidos,
      objetosNetos: creados - destruidos,
      objetosPorHoraJugada: horas > 0.05 ? Math.round(creados / horas) : null,
      mercadoVentas: m.ventas, mercadoVolumen: m.volumen, mercadoComision: m.comision,
      // Lo que de verdad se paga de media por unidad esa hora. El precio
      // medio de las publicaciones activas dice lo que la gente PIDE;
      // esto dice lo que la gente PAGA, que no es lo mismo.
      precioMedioPagado: m.unidades ? Math.round(m.volumen / m.unidades) : null,
    }
  })
}

function funnelReport() {
  const total = store.analytics.funnel.register || 0
  return FUNNEL_STEPS.map(s => ({
    paso: s,
    usuarios: store.analytics.funnel[s] || 0,
    porcentaje: pct(store.analytics.funnel[s] || 0, total),
    abandonanAqui: store.analytics.dropoff[s] || 0,
  }))
}

function analyticsReport() {
  const dias = Object.keys(store.analytics.daily).sort().slice(-30)
  const usuarios = Object.values(store.analytics.users)
  const minutos = usuarios.map(u => u.playMinutes).sort((a, b) => a - b)
  const mediana = minutos.length ? Math.round(minutos[Math.floor(minutos.length / 2)]) : 0
  return {
    generado: new Date().toISOString(),
    resumen: {
      usuariosTotales: usuarios.length,
      activosHoy: dailyBucket().activeUsers.length,
      sesionesHoy: dailyBucket().sessions,
      minutosMedianaPorJugador: mediana,
      jugadoresQueSuperan40min: usuarios.filter(u => u.playMinutes >= 40).length,
    },
    retencion: retention(),
    embudo: funnelReport(),
    pantallas: pantallasReport(),
    economia: goldPerHourCurve(),
    diario: dias.map(d => ({ dia: d, ...store.analytics.daily[d], activeUsers: store.analytics.daily[d].activeUsers.length })),
  }
}

// Métricas públicas: transparencia de economía, sin datos personales
function publicEconomyReport() {
  const dias = Object.keys(store.analytics.daily).sort().slice(-14)
  const listings = store.marketListings.filter(l => l.status === 'ACTIVE')
  const precios = {}
  for (const l of listings) {
    if (!precios[l.itemId]) precios[l.itemId] = []
    precios[l.itemId].push(l.pricePerUnit)
  }
  const mercado = Object.entries(precios).map(([itemId, ps]) => ({
    itemId, nombre: template(itemId)?.name || itemId, rareza: template(itemId)?.rarity,
    publicaciones: ps.length,
    precioMin: Math.min(...ps), precioMax: Math.max(...ps),
    precioMedio: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length),
  })).sort((a, b) => b.publicaciones - a.publicaciones)

  const ventas = store.marketTransactions.slice(-200)

  // Precio realmente pagado por objeto, sobre TODO el historial que se
  // conserva. Junto al precio pedido de arriba, es lo que deja ver si un
  // objeto se publica caro y se vende barato, o si directamente no se
  // vende.
  const pagados = {}
  for (const t of store.marketTransactions) {
    if (!pagados[t.itemId]) pagados[t.itemId] = { unidades: 0, total: 0, ventas: 0 }
    pagados[t.itemId].unidades += t.quantity || 0
    pagados[t.itemId].total += t.total || 0
    pagados[t.itemId].ventas += 1
  }
  const preciosPagados = Object.entries(pagados).map(([itemId, v]) => ({
    itemId, nombre: template(itemId)?.name || itemId,
    ventas: v.ventas, unidades: v.unidades,
    precioMedioPagado: v.unidades ? Math.round(v.total / v.unidades) : null,
  })).sort((a, b) => b.ventas - a.ventas)

  const hoy = dailyBucket()
  return {
    generado: new Date().toISOString(),
    aviso: 'CGRID es actualmente un saldo OFF-CHAIN. No existe token desplegado. Estas cifras son del servidor de juego.',
    cgrid: {
      emitidoHoy: store.economy.cgridEmitted,
      topeDiarioGlobal: ECONOMY.CGRID_DAILY_GLOBAL_CAP,
      topeDiarioPorJugador: ECONOMY.CGRID_DAILY_PLAYER_CAP,
      circulante: Object.values(store.players).reduce((a, p) => a + (p.character.cgrid || 0), 0),
      fuentes: ['jefes (1)', 'mazmorras heroic+ (1-5)', 'misiones concretas (1-2)'],
    },
    oro: {
      circulante: Object.values(store.players).reduce((a, p) => a + (p.character.gold || 0), 0),
      creadoHoy: dailyBucket().goldFaucet,
      quemadoHoy: dailyBucket().goldSink,
      sinks: ['comisión de mercado 5%', 'muerte 8%', 'mejoras de casa', 'mobiliario', 'creación de gremio 5000'],
      ultimos14dias: dias.map(d => ({ dia: d, creado: store.analytics.daily[d].goldFaucet, quemado: store.analytics.daily[d].goldSink })),
    },
    mercado: {
      publicacionesActivas: listings.length,
      ventasRegistradas: store.marketTransactions.length,
      volumenUltimas200Ventas: ventas.reduce((a, t) => a + t.total, 0),
      comisionQuemada: ventas.reduce((a, t) => a + t.fee, 0),
      volumenTotal: store.marketTransactions.reduce((a, t) => a + (t.total || 0), 0),
      precios: mercado,
      preciosPagados,
    },
    // Objetos: la otra mitad de la economía. Sin esto, un mercado con
    // precios a la baja no se distingue de uno con demasiada gente
    // vendiendo lo mismo.
    objetos: {
      creadosHoy: hoy.itemsCreados || 0,
      destruidosHoy: hoy.itemsDestruidos || 0,
      netoHoy: (hoy.itemsCreados || 0) - (hoy.itemsDestruidos || 0),
      porMotivoHoy: hoy.itemsPorMotivo || {},
      nota: 'Comprar y vender no cuenta: el objeto cambia de dueño, no se crea ni se destruye.',
      ultimos14dias: dias.map(d => ({
        dia: d,
        creados: store.analytics.daily[d].itemsCreados || 0,
        destruidos: store.analytics.daily[d].itemsDestruidos || 0,
      })),
    },
    jugadores: { registrados: Object.keys(store.players).length, activosHoy: dailyBucket().activeUsers.length },
  }
}
