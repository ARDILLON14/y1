#!/usr/bin/env node
/**
 * CriptoMundo — ver un arma en la mano antes de subirla
 *
 *   node ver-arte.js            escribe y abre /tmp/arte-criptomundo.html
 *   node ver-arte.js --salida x lo escribe donde digas
 *
 * POR QUÉ EXISTE
 * `npm run arte` dice qué falta y qué está mal, pero con números. Quien
 * dibuja necesita VERLO: el arma en la mano de alguien, repitiendo su
 * golpe, sobre los tres fondos del juego, y con un punto rojo donde
 * agarra la mano.
 *
 * No necesita el servidor del juego: es una página suelta que lee los
 * mismos datos que lee el servidor, para que lo que se vea aquí sea lo
 * que se verá jugando.
 */
const fs = require('fs')
const path = require('path')

const RAIZ = __dirname
const ASSETS = path.join(RAIZ, 'assets')
const SRC = path.join(RAIZ, 'src', 'server')
const args = process.argv.slice(2)
const iSal = args.indexOf('--salida')
const SALIDA = iSal >= 0 ? args[iSal + 1] : '/tmp/arte-criptomundo.html'

const fuente = f => fs.readFileSync(path.join(SRC, f), 'utf8')

// Las mismas fichas que lee el juego. Se cuentan llaves, no líneas: las
// tres espadas con dibujo están partidas en dos y un lector por líneas
// se las salta (fue el fallo del STEP 20).
function fichas(texto) {
  const out = []
  const re = /^ {2}([a-z_0-9]+):\s*\{/gm
  let m
  while ((m = re.exec(texto))) {
    let i = texto.indexOf('{', m.index), nivel = 0, fin = i
    for (; fin < texto.length; fin++) {
      if (texto[fin] === '{') nivel++
      else if (texto[fin] === '}') { nivel--; if (nivel === 0) break }
    }
    out.push({ id: m[1], cuerpo: texto.slice(i, fin + 1) })
    re.lastIndex = fin
  }
  return out
}

function armas() {
  const items = fichas(fuente('30-personajes-combate.js'))
  const arena = fichas(fuente('58-arena.js'))
  const porId = {}
  for (const f of arena) {
    const n = /nombre: '([^']+)'/.exec(f.cuerpo)
    if (!n) continue
    porId[f.id] = {
      id: f.id, nombre: n[1],
      alcance: Number((/alcance: (\d+)/.exec(f.cuerpo) || [])[1]) || 60,
      arco: Number((/arco: ([\d.]+)/.exec(f.cuerpo) || [])[1]) || 1.05,
      cadenciaMs: Number((/cadenciaMs: (\d+)/.exec(f.cuerpo) || [])[1]) || 420,
      gesto: (/gesto: '([^']+)'/.exec(f.cuerpo) || [])[1] || null,
      proyectil: /proyectil:/.test(f.cuerpo),
    }
  }
  const fuera = []
  for (const f of items) {
    const img = /imagen: '([^']+)'/.exec(f.cuerpo)
    if (!img) continue
    const a = porId[f.id] || { id: f.id, nombre: f.id, alcance: 60, arco: 1.05, cadenciaMs: 420 }
    // La ficha del artista gana sobre el catálogo, que gana sobre el
    // valor por defecto. Es el orden que pide la FASE G.
    let ficha = {}
    const rutaFicha = path.join(ASSETS, 'items', f.id + '.json')
    if (fs.existsSync(rutaFicha)) {
      try { ficha = JSON.parse(fs.readFileSync(rutaFicha, 'utf8')) } catch (e) { ficha = { error: String(e.message) } }
    }
    const catEmp = /empunadura:\s*\{\s*x:\s*([\d.]+)\s*,\s*y:\s*([\d.]+)/.exec(f.cuerpo)
    const catAng = /spriteAngulo:\s*(-?[\d.]+)/.exec(f.cuerpo)
    const emp = ficha.empunadura || (catEmp ? [Number(catEmp[1]), Number(catEmp[2])] : [0.79, 0.79])
    fuera.push({
      ...a, imagen: img[1],
      empunadura: emp,
      spriteAngulo: ficha.spriteAngulo != null ? ficha.spriteAngulo : (catAng ? Number(catAng[1]) : -2.356),
      escala: ficha.escala || 2,
      deFicha: !!(ficha.empunadura || ficha.spriteAngulo != null),
      fichaRota: ficha.error || null,
      tira: fs.existsSync(path.join(ASSETS, 'items', 'anim', f.id + '.png'))
        ? '/assets/items/anim/' + f.id + '.png' : null,
    })
  }
  return fuera
}

