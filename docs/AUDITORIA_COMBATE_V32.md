# CriptoMundo v32 — Auditoría del combate (FASE A)

**No se ha modificado ni una línea de gameplay.** Este documento es el
resultado de la FASE A y existe para que la FASE B se decida sobre lo que
hay, no sobre lo que uno se imagina que hay.

Donde hay una cifra, hay una medición o un archivo y una línea detrás. Lo
que no he medido lo digo.

La última sección, **«Decisiones de este encargo que hay que cambiar»**, es
la que pide el punto 9 de la FASE A. Sin ella no se pasa a la FASE B.

---

## Resumen en cinco líneas

1. **Casi todo el motor de la FASE C ya existe**, pero vive dentro de la
   arena (`58-arena.js`): ventanas de golpe, sector de alcance y arco, «un
   golpe toca una vez», retroceso, invulnerabilidad, proyectiles con
   colisión por segmento, IA con aviso de golpe y paso fijo de 100 ms.
2. **Los monstruos del mapa no existen en el servidor.** Los inventa el
   navegador, en posiciones al azar, uno por jugador. Eso es lo más grande
   que hay que construir.
3. **El catálogo de armas ya tiene alcance, arco, cadencia y empuje**, y
   están medidos y cuadrados contra el precio. Los valores por defecto que
   propone la sección B.2 del encargo **cambiarían el equilibrio de las 14
   armas**, lo que choca con la regla R2.
4. **`/api/combat/action` lo usan 21 archivos de prueba y 3 pantallas.**
   Apagarlo en el mundo no es un cambio local.
5. **La latencia medida no es un problema de red: es el paso de 100 ms.**
   De pulsar a ver el gesto pasan **98 ms de media** y no empeora con
   cuatro jugadores. Eso justifica la predicción visual de la FASE E.3.

---

## 1. Combate por turnos del mundo

**Endpoint** · `src/server/60-http.js:397`. Límite: 120 acciones/min por
personaje (`rateLimit('cmb:'+char.id, 120, 60_000)`, línea 398).

**Qué hace**, en orden:

| Paso | Dónde |
|---|---|
| Valida `monsterId` contra `MONSTERS` | `60-http.js:400` |
| Rechaza si `char.hp <= 0` | `60-http.js:401` |
| Marca `first_combat` en el embudo | `60-http.js:403` |
| Busca o crea la batalla | `findBattle` `30-…:667` · `startBattle` `30-…:637` |
| Resuelve el turno | `combatAction` `30-…:672` |
| Marca `first_block` / `first_potion` | `60-http.js:409-410` |

**Estado guardado** · `store.battles[id]`, creado en `30-…:637`. Campos
relevantes: `owner`, `state` (`'ACTIVE'`), `enemyHp`, `enemyMaxHp`,
`phase`, `combo`, `telegraph`, `enemyTurn`, `blocking` (`30-…:653`).
Persiste en el volcado y sobrevive a un reinicio (STEP 7).

**Qué dispara al terminar** · XP y subida de nivel (`checkLevelUp`,
`30-…:424`), botín (`rollLoot`, `30-…:501`), oro, progreso de misión
(`emitProgress`, `30-…:511`, clave `kill_<monstruo>`), telemetría de
objetos (`trackItems`, desde `addItem` en `30-…:460`) y los tres pasos del
embudo de arriba.

**Bloqueo y golpe anunciado** · un ataque pesado se anuncia cada 3 turnos
(2 en fase de jefe) con multiplicador 2,6 (3,2 si es jefe) —
`30-…:892-896`. Si llega con `battle.blocking`, el daño se multiplica por
**0,3** (`30-…:863`), o sea **70 % de reducción**, y solo contra el golpe
anunciado. Comerse el anunciado sin bloquear cuesta además el combo y el
20 % del maná (`30-…:878-880`).

---

## 2. Combate de la arena — qué es genérico y qué es de la arena

### Genérico (candidato a `57-golpe.js`, FASE C.1)

