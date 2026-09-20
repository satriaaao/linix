const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@a1d819043facf60ad3c6e025340b990a6642168a/bsm-cinemachine/cms-v15-20260918.html';
const PWA=require('../cms-pwa-assets');

function sanitizeCmsHtml(html){
  return String(html||'')
    .replace(/<link\b[^>]*href=["'][^"']*cart-mobile-layout-fix-20260919\.css[^"']*["'][^>]*>/gi,'')
    .replace(/<link\b[^>]*href=["'][^"']*cart[^"']*\.css[^"']*["'][^>]*data-public-only[^>]*>/gi,'');
}

function injectCmsPwa(html){
  let out=String(html||'');
  const head=[
    '<link rel="manifest" href="/api/cms?asset=manifest">',
    '<meta name="theme-color" content="#111318">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="Rentcam CMS">',
    '<link rel="icon" href="/api/cms?asset=icon" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/api/cms?asset=icon">'
  ].join('');
  if(!out.includes('/api/cms?asset=manifest')){
    out=out.includes('</head>')?out.replace('</head>',head+'</head>'):head+out;
  }
  if(!out.includes('/api/cms?asset=pwa')){
    const script='<script src="/api/cms?asset=pwa" defer></script>';
    out=out.includes('</body>')?out.replace('</body>',script+'</body>'):out+script;
  }
  return out;
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }

  const asset=Array.isArray(req.query?.asset)?req.query.asset[0]:req.query?.asset;
  if(asset&&PWA[asset])return PWA[asset](req,res);

  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('cms source '+r.status);
    const html=injectCmsPwa(sanitizeCmsHtml(await r.text()));
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
module.exports._injectCmsPwa=injectCmsPwa;
module.exports._source=SOURCE;
