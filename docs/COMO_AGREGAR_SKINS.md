# Cómo añadir un personaje nuevo

Está pensado para que sea una sola entrada de datos. No hay que tocar la interfaz: el creador de personaje se construye solo a partir de lo que devuelve `/api/skins`.

## Pasos

1. Copia el PNG a `assets/skins/`.
2. Abre `criptomundo.js`, busca `const SKINS = [` y añade una entrada:

```js
{
  id: 'mi_personaje',                       // no lo cambies nunca: es lo que se guarda
  name: 'Nombre Visible',
  lore: 'Una línea de descripción.',
  file: 'mi_personaje_full.png',            // ilustración grande, o null
  portrait: 'mi_personaje_portrait.png',    // recorte del rostro (opcional)
  avatar: 'mi_personaje_avatar.png',        // versión pequeña (opcional)
  emoji: '🐸',                              // respaldo si falta el archivo
  unlock: 'default',                        // 'default' | 'level:10' | 'locked'
  tint: false,                              // true si se puede recolorear
  palette: { skin: '#5A9A3A', hair: '#3A7A2A', outfit: '#F0E8D0', accent: '#F0D070' },
},
```

3. Reinicia el servidor. Ya aparece en el creador, en la barra superior y en el perfil.

## Campos

| Campo | Para qué sirve |
|---|---|
| `id` | Identificador guardado en el personaje. Cambiarlo rompe los personajes existentes. |
| `file` | Ilustración grande. Si es `null` se usa el emoji. |
| `portrait` | Recorte cuadrado del rostro para rejillas y perfil. Si falta, se usa `file`. |
| `avatar` | Versión pequeña para la barra superior. Si falta, se usa `portrait` y luego `file`. |
| `unlock` | `default` lo ve todo el mundo; `level:10` exige nivel 10; `locked` no es obtenible todavía. |
| `tint` | `true` muestra los selectores de color. Ponlo en `false` para ilustraciones fijas. |
| `palette` | Colores por defecto. Con `tint: false` son fijos. |

## Tamaños recomendados

Un PNG de 1,5 MB como avatar de 30 píxeles es tirar ancho de banda. Las tres variantes que ya existen se generaron así:

| Variante | Tamaño | Peso aproximado | Dónde se usa |
|---|---|---|---|
| `full` | alto 600 px | 380-400 KB | Vista previa del creador |
| `portrait` | 256×256 | 100-150 KB | Rejilla de aspectos, perfil |
| `avatar` | 96×96 | 20-25 KB | Barra superior del juego |

Si solo aportas la ilustración grande funcionará igual (hay respaldo automático), pero el juego cargará más lento.

## Notas de seguridad

El servidor nunca se fía de lo que manda el cliente: `sanitizeAppearance()` comprueba que la skin exista y esté desbloqueada, y que cada color sea un hex válido. Cualquier otra cosa se sustituye por el valor por defecto de la skin. Por eso puedes añadir entradas sin revisar la validación.

## Para más adelante

- **Desbloqueos**: `unlock: 'level:10'` ya funciona. Para desbloqueos por logro o compra habría que ampliar `skinUnlocked()` — es una sola función.
- **Sprites de animación**: hoy cada skin es una imagen. Cuando tengas hojas de sprites, añade un campo `sprites: { idle: '...', walk: '...' }` y úsalo en las páginas que lo necesiten; el resto seguirá funcionando con `file`.
- **Cambiar de aspecto en el juego**: el endpoint `POST /api/character/appearance` ya existe y está probado. Solo falta un botón en el perfil que abra el mismo selector del creador.
