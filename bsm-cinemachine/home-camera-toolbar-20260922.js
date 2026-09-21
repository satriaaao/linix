(()=>{
'use strict';
const STYLE_ID='rc-home-camera-toolbar-style';
function go(path){
  if(typeof window.go==='function') window.go(path);
  else location.assign(path);
}
function svg(type){
  const icons={
    new:'<svg viewBox="0 0 24 24"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/><path d="m8 5 9 4.5v4.5"/></svg>',
    promo:'<svg viewBox="0 0 24 24"><path d="M20 13 11 22l-9-9V4h9z"/><circle cx="7" cy="8" r="1.5"/><path d="m14 8-6 8M9 8h.01M14 16h.01"/></svg>',
    catalog:'<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21z"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5"/></svg>'
  };return icons[type]||'';
}
function styles(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #app .home-featured:first-of-type{padding-top:38px!important}
    #app .home-featured:first-of-type .home-product-head{display:block!important;margin-bottom:14px!important}
    #app .home-featured:first-of-type .home-product-title-link{font-size:34px!important;line-height:1!important;margin-top:4px!important}
    #app .rc-camera-heading{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
    #app .rc-camera-heading p{margin:0 0 3px!important;color:#7d7d7d!important;font-size:12px!important;line-height:1.45!important}
    #app .rc-camera-toolbar{display:flex;align-items:center;gap:10px;margin:0 0 18px;flex-wrap:wrap}
    #app .rc-camera-tool{position:relative;height:50px;padding:0 15px;border:1px solid #e3e7ed;border-radius:13px;background:#fff;color:#172033;display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:850;cursor:pointer;box-shadow:0 6px 18px rgba(20,32,50,.045);transition:transform .16s ease,box-shadow .16s ease}
    #app .rc-camera-tool:hover{transform:translateY(-1px);box-shadow:0 9px 22px rgba(20,32,50,.08)}
    #app .rc-camera-tool .toolIcon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center}
    #app .rc-camera-tool svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    #app .rc-camera-tool .toolArrow{margin-left:7px}
    #app .rc-camera-tool.new{background:#f7fbff}.rc-camera-tool.new .toolIcon{background:#eaf4ff;color:#2374da}
    #app .rc-camera-tool.promo{background:#fff9f4}.rc-camera-tool.promo .toolIcon{background:#fff0e5;color:#f26a21}
    #app .rc-camera-tool.catalog{background:#f6f9ff}.rc-camera-tool.catalog .toolIcon{background:#e9f1ff;color:#286ed1}
    #app .rc-camera-tool .newBadge{position:absolute;top:-9px;left:10px;padding:3px 6px;border-radius:999px;background:#ff4f4f;color:#fff;font-size:7px;font-weight:950;line-height:1}
    #app .rc-camera-search{height:50px;min-width:280px;max-width:460px;flex:1;display:flex;align-items:center;border:1px solid #e0e4ea;border-radius:13px;background:#fff;box-shadow:0 6px 18px rgba(20,32,50,.035);overflow:hidden}
    #app .rc-camera-search .searchIcon{width:44px;display:grid;place-items:center;color:#8a93a1}
    #app .rc-camera-search svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    #app .rc-camera-search input{min-width:0;flex:1;height:100%;border:0;outline:0;background:transparent;padding:0 8px 0 0;font:inherit;font-size:12px;color:#172033}
    #app .rc-camera-search input::placeholder{color:#a0a7b1}
    #app .rc-camera-search button{width:48px;height:100%;border:0;border-left:1px solid #edf0f3;background:#fff;color:#172033;display:grid;place-items:center;cursor:pointer}
    #app .home-featured:first-of-type .home-product-view{display:none!important}
    body.rc-home-toolbar-ready header .rc-header-product-search,
    body.rc-home-toolbar-ready header .header-search,
    body.rc-home-toolbar-ready header .search-wrap{display:none!important}
    @media(max-width:760px){
      #app .home-featured:first-of-type{padding-top:30px!important}
      #app .home-featured:first-of-type .home-product-title-link{font-size:30px!important}
      #app .rc-camera-heading{gap:7px;align-items:flex-start;flex-direction:column}
      #app .rc-camera-heading p{font-size:10px!important;margin-top:1px!important}
      #app .rc-camera-toolbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:14px}
      #app .rc-camera-tool{height:46px;padding:0 9px;justify-content:center;font-size:9px;border-radius:11px}
      #app .rc-camera-tool .toolIcon{width:26px;height:26px;border-radius:8px}
      #app .rc-camera-tool .toolArrow{display:none}
      #app .rc-camera-search{grid-column:1/-1;width:100%;min-width:0;max-width:none;height:46px;border-radius:11px}
      #app .rc-camera-search input{font-size:13px}
    }
    @media(max-width:420px){
      #app .rc-camera-tool{gap:6px;padding:0 6px;font-size:8px}
      #app .rc-camera-tool .toolIcon{width:24px;height:24px}
    }
  `;document.head.appendChild(s);
}
function hideHeaderSearch(){
  const inputs=[...document.querySelectorAll('header input')].filter(x=>/cari produk|brand|kategori/i.test(x.placeholder||''));
  inputs.forEach(input=>{
    const box=input.closest('.rc-header-product-search,.header-search,.search-wrap')||input.parentElement;
    if(box)box.style.setProperty('display','none','important');
  });
}
function submitSearch(input){
  const q=String(input?.value||'').trim();
  go(q?'/produk?q='+encodeURIComponent(q):'/produk');
}
function toolbar(){
  return '<div class="rc-camera-toolbar">'+
    '<button type="button" class="rc-camera-tool new" data-rc-camera-new><span class="newBadge">NEW</span><span class="toolIcon">'+svg('new')+'</span><span>Produk Baru</span><span class="toolArrow">'+svg('arrow')+'</span></button>'+
    '<button type="button" class="rc-camera-tool promo" data-rc-camera-promo><span class="toolIcon">'+svg('promo')+'</span><span>Promo</span><span class="toolArrow">'+svg('arrow')+'</span></button>'+
    '<button type="button" class="rc-camera-tool catalog" data-rc-camera-catalog><span class="toolIcon">'+svg('catalog')+'</span><span>Katalog</span><span class="toolArrow">'+svg('arrow')+'</span></button>'+
    '<form class="rc-camera-search" data-rc-camera-search><span class="searchIcon">'+svg('search')+'</span><input type="search" placeholder="Cari produk, brand, atau kategori..." autocomplete="off"><button type="submit" aria-label="Cari">'+svg('search')+'</button></form>'+
  '</div>';
}
function mount(){
  if(location.pathname!=='/'){document.body.classList.remove('rc-home-toolbar-ready');return}
  const app=document.getElementById('app');if(!app)return;
  const sections=[...app.querySelectorAll('.home-featured')];
  const camera=sections.find(s=>/kamera/i.test(s.querySelector('.home-product-title-link')?.textContent||s.querySelector('h2')?.textContent||''))||sections[0];
  if(!camera)return;
  styles();hideHeaderSearch();document.body.classList.add('rc-home-toolbar-ready');
  const head=camera.querySelector('.home-product-head');
  if(!head)return;
  const title=head.querySelector('.home-product-title-link,h2');
  if(title&&!head.querySelector('.rc-camera-heading')){
    const wrap=document.createElement('div');wrap.className='rc-camera-heading';
    title.parentNode.insertBefore(wrap,title);wrap.appendChild(title);
    const p=document.createElement('p');p.textContent='Kamera profesional untuk setiap cerita besar.';wrap.appendChild(p);
  }
  head.querySelector('.home-product-view')?.remove();
  if(!camera.querySelector('.rc-camera-toolbar')){
    head.insertAdjacentHTML('afterend',toolbar());
  }
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-rc-camera-new]')){go('/produk?label=NEW');return}
  if(e.target.closest('[data-rc-camera-promo]')){go('/produk?label=PROMO%2CNEW%2CDISKON');return}
  if(e.target.closest('[data-rc-camera-catalog]')){go('/produk?cat=cinema');return}
});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-rc-camera-search]');if(!f)return;
  e.preventDefault();submitSearch(f.querySelector('input'));
});
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('popstate',schedule);
})();