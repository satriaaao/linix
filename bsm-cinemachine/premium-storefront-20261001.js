/* Text controls preserve existing actions and product tracking. */
(() => {
  if (!document.getElementById('app')) return;
  const nav=document.createElement('nav');
  nav.className='rc-app-nav';nav.setAttribute('aria-label','Navigasi utama');
  [['/','Beranda'],['/produk','Katalog'],['/cart','Keranjang'],['/cek-order','Pesanan']].forEach(([path,label])=>{
    const a=document.createElement('a');a.href=path;a.dataset.appPath=path;a.textContent=label;nav.append(a);
  });
  document.body.append(nav);
  let scheduled=false;
  function apply(){
    scheduled=false;
    document.querySelectorAll('.header [data-menu],.header .rc-cart-button,#drawer .rc-close,#app .home-open-cart').forEach(el=>{
      const label=el.matches('[data-menu]')?'Menu':el.matches('.rc-close')?'Tutup':'Keranjang';
      if(!el.querySelector('.rc-control-label')){const span=document.createElement('span');span.className='rc-control-label';span.textContent=label;el.append(span);}
      el.setAttribute('aria-label',label);
    });
    document.querySelectorAll('#app button,.header button,#drawer button').forEach(el=>{
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
  addEventListener('popstate',schedule);document.addEventListener('rentcam-route-change',schedule);
  nav.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;if(typeof go==='function'){e.preventDefault();e.stopPropagation();go(a.dataset.appPath);document.getElementById('drawer')?.classList.remove('open');schedule();}});
  apply();
})();