| Función | Línea | Qué hace |
|---|---|---|
| `ventanasDe(arma)` | `58-arena.js:653` | anticipación / activo / recuperación. **Suman exactamente la cadencia**, así que el daño por segundo no se mueve |
| `golpear(p, ahora)` | `:662` | abre el gesto. No hace daño |
| `resolverGolpe(p, ahora)` | `:689` | sector `alcance + golpeableEn(en)` y `arco`; lista `g.tocados` = un golpe, un impacto |
| `dañarEnemigo` / `dañarJugador` | `:737` / `:752` | daño, retroceso, invulnerabilidad |
| `impulsar(c, ang, fuerza)` | `:83` | retroceso como impulso, no como teletransporte |
| `separar(a,b,…)` | `:92` | invariante de cuerpos, con reparto por peso y cesión contra la pared |
| `moverCuerpo` / `apartar` / `decaimiento` | `:60` / `:73` / `:57` | física, con roce por segundo y no por paso |
| `golpeableDe` / `golpeableEn` | `:397` / `:400` | **la zona golpeable no es el cuerpo** (STEP 8) |
| `pasoIA(p, en, ahora, dt)` | `:767` | máquina de estados con aviso de golpe |
| `crearProyectil` y colisión por segmento | `57-proyectiles.js` | ya resuelto el problema del salto |
| Emisores de peligro | `58-salas.js:crearPeligro`, `pasoPeligros` | |

### De la arena (no se extrae)

`ARENAS` y sus oleadas (`:419`), `lanzarOleada` (`:580`), `iniciarArena`
(`:502`), `terminar`/`resumen` (`:1280`/`:1371`), el ring de 900×600
(`:122`), `ESCALA_ARENA` (`:155`), el jefe de `58-salas.js`.

### Cómo recibe hoy las intenciones

Dos caminos, el mismo destino:

- **HTTP** · `POST /api/arena/sync` → `sincronizarArena` (`60-http.js:572`,
  `58-arena.js:596`). Hay un carril rápido para este pulso en
  `60-http.js:35`.
- **Socket** · `arena_entrada` → `entradaArena` (`55-tiempo-real.js:150`,
  `58-arena.js:610`).

**Los dos solo depositan intención.** La simulación corre en un
`setInterval` único para todas las partidas (`58-arena.js:1467`) con
`ARENA_TICK_MS = 100` (`:47`). La respuesta del pulso lleva lo que dejó el
**último** paso: `tick()` empieza vaciando `p.sucesos`.

**Frecuencia del cliente** · la pantalla de la arena sondea cada 40 ms; el
mundo compartido cada 100 ms (`MUNDO_PULSO_MS`, `criptomundo-mundo2d-5.js`).

---

## 3. Monstruos del mapa — hoy no existen en el servidor

**Este es el hallazgo grande.** Están declarados **en la página**, en
`ZONES[…].monsters` de `src/pages/criptomundo-mundo2d-2.js` (líneas 23, 48,
73, 96), y el navegador los coloca en posiciones al azar al cargar la zona:

```
const mx = Phaser.Math.Between(80, W - 80)
const my = Phaser.Math.Between(100, H - 80)
```
(`criptomundo-mundo2d-2.js:545-546`)

De ahí salen consecuencias que hay que asumir antes de la FASE C:

- **Uno por jugador.** Dos personas en el mismo bosque ven arañas
  distintas, en sitios distintos. El STEP 6 comparte posición y aspecto de
  **jugadores** y nada más.
- **No tienen vida en el servidor.** La vida vive en la batalla por turnos
  que se abre al tocarlos (`triggerCombat`, `:830`).
- **Aparecen y desaparecen en el navegador.** `monsterSpawnTimer` (`:269`),
  y al morir se borran de `monsterData`/`monsterTexts`
  (`criptomundo-mundo2d-3.js:165-169`).
- El servidor **sí** valida `monsterId` contra su catálogo, así que no se
  puede pelear con un bicho inventado: lo que no existe es su posición.

**Catálogo** · `MONSTERS`, `30-personajes-combate.js:163`. **9 monstruos**.

**Conductas en tiempo real** · `CONDUCTAS`, `58-arena.js:409`. **6 de los
9**. Traen `vel`, `radio`, `alcance`, `cadenciaMs` y, los embestidores,
`avisoMs`. **Faltan `m_troll_boss`, `m_bat` y `m_liche`.**

**Carácter de la IA** · `56-ia-enemigos.js:106-115`: `vista` (radio de
aggro), `avisoAtaque`, `retirada`, `trabaMs`, `aguante`.

---

## 4. Arma equipada

- **Dónde** · `char.equipment.weapon`, que guarda el **uid** de un objeto
  del inventario (no el `itemId`).
- **Quién la cambia** · `POST /api/player/equip` con `{ uid }`.
- **Quién la lee para pelear** · `armaDe(char)`, `58-arena.js:241`. Si el
  `itemId` equipado no está en `ARMAS`, **devuelve `puños`**.
