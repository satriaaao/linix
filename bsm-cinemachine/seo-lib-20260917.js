const PRODUCTS={
'arri-alexa-35':{name:'ARRI ALEXA 35',brand:'ARRI',category:'Camera',price:6500000,stock:2,desc:'Sewa ARRI ALEXA 35 untuk produksi film, commercial, series, dan video profesional di Jakarta.'},
'arri-alexa-mini-lf':{name:'ARRI ALEXA Mini LF',brand:'ARRI',category:'Camera',price:5000000,stock:2,desc:'Sewa ARRI ALEXA Mini LF large format untuk produksi film dan commercial di Jakarta.'},
'sony-venice-2':{name:'Sony VENICE 2 8K',brand:'Sony',category:'Camera',price:4500000,stock:2,desc:'Sewa Sony VENICE 2 8K full-frame untuk film, iklan, dan produksi sinema profesional di Jakarta.'},
'red-v-raptor-x':{name:'RED V-RAPTOR [X] 8K VV',brand:'RED',category:'Camera',price:3500000,stock:2,desc:'Sewa RED V-RAPTOR X 8K VV untuk produksi film, music video, dan commercial di Jakarta.'},
'cooke-s8-set':{name:'Cooke S8/i Full Frame Prime Set',brand:'Cooke',category:'Lens',price:3500000,stock:1,desc:'Sewa Cooke S8/i full-frame prime lens set untuk produksi film dan commercial.'},
'arri-signature-prime':{name:'ARRI Signature Prime Set',brand:'ARRI',category:'Lens',price:3200000,stock:1,desc:'Sewa ARRI Signature Prime large-format lens set untuk produksi sinema profesional.'},
'atlas-mercury':{name:'Atlas Mercury 1.5x Anamorphic Set',brand:'Atlas',category:'Lens',price:2800000,stock:1,desc:'Sewa Atlas Mercury 1.5x anamorphic lens set untuk tampilan sinematik full-frame.'},
'arri-skypanel-x21':{name:'ARRI SkyPanel X21',brand:'ARRI',category:'Lighting',price:1800000,stock:3,desc:'Sewa ARRI SkyPanel X21 full-spectrum LED untuk produksi film dan studio.'},
'arri-orbiter':{name:'ARRI Orbiter',brand:'ARRI',category:'Lighting',price:1200000,stock:4,desc:'Sewa ARRI Orbiter LED profesional untuk kebutuhan lighting film dan commercial.'},
'aputure-xt26':{name:'Aputure Electro Storm XT26',brand:'Aputure',category:'Lighting',price:1500000,stock:3,desc:'Sewa Aputure Electro Storm XT26 high-output LED untuk produksi film dan outdoor.'},
'teradek-bolt6':{name:'Teradek Bolt 6 XT',brand:'Teradek',category:'Wireless',price:900000,stock:3,desc:'Sewa Teradek Bolt 6 XT wireless video system untuk director dan focus monitor.'},
'smallhd-ultra7':{name:'SmallHD Ultra 7',brand:'SmallHD',category:'Wireless',price:550000,stock:4,desc:'Sewa SmallHD Ultra 7 high-bright monitor untuk kamera dan focus pulling.'},
'oconnor-2575':{name:"O'Connor 2575C Ultimate Head",brand:"O'Connor",category:'Grip',price:650000,stock:2,desc:"Sewa O'Connor 2575C cinema fluid head untuk setup kamera profesional."},
'easyrig-vario5':{name:'Easyrig Vario 5 + Serene',brand:'Easyrig',category:'Grip',price:450000,stock:4,desc:'Sewa Easyrig Vario 5 + Serene untuk handheld cinema camera setup.'},
'sound-devices-888':{name:'Sound Devices 888',brand:'Sound Devices',category:'Audio',price:1200000,stock:2,desc:'Sewa Sound Devices 888 production sound recorder profesional.'},
'sennheiser-mkh416':{name:'Sennheiser MKH 416',brand:'Sennheiser',category:'Audio',price:200000,stock:5,desc:'Sewa Sennheiser MKH 416 shotgun microphone untuk produksi film dan video profesional.'}
};
const ARTICLES={
'alexa-venice':{title:'ARRI ALEXA 35 vs Sony VENICE 2: Pilih Mana?',date:'2026-09-11',desc:'Perbandingan ARRI ALEXA 35 dan Sony VENICE 2 untuk film, commercial, workflow, sensor, latitude, dan kebutuhan produksi.'},
'lens-guide':{title:'Cara Memilih Cinema Lens untuk Film & Commercial',date:'2026-09-08',desc:'Panduan memilih Cooke, ARRI Signature Prime, ZEISS, atau lensa anamorphic untuk produksi film dan commercial.'},
'lighting-guide':{title:'Setup Cinema Lighting untuk Set Besar',date:'2026-09-05',desc:'Panduan SkyPanel, Orbiter, Electro Storm, dan sistem kontrol untuk lighting produksi profesional.'}
};
const PORTFOLIO={
drama:{title:'Drama Series — Night Exterior',desc:'Produksi drama dengan ARRI ALEXA 35, Cooke S8/i, cinema lighting, dan wireless monitoring.'},
auto:{title:'Automotive Commercial',desc:'Commercial automotive dengan Sony VENICE 2 dan ARRI Signature Prime.'},
music:{title:'Music Video — Stage Production',desc:'Music video dengan RED V-RAPTOR X, Atlas Mercury, high-output LED, dan wireless video.'},
doc:{title:'Documentary Field Unit',desc:'Documentary field setup dengan kamera cinema compact dan zoom lens.'}
};
function humanize(slug=''){return decodeURIComponent(String(slug)).replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function breadcrumb(base,items){return {'@type':'BreadcrumbList',itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:base+x.path}))}}
function seoForRoute(route={},base='https://rentalcamera.aiorbitlab.me'){
const kind=route.kind||'home',slug=route.slug||'';
const org={'@type':'Organization',name:'Rentcam',url:base,areaServed:{'@type':'City',name:'Jakarta'},description:'Rental kamera cinema, lensa, lighting, audio, grip, monitor, dan wireless video untuk produksi profesional.'};
let out={title:'Rental Kamera Jakarta | Kamera Cinema, Lensa & Lighting | Rentcam',description:'Rental kamera cinema Jakarta untuk produksi film, commercial, series, documentary, TV dan content. Sewa ARRI, Sony VENICE, RED, cinema lens, lighting, grip, monitor dan wireless video.',canonical:base+'/',robots:'index,follow,max-image-preview:large',schema:[{'@type':'WebSite',name:'Rentcam',url:base},org],h1:'Rental Kamera Cinema Jakarta',summary:'Sewa kamera cinema, lensa, lighting, audio, grip, monitor, dan wireless video untuk kebutuhan produksi profesional di Jakarta.'};
if(kind==='products')out={...out,title:'Sewa Kamera & Equipment Film Jakarta | Rentcam',description:'Sewa kamera cinema, lensa, lighting, audio, grip, monitor dan wireless video di Jakarta. Pilihan ARRI, Sony, RED, Cooke, Aputure, Teradek dan lainnya.',canonical:base+'/produk',h1:'Sewa Kamera & Equipment Film Jakarta',summary:'Katalog rental equipment film dan produksi profesional di Jakarta.',schema:[{'@type':'CollectionPage',name:'Rental Equipment Film Jakarta',url:base+'/produk'},{'@type':'ItemList',itemListElement:Object.keys(PRODUCTS).map((id,i)=>({'@type':'ListItem',position:i+1,url:base+'/produk/'+id,name:PRODUCTS[id].name}))}]};
if(kind==='product'){
const p=PRODUCTS[slug]||{name:humanize(slug),brand:'Rentcam',category:'Rental Equipment',price:null,stock:1,desc:`Sewa ${humanize(slug)} untuk kebutuhan produksi profesional di Jakarta.`};
const product={'@type':'Product',name:p.name,description:p.desc,brand:{'@type':'Brand',name:p.brand},category:p.category,url:base+'/produk/'+slug};
if(p.price!=null)product.offers={'@type':'Offer',url:base+'/produk/'+slug,priceCurrency:'IDR',price:String(p.price),availability:p.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',businessFunction:'http://purl.org/goodrelations/v1#LeaseOut'};
out={...out,title:`Sewa ${p.name} Jakarta | Rentcam`,description:p.desc,canonical:base+'/produk/'+slug,h1:`Sewa ${p.name} Jakarta`,summary:`${p.desc}${p.price!=null?` Harga rental mulai Rp${new Intl.NumberFormat('id-ID').format(p.price)} per hari.`:''}`,schema:[product,breadcrumb(base,[{name:'Home',path:'/'},{name:'Rentals',path:'/produk'},{name:p.name,path:'/produk/'+slug}])]};
}
if(kind==='articles')out={...out,title:'Panduan Kamera Film, Lensa & Lighting | Rentcam',description:'Artikel dan panduan rental kamera cinema, lensa, lighting, workflow film, commercial, dan produksi profesional.',canonical:base+'/artikel',h1:'Panduan Produksi & Rental Equipment',summary:'Panduan praktis memilih kamera, lensa, lighting, dan workflow untuk produksi film dan commercial.',schema:[{'@type':'CollectionPage',name:'Artikel Rentcam',url:base+'/artikel'}]};
if(kind==='article'){
const a=ARTICLES[slug]||{title:humanize(slug),date:'2026-09-17',desc:`Panduan ${humanize(slug)} untuk produksi film dan video profesional.`};
out={...out,title:`${a.title} | Rentcam`,description:a.desc,canonical:base+'/artikel/'+slug,h1:a.title,summary:a.desc,schema:[{'@type':'Article',headline:a.title,datePublished:a.date,dateModified:a.date,description:a.desc,mainEntityOfPage:base+'/artikel/'+slug,publisher:{'@type':'Organization',name:'Rentcam'}},breadcrumb(base,[{name:'Home',path:'/'},{name:'Artikel',path:'/artikel'},{name:a.title,path:'/artikel/'+slug}])]};
}
if(kind==='portfolio')out={...out,title:'Portfolio Produksi Film & Commercial | Rentcam',description:'Contoh workflow dan equipment rental untuk film, commercial, music video, series, dan documentary.',canonical:base+'/portfolio',h1:'Portfolio Produksi',summary:'Contoh paket kamera, lensa, lighting, dan wireless untuk berbagai jenis produksi.',schema:[{'@type':'CollectionPage',name:'Portfolio Rentcam',url:base+'/portfolio'}]};
if(kind==='portfolioItem'){
const p=PORTFOLIO[slug]||{title:humanize(slug),desc:'Contoh produksi dan workflow equipment Rentcam.'};
out={...out,title:`${p.title} | Portfolio Rentcam`,description:p.desc,canonical:base+'/portfolio/'+slug,h1:p.title,summary:p.desc,schema:[{'@type':'CreativeWork',name:p.title,description:p.desc,url:base+'/portfolio/'+slug},breadcrumb(base,[{name:'Home',path:'/'},{name:'Portfolio',path:'/portfolio'},{name:p.title,path:'/portfolio/'+slug}])]};
}
if(kind==='cart')out={...out,title:'Rental Cart | Rentcam',description:'Keranjang rental Rentcam.',canonical:base+'/cart',robots:'noindex,nofollow',h1:'Rental Cart',summary:'Keranjang rental pelanggan.',schema:[]};
if(kind==='order')out={...out,title:'Pesanan Rental | Rentcam',description:'Halaman pesanan rental Rentcam.',canonical:base+'/pesanan',robots:'noindex,nofollow',h1:'Pesanan Rental',summary:'Halaman pesanan rental pelanggan.',schema:[]};
if(kind==='tracking')out={...out,title:'Cek Order & Antar Jemput | Rentcam',description:'Cek status pesanan rental dan antar jemput Rentcam menggunakan kode tracking.',canonical:base+'/cek-order',robots:'noindex,nofollow',h1:'Cek Order & Antar Jemput',summary:'Masukkan kode tracking untuk melihat status pesanan dan perjalanan driver.',schema:[]};
return out;
}
function xmlEsc(s){return String(s).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]))}
function sitemapXml(base='https://rentalcamera.aiorbitlab.me'){
const urls=['/','/produk',...Object.keys(PRODUCTS).map(x=>'/produk/'+x),'/portfolio',...Object.keys(PORTFOLIO).map(x=>'/portfolio/'+x),'/artikel',...Object.keys(ARTICLES).map(x=>'/artikel/'+x)];
const now='2026-09-17';
return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${xmlEsc(base+u)}</loc><lastmod>${now}</lastmod><changefreq>${u==='/'?'daily':u.startsWith('/produk/')?'weekly':'monthly'}</changefreq><priority>${u==='/'?'1.0':u==='/produk'?'0.9':u.startsWith('/produk/')?'0.8':'0.6'}</priority></url>`).join('\n')}\n</urlset>`;
}
module.exports={PRODUCTS,ARTICLES,PORTFOLIO,humanize,seoForRoute,sitemapXml};