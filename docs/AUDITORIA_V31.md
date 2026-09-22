# CriptoMundo v31 — Auditoría completa (FASE 0)

Fecha: 2026-09-21 · Base auditada: commit de importación del zip `criptomundo-v31`.

> **Estado.** Este documento describe el proyecto TAL Y COMO SE AUDITÓ. No se
> reescribe a medida que se arregla: es la foto de partida, y sirve para
> comprobar contra qué se compara cada paso. Lo ya resuelto se marca al
> principio de su apartado, con el paso que lo arregló.
>
> Resuelto hasta ahora:
> - §2.1 combate simulado en el cliente del mundo 2D — **STEP 1**
> - §0 `test-misiones-mundo.js` intermitente — **STEP 1**
> - §5.6 cada prueba dejaba su servidor vivo — **STEP 1**
> - §5.8 pruebas intermitentes (`test-misiones-mundo`, `test-turnos`,
>   `test-contenido`) — **STEP 1 y STEP 2**
> - §3.1 la recolección física no tenía cliente — **STEP 2**
> - §5.2 el golpe de la arena no tenía ventanas — **STEP 3** (a medias)
> - §2.2 el +HP del equipo no contaba en los turnos — **STEP 4**
> - §2.3 la pestaña de PvP era una pantalla en blanco — **STEP 5**
> - §3.2 el mundo no tenía multijugador — **STEP 6** (con límite dicho)
> - §3.3 el PvP del servidor no tenía cliente — **STEP 5**
> - §5.1 sesiones, batallas y chat se perdían al reiniciar — **STEP 7**
> - §5.2 cuerpo y hurtbox compartían radio — **STEP 8** (ya completo)
> - §0 `build.js --check` no comprobaba que el archivo parseara — **STEP 8**
> - §3.4 cofre, trampa y santuario eran tiradas de dados — **STEP 9**

Este documento es el resultado de la FASE 0. **No se ha modificado ni una
línea de gameplay.** Todo lo que sigue está comprobado contra el código o
medido ejecutando el juego; donde hay una cifra, hay una medición detrás.

---

## 0. Estado de partida: build y pruebas

```
node build.js          ✅ 39 módulos · 25.735 líneas · 1101 KB
node build.js --check  ✅ criptomundo.js está al día
```

El archivo generado coincide exactamente con `src/`. La compilación es
reproducible y `criptomundo.js` no tiene ediciones a mano.

`npm test` **falla**, y falla de una manera que engaña. Los 32 archivos de
prueba van encadenados con `&&`, así que el primero que falla se lleva por
delante a todos los que venían detrás:

| | |
|---|---|
| Archivos de prueba que ejecuta `npm test` antes de abortar | 5 de 32 |
| Archivos que nunca llegan a ejecutarse | 26 |

Ejecutados uno a uno, el estado real de la suite es este:

| Resultado | Archivos |
|---|---|
| Pasan | 32 de 32 |
| Intermitente (flaky) | 1 (`test-misiones-mundo.js`), ~30% de fallo |
| Fallan siempre | 0 |

En total **790 comprobaciones**, todas en verde en una pasada limpia. La
base es sana: lo que hay escrito está probado.

### El único fallo: `test-misiones-mundo.js` es intermitente

> ✅ **Resuelto en el STEP 1.** El presupuesto sube de 150 a 450 ataques.

No está roto: está mal dimensionado. La prueba mata arañas hasta reunir 10
hierbas, con un presupuesto de 150 ataques. Medido contra el servidor real,
a nivel 1:

| Medida | Valor |
|---|---|
| Ataques por araña muerta | 7,6 |
| Muertes del jugador mientras tanto | 13 |
| Ataques necesarios para llegar a 10 hierbas | ~168 |
| Presupuesto de la prueba | 150 |

Se queda corta por un 12%, justo en el filo. De 7 ejecuciones, falló 2 y
pasó 5: una tasa de fallo de ~30%. O sea que **una de cada tres veces que
alguien ejecuta `npm test`, 26 archivos de prueba no se ejecutan**, y el
motivo no tiene nada que ver con lo que se estuviera tocando.

La causa raíz no es la prueba, es que el rebalanceo de la v31
(`ESCALA_TURNOS = { vida: 1.6, daño: 1.4 }`) alargó los combates y nadie
reajustó el presupuesto. El mecanismo de progreso de misión en sí funciona
correctamente: el contador sube con el botín real.