- **Campos de cada arma** · `ARMAS`, `58-arena.js:217`. 14 entradas:

| Campo | Unidad real | Rango en el catálogo |
|---|---|---|
| `alcance` | px desde el centro del jugador | 46–96 cuerpo a cuerpo · 320–420 a distancia |
| `arco` | **radianes, SEMI-apertura** (`dif > arma.arco`, `:719`) | 0,2–1,7 |
| `cadenciaMs` | ms entre golpes | 300–620 |
| `dmg` | multiplicador del poder del jugador | 0,8–2,5 |
| `empuje` | **impulso**, no píxeles (entra en `impulsar`, se apaga con `ROCE_IMPULSO = 6 /s`) | 50–205 |
| `gesto` | `pinchazo` · `tajo_alto` · `estocada` · ausente = barrido | — |
| `proyectil` | `{ vel, radio, vidaMs, element }` | 4 armas |

**Cómo se ve** · `ITEM_TEMPLATES` (`30-…:32-36`): `imagen`, `icon`,
`rarity`. `empunadura` y `spriteAngulo` se leen del mismo sitio
(`58-arena.js:353,357`) pero **ninguna arma los declara** (STEP 23): las
tres caen al valor por defecto, `{x:0.79, y:0.79}` y `-2.356 rad`.

**Reparto por tipo, con el catálogo de hoy:**

| Tipo del encargo | Armas | Cuáles |
|---|---|---|
| espada | **9** | puños, dagger, sword_alba, espada_piedra, espada_hierro, espada_diamante, wood_club, iron_axe, frost_blade |
| lanza | **1** | iron_spear |
| arco | **2** | short_bow, elven_bow |
| magia | **2** | crystal_wand, thunder_staff |

> **Corregido en la FASE B.** En la primera versión repartí el hacha, el
> garrote y la daga en «lanza» porque tienen gesto propio. Es al revés: el
> `gesto` dice cómo se DIBUJA el golpe y el `tipoUso` dice qué FORMA tiene
> el impacto. Los tres pegan en sector, igual que una espada; la única que
> cambia de forma es la estocada. Nueve, una, dos y dos.

**Los cuatro tipos se pueden usar hoy.** Lo único que no existe es el
**gasto de maná**: ninguna arma tiene `costeMp` y las dos «mágicas» cuestan
0. Las habilidades sí gastan maná; las armas no.

---

## 5. Bloqueo y pociones

**Bloqueo** · solo existe en el combate por turnos. No es una postura con
ventana temporal: es una acción de turno que pone `battle.blocking` y se
resuelve contra el golpe anunciado del enemigo. Reducción **×0,3**
(`30-…:863`). Fuera del golpe anunciado, bloquear no reduce nada.

**Pociones** · `30-…:770-800`. Vale **cualquier** objeto que cure, dé maná
o deje un efecto. Si no se dice cuál, elige la curación más floja que
llegue a tapar el hueco. Valida el inventario en el servidor y consume con
`removeItem(char, usar, 1, 'consumo')`.

**No hay enfriamiento en milisegundos.** El coste es el turno: beber es tu
acción. Esto importa para C.6: en tiempo real no hay turnos, así que
**hace falta un enfriamiento que hoy no existe** y que habrá que elegir y
medir.

---

## 6. Descanso (STEP 18) — condición exacta de hoy

`60-http.js:217-220`:

```
const enTurnos = Object.values(store.battles).some(b => b.owner === char.id && b.state === 'ACTIVE')
regenerarFuera(char, enTurnos || partidas.has(p.username) || runs.has(p.username))
```

O sea: **ocupado = batalla por turnos activa, O partida de arena, O
mazmorra**. No hay ninguna noción de «he recibido daño hace poco».

Ritmo · `regenerarFuera`, `30-…:619`: **1 % del máximo cada 1.500 ms**
(`REGEN_FRACCION`, `REGEN_CADA_MS`), y se ancla al coste de una pelea.
Se llama en el único punto autenticado del servidor, así que solo avanza
cuando el jugador hace alguna petición.

---

## 7. Arte de armas — la convención que ya existe

**Carpetas que lee el juego** (servidas desde `60-http.js:47`):

- `assets/items/<id>.png` — el dibujo del arma. **32×32** en las tres que
  hay.
