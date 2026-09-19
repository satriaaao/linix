const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@689450a1d481863327a009b2f980773a2519fe7a/bsm-cinemachine/cms-v15-20260918.html';

function sanitizeCmsHtml(html){
  return String(html||'')
    .replace(/<link\b[^>]*href=["'][^"']*cart-mobile-layout-fix-20260919\.css[^"']*["'][^>]*>/gi,'')
    .replace(/<link\b[^>]*href=["'][^"']*cart[^"']*\.css[^"']*["'][^>]*data-public-only[^>]*>/gi,'');
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('cms source '+r.status);
    const html=sanitizeCmsHtml(await r.text());
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
module.exports._sanitizeCmsHtml=sanitizeCmsHtml;
module.exports._source=SOURCE;
