# CriptoMundo v5 — tiempo real y datos a salvo

Dos cosas, las dos de infraestructura. Ningún sistema de juego nuevo.

## 1. Chat y presencia en tiempo real

Antes el chat funcionaba por sondeo: cada cliente preguntaba "¿hay algo nuevo?" cada cuatro segundos. Con 50 jugadores eso son 45.000 peticiones por hora para, casi siempre, nada. Y los mensajes tardaban hasta cuatro segundos en aparecer, que en un chat se nota mucho.

Ahora hay **WebSocket implementado a mano** (`src/server/55-tiempo-real.js`), sin ninguna dependencia: handshake RFC 6455, marcos de texto, ping/pong y cierre, con lo que trae Node.

- Los mensajes llegan al instante a todos los conectados.
- **Presencia**: se ve cuánta gente hay en línea, y el recuento cambia al entrar o salir alguien. Endpoint `GET /api/online`.
- Aviso de mensajes sin leer cuando el panel está cerrado.
- **Respaldo automático**: si el socket no llega a abrirse tras cinco intentos (un proxy que no admita WebSocket, por ejemplo), el cliente vuelve al sondeo de siempre y avisa en la interfaz. Nadie se queda sin chat.
- Lo enviado por HTTP también se difunde por socket, así que los dos caminos conviven.

**Qué NO viaja por el socket**, a propósito: nada de lógica de juego. Combate, mercado, mazmorras y todo lo demás siguen por HTTP con validación completa. Un socket abierto no concede permisos que la sesión no tuviera, y el handshake exige sesión válida. Hay una prueba que intenta pedir oro y ganar combates por socket y comprueba que no pasa nada.

## 2. Los datos ya no se pueden perder por un corte

La persistencia era un `writeFileSync` sobre el archivo bueno. Un corte de luz a mitad de escritura dejaba un JSON truncado y, con él, todas las cuentas perdidas.

- **Escritura atómica**: se escribe un temporal y se renombra. El archivo bueno nunca queda a medias.
- **Copias rotadas** en `backups/`: una al arrancar (el estado con el que empieza la sesión) y una cada 30 minutos, conservando las 12 últimas. Configurable con `BACKUP_DIR`, `BACKUP_KEEP` y `BACKUP_EVERY_MS`.
- **Recuperación automática**: si el archivo principal no se puede leer, el servidor prueba con las copias de la más reciente a la más antigua, arranca con la que funcione y **aparta** el archivo dañado con sufijo `.corrupto-…` en vez de borrarlo.

Probado de verdad: se corrompió el archivo a mano y el servidor arrancó recuperando al jugador desde la copia, dejando el archivo roto a un lado.

## 3. Un fallo encontrado al probar

La presencia contaba jugadores fantasma. El servidor escuchaba `close` y `error` del socket, pero no `end`: un cliente que cerraba solo su mitad de lectura dejaba la conexión a medias y seguía apareciendo como conectado para siempre. Ahora se escucha `end` y hay además un tiempo de espera máximo. Es el tipo de fallo que en producción se ve como "el contador de gente en línea solo sube".

## 4. Estado

139 → **156 pruebas**, todas en verde. La suite nueva (`test-tiempo-real.js`) incluye un cliente WebSocket escrito a mano: si el servidor implementa el protocolo a mano, la prueba también, para no depender de que el navegador lo haga bien.

El diagnóstico ya no lista el chat por sondeo entre los pendientes. Quedan:

- PostgreSQL conectado (migraciones escritas; el JSON con copias aguanta bien la escala actual).
- Guerras de gremio.
- Integración on-chain de CGRID — la parte con implicaciones legales.

Y lo de siempre, que ninguna versión va a resolver desde el editor: **jugadores**. El chat en tiempo real y la presencia son, justamente, funciones que no significan nada con una sola persona conectada.
