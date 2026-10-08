'use strict';
// Node.js 20+ built-ins only: no npm install, Express, Mongoose or .env required.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {DatasetStore}=require('./store.cjs');
const PREFIX='/api/behavior/dataset/v2';
const DEFAULT_ROOT=path.join(__dirname,'..','output');
const publicFiles={
 '/assets/app.js':['app.js','text/javascript; charset=utf-8'],
 '/assets/behavioralSession.js':['behavioralSession.js','text/javascript; charset=utf-8'],
 '/assets/behavioralRecorder.js':['behavioralRecorder.js','text/javascript; charset=utf-8'],
 '/assets/styles.css':['styles.css','text/css; charset=utf-8']
};
function send(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
function body(req){return new Promise((resolve,reject)=>{
 let size=0,parts=[],settled=false;
 req.on('data',chunk=>{size+=chunk.length;if(size>48*1024){if(!settled){settled=true;const e=new Error('Request exceeds 48 KiB');e.status=413;reject(e);}parts=[];return;}if(!settled)parts.push(chunk);});
 req.on('end',()=>{if(settled)return;try{const value=JSON.parse(Buffer.concat(parts).toString('utf8'));resolve(value);}catch{const e=new Error('Body must be valid JSON');e.status=400;reject(e);}});
 req.on('error',reject);
});}
function createServer({root=DEFAULT_ROOT}={}){
 const store=new DatasetStore(root);
 const server=http.createServer(async(req,res)=>{
  try{
   const port=server.address()?.port;
   const hosts=new Set([`localhost:${port}`,`127.0.0.1:${port}`]);
   if(!hosts.has(req.headers.host))return send(res,403,{success:false,error:'Use the localhost address printed by this server.'});
   if(req.headers.origin && ![...hosts].some(h=>req.headers.origin===`http://${h}`))return send(res,403,{success:false,error:'Collection requests must originate from this local page.'});
   const url=new URL(req.url,'http://'+req.headers.host),route=url.pathname;
   if(req.method==='GET' && route===PREFIX+'/health')return send(res,200,{success:true,schema_version:'2.0',storage:'local_json',mongo_required:false,protocol_version:'evomart_local_tasks_v1'});
   if(route.startsWith(PREFIX+'/')){
    let result;
    if(req.method==='POST' && ['/start','/batch','/finish'].some(s=>route===PREFIX+s)){
     if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(res,415,{success:false,error:'Use application/json'});
     const payload=await body(req);
     result=await store[route.slice(PREFIX.length+1)](payload);
    }else if(req.method==='GET' && route.startsWith(PREFIX+'/session/')){
     result=await store.raw(route.slice((PREFIX+'/session/').length));
    }else return send(res,404,{success:false,error:'Dataset endpoint not found'});
    return send(res,200,{success:true,data:result});
   }
   if(req.method!=='GET' && req.method!=='HEAD')return send(res,405,{success:false,error:'Method not allowed'});
   if(route==='/favicon.ico'){res.writeHead(204);return res.end();}
   let resource=publicFiles[route];
   if(!resource && (['/','/products','/cart','/data-collection'].includes(route)||/^\/(product|products)\/[^/]+\/?$/.test(route)))resource=['index.html','text/html; charset=utf-8'];
   if(!resource)return send(res,404,{success:false,error:'Page not found'});
   const content=await fs.readFile(path.join(__dirname,'public',resource[0]));
   res.writeHead(200,{'Content-Type':resource[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});
   res.end(req.method==='HEAD'?undefined:content);
  }catch(e){const status=e.status||500;send(res,status,{success:false,error:status>=500?'Could not save/read dataset files. Check disk access and available space.':e.message});if(status>=500)console.error('[dataset storage]',e.message);}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return server;
}
if(require.main===module){
 const port=Number(process.env.EVOGUARD_DATASET_PORT||5003);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid EVOGUARD_DATASET_PORT');
 const root=process.env.EVOGUARD_DATASET_DIR?path.resolve(process.env.EVOGUARD_DATASET_DIR):DEFAULT_ROOT;
 const server=createServer({root});
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is already in use. Stop that process or set EVOGUARD_DATASET_PORT.`:e.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>{console.log(`EvoGuard local dataset collector: http://localhost:${port}/data-collection`);console.log(`Raw dataset directory: ${path.join(root,'raw')}`);console.log('No MongoDB, React server or Python service is required. Keep this one terminal running.');});
}
module.exports={createServer,DEFAULT_ROOT};
