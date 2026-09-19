const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@5d986794f449058b8ce61b81c00b09331719a0f9/bsm-cinemachine/index.html';
const {seoForRoute}=require('../seo-lib-20260917');
const {getCatalogProduct}=require('../catalog-public-20260917');

function txt(v){return Array.isArray(v)?String(v[0]||''):String(v||'')}
function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function safeJson(v){return JSON.stringify(v).replace(/</g,'\\u003c')}
function routeFromReq(req){return {kind:txt(req?.query?.kind)||'home',slug:txt(req?.query?.slug)}}
function breadcrumb(base,items){return {'@type':'BreadcrumbList',itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:base+x.path}))}}
function productSeo(p,base){
  const desc=p.description||`Sewa ${p.name} untuk kebutuhan produksi profesional di Jakarta.`;
  const product={'@type':'Product',name:p.name,description:desc,brand:{'@type':'Brand',name:p.brand||'Rentcam'},category:p.category||'Rental Equipment',url:base+'/produk/'+p.id};
  if(p.image)product.image=[p.image];
  if(p.price!=null)product.offers={'@type':'Offer',url:base+'/produk/'+p.id,priceCurrency:'IDR',price:String(p.price),availability:p.stock===0?'https://schema.org/OutOfStock':'https://schema.org/InStock',businessFunction:'http://purl.org/goodrelations/v1#LeaseOut'};
  return {title:`Sewa ${p.name} Jakarta | Rentcam`,description:desc,canonical:base+'/produk/'+p.id,robots:'index,follow,max-image-preview:large',h1:`Sewa ${p.name} Jakarta`,summary:`${desc}${p.price!=null?` Harga rental mulai Rp${new Intl.NumberFormat('id-ID').format(p.price)} per hari.`:''}`,schema:[product,breadcrumb(base,[{name:'Home',path:'/'},{name:'Rentals',path:'/produk'},{name:p.name,path:'/produk/'+p.id}])]};
}
function addRealHrefs(html){
  return String(html||'').replace(/<a([^>]*?)\sdata-go=(["'])([^"']+)\2([^>]*)>/gi,(m,before,q,path,after)=>{
    if(/\shref\s*=/i.test(before+after))return m;
    return `<a${before} href="${esc(path)}" data-go=${q}${path}${q}${after}>`;
  });
}
function patchPublicHtml(html,seo){
  let out=addRealHrefs(String(html||''));
  out=out.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(seo.title)}</title>`);
  if(/<meta\s+name=["']description["']/i.test(out))out=out.replace(/<meta\s+name=["']description["'][^>]*>/i,`<meta name="description" content="${esc(seo.description)}">`);
  else out=out.replace('</head>',`<meta name="description" content="${esc(seo.description)}"></head>`);
  const schema=(seo.schema||[]).map(x=>`<script type="application/ld+json">${safeJson({'@context':'https://schema.org',...x})}</script>`).join('');
  const meta=`\n<link rel="canonical" href="${esc(seo.canonical)}">\n<link rel="alternate" hreflang="id-ID" href="${esc(seo.canonical)}">\n<link rel="alternate" hreflang="x-default" href="${esc(seo.canonical)}">\n<meta name="robots" content="${esc(seo.robots)}">\n<meta property="og:locale" content="id_ID">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Rentcam">\n<meta property="og:title" content="${esc(seo.title)}">\n<meta property="og:description" content="${esc(seo.description)}">\n<meta property="og:url" content="${esc(seo.canonical)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(seo.title)}">\n<meta name="twitter:description" content="${esc(seo.description)}">\n${schema}`;
  out=out.replace('</head>',meta+'</head>');
  // Keep exactly one cart navigation handler. The source HTML also loads an older
  // cart hardening script; remove it here so touch/pointer/click events cannot race.
  out=out.replace(/<script\s+src=["']\/cart-click-fix-20260914\.js(?:\?[^"']*)?["']><\/script>/i,'');
  const cartHardening=`
<style id="rc-cart-direct-fix">
.rc-cart-button,[data-go="/cart"]{pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation}
.header .actions{position:relative!important;z-index:40!important}
.header .rc-cart-button{position:relative!important;z-index:41!important}
.rc-cart-button::before{content:"";position:absolute;inset:-10px;z-index:-1}
</style>`;
  const checkoutWizard='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@57a19710d8690fcfc3949e696d51771e3f03e11d/bsm-cinemachine/checkout-step-wizard-20260918.js"><\/script>';
  const includedDropdown='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@a1a4ff9dd2bbf75c41c76d06a91dee6beaf98087/bsm-cinemachine/product-included-dropdown-final-20260918.js"><\/script>';
  const productWatermark='<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@dedf6e149007aabed6338eeba6aac59fe545fec6/bsm-cinemachine/product-watermark-runtime-20260919.js"><\/script>';
  out=out.replace('</body>',cartHardening+checkoutWizard+includedDropdown+productWatermark+'</body>');
  const ssr=`<main id="app"><section data-seo-ssr="1" style="max-width:1180px;margin:0 auto;padding:28px 20px;font-family:Arial,sans-serif"><h1>${esc(seo.h1)}</h1><p>${esc(seo.summary)}</p></section></main>`;
  out=out.replace(/<main\s+id=["']app["']\s*><\/main>/i,ssr);
  out=out.replace(/src="\/product-search-20260912\.js(?:\?[^\"]*)?"/,'src="/product-search-20260912.js?v=geo4"');
  out=out.replace(/src="\/general-products-20260913\.js(?:\?[^\"]*)?"/,'src="/general-products-20260913.js?v=pcfix1"');
  out=out.replace(/src="\/cart-click-fix-20260914\.js(?:\?[^\"]*)?"/,'src="/cart-click-fix-20260914.js?v=pcfix1"');
  return out;
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const route=routeFromReq(req),base='https://rentalcamera.aiorbitlab.me';
  let seo=seoForRoute(route,base);
  if(route.kind==='product'&&route.slug){
    try{const live=await getCatalogProduct(route.slug);if(live)seo=productSeo(live,base)}catch(_){/* static SEO fallback */}
  }
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
module.exports._addRealHrefs=addRealHrefs;
