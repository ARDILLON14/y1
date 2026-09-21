# CriptoMundo v9 — Controles táctiles en el mapa

## El hueco que dejó la v8

La v8 hizo que todas las páginas *quepan* en un móvil. Pero el mapa 2D seguía moviéndose solo con WASD y las flechas, que en un teléfono significa que no se movía. La página cabía y era inútil.

Es el hueco que yo mismo señalé al cerrar la v8, diciendo que prefería verlo con alguien intentándolo. Reconsiderado: no hace falta ver a nadie para saber que un juego de movimiento sin forma de moverse en la pantalla donde se va a abrir está roto.

## Qué se añadió

- **Joystick virtual** abajo a la izquierda: vector normalizado que el bucle del juego suma al movimiento, con radio limitado y **zona muerta** para que el personaje no tiemble con el dedo quieto.
- **Botón de acción** abajo a la derecha, que dispara la misma interacción que la tecla de hablar.
- **Solo aparece en pantallas táctiles** (`@media (hover: none) and (pointer: coarse)`). Con ratón y teclado no se ve nada: no molesta a quien juegue en el escritorio.
- **Se suma al teclado, no lo sustituye.** En una tablet con teclado funcionan los dos a la vez.
- **Se puede probar con el ratón** desde el escritorio, para no depender de tener un teléfono a mano al desarrollar.
- El vector vuelve a cero al soltar, al cancelar el toque y al perder el foco de la ventana. Sin eso, cambiar de pestaña a mitad de gesto deja al personaje andando solo para siempre.

## Estado

204 → **209 pruebas**, todas en verde. Las cinco nuevas comprueban que el mando existe, que solo se muestra en táctil, que declara `touch-action: none` (sin eso el navegador se queda el gesto y el joystick no responde), que hay zona muerta y que el mensaje de bienvenida ya no dice que solo se juega con teclado.

## Lo que sigue sin poder comprobarse aquí

Si el joystick *se siente* bien —tamaño, posición, sensibilidad— no lo dice ninguna prueba. Son tres números en el código (`RADIO`, la zona muerta y la velocidad) y ajustarlos requiere un pulgar real sobre un cristal real. Es lo primero que mirar cuando lo abras en tu teléfono.
