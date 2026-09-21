# CriptoMundo — Documento del proyecto

**Versión 28.0.0** · Un solo ejecutable, cero dependencias npm, Node.js 18+
408 pruebas automatizadas en diecisiete suites, todas en verde.

---

## 1. Qué es, en una página

Un MMORPG de navegador con economía interna. Se crea personaje, se explora un mundo por zonas, se pelea de dos formas distintas, se cultiva, se fabrica, se comercia con otros jugadores, se hacen misiones, se entra a mazmorras, se compite en PvP, se monta un gremio y se decora una casa.

**Todo lo decide el servidor.** El navegador dibuja y envía intenciones; no calcula daño, ni precios, ni progreso, ni recompensas. Esa es la regla que sostiene el resto del proyecto y la que más trabajo ha costado: la primera versión que recibí hacía justo lo contrario.

**Lo que NO es:** no hay token desplegado ni NFTs. `$CGRID` es un saldo interno con emisión limitada y auditada. `/api/web3/status` lo declara explícitamente. Ver `docs/PLAN_VERTICAL_SLICE.md` para el porqué y los avisos legales.

```bash
unzip criptomundo-prueba.zip
cd criptomundo-v3
npm start                 # http://localhost:3000
```

Junto al ejecutable tiene que ir la carpeta `assets/`, o los personajes ilustrados no cargan.

---

## 2. Sistemas de juego

### Personaje
Cuatro clases con estadísticas y crecimiento propios (Guerrero, Mago, Asesino, Archimago), cada una con su estadística principal y su árbol de habilidades. Creador con siete aspectos, uno animado, y colores personalizables en los base. Se puede **subir una imagen propia** como personaje.

### Combate — dos sistemas que conviven
- **Por turnos** (el original, conservado): sirve para aprender y farmear al principio. Tiene telegrafía de ataques, bloqueo, interrupción, combos, fases de jefe y tabla de elementos.
- **Arena, en tiempo real**: simulación en el servidor a 10 pasos por segundo. Movimiento, retroceso, alcance y arco de arma, proyectiles, esquiva con invulnerabilidad, y tres conductas de enemigo (persigue, dispara de lejos, o avisa y embiste). El cliente solo manda intenciones.

### Mazmorras
Mapa generado con semilla. En cada piso se elige entre dos salas: guardia, guardián, cofre (que puede estar trampeado), pasillo con trampas, santuario y sala del jefe. Los combates usan el motor de arena. **El botín se acumula y solo se cobra si sales con vida**; morir lo pierde, retirarse deja la mitad. Eso convierte la elección de sala en una decisión real.

### Cultivo y recolección
Ocho sitios de recolección repartidos por zonas (pozo, río, charca, trigal, herbario, tocones, colmena, coto de caza, veta), cada uno con su enfriamiento. Huerto con parcelas (4 + 1 por nivel de casa) y seis cultivos que crecen **en tiempo real del servidor** — crecen aunque cierres el juego y no se pueden acelerar desde el navegador.

### Fabricación
30 recetas en tres estaciones: 19 en la forja, 6 de alquimia y 5 de cocina. Armas con alcance y cadencia propios, juegos de armadura de cuero, hierro y cristal, accesorios, pociones con efecto temporal y comidas que curan y además dejan un bono.

### Objetos y equipamiento
Siete ranuras de equipo. Cada objeto declara dónde se equipa, qué estadísticas da, si es consumible, si se vende y en qué recetas entra. Equipar cambia las estadísticas de verdad y se nota en los tres tipos de combate.

### Efectos temporales
Las pociones de Fuerza, Velocidad, Piedra y Sabiduría dan +14/+16 durante 5 minutos. Entran en el cálculo de estadísticas, así que valen en todo el juego. Tomar dos iguales renueva el tiempo pero no acumula el bono. Se ven en la barra superior con su cuenta atrás.

### Mundo
Seis zonas conectadas. Cada una es un mapa de 1800×1200 con cámara que sigue al jugador, edificios sólidos, terreno generado con semilla y ambiente propio. Controles de teclado y mando táctil en móvil.

### Misiones y NPC
Cinco misiones con objetivos que **solo avanzan con acciones reales**: matar al enemigo correcto, recoger el material, fabricar la receta, explorar la zona o completar la mazmorra. Se aceptan desde el propio NPC o desde la pantalla de misiones.

### Mercado
Publicaciones con escrow real (el objeto sale del inventario), precio validado en servidor, comisión del 5 % quemada como sumidero de oro, historial de ventas y precios medios. No se puede comprar lo propio ni engañar al servidor con datos del cliente.

