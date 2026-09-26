# Historial de cambios

Cada versión con lo que la motivó. Los detalles completos están en `docs/CAMBIOS_VN.md`.

## v33 (en curso) — Combate estilo Terraria y barra de objetos

### Los monstruos del mapa ya son del servidor, y los mismos para todos

Hasta ahora los inventaba el navegador. Cada jugador colocaba los suyos
donde le salía, y dos personas en el mismo bosque veían arañas distintas y
no podían pelear con la misma. Ahora son del servidor, compartidos por
zona, con su vida y su posición decididas ahí, a cien pasos por segundo,
con el mismo motor que la arena.

El motor, por cierto, ya existía: las fases del golpe, el sector de
alcance y arco, «un golpe toca una vez», el retroceso y la separación de
cuerpos vivían dentro de la arena y no tenían nada de arena. Ahora son un
módulo compartido. La extracción no cambió ni un número.

### Bloquear era imposible, y lo dijo la medición

El aviso del golpe salía de la tabla en 300 milisegundos. Medido, ver el
gesto ya cuesta 121 ms y otro tanto tarda en llegar tu respuesta: al
jugador le quedaban menos de 60 ms para decidir. O sea que una de las dos
mecánicas que deciden el juego —lo demostró el banco de balance— no
existía en el mundo nuevo.

Ahora el suelo son 500 ms, que no es un número redondo: es 121 de ver, más
250 de reaccionar, más 121 de que llegue. Antes del cambio, una pelea
bloqueando registraba **cero** bloqueos. Después registra dos y ahorra el
77 % de la vida, idéntico en dos tiradas.

### Había dos barras de objetos, y una era mía

`/api/hotbar` existía desde el sistema de recolección: ocho ranuras para
tener a mano el hacha y el pico. Al hacer la barra que pedía el encargo
escribí una segunda sobre el mismo campo, con diez ranuras y otro formato.
No rompió nada porque nacía apagada, pero en cuanto se hubiera encendido,
cada petición habría tenido a los dos sistemas rehaciéndose el array el
uno al otro.

Mi propia auditoría no lo vio: repasé nueve puntos del combate y en
ninguno pregunté si ya existía algo parecido a lo que iba a construir.

Ahora hay una sola, y se queda con lo mejor de cada una. De la vieja, que
en la barra quepa todo lo que tengas y no solo armas: nació para las
herramientas y eso no se rompe. De la nueva, que la ranura recuerde lo que
iba en ella, para que beberte la última poción no te borre el hueco.

### La auditoría dijo que medio motor ya estaba escrito, en el sitio equivocado

Antes de tocar nada se releyó el encargo punto por punto contra el código.
Casi todo lo que pedía la fase de servidor —ventanas de golpe, sector de
alcance y arco, «un golpe toca una vez», retroceso, invulnerabilidad,
proyectiles con colisión por segmento, IA con aviso— ya existe. Vive dentro
de la arena. Lo que no existe son los monstruos del mapa: los inventa el
navegador en posiciones al azar, uno por jugador, y el servidor no sabe ni
dónde están ni cuánta vida les queda.

Y la latencia no es de red. El viaje HTTP son dos milisegundos y *mejora*
con cuatro jugadores. Lo que se nota es el paso de 100 ms: de pulsar a ver
el gesto pasan 98 ms. Eso convierte la predicción visual en obligatoria, no
en un adorno.

### Trece cosas del encargo que no encajaban con el código

La más peligrosa: el encargo escribe el arco de las armas en grados
totales, y el código lo tiene en radianes y como semi-apertura. Leer
`arco: 120` tal cual son **120 radianes**: el arma acertaría en cualquier
dirección, incluso a la espalda. Las demás, en la auditoría.

### El perfil de arma no declara armas: las lee

Cinco de los siete campos que pedía el encargo ya existían, y no son
números puestos a ojo: salen de una curva contra el precio de cada arma que
en su día corrigió ocho. Añadirlos otra vez habría creado un tercer
catálogo que se desincroniza. Ahora hay una precedencia escrita —lo que
diga `ARMAS`, luego lo que diga el objeto, luego el defecto de su tipo— y
ningún arma que ya existe cambia de nada.

De paso queda contestada una pregunta del encargo: los cuatro tipos de arma
se pueden usar hoy. Nueve espadas, una lanza, dos arcos y dos de magia. Lo
único que falta es el gasto de maná, que hoy es cero en todas.

### La barra recuerda lo que iba en cada hueco

Guarda el identificador del objeto y no el de la fila del inventario, y eso
no es un detalle: la fila desaparece cuando te bebes la última poción. Con
la fila, la ranura se quedaría apuntando a nada. Así se queda en gris,
diciendo «aquí van pociones», y se rellena sola en cuanto consigas más.

### Una función declarada dos veces no da error, y eso costó caro

Añadiendo el perfil de arma declaré un `perfilDe` sin saber que ya existía
otro, el que sirve el perfil del jugador. Todo el servidor se concatena en
un solo archivo: la segunda pisa a la primera en silencio. El archivo
parseaba, el servidor arrancaba, y `/api/profile` empezó a devolver el arma
equipada en vez del perfil. Lo cazó una prueba de la arena, de casualidad,
tres pasos más allá.

Ahora el build lo comprueba. Las constantes repetidas ya reventaban al
compilar; las funciones no.

## v32 (en curso) — El mundo deja de pelear consigo mismo

### El mercado se quedaba tu objeto cuando la publicación caducaba

Repasando el encargo fase por fase apareció esto, que no es un detalle.

Al publicar algo, el objeto sale de tu inventario y queda retenido en la
publicación. Cancelarla te lo devuelve. Venderla se lo da al comprador.
Y caducar... no hacía ninguna de las tres cosas: el objeto se quedaba
dentro de la publicación para siempre y lo perdías sin que nadie te
avisara. Dos días de plazo y se lo tragaba.

Había un segundo lado. El estado solo pasaba a caducado **dentro de la
compra**, o sea solo si alguien intentaba comprarla. Una publicación
vencida a la que nadie picara seguía anunciándose en la tienda como
comprable: se veía la oferta, se pulsaba, y contestaba que ya no valía.

Ahora hay un barrido que corre una vez por minuto y también al entrar en
la tienda. Devolver puede fallar —inventario lleno, vendedor sin cargar—
y en ese caso se deja pendiente y se reintenta, en vez de tirar el objeto,
que era justo el fallo que se estaba arreglando. Las publicaciones de
arranque nunca salieron del inventario de nadie, así que no se les inventa
nada. Y las partidas ya guardadas se reparan solas en el primer barrido.

### Cuatro flujos que la FASE 21 pedía y nadie había comprobado

Caducidad en el mercado, crecimiento del huerto con el servidor apagado,
cosechar dos veces la misma parcela y sembrar una semilla que no existe.
Los tres últimos ya funcionaban; simplemente nadie lo había mirado. El
primero no funcionaba.

Los cuatro comparten la misma dificultad: no se ven sin dejar pasar el
tiempo. Así que se para el servidor, se envejecen los datos en disco y se
vuelve a arrancar.

### Y dos cosas de la FASE 14 que la herramienta de arte no miraba

Una es la transparencia: un PNG sin canal alfa se pinta con su fondo, y
sobre el mundo eso es un rectángulo de color alrededor del dibujo. Ahora
se lee el tipo de color del PNG y se canta.

La otra es el anclaje. La fase dice «nunca asumir que todos los sprites
tienen el mismo anchor». El mecanismo está —cada arma puede declarar por
dónde se sujeta y a qué ángulo viene su hoja— pero ninguna lo declara:
las tres caen al mismo valor por defecto, que es exactamente la
suposición prohibida. `npm run arte` ahora lo nombra arma por arma. No he
inventado los valores: no se pueden elegir sin mirar cada dibujo.

Por el camino apareció un fallo mío: el lector del catálogo de objetos iba
línea a línea, y las tres espadas con dibujo propio son justo las fichas
partidas en dos. La herramienta se saltaba exactamente las fichas que
tenían arte. Decía «10 archivos puestos» y los diez eran de aspectos: ni
un solo PNG de objeto se había comprobado nunca.

### Seis de los siete aspectos se deslizaban por el mapa

`npm run arte` dice que faltan 77 dibujos y que los seis que más se notan
son las animaciones de caminar. Solo la Zarigüeya Laureada tiene tira de
fotogramas; los otros seis aspectos son un emoji al que, al moverse, se le
cambia la posición y se le voltea a izquierda o derecha. Nada más. El
personaje se desplazaba como una pieza de ajedrez.

La causa no es que falte arte. Es que la animación se escribió como «si
hay tira, reprodúcela», y el camino de al lado —el que se recorre casi
siempre— no tiene respaldo: no hay nada.

Y había un dato desperdiciado. Desde que existe el mundo compartido, el
cliente manda `anim` (walk o idle) con cada pulso y el servidor lo devuelve
con cada vecino. La pantalla nunca lo leyó, así que los demás jugadores se
deslizaban igual.

Ahora hay un respaldo procedural: no dibuja piernas, pero mueve el cuerpo
como se mueve al andar —sube y baja con cada apoyo, se ladea hacia la
pierna que pisa, se achata al plantar el pie y la sombra se estrecha
cuando el cuerpo está arriba—. Se aplica a tu personaje y a todos los
vecinos, y **se apaga solo** en cuanto un aspecto traiga su tira de verdad.

Tres detalles que costaron más que el efecto:

- La cadencia la marca la **distancia recorrida**, no el reloj. Con un
  temporizador, andar despacio con el mando táctil se vería como patalear
  en el sitio.
- La cámara sigue al personaje, así que el bote del cuerpo se lo comía el
  encuadre y **temblaba el mapa entero**. El desvío de la cámara descuenta
  exactamente lo que sube el cuerpo, y se pone a cero también cuando hay
  tira: el aspecto se carga por la red y llega tarde, así que el respaldo
  corre un rato antes; sin eso el encuadre se quedaba torcido para siempre.
- La constante de apagado era exponencial y no terminaba nunca: medido, el
  cuerpo seguía botando **1.072 ms** después de soltar la tecla, seis veces
  lo que decía la constante. Ahora sube y baja a ritmo constante y se posa
  en los 180 ms que anuncia.

Nada de esto toca el servidor ni decide nada del juego: ni posición, ni
colisión, ni velocidad. Solo elige cómo se pinta lo que ya se decidió.

### La dificultad no estaba en los números: estaba en dos mecánicas que nadie te contaba

El proyecto trae sus propias herramientas de diagnóstico y no había
ejecutado ninguna. Las tres dicen cosas, y una dice algo incómodo.

`revisar-codigo-muerto`: nada. `revisar-materiales`: todas las recetas se
pueden completar, y solo aparece un objeto del catálogo que no pide nadie,
el Corazón de Savia.

`banco-balance` es la que importa. Con un robot que **bloquea el golpe
anunciado y se cura por debajo de un tercio de vida**, la tasa de victoria
es del 100 % contra todo el bestiario, jefes incluidos, terminando con
entre el 43 % y el 94 % de vida. En las arenas, lo mismo: 100 % a todos
los niveles.

Y las mediciones del arranque dicen que un nivel 1 que no hace esas dos
cosas muere cuatro veces antes de llegar al nivel 3.

O sea que la dificultad de CriptoMundo no estaba en sus números. Estaba en
dos mecánicas, y el tutorial tenía once pasos y no mencionaba ninguna.

Una de las dos ya se enseñaba a medias: cuando el enemigo anuncia un golpe
fuerte, la pantalla avisa y resalta el botón de bloquear. Eso estaba bien.
Lo que faltaba era el otro lado: **nadie te dice que bebas**. Ahora, con
la vida por debajo de un tercio, el mismo aviso dice que bebas y aclara lo
que casi nadie deduce solo, que curarse no cuesta el turno de atacar. El
golpe anunciado manda sobre ese aviso: si hay las dos cosas, se ve la
urgente.

Y el tutorial tiene dos pasos nuevos, colocados justo detrás del primer
combate y no al final, porque de nada sirve enseñar esto en el paso once.

No se ha tocado ni un número del combate. El troll, la araña y el 30 % que
encaja un bloqueo siguen exactamente igual, y hay comprobaciones que lo
exigen.

### Tres fallos que salieron al hacerlo, y los tres míos

**Uno rompía el juego.** Puse dos campos nuevos en `out` antes de que `out`
existiera, así que beber en combate contestaba "Cannot access 'out' before
initialization" y dejaba de funcionar por completo.

**Otro rompía una pantalla.** El aviso de vida baja leía una variable
global que no siempre existe, y reventaba el reproductor del turno entero
allí donde faltaba. Ahora los topes de vida y maná viajan con la respuesta
del turno, que además quita el acoplamiento.

**Y el tercero era del lanzador de pruebas.** Un archivo que revienta no
imprime resumen, así que no sumaba ninguna fallida: la suite decía "0
fallidas" con un archivo en rojo encima. Eso es peor que no dar el número,
porque se lee como que todo fue bien. Ahora avisa aparte y con nombre.

### Y una prueba a la que le hice tres arreglos, dos de ellos malos

`test-arena-ventanas` da para una lección entera.

Fallaba dentro de la suite y pasaba suelta. Primer arreglo: preguntar cada
40 ms en vez de cada 100, para no perderse el suceso que vive un solo
paso. Correcto.

Eso rompió otra comprobación que decía "el daño llega como mucho tres
pasos después del gesto". Los pasos dependen de cada cuánto pregunte la
prueba, no del juego. Reescrita en milisegundos. Correcto.

Y entonces empezó a fallar SIEMPRE, y ahí me equivoqué dos veces. Primero
supuse que el enemigo se movía y añadí un reacercamiento; no era eso.
Hizo falta instrumentar una ejecución para verlo: **cada sondeo mandaba
`atacar: false`**, y preguntando cada 40 ms ese "no" llegaba antes del paso
de 100 ms del servidor y borraba el ataque. El arreglo de preguntar más
deprisa se estaba pisando a sí mismo. Ahora mantiene la intención pulsada,
que es además lo que hace un jugador.

Cinco ejecuciones sueltas y tres suites completas en verde.

### "Faltan sprites" no es accionable; una lista con nombres sí

El arte no lo puedo dibujar. Lo que sí se puede hacer es dejar de decir
"faltan sprites" y decir exactamente cuáles, dónde van y qué medidas
tienen que tener.

`npm run arte` recorre lo que el juego DECLARA —no una lista paralela,
que se queda vieja sin que nadie se entere— y cruza cada cosa con lo que
hay en disco. Salen tres números: diez archivos puestos, setenta y siete
por hacer, cero rotos.

Lo que más se nota son las seis animaciones de caminar que faltan: seis
de las siete skins se deslizan sin mover las piernas. Después vienen las
animaciones de golpe de las armas, cuyo mecanismo quedó comprobado hace
dos pasos.

Y sirve en las dos direcciones. Además de decir qué falta, comprueba lo
que ya está: si un dibujo no mide lo que declara su ficha, lo canta. Un
PNG del tamaño equivocado se ve mal y no avisa a nadie. Se le metieron
los dos casos rotos a propósito —una tira de skin con medidas que no
cuadran y una animación de arma que el servidor rechazaría— y los dos
salieron con su nombre y su motivo.

### Una prueba medía en pasos algo que se mide en milisegundos

Esta salió de rebote y es de las que enseñan.

`test-arena-ventanas` fallaba dentro de la suite y pasaba suelta. La
causa inmediata: el lanzador arranca las pruebas que miden tiempo al
final, pero los SERVIDORES de la tanda anterior tardan un momento más en
morir de verdad, así que empezaban a medir milisegundos encima de una
máquina todavía cargada. Ahora hay un respiro de dos segundos y medio.

La causa de fondo era otra. La prueba preguntaba cada 100 ms por un
suceso que vive exactamente un paso de 100 ms: bastaba con que una
petición tardara un poco de más para saltarse el paso en el que salió y
no verlo nunca. Preguntando cada 40 ms no se pierde ninguno.

Y al cambiar el ritmo del sondeo se rompió otra comprobación, que es lo
interesante: decía "el daño llega como mucho tres pasos después del
gesto". Los pasos dependen de cada cuánto pregunte la prueba, así que esa
frase pasó a querer decir 120 ms en vez de 300 sin que el juego hubiera
cambiado nada. Ahora está escrita en milisegundos, que sí es una
propiedad del juego y no del observador.

### La araña no tenía misión, y es el primer enemigo de todos

