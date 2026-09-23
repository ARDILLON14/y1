// El combate por turnos se parte en dos módulos, igual que el mapa:
// la pantalla en criptomundo-combat.js y el REPRODUCTOR DEL GUION aquí.
//
// No es solo para no pasar del límite de tamaño que vigila test-build.
// Son dos cosas distintas: una monta la pantalla y atiende los botones;
// la otra coge lo que el servidor decidió y lo cuenta en orden. Cuando
// estaban juntas, "pintar el resultado" y "pedir una acción" se leían
// como si fueran lo mismo, y no lo son.
PAGES['criptomundo-combat.html'] += `<script>
// ── REPRODUCTOR DEL GUION ──────────────────────────────────
//
// El servidor ya decidio todo: cuanto dano, si fue critico, quien
// murio. Aqui NO se calcula nada. Lo unico que se hace es contarlo en
// el orden en que paso, y darle a cada cosa el tiempo que necesita para
// verse.
//
// La diferencia con lo de antes: la barra de vida del enemigo bajaba en
// el mismo instante en que llegaba la respuesta, antes incluso de que
// la animacion del golpe hubiera empezado. Se veia el resultado y luego
// el gesto, al reves. Ahora el numero y la barra van DESPUES del
// impacto, que es lo que hace que un golpe se sienta como un golpe.
async function reproducirGuion(d, accionPedida) {
  STATE.battleId = d.battleId || STATE.battleId;
  STATE.combo = d.combo || 0;
  STATE.phase = d.phase || 1;

  for (var i = 0; i < d.guion.length; i++) {
    var f = d.guion[i];
    await escena(f, d, accionPedida);
    if (f.ms > 0) await sleep(f.ms);
  }

  // Los estados y los enfriamientos vienen con cada turno: se refrescan
  // al terminar de reproducirlo, no antes, para que lo que se ve sea lo
  // que hay al final del turno.
  if (d.estados) pintarEstados(d.estados);
  if (d.habilidades) HABILIDADES = d.habilidades;

  // Lo que queda fuera del guion porque no es una escena: el aviso del
  // proximo golpe fuerte y los marcadores.
  STATE.telegraph = d.telegraph || null;
  if (STATE.telegraph) showTelegraph(STATE.telegraph); else clearTelegraph();
  avisarVidaBaja(d);
  updateBadges();

  if (d.result && d.result.fled) {
    STATE.over = true;
    await sleep(400);
    spawnEnemy(STATE.monsterIdx);
    return;
  }
  if (d.enemyDied) return onVictory(d);
  if (d.playerDied) return onDefeat(d);
}

async function escena(f, d, accionPedida) {
  if (f.fase === 'BATTLE_START') {
    addLog('⚔️ Empieza el combate contra <strong>' + esc(f.enemigo.nombre) + '</strong> (Nv.' + f.enemigo.nivel + ').', 'system');
    if (f.enemigo.esJefe) addLog('👑 Es un jefe: cambiara de comportamiento a media vida.', 'enemy');
    return;
  }

  if (f.fase === 'PLAYER_TURN') {
    $('enemy-turn-overlay').classList.remove('active');
    return;
  }

  // La intencion. No se ve nada todavia: es lo que el jugador pidio,
  // no lo que ha pasado.
  if (f.fase === 'PLAYER_ACTION') return;

  if (f.fase === 'PLAYER_ANIMATION') {
    if (f.anim === 'atacar') {
      animateFighter('player-fighter', 'attack-anim');
      lanzarArma();
      if (f.fallo) addLog('⚡ Tu golpe <em>falla</em>.', 'attack');
    } else if (f.anim === 'habilidad') {
      animateFighter('player-fighter', 'attack-anim');
      addLog('✨ Lanzas <strong>' + esc(f.habilidad) + '</strong>.', 'attack');
      destelloElemento(f.elemento);
    } else if (f.anim === 'defender') {
      animateFighter('player-fighter', 'shake');
      addLog('🛡️ Adoptas postura defensiva.', 'system');
    } else if (f.anim === 'objeto') {
      addLog(dibujoItem({ icon: f.icono, imagen: f.imagen }, 18) + ' Usas <strong>' + esc(f.nombre) + '</strong>.', 'heal');
    } else if (f.anim === 'huir') {
      addLog(f.exito ? '💨 Escapaste del combate.' : '💨 ¡No lograste huir!', 'system');
    }
    return;
  }

  // Aqui, y no antes, se ve el resultado del golpe: primero el numero
  // saltando y luego la barra bajando.
  if (f.fase === 'STATUS_EFFECTS') {
    if (f.veneno) {
      addLog('🧪 El veneno le quita <strong>' + f.dmg + '</strong>.', 'attack');
      floatDmg('-' + f.dmg, 340, 60, 'dmg-enemy');
      animateFighter('enemy-fighter', 'shake');
    } else if (f.miss) {
      floatDmg('FALLO', 340, 80, 'dmg-miss');
    } else if (f.dmg > 0) {
      var critTxt = f.crit ? ' <span style="color:#F0D070">¡CRÍTICO!</span>' : '';
      var elemTxt = f.elemento && f.elemento !== 'physical' ? ' <span style="color:#C040F0">[' + esc(f.elemento) + ']</span>' : '';
      addLog('⚔️ Infliges <strong style="color:#F03030">' + f.dmg + '</strong> de daño.' + critTxt + elemTxt, 'attack');
      floatDmg((f.crit ? '⚡' : '-') + f.dmg, 340, 100, f.crit ? 'dmg-crit' : 'dmg-enemy');
      animateFighter('enemy-fighter', 'shake');
    }
    if (f.cura > 0) {
      addLog('💚 Recuperas <strong style="color:#30C060">' + f.cura + '</strong> de vida.', 'heal');
      floatDmg('+' + f.cura, 80, 80, 'dmg-heal');
    }
    // La barra baja ahora, con el numero ya en pantalla.
    if (typeof f.hpEnemigo === 'number') {
      setEnemyHp(Math.max(0, f.hpEnemigo - (f.dmg || 0)), f.hpEnemigoMax || STATE.enemyMaxHp);
    }
    if (f.combo >= 3) addLog('🔥 ¡Combo ×' + f.combo + '!', 'loot');
    return;
  }

  if (f.fase === 'ENEMY_TURN') {
    $('enemy-turn-overlay').classList.add('active');
    return;
  }

  if (f.fase === 'ENEMY_ACTION') {
    if (f.esquivado) {
      addLog('💨 ¡Esquivas el ataque!', 'system');
      floatDmg('ESQUIVA', 100, 80, 'dmg-miss');
    } else if (f.dmg > 0) {
      var quien = STATE.monster ? esc(STATE.monster.name) : 'El enemigo';
      var pesado = f.pesado ? ' con <strong>' + esc(f.pesado) + '</strong>' : '';
      addLog((STATE.monster ? STATE.monster.icon : '👹') + ' <strong>' + quien + '</strong> te golpea' + pesado +
        ' por <strong style="color:#E05050">' + f.dmg + '</strong>.', 'enemy');
      animateFighter('enemy-fighter', 'attack-anim');
      animateFighter('player-fighter', 'shake');
      floatDmg('-' + f.dmg, 100, 90, 'dmg-player');
      if (f.bloqueado) addLog('🛡️ Tu bloqueo absorbe la mayor parte.', 'system');
    }
    if (typeof f.hpJugador === 'number') setPlayerHp(f.hpJugador, f.hpJugadorMax || STATE.char.maxHp);
    if (f.avisa) addLog('⚠️ Prepara <strong>' + esc(f.avisa.nombre) + '</strong> — bloquea o interrumpe.', 'enemy');
    return;
  }

  if (f.fase === 'CHECK_VICTORY') {
    $('enemy-turn-overlay').classList.remove('active');
    // Los numeros definitivos del turno, por si alguna escena no llego
    // a tocarlos (un turno en el que el enemigo no responde, por
    // ejemplo). Es el punto de sincronia con el servidor.
    if (typeof d.newHp === 'number') { STATE.char.hp = d.newHp; setPlayerHp(d.newHp, STATE.char.maxHp); }
    if (typeof d.newMp === 'number') { STATE.char.mp = d.newMp; setPlayerMp(d.newMp, STATE.char.maxMp); }
    if (typeof d.newMonsterHp === 'number') setEnemyHp(d.newMonsterHp, d.enemyMaxHp || STATE.enemyMaxHp);
    return;
  }

  if (f.fase === 'BATTLE_END') {
    if (f.motivo === 'victoria') animateFighter('enemy-fighter', 'shake');
    return;
  }
}

// El arma sale disparada hacia el enemigo y vuelve. Es el gesto que
// faltaba: antes el jugador temblaba un poco y el dano aparecia solo.
function lanzarArma() {
  var el = $('arma-jugador');
  if (!el) return;
  el.classList.remove('golpe');
  void el.offsetWidth;
  el.classList.add('golpe');
  setTimeout(function () { el.classList.remove('golpe'); }, 420);
}

// Un fogonazo del color del elemento. El servidor dice cual.
function destelloElemento(el) {
  var COLORES = { fire: '#F08040', ice: '#7FD4F0', lightning: '#C8A0F0',
                  nature: '#90D070', dark: '#A060C0', earth: '#B08040' };
  var c = COLORES[el];
  if (!c) return;
  var a = $('arena');
  if (!a) return;
  var d = document.createElement('div');
  d.className = 'destello-elemento';
  d.style.background = 'radial-gradient(circle, ' + c + '55 0%, transparent 70%)';
  a.appendChild(d);
  setTimeout(function () { try { d.remove(); } catch (e) {} }, 500);
}

async function render(d, action) {
  var res = d.result || {};
  STATE.battleId = d.battleId || STATE.battleId;
  STATE.combo = d.combo || 0;
  STATE.phase = d.phase || 1;

  // Daño del jugador
  if (res.isMiss) {
    addLog('⚡ Tu golpe <em>falla</em>.', 'attack');
    floatDmg('FALLO', 340, 80, 'dmg-miss');
  } else if (res.playerDmg > 0) {
    var critTxt = res.isCrit ? ' <span style="color:#F0D070">¡CRÍTICO!</span>' : '';
    var elemTxt = res.element && res.element !== 'physical' ? ' <span style="color:#C040F0">[' + esc(res.element) + ']</span>' : '';
    addLog('⚔️ Infliges <strong style="color:#F03030">' + res.playerDmg + '</strong> de daño.' + critTxt + elemTxt, 'attack');
    floatDmg((res.isCrit ? '⚡' : '-') + res.playerDmg, 340, 100, 'dmg-enemy');
    animateFighter('player-fighter', 'attack-anim');
    animateFighter('enemy-fighter', 'shake');
  }
  if (res.playerHeal > 0) {
    addLog('💚 Recuperas <strong style="color:#30C060">' + res.playerHeal + '</strong> de vida.', 'heal');
    floatDmg('+' + res.playerHeal, 80, 80, 'dmg-heal');
  }
  if (action === 'block') addLog('🛡️ Adoptas postura defensiva.', 'system');

  // Mensajes del motor (combos, bloqueos, fases, telegrafía, veneno)
  (res.log || []).forEach(function(l) {
    var cls = l.indexOf('Combo') >= 0 ? 'loot' : (l.indexOf('⚠️') >= 0 ? 'enemy' : 'system');
    addLog(esc(l), cls);
  });

  setEnemyHp(d.newMonsterHp, d.enemyMaxHp || STATE.enemyMaxHp);
  await sleep(300);

  // Daño enemigo
  if (res.enemyDmg > 0) {
    addLog(STATE.monster.icon + ' <strong>' + esc(STATE.monster.name) + '</strong> te golpea por <strong style="color:#E05050">' + res.enemyDmg + '</strong>.', 'enemy');
    floatDmg('-' + res.enemyDmg, 100, 90, 'dmg-player');
    animateFighter('enemy-fighter', 'attack-anim');
    animateFighter('player-fighter', 'shake');
  }

  STATE.char.hp = d.newHp;
  STATE.char.mp = d.newMp;
  setPlayerHp(d.newHp, STATE.char.maxHp);
  setPlayerMp(d.newMp, STATE.char.maxMp);

  // Telegrafía: aviso visible del próximo ataque fuerte
  STATE.telegraph = d.telegraph || null;
  if (STATE.telegraph) showTelegraph(STATE.telegraph);
  else clearTelegraph();
  updateBadges();

  if (res.fled) {
    addLog('💨 Escapaste del combate.', 'system');
    STATE.over = true;
    await sleep(500);
    spawnEnemy(STATE.monsterIdx);
    return;
  }
  if (d.enemyDied) return onVictory(d);
  if (d.playerDied) return onDefeat(d);
}

// ── VIDA BAJA ──────────────────────────────────────────────
//
// El golpe anunciado del enemigo ya se avisa y se resalta el botón de
// bloquear. Lo que faltaba era el otro lado: nadie te dice que bebas.
//
// Y no es un detalle de adorno. El banco de balance del proyecto mide
// que un jugador que bloquea y se cura por debajo de un tercio gana el
// 100 % de las peleas del juego, jefes incluidos; sin hacer esas dos
// cosas, un nivel 1 muere cuatro veces antes de llegar al 3. O sea que
// la dificultad no estaba en los números sino en dos mecánicas que nadie
// te contaba. Una ya se contaba. Esta es la que faltaba.
function avisarVidaBaja(d) {
  var el = $('telegraph');
  if (!el || STATE.telegraph) return;   // el golpe anunciado manda
  // Los datos salen del turno que acaba de contestar el servidor, y solo
  // se mira la variable global como último recurso: atarse a ella hacía
  // que este aviso reventara el reproductor entero allí donde no
  // estuviera definida.
  var yo = (typeof PLAYER !== 'undefined' && PLAYER) ? PLAYER : {};
  var hp = (d && typeof d.newHp === 'number') ? d.newHp : yo.hp;
  var tope = (d && typeof d.maxHp === 'number') ? d.maxHp : (yo.maxHp || 0);
  if (!tope || hp > tope * 0.34 || hp <= 0) { if (el.dataset.motivo === 'vida') clearTelegraph(); return; }
  el.dataset.motivo = 'vida';
  el.innerHTML = '🩸 <strong>Te queda poca vida</strong> — bebe 🧪 antes de seguir: curarse no te quita el turno de atacar.';
  el.classList.add('show');
}

// ── TELEGRAFÍA ─────────────────────────────────────────────
function showTelegraph(t) {
  var el = $('telegraph');
  el.dataset.motivo = 'golpe';
  el.innerHTML = '⚠️ <strong>' + esc(t.name) + '</strong> — daño ×' + t.mult + '. Bloquea 🛡️ o interrumpe con Golpe de Escudo.';
  el.classList.add('show');
  $('enemy-fighter').classList.add('charging');
  var blockBtn = $('btn-block');
  if (blockBtn) blockBtn.classList.add('urgent');
}
function clearTelegraph() {
  var el = $('telegraph');
  if (el) { el.classList.remove('show'); el.innerHTML = ''; el.dataset.motivo = ''; }
  $('enemy-fighter').classList.remove('charging');
  var blockBtn = $('btn-block');
  if (blockBtn) blockBtn.classList.remove('urgent');
}

function updateBadges() {
  var c = $('combo-badge');
  if (c) {
    c.textContent = 'COMBO ×' + STATE.combo;
    c.classList.toggle('show', STATE.combo >= 2);
  }
  var p = $('phase-badge');
  if (p) {
    p.textContent = 'FASE ' + STATE.phase;
    p.classList.toggle('show', STATE.phase >= 2);
  }
}

// ── VICTORIA / DERROTA ─────────────────────────────────────
async function onVictory(d) {
  STATE.over = true;
  clearTelegraph();
  STATE.kills++;
  STATE.char.gold += d.goldEarned || 0;
  STATE.char.cgrid += d.cgridEarned || 0;
  STATE.char.xp += d.xpEarned || 0;
  if (d.newLevel) { STATE.char.level = d.newLevel; STATE.char.xpToNext = d.newXpToNext; }

  addLog('🏆 <strong>' + esc(STATE.monster.name) + '</strong> derrotado.', 'victory');
  addLog('✨ +' + (d.xpEarned || 0) + ' EXP · 🪙 +' + (d.goldEarned || 0) + ' Oro' + (d.cgridEarned ? ' · 💎 +' + d.cgridEarned + ' CGRID' : ''), 'loot');

  (d.loot || []).forEach(function(l) {
    addLog(dibujoItem(l, 18) + ' Obtienes <strong>' + esc(l.name) + '</strong> ×' + l.quantity + ' (' + (RARITY_ES[l.rarity] || l.rarity) + ')', 'loot');
    showLootNotif(dibujoItem(l, 26), l.name, (l.rarity || 'COMMON').toLowerCase());
  });

  (d.levelUps || []).forEach(function(lu) {
    addLog('🎉 <strong>¡NIVEL ' + lu.level + '!</strong> Vida y maná restaurados.', 'victory');
    STATE.char.maxHp = lu.maxHp; STATE.char.maxMp = lu.maxMp;
  });

  (d.questUpdates || []).forEach(function(q) {
    addLog('📜 Misión: objetivo ' + q.current + '/' + q.required, 'system');
  });

  var api2 = await api('/api/player');
  if (api2.ok) { STATE.char = api2.data.character; renderChar(); }
  var inv = await api('/api/inventory');
  if (inv.ok) { STATE.inventory = inv.data.inventory || []; renderInventory(); }
  renderMonsterPicker();
  document.querySelectorAll('.mon-btn').forEach(function(b) {
    b.classList.toggle('active', Number(b.dataset.idx) === STATE.monsterIdx);
  });

  $('reward-xp').textContent = '✨ +' + (d.xpEarned || 0) + ' EXP';
  $('reward-gold').textContent = '🪙 +' + (d.goldEarned || 0) + ' Oro' + (d.cgridEarned ? '  ·  💎 +' + d.cgridEarned + ' CGRID' : '');
  var ri = $('reward-item');
  if ((d.loot || []).length) {
    ri.style.display = 'flex';
    ri.innerHTML = d.loot.map(function(l) { return dibujoItem(l, 20) + ' ' + esc(l.name) + ' ×' + l.quantity; }).join('   ');
  } else ri.style.display = 'none';

  await sleep(400);
  $('victory-overlay').classList.add('show');
  sendToParent('REFRESH_CHARACTER', {});
}

async function onDefeat(d) {
  STATE.over = true;
  clearTelegraph();
  addLog('☠️ Has caído. Pierdes ' + (d.goldLost || 0) + ' de oro.', 'enemy');
  // El enemigo NO vuelve a estar intacto: se cura medio depósito y sigue
  // herido donde lo dejaste. Hay que decirlo, porque lo que el jugador ve
  // es que la barra del enemigo sube sola, y eso sin explicación parece
  // un fallo del juego.
  if (d.enemyHpTrasMorir) {
    addLog('🩹 ' + esc(STATE.monster.name) + ' se recupera a medias, pero sigue herido: le quedan ' +
      d.enemyHpTrasMorir + '. Tu avance no se ha borrado.', 'enemy');
  }
  var me = await api('/api/player');
  if (me.ok) { STATE.char = me.data.character; renderChar(); }
  await sleep(400);
  $('defeat-overlay').classList.add('show');
  sendToParent('REFRESH_CHARACTER', {});
}

function nextEnemy() {
  $('victory-overlay').classList.remove('show');
  spawnEnemy((STATE.monsterIdx + 1) % STATE.monsters.length);
}

async function respawn() {
  $('defeat-overlay').classList.remove('show');
  var r = await api('/api/player/respawn', { method: 'POST' });
  if (r.ok) { STATE.char.hp = r.data.hp; STATE.char.mp = r.data.mp; renderChar(); }
  spawnEnemy(0);
  sendToParent('REFRESH_CHARACTER', {});
}

// ── BARRAS / LOG / VFX ─────────────────────────────────────
function setPlayerHp(hp, max) {
  var pct = Math.max(0, Math.min(100, hp / max * 100)).toFixed(1);
  $('hp-bar').style.width = pct + '%';
  $('hp-text').textContent = hp + ' / ' + max;
  $('player-sprite-hp').style.width = pct + '%';
}
function setPlayerMp(mp, max) {
  var pct = Math.max(0, Math.min(100, mp / max * 100)).toFixed(1);
  $('mp-bar').style.width = pct + '%';
  $('mp-text').textContent = mp + ' / ' + max;
}
function setEnemyHp(hp, max) {
  STATE.enemyHp = Math.max(0, hp || 0);
  STATE.enemyMaxHp = max || STATE.enemyMaxHp;
  var pct = Math.max(0, Math.min(100, STATE.enemyHp / STATE.enemyMaxHp * 100)).toFixed(1);
  $('enemy-sprite-hp').style.width = pct + '%';
  var tag = $('enemy-name-tag');
  if (STATE.monster) tag.textContent = STATE.monster.name + (STATE.monster.isBoss ? ' 👑' : '') + '  ' + STATE.enemyHp + '/' + STATE.enemyMaxHp;
}

function addLog(msg, type) {
  var log = $('combat-log');
  var el = document.createElement('div');
  el.className = 'log-entry ' + (type || '');
  el.innerHTML = msg;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

function floatDmg(text, x, y, cls) {
  var arena = $('arena');
  var div = document.createElement('div');
  div.className = 'dmg-float ' + cls;
  div.textContent = text;
  div.style.left = x + 'px';
  div.style.top = y + 'px';
  arena.appendChild(div);
  setTimeout(function(){ div.remove(); }, 1300);
}

function animateFighter(id, cls) {
  var el = $(id);
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(function(){ el.classList.remove(cls); }, 500);
}

function setActionsEnabled(enabled) {
  document.querySelectorAll('.action-btn').forEach(function(b){ b.disabled = !enabled; });
  $('enemy-turn-overlay').classList.toggle('active', !enabled);
}

function showLootNotif(icon, name, rarity) {
  var n = $('loot-notif');
  $('ln-icon').innerHTML = icon;
  $('ln-text').innerHTML = '<strong>' + esc(name) + '</strong>';
  n.className = 'loot-notif show r-' + rarity;
  setTimeout(function(){ n.classList.remove('show'); }, 3000);
}

// Un objeto puede traer dibujo propio (item.imagen) o quedarse con su
// emoji (item.icon). Los objetos antiguos no traen imagen: por eso el
// emoji no es un adorno, es el fallback obligatorio. Ninguna pantalla
// se puede romper porque falte un PNG.
// Un objeto con dibujo propio se pinta; uno sin dibujo se queda con su
// emoji. Acepta las dos formas de nombrar el icono porque conviven dos:
// el inventario manda "icon" (sale de la plantilla, en ingles) y el
// catalogo de combate manda "icono". Leyendo solo una, medio panel
// salia con la caja de objeto desconocido.
function dibujoItem(it, px) {
  var n = px || 22;
  var emoji = (it && (it.icon || it.icono)) || '📦';
  if (it && it.imagen) {
    // El alt lleva el emoji a propósito: si el PNG no carga, el
    // navegador pinta el texto alternativo y el objeto sigue viéndose.
    return '<img src="' + it.imagen + '" alt="' + emoji + '"' +
      ' width="' + n + '" height="' + n + '"' +
      ' style="image-rendering:pixelated;vertical-align:middle">';
  }
  return emoji;
}


// ── ARMA EQUIPADA, VISIBLE ─────────────────────────────────
// El mismo catálogo que usa la arena: nombre, dibujo y emoji de
// reserva. No hay una segunda lista de armas para el combate por
// turnos; si mañana cambia el dibujo de una espada, cambia en los dos.
async function pintarArma() {
  var el = $('arma-jugador');
  if (!el) return;
  try {
    var r = await api('/api/arena');
    var w = r.ok && r.data && r.data.armaDetalle;
    if (!w) { el.innerHTML = ''; return; }
    el.title = w.nombre || '';
    el.innerHTML = w.imagen
      ? '<img src="' + w.imagen + '" alt="' + (w.icono || '') + '">'
      : (w.icono || '');
  } catch (e) { el.innerHTML = ''; }
}

// ── OBJETOS EN COMBATE ─────────────────────────────────────
// Antes el botón bebía siempre la Poción de Curación I porque era la
// única que el motor conocía. Ahora el servidor dice qué sirve y con
// qué efecto, y se elige.
var OBJETOS = [];
async function cargarObjetos() {
  try {
    var r = await api('/api/combat/objetos');
    OBJETOS = (r.ok && r.data.objetos) || [];
  } catch (e) { OBJETOS = []; }
  var n = $('objetos-cuenta');
  if (n) n.textContent = OBJETOS.length ? OBJETOS.length + ' tipos' : 'ninguno';
}

function abrirObjetos() {
  if (STATE.busy || STATE.over) return;
  var caja = $('objetos-panel');
  if (!caja) return;
  if (!OBJETOS.length) {
    addLog('🎒 No llevas nada que puedas usar en combate.', 'system');
    return;
  }
  // Nada de onclick dentro del HTML: esta página vive en un template
  // literal y las comillas de un atributo hay que escaparlas dos veces
  // (una para el literal, otra para el HTML). Se escapa mal una vez y
  // el script entero deja de compilar, que es justo lo que pasó al
  // escribir esto. Con listeners no hay comillas que escapar.
  caja.innerHTML = '';
  OBJETOS.forEach(function (o) {
    var que = o.cura ? '+' + o.cura + ' vida' : (o.mana ? '+' + o.mana + ' maná' : '');
    if (o.efecto) que += (que ? ' · ' : '') + o.efecto.stat + ' +' + o.efecto.valor;
    var b = document.createElement('button');
    b.className = 'obj-item';
    b.innerHTML = '<span class="obj-ico">' + dibujoItem(o, 20) + '</span>' +
      '<span class="obj-txt"><b>' + esc(o.nombre) + '</b><br><small>' + esc(que) + '</small></span>' +
      '<span class="obj-cant">×' + o.cantidad + '</span>';
    b.addEventListener('click', function () { usarObjeto(o.itemId); });
    caja.appendChild(b);
  });
  caja.classList.add('abierto');
}
function cerrarObjetos() {
  var caja = $('objetos-panel');
  if (caja) caja.classList.remove('abierto');
}
// Tocar fuera de los botones cierra el panel.
document.addEventListener('DOMContentLoaded', function () {
  var caja = document.getElementById('objetos-panel');
  if (caja) caja.addEventListener('click', function (e) { if (e.target === caja) cerrarObjetos(); });
});
async function usarObjeto(itemId) {
  cerrarObjetos();
  await doAction('objeto', itemId);
  cargarObjetos();
}

// ── HABILIDADES ────────────────────────────────────────────
// Cada clase sabe tres y la pantalla solo mandaba la primera:
// skillId = char.skills[0], siempre. Un Guerrero no podía lanzar
// Escudo en toda su vida — la única que interrumpe el ataque anunciado
// del enemigo, la que el propio aviso te dice que uses.
var HABILIDADES = [];
async function cargarHabilidades() {
  try {
    var r = await api('/api/combat/habilidades');
    if (r.ok) { HABILIDADES = r.data.habilidades || []; pintarEstados(r.data.estados); }
  } catch (e) { HABILIDADES = []; }
  var n = $('hab-cuenta');
  if (n) n.textContent = HABILIDADES.length ? HABILIDADES.length + ' magias' : '—';
}

function abrirHabilidades() {
  if (STATE.busy || STATE.over) return;
  var caja = $('hab-panel');
  if (!caja) return;
  if (!HABILIDADES.length) { addLog('✨ Tu clase todavía no tiene habilidades.', 'system'); return; }
  caja.innerHTML = '';
  HABILIDADES.forEach(function (h) {
    var que = { daño: 'Daño', refuerzo: 'Te refuerza', veneno: 'Deja veneno',
                aturde: 'Aturde e interrumpe', ralentiza: 'Ralentiza' }[h.efecto] || h.efecto;
    var b = document.createElement('button');
    b.className = 'obj-item' + (h.lista ? '' : ' apagado');
    b.disabled = !h.lista;
    var pie = h.lista ? que : (h.porQueNo === 'enfriando'
      ? 'Enfriando · ' + Math.ceil(h.restanteMs / 1000) + 's'
      : 'Sin maná (' + h.coste + ')');
    b.innerHTML = '<span class="obj-ico">' + ICONO_ELEM(h) + '</span>' +
      '<span class="obj-txt"><b>' + esc(h.nombre) + '</b><br><small>' + esc(pie) + '</small></span>' +
      '<span class="obj-cant">' + h.coste + ' MP</span>';
    b.addEventListener('click', function () { if (h.lista) usarHabilidad(h.id); });
    caja.appendChild(b);
  });
  caja.classList.add('abierto');
}
function cerrarHabilidades() {
  var caja = $('hab-panel');
  if (caja) caja.classList.remove('abierto');
}
// Tocar fuera cierra el panel, igual que el de objetos.
document.addEventListener('DOMContentLoaded', function () {
  var caja = document.getElementById('hab-panel');
  if (caja) caja.addEventListener('click', function (e) { if (e.target === caja) cerrarHabilidades(); });
});
function ICONO_ELEM(h) {
  if (h.aturde) return '💫';
  if (h.efecto === 'refuerzo') return '🛡️';
  if (h.efecto === 'veneno') return '🧪';
  var m = { fire: '🔥', ice: '❄️', lightning: '⚡', nature: '🌿', dark: '🌑', physical: '⚔️' };
  return m[h.elemento] || '✨';
}
async function usarHabilidad(id) {
  cerrarHabilidades();
  await doAction('magic', null, id);
  cargarHabilidades();
}

// ── ESTADOS ACTIVOS ────────────────────────────────────────
// Los refuerzos y venenos existían y no se veían por ningún lado: bebías
// una poción de fuerza y no había forma de saber si seguía haciendo
// efecto, ni cuántos turnos le quedaban al veneno del enemigo.
function pintarEstados(est) {
  if (!est) return;
  ['jugador', 'enemigo'].forEach(function (lado) {
    var el = $('estados-' + lado);
    if (!el) return;
    var lista = est[lado] || [];
    el.innerHTML = lista.map(function (e) {
      var dur = e.turnos != null ? e.turnos + 'T' : (e.segundos != null ? e.segundos + 's' : '');
      return '<span class="estado-chip ' + e.tipo + '" title="' + esc(e.nombre) + '">' +
        e.icono + ' ' + esc(dur) + '</span>';
    }).join('');
  });
}
</script>`
