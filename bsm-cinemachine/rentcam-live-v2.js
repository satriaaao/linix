(function(){
  const labels={Camera:'Cameras',Lens:'Lenses',Lighting:'Lighting',Wireless:'Wireless',Grip:'Grip',Audio:'Audio'};

  const compactDetailStyle=document.createElement('style');
  compactDetailStyle.id='rentcam-product-detail-compact-v2';
  compactDetailStyle.textContent=`
    body.alexa35-detail .rentcam-detail-badge.new{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    body.alexa35-detail .detail-info [class*="badge"],
    body.alexa35-detail .detail-info [class*="status"]{display:none!important}
    body.alexa35-detail .detail-info h1::before,
    body.alexa35-detail .detail-info h1::after{display:none!important;content:none!important}

    .product-detail-simple .detail-price{font-size:34px!important;line-height:1!important;margin:0 0 24px!important}
    .product-detail-simple .detail-price small{font-size:13px!important;margin-left:6px!important}
    .product-detail-simple .qty-wrap{padding-top:18px!important}
    .product-detail-simple .qty-label{font-size:15px!important;margin-bottom:9px!important}
    .product-detail-simple .qty-box{width:150px!important;height:46px!important;margin:0 0 12px!important}
    .product-detail-simple .qty-box button{font-size:19px!important;line-height:1!important}
    .product-detail-simple .qty-box span{font-size:16px!important}
    .product-detail-simple .add-rental-full{width:min(82%,420px)!important;height:50px!important;font-size:16px!important;margin:0 0 20px!important;padding:0 18px!important}

    @media(max-width:620px){
      .product-detail-simple .detail-price{font-size:27px!important;margin:0 0 20px!important}
      .product-detail-simple .detail-price small{font-size:11px!important;margin-left:4px!important}
      .product-detail-simple .qty-wrap{padding-top:14px!important}
      .product-detail-simple .qty-label{font-size:14px!important;margin-bottom:8px!important}
      .product-detail-simple .qty-box{width:138px!important;height:42px!important;margin-bottom:10px!important}
      .product-detail-simple .qty-box button{font-size:18px!important}
      .product-detail-simple .qty-box span{font-size:15px!important}
      .product-detail-simple .add-rental-full{width:min(92%,360px)!important;height:46px!important;font-size:15px!important;margin-bottom:16px!important}
    }
  `;
  document.head.appendChild(compactDetailStyle);

  function applyDetailFixes(){
    const isAlexa35=location.pathname==='/produk/arri-alexa-35';
    document.body.classList.toggle('alexa35-detail',isAlexa35);
    if(!isAlexa35)return;

    document.querySelectorAll('#app .rentcam-detail-badge.new').forEach(el=>{
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
    });

    document.querySelectorAll('#app .detail-info *').forEach(el=>{
      if(el.children.length===0 && (el.textContent||'').trim().toUpperCase()==='NEW'){
        el.style.setProperty('display','none','important');
      }
    });
  }

  const getSort=()=>localStorage.getItem('rentcam_product_sort')||'featured';
  const getView=()=>localStorage.getItem('rentcam_product_view')||'grid';
  window.productSetSort=v=>{localStorage.setItem('rentcam_product_sort',v);render()};
  window.productSetView=v=>{localStorage.setItem('rentcam_product_view',v);render()};

  const toolbar=(s,v)=>`<div class="product-toolbar"><div class="product-sort"><label>Sort by</label><select onchange="productSetSort(this.value)"><option value="featured" ${s==='featured'?'selected':''}>Featured</option><option value="name-asc" ${s==='name-asc'?'selected':''}>Nama A–Z</option><option value="price-asc" ${s==='price-asc'?'selected':''}>Harga Terendah</option><option value="price-desc" ${s==='price-desc'?'selected':''}>Harga Tertinggi</option><option value="brand" ${s==='brand'?'selected':''}>Brand</option></select></div><div class="product-view-switch"><button class="product-view-btn ${v==='grid'?'active':''}" onclick="productSetView('grid')" aria-label="Grid"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1"/><rect x="17" y="3" width="4" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/><rect x="17" y="10" width="4" height="5" rx="1"/><rect x="3" y="17" width="5" height="4" rx="1"/><rect x="10" y="17" width="5" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/></svg></button><button class="product-view-btn ${v==='list'?'active':''}" onclick="productSetView('list')" aria-label="List"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="5" width="4" height="4" rx="1"/><rect x="10" y="5.5" width="10" height="3" rx="1.5"/><rect x="4" y="10" width="4" height="4" rx="1"/><rect x="10" y="10.5" width="10" height="3" rx="1.5"/><rect x="4" y="15" width="4" height="4" rx="1"/><rect x="10" y="15.5" width="10" height="3" rx="1.5"/></svg></button></div></div>`;
  const row=p=>`<article class="product-row" onclick="go('/produk/${p.id}')"><div class="rimg"><img src="${p.img}" alt="${p.name}"></div><div class="meta"><small>${p.brand}</small><h3>${p.name}</h3></div><div class="side"><div class="price">From ${rp(p.price)}</div><button onclick="event.stopPropagation();add('${p.id}')">Tambah Rental</button></div></article>`;

  window.products=function(){
    let u=new URLSearchParams(location.search),c=u.get('cat')||'',b=u.get('brand')||'',q=(u.get('q')||'').toLowerCase();
    let a=P.filter(x=>(!c||x.cat===c)&&(!b||x.brand===b)&&(!q||`${x.name} ${x.brand} ${x.cat}`.toLowerCase().includes(q)));
    const s=getSort(),v=getView();
    if(s==='name-asc')a=a.slice().sort((x,y)=>x.name.localeCompare(y.name));
    else if(s==='price-asc')a=a.slice().sort((x,y)=>x.price-y.price);
    else if(s==='price-desc')a=a.slice().sort((x,y)=>y.price-x.price);
    else if(s==='brand')a=a.slice().sort((x,y)=>x.brand.localeCompare(y.brand)||x.name.localeCompare(y.name));
    const title=labels[c]||(b?b:'All Rentals');
    return `<section class="page"><div class="container"><div class="product-meta"><h1>${title}</h1><p>${a.length} products</p></div>${toolbar(s,v)}<div class="${v==='grid'?'products-grid':'products-list'}">${v==='grid'?a.map(pc).join(''):a.map(row).join('')}</div></div></section>`;
  };

  window.detail=function(id){
    const p=P.find(x=>x.id===id); if(!p)return products();
    const desc=`${p.name} disiapkan untuk workflow film, commercial, series dan production profesional.`;
    return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke Rentals</a><div class="detail-top"><div class="detail-media"><img src="${p.img}" alt="${p.name}"></div><div class="detail-info"><div class="detail-brand">${p.brand}</div><h1>${p.name}</h1><div class="detail-price">${rp(p.price)} <small>/ day</small></div><div class="qty-wrap"><div class="qty-label">Quantity</div><div class="qty-box"><button onclick="qty=Math.max(1,qty-1);render()">−</button><span>${qty}</span><button onclick="qty++;render()">+</button></div><button class="add-rental-full" onclick="add('${p.id}',qty)">Add to Rental Cart</button></div><div class="detail-sections"><section class="detail-section"><h2>Description</h2><p>${desc}</p></section><section class="detail-section"><h2>Included as Standard</h2><ul class="included-list">${p.inc.map(x=>`<li>${x}</li>`).join('')}</ul></section><section class="detail-section"><h2>Specifications</h2><div class="spec-list">${p.spec.map(x=>`<div class="spec-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></section></div></div></div></div></section>`;
  };

  const baseRender=window.render;
  if(typeof baseRender==='function'){
    window.render=function(){
      clearInterval?.(timer);
      save?.();
      const p=location.pathname;
      document.getElementById('app').innerHTML=p==='/'?home():p==='/produk'?products():p.startsWith('/produk/')?detail(p.split('/')[2]):p==='/cart'?cartPage():p==='/portfolio'?portfolioPage():p.startsWith('/portfolio/')?portfolioDetail(p.split('/')[2]):p==='/artikel'?blogPage():p.startsWith('/artikel/')?articleDetail(p.split('/')[2]):home();
      applyDetailFixes();
      scrollTo(0,0);
      if(p==='/'){showSlide?.();timer=setInterval(()=>{hi=(hi+1)%SL.length;document.querySelector('#app .hero')?.replaceWith((()=>{let t=document.createElement('template');t.innerHTML=hero().trim();return t.content.firstChild})())},5000)}
    };
  }

  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>requestAnimationFrame(applyDetailFixes)).observe(app,{childList:true,subtree:true});
  if(typeof render==='function')render();
  requestAnimationFrame(applyDetailFixes);
})();