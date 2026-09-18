/* Rentcam product CMS-native runtime v11 */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const rupiah=n=>'Rp'+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(n)||0);
  const cfg=()=>window.RENTCAM_CMS_CONFIG||{};
  let base=null;

  function currentP(){try{return Array.isArray(P)?P:null}catch(e){return null}}
  function snapshot(){const a=currentP();if(!a)return false;if(!base)base=JSON.parse(JSON.stringify(a));return true}
  function mainName(id,fallback=''){return (cfg().mainCategories||[]).find(x=>String(x.id)===String(id))?.name||fallback}
  function normalize(p,v={}){
    const images=Array.isArray(v.images)&&v.images.length?v.images.filter(Boolean):(v.image?[v.image]:(p.images?.length?p.images:[p.img].filter(Boolean)));
    const main=v.mainCategory||p.mainCategory||'';
    return {...p,...v,
      id:v.id||p.id,
      name:v.name||p.name||'',
      brand:v.brand||p.brand||'',
      cat:mainName(main,v.category||p.cat||'Other'),
      category:mainName(main,v.category||p.cat||'Other'),
      price:v.price!==undefined?Number(v.price)||0:Number(p.price)||0,
      stock:v.stock!==undefined?Number(v.stock)||0:Number(p.stock)||0,
      img:images[0]||v.image||p.img||'',image:images[0]||v.image||p.img||'',images,
      description:v.description!==undefined?v.description:(p.description||''),
      inc:Array.isArray(v.included)?v.included:(Array.isArray(p.inc)?p.inc:[]),
      included:Array.isArray(v.included)?v.included:(Array.isArray(p.inc)?p.inc:[]),
      accessories:Array.isArray(v.accessories)?v.accessories:(Array.isArray(p.accessories)?p.accessories:[]),
      spec:Array.isArray(v.spec)?v.spec:(Array.isArray(p.spec)?p.spec:[]),
      mainCategory:main,subCategory:v.subCategory||p.subCategory||'',placement:v.placement||p.placement||'catalog',sortOrder:Number(v.sortOrder??p.sortOrder??999),
      _cmsActive:v.active!==false&&v.deleted!==true,
      deleted:v.deleted===true,
      label:v.labelText||v.label||v.promoLabel||'',labelText:v.labelText||v.label||v.promoLabel||'',labelStart:v.labelStart||'',labelEnd:v.labelEnd||'',discount:Number(v.discount||v.discountPercent||0)||0,discountPercent:Number(v.discountPercent||v.discount||0)||0,discountStart:v.discountStart||'',discountEnd:v.discountEnd||'',promoName:v.promoName||v.discountLabel||'',discountLabel:v.discountLabel||v.promoName||''
    };
  }
  function syncProducts(){
    if(!snapshot())return false;
    const c=cfg(),ov=c.productOverrides||{},custom=c.customProducts||[];
    const next=base.map(p=>normalize(JSON.parse(JSON.stringify(p)),ov[p.id]||{}));
    custom.forEach(v=>{const i=next.findIndex(p=>String(p.id)===String(v.id));if(i>=0)next[i]=normalize(next[i],v);else next.push(normalize({},v))});
    next.sort((a,b)=>(Number(a.sortOrder)||999)-(Number(b.sortOrder)||999)||String(a.name).localeCompare(String(b.name)));
    const a=currentP();a.splice(0,a.length,...next);
    return true;
  }
  window.rentcamSyncProductsFromCMS=syncProducts;

  function installStyle(){
    if(document.getElementById('rentcam-cms-product-v11-style'))return;
    const s=document.createElement('style');s.id='rentcam-cms-product-v11-style';s.textContent=`
      #app .cms-product-price{font-weight:900;color:#111}
      #app .cms-gallery{width:100%;display:block}
      #app .cms-gallery-main{position:relative;width:100%;aspect-ratio:1/1;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;display:flex;align-items:center;justify-content:center}
      #app .cms-gallery-main img{width:100%;height:100%;object-fit:contain;background:#fff;display:block}
      #app .cms-gallery-thumbs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}
      #app .cms-gallery-thumb{aspect-ratio:1/1;border:1px solid #ddd;border-radius:10px;background:#fff;padding:4px;cursor:pointer;overflow:hidden}
      #app .cms-gallery-thumb.on{border:2px solid #111;padding:3px}
      #app .cms-gallery-thumb img{width:100%;height:100%;object-fit:contain;display:block}
      #app .cms-detail-block{margin-top:20px;padding-top:18px;border-top:1px solid #ececec}
      #app .cms-detail-block h2{font-size:18px;margin:0 0 10px}
      #app .cms-detail-block p,#app .cms-detail-block li{font-size:14px;line-height:1.65;color:#555}
      #app .cms-detail-list{margin:0;padding-left:20px}
      #app .cms-included-block{padding:26px 0!important}
      #app .cms-included-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:14px}
      #app .cms-included-head>div{min-width:0}
      #app .cms-included-kicker{display:block;margin-bottom:5px;color:#f26a21;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      #app .cms-included-head h2{margin:0!important}
      #app .cms-included-count{flex:0 0 auto;display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#f4f6f8;color:#647083;font-size:10px;font-weight:850;white-space:nowrap}
      #app .cms-included-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      #app .cms-included-item{display:flex;align-items:flex-start;gap:10px;min-height:48px;padding:11px 12px;border:1px solid #e7ebef;border-radius:12px;background:#fafbfc;color:#2d394b;font-size:12px;font-weight:650;line-height:1.4}
      #app .cms-included-item.is-extra{display:none}
      #app .cms-included-block.is-expanded .cms-included-item.is-extra{display:flex}
      #app .cms-included-check{width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:grid;place-items:center;background:#111827;color:#fff;font-size:11px;font-weight:950;margin-top:1px}
      #app .cms-included-toggle{display:flex;align-items:center;justify-content:center;width:100%;min-height:42px;margin-top:10px;border:1px solid #dfe4ea;border-radius:11px;background:#fff;color:#243247;font-size:11px;font-weight:850;cursor:pointer}
      #app .cms-included-toggle:hover{background:#f7f8fa}
      #app .cms-product-unavailable{padding:70px 20px;text-align:center;color:#777}
      #app .product-detail-simple{padding:38px 0 54px!important}
      #app .product-detail-simple .back-link{display:inline-flex!important;align-items:center!important;gap:8px!important;margin:0 0 22px!important;padding:10px 14px!important;border:1px solid #e4e4e4!important;border-radius:999px!important;color:#111!important;background:#fff!important;text-decoration:none!important;font-size:12px!important;font-weight:850!important;cursor:pointer!important}
      #app .product-detail-simple .detail-top{display:grid!important;grid-template-columns:minmax(0,1.02fr) minmax(360px,.98fr)!important;gap:44px!important;align-items:start!important}
      #app .product-detail-simple .detail-media{position:sticky!important;top:94px!important}
      #app .product-detail-simple .cms-gallery-main{border-radius:22px!important;border-color:#e8e8e5!important;box-shadow:0 24px 60px rgba(0,0,0,.05)!important}
      #app .product-detail-simple .cms-gallery-main img{padding:28px!important}
      #app .product-detail-simple .detail-brand{font-size:11px!important;letter-spacing:.14em!important;text-transform:uppercase!important;color:#777!important;font-weight:850!important;margin:4px 0 16px!important}
      #app .product-detail-simple .detail-info h1{font-size:clamp(42px,5.8vw,76px)!important;line-height:.94!important;letter-spacing:-.06em!important;margin:0 0 18px!important;color:#111!important}
      #app .product-detail-simple .detail-price{display:flex!important;align-items:end!important;gap:8px!important;margin:0 0 30px!important;font-size:18px!important}
      #app .product-detail-simple .detail-price .cms-product-price{font-size:24px!important}
      #app .product-detail-simple .detail-sections{border-top:1px solid #e8e8e5!important}
      #app .product-detail-simple .detail-section,#app .product-detail-simple .cms-detail-block{padding:24px 0!important;border-top:0!important;border-bottom:1px solid #e8e8e5!important;margin:0!important}
      #app .product-detail-simple .detail-section h2,#app .product-detail-simple .cms-detail-block h2{font-size:22px!important;letter-spacing:-.025em!important;margin:0 0 12px!important}
      #app .product-detail-simple .detail-section p{font-size:15px!important;line-height:1.72!important;color:#555!important;max-width:680px!important}
      #app .product-detail-simple .spec-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;border:1px solid #ededed!important;border-radius:16px!important;overflow:hidden!important}
      #app .product-detail-simple .spec-row{display:flex!important;justify-content:space-between!important;gap:12px!important;padding:14px 16px!important;border:0!important;border-bottom:1px solid #ededed!important;background:#fff!important}
      #app .product-detail-simple .spec-row:nth-child(odd){border-right:1px solid #ededed!important}
      #app .product-detail-simple .spec-row span{color:#777!important;font-size:12px!important}
      #app .product-detail-simple .spec-row b{font-size:13px!important;color:#111!important;text-align:right!important}
      #app .product-detail-simple .product-card-cart-btn{height:54px!important;border-radius:14px!important;background:#111!important;color:#fff!important;font-weight:900!important}
      @media(max-width:900px){#app .product-detail-simple .detail-top{grid-template-columns:1fr!important;gap:24px!important}#app .product-detail-simple .detail-media{position:relative!important;top:auto!important}#app .product-detail-simple .detail-info h1{font-size:48px!important}}
      @media(max-width:620px){#app .product-detail-simple{padding:18px 0 34px!important}#app .product-detail-simple .back-link{margin-bottom:14px!important;padding:9px 12px!important;font-size:11px!important}#app .product-detail-simple .cms-gallery-main{border-radius:16px!important;box-shadow:none!important;aspect-ratio:1.05/1!important}#app .product-detail-simple .cms-gallery-main img{padding:14px!important}#app .cms-gallery-thumbs{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#app .cms-gallery-thumb{border-radius:8px}#app .product-detail-simple .detail-brand{font-size:9px!important;margin-bottom:10px!important}#app .product-detail-simple .detail-info h1{font-size:38px!important;line-height:.98!important;margin-bottom:12px!important}#app .product-detail-simple .detail-price{margin-bottom:18px!important}#app .product-detail-simple .detail-price .cms-product-price{font-size:20px!important}#app .product-detail-simple .detail-section,#app .product-detail-simple .cms-detail-block{padding:18px 0!important}#app .product-detail-simple .detail-section h2,#app .product-detail-simple .cms-detail-block h2{font-size:19px!important}#app .product-detail-simple .detail-section p,#app .cms-detail-block p,#app .cms-detail-block li{font-size:13px!important}#app .cms-included-head{align-items:center;margin-bottom:10px}#app .cms-included-count{font-size:9px;min-height:26px}#app .cms-included-grid{grid-template-columns:1fr;gap:7px}#app .cms-included-item{min-height:44px;padding:10px 11px;font-size:12px;border-radius:10px}#app .cms-included-check{width:20px;height:20px;flex-basis:20px;font-size:10px}.product-detail-simple .spec-list{grid-template-columns:1fr!important}.product-detail-simple .spec-row:nth-child(odd){border-right:0!important}#app .product-detail-simple .product-card-cart-btn{height:50px!important;border-radius:12px!important}}
    `;document.head.appendChild(s)
  }

  function installCardRenderer(){
    window.pc=function(p){
      if(p?._cmsActive===false)return '';
      const img=p?.images?.[0]||p?.img||'';
      return `<article class="pcard" data-product-id="${esc(p.id)}" onclick="go('/produk/${esc(p.id)}')"><div class="pimg" style="position:relative"><span class="arri-source-badge">${esc(p.brand||'RENTCAM')}</span><img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"><div class="hoverBtns"><button onclick="event.stopPropagation();go('/produk/${esc(p.id)}')">Quick view</button></div></div><div class="pbrand">${esc(p.brand||'')} · ${esc(p.cat||'')}</div><div class="pname">${esc(p.name||'')}</div><div class="price"><span class="cms-product-price">${rupiah(p.price)}</span></div></article>`
    };
  }

  function specRows(p){return (p.spec||[]).map(x=>{const a=Array.isArray(x)?x:[x?.name||'',x?.value||''];return `<div class="spec-row"><span>${esc(a[0])}</span><b>${esc(a[1])}</b></div>`}).join('')}
  function listBlock(title,items){
    if(!Array.isArray(items)||!items.length)return '';
    if(String(title).toLowerCase()==='included'){
      const limit=8;
      const rows=items.map((x,i)=>`<div class="cms-included-item ${i>=limit?'is-extra':''}"><span class="cms-included-check">✓</span><span>${esc(x)}</span></div>`).join('');
      const toggle=items.length>limit?`<button type="button" class="cms-included-toggle" data-included-toggle data-total="${items.length}">Lihat semua ${items.length} item</button>`:'';
      return `<section class="cms-detail-block cms-included-block"><div class="cms-included-head"><div><span class="cms-included-kicker">Isi paket</span><h2>Included in Package</h2></div><span class="cms-included-count">${items.length} item</span></div><div class="cms-included-grid">${rows}</div>${toggle}</section>`;
    }
    return `<section class="cms-detail-block"><h2>${esc(title)}</h2><ul class="cms-detail-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;
  }
  function gallery(p){const imgs=(p.images?.length?p.images:[p.img]).filter(Boolean);return `<div class="cms-gallery" data-product-gallery="${esc(p.id)}"><div class="cms-gallery-main"><img data-cms-main src="${esc(imgs[0]||'')}" alt="${esc(p.name)}"></div>${imgs.length>1?`<div class="cms-gallery-thumbs">${imgs.map((u,i)=>`<button type="button" class="cms-gallery-thumb ${i===0?'on':''}" data-cms-thumb="${i}" data-src="${esc(u)}"><img src="${esc(u)}" alt="${esc(p.name)} ${i+1}" loading="lazy"></button>`).join('')}</div>`:''}</div>`}

  function installDetailRenderer(){
    window.detail=function(id){
      syncProducts();
      const p=currentP()?.find(x=>String(x.id)===String(id));
      if(!p||p._cmsActive===false)return `<section class="page"><div class="container"><div class="cms-product-unavailable">Produk tidak tersedia.</div></div></section>`;
      const desc=p.description||'Informasi produk rental profesional dari Rentcam.';
      return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke Produk</a><div class="detail-top"><div class="detail-media" style="display:block!important;background:transparent!important;overflow:visible!important">${gallery(p)}</div><div class="detail-info"><div class="detail-brand">${esc(p.brand||'')} · ${esc(p.cat||'')}</div><h1>${esc(p.name)}</h1><div class="detail-price"><span class="cms-product-price">${rupiah(p.price)}</span><small> / hari</small></div><div class="detail-sections"><section class="detail-section"><h2>Deskripsi</h2><p>${esc(desc)}</p></section>${p.spec?.length?`<section class="detail-section"><h2>Specifications</h2><div class="spec-list">${specRows(p)}</div></section>`:''}${listBlock('Included',p.inc)}${listBlock(p.mainCategory==='package'?'Extra Package':'Accessories',p.accessories)}</div><button class="product-card-cart-btn" style="width:100%!important;margin:16px 0!important" onclick="event.stopPropagation();add('${esc(p.id)}',1)">Tambah ke Keranjang</button></div></div></div></section>`;
    };
  }

  function rerender(){syncProducts();installCardRenderer();installDetailRenderer();installStyle();if(location.pathname.startsWith('/produk')){try{if(typeof render==='function')render()}catch(e){console.warn('Rentcam CMS product v11 render',e)}}}
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('[data-included-toggle]');
    if(t){
      const block=t.closest('.cms-included-block');
      const on=block?.classList.toggle('is-expanded');
      if(block)t.textContent=on?'Ringkas':'Lihat semua '+(t.dataset.total||'')+' item';
      return;
    }
    const b=e.target.closest('[data-cms-thumb]');if(!b)return;const g=b.closest('.cms-gallery');const main=g?.querySelector('[data-cms-main]');if(main){main.src=b.dataset.src;g.querySelectorAll('.cms-gallery-thumb').forEach(x=>x.classList.toggle('on',x===b))}});
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(rerender,0));
  document.addEventListener('rentcam-route-change',()=>setTimeout(()=>{syncProducts();installCardRenderer();installDetailRenderer();installStyle()},0));
  snapshot();installStyle();installCardRenderer();installDetailRenderer();
})();
