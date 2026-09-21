# CriptoMundo v11 — Prueba de carga

## Por qué

Llevo desde la v4 diciendo que PostgreSQL es prematuro "porque el JSON aguanta". Era una opinión. `carga.js` la convierte en un número.

```bash
npm start                    # en una terminal
node carga.js                # 50 jugadores, 30 segundos
node carga.js 300 60         # 300 jugadores, 60 segundos
node carga.js 50 30 --ws     # además, un WebSocket por jugador
```

Cada jugador simulado hace lo que hace uno real: pelea, mira su inventario, consulta el mercado y habla por el chat, con pausas humanas entre acciones (no un bucle cerrado, que mediría otra cosa).

## Lo que salió

Medido en esta máquina, con el servidor en un solo proceso y persistencia en JSON:

| Jugadores a la vez | Peticiones/s | Mediana | p95 | Fallos |
|---|---|---|---|---|
| 30 | 43 | 1 ms | 2 ms | 0 |
| 100 | 120 | 1 ms | 30 ms | 0 |
| 299 | 330 | 1 ms | 44 ms | 0 |

**Trescientos jugadores simultáneos con 44 ms en el percentil 95 y cero fallos.** Para una beta de diez personas sobra por un factor de treinta. PostgreSQL sigue sin hacer falta, y ahora puedo decirlo señalando una tabla en vez de una intuición.

## El cuello de botella real no era el que yo pensaba

Al forzar mil entradas de golpe, el juego siguió respondiendo bien (p95 de 47 ms) pero **el registro se desplomó: p95 de 15 segundos y 33 conexiones cortadas**.

La causa es `scrypt`, el algoritmo que cifra las contraseñas. Es lento **a propósito** — esa lentitud es justo lo que protege las contraseñas de un ataque por fuerza bruta — pero ocupa la CPU, y el servidor es un solo proceso. Mil registros a la vez lo saturan.

No lo voy a "arreglar" bajando la seguridad. Lo que importa es la consecuencia práctica: **si algún día publicas el enlace en un sitio con mucho tráfico y llegan cientos de registros de golpe, el servidor se atasca durante el arranque**, aunque quien ya esté dentro siga jugando bien. Los códigos de invitación de la v7 sirven también para esto: reparten las entradas en el tiempo.

Por eso la herramienta separa las latencias de registro de las de juego. Mezclarlas daba un p95 de 900 ms que no representaba a nadie: ni al que juega ni al que entra.

## Detalles de la herramienta

- **Reutiliza cuentas.** El servidor limita los registros por IP, y con razón. Las cuentas creadas se guardan y en la siguiente pasada se entra con ellas en vez de crear más.
- **Avisa cuando la medición no vale.** Si pides 400 jugadores y solo entran 107, lo dice en lugar de presumir de un p95 estupendo obtenido con una cuarta parte de la carga. Es el error más fácil de cometer con estas herramientas.
- Para medir de verdad con muchos, se arranca el servidor con `REGISTER_LIMIT_PER_HOUR` alto. Solo en pruebas: en producción esa protección existe por algo.

## Limpieza

Las láminas originales de los tres personajes (5,9 MB) están en `assets/skins/originales/`, fuera de lo que el juego sirve. El servidor solo entrega los recortes optimizados.

## Estado

218 pruebas, todas en verde. La prueba de carga no forma parte de `npm test`: tarda demasiado y necesita decidir cuántos jugadores simular. Se lanza a mano cuando interesa.
