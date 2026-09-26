# Dibujar un arma para CriptoMundo

Para quien dibuja. No hace falta tocar una línea de código: se deja el
PNG en su sitio, y si la mano no lo agarra bien, se ajusta en un archivo
de texto de dos líneas.

Para comprobar lo que has dejado:

```
npm run arte        qué falta y qué está mal, con nombre y motivo
npm run arte:ver    cada arma en la mano, repitiendo su golpe
```

---

## Dónde van los archivos

**Esta es la convención que ya existe en el proyecto, no una nueva.** El
encargo de combate proponía `public/sprites/armas/<id>/`; la auditoría
(decisión D7 de `AUDITORIA_COMBATE_V32.md`) comprobó que el servidor, el
catálogo, `revisar-arte.js` y el dibujante de la arena usan otra, y que
no existe ninguna carpeta `public/`. Gana la que está puesta.

| Archivo | Qué es | Obligatorio |
|---|---|---|
| `assets/items/<id>.png` | El arma. **32×32**, PNG con transparencia | sí |
| `assets/items/anim/<id>.png` | Tira del golpe: cuadros CUADRADOS en fila | no |
| `assets/items/<id>.json` | Ajustes: empuñadura, ángulo, escala | no |

El `<id>` es el del catálogo: `espada_hierro`, `dagger`, `iron_axe`… Lo
lista `npm run arte`.

---

## Las tres reglas que no se pueden saltar

**1 · Transparencia de verdad, sin medias tintas.** El juego escala los
dibujos con filtro NEAREST desde que va en modo pixel art. Un borde con
transparencia a medias no se suaviza: se ve como un halo gris alrededor
del arma. Un píxel está o no está. `npm run arte` avisa si más del 2 %
del dibujo está a medio camino.

*(Las ilustraciones de personaje de `assets/skins/` son otra cosa: esas
están pintadas y sí llevan bordes suaves. La comprobación no las mira.)*

**2 · La tira de golpe, en cuadros cuadrados.** El ancho tiene que ser
múltiplo exacto del alto: 4 cuadros de 32 son 128×32. Si no cuadra, el
servidor rechaza la tira entera y se dibuja el gesto calculado.

**3 · La mano tiene que agarrar el mango.** Ver abajo.

---

## La empuñadura

El arma **no se dibuja por su centro**: se dibuja por el punto donde la
agarra la mano. Si ese punto está mal, el arma sale flotando al lado del
personaje, como un objeto suelto.

Se expresa en **fracción del dibujo**, no en píxeles: `0` es el borde
izquierdo o de arriba, `1` el derecho o el de abajo. El valor por defecto
es `0.79 · 0.79` — abajo a la derecha, que es donde está el pomo de las
tres espadas que hay.

Si tu arma agarra en otro sitio, déjalo dicho en `assets/items/<id>.json`:

```json
{
  "empunadura": [0.5, 0.9],
  "spriteAngulo": -2.356,
  "escala": 2
}
```

Los tres campos son opcionales. **La ficha gana sobre el catálogo, y el
catálogo sobre el valor por defecto**, así que con esto basta.

`npm run arte` te dice si la empuñadura cae sobre un píxel transparente,
que es la forma segura de saber que está mal sin abrir el juego. Y
`npm run arte:ver` la pinta como un punto rojo encima del dibujo: si el
punto no está sobre el mango, ya sabes qué tocar.

---

## El ángulo

`spriteAngulo` dice a qué ángulo viene dibujada la hoja, en **radianes**.
El valor por defecto es `-2.356`, o sea **−135°**: las tres espadas del
juego llevan la punta arriba a la izquierda y el pomo abajo a la derecha.

Si dibujas a 45° (punta arriba a la derecha), tu ficha lleva
`"spriteAngulo": 0.785`.

Si no sabes qué poner: dibuja como las que ya hay, no pongas nada, y
mira el resultado con `npm run arte:ver`.

---

## Lo que pasa si no dejas el archivo

Nada se rompe. Un arma sin PNG se dibuja con su emoji, girado como si
fuera la hoja. Un arma sin tira de golpe usa el gesto calculado, que
funciona pero es el mismo para todas las de su familia. Es una decisión
del proyecto, no un accidente: `npm run arte` dice cuánto queda para que
deje de hacer falta esa caída.

---

## Lo que hay hoy

Tres armas con dibujo (las tres espadas), ninguna con ficha propia —las
tres usan la empuñadura por defecto y `npm run arte` confirma que cae
sobre dibujo en las tres—, y ninguna con tira de golpe. La lista
completa de lo que falta, con medidas, sale de `npm run arte`.