De paso, esas 13 muertes para completar la primera misión de recolección
son un dato de balance por derecho propio, no solo un problema de la
prueba. Midiendo después el camino a nivel 3, salió lo mismo y peor:

```
 47 ataques ·  6 arañas ·  6 muertes
 77 ataques ·  6 arañas · 13 muertes
110 ataques ·  6 arañas · 21 muertes
```

Un jugador de nivel 1 muere entre una y tres veces y media POR CADA
araña que mata. Las seis arañas son siempre las mismas porque la
experiencia no varía; lo que varía —muchísimo— es cuántas veces te matan
mientras tanto. Eso no es dificultad, es ruido: el resultado de la misma
acción cambia por un factor de tres según la suerte. Es el hallazgo de
balance más claro de toda la auditoría y va al paso de progresión y
economía.

---

## 1. Mapa de dependencias real

```
WORLD (criptomundo-mundo2d.html)
 ├── movement ......... cliente, Phaser, sin servidor
 ├── resources ........ ❌ el cliente NO existe (ver §3.1)
 ├── enemies .......... ❌ simulados en el navegador (ver §2.1)
 ├── NPC .............. misiones sí, contra /api/quests
 ├── farming .......... pantalla aparte (criptomundo-huerto.html)
 └── multiplayer ...... ❌ no existe (ver §3.2)

CHARACTER
 ├── inventory ........ servidor ✅  /api/inventory
 ├── equipment ........ servidor ✅  /api/player/equip  (bug de +hp, §2.2)
 ├── stats ............ servidor ✅  effectiveStats()
 ├── skills ........... servidor ✅  las 3 por clase, seleccionables ✅
 └── progression ...... servidor ✅  xpForLevel / checkLevelUp

COMBAT
 ├── turn based ....... ✅ completo, con guion de eventos
 ├── real time arena .. ✅ completo, 10 pasos/s, autoritativo
 ├── dungeon .......... ✅ combate real; salas no-combate son dados (§3.4)
 └── multiplayer/PvP .. ❌ servidor sí, cliente NO (§3.3)

ECONOMY
 ├── gold ............. ✅ fuentes y sumideros medidos
 ├── crafting ......... ✅ RECIPES validadas en servidor
 ├── resources ........ ✅ servidor completo / ❌ sin cliente
 ├── marketplace ...... ✅ escrow, atómico, comisión
 └── CGRID ............ ✅ off-chain con tope diario, como debe estar
```

---

## 2. Lo que está ROTO

### 2.1 El mundo 2D simula el combate en el navegador — CRÍTICO

> ✅ **Resuelto en el STEP 1.** El combate del mapa pasa por
> `/api/combat/action`. El código vive ahora en
> `src/pages/criptomundo-mundo2d-3.js` y lo cubre `test-mundo-combate.js`,
> que además EJECUTA el módulo de la página contra el servidor.

`src/pages/criptomundo-mundo2d-2.js`, líneas 929-1010.

La pantalla del mundo —la principal, la que enlaza el launcher— resuelve el
combate entera en el cliente:

```js
const fled = Math.random() < 0.45          // huida
const crit = Math.random() < 0.18          // crítico
const miss = Math.random() < 0.06          // fallo
playerDmg = roll(...PLAYER.atk) - ...      // daño
const goldGain = roll(...activeCombat.gold)// oro
const dropped  = Math.random() < 0.65      // botín
```

El oro, la experiencia y el objeto se suman a un objeto `PLAYER` del
navegador y **nunca se envían al servidor**. Esto viola la regla de la
FASE 1 en todos sus puntos a la vez: daño, HP, XP, loot, oro, resultado de
combate y huida los decide el cliente.

Consecuencias comprobadas:

- Cualquiera con la consola abierta se pone el oro que quiera.
- El progreso del mundo 2D **se pierde al recargar**: no está persistido.
- Los mismos monstruos dan recompensas distintas según por dónde los
  pelees (mundo 2D vs `/api/combat/action`).

Lo peor es que existe la alternativa correcta y está probada:
`/api/combat/action` con 31 comprobaciones en verde. El mundo 2D
sencillamente no la usa.

**La prueba que debería haberlo cazado no lo caza.** `test-misiones-mundo.js`
comprueba `!/sendToParent\('COMBAT_ACTION'/`, o sea que no se envíe por
`postMessage`. El combate falso de ahora no usa `postMessage`: calcula en
local. La prueba pasa y el agujero sigue abierto.

