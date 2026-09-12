/* Rentcam homepage category strip + source-label cleanup */
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const money=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2}).format(Number(n)||0);

  function install(){
    if(typeof P==='undefined'||typeof go!=='function'||typeof hero!=='function') return false;

    const old=document.getElementById('rentcam-home-cat-cleanup-style');
    if(old) old.remove();
    const st=document.createElement('style');
    st.id='rentcam-home-cat-cleanup-style';
    st.textContent=`
      .home-cat-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%;background:#fff;border-top:1px solid #e6e6e6;border-bottom:1px solid #e6e6e6}
      .home-cat-item{min-height:66px;border:0;border-right:1px solid #e6e6e6;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;cursor:pointer;font:inherit}
      .home-cat-item:last-child{border-right:0}
      .home-cat-item b{font-size:13px;line-height:1.15;font-weight:800;white-space:nowrap}
      .home-cat-item small{font-size:9px;color:#a0a0a0;white-space:nowrap}
      .home-cat-item:hover{background:#fafafa}
      #app .source-note{display:none!important}
      @media(max-width:850px){.home-cat-strip{display:flex;overflow-x:auto;scrollbar-width:none}.home-cat-strip::-webkit-scrollbar{display:none}.home-cat-item{flex:0 0 180px;min-height:58px}.home-cat-item b{font-size:12px}}
      @media(max-width:620px){.home-cat-item{flex-basis:154px}.home-cat-item b{font-size:11px}.home-cat-item small{font-size:8px}}
    `;
    document.head.appendChild(st);

    const cats=['Electronic Control','Matte Box','Camera Support','Filters','Follow Focus','Accessories'];
    const categoryStrip=()=>`<div class="home-cat-strip">${cats.map(c=>`<button class="home-cat-item" onclick="go('/produk?cat=${encodeURIComponent(c)}')"><b>${esc(c)}</b><small>${P.filter(x=>x.cat===c).length} products</small></button>`).join('')}</div>`;

    window.pc=function(p){return `<article class="pcard" onclick="go('/produk/${p.id}')"><div class="pimg" style="position:relative"><span class="arri-source-badge">ARRI</span><img src="${p.img}" alt="${esc(p.name)}"><div class="hoverBtns"><button onclick="event.stopPropagation();go('/produk/${p.id}')">Quick view</button></div></div><div class="pbrand">ARRI · ${esc(p.cat)}</div><div class="pname">${esc(p.name)}</div><div class="price"><span class="source-price">${money(p.priceAud??p.price)}</span></div></article>`};

    window.products=function(){
      const u=new URLSearchParams(location.search),cat=u.get('cat')||'',q=(u.get('q')||'').toLowerCase();
      const a=P.filter(x=>(!cat||x.cat===cat)&&(!q||`${x.name} ${x.cat} ${x.sku||''}`.toLowerCase().includes(q)));
      const allCats=[...new Set(P.map(x=>x.cat))];
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${cat?esc(cat):'ARRI Products'}</h1><p>${a.length} products</p></div><div class="arri-cats"><button class="arri-cat ${!cat?'on':''}" onclick="go('/produk')">All</button>${allCats.map(c=>`<button class="arri-cat ${cat===c?'on':''}" onclick="go('/produk?cat=${encodeURIComponent(c)}')">${esc(c)}</button>`).join('')}</div><div class="products-grid">${a.map(pc).join('')}</div></div></section>`;
    };

    window.detail=function(id){
      const p=P.find(x=>x.id===id); if(!p) return products();
      const specs=(p.spec||[]).filter(x=>String(x[0]).toLowerCase()!=='source');
      return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke ARRI Products</a><div class="detail-top"><div class="detail-media" style="position:relative"><span class="arri-source-badge">ARRI</span><img src="${p.img}" alt="${esc(p.name)}"></div><div class="detail-info"><div class="detail-brand">ARRI · ${esc(p.cat)}</div><h1>${esc(p.name)}</h1><div class="detail-price">${money(p.priceAud??p.price)}</div><div class="detail-sections"><section class="detail-section"><h2>Product Information</h2><p>ARRI professional cinema equipment untuk kebutuhan produksi film, commercial, television, dan workflow sinema profesional.</p></section><section class="detail-section"><h2>Specifications</h2><div class="spec-list">${specs.map(x=>`<div class="spec-row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('')}</div></section></div></div></div></div></section>`;
    };

    window.home=function(){
      const cards=P.slice(0,8).map(pc).join('');
      return `${hero()}${categoryStrip()}<section class="section soft"><div class="container"><div class="head"><div><h2>Latest in Rentals</h2><p>Professional ARRI cinema equipment untuk workflow produksi.</p></div><a class="view" onclick="go('/produk')">View all</a></div><div class="grid">${cards}</div></div></section>`;
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

  let tries=0; const t=setInterval(()=>{tries++; if(install()||tries>50) clearInterval(t)},100);
})();
