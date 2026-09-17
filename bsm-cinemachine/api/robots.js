module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;return res.end('Method not allowed')}
  const body=`User-agent: *\nAllow: /\nDisallow: /cms\nDisallow: /cart\nDisallow: /pesanan\n\nSitemap: https://rentalcamera.aiorbitlab.me/sitemap.xml\n`;
  res.statusCode=200;
  res.setHeader('content-type','text/plain; charset=utf-8');
  res.setHeader('cache-control','public, s-maxage=3600, stale-while-revalidate=86400');
  if(req.method==='HEAD')return res.end();
  res.end(body);
};