/* Rentcam public template copy + promo popup */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cfg=()=>window.RENTCAM_CMS_CONFIG||{};
  const defaultPopup=()=>({
    enabled:true,
    type:'promo',
    eyebrow:'PROMO',
    title:'Promo & Produk Baru',
    text:'Klik untuk lihat daftar produk promo dan barang baru.',
    buttonLabel:'Lihat produk',
    floatLabel:'',
    productId:'',
    buttonLink:'/produk',
    image:'',
    version:'default-promo-20260913'
  });
  function copy(){
    const c=cfg().copy||{}, h=cfg().homepage||{};
    if(location.pathname==='/produk'){
      const u=new URLSearchParams(location.search);
      const selected=!!u.get('cat')||!!u.get('brand')||!!u.get('q');
      const title=document.querySelector('.product-meta h1');
      const info=document.querySelector('#catalogResultCount');
      const input=document.querySelector('#productSearchInput');
      const label=document.querySelector('.catalog-filter-field > span');
      const trigger=document.querySelector('#catalogCategory > span');
      if(title&&!selected&&c.catalogTitle) title.textContent=c.catalogTitle;
      if(info&&c.catalogSubtitle){
        const count=(info.textContent.match(/^\d+\s+produk/)||[''])[0];
        info.textContent=(count?count+' · ':'')+c.catalogSubtitle;
      }
      if(input&&c.catalogSearchPlaceholder) input.placeholder=c.catalogSearchPlaceholder;
      if(label&&c.catalogFilterLabel) label.textContent=c.catalogFilterLabel;
      if(trigger&&!selected) trigger.textContent='Semua produk';
    }
    if(location.pathname==='/'){
      const general=document.querySelector('#rentcam-home-general h2,.home-general h2');
      const generalP=document.querySelector('#rentcam-home-general p,.home-general p');
      if(general&&h.generalTitle) general.textContent=h.generalTitle;
      if(generalP&&h.generalSubtitle) generalP.textContent=h.generalSubtitle;
    }
  }
  function popup(){
    const raw=cfg().popup||{};
    const hasPopup=raw.title||raw.text||raw.image||raw.productId||raw.buttonLink;
    const p={...defaultPopup(),...(hasPopup?raw:{})};
    if(p.enabled===false||document.querySelector('.rc-promo-widget')) return;
    const type=String(p.type||p.category||p.eyebrow||'promo').toLowerCase();
    const isNew=type.includes('new')||type.includes('baru');
    const label=p.floatLabel||(isNew?'BARANG BARU':'PROMO');
    const list=promoItems(p,isNew,label);
    const primaryPath=p.productId?'/produk/'+encodeURIComponent(p.productId):(p.buttonLink&&p.buttonLink!=='/produk'?p.buttonLink:'/produk?'+(isNew?'new=1':'promo=1'));
    const primaryLabel=p.buttonLabel&&p.buttonLabel!=='Lihat daftar'?p.buttonLabel:'Lihat produk';
    const wrap=document.createElement('div');
    wrap.className='rc-promo-widget';
    wrap.innerHTML=`<button class="rc-promo-float" type="button" aria-expanded="false" aria-controls="rcPromoPanel">
      <span>${E(label)}</span><b>${list.length}</b>
    </button>
    <section class="rc-promo-panel" id="rcPromoPanel" hidden>
      <div class="rc-promo-head">
        <div><small>${E(p.eyebrow||label)}</small><h3>${E(p.title||'Promo & Produk Baru')}</h3></div>
        <button class="rc-promo-close" type="button" aria-label="Tutup">&times;</button>
      </div>
      <p>${E(p.text||'Pilih produk promo atau barang baru.')}</p>
      <div class="rc-promo-list">${list.map(item=>`<button class="rc-promo-item" type="button" data-popup-go="${E(item.path)}">
        ${item.image?`<img src="${E(item.image)}" alt="">`:''}
        <span><small>${E(item.badge)}</small><b>${E(item.name)}</b><em>${E(item.meta)}</em></span>
      </button>`).join('')}</div>
      <button class="rc-promo-all" type="button" data-popup-go="${E(primaryPath)}">${E(primaryLabel)}</button>
    </section>`;
    const panel=wrap.querySelector('.rc-promo-panel'),btn=wrap.querySelector('.rc-promo-float');
    const toggle=open=>{panel.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false')};
    btn.addEventListener('click',()=>toggle(panel.hidden));
    wrap.querySelector('.rc-promo-close').addEventListener('click',()=>toggle(false));
    wrap.addEventListener('click',e=>{
      const goTo=e.target.closest('[data-popup-go]');
      if(!goTo)return;
      toggle(false);
      const path=goTo.dataset.popupGo||'/produk';
      if(typeof go==='function') go(path); else location.href=path;
    });
    document.body.append(wrap);
  }
  function promoItems(p,isNew,label){
    const manual=Array.isArray(p.items)?p.items:[];
    if(manual.length)return manual.filter(x=>x&&x.active!==false&&(!x.type||String(x.type).toLowerCase()===(isNew?'new':'promo'))).map(x=>({name:x.title||x.name||'Produk promo',image:x.image||'',badge:x.type==='new'?'BARANG BARU':(x.badge||label),meta:x.text||x.subtitle||'',path:x.productId?'/produk/'+encodeURIComponent(x.productId):(x.link||'/produk')}));
    let products=[];try{products=Array.isArray(P)?P:[]}catch(e){}
    const isNewProduct=x=>x.labelText==='NEW'||x.label==='NEW'||/new|baru/i.test([x.badge,x.labelText,x.label,x.promoName,x.discountLabel].join(' '));
    const isPromoProduct=x=>Number(x.discountPercent||x.discount||0)>0||/promo|diskon/i.test([x.badge,x.labelText,x.label,x.promoName,x.discountLabel].join(' '));
    const picked=products.filter(x=>x&&x.active!==false&&x.deleted!==true&&x._cmsActive!==false&&(isNew?isNewProduct(x):isPromoProduct(x))).slice(0,8);
    const fallback=p.productId?products.filter(x=>String(x.id)===String(p.productId)):products.slice(0,5);
    return (picked.length?picked:fallback).slice(0,8).map(x=>({name:x.name||'Produk',image:x.images?.[0]||x.image||x.img||p.image||'',badge:isNewProduct(x)?'BARANG BARU':label,meta:[x.brand,x.discountPercent?`Diskon ${x.discountPercent}%`:x.discount?`Diskon ${x.discount}%`:x.cat||x.category].filter(Boolean).join(' · '),path:'/produk/'+encodeURIComponent(x.id)}));
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest?.('[data-go]');
    if(!nav||e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    const drawer=document.getElementById('drawer');
    drawer?.classList.remove('open');
    document.body.classList.remove('menu-open');
    const path=nav.dataset.go||'/';
    if(typeof go==='function') go(path); else location.href=path;
    requestAnimationFrame(()=>scrollTo(0,0));
  },true);
  document.addEventListener('pointerup',e=>{
    const cart=e.target.closest?.('.rc-cart-button,[aria-label*="Keranjang"],[data-go="/cart"]');
    if(!cart)return;
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('drawer')?.classList.remove('open');
    document.body.classList.remove('menu-open');
    if(typeof go==='function')go('/cart');else location.href='/cart';
  },true);
  function style(){
    if(document.getElementById('rc-template-popup-style')) return;
    const s=document.createElement('style');
    s.id='rc-template-popup-style';
    s.textContent=`
      .rc-promo-widget{position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:1200;font-family:inherit}
      .rc-promo-float{width:58px;min-height:74px;border:0;border-radius:18px 0 0 18px;background:#111;color:#fff;box-shadow:0 12px 34px rgba(0,0,0,.22);cursor:pointer;display:grid;place-items:center;padding:9px 7px;gap:5px}
      .rc-promo-float span{writing-mode:vertical-rl;text-orientation:mixed;font-size:9px;font-weight:900;letter-spacing:.14em}
      .rc-promo-float b{position:absolute;right:43px;top:-7px;min-width:20px;height:20px;border-radius:999px;background:#f26a21;color:#fff;display:grid;place-items:center;font-size:11px}
      .rc-promo-panel{position:absolute;right:66px;top:50%;transform:translateY(-50%);width:min(340px,calc(100vw - 92px));max-height:min(520px,78vh);overflow:auto;background:#fff;border:1px solid #e7e9ed;border-radius:18px;box-shadow:0 22px 70px rgba(0,0,0,.24);padding:14px}
      .rc-promo-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
      .rc-promo-head small{display:block;font-size:9px;letter-spacing:.13em;font-weight:900;color:#f26a21}
      .rc-promo-head h3{margin:4px 0 0;font-size:19px;line-height:1.15}
      .rc-promo-close{width:34px;height:34px;border:0;border-radius:999px;background:#f3f4f6;font-size:22px;cursor:pointer}
      .rc-promo-panel p{margin:9px 0 12px;color:#667085;font-size:12px;line-height:1.45}
      .rc-promo-list{display:grid;gap:8px}
      .rc-promo-item{display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;align-items:center;width:100%;border:1px solid #eceff3;background:#fff;border-radius:13px;padding:8px;text-align:left;cursor:pointer}
      .rc-promo-item:hover{border-color:#111}
      .rc-promo-item img{width:62px;height:54px;object-fit:contain;background:#f7f7f7;border-radius:9px}
      .rc-promo-item small{font-size:8px;font-weight:900;color:#f26a21;letter-spacing:.1em}
      .rc-promo-item b{display:block;color:#111;font-size:13px;line-height:1.2;margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rc-promo-item em{display:block;color:#777;font-size:10px;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rc-promo-all{width:100%;margin-top:10px;border:0;border-radius:12px;background:#111;color:#fff;font-weight:900;padding:12px;cursor:pointer}
      @media(max-width:640px){.rc-promo-widget{right:0}.rc-promo-float{width:50px;min-height:66px;border-radius:16px 0 0 16px}.rc-promo-panel{right:56px;width:calc(100vw - 72px);max-height:70vh}}
    `;
    document.head.append(s);
  }
  function run(){style();copy();setTimeout(copy,120);setTimeout(copy,600);setTimeout(popup,900)}
  document.addEventListener('rentcam-cms-updated',run);
  document.addEventListener('rentcam-route-change',run);
  addEventListener('popstate',run);
  run();
})();
