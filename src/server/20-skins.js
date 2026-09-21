
// ═══════════════════════════════════════════════════════════════════
//  APARIENCIA Y SKINS
//
//  CÓMO AÑADIR UNA SKIN NUEVA (a propósito, es una sola entrada):
//    1. Copia el PNG a la carpeta ./assets/skins/
//    2. Añade un objeto a SKINS con su id, nombre, archivo y colores.
//    3. Ya está. Aparece en el creador de personaje y en /api/skins.
//
//  Campos:
//    id        identificador único y estable (no lo cambies nunca)
//    name      nombre visible
//    lore      una línea de descripción
//    file      ilustración grande dentro de ./assets/skins/ (o null → emoji)
//    portrait  recorte cuadrado del rostro (creador, perfil). Opcional.
//    avatar    versión pequeña para la barra superior. Opcional.
//    sprites   animaciones: { walk: { file, frames, ancho, alto } }. Opcional.
//    emoji     representación de respaldo si falta el archivo
//    palette   colores por defecto del personalizador
//    unlock    'default' (todos) | 'level:N' | 'locked' (todavía no obtenible)
//    tint      si true, el personalizador permite recolorear
// ═══════════════════════════════════════════════════════════════════
const SKINS = [
  {
    id: 'aventurero', name: 'Aventurero', lore: 'El aspecto clásico de Valdris.',
    file: null, emoji: '🧝', unlock: 'default', tint: true,
    palette: { skin: '#E8C39E', hair: '#4A3020', outfit: '#5A4A8A', accent: '#C8A84B' },
  },
  {
    id: 'guerrera', name: 'Guerrera de Hierro', lore: 'Armadura pesada y pocas palabras.',
    file: null, emoji: '🛡️', unlock: 'default', tint: true,
    palette: { skin: '#D8A882', hair: '#2A2A2A', outfit: '#6A6A72', accent: '#B04030' },
  },
  {
    id: 'hechicero', name: 'Hechicero Arcano', lore: 'Estudió demasiado y ahora le sale humo.',
    file: null, emoji: '🧙', unlock: 'default', tint: true,
    palette: { skin: '#E8C39E', hair: '#D8D8D8', outfit: '#3A2A6A', accent: '#A335EE' },
  },
  {
    id: 'sombra', name: 'Sombra Errante', lore: 'Nadie recuerda haberla visto llegar.',
    file: null, emoji: '🥷', unlock: 'default', tint: true,
    palette: { skin: '#C89A76', hair: '#1A1A1A', outfit: '#1E1E28', accent: '#30C060' },
  },
  // ── Skins de personaje ilustrado ────────────────────────────────
  {
    id: 'stone_pepe', name: 'Stone Pepe', fondoOpaco: true, lore: 'The Eternal Chad. Mármol, laurel y cero dudas.',
    file: 'stone_pepe_full.png', portrait: 'stone_pepe_portrait.png', avatar: 'stone_pepe_avatar.png',
    emoji: '🗿', unlock: 'default', tint: false,
    palette: { skin: '#EFE4CE', hair: '#E8D9B8', outfit: '#FFFFFF', accent: '#D4A017' },
  },
  {
    id: 'holy_pepe', name: 'Holy Pepe', fondoOpaco: true, lore: 'The Meme Savior. Flota, sana y perdona el gas fee.',
    file: 'holy_pepe_full.png', portrait: 'holy_pepe_portrait.png', avatar: 'holy_pepe_avatar.png',
    emoji: '😇', unlock: 'default', tint: false,
    palette: { skin: '#5A9A3A', hair: '#3A7A2A', outfit: '#F0E8D0', accent: '#F0D070' },
  },
  {
    id: 'laurel_possum', name: 'Zarigüeya Laureada', lore: 'Pequeña, oportunista y coronada. Se hace la muerta y luego te roba el oro.',
    file: 'laurel_possum_full.png', portrait: 'laurel_possum_portrait.png', avatar: 'laurel_possum_avatar.png',
    emoji: '🐀', unlock: 'default', tint: false,
    palette: { skin: '#8C8378', hair: '#5A544C', outfit: '#F2E7DA', accent: '#E8B23A' },
    // Primera skin con animación: tira de 3 fotogramas de 140×70.
    // El resto sigue funcionando igual; este campo es opcional.
    sprites: { walk: { file: 'laurel_possum_walk.png', frames: 3, ancho: 140, alto: 70 } },
  },
]


// ── Validación de skins al arrancar ────────────────────────────────
// Antes se ofrecían skins sin comprobar nada: si un archivo faltaba o
// una tira de animación no cuadraba con los fotogramas declarados, el
// personaje aparecía como un cuadro o el mapa se quedaba clavado. Lo
// que no pasa esta comprobación NO se ofrece: mejor una skin menos que
// una skin rota.

