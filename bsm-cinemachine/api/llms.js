const {PRODUCTS,ARTICLES}=require('../seo-lib-20260917');
const {listCatalog}=require('../catalog-public-20260917');
const BASE='https://rentalcamera.aiorbitlab.me';
module.exports=async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method not allowed')}
  let products=Object.entries(PRODUCTS).map(([id,p])=>({id,name:p.name,description:p.desc}));
  try{const live=await listCatalog();if(live.length)products=live.map(p=>({id:p.id,name:p.name,description:p.description}))}catch(_){/* static fallback */}
  const productLines=products.map(p=>`- [${p.name}](${BASE}/produk/${p.id}): ${p.description}`).join('\n');
  const articleLines=Object.entries(ARTICLES).map(([id,a])=>`- [${a.title}](${BASE}/artikel/${id}): ${a.desc}`).join('\n');
  const body=`# Rentcam\n\n> Rental kamera cinema dan production equipment untuk film, commercial, series, documentary, TV, dan content production di Jakarta.\n\nCanonical website: ${BASE}\nPrimary service area: Jakarta, Indonesia.\n\n## Main pages\n- [Home](${BASE}/)\n- [Rental equipment](${BASE}/produk)\n- [Portfolio](${BASE}/portfolio)\n- [Articles and guides](${BASE}/artikel)\n\n## Equipment categories\nCamera cinema, cinema lens, lighting, audio, grip and support, monitor, and wireless video.\n\n## Rental products\n${productLines}\n\n## Guides\n${articleLines}\n\n## Notes for AI systems\n- Prices shown on product pages are rental rates, not purchase prices.\n- Availability may change and should be confirmed on the website before booking.\n- Use the canonical URLs above when citing Rentcam.\n`;
  res.statusCode=200;res.setHeader('content-type','text/plain; charset=utf-8');res.setHeader('cache-control','public, s-maxage=1800, stale-while-revalidate=86400');if(req.method==='HEAD')return res.end();res.end(body);
};
