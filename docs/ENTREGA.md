# CriptoMundo v31 → v32 · Entrega por pasos

Este documento es el parte de trabajo en el formato pedido: un bloque por
paso, con lo que se tocó, lo que se arregló, lo que se añadió, las pruebas
y lo que quedó sabido y sin hacer.

La foto de partida está en `docs/AUDITORIA_V31.md` y no se reescribe: sirve
para comparar. El relato largo de cada cambio, con el porqué, está en
`CHANGELOG.md`.

**Estado al cerrar:** 48 archivos de prueba · 1.218 comprobaciones · 0 fallos
· 162 s con `npm test`.

---

## FASE 0 — Auditoría

**ARCHIVOS TOCADOS** · `docs/AUDITORIA_V31.md`
**QUÉ SE ARREGLÓ** · nada, a propósito. Ni una línea de gameplay.
**QUÉ SE AÑADIÓ** · mapa de dependencias, lo que está roto, lo implementado
sin cliente, lo que está bien y no hay que tocar, y nueve hallazgos sueltos.
Donde hay una cifra, hay una medición detrás.
**PRUEBAS AÑADIDAS** · ninguna.
**PRUEBAS QUE PASAN** · 32 archivos, con un intermitente conocido.
**SE SABE Y NO SE ARREGLA AQUÍ** · el combate del mundo 2D lo decidía el
navegador; dos apartados de esta auditoría resultaron estar equivocados y se
corrigieron después (§5.5 y §5.7).
**SIGUIENTE** · STEP 1.

---

## STEP 1 — El mundo 2D deja de pelear consigo mismo

**ARCHIVOS TOCADOS** · `src/pages/criptomundo-mundo2d.js`, `-2`, `-3` (nuevo),
`src/server/30-personajes-combate.js`, `build.js`, `.gitignore`, 19 archivos
de prueba.
**QUÉ SE ARREGLÓ** · el mapa calculaba daño, vida, experiencia, botín y oro
en el navegador. Ahora manda la intención a `/api/combat/action` y pinta lo
que el servidor contesta. Además, 17 pruebas dejaban su servidor vivo al
terminar, y los huérfanos envenenaban a las siguientes.
**QUÉ SE AÑADIÓ** · dos monstruos que existían en el mapa y no en el
servidor (`m_bat`, `m_liche`), con su botín.
**PRUEBAS AÑADIDAS** · `test-mundo-combate.js` (42).
**PRUEBAS QUE PASAN** · 33 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · el arranque es ruidoso: de 47 a 110
ataques para llegar a nivel 3 según la suerte. Medido y anotado.
**SIGUIENTE** · STEP 2.

---

## STEP 2 — Los recursos del mundo, por fin en el mundo

**ARCHIVOS TOCADOS** · `src/server/48-recursos-mundo.js`, `60-http.js`,
`src/pages/criptomundo-mundo2d-2.js`, `-4` (nuevo).
**QUÉ SE ARREGLÓ** · el sistema de recolección física estaba entero en el
servidor y no lo llamaba nadie. Y aceptaba la posición que dijera el
cliente: ahora exige estar de verdad al lado del nodo, en la zona correcta,
y respeta el enfriamiento del golpe.
**QUÉ SE AÑADIÓ** · nodos dibujados en el mapa, golpe con ESPACIO, vida del
nodo, astillas y avisos.
**PRUEBAS AÑADIDAS** · `test-mundo-recursos.js` (27).
**PRUEBAS QUE PASAN** · 34 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · nada nuevo.
**SIGUIENTE** · STEP 3.

---

## STEP 3 — En la arena, un golpe ya dura algo

