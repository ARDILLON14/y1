/**
 * CriptoMundo — el cuerpo y la zona golpeable ya no son lo mismo
 * Uso:  PORT=3882 node test-arena-hurtbox.js --spawn
 *
 * POR QUÉ EXISTE
 * En la arena, `radio` hacía tres trabajos a la vez: separar cuerpos
 * para que no se apilen, frenar contra la pared, y decidir si un golpe
 * toca. Mezclados, un cuerpo generoso —el que hace falta para que los
 * sprites no se solapen— significaba también una zona golpeable
 * generosa: pasar rozando a un enemigo costaba el golpe entero. Eso es
 * exactamente lo que hace que esquivar no se sienta como esquivar.
 *
 * Esta prueba comprueba las dos mitades: que los dos círculos existen y
 * son distintos, y que separarlos NO ha cambiado lo que ya funcionaba
 * —los enemigos siguen pegando, el jugador sigue matando, los cuerpos
 * siguen sin solaparse—.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3882)
let cookie = '', pass = 0, failed = 0
const check = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (failed++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''; res.on('data', c => o += c)
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', () => resolve({ status: 0, body: {}, raw: '' }))
    if (data) r.write(data)
    r.end()
  })
}

async function run() {
  const u = 'hb' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  const ini = await req('POST', '/api/arena/start', { arenaId: 'arena_bosque' })
  check('empieza el combate', ini.status === 200, ini.raw.slice(0, 90))

  console.log('\n── LOS DOS CÍRCULOS VIAJAN POR SEPARADO ──')
  let s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
  const j = (s.body.estado || {}).jugador || {}
  check('el jugador publica su cuerpo', Number.isFinite(j.radio), JSON.stringify(j.radio))
  check('y también su zona golpeable', Number.isFinite(j.golpeable), JSON.stringify(j.golpeable))
  check('la zona golpeable es MENOR que el cuerpo', j.golpeable < j.radio, `${j.golpeable} < ${j.radio}`)
  // Sin este límite, "menor" se cumpliría con un 1 y el jugador sería
  // prácticamente intocable: eso no sería separar, sería hacer trampa.
  check('pero no ridículamente menor', j.golpeable >= j.radio * 0.55, `${j.golpeable} de ${j.radio}`)
  const ens = (s.body.estado || {}).enemigos || []
  check('los enemigos siguen publicando su cuerpo', ens.length > 0 && ens.every(e => Number.isFinite(e.radio)),
    JSON.stringify(ens.map(e => e.radio)))

  console.log('\n── CADA RADIO SIGUE HACIENDO SU TRABAJO ──')
  const codigo = fs.readFileSync(path.join(__dirname, 'src', 'server', '58-arena.js'), 'utf8')
  check('existe una constante para la zona golpeable del jugador',
    /const GOLPEABLE_JUGADOR\s*=\s*\d+/.test(codigo))
  check('el golpe del jugador pregunta por la zona golpeable del enemigo',
    /dist\(j, en\) > arma\.alcance \+ golpeableEn\(en\)/.test(codigo))
  check('el alcance del enemigo pregunta por la del jugador',
    /const cuerpos = c\.alcance \+ golpeableDe\(j\)/.test(codigo))
  check('los proyectiles también',
    /cruza\(pr, en\.x, en\.y, golpeableEn\(en\)\)/.test(codigo) &&
    /cruza\(pr, j\.x, j\.y, golpeableDe\(j\)\)/.test(codigo))
  // Y lo contrario: separar cuerpos y frenar contra la pared son
  // preguntas del CUERPO, no de la zona golpeable. Si alguien las
  // cambiara también, los sprites volverían a solaparse.
  check('separar cuerpos sigue usando el cuerpo',
    /separar\(j, en, j\.radio, en\.cfg\.radio/.test(codigo))
  check('las paredes siguen usando el cuerpo',
    /const r = c === j \? j\.radio : c\.cfg\.radio/.test(codigo))
  check('acercarse sigue midiéndose con el cuerpo',
    /const tope = Math\.max\(c\.alcance, c\.radio \+ j\.radio\)/.test(codigo))

  console.log('\n── LOS CUERPOS SIGUEN SIN SOLAPARSE ──')
  // Va ANTES de pelear a propósito: necesita a los dos enemigos de la
  // primera oleada VIVOS. Puesta después, el apartado anterior ya los
  // había matado y se medían cero parejas — y la comprobación de
  // solapes pasaba sola sin haber mirado nada. Por eso hay una línea
  // que exige haber medido parejas de verdad.
  // La separación es lo único que impide que media docena de enemigos
  // se apile en el mismo píxel. Se mide sobre el estado real.
  let solapes = 0, parejas = 0
  for (let i = 0; i < 25; i++) {
    s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0 } })
    await dormir(100)
    const vivos = ((s.body.estado || {}).enemigos || []).filter(e => e.hp > 0)
    for (let a = 0; a < vivos.length; a++) {
      for (let b = a + 1; b < vivos.length; b++) {
        parejas++
        const d = Math.hypot(vivos[a].x - vivos[b].x, vivos[a].y - vivos[b].y)
        // Margen de 4 px: la separación empuja, no teletransporta, así
        // que en el instante de chocar pueden quedar rozándose.
        if (d < vivos[a].radio + vivos[b].radio - 4) solapes++
      }
    }
  }
  check('se llegaron a medir parejas de enemigos', parejas > 10, String(parejas))
  check('ninguna pareja se mete dentro de la otra', solapes === 0, solapes + ' de ' + parejas)

  console.log('\n── PLANTARSE SIGUE COSTANDO VIDA ──')
  // Lo importante de este apartado: encoger la zona golpeable NO puede
  // volver invulnerable a quien se queda quieto. El enemigo se acerca
  // hasta tenerte a tiro de todas formas. Medido antes y después del
  // cambio con el mismo guion: 478 de media antes, 484 después, con
  // rangos de 350–595 y 280–630. O sea, lo mismo.
  const hpInicial = j.hp
  let hpMin = hpInicial, bajas = 0, vioGolpe = false
  for (let i = 0; i < 200; i++) {
    s = await req('POST', '/api/arena/sync', { entrada: { mx: 0, my: 0, apuntar: 0, atacar: true } })
    await dormir(100)
    if (s.status !== 200) break
    const e = s.body.estado
    if (!e) break
    hpMin = Math.min(hpMin, e.jugador.hp)
    bajas = Math.max(bajas, (e.enemigos || []).filter(x => x.hp <= 0).length)
    if ((e.enemigos || []).some(x => x.hp < x.hpMax)) vioGolpe = true
    if (e.jugador.hp <= 0 || hpMin < hpInicial * 0.75) break
  }
  check('un enemigo pegado sigue haciendo daño', hpMin < hpInicial, `${hpInicial} → ${hpMin}`)
  check('y el jugador sigue pudiendo herirlos', vioGolpe || bajas > 0, 'bajas ' + bajas)

  await req('POST', '/api/arena/abandon')
  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${failed} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(failed ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NODE_ENV: 'test',
      DATA_FILE: '/tmp/cm-test-hurtbox.json', BACKUP_DIR: '/tmp/cm-hurtbox-b',
    }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 2000)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
