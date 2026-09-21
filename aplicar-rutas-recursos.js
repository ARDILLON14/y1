#!/usr/bin/env node
/**
 * Rutas del módulo de recursos del mundo y de la hotbar.
 * Se enganchan junto a /api/gather para que todo lo de recolectar
 * quede en el mismo sitio del router.
 */
const fs = require('fs')
const path = require('path')
const p = path.join(__dirname, 'src', 'server', '60-http.js')
let s = fs.readFileSync(p, 'utf8')

const ancla = `  if (pathname === '/api/farm' && req.method === 'GET') return json(res, estadoHuerto(char))`

const nuevo = `  // ══════════ RECURSOS DEL MUNDO (talar / picar) ══════════
  // El huerto de más abajo sigue igual: esto va en paralelo (§7).
  if (pathname === '/api/recursos' && req.method === 'GET') {
    return json(res, {
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
  if (pathname === '/api/recursos/golpear' && req.method === 'POST') {
    // Un golpe por petición. El límite corta el clic automático.
    if (!rateLimit('golpe:' + char.id, 180, 60_000)) return fail(res, 'Demasiado rápido', 429)
    const r = golpearRecurso(char, body.nodoId)
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

  if (pathname === '/api/farm' && req.method === 'GET') return json(res, estadoHuerto(char))`

if (s.includes("'/api/recursos/golpear'")) {
  console.log('  ·  rutas ya estaban')
} else if (!s.includes(ancla)) {
  console.log('  ❌ no se encontró el ancla en 60-http.js')
  process.exit(1)
} else {
  fs.writeFileSync(p, s.replace(ancla, nuevo), 'utf8')
  console.log('  ✅ rutas de recursos y hotbar añadidas')
}
