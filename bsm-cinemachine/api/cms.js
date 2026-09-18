const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@41bfa0f5f6ade8690c548512187993319cca85f2/bsm-cinemachine/cms-v14-20260918.html';

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('cms source '+r.status);
    const html=await r.text();
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    if(req.method==='HEAD')return res.end();
    return res.end(html);
  }catch(e){
    res.statusCode=502;res.setHeader('content-type','text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:24px">CMS sedang dimuat ulang. Silakan refresh.</p>');
  }
}
module.exports=handler;
