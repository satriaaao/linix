/* Rentcam product search + promotional auto slider */
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const catalogGroups=[
    {key:'cinema',title:'Kamera Cinema',aliases:['cinema']},
    {key:'camera',title:'Kamera',aliases:['camera','kamera']},
    {key:'lens',title:'Lensa',aliases:['lens','lensa']},
    {key:'lighting',title:'Lighting',aliases:['lighting']},
    {key:'audio',title:'Audio',aliases:['audio']},
    {key:'package',title:'Paket',aliases:['package','paket']},
    {key:'wireless',title:'Monitor & Wireless',aliases:['wireless','monitor']},
    {key:'grip',title:'Grip & Support',aliases:['grip','camera support','camera-support']},
    {key:'accessories',title:'Aksesori',aliases:['accessories','aksesori','electronic control','electronic-control','matte box','matte-box','follow focus','follow-focus','filters']}
  ];
  window.rentcamCatalogGroup=function(p){
    const c=String(p.mainCategory||p.cat||p.category||'').toLowerCase();
    if(c==='package'||c==='paket'||/\bpaket\b/i.test(p.name||''))return 'package';
    if(['cinema','camera','kamera'].includes(c)&&/alexa|venice|raptor|komodo|burano|cinema camera|pxw-fs/i.test(p.name||''))return 'cinema';
    return catalogGroups.find(g=>g.aliases.includes(c))?.key||'accessories';
  };

  let promoIndex=0;
  let promoTimer=null;

  function promoItems(){
    const pick=(id,fallback=0)=>P.find(x=>x.id===id)||P[fallback]||{};
    return [
      {
        ey:'RENTAL PROMO',
        title:'Sewa 3 Hari, Bayar 2 Hari',
        text:'Paket cinema equipment pilihan untuk produksi lebih efisien.',
        cta:'Lihat Equipment',
        href:'/produk',
        cls:'promo-orange',
        product:pick('arri-hi5-basic',0)
      },
      {
        ey:'DELIVERY SUPPORT',
        title:'Free Delivery DKI Jakarta',
        text:'Nikmati layanan antar equipment untuk transaksi rental yang memenuhi ketentuan.',
        cta:'Cari Produk',
        href:'/produk',
        cls:'promo-dark',
        product:pick('arri-lmb45-pro',14)
      },
      {
        ey:'SPECIAL PROJECT',
        title:'Promo Hingga 50%',
        text:'Khusus tugas akhir, film festival, dan project produksi terpilih.',
        cta:'Lihat Katalog',
        href:'/produk',
        cls:'promo-blue',
        product:pick('arri-ff5-basic',52)
      }
    ];
  }

  function promoMarkup(){
    const items=promoItems();
    return `<div class="promo-slider" id="promoSlider">
      <div class="promo-track" id="promoTrack" style="transform:translateX(-${promoIndex*100}%);">
        ${items.map((s,i)=>`<article class="promo-slide ${s.cls}" data-promo-index="${i}">
          <div class="promo-copy">
            <span class="promo-ey">${esc(s.ey)}</span>
            <h2>${esc(s.title)}</h2>
            <p>${esc(s.text)}</p>
            <button onclick="go('${s.href}')">${esc(s.cta)}</button>
          </div>
          <div class="promo-visual">
            <div class="promo-glow"></div>
            ${s.product?.img?`<img src="${s.product.img}" alt="${esc(s.product.name||'ARRI Cinema Equipment')}">`:''}
          </div>
        </article>`).join('')}
      </div>
      <button class="promo-arrow promo-prev" aria-label="Promo sebelumnya" onclick="rentcamPromoPrev()">‹</button>
      <button class="promo-arrow promo-next" aria-label="Promo berikutnya" onclick="rentcamPromoNext()">›</button>
      <div class="promo-dots">${items.map((_,i)=>`<button class="promo-dot ${i===promoIndex?'on':''}" onclick="rentcamPromoGo(${i})" aria-label="Promo ${i+1}"></button>`).join('')}</div>
    </div>`;
  }

  function applyPromo(){
    const track=document.getElementById('promoTrack');
    if(!track) return;
    track.style.transform=`translateX(-${promoIndex*100}%)`;
    document.querySelectorAll('.promo-dot').forEach((d,i)=>d.classList.toggle('on',i===promoIndex));
  }

  window.rentcamPromoGo=function(i){
    const count=promoItems().length;
    promoIndex=((Number(i)||0)%count+count)%count;
    applyPromo();
    restartPromo();
  };
  window.rentcamPromoNext=function(){
    promoIndex=(promoIndex+1)%promoItems().length;
    applyPromo();
    restartPromo();
  };
  window.rentcamPromoPrev=function(){
    promoIndex=(promoIndex-1+promoItems().length)%promoItems().length;
    applyPromo();
    restartPromo();
  };
  function restartPromo(){
    clearInterval(promoTimer);
    if(!document.getElementById('promoSlider')) return;
    promoTimer=setInterval(()=>{
      promoIndex=(promoIndex+1)%promoItems().length;
      applyPromo();
    },4800);
  }
  function mountPromo(){
    if(document.getElementById('promoSlider')){
      applyPromo();
      restartPromo();
      const slider=document.getElementById('promoSlider');
      if(slider && !slider.dataset.swipeReady){
        slider.dataset.swipeReady='1';
        let x0=null;
        slider.addEventListener('touchstart',e=>{x0=e.touches?.[0]?.clientX??null},{passive:true});
        slider.addEventListener('touchend',e=>{
          if(x0==null) return;
          const x1=e.changedTouches?.[0]?.clientX??x0;
          const dx=x1-x0;
          x0=null;
          if(Math.abs(dx)>45) dx<0?rentcamPromoNext():rentcamPromoPrev();
        },{passive:true});
      }
    }else{
      clearInterval(promoTimer);
    }
  }

  function install(){
    if(typeof P==='undefined'||typeof go!=='function'||typeof pc!=='function') return false;

    const old=document.getElementById('rentcam-product-search-style');
    if(old) old.remove();
    const st=document.createElement('style');
    st.id='rentcam-product-search-style';
    st.textContent=`
      html body #app .catalog-filter-row{display:flex!important;align-items:center!important;gap:16px!important;margin:16px 0 26px!important;width:100%!important}
      html body #app .catalog-filter-field{position:relative!important;display:block!important;width:320px!important;max-width:100%!important;margin:0!important}
      html body #app .catalog-filter-field>span{display:block!important;font-size:11px!important;font-weight:650!important;color:#777!important;margin:0 0 7px!important}
      html body #app .catalog-filter-field select{appearance:none!important;-webkit-appearance:none!important;display:block!important;width:100%!important;height:48px!important;padding:0 44px 0 15px!important;border:1px solid #dedede!important;border-radius:12px!important;background:#fff!important;color:#111!important;font:inherit!important;font-size:14px!important;font-weight:650!important;cursor:pointer!important;box-sizing:border-box!important}
      html body #app .catalog-filter-field select:focus-visible{outline:2px solid #111!important;outline-offset:3px!important}
      html body #app .catalog-filter-field svg{position:absolute!important;right:15px!important;bottom:15px!important;width:18px!important;height:18px!important;fill:none!important;stroke:#555!important;stroke-width:1.8!important;pointer-events:none!important}
      html body #app .catalog-filter-count{font-size:12px!important;color:#777!important;white-space:nowrap!important;padding-top:21px!important}
      .catalog-group{margin:26px 0 36px}.catalog-group header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.catalog-group h2{font-size:24px;margin:0;letter-spacing:-.03em}.catalog-group header span{color:#777;font-size:12px}
      @media(max-width:620px){html body #app .catalog-filter-field{flex:1!important;width:auto!important;min-width:0!important}html body #app .catalog-filter-row{gap:12px!important;margin:14px 0 24px!important}html body #app .catalog-filter-field select{font-size:16px!important}.catalog-group h2{font-size:21px}}
      .promo-slider{position:relative;overflow:hidden;margin:20px 0 18px;border-radius:22px;background:#111;box-shadow:0 18px 45px rgba(0,0,0,.10)}
      .promo-track{display:flex;width:100%;transition:transform .7s cubic-bezier(.22,.7,.22,1);will-change:transform}
      .promo-slide{position:relative;flex:0 0 100%;height:230px;overflow:hidden;display:grid;grid-template-columns:1.12fr .88fr;align-items:center;padding:28px 68px 28px 42px;color:#fff}
      .promo-slide::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,rgba(0,0,0,.24),transparent 62%)}
      .promo-orange{background:linear-gradient(125deg,#f26a21 0%,#c94f12 48%,#1b1b1b 100%)}
      .promo-dark{background:linear-gradient(125deg,#161616 0%,#333 52%,#111 100%)}
      .promo-blue{background:linear-gradient(125deg,#0c3158 0%,#175c9b 50%,#111 100%)}
      .promo-copy{position:relative;z-index:3;max-width:610px}
      .promo-ey{display:inline-flex;align-items:center;height:26px;padding:0 10px;border:1px solid rgba(255,255,255,.3);border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.15em;margin-bottom:12px;background:rgba(0,0,0,.12)}
      .promo-copy h2{font-size:38px;line-height:1;letter-spacing:-.045em;margin:0 0 10px;font-weight:850;color:#fff}
      .promo-copy p{font-size:14px;line-height:1.5;color:rgba(255,255,255,.82);margin:0 0 18px;max-width:520px}
      .promo-copy button{height:42px;padding:0 17px;border:0;border-radius:999px;background:#fff;color:#111;font-size:12px;font-weight:850;cursor:pointer;box-shadow:0 7px 18px rgba(0,0,0,.13)}
      .promo-visual{position:relative;height:100%;display:flex;align-items:center;justify-content:center;z-index:2}
      .promo-visual img{position:relative;z-index:2;max-width:92%;max-height:195px;object-fit:contain;filter:drop-shadow(0 18px 20px rgba(0,0,0,.26));mix-blend-mode:multiply}
      .promo-glow{position:absolute;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.22);filter:blur(1px);opacity:.65}
      .promo-arrow{position:absolute;z-index:7;top:50%;transform:translateY(-50%);width:38px;height:38px;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:rgba(0,0,0,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font-size:27px;line-height:1;display:grid;place-items:center;cursor:pointer}
      .promo-prev{left:14px}.promo-next{right:14px}
      .promo-dots{position:absolute;z-index:7;left:42px;bottom:15px;display:flex;gap:7px;align-items:center}
      .promo-dot{width:7px;height:7px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.42);cursor:pointer;transition:.25s ease}
      .promo-dot.on{width:24px;background:#fff}
      .product-search-wrap{display:flex;align-items:center;gap:10px;margin:18px 0 14px;max-width:680px}
      .product-search-box{flex:1;height:50px;border:1px solid #dcdfe3;background:#fff;display:flex;align-items:center;padding:0 15px;gap:10px;border-radius:10px}
      .product-search-box svg{width:20px;height:20px;stroke:#777;fill:none;stroke-width:2;flex:0 0 auto}
      .product-search-box input{width:100%;height:100%;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:#111}
      .product-search-box input::placeholder{color:#9aa0a6}
      .product-search-btn{height:50px;padding:0 20px;border:0;border-radius:10px;background:#111;color:#fff;font-size:14px;font-weight:800;cursor:pointer}
      .product-search-clear{height:50px;padding:0 14px;border:1px solid #dcdfe3;border-radius:10px;background:#fff;color:#555;font-size:13px;font-weight:700;cursor:pointer}
      .product-empty{padding:48px 10px;text-align:center;color:#777;border-top:1px solid #eee;border-bottom:1px solid #eee}
      @media(max-width:820px){
        .promo-slide{height:205px;padding:24px 54px 24px 34px;grid-template-columns:1.2fr .8fr}
        .promo-copy h2{font-size:31px}.promo-copy p{font-size:13px}.promo-visual img{max-height:165px}.promo-glow{width:190px;height:190px}.promo-dots{left:34px}
      }
      @media(max-width:620px){
        .promo-slider{margin:14px 0 14px;border-radius:16px}
        .promo-slide{height:176px;padding:19px 42px 24px 20px;grid-template-columns:1.45fr .55fr}
        .promo-copy h2{font-size:24px;line-height:1.03;margin-bottom:7px}.promo-copy p{font-size:11px;line-height:1.35;margin-bottom:12px;max-width:250px}.promo-ey{height:22px;font-size:7.5px;margin-bottom:9px}.promo-copy button{height:35px;padding:0 13px;font-size:10px}.promo-visual img{max-height:120px;max-width:110%;transform:translateX(5px)}.promo-glow{width:140px;height:140px}.promo-arrow{width:31px;height:31px;font-size:22px}.promo-prev{left:7px}.promo-next{right:7px}.promo-dots{left:20px;bottom:10px}.promo-dot.on{width:19px}
        .product-search-wrap{margin:14px 0 12px;gap:8px;max-width:none}
        .product-search-box{height:46px;border-radius:9px;padding:0 12px}
        .product-search-box input{font-size:14px}
        .product-search-btn{height:46px;padding:0 15px;font-size:13px;border-radius:9px}
        .product-search-clear{display:none}
      }
    `;
    document.head.appendChild(st);

    window.rentcamSearch=function(){
      const input=document.getElementById('productSearchInput');
      const value=(input?.value||'').trim();
      const u=new URLSearchParams(location.search);
      const cat=u.get('cat')||'';
      let path='/produk';
      const n=new URLSearchParams();
      if(cat) n.set('cat',cat);
      if(value) n.set('q',value);
      const qs=n.toString();
      if(qs) path+='?'+qs;
      go(path);
    };

    window.rentcamClearSearch=function(){
      const u=new URLSearchParams(location.search);
      const cat=u.get('cat')||'';
      go(cat?'/produk?cat='+encodeURIComponent(cat):'/produk');
    };


    window.rentcamSelectCategory=function(category){
      const params=new URLSearchParams(location.search);
      if(category)params.set('cat',category);else params.delete('cat');
      go('/produk'+(params.size?'?'+params.toString():''));
    };
    window.products=function(){
      window.rentcamSyncProductsFromCMS?.();
      const u=new URLSearchParams(location.search),raw=u.get('cat')||'',q=(u.get('q')||'').trim(),qLower=q.toLowerCase();
      const selected=catalogGroups.find(g=>g.key===raw.toLowerCase()||g.title===raw||g.aliases.includes(raw.toLowerCase()))?.key||'';
      const active=P.filter(p=>p.active!==false&&p.deleted!==true&&p._cmsActive!==false);
      const a=active.filter(p=>(!selected||rentcamCatalogGroup(p)===selected)&&(!qLower||`${p.name} ${p.brand||''} ${p.cat||''} ${p.sku||''}`.toLowerCase().includes(qLower)));
      const groups=catalogGroups.filter(g=>active.some(p=>rentcamCatalogGroup(p)===g.key));
      const link=k=>{const s=new URLSearchParams();if(k)s.set('cat',k);if(q)s.set('q',q);return '/produk'+(s.size?'?'+s:'')};
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${selected?esc(catalogGroups.find(g=>g.key===selected).title):'Semua Produk'}</h1><p>${a.length} produk · Pilih kategori sesuai kebutuhan Anda</p></div>${promoMarkup()}<div class="product-search-wrap"><div class="product-search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="productSearchInput" value="${esc(q)}" placeholder="Cari produk..." onkeydown="if(event.key==='Enter')rentcamSearch()"></div><button class="product-search-btn" onclick="rentcamSearch()">Cari</button></div><div class="catalog-filter-row"><label class="catalog-filter-field" for="catalogCategory"><span>Kategori produk</span><select id="catalogCategory" onchange="rentcamSelectCategory(this.value)"><option value="" ${!selected?'selected':''}>Semua kategori</option>${groups.map(g=>`<option value="${esc(g.key)}" ${selected===g.key?'selected':''}>${esc(g.title)}</option>`).join('')}</select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></label><span class="catalog-filter-count">${a.length} produk</span></div>${a.length?catalogGroups.filter(g=>!selected||g.key===selected).map(g=>{const items=a.filter(p=>rentcamCatalogGroup(p)===g.key).sort((x,y)=>String(x.name).localeCompare(String(y.name)));return items.length?`<section class="catalog-group"><header><h2>${esc(g.title)}</h2><span>${items.length} produk</span></header><div class="products-grid">${items.map(pc).join('')}</div></section>`:''}).join(''):'<div class="product-empty">Produk tidak ditemukan. Coba kata kunci lain.</div>'}</div></section>`;
    };

    const app=document.getElementById('app');
    if(app && !app.dataset.promoObserver){
      app.dataset.promoObserver='1';
      new MutationObserver(()=>requestAnimationFrame(mountPromo)).observe(app,{childList:true,subtree:false});
    }
    if(location.pathname==='/produk' && typeof render==='function'){
      render();
      requestAnimationFrame(mountPromo);
    }
    return true;
  }

  let tries=0; const t=setInterval(()=>{tries++; if(install()||tries>50) clearInterval(t)},100);
})();
