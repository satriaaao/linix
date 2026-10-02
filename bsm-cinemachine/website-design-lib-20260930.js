/* Shared values and validation for the website appearance editor and storefront. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;if(root)root.RentcamWebsiteDesign=lib;})(typeof window==='undefined'?null:window,function(){
  const slides=[
    {eyebrow:'MOTION PICTURE EQUIPMENT RENTALS',title:'Cinema gear for serious productions.',text:'ARRI, Sony VENICE, RED, cinema lenses, lighting, grip, monitoring dan wireless video.',image:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=90',primary:'Lihat Rental',primaryPath:'/produk',secondary:'Lihat Portfolio',secondaryPath:'/portfolio'},
    {eyebrow:'ARRI CAMERA SYSTEMS',title:'Build a cinema package that is ready for set.',text:'ALEXA 35, ALEXA Mini LF, cinema lenses, wireless video dan monitoring dalam satu workflow.',image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=90',primary:'Rental Kamera',primaryPath:'/produk?cat=Camera',secondary:'Produk Promo',secondaryPath:'/produk?label=PROMO%2CNEW%2CDISKON'},
    {eyebrow:'CINEMA LIGHTING',title:'Lighting packages built for film sets.',text:'Lighting profesional untuk studio, commercial, film, series dan exterior production.',image:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=90',primary:'Lihat Lighting',primaryPath:'/produk?cat=Lighting',secondary:'Semua Produk',secondaryPath:'/produk'}
  ];
  const catalogSlides=[
    {id:'rental-promo',ey:'RENTAL PROMO',title:'Sewa 3 Hari, Bayar 2 Hari',text:'Paket cinema equipment pilihan untuk produksi lebih efisien.',cta:'Lihat Equipment',href:'/produk',image:slides[1].image,active:true},
    {id:'delivery-support',ey:'DELIVERY SUPPORT',title:'Free Delivery DKI Jakarta',text:'Nikmati layanan antar equipment untuk transaksi rental yang memenuhi ketentuan.',cta:'Cari Produk',href:'/produk',image:slides[0].image,active:true},
    {id:'special-project',ey:'SPECIAL PROJECT',title:'Promo Hingga 50%',text:'Khusus tugas akhir, film festival, dan project produksi terpilih.',cta:'Lihat Katalog',href:'/produk',image:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=90',active:true}
  ];
  function getCatalogSlides(config={}){const source=Array.isArray(config.banners)&&config.banners.length?config.banners:catalogSlides;return source.filter(b=>b.active!==false&&b.deleted!==true).map((b,i)=>({...b,ey:String(b.ey||b.kicker||'RENTCAM'),title:String(b.title||b.t||''),text:String(b.text||b.p||''),cta:String(b.cta||'Lihat Katalog'),href:link(b.href||b.buttonLink,'/produk'),image:image(b.image||b.img)||catalogSlides[i%catalogSlides.length].image}));}
  const theme={accent:'#111111',background:'#ffffff',text:'#111111',cardRadius:16,buttonRadius:12,headerSticky:true,font:'system',contentWidth:1200};
  const fonts={system:'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',sans:'Arial,Helvetica,sans-serif',serif:'Georgia,"Times New Roman",serif'};
  const color=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||''))?value:fallback;
  const number=(value,min,max,fallback)=>Number.isFinite(Number(value))&&value!==''&&value!=null?Math.min(max,Math.max(min,Number(value))):fallback;
  function link(value,fallback='/produk'){const v=String(value||'').trim();if(/^\/(?!\/)/.test(v))return v;try{const u=new URL(v);if(u.protocol==='https:')return u.href;}catch(_){}return fallback;}
  function image(value){try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:'';}catch(_){return '';}}
  function getTheme(config={}){const t=config.theme||{};return {accent:color(t.accent,theme.accent),background:color(t.background,theme.background),text:color(t.text,theme.text),cardRadius:number(t.cardRadius,0,32,16),buttonRadius:number(t.buttonRadius,0,24,12),headerSticky:t.headerSticky!==false,font:fonts[t.font]?t.font:'system',contentWidth:number(t.contentWidth,960,1440,1200)};}
  function getSlides(config={}){return slides.map((s,i)=>{const v=config.appearance?.heroSlides?.[i]||{};return {...s,...Object.fromEntries(['eyebrow','title','text','primary','secondary'].map(k=>[k,String(v[k]??s[k])])),image:image(v.image)||s.image,primaryPath:link(v.primaryPath,s.primaryPath),secondaryPath:link(v.secondaryPath,s.secondaryPath)};});}
  return {slides,catalogSlides,getCatalogSlides,theme,fonts,color,number,link,image,getTheme,getSlides};
});
