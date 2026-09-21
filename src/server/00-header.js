/**
 * CriptoMundo — servidor de juego con autoridad del servidor
 * =============================================================
 * Un solo ejecutable, cero dependencias npm. Node.js 18 o superior.
 *
 * Este archivo se GENERA desde src/. No lo edites a mano:
 *   node build.js          compila
 *   node build.js --watch  recompila al guardar
 *
 * Arranque:
 *   node criptomundo.js
 *   PORT=8080 NODE_ENV=production ADMIN_TOKEN=... node criptomundo.js
 *
 * Herramientas:
 *   node doctor.js               diagnóstico y recomendaciones
 *   node simular-jugadores.js    cohorte simulada para probar el balance
 *   node preparar-beta.js        revisa la configuración antes de una beta
 *
 * Documentación: README.md · CHANGELOG.md · docs/
 */

// ── HTML embebido (13 páginas) ─────────────────────────────────────
// El servidor y sus dependencias se declaran en src/server/60-http.js;
// aquí solo va la cabecera, el contenedor de páginas y la versión.
const PAGES = {}

// Única fuente de la versión. build.js comprueba que coincide con
// package.json, para que no vuelvan a divergir como pasó entre la v9 y la v11.
const VERSION = '31.0.0'
