# CriptoMundo v21 — Combate en tiempo real (Arena) y huerto jugable

## 1. Arena: el segundo sistema de combate

El combate por turnos **se queda tal cual**: sigue siendo la vía para aprender, farmear y subir los primeros niveles. La Arena es lo otro: pelear moviéndose.

### Dónde vive la simulación

Toda en el servidor, en pasos fijos de 100 ms. El cliente manda **únicamente intenciones** — "me muevo hacia aquí", "ataco", "esquivo" — y recibe el estado para dibujarlo.

Esto no es un detalle de arquitectura: es lo que impide que la Arena reabra el agujero que se cerró en la v3. Hay pruebas que envían por el socket mensajes de daño, un estado con los enemigos ya muertos y un "he ganado, dame 999.999 de oro". Los tres se ignoran y el oro del personaje no se mueve.

### Qué se simula de verdad

- Posición, velocidad e inercia, con **retroceso** que empuja de verdad a quien recibe el golpe.
- Colisiones circulares, **alcance y arco** del arma: apuntar mal significa fallar.
- **Proyectiles** con velocidad y vida limitada, del jugador y de los enemigos.
- **Enfriamientos** por arma, **esquiva** con invulnerabilidad breve y su propio enfriamiento, e invulnerabilidad de 450 ms tras recibir un golpe para que no te encadenen.
- **Tres conductas de enemigo**: el perseguidor va a por ti y pega de cerca; el tirador mantiene distancia y dispara; el embestidor se para, **avisa** y carga en línea recta — se puede esquivar si reaccionas.

### Conectado con el resto del juego

El arma equipada decide alcance, cadencia, daño y si disparas de lejos: los puños, la daga, la espada, el arco y el cetro se juegan distinto. El daño sale de la estadística principal de tu clase, igual que en el combate por turnos. Las bajas cuentan para el perfil, las medallas y los objetivos de misión. El botín usa las mismas tablas y **se entrega aunque pierdas**: lo que ya mataste, ya lo mataste. La derrota cuesta un 5 % del oro y suma una muerte al perfil.

Tres arenas con oleadas (bosque nivel 1, minas nivel 5, ruinas nivel 12).

### Comprobado jugando

Un bot que persigue y golpea **gana** la arena del bosque: 3 oleadas, 6 bajas, 696 XP, 108 de oro y botín en el inventario, con los contadores del perfil actualizados. Un bot que se queda quieto **muere** y paga la penalización. Es decir: se puede ganar y se puede perder.

## 2. Huerto y recolección, ahora con pantalla

Los sistemas del servidor de la v20 ya funcionaban por API pero no tenían interfaz. Ahora hay una página con las parcelas (estado, barra de crecimiento, sembrar y cosechar), el selector de semillas con lo que llevas, y los sitios de recolección por zona con su cuenta atrás. Los tiempos que se ven vienen del servidor, no de un contador del navegador.

## 3. Navegación

Arena y Huerto están en el menú lateral del launcher.

## 4. Pruebas

- `test-arena.js`: **25 comprobaciones** con un cliente WebSocket escrito a mano, incluidos los tres intentos de trampa.
- `test-arreglos-v20.js` ampliado a **48**.
- Regresión completa: **356 pruebas** en catorce suites, todas en verde.

## 5. Lo que sigue pendiente

- **Mazmorras con salas y encuentros.** Ahora sí tienen sobre qué construirse: el motor de arena es exactamente lo que les faltaba. Es el siguiente paso natural.
- **Subir un personaje propio**: requiere recepción de archivos, que el servidor todavía no hace.
- Quitar el fondo opaco de las ilustraciones pepe: dos algoritmos probados, los dos destrozan el dibujo.
