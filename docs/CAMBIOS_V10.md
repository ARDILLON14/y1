# CriptoMundo v10 — Zarigüeya Laureada y skins animadas

## El personaje

Séptima skin: **Zarigüeya Laureada**, *"pequeña, oportunista y coronada; se hace la muerta y luego te roba el oro"*. Recortada de la lámina que subiste en tres tamaños, como las demás:

| Variante | Uso | Peso |
|---|---|---|
| `full` (500 px alto) | Vista previa del creador | 471 KB |
| `portrait` (256×256) | Rejilla de aspectos y perfil | 141 KB |
| `avatar` (96×96) | Barra superior | 23 KB |

## Lo que trajo de nuevo: animación

La lámina incluía una fila de caminar, así que esta es la primera skin **animada**. De los cuatro fotogramas de la lámina se usaron los tres limpios; el cuarto quedaba cortado por el borde y se descartó. Se montaron en una tira uniforme de 140×70 por fotograma (45 KB).

El campo `sprites` que quedó propuesto en `COMO_AGREGAR_SKINS.md` desde la v3 ahora existe de verdad:

```js
sprites: { walk: { file: 'laurel_possum_walk.png', frames: 3, ancho: 140, alto: 70 } }
```

Y se usa en dos sitios:

- **Creador de personaje**: bajo la ilustración se ve la caminata en bucle, para hacerse idea de cómo se verá en el mapa.
- **Mapa 2D**: el jugador dejó de ser un emoji fijo. Ahora carga la tira de su skin, se anima al moverse, se para al soltar el mando y se voltea al ir hacia la izquierda.

**Nada se rompe sin animación.** Las skins que no traen `sprites` siguen mostrando su emoji en el mapa, exactamente como antes. Si la tira no llega a cargarse, se queda el emoji. El campo es opcional en toda la cadena.

## Estado

209 → **218 pruebas**, todas en verde. Las nuevas comprueban que la zarigüeya está en el catálogo, que declara fotogramas y medidas, que la tira se sirve, que se puede elegir, que el mapa la usa y que las skins sin animación devuelven `null` en lugar de romper.

## Nota sobre las láminas

Tu lámina traía mucho más de lo que se ha usado: expresiones faciales, poses de correr y saltar, monedas, rocas, estelas de movimiento. Ahí hay material para una animación de correr, retratos de diálogo por emoción y decorado del mapa. No lo he metido porque cada pieza necesita saber dónde va a aparecer, y eso son decisiones de diseño que prefiero tomar viendo el juego en marcha y no adivinando. Cuando quieras cualquiera de ellas, el sitio ya está preparado: un campo más en `sprites`.