### 2.2 El equipo que da +HP no cuenta en el combate por turnos

> ✅ **Resuelto en el STEP 4.** El tope se pregunta con el equipo puesto
> en el guion, al curarse, al recibir daño, al subir de nivel y al
> resucitar, y al quitarse una pieza la vida sobrante se recorta. Lo
> cubre `test-equipo-vida.js`, que sin el arreglo falla seis veces.

`effectiveStats()` suma correctamente `stats.hp` del equipo. Pero todo el
camino del combate por turnos usa `char.maxHp` (la base, sin equipo) en vez
de `effectiveStats(char).maxHp`:

| Archivo | Línea | Uso |
|---|---|---|
| `src/server/30-personajes-combate.js` | 719 | tope al curar y al recibir daño |
| `src/server/30-personajes-combate.js` | 515, 714, 728 | `hpJugadorMax` del guion |
| `src/server/30-personajes-combate.js` | 778 | vida tras morir |
| `src/server/60-http.js` | 272 | `/api/player/respawn` |

La arena (`58-arena.js`) y `/api/player/use` sí usan `st.maxHp`. O sea que
el mismo personaje tiene dos vidas máximas distintas según dónde pelee.

Objetos afectados: `leather_chest` (+40), `iron_chest` (+90),
`iron_boots` (+40), `crystal_chest` (+140), `luck_charm` (+30), y el buff
de `corn_cake` (+60 de vida máxima durante 10 minutos), cuyo único
propósito es precisamente ese.

Un jugador con peto de cristal y grebas lleva +180 de vida que no ve en el
combate por turnos. Es exactamente el fallo de la FASE 13: craft → equip →
stats funciona, y se rompe en el último eslabón.

### 2.3 La pestaña de PvP no existe

> ✅ **Resuelto en el STEP 5.** El panel existe y usa el CSS que ya
> estaba escrito. El servidor devuelve además el duelo asalto a asalto,
> y la pantalla lo reproduce. Lo cubre `test-pvp-pantalla.js`, que sin
> el panel falla catorce veces. Sigue siendo un rival generado por el
> servidor, no otra persona: eso es §3.2, y la pantalla lo dice.

`src/pages/criptomundo-mazmorras-pvp.js`:

- Línea 581: el botón llama a `setMode('pvp', this)`.
- Línea 657: `setMode` busca `document.getElementById('pvp-mode')`.
- **En toda la página no hay ningún elemento con `id="pvp-mode"`.**

Resultado: pulsar la pestaña PvP esconde las mazmorras y no enseña nada.
Pantalla en blanco.

Además hay ~120 líneas de CSS muertas (`.pvp-layout`, `.pvp-pool`,
`.pvp-player`, `.pvp-fighter`, `@keyframes pvpAttack`, `pvpShake`…) sin un
solo elemento HTML que las use.

---

## 3. Lo que está IMPLEMENTADO EN SERVIDOR Y NO TIENE CLIENTE

Este es el patrón dominante del proyecto: el servidor va muy por delante de
las pantallas. Cruzando los 68 endpoints declarados con todas las llamadas
de `src/pages/`:

| Endpoint | Estado | Qué se pierde |
|---|---|---|
| `/api/recursos` | sin cliente | los nodos físicos del mundo |
| `/api/recursos/golpear` | sin cliente | talar y picar |
| `/api/hotbar` | sin cliente | barra rápida de 8 ranuras |
| `/api/hotbar/seleccionar` | sin cliente | " |
| `/api/forja` | sin cliente | catálogo de 24 herramientas |
| `/api/pvp/match` | sin cliente | emparejamiento PvP |
| `/api/pvp/result` | sin cliente | resultado y Elo |
| `/api/online` | sin cliente | quién está conectado |
| `/api/profile` | sin cliente | ficha pública |
| `/api/zones` | sin cliente | catálogo de zonas |

(`/api/health`, `/api/dev/dar`, `/api/wallet/*` y `/api/web3/status` también
salen en el cruce, pero son de infraestructura o de la fase Web3 que está
deliberadamente aparcada. No cuentan.)

### 3.1 La recolección física ya existe entera — y nadie la ve

