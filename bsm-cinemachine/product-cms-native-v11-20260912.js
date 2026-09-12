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
      label:v.label||v.promoLabel||'',labelStart:v.labelStart||'',labelEnd:v.labelEnd||'',discount:Number(v.discount||v.discountPercent||0)||0,discountStart:v.discountStart||'',discountEnd:v.discountEnd||'',promoName:v.promoName||''
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
      #app .cms-product-unavailable{padding:70px 20px;text-align:center;color:#777}
      @media(max-width:620px){#app .cms-gallery-main{border-radius:13px}#app .cms-gallery-thumbs{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#app .cms-gallery-thumb{border-radius:8px}#app .cms-detail-block h2{font-size:16px}#app .cms-detail-block p,#app .cms-detail-block li{font-size:13px}}
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
  function listBlock(title,items){return Array.isArray(items)&&items.length?`<section class="cms-detail-block"><h2>${esc(title)}</h2><ul class="cms-detail-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
  function gallery(p){const imgs=(p.images?.length?p.images:[p.img]).filter(Boolean);return `<div class="cms-gallery" data-product-gallery="${esc(p.id)}"><div class="cms-gallery-main"><img data-cms-main src="${esc(imgs[0]||'')}" alt="${esc(p.name)}"></div>${imgs.length>1?`<div class="cms-gallery-thumbs">${imgs.map((u,i)=>`<button type="button" class="cms-gallery-thumb ${i===0?'on':''}" data-cms-thumb="${i}" data-src="${esc(u)}"><img src="${esc(u)}" alt="${esc(p.name)} ${i+1}" loading="lazy"></button>`).join('')}</div>`:''}</div>`}

  function installDetailRenderer(){
    window.detail=function(id){
      syncProducts();
      const p=currentP()?.find(x=>String(x.id)===String(id));
      if(!p||p._cmsActive===false)return `<section class="page"><div class="container"><div class="cms-product-unavailable">Produk tidak tersedia.</div></div></section>`;
      const desc=p.description||'Informasi produk rental profesional dari Rentcam.';
      return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke Produk</a><div class="detail-top"><div class="detail-media" style="display:block!important;background:transparent!important;overflow:visible!important">${gallery(p)}</div><div class="detail-info"><div class="detail-brand">${esc(p.brand||'')} · ${esc(p.cat||'')}</div><h1>${esc(p.name)}</h1><div class="detail-price"><span class="cms-product-price">${rupiah(p.price)}</span><small> / hari</small></div><div class="detail-sections"><section class="detail-section"><h2>Deskripsi</h2><p>${esc(desc)}</p></section>${p.spec?.length?`<section class="detail-section"><h2>Specifications</h2><div class="spec-list">${specRows(p)}</div></section>`:''}${listBlock('Included',p.inc)}${listBlock('Accessories',p.accessories)}</div><button class="product-card-cart-btn" style="width:100%!important;margin:16px 0!important" onclick="event.stopPropagation();add('${esc(p.id)}',1)">Tambah ke Keranjang</button></div></div></div></section>`;
    };
  }

  function rerender(){syncProducts();installCardRenderer();installDetailRenderer();installStyle();if(location.pathname.startsWith('/produk')){try{if(typeof render==='function')render()}catch(e){console.warn('Rentcam CMS product v11 render',e)}}}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-cms-thumb]');if(!b)return;const g=b.closest('.cms-gallery');const main=g?.querySelector('[data-cms-main]');if(main){main.src=b.dataset.src;g.querySelectorAll('.cms-gallery-thumb').forEach(x=>x.classList.toggle('on',x===b))}});
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(rerender,0));
  document.addEventListener('rentcam-route-change',()=>setTimeout(()=>{syncProducts();installCardRenderer();installDetailRenderer();installStyle()},0));
  snapshot();installStyle();installCardRenderer();installDetailRenderer();
})();