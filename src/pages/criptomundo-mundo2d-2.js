PAGES['criptomundo-mundo2d.html'] += `<script>
// ═══════════════════════════════════════════════════
// GAME DATA
// ═══════════════════════════════════════════════════

const ZONES = {
  pueblo: {
    name:'Pueblo Central', icon:'🏘️',
    sub:'Zona segura — Nv.1+',
    bgColor:   0x2D4A1E,
    gridColor: 0x1A3010,
    // Identidad visual de la zona: qué se salpica por el suelo y qué
    // tinte de ambiente lleva. Un pueblo se ve cálido y despejado.
    decor: ['🌿', '🌾', '·', '🪨', '🌼'],
    densidadDecor: 20,
    ambiente: { color: 0xF0D070, fuerza: 0.05 },
    music: 'peaceful',
    npcs:[
      { id:'aldric', servidor:'npc_aldric', x:320, y:220, sprite:'⚒️', name:'Aldric el Herrero',  role:'Maestro Forjador',    greeting:'¡Bienvenido! Tengo trabajo para alguien con tus habilidades. Los trolls del norte son un problema.',  choices:['¿Qué necesitas?','¿Cuánto pagas?','Hasta luego'] },
      { id:'lyria', servidor:'npc_lyria',  x:520, y:180, sprite:'🧪', name:'Lyria la Alquimista',role:'Maestra Alquimista',   greeting:'Ah, un aventurero. Mis suministros de hierbas se agotan. ¿Podrías ayudarme con la recolección?',   choices:['Con gusto ayudo','¿Es peligroso?','Otro día'] },
      { id:'mira',   x:420, y:340, sprite:'🛒', name:'Mira la Mercader',   role:'Comerciante Itinerante',greeting:'¡Hola! Tengo una entrega urgente para las minas del norte. ¿Te interesa el trabajo bien pagado?',  choices:['¿Qué llevar?','¿Cuánto?','No gracias'] },
    ],
    monsters:[],
    exits:{ north:'bosque', east:'minas' },
    structures:[
      {x:280,y:160,w:120,h:80,color:0x8B6914,label:'⚒️ Forja'},
      {x:480,y:140,w:100,h:70,color:0x4A3080,label:'🧪 Alquimia'},
      {x:600,y:200,w:130,h:90,color:0x1A5A3A,label:'🏪 Mercado'},
      {x:140,y:280,w:150,h:100,color:0x5A3A14,label:'🏛️ Taberna'},
    ],
  },
  bosque: {
    name:'Bosque del Este', icon:'🌲',
    sub:'Zona de caza — Nv.5–15',
    bgColor:   0x1A3A14,
    gridColor: 0x0F2A0A,
    decor: ['🌿', '🍄', '🌲', '·', '🍂'],
    densidadDecor: 34,
    ambiente: { color: 0x0A2008, fuerza: 0.12 },
    music: 'tense',
    npcs:[
      { id:'elara', x:480, y:200, sprite:'🌿', name:'Elara la Guardabosque', role:'Guardiana del Bosque', greeting:'Silencio... El bosque habla de peligro. Una plaga corrompe los árboles del este. Necesito tu ayuda.', choices:['¿Dónde están?','Puedo intentarlo','Demasiado peligroso'] },
    ],
    // Los bichos del mapa dicen DÓNDE están y cómo se dibujan. Lo que
    // pegan, lo que aguantan y lo que sueltan lo dice el servidor: esos
    // números vivían aquí duplicados y con otra escala, y el combate
    // del navegador los usaba para repartirse el oro él solo.
    monsters:[
      { id:'troll',    servidor:'m_troll',    sprite:'🧟', name:'Troll Sombrío',   level:5  },
      { id:'spider',   servidor:'m_spider',   sprite:'🕷️', name:'Araña Venenosa', level:3  },
      { id:'skeleton', servidor:'m_skeleton', sprite:'💀', name:'Esqueleto',       level:4  },
    ],
    exits:{ south:'pueblo', east:'ruinas' },
    structures:[
      {x:200,y:150,w:60,h:60,color:0x0A2008,label:'🌲'},
      {x:400,y:100,w:80,h:80,color:0x0A2008,label:'🌳'},
      {x:580,y:180,w:70,h:70,color:0x0A2008,label:'🌲'},
      {x:320,y:280,w:90,h:90,color:0x0A2008,label:'🌳'},
    ],
  },
  minas: {
    name:'Minas del Norte', icon:'⛏️',
    sub:'Zona de recursos — Nv.8–20',
    bgColor:   0x2A2218,
    gridColor: 0x1A140C,
    decor: ['🪨', '⛏️', '·', '💎'],
    densidadDecor: 26,
    ambiente: { color: 0x000000, fuerza: 0.22 },
    music: 'dungeon',
    npcs:[
      { id:'thorn', x:400, y:200, sprite:'⛏️', name:'Thorn el Minero', role:'Jefe de las Minas', greeting:'Maldición... Los gólems de piedra han bloqueado el tercer túnel. ¿Puedes eliminarlos?', choices:['¿Cuántos hay?','De acuerdo','Demasiado riesgo'] },
    ],
    monsters:[
      { id:'golem',   servidor:'m_golem',  sprite:'🗿', name:'Gólem de Piedra',  level:8  },
      { id:'bat',     servidor:'m_bat',    sprite:'🦇', name:'Murciélago Oscuro',level:4  },
    ],
    exits:{ west:'pueblo', south:'ruinas' },
    structures:[
      {x:200,y:160,w:180,h:120,color:0x3A3020,label:'⛏️ Túnel 1'},
      {x:500,y:150,w:160,h:110,color:0x2A2218,label:'⛏️ Túnel 2'},
      {x:350,y:300,w:120,h:80, color:0x1A140C,label:'⛏️ Túnel 3 ⚠️'},
    ],
  },
  ruinas: {
    name:'Ruinas Antiguas', icon:'🏰',
    sub:'Zona peligrosa — Nv.15+',
    bgColor:   0x1A1018,
    gridColor: 0x10080E,
    decor: ['💀', '🕯️', '·', '🪦'],
    densidadDecor: 24,
    ambiente: { color: 0x2A0A2A, fuerza: 0.28 },
    music: 'epic',
    npcs:[
      { id:'draven', servidor:'npc_draven', x:400, y:180, sprite:'🗡️', name:'Capitán Draven', role:'Comandante de la Guardia', greeting:'¡Soldado! Las ruinas están infestadas. Necesito un agente para una misión de reconocimiento urgente.', choices:['Estoy listo','¿Qué riesgo?','Busca a otro'] },
    ],
    monsters:[
      { id:'demon',  servidor:'m_demon',  sprite:'👿', name:'Demonio Abismal',   level:20 },
      { id:'dragon', servidor:'m_dragon', sprite:'🐉', name:'Dragón Menor',      level:15 },
      { id:'liche',  servidor:'m_liche',  sprite:'🧛', name:'Liche Antiguo',     level:18 },
    ],
    exits:{ north:'minas', west:'bosque' },
    structures:[
      {x:220,y:130,w:200,h:150,color:0x2A1828,label:'🏰 Cripta'},
      {x:520,y:160,w:150,h:120,color:0x1A1020,label:'🗼 Torre'},
      {x:350,y:320,w:180,h:100,color:0x241822,label:'⛪ Santuario'},
    ],
  },
}


// ═══════════════════════════════════════════════════
// PLAYER STATE
// ═══════════════════════════════════════════════════
const PLAYER = {
  hp:850, maxHp:850, mp:400, maxMp:400,
  xp:3200, maxXp:5000, level:12,
  gold:1240, crypto:12, kills:0,
  atk:[85,120], def:42, int:68,
  zone:'pueblo',
}

let currentZone = 'pueblo'
let activeCombat = null
let combatBusy   = false
let dialogueOpen = false
let typingTimer  = null

// ═══════════════════════════════════════════════════
// PHASER GAME
// ═══════════════════════════════════════════════════

class WorldScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldScene' }) }

  create() {
    // El minimapa (que se dibuja fuera de Phaser) necesita leer la
    // posición y el tamaño del mundo.
    window.escenaMundo = this
    const W = this.scale.width
    const H = this.scale.height

    this.cameras.main.setBackgroundColor(0x05070A)

    // ── El mundo deja de ser "una pantalla" ────────────────────
    // Antes cada zona cabía justo en el viewport y el personaje
    // chocaba contra el borde de la ventana. Ahora cada zona es un
    // mapa de 1800×1200 y la cámara sigue al jugador: se explora de
    // verdad, y en un móvil ya no se ve el mapa entero de un vistazo.
    this.MW = 1800
    this.MH = 1200
    // Las posiciones de NPCs y estructuras están escritas para un
    // lienzo de 900×650; se reescalan al mundo grande en vez de
    // reescribirlas todas a mano.
    this.escalaX = this.MW / 900
    this.escalaY = this.MH / 650
    this.cameras.main.setBounds(0, 0, this.MW, this.MH)

    // Zone layers
    this.tileLayer   = this.add.graphics()
    this.structLayer = this.add.graphics()
    this.entityLayer = this.add.group()
    this.fxLayer     = this.add.graphics()
    this.uiLayer     = this.add.graphics()

    // Jugador: emoji por defecto, sustituido por la skin si la trae
    this.playerText = this.add.text(W/2, H/2, '🧙', {
      fontSize: '28px', resolution: 2,
    }).setOrigin(0.5).setDepth(10)

    // La skin nunca debe poder romper el juego. Si algo falla al
    // cargarla, se queda el emoji y se avisa por el registro; antes un
    // error aquí dejaba al personaje convertido en un cuadro o
    // congelaba el bucle de update().
    cargarSkinMapa().then(skin => {
      try {
        if (!skin) return
        if (skin.emoji) this.playerText.setText(skin.emoji)

        // Las ilustraciones con fondo opaco se verían como un
        // rectángulo sobre el mundo: para el mapa se usa el emoji.
        if (skin.usableEnMapa === false) return

        const walk = skin.sprites && skin.sprites.walk
        if (!walk || !walk.url || !walk.frames) return

        // Se comprueba que la imagen exista y mida lo declarado ANTES
        // de dársela a Phaser.
        const img = new Image()
        img.onerror = () => addLog('⚠️ No se pudo cargar la animación de tu aspecto; se usa el icono.', 'system')
        img.onload = () => {
          if (img.width !== walk.ancho * walk.frames || img.height !== walk.alto) {
            addLog('⚠️ La animación de tu aspecto no cuadra con lo declarado; se usa el icono.', 'system')
            return
          }
          try {
            this.load.spritesheet('skin_walk', walk.url, { frameWidth: walk.ancho, frameHeight: walk.alto })
            this.load.once('complete', () => {
              try {
                if (!this.textures.exists('skin_walk')) return
                if (!this.anims.exists('andar')) {
                  this.anims.create({
                    key: 'andar',
                    frames: this.anims.generateFrameNumbers('skin_walk', { start: 0, end: walk.frames - 1 }),
                    frameRate: 6, repeat: -1,
                  })
                }
                this.playerSprite = this.add.sprite(this.px, this.py, 'skin_walk')
                  .setOrigin(0.5).setDepth(10).setScale(0.62)
                this.playerText.setVisible(false)
              } catch (e) {
                this.playerSprite = null
                this.playerText.setVisible(true)
                addLog('⚠️ Tu aspecto animado falló; se usa el icono.', 'system')
              }
            })
            this.load.start()
          } catch (e) { /* se queda el emoji */ }
        }
        img.src = walk.url
      } catch (e) { /* se queda el emoji */ }
    })

    // Player shadow
    this.playerShadow = this.add.ellipse(W/2, H/2+16, 30, 10, 0x000000, 0.3).setDepth(9)

    // Posición en el mundo (no en la pantalla)
    this.px = this.MW / 2
    this.py = this.MH / 2
    this.playerText.setPosition(this.px, this.py)
    this.playerShadow.setPosition(this.px, this.py + 16)
    this.cameras.main.startFollow(this.playerText, true, 0.12, 0.12)

    // Halo del jugador: en las minas y las ruinas, con el ambiente
    // oscurecido, sirve además para ver por dónde se anda.
    const luz = (ZONES[currentZone] || {}).ambiente
    this.fxLayer.clear()
    if (luz && luz.fuerza >= 0.2) {
      for (let i = 5; i > 0; i--) {
        this.fxLayer.fillStyle(0xF0D070, 0.03)
        this.fxLayer.fillCircle(this.px, this.py, 30 + i * 16)
      }
    }

    // Direction indicator
    this.dirIndicator = this.add.triangle(0, 0, 0,-8, 6,4, -6,4, 0xC8A84B, 0.6).setDepth(11)

    // Cursors + WASD
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.keyE     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyQ     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
    this.keyR     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    this.keyM     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    this.keyI     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I)

    // Monster sprites (texts)
    this.monsterTexts  = []
    this.monsterData   = []
    this.npcTexts      = []
    this.npcData       = []
    this.particleFX    = []
    this.footstepTimer = 0
    this.monsterSpawnTimer = 0
    this.monsterWalkTimers = []
    this.lastDir = 'right'

    // Load zone
    this.loadZone('pueblo', false)

    // Step sounds via particle puffs
    this.puffPool = []

    // Boot message
    addLog('⚡ Mundo cargado. Muévete con WASD, las flechas o el mando táctil.', 'system')
    addLog('🏘️ Bienvenido al Pueblo Central — zona segura.', 'zone')
  }

  // ¿La posición cae dentro de algún edificio sólido?
  chocaCon(x, y) {
    const r = 12   // medio ancho del personaje
    for (const c of this.colisiones || []) {
      if (x + r > c.x && x - r < c.x + c.w && y + r > c.y && y - r < c.y + c.h) return true
    }
    return false
  }

  // Un sitio libre cerca de (x, y). Se busca en espiral hacia fuera y
  // se devuelve el primer punto que no pise un edificio.
  //
  // Existe porque al entrar a una zona se dejaba al jugador en el
  // centro exacto del mapa sin mirar qué había ahí. En las minas el
  // centro está ocupado por una estructura: aparecías DENTRO de una
  // pared y, como la colisión bloquea los dos ejes, no podías moverte
  // en ninguna dirección. La zona quedaba injugable.
  sitioLibre(x, y, W, H) {
    if (!this.chocaCon(x, y)) return { x, y }
    const borde = 40
    for (let radio = 24; radio <= 900; radio += 24) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        const nx = x + Math.cos(a) * radio
        const ny = y + Math.sin(a) * radio
        if (nx < borde || ny < borde || nx > W - borde || ny > H - borde) continue
        if (!this.chocaCon(nx, ny)) return { x: nx, y: ny }
      }
    }
    return { x, y }   // mapa imposible: mejor dentro que fuera del mundo
  }

  // Coordenadas de diseño (lienzo 900×650) → coordenadas del mundo
  aMundo(x, y) {
    return { x: x * this.escalaX, y: y * this.escalaY }
  }

  // Ruido determinista: misma zona, mismo dibujo siempre.
  ruido(semilla) {
    let s = semilla >>> 0
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  }

  pintarTerreno(zone, zoneKey, W, H) {
    const rnd = this.ruido([...zoneKey].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7))
    const base = zone.bgColor
    const claro = zone.tintaClara ?? this.aclarar(base, 0.14)
    const oscuro = zone.tintaOscura ?? this.aclarar(base, -0.14)

    this.tileLayer.fillStyle(base, 1)
    this.tileLayer.fillRect(0, 48, W, H - 48)

    // Manchas de terreno: rompen la uniformidad sin dibujar tiles
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W
      const y = 48 + rnd() * (H - 48)
      const r = 30 + rnd() * 90
      this.tileLayer.fillStyle(rnd() > 0.5 ? claro : oscuro, 0.35)
      this.tileLayer.fillCircle(x, y, r)
    }

    // Rejilla, ahora mucho más tenue: orienta sin dominar
    this.tileLayer.lineStyle(1, zone.gridColor, 0.16)
    const tile = 40
    for (let x = 0; x < W; x += tile) {
      this.tileLayer.beginPath(); this.tileLayer.moveTo(x, 48); this.tileLayer.lineTo(x, H); this.tileLayer.strokePath()
    }
    for (let y = 48; y < H; y += tile) {
      this.tileLayer.beginPath(); this.tileLayer.moveTo(0, y); this.tileLayer.lineTo(W, y); this.tileLayer.strokePath()
    }

    // Sendero entre las salidas: guía la vista hacia dónde se puede ir
    const salidas = zone.exits ?? {}
    this.tileLayer.lineStyle(22, claro, 0.18)
    if (salidas.north || salidas.south) {
      this.tileLayer.beginPath(); this.tileLayer.moveTo(W / 2, 60); this.tileLayer.lineTo(W / 2, H - 20); this.tileLayer.strokePath()
    }
    if (salidas.east || salidas.west) {
      this.tileLayer.beginPath(); this.tileLayer.moveTo(20, H / 2); this.tileLayer.lineTo(W - 20, H / 2); this.tileLayer.strokePath()
    }

    // Detalles sueltos del bioma
    if (this.decorados) this.decorados.forEach(d => d.destroy())
    this.decorados = []
    const motivos = zone.decor || ['·']
    const cuantos = zone.densidadDecor ?? 22
    for (let i = 0; i < cuantos; i++) {
      const x = 30 + rnd() * (W - 60)
      const y = 70 + rnd() * (H - 100)
      const t = this.add.text(x, y, motivos[Math.floor(rnd() * motivos.length)], {
        fontSize: (10 + Math.floor(rnd() * 10)) + 'px', resolution: 2,
      }).setOrigin(0.5).setDepth(1).setAlpha(0.28 + rnd() * 0.3)
      this.decorados.push(t)
    }

    // Viñeta: oscurece los bordes y centra la mirada en el personaje
    this.tileLayer.fillStyle(0x000000, 0.05)
    for (let i = 0; i < 6; i++) {
      this.tileLayer.fillRect(0, 48 + i * 3, W, 3)
      this.tileLayer.fillRect(0, H - 18 + i * 3, W, 3)
      this.tileLayer.fillRect(i * 3, 48, 3, H - 48)
      this.tileLayer.fillRect(W - 18 + i * 3, 48, 3, H - 48)
    }

    // Ambiente de la zona: las minas y las ruinas van más apagadas
    if (zone.ambiente) {
      this.tileLayer.fillStyle(zone.ambiente.color, zone.ambiente.fuerza)
      this.tileLayer.fillRect(0, 48, W, H - 48)
    }

    this.tileLayer.lineStyle(2, 0xC8A84B, 0.12)
    this.tileLayer.strokeRect(2, 50, W - 4, H - 52)
  }

  // Aclara (f > 0) u oscurece (f < 0) un color 0xRRGGBB
  aclarar(color, f) {
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff
    const m = c => Math.max(0, Math.min(255, Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f))))
    return (m(r) << 16) | (m(g) << 8) | m(b)
  }

  loadZone(zoneKey, transition = true) {
    const zone = ZONES[zoneKey]
    if (!zone) return
    currentZone = zoneKey
    PLAYER.zone = zoneKey
    document.getElementById('zone-name').textContent = \`\${zone.icon} \${zone.name}\`

    if (transition) this.doZoneTransition(zone)

    // Todo lo de la zona se coloca en coordenadas de MUNDO
    const W = this.MW
    const H = this.MH

    // Draw terrain
    this.tileLayer.clear()
    this.structLayer.clear()

    // ── Terreno ────────────────────────────────────────────
    // Antes: un color plano con una rejilla encima. Ahora el suelo se
    // pinta con manchas de dos tonos, salpicado de detalles, generado
    // con una semilla fija por zona: cambia entre zonas pero no
    // parpadea cada vez que entras.
    this.pintarTerreno(zone, zoneKey, W, H)

    // Structures
    // Estructuras con algo de volumen: sombra proyectada, banda de
    // techo más clara y borde. Siguen siendo rectángulos, pero dejan
    // de parecer recortes de papel.
    // Los edificios pasan a ser sólidos: se guardan sus rectángulos
    this.colisiones = []
    zone.structures.forEach(s0 => {
      const pos = this.aMundo(s0.x, s0.y)
      const s = { ...s0, x: pos.x, y: pos.y, w: s0.w * this.escalaX, h: s0.h * this.escalaY }
      this.colisiones.push({ x: s.x, y: s.y + 48, w: s.w, h: s.h })
      const y = s.y + 48
      this.structLayer.fillStyle(0x000000, 0.28)
      this.structLayer.fillRoundedRect(s.x + 5, y + 6, s.w, s.h, 8)
      this.structLayer.fillStyle(s.color, 1)
      this.structLayer.fillRoundedRect(s.x, y, s.w, s.h, 8)
      this.structLayer.fillStyle(this.aclarar(s.color, 0.22), 1)
      this.structLayer.fillRoundedRect(s.x, y, s.w, Math.max(10, s.h * 0.3), 8)
      this.structLayer.fillStyle(this.aclarar(s.color, -0.25), 0.5)
      this.structLayer.fillRect(s.x, y + s.h - 6, s.w, 6)
      this.structLayer.lineStyle(1, 0xC8A84B, 0.22)
      this.structLayer.strokeRoundedRect(s.x, y, s.w, s.h, 8)
    })

    // Exit arrows
    const exits = zone.exits ?? {}
    const exitPositions = {
      north: { x: W/2, y: 70,      label:'▲ ' + this.exitName(exits.north) },
      south: { x: W/2, y: H - 40,  label:'▼ ' + this.exitName(exits.south) },
      east:  { x: W - 90, y: H/2,  label:this.exitName(exits.east) + ' ▶' },
      west:  { x: 90,     y: H/2,  label:'◀ ' + this.exitName(exits.west) },
    }
    // Clean old exit labels
    if (this.exitLabels) this.exitLabels.forEach(l => l.destroy())
    this.exitLabels = []
    Object.entries(exits).forEach(([dir, dest]) => {
      if (!dest) return
      const pos = exitPositions[dir]
      const t = this.add.text(pos.x, pos.y, pos.label, {
        fontFamily: 'Cinzel',
        fontSize:   '11px',
        color:      '#C8A84B88',
        stroke:     '#05070A',
        strokeThickness: 3,
        resolution: 2,
      }).setOrigin(0.5).setDepth(5)
      this.exitLabels.push(t)

      // Zone name labels on edges
      const zoneDest = ZONES[dest]
      if (zoneDest) {
        const t2 = this.add.text(pos.x, pos.y + (dir === 'north' ? 14 : dir === 'south' ? -14 : 0), zoneDest.name, {
          fontFamily: 'Cinzel', fontSize: '9px', color: '#7A7060', resolution: 2,
        }).setOrigin(0.5).setDepth(5)
        this.exitLabels.push(t2)
      }
    })

    // Structure labels
    if (this.structLabels) this.structLabels.forEach(l => l.destroy())
    this.structLabels = []
    zone.structures.forEach(s => {
      const t = this.add.text(s.x + s.w/2, s.y + 48 + s.h/2, s.label, {
        fontFamily: 'Cinzel', fontSize: '12px', color: '#E8E0CC88',
        stroke: '#000', strokeThickness: 2, resolution: 2,
      }).setOrigin(0.5).setDepth(6)
      this.structLabels.push(t)
    })

    // Al entrar, al centro del mapa... si el centro está libre. Si hay
    // un edificio ahí (las minas), se busca el hueco más cercano.
    const sitio = this.sitioLibre(W / 2, H / 2, W, H)
    this.px = sitio.x
    this.py = sitio.y
    this.playerText.setPosition(this.px, this.py)
    this.playerShadow.setPosition(this.px, this.py + 16)

    // Spawn NPCs
    this.npcTexts.forEach(t => t.destroy())
    this.npcTexts = []
    this.npcData  = []
    if (this.npcLabels) this.npcLabels.forEach(l => l.destroy())
    this.npcLabels = [];
    (zone.npcs ?? []).forEach(npc => {
      const t = this.add.text(npc.x, npc.y + 48, npc.sprite, {
        fontSize: '24px', resolution: 2,
      }).setOrigin(0.5).setDepth(8)

      // Floating indicator
      const ind = this.add.text(npc.x, npc.y + 25, '!', {
        fontFamily: 'Cinzel', fontSize: '14px', fontStyle: 'bold',
        color: '#C8A84B', stroke: '#05070A', strokeThickness: 3, resolution: 2,
      }).setOrigin(0.5).setDepth(9)
      this.tweens.add({ targets: ind, y: npc.y + 20, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      const lbl = this.add.text(npc.x, npc.y + 44, npc.name, {
        fontFamily: 'Cinzel', fontSize: '9px', color: '#C8A84B88',
        stroke: '#05070A', strokeThickness: 2, resolution: 2,
      }).setOrigin(0.5).setDepth(8)

      // Sombra: sin ella los personajes parecen flotar sobre el suelo
      const sombraNpc = this.add.ellipse(npc.x, npc.y + 14, 26, 9, 0x000000, 0.3).setDepth(7)

      this.npcTexts.push(t)
      this.npcLabels.push(ind, lbl, sombraNpc)
      this.npcData.push({ ...npc, worldY: npc.y + 48 })
    })

    // Spawn monsters
    this.monsterTexts.forEach(t => t.destroy())
    ;(this.monsterData || []).forEach(m => m.sombra && m.sombra.destroy())
    this.monsterTexts      = []
    this.monsterData       = []
    this.monsterWalkTimers = [];
    (zone.monsters ?? []).forEach(mon => {
      const count = Phaser.Math.Between(2, 4)
      for (let i = 0; i < count; i++) {
        const mx = Phaser.Math.Between(80, W - 80)
        const my = Phaser.Math.Between(100, H - 80)
        const t  = this.add.text(mx, my, mon.sprite, {
          fontSize: '22px', resolution: 2,
        }).setOrigin(0.5).setDepth(7)

        const lbl = this.add.text(mx, my - 18, \`\${mon.name} Nv.\${mon.level}\`, {
          fontFamily: 'Cinzel', fontSize: '8px', color: '#F8717188',
          stroke: '#05070A', strokeThickness: 2, resolution: 2,
        }).setOrigin(0.5).setDepth(7)

        const sombraMon = this.add.ellipse(mx, my + 12, 22, 8, 0x000000, 0.3).setDepth(6)

        this.monsterTexts.push(t)
        this.monsterData.push({ ...mon, label: lbl, sombra: sombraMon })
        this.monsterWalkTimers.push(Phaser.Math.Between(0, 120))
      }
    })

    // Los recursos de la zona: árboles y vetas de verdad, con su vida y
    // su reloj. Los pide el servidor, que es quien sabe cuáles siguen
    // en pie para ESTE jugador.
    if (typeof cargarRecursos === 'function') cargarRecursos(this)
    // Los vecinos de la zona anterior no están aquí: se borran y el
    // siguiente pulso traerá los de esta.
    if (typeof mundoLimpiar === 'function') mundoLimpiar()

    // Ambient particles for zone
    if (zoneKey === 'ruinas') this.startAmbientParticles(0xA335EE)
    else if (zoneKey === 'bosque') this.startAmbientParticles(0x1A8B3A)
    else this.stopAmbientParticles()
  }

  exitName(key) {
    if (!key) return ''
    return ZONES[key]?.name ?? key
  }

  doZoneTransition(zone) {
    const el    = document.getElementById('zone-transition')
    const title = document.getElementById('zone-title-big')
    const sub   = document.getElementById('zone-sub-big')
    title.textContent = \`\${zone.icon} \${zone.name}\`
    sub.textContent   = zone.sub
    el.classList.add('active')
    setTimeout(() => el.classList.remove('active'), 1800)
    addLog(\`\${zone.icon} Entraste en \${zone.name}\`, 'zone')
  }

  startAmbientParticles(color) {
    this.ambientColor = color
  }
  stopAmbientParticles() {
    this.ambientColor = null
  }

  update(time, delta) {
    if (dialogueOpen || (activeCombat && document.getElementById('combat-popup').classList.contains('open'))) return

    const W = this.scale.width
    const H = this.scale.height
    const speed = 2.8
    let dx = 0, dy = 0

    // Mando táctil: se suma al teclado, no lo sustituye
    if (TACTIL.activo && (TACTIL.x || TACTIL.y)) {
      dx += TACTIL.x * speed
      dy += TACTIL.y * speed
      this.lastDir = Math.abs(TACTIL.x) > Math.abs(TACTIL.y)
        ? (TACTIL.x < 0 ? 'left' : 'right')
        : (TACTIL.y < 0 ? 'up' : 'down')
    }

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx -= speed; this.lastDir = 'left' }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx += speed; this.lastDir = 'right' }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy -= speed; this.lastDir = 'up' }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy += speed; this.lastDir = 'down' }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

    // Si el personaje se está moviendo. Lo necesita el mundo compartido
    // para decirles a los demás si andas o estás parado.
    this.andando = (dx !== 0 || dy !== 0)

    // Límites del mundo, no de la pantalla
    const margin = 24
    const nx = Phaser.Math.Clamp(this.px + dx, margin, this.MW - margin)
    const ny = Phaser.Math.Clamp(this.py + dy, margin, this.MH - margin)

    // Colisión con los edificios: se prueba cada eje por separado para
    // poder deslizarse a lo largo de una pared en vez de quedarse
    // clavado al tocarla en diagonal.
    if (!this.chocaCon(nx, this.py)) this.px = nx
    if (!this.chocaCon(this.px, ny)) this.py = ny

    this.playerText.setPosition(this.px, this.py)
    this.playerShadow.setPosition(this.px, this.py + 16)

    // Walking animation (flip)
    if (dx < 0) this.playerText.setScale(-1, 1)
    else if (dx > 0) this.playerText.setScale(1, 1)

    // Sprite animado de la skin, si la hay
    if (this.playerSprite) try {
      this.playerSprite.setPosition(this.px, this.py)
      const moviendo = dx !== 0 || dy !== 0
      if (moviendo && !this.playerSprite.anims.isPlaying) this.playerSprite.play('andar')
      if (!moviendo && this.playerSprite.anims.isPlaying) this.playerSprite.anims.stop()
      // La lámina mira a la derecha: se voltea al ir hacia la izquierda
      if (dx < 0) this.playerSprite.setScale(-0.62, 0.62)
      else if (dx > 0) this.playerSprite.setScale(0.62, 0.62)
    } catch (e) {
      // Si el sprite muere por lo que sea, se vuelve al emoji en vez
      // de lanzar una excepción en cada fotograma (que es lo que
      // dejaba el juego congelado).
      this.playerSprite = null
      this.playerText.setVisible(true)
    }

    // Footstep puffs
    if ((dx !== 0 || dy !== 0)) {
      this.footstepTimer += delta
      if (this.footstepTimer > 200) {
        this.footstepTimer = 0
        this.spawnPuff(this.px, this.py + 14)
      }
    }

    // Direction indicator
    const angle = { up: -90, down: 90, left: 180, right: 0 }[this.lastDir] ?? 0
    this.dirIndicator.setPosition(this.px, this.py)
    this.dirIndicator.setAngle(angle + 90)

    // Zone exit detection
    const zone = ZONES[currentZone]
    const exits = zone?.exits ?? {}
    if (this.py < 40             && exits.north) this.changeZone(exits.north)
    if (this.py > this.MH - 40   && exits.south) this.changeZone(exits.south)
    if (this.px > this.MW - 40   && exits.east)  this.changeZone(exits.east)
    if (this.px < 40             && exits.west)  this.changeZone(exits.west)

    // Monster proximity & combat trigger
    this.monsterTexts.forEach((mt, i) => {
      if (!mt.active) return
      const md = this.monsterData[i]
      if (!md) return

      // Monster wander
      this.monsterWalkTimers[i]--
      if (this.monsterWalkTimers[i] <= 0) {
        this.monsterWalkTimers[i] = Phaser.Math.Between(60, 180)
        const wdx = Phaser.Math.Between(-30, 30)
        const wdy = Phaser.Math.Between(-20, 20)
        this.tweens.add({
          targets: [mt, md.label],
          x: Phaser.Math.Clamp(mt.x + wdx, 60, W - 60),
          y: Phaser.Math.Clamp(mt.y + wdy, 80, H - 60),
          duration: 800, ease: 'Sine.easeInOut',
        })
      }

      const dist = Phaser.Math.Distance.Between(this.px, this.py, mt.x, mt.y)
      if (dist < 45 && !activeCombat) {
        this.triggerCombat(md, mt, i)
      }

      if (md.sombra) md.sombra.setPosition(mt.x, mt.y + 12)

      // Label follows sprite
      md.label.setPosition(mt.x, mt.y - 18)
    })

    // Recursos: qué árbol o veta tienes delante
    if (typeof actualizarRecursos === 'function') actualizarRecursos(this)

    // El mundo compartido: contar dónde estás y llevar a los demás
    // hacia donde el servidor dice que van.
    if (typeof mundoPulso === 'function') mundoPulso()
    if (typeof mundoInterpolar === 'function') mundoInterpolar(this)

    // NPC proximity
    this.npcData.forEach((npc, i) => {
      const dist = Phaser.Math.Distance.Between(this.px, this.py, npc.x, npc.worldY)
      if (dist < 55 && Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.openDialogue(npc)
      }
    })

    // Keyboard shortcuts
    // ESPACIO delante de un árbol o una veta es talar o picar; en
    // cualquier otro sitio sigue siendo atacar. Un hacha tiene que
    // sentirse como una herramienta, no como una espada más.
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      if (typeof hayNodoDelante === 'function' && hayNodoDelante()) golpearNodoCercano(this)
      else triggerAction('attack')
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyQ))     triggerAction('potion')
    if (Phaser.Input.Keyboard.JustDown(this.keyR))     triggerAction('magic')
    if (Phaser.Input.Keyboard.JustDown(this.keyM))     openModule('map')
    if (Phaser.Input.Keyboard.JustDown(this.keyI))     openModule('inventory')

    // Ambient particles
    if (this.ambientColor) {
      if (Math.random() < 0.03) {
        this.spawnAmbientParticle()
      }
    }

    // Clean puffs
    this.puffPool = this.puffPool.filter(p => {
      if (!p.active) return false
      p.alpha -= 0.04
      p.y -= 0.5
      p.scaleX *= 0.95
      p.scaleY *= 0.95
      if (p.alpha <= 0) { p.destroy(); return false }
      return true
    })

    // Update minimap
    this.updateMinimap()
  }

  spawnPuff(x, y) {
    const g = this.add.circle(x + Phaser.Math.Between(-4,4), y, 3, 0xffffff, 0.15).setDepth(3)
    this.puffPool.push(g)
  }

  spawnAmbientParticle() {
    const W = this.scale.width, H = this.scale.height
    const x = Phaser.Math.Between(0, W)
    const y = Phaser.Math.Between(68, H)
    const g = this.add.circle(x, y, Phaser.Math.Between(1,3), this.ambientColor, 0.3).setDepth(2)
    this.puffPool.push(g)
  }

  changeZone(zoneKey) {
    if (!ZONES[zoneKey]) return
    showToast(\`\${ZONES[zoneKey].icon} Entrando en \${ZONES[zoneKey].name}...\`)
    // Se entra por el lado opuesto al que se salió, no en el centro:
    // así el mundo se siente continuo al ir y volver.
    const entradas = {
      north: { x: this.px, y: this.MH - 80 },
      south: { x: this.px, y: 80 },
      east:  { x: 80, y: this.py },
      west:  { x: this.MW - 80, y: this.py },
    }
    const lado = this.py < 40 ? 'north' : this.py > this.MH - 40 ? 'south'
      : this.px > this.MW - 40 ? 'east' : this.px < 40 ? 'west' : null
    if (lado) { this.px = entradas[lado].x; this.py = entradas[lado].y }
    else { this.px = this.MW / 2; this.py = this.MH / 2 }
    this.playerText.setPosition(this.px, this.py)

    this.time.delayedCall(200, () => this.loadZone(zoneKey, true))
  }

  triggerCombat(monsterData, monsterText, index) {
    if (activeCombat) return
    activeCombat = { ...monsterData, spriteText: monsterText, index }

    document.getElementById('cp-sprite').textContent = monsterData.sprite
    document.getElementById('cp-name').textContent   = monsterData.name
    // La vida del enemigo se escala a quien lo pelea, así que la ficha
    // del mapa no sirve para enseñarla: hasta el primer turno no hay
    // número de verdad, y un número inventado es peor que una raya.
    pintarVidaEnemigo(null, null)
    document.getElementById('cp-log').innerHTML      = ''
    document.getElementById('cp-close').style.display= 'none'
    document.getElementById('combat-popup').classList.add('open')
    accionesHabilitadas(true)

    addLog(\`⚔️ Combate con \${monsterData.sprite} \${monsterData.name} (Nv.\${monsterData.level})!\`, 'combat')
    this.cameras.main.flash(200, 220, 38, 38, true)
  }

  openDialogue(npc) {
    dialogueOpen = true
    this.npcActual = npc
    document.getElementById('dlg-avatar').textContent = npc.sprite
    document.getElementById('dlg-name').textContent   = npc.name
    document.getElementById('dlg-role').textContent   = npc.role
    document.getElementById('dialogue-box').classList.add('open')
    typeText('dialogue-text', npc.greeting, () => {
      const choices = document.getElementById('dlg-choices')
      choices.innerHTML = npc.choices.map((c,i) =>
        \`<div class="dlg-choice" onclick="npcChoice('\${npc.id}',\${i})">\${c}</div>\`
      ).join('')
      // Las misiones se aceptan AQUÍ. Antes el NPC te las ofrecía pero
      // había que ir a la pantalla de misiones a aceptarlas, que es
      // como si el tendero te mandara a otra tienda a pagar.
      if (npc.servidor) mostrarMisionesDeNpc(npc)
    })
    addLog(\`💬 Hablas con \${npc.name}\`, 'npc')
  }

  updateMinimap() {
    const canvas = document.getElementById('minimap-canvas')
    const ctx    = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height - 0
    ctx.clearRect(0,0,W,H)

    // BG
    ctx.fillStyle = '#05070A'
    ctx.fillRect(0,0,W,H)

    // Zone nodes
    const nodes = { pueblo:{x:40,y:60}, bosque:{x:75,y:30}, minas:{x:110,y:60}, ruinas:{x:92,y:85} }
    const zoneColors = { pueblo:'#2D4A1E', bosque:'#1A3A14', minas:'#2A2218', ruinas:'#1A1018' }

    // Connections
    ctx.strokeStyle = '#2A2818'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([2,2])
    const edges = [['pueblo','bosque'],['pueblo','minas'],['bosque','ruinas'],['minas','ruinas']]
    edges.forEach(([a,b]) => {
      const na = nodes[a], nb = nodes[b]
      ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y); ctx.stroke()
    })
    ctx.setLineDash([])

    // Zone dots
    Object.entries(nodes).forEach(([key, pos]) => {
      const isCurrent = key === currentZone
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, isCurrent ? 9 : 7, 0, Math.PI*2)
      ctx.fillStyle   = isCurrent ? '#C8A84B' : (zoneColors[key] + 'cc')
      ctx.fill()
      ctx.strokeStyle = isCurrent ? '#F0D070' : '#C8A84B44'
      ctx.lineWidth   = isCurrent ? 1.5 : 1
      ctx.stroke()

      // Label
      ctx.fillStyle   = isCurrent ? '#C8A84B' : '#7A7060'
      ctx.font        = \`\${isCurrent ? 'bold ' : ''}8px Cinzel\`
      ctx.textAlign   = 'center'
      ctx.fillText(ZONES[key]?.name?.split(' ')[0] ?? key, pos.x, pos.y + 18)
    })

    // Player dot en el mapa de zonas
    const cur = nodes[currentZone]
    if (cur) {
      ctx.beginPath()
      ctx.arc(cur.x, cur.y, 3.5, 0, Math.PI*2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cur.x, cur.y, 6, 0, Math.PI*2)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // ── Recuadro de la zona actual ─────────────────────────────
    // Ahora que el mapa es más grande que la pantalla, hace falta ver
    // dónde estás DENTRO de la zona, no solo en cuál estás.
    const esc = window.escenaMundo
    if (esc && esc.MW) {
      const bw = 46, bh = 31, bx = W - bw - 6, by = H - bh - 6
      ctx.fillStyle = 'rgba(10,13,19,.75)'
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeStyle = '#C8A84B55'
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by, bw, bh)

      // Edificios de la zona, a escala
      ctx.fillStyle = 'rgba(200,168,75,.28)'
      for (const c of esc.colisiones || []) {
        ctx.fillRect(bx + (c.x / esc.MW) * bw, by + (c.y / esc.MH) * bh,
                     Math.max(1, (c.w / esc.MW) * bw), Math.max(1, (c.h / esc.MH) * bh))
      }

      // Tú
      ctx.beginPath()
      ctx.arc(bx + (esc.px / esc.MW) * bw, by + (esc.py / esc.MH) * bh, 2.2, 0, Math.PI*2)
      ctx.fillStyle = '#F0D070'
      ctx.fill()

      ctx.fillStyle = '#7A7060'
      ctx.font = '7px Cinzel'
      ctx.textAlign = 'left'
      ctx.fillText('ZONA', bx + 2, by - 3)
    }
  }
}

function closeCombat(force = false) {
  if (combatBusy && !force) return
  document.getElementById('combat-popup').classList.remove('open')
  activeCombat = null
  combatBusy   = false
}

function addCombatLog(msg, type='') {
  const log = document.getElementById('cp-log')
  const div = document.createElement('div')
  div.className = \`cp-log-entry \${type}\`
  div.textContent = msg
  log.appendChild(div)
  log.scrollTop = log.scrollHeight
}

// ═══════════════════════════════════════════════════
// NPC DIALOGUE
// ═══════════════════════════════════════════════════

const NPC_RESPONSES = [
  'Entiendo. Si cambias de opinión, aquí estaré con trabajo y buena paga.',
  'El pago será generoso para quien complete la tarea. Puedes confiar en mi palabra.',
  'Como quieras. Pero recuerda que las recompensas son buenas para los valientes.',
]

function npcChoice(npcId, choiceIdx) {
  const npc = ZONES[currentZone]?.npcs?.find(n => n.id === npcId)
  if (!npc) return
  const response = NPC_RESPONSES[choiceIdx] ?? NPC_RESPONSES[0]
  document.getElementById('dlg-choices').innerHTML = ''
  typeText('dialogue-text', response, () => {
    document.getElementById('dlg-choices').innerHTML =
      \`<div class="dlg-choice" onclick="closeDialogue()">↩ Hasta luego</div>
       <div class="dlg-choice" onclick="closeDialogue(); openModule('quests')">📜 Ver misiones</div>\`
  })
}

function closeDialogue() {
  document.getElementById('dialogue-box').classList.remove('open')
  dialogueOpen = false
}

function typeText(elId, text, onDone) {
  const el = document.getElementById(elId)
  el.innerHTML = ''
  const cursor = document.createElement('span')
  cursor.className = 'dlg-cursor'
  let i = 0
  clearTimeout(typingTimer)
  function type() {
    if (i < text.length) {
      el.textContent = text.slice(0, ++i)
      el.appendChild(cursor)
      typingTimer = setTimeout(type, 18)
    } else {
      cursor.remove()
      if (onDone) onDone()
    }
  }
  type()
}

// ═══════════════════════════════════════════════════
// HUD HELPERS
// ═══════════════════════════════════════════════════

function updateBars() {
  const hp = (PLAYER.hp / PLAYER.maxHp * 100).toFixed(1)
  const mp = (PLAYER.mp / PLAYER.maxMp * 100).toFixed(1)
  const xp = (PLAYER.xp / PLAYER.maxXp * 100).toFixed(1)
  document.getElementById('hp-fill').style.width = hp + '%'
  document.getElementById('mp-fill').style.width = mp + '%'
  document.getElementById('xp-fill').style.width = xp + '%'
  document.getElementById('hp-txt').textContent  = \`\${PLAYER.hp} / \${PLAYER.maxHp}\`
  document.getElementById('mp-txt').textContent  = \`\${PLAYER.mp} / \${PLAYER.maxMp}\`
  document.getElementById('xp-txt').textContent  = \`\${PLAYER.xp.toLocaleString()} / \${PLAYER.maxXp.toLocaleString()}\`
}

function addLog(msg, type='') {
  const container = document.getElementById('event-log-entries')
  const el = document.createElement('div')
  el.className = \`log-e \${type}\`
  el.textContent = msg
  container.insertBefore(el, container.firstChild)
  while (container.children.length > 12) container.removeChild(container.lastChild)
}

let toastTimeout
function showToast(msg) {
  const old = document.querySelector('.notif-toast')
  if (old) old.remove()
  const el = document.createElement('div')
  el.className = 'notif-toast'
  el.textContent = msg
  document.getElementById('hud').appendChild(el)
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => el?.remove(), 2800)
}

function triggerAction(type) {
  const actions = {
    attack: () => {
      if (activeCombat) combatAction('attack')
      else addLog('⚔️ Sin enemigo cercano.', 'system')
    },
    // Curaba entre 120 y 200 de vida sin gastar nada del inventario:
    // una poción infinita. El endpoint que sí descuenta el objeto ya
    // existía y lo usa la pantalla de combate.
    potion: async () => {
      const r = await apiPost('/api/player/use', { itemId: 'potion_hp' })
      if (!r.ok) {
        showToast('⚠️ ' + (r.data.error || 'No tienes pociones'))
        return
      }
      PLAYER.hp = r.data.hp; PLAYER.mp = r.data.mp
      updateBars()
      showToast('💚 Poción usada: +' + r.data.curado + ' HP')
      addLog('🧪 Usaste una Poción de Curación I (+' + r.data.curado + ' HP)', 'system')
    },
    magic: () => {
      if (activeCombat) combatAction('magic')
      else addLog('🔥 Sin objetivo para la magia.', 'system')
    },
    interact: () => {
      const npc = ZONES[currentZone]?.npcs?.[0]
      if (npc && gameScene) gameScene.openDialogue({ ...npc, worldY: npc.y + 48 })
      else addLog('💬 No hay NPC cerca. Acércate a uno.', 'system')
    },
  }
  actions[type]?.()
}

function openModule(name) {
  const urls = {
    combat:    'criptomundo-combat.html',
    market:    'criptomundo-mercado.html',
    quests:    'criptomundo-misiones.html',
    dungeon:   'criptomundo-mazmorras-pvp.html',
    crafting:  'criptomundo-crafting.html',
    hub:       'criptomundo-hub.html',
    inventory: null,
    map:       null,
  }
  if (urls[name]) {
    window.open(urls[name], '_blank')
  } else if (name === 'inventory') {
    showToast('🎒 Inventario — próximamente integrado')
  } else if (name === 'map') {
    showToast('🗺️ Navega con WASD, flechas o el mando táctil')
  }
}


// ═══════════════════════════════════════════════════
// PHASER CONFIG
// ═══════════════════════════════════════════════════

let gameScene

const config = {
  // AUTO, no WEBGL.
  //
  // Estaba forzado a WEBGL, que quiere decir "WebGL o nada". En un
  // aparato sin GPU aprovechable —un movil modesto, un navegador con la
  // tarjeta en lista negra, una maquina virtual— el navegador no se
  // niega: lo emula por software. Y eso, medido en Chromium sin GPU:
  //
  //     WEBGL forzado ....  6,8 cuadros/s   (147 ms por cuadro)
  //     CANVAS ..........  60,0 cuadros/s   ( 16,7 ms por cuadro)
  //
  // Casi nueve veces mas lento por no dejarle elegir. AUTO usa WebGL
  // cuando hay GPU de verdad —que ahi si es mas rapido— y se pasa a
  // Canvas cuando no la hay, en vez de arrastrarse.
  type:   Phaser.AUTO,
  width:  window.innerWidth,
  height: window.innerHeight,
  canvas: document.getElementById('phaser-canvas'),
  backgroundColor: '#05070A',
  scene:  [WorldScene],
  audio:  { noAudio: true },
  scale: {
    mode:        Phaser.Scale.RESIZE,
    autoCenter:  Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)

game.events.on('ready', () => {
  gameScene = game.scene.getScene('WorldScene')
})

// Resize, con freno.
//
// Redimensionar reconstruye la superficie de dibujo, que es de las
// cosas mas caras que se le pueden pedir. Sin freno se llamaba una vez
// por cada evento, y en un movil el evento de redimensionado se
// dispara en rafagas cada vez que el navegador esconde o ensena su
// barra de direcciones: justo al empezar a andar, que es cuando peor sienta.
//
// Se espera a que pare de moverse y entonces se redimensiona una vez.
let temporizadorTamano = null
window.addEventListener('resize', () => {
  if (temporizadorTamano) clearTimeout(temporizadorTamano)
  temporizadorTamano = setTimeout(() => {
    temporizadorTamano = null
    game.scale.resize(window.innerWidth, window.innerHeight)
  }, 120)
})

// Key listener for Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDialogue()
    closeCombat(true)
  }
})

// ── TECLAS REENVIADAS DESDE EL LAUNCHER ──
// El mundo vive en un iframe. Si el foco se queda en la ventana de
// fuera, Phaser no recibe nada y el personaje no anda. Phaser escucha
// eventos reales sobre window, así que el mensaje se convierte de
// vuelta en un KeyboardEvent en lugar de tocar variables por dentro.
const CODIGOS_TECLA = {
  w: 87, a: 65, s: 83, d: 68, q: 81, e: 69, r: 82, ' ': 32, shift: 16,
  arrowup: 38, arrowleft: 37, arrowdown: 40, arrowright: 39,
}
let ultimaTecla = {}
window.addEventListener('message', ev => {
  if (ev.origin !== location.origin && ev.origin !== 'null') return
  const d = ev.data
  if (!d || d.type !== 'TECLA') return
  const k = String(d.key).toLowerCase()
  const code = CODIGOS_TECLA[k]
  if (!code) return
  // Sin esto, mantener una tecla pulsada dispararía un keydown cada
  // pocos milisegundos y Phaser trataría cada uno como pulsación nueva.
  if (ultimaTecla[k] === d.abajo) return
  ultimaTecla[k] = d.abajo
  const nombre = d.abajo ? 'keydown' : 'keyup'
  window.dispatchEvent(new KeyboardEvent(nombre, {
    key: d.key, keyCode: code, which: code, bubbles: true, cancelable: true,
  }))
})
// Igual que en la arena: pedir el foco solo cuando el mundo va dentro
// del iframe del launcher.
const vaEmpotrado = (() => { try { return window.parent && window.parent !== window } catch (e) { return true } })()
const tomarFoco = () => { if (vaEmpotrado) { try { window.focus() } catch (e) {} } }
tomarFoco()
document.addEventListener('pointerdown', tomarFoco)

// ── POSTMESSAGE BRIDGE ──
function sendToParent(type, payload) {
  window.parent.postMessage({ type, payload }, '*')
}


// ─── MANDO TÁCTIL ─────────────────────────────────
// Devuelve un vector normalizado (-1..1) que el bucle del juego suma
// al movimiento. Se activa con el primer toque y se suelta al levantar
// el dedo; si el navegador pierde el evento, el vector vuelve a cero.
var TACTIL = { activo: false, x: 0, y: 0, id: null }

function iniciarMandoTactil() {
  const base = document.getElementById('joystick')
  const punto = document.getElementById('joystick-punto')
  const accion = document.getElementById('btn-accion')
  if (!base || !punto) return

  const RADIO = 42
  let centro = { x: 0, y: 0 }

  function empezar(ev) {
    const t = ev.changedTouches ? ev.changedTouches[0] : ev
    const r = base.getBoundingClientRect()
    centro = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    TACTIL.activo = true
    TACTIL.id = t.identifier
    mover(ev)
    ev.preventDefault()
  }

  function mover(ev) {
    if (!TACTIL.activo) return
    const t = ev.changedTouches
      ? [...ev.changedTouches].find(x => x.identifier === TACTIL.id) || ev.changedTouches[0]
      : ev
    let dx = t.clientX - centro.x
    let dy = t.clientY - centro.y
    const dist = Math.hypot(dx, dy) || 1
    const limitada = Math.min(dist, RADIO)
    const nx = (dx / dist) * limitada
    const ny = (dy / dist) * limitada
    punto.style.transform = \`translate(\${nx}px, \${ny}px)\`
    // Zona muerta: evita que el personaje tiemble con el dedo quieto
    TACTIL.x = Math.abs(nx) < 6 ? 0 : nx / RADIO
    TACTIL.y = Math.abs(ny) < 6 ? 0 : ny / RADIO
    ev.preventDefault()
  }

  function soltar() {
    TACTIL.activo = false
    TACTIL.x = 0
    TACTIL.y = 0
    TACTIL.id = null
    punto.style.transform = 'translate(0,0)'
  }

  base.addEventListener('touchstart', empezar, { passive: false })
  base.addEventListener('touchmove', mover, { passive: false })
  base.addEventListener('touchend', soltar)
  base.addEventListener('touchcancel', soltar)
  // Con ratón también, para poder probarlo en el escritorio
  base.addEventListener('mousedown', empezar)
  window.addEventListener('mousemove', e => { if (TACTIL.activo && !e.touches) mover(e) })
  window.addEventListener('mouseup', soltar)
  window.addEventListener('blur', soltar)

  if (accion) {
    // El botón de acción hace lo mismo que la tecla de interactuar:
    // cerrar un diálogo abierto o hablar con lo que se tenga delante.
    accion.addEventListener('click', ev => {
      ev.preventDefault()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
  }
}

iniciarMandoTactil()


// ─── SKIN DEL JUGADOR EN EL MAPA ──────────────────
// El personaje del mapa era un emoji fijo. Ahora usa el aspecto
// elegido: si la skin trae tira de caminar, se anima al moverse;
// si no, se usa su emoji. Ninguna skin antigua se rompe.
var SKIN_MAPA = null

async function cargarSkinMapa() {
  try {
    const [me, cat] = await Promise.all([
      fetch('/api/player', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/skins', { credentials: 'include' }).then(r => r.json()),
    ])
    const id = me.character && me.character.appearance && me.character.appearance.skinId
    SKIN_MAPA = (cat.skins || []).find(s => s.id === id) || null
  } catch {}
  return SKIN_MAPA
}


// ─── MISIONES DESDE EL NPC ────────────────────────
// Pregunta al servidor qué misiones ofrece este NPC y añade un botón
// real de aceptar por cada una. Lo que se acepta queda registrado en
// el mismo sitio que la pantalla de misiones: no hay dos listas.
async function mostrarMisionesDeNpc(npc) {
  try {
    const [dispRes, actRes] = await Promise.all([
      fetch('/api/quests?status=available', { credentials: 'include' }),
      fetch('/api/quests?status=active', { credentials: 'include' }),
    ])
    if (!dispRes.ok) return
    const disponibles = (await dispRes.json()).quests || []
    const activas = actRes.ok ? ((await actRes.json()).quests || []) : []
    const choices = document.getElementById('dlg-choices')
    if (!choices) return

    const suyas = disponibles.filter(q => q.npcId === npc.servidor)
    const suyasActivas = activas.filter(a => (a.quest || {}).npcId === npc.servidor)

    let html = ''
    for (const q of suyas) {
      const r = (q.rewards || [])[0] || {}
      html += '<div class="dlg-mision">' +
        '<div class="dm-cabecera">' + (q.icon || '📜') + ' <b>' + q.name + '</b> · Nv.' + q.levelReq + '</div>' +
        '<div class="dm-desc">' + q.description + '</div>' +
        '<div class="dm-obj">' + (q.objectives || []).map(o => '· ' + o.text + ' (0/' + o.required + ')').join('<br>') + '</div>' +
        '<div class="dm-rec">Recompensa: 🪙' + r.gold + ' · ✨' + r.xp + (r.cgrid ? ' · 💎' + r.cgrid : '') + '</div>' +
        '<button class="dm-aceptar" onclick="aceptarMisionNpc(\\'' + q.id + '\\')">📜 ACEPTAR MISIÓN</button>' +
        '</div>'
    }
    for (const a of suyasActivas) {
      const hechos = (a.objectiveProgress || []).filter(p => {
        const obj = (a.quest.objectives || []).find(o => o.id === p.objectiveId)
        return obj && p.current >= obj.required
      }).length
      html += '<div class="dlg-mision en-curso">✅ <b>' + a.quest.name + '</b> — en curso (' +
        hechos + '/' + (a.quest.objectives || []).length + ' objetivos)</div>'
    }
    if (html) choices.innerHTML = html + choices.innerHTML
  } catch {}
}

async function aceptarMisionNpc(questId) {
  try {
    const r = await fetch('/api/quests', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId, action: 'accept' }),
    })
    const d = await r.json()
    if (!r.ok) {
      // El servidor ya impide aceptar dos veces o sin nivel
      showToast('⚠️ ' + (d.error || 'No se pudo aceptar'))
      return
    }
    showToast('📜 Misión aceptada')
    addLog('📜 Misión aceptada. Consúltala en Misiones.', 'loot')
    const npc = (window.escenaMundo && window.escenaMundo.npcActual) || null
    if (npc) mostrarMisionesDeNpc(npc)
    try { window.parent.postMessage({ type: 'REFRESH_CHARACTER' }, '*') } catch {}
  } catch { showToast('⚠️ Sin conexión con el servidor') }
}

// ═══ PUENTE CON EL SERVIDOR (v3.1) ═══════════════
// El mundo ya no simula combate: cambia de zona contra el servidor
// (lo que hace avanzar los objetivos de exploración) y delega el
// combate real al módulo de combate.

async function apiGet(path) {
  const res = await fetch(path, { credentials: 'include' })
  let data = {}
  try { data = await res.json() } catch (e) {}
  return { ok: res.ok, data }
}
async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = {}
  try { data = await res.json() } catch (e) {}
  return { ok: res.ok, data }
}

async function syncCharacter() {
  const me = await apiGet('/api/player')
  if (!me.ok) return
  const c = me.data.character
  PLAYER.hp = c.hp; PLAYER.maxHp = c.maxHp
  PLAYER.mp = c.mp; PLAYER.maxMp = c.maxMp
  PLAYER.gold = c.gold; PLAYER.name = c.name
  PLAYER.level = c.level
  // Las bajas vienen del servidor, que es quien las cuenta al matar.
  // Antes el HUD mostraba una variable del navegador que ya nadie
  // tocaba, así que el contador se quedaba clavado en 0 para siempre.
  PLAYER.kills = c.monstersKilled || 0
  PLAYER.cgrid = c.cgrid || 0
  updateBars()
  const g = document.getElementById('hud-gold')
  if (g) g.textContent = PLAYER.gold.toLocaleString()
  const k = document.getElementById('hud-kills')
  if (k) k.textContent = PLAYER.kills.toLocaleString()
  const cr = document.getElementById('hud-crypto')
  if (cr) cr.textContent = PLAYER.cgrid.toLocaleString()
  const nombre = document.querySelector('#hud-nombre')
  if (nombre) nombre.textContent = c.name
}

// El mapa vuelve a preguntar al servidor cada pocos segundos y cuando
// se vuelve a la pestaña: así el contador refleja lo que pasó en la
// pantalla de combate sin recargar nada.
setInterval(() => { if (!document.hidden) syncCharacter() }, 8000)
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncCharacter() })

// Explorar una zona: el servidor valida el nivel y registra la visita
async function exploreZone(zoneKey) {
  const r = await apiPost('/api/world/explore', { zoneId: zoneKey })
  if (r.ok && r.data.aviso) addLog('\u26a0\ufe0f ' + r.data.aviso, 'system')
  if (!r.ok) {
    showToast('\u26a0\ufe0f ' + (r.data.error || 'No puedes viajar a esa zona todav\u00eda'))
    return false
  }
  if (r.data.first) {
    addLog('\ud83d\uddfa\ufe0f Descubres una zona nueva: ' + (r.data.zone.name || zoneKey), 'loot')
    ;(r.data.questUpdates || []).forEach(q => addLog('\ud83d\udcdc Misi\u00f3n: objetivo ' + q.current + '/' + q.required, 'loot'))
  }
  return true
}

// Cambio de zona validado por el servidor
const _WorldScene_loadZone = WorldScene.prototype.loadZone
WorldScene.prototype.loadZone = async function(zoneKey, transition = true) {
  const ok = await exploreZone(zoneKey)
  if (!ok) return
  _WorldScene_loadZone.call(this, zoneKey, transition)
  currentZone = zoneKey
}


window.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  if (type === 'CHARACTER_DATA' && data && data.character) {
    const c = data.character
    PLAYER.hp = c.hp; PLAYER.maxHp = c.maxHp
    PLAYER.mp = c.mp; PLAYER.maxMp = c.maxMp
    PLAYER.gold = c.gold; PLAYER.name = c.name
    PLAYER.kills = c.monstersKilled || 0
    updateBars()
    const k = document.getElementById('hud-kills')
    if (k) k.textContent = PLAYER.kills.toLocaleString()
    const g = document.getElementById('hud-gold')
    if (g) g.textContent = PLAYER.gold.toLocaleString()
  }
})

window.addEventListener('load', async () => {
  syncCharacter()
  // Se vuelve a donde estabas, no al pueblo. El servidor recuerda la
  // zona porque esta pantalla no puede: se recarga entera cada vez que
  // el launcher cambia de módulo.
  let vuelta = 'pueblo'
  try {
    const r = await fetch('/api/player', { credentials: 'include' })
    const d = await r.json()
    if (d && d.zonaActual && ZONES[d.zonaActual]) vuelta = d.zonaActual
  } catch (e) {}
  if (vuelta !== currentZone) {
    const esc = window.game && window.game.scene && window.game.scene.getScene('WorldScene')
    if (esc && esc.loadZone) { esc.loadZone(vuelta, false); return }
  }
  exploreZone(currentZone)
})
</script>

<!-- ===== AVISOS:INICIO (generado por aplicar-avisos.js) ===== -->
<style>
  #btn-aviso {
    position: fixed; right: 12px; top: 12px; z-index: 500;
    background: rgba(10,13,19,.72); border: 1px solid rgba(200,168,75,.4);
    color: #C8A84B; border-radius: 20px; padding: 6px 12px; font-size: 12px;
    cursor: pointer; font-family: system-ui, sans-serif; opacity: .55;
    transition: opacity .15s ease;
  }
  #btn-aviso:hover { opacity: 1; }
  #caja-aviso {
    position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 9998;
    display: none; align-items: center; justify-content: center; padding: 18px;
  }
  #caja-aviso.abierta { display: flex; }
  #caja-aviso .cuadro {
    background: #12151D; border: 1px solid #2A2418; border-radius: 12px;
    padding: 18px; width: 100%; max-width: 460px;
    font-family: system-ui, sans-serif; color: #E8E0CC;
  }
  #caja-aviso h3 { margin: 0 0 4px; font-size: 16px; color: #F0D070; }
  #caja-aviso .ayuda { font-size: 12px; color: #7A7060; margin-bottom: 12px; line-height: 1.5; }
  #caja-aviso .tipos { display: flex; gap: 6px; margin-bottom: 10px; }
  #caja-aviso .tipos button {
    flex: 1; background: rgba(20,24,34,.8); border: 1px solid #2A2418; color: #E8E0CC;
    border-radius: 7px; padding: 8px; font-size: 12px; cursor: pointer; min-height: 40px;
  }
  #caja-aviso .tipos button.sel { border-color: #F0D070; color: #F0D070; }
  #caja-aviso textarea {
    width: 100%; min-height: 110px; background: #0A0D13; border: 1px solid #2A2418;
    border-radius: 7px; color: #E8E0CC; padding: 9px; font-family: inherit; font-size: 13px;
    resize: vertical; box-sizing: border-box;
  }
  #caja-aviso .pie { display: flex; gap: 8px; margin-top: 12px; }
  #caja-aviso .pie button { flex: 1; border-radius: 7px; padding: 10px; font-size: 13px; cursor: pointer; min-height: 42px; }
  #caja-aviso .enviar { background: #C8A84B; border: 0; color: #0A0D13; font-weight: 700; }
  #caja-aviso .cerrar { background: none; border: 1px solid #2A2418; color: #7A7060; }
  #caja-aviso .contexto { font-size: 11px; color: #5A5449; margin-top: 10px; line-height: 1.5; }






.dlg-mision { background:rgba(200,168,75,.07); border:1px solid #3A3020; border-radius:8px; padding:10px; margin-bottom:8px; }
.dlg-mision.en-curso { background:rgba(48,192,96,.07); border-color:#1E5A32; font-size:12px; color:#9A9080; }
.dm-cabecera { font-family:'Cinzel',serif; font-size:13px; color:#F0D070; margin-bottom:4px; }
.dm-desc { font-size:12px; color:#9A9080; line-height:1.5; margin-bottom:6px; }
.dm-obj { font-size:11px; color:#7A7060; line-height:1.6; margin-bottom:6px; }
.dm-rec { font-size:11px; color:#C8A84B; margin-bottom:8px; }
.dm-aceptar { width:100%; background:rgba(200,168,75,.18); border:1px solid #C8A84B; color:#F0D070;
  border-radius:7px; padding:9px; font-size:12px; cursor:pointer; font-family:'Cinzel',serif; letter-spacing:1px; min-height:40px; }
.dm-aceptar:hover { background:rgba(200,168,75,.3); }
</style>
<button id="btn-aviso" onclick="abrirAviso()" title="Contar un fallo o una idea">💬 Aviso</button>
<div id="caja-aviso" role="dialog" aria-modal="true" aria-label="Enviar un aviso">
  <div class="cuadro">
    <h3>¿Qué ha pasado?</h3>
    <div class="ayuda">Cuéntalo con tus palabras. Si es un fallo, di qué estabas haciendo justo antes: eso es lo que más ayuda.</div>
    <div class="tipos">
      <button data-tipo="fallo" class="sel" onclick="tipoAviso('fallo', this)">🐛 Un fallo</button>
      <button data-tipo="idea" onclick="tipoAviso('idea', this)">💡 Una idea</button>
      <button data-tipo="otro" onclick="tipoAviso('otro', this)">💭 Otra cosa</button>
    </div>
    <textarea id="texto-aviso" placeholder="Ejemplo: al comprar en el mercado se quedó cargando y perdí el oro"></textarea>
    <div class="pie">
      <button class="cerrar" onclick="cerrarAviso()">Cancelar</button>
      <button class="enviar" id="enviar-aviso" onclick="enviarAviso()">Enviar</button>
    </div>
    <div class="contexto" id="contexto-aviso"></div>
  </div>
</div>
<script>
(function () {
  if (window.__avisos) return
  window.__avisos = true
  var tipo = 'fallo'

  window.tipoAviso = function (t, btn) {
    tipo = t
    var b = document.querySelectorAll('#caja-aviso .tipos button')
    for (var i = 0; i < b.length; i++) b[i].className = ''
    btn.className = 'sel'
  }

  window.abrirAviso = function () {
    document.getElementById('caja-aviso').classList.add('abierta')
    document.getElementById('contexto-aviso').textContent =
      'Se enviará también: página ' + (location.pathname || '/') +
      ' · pantalla ' + window.innerWidth + '×' + window.innerHeight + ' · tu navegador.'
    document.getElementById('texto-aviso').focus()
  }
  window.cerrarAviso = function () {
    document.getElementById('caja-aviso').classList.remove('abierta')
  }

  window.enviarAviso = async function () {
    var area = document.getElementById('texto-aviso')
    var boton = document.getElementById('enviar-aviso')
    var texto = (area.value || '').trim()
    if (texto.length < 3) { area.focus(); return }
    boton.disabled = true
    boton.textContent = 'Enviando...'
    try {
      var res = await fetch('/api/feedback', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipo, texto: texto,
          pagina: location.pathname,
          pantalla: window.innerWidth + 'x' + window.innerHeight,
        }),
      })
      if (res.ok) {
        area.value = ''
        boton.textContent = '¡Gracias!'
        setTimeout(function () { window.cerrarAviso(); boton.textContent = 'Enviar'; boton.disabled = false }, 900)
      } else {
        var d = await res.json()
        boton.textContent = (d && d.error) || 'No se pudo enviar'
        setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
      }
    } catch (e) {
      boton.textContent = 'Sin conexión'
      setTimeout(function () { boton.textContent = 'Enviar'; boton.disabled = false }, 1800)
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.cerrarAviso()
  })
})()
</script>
<div id="caja-aviso" role="dialog" aria-modal="true" aria-label="Enviar un aviso">
  <div class="cuadro">
    <h3>¿Qué ha pasado?</h3>
    <div class="ayuda">Cuéntalo con tus palabras. Si es un fallo, di qué estabas haciendo justo antes: eso es lo que más ayuda.</div>
    <div class="tipos">
      <button data-tipo="fallo" class="sel" onclick="tipoAviso('fallo', this)">🐛 Un fallo</button>
      <button data-tipo="idea" onclick="tipoAviso('idea', this)">💡 Una idea</button>
      <button data-tipo="otro" onclick="tipoAviso('otro', this)">💭 Otra cosa</button>
    </div>
    <textarea id="texto-aviso" placeholder="Ejemplo: al comprar en el mercado se quedó cargando y perdí el oro"></textarea>
    <div class="pie">
      <button class="cerrar" onclick="cerrarAviso()">Cancelar</button>
      <button class="enviar" id="enviar-aviso" onclick="enviarAviso()">Enviar</button>
    </div>
    <div class="contexto" id="contexto-aviso"></div>
  </div>
</div>
`