- `assets/items/anim/<id>.png` — tira de golpe. **Cuadros cuadrados en
  fila: el ancho tiene que ser múltiplo exacto del alto** (`tiraDe`,
  `58-arena.js:304`, rechaza `w % h !== 0`).
- `assets/skins/…` — aspectos.

**No existe una carpeta `public/`.**

**Cómo se dibuja** (`criptomundo-arena.js:757-780`): el arma se coloca por
su **empuñadura**, no por su centro, y se gira con `-spriteAngulo`. Los
dos valores se leen del catálogo con respaldo: `{x:0.79, y:0.79}` y
`-2.356 rad` (−135°).

**Qué avisa `revisar-arte.js` hoy** (tras el STEP 23): declarado y no
existe · medida distinta de la declarada · tira cuyo ancho no es múltiplo
del alto · **PNG sin canal alfa** · y la lista de armas que no declaran su
empuñadura. No comprueba píxeles semitransparentes ni si la empuñadura cae
sobre un píxel transparente.

**Qué pasa si falta el PNG** · nada se rompe: se dibuja el emoji girado
como si fuera la hoja (`criptomundo-arena.js:795-799`), y a mano desnuda
dos nudillos dibujados.

---

## 8. Latencia medida

Medida en local, contra el servidor de verdad, sondeando cada 40 ms como
hace la pantalla de la arena. «Ver» = el dato está en el cliente; pintarlo
son 16 ms más como mucho, un cuadro a 60/s.

### El viaje HTTP es despreciable

| | media | p95 | peor |
|---|---|---|---|
| arena · `/api/arena/sync` | 1,9 ms | 4 | 4 |
| mundo hoy · `/api/combat/action` | 2,6 ms | 4 | 4 |
| mundo · pulso de posición | 1,6 ms | 2 | 3 |
| arena · 4 jugadores a la vez | **1,2 ms** | 2 | 2 |
| pulso · 4 jugadores a la vez | 1,4 ms | 2 | 3 |

### Lo que se nota es el paso de 100 ms

| | media | p95 | peor |
|---|---|---|---|
| 1 jugador · pulsar → ver el **gesto** | **98 ms** | 212 | 213 |
| 1 jugador · pulsar → ver el **daño** | **255 ms** | 422 | 423 |
| 4 jugadores · pulsar → ver el gesto | 85–108 ms | ~210 | 251 |
| 4 jugadores · pulsar → ver el daño | 225–250 ms | ~380–416 | 421 |

**Cómo se descompone** · hasta 100 ms esperando al paso del servidor, más
hasta 40 ms esperando al siguiente sondeo, más la **anticipación del arma**
(126 ms con los puños), que es a propósito y es lo que da la ventana para
apartarse (STEP 3).

**Dos conclusiones para el diseño:**

1. **No hay que optimizar la red.** Con cuatro jugadores no empeora nada:
   1,2 ms de media, mejor que con uno. El cuello no está ahí.
2. **La predicción visual de la FASE E.3 no es un adorno, es obligatoria.**
   Sin ella el jugador pulsa y no pasa nada durante ~100 ms, y eso se
   siente como un botón roto. Con ella, el gesto arranca en el cuadro
   siguiente y los 98 ms se los come la animación.

---

## 9. Configuración de Phaser

`criptomundo-mundo2d-2.js:1133-1146`:

| Ajuste | Estado |
|---|---|
| `type` | `Phaser.AUTO` — **con motivo medido**: forzar WEBGL en Chromium sin GPU da 6,8 cuadros/s frente a 60,0 con Canvas |
| `pixelArt` | **NO está puesto** |
| `roundPixels` | **NO está puesto** |
| filtro de texturas | no se toca: el de por defecto (lineal) |
| `scale.mode` | `RESIZE`, `autoCenter: CENTER_BOTH` |
| `audio` | `{ noAudio: true }` — **no hay sistema de audio** |

**Mundo** · 1.800 × 1.200 px (`MW`/`MH`, `:149-150`). **No hay casillas**:
el suelo se pinta con manchas y una rejilla decorativa de **40 px**
(`:347`). Las posiciones de NPC y edificios están escritas para un lienzo
de 900×650 y se reescalan (`escalaX`/`escalaY`, `:153-154`).

Consecuencias: `pixelArt: true` y `roundPixels: true` **se pueden poner y
son compatibles con `Phaser.AUTO`**; la FASE E.5 es un hueco real. Y como
no hay casillas, **los píxeles de la sección B.2 son píxeles y ya está**:
no hay conversión que escribir.

