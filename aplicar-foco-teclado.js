#!/usr/bin/env node
/**
 * FASE 1-2 — Arreglo del teclado dentro del iframe
 *
 * El problema real (medido, no supuesto): el juego se sirve dentro de
 * #game-iframe en el launcher y NADIE enfoca nunca ese iframe. Los
 * keydown se los queda el documento de fuera, así que dentro de la arena
 * no llega ninguno: el personaje no anda, no ataca y no esquiva. Basta
 * con hacer clic en el chat del launcher para perder el control otra vez.
 *
 * Se ataca por los dos lados, y a propósito de forma redundante:
 *   1. el launcher enfoca el iframe al cargar un módulo y al pulsar en él
 *   2. el launcher REENVÍA las teclas de juego al iframe por postMessage
 *   3. cada pantalla acepta esas teclas reenviadas igual que las reales
 *
 * Como el estado del teclado es un booleano por dirección, recibir la
 * misma tecla dos veces (real + reenviada) no hace daño: es idempotente.
 */
const fs = require('fs')
const path = require('path')
const SRC = path.join(__dirname, 'src', 'pages')

let cambios = 0
// La marca es un trozo NUEVO del parche, no el principio (que suele
// coincidir con el original y daba falsos "ya estaba").
function parchear(archivo, antes, despues, etiqueta, marca) {
  const p = path.join(SRC, archivo)
  const s = fs.readFileSync(p, 'utf8')
  if (s.includes(marca)) { console.log(`  ·  ${etiqueta} — ya estaba`); return }
  if (!s.includes(antes)) { console.log(`  ❌ ${etiqueta} — NO se encontró el texto a sustituir`); process.exitCode = 1; return }
  fs.writeFileSync(p, s.replace(antes, despues), 'utf8')
  console.log(`  ✅ ${etiqueta}`)
  cambios++
}

// ── 1. LAUNCHER: enfocar el iframe y reenviar teclas ────────────────
parchear('index-2.js',
`function onFrameLoad() {
  document.getElementById('frame-loading').classList.add('hidden')
}`,
`function onFrameLoad() {
  document.getElementById('frame-loading').classList.add('hidden')
  enfocarJuego()
}

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
})`,
  'launcher: enfoca el iframe y reenvía teclas', 'function enfocarJuego()')

// ── 2. ARENA: aceptar teclas reenviadas ─────────────────────────────
parchear('criptomundo-arena.js',
`document.addEventListener('keydown', function (e) {
  var k = e.key.toLowerCase()
  if (MAPA_TECLAS[k]) { teclas[MAPA_TECLAS[k]] = true; e.preventDefault() }
  if (k === ' ') { entrada.atacar = true; e.preventDefault() }
  if (k === 'shift') entrada.esquivar = true
  actualizarMovimiento()
})
document.addEventListener('keyup', function (e) {
  var k = e.key.toLowerCase()
  if (MAPA_TECLAS[k]) teclas[MAPA_TECLAS[k]] = false
  if (k === ' ') entrada.atacar = false
  actualizarMovimiento()
})`,
`// El manejo de teclas se separa del evento para poder alimentarlo
// también desde el launcher (ver más abajo). Es idempotente: recibir
// dos veces la misma tecla deja el mismo estado.
function pulsarTecla(key) {
  var k = String(key).toLowerCase()
  if (MAPA_TECLAS[k]) teclas[MAPA_TECLAS[k]] = true
  if (k === ' ') entrada.atacar = true
  if (k === 'shift') entrada.esquivar = true
  actualizarMovimiento()
}
function soltarTecla(key) {
  var k = String(key).toLowerCase()
  if (MAPA_TECLAS[k]) teclas[MAPA_TECLAS[k]] = false
  if (k === ' ') entrada.atacar = false
  actualizarMovimiento()
}
document.addEventListener('keydown', function (e) {
  var k = e.key.toLowerCase()
  if (MAPA_TECLAS[k] || k === ' ') e.preventDefault()
  pulsarTecla(e.key)
})
document.addEventListener('keyup', function (e) { soltarTecla(e.key) })

// Esta pantalla corre dentro del iframe del launcher. Si el foco del
// teclado se queda fuera no llega ni un keydown y el personaje se
// queda clavado: era la causa de "entro a la arena y no me puedo
// mover". Se pide el foco y se aceptan las teclas que reenvía el
// launcher, para que deje de depender de dónde esté el cursor.
function pedirFoco() { try { window.focus() } catch (e) {} }
pedirFoco()
window.addEventListener('load', pedirFoco)
document.addEventListener('pointerdown', pedirFoco)
window.addEventListener('message', function (ev) {
  if (ev.origin !== location.origin && ev.origin !== 'null') return
  var d = ev.data
  if (!d || d.type !== 'TECLA') return
  if (d.abajo) pulsarTecla(d.key); else soltarTecla(d.key)
})`,
  'arena: acepta teclas reenviadas y pide el foco', 'function pulsarTecla(')

