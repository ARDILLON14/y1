#!/usr/bin/env node
/**
 * CriptoMundo — lanzador de la suite
 *
 * POR QUÉ EXISTE
 * Antes la suite era una sola línea de package.json con cuarenta y tantos
 * comandos encadenados con `&&`. Eso tiene dos problemas y los dos
 * costaron tiempo de verdad:
 *
 *   1. El primero que falla se lleva por delante a todos los que vienen
 *      detrás. Un fallo tapaba treinta resultados y no se sabía si había
 *      uno roto o treinta y uno.
 *   2. Va en serie. Cada archivo arranca su propio servidor y espera dos
 *      segundos a que levante, así que la suite entera tardaba casi media
 *      hora en una máquina en la que el trabajo real son unos minutos.
 *
 * Lo segundo no se podía arreglar sin más: la auditoría (§5.7) dejó
 * escrito que la suite no se podía paralelizar. Al mirarlo de cerca, el
 * motivo que daba —el límite de registro por IP— no se sostiene: cada
 * archivo arranca su PROPIO servidor, y el contador de ese límite vive en
 * la memoria de cada proceso. Lo que sí había eran servidores huérfanos
 * de pruebas anteriores, y eso se arregló en el STEP 1.
 *
 * Comprobado antes de escribir esto: ningún par de pruebas comparte
 * puerto ni archivo de datos.
 *
 * Uso:
 *   node run-tests.js            todo, con paralelismo automático
 *   node run-tests.js --serie    de una en una (para comparar)
 *   node run-tests.js -j 8       con ocho a la vez
 *   node run-tests.js turnos     solo las que contengan "turnos"
 */
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')

// Puerto de cada prueba. Es la ÚNICA lista: package.json llama aquí, así
// que añadir una prueba es añadir una línea en un sitio y no en dos.
const PRUEBAS = [
  ['test-seguridad', 3991], ['test-analitica', 3992], ['test-taller-casa-gremios', 3993],
  ['test-misiones-mundo', 3994], ['test-personajes', 3995], ['test-tiempo-real', 3996],
  ['test-primeros-pasos', 3997], ['test-invitaciones', 3998], ['test-movil', 3999],
  ['test-red-cliente', 3986], ['test-avisos', 3985], ['test-arreglos-v20', 3405],
  ['test-arena', 3420], ['test-personaje-propio', 3470], ['test-contenido', 3560],
  ['test-revision', 3810], ['test-recursos', 3820], ['test-espadas', 3830],
  ['test-armas-visual', 3840], ['test-arena-navegador', 3850], ['test-arena-http', 3862],
  ['test-produccion', 3872], ['test-movimiento', 3880], ['test-ia-enemigos', 3910],
  ['test-mundo-zona', 3460], ['test-proyectiles', 3920], ['test-animaciones', 3930],
  ['test-socket-fugas', 3940], ['test-turnos', 3950], ['test-turnos-pantalla', 3960],
  ['test-habilidades', 3970], ['test-mundo-combate', 3975], ['test-mundo-recursos', 3976],
  ['test-arena-ventanas', 3977], ['test-equipo-vida', 3978], ['test-pvp-pantalla', 3979],
  ['test-mundo-multijugador', 3980], ['test-sesiones-persisten', 3881],
  ['test-arena-hurtbox', 3882], ['test-mazmorra-salas', 3883],
  ['test-economia-objetos', 3884], ['test-mazmorra-jefe', 3885],
  ['test-muerte-progreso', 3886], ['test-sprites-armas', 3887],
  ['test-paginas', 3888], ['test-autoridad-servidor', 3889],
  ['test-partida-completa', 3890], ['test-descanso', 3891],
  ['test-primera-mision', 3892],
]

// Estas miden TIEMPO: duraciones de animación, ventanas de golpe,
// velocidad. Con la máquina cargada de servidores compiten por CPU y sus
// medidas se ensucian, así que van solas al final. No es que sean
// frágiles: es que miden algo que el paralelismo altera de verdad.
const A_SOLAS = new Set(['test-movimiento', 'test-arena-ventanas', 'test-animaciones'])

const args = process.argv.slice(2)
const serie = args.includes('--serie')
const jIdx = args.findIndex(a => a === '-j' || a === '--jobs')
const filtro = args.find(a => !a.startsWith('-') && (jIdx === -1 || args[jIdx + 1] !== a))
// Cada prueba pasa casi todo su tiempo esperando al servidor y durmiendo
// entre peticiones, así que se pueden solapar bastantes más que núcleos.
const TRABAJOS = serie ? 1 : Math.max(1, Number(jIdx >= 0 ? args[jIdx + 1] : 0) || Math.min(6, os.cpus().length))

const RESUMEN = /(\d+) (?:pruebas )?OK · (\d+) fallidas/

