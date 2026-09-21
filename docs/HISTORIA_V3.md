# CriptoMundo v4

Un solo ejecutable, cero dependencias npm, Node.js 18+.

```bash
node criptomundo.js              # arranca en http://localhost:3000
node doctor.js                      # diagnóstico: qué conviene mejorar
node simular-jugadores.js 10 3      # 10 jugadores automáticos, 3 minutos
npm test                            # las 139 pruebas
```

| Documento | Para qué |
|---|---|
| `DESPLIEGUE.md` | Ejecutarlo en local, en un servidor o con Docker |
| `COMO_TRABAJAR.md` | Editar el código (se trabaja en `src/`, se compila con `build.js`) |
| `COMO_AGREGAR_SKINS.md` | Añadir personajes |
| `PLAN_VERTICAL_SLICE.md` | Qué construir y en qué orden |

## Novedades de la v4

**Kit de ejecución.** `package.json` con scripts, `Dockerfile` con healthcheck, `.env.example` documentado, `DESPLIEGUE.md` con systemd y la lista de lo mínimo antes de abrirlo a nadie. Apagado ordenado: `SIGTERM` guarda el estado antes de salir, así que reiniciar no pierde partidas. El arranque avisa de la configuración que falta.

**`doctor.js`.** Arranca el servidor, juega una partida automatizada y produce un informe ordenado por prioridad: configuración, peso de los assets, curva de progresión, turnos por enemigo, misiones imposibles de terminar y recorridos que un jugador nuevo no puede hacer. Sale con código 1 si hay algo grave, así que vale para un pipeline.

**`simular-jugadores.js`.** Crea una cohorte de jugadores automáticos con tres estilos de juego (moledor, explorador, casual), los deja jugar y vuelca el embudo, la economía y lo que ve el panel. Sirve para probar balance con varios jugadores a la vez sin tener jugadores.

**Tres fallos que encontraron estas herramientas y ya están corregidos:**

1. El límite de 5 cuentas por hora y por IP bloqueaba a personas de la misma red. Ahora son 20 y es configurable (`REGISTER_LIMIT_PER_HOUR`).
2. El límite general de peticiones se contaba por IP, así que ocho jugadores en la misma red se estrangulaban entre ellos: el 60 % de las acciones de combate se rechazaban. Ahora se cuenta por sesión. Con la misma cohorte, los enemigos derrotados pasaron de 59 a 198.
3. El objetivo "Eliminar al Troll Jefe" apuntaba a un dragón de nivel 15 en otra zona: la misión de nivel 1 era imposible. Ahora existe Grommash, jefe troll de nivel 7 en el bosque.

Además, `/api/admin/analytics` ya no exige sesión de jugador, solo el token de administración, y las suites de prueba usan un archivo de datos distinto en cada ejecución (antes se contaminaban entre ellas).

## Lo que el diagnóstico sigue señalando

- **Prioridad alta:** 8 turnos por enemigo. El combate del primer tramo se hace largo.
- **Prioridad media:** llegar a nivel 5 cuesta 29 enemigos, y nivel 5 es el requisito de la primera mazmorra.
- **Pendiente:** PostgreSQL conectado, chat en tiempo real, grupos, guerras de gremio, integración on-chain.

Los dos primeros son decisiones de diseño, no fallos: prefiero que los confirmen jugadores reales antes de tocar números a ciegas.

---

# Historial de cambios

## 1. Seguridad (los 15 errores del informe)

| Problema en v2 | Solución en v3 |
|---|---|
| Contraseñas en texto plano | `scrypt` con salt aleatorio de 16 bytes y comparación en tiempo constante (`timingSafeEqual`) |
| Tokens con `Math.random()` | `crypto.randomBytes(32)`, expiración de 7 días, barrido automático de sesiones caducadas |
| Cookie sin protección | `HttpOnly; SameSite=Strict` (+ `Secure` si `NODE_ENV=production`) |
| `Access-Control-Allow-Origin: *` | Solo orígenes de `ALLOWED_ORIGINS`; por defecto, mismo origen. Nunca `*` |
| Sin rate limiting | Global por IP (300/min), login (10/10min), registro (5/hora), chat (8/20s), combate, mercado, crafting |
| Sin validación de entrada | Validadores de tipo/rango en todo: usernames por regex, enteros acotados, precios y cantidades, cuerpo máximo de 32 KB |
| XSS en chat | Escape de `< > & " '` + bloqueo de mensajes repetidos |
| Sin auditoría | `audit()` registra login, combate, mercado, mazmorras, PvP, emisión de CGRID, acciones de gremio |
| Doble envío | Cabecera `Idempotency-Key` en todas las operaciones económicas |
| Login filtra si el email existe | Mensaje genérico y misma latencia |
| Errores exponen internals | En producción solo "Error interno" |