// Lee ancho y alto de un PNG sin dependencias: van en el bloque IHDR,
// en los bytes 16..24 de la cabecera.
function medidasPng(archivo) {
  const fd = fs.openSync(archivo, 'r')
  try {
    const buf = Buffer.alloc(24)
    if (fs.readSync(fd, buf, 0, 24, 0) < 24) return null
    if (buf.toString('ascii', 1, 4) !== 'PNG') return null
    return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) }
  } catch { return null } finally { fs.closeSync(fd) }
}

function validarSkins() {
  const problemas = []
  for (const s of SKINS) {
    const fallos = []
    for (const campo of ['file', 'portrait', 'avatar']) {
      if (!s[campo]) continue
      const ruta = path.join(ASSETS_DIR, 'skins', s[campo])
      if (!fs.existsSync(ruta)) { fallos.push(`falta ${s[campo]}`); continue }
      const m = medidasPng(ruta)
      if (!m) fallos.push(`${s[campo]} no es un PNG válido`)
      else if (m.ancho < 16 || m.alto < 16) fallos.push(`${s[campo]} es demasiado pequeño`)
    }
    // La tira de animación debe cuadrar EXACTAMENTE con lo declarado:
    // si no, el motor dibuja recortes con trozos de otros fotogramas.
    const w = s.sprites && s.sprites.walk
    if (w) {
      const ruta = path.join(ASSETS_DIR, 'skins', w.file)
      const m = fs.existsSync(ruta) ? medidasPng(ruta) : null
      if (!m) fallos.push(`falta la tira ${w.file}`)
      else if (m.ancho !== w.ancho * w.frames || m.alto !== w.alto) {
        fallos.push(`la tira ${w.file} mide ${m.ancho}x${m.alto} y se declaró ${w.ancho * w.frames}x${w.alto}`)
      }
    }
    if (fallos.length) { s.rota = true; problemas.push(`${s.id}: ${fallos.join(', ')}`) }
  }
  if (problemas.length) {
    console.error('\n⚠️  Skins retiradas por estar rotas:')
    for (const p of problemas) console.error('    · ' + p)
    console.error('')
  }
  return problemas
}

validarSkins()

// Solo entran al catálogo las skins que superaron la validación
const SKIN_IDS = new Set(SKINS.filter(s => !s.rota).map(s => s.id))
const DEFAULT_SKIN = 'aventurero'
const HEX_RE = /^#[0-9a-fA-F]{6}$/
const PALETTE_KEYS = ['skin', 'hair', 'outfit', 'accent']

function skinById(id) { return SKINS.find(s => s.id === id && !s.rota) || null }

function skinUnlocked(skin, char) {
  if (!skin) return false
  if (skin.unlock === 'default') return true
  if (skin.unlock === 'locked') return false
  const m = /^level:(\d+)$/.exec(skin.unlock || '')
  if (m) return (char?.level || 1) >= Number(m[1])
  return false
}

// Devuelve una apariencia válida a partir de lo que mande el cliente.
// Nunca confía en el cuerpo de la petición: recorta y sustituye.
function sanitizeAppearance(input, char) {
  const out = { skinId: DEFAULT_SKIN, palette: {}, title: null }
  const req = input && typeof input === 'object' ? input : {}
  // El personaje subido por el jugador es una skin más, pero solo
  // existe si de verdad tiene una imagen guardada.
  if (req.skinId === 'propio' && char && char.personajePropio) {
    return { skinId: 'propio', palette: {}, title: null }
  }
  const skin = SKIN_IDS.has(req.skinId) ? skinById(req.skinId) : skinById(DEFAULT_SKIN)
  out.skinId = skinUnlocked(skin, char) ? skin.id : DEFAULT_SKIN
  const base = skinById(out.skinId)
  for (const k of PALETTE_KEYS) {
    const v = req.palette && req.palette[k]
    out.palette[k] = (base.tint && typeof v === 'string' && HEX_RE.test(v)) ? v : base.palette[k]
  }
  return out
}

function skinPublic(s, char) {
  return {
    id: s.id, name: s.name, lore: s.lore, emoji: s.emoji,
    image: s.file ? `/assets/skins/${s.file}` : null,
    // Variantes ligeras: si no existen se cae a la imagen grande
    portrait: s.portrait ? `/assets/skins/${s.portrait}` : (s.file ? `/assets/skins/${s.file}` : null),
    avatar: s.avatar ? `/assets/skins/${s.avatar}` : (s.portrait ? `/assets/skins/${s.portrait}` : (s.file ? `/assets/skins/${s.file}` : null)),
    palette: s.palette, tint: !!s.tint, unlock: s.unlock,
    // Las ilustraciones con fondo opaco se ven como un cuadro si se
    // dibujan sobre el mundo: en el mapa se usa el emoji.
    usableEnMapa: !s.fondoOpaco,
    sprites: s.sprites
      ? Object.fromEntries(Object.entries(s.sprites).map(([k, v]) => [k, { ...v, url: `/assets/skins/${v.file}` }]))
      : null,
    unlocked: skinUnlocked(s, char),
  }
}
