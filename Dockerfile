# CriptoMundo — imagen mínima. Sin dependencias que instalar.
FROM node:20-alpine

WORKDIR /app
COPY criptomundo.js ./
COPY assets ./assets

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATA_FILE=/data/criptomundo-data.json

# Los datos viven fuera de la imagen para que sobrevivan a un redespliegue
VOLUME ["/data"]
EXPOSE 3000

# ADMIN_TOKEN y ALLOWED_ORIGINS se pasan al arrancar, no se hornean aquí
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

USER node
CMD ["node", "criptomundo.js"]