Salió al jugar una partida entera de principio a fin. La araña es lo que
se encuentra un personaje nuevo nada más salir al bosque: se matan seis
para llegar a nivel 3, y ninguna contaba para nada. La primera misión que
veía un recién llegado era matar ocho trolls, que a ese nivel lo
revientan.

Ahora la primera misión de la lista es matar cinco arañas. Cinco no es un
número redondo al azar: llegar a nivel 3 cuesta seis, así que la misión
se completa justo antes de subir y el jugador cobra a la vez que sube,
que es el momento en el que conviene que pase algo bueno.

La recompensa lleva tres pociones a propósito. La medición del arranque
decía que a un nivel 1 se le acaba la forma de curarse tras 3,8 arañas:
lo que le falta en ese punto exacto es justo eso, así que la primera
misión le enseña para qué sirven. Más 120 de oro y 120 de experiencia,
proporcionado a las otras misiones de nivel 1 del catálogo.

Las cinco misiones que ya había siguen intactas, y la araña conserva sus
mismos números.

**Y de paso salió una cosa del sistema que conviene saber.** Al aceptar
una misión, el progreso se siembra con lo que YA habías hecho. Si vienes
de subir a nivel 3 matando arañas, la misión de las arañas nace
completa. Está bien que sea así —premia lo que ya hiciste— pero significa
que "pelear la hace avanzar" no siempre se puede observar, y la prueba de
la partida completa daba en rojo por eso. Ahora comprueba lo que de
verdad cierra la costura: que la misión se pueda entregar y que pague.

### El juego premiaba dejarse matar

Me pediste que decidiera yo la dificultad del arranque. Antes de tocar
ningún número fui a mirar qué forma tiene de verdad ese combate, y lo que
salió no era un problema de dificultad.

Un personaje de nivel 1 tiene 1.150 de vida, mata a una araña en 5,2
turnos y muere en 12,5. O sea que **una pelea la gana con holgura**. Lo
que no puede es encadenarlas: cada araña le cuesta 478 de vida y entre
combate y combate no recuperaba nada.

Y ahí está lo que de verdad estaba roto: **no existía ninguna forma de
recuperar vida salvo morir**. Con las tres pociones de inicio daba para
3,8 arañas, y a partir de ahí morir era el remedio más barato del juego:
el 8 % del oro a cambio de media vida, frente a 20 de oro por 220 de
curación de una poción. Dicho claro, el juego premiaba dejarse matar. Eso
no es dificultad, es un bucle sin cerrar.

Así que no he tocado ni el daño, ni la vida, ni los monstruos. He cerrado
el bucle: fuera de combate se recupera vida y maná poco a poco.

**El ritmo no lo elegí a ojo, y el primer intento estuvo mal.** Puse 1 %
del tope cada cuatro segundos y lo medí: veinte segundos de descanso
devolvían 57 de vida contra los 478 que cuesta una araña. Descansar
seguía sin ser una opción y morir seguía siendo la jugada. El mecanismo
estaba bien y el número no.

Anclado a lo que cuesta una pelea —recuperar ese 42 % debe llevar más o
menos lo que lleva la pelea, alrededor de un minuto— sale 1 % cada
segundo y medio. Del suelo al tope, dos minutos y medio. Sigue siendo
mucho más lento que beber, así que las pociones no pierden sentido.

Medido con tres partidas de cada clase, de nivel 1 a nivel 3:

| Cómo se juega | Muertes antes | Muertes ahora |
|---|---|---|
| Peleando sin parar | 3,3 | 4,3 |
| Descansando un minuto entre peleas | — | 0,3 |

La primera fila es la importante: **peleando sin parar no cambia nada**,
dentro del ruido de la medición. Ninguna pelea es más fácil. Lo que
cambia es que ahora descansar sirve para algo, y por tanto dejarse matar
deja de ser la jugada óptima.

Dos agujeros evidentes, cerrados y con prueba: no se regenera con una
batalla abierta —si no, bastaría con dejar de atacar para curarse gratis
en mitad de la pelea— ni dentro de la arena, que lleva su propia cuenta
de la vida.

### Una partida entera, de registrarse a vender en el mercado

Cada sistema tenía su prueba y todas pasaban. Lo que no tenía prueba era
el VIAJE: registrarse, recolectar, fabricar, equipar lo fabricado, subir
de nivel, aceptar una misión y verla avanzar, pelear en la arena, entrar
en una mazmorra, vender a otra persona y medirse en PvP, todo con el
mismo personaje y de una sentada.

Los fallos de integración viven justo ahí, en las costuras entre sistemas
que cada prueba mira por separado: el objeto que se fabrica pero no se
puede equipar, la misión que cuenta bajas de un combate y no del otro, el
oro que se gana en un sitio y no llega al siguiente.

La partida completa tarda treinta segundos y pasa entera. Las costuras
aguantan: lo que sale del taller se equipa, se nota en la ficha y llega
al catálogo de la arena; lo que se vende le llega al comprador y el oro
al vendedor; el duelo mueve el rating.

Lo interesante fue lo que falló al escribirla, porque los tres fallos
eran míos y los tres enseñaron algo:

**La misión no avanzaba en cuarenta turnos.** La prueba cogía la primera
misión disponible —que a nivel 3 es la de trolls— y luego peleaba contra
arañas. Con razón no avanzaba. Ahora la prueba lee el objetivo de la
misión y pelea contra el bicho que pide ELLA. De paso dejó ver algo del
juego que conviene saber: **no hay ninguna misión para la araña**, que es
justo el bicho contra el que pelea todo el mundo al empezar.

**Cero bajas en la arena.** El personaje entraba después de cuarenta
turnos de pelea, a media vida, y se moría antes de matar a nadie. Lo que
medía entonces no era la arena sino el desgaste. Ahora entra curado, como
entraría cualquiera, y con un presupuesto medido: con los puños, la
primera araña cae sobre el paso 110.

**El oro bajaba 46 monedas y la prueba lo llamaba fallo.** Eran 938 × 5 %:
el servidor cobra ese porcentaje por perder en la arena, y lo cobró
correctamente. La comprobación exigía que el oro no bajara nunca, que es
una regla que el juego no tiene. Ahora comprueba la regla de verdad:
ganar paga, perder cuesta el 5 %, abandonar ni paga ni cobra.

### La regla principal del proyecto, comprobada en los 38 endpoints

La regla de la FASE 1 es una sola y vale para todo el juego: el servidor
decide el daño, la vida, la experiencia, el botín, el oro, el precio, el
resultado del combate, los enfriamientos y el resultado del PvP. El
cliente manda intenciones.

Eso se comprobaba en un puñado de sitios sueltos. Ahora se comprueba en
los treinta y ocho endpoints POST que tiene el servidor, y de la forma
más desagradable posible: a cada uno se le manda un cuerpo con todos los
campos de resultado que se le ocurrirían a alguien con la consola abierta
—oro, experiencia, nivel, vida, daño, botín, precio, enfriamiento,
resultado, rating— con valores absurdos. Después se mira si algo pegó.

La comprobación no podía ser "nada cambió", porque hay endpoints que SÍ
deben cambiar el oro o la experiencia. Lo que se exige es que los valores
INYECTADOS no aparezcan: que el oro no se dispare, que el nivel no salte
a 99, que la vida no pase de su tope, que el rating no lo ponga el
cliente, y que ninguno de los tres objetos marcadores —de los caros del
catálogo, para que no puedan llegar por otra vía— acabe en la mochila.

Además hay cuatro comprobaciones sobre el código mismo: que el servidor
no lea el daño, ni el oro, ni la experiencia, ni el botín, ni el precio
del cuerpo de la petición.

No pegó ninguno. Y para saber que la prueba sirve de algo, se le abrió un
agujero a propósito: un endpoint que sumara el oro que le mandaran. Saltó
por dos sitios a la vez, el de la cifra y el del código.

Hay un detalle que importa: la prueba exige que la mayoría de las
peticiones ENTREN en la lógica en vez de morir en el router. Sin eso, si
todo contestara 404 pasaría en verde habiendo comprobado exactamente
nada.

### Dos intermitentes más, la quinta y la sexta de la misma familia

Paralelizar la suite las sacó a la luz, porque con la máquina cargada los
tiempos se estiran y lo que dependía de la suerte deja de salir.

`test-mazmorra-jefe` exigía ver los DOS avisos de cambio de fase. Los
sucesos de la arena viven un solo tick —`tick()` empieza vaciando la
lista— así que cada respuesta trae solo lo del último paso; con la
máquina cargada alguno se pierde. Eso no es un fallo del jefe: es cómo
funciona el canal, y por el socket llegan todos. Lo que importa ya se
comprobaba contra el ESTADO y no contra los avisos —las fases suben, en
orden, con sus emisores y sus refuerzos—, así que basta con ver un aviso
para saber que el mecanismo existe.

`test-mundo-combate` daba tres turnos fijos esperando el golpe anunciado
del murciélago. El enemigo lo anuncia cada tres turnos suyos y el
murciélago se muere en cuatro golpes, o en tres si cae un crítico: la
ventana era justa. Ahora insiste hasta verlo y vuelve a empezar si el
bicho se muere antes, con un presupuesto medido.

### Catorce de las quince pantallas no tenían quien las ejecutara

Solo la arena tenía una prueba que EJECUTARA su código. Las demás se
comprobaban mirando el texto del HTML, y eso no distingue una pantalla
que funciona de una que revienta en la primera línea.

Así que se pasaron las quince por un DOM de mentira contra un servidor de
verdad, a ver qué salía. La respuesta honesta: **nada**. Las quince
cargan, todas declaran viewport y fijan la escala inicial, ninguna enlaza
un archivo que falte, y las cincuenta y tres rutas de API que usan entre
todas existen en el servidor. La capa de pantalla está mejor de lo que yo
suponía, y eso conviene decirlo en vez de inventarse trabajo.

Lo que sí faltaba era la red. `test-paginas.js` vigila ahora cuatro cosas
que se rompen en silencio:

- que ninguna pantalla lance un error al cargar;
- que ninguna llame a una ruta que no exista. La auditoría había
  encontrado el caso simétrico, endpoints sin nadie que los llamara;
  este es el que duele más, porque una pantalla que pide algo que no está
  se queda a medias sin decir por qué;
- que todas declaren viewport con escala inicial;
- que ningún archivo enlazado dé 404.

Una prueba verde desde el primer día no demuestra nada si no se sabe que
puede detectar algo, así que se le inyectaron los cuatro fallos de uno en
uno: una pantalla que revienta, una ruta inventada, un viewport borrado y
una imagen que no existe. Los cuatro salieron en rojo con el nombre del
archivo y el motivo.

La del mundo 2D monta una escena de Phaser y ejecutarla pide un navegador
con canvas y WebGL. Se comprueba lo que sí se puede: que su código
parsea, que Phaser se enlaza desde el propio servidor y que el CDN queda
detrás, solo de respaldo. Fingir un Phaser de mentira daría un verde que
no significa nada, y eso es peor que no probarlo.

### La suite tardaba media hora y paraba en el primer fallo

Eran dos problemas de la misma línea de `package.json`: cuarenta y tantos
comandos encadenados con `&&`.

El primero es que el primer fallo se lleva por delante a todos los que
vienen detrás. Un archivo en rojo tapaba treinta resultados, y no había
forma de saber si estaba roto uno o treinta y uno sin volver a lanzarlo
todo.

El segundo es que iba en serie. Cada archivo arranca su propio servidor,
y la auditoría había dejado escrito que la suite no se podía paralelizar
porque el límite de registro por IP se lo comerían entre todas.

Ese motivo no se sostiene, y conviene decirlo porque es el segundo
apartado de la auditoría que sale equivocado: cada prueba arranca su
PROPIO servidor y el contador de ese límite vive en la memoria de cada
proceso. Lo que sí había eran servidores huérfanos, y eso se arregló hace
ya varios pasos.

El obstáculo real era otro y no estaba en ese apartado. Cada prueba
esperaba un número fijo de milisegundos —entre 1.500 y 3.500— a que su
servidor arrancara. Con varios levantando a la vez eso no basta, y el
síntoma es un `ECONNREFUSED` que parece un fallo de la prueba y no lo es.
Salió en cuanto se probó de verdad: `test-movil` se cayó en el primer
intento en paralelo.

Ahora las cuarenta y cinco esperan a que el servidor CONTESTE, no a que
pase un rato. Y `run-tests.js` reemplaza la cadena de `&&`: lanza varias
a la vez, no para en el primer fallo, y al final enseña juntas las líneas
rojas de todo lo que haya caído. Las tres pruebas que miden tiempo
—velocidad, ventanas de golpe, duraciones de animación— van solas al
final, porque el paralelismo ensucia de verdad lo que miden.

Con el mismo lanzador y el mismo resultado en los dos casos, 45 archivos
y 1.139 comprobaciones sin un solo fallo:

| | En serie | En paralelo |
|---|---|---|
| Suite completa | 447 s | 168 s |

Que el paralelismo no cambie el resultado es la mitad del trabajo. Una
suite más rápida que además decide distinto no serviría de nada.

### Y una prueba que heredaba el mundo de la ejecución anterior

Paralelizar destapó otra cosa. `test-economia-objetos` publicaba tres
unidades en el mercado y compraba dos, y de pronto empezó a contestar
"Cantidad inválida". No había nada roto: el archivo de datos de la prueba
no se borraba entre ejecuciones, así que el mercado seguía teniendo la
publicación de la vez anterior —con una sola unidad ya— y la prueba
compraba sobre esa.

Funcionaba porque yo borraba ese archivo a mano cada vez que la lanzaba
suelta. El lanzador no lo hacía, y eso es justo lo que pasa cuando algo
depende de un gesto que no está escrito en ninguna parte.

Ahora las cuarenta y cuatro pruebas con archivo de datos propio lo borran
antes de arrancar su servidor. Y la del mercado busca SU publicación en
vez de la primera que aparezca: empezar de cero lo arregla también, pero
una prueba no debería depender de eso para saber cuál es la suya.

### La cuarta vez que la misma clase de defecto aparece en una prueba

`test-sesiones-persisten` daba un golpe a una araña y exigía que le
hubiera quitado vida. Un ataque falla el 5 % de las veces. Una de cada
veinte ejecuciones, en rojo sin que hubiera nada roto.

Es la cuarta: antes fueron `test-turnos`, `test-contenido` y
`test-seguridad`. Y esta la había escrito yo mismo, después de corregir
las otras tres. Conviene dejarlo escrito así de claro: saber que existe
un modo de fallo no basta para no repetirlo.

La regla, otra vez: una prueba que observa algo que el servidor decide
con un dado, o insiste hasta verlo con un presupuesto medido, o no lo
exige. Aquí se hacen las dos cosas. Para arrancar la batalla se insiste
hasta seis golpes. Y para comprobar que tras el reinicio el enemigo sigue
herido se dejó de exigir que la vida BAJE —eso obliga a acertar otro
golpe— y se exige lo que de verdad se quería saber: que no ha vuelto al
tope.

### La animación de arma que nadie había probado nunca

El código lleva versiones diciendo, con estas palabras, que "añadir la
animación será copiar un archivo, no tocar el renderer". La carpeta donde
irían esos archivos no existe. O sea que ese camino no se había ejecutado
jamás con un archivo de verdad, y si tuviera un fallo nadie lo sabría
hasta que alguien dibujara la primera animación y se encontrara con que
no aparece.

Lo que falta ahí es arte, y eso no lo arregla un paso de ingeniería. Lo
que sí se puede hacer es comprobar que la promesa es cierta.

La prueba nueva no dibuja nada: fabrica un PNG válido —Node no trae
encoder de imágenes, pero un PNG sin filtros es poco más que las filas en
crudo comprimidas con zlib— con la forma que el renderer espera, lo deja
en una carpeta de assets aparte y arranca el servidor apuntando ahí.
Luego recorre el camino entero: que el arma anuncia su tira con los
cuadros contados del propio archivo, que el PNG se sirve con su tipo, que
la tira llega a la PARTIDA y no solo al catálogo, y que un arma sin tira
sigue cayendo al gesto calculado en vez de romperse.

La promesa se cumple. Ahora está comprobado en vez de prometido.

Y de paso salió una trampa. El número de cuadros se saca de dividir ancho
entre alto, así que una tira cuyo ancho no sea múltiplo exacto del alto
daba un número equivocado: con 150×70 salían dos cuadros y el renderer
recortaba 70 px de ancho sobre un dibujo de 75, o sea medio arma
desplazada, sin que nada avisara. Ahora se rechaza y se dice por consola,
con el mismo criterio que ya se usaba con las skins: mejor no animarla
—que es exactamente lo que pasa hoy sin archivo— que dibujar algo roto en
silencio.

