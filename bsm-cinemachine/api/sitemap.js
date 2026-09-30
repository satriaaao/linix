const {loadContent}=require('../search-content-20260930');
const {BASE,esc}=require('../search-seo-20260930');
async function urls(){const data=await loadContent();return ['/', '/produk','/portfolio','/artikel',...data.products.map(p=>'/produk/'+encodeURIComponent(p.id)),...data.articles.map(p=>'/artikel/'+encodeURIComponent(p.id)),...data.portfolio.map(p=>'/portfolio/'+encodeURIComponent(p.id))]}
module.exports=async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed')}
 try{const list=await urls();const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(list)].map(path=>'<url><loc>'+esc(BASE+path)+'</loc></url>').join('\n')+'</urlset>';res.statusCode=200;res.setHeader('content-type','application/xml; charset=utf-8');res.setHeader('cache-control','public, s-maxage=300, stale-while-revalidate=600');res.end(req.method==='HEAD'?'':xml)}catch(_){res.statusCode=503;res.setHeader('cache-control','no-store');res.end('Sitemap temporarily unavailable')}
};module.exports._urls=urls;