`audio: { noAudio: true }` cierra el punto de la FASE E.3: **no hay sistema
de sonido**, así que el sonido de golpe va a la lista final y no a esta
entrega.

---

## Decisiones de este encargo que hay que cambiar

Esto es lo que pide el punto 9 de la FASE A. Cada una dice qué propone el
encargo, qué hay, y qué propongo.

### D1 · Los valores por defecto de B.2 romperían la regla R2

**El encargo dice** · espada 56 px de alcance, 120° de arco, 24 px de
retroceso.
**Lo que hay** · las espadas van de 70 a 84 px y la lanza a 96, con arcos
de 0,5 a 1,7 rad. Esos números no son de nadie: salen de la curva
`rendimiento = 2,15 + 0,06 × √precio` y de medir `alcance ÷ cadencia`
(`58-arena.js:167-216`), y corrigieron ocho armas que estaban mal.
**Propongo** · **el catálogo existente manda.** Los valores de B.2 se usan
**solo** para un arma que no tenga entrada en `ARMAS`. Si se quiere mover
el equilibrio, es otro encargo con su medición.

### D2 · `arco` está en radianes y es SEMI-apertura, no grados totales

> **Corregido en la FASE B.** En la primera versión de esta sección escribí
> que aplicar los 120° del encargo recortaría el barrido «a menos de un
> tercio». Hice mal la conversión. El recorte real es al **65 %**. Lo demás
> de este punto se mantiene, y sigue chocando con R2.

`resolverGolpe` compara `dif > arma.arco` con `dif` en radianes
(`58-arena.js:719`), así que `arco` es la **semi-apertura**:

| | rad (semi) | grados totales |
|---|---|---|
| espada de hoy (`arco: 1.6`) | 1,600 | **183,3°** |
| lo que pide el encargo | 1,047 | 120° |
| lanza de hoy (`arco: 0.5`) | 0,500 | **57,3°** |
| lo que pide el encargo | 0,262 | 30° |

O sea: las espadas barrerían el **65 %** de lo que barren hoy y la lanza el
**52 %**. Es menos brutal de lo que escribí, pero sigue siendo un cambio de
equilibrio, y R2 dice que ahí me pare.

Y el peligro de verdad no es la magnitud: es que `arco: 120` leído tal cual
son **120 radianes**, o sea que el arma acierta en cualquier dirección,
incluso a la espalda. Un solo despiste con las unidades y el juego deja de
tener frente.

**Propongo** · mantener radianes y semi-apertura dentro. Si se expone un
campo en grados, que se llame `arcoGrados` y se convierta en un solo sitio.

### D3 · `retroceso` no se mide en píxeles

`empuje` entra en `impulsar()` (`:83`) como velocidad añadida, y se apaga
con `ROCE_IMPULSO = 6 /s`. `empuje: 130` no son 130 px.
**Propongo** · seguir con `empuje`, y que los «24 px» del encargo se
escriban como un resultado a medir, no como el valor del campo.

### D4 · La invulnerabilidad ya existe y vale 450 ms, no 500

`58-arena.js:759`: `j.invulnHasta = ahora + 450`.
**Propongo** · **450 ms en los dos sitios.** Dos números distintos para lo
mismo es cómo empiezan las diferencias entre arena y mundo.

### D5 · El radio de aggro de C.3 es cuatro veces menor que el que hay

**El encargo dice** · 160 px.
**Lo que hay** · `vista` de 560 a 780 px (`56-ia-enemigos.js:106-115`).
**Propongo** · usar `vista`. Con 160 px un bicho te ve cuando ya lo tienes
encima, y además el mundo mide 1.800×1.200: nadie se encontraría nada.
La **correa de 320 px sí es nueva** (la arena es un ring cerrado y no la
necesita) y hay que medirla.

### D6 · `tipoUso` ya existe, repartido en dos campos

`gesto` (`pinchazo`/`tajo_alto`/`estocada`/ausente) y `proyectil`.
**Propongo** · **derivar** `tipoUso` de lo que ya hay en vez de añadir un
campo paralelo que se puede desincronizar. Un tercer catálogo es
exactamente lo que el comentario de `58-arena.js:239` dice que no se haga.

### D7 · La carpeta de arte de la FASE G choca con la que existe