Mi primer intento de tira inválida para la prueba fue 140×70, y estaba
mal: eso sí son dos cuadros de 70 y la tira es perfectamente válida. La
comprobación lo dijo en rojo, que es para lo que está.

### Un enemigo podía meterse dentro del jugador, y la prueba que lo vigilaba fallaba por otra cosa

`test-movimiento` fallaba una de cada tres ejecuciones, y no siempre en
el mismo sitio. Lo cómodo habría sido echarle la culpa a la carga de la
máquina. Midiendo, resultó que había dos cosas distintas y una de ellas
era un fallo de verdad.

**La medida de velocidad estaba mal hecha.** Para comprobar que moverse
en diagonal no corre más que en recto, se cogía el paso MÁS GRANDE de una
tanda de pulsos. Pero el servidor integra por tiempo real, así que el
tamaño de un paso depende de lo que tarde esa petición HTTP: coger el
máximo era medir el jitter de la red. Salía recto=26,5 y diagonal=33,0, y
la prueba daba en rojo sin que el juego tuviera nada. Midiendo píxeles por
segundo reales —camino partido por tiempo transcurrido— la proporción sale
entre 0,70 y 0,78, cinco veces seguidas.

**La otra sí era un fallo.** El proyecto tiene escrito que lo que no puede
pasar nunca es que el centro de un enemigo quede dentro del cuerpo del
jugador: ahí ya no se sabe quién empuja a quién y el golpe se vuelve
ambiguo. Pasaba. Forzando el caso —el jugador metido en una esquina con
dos arañas encima— salía en 8 de cada 1320 instantes.

Encontrarlo costó tres hipótesis y dos de ellas eran mías y estaban mal.
No era falta de iteraciones: subir las pasadas de separación de 3 a 8 lo
bajaba a 2 de 1320 sin quitarlo. Tampoco bastaba repartir de lado lo que
no cabía. El motivo es que en una esquina el sistema está sobredeterminado:
el jugador no puede ceder porque la pared se lo impide.

Dos cambios lo arreglan. El orden dentro de cada pasada —bicho contra
bicho primero y el jugador después, para que la última palabra la tenga la
restricción que importa— y una comprobación final, ya con las paredes
aplicadas y nadie detrás que pueda deshacerla, que saca al enemigo por
donde haya sitio: el eje que los separa, los dos perpendiculares, o hacia
el centro del mapa, que siempre lo tiene.

Y un último detalle que costó una hipótesis de más: las posiciones viajan
REDONDEADAS al cliente, así que una distancia real de 15,05 llega como
14,3 y se lee como una violación que en el servidor no existe. Por eso el
empujón se pasa de largo píxel y medio.

Resultado: 0 de 3.960 instantes. Y la prueba ya no compara contra un
número puesto a ojo sobre el estadístico más ruidoso que hay. Exige dos
cosas separadas: que el solape habitual sea cero (mediana y p90 en 0,0) y
que el máximo no pase de lo que el servidor garantiza.

### Morir borraba todo lo que llevabas hecho en esa pelea

La auditoría dejó escrito que llegar a nivel 3 costaba entre 47 y 110
ataques según la suerte, y lo llamó por su nombre: eso no es dificultad,
es ruido. La misma acción cuesta cosas muy distintas por motivos que el
jugador no ve ni controla.

La causa no estaba en el balance. Al morir se BORRABA la batalla, así que
el siguiente intento empezaba contra un bicho intacto. Midiendo con un
guion fijo, seis vueltas de nivel 1 a nivel 3: **el 41 % de todo el daño
que hace el jugador se tiraba a la basura.** Uno de cada dos golpes que
daba, no contaba para nada.

Ahora el enemigo se cura media vida máxima y se queda donde estaba,
herido. Lo que se pierde al morir sigue siendo el oro, la vida y la mitad
del avance de esa pelea. Lo que ya no se pierde es todo.

Que la cura sea una fracción del MÁXIMO no es un detalle: es lo que
cierra el agujero evidente. Si se guardara la herida tal cual, un
personaje de nivel 1 podría matar a un dragón muriendo cuarenta veces,
picándole de tres en tres. Curando medio depósito por muerte, solo
progresa quien le quita más de medio depósito entre muerte y muerte:
contra un bicho de su nivel, sí; contra uno que le queda grande, nunca.
El límite se pone solo, sin una tabla de qué monstruo puede pelear cada
quién. Comprobado: 120 ataques y 37 muertes de un nivel 1 contra un
dragón no lo bajan del 84 % de su vida.

Las cifras del arranque, antes y después:

| | Antes | Después |
|---|---|---|
| Daño tirado a la basura | 41 % | 7 % |
| Ataques para llegar a nivel 3 | 40–59 | 36–53 |
| Muertes | 3–6 | 2–5 |

El juego queda algo más suave, y eso hay que decirlo: es la consecuencia
inevitable de dejar de borrar trabajo hecho. Lo que se buscaba era la
otra columna, la del ruido.

Y una cosa que no es un detalle de implementación: al morir, la barra del
enemigo SUBE. Un cambio de estado sin explicación se lee como un fallo
del juego, así que tanto la pantalla de combate como el mapa lo dicen con
palabras: sigue herido, tu avance no se ha borrado.

### El jefe de mazmorra peleaba igual en el primer segundo que en el último

Era una oleada más: un bicho con más vida y un acompañante. La última
sala de una mazmorra se jugaba exactamente igual que la primera. Lo
curioso es que el combate por turnos SÍ tiene fases para los jefes —está
escrito en su propio código— y el de tiempo real no tenía ninguna.

Ahora tiene tres. Por debajo del 66 % de vida la guarida despierta y
cuatro emisores empiezan a barrer la sala, así que ya no se puede pelear
plantado en un sitio. Por debajo del 33 % llama un refuerzo y los
emisores aprietan.

No hay sistema nuevo detrás. Usa los peligros que ya montan las salas de
trampa y los enemigos que ya trae la mazmorra en sus otras salas. Lo
único que hacía falta era un reloj que mire la vida del jefe y encienda
cosas al pasar por ciertos puntos.

Y aquí hay una cifra que conviene mirar, porque esto sí cambia el
equilibrio. Peleando pegado al jefe sin esquivar nunca, que es el caso
peor, la pelea costaba 447 de vida de media y ahora cuesta 606: un 36 %
más, y un 28 % más larga.

La primera versión salía al doble, 867. La mayor parte no venía de los
emisores sino de que llamaba dos refuerzos, y matar dos bichos más alarga
el combate, y un combate más largo es más daño recibido. Se bajó a un
refuerzo y el daño de los emisores del 6 % al 4 % de la vida máxima. Las
fases están para cambiar cómo se pelea, no para duplicar la factura.

La recompensa, el botín y el enfriamiento de la mazmorra no se han
tocado.

### La economía medía el oro y no medía los objetos

La curva de economía daba oro creado, oro quemado, neto, CGRID emitido y
bajas por hora. Faltaba la otra mitad: cuántos objetos entran y cuántos
salen del juego. Sin eso, un mercado con precios a la baja no se puede
distinguir de uno con demasiada gente vendiendo lo mismo, y son dos
problemas con soluciones opuestas.

Hay exactamente dos puntos de paso por los que entra y sale todo objeto
del juego, así que son el único sitio donde se puede contar sin que se
escape ninguno. Contarlo en cada sitio que reparte botín sería contar
quince veces y olvidarse de la decimosexta.

Lo delicado no era contar, era no contar de más. Comprar en el mercado no
crea nada: el objeto sale del escrow del vendedor y entra en la mochila
del comprador. Si eso contara como creación, el mercado parecería una
fábrica de objetos y la cifra mentiría justo donde más se mira. Tampoco
cuenta la ruta de pruebas, que reparte objetos de la nada y en producción
ni siquiera existe.

Cada entrada y cada salida lleva ahora un motivo, así que no solo se ve
cuántos objetos se crean sino de qué grifo salen: botín, recolección,
cosecha, fabricación, misión. Y el volumen de mercado y el precio
realmente pagado no llevan contador propio: se derivan del historial de
ventas, que ya guardaba la hora, el total y la comisión de cada una. Un
contador paralelo solo habría añadido una segunda verdad que se puede
desincronizar de la primera.

La página pública de economía enseña las dos tablas nuevas: objetos
creados contra destruidos por día, y lo que de verdad se paga por cada
objeto al lado de lo que se pide. Un objeto que se publica caro y no se
vende nunca solo se ve comparando las dos.

### La auditoría se equivocó en un sitio, y no se borró nada por ello

El apartado de código muerto decía que había nueve scripts `aplicar-*.js`
en la raíz, parches de una sola vez ya aplicados. Son ocho, y tres de
ellos no son parches: son inyectores vivos que mantienen bloques
compartidos en las dieciocho páginas desde un solo sitio, tienen su
comando en package.json y una prueba detrás cada uno. Borrarlos habría
roto tres comandos y tres pruebas.

Los otros cinco no estorban y son el registro de cómo se hizo algo.
Borrarlos no gana nada y pierde eso.

Así que no se ha borrado ninguno y lo que se ha corregido es la
auditoría. Queda escrito ahí porque una foto de partida que se equivoca
en silencio es peor que no tenerla.

### Tres de las seis salas de mazmorra no se jugaban

El combate de las mazmorras era real desde hacía versiones: las salas de
guardia, guardián y jefe usan el motor de arena. Las otras tres eran una
tirada instantánea. `Math.random()` decidía si el cofre estaba trampeado,
`Math.random()` contra la agilidad decidía si los dardos te daban, y el
santuario sumaba vida y avanzaba de piso. El jugador pulsaba una sala y
leía el resultado; no había nada que hacer bien ni mal.

Lo llamativo es que el motor para que fueran jugables ya estaba. Había
proyectiles con barrido, telegrafía, esquiva y empuje. Lo único que
faltaba era poder decir que un encuentro se gana haciendo algo que no es
vaciar la sala de enemigos.

Eso son dos piezas: un objetivo, que es un sitio al que ir y en el que
aguantar, y unos peligros, que son emisores fijos que avisan y disparan
en ciclo. Con eso:

- **El cofre** hay que forzarlo. Si está trampeado, cuatro emisores en
  cruz disparan a través de él, escalonados para que haya huecos. La
  sala es ese tira y afloja entre estarse quieto y apartarse.
- **El pasillo** hay que cruzarlo. Tres filas de dardos con fases
  distintas, para que pasar sea elegir el momento y no correr en línea
  recta. El sitio donde apareces queda por debajo de todas las filas a
  propósito: el daño llega por meterse en la trayectoria, no por
  existir.
- **El santuario** hay que alcanzarlo y beber. Es la sala sin peligro a
  propósito: en una mazmorra donde todo lo demás te quita vida, el sitio
  donde se recupera es el descanso.

Los números no se han tocado. El botín que da cada sala, el 35 % del
santuario y el daño que puede costar una trampa son los de antes. Lo que
cambia es de qué dependen.

El botín y la curación viajan por donde ya viajaba todo lo demás: el
botín se mete en la lista de la partida y la curación en la vida del
jugador, así que la mazmorra los recoge al cerrar la sala sin enterarse
de que esa sala era distinta.

### Otra prueba que fallaba una de cada veinte veces

`test-seguridad` daba dos golpes a una araña y exigía que el segundo le
quitara vida, para demostrar que la vida del enemigo sale de la batalla
guardada en el servidor y no de lo que mande el cliente. Un ataque falla
el 5 % de las veces. Cuando fallaba, la vida se quedaba igual y la prueba
daba en rojo sin que hubiera nada roto.

Es el tercer caso de la misma familia en este proyecto, después de
`test-turnos` y `test-contenido`: una prueba que observa algo que el
servidor decide con un dado tiene que insistir hasta verlo, con un
presupuesto medido, o no exigirlo. Ahora insiste hasta seis veces y el
mensaje de fallo dice la vida de antes, la de después y cuántos golpes
hicieron falta.

### Rozar a un enemigo costaba el golpe entero

En la arena, `radio` hacía tres trabajos a la vez: separar cuerpos para
que no se apilen, frenar contra la pared y decidir si un golpe toca.
Mezclados no se pueden ajustar por separado. Un cuerpo generoso —el que
hace falta para que media docena de sprites no se solapen— significaba
también una zona golpeable generosa, así que pasar rozando por el borde
de un enemigo contaba como recibir el golpe entero. Es exactamente lo que
hace que esquivar no se sienta como esquivar.

Ahora son dos cosas: `radio` es el cuerpo físico y `golpeable` es la zona
vulnerable. El jugador la tiene más pequeña que su cuerpo, 11 de 15,
porque lo vulnerable es el torso y no la huella entera del personaje.

Los enemigos la conservan igual a su cuerpo a propósito. Encogerla
subiría el daño por segundo del jugador, y esto es un arreglo de
sensaciones, no de balance. El gancho queda puesto por si algún bicho lo
necesita.

Y para no creerse eso sin medirlo: el mismo guion —plantarse delante de
los enemigos y atacar durante veinte segundos, seis veces— da 478 de vida
perdida de media antes del cambio y 484 después, con rangos de 350 a 595
y de 280 a 630. Plantarse cuesta lo mismo, porque el enemigo se acerca
hasta tenerte a tiro de todas formas. Lo que cambia es rozar.

### `build.js --check` decía "está al día" sobre un archivo roto

Se descubrió pisándolo: un bloque quedó pegado dentro de un literal de
objeto y `criptomundo.js` dejó de parsear. `node build.js` lo escribió sin
rechistar y `node build.js --check` contestó "está al día", porque solo
comparaba el texto generado contra `src/`. El ritual que documenta el
proyecto —compilar, comprobar, pasar pruebas— daba dos pasos en verde
sobre un archivo que Node ni siquiera podía cargar.

Ahora la compilación pasa el resultado por `new vm.Script()`, que compila
sin ejecutar nada, y si no parsea enseña las líneas de alrededor. Con
27.000 líneas, un número de línea a secas no sirve de nada.

### Reiniciar el servidor echaba a todos los jugadores

La cookie de sesión dura siete días. El token que la valida vivía solo en
memoria: `snapshotOf()` guardaba personajes, inventario, mercado y huerto,
pero no `sessions`. Así que cada despliegue devolvía a todo el mundo a la
pantalla de login.

Lo peor es que el síntoma no se parece a la causa. El jugador ve "me ha
cerrado la sesión sola" y no tiene forma de relacionarlo con un reinicio
que no vio. Nadie abre un informe por eso; simplemente vuelve a entrar y
le queda la sensación de que el juego pierde cosas.

Con las batallas por turnos pasaba algo más raro todavía. El código ya
preveía encontrarse partidas a medias guardadas de antes —hay un respaldo
en `escalaDaño()` para batallas viejas sin ese campo— pero ninguna batalla
llegaba a guardarse nunca. El respaldo defendía un caso imposible.

Ahora se guardan sesiones, batallas y los últimos 200 mensajes de chat. Al
restaurar se vuelve a filtrar por fecha, porque un archivo puede llevar
días parado y la mitad de lo que trae ya estar caducado. Entrar y cerrar
sesión escriben en disco en vez de esperar a que lo haga otra cosa.

Fuera se quedan, dicho en el código: las partidas de arena, que son una
simulación a 100 ms atada a sockets que al reiniciar ya no existen, y las
entradas a mazmorra en curso. Revivirlas dejaría a los jugadores dentro de
un combate que ya no controla nadie.

`test-sesiones-persisten.js` no simula el reinicio: mata el proceso del
servidor y lo vuelve a arrancar con el mismo archivo de datos.


### Una prueba que se callaba en vez de fallar

`test-contenido.js` dio 24 comprobaciones donde el día anterior daba 25.
Ninguna falló: una desapareció.

```js
const garrote = await buscar('wood_club')
if (garrote) {
  check('cambiar de arma cambia lo que ve la arena', …)
}
```

El garrote pide 4 de madera y 1 de cuero, y a esas alturas del guion el
inventario depende de cómo haya ido la recolección. Si falta algo, la
receta no sale, el `if` no entra y la prueba termina en verde habiendo
comprobado una cosa menos. Hubo que comparar dos ejecuciones línea a
línea para ver cuál era.

Una prueba que se calla cuando no puede probar algo es peor que una que
falla: da confianza sin haberla ganado. Ahora se reparten los materiales
y la comprobación se hace siempre, con una más que verifica que la
receta salió.

### El mundo deja de ser de un jugador

