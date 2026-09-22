/**
 * CriptoMundo — la arena jugada ENTERA por HTTP, sin abrir un socket
 * Uso:  PORT=3862 node test-arena-http.js --spawn
 *
 * POR QUÉ EXISTE
 * Un jugador reportó "entro y no me puedo mover". El diagnóstico dijo
 * que el servidor no rechazaba nada y que había CERO sockets abiertos:
 * la petición de WebSocket ni siquiera llegaba a Node. Eso puede pasar
 * por mil motivos que no están en este código (un antivirus que mira el
 * tráfico, un proxy, una extensión) y ninguno se arregla desde aquí.
 *
 * Así que la arena dejó de depender del socket. El WebSocket es el
 * camino rápido; el pulso por HTTP es el camino que siempre existe. El
 * servidor decide exactamente lo mismo por los dos: esta prueba juega
 * una partida entera por HTTP e intenta hacer trampa por el mismo
 * camino, para que abrir esa puerta no signifique abrir un agujero.
 */
const http=require('http')
const PORT=process.env.PORT||3862
let ck=''
function req(m,p,body){return new Promise(r=>{const d=body?JSON.stringify(body):null
 const h={'Content-Type':'application/json'}; if(d)h['Content-Length']=Buffer.byteLength(d); if(ck)h.Cookie=ck
 const q=http.request({host:'localhost',port:PORT,path:p,method:m,headers:h},x=>{let o='';x.on('data',c=>o+=c)
  x.on('end',()=>{if(x.headers['set-cookie'])ck=x.headers['set-cookie'][0].split(';')[0]
   let j={};try{j=JSON.parse(o)}catch{};r({status:x.statusCode,body:j,raw:o})})})
 q.on('error',()=>r({status:0,body:{}})); if(d)q.write(d); q.end()})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const path=require('path'), { spawn }=require('child_process')
async function run(){
 let pass=0,fail=0; const ok=(n,c,e='')=>{c?(pass++,console.log('  ✅ '+n)):(fail++,console.log('  ❌ '+n+'  → '+e))}
 const u='http'+Math.floor(Math.random()*1e6)
 await req('POST','/api/auth/register',{username:u,email:u+'@t.io',password:'Prueba12345',className:'Guerrero'})
 const ini=await req('POST','/api/arena/start',{arenaId:'arena_bosque'})
 ok('empieza el combate sin socket', ini.status===200, ini.raw.slice(0,80))

 let s=await req('POST','/api/arena/sync',{entrada:{mx:0,my:0}})
 ok('el pulso devuelve estado', s.status===200 && !!s.body.estado, s.raw.slice(0,90))
 const p0={x:s.body.estado.jugador.x,y:s.body.estado.jugador.y}

 // moverse durante un segundo, solo con HTTP
 for(let i=0;i<10;i++){ s=await req('POST','/api/arena/sync',{entrada:{mx:0,my:-1,apuntar:-1.57}}); await sleep(100) }
 const p1={x:s.body.estado.jugador.x,y:s.body.estado.jugador.y}
 ok('moverse por HTTP mueve de verdad', Math.abs(p1.y-p0.y)>20, JSON.stringify(p0)+' → '+JSON.stringify(p1))

 // atacar
 let ataco=false
 for(let i=0;i<12;i++){ s=await req('POST','/api/arena/sync',{entrada:{mx:0,my:-1,apuntar:-1.57,atacar:true}})
   if(s.body.estado && s.body.estado.jugador.anim.n==='attack') ataco=true
   await sleep(100) }
 ok('atacar por HTTP dispara la animación del servidor', ataco, s.raw.slice(0,120))

 // seguridad: por HTTP tampoco se puede hacer trampa
 s=await req('POST','/api/arena/sync',{entrada:{mx:0,my:0,hp:99999,dmg:99999,anim:'death'}})
 ok('el cliente no se cura por HTTP', s.body.estado.jugador.hp<90000, String(s.body.estado.jugador.hp))
 ok('el cliente no fija su animación por HTTP', s.body.estado.jugador.anim.n!=='death', s.body.estado.jugador.anim.n)

 const car=await req('GET','/api/player')
 const oroAntes=car.body.character.gold
 await req('POST','/api/arena/sync',{entrada:{},oro:999999,botin:[{itemId:'espada_diamante',quantity:99}]})
 const car2=await req('GET','/api/player')
 ok('el pulso no regala oro', car2.body.character.gold===oroAntes, oroAntes+' → '+car2.body.character.gold)

 const fin=await req('POST','/api/arena/abandon')
 ok('se puede terminar', fin.status===200)
 const s2=await req('POST','/api/arena/sync',{entrada:{}})
 ok('sin combate el pulso responde 404', s2.status===404, String(s2.status))

 // ── EL RESULTADO NO SE PIERDE SIN SOCKET ──
 // Este era el bug de "sin respuesta (28s)" tras matar al jefe:
 // terminar() borra la partida del mapa, así que el resultado moría con
 // ella si no había un socket escuchando en ese instante exacto. Se
 // reproduce ganando de verdad, sin abrir un solo socket.
 console.log('\n── AL ACABAR SIN SOCKET, EL RESULTADO LLEGA IGUAL ──')
 await req('POST','/api/arena/start',{arenaId:'arena_bosque'})
 // Se deja morir: es la forma más rápida y segura de que la partida
 // acabe SOLA. Antes se atacaba para ganar, pero desde que los enemigos
 // tienen IA de verdad ya no se dejan matar a ciegas y el test se
 // quedaba dando vueltas sin llegar nunca al final.
 // Se pelea de verdad: se va a por el enemigo más cercano. Quedarse
 // quieto ya no vale desde que los enemigos tienen IA —muerden y se
 // apartan— y tampoco vale dar espadazos al aire.
 let recogido=null, vueltas=0, ultimo=null
 while(!recogido && vueltas++<1400){
   let ent={mx:0,my:0,atacar:true}
   if(ultimo && (ultimo.enemigos||[]).length){
     let mejor=null,md=1e9
     for(const en of ultimo.enemigos){const d=Math.hypot(en.x-ultimo.jugador.x,en.y-ultimo.jugador.y); if(d<md){md=d;mejor=en}}
     const a=Math.atan2(mejor.y-ultimo.jugador.y,mejor.x-ultimo.jugador.x)
     ent={mx:md>55?Math.cos(a):0,my:md>55?Math.sin(a):0,apuntar:a,atacar:true}
   }
   const r=await req('POST','/api/arena/sync',{entrada:ent})
   ultimo = r.body && r.body.estado
   if(r.body && r.body.fin) recogido=r.body.fin
   else if(r.status===404){ recogido='PERDIDO'; break }
   await sleep(50)
 }
 ok('la partida acaba sola (aquí, muriendo) y el resultado llega por HTTP',
    !!recogido && recogido!=='PERDIDO',
    recogido==='PERDIDO'?'404: el resultado se perdió por el camino':'no acabó en '+vueltas+' vueltas')
 ok('el resultado trae motivo y bajas',
    recogido && recogido!=='PERDIDO' && !!recogido.motivo && typeof recogido.bajas==='number',
    JSON.stringify(recogido).slice(0,110))
 const otra=await req('POST','/api/arena/sync',{entrada:{}})
 ok('y se entrega UNA sola vez', otra.status===404, String(otra.status))

 const d=(await req('GET','/api/diagnostico/socket')).body
 ok('el diagnóstico cuenta los intentos de socket', typeof d.intentosDeConexion==='number', JSON.stringify(d).slice(0,120))
 console.log('\n  '+pass+' OK · '+fail+' fallidas\n'); process.exit(fail?1:0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-http.json', '/tmp/cm-http-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-http.json', BACKUP_DIR: '/tmp/cm-http-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

// Arranque con servidor propio, igual que el resto de pruebas

// Espera a que el servidor CONTESTE, en vez de dar por hecho que en unos
// milisegundos ya estará arriba.
//
// Esa suposición se cae en cuanto la suite corre en paralelo: varios
// servidores levantando a la vez tardan más, y el síntoma era un
// ECONNREFUSED que parecía un fallo de la prueba y no lo era.
function esperarServidor(puerto, ms) {
  const hasta = Date.now() + (ms || 30000)
  return new Promise(resolve => {
    const probar = () => {
      const r = require('http').get({ host: 'localhost', port: puerto, path: '/api/health' }, res => {
        res.resume()
        resolve(true)
      })
      r.on('error', () => { if (Date.now() > hasta) resolve(false); else setTimeout(probar, 120) })
      r.setTimeout(1500, () => r.destroy())
    }
    probar()
  })
}

// Empieza siempre de cero.
//
// Sin esto, una prueba hereda el mundo que dejó la ejecución anterior:
// publicaciones a medio vender, personajes con nivel, enfriamientos sin
// cumplir. Lo destapó test-economia-objetos, que compraba dos unidades de
// una publicación que la vez anterior había dejado en una, y contestaba
// "Cantidad inválida" sin que hubiera nada roto.
function limpiarDatos() {
  const fs = require('fs')
  for (const ruta of arguments) {
    try { fs.rmSync(ruta, { recursive: true, force: true }) } catch {}
    try { fs.rmSync(ruta + '.tmp', { force: true }) } catch {}
  }
}
