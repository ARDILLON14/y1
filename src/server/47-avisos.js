
// ═══════════════════════════════════════════════════════════════════
//  AVISOS DE LOS JUGADORES
//
//  Para qué: cuando alguien encuentre un fallo en la beta, lo va a
//  contar por Discord con la mitad del contexto ("no me funcionaba el
//  mercado, creo"). Este endpoint recoge el aviso con lo que importa
//  ya adjunto: página, versión, nivel del personaje y navegador.
//
//  Deliberadamente simple: un texto y su contexto. Sin categorías ni
//  campos obligatorios, porque un formulario largo no lo rellena nadie.
// ═══════════════════════════════════════════════════════════════════
store.feedback = store.feedback || []

const FEEDBACK_MAX = 500
const FEEDBACK_TIPOS = ['fallo', 'idea', 'otro']

function guardarAviso(player, body, req) {
  const texto = String(body.texto || '').trim().slice(0, 1500)
  if (texto.length < 3) return { error: 'Escribe algo más', code: 400 }

  const aviso = {
    id: nextId('fb'),
    tipo: FEEDBACK_TIPOS.includes(body.tipo) ? body.tipo : 'otro',
    texto: sanitize(texto),
    // Contexto que el jugador no tendría que escribir a mano
    pagina: sanitize(String(body.pagina || '').slice(0, 120)),
    version: VERSION,
    jugador: player ? sanitize(player.username) : null,
    nivel: player ? player.character.level : null,
    navegador: sanitize(String(req.headers['user-agent'] || '').slice(0, 200)),
    pantalla: sanitize(String(body.pantalla || '').slice(0, 20)),
    at: new Date().toISOString(),
    resuelto: false,
  }

  store.feedback.push(aviso)
  if (store.feedback.length > FEEDBACK_MAX) store.feedback.splice(0, 100)
  audit('feedback', aviso.jugador || 'anónimo', { tipo: aviso.tipo, id: aviso.id })
  persist()
  return { success: true, id: aviso.id }
}

function listarAvisos() {
  const porTipo = {}
  for (const a of store.feedback) porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1
  return {
    total: store.feedback.length,
    sinResolver: store.feedback.filter(a => !a.resuelto).length,
    porTipo,
    avisos: store.feedback.slice().reverse(),
  }
}

function marcarResuelto(id, resuelto) {
  const a = store.feedback.find(x => x.id === id)
  if (!a) return { error: 'Aviso no encontrado', code: 404 }
  a.resuelto = resuelto !== false
  persist()
  return { success: true, aviso: a }
}
