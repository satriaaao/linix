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
    {key:'accessories',title:'Aksesori',aliases:['accessories','aksesori','electronic control','electronic-control','matte box','matte-box','follow focus','follow-focus','filters']},
  ];
  const GENERAL_PRODUCTS=[];
  function catalogList(){
    const seen=new Set(),out=[];
    const add=g=>{
      if(!g||!g.key||seen.has(g.key))return;
      seen.add(g.key);
      out.push({...g,aliases:[...(g.aliases||[]),g.key,String(g.title||'').toLowerCase()]});
    };
    catalogGroups.forEach(add);
    (window.RENTCAM_CMS_CONFIG?.mainCategories||[]).filter(x=>x.active!==false&&x.deleted!==true).sort((a,b)=>(a.sort||999)-(b.sort||999)).forEach(x=>add({key:String(x.id),title:x.name||x.id,aliases:[String(x.id).toLowerCase(),String(x.name||'').toLowerCase()]}));
    return out;
  }
  function ensureGeneralProducts(){
    if(typeof P==='undefined'||!Array.isArray(P))return;
    if(!window.RENTCAM_CMS_CONFIG?.generalProductsEnabled)return;
    const byId=new Set(P.map(p=>String(p.id)));
    GENERAL_PRODUCTS.forEach(p=>{if(!byId.has(String(p.id)))P.push({...p})});
  }
  window.rentcamCatalogGroup=function(p){
    const c=String(p.mainCategory||p.cat||p.category||'').toLowerCase();
    if(c==='package'||c==='paket'||/\bpaket\b/i.test(p.name||''))return 'package';
    if(['cinema','camera','kamera'].includes(c)&&/alexa|venice|raptor|komodo|burano|cinema camera|pxw-fs/i.test(p.name||''))return 'cinema';
    return catalogList().find(g=>g.aliases.includes(c))?.key||'accessories';
  };

  let promoIndex=0;
  let promoTimer=null;

  function promoItems(){
    if(window.RentcamWebsiteDesign)return window.RentcamWebsiteDesign.getCatalogSlides(window.RENTCAM_CMS_CONFIG||{});
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
    if(!items.length)return '';
    promoIndex%=items.length;
    return `<div class="promo-slider" id="promoSlider">
      <div class="promo-track" id="promoTrack" style="transform:translateX(-${promoIndex*100}%);">
        ${items.map((s,i)=>`<article class="promo-slide ${s.cls||'promo-dark'}" data-promo-index="${i}" ${s.image?`style="--rc-promo-image:url(${esc(JSON.stringify(s.image))})"`:''}>
          <div class="promo-copy">
            <span class="promo-ey">${esc(s.ey)}</span>
            <h2>${esc(s.title)}</h2>
            <p>${esc(s.text)}</p>
            <button data-go="${esc(s.href)}">${esc(s.cta)}</button>
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
    if(!count)return;
    promoIndex=((Number(i)||0)%count+count)%count;
    applyPromo();
    restartPromo();
  };
  window.rentcamPromoNext=function(){
    if(!promoItems().length)return;
    promoIndex=(promoIndex+1)%promoItems().length;
    applyPromo();
    restartPromo();
  };
  window.rentcamPromoPrev=function(){
    if(!promoItems().length)return;
    promoIndex=(promoIndex-1+promoItems().length)%promoItems().length;
    applyPromo();
    restartPromo();
  };
  function restartPromo(){
    clearInterval(promoTimer);
    if(!document.getElementById('promoSlider')||promoItems().length<2) return;
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
    ensureGeneralProducts();

    const old=document.getElementById('rentcam-product-search-style');
    if(old) old.remove();
    const st=document.createElement('style');
    st.id='rentcam-product-search-style';
    st.textContent=`
      html body #app .catalog-filter-row{display:flex!important;align-items:center!important;gap:12px!important;margin:16px 0 26px!important;width:100%!important;max-width:680px!important}
      html body #app .catalog-filter-field{position:relative!important;display:block!important;flex:1!important;width:320px!important;max-width:100%!important;min-width:0!important;margin:0!important}
      html body #app .catalog-filter-field>span{display:block!important;font-size:11px!important;font-weight:650!important;color:#777!important;margin:0 0 7px!important}
      html body #app .catalog-filter-field select{appearance:none!important;-webkit-appearance:none!important;display:block!important;width:100%!important;height:48px!important;padding:0 44px 0 15px!important;border:1px solid #dedede!important;border-radius:12px!important;background:#fff!important;color:#111!important;font:inherit!important;font-size:14px!important;font-weight:650!important;cursor:pointer!important;box-sizing:border-box!important}
      html body #app .catalog-filter-field select:focus-visible{outline:2px solid #111!important;outline-offset:3px!important}
      html body #app .catalog-filter-field svg{position:absolute!important;right:15px!important;bottom:15px!important;width:18px!important;height:18px!important;fill:none!important;stroke:#555!important;stroke-width:1.8!important;pointer-events:none!important}
      html body #app .catalog-filter-count{font-size:12px!important;color:#777!important;white-space:nowrap!important;padding-top:21px!important}
      .catalog-group{margin:26px 0 36px}.catalog-group header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.catalog-group h2,.catalog-group-title{font-size:24px;margin:0;letter-spacing:-.03em}.catalog-group-title{appearance:none;border:0;background:transparent;color:#111;font:inherit;font-size:24px;font-weight:900;padding:0;text-align:left;cursor:pointer}.catalog-group-title:hover{text-decoration:underline;text-underline-offset:5px}.catalog-group header span{color:#777;font-size:12px}
      @media(max-width:620px){html body #app .catalog-filter-field{flex:1!important;width:auto!important;min-width:0!important}html body #app .catalog-filter-row{gap:12px!important;margin:14px 0 24px!important}html body #app .catalog-filter-field select{font-size:16px!important}.catalog-group h2{font-size:21px}}

      html body #app .catalog-cascade-trigger{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;height:48px!important;padding:0 15px!important;border:1px solid #dedede!important;border-radius:12px!important;background:#fff!important;color:#111!important;font:inherit!important;font-size:14px!important;font-weight:650!important;text-align:left!important;cursor:pointer!important}
      html body #app .catalog-cascade-trigger svg{position:static!important;width:18px!important;height:18px!important;flex:0 0 18px!important}
      html body #app .catalog-cascade-panel{position:absolute!important;top:calc(100% + 8px)!important;left:0!important;right:0!important;z-index:80!important;background:#fff!important;border:1px solid #e3e3e3!important;border-radius:14px!important;padding:6px!important;box-shadow:0 12px 35px rgba(0,0,0,.14)!important;max-height: min(440px,55vh)!important;overflow-y:auto!important;overscroll-behavior:contain!important}
      html body #app .catalog-cascade-panel[hidden],html body #app .catalog-cascade-brands[hidden]{display:none!important}
      html body #app .catalog-cascade-option{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;min-height:44px!important;padding:11px 13px!important;border:0!important;border-radius:9px!important;background:#fff!important;color:#222!important;font:inherit!important;font-size:14px!important;text-align:left!important;cursor:pointer!important}
      html body #app .catalog-cascade-option:hover,html body #app .catalog-cascade-option:focus-visible{background:#f2f3f4!important}
      html body #app .catalog-cascade-parent[aria-expanded="true"]{background:#f2f3f4!important;font-weight:750!important}
      html body #app .catalog-cascade-brands{margin:3px 0 7px 14px!important;padding-left:8px!important;border-left:2px solid #e8e8e8!important}
      html body #app .catalog-cascade-brands .catalog-cascade-option{font-size:13px!important;color:#555!important}
      html body #app .catalog-cascade-trigger:focus-visible{outline:2px solid #111!important;outline-offset:3px!important}
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


    const textKey=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    function distance(a,b){
      const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
      for(let i=0;i<=a.length;i++)d[i][0]=i;
      for(let j=0;j<=b.length;j++)d[0][j]=j;
      for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
      }
      return d[a.length][b.length];
    }
    function matchesProduct(p,q){
      const query=textKey(q),hay=textKey([p.name,p.brand,p.cat,p.sku].join(' '));
      if(!query)return true;
      const words=hay.split(' ');
      return query.split(' ').every(t=>hay.includes(t)||(t.length>=4&&words.some(w=>Math.abs(w.length-t.length)<=2&&distance(t,w)<=(t.length>5?2:1))));
    }
    const isNewProduct=p=>p?.labelText==='NEW'||p?.label==='NEW'||/new|baru/i.test([p?.badge,p?.labelText,p?.label,p?.promoName,p?.discountLabel].join(' '));
    const isPromoProduct=p=>Number(p?.discountPercent||p?.discount||0)>0||/promo|diskon/i.test([p?.badge,p?.labelText,p?.label,p?.promoName,p?.discountLabel].join(' '));
    const cleanLabel=s=>String(s||'').trim().toLowerCase();
    const productLabels=p=>[p?.labelText,p?.label,p?.badge,p?.promoName,p?.discountLabel,Number(p?.discountPercent||p?.discount||0)>0?'DISKON':''].map(cleanLabel).filter(Boolean);
    const queryLabels=s=>String(s||'').split(',').map(cleanLabel).filter(Boolean);
    const matchesLabels=(p,labels)=>!labels.length||labels.some(l=>productLabels(p).some(x=>x===l||x.includes(l)||l.includes(x)));
    const labelTitle=labels=>labels.length?labels.map(x=>x.toUpperCase()).join(' + '):'';
    window.rentcamMatchesProduct=matchesProduct;
    function chosenCategories(u){return [...new Set(String(u.get('cats')||u.get('cat')||'').split(',').map(raw=>catalogList().find(g=>g.key===raw.toLowerCase()||g.title===raw||g.aliases.includes(raw.toLowerCase()))?.key).filter(Boolean))];}
    window.rentcamCatalogSelectedCategories=()=>chosenCategories(new URLSearchParams(location.search));
    window.rentcamCatalogCategoryOptions=()=>catalogList().filter(g=>P.some(p=>p.active!==false&&p.deleted!==true&&p._cmsActive!==false&&rentcamCatalogGroup(p)===g.key)).map(g=>({key:g.key,title:g.title}));
    function categoryChecklist(groups,active){const u=new URLSearchParams(location.search),chosen=chosenCategories(u),brands=[...new Set(active.map(p=>p.brand).filter(Boolean))].sort();return `<div class="rc-checklist-heading">Pilih kategori <small>Bisa pilih lebih dari satu</small></div>${groups.map(g=>`<label class="rc-category-check"><input type="checkbox" data-catalog-check="${esc(g.key)}" ${chosen.includes(g.key)?'checked':''}><span class="rc-category-symbol" aria-hidden="true">${categoryIcon(g.key)}</span><span>${esc(g.title)}</span></label>`).join('')}<label class="rc-checklist-brand">Brand<select data-catalog-brand><option value="">Semua brand</option>${brands.map(b=>`<option value="${esc(b)}" ${u.get('brand')===b?'selected':''}>${esc(b)}</option>`).join('')}</select></label><button type="button" class="rc-clear-categories" data-clear-categories>Reset kategori & brand</button>`;}
    function categoryIcon(key){const path=key==='catalog'?'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>':key==='cinema'||key==='camera'?'<rect x="3" y="7" width="13" height="12" rx="3"/><path d="m16 11 5-3v10l-5-3M7 7V4h6"/>':key==='lens'?'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 3 4 5M21 12l-5 4M12 21l-4-5M3 12l5-4"/>':key==='lighting'?'<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0l-1 3H9l-1-3Z"/>':'<path d="m12 3 9 5v8l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v8"/>';return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';}
    function updateCategoryChoice(reset=false){const u=new URLSearchParams(location.search),chosen=reset?[]:[...document.querySelectorAll('[data-catalog-check]:checked')].map(x=>x.dataset.catalogCheck),brand=reset?'':document.querySelector('[data-catalog-brand]')?.value||'';u.delete('cat');if(chosen.length)u.set('cats',chosen.join(','));else u.delete('cats');if(brand)u.set('brand',brand);else u.delete('brand');history.replaceState({},'','/produk'+(u.size?'?'+u:''));if(reset){document.querySelectorAll('[data-catalog-check]').forEach(x=>x.checked=false);const select=document.querySelector('[data-catalog-brand]');if(select)select.value='';}const label=document.querySelector('#catalogCategory>.rc-category-trigger-label');if(label)label.textContent=chosen.length===1?catalogList().find(g=>g.key===chosen[0])?.title:chosen.length?chosen.length+' kategori dipilih':'Semua produk';window.rentcamSearch();}
    document.addEventListener('change',e=>{if(e.target.matches('[data-catalog-check],[data-catalog-brand]'))updateCategoryChoice();});
    document.addEventListener('click',e=>{if(e.target.closest('[data-clear-categories]'))updateCategoryChoice(true);});
    function resultsMarkup(items,selected){
      const ordered=catalogList().flatMap(g=>items.filter(p=>rentcamCatalogGroup(p)===g.key).sort((x,y)=>String(x.name).localeCompare(String(y.name))));
      items=window.RentcamCatalogPaging?window.RentcamCatalogPaging.select(ordered):ordered;
      if(!items.length)return '<div class="product-empty rc-price-empty">Produk tidak ditemukan. Coba kata kunci atau brand lain.</div>';
      return catalogList().map(g=>{
        const list=items.filter(p=>rentcamCatalogGroup(p)===g.key).sort((x,y)=>String(x.name).localeCompare(String(y.name)));
        return list.length?`<section class="catalog-group"><header><button class="catalog-group-title" type="button" onclick="go('/produk?cat=${esc(g.key)}')">${esc(g.title)}</button><span>${list.length} produk</span></header><div class="products-grid">${list.map(pc).join('')}</div></section>`:'';
      }).join('')+(window.RentcamCatalogPaging?.footer()||'');
    }
    let searchDelay;
    window.rentcamSearch=function(){
      clearTimeout(searchDelay);
      const input=document.getElementById('productSearchInput');
      if(!input)return;
      const u=new URLSearchParams(location.search),value=input.value.trim();
      if(value)u.set('q',value);else u.delete('q');
      history.replaceState({},'', '/produk'+(u.size?'?'+u.toString():''));
      const raw=u.get('cat')||'';
      const allGroups=catalogList();
      const selected=allGroups.find(g=>g.key===raw.toLowerCase()||g.title===raw||g.aliases.includes(raw.toLowerCase()))?.key||'';
      const chosen=chosenCategories(u);
      const brand=u.get('brand')||'';
      const promoOnly=u.get('promo')==='1',newOnly=u.get('new')==='1',labels=queryLabels(u.get('label'));
      const items=P.filter(p=>p.active!==false&&p.deleted!==true&&p._cmsActive!==false&&(!chosen.length||chosen.includes(rentcamCatalogGroup(p)))&&(!brand||String(p.brand).toLowerCase()===brand.toLowerCase())&&(!promoOnly||isPromoProduct(p))&&(!newOnly||isNewProduct(p))&&matchesLabels(p,labels)&&matchesProduct(p,value));
      const results=document.getElementById('catalogResults');
      if(results)results.innerHTML=resultsMarkup(items,selected);
      const count=document.getElementById('catalogResultCount');
      if(count)count.textContent=items.length+' produk · '+(labels.length?'Produk label '+labelTitle(labels):promoOnly?'Produk promo dan diskon':newOnly?'Produk baru':'Pilih kategori sesuai kebutuhan Anda');
    };
    window.rentcamLiveSearch=function(event){
      if(event?.isComposing)return;
      clearTimeout(searchDelay);searchDelay=setTimeout(window.rentcamSearch,180);
    };
    window.rentcamClearSearch=function(){const input=document.getElementById('productSearchInput');if(input)input.value='';rentcamSearch()};

    window.rentcamToggleCategories=function(){
      const panel=document.getElementById('catalogCascadePanel'),trigger=document.getElementById('catalogCategory');
      if(!panel||!trigger)return;
      panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));
    };
    window.rentcamExpandBrands=function(button){
      const panel=document.getElementById(button.getAttribute('aria-controls'));if(!panel)return;
      const open=panel.hidden;
      document.querySelectorAll('.catalog-cascade-brands').forEach(p=>p.hidden=true);
      document.querySelectorAll('.catalog-cascade-parent').forEach(b=>b.setAttribute('aria-expanded','false'));
      panel.hidden=!open;button.setAttribute('aria-expanded',String(open));
    };
    window.rentcamChooseBrand=function(button){
      rentcamSelectFilter(JSON.stringify([button.dataset.category,button.dataset.brand||'']));
    };
    if(!window.rentcamCascadeEvents){
      window.rentcamCascadeEvents=true;
      document.addEventListener('click',event=>{
        if(event.target.closest?.('#catalogCascade'))return;
        const panel=document.getElementById('catalogCascadePanel');if(panel)panel.hidden=true;
        document.getElementById('catalogCategory')?.setAttribute('aria-expanded','false');
      });
      document.addEventListener('keydown',event=>{
        if(event.key!=='Escape')return;
        const panel=document.getElementById('catalogCascadePanel');
        if(panel&&!panel.hidden){panel.hidden=true;const trigger=document.getElementById('catalogCategory');trigger?.setAttribute('aria-expanded','false');trigger?.focus()}
      });
    }
    window.rentcamSelectFilter=function(value){
      clearTimeout(searchDelay);
      let selection;try{selection=JSON.parse(value)}catch(e){return}
      if(!Array.isArray(selection))return;
      const [category,brand]=selection,params=new URLSearchParams(location.search),input=document.getElementById('productSearchInput');
      if(input){if(input.value.trim())params.set('q',input.value.trim());else params.delete('q')}
      params.delete('cats');if(category)params.set('cat',category);else params.delete('cat');
      if(brand)params.set('brand',brand);else params.delete('brand');
      params.delete('promo');params.delete('new');params.delete('label');
      go('/produk'+(params.size?'?'+params.toString():''));
    };
    window.rentcamSelectCategory=function(category){
      clearTimeout(searchDelay);
      const params=new URLSearchParams(location.search),input=document.getElementById('productSearchInput');
      if(input){if(input.value.trim())params.set('q',input.value.trim());else params.delete('q')}
      params.delete('cats');if(category)params.set('cat',category);else params.delete('cat');
      params.delete('brand');
      params.delete('promo');params.delete('new');params.delete('label');
      go('/produk'+(params.size?'?'+params.toString():''));
    };
    window.rentcamSelectBrand=function(brand){
      clearTimeout(searchDelay);
      const params=new URLSearchParams(location.search),input=document.getElementById('productSearchInput');
      if(input){if(input.value.trim())params.set('q',input.value.trim());else params.delete('q')}
      if(brand)params.set('brand',brand);else params.delete('brand');
      params.delete('promo');params.delete('new');params.delete('label');
      go('/produk'+(params.size?'?'+params.toString():''));
    };
    window.products=function(){
      window.rentcamSyncProductsFromCMS?.();
      const u=new URLSearchParams(location.search),raw=u.get('cat')||'',q=(u.get('q')||'').trim(),qLower=q.toLowerCase();
      const allGroups=catalogList();
      const selected=allGroups.find(g=>g.key===raw.toLowerCase()||g.title===raw||g.aliases.includes(raw.toLowerCase()))?.key||'';
      const promoOnly=u.get('promo')==='1',newOnly=u.get('new')==='1',labels=queryLabels(u.get('label'));
      const active=P.filter(p=>p.active!==false&&p.deleted!==true&&p._cmsActive!==false);
      const chosen=chosenCategories(u);
      const scoped=active.filter(p=>!chosen.length||chosen.includes(rentcamCatalogGroup(p)));
      const brands=[...new Set(scoped.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const brand=u.get('brand')||'';
      const a=scoped.filter(p=>(!brand||String(p.brand).toLowerCase()===brand.toLowerCase())&&(!promoOnly||isPromoProduct(p))&&(!newOnly||isNewProduct(p))&&matchesLabels(p,labels)&&matchesProduct(p,q));
      const groups=allGroups.filter(g=>active.some(p=>rentcamCatalogGroup(p)===g.key));
      const link=k=>{const s=new URLSearchParams();if(k)s.set('cat',k);if(q)s.set('q',q);if(labels.length)s.set('label',labels.join(','));return '/produk'+(s.size?'?'+s:'')};
      const baseTitle=selected?(allGroups.find(g=>g.key===selected)?.title||selected):'';
      const pageTitle=labels.length?'Produk '+labelTitle(labels):promoOnly?'Produk Promo':newOnly?'Produk Baru':baseTitle;
      const countText=labels.length?'Produk sesuai label':promoOnly?'Produk promo dan diskon':newOnly?'Produk baru':'Pilih kategori sesuai kebutuhan Anda';
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${pageTitle?esc(pageTitle):'Semua Produk'}</h1><p id="catalogResultCount">${a.length} produk · ${countText}</p></div>${promoMarkup()}<div class="product-search-wrap"><div class="product-search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="productSearchInput" value="${esc(q)}" placeholder="Cari produk..." oninput="rentcamLiveSearch(event)" oncompositionend="rentcamLiveSearch(event)" onkeydown="if(event.key==='Enter'){event.preventDefault();rentcamSearch()}"></div><button class="product-search-btn" onclick="rentcamSearch()">Cari</button></div><div class="catalog-filter-row"><div class="catalog-filter-field catalog-cascade" id="catalogCascade"><span>Kategori &amp; brand</span><button type="button" class="catalog-cascade-trigger" id="catalogCategory" aria-expanded="false" aria-controls="catalogCascadePanel" onclick="rentcamToggleCategories()">${categoryIcon('catalog')}<span class="rc-category-trigger-label">${chosen.length?chosen.length>1?chosen.length+' kategori dipilih':esc(allGroups.find(g=>g.key===chosen[0])?.title||'Kategori'):selected?esc(baseTitle)+(brand?' · '+esc(brand):''):labels.length?'Label '+esc(labelTitle(labels)):promoOnly?'Produk Promo':newOnly?'Produk Baru':'Semua produk'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div class="catalog-cascade-panel" id="catalogCascadePanel" hidden>${categoryChecklist(groups,active)}</div></div></div><div id="catalogResults" aria-live="polite">${resultsMarkup(a,selected)}</div></div></section>`;
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