El mundo 2D era estrictamente de una persona. Dos jugadores en el mismo
bosque no se veían, no se cruzaban y no sabían el uno del otro. El
WebSocket llevaba chat, "presencia" —que era literalmente una lista de
nombres y niveles, sin una sola coordenada— y las entradas de la arena.

Ahora el servidor lleva la posición de cada jugador y se la cuenta a los
de su zona, diez veces por segundo. Se ve el nombre, el nivel, el
aspecto, hacia dónde mira y qué arma lleva.

**Por socket, y por HTTP si no hay socket.** No es paranoia: la v29 y la
v30 se fueron en diagnosticar "entro y no me puedo mover" y el problema
estaba fuera del código. La arena ya tenía el pulso por HTTP; el mundo
lo necesita por lo mismo.

**Con interpolación, porque si no se ve a saltos.** Llegan diez
posiciones por segundo y se dibuja a sesenta. Poniendo a cada uno donde
diga el último paquete, los demás avanzan a tirones. Cada jugador guarda
a dónde va y se le lleva suavemente.

**Hasta dónde manda el servidor, dicho claro.** Acepta o corrige, no
simula. Comprueba que la coordenada cae dentro del mundo y que el salto
es humanamente posible, pero no lleva las colisiones con los edificios.
Un cliente modificado todavía puede andar a la velocidad máxima en línea
recta; lo que ya no puede es teletransportarse. Simular el movimiento
entero obligaría a portar las colisiones del mapa al servidor, y eso es
otro trabajo que no voy a fingir que está hecho.

**Y cierra la advertencia que dejé en el paso 2.** La recolección pedía
al cliente que dijera dónde estaba. Ahora el servidor lo sabe, así que
mentir no cuela: la prueba se coloca lejos de un árbol, dice estar
encima y recibe un "estás demasiado lejos".

### La pestaña de PvP ya no es una pantalla en blanco

Pulsar "PVP — ARENA" escondía las mazmorras y no enseñaba nada. La
pestaña llamaba a `setMode('pvp')`, que buscaba un elemento con id
`pvp-mode`, y ese elemento no existía en toda la página. Sin error
visible: pantalla en blanco y a otra cosa.

Mientras tanto el servidor tenía desde hacía versiones emparejamiento
por Elo, simulación asalto a asalto y apuesta de oro, con pruebas en
verde comprobando que el cliente no puede declarar el resultado. No lo
llamaba nadie. Y había ciento veinte líneas de CSS escritas para ese
panel —`.pvp-layout`, `.pvp-fighter`, las animaciones de golpe y
sacudida— sin una sola etiqueta que las usara.

El panel nuevo no inventa estilos: usa los que ya estaban ahí esperando.

**El servidor ahora devuelve el duelo, no solo el veredicto.** Mandaba
el resultado y el número de asaltos, así que la pantalla solo podía
decir "has ganado". El intercambio asalto a asalto ya lo calcula —lo
necesita para saber quién gana— y tirarlo obligaba a quien dibujara a
inventarse la pelea o a no enseñarla. Ahora viaja tal cual, igual que el
guion del combate por turnos, y la pantalla lo reproduce con las barras
de vida bajando golpe a golpe.

**Y dice lo que no es.** El rival lo genera el servidor a partir de tu
Elo: es un rival de tu nivel, no otra persona conectada. Player contra
player de verdad necesita que el mundo lleve la posición y el estado de
los dos en el servidor, y eso es la fase de multijugador. La pantalla lo
dice en la ficha en vez de dejarlo creer.

### El equipo que da vida ya cuenta en los turnos

`char.maxHp` es la vida BASE: la que dan la clase y el nivel. El equipo
suma aparte, en `effectiveStats()`. Pero el combate por turnos usaba la
base como si fuera el tope real, y la arena usaba el tope real. El mismo
personaje tenía dos vidas máximas distintas según dónde peleara.

Cinco piezas dan vida —Peto de Cuero +40, Coraza de Hierro +90, Grebas
+40, Peto de Cristal +140, Amuleto de Trébol +30— y la Torta de Maíz
existe SOLO para eso: su único efecto es +60 de vida máxima durante diez
minutos. Con peto de cristal y grebas llevabas +180 que en los turnos no
existían.

Y como `/api/player` sí devolvía el tope real, la pantalla enseñaba
1.290 mientras el servidor topaba en 1.150. O sea que la barra se
llenaba antes de tiempo, la poción se desperdiciaba a media curación y
morir te devolvía a la mitad de la vida base en vez de la mitad de la
tuya. Craft → equipar → estadísticas funcionaba, y se rompía justo en el
eslabón que se ve jugando.

Ahora el tope se pregunta con el equipo puesto en el guion del turno, al
curarse, al recibir daño, al subir de nivel y al resucitar. Y al quitarse
una coraza la vida que sobra se recorta: sin eso quedaba un personaje con
1.150 puntos de un tope de 970.

La prueba nueva se comprobó contra el código viejo antes de darla por
buena: sin el arreglo falla seis veces, con él pasa las veinte.

### En la arena, un golpe ya dura algo

El daño se aplicaba EN EL MISMO INSTANTE en que llegaba la intención de
atacar. Pulsabas y el enemigo perdía vida, sin más. Eso hacía dos cosas
malas a la vez.

Una: todas las armas se sentían igual. Un Cetro del Trueno de 620 ms y
una Daga de 300 impactan los dos al instante; lo único distinto era
cuánto tardabas en volver a pulsar. El peso del arma no existía.

Dos: no había nada que esquivar. Si el golpe no tiene anticipación, no
hay ventana en la que apartarse, y el combate se reduce a quién pulsa
más rápido.

Ahora un golpe tiene tres tiempos —se prepara, está vivo, se recupera—
y el daño solo existe mientras está vivo:

```
Daga   (300 ms)   anticipación  90   activo  66   recuperación 144
Hacha  (500 ms)   anticipación 150   activo 110   recuperación 240
Cetro  (620 ms)   anticipación 186   activo 136   recuperación 298
```

**Los números no son de mi cosecha y el daño por segundo no se mueve.**
Salen de la cadencia, que ya estaba en el catálogo, y los tres tiempos
SUMAN esa cadencia. Lo que cambia no es cuánto pegas: es cuándo llega.

Dos consecuencias que valen la pena. El arco dispara cuando termina de
tensarse, no cuando se pulsa. Y un enemigo que se mete en el barrido
mientras el filo está fuera se lo come, porque el golpe se resuelve en
cada paso y no solo en el instante de la pulsación, que es justo lo que
se espera de un arco de ataque.

Hizo falta además llevar cuenta de a quién ha tocado cada golpe: una
ventana activa de 160 ms abarca dos pasos de 100, y sin eso el mismo
barrido pegaba dos veces al mismo bicho.

### Una tercera prueba intermitente, y un barrido para cerrar el asunto

`test-contenido.js` fabricaba una Poción de Velocidad y daba por hecho
que salía. La receta tiene un 95% de éxito y los materiales se gastan
aunque falle, así que una de cada veinte ejecuciones se quedaba sin
poción y la prueba reventaba buscando el identificador de algo que no
existía.

Van tres, y las tres tienen la misma forma: **una prueba que observa un
suceso probabilístico una sola vez.** El botín de un combate, el crítico
de un golpe, el éxito de una receta.

Así que en vez de arreglar esta y esperar a la siguiente, hice un
barrido. De las veintiuna recetas que pueden fallar solo dos aparecen en
pruebas, y la otra solo se usa para comprobar un rechazo por nivel. Los
drops garantizados de los nodos llevan probabilidad 1. `test-turnos.js`
observa el crítico y el fallo pero no los exige. No debería quedar
ninguno más de este tipo.

### Los recursos del mundo, por fin en el mundo

El sistema de recolección física llevaba versiones entero y probado en
el servidor: árboles y vetas con vida propia, herramienta requerida,
nivel mínimo de herramienta, durabilidad que baja por golpe, botín por
probabilidad y reloj de reaparición. Cuarenta y siete comprobaciones en
verde. Y no lo llamaba NADIE: `/api/recursos` y `/api/recursos/golpear`
no aparecían en ninguna pantalla. Hasta las coordenadas de cada nodo
venían con un comentario que decía que el cliente las usaba para
dibujarlos.

Mientras tanto, la única forma de conseguir madera era entrar al bosque,
abrir el huerto y pulsar "reclamar". El recurso aparecía de la nada.

Ahora los árboles y las vetas están en el mapa. Te acercas, y si llevas
el hacha puesta, ESPACIO tala. El nodo se sacude, salta el número del
golpe, vuelan astillas, la barra de vida baja y cuando cae la madera
entra en el inventario de verdad. Si no llevas herramienta, o llevas un
pico donde hace falta un hacha, o tu pico es demasiado básico para esa
veta, el rótulo encima del nodo te lo dice antes de que pulses.

El huerto antiguo no se toca: sigue funcionando igual, en paralelo.

**Lo que faltaba en el servidor.** La auditoría había anotado tres
agujeros en `golpearRecurso()` y se cierran los tres:

- **Distancia.** Antes se podía golpear cualquier nodo desde cualquier
  sitio. Ahora hay que estar delante. El espacio de coordenadas viaja
  con la lista de nodos, así que el cliente convierte a su pantalla sin
  suponer ninguna escala, y la posición es obligatoria: si fuera
  opcional, no mandarla sería la forma trivial de saltarse el control.
- **Estar en la zona, no haberla visitado.** La comprobación miraba
  `zonesVisited`, o sea haber estado alguna vez. Se podía talar el
  bosque entero desde el banco del pueblo. Ahora hace falta estar allí,
  y eso sí lo guarda el servidor.
- **Un golpe cada vez.** Había un límite por minuto en la ruta, que
  corta el clic automático en general. Faltaba el enfriamiento entre
  golpes al MISMO nodo, que es lo que hace que un hacha no dé dos
  hachazos en el mismo instante.

**Lo que NO se arregla todavía, y conviene decirlo.** La zona es
autoritativa, pero las coordenadas dentro de ella las manda el cliente,
porque el mundo no simula el movimiento en el servidor. O sea que el
control hace que el juego funcione como debe —hay que andar hasta el
árbol—, pero no impide que alguien con la consola abierta mienta sobre
dónde está. Eso se cierra con la fase de multijugador, y cuando llegue
esta función cambia en una línea: la posición se lee del mundo en vez
del cuerpo de la petición. Queda escrito en el código y en la auditoría.

**Y una comprobación que pasaba por el motivo equivocado.**
`test-recursos.js` verificaba que un pico básico no saca plata... desde
el bosque. Fallaba por estar en otra zona, no por llevar un pico flojo.
Ahora se viaja a las minas primero, y lo que se mide es de verdad la
progresión de herramienta.


Después de la auditoría completa (`docs/AUDITORIA_V31.md`), el primer paso.

### El mapa resolvía el combate en el navegador

Lo más grave que encontró la auditoría. La pantalla del mundo —la que
enlaza el launcher, la principal— no le preguntaba nada al servidor al
pelear. Tiraba ella misma el dado del crítico, el del fallo y el de la
huida, calculaba el daño, se sumaba el oro y la experiencia y elegía el
botín de una lista suya que ni siquiera coincidía con el catálogo del
juego:

```js
const crit     = Math.random() < 0.18
const goldGain = roll(...activeCombat.gold)
const dropped  = Math.random() < 0.65
```

Nada de eso salía de la pestaña. Dos consecuencias, las dos
comprobadas: cualquiera con la consola abierta se ponía el oro que
quisiera, y el progreso no existía —al recargar no quedaba nada, y
mientras tanto `syncCharacter()` traía cada 8 segundos las cifras de
verdad y borraba las inventadas delante del jugador.

Lo llamativo es que la alternativa correcta ya estaba escrita y probada.
`/api/combat/action` es autoritativo, tiene su guion de eventos, su
telegrafía, su combo y sus fases de jefe, y 31 comprobaciones en verde.
Esta era la única pantalla del juego que no lo usaba.

**Y la prueba que debería haberlo cazado, no lo cazaba.** Comprobaba que
el mapa no mandase `COMBAT_ACTION` por `postMessage`. El combate falso
no usaba `postMessage`: calculaba en local. Pasaba en verde con el
agujero abierto. La prueba nueva mira el código servido, no un mecanismo
concreto.

### Dos bichos vivían solo en el cliente

Para poder mandar la pelea al servidor hacía falta que el servidor
conociera a los enemigos del mapa. Seis de los ocho ya estaban. El
**Murciélago Oscuro** y el **Liche Antiguo** estaban declarados solo en
el mundo 2D, con su nivel, su vida y su oro, y no en el catálogo. O se
borraban del mapa o entraban en el catálogo: entran, porque son
contenido que ya estaba diseñado.

Los números no son de mi cosecha. El murciélago conserva los suyos tal
cual, que ya encajaban: un nivel 4 flojo con 200 de vida queda justo por
debajo del Esqueleto. El liche sigue la curva documentada del propio
archivo —vida ≈ 130 × nivel^0,71— y su ataque y defensa se interpolan
entre el Dragón y el Demonio, que lo rodean en la tabla.

De paso, el liche suelta el **Anillo de Hueso**, que hasta ahora solo
salía de la forja y no caía de ningún enemigo.

### La poción del atajo curaba de la nada

La tecla Q curaba entre 120 y 200 de vida sin gastar nada del
inventario. Una poción infinita. Ahora pasa por `/api/player/use`, que
descuenta el objeto y ya lo usaba la pantalla de combate.

### La prueba de misiones fallaba una de cada tres veces

`test-misiones-mundo.js` mata arañas hasta reunir 10 hierbas con un
presupuesto de 150 ataques. Ese número valía antes del rebalanceo de la
v31; con `ESCALA_TURNOS` en vida 1,6 y daño 1,4 cada araña cuesta 7,6
ataques y el jugador de nivel 1 muere 13 veces por el camino. Medido:
hacen falta unos 168. Se quedaba corta por un 12%, justo en el filo.

Como `npm test` encadena los archivos con `&&`, ese fallo dejaba **26 de
los 32 archivos de prueba sin ejecutar**, y por algo que no tenía nada
que ver con lo que se estuviera tocando. El presupuesto sube a 450 y el
mensaje de fallo ahora dice ataques, bajas y muertes, para que la
próxima vez no haya que instrumentarla a mano.

### Otra prueba intermitente: el combo del combate por turnos

`test-turnos.js` fallaba en una de cada diez ejecuciones, y no por lo
que se estuviera tocando. Midiendo la secuencia real turno a turno sale
siempre la misma contra el Gólem, que es el bicho que la prueba elige:

```
a1  a2  a0  B0  a1  a0        (a = ataque, B = bloqueo)
     ^^      ^^
     |       bloqueo: el combo se pone a cero
     única ventana en la que el combo llega a 2
```

El combo se reinicia al bloquear y al comerse el golpe anunciado del
enemigo, y el jugador de nivel 1 muere contra el Gólem en seis turnos.
O sea que había UNA sola oportunidad de observar el combo en todo el
combate, y un fallo del ataque —un 5% por golpe— la cerraba.

Bloqueando uno de cada seis turnos en vez de uno de cada cuatro quedan
dos ventanas, y hace falta mala suerte en las dos: baja del 10% a cerca
del 1%. El combate dura lo mismo y se sigue bloqueando. Además, ahora el
mensaje de fallo imprime la secuencia completa.

### Cada prueba dejaba su servidor vivo

Salió persiguiendo un fallo fantasma. `test-invitaciones.js` daba 13 OK ·
7 fallidas dentro de la suite y 20 de 20 en aislado, con un `429` de
"demasiadas cuentas creadas desde esta red" que no venía a cuento.

La causa: diecisiete archivos de prueba matan su servidor así.

```js
setTimeout(() => run().finally(() => c.kill()), 3000)
```

`run()` termina con `process.exit(...)`, así que ese `.finally()` no se
ejecuta nunca. Cada ejecución dejaba un servidor vivo ocupando su puerto,
y la siguiente hablaba sin saberlo con el servidor VIEJO —con las cuentas
y los contadores de la anterior— y fallaba por cosas ajenas a lo que se
estuviera tocando.

Ahora lo matan desde `process.on('exit')`, que sí se dispara con
`process.exit()`. Comprobado: cuatro pruebas seguidas dejaban cuatro
servidores y ahora dejan cero.

### Detalles

- Los botones de combate del mapa son `<div>`, así que ponerles
  `.disabled` no hacía nada: se podían pulsar en mitad del turno. Ahora
  se apagan con una clase de verdad.
