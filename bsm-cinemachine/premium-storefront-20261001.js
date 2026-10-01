/* Accessible mobile navigation preserves existing actions and product tracking. */
(() => {
  if (!document.getElementById('app')) return;
  const nav=document.createElement('nav');
  nav.className='rc-app-nav';nav.setAttribute('aria-label','Navigasi utama');
  const icons={
    '/':'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
    '/produk':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    '/cart':'<path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"/>',
    '/cek-order':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6"/>'
  };
  [['/','Beranda'],['/produk','Katalog'],['/cart','Keranjang'],['/cek-order','Pesanan']].forEach(([path,label])=>{
    const a=document.createElement('a');a.href=path;a.dataset.appPath=path;a.setAttribute('aria-label',label);a.title=label;
    a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[path]+'</svg>';nav.append(a);
  });
  document.body.append(nav);
  const themeButton=document.createElement('button');themeButton.type='button';themeButton.className='rc-theme-toggle';
  let preference=null;try{const saved=localStorage.getItem('rentcam_store_theme');if(['black','white'].includes(saved))preference=saved;}catch(_){}
  function applyTheme(){
    const config=window.RENTCAM_CMS_CONFIG||{},mode=config.theme?.switchEnabled===false?'white':preference||(config.theme?.mode==='black'?'black':'white');
    if(document.documentElement.dataset.storeTheme!==mode)document.documentElement.dataset.storeTheme=mode;
    const label=mode==='black'?'Tema putih':'Tema hitam';
    const icon=mode==='black'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>':'<path d="M20.9 13.2A9 9 0 0 1 10.8 3.1 9 9 0 1 0 20.9 13.2Z"/>';
    if(themeButton.dataset.mode!==mode){themeButton.dataset.mode=mode;themeButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg>';}
    themeButton.title='Beralih ke '+label.toLowerCase();
    themeButton.hidden=config.theme?.switchEnabled===false;
    document.documentElement.dataset.themeSwitch=config.theme?.switchEnabled===false?'off':'on';
    themeButton.setAttribute('aria-label','Beralih ke '+label.toLowerCase());
    const actions=document.querySelector('.header .actions');if(actions&&!actions.contains(themeButton))actions.prepend(themeButton);
  }
  themeButton.addEventListener('click',()=>{preference=document.documentElement.dataset.storeTheme==='black'?'white':'black';try{localStorage.setItem('rentcam_store_theme',preference);}catch(_){}applyTheme();});
  document.addEventListener('rentcam-cms-updated',applyTheme);

  let scheduled=false;
  const placeholders=new WeakMap();
  const cartCount=document.createElement('span');cartCount.className='rc-app-count';cartCount.hidden=true;nav.querySelector('[href="/cart"]').append(cartCount);
  function apply(){
    scheduled=false;applyTheme();
    const count=document.getElementById('count')?.textContent.trim()||'0';
    if(cartCount.textContent!==count)cartCount.textContent=count;
    cartCount.hidden=!(Number(count)>0);
    document.querySelectorAll('#app .rc-camera-search input').forEach(input=>{
      if(!placeholders.has(input))placeholders.set(input,input.placeholder);
      const placeholder=innerWidth<=760?'Cari kamera, lensa, peralatan…':placeholders.get(input);
      if(input.placeholder!==placeholder)input.placeholder=placeholder;
    });
    document.querySelectorAll('.header [data-menu],.header .rc-cart-button,#drawer .rc-close,#app .home-open-cart').forEach(el=>{
      const label=el.matches('[data-menu]')?'Menu':el.matches('.rc-close')?'Tutup':'Keranjang';
      if(!el.querySelector('.rc-control-label')){const span=document.createElement('span');span.className='rc-control-label';span.textContent=label;el.append(span);}
      el.setAttribute('aria-label',label);
    });
    document.querySelectorAll('#app button,.header button,#drawer button').forEach(el=>{
      if(el===themeButton)return;
      if(el.querySelector('svg')&&!el.textContent.trim()){
        const label=el.matches('[data-rc-prev]')?'Sebelum':el.matches('[data-rc-next]')?'Berikut':el.getAttribute('aria-label')||el.title;
        if(label){const span=document.createElement('span');span.className='rc-control-label';span.textContent=label;el.append(span);}
      }
    });
    nav.querySelectorAll('a').forEach(a=>{
      const selected=a.pathname==='/'?location.pathname==='/':location.pathname===a.pathname||location.pathname.startsWith(a.pathname+'/');
      if(selected){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page');}
      else a.removeAttribute('aria-current');
    });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(apply);}}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',schedule);addEventListener('popstate',schedule);document.addEventListener('rentcam-route-change',schedule);
  nav.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;if(typeof go==='function'){e.preventDefault();e.stopPropagation();go(a.dataset.appPath);document.getElementById('drawer')?.classList.remove('open');schedule();}});
  apply();
})();
