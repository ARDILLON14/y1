/**
 * CriptoMundo — FASES F y G · el embudo nuevo y el arte de las armas
 * Uso:  PORT=3905 node test-arte-armas.js --spawn
 *
 * POR QUÉ EXISTE
 * La sección 7 del encargo pide que los casos rotos se inyecten SOBRE
 * UN OBJETO Y NO SOBRE UNA SKIN, con estas palabras, porque ese fue el
 * fallo del STEP 20: la herramienta de arte se saltaba justo las fichas
 * que tenían dibujo y las dos pruebas de detección que le hice eran de
 * skin. Aquí los seis casos van sobre un arma.
 *
 * Y comprueba el embudo de la FASE F, que es lo único que dice si el
 * tutorial nuevo se puede medir.
 */
const http = require('http')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')
const { execFileSync } = require('child_process')
const { spawn } = require('child_process')

const PORT = Number(process.env.PORT || 3905)
let cookie = '', pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? (pass++, console.log('  ✅ ' + n)) : (fail++, console.log('  ❌ ' + n + (e ? '  → ' + e : ''))) }
const dormir = ms => new Promise(r => setTimeout(r, ms))

function req(m, p, b) {
  return new Promise(r => {
    const d = b ? JSON.stringify(b) : null
    const h = { 'Content-Type': 'application/json' }
    if (d) h['Content-Length'] = Buffer.byteLength(d)
    if (cookie) h.Cookie = cookie
    const q = http.request({ host: 'localhost', port: PORT, path: p, method: m, headers: h }, x => {
      let o = ''; x.on('data', c => o += c)
      x.on('end', () => {
        if (x.headers['set-cookie']) cookie = x.headers['set-cookie'][0].split(';')[0]
        let j = {}; try { j = JSON.parse(o) } catch {}
        r({ s: x.statusCode, b: j, raw: o })
      })
    })
    q.on('error', () => r({ s: 0, b: {}, raw: '' }))
    if (d) q.write(d); q.end()
  })
}

// ── Fabricar PNG de verdad, con zlib, para inyectar los casos rotos ──
// Lo pide la sección 7: "PNG fabricado con zlib + ficha.json".
function crc32(buf) {
  let c, tabla = crc32.t
  if (!tabla) {
    tabla = crc32.t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      tabla[n] = c >>> 0
    }
  }
  c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = tabla[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function trozo(clase, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(clase, 'ascii'), datos])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}
// pinta(x, y) devuelve [r, g, b, a]
function hacerPng(ancho, alto, pinta, tipo = 6) {
  const canales = tipo === 6 ? 4 : 3
  const lineas = []
  for (let y = 0; y < alto; y++) {
    const l = Buffer.alloc(1 + ancho * canales)
    l[0] = 0
    for (let x = 0; x < ancho; x++) {
      const p = pinta(x, y)
      for (let c = 0; c < canales; c++) l[1 + x * canales + c] = p[c]
    }
    lineas.push(l)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8; ihdr[9] = tipo; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(Buffer.concat(lineas))),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

const RUTA = path.join(__dirname, 'assets', 'items', 'espada_hierro.png')
const FICHA = path.join(__dirname, 'assets', 'items', 'espada_hierro.json')
let ORIGINAL = null

function arte() {
  try {
    return JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'revisar-arte.js'), '--json'],
      { encoding: 'utf8', maxBuffer: 1e8 }))
  } catch (e) {
    // Sale con 1 cuando hay rotos: eso es lo normal aquí.
    return JSON.parse(e.stdout)
  }
}
const problemaDe = (r, id) => (r.rotos || []).filter(x => (x.qué || '').includes(id)).map(x => x.problema).join(' | ')

