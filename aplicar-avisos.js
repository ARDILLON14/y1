#!/usr/bin/env node
/**
 * Inyecta el botón de avisos en todas las páginas.
 *
 *   node aplicar-avisos.js
 *
 * Qué resuelve: en una beta, los fallos llegan por Discord a medias
 * ("no me iba el mercado, creo que ayer"). Este botón recoge el aviso
 * en el momento y con el contexto ya adjunto: página, versión, nivel y
 * navegador. El jugador solo escribe qué ha pasado.
 *
 * Entre marcas, reaplicable, como el CSS móvil y la capa de red.
 */
const fs = require('fs')
const path = require('path')

const INICIO = '<!-- ===== AVISOS:INICIO (generado por aplicar-avisos.js) ===== -->'
const FIN = '<!-- ===== AVISOS:FIN ===== -->'

const BLOQUE = `${INICIO}
<style>
  #btn-aviso {
    position: fixed; right: 12px; top: 12px; z-index: 500;
    background: rgba(10,13,19,.72); border: 1px solid rgba(200,168,75,.4);
    color: #C8A84B; border-radius: 20px; padding: 6px 12px; font-size: 12px;
    cursor: pointer; font-family: system-ui, sans-serif; opacity: .55;
    transition: opacity .15s ease;
  }
  #btn-aviso:hover { opacity: 1; }
  #caja-aviso {
    position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 9998;
    display: none; align-items: center; justify-content: center; padding: 18px;
  }
  #caja-aviso.abierta { display: flex; }
  #caja-aviso .cuadro {
    background: #12151D; border: 1px solid #2A2418; border-radius: 12px;
    padding: 18px; width: 100%; max-width: 460px;
    font-family: system-ui, sans-serif; color: #E8E0CC;
  }
  #caja-aviso h3 { margin: 0 0 4px; font-size: 16px; color: #F0D070; }
  #caja-aviso .ayuda { font-size: 12px; color: #7A7060; margin-bottom: 12px; line-height: 1.5; }
  #caja-aviso .tipos { display: flex; gap: 6px; margin-bottom: 10px; }
  #caja-aviso .tipos button {
    flex: 1; background: rgba(20,24,34,.8); border: 1px solid #2A2418; color: #E8E0CC;
    border-radius: 7px; padding: 8px; font-size: 12px; cursor: pointer; min-height: 40px;
  }
  #caja-aviso .tipos button.sel { border-color: #F0D070; color: #F0D070; }
  #caja-aviso textarea {
    width: 100%; min-height: 110px; background: #0A0D13; border: 1px solid #2A2418;
    border-radius: 7px; color: #E8E0CC; padding: 9px; font-family: inherit; font-size: 13px;
    resize: vertical; box-sizing: border-box;
  }
  #caja-aviso .pie { display: flex; gap: 8px; margin-top: 12px; }
  #caja-aviso .pie button { flex: 1; border-radius: 7px; padding: 10px; font-size: 13px; cursor: pointer; min-height: 42px; }
  #caja-aviso .enviar { background: #C8A84B; border: 0; color: #0A0D13; font-weight: 700; }
  #caja-aviso .cerrar { background: none; border: 1px solid #2A2418; color: #7A7060; }
  #caja-aviso .contexto { font-size: 11px; color: #5A5449; margin-top: 10px; line-height: 1.5; }
</style>
<button id="btn-aviso" onclick="abrirAviso()" title="Contar un fallo o una idea">💬 Aviso</button>
<div id="caja-aviso" role="dialog" aria-modal="true" aria-label="Enviar un aviso">
  <div class="cuadro">
    <h3>¿Qué ha pasado?</h3>
    <div class="ayuda">Cuéntalo con tus palabras. Si es un fallo, di qué estabas haciendo justo antes: eso es lo que más ayuda.</div>
    <div class="tipos">
      <button data-tipo="fallo" class="sel" onclick="tipoAviso('fallo', this)">🐛 Un fallo</button>
      <button data-tipo="idea" onclick="tipoAviso('idea', this)">💡 Una idea</button>
      <button data-tipo="otro" onclick="tipoAviso('otro', this)">💭 Otra cosa</button>
    </div>
    <textarea id="texto-aviso" placeholder="Ejemplo: al comprar en el mercado se quedó cargando y perdí el oro"></textarea>
    <div class="pie">
      <button class="cerrar" onclick="cerrarAviso()">Cancelar</button>
      <button class="enviar" id="enviar-aviso" onclick="enviarAviso()">Enviar</button>
    </div>
    <div class="contexto" id="contexto-aviso"></div>
  </div>
</div>
<script>
(function () {
  if (window.__avisos) return
  window.__avisos = true
  var tipo = 'fallo'

  window.tipoAviso = function (t, btn) {
    tipo = t
    var b = document.querySelectorAll('#caja-aviso .tipos button')
    for (var i = 0; i < b.length; i++) b[i].className = ''
    btn.className = 'sel'
  }

  window.abrirAviso = function () {
    document.getElementById('caja-aviso').classList.add('abierta')
    document.getElementById('contexto-aviso').textContent =
      'Se enviará también: página ' + (location.pathname || '/') +
      ' · pantalla ' + window.innerWidth + '×' + window.innerHeight + ' · tu navegador.'
    document.getElementById('texto-aviso').focus()
  }
  window.cerrarAviso = function () {
    document.getElementById('caja-aviso').classList.remove('abierta')
  }

  window.enviarAviso = async function () {
    var area = document.getElementById('texto-aviso')
    var boton = document.getElementById('enviar-aviso')
    var texto = (area.value || '').trim()
    if (texto.length < 3) { area.focus(); return }
    boton.disabled = true
    boton.textContent = 'Enviando...'
    try {
      var res = await fetch('/api/feedback', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipo, texto: texto,
          pagina: location.pathname,
          pantalla: window.innerWidth + 'x' + window.innerHeight,
        }),
      })
      if (res.ok) {
        area.value = ''
        boton.textContent = '¡Gracias!'
        setTimeout(function () { window.cerrarAviso(); boton.textContent = 'Enviar'; boton.disabled = false }, 900)
      } else {
        var d = await res.json()
        boton.textContent = (d && d.error) || 'No se pudo enviar'
        setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
      }
    } catch (e) {
      boton.textContent = 'Sin conexión'
      setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.cerrarAviso()
  })
})()
</script>
${FIN}`

