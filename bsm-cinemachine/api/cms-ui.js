const SOURCE='https://raw.githubusercontent.com/satriaaao/linix/382fd05f462d3cd97f38e3773826c1cc9ae305a7/bsm-cinemachine/cms-admin-all-tables-adapter-20260918.js';

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;
    res.setHeader('content-type','text/plain; charset=utf-8');
    return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('cms ui source '+r.status);
    const js=await r.text();
    if(!js.includes('Rentcam CMS v5 — advanced catalog'))throw new Error('unexpected cms ui payload');
    res.statusCode=200;
    res.setHeader('content-type','application/javascript; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('x-content-type-options','nosniff');
    if(req.method==='HEAD')return res.end();
    return res.end(js);
  }catch(e){
    res.statusCode=502;
    res.setHeader('content-type','application/javascript; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    return res.end("console.error('Rentcam CMS advanced UI gagal dimuat');");
  }
}

module.exports=handler;
module.exports._source=SOURCE;
