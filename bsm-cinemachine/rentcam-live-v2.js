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

    src('arri-lmb45-pro','ARRI LMB 4x5 Pro Set','Matte Box',9636,IMG.matte,'KK.0015177'),

    src('arri-dovetail-300','ARRI Bottom Dovetail Plate 300mm/12in','Camera Support',1012,IMG.support,'K2.0015896'),



    src('arri-arrihead2','ARRI ARRIHEAD 9','Accessories',87230,'https://xleceiffuopioeguniwj.supabase.co/storage/v1/object/public/cms-media/ca0097ef-e460-46c8-8393-6c0f5eb1542a/product/1789225488538-img_6565.jpeg'),
  ];

  const aud=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function install(){
    if(typeof P==='undefined'||typeof go!=='function') return false;
    const combined=[...P,...C]; P.splice(0,P.length,...combined.filter((p,i)=>combined.findIndex(x=>x.id===p.id)===i));

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

  if(!install()){let tries=0; const t=setInterval(()=>{tries++; if(install()||tries>40)clearInterval(t)},100);}
})();