**ARCHIVOS TOCADOS** · `src/server/58-arena.js`.
**QUÉ SE ARREGLÓ** · el golpe aplicaba el daño en el mismo instante en que
llegaba la intención. Ahora tiene anticipación, ventana activa y
recuperación, derivadas de la cadencia del arma y sumando exactamente esa
cadencia, así que el daño por segundo no se mueve.
**QUÉ SE AÑADIÓ** · un golpe no puede tocar dos veces al mismo enemigo.
**PRUEBAS AÑADIDAS** · `test-arena-ventanas.js` (16).
**PRUEBAS QUE PASAN** · 35 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · cuerpo de colisión y zona golpeable
siguen compartiendo radio. Se cierra en el STEP 8.
**SIGUIENTE** · STEP 4.

---

## STEP 4 — El equipo que da vida ya cuenta en los turnos

**ARCHIVOS TOCADOS** · `src/server/30-personajes-combate.js`, `60-http.js`.
**QUÉ SE ARREGLÓ** · el combate por turnos usaba la vida BASE del personaje
y no la efectiva, así que una coraza que daba +HP no servía de nada ahí.
**QUÉ SE AÑADIÓ** · `maxHpDe`, `maxMpDe` y `ajustarATope`, para que haya un
solo sitio donde se decide el tope.
**PRUEBAS AÑADIDAS** · `test-equipo-vida.js` (20). Falla 6 veces contra el
código anterior.
**PRUEBAS QUE PASAN** · 36 archivos.
**SIGUIENTE** · STEP 5.

---

## STEP 5 — La pestaña de PvP ya no es una pantalla en blanco

**ARCHIVOS TOCADOS** · `src/pages/criptomundo-mazmorras-pvp.js`, `-2`
(nuevo), `src/server/40-mundo-mercado.js`.
**QUÉ SE ARREGLÓ** · había 120 líneas de CSS de PvP sin HTML detrás: pulsar
la pestaña escondía las mazmorras y no enseñaba nada. El servidor tenía
emparejamiento y Elo y no los llamaba nadie.
**QUÉ SE AÑADIÓ** · pantalla de duelo con apuestas, clasificación y
reproducción del combate asalto a asalto, con los datos que ya calculaba el
servidor.
**PRUEBAS AÑADIDAS** · `test-pvp-pantalla.js` (32). Falla 14 veces contra el
código anterior.
**PRUEBAS QUE PASAN** · 37 archivos.
**SIGUIENTE** · STEP 6.

---

## STEP 6 — El mundo deja de ser de un jugador

**ARCHIVOS TOCADOS** · `src/server/54-mundo-vivo.js` (nuevo), `55-tiempo-real.js`,
`60-http.js`, `src/pages/criptomundo-mundo2d-2.js`, `-5` (nuevo).
**QUÉ SE ARREGLÓ** · la presencia solo mandaba nombre y nivel, así que en el
mapa no se veía a nadie.
**QUÉ SE AÑADIÓ** · posiciones compartidas por socket con respaldo HTTP,
interpolación en la pantalla, y salida limpia al cerrar la pestaña.
**PRUEBAS AÑADIDAS** · `test-mundo-multijugador.js` (22).
**PRUEBAS QUE PASAN** · 38 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · se comparte posición y aspecto, no
combate entre jugadores en el mapa. Dicho explícitamente.
**SIGUIENTE** · STEP 7.

---

## STEP 7 — Sesiones, batallas y chat sobreviven a un reinicio

**ARCHIVOS TOCADOS** · `src/server/10-infra.js`, `60-http.js`, `test-turnos.js`.
**QUÉ SE ARREGLÓ** · la cookie duraba siete días y el token que la valida
vivía solo en memoria: cada despliegue echaba a todos al login. Las batallas
por turnos tampoco se guardaban, aunque el código ya preveía encontrárselas.
**QUÉ SE AÑADIÓ** · `sessions`, `battles` y los últimos 200 mensajes de chat
en el volcado, con poda por fecha al guardar y al restaurar.
**PRUEBAS AÑADIDAS** · `test-sesiones-persisten.js` (30): mata el proceso de
verdad y lo vuelve a arrancar. Falla 11 veces contra el código anterior.
**PRUEBAS QUE PASAN** · 39 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · arena y mazmorras en curso no se guardan,
con el motivo escrito en el código.
**SIGUIENTE** · STEP 8.

---

## STEP 8 — El cuerpo y la zona golpeable dejan de ser el mismo círculo

**ARCHIVOS TOCADOS** · `src/server/58-arena.js`, `build.js`.
**QUÉ SE ARREGLÓ** · `radio` hacía tres trabajos: separar cuerpos, frenar
contra la pared y decidir si un golpe toca. Rozar costaba el golpe entero.
Y `build.js --check` decía "está al día" sobre un archivo que Node no podía
cargar, porque solo comparaba texto.
**QUÉ SE AÑADIÓ** · `golpeable` separado del cuerpo, y comprobación de
sintaxis en la compilación.
**PRUEBAS AÑADIDAS** · `test-arena-hurtbox.js` (17). Falla 8 veces contra el
código anterior.
**MEDICIÓN** · plantado 20 s, seis veces: 478 de vida perdida antes, 484
después. Plantarse cuesta lo mismo; lo que cambia es rozar.
**PRUEBAS QUE PASAN** · 40 archivos.
**SIGUIENTE** · STEP 9.

---

## STEP 9 — Cofre, trampa y santuario se juegan

**ARCHIVOS TOCADOS** · `src/server/58-salas.js` (nuevo), `58-arena.js`,
`59-mazmorras.js`, `src/pages/criptomundo-arena.js`, `criptomundo-mazmorras-pvp.js`.
**QUÉ SE ARREGLÓ** · tres de las seis salas eran una tirada instantánea.
**QUÉ SE AÑADIÓ** · objetivo (un sitio al que ir y aguantar) y peligros
(emisores que avisan y disparan), montados con lo que ya existía. Los
números de botín, curación y daño son los de antes.
**PRUEBAS AÑADIDAS** · `test-mazmorra-salas.js` (29): juega las tres salas
por HTTP.
**PRUEBAS QUE PASAN** · 41 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · el jefe sigue sin mecánica propia. Se
cierra en el STEP 11.
**SIGUIENTE** · STEP 10.

---

## STEP 10 — La economía mide también los objetos

**ARCHIVOS TOCADOS** · `src/server/30-personajes-combate.js`, `50-telemetria.js`,
`40-mundo-mercado.js`, `47-recoleccion-huerto.js`, `48-recursos-mundo.js`,
`58-arena.js`, `59-mazmorras.js`, `60-http.js`, `src/pages/economia.js`.
**QUÉ SE ARREGLÓ** · faltaba la mitad de la economía: objetos creados y
destruidos por hora, precio pagado y volumen de mercado.
**QUÉ SE AÑADIÓ** · contadores en los dos puntos de paso por los que entra y
sale todo objeto, con motivo. Comprar y vender NO cuenta como crear. El
volumen y el precio pagado se derivan del historial de ventas, sin contador
paralelo. Dos tablas nuevas en la página pública.
**PRUEBAS AÑADIDAS** · `test-economia-objetos.js` (44): ejecuta el script de
la página pública en un DOM de mentira contra el servidor real.
**PRUEBAS QUE PASAN** · 42 archivos.
**CORRECCIÓN DE LA AUDITORÍA** · §5.5 decía que había nueve scripts
`aplicar-*.js` muertos. Son ocho y tres son inyectores vivos con su comando
y su prueba. No se borró ninguno.
**SIGUIENTE** · STEP 11.

---

## STEP 11 — El jefe de mazmorra deja de pelear igual todo el combate

**ARCHIVOS TOCADOS** · `src/server/58-salas.js`, `58-arena.js`,
`59-mazmorras.js`, `src/pages/criptomundo-arena.js`.
**QUÉ SE ARREGLÓ** · el jefe era una oleada más.
**QUÉ SE AÑADIÓ** · tres fases. Por debajo del 66 % la guarida despierta y
cuatro emisores barren la sala; por debajo del 33 % llama un refuerzo.
**PRUEBAS AÑADIDAS** · `test-mazmorra-jefe.js` (15): llega a la sala del
jefe despejando la mazmorra y le baja la vida hasta cruzar los umbrales.
**MEDICIÓN** · pegado al jefe sin esquivar: 447 de vida antes, 606 después.
Un 36 % más. La primera versión salía al doble y se bajó a propósito.
**PRUEBAS QUE PASAN** · 43 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · la recompensa del jefe no se subió para
compensar ese 36 %. Es decisión de diseño.
**SIGUIENTE** · STEP 12.

---

## STEP 12 — Morir deja de borrar el trabajo hecho

**ARCHIVOS TOCADOS** · `src/server/30-personajes-combate.js`, `58-arena.js`,
`60-http.js`, `src/pages/criptomundo-combat-2.js`, `criptomundo-mundo2d-3.js`,
`test-movimiento.js`.
**QUÉ SE ARREGLÓ** · al morir se borraba la batalla y el siguiente intento
empezaba contra un bicho intacto: el 41 % del daño del jugador se tiraba.
Y un enemigo podía meter su centro dentro del jugador, que es lo que el
propio proyecto declara que no puede pasar nunca.
**QUÉ SE AÑADIÓ** · el enemigo se cura media vida MÁXIMA y se queda herido.
Que sea fracción del máximo cierra el agujero de matar a un dragón muriendo
cuarenta veces. En la arena, orden de resolución corregido y una
comprobación final que garantiza el invariante.
**PRUEBAS AÑADIDAS** · `test-muerte-progreso.js` (18). Falla 7 veces contra
el código anterior.
**MEDICIÓN** · daño tirado 41 % → 7 %. Ataques a nivel 3: 40–59 → 36–53.
Centros dentro: 8 de 1.320 → 0 de 3.960.
**PRUEBAS QUE PASAN** · 44 archivos.
**SIGUIENTE** · STEP 13.

---

## STEP 13 — El camino de animación de arma, probado por fin

**ARCHIVOS TOCADOS** · `src/server/58-arena.js`, `test-sesiones-persisten.js`.
**QUÉ SE ARREGLÓ** · el código prometía que añadir una animación sería
copiar un archivo, y esa carpeta no existe: el camino no se había ejecutado
nunca. Además, una tira cuyo ancho no fuera múltiplo del alto daba un número
de cuadros equivocado y recortaba medio arma sin avisar.
**QUÉ SE AÑADIÓ** · rechazo de tiras que no cumplen la convención, con aviso
por consola.
**PRUEBAS AÑADIDAS** · `test-sprites-armas.js` (23): fabrica un PNG válido
con zlib y recorre el camino entero.
**PRUEBAS QUE PASAN** · 45 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · el arte sigue faltando. No es un problema
de código.
**SIGUIENTE** · STEP 14.

---

## STEP 14 — La suite baja de 447 a 168 segundos

**ARCHIVOS TOCADOS** · `run-tests.js` (nuevo), `package.json`, las 45 pruebas.
**QUÉ SE ARREGLÓ** · la suite era una cadena de `&&`: el primer fallo tapaba
treinta resultados. Y cada prueba esperaba un tiempo FIJO a que su servidor
arrancara, que es lo que de verdad impedía paralelizar.
**QUÉ SE AÑADIÓ** · lanzador con paralelismo acotado, las tres pruebas que
miden tiempo van solas al final, y cada prueba borra su archivo de datos
antes de empezar.
**PRUEBAS AÑADIDAS** · ninguna nueva; las 45 modificadas.
**MEDICIÓN** · mismo lanzador y mismo resultado: 447 s en serie, 168 s en
paralelo.
**CORRECCIÓN DE LA AUDITORÍA** · §5.7 daba un motivo equivocado (el límite
de registro por IP). Cada prueba arranca su propio servidor.
**SIGUIENTE** · STEP 15.

---

## STEP 15 — Las quince pantallas, ejecutadas de verdad

**ARCHIVOS TOCADOS** · `run-tests.js`.
**QUÉ SE ARREGLÓ** · nada. El barrido no encontró ningún fallo, y eso se
dice tal cual en vez de inventar trabajo.
**QUÉ SE AÑADIÓ** · red de seguridad: que ninguna pantalla reviente al
cargar, que ninguna llame a una ruta que no exista, que todas declaren
viewport con escala inicial y que ningún archivo enlazado dé 404.
**PRUEBAS AÑADIDAS** · `test-paginas.js` (13). Se le inyectaron los cuatro
fallos que dice vigilar y los cuatro salieron en rojo.
**PRUEBAS QUE PASAN** · 46 archivos.
**SE SABE Y NO SE ARREGLA AQUÍ** · la del mundo 2D monta Phaser y necesita
un navegador de verdad; se comprueba lo que sí se puede.
**SIGUIENTE** · STEP 16.

---

## STEP 16 — La regla principal, en los 38 endpoints

**ARCHIVOS TOCADOS** · `run-tests.js`, `test-mazmorra-jefe.js`,
`test-mundo-combate.js`.
**QUÉ SE ARREGLÓ** · dos pruebas intermitentes más, la quinta y la sexta de
la misma familia, que el paralelismo sacó a la luz.
**QUÉ SE AÑADIÓ** · barrido de la FASE 1: a cada endpoint POST se le manda
un cuerpo con todos los campos de resultado imaginables y valores absurdos.
No pegó ninguno. Se le abrió un agujero a propósito y saltó por dos sitios.
**PRUEBAS AÑADIDAS** · `test-autoridad-servidor.js` (28).
**PRUEBAS QUE PASAN** · 47 archivos.
**SIGUIENTE** · STEP 17.

---

## STEP 17 — Una partida entera

**ARCHIVOS TOCADOS** · `run-tests.js`.
**QUÉ SE ARREGLÓ** · nada del juego. Los tres fallos que salieron al
escribir la prueba eran de la prueba.
**QUÉ SE AÑADIÓ** · el viaje completo en una sola partida de 30 segundos:
registrarse, recolectar, fabricar, equipar, subir de nivel, misión, arena,
mazmorra, mercado con dos personas y PvP.
**PRUEBAS AÑADIDAS** · `test-partida-completa.js` (38).
**PRUEBAS QUE PASAN** · 48 archivos · 1.218 comprobaciones · 0 fallos.
**HALLAZGO** · no hay ninguna misión para la araña, que es el primer enemigo
de todos. Es contenido que falta, no un fallo.
**SIGUIENTE** · lo que queda es decisión de diseño. Ver abajo.

---

## Lo que queda, y por qué no lo he hecho yo

Tres cosas, y ninguna es un arreglo pendiente.

**1. El nivel de dificultad.** El ruido del arranque está quitado y medido,
pero cuán duro debe ser el juego es una decisión tuya. Las dos cifras sobre
la mesa: llegar a nivel 3 cuesta de 36 a 53 ataques con 2 a 5 muertes, y el
jefe de mazmorra cuesta un 36 % más de vida que antes del STEP 11 sin que su
recompensa haya subido.

**2. Contenido que falta.** No hay misión para la araña, que es contra lo
que pelea todo el mundo al empezar: se matan seis para llegar a nivel 3 y no
cuentan para nada. Añadirla es escribir contenido, no arreglar código.

**3. El arte.** Tres objetos del catálogo tienen dibujo propio y el resto son
emoji; una skin de siete tiene animación de caminar; no hay ninguna
animación de arma. El mecanismo que las espera está comprobado y funciona
(STEP 13), así que es dejar los archivos en su sitio. Yo no puedo dibujarlos.

**Y una cosa que NO está hecha a propósito:** la cadena de bloque. La FASE 18
dice que CGRID se queda off-chain y así sigue, con su tope diario y su
auditoría, y la página pública lo dice con todas las letras.
