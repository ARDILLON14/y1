
// ═══════════════════════════════════════════════════════════════════
//  SERVIDOR HTTP
// ═══════════════════════════════════════════════════════════════════
const http = require('http')
const urlmod = require('url')
const PORT = process.env.PORT || 3000

const server = http.createServer((req, res) => {
  const parsed = urlmod.parse(req.url, true)
  const pathname = parsed.pathname
  securityHeaders(res)

  // CORS: NUNCA "*" — solo orígenes declarados (por defecto, mismo origen)
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Idempotency-Key')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (pathname.startsWith('/api/')) {
    // El límite general se cuenta por sesión cuando la hay, y solo por IP
    // cuando no. Si se contase siempre por IP, varios jugadores de la misma
    // red (una casa, una oficina) se bloquearían entre ellos.
    const tok = getToken(req)
    const bucket = tok ? 'ses:' + tok.slice(0, 16) : 'ip:' + clientIp(req)
    // El pulso de la arena por HTTP va a diez por segundo cuando el
    // WebSocket no está disponible. Con el límite general (300/min) se
    // cortaría a los treinta segundos de jugar, así que lleva su propio
    // cupo. Sigue habiendo tope: no es una puerta abierta.
    const esPulso = pathname === '/api/arena/sync'
    const limite = esPulso ? 1500 : REQUEST_LIMIT_PER_MINUTE
    if (!rateLimit((esPulso ? 'pulso:' : '') + bucket, limite, 60_000)) return fail(res, 'Demasiadas peticiones seguidas. Baja el ritmo un momento.', 429)
    return handleAPI(req, res, pathname, parsed.query).catch(err => {
      console.error('[api]', pathname, err.message)
      if (!res.headersSent) fail(res, IS_PROD ? 'Error interno' : err.message, err.message === 'BODY_TOO_LARGE' ? 413 : 500)
    })
  }

  // ── Archivos estáticos (sprites de personaje) ───────────────────
  // Todo lo que haya en ./assets se sirve tal cual. Para añadir una
  // skin nueva basta con copiar el PNG a ./assets/skins/.
  if (pathname.startsWith('/assets/')) {
    const rel = pathname.slice('/assets/'.length)
    if (rel.includes('..') || rel.includes('\0')) { res.writeHead(400); res.end('Ruta inválida'); return }
    const file = path.join(ASSETS_DIR, rel)
    if (!file.startsWith(ASSETS_DIR)) { res.writeHead(403); res.end('Prohibido'); return }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Asset no encontrado'); return }
      res.writeHead(200, { 'Content-Type': MIME['.' + rel.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' })
      res.end(data)
    })
    return
  }

  const pageKey = (pathname === '/' ? 'index.html' : pathname.slice(1))
  const pageHtml = PAGES[pageKey]
  if (pageHtml) {
    const ext = '.' + pageKey.split('.').pop()
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain; charset=utf-8' })
    res.end(pageHtml)
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('404 — no encontrado')
})

// ── Router de la API ───────────────────────────────────────────────
async function handleAPI(req, res, pathname, query) {
  // Las subidas de imagen necesitan más margen que una petición normal
  const limite = pathname === '/api/character/upload' ? 900 * 1024 : MAX_BODY
  const body = req.method !== 'GET' ? await readBody(req, limite) : {}
  const ip = clientIp(req)

  // ── Idempotencia (evita doble envío de operaciones económicas) ──
  const idemKey = req.headers['idempotency-key']
  if (idemKey && store.idempotency[idemKey]) return json(res, store.idempotency[idemKey].response)
  const reply = (data, status = 200, headers) => {
    if (idemKey) store.idempotency[idemKey] = { at: now(), response: data }
    return json(res, data, status, headers)
  }

  // ══════════ AUTH ══════════
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    // Ojo: varias personas pueden compartir IP (oficina, campus, móvil). Un
    // límite de 5/hora bloqueaba a compañeros de la misma red. Configurable.
    if (!rateLimit('reg:' + ip, REGISTER_LIMIT_PER_HOUR, 60 * 60_000)) {
      return fail(res, 'Demasiadas cuentas creadas desde esta red. Espera un rato o inicia sesión.', 429)
    }
    const { username, email, password, className } = body
    if (!isStr(username, 3, 20) || !USERNAME_RE.test(username)) return fail(res, 'Nombre de usuario inválido (3-20 caracteres alfanuméricos)')
    if (!isStr(email, 5, 120) || !EMAIL_RE.test(email)) return fail(res, 'Email inválido')
    if (!isStr(password, 8, 200)) return fail(res, 'La contraseña debe tener al menos 8 caracteres')
    if (nameTaken(username)) return fail(res, 'Ese nombre ya está en uso', 409)

    // Beta cerrada: solo si INVITE_ONLY=1. Se valida ANTES de crear nada
    // y se consume DESPUÉS, para que un registro fallido no queme el código.
    let invitacion = null
    if (INVITE_ONLY) {
      const v = invitacionValida(body.invite)
      if (!v.ok) return fail(res, v.error, 403)
      invitacion = v.inv
    }
    if (store.emailIndex[email.toLowerCase()]) return fail(res, 'Email ya registrado', 409)

    const player = {
      username, email: email.toLowerCase(),
      password: hashPassword(password),
      character: newCharacter(username, className),
      createdAt: new Date().toISOString(), muteUntil: 0, role: 'player',
    }
    player.character.appearance = sanitizeAppearance(body.appearance, player.character)
    store.players[username] = player
    store.nameIndex = store.nameIndex || {}
    store.nameIndex[username.toLowerCase()] = username
    store.emailIndex[email.toLowerCase()] = username
    if (INVITE_ONLY) {
      const inv = consumirInvitacion(body.invite, username)
      player.invitadoPor = inv ? inv.etiqueta : null
    }
    const token = createSession(username)
    audit('register', username, { ip })
    track('register', username); step(username, 'register'); dailyBucket().newUsers += 1; touchSession(username)
    persist()
    return reply({ success: true, character: publicChar(player.character) }, 201, { 'Set-Cookie': sessionCookie(token, req) })
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    if (!rateLimit('login:' + ip, 10, 10 * 60_000)) return fail(res, 'Demasiados intentos. Espera unos minutos.', 429)
    const { email, password } = body
    if (!isStr(email, 3, 120) || !isStr(password, 1, 200)) return fail(res, 'Credenciales incorrectas', 401)
    const username = store.emailIndex[String(email).toLowerCase()]
    const player = username ? store.players[username] : null
    // Comparación en tiempo constante y mensaje genérico (no revela si el email existe)
    if (!player || !verifyPassword(password, player.password)) {
      audit('login_failed', email, { ip })
      return fail(res, 'Credenciales incorrectas', 401)
    }
    const token = createSession(player.username)
    audit('login', player.username, { ip })
    track('login', player.username); touchSession(player.username)
    return json(res, { success: true, character: publicChar(player.character) }, 200, { 'Set-Cookie': sessionCookie(token, req) })
  }

  // Comprobar si un nombre está libre (para el creador de personaje)
  if (pathname === '/api/auth/check-name' && req.method === 'GET') {
    if (!rateLimit('chk:' + ip, 60, 60_000)) return fail(res, 'Demasiadas comprobaciones', 429)
    const name = String(query.username || '')
    if (!USERNAME_RE.test(name)) return json(res, { available: false, reason: 'Entre 3 y 20 caracteres, sin espacios ni símbolos raros' })
    return json(res, { available: !nameTaken(name) })
  }

  // Estado del registro: el launcher lo consulta para saber si pedir código
  if (pathname === '/api/auth/mode' && req.method === 'GET') {
    return json(res, { inviteOnly: INVITE_ONLY })
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getToken(req)
    if (token) delete store.sessions[token]
    return json(res, { success: true }, 200, { 'Set-Cookie': 'cm_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict' })
  }

  // El panel de analítica se abre solo con ADMIN_TOKEN: es una herramienta
  // de operación, no necesita una sesión de jugador.
  // ══════════ INVITACIONES (solo con ADMIN_TOKEN) ══════════
  if (pathname.startsWith('/api/admin/invites')) {
    const tok = req.headers['x-admin-token'] || query.token || ''
    if (!ADMIN_TOKEN || tok !== ADMIN_TOKEN) return fail(res, 'Requiere ADMIN_TOKEN', 403)
    if (req.method === 'GET') return json(res, resumenInvitaciones())
    if (req.method === 'POST') {
      const codigos = crearInvitaciones(body.cantidad, body.etiqueta, body.maxUsos)
      return json(res, { creados: codigos.length, codigos }, 201)
    }
    return fail(res, 'Método no permitido', 405)
  }

  if (pathname === '/api/admin/analytics' && req.method === 'GET') {
    const tok = req.headers['x-admin-token'] || query.token || ''
    if (!ADMIN_TOKEN || tok !== ADMIN_TOKEN) return fail(res, 'Panel de analítica protegido. Arranca con ADMIN_TOKEN=... y pasa la cabecera X-Admin-Token.', 403)
    return json(res, analyticsReport())
  }

  // ══════════ A partir de aquí, todo requiere sesión ══════════
  // ══════════ AVISOS DE JUGADORES ══════════
  if (pathname === '/api/feedback' && req.method === 'POST') {
    if (!rateLimit('fb:' + clientIp(req), 10, 10 * 60_000)) return fail(res, 'Demasiados avisos seguidos', 429)
    const r = guardarAviso(getPlayer(req), body, req)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r, 201)
  }
  if (pathname.startsWith('/api/admin/feedback')) {
    const tok = req.headers['x-admin-token'] || query.token || ''
    if (!ADMIN_TOKEN || tok !== ADMIN_TOKEN) return fail(res, 'Requiere ADMIN_TOKEN', 403)
    if (req.method === 'GET') return json(res, listarAvisos())
    if (req.method === 'POST') {
      const r = marcarResuelto(body.id, body.resuelto)
      if (r.error) return fail(res, r.error, r.code)
      return json(res, r)
    }
    return fail(res, 'Método no permitido', 405)
  }

  const publicGet = ['/api/monsters', '/api/npcs', '/api/market', '/api/leaderboard', '/api/chat', '/api/guilds', '/api/web3/status', '/api/economy', '/api/health', '/api/zones', '/api/crafting', '/api/economy/public', '/api/skins', '/api/auth/mode']
  const p = getPlayer(req)
  if (!p && !(req.method === 'GET' && publicGet.includes(pathname))) return fail(res, 'No autorizado', 401)
  const char = p?.character
  if (p) touchSession(p.username)

  // ══════════ PRIMEROS PASOS ══════════
  if (pathname === '/api/onboarding' && req.method === 'GET') {
    return json(res, resumenPasos(p))
  }
  if (pathname === '/api/onboarding/claim' && req.method === 'POST') {
    const r = reclamarPaso(p, body.id)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }

  // ══════════ APARIENCIA ══════════
  if (pathname === '/api/character/upload' && req.method === 'POST') {
    if (!rateLimit('subida:' + char.id, 10, 60 * 60_000)) return fail(res, 'Demasiadas subidas por ahora', 429)
    const r = guardarPersonajePropio(p, body.imagen)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  if (pathname === '/api/character/upload' && req.method === 'DELETE') {
    const r = quitarPersonajePropio(p)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }

  if (pathname === '/api/skins' && req.method === 'GET') {
    const propia = skinPropiaDe(char)
    return json(res, { skins: (propia ? [propia] : []).concat(SKINS.filter(s => !s.rota).map(s => skinPublic(s, char))), defaultSkin: DEFAULT_SKIN, paletteKeys: PALETTE_KEYS })
  }
  if (pathname === '/api/character/appearance' && req.method === 'POST') {
    if (!rateLimit('appr:' + char.id, 30, 60_000)) return fail(res, 'Demasiados cambios de aspecto', 429)
    const requested = body.appearance || body
    if (requested.skinId && !SKIN_IDS.has(requested.skinId)) return fail(res, 'Skin desconocida', 404)
    const skin = skinById(requested.skinId || char.appearance?.skinId || DEFAULT_SKIN)
    if (!skinUnlocked(skin, char)) return fail(res, 'Esa skin todavía no está disponible para ti', 403)
    char.appearance = sanitizeAppearance(requested, char)
    persist()
    return json(res, { success: true, appearance: char.appearance })
  }

  // ══════════ JUGADOR ══════════
  // El launcher avisa de en qué pantalla está el jugador. Es una sola
  // línea de datos y responde la pregunta que ninguna encuesta acierta.
  if (pathname === '/api/telemetria/pantalla' && req.method === 'POST') {
    registrarPantalla(p.username, String(body.modulo || ''))
    return json(res, { ok: true })
  }

  if (pathname === '/api/player' && req.method === 'GET') return json(res, { character: publicChar(char), zonaActual: char.zonaActual || 'pueblo' })
  if (pathname === '/api/profile' && req.method === 'GET') return json(res, perfilDe(p))

  if (pathname === '/api/player/feed' && req.method === 'GET') {
    const events = store.auditLog.slice(-40).reverse()
      .filter(a => ['combat_win', 'market_buy', 'mazmorra_fin', 'arena_fin', 'quest_complete', 'pvp_match'].includes(a.type))
      .slice(0, 8)
      .map(a => ({ id: a.id, type: a.type, message: feedMessage(a), createdAt: a.at }))
    return json(res, { events })
  }

  if (pathname === '/api/player/respawn' && req.method === 'POST') {
    // La mitad del tope REAL, con el equipo puesto. Antes era la mitad
    // de la vida BASE, así que con una coraza buena resucitabas con
    // bastante menos de la mitad de lo que te cabe.
    const st = effectiveStats(char)
    char.hp = Math.floor(st.maxHp * 0.5)
    char.mp = Math.floor(st.maxMp * 0.5)
    persist()
    return json(res, { success: true, hp: char.hp, mp: char.mp, maxHp: st.maxHp, maxMp: st.maxMp })
  }

  if (pathname === '/api/player/equip' && req.method === 'POST') {
    const { uid, slot, unequip } = body
    char.equipment = char.equipment || {}
    if (unequip) {
      if (!SLOTS.includes(slot)) return fail(res, 'Slot inválido')
      delete char.equipment[slot]
      // Quitarse una coraza baja la vida máxima. Sin recortar, quedaba
      // un personaje con 1.150 puntos de un tope de 970.
      const st = ajustarATope(char)
      persist()
      return json(res, { success: true, equipment: char.equipment, stats: st, hp: char.hp, mp: char.mp })
    }
    const item = char.inventory.find(i => i.uid === uid)
    if (!item) return fail(res, 'Objeto no encontrado en tu inventario', 404)
    const t = template(item.itemId)
    if (!t?.slot) return fail(res, 'Ese objeto no es equipable')
    char.equipment[t.slot] = item.uid
    // Cambiar una pieza por otra peor también puede bajar el tope.
    const st = ajustarATope(char)
    persist()
    return json(res, { success: true, equipment: char.equipment, stats: st, hp: char.hp, mp: char.mp })
  }

  // Usar un consumible fuera del combate. Antes solo se podía beber
  // una poción en mitad de una pelea: si volvías herido, no había
  // forma de curarte y las pociones del inventario eran decorativas.
  if (pathname === '/api/player/use' && req.method === 'POST') {
    const item = (char.inventory || []).find(i => i.uid === body.uid || i.itemId === body.itemId)
    if (!item) return fail(res, 'No tienes ese objeto', 404)
    const t = template(item.itemId)
    if (!t || !(t.heal || t.mana || t.buff)) return fail(res, 'Ese objeto no se puede usar', 400)
    const st = effectiveStats(char)
    // Con efecto, siempre se puede tomar aunque estés a tope de vida:
    // lo que se busca es el buff, no la curación.
    if (!t.buff) {
      if (t.heal && char.hp >= st.maxHp) return fail(res, 'Ya tienes la vida al máximo', 400)
      if (t.mana && !t.heal && char.mp >= st.maxMp) return fail(res, 'Ya tienes el maná al máximo', 400)
    }
    removeItem(char, item.itemId, 1)
    const curado = t.heal ? Math.min(t.heal, st.maxHp - char.hp) : 0
    const restaurado = t.mana ? Math.min(t.mana, st.maxMp - char.mp) : 0
    char.hp = Math.min(st.maxHp, char.hp + curado)
    char.mp = Math.min(st.maxMp, char.mp + restaurado)
    const efecto = t.buff ? aplicarEfecto(char, t.buff, t.name) : null
    char.consumiblesUsados = (char.consumiblesUsados || 0) + 1
    audit('usar_objeto', char.name, { itemId: item.itemId, curado, restaurado, efecto: efecto && efecto.stat })
    persist()
    const st2 = effectiveStats(char)
    return json(res, {
      success: true, curado, restaurado, hp: char.hp, mp: char.mp,
      maxHp: st2.maxHp, maxMp: st2.maxMp,
      efecto: efecto ? { nombre: efecto.nombre, valor: efecto.valor, minutos: Math.round((efecto.hasta - now()) / 60000) } : null,
      efectos: efectosActivos(char), stats: st2,
    })
  }

  if (pathname === '/api/inventory' && req.method === 'GET') {
    const detalle = (char.inventory || []).map(i => {
      const t = template(i.itemId) || {}
      return {
        ...i,
        // El nombre, el icono y la rareza se leen SIEMPRE de la
        // plantilla, no de la copia que se guardó al fabricar el
        // objeto. Si no, retocar una plantilla dejaba los objetos
        // antiguos con los datos viejos: dos verdades para lo mismo.
        name: t.name || i.name,
        icon: t.icon || i.icon,
        imagen: t.imagen || null,
        rarity: t.rarity || i.rarity,
        type: t.type || i.type,
        slot: t.slot || null,
        equipable: !!t.slot,
        consumible: !!(t.heal || t.mana || t.buff),
        efecto: t.buff ? { nombre: NOMBRE_STAT[t.buff.stat], valor: t.buff.valor, minutos: t.buff.minutos } : null,
        cura: t.heal || 0, mana: t.mana || 0,
        stats: t.stats || null,
        valor: t.value || 0,
        vendible: t.tradeable !== false,
        equipado: isEquipped(char, i.uid),
        usadoEnRecetas: RECIPES.filter(r => r.ingredients.some(g => g.itemId === i.itemId)).map(r => r.name),
      }
    })
    return json(res, {
      inventory: detalle, equipment: char.equipment || {}, stats: effectiveStats(char),
      slots: SLOTS, capacidad: 120,
    })
  }

  // ══════════ COMBATE (server-authoritative) ══════════
  // Qué objetos sirven en combate, con lo que hacen. La pantalla lo
  // pregunta en vez de adivinar qué es una poción por el nombre.
  if (pathname === '/api/combat/objetos' && req.method === 'GET') {
    return json(res, { objetos: objetosDeCombate(char) })
  }

  // Qué habilidades sabe el personaje y cuáles puede lanzar ahora.
  // Existía el catálogo, existían tres por clase, y la pantalla solo
  // sabía mandar la primera.
  if (pathname === '/api/combat/habilidades' && req.method === 'GET') {
    const b = Object.values(store.battles).find(x => x.owner === char.id && x.state === 'ACTIVE')
    return json(res, {
      habilidades: habilidadesDe(char),
      mp: char.mp, maxMp: char.maxMp,
      estados: estadosDe(char, b),
    })
  }

  if (pathname === '/api/combat/action' && req.method === 'POST') {
    if (!rateLimit('cmb:' + char.id, 120, 60_000)) return fail(res, 'Demasiadas acciones de combate', 429)
    const { monsterId, action, skillId, battleId } = body
    if (!MONSTERS[monsterId]) return fail(res, 'Monstruo desconocido', 404)
    if (char.hp <= 0) return fail(res, 'Estás derrotado. Usa /api/player/respawn', 400)

    step(p.username, 'first_combat')
    let battle = findBattle(char, battleId, monsterId)
    if (!battle) battle = startBattle(char, monsterId)
    const r = combatAction(char, battle, action, skillId, body.itemId)
    if (r.error) return fail(res, r.error, r.code || 400)

    // Respuesta compatible con el cliente v2 (+ campos nuevos)
    return json(res, {
      battleId: battle.id,
      result: { playerDmg: r.playerDmg, enemyDmg: r.enemyDmg, isCrit: r.crit, isMiss: r.miss, playerHeal: r.playerHeal, element: r.element, fled: !!r.fled, enemyDied: !!r.enemyDied, playerDied: !!r.playerDied, log: r.log },
      combo: r.combo || 0, phase: r.phase || 1, telegraph: r.telegraph || null,
      newHp: char.hp, newMp: char.mp,
      newMonsterHp: r.fled ? battle.enemyHp : (r.enemyDied ? 0 : battle.enemyHp),
      enemyMaxHp: battle.enemyMaxHp,
      enemyDied: !!r.enemyDied, playerDied: !!r.playerDied, fled: !!r.fled,
      goldEarned: r.rewards?.gold || 0, xpEarned: r.rewards?.xp || 0, cgridEarned: r.rewards?.cgrid || 0,
      loot: r.rewards?.loot || [], goldLost: r.goldLost || 0,
      levelUps: r.levelUps || [], newLevel: char.level, newXpToNext: char.xpToNext,
      questUpdates: r.questUpdates || [],
      // El guion del turno: las escenas en orden, para que la pantalla
      // pueda reproducirlas en vez de pintarlo todo de golpe. Va al lado
      // de los campos planos de siempre, que la pantalla actual sigue
      // usando: el paso 8 la cambiará para leer esto.
      guion: r.guion || [], duracion: r.duracion || 0,
      // Los campos planos también, por nombre directo: la prueba y el
      // cliente nuevo no deberían tener que bucear en `result`.
      playerDmg: r.playerDmg || 0, enemyDmg: r.enemyDmg || 0,
      crit: !!r.crit, miss: !!r.miss,
      // Estado tras el turno: qué habilidades quedan listas y qué
      // efectos siguen encima. Sin esto la pantalla tendría que
      // adivinar los enfriamientos por su cuenta, y adivinar mal.
      habilidades: habilidadesDe(char),
      estados: estadosDe(char, battle),
    })
  }

  // ══════════ MUNDO / ZONAS ══════════
  if (pathname === '/api/zones' && req.method === 'GET') return json(res, { zones: ZONES })
  if (pathname === '/api/world/explore' && req.method === 'POST') {
    const zoneId = zonaCanonica(body.zoneId)
    const z = zoneId && ZONES[zoneId]
    if (!z) return fail(res, 'Zona desconocida', 404)
    // Viajar ya no se bloquea por nivel: lo peligroso son los
    // monstruos, no el camino. Antes, un jugador de nivel 1 no podía
    // ni asomarse a las minas y el botón parecía roto.
    const bajoNivel = char.level < z.levelReq
    if (!rateLimit('exp:' + char.id, 30, 60_000)) return fail(res, 'Demasiado rápido', 429)
    char.zonesVisited = char.zonesVisited || []
    // Dónde está el jugador, guardado. El mapa vive en un iframe que se
    // recarga entero al cambiar de pantalla, así que su variable de
    // zona se reiniciaba a 'pueblo' cada vez: ibas al bosque, abrías el
    // inventario, volvías y estabas otra vez en el pueblo. La zona es
    // un dato del personaje, no una variable de una pantalla.
    char.zonaActual = zoneId
    const first = !char.zonesVisited.includes(zoneId)
    if (first) char.zonesVisited.push(zoneId)
    const questUpdates = first ? emitProgress(char, z.key, 1) : []
    persist()
    return json(res, {
      success: true, zone: { id: zoneId, ...z }, first, questUpdates,
      bajoNivel, aviso: bajoNivel ? `Zona recomendada para nivel ${z.levelReq}: los enemigos te superan` : null,
    })
  }

  // ══════════ MAZMORRAS JUGABLES ══════════
  if (pathname === '/api/mazmorra' && req.method === 'GET') {
    return json(res, {
      mazmorras: Object.values(MAZMORRAS).map(m => ({
        id: m.id, nombre: m.nombre, icono: m.icono, minLevel: m.minLevel, pisos: m.pisos,
        oro: m.oro, cgrid: m.cgrid,
        enemigos: [...new Set([...m.enemigos, m.elite, m.jefe])].map(x => ({ nombre: MONSTERS[x].name, icono: MONSTERS[x].icon })),
        disponible: char.level >= m.minLevel,
        enfriamiento: Math.max(0, ((char.cooldownsMazmorra || {})[m.id] || 0) - now()),
      })),
      run: estadoMazmorraDe(p.username),
    })
  }
  if (pathname === '/api/mazmorra/entrar' && req.method === 'POST') {
    const r = entrarMazmorra(p, body.mazmorraId)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  if (pathname === '/api/mazmorra/sala' && req.method === 'POST') {
    const r = elegirSala(p, body.salaId)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  if (pathname === '/api/mazmorra/retirarse' && req.method === 'POST') {
    const r = retirarse(p)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }

  // ══════════ ARENA (combate en tiempo real) ══════════
  // Dar objetos para probar. SOLO fuera de producción: en producción
  // esta ruta no existe (404 seco, ni siquiera dice que existió), así
  // que no es una puerta trasera que se pueda dejar abierta sin querer.
  // Cada uso se anuncia en la consola: si aparece en un servidor de
  // verdad, se ve.
  if (pathname === '/api/dev/dar' && req.method === 'POST') {
    if (IS_PROD) return fail(res, 'No existe', 404)
    const t = template(body.itemId)
    if (!t) return fail(res, 'Ese objeto no existe', 400)
    const cant = Math.max(1, Math.min(99, Number(body.quantity) || 1))
    addItem(char, body.itemId, cant)
    persist()
    console.warn(`  🧪  [dev] ${p.username} se ha dado ${cant}× ${t.name}`)
    return json(res, { ok: true, item: { itemId: body.itemId, name: t.name, quantity: cant } })
  }

  // Por qué falla el socket, en cristiano. La página lo pregunta cuando
  // el WebSocket no conecta, porque ella misma no puede saberlo.
  if (pathname === '/api/diagnostico/socket' && req.method === 'GET') {
    const yo = getPlayer(req)
    return json(res, {
      sesion: !!yo,
      cookieRecibida: !!req.headers.cookie,
      intentosDeConexion: wsIntentos,
      socketsAbiertos: wsClients.size,
      socketsMios: yo ? [...wsClients].filter(c => c.username === yo.username).length : 0,
      rechazos: wsRechazos.slice(0, 5),
    })
  }

  if (pathname === '/api/arena' && req.method === 'GET') {
    return json(res, {
      arenas: Object.values(ARENAS).map(a => ({
        id: a.id, nombre: a.nombre, minLevel: a.minLevel, zona: a.zona,
        oleadas: a.oleadas.length,
        enemigos: [...new Set(a.oleadas.flat())].map(m => ({ id: m, nombre: MONSTERS[m].name, icono: MONSTERS[m].icon })),
        oro: a.oro, cgrid: a.cgrid,
        disponible: char.level >= a.minLevel,
      })),
      arma: armaDe(char).nombre,
      // El nombre suelto no basta para dibujar el arma en la barra ni
      // para saber si tiene dibujo propio. Se manda aparte para no
      // cambiar el tipo de `arma`, que ya usan la página y las pruebas.
      armaDetalle: armaDe(char),
      // El catálogo fusionado, tal cual lo usa el motor: conducta de
      // ARMAS + dibujo de ITEM_TEMPLATES. Se publica para que se pueda
      // comprobar desde fuera que no hay dos verdades sobre un arma, y
      // para que la pantalla pueda enseñar qué gana cada una.
      armas: Object.keys(ARMAS).map(armaVista),
      enCurso: partidas.has(p.username),
    })
  }
  if (pathname === '/api/arena/start' && req.method === 'POST') {
    const r = iniciarArena(p, body.arenaId)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  // Arena sin WebSocket. Una petición lleva la intención y trae el
  // estado: exactamente el mismo trato que por socket, con el mismo
  // servidor decidiendo. Existe porque el socket puede no estar
  // disponible (proxy, antivirus, red rara) y entonces la arena era
  // injugable sin que nadie supiera por qué.
  if (pathname === '/api/arena/sync' && req.method === 'POST') {
    const r = sincronizarArena(p.username, body.entrada || {})
    if (!r) return fail(res, 'No hay combate en curso', 404)
    return json(res, r)
  }

  if (pathname === '/api/arena/abandon' && req.method === 'POST') {
    const r = abandonarArena(p.username)
    return json(res, r || { motivo: 'sin_partida' })
  }

  // ══════════ RECOLECCIÓN Y HUERTO ══════════
  if (pathname === '/api/gather' && req.method === 'GET') {
    return json(res, { nodos: nodosDeZona(query.zona || 'pueblo').map(n => ({
      ...n, listoEn: (char.recoleccion || {})[n.id] || 0,
    })) })
  }
  if (pathname === '/api/gather' && req.method === 'POST') {
    if (!rateLimit('gath:' + char.id, 60, 60_000)) return fail(res, 'Demasiado rápido', 429)
    const r = recolectar(char, body.nodoId)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  // ══════════ RECURSOS DEL MUNDO (talar / picar) ══════════
  // El huerto de más abajo sigue igual: esto va en paralelo (§7).
  // ══════════ MUNDO COMPARTIDO ══════════
  //
  // El mismo pulso que va por socket, por HTTP. La lección de la v29 y
  // la v30 fue que el WebSocket a veces no llega —un antivirus, un
  // proxy, una extensión— y que el juego no puede depender de él. La
  // arena ya tenía este camino; el mundo lo necesita por lo mismo.
  if (pathname === '/api/mundo/sync' && req.method === 'POST') {
    const r = moverEnMundo(p.username, body.pos || {})
    if (!r) return fail(res, 'No se pudo situar en el mundo', 400)
    return json(res, { tu: r, vecinos: vecinosDe(p.username) })
  }
  if (pathname === '/api/mundo/salir' && req.method === 'POST') {
    salirDelMundo(p.username)
    return json(res, { success: true })
  }

  if (pathname === '/api/recursos' && req.method === 'GET') {
    return json(res, {
      // El espacio de coordenadas viaja con la lista: quien dibuje los
      // nodos convierte a su pantalla sin tener que suponer la escala.
      espacio: MUNDO_RECURSOS,
      alcance: ALCANCE_RECURSO,
      zonaActual: zonaCanonica(char.zonaActual || 'pueblo'),
      nodos: listarRecursos(char, query.zona || null),
      herramienta: (() => {
        const h = herramientaEquipada(char)
        if (!h) return null
        return {
          itemId: h.item.itemId, nombre: h.plantilla.name, icono: h.plantilla.icon,
          tipo: h.tipo, poder: h.poder, nivel: h.nivel,
          durabilidad: h.item.durabilidad != null ? h.item.durabilidad : h.durabilidad,
          durabilidadMax: h.durabilidad,
        }
      })(),
    })
  }
  if (pathname === '/api/forja' && req.method === 'GET') {
    return json(res, { herramientas: catalogoHerramientas() })
  }
  if (pathname === '/api/recursos/golpear' && req.method === 'POST') {
    // Un golpe por petición. El límite corta el clic automático.
    if (!rateLimit('golpe:' + char.id, 180, 60_000)) return fail(res, 'Demasiado rápido', 429)
    const r = golpearRecurso(char, body.nodoId, body.pos, p.username)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }

  // ══════════ HOTBAR ══════════
  if (pathname === '/api/hotbar' && req.method === 'GET') return json(res, verHotbar(char))
  if (pathname === '/api/hotbar' && req.method === 'POST') {
    const r = ponerEnHotbar(char, body.ranura, body.uid === undefined ? null : body.uid)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  if (pathname === '/api/hotbar/seleccionar' && req.method === 'POST') {
    const r = seleccionarRanura(char, body.ranura)
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }

  if (pathname === '/api/farm' && req.method === 'GET') return json(res, estadoHuerto(char))
  if (pathname === '/api/farm/plant' && req.method === 'POST') {
    const r = sembrar(char, body.parcela, body.semilla)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }
  if (pathname === '/api/farm/harvest' && req.method === 'POST') {
    const r = cosechar(char, body.parcela)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }

  // ══════════ MISIONES ══════════
  if (pathname === '/api/quests' && req.method === 'GET') {
    const status = query.status || 'available'
    if (status === 'available') {
      const accepted = (char.activeQuests || []).map(q => q.questId)
      return json(res, { quests: QUESTS.filter(q => !accepted.includes(q.id) && !char.completedQuests.includes(q.id) && char.level >= q.levelReq) })
    }
    if (status === 'active') return json(res, { quests: char.activeQuests })
    if (status === 'completed') return json(res, { quests: char.completedQuests })
    return json(res, { quests: [] })
  }

  if (pathname === '/api/quests' && req.method === 'POST') {
    const { questId, action } = body
    const q = QUESTS.find(x => x.id === questId)

    if (action === 'accept') {
      if (!q) return fail(res, 'Misión no encontrada', 404)
      if (char.level < q.levelReq) return fail(res, `Necesitas nivel ${q.levelReq}`, 403)
      if (char.completedQuests.includes(questId)) return fail(res, 'Ya completada', 409)
      if (char.activeQuests.some(a => a.questId === questId)) return fail(res, 'Ya activa', 409)
      if (char.activeQuests.length >= 10) return fail(res, 'Máximo 10 misiones activas', 400)
      char.activeQuests.push({
        questId, quest: q, status: 'ACTIVE',
        objectiveProgress: q.objectives.map(o => ({ objectiveId: o.id, current: Math.min(o.required, char.questCounters?.[o.key] || 0) })),
        startedAt: new Date().toISOString(),
      })
      step(p.username, 'first_quest_accept')
      persist()
      return json(res, { success: true })
    }

    // 'progress' queda como CONSULTA: el cliente ya no puede incrementar nada.
    if (action === 'progress') {
      const aq = char.activeQuests.find(a => a.questId === questId)
      if (!aq) return fail(res, 'Misión no activa', 404)
      return json(res, { success: true, readOnly: true, note: 'El progreso lo genera el servidor a partir de eventos reales de juego', objectiveProgress: aq.objectiveProgress })
    }

    if (action === 'turnin') {
      const idx = char.activeQuests.findIndex(a => a.questId === questId)
      if (idx === -1) return fail(res, 'Misión no activa', 404)
      const aq = char.activeQuests[idx]
      const allDone = q.objectives.every(o => (aq.objectiveProgress.find(pr => pr.objectiveId === o.id)?.current || 0) >= o.required)
      if (!allDone) return fail(res, 'Objetivos incompletos', 400)
      const rw = q.rewards[0]
      char.gold += rw.gold
      char.xp += rw.xp
      const cgrid = creditCgrid(char, rw.cgrid || 0, `quest:${q.id}`)
      if (rw.itemId) addItem(char, rw.itemId, rw.itemQty || 1)
      char.activeQuests.splice(idx, 1)
      char.completedQuests.push(questId)
      const levelUps = checkLevelUp(char)
      audit('quest_complete', char.name, { questId, gold: rw.gold, xp: rw.xp, cgrid })
      trackCurrency(char.name, 'gold', rw.gold, 'quest')
      track('quest_complete', char.name); step(p.username, 'first_quest_complete')
      persist()
      return reply({ success: true, rewards: { gold: rw.gold, xp: rw.xp, cgrid }, levelUps, newLevel: char.level })
    }
    return fail(res, 'Acción inválida')
  }

  // ══════════ CRAFTING ══════════
  if (pathname === '/api/crafting' && req.method === 'GET') {
    return json(res, { recipes: RECIPES.map(r => ({ ...r, outputItem: template(r.outputItemId), ingredients: r.ingredients.map(i => ({ ...i, item: template(i.itemId) })) })) })
  }
  if (pathname === '/api/crafting' && req.method === 'POST') {
    if (!rateLimit('craft:' + char.id, 60, 60_000)) return fail(res, 'Demasiadas fabricaciones', 429)
    const recipe = RECIPES.find(r => r.id === body.recipeId)
    if (!recipe) return fail(res, 'Receta no encontrada', 404)
    const qty = intIn(body.quantity, 1, 20, 1)
    if (char.level < recipe.levelReq) return fail(res, `Necesitas nivel ${recipe.levelReq}`, 403)
    for (const ing of recipe.ingredients) {
      if (countItem(char, ing.itemId) < ing.quantity * qty) return fail(res, `Faltan materiales: ${template(ing.itemId).name}`)
    }
    for (const ing of recipe.ingredients) removeItem(char, ing.itemId, ing.quantity * qty)
    let made = 0, failed = 0
    for (let i = 0; i < qty; i++) {
      if (Math.random() <= recipe.successRate) { addItem(char, recipe.outputItemId, recipe.outputQty); made += recipe.outputQty }
      else failed++
    }
    char.xp += recipe.xp * qty
    const levelUps = checkLevelUp(char)
    const questUpdates = made > 0 ? emitProgress(char, recipe.questKey, made) : []
    char.objetosFabricados = (char.objetosFabricados || 0) + made
    audit('craft', char.name, { recipe: recipe.id, made, failed })
    track('craft', char.name); step(p.username, 'first_craft')
    persist()
    return reply({ success: true, made, failed, levelUps, questUpdates, message: `Creaste: ${template(recipe.outputItemId).name} ×${made}${failed ? ` (${failed} intento(s) fallido(s))` : ''}` })
  }

  // ══════════ PvP ══════════
  if (pathname === '/api/pvp/match' && req.method === 'POST') {
    const r = runPvpMatch(char, body.wagerGold)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }
  // Compatibilidad: el endpoint antiguo YA NO acepta el resultado del cliente
  if (pathname === '/api/pvp/result' && req.method === 'POST') {
    if (body.cgridBet) audit('pvp_cgrid_bet_rejected', char.name, { cgridBet: body.cgridBet })
    const r = runPvpMatch(char, body.goldBet)
    if (r.error) return fail(res, r.error, r.code)
    return reply({ ...r, deprecated: true, note: 'El resultado ahora lo calcula el servidor; las apuestas de CGRID están deshabilitadas.' })
  }

  // ══════════ MERCADO ══════════
  if (pathname === '/api/market' && req.method === 'GET') {
    const listings = store.marketListings.filter(l => l.status === 'ACTIVE')
    return json(res, { listings, total: listings.length, page: 1, pages: 1 })
  }
  if (pathname === '/api/market' && req.method === 'POST') {
    if (!rateLimit('mkt:' + char.id, 30, 60_000)) return fail(res, 'Demasiadas publicaciones', 429)
    const r = createListing(char, body.itemId, body.quantity, body.pricePerUnit)
    if (r.error) return fail(res, r.error, r.code)
    return reply({ listing: r.listing }, 201)
  }
  const buyMatch = pathname.match(/^\/api\/market\/([A-Za-z0-9_]+)\/buy$/)
  if (buyMatch && req.method === 'POST') {
    if (!rateLimit('buy:' + char.id, 60, 60_000)) return fail(res, 'Demasiadas compras', 429)
    const r = buyListing(char, buyMatch[1], body.quantity || 1)
    if (r.error) return fail(res, r.error, r.code)
    return reply(r)
  }
  const cancelMatch = pathname.match(/^\/api\/market\/([A-Za-z0-9_]+)\/cancel$/)
  if (cancelMatch && req.method === 'POST') {
    const r = cancelListing(char, cancelMatch[1])
    if (r.error) return fail(res, r.error, r.code)
    return json(res, r)
  }
  if (pathname === '/api/market/history' && req.method === 'GET') {
    return json(res, { transactions: store.marketTransactions.slice(-50).reverse() })
  }

  // ══════════ GREMIOS ══════════
  if (pathname === '/api/guilds' && req.method === 'GET') {
    return json(res, { guilds: Object.values(store.guilds).map(guildPublic) })
  }
  if (pathname === '/api/guilds' && req.method === 'POST') {
    const { action, guildId, name, emblem, description, amount } = body

    if (action === 'create') {
      if (!isStr(name, 3, 32)) return fail(res, 'Nombre inválido (3-32 caracteres)')
      if (char.guildId) return fail(res, 'Ya perteneces a un gremio', 409)
      if (Object.values(store.guilds).some(g => g.name.toLowerCase() === name.toLowerCase())) return fail(res, 'Nombre en uso', 409)
      if (!burnGold(char, GUILD_CREATE_COST, 'guild_create')) return fail(res, `Necesitas ${GUILD_CREATE_COST} de oro`)
      const g = {
        id: nextId('g'), name: sanitize(name), tag: '[' + sanitize(name).slice(0, 3).toUpperCase() + ']',
        emblem: isStr(emblem, 1, 4) ? emblem : '🛡️', desc: sanitize(String(description || '').slice(0, 200)),
        leader: char.name, level: 1, xp: 0, maxMembers: 20,
        members: [{ name: char.name, role: 'LEADER', joinedAt: new Date().toISOString() }],
        treasury: { gold: 0, cgrid: 0 }, wins: 0, losses: 0, draws: 0, founded: today(),
      }
      store.guilds[g.id] = g
      char.guildId = g.id; char.guildName = g.name
      audit('guild_create', char.name, { guildId: g.id })
      persist()
      return reply({ success: true, guild: guildPublic(g) }, 201)
    }

    if (action === 'join') {
      const g = store.guilds[guildId]
      if (!g) return fail(res, 'Gremio no encontrado', 404)
      if (char.guildId) return fail(res, 'Ya perteneces a un gremio', 409)
      if (g.members.length >= g.maxMembers) return fail(res, 'Gremio lleno', 409)
      g.members.push({ name: char.name, role: 'MEMBER', joinedAt: new Date().toISOString() })
      char.guildId = g.id; char.guildName = g.name
      persist()
      return json(res, { success: true, guildId: g.id })
    }

    if (action === 'leave') {
      const g = store.guilds[char.guildId]
      if (!g) { char.guildId = null; char.guildName = null; return json(res, { success: true }) }
      if (guildRole(g, char) === 'LEADER' && g.members.length > 1) return fail(res, 'Transfiere el liderazgo antes de salir', 409)
      g.members = g.members.filter(m => m.name !== char.name)
      if (!g.members.length && !g.npc) delete store.guilds[g.id]
      char.guildId = null; char.guildName = null
      persist()
      return json(res, { success: true })
    }

    if (action === 'donate') {
      const g = store.guilds[char.guildId]
      if (!g) return fail(res, 'No perteneces a un gremio', 403)
      const amt = intIn(amount, 1, 1_000_000)
      if (!amt) return fail(res, 'Cantidad inválida')
      if (char.gold < amt) return fail(res, 'Oro insuficiente')
      char.gold -= amt
      g.treasury.gold += amt
      g.xp += Math.floor(amt / 100)
      while (g.xp >= g.level * 1000) { g.xp -= g.level * 1000; g.level += 1; g.maxMembers += 1 }
      audit('guild_donate', char.name, { guildId: g.id, amount: amt })
      persist()
      return reply({ success: true, treasury: g.treasury, level: g.level, newGold: char.gold })
    }

    if (action === 'kick') {
      const g = store.guilds[char.guildId]
      if (!g) return fail(res, 'No perteneces a un gremio', 403)
      const role = guildRole(g, char)
      if (GUILD_ROLES[role] < GUILD_ROLES.OFFICER) return fail(res, 'Sin permisos', 403)
      const target = g.members.find(m => m.name === body.target)
      if (!target) return fail(res, 'Miembro no encontrado', 404)
      if (GUILD_ROLES[target.role] >= GUILD_ROLES[role]) return fail(res, 'No puedes expulsar a ese miembro', 403)
      g.members = g.members.filter(m => m.name !== body.target)
      const tp = store.players[body.target]
      if (tp) { tp.character.guildId = null; tp.character.guildName = null }
      audit('guild_kick', char.name, { guildId: g.id, target: body.target })
      persist()
      return json(res, { success: true })
    }
    return fail(res, 'Acción inválida')
  }

  // ══════════ CHAT ══════════
  if (pathname === '/api/chat' && req.method === 'GET') return json(res, { messages: store.chatMessages.slice(-30) })
  if (pathname === '/api/chat' && req.method === 'POST') {
    if (p.muteUntil > now()) return fail(res, 'Estás silenciado', 403)
    if (!rateLimit('chat:' + char.id, 8, 20_000)) return fail(res, 'Demasiados mensajes. Espera unos segundos.', 429)
    const msg = pushChatMessage(char, body.message || '', body.channel)
    if (!msg) return fail(res, 'Mensaje vacío o repetido')
    // Los que estén conectados por WebSocket lo reciben al instante;
    // los que sigan sondeando lo verán en su próxima consulta.
    wsBroadcast({ type: 'chat', message: msg })
    return json(res, { message: msg }, 201)
  }

  if (pathname === '/api/online' && req.method === 'GET') {
    return json(res, { online: wsOnline(), total: wsOnline().length })
  }

  // ══════════ CASA ══════════
  if (pathname === '/api/house' && req.method === 'GET') {
    char.house = char.house || { level: 1, placed: [], owned: [] }
    char.house.owned = char.house.owned || []
    return json(res, { house: char.house, gold: char.gold })
  }
  if (pathname === '/api/house' && req.method === 'POST') {
    const { action, placed, furnitureId } = body
    char.house = char.house || { level: 1, placed: [] }
    // Catálogo autoritativo de mobiliario (precio SIEMPRE del servidor)
    const FURNITURE = {
      bed: 80, table: 60, fireplace: 150, chest: 200, shelf: 100, carpet: 40,
      crafting_table: 350, alchemy_lab: 400, kitchen: 300,
      trophy: 500, painting: 120, statue: 800, garden: 600,
      fountain: 2000, vault: 5000, throne: 10000, dungeon_portal: 15000,
    }
    if (action === 'save') {
      if (!Array.isArray(placed) || placed.length > 200) return fail(res, 'Diseño inválido')
      // solo se guardan muebles ya comprados
      const owned = new Set(char.house.owned || [])
      char.house.placed = placed.filter(x => owned.has(x.furnitureId || x.id))
      persist()
      return json(res, { success: true, placed: char.house.placed })
    }
    if (action === 'buy') {
      const cost = FURNITURE[furnitureId]           // PRECIO DEL SERVIDOR, no del cliente
      if (cost === undefined) return fail(res, 'Mueble desconocido', 404)
      if (!burnGold(char, cost, 'furniture')) return fail(res, 'Oro insuficiente')
      char.house.owned = char.house.owned || []
      char.house.owned.push(furnitureId)
      if (Array.isArray(body.placed) && body.placed.length <= 200) {
        const owned = new Set(char.house.owned)
        char.house.placed = body.placed.filter(x => owned.has(x.furnitureId || x.id))
      }
      persist()
      return reply({ success: true, newGold: char.gold, owned: char.house.owned, cost: cost, placed: char.house.placed })
    }
    if (action === 'upgrade') {
      const cost = char.house.level * 2000
      if (!burnGold(char, cost, 'house_upgrade')) return fail(res, `Necesitas ${cost} de oro`)
      char.house.level += 1
      persist()
      return reply({ success: true, newLevel: char.house.level, newGold: char.gold })
    }
    return fail(res, 'Acción inválida')
  }

  // ══════════ CATÁLOGOS / INFO ══════════
  if (pathname === '/api/monsters' && req.method === 'GET') {
    return json(res, { monsters: Object.values(MONSTERS).map(m => ({ id: m.id, name: m.name, icon: m.icon, level: m.level, hp: m.hp, attackMin: m.atk[0], attackMax: m.atk[1], defense: m.def, xpReward: m.xp, goldMin: m.gold[0], goldMax: m.gold[1], zone: m.zone, element: m.element, isBoss: !!m.isBoss })) })
  }
  if (pathname === '/api/npcs' && req.method === 'GET') return json(res, { npcs: NPCS })
  if (pathname === '/api/leaderboard' && req.method === 'GET') {
    const players = Object.values(store.players).map(x => ({
      name: x.character.name, level: x.character.level, gold: x.character.gold,
      monstersKilled: x.character.monstersKilled, pvpRating: x.character.pvpRating,
    })).sort((a, b) => b.level - a.level || b.monstersKilled - a.monstersKilled)
    return json(res, { leaderboard: players.slice(0, 20) })
  }
  if (pathname === '/api/economy' && req.method === 'GET') {
    rollDay()
    return json(res, {
      day: store.economy.day,
      cgrid: { emittedToday: store.economy.cgridEmitted, dailyGlobalCap: ECONOMY.CGRID_DAILY_GLOBAL_CAP, dailyPlayerCap: ECONOMY.CGRID_DAILY_PLAYER_CAP },
      goldBurnedToday: store.economy.goldBurned, marketFee: ECONOMY.MARKET_FEE,
    })
  }
  if (pathname === '/api/web3/status' && req.method === 'GET') {
    return json(res, {
      onChain: false,
      network: null,
      message: 'CGRID y los objetos son actualmente saldos OFF-CHAIN dentro del juego. No existe token ni NFT desplegado todavía. La integración on-chain se hará primero en testnet (Polygon Amoy).',
      plannedContracts: { CGRID: 'ERC-20 (pendiente)', items: 'ERC-1155 (pendiente, solo objetos seleccionados)', unique: 'ERC-721 (pendiente)' },
      walletLinked: !!char?.wallet,
    })
  }
  if (pathname === '/api/economy/public' && req.method === 'GET') {
    return json(res, publicEconomyReport())
  }
  if (pathname === '/api/health' && req.method === 'GET') {
    return json(res, { ok: true, tlsDetectado: peticionSegura(req), players: Object.keys(store.players).length, battles: Object.keys(store.battles).length, uptime: Math.floor(process.uptime()), env: NODE_ENV })
  }

  // ══════════ WALLET (vinculación por firma, opcional) ══════════
  if (pathname === '/api/wallet/nonce' && req.method === 'POST') {
    const addr = String(body.address || '')
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return fail(res, 'Dirección inválida')
    char.walletNonce = { address: addr.toLowerCase(), nonce: crypto.randomBytes(16).toString('hex'), at: now() }
    return json(res, { message: `CriptoMundo: vincula esta wallet a ${char.name}. Nonce: ${char.walletNonce.nonce}` })
  }
  if (pathname === '/api/wallet/link' && req.method === 'POST') {
    // La verificación real de firma requiere ethers.js (ver docs/PLAN_VERTICAL_SLICE.md).
    return fail(res, 'Vinculación de wallet pendiente de la fase Web3 (requiere verificación de firma con ethers.js). No se aceptan vinculaciones sin firma verificada.', 501)
  }

  return fail(res, `Endpoint no encontrado: ${pathname}`, 404)
}

// ── Vista pública del personaje (nunca se filtran hashes ni internals)
function publicChar(c) {
  if (!c) return null
  const st = effectiveStats(c)
  return {
    id: c.id, name: c.name, class: c.class, level: c.level, xp: c.xp, xpToNext: c.xpToNext,
    hp: c.hp, maxHp: st.maxHp, mp: c.mp, maxMp: st.maxMp,
    gold: c.gold, cgrid: c.cgrid, cgridOnChain: false,
    pvpRating: c.pvpRating, pvpWins: c.pvpWins, pvpLosses: c.pvpLosses,
    strength: st.strength, intelligence: st.intelligence, agility: st.agility, defense: st.defense,
    monstersKilled: c.monstersKilled, bossesKilled: c.bossesKilled, dungeonsCleared: c.dungeonsCleared,
    inventory: c.inventory, equipment: c.equipment || {}, skills: c.skills,
    activeQuests: c.activeQuests, completedQuests: c.completedQuests,
    guildId: c.guildId, guildName: c.guildName, house: c.house, zonesVisited: c.zonesVisited,
    appearance: c.appearance || { skinId: DEFAULT_SKIN, palette: {} },
    efectos: efectosActivos(c),
  }
}
function feedMessage(a) {
  switch (a.type) {
    case 'combat_win': return `${a.actor} derrotó a ${MONSTERS[a.data.monster]?.name || 'un enemigo'}`
    case 'market_buy': return `${a.actor} compró ${a.data.quantity}× ${template(a.data.itemId)?.name || 'objeto'} por 🪙${a.data.total}`
    case 'mazmorra_fin': return `${a.actor} salió de ${(MAZMORRAS[a.data.mazmorra] || {}).nombre || 'una mazmorra'}`
    case 'quest_complete': return `${a.actor} completó una misión`
    case 'arena_fin': return `${a.actor} ${a.data.motivo === 'victoria' ? 'ganó' : 'cayó en'} la arena (${a.data.bajas} bajas)`
    case 'pvp_match': return `${a.actor} ${a.data.result === 'win' ? 'venció a' : 'cayó ante'} ${a.data.opponent}`
    default: return `${a.actor}: ${a.type}`
  }
}

// ── Arranque ───────────────────────────────────────────────────────
const loaded = loadSnapshot()
seedMarket()
seedGuilds()

// Avisos de configuración: lo que falta para poder salir a producción
function configWarnings() {
  const w = []
  if (IS_PROD && !ALLOWED_ORIGINS.length) w.push('ALLOWED_ORIGINS vacío: solo se aceptará el mismo origen.')
  if (!ADMIN_TOKEN) w.push('ADMIN_TOKEN sin definir: el panel /admin.html no es accesible.')
  if (IS_PROD && !process.env.DATA_FILE) w.push('DATA_FILE sin definir: los datos se guardan junto al ejecutable.')
  if (!IS_PROD) w.push('NODE_ENV no es production: las cookies van sin Secure y los errores muestran detalle.')
  return w
}

const HOST = process.env.HOST || '0.0.0.0'

server.listen(PORT, HOST, () => {
  const line = '═'.repeat(58)
  console.log('\n' + line)
  console.log(`  🎮  CRIPTOMUNDO v${VERSION} — servidor con autoridad del servidor`)
  console.log(line)
  console.log(`\n  ✅  Activo en   http://localhost:${PORT}   (escuchando en ${HOST})`)
  console.log(`  🔐  Contraseñas scrypt+salt · sesiones de 32 bytes aleatorios`)
  console.log(`  🗄️   Datos       ${DATA_FILE} ${loaded ? '(cargados)' : '(nuevo)'}`)
  console.log(`  🖼️   Assets      ${ASSETS_DIR}`)
  console.log(`  🌐  Entorno     ${NODE_ENV} · CORS: ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : 'solo mismo origen'}`)
  console.log(`  ⛓️   CGRID       OFF-CHAIN, sin contrato desplegado (/api/web3/status)`)
  console.log(`  📊  Analítica   ${ADMIN_TOKEN ? '/admin.html · protegida por ADMIN_TOKEN' : 'sin ADMIN_TOKEN → /admin.html cerrado'}`)
  console.log(`  📈  Economía    /economia.html (pública, sin datos personales)`)
  console.log(`  ⚡  Tiempo real WebSocket en /ws para chat y presencia`)
  console.log(`  ✉️   Registro     ${INVITE_ONLY ? 'SOLO CON INVITACIÓN (INVITE_ONLY=1)' : 'abierto a cualquiera'}`)

  const warns = configWarnings()
  if (warns.length) {
    console.log('\n  ⚠️  Avisos de configuración:')
    for (const w of warns) console.log(`      · ${w}`)
  }
  console.log('\n  Herramientas:  node doctor.js  ·  node simular-jugadores.js\n')
  console.log(line + '\n')
})

// WebSocket: chat y presencia en tiempo real
server.on('upgrade', (req, socket, head) => wsUpgrade(req, socket, head))

server.on('error', err => {
  if (err.code === 'EADDRINUSE') console.error(`\n❌ El puerto ${PORT} está ocupado. Prueba: PORT=3001 node criptomundo.js\n`)
  else if (err.code === 'EACCES') console.error(`\n❌ Sin permiso para el puerto ${PORT}. Usa uno por encima de 1024.\n`)
  else console.error(err)
  process.exit(1)
})

// Apagado ordenado: se vuelca el estado antes de salir
let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n${signal} recibido. Guardando estado…`)
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  try {
    writeSnapshot(snapshotOf())
    console.log('Estado guardado. Hasta luego.')
  } catch (e) {
    console.error('No se pudo guardar el estado:', e.message)
  }
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref?.()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', err => {
  console.error('Excepción no capturada:', err)
  shutdown('uncaughtException')
})
