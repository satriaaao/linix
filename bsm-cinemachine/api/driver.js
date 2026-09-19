const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@f0134e32e39bc9c64d843952f258bb2b0ddabfd7/bsm-cinemachine/driver-portal-20260918.html';

module.exports=async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;
    res.setHeader('content-type','text/plain; charset=utf-8');
    return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('driver source '+r.status);
    const html=await r.text();
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('x-robots-tag','noindex, nofollow');
    if(req.method==='HEAD')return res.end();
    return res.end(html);
  }catch(_){
    res.statusCode=502;
    res.setHeader('content-type','text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font-family:system-ui;padding:24px">Portal driver sedang dimuat ulang. Silakan refresh.</p>');
  }
};