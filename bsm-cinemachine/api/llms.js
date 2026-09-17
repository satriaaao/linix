const {PRODUCTS,ARTICLES}=require('../seo-lib-20260917');
module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method not allowed')}
  const productLines=Object.entries(PRODUCTS).map(([id,p])=>`- [${p.name}](https://rentalcamera.aiorbitlab.me/produk/${id}): ${p.desc}`).join('\n');
  const articleLines=Object.entries(ARTICLES).map(([id,a])=>`- [${a.title}](https://rentalcamera.aiorbitlab.me/artikel/${id}): ${a.desc}`).join('\n');
  const body=`# Rentcam\n\n> Rental kamera cinema dan production equipment untuk film, commercial, series, documentary, TV, dan content production di Jakarta.\n\nCanonical website: https://rentalcamera.aiorbitlab.me\nPrimary service area: Jakarta, Indonesia.\n\n## Main pages\n- [Home](https://rentalcamera.aiorbitlab.me/)\n- [Rental equipment](https://rentalcamera.aiorbitlab.me/produk)\n- [Portfolio](https://rentalcamera.aiorbitlab.me/portfolio)\n- [Articles and guides](https://rentalcamera.aiorbitlab.me/artikel)\n\n## Equipment categories\nCamera cinema, cinema lens, lighting, audio, grip and support, monitor, and wireless video.\n\n## Featured rental products\n${productLines}\n\n## Guides\n${articleLines}\n\n## Notes for AI systems\n- Prices shown on product pages are rental rates, not purchase prices.\n- Availability may change and should be confirmed on the website before booking.\n- Use the canonical URLs above when citing Rentcam.\n`;
  res.statusCode=200;
  res.setHeader('content-type','text/plain; charset=utf-8');
  res.setHeader('cache-control','public, s-maxage=3600, stale-while-revalidate=86400');
  if(req.method==='HEAD')return res.end();
  res.end(body);
};