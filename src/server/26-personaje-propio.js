
// ═══════════════════════════════════════════════════════════════════
//  PERSONAJE PROPIO
//
//  Permite subir una imagen y usarla como personaje. El problema que
//  hay que evitar está claro por experiencia propia: en la v10 metimos
//  dos ilustraciones con el fondo incrustado y el personaje se veía
//  como un cuadro sobre el mapa. Con imágenes de desconocidos eso
//  pasaría siempre.
//
//  Por eso el recorte a círculo con fondo transparente lo hace el
//  navegador ANTES de subir (ver la página de perfil), y aquí se
//  comprueba que lo que llega es de verdad lo que se pidió:
//
//    · PNG auténtico (se miran los bytes, no la extensión ni el
//      nombre que diga el cliente)
//    · dimensiones dentro de rango y cuadrada
//    · peso máximo
//    · una imagen por jugador; subir otra sustituye la anterior
//
//  Si algo no cuadra, se rechaza con un motivo concreto y el jugador
//  se queda con la skin que tuviera. Nunca se guarda a medias.
// ═══════════════════════════════════════════════════════════════════

const SUBIDA_MAX_BYTES = 512 * 1024      // medio mega ya recortado
const SUBIDA_MIN_PX = 48
const SUBIDA_MAX_PX = 512
const DIR_PROPIOS = path.join(ASSETS_DIR, 'propios')

// Firma PNG: 8 bytes fijos. Es lo que distingue un PNG de un archivo
// renombrado a .png, que es el truco más viejo del mundo.
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function validarPng(buf) {
  if (buf.length < 24) return { error: 'El archivo está incompleto' }
  if (!buf.subarray(0, 8).equals(FIRMA_PNG)) return { error: 'Solo se aceptan imágenes PNG' }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return { error: 'El PNG está corrupto' }
  const ancho = buf.readUInt32BE(16)
  const alto = buf.readUInt32BE(20)
  if (ancho < SUBIDA_MIN_PX || alto < SUBIDA_MIN_PX) return { error: `Mínimo ${SUBIDA_MIN_PX}×${SUBIDA_MIN_PX} píxeles` }
  if (ancho > SUBIDA_MAX_PX || alto > SUBIDA_MAX_PX) return { error: `Máximo ${SUBIDA_MAX_PX}×${SUBIDA_MAX_PX} píxeles` }
  if (ancho !== alto) return { error: 'La imagen debe ser cuadrada' }
  // El canal alfa está en el byte 25 (color type 6 = RGBA, 4 = gris+alfa).
  // Sin transparencia el personaje se vería como un cuadrado en el mapa.
  const tipoColor = buf[25]
  if (tipoColor !== 6 && tipoColor !== 4) return { error: 'La imagen debe tener transparencia (se recorta en el navegador)' }
  return { ancho, alto }
}

function guardarPersonajePropio(player, dataUrl) {
  const char = player.character
  if (typeof dataUrl !== 'string') return { error: 'No llegó ninguna imagen', code: 400 }

  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim())
  if (!m) return { error: 'Formato no admitido: debe ser un PNG', code: 400 }

  let buf
  try { buf = Buffer.from(m[1], 'base64') } catch { return { error: 'La imagen no se pudo leer', code: 400 } }
  if (buf.length > SUBIDA_MAX_BYTES) {
    return { error: `La imagen pesa ${Math.round(buf.length / 1024)} KB y el máximo son ${SUBIDA_MAX_BYTES / 1024} KB`, code: 413 }
  }

  const v = validarPng(buf)
  if (v.error) return { error: v.error, code: 400 }

  try {
    fs.mkdirSync(DIR_PROPIOS, { recursive: true })
    // Nombre derivado del contenido: subir dos veces lo mismo no
    // acumula archivos, y el nombre no depende de nada que mande el
    // cliente (que podría intentar meter rutas dentro).
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)
    const archivo = `${player.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${hash}.png`
    const destino = path.join(DIR_PROPIOS, archivo)
    if (!destino.startsWith(DIR_PROPIOS)) return { error: 'Ruta inválida', code: 400 }

    // Se escribe temporal y se renombra, como el resto de escrituras:
    // así nunca queda un PNG a medias que rompa la pantalla.
    const tmp = destino + '.tmp'
    fs.writeFileSync(tmp, buf)
    fs.renameSync(tmp, destino)

    // Borrar la anterior para no dejar basura acumulándose
    const previo = char.personajePropio && char.personajePropio.archivo
    if (previo && previo !== archivo) {
      try { fs.unlinkSync(path.join(DIR_PROPIOS, previo)) } catch {}
    }

    char.personajePropio = {
      archivo, ancho: v.ancho, alto: v.alto,
      bytes: buf.length, subidoEn: new Date().toISOString(),
    }
    char.appearance = char.appearance || {}
    char.appearance.skinId = 'propio'
    audit('personaje_propio', char.name, { archivo, bytes: buf.length, medidas: `${v.ancho}x${v.alto}` })
    persist()
    return { success: true, personaje: skinPropiaDe(char) }
  } catch (e) {
    console.error('[subida]', e.message)
    return { error: 'No se pudo guardar la imagen', code: 500 }
  }
}

function quitarPersonajePropio(player) {
  const char = player.character
  if (!char.personajePropio) return { error: 'No tienes ningún personaje subido', code: 404 }
  try { fs.unlinkSync(path.join(DIR_PROPIOS, char.personajePropio.archivo)) } catch {}
  char.personajePropio = null
  if (char.appearance && char.appearance.skinId === 'propio') {
    char.appearance = sanitizeAppearance({ skinId: DEFAULT_SKIN }, char)
  }
  persist()
  return { success: true, appearance: char.appearance }
}

// Se presenta como una skin más para que el resto del juego (creador,
// perfil, barra superior, mapa) no necesite saber que es especial.
function skinPropiaDe(char) {
  if (!char || !char.personajePropio) return null
  const url = `/assets/propios/${char.personajePropio.archivo}`
  return {
    id: 'propio', name: 'Mi personaje', lore: 'La imagen que subiste, recortada en círculo.',
    emoji: '🖼️', image: url, portrait: url, avatar: url,
    palette: {}, tint: false, unlock: 'default', unlocked: true,
    usableEnMapa: true, sprites: null, propia: true,
    subidoEn: char.personajePropio.subidoEn,
  }
}
