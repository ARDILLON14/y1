// El mundo 2D se parte en tres módulos, igual que el combate por
// turnos: la pantalla y el motor de Phaser en criptomundo-mundo2d.js,
// el mundo y sus zonas en el -2, y AQUÍ el combate.
//
// No es solo por el límite de 70 KB por módulo que vigila
// test-build.js. Son dos cosas distintas: una dibuja el mundo y lo
// recorre; la otra manda la intención de pelear al servidor y cuenta
// lo que contesta. Mientras estuvieron juntas, el combate acabó
// resolviéndose en el navegador sin que se notara.
PAGES['criptomundo-mundo2d.html'] += `<script>
// ═══════════════════════════════════════════════════
// COMBATE (autoridad del servidor)
// ═══════════════════════════════════════════════════

// El combate del mundo lo decide el SERVIDOR
// ───────────────────────────────────────────
//
// Esta pantalla resolvía la pelea ella sola: tiraba el dado del
// crítico, del fallo y de la huida, calculaba el daño, se sumaba el
// oro y la experiencia, y elegía el botín de una lista suya que ni
// siquiera coincidía con el catálogo del juego. Nada de eso salía del
// navegador.
//
// Dos consecuencias, las dos comprobadas:
//   · cualquiera con la consola abierta se ponía el oro que quisiera;
//   · el progreso no existía. Al recargar no quedaba nada, y mientras
//     tanto syncCharacter() traía cada 8 segundos las cifras de verdad
//     y borraba las inventadas delante del jugador.
//
// Ahora manda una intención y pinta lo que contesta el servidor. El
// endpoint ya existía, ya era autoritativo y ya estaba probado: esta
// era la única pantalla del juego que no lo usaba.

function accionesHabilitadas(activas) {
  document.querySelectorAll('.cp-action').forEach(function (b) {
    // Son <div>, no <button>: ponerles .disabled no hacía absolutamente
    // nada y los botones seguían clicables en mitad del turno.
    b.classList.toggle('cp-apagada', !activas)
  })
}

// Cuánta vida le queda al enemigo, con sus números de verdad. Hasta que
// el servidor contesta el primer turno no se sabe: la vida del bicho se
// escala a quien lo pelea, así que la ficha del mapa no vale.
function pintarVidaEnemigo(hp, hpMax) {
  var txt = document.getElementById('cp-hp-txt')
  var bar = document.getElementById('cp-hp-bar')
  if (hp == null || !hpMax) { if (txt) txt.textContent = '— / — HP'; if (bar) bar.style.width = '100%'; return }
  if (txt) txt.textContent = hp + ' / ' + hpMax + ' HP'
  if (bar) bar.style.width = Math.max(0, Math.min(100, (hp / hpMax) * 100)).toFixed(1) + '%'
}

async function combatAction(type) {
  if (!activeCombat || combatBusy) return
  if (!activeCombat.servidor) {
    addCombatLog('⚠️ Este enemigo no está en el catálogo del servidor.', 'miss')
    return
  }
  combatBusy = true
  accionesHabilitadas(false)

  var r = await apiPost('/api/combat/action', {
    monsterId: activeCombat.servidor,
    battleId: activeCombat.battleId || null,
    action: type,
  })

  if (!r.ok) {
    // El servidor dice por qué: sin maná, en enfriamiento, demasiado
    // rápido, sin pociones. Se enseña tal cual en vez de dejar al
    // jugador preguntándose si el botón funciona.
    addCombatLog('⚠️ ' + (r.data.error || 'El servidor rechazó la acción'), 'miss')
    combatBusy = false
    accionesHabilitadas(true)
    return
  }

  var d = r.data
  activeCombat.battleId = d.battleId

  // ── Lo que hizo el jugador ──
  if (d.miss) addCombatLog('⚔️ Tu ataque falla en el blanco.', 'miss')
  else if (d.playerDmg > 0) {
    addCombatLog('⚔️ Golpeas' + (d.crit ? ' ¡CRÍTICO!' : '') + ' ' + d.playerDmg + ' de daño.', 'hit')
  }
  if (d.result && d.result.playerHeal > 0) addCombatLog('💚 Te curas ' + d.result.playerHeal + ' de vida.', 'heal')
  ;(d.result && d.result.log ? d.result.log : []).forEach(function (l) { addCombatLog('· ' + l, 'miss') })
  if (d.combo >= 3) addCombatLog('🔥 Combo ×' + d.combo, 'hit')

  // ── Lo que hizo el enemigo ──
  if (d.enemyDmg > 0) addCombatLog(activeCombat.sprite + ' ' + activeCombat.name + ' ataca. ' + d.enemyDmg + ' de daño.', 'hit')
  // El campo se llama name, no nombre: es el objeto de battle.telegraph
  // tal cual, y leyéndolo mal el aviso no salía nunca.
  //
  // El texto no dice "bloquea o interrumpe" como el de la pantalla de
  // combate completa, porque aquí no hay botón de bloquear: esta
  // pantalla solo ofrece golpe, magia, sanar y huir. Prometer una
  // acción que no está es peor que no avisar.
  if (d.telegraph && d.telegraph.name) {
    addCombatLog('⚠️ ' + activeCombat.name + ' prepara ' + d.telegraph.name + '.', 'miss')
  }

  pintarVidaEnemigo(d.newMonsterHp, d.enemyMaxHp)
  PLAYER.hp = d.newHp
  PLAYER.mp = d.newMp
  updateBars()

  ;(d.questUpdates || []).forEach(function (q) {
    addLog('📜 Misión: objetivo ' + q.current + '/' + q.required, 'loot')
  })

  if (d.fled) return alHuir()
  if (d.enemyDied) return alMatarEnemigo(d)
  if (d.playerDied) return alMorir(d)

  combatBusy = false
  accionesHabilitadas(true)
}

function alHuir() {
  addCombatLog('💨 ¡Escapaste del combate!', 'miss')
  addLog('💨 Huiste del combate.', 'combat')
  setTimeout(function () { closeCombat(true) }, 800)
}

function alMatarEnemigo(d) {
  addCombatLog('💀 ¡' + activeCombat.name + ' derrotado!', 'hit')
  addCombatLog('🪙 +' + d.goldEarned + ' oro  ✨ +' + d.xpEarned + ' EXP', 'heal')
  if (d.cgridEarned) addCombatLog('🪩 +' + d.cgridEarned + ' CGRID', 'heal')

  // El botín es el que decidió el servidor y YA está en el inventario.
  ;(d.loot || []).forEach(function (l) {
    addCombatLog((l.icon || '📦') + ' ¡Obtuviste: ' + l.name + ' ×' + l.quantity + '!', 'heal')
    addLog((l.icon || '📦') + ' Botín: ' + l.name + ' ×' + l.quantity, 'loot')
  })
  ;(d.levelUps || []).forEach(function (lu) {
    addCombatLog('⭐ ¡Subes al nivel ' + lu.level + '!', 'heal')
    addLog('⭐ Nivel ' + lu.level, 'loot')
  })
  addLog('☠️ Derrotaste a ' + activeCombat.sprite + ' ' + activeCombat.name +
         ' (+' + d.goldEarned + ' 🪙 +' + d.xpEarned + ' EXP)', 'combat')

  quitarEnemigoDelMapa()
  showToast('⚔️ ¡Victoria! +' + d.goldEarned + ' 🪙 +' + d.xpEarned + ' EXP')
  // Oro, experiencia, nivel y bajas vienen de donde se guardan.
  syncCharacter()
  document.getElementById('cp-close').style.display = 'block'
  combatBusy = false
}

// Saca del mapa al bicho que acaba de morir. Es lo único de todo esto
// que sigue siendo cosa del cliente, porque es dibujo, no reglas.
function quitarEnemigoDelMapa() {
  if (!gameScene || !activeCombat || activeCombat.index == null) return
  // La referencia se guarda ANTES de animar: el desvanecido dura 400 ms
  // y pulsar "Continuar" antes de que acabe deja activeCombat a null,
  // así que leerlo dentro del onComplete reventaba.
  var sprite = activeCombat.spriteText
  if (sprite) {
    gameScene.tweens.add({
      targets: sprite, alpha: 0, y: sprite.y - 20,
      duration: 400, onComplete: function () { sprite.destroy() },
    })
  }
  var md = gameScene.monsterData[activeCombat.index]
  if (md && md.label) md.label.destroy()
  if (md && md.sombra) md.sombra.destroy()
  gameScene.monsterTexts.splice(activeCombat.index, 1)
  gameScene.monsterData.splice(activeCombat.index, 1)
  gameScene.monsterWalkTimers.splice(activeCombat.index, 1)
}

async function alMorir(d) {
  addCombatLog('☠️ Has sido derrotado. Pierdes ' + (d.goldLost || 0) + ' oro.', 'miss')
  // El enemigo se cura medio depósito, no vuelve a estar entero. Si no se
  // dice, el jugador que vuelva a por él ve una barra más llena que cuando
  // lo dejó y no sabe si le ha pasado algo raro.
  if (d.enemyHpTrasMorir) {
    addCombatLog('🩹 Sigue herido: le quedan ' + d.enemyHpTrasMorir + '. Tu avance no se ha borrado.', 'miss')
  }
  addLog('☠️ Derrotado. Vuelves al Pueblo (-' + (d.goldLost || 0) + ' 🪙)', 'combat')
  // El servidor ya dejó la vida al 50 %; respawn solo lo confirma y
  // devuelve las cifras buenas.
  await apiPost('/api/player/respawn', {})
  await syncCharacter()
  document.getElementById('cp-close').style.display = 'block'
  combatBusy = false
  setTimeout(function () {
    closeCombat(true)
    gameScene.changeZone('pueblo')
  }, 1500)
}
</script>`
