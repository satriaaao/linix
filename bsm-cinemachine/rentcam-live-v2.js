(function(){
  const SOURCE='https://www.cinemachine.com.au/pages/arri-sales-products';
  const png=url=>`https://images.weserv.nl/?url=${encodeURIComponent(String(url).replace(/^https?:\/\//,''))}&output=png&w=1000&h=1000&fit=contain&bg=ffffff`;

  const IMG={
    control:png('https://www.cinemachine.com.au/cdn/shop/files/KK.0041791Hi-5HandUnitBasicSet_800x.jpg?v=1715326549'),
    matte:png('https://www.cinemachine.com.au/cdn/shop/files/KK.0015177-MB-LMB-4x5-PRO-SET_800x.jpg?v=1753753648'),
    support:png('https://www.cinemachine.com.au/cdn/shop/files/K2.0015896-2-SU-Bottom-Plate-300mm_12inch_800x.jpg?v=1715312860')
  };
  IMG.filter=IMG.matte; IMG.follow=IMG.control; IMG.accessory=IMG.support;

  const src=(id,name,cat,price,img,sku='')=>({
    id,name,brand:'ARRI',cat,price,priceAud:price,img,stock:1,source:SOURCE,sku,
    spec:[['Brand','ARRI'],['Category',cat],['Source','Cinemachine ARRI Sales'],['SKU',sku||'—']],
    inc:['Product configuration as listed by source','Contact BSM Rental for local package details']
  });

  const C=[
    src('arri-hi5-basic','ARRI Hi-5 Hand Unit Basic Set','Electronic Control',19085,IMG.control,'KK.0041791'),
    src('arri-hi5-body','ARRI Hi-5 Hand Unit Body Naked','Electronic Control',16016,IMG.control,'K2.0037280'),
    src('arri-sxu1','ARRI Single Axis Unit SXU-1','Electronic Control',3850,IMG.control,'K2.0000071'),
    src('arri-ocu1-basic','ARRI Operator Control Unit OCU-1 Basic Set','Electronic Control',2981,IMG.control,'K2.0020002'),
    src('arri-ocu1-extended','ARRI Operator Control Unit OCU-1 Extended Set 2','Electronic Control',4147,IMG.control,'KK.0040346'),
    src('arri-cforce-mini-rf-basic','ARRI cforce mini RF Basic Set 2','Electronic Control',10615,IMG.control,'KK.0040345'),
    src('arri-cforce-plus-basic','ARRI cforce plus Basic Set','Electronic Control',6985,IMG.control),
    src('arri-clm4-basic','ARRI Controlled Lens Motor CLM-4 Basic Set','Electronic Control',6127,IMG.control,'KK.0005855'),
    src('arri-lcube-cub2','ARRI LCUBE CUB-2 Basic Set','Electronic Control',2585,IMG.control),
    src('arri-rf2400','ARRI RF-2400 Radio Module 2400 MHz FHSS','Electronic Control',2310,IMG.control),
    src('arri-rf-emip','ARRI RF-EMIP Radio Module 2400 MHz DSSS','Electronic Control',2310,IMG.control),
    src('arri-smart-focus-feet','ARRI Smart Focus Ring Set Feet (10x)','Electronic Control',1012,IMG.control,'KK.0047820'),
    src('arri-smart-iris','ARRI Smart Iris Ring Set (5x)','Electronic Control',484,IMG.control,'KK.0047207'),

    src('arri-lmb66-pro-19','ARRI LMB 6x6 Pro 19mm Studio Set','Matte Box',13200,IMG.matte),
    src('arri-lmb66-pro-15','ARRI LMB 6x6 Pro 15mm Studio Set','Matte Box',12705,IMG.matte),
    src('arri-lmb45-pro','ARRI LMB 4x5 Pro Set','Matte Box',9636,IMG.matte,'KK.0015177'),
    src('arri-lmb66-15-3stage','ARRI LMB 6x6 15mm Studio 3-Stage Set','Matte Box',6380,IMG.matte),
    src('arri-lmb66-19-3stage','ARRI LMB 6x6 19mm Studio 3-Stage Set','Matte Box',6116,IMG.matte),
    src('arri-lmb66-clamp-3stage','ARRI LMB 6x6 Clamp-On 3-Stage Set','Matte Box',5280,IMG.matte),
    src('arri-lmb45-lws-3stage','ARRI LMB 4x5 15mm LWS Set 3-Stage','Matte Box',4609,IMG.matte),
    src('arri-lmb45-clamp-adapter-pro','ARRI LMB 4x5 Clamp Adapter Set Pro','Matte Box',4015,IMG.matte),
    src('arri-lmb45-clamp-3stage','ARRI LMB 4x5 Clamp-On Set 3-Stage','Matte Box',3982,IMG.matte),
    src('arri-lmb66-clamp-adapter','ARRI LMB 6x6 Clamp Adapter Set','Matte Box',3894,IMG.matte),
    src('arri-mmb2-basic-lws','ARRI Mini Matte Box MMB-2 Basic LWS Set','Matte Box',2310,IMG.matte),
    src('arri-lmb45-basic','ARRI LMB 4x5 Basic Module','Matte Box',2090,IMG.matte),

    src('arri-basic-fs7-fx9','ARRI Basic Set for Sony FS7II/FX9','Camera Support',3146,IMG.support),
    src('arri-pro-fs7-fx9','ARRI Pro Set for Sony FS7II/FX9','Camera Support',6050,IMG.support),
    src('arri-bpa5','ARRI Bridge Plate Adapter BPA-5','Camera Support',330,IMG.support),
    src('arri-bp9','ARRI Bridge Plate BP-9','Camera Support',1540,IMG.support),
    src('arri-bp8','ARRI Bridge Plate BP-8','Camera Support',1485,IMG.support),
    src('arri-bps2','ARRI Bridge Plate Sled BPS-2','Camera Support',770,IMG.support),
    src('arri-bps2-set','ARRI Bridge Plate Sled BPS-2 Set','Camera Support',1815,IMG.support),
    src('arri-dovetail-300','ARRI Bottom Dovetail Plate 300mm/12in','Camera Support',1012,IMG.support,'K2.0015896'),
    src('arri-dovetail-450','ARRI Bottom Dovetail Plate 450mm/18in','Camera Support',1320,IMG.support),
    src('arri-dovetail-600','ARRI Bottom Dovetail Plate 600mm/24in','Camera Support',1628,IMG.support),
    src('arri-dovetail-150','ARRI Bottom Dovetail Plate 150mm/6in','Camera Support',671,IMG.support),
    src('arri-qrp1','ARRI QRP-1 Baseplate','Camera Support',1540,IMG.support),
    src('arri-qrhd','ARRI QR-HD Cine Base Plate, Basic Unit','Camera Support',3300,IMG.support),
    src('arri-lls1','ARRI Lightweight Lens Support LLS-1','Camera Support',561,IMG.support),

    src('arri-fsnd-pro','ARRI FSND Filter Pro Set 6.6inx6.6in','Filters',6325,IMG.filter,'KK.0019787'),
    src('arri-fsnd-basic','ARRI FSND Filter Basic Set 6.6inx6.6in','Filters',2486,IMG.filter),
    src('arri-rota-pola-66','ARRI Rota Pola Filter Frame 6.6x6.6','Filters',1705,IMG.filter),
    src('arri-rota-pola-4565','ARRI Rota Pola Filter Frame 4x5.65','Filters',1210,IMG.filter),
    src('arri-fsnd-21','ARRI FSND 2.1 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-18','ARRI FSND 1.8 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-15','ARRI FSND 1.5 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-12','ARRI FSND 1.2 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-09','ARRI FSND 0.9 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-06','ARRI FSND 0.6 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-03','ARRI FSND 0.3 Filter 6.6in x 6.6in','Filters',880,IMG.filter),
    src('arri-fsnd-24','ARRI FSND 2.4 Filter 6.6in x 6.6in','Filters',836,IMG.filter),

    src('arri-ff5-basic','ARRI Follow Focus FF-5 Cine Set Basic','Follow Focus',6798,IMG.follow,'KK.0005757'),
    src('arri-ff4-basic','ARRI Follow Focus FF-4 Basic Unit, black','Follow Focus',5995,IMG.follow),
    src('arri-ff4-15','ARRI Follow Focus FF-4 Set 15mm, black','Follow Focus',8635,IMG.follow),

    src('arri-arrihead2','ARRI ARRIHEAD 2','Accessories',87230,IMG.accessory),
    src('arri-pouch-large','ARRI Assistant Pouch Large','Accessories',99,IMG.accessory),
    src('arri-pouch-small','ARRI Assistant Pouch Small','Accessories',93.5,IMG.accessory,'K2.0013017'),
    src('arri-backplate2-venice','ARRI Back Plate 2 for Venice Ext. Unit','Accessories',198,IMG.accessory),
    src('arri-backplate-venice','ARRI Back Plate for Venice Ext. Unit','Accessories',220,IMG.accessory),
    src('arri-baseplate-venice','ARRI Base Plate for Venice Ext. Unit','Accessories',858,IMG.accessory),
    src('arri-broadcast-c400','ARRI Basic Broadcast Set for Canon EOS C400','Accessories',3564,IMG.accessory),
    src('arri-broadcast-burano','ARRI Basic Broadcast Set for Sony BURANO','Accessories',3762,IMG.accessory),
    src('arri-bluetooth','ARRI Bluetooth Dongle','Accessories',38.5,IMG.accessory,'K2.0039838')
  ];

  const aud=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function install(){
    if(typeof P==='undefined'||typeof go!=='function') return false;
    P.splice(0,P.length,...C);

    const st=document.createElement('style');
    st.id='cinemachine-arri-catalog-style';
    st.textContent=`
      #app .pcard::before,#app .pcard::after,#app .detail-info h1::before,#app .detail-info h1::after,#app .detail-ref-info h1::before,#app .detail-ref-info h1::after{display:none!important;content:none!important}
      #app .arri-source-badge{position:absolute;left:12px;top:12px;z-index:20;background:#111;color:#fff;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:900;letter-spacing:.06em}
      #app .pimg,#app .detail-media{background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      #app .pimg img,#app .detail-media img{width:100%!important;height:100%!important;object-fit:contain!important;background:#fff!important}
      .arri-cats{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 26px}.arri-cat{border:1px solid #ddd;background:#fff;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:750;cursor:pointer}.arri-cat.on{background:#111;color:#fff;border-color:#111}
      .source-price{font-weight:800;color:#111}.source-note{font-size:10px;color:#8a8a8a;margin-left:6px}.arri-source-link{display:inline-flex;align-items:center;justify-content:center;height:50px;padding:0 22px;background:#111;color:#fff;text-decoration:none;font-weight:800;font-size:14px;margin:4px 0 22px}
      @media(max-width:620px){#app .arri-source-badge{left:8px;top:8px;padding:7px 9px;font-size:8px}.arri-cats{gap:6px;margin:18px 0}.arri-cat{padding:9px 11px;font-size:11px}}
    `;
    document.getElementById(st.id)?.remove(); document.head.appendChild(st);

    window.pc=function(p){return `<article class="pcard" onclick="go('/produk/${p.id}')"><div class="pimg" style="position:relative"><span class="arri-source-badge">ARRI</span><img src="${p.img}" alt="${esc(p.name)}"><div class="hoverBtns"><button onclick="event.stopPropagation();go('/produk/${p.id}')">Quick view</button></div></div><div class="pbrand">ARRI · ${esc(p.cat)}</div><div class="pname">${esc(p.name)}</div><div class="price"><span class="source-price">${aud(p.priceAud)}</span><small class="source-note">harga sumber</small></div></article>`};

    window.products=function(){
      const u=new URLSearchParams(location.search),cat=u.get('cat')||'',q=(u.get('q')||'').toLowerCase();
      let a=P.filter(x=>(!cat||x.cat===cat)&&(!q||`${x.name} ${x.cat} ${x.sku}`.toLowerCase().includes(q)));
      const cats=[...new Set(P.map(x=>x.cat))];
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${cat?esc(cat):'ARRI Products'}</h1><p>${a.length} products · data katalog dari Cinemachine</p></div><div class="arri-cats"><button class="arri-cat ${!cat?'on':''}" onclick="go('/produk')">All</button>${cats.map(c=>`<button class="arri-cat ${cat===c?'on':''}" onclick="go('/produk?cat=${encodeURIComponent(c)}')">${esc(c)}</button>`).join('')}</div><div class="products-grid">${a.map(pc).join('')}</div></div></section>`;
    };

    window.detail=function(id){
      const p=P.find(x=>x.id===id); if(!p)return products();
      return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke ARRI Products</a><div class="detail-top"><div class="detail-media" style="position:relative"><span class="arri-source-badge">ARRI</span><img src="${p.img}" alt="${esc(p.name)}"></div><div class="detail-info"><div class="detail-brand">ARRI · ${esc(p.cat)}</div><h1>${esc(p.name)}</h1><div class="detail-price">${aud(p.priceAud)} <small>harga sumber AUD</small></div><div class="detail-sections"><section class="detail-section"><h2>Product Information</h2><p>Produk ARRI yang tercantum pada katalog Cinemachine. Harga di atas adalah referensi harga sumber dan bukan harga rental BSM.</p></section><section class="detail-section"><h2>Specifications</h2><div class="spec-list">${p.spec.map(x=>`<div class="spec-row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}</div></section></div><a class="arri-source-link" href="${SOURCE}" target="_blank" rel="noopener">Lihat sumber produk</a></div></div></div></section>`;
    };

    window.home=function(){
      const cards=P.slice(0,8).map(pc).join('');
      return `${typeof hero==='function'?hero():''}<section class="section soft"><div class="container"><div class="head"><div><h2>ARRI Products</h2><p>Katalog produk ARRI yang diambil dari Cinemachine ARRI Sales Products.</p></div><a class="view" onclick="go('/produk')">View all</a></div><div class="grid">${cards}</div></div></section>`;
    };

    window.render=function(){
      try{clearInterval(timer)}catch(e){}
      try{save()}catch(e){}
      const p=location.pathname;
      document.getElementById('app').innerHTML=p==='/'?home():p==='/produk'?products():p.startsWith('/produk/')?detail(p.split('/')[2]):p==='/cart'?(typeof cartPage==='function'?cartPage():products()):p==='/portfolio'?(typeof portfolioPage==='function'?portfolioPage():home()):p.startsWith('/portfolio/')?(typeof portfolioDetail==='function'?portfolioDetail(p.split('/')[2]):home()):p==='/artikel'?(typeof blogPage==='function'?blogPage():home()):p.startsWith('/artikel/')?(typeof articleDetail==='function'?articleDetail(p.split('/')[2]):home()):home();
      scrollTo(0,0);
    };
    render();
    return true;
  }

  let tries=0; const t=setInterval(()=>{tries++; if(install()||tries>40)clearInterval(t)},100);
})();
