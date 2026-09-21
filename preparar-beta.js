#!/usr/bin/env node
/**
 * CriptoMundo — preparar la beta cerrada
 *
 *   node preparar-beta.js               revisa que todo esté listo
 *   node preparar-beta.js 10            además genera 10 invitaciones
 *   node preparar-beta.js 10 --url=https://midominio.com --etiqueta=discord
 *
 * Necesita el servidor en marcha y el mismo ADMIN_TOKEN con el que
 * arrancó:
 *
 *   ADMIN_TOKEN=xxx node preparar-beta.js 10
 *
 * Qué hace: comprueba una a una las cosas que hacen que una beta
 * fracase por motivos tontos (sin HTTPS, sin panel de analítica, con el
 * registro abierto de par en par, con los datos dentro de la carpeta
 * del código), genera los códigos y escribe el mensaje para enviarlos.
 */
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

const TOKEN = process.env.ADMIN_TOKEN || ''
const flag = (n, d) => {
  const a = process.argv.find(x => x.startsWith(`--${n}=`))
  return a ? a.split('=').slice(1).join('=') : d
}
const CANTIDAD = Number(process.argv[2]) || 0
const ETIQUETA = flag('etiqueta', 'beta')
const HOST = process.env.HOST || 'localhost'
const PORT = Number(process.env.PORT || 3000)
const URL_PUBLICA = flag('url', `http://${HOST}:${PORT}`)

let listo = 0, avisos = 0, bloqueos = 0
const ok = m => { listo++; console.log('  ✅ ' + m) }
const aviso = (m, c) => { avisos++; console.log('  🟡 ' + m); if (c) console.log('      ↳ ' + c) }
const bloqueo = (m, c) => { bloqueos++; console.log('  🔴 ' + m); if (c) console.log('      ↳ ' + c) }

// Permite comprobar la configuración como si hubiera un proxy TLS
// delante, sin montar uno: node preparar-beta.js --tls
const SIMULAR_TLS = process.argv.includes('--tls')

