# Cómo trabajar en el código

Hasta ahora todo vivía en un único archivo de 13.600 líneas. Funcionaba, pero editarlo era frágil: en dos ocasiones una edición mal escapada dejó el archivo corrupto y hubo que recuperarlo de la última entrega. Ahora el código vive troceado en `src/` y el archivo único se **genera**.

## El ciclo de trabajo

```bash
node build.js            # compila src/ → criptomundo.js
node build.js --watch    # recompila cada vez que guardas
node criptomundo.js   # arranca el juego en http://localhost:3000
```

Trabaja siempre en `src/`. **Nunca edites `criptomundo.js` a mano**: la siguiente compilación se lo lleva por delante. Si tienes dudas de si están sincronizados:

```bash
node build.js --check    # falla si el archivo está desfasado
```

## Estructura

```
src/
  server/
    00-header.js               cabecera y  const PAGES = {}
    10-infra.js                sesiones, contraseñas, rate limiting, persistencia
    20-skins.js                catálogo de aspectos y validación de apariencia
    30-personajes-combate.js   clases, objetos, progresión, motor de combate
    40-mundo-mercado.js        misiones, zonas, recetas, mazmorras, PvP, mercado, gremios
    50-telemetria.js           retención, embudo, economía
    60-http.js                 rutas de la API y arranque del servidor
  pages/
    index.js                   launcher y creador de personaje
    criptomundo-*.js           una página del juego por archivo
    economia.js / admin.js     transparencia pública y panel de analítica
assets/skins/                  imágenes de los personajes
```

El orden de concatenación es: cabecera → páginas → núcleo por número de archivo. Los archivos del servidor van numerados justo para eso; si añades uno nuevo, ponle un número que refleje dónde debe ir (por ejemplo `45-eventos.js`).

## Añadir cosas

**Una página nueva**: crea `src/pages/mi-pagina.js` con `PAGES['mi-pagina.html'] = ` y el HTML dentro de un template literal. La detecta sola.

**Un módulo de servidor**: crea `src/server/NN-loquesea.js`. Todo comparte el mismo ámbito, así que las funciones de un módulo son visibles desde los demás sin importaciones.

**Un personaje**: ver `COMO_AGREGAR_SKINS.md`.

## Ojo con los template literals

Las páginas son cadenas dentro de un template literal. Dentro del HTML embebido hay que escapar las comillas invertidas y `${`:

```js
PAGES['ejemplo.html'] = `<!DOCTYPE html>
<script>
  const saludo = \`Hola \${nombre}\`   // escapado
</script>`
```

Es la causa de casi todos los errores de sintaxis al editar páginas. Si `node build.js` compila pero `node --check criptomundo.js` falla, mira ahí primero.

## Antes de publicar

```bash
npm test
```

Lanza las doce suites rápidas en orden, cada una en su puerto. **La lista vive en `package.json`, no aquí**: mantener a mano una copia de los nombres y los totales es garantía de que se queden desfasados (ya pasó: esta sección llegó a listar seis suites de doce y un total de 139 pruebas cuando iban 235).

Si quieres lanzar una sola, mira el comando `test` de `package.json` y copia su invocación. Usa un puerto distinto en cada una: si dos coinciden, la segunda falla por colisión de puerto y no por un fallo real.

Dos suites van aparte porque son lentas:

```bash
npm run estabilidad     # ~90 s · nada crece sin techo
npm run concurrencia    # ~2 min · no se puede duplicar oro ni objetos
```

Y dos herramientas que no son pruebas pero conviene pasar antes de un despliegue:

```bash
npm run doctor          # diagnóstico priorizado
npm run beta            # revisa la configuración de producción
```
