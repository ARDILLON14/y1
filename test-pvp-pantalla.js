/**
 * CriptoMundo — la pestaña de PvP ya no es una pantalla en blanco
 * Uso:  PORT=3979 node test-pvp-pantalla.js --spawn
 *
 * EL FALLO QUE CIERRA
 *
 * La pestaña "PVP — ARENA" llamaba a setMode('pvp'), que buscaba un
 * elemento con id "pvp-mode". Ese elemento NO EXISTÍA en toda la
 * página: pulsarla escondía las mazmorras y no enseñaba nada. Pantalla
 * en blanco, sin ningún error visible.
 *
 * Y mientras tanto el servidor tenía desde hacía versiones
 * emparejamiento por Elo, simulación asalto a asalto y apuesta de oro,
 * con pruebas en verde comprobando que el cliente no puede declarar el
 * resultado. No lo llamaba nadie.
 *
 * Había además ciento veinte líneas de CSS escritas para ese panel sin
 * una sola etiqueta que las usara.
 */
const http = require('http'), path = require('path'), { spawn } = require('child_process'), vm = require('vm')
const PORT = Number(process.env.PORT || 3979); let ck = ''
function req(m, p, b) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null; const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d); if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c); x.on('end', () => {
        if (x.headers['set-cookie']) ck = x.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, raw: o })
      })
    }); q.on('error', () => r({ s: 0, b: {}, raw: '' })); if (d) q.write(d); q.end()
  })
}
const pagina = p => new Promise(r => http.get({ host: 'localhost', port: PORT, path: p },
  x => { let o = ''; x.on('data', c => o += c); x.on('end', () => r(o)) }))
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  let pass = 0, fail = 0
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

  const html = await pagina('/criptomundo-mazmorras-pvp.html')

  console.log('\n── EL PANEL EXISTE ──')
  ok('la pestaña llama a setMode con pvp', /setMode\('pvp'/.test(html))
  ok('y el panel que busca EXISTE', /id="pvp-mode"/.test(html))
  ok('las mazmorras se cierran antes del panel', /\/dng-mode/.test(html))

  console.log('\n── Y USA EL CSS QUE YA ESTABA ESCRITO ──')
  // Ciento veinte líneas de estilos sin una etiqueta que las usara.
  for (const clase of ['pvp-layout', 'pvp-pool', 'pvp-center', 'pvp-arena-visual',
                       'pvp-fighter', 'pvp-hp-fill', 'pvp-log', 'pvp-ready-btn', 'bet-chips']) {
    const enCss = new RegExp('\\.' + clase + '[ ,{:]').test(html)
    const enHtml = new RegExp('class="[^"]*' + clase).test(html)
    ok('.' + clase + ' pasa de CSS muerto a marcado vivo', enCss && enHtml,
       'css=' + enCss + ' html=' + enHtml)
  }

  console.log('\n── EL CLIENTE NO DECIDE EL DUELO ──')
  ok('la pantalla pide el duelo al servidor', /\/api\/pvp\/match/.test(html))
  ok('y reproduce los asaltos que devuelve', /duelo\.asaltos/.test(html))
  ok('no calcula daño por su cuenta', !/Math\.random\(\)[^)]*dmg/.test(html))

  console.log('\n── EJECUTANDO EL MÓDULO DE LA PÁGINA ──')
  const u = 'pv' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  const trozos = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1])
  const codigo = trozos.find(t => /async function pvpDuelo/.test(t))
  ok('la página trae el módulo de PvP', !!codigo, trozos.length + ' scripts')
  if (!codigo) { console.log('\n  ' + pass + ' OK · ' + fail + ' fallidas\n'); process.exit(1) }

  const els = {}
  const nuevo = () => ({
    textContent: '', innerHTML: '', style: {}, disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.hijos = (this.hijos || []).concat([c]) },
    scrollTop: 0, scrollHeight: 0,
  })
  const ventana = {
    console, setTimeout, clearTimeout, Math, Date, JSON, Promise, Number, String, Object, Array, RegExp,
    document: {
      getElementById(id) { return els[id] || (els[id] = nuevo()) },
      createElement() { return nuevo() },
      querySelectorAll() { return [] },
    },
    setMode() { ventana.modoPedido = true },
    async api(ruta, cuerpo) {
      const x = await req(cuerpo ? 'POST' : 'GET', ruta, cuerpo)
      return { ok: x.s >= 200 && x.s < 300, d: x.b }
    },
  }
  ventana.window = ventana; ventana.globalThis = ventana
  const ctx = vm.createContext(ventana)
  let reventó = null
  try { vm.runInContext(codigo, ctx, { filename: 'pvp', timeout: 5000 }) }
  catch (e) { reventó = e.message }
  ok('el módulo se ejecuta sin reventar', !reventó, String(reventó))
  ok('define el duelo', typeof ventana.pvpDuelo === 'function')

  await ventana.pvpCargar()
  ok('la pantalla se trae tu ficha', !!ventana.PVP.ficha, JSON.stringify(ventana.PVP.ficha && ventana.PVP.ficha.name))
  ok('y enseña tu oro', els['pvp-oro'].textContent !== '—', els['pvp-oro'].textContent)
  ok('y tu Elo', /Elo/.test(els['pvp-ficha'].innerHTML), els['pvp-ficha'].innerHTML.slice(0, 60))
  ok('dice que el rival todavía no es otra persona',
     /multijugador/.test(els['pvp-ficha'].innerHTML))

  console.log('\n── UN DUELO DE VERDAD ──')
  const antes = (await req('GET', '/api/player')).b.character
  await ventana.pvpDuelo()
  const despues = (await req('GET', '/api/player')).b.character

  ok('el rival aparece con su Elo', /Elo/.test(els['pvp-rival-nombre'].textContent),
     els['pvp-rival-nombre'].textContent)
  ok('el duelo se cuenta asalto a asalto en el registro',
     (els['pvp-log'].hijos || []).length > 2, ((els['pvp-log'].hijos || []).length) + ' líneas')
  ok('las barras de vida se mueven',
     els['pvp-rival-hp'].style.width !== undefined && els['pvp-rival-hp'].style.width !== '',
     String(els['pvp-rival-hp'].style.width))
  ok('el Elo cambia EN EL SERVIDOR', despues.pvpRating !== antes.pvpRating,
     antes.pvpRating + ' → ' + despues.pvpRating)
  ok('y el duelo queda contado', (despues.pvpWins + despues.pvpLosses) > (antes.pvpWins + antes.pvpLosses),
     (antes.pvpWins + antes.pvpLosses) + ' → ' + (despues.pvpWins + despues.pvpLosses))

  console.log('\n── EL SERVIDOR SIGUE MANDANDO ──')
  await sleep(5100)
  const trampa = await req('POST', '/api/pvp/match', {
    wagerGold: 50, result: 'win', newRating: 99999, ratingChange: 5000,
  })
  ok('mandar el resultado no lo impone', trampa.s === 200 && trampa.b.newRating < 9999,
     'rating ' + trampa.b.newRating)
  const tras = (await req('GET', '/api/player')).b.character
  ok('ni se cuela un Elo inventado', tras.pvpRating < 9999, String(tras.pvpRating))

  console.log('\n── Y EL DUELO VIENE CON SUS ASALTOS ──')
  await sleep(5100)
  const m = await req('POST', '/api/pvp/match', { wagerGold: 0 })
  ok('el servidor devuelve el duelo, no solo el veredicto', !!m.b.duelo, Object.keys(m.b).join(','))
  ok('con sus asaltos', m.b.duelo && (m.b.duelo.asaltos || []).length > 0,
     m.b.duelo ? String((m.b.duelo.asaltos || []).length) : '')
  ok('y la vida máxima de los dos', m.b.duelo && m.b.duelo.tu.hpMax > 0 && m.b.duelo.rival.hpMax > 0,
     m.b.duelo ? JSON.stringify({ tu: m.b.duelo.tu.hpMax, rival: m.b.duelo.rival.hpMax }) : '')

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-pvp.json', '/tmp/cm-pvp-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-pvp.json', BACKUP_DIR: '/tmp/cm-pvp-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

// Espera a que el servidor CONTESTE, en vez de dar por hecho que en unos
// milisegundos ya estará arriba.
//
// Esa suposición se cae en cuanto la suite corre en paralelo: varios
// servidores levantando a la vez tardan más, y el síntoma era un
// ECONNREFUSED que parecía un fallo de la prueba y no lo era.
function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = require('http').get({ host: 'localhost', port: puerto, path: '/api/health' }, res => {
        res.resume()
        resolve(true)
      })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}

// Empieza siempre de cero.
//
// Sin esto, una prueba hereda el mundo que dejó la ejecución anterior:
// publicaciones a medio vender, personajes con nivel, enfriamientos sin
// cumplir. Lo destapó test-economia-objetos, que compraba dos unidades de
// una publicación que la vez anterior había dejado en una, y contestaba
// "Cantidad inválida" sin que hubiera nada roto.
function limpiarDatos() {
  const fs = require('fs')
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
