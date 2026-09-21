# CriptoMundo v7 — Beta cerrada por invitación

La v6 arregló que los jugadores no supieran qué hacer. Esta versión resuelve el paso anterior: **cómo meter a diez personas concretas** cuando pongas el juego en internet, sin abrirlo a todo el mundo.

## Cómo se usa

```bash
INVITE_ONLY=1 ADMIN_TOKEN=una_clave_larga npm start

ADMIN_TOKEN=una_clave_larga node invitaciones.js crear 10 --etiqueta=discord
ADMIN_TOKEN=una_clave_larga node invitaciones.js listar
```

Salen códigos del tipo `ZQQQR-FRUTG` y el enlace listo para pegar:

```
http://tuservidor/?invite=ZQQQR-FRUTG
```

Quien lo abra ya llega con el código puesto y la pestaña de registro abierta.

## Detalles que importan

- **Sin `INVITE_ONLY=1` nada cambia.** El registro sigue abierto y el campo de invitación ni aparece. Es una llave que enciendes cuando la necesitas.
- **Códigos legibles**: sin `0`, `O`, `1` ni `I`, porque van a acabar dictándose por voz o copiándose a mano. Se aceptan en minúsculas.
- **Un registro que falla no quema el código.** El código se valida antes de crear nada y se consume después. Si alguien se equivoca con el email, puede reintentar con el mismo.
- **Códigos de varios usos** con `--usos=5`, para un enlace que compartes en un canal entero.
- **Etiquetas**: cada código lleva una (`discord`, `amigos`, `reddit`). Queda guardada en el jugador, así que en la analítica podrás ver qué grupo se queda y cuál se va — que es justo lo que necesitas saber cuando pruebes en dos sitios distintos.
- **Quién usó qué**: el listado muestra cada código con el nombre de quien lo canjeó.
- Crear y listar códigos exige `ADMIN_TOKEN`; sin él devuelve 403.

## Estado

173 → **193 pruebas**, todas en verde. La suite nueva arranca dos servidores a la vez, uno abierto y otro cerrado, para comprobar que activar la beta cerrada no rompe el registro normal.

## Lo que queda

- PostgreSQL conectado (migraciones escritas; el JSON con copias aguanta la escala de una beta cerrada de sobra).
- Guerras de gremio.
- Integración on-chain de CGRID — necesita abogado antes que programador.

Con esto están cubiertas las tres piezas de la Fase B del plan: el juego arranca en un servidor, los jugadores saben qué hacer al entrar, y puedes controlar exactamente quién entra y de dónde viene. Lo que falta ya no es código.
