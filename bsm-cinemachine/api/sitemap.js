const {PRODUCTS,ARTICLES,PORTFOLIO}=require('../seo-lib-20260917');
const {listCatalog}=require('../catalog-public-20260917');
const BASE='https://rentalcamera.aiorbitlab.me';
function xmlEsc(s){return String(s).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]))}
async function urls(){
  let ids=Object.keys(PRODUCTS);
  try{const live=await listCatalog();ids=[...new Set([...ids,...live.map(p=>p.id)])]}catch(_){/* static fallback */}
  return ['/', '/produk',...ids.map(id=>'/produk/'+id),'/portfolio',...Object.keys(PORTFOLIO).map(id=>'/portfolio/'+id),'/artikel',...Object.keys(ARTICLES).map(id=>'/artikel/'+id)];
}
module.exports=async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method not allowed')}
  const list=await urls(),today=new Date().toISOString().slice(0,10);
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map(u=>`  <url><loc>${xmlEsc(BASE+u)}</loc><lastmod>${today}</lastmod><changefreq>${u==='/'?'daily':u.startsWith('/produk/')?'weekly':'monthly'}</changefreq><priority>${u==='/'?'1.0':u==='/produk'?'0.9':u.startsWith('/produk/')?'0.8':'0.6'}</priority></url>`).join('\n')}\n</urlset>`;
  res.statusCode=200;res.setHeader('content-type','application/xml; charset=utf-8');res.setHeader('cache-control','public, s-maxage=1800, stale-while-revalidate=86400');if(req.method==='HEAD')return res.end();res.end(xml);
};
module.exports._urls=urls;
