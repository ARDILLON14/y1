#!/usr/bin/env node
/**
 * Inyecta (o actualiza) el bloque de CSS móvil compartido en todas las
 * páginas de src/pages/.
 *
 *   node aplicar-css-movil.js
 *
 * Por qué un script y no copiar y pegar: son 13 páginas. Si el bloque se
 * escribe a mano en cada una, en dos semanas habrá trece versiones
 * distintas. Aquí se edita el bloque de abajo y se vuelve a ejecutar.
 *
 * El bloque va delimitado por marcas, así que ejecutarlo varias veces
 * reemplaza el anterior en lugar de acumular copias.
 */
const fs = require('fs')
const path = require('path')

const INICIO = '/* ===== CSS-MOVIL:INICIO (generado por aplicar-css-movil.js) ===== */'
const FIN = '/* ===== CSS-MOVIL:FIN ===== */'

const BLOQUE = `${INICIO}
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
  const p = path.join(DIR, file)
  let src = fs.readFileSync(p, 'utf8')
  if (esContinuacion(src)) { saltados++; continue }

  if (!src.includes('</style>')) { saltados++; continue }

  // Si ya hay un bloque previo, se sustituye entero
  // Antes del PRIMER </style> (el del <head> de la página). Usar el
  // último metía el bloque dentro de los estilos que inyectan las otras
  // capas, y al limpiarlas se llevaban este por delante.
  const k = src.indexOf('</style>')
  src = src.slice(0, k) + BLOQUE + '\n' + src.slice(k)

  fs.writeFileSync(p, src, 'utf8')
  tocados++
}

console.log(`✅ CSS móvil aplicado a ${tocados} páginas (${saltados} sin <style>)`)
console.log('   Recuerda: node build.js')