### Gremios, casa, PvP
Gremios con roles, capacidad, tesorería y donaciones. Casa con mobiliario de precio servidor y niveles que amplían el huerto. PvP resuelto en el servidor con Elo y apuesta de oro acotada — **nunca con $CGRID**.

### Perfil
Nivel, clase, XP, estadísticas efectivas, equipo, minutos jugados, y contadores reales de bajas, jefes, mazmorras, muertes, objetos fabricados, recursos recolectados, cosechas, consumibles, misiones y PvP. **12 medallas** calculadas a partir de esos contadores, no guardadas aparte, para que no puedan mentir.

### Primeros pasos
Lista de diez objetivos que guía al jugador nuevo y se marca sola con lo que ya hace. No bloquea nada y desaparece al terminarla.

---

## 3. Seguridad y solidez

| Qué | Cómo |
|---|---|
| Contraseñas | `scrypt` con salt y comparación en tiempo constante |
| Sesiones | 32 bytes aleatorios, expiración, cookie `HttpOnly`+`SameSite`(+`Secure` en producción) |
| Autoridad | Todo cálculo económico y de combate en el servidor; el cliente no declara resultados |
| Concurrencia | 17 pruebas que disparan peticiones **a la vez**: no se puede duplicar oro ni objetos |
| Límites | Rate limiting por IP y por acción; validación de tipo y rango en toda entrada |
| Datos | Escritura atómica, copias rotadas y **recuperación automática** si el archivo se corrompe |
| Subidas | Firma PNG real, dimensiones, cuadrada, con alfa, ruta derivada del hash |
| Auditoría | Cada movimiento de moneda queda registrado |
| Economía | Emisión de CGRID con tope diario global y por jugador, sumideros de oro, y todo publicado en `/economia.html` |

**Carga medida:** 300 jugadores simultáneos con 44 ms en el percentil 95 y cero fallos. El cuello de botella real no es la persistencia sino `scrypt` en registros masivos, que es lento a propósito.

---

## 4. Arquitectura

```
src/
  server/                      → 15 módulos
    00-header     cabecera, PAGES y VERSION
    10-infra      sesiones, contraseñas, límites, persistencia, copias
    20-skins      catálogo de aspectos y validación
    25-invitaciones · 26-personaje-propio
    30-personajes-combate   clases, objetos, progresión, motor por turnos
    40-mundo-mercado        misiones, zonas, recetas, PvP, mercado, gremios
    45-primeros-pasos · 47-avisos · 47-recoleccion-huerto
    50-telemetria           retención, embudo, pantallas, economía
    55-tiempo-real          WebSocket a mano (chat, presencia, entradas de arena)
    58-arena                simulación de combate en tiempo real
    59-mazmorras            salas, decisiones, recompensas
    60-http                 rutas de la API y arranque
  pages/                       → 18 módulos, uno por pantalla
assets/skins/                  → imágenes de personajes
```

Se trabaja en `src/` y el archivo único se genera con `node build.js`. **Nunca se edita `criptomundo.js` a mano**: `build.js --check` falla si está desfasado, y verifica que la versión del código coincida con `package.json`.

**52 endpoints** de API. Tres inyectores (`aplicar-css-movil`, `aplicar-red-cliente`, `aplicar-avisos`) mantienen bloques compartidos en las 18 páginas desde un solo sitio.

---

## 5. Herramientas

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el juego |
| `npm test` | 408 pruebas en diecisiete suites |
| `npm run doctor` | Diagnóstico priorizado: juega una partida y dice qué mejorar |
| `npm run simular` | Cohorte de jugadores automatizados que llena embudo y economía |
| `npm run carga` | Prueba de carga: mide el techo del servidor |
| `npm run estabilidad` | Verifica que nada crece sin techo (~90 s) |
| `npm run concurrencia` | Verifica que no se puede duplicar oro (~2 min) |
| `npm run beta` | Revisa la configuración de producción y genera invitaciones |
| `npm run invitar` | Gestiona códigos de invitación |
| `npm run watch` | Recompila al guardar |

**Páginas de control:** `/economia.html` (transparencia pública, sin datos personales) y `/admin.html` (retención por cohorte, embudo de 13 pasos, minutos y abandono por pantalla; requiere `ADMIN_TOKEN`).

---

