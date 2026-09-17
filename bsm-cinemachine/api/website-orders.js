const {patchWebsiteOrders}=require('../checkout-wa-patch-20260917');
const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@46bde66fd10ce06d2ba9f0c1af67689bb43c5ba0/bsm-cinemachine/website-orders-20260913.js';

module.exports=async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;
    res.setHeader('content-type','text/plain; charset=utf-8');
    return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('checkout source '+r.status);
    const js=patchWebsiteOrders(await r.text());
    res.statusCode=200;
    res.setHeader('content-type','application/javascript; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    if(req.method==='HEAD')return res.end();
    return res.end(js);
  }catch(err){
    res.statusCode=502;
    res.setHeader('content-type','application/javascript; charset=utf-8');
    res.setHeader('cache-control','no-store');
    return res.end("console.error('Rentcam checkout temporarily unavailable');");
  }
};
