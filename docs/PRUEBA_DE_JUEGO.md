# Cómo ejecutar la primera prueba de juego

Esta es la única tarea pendiente del proyecto que no es código. El objetivo no es que la gente diga que le gusta: es averiguar **en qué minuto se aburren y en qué pantalla se pierden**.

Con 6 a 10 personas basta. Más no aporta nada a estas alturas y complica el seguimiento.

---

## Antes: dejarlo en marcha (1 hora)

### 1. Un servidor con HTTPS

Cualquier VPS de 5 € sirve; el juego aguanta 300 jugadores simultáneos y aquí van a ser diez. Lo que **no** es opcional es el HTTPS: sin él las sesiones no funcionan y nadie podrá entrar (ver `docs/DESPLIEGUE.md`).

```bash
INVITE_ONLY=1 \
NODE_ENV=production \
ADMIN_TOKEN=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))") \
DATA_FILE=/var/lib/criptomundo/datos.json \
node criptomundo.js
```

Apunta el `ADMIN_TOKEN` en algún sitio: sin él no verás la analítica.

### 2. Comprobar que está listo

```bash
ADMIN_TOKEN=xxx npm run beta
```

No repartas nada mientras haya un 🔴. Los 🟡 son opinables; los 🔴 impiden jugar.

### 3. Pruébalo tú primero, en el móvil

Media hora, con tu teléfono, como si no lo hubieras hecho tú. Crea un personaje desde cero. Si algo te chirría a ti, a un desconocido le va a chirriar el doble — y quemar una invitación en un fallo evidente es desperdiciarla.

Mira en concreto: el joystick del mapa (¿el tamaño y la sensibilidad se sienten bien?), el texto en pantallas estrechas, y si la lista de Primeros pasos se entiende sin que nadie te la explique.

### 4. Generar los códigos

```bash
ADMIN_TOKEN=xxx node preparar-beta.js 10 --url=https://tudominio.com --etiqueta=discord
```

Un enlace por persona. Si los repartes en dos sitios distintos (por ejemplo amigos y un servidor de Discord), genera dos tandas con etiquetas distintas: después podrás ver qué grupo se queda y cuál se va.

---

## Durante: los primeros tres días

### Qué pedirles

El script imprime un mensaje listo para copiar. La frase que importa es esta, y conviene no suavizarla:

> Lo que me sirve de verdad: que juegues un rato y me digas cuándo te aburriste o te perdiste. No hace falta que seas amable con eso, al revés.

Si les pides opinión, te dirán que está muy bien. Si les pides el minuto exacto en que dejaron de tener ganas, te dan información.

### Qué NO hacer

- **No les expliques cómo se juega.** Si necesitan que se lo cuentes, ese es el hallazgo. Aguanta la tentación de ayudar por el chat.
- **No parchees en caliente** durante la prueba. Si cambias el juego a mitad, los datos de antes y de después dejan de ser comparables. Apunta y arregla al final.
- **No pidas que jueguen mucho.** Que jueguen lo que les apetezca es exactamente el dato que buscas.

### Qué mirar cada día

En `/admin.html`, con tu `ADMIN_TOKEN`:

| Número | Dónde | Qué significa si está mal |
|---|---|---|
| Invitados que crearon personaje | embudo, paso `register` | El problema es el registro o el enlace, no el juego |
| Mediana de minutos por sesión | resumen | Por debajo de 15, el bucle se agota antes de enganchar |
| Columna roja del embudo | embudo | El paso donde la gente deja de avanzar. **Ese, y solo ese, es lo siguiente que tocar** |
| Vuelven un segundo día | retención D1 | Por debajo del 30 %, el juego funciona pero no apetece |

Y en `/economia.html`: si el oro creado supera con mucho al quemado varios días seguidos, la economía se está inflando y los precios subirán hasta que un jugador nuevo no pueda comprar nada.

---

## Después: qué hacer con lo que salga

### Ordena por dónde duele, no por lo que apetezca arreglar

Casi seguro vas a tener una lista de veinte cosas. La mayoría no importan. Quédate con:

1. **El paso del embudo con la caída más grande.** Uno solo.
2. **Lo que más de una persona mencionó sin que preguntaras.** Si tres dicen lo mismo, es real; si lo dice uno, puede ser gusto personal.
3. **Cualquier cosa que impidiera jugar** (un error, una pantalla rota en su móvil).

Todo lo demás va a una lista de "algún día" y se queda ahí.

### Preguntas para el final, si quieres cerrar con una conversación

Cortas y concretas. Las abiertas dan respuestas amables e inútiles.

- ¿En qué momento dejaste de tener ganas de seguir?
- ¿Hubo algún momento en que no supieras qué hacer? ¿Cuál?
- ¿Qué hiciste la segunda vez que entraste? (Si no hubo segunda vez, ¿por qué?)
- Si un amigo te preguntara de qué va esto, ¿qué le dirías?
- ¿Algo te pareció injusto o roto?

La última pregunta suele sacar los fallos de balance que las métricas no ven.

---

## Cómo saber si ha ido bien

No hace falta que sea un éxito. Hace falta que sea **informativo**. La prueba ha salido bien si al terminar puedes contestar estas tres cosas con datos y no con intuición:

1. ¿En qué momento concreto pierde a la gente?
2. ¿Vuelve alguien al día siguiente por su cuenta?
3. ¿Qué es lo único que arreglarías antes de enseñárselo a diez personas más?

Si la respuesta a la segunda es "nadie", eso es un resultado, no un fracaso: significa que el trabajo siguiente está en el bucle de juego y no en añadir sistemas. Es información que ahora mismo no tienes y que ninguna herramienta del repositorio puede darte.

---

## Recordatorios de seguridad

- Los códigos de invitación son de un solo uso: si alguien te dice que el suyo no funciona, mira `node invitaciones.js listar` antes de darle otro; puede que ya lo usara.
- Haz una copia del archivo de datos antes de tocar nada al terminar. El servidor ya guarda copias en `backups/`, pero llévate una fuera de la máquina.
- Si algo se cae, `salida.log` y `npm run doctor` son el primer sitio donde mirar.
