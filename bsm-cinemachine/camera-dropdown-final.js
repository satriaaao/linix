/* Rentcam final camera dropdown: robust against homepage re-render */
(function(){
  if(window.__rentcamCameraDropdownFinal) return;
  window.__rentcamCameraDropdownFinal=true;

  const style=document.createElement('style');
  style.textContent=`
    #app .cats .cat small{display:none!important}
    #app .cats .cat>div{gap:0!important}
    #app .cats .camera-final-trigger b{display:flex!important;align-items:center!important;gap:7px!important}
    .camera-final-chevron{font-size:14px;line-height:1;transition:transform .18s ease}
    .camera-final-trigger.is-open .camera-final-chevron{transform:rotate(180deg)}
    .camera-final-menu{position:fixed;z-index:2147483000;background:#fff;border:1px solid #dedede;box-shadow:0 18px 45px rgba(0,0,0,.18);opacity:0;visibility:hidden;transform:translateY(7px);pointer-events:none;transition:opacity .15s ease,transform .15s ease,visibility .15s ease;color:#111}
    .camera-final-menu.open{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}
    .camera-final-grid{display:grid;grid-template-columns:1fr 1fr;min-width:540px}
    .camera-final-col{padding:18px}.camera-final-col+.camera-final-col{border-left:1px solid #ececec}
    .camera-final-title{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#969696;margin-bottom:8px}
    .camera-final-item{width:100%;min-height:47px;border:0;border-top:1px solid #efefef;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 6px;cursor:pointer;text-align:left}
    .camera-final-item:first-of-type{border-top:0}.camera-final-item:hover{background:#f6f6f6}
    .camera-final-item b{font-size:13px;font-weight:800;color:#111}.camera-final-item span{font-size:10px;color:#929292}
    .camera-final-item.disabled{opacity:.48}
    .camera-final-foot{height:46px;padding:0 18px;border-top:1px solid #ececec;background:#fafafa;display:flex;align-items:center;justify-content:space-between}
    .camera-final-foot span{font-size:10px;color:#909090}.camera-final-foot button{border:0;background:none;font-size:11px;font-weight:900;cursor:pointer}
    @media(max-width:700px){
      .camera-final-menu{left:10px!important;right:10px!important;width:auto!important;max-height:66vh;overflow:auto}
      .camera-final-grid{grid-template-columns:1fr;min-width:0}.camera-final-col{padding:14px 16px}.camera-final-col+.camera-final-col{border-left:0;border-top:1px solid #ececec}
      .camera-final-item{min-height:46px}.camera-final-title{margin-bottom:5px}
    }
  `;
  document.head.appendChild(style);

  let menu=null,active=null,closeTimer=null;
  const cameraProducts=()=>typeof P==='undefined'?[]:P.filter(x=>x.cat==='Camera');
  function cameraCat(){return [...document.querySelectorAll('#app .cats .cat')].find(el=>(el.querySelector('b')?.textContent||'').replace('⌄','').trim().startsWith('Cameras'));}
  function decorate(){
    document.querySelectorAll('#app .cats .cat small').forEach(x=>x.remove());
    const cat=cameraCat(); if(!cat) return;
    cat.classList.add('camera-final-trigger');
    const b=cat.querySelector('b');
    if(b && !b.querySelector('.camera-final-chevron')) b.insertAdjacentHTML('beforeend','<span class="camera-final-chevron">⌄</span>');
  }
  function ensureMenu(){
    if(menu) return menu;
    menu=document.createElement('div'); menu.className='camera-final-menu';
    menu.addEventListener('mouseenter',()=>clearTimeout(closeTimer));
    menu.addEventListener('mouseleave',()=>{closeTimer=setTimeout(close,160)});
    document.body.appendChild(menu); return menu;
  }
  function build(){
    const cs=cameraProducts(),brands=[...new Set(cs.map(x=>x.brand))];
    const m=ensureMenu();
    m.innerHTML=`<div class="camera-final-grid"><div class="camera-final-col"><div class="camera-final-title">Jenis Kamera</div><button class="camera-final-item" data-type="cinema"><b>Cinema Camera</b><span>${cs.length} produk</span></button><button class="camera-final-item disabled" data-type="photo"><b>Photo Camera</b><span>Belum tersedia</span></button><button class="camera-final-item disabled" data-type="video"><b>Video Camera</b><span>Belum tersedia</span></button></div><div class="camera-final-col"><div class="camera-final-title">Brand Kamera</div>${brands.map(br=>`<button class="camera-final-item" data-brand="${br}"><b>${br}</b><span>${cs.filter(x=>x.brand===br).length} produk</span></button>`).join('')}</div></div><div class="camera-final-foot"><span>Pilih tipe atau brand kamera</span><button data-all="1">Lihat Semua Kamera →</button></div>`;
    m.querySelectorAll('[data-type]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const t=btn.dataset.type;if(t==='cinema'){close();go('/produk?cat=Camera')}else toast((t==='photo'?'Photo Camera':'Video Camera')+' belum tersedia')});
    m.querySelectorAll('[data-brand]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const br=btn.dataset.brand;close();go('/produk?cat=Camera&brand='+encodeURIComponent(br))});
    m.querySelector('[data-all]').onclick=e=>{e.stopPropagation();close();go('/produk?cat=Camera')};
  }
  function place(cat){
    const m=ensureMenu(),r=cat.getBoundingClientRect();
    if(innerWidth<=700){m.style.top=(r.bottom+2)+'px';m.style.left='10px';m.style.right='10px';m.style.width='auto'}
    else{const w=540;m.style.top=(r.bottom+2)+'px';m.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px';m.style.right='auto';m.style.width=w+'px'}
  }
  function open(cat){build();active=cat;place(cat);menu.classList.add('open');cat.classList.add('is-open')}
  function close(){clearTimeout(closeTimer);if(menu)menu.classList.remove('open');if(active)active.classList.remove('is-open');active=null}
  function toggle(cat){if(menu?.classList.contains('open')&&active===cat)close();else open(cat)}

  document.addEventListener('click',function(e){
    const cat=e.target.closest?.('#app .cats .cat');
    if(cat && (cat.querySelector('b')?.textContent||'').replace('⌄','').trim().startsWith('Cameras')){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();decorate();toggle(cat);return;
    }
    if(menu?.classList.contains('open')&&!menu.contains(e.target)) close();
  },true);

  document.addEventListener('mouseover',function(e){
    if(innerWidth<=700)return;
    const cat=e.target.closest?.('#app .cats .cat');
    if(cat && (cat.querySelector('b')?.textContent||'').replace('⌄','').trim().startsWith('Cameras')){clearTimeout(closeTimer);decorate();if(active!==cat||!menu?.classList.contains('open'))open(cat)}
  },true);
  document.addEventListener('mouseout',function(e){
    if(innerWidth<=700)return;
    const cat=e.target.closest?.('#app .cats .cat');
    if(cat && active===cat && !cat.contains(e.relatedTarget)){closeTimer=setTimeout(close,160)}
  },true);

  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(app,{childList:true,subtree:true});
  addEventListener('resize',()=>{if(menu?.classList.contains('open')&&active)place(active)});
  addEventListener('scroll',close,{passive:true});
  requestAnimationFrame(decorate);
})();