**El encargo dice** · `public/sprites/armas/<id>/`.
**Lo que hay** · `assets/items/<id>.png` y `assets/items/anim/<id>.png`,
que usan el servidor (`60-http.js:47`), `ITEM_TEMPLATES.imagen`,
`revisar-arte.js` y el dibujante de la arena. **No existe `public/`.**
**Por la línea 59-61 del propio encargo, gana la existente.** Lo que sí
merece la pena de la FASE G y se puede hacer sin mover nada: el
`ficha.json` por arma, los avisos nuevos de `revisar-arte.js` y
`npm run arte:ver`.

### D8 · El ángulo por defecto del sprite no es 45°

**El encargo dice** · todas las armas dibujadas a 45°, `spriteAngulo = 45`.
**Lo que hay** · `-2.356 rad` = **−135°** (`58-arena.js:353`), y las tres
espadas que hay están dibujadas para ese valor.
**Propongo** · mirar los tres PNG y escribir la convención que ya cumplen,
en vez de rotar el arte existente. Si se cambia, se cambian los tres
dibujos a la vez y se dice.

### D9 · Apagar el combate por turnos en el mundo toca 21 archivos de prueba

`/api/combat/action` lo usan **21 archivos de prueba** y **3 pantallas**
(`criptomundo-combat.js`, `criptomundo-mundo2d-3.js`, `index-2.js`). Entre
las pruebas están `test-primera-mision`, `test-ensenar-combate`,
`test-muerte-progreso`, `test-partida-completa` y `test-descanso`, que
comprueban misiones, tutorial, muerte y descanso **a través de él**.
**Propongo** · la FASE C **no toca** `/api/combat/action`. El mundo en
tiempo real se añade al lado y, cuando esté en verde, se cambia quién
abre qué en un paso propio, con las pruebas re-apuntadas de una en una. Si
no, la red de seguridad se cae justo cuando más falta hace.

### D10 · Tres monstruos no tienen conducta en tiempo real

`m_troll_boss`, `m_bat` y `m_liche` están en `MONSTERS` pero no en
`CONDUCTAS`. Hoy no importa porque solo se pelean por turnos.
**Propongo** · derivarlas de su nivel y su sitio en la tabla, escribir de
dónde sale cada número, y medir. Mientras no las tengan, esos tres no
aparecen en el mundo en tiempo real.

### D11 · Las pociones no tienen enfriamiento

Hoy el coste de beber es **el turno**. En tiempo real no hay turnos, así
que C.6 necesita un enfriamiento que **no existe** y que el encargo no
fija. Sin él, se bebe a 15 pulsaciones por segundo.
**Propongo** · anclarlo a lo que ya está medido: el robot de
`banco-balance` gana el 100 % bebiendo por debajo de un tercio de vida.
Elegir el enfriamiento midiendo contra ese robot, y escribir el antes y el
después.

### D12 · `test-proyectiles.js` ya existe

El encargo lo lista como nuevo. Existe, y `57-proyectiles.js` ya resuelve
el problema del salto con colisión por segmento. **Se amplía, no se
escribe.** Lo mismo con el módulo: no hay que crear el sistema, hay que
darle un dueño en el mundo.

### D13 · No hay sistema de audio

`audio: { noAudio: true }`. El sonido de golpe de la FASE E.3 va a la lista
final, como el propio encargo permite.

---

## Lo que NO he medido, y por qué

- **Latencia con red de verdad.** Todo esto es local. Un jugador a 60 ms de
  ping suma 120 ms de ida y vuelta a los 98 medidos. No tengo forma de
  medirlo aquí y no me lo invento.
- **Cuadros por segundo del mapa con 20 monstruos en tiempo real.** No
  existe todavía eso que medir.
- **Si los tres PNG de espada cumplen los −135°.** Hay que mirarlos; es
  una revisión visual, no una medición.

---

## Entrega de la FASE A

**ARCHIVOS TOCADOS** · `docs/AUDITORIA_COMBATE_V32.md` (nuevo). Ni una
línea de gameplay.
**QUÉ SE ARREGLÓ** · nada, a propósito.
**QUÉ SE AÑADIÓ** · este documento y dos guiones de medición de latencia.
**PRUEBAS AÑADIDAS** · ninguna.
**PRUEBAS QUE PASAN** · las 53 de siempre, sin tocar.
**MEDICIÓN** · la sección 8.
**SE SABE Y NO SE ARREGLA AQUÍ** · las 13 decisiones de arriba, y los tres
huecos de medición.
**SIGUIENTE** · FASE B, una vez decidas sobre D1, D2, D5, D7, D9 y D11, que
son las que cambian lo que hay que construir.
