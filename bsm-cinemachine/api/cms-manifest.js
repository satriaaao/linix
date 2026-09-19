module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }
  const body={
    id:'/cms',
    name:'Rentcam CMS',
    short_name:'Rentcam CMS',
    description:'CMS operasional Rentcam untuk order, produk, customer dan laporan.',
    start_url:'/cms',
    scope:'/cms',
    display:'standalone',
    background_color:'#f5f6f8',
    theme_color:'#111318',
    orientation:'any',
    categories:['business','productivity'],
    icons:[
      {src:'/api/cms-icon',sizes:'any',type:'image/svg+xml',purpose:'any'},
      {src:'/api/cms-icon',sizes:'any',type:'image/svg+xml',purpose:'maskable'}
    ]
  };
  res.statusCode=200;
  res.setHeader('content-type','application/manifest+json; charset=utf-8');
  res.setHeader('cache-control','public, max-age=300');
  if(req.method==='HEAD')return res.end();
  return res.end(JSON.stringify(body));
};