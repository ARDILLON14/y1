# CriptoMundo v8 — Que funcione en el móvil

## Por qué esto y no otra cosa

La v7 dejó listo el sistema de invitaciones para meter a diez personas. Al revisar qué pasaría cuando esas diez abran el enlace, salió un problema que no estaba en ninguna lista: **las nueve páginas del juego tienen tres columnas fijas de 260 a 300 píxeles**. En una pantalla de 380 px eso deja el contenido central en unos 40 px. La página no es incómoda: es inutilizable.

Y la mayoría de la gente a la que mandes un enlace por Discord o WhatsApp lo va a abrir en el teléfono. Era un blocker para la beta, no una mejora estética.

## Qué se hizo

Un bloque de CSS móvil compartido en las 13 páginas:

- **Las tres columnas se apilan** en vertical. Las barras laterales pasan a bloques con altura acotada en lugar de columnas.
- **Las alturas atadas a la ventana** (`calc(100vh - …)`) pasan a automáticas, que en móvil es lo que hace falta.
- **Las barras superiores envuelven** en vez de desbordarse.
- **Las rejillas** bajan su mínimo para que quepan dos elementos por fila.
- **Ningún botón por debajo de 40 px de alto**, que es el mínimo razonable para un dedo.
- **Los diálogos** se acotan al 94 % del ancho.

En el launcher, además: el chat pasa a pantalla completa (una columna de 320 px sobre el juego no tiene sentido en un móvil), Primeros pasos pasa de ventana flotante a barra inferior para no tapar nada, y de la barra superior se ocultan las piezas prescindibles.

## Un script, no trece copias

`aplicar-css-movil.js` inyecta el bloque en todas las páginas, delimitado por marcas. Se edita en un sitio y se vuelve a ejecutar; sustituye el anterior en lugar de acumular copias. Si se hubiera pegado a mano en trece archivos, en dos semanas habría trece versiones distintas.

```bash
npm run css-movil    # aplica y recompila
```

## El launcher, partido en dos

`src/pages/index.js` había pasado de 70 KB, el límite que la propia suite de compilación vigila. Está partido en `index.js` (estructura y estilos) e `index-2.js` (lógica), de 34 KB cada uno. La prueba que lo detectó hizo su trabajo: existía justamente para que ningún archivo volviera a ser inmanejable.

## Lo que estas pruebas no pueden decirte

`test-movil.js` (11 pruebas) comprueba lo que se puede sin un navegador: que todas las páginas declaran viewport, que ninguna impide hacer zoom, que llevan las reglas móviles, que no hay columnas fijas sin anular y que el inyector es repetible.

Lo que **no** comprueba es si la pantalla se ve bien. Eso necesita un ojo humano y un teléfono de verdad. Cuando repartas los primeros códigos, ábrelo tú antes en tu móvil: es probable que haya algo mal alineado que ninguna regla genérica arregla.

## Estado

193 → **204 pruebas**, todas en verde.
