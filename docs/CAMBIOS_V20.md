# CriptoMundo v20 — Arreglos de la partida reportada y sistemas nuevos

Trabajo hecho sobre la v19 tras una sesión de juego real. Cada punto se
verificó ejecutando el juego, no leyendo el código.

## A) Errores encontrados y su causa

| # | Síntoma que reportaste | Causa real |
|---|---|---|
| 1 | No se podía ir al bosque ni a las minas | El mapa usa `bosque`/`minas`/`ruinas`; el servidor los tenía como `forest`/`mines`/`ruins`. Cada viaje devolvía "Zona desconocida" y el cambio de zona se abortaba **en silencio** |
| 2 | No aparecían enemigos | Consecuencia del #1: los monstruos viven en bosque, minas y ruinas, y el jugador quedaba encerrado en el pueblo, que no tiene ninguno |
| 3 | Las minas parecían bloqueadas | Además del #1, se exigía nivel 5 para *viajar*, no para pelear |
| 4 | No se podía conseguir agua | El agua solo existía en el inventario inicial (10 unidades). **Nada** la soltaba. Al gastarla, las pociones quedaban bloqueadas para siempre |
| 5 | (No reportado, encontrado de paso) | El **trigo** no lo daba absolutamente nada: la receta del pan era imposible desde el primer minuto |
| 6 | No se podían equipar los objetos fabricados | El endpoint `/api/player/equip` existía y funcionaba, pero **ninguna pantalla del juego lo llamaba**. Tampoco había forma de beber una poción fuera de combate |
| 7 | La misión no se podía aceptar desde el NPC | El diálogo del mapa era texto fijo, sin conexión con el sistema de misiones |
| 8 | El contador de bajas no subía | El HUD leía `PLAYER.kills`, una variable del navegador que dejó de actualizarse cuando el combate pasó al servidor |
| 9 | Skins que dejan al personaje como un cuadro | `holy_pepe` y `stone_pepe` tienen **alfa 255 en todo el lienzo**: son rectángulos opacos con el fondo incrustado. Además nada validaba una skin antes de usarla |
| 10 | Se podía comprar lo propio en el mercado | **No reproducido.** El servidor ya lo impedía y no se puede engañar mandando otro `sellerId`. Lo que faltaba era que la interfaz lo dijera antes de intentarlo |

## B) Solución aplicada a cada uno

1-3. Tabla de alias de zona en el servidor y **viajar deja de bloquearse por nivel**: se permite ir y se avisa de que los enemigos superan al jugador. El botón ya no parece roto.
4-5. **Sistema de recolección**: pozo, río, charca, trigal, herbario y veta, cada nodo con su enfriamiento por jugador y por zona. El pozo y la charca dan agua; el trigal, trigo.
6. **Panel real de inventario y equipo en el perfil**, con ficha de cada objeto y botones que llaman al servidor. Nuevo endpoint `/api/player/use` para consumibles fuera de combate. El inventario ahora devuelve, por objeto: dónde se equipa, qué estadísticas da, si es consumible, si se vende y en qué recetas se usa.
7. El NPC consulta sus misiones al servidor y muestra **"ACEPTAR MISIÓN"** con objetivos y recompensas. Queda en la misma lista que la pantalla de misiones: no hay dos registros.
8. El HUD lee las bajas del servidor y se refresca cada 8 segundos y al volver a la pestaña.
9. **Validación de skins al arrancar**: se leen las medidas del PNG y se retira del catálogo cualquiera cuyo archivo falte o cuya tira de animación no cuadre con los fotogramas declarados. Las ilustraciones con fondo opaco se marcan como no usables sobre el mundo (en el mapa se usa el icono, no un rectángulo). La carga de skins en el mapa va envuelta en protecciones: cualquier fallo cae al emoji en lugar de congelar el bucle del juego.
10. Marca visible **"TU PUBLICACIÓN"** en el mercado.

## C) Sistemas nuevos

- **Recolección** (`/api/gather`): 7 nodos por zona con enfriamiento propio, botín por probabilidad, XP y progreso de misiones.
- **Huerto** (`/api/farm`): parcelas (4 + 1 por nivel de casa), 3 semillas, crecimiento en **tiempo real del servidor** (no se puede acelerar desde el cliente), cosecha con devolución parcial de semillas para que no se agote. Las semillas son objetos reales del inventario.
- **Perfil completo** (`/api/profile`): nivel, clase, XP, estadísticas efectivas, equipo, minutos jugados, días activos y contadores reales de bajas, jefes, mazmorras, muertes, objetos fabricados, recursos recolectados, cosechas, consumibles usados, misiones y PvP.
- **12 medallas** calculadas a partir de esos contadores. No se guardan por separado a propósito: así no pueden desincronizarse de los hechos.

## D) Archivos

Nuevos: `src/server/47-recoleccion-huerto.js`, `test-arreglos-v20.js`, este documento.
Modificados: `20-skins.js`, `30-personajes-combate.js`, `40-mundo-mercado.js`, `45-primeros-pasos.js`, `60-http.js`, `criptomundo-mundo2d-2.js`, `criptomundo-perfil.js`, `criptomundo-mercado.js`, `test-misiones-mundo.js`, `package.json`.

## E) Pruebas

- Suite nueva `test-arreglos-v20.js`: **45 comprobaciones** sobre los diez puntos de arriba.
- Regresión completa: **306 pruebas** en trece suites, todas en verde.
- Flujo de juego completo ejecutado contra el servidor: crear personaje → viajar a bosque y minas → combatir → XP y baja contada → fabricar → equipar → aceptar misión → conseguir agua → sembrar → cosechar → hacer pan y pociones → vender → comprobar que no se compra lo propio → perfil y medallas → cambiar de skin. **17 de 17.**

## F) Lo que NO está hecho

- **Combate en tiempo real tipo Terraria.** No es un módulo más: es un motor con proyectiles, retroceso, colisiones e IA por enemigo. Semanas de trabajo, no una sesión.
- **Reescritura de mazmorras** con salas, encuentros y jefes. Depende del punto anterior: sin el combate nuevo, sería otra vez pulsar "Avanzar".
- **Subir un personaje propio.** Necesita subida de archivos, validación, recorte a sprite y almacenamiento; hoy el servidor solo sirve estáticos, no recibe ficheros.
- Quitar el fondo de las ilustraciones pepe: lo intenté con dos algoritmos y ambos destrozan el dibujo. La solución honesta era no usarlas como sprite del mundo.
