# PLAN VERTICAL SLICE — CriptoMundo

Este documento sustituye al `CHECKLIST_IMPLEMENTACION.md` original como plan de trabajo activo. El checklist de 40 sistemas sigue siendo válido como visión a largo plazo, pero no como orden de trabajo: intentar ejecutarlo entero en solitario es la forma más rápida de no lanzar nunca.

## La pregunta que hay que responder antes de construir nada más

> ¿Alguien juega 40 minutos seguidos sin que se lo pidas?

Hasta que la respuesta sea "sí", cada sistema nuevo es riesgo, no progreso. El panel `/admin.html` mide exactamente eso (`jugadoresQueSuperan40min` y la mediana de minutos por jugador).

## Alcance congelado del slice

Nada fuera de esta lista se construye hasta que el slice esté validado.

**Dentro:**
- 1 clase pulida (Guerrero o Mago — elige una y deja las otras ocultas)
- 1 zona (Bosque del Este) + el pueblo
- 5 enemigos, de los cuales 1 es minijefe con fases
- 1 mazmorra de 3 pisos (Cripta del Eterno)
- 8-10 misiones que enseñen el bucle: matar → recolectar → fabricar → equipar → volver
- Mercado y chat (ya funcionan)
- Progresión hasta nivel 10, con dos decisiones de build reales por el camino

**Fuera, hasta nueva orden:** raids, guerras de gremio, territorios, mascotas, temporadas, pase de batalla, transmog, encantamientos, clima, ciclo día/noche, casas más allá de lo que ya existe, PvP con clasificación, y **toda** la fase blockchain.

## Fases

### Fase A — Bucle (1-2 semanas)
El combate ya tiene telegrafía, fases de jefe, bloqueo, combos y elementos. Falta que se **note**: números de daño flotantes, aviso visual del ataque telegrafiado, feedback de botín. Sin eso, la profundidad existe pero el jugador no la percibe.

Criterio de salida: tú mismo juegas 30 minutos sin aburrirte.

### Fase B — 10 testers (1 semana)
Discord privado. 10 personas que no seas tú. Sin recompensas, sin airdrop, sin mencionar cripto. Miras `/admin.html` cada día.

Criterio de salida: mediana de sesión > 15 min y al menos 3 personas vuelven un segundo día por su cuenta.

### Fase C — Arreglar el abandono (2-3 semanas)
La columna roja del embudo dice dónde se pierde la gente. Se arregla **ese** paso, no otro. Se repite hasta que D1 > 30 %.

### Fase D — 50 testers y PostgreSQL (2 semanas)
La persistencia JSON aguanta desarrollo y quizá 50 jugadores concurrentes; a partir de ahí toca migrar. Las migraciones ya están escritas y hay script de volcado:

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
node exportar-a-postgres.js criptomundo-data.json > carga.sql
psql "$DATABASE_URL" -f carga.sql
```

### Fase E — Solo entonces, expandir
Con retención demostrada, se vuelve al checklist grande y se eligen los sistemas en el orden que pidan los datos, no el orden del documento.

## Métricas y sus umbrales

| Métrica | Dónde | Umbral sano | Qué significa fallar |
|---|---|---|---|
| Retención D1 | `/admin.html` | > 30 % | El primer contacto no engancha |
| Retención D7 | `/admin.html` | > 12 % | Hay bucle pero no razón para volver |
| Mediana de sesión | `/admin.html` | > 15 min | El bucle se agota rápido |
| Mayor caída del embudo | `/admin.html`, columna roja | ningún paso pierde > 40 % | Ese paso concreto está roto |
| Oro creado − quemado | `/economia.html` | cercano a 0 en el tiempo | Inflación: los precios subirán y los nuevos no podrán competir |
| Oro por hora jugada | `/admin.html` | estable entre versiones | Alguien encontró una granja o un exploit |
| CGRID emitido / tope | `/economia.html` | tope no se toca a diario | La emisión es demasiado generosa |

## Comunidad antes que blockchain

El activo más valioso a los seis meses es gente que juega porque le gusta, no gente esperando un airdrop. Esa segunda comunidad se evapora el día del listado y además distorsiona todas las métricas de arriba: si atraes especuladores, tu D7 mide expectativa financiera, no diversión, y tomarás decisiones de diseño equivocadas.

Recomendación: Discord abierto, sin token, sin fecha de lanzamiento de token, sin promesas de valor, hasta terminar la Fase C.

## Modelo de negocio: decidir ya

Los cosméticos son el modelo correcto (no rompen el equilibrio, no son pay-to-win, encajan con el arte oscuro y dorado), pero solo funcionan con volumen alto de jugadores. Conviene tener un plan B explícito antes de necesitarlo: un pase de temporada honesto (solo cosméticos y comodidad, nunca poder), financiación externa, o aceptar que es un proyecto de portfolio y no un negocio. Las tres son respuestas válidas; no tener respuesta no lo es.

## Aviso legal

Desplegar CGRID en mainnet, con utilidad real y tesorería, entra en terreno regulado (MiCA en la UE, análisis de valores en EE. UU., normativa de juego si hay apuestas). Las apuestas PvP con valor real de la v2 ya están desactivadas por ese motivo. No soy abogado y esto no es asesoramiento legal: consulta con un abogado de tu jurisdicción **antes** de la Fase E, no después. Es la única parte del plan cuyos errores no se pueden revertir con un parche.