- Al morir un enemigo se quedaba su sombra pintada en el mapa.
- El desvanecido del enemigo muerto reventaba si pulsabas "Continuar"
  antes de que acabara la animación.
- La vida del enemigo ya no se enseña con la ficha del mapa: se escala a
  quien lo pelea, así que hasta el primer turno no hay número de verdad
  y se muestra una raya en vez de una cifra falsa.
- `criptomundo-mundo2d-2.js` pasó de los 70 KB por módulo que vigila
  `test-build.js`. El combate se va a un tercer módulo, igual que se
  hizo con el combate por turnos.
- Los botones de combate decían "Magia 40 MP" y "Sanar 30 MP", que era
  lo que cobraba el combate falso. El de verdad no cobra eso: la magia
  cuesta lo que cueste la habilidad de TU clase, entre 20 y 45, y sanar
  no gasta maná sino una poción. Un número fijo ahí era mentira para
  tres clases de cuatro.
- Los bichos del mapa traían su propia vida, ataque, oro y experiencia,
  en una escala distinta a la del servidor. Eran los números con los que
  el navegador se repartía el botín. Se quedan solo los de dibujo.
- `criptomundo-data.json` y `backups/` entraron en el repositorio al
  importar y cada prueba los reescribía. Ahora están en `.gitignore`.
- El aviso de golpe fuerte del enemigo no se veía en el mapa: el campo
  se llama `name` y se estaba leyendo como `nombre`. La mecánica existía
  y estaba probada en el servidor desde hacía versiones; el jugador no
  la veía llegar.

### Lo que el mapa sigue sin tener

El combate del mapa es una versión reducida del de
`criptomundo-combat.html`: tiene golpe, magia, sanar y huir, y no tiene
selector de habilidades, bloqueo ni elección de objeto. Por eso el aviso
de golpe fuerte no dice "bloquea o interrumpe" como en la pantalla
completa: prometer una acción que no está es peor que no avisar. Unificar
las dos pantallas es trabajo del paso de UI/UX.

## v31 — Revisión completa: materiales, código muerto y fluidez

Cuatro encargos: comprobar que todos los materiales de las armas se pueden conseguir, que todo lo que llevamos funciona, que no queda código que no hace nada, y que el juego vaya más fluido. Para los tres primeros hice una herramienta; el cuarto resultó ser otra cosa distinta de la que parecía.

### El mundo iba a 6,8 cuadros por segundo — y aquí no cargaba siquiera

Lo gordo. Medí la arena en un Chromium de verdad y va a 60 cuadros por segundo incluso con la CPU estrangulada ×6 (un móvil flojo): pintar la escena cuesta **0,2 ms**. Mi sospecha —que la rejilla del suelo se repintaba entera cada cuadro— era falsa. El render de la arena está bien.

Al medir el mundo saltó `Phaser is not defined`. La pantalla del mundo cargaba Phaser desde **cdnjs.cloudflare.com**, y sin salida a internet la pantalla entera se queda en negro. No a tirones: muerta. Y este proyecto es "un ejecutable, cero dependencias" que se juega en redes que ya nos han dado guerra (el WebSocket de la v30). Ahora Phaser se sirve desde el propio servidor (`/assets/vendor/phaser.min.js`), con el CDN como respaldo.

Con Phaser cargando de verdad, el mundo iba a **6,8 cuadros por segundo**. La causa:

```
   Phaser.WEBGL forzado ....   6,8 cuadros/s   (147 ms por cuadro)
   Phaser.CANVAS ..........   60,0 cuadros/s   ( 16,7 ms por cuadro)
   Phaser.AUTO ............   60,0 cuadros/s
```

Estaba forzado a `WEBGL`, que quiere decir "WebGL o nada". En un aparato sin GPU aprovechable el navegador no se niega: lo emula por software, y va nueve veces más lento. `AUTO` usa WebGL donde hay GPU de verdad y Canvas donde no.

También: el `resize` reconstruía la superficie de dibujo **una vez por evento**, y en un móvil ese evento se dispara en ráfagas cada vez que aparece o desaparece la barra de direcciones. Ahora espera 120 ms a que pare.

Y en la arena, la intención sale **en cuanto cambia** en vez de esperar al latido de 100 ms. Empezar a andar, parar, atacar y esquivar se adelantan hasta una décima. No sube el gasto de red andando en línea recta, que es lo que había que cuidar.

### Los materiales: `revisar-materiales.js`

Cierra el grafo entero. Parte de lo que se consigue sin fabricar nada —lo de fábrica, la recolección, el botín, las misiones, las mazmorras, el mercado inicial— y va añadiendo lo que ya se puede fabricar, vuelta tras vuelta, hasta que deja de crecer. Las herramientas son parte del grafo: un nodo pide un pico de nivel 3, ese pico pide una cabeza de hierro, el hierro pide otro pico…

**Las diez armas fabricables se pueden conseguir**, eslabón a eslabón. Lo que no:

- **Poción de Curación V** y **Elixir Mítico**: los dos peldaños de arriba de la escalera de curación no salían de ningún sitio. Ni botín, ni receta, ni misión. Ahora la V se fabrica (nivel 14) y el Elixir sale del botín de las Ruinas.
- **Esqueje de Cristal**: el huerto sabía hacerlo crecer y convertirlo en cristal, pero el esqueje no existía en ninguna parte. Esa rama del huerto estaba escrita y muerta. Ahora se saca de un cristal.

**Y casi reporto seis fallos que no lo eran.** La primera versión de la herramienta daba por inalcanzables la Poción de Maná, la Capucha del Espía, el Arco Élfico y más. Se me habían olvidado tres fuentes: las recompensas de misión, el botín de mazmorra y el mercado inicial. Una fuente olvidada convierte este análisis en una fábrica de falsos positivos.

### El código muerto: `revisar-codigo-muerto.js`

Cuatro cosas, todas comprobadas una por una antes de tocarlas:

- `startCombatWith()` en el mundo — nadie la llamaba.
- `animEnCurso()` en las animaciones — su propio comentario decía "para las pruebas" y ninguna prueba la usaba.
- `RARITY_KEY` en el perfil — declarada y nunca leída.
- `zoneIcons` en el minimapa — la tabla de iconos existía; el minimapa nunca llegó a pintarlos.

La primera versión de esta herramienta marcaba 40 "código después de un return" que eran guardas normales, y daba por muerta la función `$` en cinco páginas (`$` no es carácter de palabra, así que mi expresión regular no casaba nunca). Un informe con cuarenta falsos positivos es un informe que nadie vuelve a abrir.

### Tres fallos más, encontrados de rebote

**BUG DETECTADO — el botón de Aviso no funcionaba en el mundo.**
Archivo: `src/pages/criptomundo-mundo2d-2.js`. La pantalla tenía el botón "💬 Aviso" y sus estilos, pero **no el script que lo define**. Todas las demás pantallas tienen los dos. Pulsarlo en el mundo —la pantalla donde más tiempo se pasa— lanzaba `abrirAviso is not defined` y no hacía nada.

**BUG DETECTADO — error de JavaScript en cada carga del lanzador.**
El iframe nace con `src=""` y el navegador dispara su `onload` al parsear la etiqueta, antes de que exista `onFrameLoad`. No rompía nada visible, pero un error fijo en consola tapa los que sí importan. Lo encontré midiendo el render, no buscándolo.

**BUG DETECTADO — una prueba llevaba tiempo pasando en falso.**
`test-concurrencia.js` comprobaba que una mazmorra no pagara dos veces —el propio archivo lo llama "el que de verdad importa… sería una fábrica de dinero"— contra `/api/dungeon`, una API que no existe. Como estaba dentro de un `if (nivel >= 5)` que nunca se cumplía, el error no salía. Y las otras dos comprobaciones de mazmorra usaban un personaje de nivel 1, que no puede entrar a la Cripta: pasaban contando cero. Ese invariante **no se había comprobado nunca**.

**Y el paso 10 hizo la progresión ~2× más lenta**, que no lo había medido: una araña pasó de 3,4 turnos a 6,3, o sea de 54 XP por turno a 29. Es una decisión de diseño pendiente, no un fallo.

### Herramientas nuevas

`revisar-materiales.js` · `revisar-codigo-muerto.js` · `medir-render.js` (Chromium real, con estrangulamiento de CPU para simular un móvil). `revisar-cliente.js` ahora levanta el servidor solo con `--spawn`: antes, si se olvidaba arrancarlo, decía "0 páginas revisadas · 0 scripts rotos", que se lee como aprobado y es lo contrario.

**Pruebas: 638 comprobaciones en verde**, 16 páginas compilando en navegador, materiales cerrados y cero código muerto.

## v30 — PASO 10: balance, medido en vez de adivinado

Antes de tocar un número construí `banco-balance.js`. Carga **los módulos reales del servidor** en una máquina virtual y les cambia una sola cosa: el reloj. `now()` deja de ser la hora del sistema y pasa a ser un contador que muevo yo, así que un combate de 40 segundos se juega en 3 milisegundos y **600 combates caben en menos de un segundo**. Es el mismo `tick()`, la misma IA, el mismo `herir()`. El robot que juega solo ve lo que ve el navegador (`resumen()`) y solo manda lo que puede mandar el navegador (mx, my, apuntar, atacar, esquivar): no puede hacer trampa. Y hay un segundo robot **deliberatemente malo** —reacciona 4 veces más lento, no esquiva y se queda pensando el 15% del tiempo— para poner cota por abajo. Entre los dos queda encerrado cualquier jugador humano.

Lo primero que salió fue que **el fallo que yo mismo documenté en el paso 9 estaba mal diagnosticado**. Escribí que "con la Espada de Diamante el troll encadena aturdimientos y no llega a cargar nunca". Falso: sí cargaba, el 100% de las veces que lo intentaba. El problema era que **solo lo intentaba una vez**.

### Las arenas eran una animación, no un combate

```
   arena                 ANTES                      AHORA
                  gana   vida-fin  dura      gana   vida-fin  dura
   Bosque nv1       —        —       —       100%     36%     35s
   Bosque nv3     100%     90%     14s       100%     47%     29s
   Minas nv11     100%     95%     13s       100%     88%     26s
   Ruinas nv13    100%    100%     11s       100%     69%     29s
   Ruinas nv18    100%    100%     10s       100%     86%     20s
```

El Patio de las Ruinas —dos gólems, un dragón y un demonio— se limpiaba en 11 segundos **sin perder un punto de vida**. Y no era culpa del robot: el robot malo también ganaba el 100%.

### BUG DETECTADO — el juego se hacía MÁS FÁCIL según avanzabas

```
   nv  arma                pega  vida  │ golpes que le das  golpes que aguantas
    3  Daga de Hierro        50  1300  │        4                   57
   18  Espada de Diamante   286  2425  │        1                   68
```

El jugador multiplica por 5,7 lo que pega y solo por 1,9 lo que aguanta. Los enemigos subían un 4% por nivel en la arena y un 5% en los turnos. Y no había número que lo arreglara: en el barrido, cualquier daño que inquietara al veterano mataba al principiante el 100% de las veces.

Ahora el enemigo se escala con lo que el jugador tiene **por nivel** —no con el número del nivel— y **sin contar su equipo**: si siguiera también al arma, una espada mejor no mataría antes y todo el progreso del equipo sería decorativo. Subir de nivel te mantiene en tu sitio; mejorar el equipo es lo que te hace fuerte. La referencia es el `minLevel` de la arena, que es lo que ella misma declara.

### BUG DETECTADO — un arma rápida dejaba al enemigo sin jugar

El peor de todos, y el que estaba debajo de casi todo lo demás. La traba (`HURT`) dura 160 ms en una araña. Con un arma que pega cada 300 ms, el siguiente golpe llegaba antes de que se recuperase, y el siguiente: se pasaba la pelea trabada **sin llegar a morder nunca**. Mismo jugador, misma arena, cambiando SOLO la cadencia del arma:

```
   cada 300 ms  →   20 de daño recibido
   cada 460 ms  →  543 de daño recibido
```

Veintisiete veces más por pegar medio segundo más lento. De ahí venía que la Daga de fábrica ganara a seis armas de tiers superiores, y que craftear tu primera espada te dejara al 9% de vida cuando con la daga acababas al 43%. Ahora hay un descanso entre trabas (`DESCANSO_TRABA`): tras recuperarse, el enemigo tiene una ventana en la que no se le puede volver a trabar. El aturdimiento por golpe gordo **no** pasa por ahí, porque ese es la jugada del jugador.

### BUG DETECTADO — la progresión de armas estaba al revés

Lo que rinde un arma es `dmg ÷ cadencia`, no el `dmg` suelto. Medido: **los puños pegaban más por segundo que la Espada de Piedra y que el Garrote**. El Arco Corto quedaba por debajo de ir a puñetazos.

El juego ya dice lo que vale cada arma —su precio—, así que ajusté el rendimiento contra el precio: `2,15 + 0,06 × √precio` (×0,75 si dispara, que ese descuento sí es un juicio mío: quien dispara termina con el 100% de la vida). La curva pasa **clavada** por los puños, la Lanza de Hierro, la Vara de Cristal, la Espada de Hierro y la de Diamante: no me la inventé, estaba ya dentro del juego. Esas cinco no se tocaron; las ocho que se salían eran las rotas.

Lo mismo con el alcance. Un arma lenta te tiene más rato plantado delante del bicho, y lo que compensa eso es poder pegarle desde lejos. Mirando `alcance ÷ cadencia`, las armas se partían en dos grupos limpios: seis entre 0,154 y 0,218 y cuatro en 0,110-0,115. Los cuatro de abajo eran los puños —que deben ser malos— y otra vez el Garrote, la Espada de Piedra y el Hacha.

### BUG DETECTADO — dos conductas de enemigo no podían darse nunca

**El embestidor.** Exigía que estuvieras a más de 2,2 cuerpos para cargar, y pegado a él eso no pasa jamás. Medido: un troll a solas embestía **una vez por pelea** —la primera, antes de que le alcanzaras— y ni una más. Ahora te quita de en medio de un empujón y encadena el aviso en el mismo movimiento. Probé primero a que saltara él hacia atrás y los números dicen por qué no funcionaba: va a 78 px/s y el jugador a 210.

**El tirador.** El dragón se aparta a 96 px/s. Retroceder andando de espaldas delante de alguien que va al doble de velocidad es quedarse quieto, así que a los dos jefes de las Ruinas les bastaba con que te acercaras para dejar de ser peligrosos. Ahora la retirada es un salto de verdad, y dispara mientras retrocede.

**Y el aviso ya no se corta con un rasguño.** `TELEGRAPH` y `CHARGE` pasan por encima de `HURT` en la tabla de pesos: un movimiento comprometido solo lo cancela un golpe que aturda. Antes, cuanto mejor era tu arma menos veías la conducta del bicho (Filo Escarchado: llegaba a embestir el 17% de las veces). Ahora interrumpir una embestida es una **decisión**: guardarse el golpe fuerte para el aviso pasa a ser jugar bien.

### BUG DETECTADO — a dos jefes les faltaba el multiplicador de jefe

La vida de los bichos sigue una curva —`130 × nivel^0,71`, ×1,7 si es jefe— que no impuse yo: la araña, el troll y Grommash caen encima con un error del 3%. Medidos contra ella, el **Dragón Menor tenía el 46%** de la vida que le tocaba y el **Demonio Abismal el 59%**. El Dragón, jefe de nivel 15, tenía exactamente la misma vida que el Gólem de nivel 8.

Lo que se veía: Grommash duraba 20 turnos y el Demonio Abismal, el jefe final, duraba 6. Los jefes anuncian un golpe fuerte cada 3 turnos y cambian de fase a media vida, así que **ninguna de las dos mecánicas llegaba a verse** contra los jefes de arriba. Contenido escrito, probado y nunca mostrado — el mismo patrón que el Golpe de Escudo del paso 9.

```
   jefe                 ANTES              AHORA
                 turnos  fase 2      turnos  fase 2
   Grommash          5    100%          18    100%
   Dragón Menor      3      0%          12    100%
   Demonio Abismal   3      0%          12    100%
```

### Lo que queda fijado

`test-balance.js` (25 comprobaciones) no fija números —ajustar balance es normal— sino las **propiedades** que no pueden volver a romperse, cada una porque ya se rompió: ningún arma rinde menos que los puños; la primera arma que crafteas no te empeora; un arma rápida no apaga al enemigo; el embestidor llega a embestir; las arenas cuestan vida y se pueden ganar; un jefe dura lo que dura un jefe; el juego no se ablanda al subir de nivel.

