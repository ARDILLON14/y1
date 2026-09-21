# Cambios v30 — revisión profunda y recolección física

Todo lo de aquí está comprobado ejecutando el juego, no leyendo el
código. La batería completa (`npm test`) pasa **481 comprobaciones en 18
archivos, 0 fallos**.

---

## Cómo se hizo el diagnóstico

Antes de tocar nada se montaron dos herramientas que no existían:

- **`revisar-cliente.js`** compila el JavaScript que el servidor manda
  de verdad al navegador, página por página. Las pruebas que ya había
  comprobaban que una página *contenía* ciertos textos, nunca que se
  pudiera *ejecutar*.
- **Un navegador simulado (jsdom)** que carga la arena con una sesión
  real, pulsa teclas y ataca, para separar "roto en el servidor" de
  "roto en la pantalla".

El resultado cambió el plan: **el servidor estaba mucho mejor de lo que
parecía desde el juego. Casi todo lo que fallaba, fallaba en el cliente.**

---

## Fallos críticos corregidos

### La página de mazmorras estaba muerta, no "bugueada"

Dos líneas tenían un escape mal puesto (`entrar(\'` en vez de
`entrar(\\'`). El template literal se comía una barra y el navegador
recibía JavaScript inválido, así que **el script entero de la página
moría al cargar**. Por eso solo respondía el botón de avanzar: era lo
único que no dependía de ese script.

### La pestaña PvP llamaba a una función inexistente

`setMode()` se invocaba desde dos botones y no estaba definida en
ninguna parte: pulsarla lanzaba un `ReferenceError`. Ahora existe.
El PvP jugable sigue pendiente (fase 13); la pestaña no finge tenerlo.

### El combate no estaba roto: estaba sordo

La arena funciona (32 pruebas de servidor y 11 de cliente lo confirman).
El problema es que vive dentro de `#game-iframe` y **nadie enfocaba
nunca ese iframe**: los `keydown` se los quedaba la ventana de fuera.
De ahí que fuera intermitente — bastaba tocar el chat del launcher para
perder el control del personaje.

Corregido por tres vías a la vez, a propósito:

1. el launcher enfoca el iframe al cargar un módulo y al pulsarlo;
2. reenvía las teclas de juego por `postMessage`;
3. cada pantalla acepta esas teclas igual que las reales.

El estado del teclado es un booleano por dirección, así que recibir la
misma tecla dos veces no hace daño. El mundo usa Phaser, que escucha
eventos reales, así que allí el mensaje se reconvierte en `KeyboardEvent`.

### El equipamiento funcionaba, pero era inalcanzable

`effectiveStats()` sumaba el equipo correctamente, pero el personaje
nuevo **no arrancaba con ningún objeto equipable**. Ahora empieza con
daga, casco, botas, hacha y pico.

---

## Sistemas nuevos

### §7/§9 Recolección física — `src/server/48-recursos-mundo.js`

Se acabó el "ir al bosque → abrir el huerto → reclamar madera". Ahora
hay un árbol con vida, un hacha equipada y golpes que se la quitan.
Cuando cae, la madera entra al inventario de verdad.

Toda la simulación va en el servidor: el cliente solo dice "golpeo este
nodo". Mandar mil peticiones no hace caer más madera.

**El huerto antiguo no se ha tocado.** Sigue funcionando igual, en
paralelo, tal como se pidió.

### §8 Seis maderas · §9 siete minerales

Cada una con su rareza, valor y dureza. La rareza es funcional: los
materiales altos solo salen de nodos que exigen mejores herramientas.

### §10 Picos y hachas fabricados por piezas

Mango + cabeza. **Las estadísticas no están escritas a mano: se
calculan.** 3 mangos × 4 cabezas × 2 tipos = 24 herramientas generadas.
Añadir un mango nuevo crea automáticamente ocho herramientas más.

Comprobado en las pruebas: misma cabeza con mejor mango da más poder,
más durabilidad y mejor rareza; mejor cabeza sube el nivel de minería.

Las recetas se insertan en el sistema de crafteo que ya existía: cero
motor nuevo.

### §4 Ranura de herramienta propia

El pico y el hacha no ocupan la mano del arma: se llevan a la vez.

### §5 Hotbar de 8 ranuras

**No guarda objetos: guarda referencias al inventario real.** Si el
objeto se gasta o se vende, la ranura se vacía sola. Así no puede
existir una segunda copia falsa del inventario.

### §13 Escalera de pociones

De I a V más un elixir mítico, con las curaciones definidas en datos y
no en la interfaz. Caen de enemigos acordes a su nivel.

### §19 Una sola fuente de verdad

`/api/inventory` devolvía el nombre y el icono copiados dentro del
objeto al fabricarlo, así que retocar una plantilla no cambiaba los
objetos existentes. Ahora se leen siempre de la plantilla.

---

## Atascos de diseño encontrados de paso

- **La colmena** daba 1–3 de miel, pero la única receta con miel pide 2:
  una de cada tres visitas dejaba al jugador esperando 3 minutos de
  enfriamiento sin poder fabricar. Mínimo subido a 2.
- **El primer pico era imposible**: la cabeza de piedra pide piedra, y
  la piedra solo sale de rocas que piden un pico. Se arranca con
  herramientas básicas.

---

## Lo que sigue sin existir

Verificado endpoint por endpoint: **parcelas manuales en el mundo,
almacén de la casa, intercambio entre jugadores y PvP jugable**. Son
construcción nueva (fases 8, 12 y 13), no reparación.

**La recolección física y la hotbar están completas y probadas en el
servidor, pero todavía no tienen interfaz en el mundo 2D.** Se pueden
usar por API, no con el ratón. Ese es el siguiente paso.

---

## Pruebas nuevas

- `test-revision.js` — 25 comprobaciones con las preguntas literales
  del §22 ("¿puedo moverme?", "¿cambia mi ataque?").
- `test-recursos.js` — 47 comprobaciones de talar, picar, forjar y
  hotbar, incluyendo que no se puede hacer trampa.

Ambas están en `npm test`.
