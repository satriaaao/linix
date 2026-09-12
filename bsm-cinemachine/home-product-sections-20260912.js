/* Rentcam — homepage category product sections */
(function(){
  const sections=[
    {key:'cinema',title:'Kamera Cinema',subtitle:'Cinema camera untuk film, commercial, series dan content production.',categories:['cinema']},
    {key:'camera',title:'Kamera',subtitle:'Kamera untuk kebutuhan foto dan video.',categories:['camera','kamera']},
    {key:'lens',title:'Lensa',subtitle:'Prime dan anamorphic lens untuk karakter visual sinema.',categories:['lens','lensa']},
    {key:'lighting',title:'Lighting',subtitle:'Lighting profesional untuk produksi sinema.',categories:['lighting']},
    {key:'audio',title:'Audio',subtitle:'Production sound profesional.',categories:['audio']},
    {key:'wireless',title:'Monitor & Wireless',subtitle:'Monitoring gambar dan transmisi video untuk kru produksi.',categories:['wireless','monitor']},
    {key:'grip',title:'Grip & Support',subtitle:'Tripod head dan camera support untuk pergerakan yang stabil.',categories:['grip']},
    {key:'package',title:'Paket',subtitle:'Paket equipment siap produksi.',categories:['package','paket']}
  ];
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function productSections(){
    let products=[];try{if(Array.isArray(P))products=P}catch(e){}
    const config=window.RENTCAM_CMS_CONFIG||{},usedIds=new Set(),usedNames=new Set(),usedImages=new Set();
    return sections.map(s=>{
      const limit=Number(config.homepage?.['products'+s.key[0].toUpperCase()+s.key.slice(1)]||8);
      const items=products.filter(p=>{
        if(p.active===false||p.deleted===true||p._cmsActive===false)return false;
        const category=String(p.mainCategory||p.cat||p.category||'').toLowerCase();
        if(window.rentcamCatalogGroup)return window.rentcamCatalogGroup(p)===s.key;
        if(s.key==='cinema')return ['camera','kamera','cinema'].includes(category)&&/alexa|venice|raptor|komodo|burano/i.test(p.name||'');
        return s.categories.includes(category);
      }).reduce((out,p)=>{
        const override=config.productOverrides?.[p.id]||{},v={...p,...override};
        if(v.active===false||v.deleted===true)return out;
        const img=v.images?.[0]||v.image||v.img||'',name=String(v.name||'').trim().toLowerCase();
        if(!img||!name||out.length>=limit||usedIds.has(String(v.id))||usedNames.has(name)||usedImages.has(img))return out;
        usedIds.add(String(v.id));usedNames.add(name);usedImages.add(img);
        out.push({...v,img});return out;
      },[]);
      return {...s,items};
    }).filter(s=>s.items.length);
  }

  function installStyle(){
    if(document.getElementById('rentcam-home-sections-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-home-sections-style';
    st.textContent=`

      #app .home-cat-strip{display:none!important}
      #app .home-product-controls{display:flex!important;align-items:center!important;gap:12px!important;margin:0 0 18px!important}
      #app .home-product-controls label{font-size:12px!important;color:#777!important}
      #app .home-product-controls select{appearance:auto!important;min-width:0!important;flex:1!important;max-width:300px!important;height:44px!important;border:1px solid #ddd!important;border-radius:10px!important;background:#fff!important;color:#111!important;padding:0 12px!important;font:inherit!important;font-size:14px!important;font-weight:650!important}
      #app .home-product-head{margin-bottom:16px!important}
      #app .home-product-view{font-size:12px!important;flex:0 0 auto!important}
      @media(max-width:620px){
        #app .home-product-controls{gap:9px!important}
        #app .home-product-controls label{display:none!important}
        #app .home-product-controls select{font-size:16px!important}
        #app .hero{height:230px!important;min-height:0!important;padding:24px 20px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important}
        #app .hero h1{font-size:30px!important;line-height:1.08!important;margin:10px 0!important}
        #app .hero p{font-size:12px!important;line-height:1.5!important;margin:0!important}
        #app .hero small{font-size:9px!important}
      }
      #app .home-product-sections{background:#f7f7f5!important;padding:0 0 28px!important}
      #app .home-product-section{padding:26px 0 0!important}
      #app .home-product-section+.home-product-section{border-top:1px solid #e6e6e3!important}
      #app .home-product-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:16px!important;margin-bottom:22px!important}
      #app .home-product-head h2{margin:0!important;font-size:28px!important;line-height:1!important;letter-spacing:-.04em!important;color:#111!important}
      #app .home-product-head p{margin:8px 0 0!important;font-size:13px!important;line-height:1.5!important;color:#777!important}
      #app .home-product-view{border:0!important;background:transparent!important;color:#111!important;font-size:12px!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:4px!important;cursor:pointer!important;padding:8px 0!important;white-space:nowrap!important}
      #app .home-product-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px!important}
      #app .home-category-card{min-width:0!important;background:#fff!important;border:1px solid #e9e9e6!important;border-radius:15px!important;overflow:hidden!important;cursor:pointer!important;display:flex!important;flex-direction:column!important;transition:transform .16s ease,box-shadow .16s ease!important;position:relative!important}
      #app .home-category-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 30px rgba(0,0,0,.07)!important}
      #app .home-category-image{position:relative!important;width:100%!important;aspect-ratio:1.12/1!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      #app .home-category-image img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}
      #app .home-category-badge{position:absolute!important;left:11px!important;top:11px!important;background:#111!important;color:#fff!important;border-radius:999px!important;padding:7px 9px!important;font-size:8px!important;font-weight:900!important;letter-spacing:.05em!important}
      #app .home-category-body{padding:13px 14px 14px!important;display:flex!important;flex-direction:column!important;flex:1!important}
      #app .home-category-brand{font-size:9px!important;color:#8a8a8a!important;letter-spacing:.07em!important;text-transform:uppercase!important;margin-bottom:6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #app .home-category-name{font-size:15px!important;line-height:1.28!important;font-weight:800!important;color:#111!important;min-height:39px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
      #app .home-category-actions{display:grid!important;grid-template-columns:minmax(0,1fr) 42px!important;gap:8px!important;margin-top:auto!important;padding-top:14px!important}
      #app .home-add-cart,#app .home-open-cart{height:40px!important;border:0!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;transition:transform .14s ease,background .14s ease!important}
      #app .home-add-cart{background:#111!important;color:#fff!important;font-size:11px!important;font-weight:850!important;gap:7px!important;padding:0 12px!important}
      #app .home-open-cart{background:#f1f1ef!important;color:#111!important;border:1px solid #e2e2df!important;padding:0!important}
      #app .home-add-cart svg,#app .home-open-cart svg{width:17px!important;height:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #app .home-add-cart:hover{background:#222!important}
      #app .home-open-cart:hover{background:#e8e8e5!important}
      #app .home-add-cart:active,#app .home-open-cart:active{transform:scale(.97)!important}
      @media(max-width:900px){#app .home-product-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:620px){
        #app .home-product-sections{padding-bottom:34px!important}
        #app .home-product-section{padding:22px 0 0!important}
        #app .home-product-head{align-items:flex-end!important;margin-bottom:14px!important;gap:10px!important}
        #app .home-product-head h2{font-size:25px!important}
        #app .home-product-head p{font-size:11px!important;margin-top:5px!important;max-width:250px!important}
        #app .home-product-view{font-size:10px!important}
        #app .home-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
        #app .home-category-card{border-radius:13px!important}
        #app .home-category-image{aspect-ratio:1.2/1!important}
        #app .home-category-badge{left:8px!important;top:8px!important;padding:6px 8px!important;font-size:7px!important}
        #app .home-category-body{padding:10px 10px 10px!important}
        #app .home-category-brand{font-size:8px!important;margin-bottom:5px!important}
        #app .home-category-name{font-size:12.5px!important;min-height:32px!important}
        #app .home-category-actions{grid-template-columns:minmax(0,1fr) 36px!important;gap:6px!important;padding-top:10px!important}
        #app .home-add-cart,#app .home-open-cart{height:36px!important;border-radius:9px!important}
        #app .home-add-cart{font-size:10px!important;padding:0 8px!important;gap:5px!important}
        #app .home-add-cart svg,#app .home-open-cart svg{width:15px!important;height:15px!important}
      }
    `;
    document.head.appendChild(st);
  }

  const cartIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>`;

  function card(x,key){
    return `<article class="home-category-card" data-product-id="${esc(x.id)}" role="link" tabindex="0" aria-label="Buka detail ${esc(x.name)}" onclick="go('/produk/${esc(x.id)}')" onkeydown="if(event.key==='Enter'){go('/produk/${esc(x.id)}')}"><div class="home-category-image"><span class="home-category-badge">${esc(x.brand)}</span><img src="${x.img}" alt="${esc(x.name)}" loading="lazy"></div><div class="home-category-body"><div class="home-category-brand">${esc(x.brand)} · ${key==='package'?'Package':key}</div><div class="home-category-name">${esc(x.name)}</div><div class="home-category-actions"><button type="button" class="home-add-cart" onclick="event.stopPropagation();add('${esc(x.id)}',1)">${cartIcon}<span>Tambah</span></button><button type="button" class="home-open-cart" aria-label="Buka keranjang" onclick="event.stopPropagation();go('/cart')">${cartIcon}</button></div></div></article>`;
  }


  let selectedHomeCategory='cinema';
  window.rentcamHomeCategory=function(key){
    selectedHomeCategory=key;
    mount();
  };
  function markup(){
    const available=productSections();
    const selected=available.find(s=>s.key===selectedHomeCategory)||available[0];
    if(!selected)return '';
    return `<section class="home-product-sections"><div class="container"><section class="home-product-section home-featured"><div class="home-product-head"><div><h2>Equipment Pilihan</h2><p>Pilih kategori untuk melihat equipment yang Anda butuhkan.</p></div></div><div class="home-product-controls"><label for="homeProductCategory">Kategori</label><select id="homeProductCategory" onchange="rentcamHomeCategory(this.value)">${available.map(s=>`<option value="${esc(s.key)}" ${s.key===selected.key?'selected':''}>${esc(s.title)}</option>`).join('')}</select><button class="home-product-view" onclick="go('/produk?cat=${esc(selected.key)}')">Lihat semua →</button></div><div class="home-product-grid">${selected.items.slice(0,4).map(x=>card(x,selected.key)).join('')}</div></section></div></section>`;
  }

  function mount(){
    if(location.pathname!=='/') return;
    installStyle();
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelector('.home-cat-strip')?.remove();
    const next=markup();
    const existing=document.getElementById('rentcam-home-product-sections');
    if(existing){if(existing.dataset.productMarkup!==next){existing.dataset.productMarkup=next;existing.innerHTML=next}return;}
    const legacy=[...app.querySelectorAll('.section')].find(s=>/Latest in Rentals|ARRI Products/i.test(s.textContent||''));
    const wrap=document.createElement('div');
    wrap.id='rentcam-home-product-sections';
    wrap.dataset.productMarkup=next;
    wrap.innerHTML=next;
    if(legacy){legacy.insertAdjacentElement('beforebegin',wrap);legacy.remove();}else app.appendChild(wrap);
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
  const app=document.getElementById('app'); if(app) new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('popstate',schedule);
  document.addEventListener('rentcam-cms-updated',schedule);
  document.addEventListener('rentcam-route-change',schedule);
})();