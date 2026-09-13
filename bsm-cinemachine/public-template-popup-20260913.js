/* Rentcam public template copy + promo popup */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cfg=()=>window.RENTCAM_CMS_CONFIG||{};
  const defaultPopup=()=>({
    enabled:true,
    type:'promo',
    eyebrow:'PROMO',
    title:'Promo Rental Hari Ini',
    text:'Cek promo dan produk terbaru. Klik untuk langsung masuk ke halaman produk.',
    buttonLabel:'Lihat produk promo',
    productId:'arri-alexa-mini-lf',
    buttonLink:'/produk/arri-alexa-mini-lf',
    image:(window.SL&&SL[0]?.img)||'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=88',
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
    if(p.enabled===false||document.querySelector('.rc-site-popup')) return;
    const version=String(p.version||p.title||'promo');
    const key='rentcam_popup_seen_'+version;
    try{if(sessionStorage.getItem(key)==='1') return}catch(e){}
    const type=String(p.type||p.category||p.eyebrow||'promo').toLowerCase();
    const label=type.includes('new')||type.includes('baru')?'BARANG BARU':'PROMO';
    const path=p.productId?'/produk/'+encodeURIComponent(p.productId):(p.buttonLink||'/produk');
    const wrap=document.createElement('div');
    wrap.className='rc-site-popup';
    wrap.innerHTML=`<div class="rc-site-popup-card" role="dialog" aria-modal="true" aria-label="${E(p.title||'Promo')}">
      <button class="rc-site-popup-close" type="button" aria-label="Tutup popup">&times;</button>
      ${p.image?`<img class="rc-site-popup-img" src="${E(p.image)}" alt="">`:''}
      <div class="rc-site-popup-body">
        <small>${E(p.eyebrow||label)}</small>
        <h2>${E(p.title||'Promo terbaru')}</h2>
        <p>${E(p.text||'Cek produk dan penawaran terbaru kami.')}</p>
        <button class="rc-site-popup-cta" type="button">${E(p.buttonLabel||'Lihat produk')}</button>
      </div>
    </div>`;
    const close=()=>{
      try{sessionStorage.setItem(key,'1')}catch(e){}
      wrap.classList.remove('show');
      setTimeout(()=>wrap.remove(),220);
    };
    wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('.rc-site-popup-close')) close()});
    wrap.querySelector('.rc-site-popup-cta').addEventListener('click',()=>{
      close();
      if(typeof go==='function') go(path); else location.href=path;
    });
    document.body.append(wrap);
    requestAnimationFrame(()=>wrap.classList.add('show'));
  }
  function style(){
    if(document.getElementById('rc-template-popup-style')) return;
    const s=document.createElement('style');
    s.id='rc-template-popup-style';
    s.textContent=`
      .rc-site-popup{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,12,18,.48);padding:18px;opacity:0;transition:.2s ease;backdrop-filter:blur(10px)}
      .rc-site-popup.show{opacity:1}
      .rc-site-popup-card{position:relative;width:min(480px,100%);overflow:hidden;border-radius:24px;background:#fff;box-shadow:0 28px 80px rgba(0,0,0,.28);transform:translateY(12px) scale(.98);transition:.2s ease}
      .rc-site-popup.show .rc-site-popup-card{transform:none}
      .rc-site-popup-close{position:absolute;right:12px;top:12px;z-index:2;width:40px;height:40px;border:0;border-radius:999px;background:rgba(255,255,255,.88);font-size:26px;line-height:1;cursor:pointer}
      .rc-site-popup-img{width:100%;height:210px;object-fit:cover;display:block;background:#f3f4f6}
      .rc-site-popup-body{padding:24px}
      .rc-site-popup-body small{display:inline-flex;border:1px solid #e8edf3;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;letter-spacing:.13em;color:#f26a21}
      .rc-site-popup-body h2{margin:14px 0 8px;font-size:31px;line-height:1.04;color:#101114}
      .rc-site-popup-body p{margin:0 0 18px;color:#59616d;font-size:15px;line-height:1.55}
      .rc-site-popup-cta{width:100%;border:0;border-radius:14px;background:#111;color:#fff;font-weight:900;padding:15px 18px;font-size:15px;cursor:pointer}
      @media(max-width:640px){.rc-site-popup{align-items:flex-end;padding:12px}.rc-site-popup-card{border-radius:22px}.rc-site-popup-img{height:180px}.rc-site-popup-body h2{font-size:25px}}
    `;
    document.head.append(s);
  }
  function run(){style();copy();setTimeout(copy,120);setTimeout(copy,600);setTimeout(popup,900)}
  document.addEventListener('rentcam-cms-updated',run);
  document.addEventListener('rentcam-route-change',run);
  addEventListener('popstate',run);
  run();
})();
