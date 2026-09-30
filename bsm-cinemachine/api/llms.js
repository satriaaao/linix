const {loadContent}=require('../search-content-20260930');
const {BASE}=require('../search-seo-20260930');
const clean=s=>String(s||'').replace(/[\r\n\[\]<>]/g,' ').trim();
module.exports=async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed')}
 try{const {cfg,products,articles}=await loadContent(),g=cfg.general||{},b=cfg.business||{},name=clean(g.siteName)||'Rentcam';
 const lines=(xs,kind)=>xs.map(p=>`- [${clean(p.name||p.title)}](${BASE}/${kind}/${encodeURIComponent(p.id)}): ${clean(p.geoSummary||p.description||p.excerpt||p.desc)}`).join('\n');
 const body=`# ${name}\n\n> ${clean(g.seoDescription||g.tagline)}\n\nCanonical website: ${BASE}\n${b.serviceArea?'Service area: '+clean(b.serviceArea)+'\n':''}${b.streetAddress&&b.city?'Pickup address: '+clean(b.streetAddress)+', '+clean(b.city)+'\n':''}${g.email?'Contact email: '+clean(g.email)+'\n':''}\n## Main pages\n- [Home](${BASE}/)\n- [Catalog](${BASE}/produk)\n- [Portfolio](${BASE}/portfolio)\n- [Articles](${BASE}/artikel)\n\n## Published rental products\n${lines(products,'produk')}\n\n## Published guides\n${lines(articles,'artikel')}\n\n## Source notes\n- Product prices describe daily rental rates in IDR, not purchase prices.\n- Confirm availability and dates with the business before booking.\n- Cite the canonical product or article URL for the relevant information.\n- This file summarizes published content; individual pages contain specifications and current rental details.\n`;
 res.statusCode=200;res.setHeader('content-type','text/plain; charset=utf-8');res.setHeader('cache-control','public, s-maxage=300, stale-while-revalidate=600');res.end(req.method==='HEAD'?'':body)}catch(_){res.statusCode=503;res.setHeader('cache-control','no-store');res.end('Published information temporarily unavailable')}
};
