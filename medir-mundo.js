#!/usr/bin/env node
/**
 * CriptoMundo — qué cuesta pelear en el mundo en tiempo real
 *
 *   node medir-mundo.js
 *
 * POR QUÉ EXISTE
 * La FASE C añade un combate nuevo, y un combate nuevo sin medir es una
 * opinión. Esto contesta con números: cuánto tarda un nivel 1 en matar
 * una araña, cuánta vida le cuesta, cuánto cambia bloquear, y cuánto
 * tarda el jugador en VER lo que hace.
 *
 * No prueba nada: mide. Lo que hay que cumplir está en
 * test-mundo-tiempo-real.js.
 */
const http = require('http'), path = require('path'), fs = require('fs')
const { spawn } = require('child_process')
const PORT = Number(process.env.PORT || 3902)

function req(m, p, b, ck) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    if (ck) h.Cookie = ck
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => { let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, ck: x.headers['set-cookie'] ? x.headers['set-cookie'][0].split(';')[0] : ck }) })
    })
    q.on('error', () => r({ s: 0, b: {}, ck })); if (d) q.write(d); q.end()
  })
}
const dormir = ms => new Promise(r => setTimeout(r, ms))
const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0

async function alta() {
  const u = 'mm' + Math.floor(Math.random() * 1e7)
  const r = await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  await req('POST', '/api/world/explore', { zoneId: 'forest' }, r.ck)
  return { u, ck: r.ck }
}
const donde = async j => (await req('POST', '/api/mundo/sync', { pos: { zona: 'forest' } }, j.ck)).b.tu

async function caminarA(j, x, y) {
  let e = await donde(j)
  for (let i = 0; i < 60 && e; i++) {
    const d = Math.hypot(x - e.x, y - e.y)
    if (d < 20) break
    const a = Math.atan2(y - e.y, x - e.x), p = Math.min(70, d)
    const r = await req('POST', '/api/mundo/sync', { pos: { zona: 'forest', x: e.x + Math.cos(a) * p, y: e.y + Math.sin(a) * p } }, j.ck)
    e = r.b.tu; await dormir(45)
  }
  return e
}

// Una pelea entera contra una araña. Devuelve lo que costó.
async function pelea(bloqueando) {
  const j = await alta()
  let st = (await req('POST', '/api/mundo/combate', { pos: { zona: 'forest', x: 900, y: 600 }, entrada: {} }, j.ck)).b
  const ar = st.monstruos.find(m => m.tipo === 'm_spider')
  if (!ar) return null
  await caminarA(j, ar.x - 40, ar.y)
  const hp0 = (await req('GET', '/api/player', null, j.ck)).b.character.hp
  let obj = { x: ar.x, y: ar.y }, golpes = [], muerta = false, t0 = Date.now()
  let recibido = 0, bloqueos = 0
  for (let i = 0; i < 250 && !muerta; i++) {
    const yo = await donde(j)
    const ang = Math.atan2(obj.y - yo.y, obj.x - yo.x)
    // Bloquear cuando el bicho anuncia; si no, pegar.
    // Reaccionar al aviso es lo que haría un jugador: se ve que anuncia
    // y se levanta la guardia. Si la ventana no da para eso, el bloqueo
    // no existe por mucho que esté implementado.
    const anunciando = (st.monstruos || []).some(m => m.id === ar.id && m.aviso)
    const entrada = bloqueando && anunciando
      ? { ax: Math.cos(ang), ay: Math.sin(ang), bloquear: true }
      : { ax: Math.cos(ang), ay: Math.sin(ang), pulsado: true }
    const r = await req('POST', '/api/mundo/combate', { pos: { zona: 'forest', x: yo.x, y: yo.y }, entrada }, j.ck)
    st = r.b
    for (const s of (r.b.sucesos || [])) {
      if (s.tipo === 'dano' && s.a === ar.id) golpes.push(s.cantidad)
      if (s.tipo === 'dano' && s.a === 'yo') { recibido += s.cantidad; if (s.bloqueado) bloqueos++ }
      if (s.tipo === 'muerte_monstruo' && s.id === ar.id) muerta = true
    }
    const m = (r.b.monstruos || []).find(x => x.id === ar.id)
    if (m) obj = { x: m.x, y: m.y }
    if (r.b.yo && r.b.yo.hp <= 0) break
    await dormir(50)
  }
  const hp1 = (await req('GET', '/api/player', null, j.ck)).b.character.hp
  return {
    muerta, ms: Date.now() - t0, golpes: golpes.length,
    porGolpe: media(golpes), vidaPerdida: hp0 - hp1, recibido, bloqueos,
  }
}

