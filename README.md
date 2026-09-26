# CriptoMundo

MMORPG de navegador con economía interna. Un solo ejecutable, **cero dependencias npm**. Node.js 18 o superior.

```bash
npm start                    # http://localhost:3000
```

Junto al ejecutable tiene que estar la carpeta `assets/`, o los personajes ilustrados no cargarán.

---

## Qué es esto ahora mismo

Un juego jugable de principio a fin: creas personaje, exploras, peleas, aceptas misiones, fabricas, comercias con otros jugadores, entras en mazmorras, compites en PvP, montas un gremio y decoras tu casa. **Todo lo decide el servidor**; el navegador solo dibuja.

Lo que **no** es: no hay token desplegado ni NFTs. `$CGRID` es un saldo interno con emisión limitada. `/api/web3/status` lo declara explícitamente. Ver `docs/PLAN_VERTICAL_SLICE.md` para el porqué.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el juego |
| `npm test` | 1.218 comprobaciones en 48 archivos, en paralelo (~170 s). Aparte por lentas: estabilidad y concurrencia |
| `npm run test:serie` | Lo mismo de una en una (~450 s), para comparar cuando algo huele a carga |
| `npm run doctor` | Diagnóstico priorizado de qué mejorar |
| `npm run arte` | Qué dibujos faltan, con nombre y medidas, y cuáles están mal |
| `npm run simular` | Cohorte de jugadores automatizados |
| `npm run carga` | Prueba de carga (mide el techo del servidor) |
| `npm run estabilidad` | Comprueba que nada crece sin techo (~90 s) |
| `npm run concurrencia` | Verifica que no se puede duplicar oro ni objetos (~2 min) |
| `npm run watch` | Recompila `src/` al guardar |
| `npm run invitar` | Gestiona códigos de invitación |

## Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | 3000 | Puerto |
| `NODE_ENV` | development | `production` activa cookies `Secure` y oculta errores internos |
| `DATA_FILE` | ./criptomundo-data.json | Dónde se guardan las partidas |
| `BACKUP_DIR` | ./backups | Copias rotadas |
| `ADMIN_TOKEN` | — | Sin él, el panel de analítica queda cerrado |
| `INVITE_ONLY` | — | `1` exige código de invitación para registrarse |
| `ALLOWED_ORIGINS` | mismo origen | CORS |
| `ASSETS_DIR` | ./assets | Imágenes de personajes |

## Páginas

- `/` — launcher, creador de personaje y todos los módulos
- `/economia.html` — transparencia de la economía, pública, sin datos personales
- `/admin.html` — retención, embudo, abandono y avisos de los jugadores (requiere `ADMIN_TOKEN`)

## Documentación

| Archivo | Para qué |
|---|---|
| `docs/COMO_TRABAJAR.md` | Editar el código: se trabaja en `src/` y se compila |
| `docs/COMO_AGREGAR_SKINS.md` | Añadir un personaje |
| `docs/DESPLIEGUE.md` | Ponerlo en un servidor real |
| `docs/PRUEBA_DE_JUEGO.md` | **Cómo ejecutar la primera prueba con jugadores** |
| `docs/PLAN_VERTICAL_SLICE.md` | Plan de producto y avisos legales |
| `docs/RESPUESTA_A_LA_PRUEBA.md` | **Qué salió de la prueba con jugadores y el plan** |
| `docs/PROYECTO.md` | **Documento completo: qué hay, cómo está hecho y qué falta** |
| `docs/AUDITORIA_V31.md` | **La foto de partida de la v31**: qué estaba roto, qué estaba bien y qué faltaba. No se reescribe |
| `docs/ENTREGA.md` | **Qué se hizo sobre esa foto**, paso a paso, y qué queda pendiente y por qué |
| `CHANGELOG.md` | Qué cambió en cada versión y por qué |

## Estado del proyecto

**Hecho:** servidor con autoridad total, doce módulos de juego (con arena en tiempo real, recolección y huerto), creador de personaje con siete aspectos (uno animado), telemetría con embudo y retención, economía pública auditable, chat y presencia en tiempo real por WebSocket, copias de seguridad con recuperación automática, beta cerrada por invitación, interfaz y controles táctiles para móvil, recuperación ante caídas de red, y 1.459 comprobaciones automatizadas repartidas en 55 archivos de prueba.

**Pendiente:** PostgreSQL (las migraciones están escritas; medido, el JSON aguanta 300 jugadores simultáneos con 44 ms), guerras de gremio, integración on-chain.

**Lo que de verdad falta:** jugadores. El panel de analítica está listo desde hace ocho versiones y sigue vacío de datos reales. La retención, el abandono y si el juego engancha no salen de ninguna herramienta: salen de personas jugando. El siguiente paso del proyecto no es código, es generar diez códigos de invitación y repartirlos.