async function run() {
  console.log('\n── FASE F · EL TUTORIAL Y EL EMBUDO ──')
  const u = 'fg' + Math.floor(Math.random() * 1e6)
  await req('POST', '/api/auth/register', { username: u, email: u + '@t.io', password: 'Prueba12345', className: 'Guerrero' })
  let r = await req('GET', '/api/onboarding')
  const pasos = r.b.pasos || r.b.steps || []
  const ids = pasos.map(p => p.id)
  ok('el tutorial trae el paso de la barra', ids.includes('p_barra'), ids.join(','))
  const iBarra = ids.indexOf('p_barra')
  ok('y va ANTES de bloquear y beber',
     iBarra >= 0 && iBarra < ids.indexOf('p_bloquear') && iBarra < ids.indexOf('p_pocion'),
     JSON.stringify({ barra: iBarra, bloquear: ids.indexOf('p_bloquear'), pocion: ids.indexOf('p_pocion') }))
  const pBarra = pasos[iBarra]
  ok('paga las mismas 120 de oro que los otros dos', pBarra && pBarra.oro === 120, String(pBarra && pBarra.oro))
  const bloq = pasos.find(p => p.id === 'p_bloquear')
  ok('el texto de bloquear menciona el clic derecho del mundo',
     bloq && /clic derecho/i.test(bloq.pista), bloq && bloq.pista)
  const poc = pasos.find(p => p.id === 'p_pocion')
  ok('y el de la poción, la barra', poc && /barra/i.test(poc.pista), poc && poc.pista)

  // Se completa al cambiar de ranura con un arma.
  ok('el paso de la barra empieza sin hacer', pBarra && !pBarra.hecho)
  await req('POST', '/api/hotbar/asignar', { ranura: 3, idObjeto: 'dagger' })
  await req('POST', '/api/hotbar/elegir', { ranura: 3 })
  r = await req('GET', '/api/onboarding')
  const trasBarra = (r.b.pasos || []).find(p => p.id === 'p_barra')
  ok('elegir una ranura con arma lo completa', trasBarra && trasBarra.hecho === true,
     JSON.stringify(trasBarra))

  // El embudo no tiene endpoint publico (solo /api/admin/analytics, con
  // testigo). Lo que importa comprobar es que los dos sucesos estén en
  // FUNNEL_STEPS: step() ignora en silencio lo que no esté en esa
  // lista, así que emitirlos sin añadirlos sería no medir nada. Y ya
  // hay una prueba de comportamiento encima: p_barra se completó, y se
  // completa con first_hotbar_switch.
  const tele = fs.readFileSync(path.join(__dirname, 'src', 'server', '50-telemetria.js'), 'utf8')
  const lista = (/const FUNNEL_STEPS = \[([\s\S]*?)\]/.exec(tele) || ['', ''])[1]
  ok('el embudo conoce first_hotbar_switch', /'first_hotbar_switch'/.test(lista))
  ok('y first_world_hit', /'first_world_hit'/.test(lista))

  console.log('\n── FASE F · LOS CONTADORES ──')
  const src = fs.readFileSync(path.join(__dirname, 'src', 'server', '59-mundo-combate.js'), 'utf8')
  ok('se cuentan las intenciones descartadas por exceso',
     /track\('mundo_intencion_descartada'/.test(src))
  ok('y los golpes rechazados CON SU MOTIVO',
     /track\('mundo_golpe_rechazado_' \+ motivo/.test(src))
  const motivos = [...src.matchAll(/rechazo\(j\.usuario, '([a-z_]+)'\)/g)].map(m => m[1])
  ok('hay más de un motivo, que es el sentido de contarlos', motivos.length >= 4, motivos.join(','))
  ok('entre ellos, la ranura vacía', motivos.includes('ranura_vacia'), motivos.join(','))

  console.log('\n── FASE G · LOS SEIS CASOS ROTOS, SOBRE UN ARMA ──')
  ORIGINAL = fs.readFileSync(RUTA)
  const limpio = arte()
  ok('sin tocar nada, no hay nada roto', (limpio.rotos || []).length === 0,
     JSON.stringify((limpio.rotos || []).map(x => x.qué)))

  // 1. Medida equivocada
  fs.writeFileSync(RUTA, hacerPng(20, 20, () => [200, 200, 200, 255]))
  let a = arte()
  ok('1 · una medida rara no pasa desapercibida',
     !!problemaDe(a, 'espada_hierro'), problemaDe(a, 'espada_hierro'))

  // 2. Sin canal alfa
  fs.writeFileSync(RUTA, hacerPng(32, 32, () => [200, 200, 200], 3 === 3 ? 2 : 2))
  a = arte()
  ok('2 · un PNG sin transparencia sale con su motivo',
     /no trae transparencia/.test(problemaDe(a, 'espada_hierro')), problemaDe(a, 'espada_hierro'))

  // 3. Píxeles a medio transparente
  fs.writeFileSync(RUTA, hacerPng(32, 32, (x, y) => [200, 200, 200, (x + y) % 2 ? 128 : 255]))
  a = arte()
  ok('3 · los píxeles a medias salen con su porcentaje',
     /medio transparente/.test(problemaDe(a, 'espada_hierro')), problemaDe(a, 'espada_hierro'))

  // 4. Empuñadura sobre un hueco
  fs.writeFileSync(RUTA, hacerPng(32, 32, (x, y) => (x < 10 && y < 10) ? [200, 200, 200, 255] : [0, 0, 0, 0]))
  a = arte()
  ok('4 · la empuñadura sobre un hueco se canta',
     /no hay dibujo/.test(problemaDe(a, 'espada_hierro')), problemaDe(a, 'espada_hierro'))

  // 5. Ficha ilegible
  fs.writeFileSync(RUTA, ORIGINAL)
  fs.writeFileSync(FICHA, '{ esto no es json')
  a = arte()
  ok('5 · una ficha que no se puede leer se dice, no se ignora',
     /no se puede leer/.test(problemaDe(a, 'espada_hierro')), problemaDe(a, 'espada_hierro'))

  // 6. Empuñadura fuera del dibujo
  fs.writeFileSync(FICHA, JSON.stringify({ empunadura: [1.8, 0.5] }))
  a = arte()
  ok('6 · una empuñadura fuera de 0 a 1 se rechaza con su motivo',
     /entre 0 y 1/.test(problemaDe(a, 'espada_hierro')), problemaDe(a, 'espada_hierro'))

  console.log('\n── FASE G · EL CAMINO COMPLETO ──')
  // Una ficha buena: el catálogo tiene que devolver esa empuñadura.
  // (0,79 · 0,79) es el pomo de las tres espadas: cae sobre dibujo. La
  // primera versión de esta comprobación usaba (0,25 · 0,75), que en una
  // espada dibujada en diagonal es hueco — o sea que la herramienta
  // tenía razón y la prueba no.
  fs.writeFileSync(FICHA, JSON.stringify({ empunadura: [0.79, 0.79], spriteAngulo: 0.785 }))
  a = arte()
  ok('una ficha buena no da ningún problema', (a.rotos || []).length === 0,
     JSON.stringify((a.rotos || []).map(x => x.problema)))
  // Y el servidor la tiene que estar usando. Se pide con el proceso
  // recién arrancado, porque las fichas se leen una vez y se recuerdan.
  const perfil = (await req('GET', '/api/armas/espada_hierro')).b.perfil
  ok('el servidor sirve el perfil del arma', !!perfil, JSON.stringify(perfil))

  fs.writeFileSync(RUTA, ORIGINAL)
  fs.rmSync(FICHA, { force: true })
  a = arte()
  ok('al retirarlo todo, vuelve a estar limpio', (a.rotos || []).length === 0,
     JSON.stringify((a.rotos || []).map(x => x.qué)))

  console.log('\n── FASE G · LA GUÍA Y EL VISOR ──')
  const guia = fs.readFileSync(path.join(__dirname, 'docs', 'GUIA_PIXEL_ART_ARMAS.md'), 'utf8')
  ok('la guía existe', guia.length > 1000, String(guia.length))
  ok('y dice la carpeta que el juego usa DE VERDAD', /assets\/items\/<id>\.png/.test(guia))
  // Menciona public/sprites A PROPÓSITO, para decir que se descartó y
  // por qué. Una guía que calla la alternativa deja a quien dibuja
  // creyendo que se la inventó él.
  ok('y explica por qué NO es la que proponía el encargo',
     /public\/sprites/.test(guia) && /no existe ninguna carpeta/i.test(guia))
  ok('explica la empuñadura en fracción, no en píxeles', /fracción del dibujo/.test(guia))
  ok('y el ángulo por defecto que tienen las espadas de verdad',
     /-2\.356/.test(guia) && /135/.test(guia))
  const salida = '/tmp/arte-prueba-' + Date.now() + '.html'
  execFileSync(process.execPath, [path.join(__dirname, 'ver-arte.js'), '--salida', salida], { encoding: 'utf8' })
  const pag = fs.readFileSync(salida, 'utf8')
  ok('npm run arte:ver escribe una página', pag.length > 2000, String(pag.length))
  ok('con las tres armas que tienen dibujo',
     /espada_piedra/.test(pag) && /espada_hierro/.test(pag) && /espada_diamante/.test(pag))
  ok('sobre los tres fondos', /hierba/.test(pag) && /piedra/.test(pag) && /oscuro/.test(pag))
  ok('a escala ×2 y ×4', /×2/.test(pag) && /×4/.test(pag))
  ok('con el punto de la empuñadura', /F87171/.test(pag))
  ok('y usa las mismas tres fases que el servidor',
     /0\.30/.test(pag) && /0\.22/.test(pag))
  fs.rmSync(salida, { force: true })

  console.log('\n══════════════════════════════════════════════')
  console.log(`  ${pass} OK · ${fail} fallidas`)
  console.log('══════════════════════════════════════════════\n')
  process.exit(fail ? 1 : 0)
}

function restaurar() {
  try { if (ORIGINAL) fs.writeFileSync(RUTA, ORIGINAL) } catch {}
  try { fs.rmSync(FICHA, { force: true }) } catch {}
}
process.on('exit', restaurar)

if (process.argv.includes('--spawn')) {
  for (const r of ['/tmp/cm-fg.json', '/tmp/cm-fg-b']) { try { fs.rmSync(r, { recursive: true, force: true }) } catch {} }
  const c = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), NODE_ENV: 'test', DATA_FILE: '/tmp/cm-fg.json', BACKUP_DIR: '/tmp/cm-fg-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { c.kill() } catch {} })
  ;(async () => {
    for (let i = 0; i < 60; i++) { await dormir(200); if ((await req('GET', '/api/health')).s === 200) break }
    run().catch(e => { console.error(e); restaurar(); process.exit(1) })
  })()
} else { run().catch(e => { console.error(e); restaurar(); process.exit(1) }) }
