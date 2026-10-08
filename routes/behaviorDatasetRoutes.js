const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { DatasetStore } = require('../security/behaviorDatasetStore');

const router = express.Router();
const allowedOrigins = new Set((process.env.EVOGUARD_DATASET_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s=>s.trim()));
const store = new DatasetStore(process.env.EVOGUARD_DATASET_DIR || path.join(__dirname,'..','intelligence_service','datasets','evoguard_behavior','evoguard_pilot_v1'));
router.use((req,res,next)=>{
  const origin=req.get('origin');
  if(origin && !allowedOrigins.has(origin)) return res.status(403).json({success:false,error:'Collection origin is not allowed.'});
  next();
});
router.use(cors({origin:(origin,callback)=>callback(null,!origin || allowedOrigins.has(origin))}));
router.use(express.json({limit:'64kb',strict:true,verify:(_req,_res,buf)=>{
  if(buf.length>48*1024) {const e=new Error('Request exceeds 48 KiB');e.status=413;throw e;}
}}));
const run = action => async(req,res,next)=>{try {res.json({success:true,data:await action(req)});} catch(e) {next(e);}};
router.get('/health',(_req,res)=>res.json({success:true,schema_version:'2.0',storage:'local_json',dataset_version:'evoguard_pilot_v1'}));
router.post('/start',run(req=>store.start(req.body)));
router.post('/batch',run(req=>store.batch(req.body)));
router.post('/finish',run(req=>store.finish(req.body)));
router.get('/session/:id',run(req=>store.raw(req.params.id)));
router.use((err,_req,res,_next)=>{
  const status=err.status || (err.type==='entity.too.large'?413:500);
  res.status(status).json({success:false,error:status>=500?'Dataset storage failed. Check gateway terminal and disk space.':err.message});
});
module.exports=router;
