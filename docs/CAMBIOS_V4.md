# CriptoMundo v4 — qué trae y qué se aprendió

La v4 no añade sistemas de juego nuevos. Añade lo necesario para **ejecutar** el proyecto fuera de tu máquina y para **medir** en qué mejorarlo sin depender de la intuición.

## 1. Ejecutarlo

```bash
npm start                # arranca en http://localhost:3000
npm run dev              # compila y arranca
npm test                 # las 139 pruebas
npm run doctor           # diagnóstico y recomendaciones
npm run simular          # cohorte de 10 jugadores automatizados
```

- `package.json` con los comandos, sin ninguna dependencia.
- `Dockerfile` y `DESPLIEGUE.md` para publicarlo en un servidor real.
- **Avisos de configuración al arrancar**: el servidor te dice en la propia consola si falta `ADMIN_TOKEN`, si `NODE_ENV` no es production o si el CORS está abierto de más.
- **Apagado ordenado**: `SIGINT`/`SIGTERM` vuelcan el estado a disco antes de salir, así que reiniciar ya no pierde la última partida.

## 2. Herramientas de diagnóstico

**`doctor.js`** arranca contra el servidor, juega una partida automatizada y devuelve una lista priorizada de lo que conviene arreglar: configuración, balance, progresión, dificultad, misiones imposibles, economía y recorridos rotos. Distingue entre lo que está bien, lo que puede esperar y lo urgente.

**`simular-jugadores.js`** crea una cohorte de jugadores automatizados que juegan de verdad y llena el embudo y la economía, para poder mirar el panel de analítica antes de tener personas.

Las dos avisan de lo mismo al terminar: **esto mide balance, no diversión**. Un bot no se aburre ni se va.

## 3. Lo que el diagnóstico encontró (y ya está corregido)

Esta es la parte que justifica las herramientas: al ejecutarlas por primera vez salieron tres problemas reales que no se veían leyendo el código.

| Problema detectado | Antes | Ahora |
|---|---|---|
| Combate demasiado largo | 8,4 turnos por enemigo | 4,7 turnos |
| Nivel 5 (requisito de la primera mazmorra) inalcanzable en el arranque | 29 enemigos | 12 enemigos |
| Jugadores simulados que llegaban a la primera mazmorra | 10 % | 100 % |
| Atacar sin pensar contra un enemigo superior | sin castigo | cuesta el 57 % de la vida |

Los cambios concretos:

- Curva de experiencia partida en dos tramos: los primeros niveles son baratos a propósito.
- Vida y daño de los enemigos iniciales reajustados; ataque básico un poco más fuerte.
- **Subir de nivel ya no cura del todo** (cura la mitad). Antes el daño nunca se acumulaba entre combates y las pociones no servían para nada.
- Los ataques telegrafiados pegan más (×2,6, ×3,2 en jefes) y además rompen el combo y quitan maná si no los bloqueas o interrumpes. Así bloquear tiene sentido.

También se corrigió el propio diagnóstico: medía la dificultad peleando contra las arañas del tutorial, y que esas no maten es justamente lo correcto. Ahora la mide contra un enemigo por encima de tu nivel, que es donde la decisión de bloquear importa.

## 4. Lo que sigue pendiente

El diagnóstico lo repite cada vez que lo ejecutas:

- PostgreSQL conectado (las migraciones están escritas, la persistencia JSON aguanta hasta decenas de jugadores).
- Chat en tiempo real (hoy por sondeo).
- Guerras de gremio.
- Integración on-chain de CGRID — la parte con implicaciones legales, ver `PLAN_VERTICAL_SLICE.md`.

Y lo que ninguna herramienta puede darte: **jugadores**. El embudo, la retención y el abandono real solo salen de personas. El panel `/admin.html` lleva listo varias versiones y sigue vacío de datos reales.
