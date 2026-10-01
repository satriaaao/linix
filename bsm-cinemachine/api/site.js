const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@5d986794f449058b8ce61b81c00b09331719a0f9/bsm-cinemachine/index.html';
const {seoForRoute}=require('../seo-lib-20260917');
const {loadContent}=require('../search-content-20260930');
const {buildSeo}=require('../search-seo-20260930');

function txt(v){return Array.isArray(v)?String(v[0]||''):String(v||'')}
function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function safeJson(v){return JSON.stringify(v).replace(/</g,'\\u003c')}
function routeFromReq(req){return {kind:txt(req?.query?.kind)||'home',slug:txt(req?.query?.slug)}}
function breadcrumb(base,items){return {'@type':'BreadcrumbList',itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:base+x.path}))}}
function addRealHrefs(html){
  return String(html||'').replace(/<a([^>]*?)\sdata-go=(["'])([^"']+)\2([^>]*)>/gi,(m,before,q,path,after)=>{
    if(/\shref\s*=/i.test(before+after))return m;
    return `<a${before} href="${esc(path)}" data-go=${q}${path}${q}${after}>`;
  });
}
function patchPublicHtml(html,seo){
  let out=addRealHrefs(String(html||''));
  out=out.replace(/<script[^>]+src=["'][^"']*product-watermark-runtime[^"']*["'][^>]*><\/script>/gi,'');
  out=out.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(seo.title)}</title>`);
  if(/<meta\s+name=["']description["']/i.test(out))out=out.replace(/<meta\s+name=["']description["'][^>]*>/i,`<meta name="description" content="${esc(seo.description)}">`);
  else out=out.replace('</head>',`<meta name="description" content="${esc(seo.description)}"></head>`);
  const schema=(seo.schema||[]).map(x=>`<script type="application/ld+json" data-search-schema="1">${safeJson({'@context':'https://schema.org',...x})}</script>`).join('');
  const meta=`${seo.verification?`<meta name="google-site-verification" content="${esc(seo.verification)}">`:""}${seo.image?`<meta property="og:image" content="${esc(seo.image)}"><meta name="twitter:image" content="${esc(seo.image)}">`:""}\n<link rel="canonical" href="${esc(seo.canonical)}">\n<link rel="alternate" hreflang="id-ID" href="${esc(seo.canonical)}">\n<link rel="alternate" hreflang="x-default" href="${esc(seo.canonical)}">\n<meta name="robots" content="${esc(seo.robots)}">\n<meta property="og:locale" content="id_ID">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="${esc(seo.name||'Rentcam')}">\n<meta property="og:title" content="${esc(seo.title)}">\n<meta property="og:description" content="${esc(seo.description)}">\n<meta property="og:url" content="${esc(seo.canonical)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(seo.title)}">\n<meta name="twitter:description" content="${esc(seo.description)}">\n${schema}`;
  const responsiveCss='<link rel="stylesheet" href="/public-responsive-20260930.css">';
  out=out.replace('</head>',meta+(out.includes('/public-responsive-20260930.css')?'':responsiveCss)+'</head>');
  out=out.replace(/<script\s+src=["']\/cart-click-fix-20260914\.js(?:\?[^"']*)?["']><\/script>/i,'');
  const cartHardening=`
<style id="rc-cart-direct-fix">
.rc-cart-button,[data-go="/cart"]{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation}
.header .actions{position:relative!important;z-index:40!important}
.header .rc-cart-button{position:relative!important;z-index:41!important}
.rc-cart-button::before{content:"";position:absolute;inset:-10px;z-index:-1}
</style>`;
  const checkoutWizard='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@263d9fcab914f0e9a3c89d8a8083a368701ca54e/bsm-cinemachine/checkout-step-wizard-20260918.js"><\/script>';
  const includedDropdown='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@a1a4ff9dd2bbf75c41c76d06a91dee6beaf98087/bsm-cinemachine/product-included-dropdown-final-20260918.js"><\/script>';
  const brandLogoPng='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@900a441a0120153f643ef391be1f0e9524d89c60/bsm-cinemachine/brand-logo-png-runtime-20260920.js"><\/script>';
  const orderTracking='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@aa45776f8f55dfd8838bcb5d87adae1a0980698f/bsm-cinemachine/public-order-tracking-20260920.js"><\/script>';
  const homeHero='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@c4cad3787118ab3698ca3bbaaeaa34f81e850062/bsm-cinemachine/home-hero-carousel-20260922.js"><\/script>';
  const catalogGrid='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@2c7cd0759b2a92d31e41dcff1e1c44a543988829/bsm-cinemachine/catalog-grid-polish-20260922.js"><\/script>';
  const brandEquipment='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@7b2464804c61340cfeaec24199dea256b07360a6/bsm-cinemachine/home-brand-equipment-20260922.js"><\/script>';
  const branchAvailability='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@f729e7c9514f7b7cb9f34002269b93ff9812dd67/bsm-cinemachine/product-branch-availability-20260922.js"><\/script>';
  const websiteDesign=out.includes('/website-design-runtime-20260930.js')?'':'<script src="/website-design-lib-20260930.js"><\/script><script src="/website-design-runtime-20260930.js"><\/script>';
  const browserHardening='<script src="/browser-hardening-20260922.js" defer><\/script>';
  for(const module of ['cms-public-runtime-v8-20260912.js','product-advanced-runtime-v8-20260912.js','cms-content-render-20260912.js'])out=out.replace(new RegExp('https://cdn\\.jsdelivr\\.net/gh/satriaaao/linix@[^\"]+/bsm-cinemachine/'+module.replace(/\./g,'\\.'),'g'),'/'+module);
  out=out.replace(/<script src="\/cms-public-runtime-v8-20260912\.js"><\/script>/,'<script src="/analytics-tracker-20261001.js?v=1"></script><script src="/cms-public-runtime-v8-20260912.js?v=analytics2"></script>');
  out=out.replace('</body>',(out.includes('/seo-runtime-20260930.js')?'':'<script src="/seo-runtime-20260930.js" defer></script>')+cartHardening+checkoutWizard+includedDropdown+brandLogoPng+orderTracking+homeHero+catalogGrid+brandEquipment+branchAvailability+browserHardening+websiteDesign+'<link rel="stylesheet" href="/premium-storefront-20261001.css?v=theme3"><script src="/premium-storefront-20261001.js?v=theme3"></script></body>');
  const ssr=`<main id="app"><section data-seo-ssr="1" style="max-width:1180px;margin:0 auto;padding:28px 20px;font-family:Arial,sans-serif"><h1>${esc(seo.h1)}</h1><p>${esc(seo.summary)}</p>${seo.body||''}</section></main>`;
  out=out.replace(/<main\s+id=["']app["']\s*><\/main>/i,ssr);
  out=out.replace(/src="\/product-search-20260912\.js(?:\?[^\"]*)?"/,'src="/product-search-20260912.js?v=cleanup1"');
  out=out.replace(/src="\/general-products-20260913\.js(?:\?[^\"]*)?"/,'src="/general-products-20260913.js?v=cleanup1"');
  // Promo tab: hard navigation to promo/new list, including on mobile Safari.
  out=out.replace(/src=["']\/public-template-popup-20260913\.js(?:\?[^"']*)?["']/i,'src="https://cdn.jsdelivr.net/gh/satriaaao/linix@43cd238cb9eaafd8f4d0f9a330ff5e4c7a1b4811/bsm-cinemachine/public-template-popup-20260913.js"');
  out=out.replace(/src="\/cart-click-fix-20260914\.js(?:\?[^\"]*)?"/,'src="/cart-click-fix-20260914.js?v=pcfix1"');
  return out;
}

async function handler(req,res){
  if(req.query?.kind==='seo')return require('../search-endpoint-20260930')(req,res);
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const route=routeFromReq(req),base='https://rentalcamera.aiorbitlab.me';
  let seo;
  try{seo=buildSeo(route,await loadContent())}catch(_){seo={...seoForRoute(route,base),robots:'noindex,follow',schema:[],status:503}}
  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('site source '+r.status);
    const html=patchPublicHtml(await r.text(),seo);
    res.statusCode=seo.status||200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('x-content-type-options','nosniff');
    res.setHeader('x-frame-options','SAMEORIGIN');
    res.setHeader('referrer-policy','strict-origin-when-cross-origin');
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
module.exports._addRealHrefs=addRealHrefs;