> ✅ **Resuelto en el STEP 2.** Los nodos se dibujan en el mapa y se
> talan con ESPACIO. El servidor gana la validación de distancia, la de
> zona actual y el enfriamiento por golpe que faltaban. Lo cubre
> `test-mundo-recursos.js`, que ejecuta el módulo de la página contra el
> servidor. La distancia solo será a prueba de trampas cuando el mundo
> lleve la posición en el servidor (§3.2).

`src/server/48-recursos-mundo.js` (405 líneas) implementa **exactamente** lo
que pide la FASE 10:

- 8 tipos de nodo (3 árboles, 5 vetas) con vida propia, repartidos por zona.
- 32 instancias colocadas con coordenadas `x`, `y`, con un comentario que
  dice literalmente *"Posiciones repartidas: el cliente las usa para
  dibujarlos"*. Ningún cliente las lee.
- Herramienta requerida (hacha vs pico), nivel mínimo de herramienta,
  durabilidad que baja por golpe y herramienta que se rompe.
- Vida del nodo, botín por probabilidad, temporizador de reaparición.
- 24 herramientas generadas de 3 mangos × 4 cabezas, con estadísticas
  calculadas a partir de los materiales.
- Ranura `tool` propia, separada del arma: el hacha y el pico **ya** no se
  comportan como armas normales, que es lo que pide la FASE 5.

`test-recursos.js` lo verifica con **47 comprobaciones en verde**.

Y la única forma de recolectar que tiene el jugador sigue siendo
`/api/gather` desde la pantalla del huerto: entrar a la zona y pulsar un
botón para que el recurso aparezca de la nada. Es literalmente el
"Entrar al bosque → reclamar madera" que la FASE 11 quiere eliminar.

**No hay que escribir el sistema. Hay que enchufarlo.**

Lo que sí le falta al servidor para la FASE 10: `golpearRecurso()` valida
zona, herramienta, nivel y durabilidad, pero **no valida distancia** ni tiene
enfriamiento entre golpes. El límite al spam hoy es indirecto (la
durabilidad y la vida del nodo).

Nota de diseño a decidir: `char.nodos` guarda el estado por personaje, así
que los nodos son instanciados. Dos jugadores no compiten por el mismo
árbol. Es defendible, pero choca con la idea de mundo compartido de la
FASE 8.

### 3.2 No hay multiplayer

> ✅ **Resuelto en el STEP 6, con un límite dicho.** El servidor lleva
> la posición de cada jugador y se la cuenta a los de su zona, diez
> veces por segundo, por socket o por HTTP. Se ven el nombre, el nivel,
> el aspecto, la dirección y el arma, con interpolación en el cliente.
>
> El servidor **acepta o corrige**, no simula: comprueba que la
> coordenada cae dentro del mundo y que el salto es humanamente
> posible, pero no lleva las colisiones con los edificios. Un cliente
> modificado todavía puede andar a la velocidad máxima en línea recta;
> lo que ya no puede es teletransportarse. Simular el movimiento entero
> obligaría a portar las colisiones del mapa al servidor, y eso es otro
> trabajo.
>
> De paso cierra la advertencia que quedaba en §3.1: la recolección ya
> no se cree la posición que mande el cliente, porque el servidor la
> sabe. Lo cubre `test-mundo-multijugador.js`.

`src/server/55-tiempo-real.js` tiene un WebSocket escrito a mano, sólido y
probado (`test-socket-fugas.js`, 10 en verde). Pero lo único que transporta
es:

- chat,
- presencia (**solo nombre y nivel**, ninguna posición),
- entradas de la arena.

No existe ningún mensaje de posición en el mundo. No hay `world_move`, no
hay lista de jugadores por zona, no hay dirección, sprite, animación ni
equipamiento de otros jugadores.

Y del lado del cliente, sobre 19 páginas:

| Página | WebSocket |
|---|---|
| `criptomundo-arena.js` | sí (entradas de combate) |
| `index-2.js` | sí (chat y presencia) |
| `criptomundo-mundo2d-2.js` | **no** |
| las otras 16 | no |

El mundo 2D es estrictamente monojugador. La FASE 8 no está a medias: no
está empezada. Es el trabajo más grande de todo el encargo.

### 3.3 PvP: el servidor decide, el cliente no pregunta

El servidor tiene emparejamiento y Elo, y `test-seguridad.js` confirma en
verde que *"el endpoint antiguo ya no acepta el resultado del cliente"* y
que *"el rating lo calcula el servidor (Elo)"*. Correcto y bien protegido.

