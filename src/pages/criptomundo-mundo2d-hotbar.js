// La barra de objetos, en pantalla.
//
// QUÉ HABÍA
// El endpoint /api/hotbar existe desde el sistema de recolección y
// NADIE lo pintaba en el mapa. Tenías una barra de acceso rápido, con
// su hacha y su pico dentro, y ninguna forma de verla ni de usarla sin
// abrir el inventario. Es el mismo agujero que el STEP 2 encontró con
// los recursos: servidor hecho, pantalla ausente.
//
// CÓMO ESTÁ PARTIDO
// estadoHotbar() es una función PURA: recibe lo que dijo el servidor
// y devuelve exactamente lo que hay que pintar en cada ranura. No toca
// el DOM, no pide nada por la red y no mira el reloj salvo el que se le
// pasa. Por eso se puede probar sin navegador, igual que el paso de
// andar de criptomundo-mundo2d-andar.js.
//
// El aplicador es el que toca el DOM, y es tonto a propósito.
PAGES['criptomundo-mundo2d.html'] += `<script>

var HOTBAR_RANURAS_CLI = 10
var HOTBAR = { ranuras: [], seleccionada: 0, cargada: false }
var HOTBAR_ULT_RUEDA = 0
var HOTBAR_NOMBRE_HASTA = 0

// Color por rareza. El mismo que usa el resto del juego; si llega una
// rareza que no conocemos, gris, que es mejor que un hueco.
var HOTBAR_COLORES = {
  COMMON: '#B8B8C0', UNCOMMON: '#4AC94A', RARE: '#3A8AF0',
  EPIC: '#A335EE', LEGENDARY: '#F0A030',
}

// ── La función pura ────────────────────────────────────────────────
//
// datos       lo que devolvió /api/hotbar
// activa      qué ranura está elegida
// ahora       milisegundos, para el velo de enfriamiento
// enfriando   { itemId: hasta } opcional
//
// Devuelve SIEMPRE diez ranuras, en orden, aunque el servidor mande
// menos: una barra con huecos se pinta peor que una barra con vacíos.
function estadoHotbar(datos, activa, ahora, enfriando) {
  var lista = (datos && datos.ranuras) || []
  var sel = Number.isInteger(activa) ? activa : ((datos && datos.seleccionada) || 0)
  if (sel < 0 || sel >= HOTBAR_RANURAS_CLI) sel = 0
  var t = Number(ahora) || 0
  var frio = enfriando || {}
  var fuera = []
  for (var i = 0; i < HOTBAR_RANURAS_CLI; i++) {
    var r = lista[i] || null
    if (!r) {
      fuera.push({
        ranura: i, tecla: teclaDeRanura(i), vacia: true, activa: i === sel,
        itemId: null, icono: '', nombre: '', cantidad: 0, apilable: false,
        agotada: false, color: HOTBAR_COLORES.COMMON, enfriamiento: 0,
      })
      continue
    }
    var hasta = Number(frio[r.itemId]) || 0
    // El velo baja de arriba abajo: 1 recién usado, 0 listo.
    var resto = hasta > t ? (hasta - t) : 0
    var total = Number(frio['__total_' + r.itemId]) || 3000
    fuera.push({
      ranura: i, tecla: teclaDeRanura(i), vacia: false, activa: i === sel,
      itemId: r.itemId,
      icono: r.icono || '',
      imagen: r.imagen || null,
      nombre: r.nombre || r.itemId,
      cantidad: r.cantidad || 0,
      // Solo se enseña el número si apila. Un "1" debajo de la espada
      // es ruido: nadie tiene media espada.
      apilable: !!r.consumible,
      agotada: !!r.agotada || (r.cantidad || 0) === 0,
      usable: !!r.usableEnCombate,
      color: HOTBAR_COLORES[r.rareza] || HOTBAR_COLORES.COMMON,
      enfriamiento: total > 0 ? Math.max(0, Math.min(1, resto / total)) : 0,
    })
  }
  return { ranuras: fuera, seleccionada: sel }
}

// La ranura 9 se pulsa con el 0, que es donde está en el teclado.
function teclaDeRanura(i) { return i === 9 ? '0' : String(i + 1) }
function ranuraDeTecla(k) {
  if (k === '0') return 9
  var n = parseInt(k, 10)
  return (n >= 1 && n <= 9) ? n - 1 : null
}

// La siguiente o la anterior, dando la vuelta. Lo usa la rueda.
function ranuraVecina(actual, paso) {
  var n = HOTBAR_RANURAS_CLI
  return ((actual + paso) % n + n) % n
}
</script>
<style>
#barra-objetos {
  position: fixed; left: 50%; transform: translateX(-50%);
  /* El margen de abajo son 12 px MÁS el área segura del teléfono: sin
     ella, en un iPhone la última fila cae bajo la barra del sistema. */
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  display: flex; gap: 4px; z-index: 40;
  padding: 5px; border-radius: 10px;
  background: rgba(5, 7, 10, .72);
  border: 1px solid rgba(200, 168, 75, .25);
  backdrop-filter: blur(4px);
  user-select: none; -webkit-user-select: none;
}
/* Por debajo de los menús y de los avisos, por encima del mapa. El
   mando táctil vive a la izquierda y el botón de atacar a la derecha:
   la barra va centrada y no los pisa. */
#barra-objetos .ranura {
  position: relative; width: 44px; height: 44px;
  border-radius: 8px; cursor: pointer;
  background: rgba(20, 24, 32, .9);
  border: 2px solid rgba(255, 255, 255, .10);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; line-height: 1;
  transition: border-color .12s, transform .12s;
}
#barra-objetos .ranura.activa {
  border-color: #C8A84B;
  transform: translateY(-4px);
  box-shadow: 0 0 10px rgba(200, 168, 75, .45);
}
#barra-objetos .ranura.agotada { opacity: .38; }
#barra-objetos .ranura img { width: 32px; height: 32px; image-rendering: pixelated; }
#barra-objetos .tecla {
  position: absolute; top: 1px; left: 3px;
  font-family: Cinzel, serif; font-size: 8px; color: #8A8A92;
}
#barra-objetos .cantidad {
  position: absolute; bottom: 1px; right: 3px;
  font-family: Cinzel, serif; font-size: 9px; color: #E8E8F0;
  text-shadow: 0 1px 2px #000;
}
/* El velo de enfriamiento baja de arriba abajo, que es como se lee. */
#barra-objetos .frio {
  position: absolute; left: 0; right: 0; top: 0;
  background: rgba(5, 7, 10, .66); border-radius: 6px;
  pointer-events: none;
}
#nombre-arma {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  font-family: Cinzel, serif; font-size: 12px;
  text-shadow: 0 1px 3px #000; z-index: 40;
  opacity: 0; transition: opacity .25s; pointer-events: none;
}
/* En pantallas estrechas caben cinco, con un botón para ver las otras
   cinco. Nunca por debajo de 40 px: es el tamaño de un dedo. */
@media (max-width: 480px) {
  #barra-objetos .ranura { width: 40px; height: 40px; font-size: 19px; }
  #barra-objetos .ranura.oculta { display: none; }
  #barra-objetos .pasar { width: 26px; font-size: 13px; }
}
@media (min-width: 481px) { #barra-objetos .pasar { display: none; } }
</style>
<div id="barra-objetos" role="toolbar" aria-label="Barra de objetos"></div>
<div id="nombre-arma"></div>
<script>
var HOTBAR_MITAD = 0            // en móvil: 0 = ranuras 1-5, 1 = 6-0
var HOTBAR_FRIO = {}            // itemId → hasta cuándo está en frío

function hotbarEstrecha() { return window.innerWidth <= 480 }

// El aplicador. Tonto a propósito: pinta lo que diga estadoHotbar().
function pintarHotbar() {
  var caja = document.getElementById('barra-objetos')
  if (!caja) return
  var est = estadoHotbar(HOTBAR, HOTBAR.seleccionada, Date.now(), HOTBAR_FRIO)
  var estrecha = hotbarEstrecha()
  var html = ''
  for (var i = 0; i < est.ranuras.length; i++) {
    var r = est.ranuras[i]
    var oculta = estrecha && (Math.floor(i / 5) !== HOTBAR_MITAD)
    var clases = 'ranura' + (r.activa ? ' activa' : '') + (r.agotada ? ' agotada' : '') + (oculta ? ' oculta' : '')
    var dentro = ''
    if (!r.vacia) {
      dentro = r.imagen
        ? '<img src="' + r.imagen + '" alt="">'
        : '<span>' + (r.icono || '?') + '</span>'
      if (r.apilable) dentro += '<span class="cantidad">' + r.cantidad + '</span>'
      if (r.enfriamiento > 0) {
        dentro += '<span class="frio" style="height:' + Math.round(r.enfriamiento * 100) + '%"></span>'
      }
    }
    html += '<div class="' + clases + '" data-ranura="' + i + '" role="button" tabindex="0"' +
            ' aria-label="Ranura ' + r.tecla + (r.vacia ? ' vacía' : ': ' + r.nombre) + '"' +
            ' style="border-color:' + (r.activa ? '#C8A84B' : 'rgba(255,255,255,.10)') + '">' +
            '<span class="tecla">' + r.tecla + '</span>' + dentro + '</div>'
  }
  if (estrecha) {
    html += '<div class="ranura pasar" data-pasar="1" role="button" tabindex="0" aria-label="Ver las otras cinco ranuras">' +
            (HOTBAR_MITAD === 0 ? '›' : '‹') + '</div>'
  }
  caja.innerHTML = html
}

async function cargarHotbar() {
  var r = await apiGet('/api/hotbar')
  if (!r.ok) return
  HOTBAR = { ranuras: r.data.ranuras || [], seleccionada: r.data.seleccionada || 0, cargada: true }
  pintarHotbar()
}

// Elegir ranura. La decide el SERVIDOR: aquí se pide y se pinta lo que
// conteste. Si la ranura lleva arma, el servidor la equipa y devuelve
// las estadísticas nuevas, así que el arma equipada y la ranura activa
// no pueden separarse.
async function elegirRanuraHotbar(i) {
  if (!Number.isInteger(i) || i < 0 || i >= HOTBAR_RANURAS_CLI) return
  if (i === HOTBAR.seleccionada) {
    // Pulsar otra vez la ranura de una poción la BEBE. Es lo que pide
    // la sección D.2, y ahorra tener que soltar el ataque para curarse.
    var act = (HOTBAR.ranuras || [])[i]
    if (act && act.consumible && !act.agotada) return usarDeLaHotbar(i)
    return
  }
  HOTBAR.seleccionada = i
  pintarHotbar()
  var r = await apiPost('/api/hotbar/elegir', { ranura: i })
  if (!r.ok) return
  HOTBAR.ranuras = (r.data.hotbar && r.data.hotbar.ranuras) || HOTBAR.ranuras
  HOTBAR.seleccionada = r.data.seleccionada
  pintarHotbar()
  var act2 = HOTBAR.ranuras[i]
  if (act2 && act2.arma) {
    anunciarArma(act2)
    // El combate dibuja el arma en la mano: tiene que enterarse de que
    // ha cambiado, o seguirías blandiendo la anterior.
    try { window.dispatchEvent(new Event('cm-arma-cambiada')) } catch (e) {}
  }
  if (r.data.stats && typeof syncCharacter === 'function') syncCharacter()
}

// Beber desde la barra. El efecto y el consumo los decide el servidor:
// aquí solo se pide y se refresca.
async function usarDeLaHotbar(i) {
  var act = (HOTBAR.ranuras || [])[i]
  if (!act || !act.consumible || act.agotada) return
  var r = await apiPost('/api/mundo/combate', { entrada: { ranura: i, pulsado: true } })
  HOTBAR_FRIO[act.itemId] = Date.now() + 3000
  HOTBAR_FRIO['__total_' + act.itemId] = 3000
  await cargarHotbar()
  if (typeof syncCharacter === 'function') syncCharacter()
}

function anunciarArma(r) {
  var el = document.getElementById('nombre-arma')
  if (!el) return
  el.textContent = r.nombre
  el.style.color = HOTBAR_COLORES[r.rareza] || '#E8E8F0'
  el.style.opacity = '1'
  HOTBAR_NOMBRE_HASTA = Date.now() + 1200
  setTimeout(function () {
    if (Date.now() >= HOTBAR_NOMBRE_HASTA) el.style.opacity = '0'
  }, 1250)
}

// ── Controles ──────────────────────────────────────────────────────
document.addEventListener('keydown', function (e) {
  if (typeof dialogueOpen !== 'undefined' && dialogueOpen) return
  var a = document.activeElement
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return
  var i = ranuraDeTecla(e.key)
  if (i === null) return
  e.preventDefault()
  elegirRanuraHotbar(i)
})

// La rueda pasa de una en una. Con 150 ms entre pasos: sin freno, un
// solo giro del dedo saltaba tres ranuras y no había forma de parar en
// la que querías.
window.addEventListener('wheel', function (e) {
  if (typeof dialogueOpen !== 'undefined' && dialogueOpen) return
  var t = Date.now()
  if (t - HOTBAR_ULT_RUEDA < 150) return
  HOTBAR_ULT_RUEDA = t
  elegirRanuraHotbar(ranuraVecina(HOTBAR.seleccionada, e.deltaY > 0 ? 1 : -1))
}, { passive: true })

document.addEventListener('click', function (e) {
  var caja = e.target.closest && e.target.closest('#barra-objetos .ranura')
  if (!caja) return
  if (caja.dataset.pasar) { HOTBAR_MITAD = HOTBAR_MITAD ? 0 : 1; pintarHotbar(); return }
  elegirRanuraHotbar(Number(caja.dataset.ranura))
})

window.addEventListener('resize', pintarHotbar)
window.addEventListener('load', function () { setTimeout(cargarHotbar, 300) })
// El enfriamiento se pinta solo mientras corre.
setInterval(function () {
  var hay = false
  for (var k in HOTBAR_FRIO) { if (k.indexOf('__') !== 0 && HOTBAR_FRIO[k] > Date.now()) hay = true }
  if (hay) pintarHotbar()
}, 120)
</script>`
