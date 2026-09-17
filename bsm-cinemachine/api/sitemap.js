const {sitemapXml}=require('../seo-lib-20260917');
module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method not allowed')}
  const xml=sitemapXml('https://rentalcamera.aiorbitlab.me');
  res.statusCode=200;
  res.setHeader('content-type','application/xml; charset=utf-8');
  res.setHeader('cache-control','public, s-maxage=3600, stale-while-revalidate=86400');
  if(req.method==='HEAD')return res.end();
  res.end(xml);
};