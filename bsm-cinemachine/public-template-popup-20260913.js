/* Rentcam public template copy + promo popup */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cfg=()=>window.RENTCAM_CMS_CONFIG||{};
  const cleanLabel=s=>String(s||'').trim().toLowerCase();
  const labelList=v=>Array.isArray(v)?v.map(cleanLabel).filter(Boolean):String(v||'').split(',').map(cleanLabel).filter(Boolean);
  const productLabels=p=>[p?.labelText,p?.label,p?.badge,p?.promoName,p?.discountLabel,Number(p?.discountPercent||p?.discount||0)>0?'DISKON':''].map(cleanLabel).filter(Boolean);
  const matchesLabel=(p,labels)=>!labels.length||labels.some(l=>productLabels(p).some(x=>x===l||x.includes(l)||l.includes(x)));
  const defaultPopup=()=>({enabled:true,type:'promo',eyebrow:'PROMO',title:'Promo & Produk Baru',text:'Klik untuk lihat produk promo atau barang baru.',buttonLabel:'Lihat produk',floatLabel:'',labels:['PROMO','NEW','DISKON'],productId:'',buttonLink:'/produk',image:'',reappearSeconds:8,version:'default-promo-20260913'});
  function copy(){
    const c=cfg().copy||{}, h=cfg().homepage||{};
    if(location.pathname==='/produk'){
      const u=new URLSearchParams(location.search);
      const selected=!!u.get('cat')||!!u.get('brand')||!!u.get('q')||!!u.get('label')||!!u.get('promo')||!!u.get('new');
      const title=document.querySelector('.product-meta h1');
      const info=document.querySelector('#catalogResultCount');
      const input=document.querySelector('#productSearchInput');
      const label=document.querySelector('.catalog-filter-field > span');
      const trigger=document.querySelector('#catalogCategory > span');
      if(title&&(u.get('label')||u.get('promo')||u.get('new'))) title.textContent='Produk Promo & Baru';
      else if(title&&!selected&&c.catalogTitle) title.textContent=c.catalogTitle;
      if(info&&c.catalogSubtitle){const count=(info.textContent.match(/^\d+\s+produk/)||[''])[0];info.textContent=(count?count+' · ':'')+c.catalogSubtitle;}
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
    const chosenLabels=labelList(p.labels?.length?p.labels:(p.type||p.category||p.eyebrow||'promo'));
    const type=String(p.type||p.category||p.eyebrow||chosenLabels[0]||'promo').toLowerCase();
    const isNew=type.includes('new')||type.includes('baru');
    const label=p.floatLabel||(chosenLabels.length?chosenLabels.map(x=>x.toUpperCase()).join(' / '):(isNew?'BARANG BARU':'PROMO'));
    const list=promoItems(p,isNew,label,chosenLabels);
    const labelQuery=chosenLabels.length?'/produk?label='+encodeURIComponent(chosenLabels.join(',')):'';
    const primaryPath=p.buttonLink&&p.buttonLink!=='/produk'?p.buttonLink:(labelQuery||'/produk?'+(isNew?'new=1':'promo=1'));
    const listPath=()=>primaryPath||'/produk?label=promo%2Cnew%2Cdiskon';
    const navigateList=()=>{const path=listPath(); if(typeof go==='function')go(path); else location.href=path; requestAnimationFrame(()=>scrollTo(0,0));};
    const wrap=document.createElement('div');
    wrap.className='rc-promo-widget';
    wrap.innerHTML=`<button class="rc-promo-hide" type="button" aria-label="Sembunyikan promo sementara">&times;</button>
    <button class="rc-promo-float" type="button" aria-label="Buka daftar produk promo atau barang baru"><span>${E(label)}</span><b>${list.length}</b></button>`;
    const btn=wrap.querySelector('.rc-promo-float'),hide=wrap.querySelector('.rc-promo-hide');
    const savedY=Number(localStorage.getItem('rentcam_promo_y')||0);
    if(savedY){wrap.style.top=Math.min(Math.max(76,savedY),innerHeight-76)+'px'}
    const reappear=()=>Math.max(3000,(Number((cfg().popup||{}).reappearSeconds)||8)*1000);
    let hideTimer=null,dragging=false,moved=false,startY=0,startTop=0;
    const hideTemp=()=>{wrap.classList.add('is-hidden');clearTimeout(hideTimer);hideTimer=setTimeout(()=>wrap.classList.remove('is-hidden'),reappear())};
    hide.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();hideTemp()});
    btn.addEventListener('pointerdown',e=>{dragging=true;moved=false;startY=e.clientY;startTop=wrap.getBoundingClientRect().top+(wrap.offsetHeight/2);wrap.classList.add('dragging');btn.setPointerCapture?.(e.pointerId)});
    btn.addEventListener('pointermove',e=>{if(!dragging)return;const dy=e.clientY-startY;if(Math.abs(dy)>7)moved=true;if(!moved)return;const y=Math.min(Math.max(76,startTop+dy),innerHeight-76);wrap.style.top=y+'px';try{localStorage.setItem('rentcam_promo_y',String(y))}catch(_){}});
    const endDrag=()=>{dragging=false;wrap.classList.remove('dragging');setTimeout(()=>{moved=false},0)};
    btn.addEventListener('pointerup',endDrag);btn.addEventListener('pointercancel',endDrag);
    btn.addEventListener('click',e=>{if(moved){e.preventDefault();return}e.preventDefault();e.stopPropagation();navigateList()});
    document.body.append(wrap);
  }
  function promoItems(p,isNew,label,chosenLabels=[]){
    const manual=Array.isArray(p.items)?p.items:[];
    if(manual.length)return manual.filter(x=>x&&x.active!==false&&(!chosenLabels.length||matchesLabel(x,chosenLabels)||labelList(x.labels||x.type||x.badge).some(l=>chosenLabels.includes(l)))).map(x=>({name:x.title||x.name||'Produk promo',image:x.image||'',badge:x.badge||x.label||x.type||label,meta:x.text||x.subtitle||'',path:x.productId?'/produk/'+encodeURIComponent(x.productId):(x.link||('/produk?label='+encodeURIComponent(chosenLabels.join(','))))}));
    let products=[];try{products=Array.isArray(P)?P:[]}catch(e){}
    const isNewProduct=x=>x.labelText==='NEW'||x.label==='NEW'||/new|baru/i.test([x.badge,x.labelText,x.label,x.promoName,x.discountLabel].join(' '));
    const isPromoProduct=x=>Number(x.discountPercent||x.discount||0)>0||/promo|diskon/i.test([x.badge,x.labelText,x.label,x.promoName,x.discountLabel].join(' '));
    const picked=products.filter(x=>x&&x.active!==false&&x.deleted!==true&&x._cmsActive!==false&&(chosenLabels.length?matchesLabel(x,chosenLabels):(isNew?isNewProduct(x):isPromoProduct(x)))).slice(0,8);
    const fallback=p.productId?products.filter(x=>String(x.id)===String(p.productId)):products.slice(0,5);
    return (picked.length?picked:fallback).slice(0,8).map(x=>({name:x.name||'Produk',image:x.images?.[0]||x.image||x.img||p.image||'',badge:x.labelText||x.label||x.discountLabel||(isNewProduct(x)?'BARANG BARU':label),meta:[x.brand,x.discountPercent?`Diskon ${x.discountPercent}%`:x.discount?`Diskon ${x.discount}%`:x.cat||x.category].filter(Boolean).join(' · '),path:'/produk/'+encodeURIComponent(x.id)}));
  }
  document.addEventListener('click',e=>{const nav=e.target.closest?.('[data-go]');if(!nav||e.defaultPrevented) return;e.preventDefault();e.stopPropagation();const drawer=document.getElementById('drawer');drawer?.classList.remove('open');document.body.classList.remove('menu-open');const path=nav.dataset.go||'/';if(typeof go==='function') go(path); else location.href=path;requestAnimationFrame(()=>scrollTo(0,0));},true);
  document.addEventListener('pointerup',e=>{const cart=e.target.closest?.('.rc-cart-button,[aria-label*="Keranjang"],[data-go="/cart"]');if(!cart)return;e.preventDefault();e.stopPropagation();document.getElementById('drawer')?.classList.remove('open');document.body.classList.remove('menu-open');if(typeof go==='function')go('/cart');else location.href='/cart';},true);
  function style(){
    if(document.getElementById('rc-template-popup-style')) return;
    const s=document.createElement('style');
    s.id='rc-template-popup-style';
    s.textContent=`
      .rc-promo-widget{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:1200;font-family:inherit;transition:opacity .18s ease,right .18s ease}
      .rc-promo-widget.is-hidden{opacity:0;right:-72px;pointer-events:none}
      .rc-promo-widget.dragging{transition:none}
      .rc-promo-hide{position:absolute;left:-12px;top:-10px;width:24px;height:24px;border:1px solid #e6e8ec;border-radius:999px;background:#fff;color:#111;box-shadow:0 6px 18px rgba(0,0,0,.14);font-size:17px;line-height:1;cursor:pointer;z-index:2}
      .rc-promo-float{width:48px;min-height:64px;border:0;border-radius:16px 0 0 16px;background:#111;color:#fff;box-shadow:0 12px 34px rgba(0,0,0,.22);cursor:pointer;display:grid;place-items:center;padding:8px 6px;gap:4px;touch-action:none}
      .rc-promo-widget.dragging .rc-promo-float{cursor:grabbing}
      .rc-promo-float span{writing-mode:vertical-rl;text-orientation:mixed;font-size:9px;font-weight:900;letter-spacing:.14em}
      .rc-promo-float b{position:absolute;right:35px;top:-7px;min-width:20px;height:20px;border-radius:999px;background:#f26a21;color:#fff;display:grid;place-items:center;font-size:11px}
      @media(max-width:640px){.rc-promo-float{width:44px;min-height:62px;border-radius:15px 0 0 15px}.rc-promo-hide{left:-10px;top:-9px;width:22px;height:22px;font-size:16px}}
    `;
    document.head.append(s);
  }
  function run(){style();copy();setTimeout(copy,120);setTimeout(copy,600);setTimeout(popup,900)}
  document.addEventListener('rentcam-cms-updated',run);
  document.addEventListener('rentcam-route-change',run);
  addEventListener('popstate',run);
  run();
})();
