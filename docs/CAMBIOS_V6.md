# CriptoMundo v6 — Primeros pasos

Una sola función, elegida por los datos y no por intuición.

## El problema

La simulación de cohorte venía marcando lo mismo desde la v4:

| Paso del embudo | Jugadores que lo alcanzaban |
|---|---|
| Ganar un combate | 100 % |
| **Aceptar una misión** | **50 %** |
| **Completar una misión** | **40 %** |

No era dificultad: aceptar una misión es gratis y está disponible desde el minuto uno. Era que nadie sabía que existía. El juego tiene nueve pantallas y ninguna te dice por dónde empezar.

## La solución

Un panel de **Primeros pasos** en la esquina inferior derecha, con siete objetivos:

1. Gana tu primer combate — 100 de oro
2. Acepta una misión — 100
3. Fabrica algo en el taller — 150
4. Alcanza el nivel 2 — 150
5. Entrega una misión completa — 250
6. Compra algo en el mercado — 200
7. Completa la Cripta del Eterno — 500

Decisiones de diseño que me parecen importantes:

- **No bloquea nada.** No es un tutorial que te lleva de la mano ni te impide jugar a tu aire. Es una lista que puedes plegar o ignorar.
- **Se marca sola.** El estado sale de los mismos eventos que alimentan la telemetría, no de una segunda contabilidad que se pueda desincronizar. Si matas un monstruo porque te apetecía, el paso aparece hecho.
- **Cada paso dice adónde ir**, con un botón que abre esa pantalla, y una pista concreta solo en el paso actual para no saturar.
- **El cobro es explícito.** Pulsas y ves la recompensa, en lugar de que aparezca oro de la nada sin saber por qué.
- **Desaparece solo** cuando no queda nada por hacer ni por cobrar.

## Servidor

`GET /api/onboarding` devuelve la lista con su estado; `POST /api/onboarding/claim` paga. Lo importante es que el servidor comprueba el evento real antes de pagar: cobrar un paso que no has hecho devuelve un error, cobrar dos veces también, y la clave de idempotencia evita que un doble clic pague dos veces.

Añadir un paso nuevo es una entrada en el array `PRIMEROS_PASOS` (`src/server/45-primeros-pasos.js`): título, pista, pantalla, evento del embudo y recompensa. La interfaz se construye sola.

## Estado

156 → **173 pruebas**, todas en verde. La suite nueva juega un combate de verdad para comprobar que el paso se marca solo, y verifica que no se puede cobrar sin haberlo hecho.

## Lo que esto no arregla

Que la gente sepa qué hacer no significa que quiera seguir haciéndolo. Este cambio debería mover los porcentajes de aceptar y completar misiones, y eso se verá en `/admin.html` — **con jugadores reales**. Los simulados no se pierden en un menú: hacen exactamente lo que su guion dice, así que la simulación no va a validar esta función. Es la primera vez que construyo algo que solo se puede evaluar con personas.
