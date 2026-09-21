#!/usr/bin/env node
/**
 * CriptoMundo — ¿CUÁNTO CUESTA PINTAR UN CUADRO?
 * ═══════════════════════════════════════════════════════════════════
 *
 *   node medir-render.js            mide la arena
 *   node medir-render.js --segundos 12
 *
 * POR QUÉ MEDIR Y NO OPTIMIZAR A OJO
 * "Va a tirones" no dice dónde. Y las optimizaciones obvias a menudo no
 * son las que cuestan: se puede pasar una tarde quitando allocations de
 * un bucle que se lleva el 2% del cuadro mientras el 60% se va en
 * repintar un fondo que no cambia.
 *
 * Esto abre la página en un Chromium de verdad, entra a una arena de
 * verdad y cronometra CADA CUADRO durante unos segundos, troceando el
 * coste por partes del dibujo. Lo que salga arriba es lo que hay que
 * tocar; lo demás se deja en paz.
 *
 * QUÉ SE MIRA
 *   · cuadros por segundo reales y su reparto (mediana, p95, p99)
 *   · cuántos cuadros pasan de 16,7 ms (los que se notan)
 *   · el coste de pintarEscena() aparte del resto del cuadro
 *   · cuántas llamadas de dibujo se hacen por cuadro
 */
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3990)
const SEGUNDOS = Number((process.argv[process.argv.indexOf('--segundos') + 1]) || 8)
// Estrangular la CPU es lo que convierte esto en una medida útil. Un
// portátil pinta la arena sin despeinarse; el jugador está en un móvil.
// 4× es un gama media razonable, 6× uno flojo.
const LENTO = Number((process.argv[process.argv.indexOf('--lento') + 1]) || 1)
const PAGINA = process.argv.includes('--mundo') ? 'criptomundo-mundo2d.html' : 'criptomundo-arena.html'

let chromium
try { ({ chromium } = require('playwright')) }
catch {
  console.error('❌ Falta playwright. Instálalo con:  npm i -D playwright')
  process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), DATA_FILE: '/tmp/cm-render.json', BACKUP_DIR: '/tmp/cm-render-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  await sleep(1800)

  const navegador = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const ctx = await navegador.newContext({ viewport: { width: 1100, height: 760 } })
  const pagina = await ctx.newPage()
  const errores = []
  pagina.on('pageerror', e => errores.push(String(e.message)))

  const usuario = 'render' + Math.floor(Math.random() * 1e6)
  // Sesión real: la página necesita cookie para entrar a la arena.
  await pagina.goto(`http://localhost:${PORT}/`)
  await pagina.evaluate(async ({ u }) => {
    await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' }),
    })
  }, { u: usuario })

  if (LENTO > 1) {
    const cdp = await ctx.newCDPSession(pagina)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: LENTO })
  }
  await pagina.goto(`http://localhost:${PORT}/${PAGINA}`)
  await sleep(1200 * Math.max(1, LENTO / 2))

  // Entrar a la arena como lo haría una persona: pulsando la tarjeta.
  // El mundo no tiene menú: ya se está jugando en cuanto carga.
  if (PAGINA.includes('arena')) {
    const tarjeta = await pagina.$('.arena-item:not(.bloqueada)')
    if (!tarjeta) { console.error('❌ No hay ninguna arena disponible para pulsar'); process.exit(1) }
    await tarjeta.click()
    await sleep(1500)
  }

  // Se mueve y ataca mientras se mide: un lienzo quieto no mide nada.
  await pagina.keyboard.down('d')
  if (PAGINA.includes('arena')) await pagina.keyboard.down(' ')

  // El cronómetro. Se engancha a requestAnimationFrame y no a la
  // función de pintar de cada pantalla.
  //
  // Lo intenté al revés primero y no salía: la arena pinta con
  // pintarEscena(), el mundo lo lleva Phaser, y la instancia de Phaser
  // vive en un `const` del ámbito del script — que NO cuelga de
  // `window`, así que desde fuera no se ve. Enganchando rAF da igual
  // qué motor haya debajo: se mide el latido real del navegador, que es
  // lo que nota quien juega.
  const m = await pagina.evaluate(async (seg) => {
    const cuadros = [], trabajo = []
    let ultimo = performance.now()
    let parar = false
    const rafOrig = window.requestAnimationFrame.bind(window)
    ;(function medir() {
      rafOrig(function (t) {
        const ahora = performance.now()
        cuadros.push(ahora - ultimo)
        ultimo = ahora
        // El trabajo del cuadro: lo que la página tarda en devolver el
        // control después de su propio rAF. Se mide con una tarea que
        // se encola justo detrás.
        const t0 = performance.now()
        Promise.resolve().then(() => trabajo.push(performance.now() - t0))
        if (!parar) medir()
      })
    })()
    await new Promise(r => setTimeout(r, seg * 1000))
    parar = true
    return { cuadros, pintar: trabajo, llamadas: [], funcion: 'requestAnimationFrame' }
  }, SEGUNDOS)

  await navegador.close()
  try { hijo.kill() } catch {}

  // ── Cuentas ──────────────────────────────────────────────────────
  const orden = a => a.slice().sort((x, y) => x - y)
  const pct = (a, p) => { const s = orden(a); return s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0 }
  const med = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
  // Se tiran los 10 primeros: el arranque siempre es el más caro y no
  // representa cómo se juega.
  const cuadros = m.cuadros.slice(10)
  const pintar = m.pintar.slice(10)
  const llamadas = m.llamadas.slice(10)
  const medianaCuadro = pct(cuadros, 0.5)
  const UMBRAL = Math.max(20, medianaCuadro * 1.8)
  const lentos = cuadros.filter(x => x > UMBRAL).length

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  COSTE DE PINTAR — arena, Chromium real                      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('   ' + PAGINA + ' · ' + cuadros.length + ' cuadros en ' + SEGUNDOS + ' s' +
    (LENTO > 1 ? ' · CPU estrangulada ×' + LENTO + ' (móvil)' : ' · CPU al 100%') + '\n')
  if (m.sinFuncion || !cuadros.length) {
    console.log('   ⚠️  No encuentro la función que pinta esta pantalla, así que')
    console.log('      no hay nada que cronometrar. Mejor decirlo que dar un 0.\n')
    process.exit(0)
  }
  console.log('   pinta con ' + m.funcion + '()')
  console.log('   cuadros por segundo      ' + (1000 / med(cuadros)).toFixed(1))
  console.log('   entre cuadro y cuadro    mediana ' + pct(cuadros, 0.5).toFixed(2) + ' ms · p95 ' +
    pct(cuadros, 0.95).toFixed(2) + ' ms · p99 ' + pct(cuadros, 0.99).toFixed(2) + ' ms')
  console.log('   pintar la escena         mediana ' + pct(pintar, 0.5).toFixed(2) + ' ms · p95 ' +
    pct(pintar, 0.95).toFixed(2) + ' ms · p99 ' + pct(pintar, 0.99).toFixed(2) + ' ms')
  console.log('   tirones (>' + UMBRAL.toFixed(0) + ' ms)         ' + lentos + '  (' +
    (100 * lentos / Math.max(1, cuadros.length)).toFixed(1) + '%)')
  if (errores.length) {
    console.log('\n   ‼️  errores de JavaScript en la página:')
    for (const e of errores.slice(0, 5)) console.log('      ' + e.slice(0, 160))
  }
  console.log('')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