async function latencia() {
  const j = await alta()
  let st = (await req('POST', '/api/mundo/combate', { pos: { zona: 'forest', x: 900, y: 600 }, entrada: {} }, j.ck)).b
  const ar = st.monstruos[0]
  const yo = await caminarA(j, ar.x - 40, ar.y)
  const aGesto = [], aDano = []
  for (let k = 0; k < 20; k++) {
    for (let i = 0; i < 6; i++) { await req('POST', '/api/mundo/combate', { pos: { zona: 'forest', x: yo.x, y: yo.y }, entrada: { pulsado: false } }, j.ck); await dormir(50) }
    const t0 = Date.now()
    let g = null, d = null
    for (let i = 0; i < 30 && (!g || !d); i++) {
      const r = await req('POST', '/api/mundo/combate', { pos: { zona: 'forest', x: yo.x, y: yo.y }, entrada: { ax: 1, ay: 0, pulsado: true } }, j.ck)
      const ss = r.b.sucesos || []
      if (!g && ss.some(x => x.tipo === 'gesto')) g = Date.now() - t0
      if (!d && ss.some(x => x.tipo === 'golpe' || x.tipo === 'dano')) d = Date.now() - t0
      await dormir(40)
    }
    if (g !== null) aGesto.push(g)
    if (d !== null) aDano.push(d)
  }
  return { gesto: media(aGesto), gestoPeor: Math.max(...aGesto, 0), dano: media(aDano), danoPeor: Math.max(...aDano, 0) }
}

async function main() {
  console.log('\n══ EL MUNDO EN TIEMPO REAL, MEDIDO ══\n')
  console.log('── UNA ARAÑA, A NIVEL 1 ──')
  const sin = await pelea(false)
  console.log(`  sin bloquear   ${sin.muerta ? 'muerta' : 'VIVA'} en ${(sin.ms / 1000).toFixed(1)}s · ${sin.golpes} golpes de ${sin.porGolpe.toFixed(1)} · vida perdida ${sin.vidaPerdida}`)
  const con = await pelea(true)
  console.log(`  bloqueando     ${con.muerta ? 'muerta' : 'VIVA'} en ${(con.ms / 1000).toFixed(1)}s · ${con.golpes} golpes de ${con.porGolpe.toFixed(1)} · vida perdida ${con.vidaPerdida} · ${con.bloqueos} bloqueos`)
  if (sin.vidaPerdida > 0) {
    const ahorro = ((sin.vidaPerdida - con.vidaPerdida) / sin.vidaPerdida * 100)
    console.log(`  bloquear ahorra ${ahorro.toFixed(0)} % de la vida perdida`)
  }

  console.log('\n── DE PULSAR A VERLO ──')
  const l = await latencia()
  console.log(`  pulsar → ver el gesto   media ${l.gesto.toFixed(0)} ms · peor ${l.gestoPeor} ms`)
  console.log(`  pulsar → ver el daño    media ${l.dano.toFixed(0)} ms · peor ${l.danoPeor} ms`)
  console.log()
  process.exit(0)
}

try { fs.rmSync('/tmp/cm-medmundo.json', { force: true }) } catch {}
const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
  env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-medmundo.json', BACKUP_DIR: '/tmp/cm-medmundo-b' }),
  stdio: 'ignore',
})
process.on('exit', () => { try { c.kill() } catch {} })
;(async () => {
  for (let i = 0; i < 60; i++) { await dormir(200); if ((await req('GET', '/api/health')).s === 200) break }
  await main()
})()