Comprobé que la prueba sirve **reintroduciendo los fallos a mano**: con el encadenado de trabas vuelve a fallar la comprobación 3, y con las escalas viejas fallan siete.

## v30 — El socket dejaba conexiones colgadas (por eso "a las 2 batallas dejaba de cargar")

Reportado desde la partida. El servidor aguanta cuatro batallas seguidas sin despeinarse, así que el problema no estaba ahí: estaba en el navegador.

Cuando algo en medio —un cortafuegos, un antivirus, una VPN— se **traga** el paquete del WebSocket en vez de rechazarlo, el socket se queda colgado en "conectando" para siempre: no abre, no falla y no se cierra. Y cada batalla creaba uno nuevo (`empezar()` → `conectar()` → `ws = new WebSocket(...)`) sin cerrar el anterior. El objeto viejo se perdía pero **la conexión seguía abierta**, ocupando una de las ~6 ranuras que el navegador da por servidor. Dos o tres batallas después no quedaba ninguna libre y todas las peticiones se quedaban en cola: la pantalla dejaba de cargar. No un error, no un mensaje: una espera infinita.

Tres reglas nuevas: antes de abrir un socket se cierra el que hubiera; el que no abre en cuatro segundos se cierra solo —esta era la pieza que faltaba, porque *colgado* significa justamente que no avisa—; y cuando ya se sabe que en esta sesión no va a abrir, se deja de intentarlo y se juega por HTTP el resto de la partida.

`test-socket-fugas.js` ejecuta el JavaScript real de la página con un WebSocket que se cuelga a propósito y cuenta las conexiones que quedan. Con el código anterior: 4 creadas, 4 colgadas. Ahora: 1 como mucho, y tras la primera batalla no se abre ni una más.

## v30 — La espada no se veía en el combate por turnos

Reportado desde la partida: "el personaje cuando atacas se mueve pero no saca una espada". Y en esta ocasión dejé de adivinar: rendericé la página en un Chromium de verdad y miré.

`document.getElementById('arma-jugador')` devolvía **null**. El hueco del arma estaba en el HTML servido —lo comprobé— pero desaparecía del DOM al cargar. El culpable: el aplicador de skins hace `el.innerHTML = ...` sobre `sprite-jugador` para poner el aspecto del personaje, y yo había metido el arma **dentro** de ese elemento. Se la llevaba por delante en cuanto cargaba la skin. Ahora el arma cuelga de `.fighter`, que nadie reescribe.

**Y mi prueba lo daba por bueno.** El DOM de mentira del arnés creaba cualquier elemento que se le pidiera, así que "la pantalla dibuja el arma" pasaba sobre un fantasma. Un DOM falso más permisivo que el real no prueba que el código funcione: prueba que no revienta. Ahora el arnés lee los ids que existen de verdad en el HTML y devuelve `null` para el resto.

De paso, la prueba de tiempos era inestable: daba por hecho que el golpe acertaba, y hay un 5% de fallo. Ahora mira lo que dijo el servidor.

## v30 — PASO 9: habilidades, objetos y estados

**Dos de cada tres habilidades eran inalcanzables.** Cada clase sabe tres y la pantalla mandaba siempre la primera: `payload.skillId = char.skills[0]`. Un Guerrero no llegaba a usar Golpe de Escudo en toda su vida — la única que aturde e interrumpe el ataque anunciado del enemigo, y la que el propio aviso en pantalla le decía que usara. Estaba en el catálogo, con su coste, su enfriamiento y su efecto, y no había forma de lanzarla.

Ahora hay un selector: las tres, con lo que cuestan, lo que hacen y por qué no se pueden lanzar cuando no se pueden —enfriando, con los segundos que quedan, o sin maná—. Lo dice el servidor en `/api/combat/habilidades`; la pantalla apaga el botón y el servidor lo vuelve a validar igual.

**BUG DE SEGURIDAD, encontrado por la prueba nueva.** El servidor comprobaba que la habilidad existiera en el catálogo, no que el personaje la supiera: `SKILLS[skillId] ? skillId : ...`. Un Guerrero podía lanzar Bola de Fuego mandando el id a mano, y con ella el daño de un mago escalado por su propia inteligencia. Llevaba ahí desde siempre; al añadir el selector solo lo dejé a la vista. Ahora solo valen las que sabe.

**Los estados se ven.** Los refuerzos y venenos existían desde el principio y no aparecían en ninguna parte: bebías una Poción de Fuerza y no tenías forma de saber si seguía haciendo efecto. Ahora hay una fila de marcas a cada lado con el icono y lo que queda —turnos para los de combate, segundos para los de poción—, incluido el aviso del golpe fuerte del enemigo.

**BUG ARREGLADO — medio panel salía como "objeto desconocido".** `dibujoItem` leía `item.icon` y el catálogo de combate manda `icono`. Conviven las dos formas porque una sale de la plantilla (en inglés) y la otra del catálogo nuevo, así que ahora se leen las dos. Lo vi en el navegador: cuatro pociones y las cuatro con la caja 📦.

## v30 — PASO 8: el combate por turnos se reproduce en vez de volcarse

El paso 7 hizo que el servidor mandara el turno como un guion. Este hace que la pantalla lo **reproduzca**.

Antes, la barra de vida del enemigo bajaba en el mismo instante en que llegaba la respuesta —antes incluso de que empezara la animación del golpe—. Se veía el resultado y luego el gesto, al revés, y el turno entero ocurría en un fotograma. Ahora las escenas se recorren en orden con su duración: el jugador se mueve, el arma sale disparada y vuelve, y **entonces** salta el número y baja la barra. Un golpe se siente como un golpe porque el resultado llega después del gesto, no antes.

**El arma equipada se ve en el combate por turnos**, colgada del sprite y con el mismo gesto de tres fases que en la arena. Sale del mismo catálogo del servidor: no hay una segunda lista de armas, así que cambiar el dibujo de una espada la cambia en los dos combates.

**Y el botón de curarse pasó a ser un botón de objetos.** El paso 7 hizo que el servidor supiera usar cualquier consumible; aquí la pantalla lo ofrece: un selector con lo que llevas, lo que hace cada cosa y cuánto te queda, servido por `/api/combat/objetos`. La pantalla no adivina qué es una poción por el nombre.

**Cómo se comprueba.** No leyendo el código: `test-turnos-pantalla.js` ejecuta el JavaScript real de la página con un DOM de mentira que **apunta el milisegundo** de cada cosa, pulsa Atacar y mide. Exige que el gesto del jugador vaya antes de que el enemigo encaje, que la barra baje después del impacto y con más de 120 ms de margen desde que llegó la respuesta, y que el turno dure un tiempo real. Verificado al revés forzando el camino antiguo: 304 ms y sin gesto de arma, frente a ~1400 ms reproduciendo el guion.

**La página se partió en dos**, como ya estaba el mapa: la pantalla y sus botones en `criptomundo-combat.js`, el reproductor del guion en `criptomundo-combat-2.js`. No fue solo por el límite de 70 KB que vigila `test-build` —que se pasó al añadir el reproductor—: son dos cosas distintas, y juntas se leían como si "pedir una acción" y "pintar el resultado" fueran lo mismo.

Un tropiezo por el camino: escribí el selector de objetos con `onclick` dentro del HTML, y como la página vive en un template literal hay que escapar las comillas dos veces. Se escapa mal una vez y el script entero deja de compilar — lo cazó `revisar-cliente.js`. Con listeners no hay comillas que escapar.

## v30 — PASO 7: el combate por turnos tiene forma

Las reglas estaban bien —críticos, fallos, combo, buffs, venenos, aviso del golpe fuerte, fases de jefe, recompensas— y no se ha tocado ninguna. Lo que faltaba era **orden**: `combatAction` resolvía el turno entero en una llamada y devolvía un paquete plano que la pantalla pintaba de golpe. Sin saber en qué secuencia pasaron las cosas no hay nada que reproducir, y un combate por turnos que se resuelve en un fotograma se lee como una hoja de cálculo.

Ahora el turno sale como un **guion** ordenado: `BATTLE_START · PLAYER_TURN · PLAYER_ACTION · PLAYER_ANIMATION · STATUS_EFFECTS · ENEMY_TURN · ENEMY_ACTION · CHECK_VICTORY · BATTLE_END`. Cada escena dice qué pasó y cuánto debe durar en pantalla, y el ritmo vive en el servidor porque es parte de cómo se juega: un crítico que se ve igual que un golpe normal no es un crítico.

Las reglas no se movieron de sitio: solo se anota lo que van haciendo, a medida que lo hacen. Y los campos planos de siempre se quedan al lado, porque romper la pantalla actual no era el encargo — el paso 8 la cambiará para leer el guion.

La prueba no se conforma con que el guion exista: comprueba que sus números son **los mismos** que los del resultado. Un guion que no coincida con lo que pasó es decoración.

**BUG ARREGLADO — once pociones y solo se podía beber una.** La acción de curarse buscaba literalmente `potion_hp`, la Poción de Curación I (220 de vida). El juego tiene once pociones, una escalera de curación de seis escalones y comida con efectos: llevabas el Elixir Mítico en la mochila y bebías la poción más floja porque era la única que el combate sabía reconocer. Ahora vale cualquier objeto que cure, dé maná o deje un efecto —lo dice su propia plantilla, no hace falta una lista aparte—, y si no se elige ninguno se coge la más ajustada a lo que falta de vida, para no gastar el elixir en un rasguño. `/api/combat/objetos` dice qué se puede usar, para que la pantalla no tenga que adivinar qué es una poción por el nombre.

## v30 — Arreglos sobre el paso 6

**La Zarigüeya salía partida por la mitad.** El catálogo declaraba `ancho: 140` para una tira de 420×70 con 3 cuadros. ¿140 es el ancho de cada cuadro o el total? Las dos lecturas son razonables y elegí la mala: dibujaba un tercio de cuadro. Ahora la geometría se mide sobre el propio PNG —ancho total dividido entre número de cuadros— donde no hay nada que interpretar. Además el cuadro se dibuja con su proporción: 140×70 metido en un cuadrado salía aplastado.

**Y el resto del tiempo salía "una imagen de una rata".** Parado no se usaba la tira, sino `laurel_possum_full.png`: una ilustración de 587×500 pensada para la ficha del personaje, encajada a la fuerza en 44 px. Ahora la tira se usa siempre —quieto se queda en el primer cuadro— y cuando no hay tira se prefiere el avatar (96×96, hecho para verse pequeño) antes que la ilustración grande.

**"El personaje se mueve solo": era retroceso, no deriva.** Medido sin tocar una sola tecla durante doce segundos: 65 px de desplazamiento, de los cuales 59 ocurrían en los seis cuadros siguientes a un mordisco. La deriva real eran 6 px, despreciable. Lo que pasaba es que el empujón era 130 fijo para todos, así que el mordisco de una araña te desplazaba 20 px igual que un mandoble, y de pie y quieto eso se vive como perder el control. Ahora el empujón va con lo que pega: total 29 px, empujón mayor de 7,3 a 4,1 px.

Primero lo calibré al revés —usé `40 + daño × 6` suponiendo que las arañas pegaban flojo, y pegan 19, así que salió 154: peor que antes—. Se ve en la medición, no en el código.

**Guardia nueva en el compilador.** Cada página vive dentro de un template literal y una comilla invertida suelta ahí dentro —aunque sea en un comentario— parte el archivo generado en dos. Lo he cometido dos veces en este trabajo. Ahora `build.js` lo caza, dice el archivo y la línea, y se niega a compilar. Comprobado metiendo una a propósito.

## v30 — PASO 6: animaciones completas

El reloj de animación existía desde el paso 1 y viajaba en cada paquete. Lo que faltaba era que alguien lo usara.

**El jugador era un círculo dorado.** Tenía una skin elegida en el creador de personaje —con su dibujo, su emoji y hasta su tira de caminar— y en la arena no se veía ninguna. Ahora se manda su aspecto en el paquete y se dibuja: tira si la skin trae, ilustración si no, emoji si no, y el círculo de siempre si no hay nada. Cuatro escalones, y ninguno puede dejar la pantalla vacía. No hay catálogo de dibujos propio de la arena: se lee el mismo que usan el perfil y el creador.

**Los enemigos recibían su animación y el renderer la ignoraba:** un emoji quieto que se deslizaba por el suelo, pegara, recibiera o muriera. Ahora el golpe se echa atrás y se lanza hacia el jugador —se ve venir en vez de aparecer como un número rojo de la nada—, el dolor encoge, y al caminar hay brinco.

**La animación de muerte no se veía JAMÁS.** El enemigo se borraba de la lista en el mismo tick en que moría: se arrancaba el gesto y en el siguiente paquete ya no había a quién dibujárselo.

Al arreglarlo me equivoqué primero: dejé el cadáver dentro de `enemigos` con una bandera `muerto`. Las pruebas de IA y de arena por HTTP se cayeron en el acto, y por un buen motivo: obligaba a todo el que lee esa lista —las oleadas, la puntería, las pruebas— a acordarse de saltarse los muertos, y quien se olvidara se ponía a pegarle a un cadáver. Los restos van ahora en su propia lista: no tienen vida, no reciben golpes, no cuentan para la oleada. Un muerto no es un enemigo, es un dibujo que se está apagando.

**Un dibujante de tiras para todo** —armas, skins, lo que venga—, que reparte los cuadros según los que tenga la tira y no según los que declare el catálogo: la Zarigüeya tiene 3 y `walk` declara 4. Así una tira de 3, de 6 o de 12 funciona sin tocar código. Y el paquete lleva la dirección en cuatro lados, lista para tiras con una fila por sentido.

## v30 — PASO 5: proyectiles que aciertan y elementos que existen

**Las flechas atravesaban a los enemigos y nadie se enteraba.** El servidor avanza 10 veces por segundo: una flecha a 460 px/s se movía 46 px de golpe y *luego* se miraba si tocaba a alguien. Una araña deja una ventana de 44 px. El hueco entre dos posiciones era mayor que el bicho, así que solo acertaban los disparos casi centrados. Medido: **el 74% de los disparos que debían acertar, acertaban**. El otro 26% pasaba de largo sin daño, sin log y sin nada — desde el asiento del jugador, "el arco falla raro".

Ahora la colisión se hace contra el **tramo recorrido**, no contra la posición final: se pregunta si ha pasado por encima, no si está encima. El tamaño del blanco vuelve a ser su tamaño de verdad, vaya el proyectil a la velocidad que vaya y esté el servidor como esté. Con barrido: 100%.

**Los elementos eran un adorno.** `element: 'ice'` llevaba escrito en la Vara de Cristal desde siempre y no hacía absolutamente nada. Ahora el hielo frena (55% de velocidad, 1,4 s), el rayo aturde de verdad —reutilizando el mismo estado STUN que usa la IA, así que el enemigo deja de pegar y de moverse— y quedan preparados fuego y veneno con daño por tiempo. Los efectos valen para los dos lados: un enemigo con hielo te frena a ti igual.

Y se ven: el enemigo congelado lleva un halo azul, el que arde uno naranja. Un efecto que el jugador no puede ver es un efecto que no ha aplicado.

**Un solo sitio donde nacen los proyectiles** (`src/server/57-proyectiles.js`). Antes había dos trozos de código empujando objetos sueltos a una lista, cada uno con sus campos. Ahora hay una fábrica con todo lo que se le pide —posición, velocidad, dirección, daño, dueño, radio, vida, elemento, empuje, sprite— y hueco para proyectiles que atraviesan a varios enemigos. El color sale del catálogo del servidor: la pantalla no se sabe la lista de elementos.

**Un fallo que me cacé a mí mismo.** Al mover el disparo del jugador a la fábrica me dejé por el camino el cálculo del daño, y quedó una variable `dmg` sin definir. El tick lanzaba excepción, el `try/catch` del bucle la convertía en fin de partida por error, y la arena se cerraba sola sin decir por qué. Lo encontró la prueba nueva: cero proyectiles disparados.

## v30 — PASO 4: los enemigos dejan de ser el mismo bicho con otros números

La IA eran tres conductas escritas como una cadena de ifs, con el estado guardado en cadenas sueltas ('normal', 'avisando', 'cargando') que solo entendía la rama que las escribía. La araña y el esqueleto eran idénticos salvo los números; recibir un golpe no interrumpía nada, así que te seguían pegando en mitad de tu combo como si no lo notaran; y un embestidor que fallaba y se estampaba contra la pared seguía como si tal cosa, sin ventana para castigarle.