function correr(nombre, puerto) {
  return new Promise(resolve => {
    const t0 = Date.now()
    const argv = nombre === 'test-build' ? [] : ['--spawn']
    const hijo = spawn(process.execPath, [path.join(__dirname, nombre + '.js'), ...argv], {
      env: Object.assign({}, process.env, { PORT: String(puerto) }),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let salida = ''
    hijo.stdout.on('data', c => salida += c)
    hijo.stderr.on('data', c => salida += c)
    // Cinco minutos es el techo que ya usaba el lanzador de antes. Una
    // prueba que se pasa de ahí está colgada, no lenta.
    const reloj = setTimeout(() => { try { hijo.kill('SIGKILL') } catch {} }, 300000)
    hijo.on('close', codigo => {
      clearTimeout(reloj)
      const m = RESUMEN.exec(salida)
      resolve({
        nombre, codigo, salida,
        ok: m ? Number(m[1]) : null,
        fallidas: m ? Number(m[2]) : null,
        segundos: (Date.now() - t0) / 1000,
      })
    })
  })
}

async function enTandas(lista, trabajos) {
  const out = []
  let siguiente = 0
  const obreros = Array.from({ length: Math.min(trabajos, lista.length) }, async () => {
    while (siguiente < lista.length) {
      const i = siguiente++
      const [nombre, puerto] = lista[i]
      const r = await correr(nombre, puerto)
      out.push(r)
      const estado = r.codigo === 0 ? '✅' : '❌'
      console.log(`  ${estado} ${nombre.padEnd(28)} ${String(r.ok ?? '?').padStart(3)} OK · ` +
                  `${String(r.fallidas ?? '?')} fallidas  (${r.segundos.toFixed(0)}s)`)
    }
  })
  await Promise.all(obreros)
  return out
}

async function main() {
  const t0 = Date.now()
  let lista = PRUEBAS.filter(([n]) => !filtro || n.includes(filtro))
  if (!lista.length) { console.error(`Ninguna prueba coincide con "${filtro}"`); process.exit(1) }

  const resultados = []

  // La compilación primero y sola: si src/ y el archivo generado no
  // coinciden, lo que midan las demás no vale para nada.
  if (!filtro || 'test-build'.includes(filtro)) {
    console.log('\n── COMPILACIÓN ──')
    const r = await correr('test-build', 3000)
    resultados.push(r)
    console.log(`  ${r.codigo === 0 ? '✅' : '❌'} test-build  ${r.ok ?? '?'} OK · ${r.fallidas ?? '?'} fallidas`)
    if (r.codigo !== 0) {
      console.log(r.salida.split('\n').filter(l => l.includes('❌')).join('\n'))
      console.log('\nLa compilación falla: el resto de la suite no diría nada útil.\n')
      process.exit(1)
    }
  }

  const juntas = lista.filter(([n]) => !A_SOLAS.has(n))
  const solas = lista.filter(([n]) => A_SOLAS.has(n))

  if (juntas.length) {
    console.log(`\n── ${juntas.length} PRUEBAS, ${TRABAJOS} A LA VEZ ──`)
    resultados.push(...await enTandas(juntas, TRABAJOS))
  }
  if (solas.length) {
    // Un respiro antes de las que miden tiempo.
    //
    // Cuando la tanda en paralelo termina, sus procesos de prueba ya han
    // salido pero los SERVIDORES que arrancaron tardan un momento más en
    // morir de verdad. Empezar encima de esa cola deja la máquina
    // cargada justo cuando toca medir milisegundos, y entonces una de
    // estas falla sin que haya nada roto. Pasó con test-arena-ventanas:
    // en verde las tres veces que se lanzó sola, en rojo dentro de la
    // suite.
    if (juntas.length) await new Promise(r => setTimeout(r, 2500))
    console.log('\n── LAS QUE MIDEN TIEMPO, DE UNA EN UNA ──')
    resultados.push(...await enTandas(solas, 1))
  }

  const malas = resultados.filter(r => r.codigo !== 0)
  const totalOk = resultados.reduce((a, r) => a + (r.ok || 0), 0)
  const totalMal = resultados.reduce((a, r) => a + (r.fallidas || 0), 0)

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${resultados.length} archivos · ${totalOk} comprobaciones OK · ${totalMal} fallidas`)
  console.log(`  ${((Date.now() - t0) / 1000).toFixed(0)}s en total`)
  console.log('══════════════════════════════════════════════')

  if (malas.length) {
    console.log('\nLo que falló, con su motivo:\n')
    for (const r of malas) {
      console.log(`── ${r.nombre} (salida ${r.codigo}) ──`)
      const lineas = r.salida.split('\n').filter(l => l.includes('❌'))
      console.log(lineas.length ? lineas.join('\n') : r.salida.split('\n').slice(-12).join('\n'))
      console.log('')
    }
    process.exit(1)
  }
  console.log('\nTodo en verde.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
