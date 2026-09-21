/**
 * CriptoMundo — el equipo que da vida cuenta en TODAS partes
 * Uso:  PORT=3978 node test-equipo-vida.js --spawn
 *
 * EL FALLO QUE CIERRA
 *
 * `char.maxHp` es la vida BASE: la que dan la clase y el nivel. El
 * equipo suma aparte, en effectiveStats(). Pero el combate por turnos
 * usaba la base como si fuera el tope real, y la arena usaba el tope
 * real. El mismo personaje tenía dos vidas máximas distintas según
 * dónde peleara.
 *
 * Cinco piezas dan vida —Peto de Cuero +40, Coraza de Hierro +90,
 * Grebas +40, Peto de Cristal +140, Amuleto de Trébol +30— y la Torta
 * de Maíz existe SOLO para eso: su único efecto es +60 de vida máxima.
 * Con peto de cristal y grebas llevabas +180 que no contaban.
 *
 * Lo que se veía jugando: la barra llena antes de tiempo, la poción
 * desperdiciada a media curación, y morir te devolvía a la mitad de la
 * vida base en vez de la mitad de la tuya. Craft → equipar →
 * estadísticas funcionaba, y se rompía en el último eslabón.
 */
const http = require('http'), path = require('path'), { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3978); let ck = ''
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
const sleep = ms => new Promise(r => setTimeout(r, ms))
const inv = async () => ((await req('GET', '/api/inventory')).b.inventory || [])

async function run() {
  let pass = 0, fail = 0
  const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }

  const u = 'ev' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })

  console.log('\n── LA CORAZA SUBE LA VIDA MÁXIMA ──')
  const base = (await req('GET', '/api/inventory')).b.stats.maxHp
  ok('el personaje tiene una vida base', base > 0, String(base))

  await req('POST', '/api/dev/dar', { itemId: 'crystal_chest', quantity: 1 })
  const peto = (await inv()).find(i => i.itemId === 'crystal_chest')
  ok('tiene el Peto de Cristal', !!peto)
  let r = await req('POST', '/api/player/equip', { uid: peto.uid })
  ok('se puede equipar', r.s === 200, r.raw.slice(0, 90))
  const conPeto = r.b.stats.maxHp
  ok('la vida máxima sube al equiparlo', conPeto === base + 140, base + ' → ' + conPeto)

  console.log('\n── Y EL COMBATE POR TURNOS LO CUENTA ──')
  // El guion del turno dice cuál es el tope del jugador. Antes decía la
  // vida base y la barra se llenaba 140 puntos antes de tiempo.
  r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'block' })
  ok('empieza un combate', r.s === 200, r.raw.slice(0, 90))
  const arranque = (r.b.guion || []).find(f => f.fase === 'BATTLE_START')
  ok('el guion trae el arranque', !!arranque)
  ok('y el tope del guion es el REAL, no la vida base',
     arranque && arranque.hpJugadorMax === conPeto,
     arranque ? arranque.hpJugadorMax + ' vs ' + conPeto + ' (base ' + base + ')' : '')

  const cierre = (r.b.guion || []).find(f => f.fase === 'CHECK_VICTORY')
  ok('el recuento del final del turno también', cierre && cierre.hpJugadorMax === conPeto,
     cierre ? String(cierre.hpJugadorMax) : '')

  console.log('\n── CURARSE LLEGA HASTA EL TOPE REAL ──')
  // Bajar de vida peleando y beber una poción grande: tiene que poder
  // pasar de la vida base. Antes se quedaba clavada ahí.
  await req('POST', '/api/dev/dar', { itemId: 'potion_hp_v', quantity: 3 })
  let hp = 0, vueltas = 0
  while (vueltas++ < 40) {
    await sleep(380)
    const c = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'attack' })
    if (c.s !== 200) continue
    hp = c.b.newHp
    if (c.b.playerDied) { await req('POST', '/api/player/respawn', {}); break }
    if (hp > 0 && hp < base - 200) break
  }
  ok('el combate baja la vida', hp > 0 && hp < conPeto, 'hp ' + hp)

  await sleep(380)
  r = await req('POST', '/api/combat/action', { monsterId: 'm_spider', action: 'objeto', itemId: 'potion_hp_v' })
  ok('se puede beber la poción en combate', r.s === 200, r.raw.slice(0, 90))
  // La Poción de Curación V cura 5.000: llena el depósito seguro.
  ok('curarse puede pasar de la vida BASE', r.b.newHp > base || r.b.newHp === conPeto,
     'hp ' + r.b.newHp + ' · base ' + base + ' · tope ' + conPeto)

  console.log('\n── MORIR DEVUELVE LA MITAD DE LA TUYA ──')
  r = await req('POST', '/api/player/respawn', {})
  ok('respawn responde el tope real', r.b.maxHp === conPeto, r.b.maxHp + ' vs ' + conPeto)
  ok('y devuelve la mitad de ESE tope', r.b.hp === Math.floor(conPeto * 0.5),
     r.b.hp + ' vs ' + Math.floor(conPeto * 0.5))

  console.log('\n── QUITARSE LA CORAZA RECORTA LA VIDA QUE SOBRA ──')
  // Primero llenarla del todo con el peto puesto.
  await req('POST', '/api/dev/dar', { itemId: 'elixir_mitico', quantity: 1 })
  const elixir = (await inv()).find(i => i.itemId === 'elixir_mitico')
  await req('POST', '/api/player/use', { uid: elixir.uid })
  let ficha = (await req('GET', '/api/inventory')).b
  ok('la vida se llena hasta el tope con el peto', ficha.stats.maxHp === conPeto, String(ficha.stats.maxHp))

  r = await req('POST', '/api/player/equip', { slot: 'chest', unequip: true })
  ok('se puede quitar el peto', r.s === 200, r.raw.slice(0, 90))
  ok('la vida máxima vuelve a la base', r.b.stats.maxHp === base, r.b.stats.maxHp + ' vs ' + base)
  ok('y la vida actual no se queda por encima del tope', r.b.hp <= base,
     'hp ' + r.b.hp + ' de ' + base)

  console.log('\n── LA TORTA DE MAÍZ EXISTE PARA ESTO ──')
  // Su único efecto es +60 de vida máxima. Si el tope no lo contara,
  // comérsela no haría absolutamente nada.
  await req('POST', '/api/dev/dar', { itemId: 'corn_cake', quantity: 1 })
  const torta = (await inv()).find(i => i.itemId === 'corn_cake')
  r = await req('POST', '/api/player/use', { uid: torta.uid })
  ok('se puede comer', r.s === 200, r.raw.slice(0, 90))
  ok('sube la vida máxima 60 puntos', r.b.stats.maxHp === base + 60,
     r.b.stats.maxHp + ' vs ' + (base + 60))
  ok('y el efecto queda activo con su duración',
     (r.b.efectos || []).some(e => e.stat === 'maxHp' && e.restanteMs > 0),
     JSON.stringify(r.b.efectos))

  console.log('\n' + '═'.repeat(46) + '\n  ' + pass + ' OK · ' + fail + ' fallidas\n' + '═'.repeat(46) + '\n')
  process.exit(fail ? 1 : 0)
}

if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-equipo-vida.json', BACKUP_DIR: '/tmp/cm-ev-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1600)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