**Ahora hay una máquina de estados de verdad** (`src/server/56-ia-enemigos.js`, aparte porque no depende de la arena y el combate por turnos podrá usarla): IDLE, CHASE, ATTACK, HURT, STUN, DEAD, más TELEGRAPH, CHARGE, RANGED y RETREAT para quien los necesite. Las transiciones van por peso —morir gana a todo, un aturdimiento gana a un ataque a medias— para que recibir un golpe mientras cargas no deje al enemigo en dos estados a la vez según el orden de los ifs.

**Y cada uno tiene carácter, no solo estadísticas.** La araña se acerca haciendo eses (con semilla propia: sin ella todas zigzaguean a la vez y parecen una sola), muerde y salta hacia atrás. El esqueleto no retrocede jamás pero levanta el arma antes de pegar, y ese aviso es tu momento. El troll y el golem embisten desde lejos, y si fallan se quedan aturdidos más de un segundo: ahí es cuando se les castiga. El dragón y el demonio se apartan disparando si te acercas demasiado.

Encajar un golpe ahora interrumpe, pero no cualquiera: se compara el daño con la vida máxima y con el aguante del bicho, así que un rasguño a un golem no le hace cosquillas y un golpe muy gordo no traba, aturde.

**Cómo se comprueba que "se sienten diferentes".** No leyendo el código: `test-ia-enemigos.js` juega partidas y mide. Sigue el rastro de cada enemigo y calcula cuánto se desvía de la línea recta hacia el jugador (la araña sale por encima del umbral, los demás no), cuenta por qué estados pasa cada uno, y verifica que esquivando la embestida el troll acaba aturdido. Si mañana alguien simplifica la IA y los deja a todos persiguiendo en línea recta, estas pruebas caen.

Dos arreglos que salieron de medir: el estado real de la máquina no viajaba al cliente —`estado` colapsaba casi todo en 'normal'—, así que ni la pantalla ni las pruebas podían ver si la IA hacía algo; y el troll embestía cuando ya estaba pegado al jugador, con lo que la carga duraba menos de un tick y no se veía. Ahora embiste desde 2,2 veces su alcance y la carga tiene duración mínima. El aturdimiento se dibuja con 💫 y un aro: si no se ve, el jugador no sabe que acaba de ganarse un segundo gratis.

**BUG DETECTADO — balance (pendiente del paso 10):** con la Espada de Diamante equipada, el troll encadena aturdimientos y no llega a cargar nunca. El umbral que convierte un golpe en aturdimiento (30% de la vida máxima) es demasiado bajo frente a las armas de arriba de la tabla.

## v30 — PASO 3: el movimiento se comporta como dice la ficha

**La velocidad de la ficha no era la velocidad real.** El motor sumaba a la velocidad y luego la multiplicaba por 0,82 **una vez por tick**, no por segundo. Dos consecuencias: la física cambiaba según lo cargado que fuera el servidor, y el tope real acababa en ~765 px/s con una `vel` nominal de 210. El número no describía nada y la agilidad se diluía en un factor inventado.

Ahora cada cuerpo lleva **dos velocidades**. `vx, vy` es lo que pides: persigue una velocidad objetivo y nunca la pasa, así que 210 significa 210 y la agilidad se nota. `ex, ey` es lo que te hacen —retrocesos, embestidas, empujones— y no obedece a nadie: sale disparado y se apaga. Antes había una sola, y bastaba con pulsar la dirección contraria para cancelar un retroceso: el `empuje` de las armas era casi decorativo. Medido: un segundo de carrera recorre 197–209 px tanto a 3 como a 60 ticks por segundo.

**Los cuerpos ahora chocan.** No había colisiones en absoluto: los enemigos se posaban justo encima del jugador y pelear era pelearse con un borrón. Son muelles, no muros: se separan por posición repartida según el peso —la araña cede casi todo— más un empujón para que el choque se note. Acorralado contra una pared por dos enemigos, los cuerpos se comprimen hasta un 37% en el 13% de los instantes (mediana 4,6 px de 31). Lo que **nunca** pasa, y es lo que la prueba exige, es que el centro de un enemigo quede dentro del jugador: cero casos en 420 medidas.

Por el camino: las paredes cuentan desde el borde del cuerpo y no desde su centro, contra la pared se pierde solo la velocidad hacia ella —así se sigue deslizando por el borde—, y la esquiva dejó de ser "andar más rápido" para ser un impulso seco que se apaga solo.

**El mando táctil tenía tres fallos que lo hacían inservible.** Apuntar iba pegado al joystick: o te movías o apuntabas. Se leía el primer toque del evento sin mirar de qué dedo era, así que con dos dedos el de la derecha movía el joystick. Y el botón de esquivar activaba la esquiva sin que nadie la desactivara: tras tocarlo una vez, el personaje esquivaba solo cada 1,4 s para siempre. Ahora cada dedo se sigue por su identificador, la mitad derecha apunta con el mismo cálculo que el ratón, y los botones se sueltan.

**Y el movimiento se ve fluido.** El servidor manda 10 posiciones por segundo y la pantalla dibuja 60: pintando la posición cruda se veía a saltos. Cada cuerpo tiene ahora una posición dibujada que persigue a la del servidor. No se predice nada —al fallar, predecir da tirones peores—: solo se recorta la distancia que queda, y un salto grande (reaparición) se salta en vez de arrastrarse.

## v30 — El resultado del combate ya no se pierde

Reportado desde la partida: al vencer a los jefes aparecía **"sin respuesta (28s)"** y el contador subía sin fin. El combate había terminado, pero el jugador se quedaba mirando una pantalla muerta sin recompensa ni pantalla de victoria.

`terminar()` borra la partida del mapa —lo ha hecho siempre, y está bien: el oro y el botín ya se han dado—. El fallo era que el **resultado** moría con ella. Jugando por socket no se notaba porque el bucle lo entregaba en el mismo instante en que se generaba; jugando por HTTP, entre un pulso y el siguiente hay 100 ms, y en ese hueco la partida desaparecía. El pulso siguiente solo encontraba un 404, que el cliente ignoraba en silencio mientras seguía girando en vacío.

Ahora el final espera en un buzón hasta que alguien lo recoja, **venga por donde venga**: socket, pulso HTTP o botón de abandonar. Se entrega una sola vez —es la noticia, no el premio— y caduca a los dos minutos para que cerrar la pestaña no deje restos guardados. Esto arregla de paso un fallo latente del camino por socket: si la conexión se caía en el tick exacto del final, el resultado también se perdía.

En el cliente, un 404 ya no es un callejón sin salida: tras una docena de respuestas vacías el pulso pregunta al servidor si el combate sigue vivo y actúa —enseña el resultado o vuelve al menú—. Nunca deja al jugador delante de un contador.

**La prueba se validó al revés antes de darla por buena.** `test-arena-http.js` gana una partida entera sin abrir un solo socket y recoge el resultado; con el código anterior falla con "404: el resultado se perdió por el camino". Una prueba que no caza el bug que dice cazar no vale nada.

## v30 — PASO 2: cada arma se mueve a su manera

Tras el paso 1 la espada ya se veía, pero todas las armas hacían el mismo gesto: un barrido. La lanza barría, el hacha barría, la daga barría. Cambiar de arma se notaba en los números y no en las manos.

**Cinco gestos.** El barrido de las espadas, el **tajo alto** del hacha y el garrote (sube por encima del hombro y cae acelerando, con la hoja creciendo al impactar), la **estocada** de la lanza (no gira: sale disparada por el eje de puntería 53 px y vuelve), el **pinchazo** corto de la daga y el **disparo** de arcos y varas (se tensa hacia atrás y suelta de golpe). Verificado ejecutando la tabla: el hacha gira 115°, la lanza 7°, y las cinco vuelven exactamente a la guardia sin deriva acumulada.

El gesto se declara donde se declara el resto de la conducta del arma, en `ARMAS`. No hay un catálogo paralelo de animaciones. Y un arma que no lo declare no se queda sin movimiento: se deduce de sus propios números (si dispara, gesto de disparo; si el arco es estrecho, estocada).

**Es solo presentación, y hay una prueba que lo vigila.** Que el hacha se vea venir de arriba no cambia a quién alcanza: el daño, el alcance y el arco los sigue decidiendo el servidor. La prueba lee el bloque de gestos de la página y falla si aparece cualquier cálculo de daño ahí dentro.

**El arma ya no sale boca abajo.** Apuntando a la izquierda, girar el dibujo dejaba la hoja mirando al suelo y el mango arriba. Ahora se espeja en vertical, como cualquier juego 2D con sprites laterales.

**Tiras de cuadros, listas antes que el arte.** Si aparece `assets/items/anim/<id>.png` con los cuadros cuadrados en fila, el servidor lo detecta solo, cuenta los cuadros dividiendo ancho entre alto y el renderer recorta el que toque —el que decide el servidor, no el cliente—. Añadir la animación de un arma será copiar un archivo, sin tocar código. La prueba se fabrica su propia tira de 4 cuadros para comprobarlo, porque andamio sin probar no es arquitectura: es una promesa.

## v30 — La arena dejó de depender del WebSocket

Un jugador no podía moverse. El diagnóstico terminó siendo que **la petición de WebSocket no llegaba a Node**: cero rechazos y cero sockets abiertos, con HTTP funcionando perfectamente. Eso pasa por cosas que no están en este código —un antivirus que inspecciona tráfico, un proxy, una extensión— y no se arreglan desde aquí.

El defecto de fondo era otro: **el socket era obligatorio**. Si fallaba, la arena quedaba muerta y muda. El launcher ya tenía plan B para el chat; la arena no tenía ninguno.

Ahora `POST /api/arena/sync` lleva la intención y trae el estado en una sola petición. Mismo servidor decidiendo, mismo saneo, mismas reglas: cambia el transporte, no quién manda. La página lo usa sola cuando el socket no hay manera, y lo dice en la barra. `test-arena-http.js` juega una partida entera por ahí **e intenta hacer trampa por ese mismo camino** —curarse, fijarse la animación, regalarse oro—: abrir un transporte nuevo no puede abrir un agujero.

**Por qué costó tanto encontrarlo.** `test-arena.js` hablaba con el servidor a pelo, sin ejecutar nunca el JavaScript de la pantalla: comprobaba que el motor funciona, no que la pantalla lo use. Es el mismo agujero de la v29. `test-arena-navegador.js` descarga la página, extrae sus `<script>` y **los ejecuta** contra el servidor real. Con él salieron dos fallos que ninguna prueba anterior podía ver: `requestAnimationFrame` estaba dentro de la función que pinta, así que una sola excepción congelaba el lienzo para siempre y en silencio; y `ws.onclose` era `ws = null` y nada más, sin reconectar ni avisar. Los dos se viven igual desde el asiento del jugador: "no me puedo mover".

Y como el navegador esconde a propósito el código HTTP con el que rechaza un WebSocket, ahora lo cuenta el servidor: cada rechazo queda registrado con motivo y la página lo pregunta por HTTP cuando falla.

## v30 — PASO 1: las espadas se ven (y el bug tenía dos mitades)

El síntoma era claro: forjas la Espada de Hierro, la equipas, entras en la arena y no la ves por ningún lado. Al abrir el capó había **dos fallos encadenados**, y arreglar solo uno no habría cambiado nada en pantalla.

**Mitad 1 — nadie la dibujaba.** El renderer de la arena pintaba al jugador como un círculo dorado con una raya amarilla de dirección. Además el servidor no mandaba el arma: en el paquete de estado viajaba `arma: "Espada de Hierro"`, un texto. Con un texto no se dibuja nada. Ahora viaja `armaVis` con el dibujo, el ángulo del sprite, el alcance y el arco, y el cliente lo pinta en la mano del personaje, girado hacia donde apuntas.

**Mitad 2 — los PNG tenían el fondo opaco.** Blanco en la de piedra, gris azulado en hierro y diamante. Aunque el renderer las hubiera dibujado, se habrían visto como un cuadrado tapando al personaje. Esto no se arregla con código de dibujado: `aplicar-transparencia-armas.js` recorta el fondo por inundación desde el borde (un brillo dentro de la hoja no se convierte en agujero) y guarda los originales en `assets/items/originales/`.

**Una sola verdad por arma.** `ARMAS` (cómo pega: alcance, arco, cadencia, empuje) y `ITEM_TEMPLATES` (cómo se ve: nombre, icono, dibujo) se fusionan en `armaVista()`. No hay un tercer catálogo con sprites: cambiar el dibujo de la Espada de Hierro es tocar un sitio y lo ven el inventario, el perfil y la arena a la vez. El catálogo fusionado se publica en `/api/arena` para que se pueda comprobar desde fuera que no hay dos verdades.

**Base de animación** (`src/server/57-animaciones.js`), a propósito fuera del combate: idle, walk, attack, hurt, dodge y death, con prioridades —recibir un golpe corta un ataque, un ataque no corta el recibir— y el ataque dividido en preparación → golpe → recuperación. La animación es **estado del servidor**: viaja en el mismo paquete que la vida y la posición, y el cliente solo adelanta el cronómetro entre paquetes para que el gesto no vaya a saltos de 100 ms. Un mensaje del cliente pidiendo `anim: 'death'` se ignora, igual que se ignora si pide vida o botín.

**La regla del dibujo, en todas las pantallas:** si el objeto trae `imagen` se pinta la imagen; si no, el emoji de `icon`. Los objetos antiguos no traen imagen, así que el emoji no es un adorno: es el camino normal para casi todo el inventario. El `alt` de cada `<img>` lleva el emoji, de modo que si un PNG desaparece el navegador pinta el emoji solo, sin JavaScript.

**Una prueba que mentía.** `test-espadas.js` comprobaba que cada PNG pesara más de 300 bytes. Era un "no está vacío" a ojo, y dejó de valer al recortar el fondo: el archivo bueno pesa **menos** que el malo. Ahora comprueba lo que importa —firma PNG, 32×32 y canal alfa— en vez del peso. Sin ese último punto, una espada con el fondo relleno volvería a pasar el test y a verse como un cuadrado gris.

## v29 — La arena estaba injugable
Primera prueba con jugadores reales. El fallo grave: **el estado del combate se enviaba al primer socket del jugador, que en el juego real es el del launcher** (chat y presencia), no el de la pantalla de arena. Las entradas llegaban, la partida corría, pero la pantalla no recibía nada: congelada, sin poder moverse ni atacar.

Mis pruebas abrían **un solo socket**, y con uno solo el primero es también el correcto: pasaban en verde mientras el juego estaba roto para cualquier persona. La prueba ahora abre dos a propósito.

También: el mismo aspecto de personaje en todas las pantallas, y el perfil se abre pulsando el avatar de la barra superior — el panel de equipamiento existía desde la v20 pero estaba escondido, que es por qué "no se podía equipar nada".

Ver `docs/RESPUESTA_A_LA_PRUEBA.md` para el plan del resto.

## v28 — Pulido final antes de la prueba
- **Los efectos activos se ven en la barra superior**, con su icono, el bono y el tiempo que queda, y parpadean en los últimos 30 segundos. Sin esto, beber una poción de fuerza no se distinguía de no beberla.
- **La primera pieza de armadura ya no depende de la suerte**: el coto de caza da 3-5 cueros y la capucha cuesta 3, así que un solo viaje basta. Antes hacían falta dos a veces, lo que en el arranque se siente como que el sistema está roto.
- Diagnóstico final sin nada de prioridad alta y 408 pruebas en verde.

## v27 — Más recetas, cultivos, armas y armaduras
De 5 recetas a **30**: 19 en la forja, 6 de alquimia y 5 de cocina.

**Pociones con efecto real.** Fuerza, Velocidad, Piedra y Sabiduría dan +14/+16 a su estadística durante 5 minutos. No es un icono: hay un sistema de efectos temporales que entra en el cálculo de estadísticas, así que valen igual en el combate por turnos, en la arena y en las mazmorras. Tomar dos iguales renueva el tiempo pero **no acumula el bono**, para que no se conviertan en la única táctica.

**La agilidad ahora mueve.** En la arena, la velocidad de movimiento sale de la agilidad (hasta +45%), así que la Poción de Velocidad se nota al andar y no solo en la ficha.

**Seis armas nuevas** (garrote, hacha, lanza, arco corto, vara de cristal, filo escarchado), cada una con su alcance, cadencia y arco en el motor de arena: la lanza pincha lejos en un cono estrecho, el hacha pega fuerte y lento, el arco dispara.

**Ocho piezas de armadura** que completan los juegos de cuero, hierro y cristal, cubriendo casco, pecho, guantes, botas y accesorios.