Pero ningún cliente llama a `/api/pvp/match` ni a `/api/pvp/result`, y la
pestaña que debería hacerlo está rota (§2.3). El PvP hoy no se puede jugar
de ninguna manera.

### 3.4 Mazmorras: el combate es real, el resto son dados

> ✅ **Resuelto en el STEP 9.** Las tres salas abren ahora un encuentro
> en el mismo motor de arena que ya usaban las de combate, con un
> objetivo que no es matar: ir a un sitio y aguantar allí. El cofre hay
> que forzarlo mientras cuatro emisores disparan a través de él; el
> pasillo hay que cruzarlo entre tres filas de dardos que avisan antes
> de salir; la fuente hay que alcanzarla y beber. Los números de antes
> —el botín de cada sala, el 35 % del santuario, el daño de la trampa—
> no se han tocado: lo que cambia es que dependen de lo que haga el
> jugador. Lo cubre `test-mazmorra-salas.js`, que las juega por HTTP.
>
> Sigue pendiente lo otro que dice este apartado: el jefe no tiene
> arena propia ni mecánica especial.


`src/server/59-mazmorras.js` genera el mapa con semilla y **las salas de
combate, élite y jefe usan el motor de arena de verdad** (`iniciarEncuentro`).
Eso está bien resuelto.

Las otras tres no son jugables, son una tirada instantánea:

| Sala | Qué pasa hoy | Qué pide la FASE 15 |
|---|---|---|
| cofre | `Math.random()` decide si estaba trampeado, botín directo | interacción física |
| trampa | `Math.random()` contra agilidad | telegrafía y posibilidad de esquivar |
| santuario | suma vida y avanza | curación con interacción |

El jefe tampoco tiene arena propia ni mecánica especial: es una oleada más
con dos enemigos.

---

## 4. Lo que está BIEN y NO hay que tocar

Es importante dejarlo escrito, porque la tentación de reescribir es real.

| Sistema | Por qué está bien |
|---|---|
| **Mercado** (`40-mundo-mercado.js`) | Escrow al publicar, compra atómica sin `await` intermedio, precio siempre del listing, comisión quemada, `sellerId === char.id` rechazado en servidor **y** ocultado en cliente. La regla absoluta de la FASE 17 ya se cumple por los dos lados. El cliente ya tiene búsqueda, categoría, rareza, orden, precio mín/máx, publicaciones propias e historial. |
| **Combate por turnos** (`30` + `31`) | Máquina de estados con guion de eventos (`BATTLE_START`…`BATTLE_END`) con duración por escena, reproducido por `criptomundo-combat-2.js`. Las 3 habilidades por clase son seleccionables y validadas (no se puede lanzar la habilidad de otra clase mandando el id a mano). Objetos usables en combate resueltos por plantilla. Telegrafía, bloqueo, interrupción por aturdimiento, combo y fases de jefe. Esencialmente lo que pide la FASE 2, ya hecho. |
| **Arena** (`58-arena.js`) | Simulación a 100 ms en servidor. Física con dos carriles de velocidad (intención vs impulso) e integración por `dt` real, así que el rozamiento no depende de la carga del servidor. Separación de cuerpos por peso. Armas con alcance, arco, cadencia, empuje y proyectil, y los números salen de una curva derivada del precio, no del criterio de nadie. |
| **IA de enemigos** (`56-ia-enemigos.js`) | Máquina de estados real con IDLE / CHASE / TELEGRAPH / ATTACK / CHARGE / RETREAT / STUN / HURT / DEAD y tres conductas (perseguidor, tirador, embestidor) con semilla propia por bicho. La FASE 3 ya está cubierta en su mayor parte. |
| **Huerto** (`47-recoleccion-huerto.js`) | Crecimiento por marcas de tiempo en el personaje, persistido. Cerrar el navegador **no** detiene el crecimiento, y el cliente no puede declarar `growth = 100%`. La FASE 12 ya se cumple en lo esencial. |
| **Persistencia** | Escritura atómica (temporal + rename), copias rotadas, recuperación desde la copia más reciente si el archivo principal está corrupto. |
| **Economía CGRID** | Off-chain con tope diario de emisión, declarado públicamente. Es exactamente donde la FASE 18 dice que debe quedarse. |
| **Assets** | Los 19 PNG son válidos, con alfa correcto donde toca. Ninguna referencia del código apunta a un archivo que no exista. Hay validación de skins al arrancar que descarta la que no cuadre en vez de enseñar un cuadro roto. |