// ── 3. MUNDO: lo mismo, pero Phaser lee eventos reales ──────────────
// Phaser escucha keydown/keyup en window, así que aquí no basta con
// cambiar una variable: hay que volver a lanzar el evento dentro del
// iframe para que su gestor de teclado lo vea.
parchear('criptomundo-mundo2d-2.js',
`// Key listener for Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDialogue()
    closeCombat(true)
  }
})`,
`// Key listener for Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDialogue()
    closeCombat(true)
  }
})

// ── TECLAS REENVIADAS DESDE EL LAUNCHER ──
// El mundo vive en un iframe. Si el foco se queda en la ventana de
// fuera, Phaser no recibe nada y el personaje no anda. Phaser escucha
// eventos reales sobre window, así que el mensaje se convierte de
// vuelta en un KeyboardEvent en lugar de tocar variables por dentro.
const CODIGOS_TECLA = {
  w: 87, a: 65, s: 83, d: 68, q: 81, e: 69, r: 82, ' ': 32, shift: 16,
  arrowup: 38, arrowleft: 37, arrowdown: 40, arrowright: 39,
}
let ultimaTecla = {}
window.addEventListener('message', ev => {
  if (ev.origin !== location.origin && ev.origin !== 'null') return
  const d = ev.data
  if (!d || d.type !== 'TECLA') return
  const k = String(d.key).toLowerCase()
  const code = CODIGOS_TECLA[k]
  if (!code) return
  // Sin esto, mantener una tecla pulsada dispararía un keydown cada
  // pocos milisegundos y Phaser trataría cada uno como pulsación nueva.
  if (ultimaTecla[k] === d.abajo) return
  ultimaTecla[k] = d.abajo
  const nombre = d.abajo ? 'keydown' : 'keyup'
  window.dispatchEvent(new KeyboardEvent(nombre, {
    key: d.key, keyCode: code, which: code, bubbles: true, cancelable: true,
  }))
})
try { window.focus() } catch (e) {}
document.addEventListener('pointerdown', () => { try { window.focus() } catch (e) {} })`,
  'mundo: acepta teclas reenviadas (vía Phaser) y pide el foco', 'CODIGOS_TECLA')

// ── 4. MAZMORRAS: el botón de pestaña llamaba a una función inexistente
parchear('criptomundo-mazmorras-pvp.js',
`var MZ = { lista: [], run: null }`,
`var MZ = { lista: [], run: null }

// Las dos pestañas de arriba llamaban a setMode(), que no existía en
// ninguna parte: pulsar "PVP — ARENA" lanzaba un ReferenceError y no
// pasaba nada. El PvP jugable todavía no tiene pantalla propia (va en
// la fase 13), así que la pestaña lleva al combate en tiempo real, que
// es el que sí funciona, en vez de a un panel vacío.
function setMode(modo, boton) {
  document.querySelectorAll('.mode-tab').forEach(function (b) { b.classList.remove('active') })
  if (boton) boton.classList.add('active')
  var dng = document.getElementById('dng-mode')
  var pvp = document.getElementById('pvp-mode')
  if (dng) dng.style.display = (modo === 'dng') ? '' : 'none'
  if (pvp) pvp.style.display = (modo === 'pvp') ? '' : 'none'
}`,
  'mazmorras: setMode() existe y las pestañas responden', 'function setMode(')

console.log(`\n${cambios} archivo(s) modificados`)
