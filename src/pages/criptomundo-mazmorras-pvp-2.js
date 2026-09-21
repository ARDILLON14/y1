// El PvP, que tenía servidor y no tenía pantalla.
//
// QUÉ HABÍA
// La pestaña "PVP — ARENA" llamaba a setMode('pvp'), que buscaba un
// elemento con id "pvp-mode". Ese elemento no existía en toda la
// página, así que pulsarla escondía las mazmorras y no enseñaba nada:
// pantalla en blanco. Y en el servidor había desde hacía versiones
// emparejamiento, simulación asalto a asalto, Elo y apuesta de oro, con
// pruebas en verde comprobando que el cliente NO puede declarar el
// resultado. Nadie lo llamaba.
//
// QUÉ DECIDE CADA UNO
// El servidor: el rival, cada asalto, quién gana, cuánto Elo se mueve y
// cuánto oro cambia de manos. Esta pantalla manda "quiero un duelo, con
// esta apuesta" y REPRODUCE lo que conteste, igual que el combate por
// turnos reproduce su guion. Aquí no se calcula un punto de daño.
//
// LO QUE ESTO NO ES
// El rival lo genera el servidor a partir de tu Elo: es un rival de tu
// nivel, no otra persona conectada. Player contra player de verdad
// necesita que el mundo lleve la posición y el estado de los dos en el
// servidor, y eso es la fase de multijugador. Mientras tanto la
// pantalla lo dice en vez de dejarlo creer.
PAGES['criptomundo-mazmorras-pvp.html'] += `<script>

var PVP = { apuesta: 0, ficha: null, ocupado: false }

function pvpLog(texto, clase) {
  var caja = document.getElementById('pvp-log')
  if (!caja) return
  var d = document.createElement('div')
  d.style.fontSize = '12px'
  d.style.padding = '2px 0'
  d.style.color = clase === 'bien' ? '#6EE7B7' : clase === 'mal' ? '#FCA5A5' : '#9A9080'
  d.textContent = texto
  caja.appendChild(d)
  caja.scrollTop = caja.scrollHeight
}

function pvpBarra(id, hp, hpMax) {
  var b = document.getElementById(id)
  if (!b) return
  b.style.width = Math.max(0, Math.min(100, (hp / Math.max(1, hpMax)) * 100)) + '%'
}

function pvpSacudir(quien, clase) {
  var el = document.getElementById(quien)
  if (!el) return
  el.classList.add(clase)
  setTimeout(function () { el.classList.remove(clase) }, 400)
}

// Las fichas de apuesta salen del oro que tienes, no de una lista fija:
// el servidor limita la apuesta al 20% de tu oro, así que ofrecer 5.000
// a quien tiene 300 es prometer algo que va a rebotar.
function pvpPintarApuestas(oro) {
  var caja = document.getElementById('pvp-apuestas')
  if (!caja) return
  var tope = Math.floor(oro * 0.2)
  var opciones = [0, 50, 200, 1000].filter(function (v) { return v === 0 || v <= tope })
  if (tope > 0 && opciones.indexOf(tope) < 0 && tope > 50) opciones.push(tope)
  caja.innerHTML = opciones.map(function (v) {
    return '<button class="bet-chip' + (v === PVP.apuesta ? ' active' : '') +
           '" onclick="pvpApostar(' + v + ')">' + (v === 0 ? 'sin apuesta' : '🪙 ' + v) + '</button>'
  }).join('')
}

function pvpApostar(v) {
  PVP.apuesta = v
  pvpPintarApuestas((PVP.ficha && PVP.ficha.gold) || 0)
}

async function pvpCargar() {
  var r = await api('/api/player')
  if (!r.ok) return
  var c = r.d.character || {}
  PVP.ficha = c
  var oro = document.getElementById('pvp-oro')
  if (oro) oro.textContent = (c.gold || 0).toLocaleString()
  var tu = document.getElementById('pvp-tu-nombre')
  if (tu) tu.textContent = c.name || 'Tú'
  var ficha = document.getElementById('pvp-ficha')
  if (ficha) {
    ficha.innerHTML =
      '<div class="pp-name">' + (c.name || '') + '</div>' +
      '<div class="pp-class">' + (c.class || '') + ' · Nv. ' + (c.level || 1) + '</div>' +
      '<div class="pp-rating">Elo ' + (c.pvpRating || 1200) + '</div>' +
      '<div class="pp-record"><span class="wins">' + (c.pvpWins || 0) + 'V</span> · ' +
      '<span class="losses">' + (c.pvpLosses || 0) + 'D</span></div>' +
      '<div style="margin-top:10px;font-size:11px;line-height:1.5;color:#5A5449">' +
      'El rival lo empareja el servidor por tu Elo. Todavía no es otra ' +
      'persona conectada: eso llega con el multijugador.</div>'
  }
  pvpPintarApuestas(c.gold || 0)
  pvpCargarClasificacion()
}

async function pvpCargarClasificacion() {
  var r = await api('/api/leaderboard')
  var cuerpo = document.getElementById('pvp-lb-cuerpo')
  if (!cuerpo) return
  var lista = (r.ok && (r.d.leaderboard || r.d.players || r.d.jugadores)) || []
  if (!lista.length) { cuerpo.textContent = 'Todavía no hay nadie clasificado.'; return }
  lista = lista.slice().sort(function (a, b) { return (b.pvpRating || 0) - (a.pvpRating || 0) }).slice(0, 10)
  cuerpo.innerHTML = lista.map(function (j, i) {
    return '<div class="lb-row">' +
      '<div class="lb-rank' + (i < 3 ? ' r' + (i + 1) : '') + '">' + (i + 1) + '</div>' +
      '<div class="lb-info"><div class="lb-name">' + (j.name || '?') + '</div>' +
      '<div class="lb-class">Nv. ' + (j.level || 1) + '</div></div>' +
      '<div class="lb-rating">' + (j.pvpRating || 1200) + '</div></div>'
  }).join('')
}

// Reproducir el duelo asalto a asalto. El servidor ya calculó TODO esto
// —lo necesita para saber quién gana—; antes se tiraba y la pantalla
// solo podía decir "has ganado".
async function pvpReproducir(duelo) {
  var hpTu = duelo.tu.hpMax, hpRival = duelo.rival.hpMax
  pvpBarra('pvp-tu-hp', hpTu, duelo.tu.hpMax)
  pvpBarra('pvp-rival-hp', hpRival, duelo.rival.hpMax)

  for (var i = 0; i < duelo.asaltos.length; i++) {
    var a = duelo.asaltos[i]
    await new Promise(function (res) { setTimeout(res, 420) })

    pvpSacudir('pvp-tu', 'attack')
    pvpSacudir('pvp-rival', 'shake')
    hpRival = Math.max(0, hpRival - a.dmgA)
    pvpBarra('pvp-rival-hp', hpRival, duelo.rival.hpMax)
    pvpLog('⚔️ Asalto ' + (a.turn + 1) + ': le haces ' + a.dmgA + ' de daño.', 'bien')
    if (hpRival <= 0) break

    if (a.dmgB) {
      await new Promise(function (res) { setTimeout(res, 320) })
      pvpSacudir('pvp-rival', 'attack')
      pvpSacudir('pvp-tu', 'shake')
      hpTu = Math.max(0, hpTu - a.dmgB)
      pvpBarra('pvp-tu-hp', hpTu, duelo.tu.hpMax)
      pvpLog('🛡️ ' + duelo.rival.nombre + ' responde con ' + a.dmgB + '.', 'mal')
      if (hpTu <= 0) break
    }
  }
}

async function pvpDuelo() {
  if (PVP.ocupado) return
  PVP.ocupado = true
  var btn = document.getElementById('pvp-btn')
  if (btn) { btn.disabled = true; btn.textContent = 'BUSCANDO…' }
  var caja = document.getElementById('pvp-log')
  if (caja) caja.innerHTML = ''

  var r = await api('/api/pvp/match', { wagerGold: PVP.apuesta })
  if (!r.ok) {
    pvpLog('⚠️ ' + (r.d.error || 'No se pudo emparejar'), 'mal')
    PVP.ocupado = false
    if (btn) { btn.disabled = false; btn.textContent = 'BUSCAR DUELO' }
    return
  }

  var d = r.d
  var nombre = document.getElementById('pvp-rival-nombre')
  if (nombre) nombre.textContent = d.opponent + ' · Elo ' + d.opponentRating
  pvpLog('Rival encontrado: ' + d.opponent + ' (Elo ' + d.opponentRating + ').')
  if (d.wager) pvpLog('Se apuestan 🪙 ' + d.wager + '.')

  if (d.duelo) await pvpReproducir(d.duelo)

  if (d.result === 'win') pvpLog('🏆 Ganas el duelo.', 'bien')
  else pvpLog('💀 Pierdes el duelo.', 'mal')
  pvpLog('Elo ' + (d.ratingChange >= 0 ? '+' : '') + d.ratingChange + ' → ' + d.newRating,
         d.ratingChange >= 0 ? 'bien' : 'mal')
  if (d.wager) {
    pvpLog(d.result === 'win' ? '🪙 +' + d.wager + ' de oro' : '🪙 −' + d.wager + ' de oro',
           d.result === 'win' ? 'bien' : 'mal')
  }

  await pvpCargar()
  PVP.ocupado = false
  if (btn) { btn.disabled = false; btn.textContent = 'BUSCAR DUELO' }
}

// La ficha se carga al abrir la pestaña, no al cargar la página: si el
// jugador nunca entra en PvP no hay por qué pedir nada.
var _setModeAntes = setMode
setMode = function (modo, boton) {
  _setModeAntes(modo, boton)
  if (modo === 'pvp') pvpCargar()
}
</script>`