---

## 5. Otros hallazgos

### 5.1 Estado que se pierde al reiniciar el servidor

> ✅ **Resuelto en el STEP 7.** `snapshotOf()` guarda ahora `sessions`
> (podadas de las caducadas), `battles` y los últimos 200 mensajes de
> chat, y `applySnapshot()` vuelve a filtrar al restaurar porque el
> archivo puede llevar días parado. `createSession()` y el logout
> disparan `persist()`, para que un login no se quede sin escribir.
> Arena y mazmorras siguen fuera a propósito, con el motivo escrito en
> el código. Lo cubre `test-sesiones-persisten.js`, que mata el
> servidor de verdad y lo vuelve a arrancar.


`snapshotOf()` (`10-infra.js:78`) no guarda:

| Estructura | Consecuencia |
|---|---|
| `store.sessions` | **todo el mundo pierde la sesión en cada reinicio** |
| `store.battles` | combate por turnos a medias, perdido |
| `partidas` (Map, `58-arena.js:383`) | partida de arena en curso, perdida |
| `runs` (Map, `59-mazmorras.js:47`) | run de mazmorra en curso, con su botín acumulado, perdida |
| `store.chatMessages` | historial de chat, perdido |

Lo importante (personajes, inventario, equipo, oro, huerto, nodos, mercado)
sí se guarda. El más molesto de la lista es el de sesiones: un despliegue
echa a todos los jugadores.

### 5.2 Hitboxes: no hay ventanas de ataque

> ✅ **Resuelto del todo: STEP 3 y STEP 8.** El golpe ya tiene
> anticipación, ventana activa y recuperación, derivadas de la cadencia
> del arma y sumando exactamente esa cadencia, así que el daño por
> segundo no se mueve (`test-arena-ventanas.js`).
>
> Y en el STEP 8 se separó el cuerpo de la zona golpeable. `radio` hacía
> tres trabajos: separar cuerpos, frenar contra la pared y decidir si un
> golpe toca. Ahora `radio` es el cuerpo y `golpeable` es la zona
> vulnerable. El jugador la tiene más pequeña que su cuerpo (11 de 15);
> los enemigos la conservan igual al cuerpo a propósito, para no tocar
> el daño por segundo del jugador. Medido con el mismo guion antes y
> después —plantarse y atacar 20 segundos, seis veces—: 478 de vida
> perdida de media antes, 484 después, con rangos de 350–595 y 280–630.
> Plantarse cuesta lo mismo; lo que cambia es rozar. Lo cubre
> `test-arena-hurtbox.js`.

`golpear()` (`58-arena.js:578`) aplica el daño **en el mismo instante** en
que llega la intención. No hay startup / active / recovery. La FASE 6 pide
ventanas explícitas (p. ej. 120/160/300 ms) y hoy no existe ninguna.

Sí existe separación entre sprite y alcance del golpe (`arma.alcance` +
arco, contra `en.cfg.radio`), así que el hitbox de ataque no es el tamaño
del sprite. Pero cuerpo de colisión y hurtbox comparten el mismo `radio`.

### 5.3 Sprites

| | |
|---|---|
| Objetos con dibujo propio | 3 (las tres espadas) |
| Objetos sin dibujo (solo emoji) | el resto del catálogo |
| Skins con animación de caminar | 1 de 7 (`laurel_possum`) |
| Skins solo emoji | 4 de 7 |
| Carpeta `assets/items/anim/` | **no existe** |

`tiraDe()` (`58-arena.js:301`) busca tiras de animación de arma en
`assets/items/anim/<id>.png`. La carpeta no existe, así que **ninguna arma
tiene animación de ataque**: todas caen al gesto calculado. El mecanismo
está listo y esperando archivos.

Los PNG de `assets/skins/originales/` y `assets/items/originales/` son arte
fuente, no los usa el juego.

### 5.4 Métricas de economía incompletas

`goldPerHourCurve()` da oro creado, quemado, neto, CGRID emitido y kills por
hora. De la lista de la FASE 18 faltan: objetos creados/hora, objetos
destruidos/hora, precio medio por objeto y volumen del mercado.

### 5.5 Código muerto

- ~120 líneas de CSS de PvP sin HTML (§2.3).
- 9 scripts `aplicar-*.js` en la raíz: parches de una sola vez ya aplicados.

### 5.6 Cada prueba deja su servidor vivo

