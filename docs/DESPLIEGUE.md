# Cómo ejecutarlo

## En tu máquina

```bash
node build.js            # solo si has tocado src/
node criptomundo.js   # http://localhost:3000
```

Necesitas Node.js 18 o superior. No hay `npm install`: no hay dependencias.

Junto al ejecutable tiene que estar la carpeta `assets/`, o las skins ilustradas no cargarán. Si la tienes en otro sitio, usa `ASSETS_DIR`.

## En un servidor

```bash
NODE_ENV=production \
PORT=3000 \
ADMIN_TOKEN=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))") \
DATA_FILE=/var/lib/criptomundo/datos.json \
node criptomundo.js
```

Lo mínimo antes de abrirlo a nadie:

1. **`NODE_ENV=production`** — activa cookies `Secure` y oculta el detalle de los errores.
2. **HTTPS por delante** (nginx, Caddy, Cloudflare). Sin TLS las cookies de sesión viajan en claro.
3. **`DATA_FILE` fuera de la carpeta del código**, para que un redespliegue no se lleve las partidas.
4. **`ADMIN_TOKEN` largo y aleatorio**, o el panel de analítica queda inaccesible.
5. **Copia de seguridad del JSON**. Es un solo archivo: un `cron` que lo copie cada hora ya es suficiente al principio.

### systemd

```ini
[Unit]
Description=CriptoMundo
After=network.target

[Service]
Type=simple
User=criptomundo
WorkingDirectory=/opt/criptomundo
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATA_FILE=/var/lib/criptomundo/datos.json
EnvironmentFile=/etc/criptomundo.env
ExecStart=/usr/bin/node /opt/criptomundo/criptomundo.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

El servidor atiende `SIGTERM` y guarda el estado antes de salir, así que `systemctl restart` no pierde partidas.

### Docker

```bash
docker build -t criptomundo .
docker run -d --name criptomundo \
  -p 3000:3000 \
  -v criptomundo-datos:/data \
  -e ADMIN_TOKEN=tu_token \
  criptomundo
```

La imagen trae `HEALTHCHECK` contra `/api/health`.

## Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | 3000 | Puerto |
| `HOST` | 0.0.0.0 | Interfaz |
| `NODE_ENV` | development | `production` activa cookies Secure y errores sin detalle |
| `DATA_FILE` | ./criptomundo-data.json | Dónde se guarda todo |
| `ASSETS_DIR` | ./assets | Imágenes de personajes |
| `ADMIN_TOKEN` | (vacío) | Abre `/admin.html` |
| `ALLOWED_ORIGINS` | (vacío) | CORS. Vacío = solo mismo origen |
| `REGISTER_LIMIT_PER_HOUR` | 20 | Cuentas por hora y por IP |
| `REQUEST_LIMIT_PER_MINUTE` | 300 | Peticiones por minuto y sesión |

## Comprobar que va bien

```bash
curl localhost:3000/api/health     # {"ok":true,...}
node doctor.js                     # diagnóstico completo
node simular-jugadores.js 10 3     # 10 jugadores automáticos, 3 minutos
```

`doctor.js` sale con código 1 si encuentra algo de prioridad alta, así que sirve tal cual en un pipeline.

## Cuánto aguanta

La persistencia es un JSON en memoria que se vuelca a disco. Estimación honesta: va sobrado para decenas de jugadores concurrentes, y a partir de ahí conviene migrar a PostgreSQL, que ya está preparado en `migrations/001_init.sql` con volcado en `exportar-a-postgres.js`. Antes de tener jugadores de verdad, migrar es optimizar un problema que no existe.