También: se añadieron `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, y el personaje se serializa por `publicChar()` para que nunca salgan hashes ni contadores internos.

## 2. Combate server-authoritative

Existe `BattleSession` en el servidor (`battleId`, `enemyHp`, `enemyMaxHp`, turno, semilla, buffs, DOTs, timestamps). **`monsterCurrentHp` enviado por el cliente ahora se ignora por completo.** El cliente solo manda `monsterId`, `action` y opcionalmente `skillId`.

Nuevo en el motor: habilidades con coste y cooldown real, maná validado, crítico y evasión derivados de agilidad, mitigación por defensa, tabla de elementos (fuego/hielo/rayo/naturaleza/luz/oscuridad/tierra), buffs y debuffs por turnos, veneno con daño por turno, curación que **consume una poción del inventario** (antes se curaba de la nada), e intervalo mínimo de 350 ms por acción como anti-macro.

## 3. Clases con identidad propia

`Guerrero`, `Mago`, `Asesino` y `Archimago` tienen bases y crecimiento distintos, y árbol de habilidades propio (9 habilidades con coste, cooldown, escalado y efecto). No son los mismos números con otro nombre.

## 4. Equipamiento y objetos

Cada objeto tiene `uid` único + `itemId` de plantilla. Catálogo servidor de 20 plantillas con rareza, valor, slot y stats. 7 slots (`weapon`, `helmet`, `chest`, `gloves`, `boots`, `accessory1`, `accessory2`), nuevo endpoint `POST /api/player/equip`, y `effectiveStats()` recalcula todo en servidor. Límite de mochila de 120 huecos.

## 5. Misiones

**El cliente ya no puede incrementar progreso.** `action:'progress'` es ahora solo de lectura. El progreso lo genera `emitProgress()` desde eventos reales: matar el monstruo correcto, fabricar la receta correcta, explorar una zona por primera vez, completar una mazmorra concreta. Añadidas 2 misiones nuevas (crafting y mazmorra) y requisitos de nivel.

## 6. Mazmorras

`DungeonRun` con `runId`, semilla, pisos, estado y `rewarded`. `complete` valida: run existente y tuya, tiempo mínimo real transcurrido (45 s a 300 s según mazmorra), pisos superados, y recompensa entregada una sola vez. Añadidos cooldowns por mazmorra (5 min a 24 h) y botín por tabla con semilla. Endpoint nuevo `action:'floor'` para avanzar pisos con eventos (trampa/cofre/combate).

## 7. PvP

`POST /api/pvp/result` **ya no acepta `result` del cliente**. Se mantiene por compatibilidad pero internamente simula el combate en el servidor con semilla registrada, calcula Elo real (K=32) y devuelve el resultado. Nuevo endpoint limpio: `POST /api/pvp/match`.

**Las apuestas de CGRID están deshabilitadas** (se registran como intento rechazado). La apuesta de oro está limitada a 2.000 y al 20% del oro del jugador, con 5 s de cooldown entre combates.

## 8. Mercado

Escrow real: al publicar, el objeto sale del inventario; al cancelar, vuelve. El precio **siempre** sale del listing, nunca del cuerpo de la petición. Validación de ownership, no puedes comprar tu propia publicación, compras parciales, expiración, comisión del 5% quemada como sink de oro, y el vendedor cobra de verdad. Toda la operación ocurre sin `await` intermedio, así que es atómica en el event loop de Node. Nuevos: `/api/market/:id/cancel` y `/api/market/history`.

## 9. Economía

`GOLD` y `CGRID` separados de forma explícita:

- **Gold**: faucet por combate/misiones, sinks por muerte (8%), comisión de mercado, muebles, mejoras de casa, creación de gremio (5.000).
- **CGRID**: emisión con tope diario **global** (500) y **por jugador** (15). Solo se emite por jefes, mazmorras de dificultad alta y misiones concretas. Nunca por matar monstruos normales. Cada emisión queda auditada. Endpoint `/api/economy` para ver el estado.

## 10. Web3 honesto

`/api/web3/status` declara explícitamente `onChain: false` y que CGRID y los objetos son saldos off-chain sin contrato desplegado. `publicChar()` devuelve `cgridOnChain: false`. La vinculación de wallet devuelve `501` a propósito: no se acepta ninguna vinculación hasta que exista verificación de firma real con ethers.js. **No se finge nada.**

## 11. Otros

Gremios con roles y permisos (LEADER/OFFICER/MEMBER), capacidad, coste de creación, tesorería con donaciones, nivel por XP, expulsión con jerarquía. Casa con precios de mobiliario en el servidor (antes el cliente enviaba `cost`). Zonas del mundo con requisito de nivel y exploración verificada. Feed de actividad basado en eventos reales, no en datos demo inventados. Persistencia en disco con guardado diferido y volcado al cerrar.

## 12. Telemetría (v3.1)

Retención por cohorte (D1/D7/D30), embudo de onboarding de 13 pasos con columna de abandono, sesiones y minutos reales jugados (no logins), curva de oro por hora jugada, faucets y sinks medidos evento a evento. Todo en `/admin.html`, protegido con `ADMIN_TOKEN`.

## 13. Economía pública (v3.1)

`/economia.html` y `/api/economy/public`: oro creado vs quemado por día, CGRID circulante contra el tope diario, precios mín/medio/máx del mercado, volumen y comisión quemada. Sin datos personales de ningún jugador. La confianza en un juego cripto se gana con cifras auditables, no con promesas.

## 14. Profundidad de combate (v3.1)

El combate ya no es "pulsar atacar":
- **Telegrafía**: cada 3 turnos (2 en fase de jefe) el enemigo anuncia un ataque fuerte (×1.9, ×2.4 en jefes).
- **Bloqueo**: nueva acción `block` — reduce el daño anunciado al 30 % y recupera 10 % de maná.
- **Interrupción**: una habilidad con aturdimiento (Golpe de Escudo) cancela el ataque anunciado.
- **Combos**: golpes encadenados suben el daño hasta +25 %; fallar o curarse rompe la cadena.
- **Fases de jefe**: al 50 % de vida los jefes suben daño un 30 % y telegrafían más a menudo.

## 15. Cliente de combate reescrito (v3.1 — Fase A)

La página de combate de la v2 **simulaba el combate entera en el navegador** y solo avisaba al servidor al final con `action:'kill'` — una acción que la v3 ya rechaza, así que en la práctica el combate no otorgaba nada. Ahora es un cliente fino: envía la acción, dibuja la respuesta, no calcula nada.

- Aviso visual del ataque telegrafiado, con el enemigo vibrando y el botón de bloqueo destellando.
- Insignias de combo (×2 en adelante) y de fase de jefe.
- Botón **Bloquear** nuevo y `Sanar` que ahora consume una poción real del inventario.
- Selector de enemigo con los 6 monstruos del servidor, bloqueando los que superan tu nivel + 3.
- Botín, oro, XP, CGRID y subidas de nivel vienen del servidor; el inventario es el real.
- Atajos de teclado 1-5.

También se corrigió el escalado del ataque básico: antes siempre usaba fuerza, lo que dejaba a las clases mágicas pegando como con un palo. Ahora escala con la estadística principal de cada clase (fuerza / inteligencia / agilidad), con multiplicador menor que las habilidades para que estas sigan mereciendo la pena. Una araña cae en unos 5 turnos a nivel 1.

## 16. Mazmorras y PvP reescritos (v3.1)

Mismo problema que tenía combate: ambas páginas simulaban todo en el navegador y avisaban al servidor al final. Ahora son clientes finos.

**Mazmorras.** La run del servidor manda: se entra, se avanza piso a piso (`action:'floor'`) y cada piso devuelve su evento — trampa, cofre o sala despejada — generado desde la semilla registrada. Los botones muestran la cuenta atrás real que impone el servidor, y “Asaltar al jefe” solo se activa cuando se cumplen los pisos y el tiempo mínimo. Botín, oro, XP y CGRID salen de la respuesta. La pestaña de reglas explica al jugador por qué no se puede completar al instante.

**PvP.** Fuera las acciones de combate falsas y las fichas de apuesta en CGRID (el servidor las rechazaba de todos modos). Ahora se pulsa desafiar, el servidor empareja por puntuación y resuelve el combate; la animación reproduce los asaltos que ya se decidieron, con el identificador de la partida a la vista. La apuesta de oro se recorta en pantalla al límite real (2.000 y 20 % de tu oro) en lugar de dejar pedir más y fallar. El panel lateral explica las reglas, incluido por qué no se apuesta $CGRID.

La lista de rivales ya no son jugadores demo inventados: es la clasificación real del servidor.

## 17. Mercado reescrito (v3.1)

Era la página con dinero de por medio y la que más mentía: generaba 40 publicaciones falsas al cargar, tenía su propio `playerGold = 1240` y descontaba el oro en una variable de JavaScript. Ahora todo pasa por el servidor.

- Publicaciones, inventario e historial vienen de `/api/market`, `/api/inventory` y `/api/market/history`.
- Comprar llama al servidor con cabecera `Idempotency-Key`: un doble clic no compra dos veces.
- Publicar muestra el escrow de forma explícita (el objeto sale del inventario) y cancelar lo devuelve.
- Tus propias publicaciones se detectan y ofrecen cancelar en vez de comprar.
- El gráfico de precios usa **ventas reales**; si no hay suficientes, lo dice en vez de inventar una curva de siete días.
- El precio sugerido al vender sale de la media de ventas registradas, no de un número fijo.
- Tendencias y estadísticas (volumen, comisión quemada) salen del historial real.
- Fuera la regla inventada de que los legendarios costaban 5 % en $CGRID; las reglas mostradas son las que el servidor aplica de verdad.

## 18. Taller, casa y gremios reescritos (v3.1)

Con esto **ninguna página del juego simula ya su propia lógica**.

**Taller.** Las recetas venían codificadas en el cliente y no coincidían con las del servidor. Ahora salen de `/api/crafting` con sus ingredientes, nivel requerido, tasa de éxito y experiencia. Se añadió selector de tandas (hasta 20) y el resultado — incluidos los intentos fallidos — lo decide el servidor. El inventario lateral es el real y resalta los materiales de la receta seleccionada.

**Casa.** El cliente enviaba el precio del mueble junto con la compra. Ahora el catálogo del servidor tiene los 17 muebles con sus precios reales, y colocar uno es una compra validada: si el servidor la rechaza, el mueble no aparece. Guardar filtra por muebles realmente comprados. Se quitó el reembolso del 50 % al limpiar (era oro creado de la nada) y el diseño inicial de ejemplo; ahora se carga el guardado.

**Gremios.** La página tenía gremios, miembros y guerras inventados. Ahora el directorio, la clasificación y tu gremio salen del servidor, con creación (5.000 de oro, cobrados y destruidos), unión con límite de plazas, salida y donaciones al tesoro. La pestaña de guerras dice claramente que el sistema no existe todavía en lugar de mostrar batallas falsas.

Nueva suite: `test-taller-casa-gremios.js` (24 pruebas), que además comprueba que las páginas ya no contienen datos de ejemplo.

## 19. Misiones y mapa del mundo (v3.1)

**Misiones.** La página tenía su propio catálogo de misiones, distinto del del servidor, y un botón de “simular progreso”. Ahora las tres pestañas (disponibles, activas, completadas) salen de la API, los NPC vienen de `/api/npcs` con su recuento real de misiones, y el detalle muestra el progreso que el servidor lleva. El texto explica que el progreso solo avanza con acciones reales: matar al enemigo correcto, fabricar la receta indicada, explorar la zona o completar la mazmorra.

**Mapa del mundo.** Tenía un segundo motor de combate simulado en el navegador que enviaba `monsterCurrentHp` al padre. Se ha retirado: viajar a una zona llama a `/api/world/explore`, que valida el nivel, registra la visita y hace avanzar los objetivos de exploración; el combate se delega al módulo de combate en lugar de duplicarlo mal.

**Fallo de diseño encontrado y corregido:** las misiones de recolección no podían completarse nunca. El botín de combate añadía objetos al inventario pero no emitía ningún evento `gather_*`, así que el contador se quedaba a cero para siempre. Ahora cada objeto recogido emite su evento y el avance se ve en el registro de combate.

Nueva suite: `test-misiones-mundo.js` (21 pruebas), incluida una que juega hasta completar de verdad una misión de recolección.

## 20. Creador de personaje y skins (v3.2)

**Nombres únicos.** Ningún jugador puede repetir nombre, ni cambiando mayúsculas: hay un índice en minúsculas y `nameTaken()` lo comprueba en el registro. El formulario avisa mientras escribes con `GET /api/auth/check-name`.

**Creador de personaje.** Al pulsar “Crear personaje” se abre una pantalla nueva con vista previa en vivo, elección de clase (con una línea explicando qué hace cada una), rejilla de aspectos y selectores de color. Se construye sola a partir de `/api/skins`: añadir una skin al servidor la hace aparecer aquí sin tocar la interfaz.

**Seis aspectos**, cuatro base recoloreables (Aventurero, Guerrera de Hierro, Hechicero Arcano, Sombra Errante) y los dos ilustrados: **Stone Pepe** y **Holy Pepe**, servidos como PNG desde `assets/skins/`. El avatar elegido se ve en la barra superior del juego y en el perfil.

**Servidor.** `sanitizeAppearance()` no se fía de nada: comprueba que la skin exista y esté desbloqueada y que cada color sea un hex válido; lo demás se sustituye por el valor por defecto. Hay servidor de estáticos en `/assets/` con protección contra salirse de la carpeta. Endpoints nuevos: `GET /api/skins`, `GET /api/auth/check-name`, `POST /api/character/appearance`.

**Pensado para crecer**: añadir un personaje es una entrada en el array `SKINS` y un PNG. Ver `COMO_AGREGAR_SKINS.md`. El campo `unlock` ya soporta `level:N` para desbloqueos por nivel.

**Tres tamaños por skin.** Los PNG originales pesaban 1,4 y 2 MB, demasiado para un avatar de 30 píxeles. Se recortaron y generaron variantes: `full` (600 px de alto, vista previa), `portrait` (256×256, rejillas y perfil) y `avatar` (96×96, barra superior, ~20 KB). Si una skin nueva solo trae la ilustración grande, hay respaldo automático.

**Cambiar de aspecto desde el perfil.** Botón “Cambiar aspecto” que abre el mismo catálogo del creador; el cambio se aplica al momento y se propaga a la barra superior. Es gratis y no toca las estadísticas: solo apariencia.

Nueva suite: `test-personajes.js` (30 pruebas).

## 21. Código troceado y script de compilación (v3.2)

El archivo único de 13.600 líneas era el mayor riesgo técnico que quedaba: dos veces una edición mal escapada lo dejó corrupto y hubo que recuperarlo de la entrega anterior. Ahora el código vive en `src/` (14 páginas + 7 módulos de servidor, ninguno por encima de 60 KB) y el archivo único se genera con `node build.js`.

Sigue siendo un único ejecutable sin dependencias: lo que cambia es cómo se edita, no cómo se despliega. `--watch` recompila al guardar y `--check` falla si el archivo generado está desfasado respecto a `src/`, para no publicar sin compilar. Ver `COMO_TRABAJAR.md`.

Nueva suite: `test-build.js` (16 pruebas), que verifica que la compilación es reproducible y detecta ediciones a mano del archivo generado.

## 22. Camino a PostgreSQL (v3.1)

`exportar-a-postgres.js` vuelca el snapshot JSON a SQL sin dependencias: usuarios (con el hash scrypt intacto), personajes, inventarios, misiones, contadores, gremios, publicaciones, transacciones y auditoría. Migrar deja de ser una reescritura y pasa a ser dos comandos.

---

## Cambios que rompen compatibilidad

1. Los usuarios de v2 (contraseñas en texto) no migran: hay que registrarse de nuevo.
2. `POST /api/quests` con `action:'progress'` ya no incrementa nada.
3. `POST /api/pvp/result` ignora `result`, `cgridBet` y `opponentRating`.
4. Una mazmorra ya no se puede completar al instante: requiere tiempo real mínimo.
5. `heal` en combate requiere tener pociones.
6. El inventario devuelve objetos con `uid`; el código de UI que asumía `itemId` como clave única debe usar `uid`.

## Estado del checklist

Hechos: analítica y retención, economía pública, profundidad de combate, migración a Postgres, auditoría, tests, auth segura, sesiones, combate server-authoritative, BattleSession, loot seguro, quests seguras, DungeonRun, PvP server-authoritative, clases, equipment, rarity, marketplace seguro, sinks/faucets, anti-bot básico, moderación básica, tests de seguridad, migraciones DB escritas.

Pendientes: PostgreSQL conectado de verdad, Redis, WebSocket/parties/friends, guild wars, skill trees visuales, pets, tilemaps, VFX, audio, temporadas, raids, y toda la fase blockchain.