## 6. Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | 3000 | Puerto |
| `NODE_ENV` | development | `production` activa cookies `Secure` |
| `DATA_FILE` | ./criptomundo-data.json | Dónde se guardan las partidas |
| `BACKUP_DIR` | ./backups | Copias rotadas |
| `ADMIN_TOKEN` | — | Sin él, el panel de analítica queda cerrado |
| `INVITE_ONLY` | — | `1` exige código de invitación |
| `ALLOWED_ORIGINS` | mismo origen | CORS |
| `FARM_SPEED` | 1 | Acelera el cultivo **solo para pruebas** |

---

## 7. Cómo llegó aquí — los errores que valió la pena encontrar

El proyecto pasó de un prototipo donde el cliente decidía todo a lo que hay ahora. Estos son los hallazgos que más cambiaron el rumbo:

1. **El cliente calculaba el combate, el precio de compra, el progreso de misión y el resultado del PvP** — y el servidor se lo creía. Nueve pantallas reescritas como clientes finos.
2. **Bosque y minas eran inaccesibles**: el mapa usaba `bosque`/`minas` y el servidor `forest`/`mines`. El viaje fallaba en silencio, y con él desaparecían los enemigos, que viven fuera del pueblo.
3. **El agua y el trigo no los daba nada.** Al gastar el inventario inicial, pociones y pan quedaban bloqueados para siempre.
4. **`/api/player/equip` funcionaba y ninguna pantalla lo llamaba.** Por eso no se podía equipar lo fabricado.
5. **Dos ilustraciones tenían el fondo incrustado** y convertían al personaje en un cuadrado sobre el mapa. De ahí salió la validación de skins y el recorte obligatorio al subir una propia.
6. **Una fuga de memoria escondida once versiones**: la limpieza de los contadores de rate limiting estaba escrita fuera de toda función y no se ejecutaba nunca.
7. **El diagnóstico probaba la mazmorra vieja**, no la que usa el juego: código muerto que parecía vivo.
8. **Producción sin HTTPS rompe las sesiones en silencio** — la cookie lleva `Secure` y el navegador la descarta. Ahora el servidor lo grita.
9. **Balance medido, no intuido**: el combate pasó de 8,4 a 4,7 turnos por enemigo y llegar a nivel 5 de 29 enemigos a 12. Los jugadores simulados que alcanzaban la primera mazmorra pasaron del 10 % al 100 %.

---

## 8. Qué falta

**Técnico**
- PostgreSQL conectado. Las migraciones están escritas y hay script de volcado; medido, el JSON con copias aguanta 300 jugadores simultáneos, así que no corre prisa.
- Guerras de gremio.
- Integración on-chain de CGRID — necesita abogado antes que programador (MiCA en la UE, análisis de valores en EE. UU.).

**Lo que de verdad falta**
Jugadores. El panel de analítica lleva veinte versiones listo y sigue vacío de datos reales. La retención, el abandono y si el juego engancha no salen de ninguna herramienta del repositorio: salen de personas jugando.

Los números del contenido nuevo —daño de las armas, duración de los efectos, tiempos de cultivo— los elegí con criterio pero sin datos. Una tarde de pruebas con gente los reajusta enteros.

---

## 9. El siguiente paso

Está escrito en `docs/PRUEBA_DE_JUEGO.md`, con el protocolo completo. En resumen:

1. Servidor con HTTPS, `INVITE_ONLY=1` y `ADMIN_TOKEN`.
2. `npm run beta` — no repartas nada mientras haya un 🔴.
3. Pruébalo tú media hora en el móvil antes de quemar invitaciones.
4. `node preparar-beta.js 10 --url=https://tudominio.com` y reparte.
5. A las 48 horas mira en `/admin.html`: cuántos crearon personaje, la mediana de minutos, la columna roja del embudo y desde qué pantalla se fue la gente.
6. Arregla **solo** el paso donde más gente se cae.

Y la pregunta que hay que hacerles, sin suavizarla: *¿en qué momento dejaste de tener ganas de seguir?*

---

## 10. Índice de documentación

| Archivo | Para qué |
|---|---|
| `README.md` | Entrada rápida: comandos y estado |
| `CHANGELOG.md` | Qué cambió en cada versión y por qué |
| `docs/PRUEBA_DE_JUEGO.md` | Protocolo de la prueba con jugadores |
| `docs/COMO_TRABAJAR.md` | Editar el código: se trabaja en `src/` |
| `docs/COMO_AGREGAR_SKINS.md` | Añadir un personaje |
| `docs/DESPLIEGUE.md` | Ponerlo en un servidor real |
| `docs/PLAN_VERTICAL_SLICE.md` | Plan de producto y avisos legales |
| `docs/CAMBIOS_V*.md` | Detalle de las versiones grandes |
