/**
 * CriptoMundo — el mapa recuerda dónde estabas y no te encierra
 * Uso:  PORT=3460 node test-mundo-zona.js --spawn
 *
 * DOS FALLOS REPORTADOS DESDE LA PARTIDA, LOS DOS DEL MISMO ORIGEN:
 * dar por hecho que el mapa se queda como lo dejaste.
 *
 *  1. Ibas al bosque, abrías el inventario, volvías... y estabas en el
 *     pueblo. El mapa vive en un iframe que el launcher recarga entero
 *     al cambiar de pantalla, así que su variable de zona volvía a
 *     'pueblo' cada vez. La zona es un dato del personaje, no de una
 *     pantalla: ahora la guarda el servidor.
 *  2. En las minas aparecías dentro de una pared y no podías moverte en
 *     ninguna dirección. Al entrar a una zona se dejaba al jugador en
 *     el centro exacto del mapa sin mirar si ahí había un edificio.
 */
const path=require('path'), { spawn }=require('child_process')
const http=require('http'); const PORT=Number(process.env.PORT||3460); let ck=''
function req(m,p,b){return new Promise(r=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};if(d)h['Content-Length']=Buffer.byteLength(d);if(ck)h.Cookie=ck
 const q=http.request({host:'localhost',port:PORT,path:p,method:m,headers:h},x=>{let o='';x.on('data',c=>o+=c);x.on('end',()=>{if(x.headers['set-cookie'])ck=x.headers['set-cookie'][0].split(';')[0];let j={};try{j=JSON.parse(o)}catch{};r({s:x.statusCode,b:j,raw:o})})});q.on('error',()=>r({s:0,b:{}}));if(d)q.write(d);q.end()})}
async function run(){let p=0,f=0;const ok=(n,c,e='')=>{c?(p++,console.log('  ✅ '+n)):(f++,console.log('  ❌ '+n+'  → '+e))}
 const u='z'+Math.floor(Math.random()*1e5)
 await req('POST','/api/auth/register',{username:u,email:u+'@t.io',password:'Prueba12345',className:'Guerrero'})
 let d=(await req('GET','/api/player')).b
 ok('al empezar estás en el pueblo', d.zonaActual==='pueblo', String(d.zonaActual))
 const e=await req('POST','/api/world/explore',{zoneId:'forest'})
 ok('se puede viajar al bosque', e.s===200, e.raw.slice(0,60))
 d=(await req('GET','/api/player')).b
 ok('el servidor recuerda que estás en el bosque', d.zonaActual==='forest', String(d.zonaActual))
 await req('POST','/api/world/explore',{zoneId:'mines'})
 d=(await req('GET','/api/player')).b
 ok('y se actualiza al cambiar de zona', d.zonaActual==='mines', String(d.zonaActual))
 const pg=await new Promise(r=>http.get({host:'localhost',port:PORT,path:'/criptomundo-mundo2d.html'},x=>{let o='';x.on('data',c=>o+=c);x.on('end',()=>r(o))}))
 ok('el mapa pregunta dónde estabas al cargar', /zonaActual/.test(pg) && /loadZone\(vuelta/.test(pg))
 ok('al entrar no se aparece dentro de un edificio', /sitioLibre\(W \/ 2, H \/ 2, W, H\)/.test(pg))
 ok('y el buscador de hueco existe', /sitioLibre\(x, y, W, H\)/.test(pg))
 console.log('\n  '+p+' OK · '+f+' fallidas\n'); process.exit(f?1:0)
}

if (process.argv.includes('--spawn')) {
  limpiarDatos('/tmp/cm-test-zona.json', '/tmp/cm-zona-b')
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-zona.json', BACKUP_DIR: '/tmp/cm-zona-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  esperarServidor(PORT).then(() => run().catch(e => { console.error(e); process.exit(1) }))
} else { run().catch(e => { console.error(e); process.exit(1) }) }

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
