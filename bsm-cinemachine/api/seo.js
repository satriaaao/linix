const {loadContent}=require('../search-content-20260930');
const {buildSeo,routeForPath}=require('../search-seo-20260930');
module.exports=async(req,res)=>{
 res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('{}')}
 try{const seo=buildSeo(routeForPath(req.query?.path),await loadContent());delete seo.body;res.statusCode=200;return res.end(req.method==='HEAD'?'':JSON.stringify(seo))}catch(_){res.statusCode=503;return res.end('{"error":"Search metadata temporarily unavailable"}')}
};
