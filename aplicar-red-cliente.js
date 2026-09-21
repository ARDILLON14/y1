#!/usr/bin/env node
/**
 * Inyecta la capa de resistencia de red en todas las páginas.
 *
 *   node aplicar-red-cliente.js
 *
 * Qué resuelve: hasta ahora, si el servidor no respondía, el juego se
 * quedaba mudo. Los `catch {}` de cada página se tragaban el error y el
 * jugador veía una pantalla que simplemente no reaccionaba, sin saber
 * si había perdido la conexión, si se había caído el servidor o si el
 * botón no funcionaba. En una beta eso se reporta como "se ha colgado".
 *
 * Esta capa envuelve `fetch` una sola vez por página y añade:
 *   · aviso visible cuando se pierde la conexión y cuando vuelve
 *   · reintento automático de las lecturas (GET), con espera creciente
 *   · nada de reintentar escrituras: repetir un POST puede comprar dos veces
 *
 * Igual que el CSS móvil, va entre marcas y se puede reaplicar.
 */
const fs = require('fs')
const path = require('path')

const INICIO = '<!-- ===== RED-CLIENTE:INICIO (generado por aplicar-red-cliente.js) ===== -->'
const FIN = '<!-- ===== RED-CLIENTE:FIN ===== -->'

const BLOQUE = `${INICIO}
<style>
  #aviso-red {
    position: fixed; left: 50%; top: 0; transform: translate(-50%, -110%);
    background: #8B1A1A; color: #FFE8E8; border: 1px solid #E03030; border-top: none;
    border-radius: 0 0 8px 8px; padding: 9px 18px; font-size: 13px; z-index: 9999;
    font-family: system-ui, sans-serif; transition: transform .25s ease;
    display: flex; align-items: center; gap: 10px; max-width: 92vw;
  }
  #aviso-red.visible { transform: translate(-50%, 0); }
  #aviso-red.ok { background: #14532D; border-color: #30C060; color: #DCFCE7; }
  #aviso-red button {
    background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
    color: inherit; border-radius: 5px; padding: 3px 10px; font-size: 12px; cursor: pointer;
  }
  /* Foco visible: sin esto no se puede navegar con teclado */
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid #F0D070; outline-offset: 2px;
  }
</style>
<div id="aviso-red" role="status" aria-live="polite"></div>
<script>
(function () {
  if (window.__redCliente) return
  window.__redCliente = true

  var caido = false
  var original = window.fetch.bind(window)

  function aviso(texto, ok, conBoton) {
    var el = document.getElementById('aviso-red')
    if (!el) return
    el.className = 'visible' + (ok ? ' ok' : '')
    el.innerHTML = ''
    el.appendChild(document.createTextNode(texto))
    if (conBoton) {
      var b = document.createElement('button')
      b.textContent = 'Reintentar'
      b.onclick = function () { location.reload() }
      el.appendChild(b)
    }
    if (ok) setTimeout(function () { el.className = '' }, 2500)
  }

  function esLectura(init) {
    var m = (init && init.method ? init.method : 'GET').toUpperCase()
    return m === 'GET' || m === 'HEAD'
  }

  var dormir = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  window.fetch = async function (entrada, init) {
    var intentos = esLectura(init) ? 3 : 1   // las escrituras NO se repiten
    var ultimoError
    for (var i = 0; i < intentos; i++) {
      try {
        var res = await original(entrada, init)
        // Un 5xx en una lectura suele ser pasajero: merece otro intento
        if (res.status >= 500 && esLectura(init) && i < intentos - 1) {
          await dormir(400 * Math.pow(2, i))
          continue
        }
        if (caido) { caido = false; aviso('Conexión restablecida', true) }
        return res
      } catch (e) {
        ultimoError = e
        if (i < intentos - 1) await dormir(400 * Math.pow(2, i))
      }
    }
    if (!caido) {
      caido = true
      aviso('Sin conexión con el servidor. Tus últimos cambios pueden no haberse guardado.', false, true)
    }
    throw ultimoError
  }

  window.addEventListener('offline', function () {
    caido = true
    aviso('Te has quedado sin internet.', false, false)
  })
  window.addEventListener('online', function () {
    caido = false
    aviso('Conexión restablecida', true)
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

// Si el bloque ya está, se sustituye EN SU SITIO. Antes se borraba y
// se volvía a añadir al final, lo que lo movía por detrás del bloque de
// avisos: reaplicar el inyector cambiaba el archivo aunque el contenido
// fuera idéntico, y la prueba de idempotencia fallaba con razón.
let yaEstaban = 0
for (const file of ARCHIVOS) {
  const p = path.join(DIR, file)
  let src = fs.readFileSync(p, 'utf8')
  const i = src.indexOf(INICIO)
  if (i === -1) continue
  const j = src.indexOf(FIN, i)
  if (j === -1) continue
  const nuevo = src.slice(0, i) + BLOQUE + src.slice(j + FIN.length)
  if (nuevo !== src) fs.writeFileSync(p, nuevo, 'utf8')
  yaEstaban++
  tocados++
}

// Una página puede estar repartida en dos módulos (`PAGES['x'] = ` y
// `PAGES['x'] += `). La capa debe insertarse UNA sola vez por página,
// en el módulo que la cierra; si se inserta en los dos, el navegador
// carga el bloque dos veces.
const porPagina = new Map()
for (const file of ARCHIVOS) {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8')
  const m = /PAGES\['([^']+)'\]/.exec(src)
  if (!m) continue
  const lista = porPagina.get(m[1]) || []
  lista.push(file)
  porPagina.set(m[1], lista)
}

for (const [pagina, modulos] of porPagina) {
  // El que cierra </body>; si ninguno lo hace, el último del grupo
  const elegido = modulos.find(f => fs.readFileSync(path.join(DIR, f), 'utf8').includes('</body>'))
    || modulos[modulos.length - 1]

  const p = path.join(DIR, elegido)
  let src = fs.readFileSync(p, 'utf8')
  if (src.includes(INICIO)) continue   // ya sustituido en su sitio arriba

  let k = src.lastIndexOf('</body>')
  if (k === -1) k = src.lastIndexOf('`')
  if (k === -1) { console.warn(`   ⚠️  ${pagina}: sin punto de inserción`); saltados++; continue }

  src = src.slice(0, k) + BLOQUE + '\n' + src.slice(k)
  fs.writeFileSync(p, src, 'utf8')
  tocados++
}

console.log(`✅ Capa de red aplicada a ${tocados} páginas (${yaEstaban} actualizadas en su sitio, ${saltados} omitidas)`)
console.log('   Recuerda: node build.js')
