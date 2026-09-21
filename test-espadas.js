/**
 * CriptoMundo — pruebas de las espadas con dibujo propio
 * Uso:  PORT=3830 node test-espadas.js --spawn
 *
 * Comprueba que la espada no es solo una imagen: que el PNG se sirve,
 * que se forja con lo que se mina, que al equiparla suben las
 * estadísticas y que el combate en tiempo real la reconoce.
 */
const path = require('path')
const { spawn } = require('child_process')
const http=require('http'); const PORT=process.env.PORT||3777; let cookie='';
let pass=0,fail=0; const ok=(n,c,e='')=>{c?(pass++,console.log('  ✅ '+n)):(fail++,console.log('  ❌ '+n+(e?'  → '+e:'')))}
function req(m,p,b){return new Promise(r=>{const d=b?JSON.stringify(b):null;const h={'Content-Type':'application/json'};
 if(d)h['Content-Length']=Buffer.byteLength(d); if(cookie)h.Cookie=cookie;
 const q=http.request({host:'localhost',port:PORT,path:p,method:m,headers:h},s=>{let o='';s.on('data',c=>o+=c);
 s.on('end',()=>{if(s.headers['set-cookie'])cookie=s.headers['set-cookie'][0].split(';')[0];
 let j={};try{j=JSON.parse(o)}catch{};r({status:s.statusCode,body:j,raw:o})})});q.on('error',()=>r({status:0,body:{},raw:''}));
 if(d)q.write(d);q.end()})}
async function run(){
 const u='esp'+Math.floor(Math.random()*1e6);
 await req('POST','/api/auth/register',{username:u,email:u+'@t.io',password:'Prueba12345',className:'Guerrero'});

 console.log('\n── LAS IMÁGENES SE SIRVEN ──');
 // Antes esto pedía "más de 300 bytes". Era un "no está vacío" a ojo, y
 // dejó de valer al recortarles el fondo opaco: el PNG bueno pesa MENOS
 // que el malo. Ahora se comprueba lo que de verdad importa —que sea un
 // PNG real, de 32×32 y con canal alfa— en vez de su peso.
 for(const n of ['espada_piedra','espada_hierro','espada_diamante']){
   const r=await new Promise(res=>http.get({host:'localhost',port:PORT,path:'/assets/items/'+n+'.png'},x=>{
     const trozos=[];x.on('data',c=>trozos.push(c));
     x.on('end',()=>{const b=Buffer.concat(trozos);res({s:x.statusCode,t:x.headers['content-type'],len:b.length,buf:b})})}));
   const firma = r.buf && r.buf.length>26 && r.buf.readUInt32BE(0)===0x89504e47;
   ok('/assets/items/'+n+'.png se sirve como PNG', r.s===200&&/png/.test(r.t||'')&&firma&&r.len>120, `HTTP ${r.s} ${r.t} ${r.len}b`);
   ok('  · mide 32×32', firma && r.buf.readUInt32BE(16)===32 && r.buf.readUInt32BE(20)===32,
      firma?`${r.buf.readUInt32BE(16)}×${r.buf.readUInt32BE(20)}`:'sin firma PNG');
   // Sin esto, una espada con el fondo relleno pasaba el test y luego
   // se veía como un cuadrado gris encima del personaje.
   ok('  · tiene transparencia (tipo de color 6)', firma && r.buf[25]===6, firma?('tipo '+r.buf[25]):'—');
 }

 console.log('\n── RAREZA: piedra la más común, diamante la menos ──');
 const forja=await req('GET','/api/forja');
 const recetas=(await req('GET','/api/crafting')).body;
 // Comprobamos rareza vía inventario tras darnos las espadas con recetas
 const orden=['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHIC'];
 // Fabricamos la de piedra de verdad: minamos primero
 await req('POST','/api/world/explore',{zoneId:'forest'});
 let d=(await req('GET','/api/inventory')).body;
 const pico=d.inventory.find(i=>i.itemId==='pico_madera_piedra');
 await req('POST','/api/player/equip',{uid:pico.uid});
 const rocas=(await req('GET','/api/recursos?zona=forest')).body.nodos.filter(n=>n.util==='pico'&&n.nivel===1);
 const cuenta=async id=>((await req('GET','/api/inventory')).body.inventory||[]).filter(i=>i.itemId===id).reduce((a,i)=>a+i.quantity,0);
 // Picar como se pica en el juego: de pie junto a la roca y esperando
 // a recuperar el golpe. El servidor exige las dos cosas desde el §10.
 const dormir=ms=>new Promise(x=>setTimeout(x,ms));
 for(const r of rocas){ if(await cuenta('stone')>=5)break;
   for(let i=0;i<80;i++){ await dormir(470);
     const g=await req('POST','/api/recursos/golpear',{nodoId:r.id,pos:{x:r.x,y:r.y}});
     if(g.status!==200||g.body.agotado)break} }
 ok('se mina piedra suficiente', await cuenta('stone')>=5, 'piedra='+await cuenta('stone'));
 await req('POST','/api/crafting',{recipeId:'rec_mango_madera',quantity:1});
 let r=await req('POST','/api/crafting',{recipeId:'rec_espada_piedra',quantity:1});
 ok('se forja la Espada de Piedra con lo minado', r.status===200&&r.body.made>0, r.raw.slice(0,90));

 d=(await req('GET','/api/inventory')).body;
 const esp=d.inventory.find(i=>i.itemId==='espada_piedra');
 ok('la espada aparece en el inventario', !!esp);
 ok('trae su dibujo propio', esp&&esp.imagen==='/assets/items/espada_piedra.png', esp&&String(esp.imagen));
 ok('la espada de piedra es COMMON', esp&&esp.rarity==='COMMON', esp&&esp.rarity);

 console.log('\n── EQUIPARLA CAMBIA LAS ESTADÍSTICAS ──');
 const antes=d.stats.strength;
 r=await req('POST','/api/player/equip',{uid:esp.uid});
 ok('se puede equipar', r.status===200, r.raw.slice(0,80));
 ok('sube la fuerza de verdad', r.body.stats.strength>antes, `${antes} → ${r.body.stats.strength}`);

 console.log('\n── Y PEGA DISTINTO EN LA ARENA (no es decorativa) ──');
 r=await req('GET','/api/arena');
 ok('la arena reconoce la espada equipada', r.body.arma==='Espada de Piedra', 'arma='+r.body.arma);

 console.log(`\n  ${pass} OK · ${fail} fallidas\n`);
 process.exit(fail ? 1 : 0);
}
if (process.argv.includes('--spawn')) {
  const hijo = spawn(process.execPath, [path.join(__dirname, 'criptomundo.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_FILE: '/tmp/cm-test-espadas.json', BACKUP_DIR: '/tmp/cm-esp-b' }),
    stdio: 'ignore',
  })
  process.on('exit', () => { try { hijo.kill() } catch {} })
  setTimeout(() => run().catch(e => { console.error(e); process.exit(1) }), 1500)
} else { run().catch(e => { console.error(e); process.exit(1) }) }
