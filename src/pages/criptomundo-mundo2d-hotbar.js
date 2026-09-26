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
/* ===== CSS-MOVIL:INICIO (generado por aplicar-css-movil.js) ===== */
  /* El juego se diseñó para pantalla ancha: tres columnas fijas de
     260-300 px. En un móvil eso deja el contenido central en 40 px y la
     página inservible. Aquí las columnas se apilan y las alturas fijas
     pasan a automáticas. */
  @media (max-width: 860px) {
    html, body { overflow-x: hidden; -webkit-text-size-adjust: 100%; }

    /* Tres columnas → una sola, en vertical */
    .layout, .pvp-layout, .creator-body, .main-layout, .content-layout {
      display: block !important;
      height: auto !important;
      overflow: visible !important;
    }

    /* Las barras laterales dejan de ser columnas y pasan a ser bloques
       con altura acotada, para que no haya que hacer scroll eterno */
    .sidebar, .left-panel, .right-panel, .left-sidebar, .right-sidebar,
    .creator-preview, .creator-options, #left-panel, #right-panel,
    #left-sidebar, #right-sidebar {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      max-height: 46vh;
      overflow-y: auto;
      border-left: none !important;
      border-right: none !important;
      border-top: 1px solid var(--border, #2A2418);
    }

    main, .main, .center-panel, #center-panel, .market-main, #market-main {
      width: auto !important;
      min-width: 0 !important;
    }

    /* Alturas atadas a la ventana: en móvil sobra con que crezcan */
    [style*="calc(100vh"], .arena, .arena-scene, .combat-log, .run-log,
    .listings-area, .quest-scroll, .bench, .inv-body {
      height: auto !important;
      max-height: 60vh;
    }

    /* Barras superiores: que envuelvan en vez de desbordar */
    .topbar, .game-topbar, .header, .hdr, .mode-tabs, .zone-tabs, .filters {
      flex-wrap: wrap !important;
      gap: 6px !important;
      padding: 8px 10px !important;
      height: auto !important;
    }

    /* Rejillas apretadas: mínimo más pequeño para que quepan 2 por fila */
    .listings-grid, .inv-pick-grid, .inv-grid, .skin-grid, .skin-modal-grid,
    .ingredients, .dng-act-row, .pvp-act-grid, .action-grid, .rewards-grid {
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)) !important;
    }

    /* Objetivos táctiles: nada por debajo de 40 px de alto */
    button, .action-btn, .dng-btn, .mode-btn, .tab, .qtab, .rtab, .chip {
      min-height: 40px;
    }

    .action-btn, .dng-btn { padding: 8px 6px !important; }
    .a-icon, .db-icon { font-size: 20px !important; }
    .a-cost, .db-cost { font-size: 10px !important; }

    /* Diálogos que en escritorio son ventanas centradas */
    .skin-modal-box, .result-overlay > *, .modal-box, .co-box {
      max-width: 94vw !important;
      max-height: 88vh !important;
      overflow-y: auto;
    }
  }

  /* Pantallas muy estrechas: una sola columna en las rejillas */
  @media (max-width: 480px) {
    .listings-grid, .skin-grid, .ingredients {
      grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)) !important;
    }
    .creator-title, .gtb-name { font-size: 15px !important; }
  }

  /* ── Pulido visual compartido ──────────────────────────
     Detalles baratos que se notan mucho: transiciones suaves,
     tarjetas con algo de profundidad y rarezas con brillo propio. */
  * { -webkit-tap-highlight-color: transparent; }

  button, .chip, .tab, .qtab, .rtab, .mode-btn, .skin-card, .sm-card,
  .listing-card, .listing-row, .recipe-card, .dng-card, .quest-card,
  .npc-card, .guild-card, .mon-btn, .inv-slot, .loot-item {
    transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
  }
  .listing-card:hover, .recipe-card:hover, .dng-card:hover,
  .quest-card:hover, .npc-card:hover, .guild-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,.45);
  }
  button:active, .chip:active, .mon-btn:active { transform: scale(.97); }

  /* Las rarezas altas se distinguen de un vistazo, sin leer */
  .r-epic, .r-legendary, .r-mythic { position: relative; }
  .r-legendary { box-shadow: 0 0 12px rgba(255,128,0,.22); }
  .r-mythic    { box-shadow: 0 0 12px rgba(255,64,64,.24); }
  .r-epic      { box-shadow: 0 0 10px rgba(163,53,238,.20); }

  /* Barras de vida y maná: brillo interior en vez de color plano */
  .hp-bar-fill, .bar-fill.hp, .gtb-bar-fill.hp,
  .mp-bar-fill, .bar-fill.mp, .gtb-bar-fill.mp,
  .xp-bar-fill, .gtb-bar-fill.xp {
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
  }

  /* Aparición suave de los paneles al cargar: quita la sensación de
     pantallazo seco al cambiar de módulo */
  @keyframes entrar { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .sidebar, .listing-card, .recipe-card, .quest-card, .dng-card, .guild-card {
    animation: entrar .22s ease both;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
/* ===== CSS-MOVIL:FIN ===== */
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
  if (act2 && act2.arma) anunciarArma(act2)
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
