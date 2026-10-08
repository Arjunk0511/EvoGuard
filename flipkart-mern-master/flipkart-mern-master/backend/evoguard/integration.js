const express=require('express');
const http=require('node:http');
const {randomBytes}=require('node:crypto');
const detectors=require('./detectorRunner');
const mongoose=require('mongoose');
const logSchema=new mongoose.Schema({method:String,path:String,riskScore:Number,action:String,attackTypes:[String],reasons:[String],time:{type:Date,default:Date.now}},{collection:'evoguard_request_logs'});
const RequestLog=mongoose.models.EvoGuardRequestLog||mongoose.model('EvoGuardRequestLog',logSchema);
const router=express.Router(), sessions=new Map();
const COOKIE='evoguard_live', TTL=120000;
function lookup(req){const s=sessions.get(req.cookies?.[COOKIE]);return s && Date.now()-s.touched<TTL?s:null;}
function evidence(s){return s && s.behavior && Date.now()-s.scored<45000?s.behavior:{status:'unavailable',bot_score:null,enforcement_allowed:false};}
setInterval(()=>{for(const [k,s] of sessions)if(Date.now()-s.touched>TTL)sessions.delete(k);},30000).unref();
router.use((req,res,next)=>{
 const origin=req.get('origin');
 const allowed=new Set(['http://localhost:3000','http://127.0.0.1:3000','http://localhost:4000','http://127.0.0.1:4000']);
 if(process.env.EVOGUARD_FRONTEND_ORIGIN)allowed.add(process.env.EVOGUARD_FRONTEND_ORIGIN);
 if(origin && !allowed.has(origin))return res.status(403).json({error:'Origin not allowed'});
 res.set('Cache-Control','no-store');next();
});
router.use(express.json({limit:'2mb'}));
router.post('/start',(req,res)=>{
 if(sessions.size>=1000)return res.status(503).json({error:'Session capacity reached'});
 const old=req.cookies?.[COOKIE];if(old)sessions.delete(old);
 const id=randomBytes(32).toString('hex');sessions.set(id,{touched:Date.now(),scored:0,busy:false,lastIndex:-1,lastPost:0});
 res.cookie(COOKIE,id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:3600000});
 res.json({status:'ready'});
});
router.post('/stop',(req,res)=>{sessions.delete(req.cookies?.[COOKIE]);res.clearCookie(COOKIE,{path:'/'});res.json({status:'stopped'});});
router.get('/status',(req,res)=>{const s=lookup(req);if(s)s.touched=Date.now();res.json({behavior:evidence(s),request:s?.request||null});});
function predict(payload){return new Promise((resolve,reject)=>{
 const data=JSON.stringify(payload);
 const req=http.request({hostname:'127.0.0.1',port:5004,path:'/score',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},res=>{
  let body='';res.on('data',b=>{body+=b;if(body.length>16384)req.destroy(new Error('Oversized scorer response'));});
  res.on('end',()=>{try{if(res.statusCode!==200)throw new Error('Scorer rejected window');const r=JSON.parse(body);if(!['exploratory_score','insufficient_evidence'].includes(r.status)||r.enforcement_allowed!==false)throw new Error('Invalid scorer response');resolve(r);}catch(e){reject(e);}});
 });req.setTimeout(5000,()=>req.destroy(new Error('Scorer timeout')));req.on('error',reject);req.end(data);
});}
router.post('/window',async(req,res)=>{
 const s=lookup(req);if(!s)return res.status(401).json({error:'Start monitoring first'});
 const {window_index,window:payload}=req.body||{};
 if(!Number.isInteger(window_index)||window_index<0||!payload||payload.duration_ms!==30000)return res.status(400).json({error:'Invalid window'});
 if(window_index<=s.lastIndex)return res.status(409).json({error:'Window already processed'});
 if(s.busy || Date.now()-s.lastPost<1000)return res.status(429).json({error:'Window request too frequent'});
 s.busy=true;s.lastPost=Date.now();s.touched=Date.now();
 try{s.behavior=await predict(payload);s.scored=Date.now();s.lastIndex=window_index;res.json(s.behavior);}
 catch(e){s.behavior={status:'service_unavailable',bot_score:null,enforcement_allowed:false};s.scored=Date.now();res.status(503).json(s.behavior);}
 finally{s.busy=false;}
});
// Applied to real /api/v1 routes after body parsers. No payloads or secrets logged.
function inspect(req,res,next){
 try{
  const result=detectors({query:req.query||{},body:req.body||{},params:req.params||{},endpoint:req.originalUrl});
  const s=lookup(req),behavior=evidence(s);
  req.idsContext={detectionResult:result,behavioralEvidence:behavior};
  if(s){s.touched=Date.now();s.request={method:req.method,path:req.baseUrl+req.path,riskScore:result.riskScore,action:result.action,attackTypes:result.attackTypes,time:new Date().toISOString()};}
  res.set('X-EvoGuard-Action',result.action);res.set('X-EvoGuard-Request-Risk',String(result.riskScore));
  if(result.action!=='ALLOW')console.log('[EvoGuard request]',JSON.stringify({method:req.method,path:req.baseUrl+req.path,...result}));
  if(result.action!=='ALLOW' && mongoose.connection.readyState===1)RequestLog.create({method:req.method,path:req.baseUrl+req.path,...result}).catch(e=>console.error('EvoGuard log write failed:',e.message));
  if(result.action==='BLOCK')return res.status(403).json({success:false,message:'Suspicious request detected and blocked.',error:{code:'REQUEST_BLOCKED'},detection:result});
  next();
 }catch(e){console.error('EvoGuard request inspection failed:',e.message);next();}
}
module.exports={router,inspect};