> ✅ **Resuelto en el STEP 1.** Los 17 archivos afectados matan ahora su
> servidor desde `process.on('exit')`. Comprobado: 4 pruebas seguidas
> dejaban 4 servidores y ahora dejan 0.

Cada archivo de prueba arranca su propio servidor y lo mata así:

```js
setTimeout(() => run().finally(() => c.kill()), 3000)
```

Pero `run()` termina con `process.exit(...)`. Ese `.finally()` **no se
ejecuta nunca**: el proceso ya ha muerto. Así que cada ejecución deja un
servidor vivo con su puerto ocupado, para siempre.

Lo caro no es el proceso colgado: es lo que provoca. La siguiente
ejecución de esa misma prueba no puede escuchar en ese puerto, así que
habla sin saberlo con el servidor VIEJO, que arrastra las cuentas y los
contadores de la ejecución anterior. Durante esta auditoría eso dejó
`test-invitaciones.js` en 13 OK · 7 fallidas con un `429` de "demasiadas
cuentas creadas desde esta red", mientras en aislado pasaba 20 de 20.

Diecisiete de los treinta y tres archivos tenían este patrón. Los que
usaban `process.on('exit', ...)` estaban bien: ese sí se dispara con
`process.exit()`.

No afecta a jugar, solo a probar. Pero cuesta horas de diagnóstico y,
peor, hace dudar de fallos que sí son reales.

### 5.7 La suite no se puede ejecutar en paralelo

El registro está limitado a 20 cuentas por hora y por IP
(`REGISTER_LIMIT_PER_HOUR`). Varios archivos de prueba a la vez contra
`127.0.0.1` se lo comen entre todos y empiezan a fallar con `429`. Es
correcto que el límite exista; lo que falta es que las pruebas lo sepan.

### 5.8 Las pruebas intermitentes eran un patrón, no un caso suelto

> ✅ **Resuelto en el STEP 1.**

Salió durante el propio STEP 1: fallaba en una de cada diez ejecuciones
con `combo visto: false`, sin relación con lo que se estuviera tocando.

La prueba observa el combo atacando y bloqueando uno de cada cuatro
turnos. El combo se reinicia al bloquear Y al comerse el golpe anunciado
del enemigo. Medida la secuencia real contra el Gólem, que es el bicho
que la prueba elige, sale siempre la misma:

```
a1  a2  a0  B0  a1  a0        (a = ataque, B = bloqueo)
     ^^
     única ventana en la que el combo llega a 2
```

El jugador de nivel 1 muere contra el Gólem en seis turnos, así que solo
había una oportunidad de ver el combo, y el 5% de fallo del ataque la
cerraba. Bloqueando uno de cada seis turnos quedan dos ventanas y el
fallo baja a cerca del 1%.

Es el mismo patrón que §0: una prueba cuyo presupuesto de observación se
quedó corto cuando el balance cambió debajo.

**Y salió un tercero.** `test-contenido.js` fabricaba una Poción de
Velocidad y daba por hecho que salía. La receta tiene un 95% de éxito y
los materiales se gastan aunque falle, así que una de cada veinte
ejecuciones se quedaba sin poción y la prueba reventaba con un
`TypeError` buscando el identificador de algo que no existía.

Los tres comparten la misma forma: **una prueba que observa un suceso
probabilístico una sola vez.** El botín de un combate, el crítico de un
golpe, el éxito de una receta. Mientras el margen fue holgado no se
notó; en cuanto el balance se movió debajo, empezaron a caer.

Hice un barrido buscando más. De las veintiuna recetas que pueden
fallar, solo dos aparecen en pruebas: `rec_spd`, ya arreglada, y
`rec_chest`, que solo se usa para comprobar que se rechaza por nivel, así
que su probabilidad nunca entra en juego. Los drops garantizados de los
nodos de recurso llevan probabilidad 1. Y `test-turnos.js` observa el
crítico, el fallo y el veneno pero no los exige. El barrido queda
limpio: no debería quedar ninguno más de este tipo.

La regla para lo que venga: si una prueba observa algo que el servidor
decide con un dado, o insiste hasta verlo con un presupuesto medido, o
no lo exige.

**Y hay una variante peor: la comprobación que desaparece.** En
`test-contenido.js`:

```js
const garrote = await buscar('wood_club')
if (garrote) {
  check('cambiar de arma cambia lo que ve la arena', …)
}
```