const lista = armas()
const datos = JSON.stringify(lista, null, 1)

const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Arte de CriptoMundo — las armas en la mano</title>
<style>
  body { margin:0; background:#0B0E14; color:#E8E8F0; font-family:system-ui,sans-serif; }
  header { padding:18px 22px; border-bottom:1px solid #1F2430; }
  h1 { margin:0 0 6px; font-size:18px; }
  .nota { color:#8A8A92; font-size:13px; max-width:70ch; line-height:1.5; }
  .arma { border-bottom:1px solid #1F2430; padding:18px 22px; }
  .titulo { font-size:15px; margin-bottom:4px; }
  .ficha { color:#8A8A92; font-size:12px; margin-bottom:10px; }
  .fondos { display:flex; gap:14px; flex-wrap:wrap; }
  .fondo { border-radius:8px; padding:8px; }
  .hierba { background:#2D4A1E; } .piedra { background:#3A3630; } .oscuro { background:#0A0A0E; }
  .etq { font-size:10px; color:#C8C8D0; opacity:.7; margin-bottom:4px; }
  canvas { display:block; image-rendering:pixelated; }
  .aviso { color:#F0A030; font-size:12px; margin-top:6px; }
  .roto { color:#F87171; }
</style></head><body>
<header>
  <h1>Las armas en la mano</h1>
  <div class="nota">
    Cada arma repitiendo su golpe, con los tiempos de verdad del juego, sobre los
    tres fondos que hay. El punto rojo es la empuñadura: si no cae sobre el mango,
    el arma se verá flotando. La escala es ×2 y ×4.
    Los números salen de las mismas fichas que lee el servidor, así que lo que se
    ve aquí es lo que se verá jugando.
  </div>
</header>
<div id="lista"></div>
<script>
var ARMAS = ${datos}

// Las mismas tres fases que el servidor: anticipación, activa,
// recuperación, y las tres suman la cadencia.
function fases(c) {
  var ant = Math.round(Math.max(60, Math.min(220, c * 0.30)))
  var act = Math.round(Math.max(60, Math.min(160, c * 0.22)))
  return { ant: ant, act: act, rec: Math.max(0, c - ant - act) }
}
function poseEspada(f, p, arco) {
  if (f === 'ant') return -(arco + 0.35) * (p * p * (3 - 2 * p))
  if (f === 'act') { var k = 1 - (1 - p) * (1 - p); return -(arco + 0.35) + (2 * arco + 0.35) * k }
  return arco * (1 - p) + (-0.52) * p
}

function pintar(cv, arma, img, escala, t) {
  var ctx = cv.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, cv.width, cv.height)
  var cx = cv.width / 2, cy = cv.height / 2

  // El personaje de prueba: un círculo. No hace falta más, y así no se
  // confunde con el arma, que es lo que se viene a mirar.
  ctx.fillStyle = 'rgba(0,0,0,.28)'
  ctx.beginPath(); ctx.ellipse(cx, cy + 13 * escala / 2, 11 * escala / 2, 4 * escala / 2, 0, 0, 6.3); ctx.fill()
  ctx.fillStyle = '#E8C39E'
  ctx.beginPath(); ctx.arc(cx, cy, 9 * escala / 2, 0, 6.3); ctx.fill()

  var f = fases(arma.cadenciaMs)
  var ciclo = arma.cadenciaMs
  var m = t % ciclo
  var fase, p
  if (m < f.ant) { fase = 'ant'; p = m / f.ant }
  else if (m < f.ant + f.act) { fase = 'act'; p = (m - f.ant) / f.act }
  else { fase = 'rec'; p = (m - f.ant - f.act) / Math.max(1, f.rec) }
  var ang = poseEspada(fase, p, arma.arco)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(ang)
  ctx.translate(11 * escala / 2, 0)
  ctx.rotate(-arma.spriteAngulo)
  var lado = arma.alcance * 0.95 * escala / 2
  var ex = arma.empunadura[0], ey = arma.empunadura[1]
  if (img.complete && img.naturalWidth) ctx.drawImage(img, -lado * ex, -lado * ey, lado, lado)
  // El punto rojo: dónde agarra la mano.
  ctx.fillStyle = '#F87171'
  ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 6.3); ctx.fill()
  ctx.restore()
}

var caja = document.getElementById('lista')
var pintores = []
ARMAS.forEach(function (a) {
  var d = document.createElement('div')
  d.className = 'arma'
  var av = ''
  if (a.fichaRota) av += '<div class="aviso roto">Su ficha ' + a.id + '.json no se puede leer: ' + a.fichaRota + '</div>'
  if (!a.deFicha) av += '<div class="aviso">No declara empuñadura: se usa la de por defecto (0,79 · 0,79). Si el punto rojo no cae en el mango, hay que declararla.</div>'
  if (!a.tira) av += '<div class="aviso">Sin tira de golpe: se dibuja el gesto calculado.</div>'
  d.innerHTML = '<div class="titulo">' + a.nombre + ' <span style="color:#8A8A92">(' + a.id + ')</span></div>' +
    '<div class="ficha">alcance ' + a.alcance + ' px · arco ' + a.arco + ' rad (' +
    (a.arco * 2 * 180 / Math.PI).toFixed(0) + '° totales) · cadencia ' + a.cadenciaMs + ' ms · ' +
    'empuñadura ' + a.empunadura[0] + ' · ' + a.empunadura[1] + ' · ángulo ' + a.spriteAngulo + '</div>' +
    '<div class="fondos"></div>' + av
  caja.appendChild(d)
  var fondos = d.querySelector('.fondos')
  var img = new Image(); img.src = a.imagen
  ;[['hierba', 2], ['piedra', 2], ['oscuro', 2], ['hierba', 4]].forEach(function (par) {
    var w = document.createElement('div')
    w.className = 'fondo ' + par[0]
    w.innerHTML = '<div class="etq">' + par[0] + ' ×' + par[1] + '</div>'
    var cv = document.createElement('canvas')
    cv.width = 150 * par[1] / 2; cv.height = 150 * par[1] / 2
    w.appendChild(cv); fondos.appendChild(w)
    pintores.push({ cv: cv, a: a, img: img, e: par[1] })
  })
})
function bucle() {
  var t = Date.now()
  for (var i = 0; i < pintores.length; i++) {
    var q = pintores[i]
    pintar(q.cv, q.a, q.img, q.e, t)
  }
  requestAnimationFrame(bucle)
}
bucle()
</script></body></html>`

fs.writeFileSync(SALIDA, html, 'utf8')
console.log(`\n✅ Escrito en ${SALIDA}`)
console.log(`   ${lista.length} arma(s) con dibujo.`)
const sinFicha = lista.filter(a => !a.deFicha)
if (sinFicha.length) {
  console.log(`\n   ${sinFicha.length} no declaran empuñadura y usan la de por defecto:`)
  for (const a of sinFicha) console.log(`     · ${a.id}`)
  console.log(`   Si en la página el punto rojo no cae sobre el mango, hay que`)
  console.log(`   declararla en assets/items/<id>.json: { "empunadura": [x, y] }`)
}
console.log(`\n   El juego tiene que estar sirviendo para que se vean los PNG:`)
console.log(`   node criptomundo.js  y abre el archivo desde http://localhost:3000\n`)