**Tres cultivos nuevos** —maíz, calabaza y chile— más miel de una colmena silvestre, y cuatro comidas que curan y además dejan un efecto, que es la razón para cocinar en vez de beber pociones siempre.

**Un agujero que salió al probarlo:** el cuero solo caía como botín aleatorio, así que podías quedarte sin poder fabricar ninguna armadura ligera. Se añadió el coto de caza en el bosque. Hay una prueba que verifica que **ningún cultivo ni material recolectable se queda sin una receta que lo use**: trabajo del jugador que no sirve para nada es peor que no tener el material.

## v26 — Saber dónde deja de jugar la gente
Preparando la prueba con jugadores, faltaba el dato que ninguna encuesta acierta. La pregunta "¿en qué momento dejaste de tener ganas?" se contesta mal de memoria, pero el servidor puede responderla solo: ahora el launcher avisa de en qué pantalla está el jugador, y el panel muestra **minutos por pantalla y desde cuál se fue cada uno**.

Con eso, tras un fin de semana de beta sabrás si la gente se va desde el mapa (no encuentran qué hacer), desde el combate (aburre) o desde el mercado (no entienden los precios). Son tres problemas distintos con tres arreglos distintos.

El módulo se valida contra una lista blanca: una pantalla inventada no ensucia el informe.

**Y un fallo real que salió al ejecutar la suite completa**: el inyector de la capa de red borraba su bloque y lo volvía a añadir al final, lo que lo movía por detrás del bloque de avisos. Reaplicarlo cambiaba el archivo aunque el contenido fuera idéntico. La prueba de idempotencia lo cazó, y solo fallaba al ejecutar las suites en orden, nunca en aislado — el tipo de fallo que uno tiende a descartar como "cosas de la máquina". Ahora el bloque se sustituye en su sitio.

## v25 — Retirar el sistema de mazmorras viejo
Desde la v22 convivían dos sistemas de mazmorras: el nuevo, de salas y combate real, y el de "pulsar Avanzar", que ya no usaba nadie pero seguía respondiendo. Antes de tocarlo se comprobó que estaba muerto de verdad: la pantalla se había reescrito y lo único que quedaba era un puente huérfano en el launcher que ninguna página invocaba.

Se retira en vez de dejarlo desconectado porque **código muerto que parece vivo ya nos costó un diagnóstico equivocado**: el `doctor.js` probaba ese endpoint y no el que usa el juego, así que decía que la mazmorra funcionaba mientras la de verdad no se estaba comprobando.

Con ello se fueron el catálogo antiguo, sus endpoints, el puente del launcher y las funciones asociadas. La misión "Las Profundidades" apunta ahora a la mazmorra real, y el registro de actividad muestra los eventos nuevos (arena y mazmorra) en vez de uno que ya no se emitía.

También se igualó a 3 segundos la espera de arranque en todas las suites: varias fallaban de forma intermitente cuando la máquina iba cargada, y una prueba que falla a veces enseña a ignorar los fallos.

## v24 — Integrar lo nuevo con lo que ya había
Después de tres versiones grandes seguidas, revisión de las costuras. Dos huecos reales:

**Nadie iba a descubrir la arena ni el huerto.** Estaban en el menú, pero Primeros pasos —la lista que guía al jugador nuevo— seguía hablando solo de los sistemas de antes. Ahora tiene diez pasos e incluye recolectar agua, sembrar y cosechar, y ganar en la arena. Con sus eventos en el embudo, así que en `/admin.html` se verá cuánta gente llega a cada uno.

**El diagnóstico probaba la mazmorra vieja.** `doctor.js` seguía llamando al endpoint heredado y no sabía nada de arena, recolección ni huerto. Ahora prueba los ocho recorridos, y cuando algo falla dice el motivo del servidor en vez de "HTTP 400": resultó que la mazmorra se negaba a abrirse porque el bot llegaba malherido, que es exactamente lo que debe hacer. Un fallo aparente que era el comportamiento correcto mal contado.

## v23 — Sube tu propio personaje
Última pieza de la lista. Se elige una imagen, el navegador la **recorta en círculo con fondo transparente** y borde dorado antes de subir nada, y el servidor comprueba que lo que llega es de verdad lo que se pidió: firma PNG real (no la extensión), cuadrada, dentro de rango de tamaño y **con canal alfa**.

Ese último requisito es la lección de la v10: dos ilustraciones con el fondo incrustado convirtieron al personaje en un cuadrado sobre el mapa. Con imágenes de desconocidos eso pasaría siempre, así que ahora es imposible subir una sin transparencia.

El archivo se nombra por el hash de su contenido (nada que mande el cliente toca la ruta), se escribe con temporal y renombrado, sustituye al anterior sin acumular basura, y se puede quitar para volver a una skin normal. Aparece en el catálogo como una skin más, así que el creador, el perfil, la barra superior y el mapa la usan sin saber que es especial.

27 pruebas, incluidas las de un JPEG renombrado a PNG, imágenes sin alfa, no cuadradas, demasiado grandes y un intento de salirse de la carpeta de subidas.

## v22 — Mazmorras jugables
Las de antes eran un botón "Avanzar" que no hacía nada: se pulsaba tres veces y se cobraba. Ahora el servidor genera un mapa con semilla y en **cada piso hay dos salas entre las que elegir**: guardia, guardián, cofre (que puede estar trampeado), pasillo con trampas, santuario y, al final, la sala del jefe.

Los combates se juegan con el motor de la v21 — enemigos reales, en tiempo real. El botín y la XP se **acumulan en la run** y solo se cobran si sales con vida; morir los pierde y retirarse a tiempo te deja la mitad. Eso convierte la elección de sala en una decisión de verdad: ¿cofre o santuario con la vida a la mitad?

Verificado jugando una Cripta entera: 4 pisos, 6 bajas, 756 XP, 279 de oro y siete objetos al inventario, con el contador de mazmorras del perfil actualizado.

## v21 — Combate en tiempo real
Segundo sistema de combate, sin tocar el de turnos. Simulación **en el servidor** a 10 pasos por segundo; el cliente solo manda intenciones y dibuja. Retroceso, alcance y arco de arma, proyectiles, esquiva con invulnerabilidad, y tres conductas de enemigo (perseguidor, tirador y embestidor que avisa antes de cargar). El arma equipada cambia cómo se juega. Bajas, XP y botín entran por las mismas vías que el resto del juego.

Tres pruebas intentan hacer trampa por el socket (declarar daño, declarar enemigos muertos, declararse ganador) y las tres fallan como deben. Verificado jugando: un bot que pelea gana; uno que se queda quieto muere.

Además, huerto y recolección tienen ya su pantalla, y ambos están en el menú. Detalle en `docs/CAMBIOS_V21.md`.

## v20 — Arreglos de la partida real y sistemas nuevos
Diez puntos revisados tras una sesión de juego. Los grandes: el mapa usaba `bosque`/`minas` y el servidor `forest`/`mines`, así que **viajar fallaba en silencio** y con ello desaparecían los enemigos; el **agua y el trigo no los daba nada**, lo que dejaba pociones y pan bloqueados para siempre; y `/api/player/equip` existía pero **ninguna pantalla lo llamaba**, por eso no se podía equipar lo fabricado.

Nuevos: recolección por nodos con enfriamiento, huerto con crecimiento en tiempo real, panel de inventario y equipo en el perfil, aceptar misiones desde el NPC, perfil completo con 12 medallas calculadas de contadores reales, y validación de skins que retira del catálogo las que no puedan funcionar. Detalle en `docs/CAMBIOS_V20.md`.

## v19 — El mundo deja de ser una pantalla
Hasta ahora cada zona cabía justo en la ventana y el personaje chocaba contra el borde del navegador. Ahora cada zona es un mapa de 1800×1200 con **cámara que sigue al jugador**: se explora de verdad, y en un móvil ya no se ve todo el mapa de un vistazo.

- **Los edificios son sólidos.** Colisión probada eje por eje, para poder deslizarse a lo largo de una pared en vez de quedarse clavado al tocarla en diagonal.
- **Se entra por el lado opuesto al que se sale.** Si sales por el norte, apareces al sur de la zona siguiente: el mundo se siente continuo al ir y volver.
- **Minimapa de zona**, abajo a la derecha: los edificios a escala y tu posición dentro del mapa. Antes solo se veía en qué zona estabas, lo cual bastaba cuando la zona era una pantalla.
- Las posiciones de NPCs y edificios estaban escritas para un lienzo de 900×650: se reescalan al mundo grande en vez de reescribirlas todas a mano.

También se estabilizó una prueba de combate que fallaba de vez en cuando por temporización y no por un fallo real.

## v18 — Apartado gráfico y protocolo de prueba
**Mapa.** El suelo era un color plano con una rejilla encima. Ahora se pinta con manchas de dos tonos generadas con semilla fija por zona (cambia entre zonas, no parpadea al volver), senderos que guían la vista hacia las salidas, viñeta en los bordes y tinte de ambiente propio: el pueblo cálido, el bosque verdoso, las minas oscuras, las ruinas moradas. Cada zona salpica sus propios detalles (hierba y flores, setas y hojarasca, picos y gemas, calaveras y velas).

Las estructuras dejan de ser recortes de papel: sombra proyectada, banda de techo más clara y base oscurecida. NPCs y monstruos tienen sombra bajo los pies, y en las zonas oscuras el jugador lleva un halo de luz que además ayuda a ver por dónde anda.

**Todas las páginas.** Transiciones suaves, elevación al pasar por encima de las tarjetas, brillo propio para épico, legendario y mítico —se distinguen sin leer—, y aparición suave de los paneles. Todo respeta `prefers-reduced-motion`.

**`docs/PRUEBA_DE_JUEGO.md`**: el protocolo para la primera prueba con gente. Qué dejar listo, qué pedirles (y qué no hacer: no explicarles cómo se juega, no parchear en caliente), qué mirar cada día en el panel, cómo ordenar lo que salga y las tres preguntas que la prueba tiene que dejar contestadas.

## v17 — Avisos desde dentro del juego
Botón "💬 Aviso" en todas las páginas de juego. El jugador escribe qué ha pasado; el contexto va solo: página, versión, nivel del personaje, tamaño de pantalla y navegador. Los avisos se ven en `/admin.html`, se pueden marcar como resueltos y reabrir.

Por qué: en una beta los fallos llegan por chat a medias — "no me iba el mercado, creo que ayer". Con esto llegan con lo que hace falta para reproducirlos. Funciona sin haber iniciado sesión, porque los fallos del registro son justo los que nadie puede reportar estando dentro.

Deliberadamente simple: un texto y tres tipos. Un formulario largo no lo rellena nadie.

## v16 — Ensayo del despliegue
Copiar solo `criptomundo.js` y `assets/` a una carpeta limpia y arrancar como en producción. El juego funciona, pero apareció una trampa: con `NODE_ENV=production` la cookie de sesión lleva `Secure`, así que **el navegador solo la envía por HTTPS**. Sin TLS por delante, el registro parece ir bien y a partir de ahí todo responde "no autorizado" — un síntoma que no se parece en nada a su causa, y que habría costado una tarde de depuración con testers esperando.

Ahora el servidor lo detecta (mirando `X-Forwarded-Proto` para no dar falsos positivos detrás de un proxy) y lo avisa por consola en cuanto ocurre. `/api/health` expone `tlsDetectado`.

El paquete mínimo para desplegar son dos cosas: el ejecutable y la carpeta `assets/`. 8,4 MB en total.

## v15 — Concurrencia: no se puede duplicar dinero
El servidor es de un solo hilo y sus manejadores no tienen `await` después de leer la petición, así que **en teoría** cada operación económica es atómica. Esta versión lo convierte en algo verificado: 17 pruebas que disparan peticiones **a la vez**, no en fila.

Comprobado que no se puede: comprar dos veces la última unidad de una publicación, cancelar y vender el mismo objeto simultáneamente, cobrar cinco veces la misma recompensa de Primeros pasos, duplicar con la misma clave de idempotencia, unirse dos veces al mismo gremio, abrir dos mazmorras a la vez ni **cobrar tres veces la recompensa de una run** (esta última grindea un personaje hasta nivel 5 y completa la Cripta de verdad; tarda un minuto y es la que más valía la pena).

Sin fallos encontrados. Un resultado negativo, pero de los que dejan dormir: la parte del juego donde un error se traduce en oro infinito está cubierta.

## v14 — Estabilidad en ejecución larga
Auditoría de las estructuras que crecen mientras el servidor está encendido. Apareció un **fallo real**: la limpieza del mapa de contadores de rate limiting estaba escrita como una línea suelta fuera de toda función, así que solo se evaluaba una vez al arrancar y en la práctica **nunca se limpiaba**. Con una IP por jugador y una clave por tipo de acción, ese mapa crecía sin techo durante semanas.

Corregido, y de paso acotados el historial de mercado en memoria y la retención de la telemetría (72 horas y 90 días, cuando los informes solo usan 48 horas y 30 días).

Suite nueva de 20 pruebas que incluye 400 peticiones seguidas y una espera real de 65 segundos para comprobar que el servidor se recupera solo cuando expira la ventana del limitador.

## v13 — Cuando se cae la conexión
Hasta ahora, si el servidor no respondía, el juego se quedaba mudo: los `catch {}` de cada página se tragaban el error y el jugador veía una pantalla que no reaccionaba, sin saber si era su wifi, el servidor o el botón. En una beta eso se reporta como "se ha colgado".

Capa compartida en las 13 páginas: aviso visible al perder y al recuperar la conexión, reintento automático de las **lecturas** con espera creciente, y **ninguna repetición de escrituras** — reintentar un POST puede comprar dos veces. De propina, foco visible para navegar con teclado y el aviso anunciado a lectores de pantalla.

## v12 — Orden en la casa
Sin funciones nuevas. El ejecutable se llamaba `criptomundo-v3.js` estando en la v11, la documentación eran nueve archivos sueltos en la raíz y la versión estaba copiada en tres sitios que ya habían divergido (el banner decía v9). Ahora: `criptomundo.js`, un `README.md` de entrada, este historial, `docs/` para el resto, y una única `VERSION` que la compilación comprueba contra `package.json`.

## v11 — Prueba de carga
Convertir en dato la afirmación "el JSON aguanta". **300 jugadores simultáneos: 330 peticiones/s, p95 de 44 ms, cero fallos.** Descubrió que el cuello de botella real no es la persistencia sino `scrypt` en registros masivos: mil entradas de golpe atascan el arranque aunque el juego siga fluido.

## v10 — Zarigüeya Laureada y skins animadas
Séptimo personaje, y el primero animado. El campo `sprites` deja de ser una promesa de la guía y se usa de verdad en el creador y en el mapa. Las skins sin animación siguen funcionando igual.

## v9 — Controles táctiles
El mapa se movía solo con teclado, o sea que en un móvil no se movía. Joystick virtual con zona muerta y botón de acción, visibles solo en pantallas táctiles.

## v8 — Que funcione en el móvil
Las nueve páginas tenían tres columnas fijas: en un teléfono el contenido central quedaba en 40 px. Bloque de CSS móvil compartido, aplicado por script para no acabar con trece versiones distintas.

## v7 — Beta cerrada por invitación
Códigos con etiqueta de origen para meter a diez personas concretas y saber de dónde viene cada una. Sin `INVITE_ONLY=1` nada cambia.

## v6 — Primeros pasos
Los datos decían que solo el 50 % aceptaba una misión y el 40 % la completaba, aunque era gratis desde el minuto uno. No era dificultad: nadie sabía que existía. Lista de siete objetivos que se marca sola con lo que el jugador ya hace.

## v5 — Tiempo real y datos a salvo
WebSocket implementado a mano para chat y presencia; escritura atómica y copias rotadas con recuperación automática si el archivo se corrompe. Encontró un fallo de sockets a medias que contaba jugadores fantasma.

## v4 — Ejecutarlo y medirlo
`doctor.js` y `simular-jugadores.js`. Al ejecutarlos por primera vez salieron tres problemas de balance invisibles leyendo el código: 8,4 turnos por enemigo, 29 enemigos para llegar a nivel 5, y solo un 10 % alcanzando la primera mazmorra. Corregidos a 4,7 turnos, 12 enemigos y 100 %.

## v3 — Autoridad del servidor
El punto de partida de todo. El cliente calculaba el combate, el precio de compra, el progreso de misión y el resultado del PvP, y el servidor se lo creía. Se reescribió entero: nueve páginas pasaron a ser clientes finos. Detalles en `docs/HISTORIA_V3.md`.
