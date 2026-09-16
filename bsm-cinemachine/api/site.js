const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@abf80b9027c53913083477eed694ba0ca8e97f82/bsm-cinemachine/index.html';

function patchPublicHtml(html){
  return String(html||'').replace(/src="\/product-search-20260912\.js(?:\?[^\"]*)?"/,'src="/product-search-20260912.js?v=geo4"');
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('site source '+r.status);
    const html=patchPublicHtml(await r.text());
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    if(req.method==='HEAD')return res.end();
    return res.end(html);
  }catch(e){
    res.statusCode=502;res.setHeader('content-type','text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:24px">Website sedang dimuat ulang. Silakan refresh.</p>');
  }
}

module.exports=handler;
module.exports._patchPublicHtml=patchPublicHtml;