function req(method, p, body, headers = {}) {
  if (SIMULAR_TLS) headers = Object.assign({ 'X-Forwarded-Proto': 'https' }, headers)
  return new Promise(resolve => {
    const data = body ? JSON.stringify(body) : null
    const r = http.request({ host: HOST, port: PORT, path: p, method,
      headers: Object.assign({ 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {}, headers) },
      res => { let o = ''; res.on('data', c => o += c); res.on('end', () => {
        let j = {}; try { j = JSON.parse(o) } catch {}
        resolve({ status: res.statusCode, body: j }) }) })
    r.on('error', e => resolve({ status: 0, body: {}, error: e.message }))
    if (data) r.write(data)
    r.end()
  })
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log('  PREPARAR LA BETA CERRADA')
  console.log(`${'═'.repeat(60)}\n`)

  console.log('── SERVIDOR ──')
  const salud = await req('GET', '/api/health')
  if (salud.status !== 200) {
    bloqueo(`No hay servidor en ${HOST}:${PORT}`, 'Arráncalo primero: npm start')
    return resumen()
  }
  ok(`Servidor respondiendo (${salud.body.players} jugadores registrados)`)

  if (salud.body.env === 'production') ok('NODE_ENV=production')
  else aviso('NODE_ENV no es production', 'Sin él las cookies van sin Secure y los errores internos se muestran al usuario.')

  if (salud.body.tlsDetectado) ok('Las peticiones llegan cifradas')
  else if (salud.body.env === 'production') {
    bloqueo('production sin HTTPS por delante',
      'La cookie de sesión lleva Secure: el navegador la descartará y nadie podrá entrar. Pon nginx, Caddy o Cloudflare delante.')
  } else aviso('Sin HTTPS', 'Para pruebas en local vale; para repartir enlaces, no.')

  console.log('\n── ACCESO ──')
  const modo = await req('GET', '/api/auth/mode')
  if (modo.body.inviteOnly) ok('El registro exige invitación')
  else aviso('El registro está abierto a cualquiera',
    'Para una beta cerrada, arranca con INVITE_ONLY=1.')

  if (TOKEN) {
    const inv = await req('GET', '/api/admin/invites')
    if (inv.status === 200) {
      ok(`ADMIN_TOKEN válido (${inv.body.libres} códigos sin usar de ${inv.body.total})`)
    } else bloqueo('El ADMIN_TOKEN no coincide con el del servidor')
  } else {
    bloqueo('Falta ADMIN_TOKEN', 'Sin él no puedes generar invitaciones ni ver la analítica.')
  }

  console.log('\n── DATOS ──')
  const dataFile = process.env.DATA_FILE || './criptomundo-data.json'
  if (path.resolve(dataFile).startsWith(path.resolve(__dirname))) {
    aviso(`Los datos se guardan dentro de la carpeta del código (${dataFile})`,
      'Un redespliegue puede llevarse las partidas. Usa DATA_FILE=/var/lib/criptomundo/datos.json')
  } else ok(`Datos fuera de la carpeta del código (${dataFile})`)

  const assets = process.env.ASSETS_DIR || path.join(__dirname, 'assets')
  if (fs.existsSync(path.join(assets, 'skins'))) ok('Carpeta assets/ presente')
  else bloqueo('Falta assets/', 'Los personajes ilustrados no cargarán.')

  console.log('\n── JUEGO ──')
  const skins = await req('GET', '/api/skins')
  ok(`${(skins.body.skins || []).length} aspectos disponibles en el creador`)
  const mercado = await req('GET', '/api/market')
  const n = (mercado.body.listings || []).length
  if (n > 0) ok(`${n} publicaciones en el mercado para el primer día`)
  else aviso('El mercado está vacío', 'Los primeros jugadores no tendrán nada que comprar.')

  // Códigos
  if (CANTIDAD > 0 && TOKEN) {
    console.log('\n── INVITACIONES ──')
    const r = await req('POST', '/api/admin/invites', { cantidad: CANTIDAD, etiqueta: ETIQUETA })
    if (r.status !== 201) {
      bloqueo('No se pudieron generar los códigos', r.body.error || `status ${r.status}`)
    } else {
      ok(`${r.body.creados} códigos generados con etiqueta "${ETIQUETA}"`)
      console.log('\n  ENLACES PARA REPARTIR (uno por persona):\n')
      for (const c of r.body.codigos) console.log(`    ${URL_PUBLICA}/?invite=${c}`)

      console.log(`\n${'─'.repeat(60)}`)
      console.log('  MENSAJE LISTO PARA COPIAR')
      console.log(`${'─'.repeat(60)}\n`)
      console.log(`  Hola: te paso acceso a CriptoMundo, un juego de navegador`)
      console.log(`  que estoy haciendo. Está en beta cerrada, así que tu enlace`)
      console.log(`  es personal:`)
      console.log(`\n      ${URL_PUBLICA}/?invite=${r.body.codigos[0]}\n`)
      console.log(`  Se juega desde el navegador, en el móvil también. Creas`)
      console.log(`  personaje y hay una lista de primeros pasos que te guía.`)
      console.log(`\n  Lo que me sirve de verdad: que juegues un rato y me digas`)
      console.log(`  cuándo te aburriste o te perdiste. No hace falta que seas`)
      console.log(`  amable con eso, al revés.`)
      console.log(`\n  (No hay token ni nada que comprar. El oro y el CGRID son`)
      console.log(`  puntos dentro del juego.)`)
    }
  } else if (CANTIDAD > 0) {
    console.log('\n  (No se generan códigos sin ADMIN_TOKEN)')
  }

  resumen()
}

function resumen() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${listo} listo · ${avisos} avisos · ${bloqueos} bloqueos`)
  console.log(`${'═'.repeat(60)}\n`)

  if (bloqueos) {
    console.log('  Hay cosas que impedirán que la gente juegue. Arréglalas antes.\n')
  } else {
    console.log('  QUÉ MIRAR A LAS 48 HORAS  (en /admin.html)\n')
    console.log('   1. Cuántos de los invitados llegaron a crear personaje.')
    console.log('      Si se caen ahí, el problema es el registro, no el juego.')
    console.log('   2. La mediana de minutos por sesión. Por debajo de 15,')
    console.log('      el bucle se agota antes de enganchar.')
    console.log('   3. La columna roja del embudo: el paso donde la gente deja')
    console.log('      de avanzar. Ese, y solo ese, es lo siguiente que tocar.')
    console.log('   4. Cuántos vuelven un segundo día. Es el único número que')
    console.log('      dice si el juego gusta; el resto dice si funciona.\n')
    console.log('  Y lo que ninguna pantalla te va a dar: pregúntales cuándo se')
    console.log('  aburrieron. Esa frase vale más que todo el panel.\n')
  }
  process.exit(bloqueos ? 1 : 0)
}

main()
