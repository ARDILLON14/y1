#!/usr/bin/env node
/**
 * CriptoMundo — dame todas las armas
 *
 * POR QUÉ EXISTE
 * Para comprobar que cada arma se mueve distinta hay que TENER las
 * armas, y conseguirlas por el camino normal es minar, forjar y subir
 * a nivel 4. Probar el gesto del hacha no debería costar media hora.
 *
 * Esto habla con el servidor como cualquier cliente, con tu usuario y
 * tu contraseña, y usa la ruta /api/dev/dar, que NO existe en
 * producción. No toca el archivo de datos por debajo: si lo hiciera,
 * el servidor lo sobrescribiría con lo que tiene en memoria.
 *
 * Uso:
 *   node herramientas-dar-armas.js <tu-email> <contraseña>
 *   node herramientas-dar-armas.js <tu-email> <contraseña> --equipar hacha
 *
 * El servidor tiene que estar en marcha (PORT=3000 por defecto).
 */
const http = require('http')

const PORT = process.env.PORT || 3000
let cookie = ''

function req(method, p, body) {
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const h = { 'Content-Type': 'application/json' }
    if (data) h['Content-Length'] = Buffer.byteLength(data)
    if (cookie) h.Cookie = cookie
    const r = http.request({ host: 'localhost', port: PORT, path: p, method, headers: h }, res => {
      let o = ''
      res.on('data', c => o += c)
      res.on('end', () => {
        if (res.headers['set-cookie']) cookie = res.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j, raw: o })
      })
    })
    r.on('error', e => resolve({ status: 0, body: {}, raw: e.message }))
    if (data) r.write(data)
    r.end()
  })
}

// Nombres cortos para no tener que escribir el id interno
const ATAJOS = {
  piedra: 'espada_piedra', hierro: 'espada_hierro', diamante: 'espada_diamante',
  daga: 'dagger', alba: 'sword_alba', garrote: 'wood_club', hacha: 'iron_axe',
  lanza: 'iron_spear', arco: 'short_bow', vara: 'crystal_wand',
  escarcha: 'frost_blade', arcoelfico: 'elven_bow', cetro: 'thunder_staff',
}

async function main() {
  const [correo, clave] = process.argv.slice(2)
  if (!correo || !clave) {
    console.log('\n  Uso: node herramientas-dar-armas.js <tu-email> <contraseña> [--equipar <arma>]')
    console.log('  Armas: ' + Object.keys(ATAJOS).join(', ') + '\n')
    process.exit(1)
  }

  // Se entra con el correo, que es lo que pide el servidor.
  const login = await req('POST', '/api/auth/login', { email: correo, password: clave })
  if (login.status !== 200) {
    console.log(`\n  ❌ No se pudo entrar: ${login.body.error || login.raw || 'servidor apagado'}`)
    console.log(`     ¿Está el servidor en marcha en el puerto ${PORT}?\n`)
    process.exit(1)
  }

  // El catálogo lo pone el servidor: si mañana hay un arma nueva,
  // aparece aquí sola sin tocar este archivo.
  const arena = await req('GET', '/api/arena')
  const armas = (arena.body.armas || []).filter(a => a.id !== 'puños')
  if (!armas.length) { console.log('\n  ❌ El servidor no publicó el catálogo de armas.\n'); process.exit(1) }

  const quien = (login.body.player && login.body.player.username) || correo
  console.log(`\n  Dando ${armas.length} armas a ${quien}...\n`)
  let dadas = 0
  for (const a of armas) {
    const r = await req('POST', '/api/dev/dar', { itemId: a.id, quantity: 1 })
    if (r.status === 404) {
      console.log('  ❌ La ruta de pruebas no existe: el servidor corre en producción.')
      console.log('     Arráncalo sin NODE_ENV=production para poder usarla.\n')
      process.exit(1)
    }
    if (r.status !== 200) { console.log(`  ⚠️  ${a.nombre}: ${r.body.error || r.status}`); continue }
    dadas++
    const marca = a.imagen ? '🖼️ ' : '   '
    console.log(`  ✅ ${marca}${(a.nombre + ' ').padEnd(22, '·')} gesto: ${a.gesto}`)
  }

  const i = process.argv.indexOf('--equipar')
  if (i > -1 && process.argv[i + 1]) {
    const id = ATAJOS[process.argv[i + 1]] || process.argv[i + 1]
    const inv = (await req('GET', '/api/inventory')).body
    const it = (inv.inventory || []).find(x => x.itemId === id)
    if (!it) console.log(`\n  ⚠️  No encuentro "${process.argv[i + 1]}" en el inventario.`)
    else {
      const eq = await req('POST', '/api/player/equip', { uid: it.uid })
      console.log(eq.status === 200 ? `\n  ⚔️  Equipada: ${it.name}` : `\n  ⚠️  No se pudo equipar: ${eq.raw.slice(0, 60)}`)
    }
  }

  console.log(`\n  ${dadas} armas en el inventario. Entra a la arena y ve cambiando.`)
  console.log('  Fíjate: la lanza pincha de frente, el hacha cae desde arriba,')
  console.log('  la espada barre de lado y el arco se tensa antes de soltar.\n')
}

main().catch(e => { console.error(e.message); process.exit(1) })
