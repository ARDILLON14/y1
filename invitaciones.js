#!/usr/bin/env node
/**
 * CriptoMundo — gestión de invitaciones
 *
 *   node invitaciones.js crear 10 --etiqueta=discord
 *   node invitaciones.js crear 1 --etiqueta=prensa --usos=5
 *   node invitaciones.js listar
 *   node invitaciones.js listar --libres
 *
 * Necesita el servidor en marcha y el ADMIN_TOKEN con el que arrancó:
 *
 *   ADMIN_TOKEN=xxx node invitaciones.js crear 10
 *
 * Recuerda que los códigos solo hacen falta si arrancaste con
 * INVITE_ONLY=1; si no, el registro está abierto a cualquiera.
 */
const http = require('http')

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000
const TOKEN = process.env.ADMIN_TOKEN || ''

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: HOST, port: PORT, path, method,
      headers: Object.assign({ 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', reject); if (data) r.write(data); r.end()
  })
}

function flag(name, def) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`))
  return a ? a.split('=').slice(1).join('=') : def
}

async function main() {
  const cmd = process.argv[2]

  if (!TOKEN) {
    console.error('Falta ADMIN_TOKEN. Usa el mismo con el que arrancaste el servidor:')
    console.error('  ADMIN_TOKEN=xxx node invitaciones.js ' + (cmd || 'listar'))
    process.exit(1)
  }

  if (cmd === 'crear') {
    const cantidad = Number(process.argv[3]) || 1
    const etiqueta = flag('etiqueta', 'general')
    const maxUsos = Number(flag('usos', 1))
    const r = await req('POST', '/api/admin/invites', { cantidad, etiqueta, maxUsos })
    if (r.status !== 201) { console.error('Error:', r.body.error || r.status); process.exit(1) }
    console.log(`\n${r.body.creados} código(s) para "${etiqueta}"${maxUsos > 1 ? ` (${maxUsos} usos cada uno)` : ''}:\n`)
    for (const c of r.body.codigos) console.log('  ' + c)
    console.log('\nEnlace directo para compartir:')
    for (const c of r.body.codigos.slice(0, 3)) console.log(`  http://${HOST}:${PORT}/?invite=${c}`)
    if (r.body.codigos.length > 3) console.log(`  … y ${r.body.codigos.length - 3} más`)
    console.log()
    return
  }

  if (cmd === 'listar' || !cmd) {
    const r = await req('GET', '/api/admin/invites')
    if (r.status !== 200) { console.error('Error:', r.body.error || r.status); process.exit(1) }
    const d = r.body
    console.log(`\nRegistro: ${d.inviteOnly ? 'SOLO CON INVITACIÓN' : 'abierto (los códigos no se piden)'}`)
    console.log(`Códigos: ${d.total} · usados ${d.usados} · disponibles ${d.libres}\n`)

    for (const [tag, s] of Object.entries(d.porEtiqueta)) {
      console.log(`  ${tag.padEnd(14)} ${s.usados}/${s.emitidos} usados`)
    }
    console.log()

    const soloLibres = process.argv.includes('--libres')
    const lista = soloLibres ? d.invitaciones.filter(i => i.usos < i.maxUsos) : d.invitaciones
    if (!lista.length) { console.log('  (sin códigos)\n'); return }
    console.log('  CÓDIGO         ETIQUETA        USOS   QUIÉN')
    for (const i of lista.slice(0, 60)) {
      console.log(`  ${i.codigo.padEnd(14)} ${i.etiqueta.padEnd(15)} ${String(i.usos + '/' + i.maxUsos).padEnd(6)} ${i.usadoPor.join(', ')}`)
    }
    if (lista.length > 60) console.log(`  … y ${lista.length - 60} más`)
    console.log()
    return
  }

  console.log(`Uso:
  node invitaciones.js crear 10 --etiqueta=discord
  node invitaciones.js crear 1 --etiqueta=prensa --usos=5
  node invitaciones.js listar [--libres]`)
}

main().catch(e => { console.error('No se pudo contactar con el servidor:', e.message); process.exit(1) })