const DIR = path.join(__dirname, 'src', 'pages')
let tocados = 0, saltados = 0

// Las páginas largas se parten en dos módulos (`index.js` + `index-2.js`).
// Por eso se hacen DOS pasadas: primero se limpia el bloque de todos los
// archivos, y solo después se inyecta en el que contiene la etiqueta de
// cierre real. Si no, el propio bloque inyectado aporta su `</style>` y
// su `</body>`, y la siguiente pasada lo duplicaría en la otra mitad.
const ARCHIVOS = fs.readdirSync(DIR).filter(f => f.endsWith('.js'))

// Un archivo de continuación empieza con `PAGES['x'] += ` : es la
// segunda mitad de una página ya inyectada, no una página nueva.
const esContinuacion = txt => /^\s*PAGES\[[^\]]+\]\s*\+=/m.test(txt.slice(0, 400))

for (const file of ARCHIVOS) {
  const p = path.join(DIR, file)
  let src = fs.readFileSync(p, 'utf8')
  let i
  let cambiado = false
  while ((i = src.indexOf(INICIO)) !== -1) {
    const j = src.indexOf(FIN, i)
    if (j === -1) break
    src = src.slice(0, i) + src.slice(j + FIN.length).replace(/^\n/, '')
    cambiado = true
  }
  if (cambiado) fs.writeFileSync(p, src, 'utf8')
}

for (const file of ARCHIVOS) {
  // El panel de analítica es para ti, no para los jugadores
  if (file === 'admin.js') { saltados++; continue }
  const p = path.join(DIR, file)
  let src = fs.readFileSync(p, 'utf8')
  // El cierre está en la continuación cuando la página va partida
  if (!src.includes('</body>')) { saltados++; continue }

  const k = src.lastIndexOf('</body>')
  src = src.slice(0, k) + BLOQUE + '\n' + src.slice(k)
  fs.writeFileSync(p, src, 'utf8')
  tocados++
}

console.log(`✅ Botón de avisos aplicado a ${tocados} páginas (${saltados} omitidas)`)
console.log('   Recuerda: node build.js')
