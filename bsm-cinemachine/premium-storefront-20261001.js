/* Accessible mobile navigation preserves existing actions and product tracking. */
(() => {
  if (!document.getElementById('app')||document.querySelector('.rc-app-nav')) return;
  const nav=document.createElement('nav');
  nav.className='rc-app-nav';nav.setAttribute('aria-label','Navigasi utama');
  const icons={
    '/':'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
    '/produk':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    '/cart':'<path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"/>',
    '/cek-order':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h6"/>'
  };
  [['/','Home'],['/produk','Katalog'],['/cek-order','Pesanan']].forEach(([path,label])=>{
    const a=document.createElement('a');a.href=path;a.dataset.appPath=path;a.setAttribute('aria-label',label);a.title=label;
    a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[path]+'</svg><span class="rc-bottom-label">'+label+'</span>';nav.append(a);
  });
  const menuButton=document.createElement('button');menuButton.type='button';menuButton.dataset.menu='';menuButton.className='rc-bottom-menu';menuButton.setAttribute('aria-label','Menu');menuButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span class="rc-bottom-label">Menu</span>';nav.append(menuButton);
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
  const cartCount=document.createElement('span');cartCount.className='rc-app-count';cartCount.hidden=true;cartCount.hidden=true;
  const drawerIcons={
    '/':'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
    '/produk':'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    '/portfolio':'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 12c5 4 13 4 18 0M12 12v4"/>',
    '/artikel':'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    '/cart':'<path d="M3 3h2l3 12h10l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    '/cek-order':'<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
    review:'<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m12 7 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4Z"/>',
    member:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M19 8v6M16 11h6"/>',
    page:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/>'
  };
  function polishDrawer(){
    const drawer=document.getElementById('drawer');if(!drawer)return;
    const head=drawer.querySelector('.rc-drawer-head');
    if(head&&!head.querySelector('.rc-menu-heading')){const title=document.createElement('div');title.className='rc-menu-heading';title.innerHTML='<b>Menu</b><small>Jelajahi RentalAll</small>';head.prepend(title)}
    drawer.querySelectorAll('.drawer-link').forEach(link=>{
      let key=link.hasAttribute('data-customer-reviews')?'review':link.hasAttribute('data-register-member')?'member':link.dataset.go||link.getAttribute('href')||'page';
      try{if(key.startsWith('/'))key=new URL(key,location.origin).pathname}catch(_){}
      const descriptions={'/':'Halaman utama','/produk':'Katalog peralatan','/portfolio':'Hasil produksi','/artikel':'Tips dan informasi'};
      const description=link.querySelector('small');if(description?.textContent==='Buka halaman'&&descriptions[key])description.textContent=descriptions[key];
      if(!drawerIcons[key])key='page';
      let icon=link.querySelector('.drawer-link-icon');if(!icon){icon=document.createElement('span');icon.className='drawer-link-icon';link.prepend(icon)}
      if(icon.dataset.menuIcon!==key){icon.dataset.menuIcon=key;icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+drawerIcons[key]+'</svg>'}
      if(!link.querySelector('.drawer-arrow')){const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('class','drawer-arrow');arrow.setAttribute('viewBox','0 0 24 24');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<path d="m9 6 6 6-6 6"/>';link.append(arrow)}
    });
  }
  function apply(){
    scheduled=false;applyTheme();polishDrawer();
    const count=document.getElementById('count')?.textContent.trim()||'0';
    if(cartCount.textContent!==count)cartCount.textContent=count;
    cartCount.hidden=!(Number(count)>0);
    document.querySelectorAll('#app .rc-camera-search input').forEach(input=>{
      if(!placeholders.has(input))placeholders.set(input,input.placeholder);
      const placeholder=innerWidth<=760?'Cari kamera, lensa, peralatan…':placeholders.get(input);
      if(input.placeholder!==placeholder)input.placeholder=placeholder;
    });
    document.querySelectorAll('.header [data-menu],.header .rc-cart-button,#drawer .rc-close,#app .home-open-cart').forEach(el=>{
      const label=el.matches('.rc-close')?'Tutup menu':el.matches('[data-menu]')?'Menu':'Keranjang';
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
