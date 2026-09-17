const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@abf80b9027c53913083477eed694ba0ca8e97f82/bsm-cinemachine/index.html';
const {seoForRoute}=require('../seo-lib-20260917');

function txt(v){return Array.isArray(v)?String(v[0]||''):String(v||'')}
function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function safeJson(v){return JSON.stringify(v).replace(/</g,'\\u003c')}
function routeFromReq(req){return {kind:txt(req?.query?.kind)||'home',slug:txt(req?.query?.slug)}}
function patchPublicHtml(html,seo){
  let out=String(html||'');
  out=out.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(seo.title)}</title>`);
  if(/<meta\s+name=["']description["']/i.test(out))out=out.replace(/<meta\s+name=["']description["'][^>]*>/i,`<meta name="description" content="${esc(seo.description)}">`);
  else out=out.replace('</head>',`<meta name="description" content="${esc(seo.description)}"></head>`);
  const schema=(seo.schema||[]).map(x=>`<script type="application/ld+json">${safeJson({'@context':'https://schema.org',...x})}</script>`).join('');
  const meta=`
<link rel="canonical" href="${esc(seo.canonical)}">
<link rel="alternate" hreflang="id-ID" href="${esc(seo.canonical)}">
<link rel="alternate" hreflang="x-default" href="${esc(seo.canonical)}">
<meta name="robots" content="${esc(seo.robots)}">
<meta property="og:locale" content="id_ID">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Rentcam">
<meta property="og:title" content="${esc(seo.title)}">
<meta property="og:description" content="${esc(seo.description)}">
<meta property="og:url" content="${esc(seo.canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(seo.title)}">
<meta name="twitter:description" content="${esc(seo.description)}">
${schema}`;
  out=out.replace('</head>',meta+'</head>');
  const ssr=`<main id="app"><section data-seo-ssr="1" style="max-width:1180px;margin:0 auto;padding:28px 20px;font-family:Arial,sans-serif"><h1>${esc(seo.h1)}</h1><p>${esc(seo.summary)}</p></section></main>`;
  out=out.replace(/<main\s+id=["']app["']\s*><\/main>/i,ssr);
  out=out.replace(/src="\/product-search-20260912\.js(?:\?[^\"]*)?"/,'src="/product-search-20260912.js?v=geo4"');
  return out;
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const seo=seoForRoute(routeFromReq(req),'https://rentalcamera.aiorbitlab.me');
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('site source '+r.status);
    const html=patchPublicHtml(await r.text(),seo);
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('x-robots-tag',seo.robots);
    res.setHeader('link',`<${seo.canonical}>; rel="canonical"`);
    if(req.method==='HEAD')return res.end();
    return res.end(html);
  }catch(e){
    res.statusCode=502;res.setHeader('content-type','text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:24px">Website sedang dimuat ulang. Silakan refresh.</p>');
  }
}

module.exports=handler;
module.exports._patchPublicHtml=patchPublicHtml;
module.exports._routeFromReq=routeFromReq;