El garrote pide 4 de madera y 1 de cuero, y a esas alturas el inventario
depende de cómo haya ido la recolección. Si falta algo, la receta no
sale, el `if` no entra y **la prueba termina en verde con una
comprobación menos**. Salió a la luz porque un día dio 24 OK donde otro
día daba 25, y hubo que comparar dos ejecuciones línea a línea para ver
cuál faltaba.

Una prueba que se calla cuando no puede probar algo es peor que una que
falla: da confianza sin haberla ganado, y no hay nada en el resumen que
lo delate. El arreglo es el mismo de siempre: garantizar la condición
—aquí, repartir los materiales— y comprobar SIEMPRE.

Quedan otros cuatro `if` alrededor de comprobaciones en
`test-revision.js`, `test-turnos.js` y `test-turnos-pantalla.js`. Los
miré y los de turnos son legítimos —el fallo del ataque es una rama
esperada y el test la contempla aparte—, pero conviene tenerlos
fichados: el recuento de comprobaciones de cada archivo es un dato que
nadie vigila.

### 5.9 Lo que NO es un problema (comprobado y descartado)

Para que no se vuelva a mirar:

- **`index.js` / `index-2.js`, `mundo2d.js` / `mundo2d-2.js`, `combat.js` /
  `combat-2.js` NO están duplicados.** El segundo usa `+=` sobre la misma
  clave de `PAGES`: es una continuación, no una copia. Es el patrón que usa
  el proyecto para no pasar del límite de 70 KB por módulo que vigila
  `test-build.js`.
- **Todas las armas `WEAPON` del catálogo tienen entrada en `ARMAS`.**
  Ninguna se comporta como puños por descuido.
- **`hacha_madera_piedra` y `pico_madera_piedra`**, que el personaje nuevo
  recibe, sí existen: los genera el bucle de `48-recursos-mundo.js`, que
  se ejecuta antes de que nadie cree un personaje.
- **No hay referencias a assets inexistentes.**
- **El servidor no tiene placeholders ni simulaciones.** Todo lo simulado
  está en el cliente.

---

## 6. Prioridades propuestas

El orden de la FASE 23 se respeta, con una excepción que propongo razonada.

**Antes del STEP 1 — dos arreglos que desbloquean el resto:**

1. `test-misiones-mundo.js` intermitente (§0). Mientras siga así, una de
   cada tres ejecuciones de `npm test` no prueba 26 archivos, y no se puede
   trabajar con una red de seguridad que a veces no está.
2. El combate falso del mundo 2D (§2.1). Es una brecha de seguridad
   económica abierta y el endpoint correcto ya existe y está probado.

Propongo además **adelantar la recolección física (STEP 6) justo detrás**,
antes que la arena y los turnos. Motivo: el sistema ya está escrito, probado
con 47 comprobaciones en verde y solo le falta cliente, así que es la mayor
cantidad de juego nuevo por unidad de trabajo de todo el encargo. Y es la
base del bucle de la FASE 16 (árbol → madera → arco → arena → oro), del que
cuelgan los pasos posteriores. La arena y el combate por turnos, en cambio,
ya se juegan hoy.

El resto del orden se mantiene: arena, turnos, equipamiento, farming,
mazmorras, mercado, progresión, UI/UX, móvil, QA.

---

## 7. Resumen de la FASE 0

**FILES CHANGED** — ninguno. Solo se añade este documento.

**WHAT WAS FIXED** — nada todavía, a propósito: la FASE 0 es auditoría.

**WHAT WAS ADDED** — `docs/AUDITORIA_V31.md`.

**TESTS ADDED** — ninguno.

**TESTS PASSED** — 32 de 32 archivos en verde ejecutados uno a uno: 790
comprobaciones. 1 archivo intermitente con ~30% de fallo. 0 que fallen
siempre. Con `npm test` tal y como está, ese intermitente aborta la suite
en una de cada tres ejecuciones.

**KNOWN ISSUES** — los tres críticos: combate simulado en el cliente del
mundo 2D (§2.1), +HP del equipo ignorado en turnos (§2.2), pestaña de PvP
inexistente (§2.3). Y las tres ausencias grandes: sin multiplayer (§3.2),
recolección física sin cliente (§3.1), PvP sin cliente (§3.3).

**NEXT STEP** — STEP 1 con los dos arreglos de desbloqueo: estabilizar
`test-misiones-mundo.js` y conectar el combate del mundo 2D a
`/api/combat/action`.
