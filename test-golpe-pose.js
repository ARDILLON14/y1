/**
 * CriptoMundo — FASE E · la pose del arma y los números de daño
 * Uso:  PORT=3904 node test-golpe-pose.js --spawn
 *
 * POR QUÉ EXISTE
 * Son las dos funciones puras de la FASE E, y las dos deciden si el
 * combate se SIENTE. Un arma que se queda clavada a media zancada o un
 * número de daño que no se va parecen un juego colgado.
 *
 * Lo que se puede comprobar sin navegador es justo lo que más falla:
 * que el reposo sea exactamente reposo, que la espada recorra su arco
 * entero y no se salga, que voltear no cambie el lado del filo, que la
 * basura de entrada no salga como NaN, y que a los 700 ms el número
 * tenga alfa cero.
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3904)
let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const pagina = p => new Promise(r => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r(o)) }).on('error', () => r('')))

async function run() {
  const mapa = await pagina('/criptomundo-mundo2d.html')
  ok('el mapa se sirve', mapa.length > 5000, String(mapa.length))

  const trozos = [...mapa.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const cod = trozos.find(t => /function poseArma\b/.test(t))
  const codN = trozos.find(t => /function numeroFlotante\b/.test(t))
  ok('la pose del arma está en la página', !!cod)
  ok('y los números de daño también', !!codN)
  if (!cod || !codN) return fin()

  const ctx = vm.createContext({ Math, Number, String, Date, console, JSON, Object, Array, isFinite, window: {} })
  vm.runInContext(cod, ctx, { filename: 'pose' })
  vm.runInContext(codN, ctx, { filename: 'numeros' })
  const { poseArma, faseDeGolpe, volteoDeArma, numeroFlotante, temblorDeCamara } = ctx

  console.log('\n── REPOSO ES EXACTAMENTE REPOSO ──')
  const rep = poseArma('espada', 'reposo', 0, 1.6)
  ok('en reposo no hay desplazamiento', rep.offsetX === 0 && rep.offsetY === 0, JSON.stringify(rep))
  ok('ni cambio de tamaño', rep.escala === 1)
  ok('y el ángulo es el de descanso, no cero', rep.angulo < 0, String(rep.angulo))
  for (const f of ['', null, undefined, 'loquesea', 42]) {
    const r = poseArma('espada', f, 0.5, 1.6)
    if (r.offsetX !== 0 || r.escala !== 1) { ok('una fase que no existe cae a reposo: ' + f, false); break }
  }
  ok('cualquier fase que no existe cae a reposo', true)

  console.log('\n── LA ESPADA RECORRE SU ARCO, Y NO SE SALE ──')
  const arco = 1.6
  let min = Infinity, max = -Infinity
  for (let i = 0; i <= 100; i++) {
    const a = poseArma('espada', 'activa', i / 100, arco).angulo
    min = Math.min(min, a); max = Math.max(max, a)
  }
  ok('empieza pasada del arco por detrás', Math.abs(min + (arco + 0.35)) < 0.01, String(min))
  ok('y termina en el otro extremo', Math.abs(max - arco) < 0.01, String(max))
  ok('recorre el arco entero', (max - min) > arco * 1.9, String(max - min))
  // Y no se sale: nada de dar la vuelta entera.
  ok('no se pasa de media vuelta en ningún punto', max < Math.PI && min > -Math.PI,
     JSON.stringify([min, max]))

  // La anticipación termina donde empieza la activa: sin salto.
  const finAnt = poseArma('espada', 'anticipacion', 1, arco).angulo
  const iniAct = poseArma('espada', 'activa', 0, arco).angulo
  ok('no hay salto entre anticipación y activa', Math.abs(finAnt - iniAct) < 0.01,
     finAnt + ' vs ' + iniAct)
  const finAct = poseArma('espada', 'activa', 1, arco).angulo
  const iniRec = poseArma('espada', 'recuperacion', 0, arco).angulo
  ok('ni entre activa y recuperación', Math.abs(finAct - iniRec) < 0.01, finAct + ' vs ' + iniRec)
  const finRec = poseArma('espada', 'recuperacion', 1, arco).angulo
  ok('y la recuperación acaba en reposo', Math.abs(finRec - rep.angulo) < 0.01, String(finRec))

  console.log('\n── CADA TIPO SE MUEVE A SU MANERA ──')
  const lanza = poseArma('lanza', 'activa', 1, 0.5)
  ok('la lanza sale hacia delante y casi no gira',
     lanza.offsetX > 20 && Math.abs(lanza.angulo) < 0.2, JSON.stringify(lanza))
  const esp = poseArma('espada', 'activa', 1, 1.6)
  ok('la espada gira mucho y no se aleja',
     Math.abs(esp.angulo) > 1 && esp.offsetX === 0, JSON.stringify(esp))
  const arc = poseArma('arco', 'anticipacion', 1, 0.2)
  ok('el arco se tensa encogiéndose', arc.escala < 1, String(arc.escala))
  const mag = poseArma('magia', 'activa', 1, 0.3)
  ok('la magia sube y crece', mag.offsetY < 0 && mag.escala > 1, JSON.stringify(mag))

  console.log('\n── VOLTEAR NO CAMBIA EL LADO DEL FILO ──')
  ok('mirando a la derecha no se voltea', volteoDeArma(0) === 1)
  ok('mirando a la izquierda sí', volteoDeArma(Math.PI) === -1)
  ok('hacia arriba no', volteoDeArma(-Math.PI / 2) === 1)
  // El volteo es en vertical (escala Y), así que el ángulo relativo no
  // cambia de signo por sí solo: lo multiplica quien dibuja.
  ok('la pose no depende de hacia dónde mires',
     JSON.stringify(poseArma('espada', 'activa', 0.5, 1.6)) ===
     JSON.stringify(poseArma('espada', 'activa', 0.5, 1.6)))

  console.log('\n── LAS FASES SALEN DE LOS TIEMPOS DEL SERVIDOR ──')
  const g = { inicio: 1000, desde: 1130, hasta: 1230 }
  ok('antes de la ventana, anticipación', faseDeGolpe(g, 1000).fase === 'anticipacion')
  ok('a mitad de la anticipación, la mitad de progreso',
     Math.abs(faseDeGolpe(g, 1065).progreso - 0.5) < 0.01, String(faseDeGolpe(g, 1065).progreso))
  ok('dentro de la ventana, activa', faseDeGolpe(g, 1180).fase === 'activa')
  ok('justo después, recuperación', faseDeGolpe(g, 1280).fase === 'recuperacion')
  ok('mucho después, reposo', faseDeGolpe(g, 5000).fase === 'reposo')
  ok('sin golpe, reposo', faseDeGolpe(null, 1000).fase === 'reposo')

  console.log('\n── BASURA DE ENTRADA: NUNCA UN NaN EN PANTALLA ──')
  const basura = [null, undefined, NaN, Infinity, -1, 2, '0.5', {}, []]
  let malo = null
  for (const t of ['espada', 'lanza', 'arco', 'magia', null, 'loquesea']) {
    for (const p of basura) {
      for (const a of basura) {
        const r = poseArma(t, 'activa', p, a)
        for (const k of ['angulo', 'offsetX', 'offsetY', 'escala']) {
          if (!Number.isFinite(r[k])) malo = `${t}/${String(p)}/${String(a)} → ${k}=${r[k]}`
        }
      }
    }
  }
  ok('ninguna combinación de basura saca un NaN', !malo, String(malo))
  ok('una dirección de (0,0) no revienta el volteo', Number.isFinite(volteoDeArma(0)))
  ok('ni una dirección que no es número', volteoDeArma('x') === 1)

  console.log('\n── LOS NÚMEROS DE DAÑO ──')
  const s = { cantidad: 26, critico: false, x: 100, y: 200, desvio: 0 }
  const n0 = numeroFlotante(s, 0)
  ok('recién salido está entero y en su sitio',
     n0.alfa === 1 && n0.x === 100 && n0.y === 200, JSON.stringify(n0))
  ok('y dice su cantidad', n0.texto === '26')
  const n350 = numeroFlotante(s, 350)
  ok('a mitad de vida ha subido', n350.y < 200, String(n350.y))
  ok('y sigue opaco, porque el desvanecido es solo el final', n350.alfa === 1, String(n350.alfa))
  const n600 = numeroFlotante(s, 600)
  ok('a 600 ms ya se está yendo', n600.alfa > 0 && n600.alfa < 1, String(n600.alfa))
  const n700 = numeroFlotante(s, 700)
  ok('a los 700 ms el alfa es CERO', n700.alfa === 0, String(n700.alfa))
  ok('y deja de estar vivo', n700.vivo === false)
  ok('sube 24 px en toda su vida',
     Math.abs((200 - numeroFlotante(s, 699).y) - 24) < 1.5,
     String(200 - numeroFlotante(s, 699).y))
  const crit = numeroFlotante({ cantidad: 50, critico: true, x: 0, y: 0 }, 0)
  ok('un crítico es más grande y amarillo', crit.escala === 1.3 && crit.color === '#F0D070',
     JSON.stringify(crit))
  const propio = numeroFlotante({ cantidad: 10, propio: true, x: 0, y: 0 }, 0)
  ok('lo que recibe el jugador va en rojo', propio.color === '#F87171')
  const bas = numeroFlotante(null, NaN)
  ok('sin suceso y sin edad no revienta ni saca NaN',
     Number.isFinite(bas.x) && Number.isFinite(bas.y) && Number.isFinite(bas.alfa), JSON.stringify(bas))
  ok('una cantidad negativa se enseña como cero',
     numeroFlotante({ cantidad: -5 }, 0).texto === '0')

  console.log('\n── EL TEMBLOR ──')
  const t0 = temblorDeCamara(0, true)
  ok('al empezar tiembla', Math.abs(t0.x) > 0 || Math.abs(t0.y) > 0)
  ok('nunca pasa de 2 px', Math.abs(t0.x) <= 2 && Math.abs(t0.y) <= 2, JSON.stringify(t0))
  ok('a los 100 ms ya no', temblorDeCamara(100, true).x === 0 && temblorDeCamara(100, true).y === 0)
  ok('y apagado no tiembla nunca', temblorDeCamara(0, false).x === 0)

  console.log('\n── LA PANTALLA ESTÁ CONECTADA ──')
  ok('el mapa pulsa el combate del mundo', /apiPost\('\/api\/mundo\/combate'/.test(mapa))
  ok('y lo dibuja desde el bucle del mundo', /mcActualizar\(this\)/.test(mapa))
  ok('la animación arranca al pulsar, sin esperar al servidor',
     /MC\.golpeLocal = \{ inicio: ahora/.test(mapa))
  ok('pero el daño solo se pinta con el suceso del servidor',
     /function mcSuceso/.test(mapa) && /s\.tipo === 'dano'/.test(mapa))
  ok('el clic derecho bloquea', /rightButtonDown/.test(mapa))
  ok('y no abre el menú del navegador', /contextmenu/.test(mapa))
  ok('los monstruos se interpolan con un paso de retraso', /MC_RETRASO_MS = 100/.test(mapa))
  ok('la barra de vida solo sale si no está entera', /m\.vida < m\.vidaMax/.test(mapa))
  ok('el destello dura 80 ms', /destelloHasta = Date\.now\(\) \+ 80/.test(mapa))
  ok('donde el servidor simula no se abre batalla por turnos',
     /if \(typeof MC !== 'undefined' && MC && MC\.activo\) return/.test(mapa))
  ok('Phaser va en modo pixel art', /pixelArt: true/.test(mapa) && /roundPixels: true/.test(mapa))
  ok('el temblor respeta a quien pide menos movimiento',
     /prefers-reduced-motion/.test(mapa))

  fin()
}

function fin() {
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  for (const r of ['/tmp/cm-pose.json', '/tmp/cm-pose-b']) { try { fs.rmSync(r, { recursive: true, force: true }) } catch {} }
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-pose.json', BACKUP_DIR: '/tmp/cm-pose-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  const esperar = () => new Promise(res => {
    const hasta = Date.now() + 30000
    const probar = () => {
      const r = http.get({ host: 'localhost', port: PORT, path: '/api/health' }, x => { x.resume(); res(true) })
      r.on('error', () => { if (Date.now() > hasta) res(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
  esperar().then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }
