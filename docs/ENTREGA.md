# CriptoMundo v31 → v32 · Entrega por pasos

Este documento es el parte de trabajo en el formato pedido: un bloque por
paso, con lo que se tocó, lo que se arregló, lo que se añadió, las pruebas
y lo que quedó sabido y sin hacer.

La foto de partida está en `docs/AUDITORIA_V31.md` y no se reescribe: sirve
para comparar. El relato largo de cada cambio, con el porqué, está en
`CHANGELOG.md`.

**Estado al cerrar:** 53 archivos de prueba · 1.349 comprobaciones · 0 fallos
· ~193 s con `npm test`.

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

## STEP 18 — El juego premiaba dejarse matar

**ARCHIVOS TOCADOS** · `src/server/30-personajes-combate.js`, `60-http.js`.
**QUÉ SE ARREGLÓ** · no existía ninguna forma de recuperar vida salvo
morir. Un nivel 1 mata a una araña en 5,2 turnos y muere en 12,5 —o sea
que una pelea la gana— pero cada araña le cuesta 478 de vida y entre
combate y combate no recuperaba nada. Morir costaba el 8 % del oro y
devolvía media vida; una poción, 20 de oro por 220. El juego premiaba
dejarse matar.
**QUÉ SE AÑADIÓ** · recuperación fuera de combate, 1 % del tope cada
segundo y medio. No se regenera con una batalla abierta ni dentro de la
arena. No se ha tocado el daño, ni la vida, ni los monstruos.
**PRUEBAS AÑADIDAS** · `test-descanso.js` (14). Falla 5 veces contra el
código anterior.
**MEDICIÓN** · peleando sin parar, las muertes se quedan igual dentro del
ruido (3,3 y 4,3 de media en tandas de tres). Descansando un minuto entre
peleas, bajan a 0,3. Ninguna pelea es más fácil; lo que cambia es que
descansar sirve para algo.
**EL PRIMER INTENTO ESTUVO MAL** · 1 % cada cuatro segundos daba 57 de
vida en veinte segundos contra los 478 que cuesta una araña. El mecanismo
estaba bien y el número no; se ancló a lo que cuesta una pelea.
**PRUEBAS QUE PASAN** · 49 archivos.
**SIGUIENTE** · STEP 19.

---

## STEP 19 — La araña ya tiene misión

**ARCHIVOS TOCADOS** · `src/server/40-mundo-mercado.js`,
`test-partida-completa.js`.
**QUÉ SE ARREGLÓ** · la araña es el primer enemigo de todos y no tenía
misión: se matan seis para llegar a nivel 3 y no contaban para nada. La
primera misión que veía un recién llegado era matar ocho trolls.
**QUÉ SE AÑADIÓ** · «Las Arañas del Sendero», cinco arañas, nivel 1, la
primera de la lista. Cinco porque llegar a nivel 3 cuesta seis: se
completa justo antes de subir. La recompensa lleva tres pociones a
propósito, que es lo que le falta a un nivel 1 en ese punto exacto.
**PRUEBAS AÑADIDAS** · `test-primera-mision.js` (20). Falla 3 veces
contra el código anterior.
**HALLAZGO** · al aceptar una misión, el progreso se siembra con lo que
YA habías hecho, así que la de las arañas nace completa si vienes de
subir a nivel 3 matándolas. Está bien que sea así, pero significa que
«pelear la hace avanzar» no siempre se puede observar.
**PRUEBAS QUE PASAN** · 50 archivos.
**SIGUIENTE** · STEP 20.

---

## STEP 20 — El arte, convertido en una lista

**ARCHIVOS TOCADOS** · `revisar-arte.js` (nuevo), `run-tests.js`,
`test-arena-ventanas.js`, `package.json`, `README.md`.
**QUÉ SE ARREGLÓ** · nada del juego. Y una prueba que fallaba dentro de
la suite y pasaba suelta, por dos motivos encadenados: medía milisegundos
encima de la cola de servidores de la tanda anterior, y preguntaba cada
100 ms por un suceso que vive exactamente un paso de 100 ms.
**QUÉ SE AÑADIÓ** · `npm run arte`: la lista de arte que falta, con
nombre, carpeta, medidas y qué pasa hoy sin cada archivo, ordenada por lo
que más se nota. Y la comprobación inversa: si un dibujo no mide lo que
declara su ficha, lo canta.
**MEDICIÓN** · 10 archivos puestos, 77 por hacer, 0 rotos.
**SE COMPROBÓ QUE DETECTA** · se le metieron los dos casos rotos a
propósito y los dos salieron con su nombre y su motivo. *(Corregido en el
STEP 23: los dos casos eran de skin, y el camino de los objetos estaba
roto y sin probar.)*
**LECCIÓN** · al cambiar el ritmo del sondeo se rompió una comprobación
que decía «el daño llega como mucho tres pasos después del gesto». Los
pasos dependen de cada cuánto pregunte la prueba, no del juego. Ahora está
escrita en milisegundos.
**PRUEBAS QUE PASAN** · 50 archivos · 1.254 comprobaciones · 0 fallos.
**SIGUIENTE** · nada pendiente por mi parte. Ver abajo.

---

## STEP 21 — La dificultad estaba en dos mecánicas que nadie contaba

**ARCHIVOS TOCADOS** · `src/server/45-primeros-pasos.js`,
`src/server/50-telemetria.js`, `src/server/30-personajes-combate.js`,
`src/server/60-http.js`, `src/pages/criptomundo-combat-2.js`,
`test-ensenar-combate.js` (nuevo), `run-tests.js`,
`test-arena-ventanas.js`.

**QUÉ SE COMPROBÓ ANTES DE TOCAR NADA** · el proyecto trae tres
herramientas de diagnóstico propias y no se había ejecutado ninguna.
`revisar-codigo-muerto`: nada. `revisar-materiales`: todas las recetas se
pueden completar; solo sobra un objeto del catálogo que no pide nadie, el
Corazón de Savia. `banco-balance` es la que importa: un robot que
**bloquea el golpe anunciado y se cura por debajo de un tercio de vida**
gana el **100 %** de las peleas del juego, jefes incluidos, y termina con
entre el 43 % y el 94 % de vida. En las arenas, igual. Y las mediciones
del arranque dicen que un nivel 1 que no hace esas dos cosas muere cuatro
veces antes de llegar al nivel 3.

**DIAGNÓSTICO** · la dificultad de CriptoMundo no estaba en sus números.
Estaba en dos mecánicas, y el tutorial tenía once pasos y no mencionaba
ninguna. El bloqueo se enseñaba a medias —la pantalla resalta el botón
cuando el enemigo anuncia—; beber no se enseñaba en absoluto.

**QUÉ SE AÑADIÓ** · dos pasos de primeros pasos (`p_bloquear` y
`p_pocion`, 120 oro cada uno) justo detrás del de combatir; sus dos
sucesos en el embudo (`first_block`, `first_potion`), que hasta ahora no
se podían medir; y un aviso de vida baja en el combate por turnos, que
cede el sitio al aviso de golpe anunciado cuando coinciden.

**NO SE TOCÓ NI UN NÚMERO DE COMBATE.** A propósito: el problema medido
era de enseñanza, no de equilibrio.

**PRUEBAS AÑADIDAS** · `test-ensenar-combate.js` (15).

**TRES FALLOS MÍOS, ENCONTRADOS Y ARREGLADOS**
- Escribí `out.usoObjeto` antes de declarar `out`: beber en combate
  devolvía «Cannot access 'out' before initialization». Roto del todo.
- El aviso de vida baja leía `PLAYER`, que no existe en todos los
  ámbitos: un `ReferenceError` por fotograma se llevaba por delante la
  pantalla de turnos entera. Ahora la vida máxima la manda el servidor
  con cada turno.
- El lanzador decía «0 fallidas» con un archivo en rojo: un archivo que
  revienta no imprime resumen, así que sumaba cero. Ahora se cuentan
  aparte y se nombran.

**Y UNO QUE NO ERA MÍO** · `test-arena-ventanas` fallaba por un motivo
que no era el que supuse dos veces. Instrumentándolo: cada sondeo mandaba
`atacar: false`, que llegaba antes del paso de 100 ms del servidor y
**cancelaba el ataque**. La prueba se estaba peleando con su propia
intención.

**PRUEBAS QUE PASAN** · 51 archivos · 1.269 comprobaciones · 0 fallos.
**SIGUIENTE** · STEP 22.

---

## STEP 22 — Seis de los siete aspectos se deslizaban

Este es de los que pide la FASE 22: explicar antes de tocar.

**COMPORTAMIENTO ACTUAL** · en el mapa, el personaje es un emoji al que
al moverse solo se le cambia la posición y se le voltea a izquierda o
derecha. Se desplaza como una pieza de ajedrez. Lo mismo los demás
jugadores.

**PROBLEMA** · `npm run arte` dice que faltan 77 dibujos y que los seis
que más se notan son las animaciones de caminar. Solo la Zarigüeya
Laureada tiene tira de fotogramas.

**CAUSA RAÍZ** · no es que falte arte. La animación se escribió como «si
hay tira, reprodúcela», y el camino de al lado —el que se recorre casi
siempre— no tiene respaldo: no hay nada. Y había un dato desperdiciado:
el cliente manda `anim` (walk o idle) con cada pulso del mundo compartido
y el servidor lo devuelve con cada vecino desde que ese sistema existe.
La pantalla nunca lo leyó.

**ARREGLO PROPUESTO** · un respaldo procedural. No dibuja piernas —eso
son 77 archivos que no puedo hacer yo— pero mueve el cuerpo como se mueve
al andar: sube y baja con cada apoyo, se ladea hacia la pierna que pisa,
se achata al plantar el pie y la sombra se estrecha cuando el cuerpo está
arriba. Se apaga solo en cuanto un aspecto traiga su tira de verdad.

**ARCHIVOS TOCADOS** · `src/pages/criptomundo-mundo2d-andar.js` (nuevo),
`src/pages/criptomundo-mundo2d-2.js`, `src/pages/criptomundo-mundo2d-5.js`,
`build.js`, `run-tests.js`, `test-andar.js` (nuevo), `README.md`,
`CHANGELOG.md`.

**QUÉ SE ARREGLÓ** · el deslizamiento, en tu personaje y en el de los
demás. Y de paso el `anim` que el servidor mandaba y nadie leía.

**QUÉ SE AÑADIÓ** · `pasoAndar`, `pasoAndarNuevo` y `pasoAndarPintar`, en
su propio módulo. Son función pura más aplicador: por eso se pueden
probar sin navegador.

**TRES DECISIONES, Y POR QUÉ**
- La cadencia la marca la **distancia recorrida**, no el reloj. Con un
  temporizador, andar despacio con el mando táctil se vería como patalear
  en el sitio. Está anclada a las nubecillas de polvo: un apoyo por
  nubecilla a velocidad máxima.
- La cámara sigue al personaje, así que el bote del cuerpo se lo comía el
  encuadre y **temblaba el mapa entero**. El desvío de la cámara le
  descuenta exactamente lo que sube el cuerpo.
- La etiqueta con el nombre de los vecinos **no bota**: un nombre
  temblando encima de la cabeza se lee peor.

**DOS FALLOS MÍOS, ENCONTRADOS POR LA PRUEBA**
- El apagado era exponencial y no terminaba nunca: medido, el cuerpo
  seguía botando **1.072 ms** después de soltar la tecla, seis veces lo
  que decía la constante que se llama «apagado». Ahora sube y baja a
  ritmo constante y se posa en los 180 ms que anuncia.
- El desvío de la cámara solo se ponía en el camino del respaldo. El
  aspecto se carga por la red y llega tarde, así que el respaldo corre un
  rato antes: sin ponerlo también a cero, el encuadre se quedaba torcido
  hasta 3 px para siempre.

**PRUEBAS AÑADIDAS** · `test-andar.js` (50). Contra el código anterior se
para en la cuarta comprobación: el módulo no existe.

**SE COMPROBÓ QUE DETECTA** · se cambió la cadencia a que la marcara el
reloj en vez de la distancia. Saltaron exactamente las dos comprobaciones
que dicen medirlo, y ninguna otra.

**LO QUE NO SE PUEDE PROBAR, Y NO SE FINGE** · que quede bonito. Lo que
se prueba es lo que sí se puede: que quieto sea exactamente quieto, que
al parar vuelva al reposo y se quede ahí, que la cadencia dependa de la
distancia, que el balanceo no dé un salto al envolverse la fase, que los
números estén acotados, que la basura de entrada no salga como NaN a la
pantalla, y que los vecinos lo usen de verdad.

**SE SABE QUE** · empujando contra una pared el cuerpo se posa en vez de
seguir andando en el sitio, porque la cadencia es por distancia y ahí no
se recorre nada. Es defendible y es lo que hace este diseño; si se
prefiere lo contrario, la condición está en una sola línea.

**PRUEBAS QUE PASAN** · 52 archivos · 1.319 comprobaciones · 0 fallos.
**SIGUIENTE** · nada pendiente por mi parte. Ver abajo.

---

## STEP 23 — Repaso literal de las 24 fases, y lo que apareció

**POR QUÉ** · se preguntó si estaba todo. En vez de contestar de memoria
se releyó el encargo original fase por fase y se comprobó cada punto
contra el código. Aparecieron tres cosas.

**ARCHIVOS TOCADOS** · `src/server/40-mundo-mercado.js`,
`src/server/60-http.js`, `revisar-arte.js`, `test-tiempo-sin-mirar.js`
(nuevo), `run-tests.js`, `README.md`, `CHANGELOG.md`.

### 1. Un fallo de verdad: el mercado se quedaba el objeto al caducar

**COMPORTAMIENTO ACTUAL** · al publicar, el objeto SALE del inventario
(escrow). Cancelar lo devuelve; vender se lo entrega al comprador.

**PROBLEMA** · caducar no hacía ninguna de las tres cosas. El objeto se
quedaba dentro de la publicación **para siempre** y el vendedor lo perdía
sin que nadie se lo dijera. Y había un segundo lado: el estado solo
pasaba a `EXPIRED` dentro de `buyListing`, o sea **solo si alguien
intentaba comprar**. Una publicación caducada a la que nadie picara
seguía anunciándose en la tienda como comprable, porque la tienda filtra
por `status === 'ACTIVE'`.

**CAUSA RAÍZ** · la caducidad se escribió como una comprobación dentro de
la compra, no como un estado del mercado. Nadie barría nada.

**ARREGLO** · `caducarListing` / `devolverEscrow` / `barrerMercado`. El
barrido corre una vez por minuto y además al entrar en la tienda, así que
nadie tiene que pasar por allí para que a un vendedor le vuelva lo suyo.
Devolver puede fallar (inventario lleno, vendedor no cargado): en ese
caso se deja pendiente y se reintenta, en vez de tirar el objeto, que era
el fallo que se estaba arreglando. Las publicaciones de arranque
(`npc: true`) nunca salieron del inventario de nadie y no se les inventa
nada.

**COMPATIBILIDAD** · una partida guardada de antes trae caducadas a las
que nunca se les devolvió nada. El primer barrido se las devuelve, porque
`escrowDevuelto` sin poner cuenta como «sin devolver».

### 2. Cuatro flujos de la FASE 21 que no tenían prueba

`market · expiration`, `farming · offline growth`, `farming · duplicate
harvest` y `farming · invalid seed`. Los tres últimos **ya funcionaban**;
simplemente nadie lo había comprobado nunca. El primero no funcionaba.

**PRUEBAS AÑADIDAS** · `test-tiempo-sin-mirar.js` (30). Los cuatro
comparten la misma dificultad —no se ven sin dejar pasar el tiempo— así
que el tiempo se deja pasar de la única manera honesta que cabe en una
prueba: se para el servidor, se envejecen los datos en disco y se vuelve
a arrancar. Contra el código anterior fallan **5** comprobaciones, todas
de caducidad; las del huerto pasan, que es justo lo que dice el párrafo
de arriba.

### 3. La FASE 14 pedía dos cosas que no se comprobaban

**Transparencia.** La fase la nombra y `revisar-arte.js` no la miraba. Un
PNG sin canal alfa se pinta con su fondo: sobre el mundo, un rectángulo
de color alrededor del dibujo. Ahora se lee el tipo de color del PNG y se
canta.

**Anclaje.** La fase dice, con estas palabras, «nunca asumir que todos
los sprites tienen el mismo anchor». El mecanismo existe —cada arma puede
declarar su `empunadura` y su `spriteAngulo`, y el dibujante los usa— pero
**ninguna arma los declara**: las tres caen al mismo valor por defecto,
que es exactamente la suposición que la fase prohíbe. Con tres espadas
parecidas se aguanta; con un arco o un martillo se nota en la mano.
`npm run arte` ahora lo nombra arma por arma. No he inventado valores: no
se pueden elegir sin mirar cada dibujo.

**Y UN FALLO MÍO DEL STEP 20** · el lector del catálogo de objetos iba
línea a línea, y las tres espadas con dibujo propio son justo las fichas
partidas en dos líneas. Resultado: `revisar-arte` se saltaba exactamente
las fichas que tenían arte. Decía «10 archivos puestos» y los diez eran
de skins; **ni un solo PNG de objeto se había comprobado nunca**, y la
comprobación de detección del STEP 20 pasó porque los dos casos rotos que
le metí eran de skin. Ahora cuenta llaves en vez de líneas: 13 puestos, y
los dos casos rotos inyectados sobre un objeto salen con su nombre.

**PRUEBAS QUE PASAN** · 53 archivos · 1.349 comprobaciones · 0 fallos.
**SIGUIENTE** · ver abajo.

---

## Lo que queda, y por qué no lo he hecho yo

Los tres puntos que quedaban se han atacado. Lo que sigue abierto es más
corto y más claro.

**Dibujar el arte.** 77 archivos, y no puedo hacerlos yo. `npm run arte`
dice cuáles, dónde y con qué medidas, y avisa si lo que se deja no mide lo
que debe. Lo que sí se ha podido hacer es que la falta se note menos: seis
de las siete skins ya no se deslizan, porque el cuerpo se mueve al andar
aunque no haya piernas dibujadas (STEP 22). El dibujo sigue faltando; el
movimiento ya no.

**Decidir si el equilibrio está donde lo quieres.** Yo he quitado el ruido
y he cerrado el bucle que faltaba, pero no he movido la dificultad hacia
arriba ni hacia abajo, y hay dos números que siguen esperando una decisión
tuya:

- El jefe de mazmorra cuesta un 36 % más de vida desde el STEP 11 y su
  recompensa no ha subido. O se sube, o se deja y es más duro a propósito.
- La recuperación fuera de combate va a 1 % cada segundo y medio. Está
  anclada a lo que cuesta una pelea, pero es un dial: sube o baja
  `REGEN_CADA_MS` en `30-personajes-combate.js` y `npm test` te dice si
  algo se rompe.

**Y una cosa que NO está hecha a propósito:** la cadena de bloque. La FASE
18 dice que CGRID se queda off-chain y así sigue, con su tope diario y su
auditoría, y la página pública lo dice con todas las letras.
