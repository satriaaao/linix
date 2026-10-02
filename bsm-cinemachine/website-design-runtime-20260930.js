/* Apply the CMS appearance settings to the public storefront. */
(function(){
  if(location.pathname.startsWith('/cms'))return;
  const lib=window.RentcamWebsiteDesign;if(!lib)return;
  const text=(el,value)=>{if(el&&value!=null&&el.textContent!==String(value))el.textContent=String(value);};
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function theme(config){
    const t=lib.getTheme(config),h=config.homepage||{};
    let s=document.getElementById('rc-website-design-style');if(!s){s=document.createElement('style');s.id='rc-website-design-style';document.head.appendChild(s);}
    const css=`
      :root{--orange:${t.accent}}
      html body:has(#app){background:${t.background}!important;color:${t.text}!important;font-family:${lib.fonts[t.font]}!important}
      html body #app{color:${t.text}!important;font-family:${lib.fonts[t.font]}!important}
      html body #app .home-product-sections{background:${t.background}!important}
      html body #app .home-product-head:has(.cms-heading-subtitle){flex-wrap:wrap!important}
      html body #app .home-product-head .cms-heading-subtitle{flex-basis:100%;order:3;margin:0;font-size:13px;line-height:1.5;color:#747b87}
      html body #app .container,html body #app .rc-home-slide-inner{max-width:${t.contentWidth}px!important}
      html body #app .products-grid .pcard,html body #app .home-product-grid .home-category-card,html body #app .related-products-grid .related-card{border-radius:${t.cardRadius}px!important}
      html body #app .products-grid .pcard .product-card-cart-btn,html body #app .home-category-actions button,html body #app .rc-home-actions button,html body #app .product-search-btn{border-radius:${t.buttonRadius}px!important}
      html body #app .rc-home-actions button.primary,html body #app .rc-camera-tool .newBadge,html body #app .rc-label.sale,html body #app .products-grid .pcard .product-card-cart-btn,html body #app .home-category-actions .home-add-cart,html body #app .product-search-btn{background:${t.accent}!important;border-color:${t.accent}!important;color:#fff!important}
      html body #app .rc-home-eyebrow::before,html body #app .rc-home-dot.is-active::after{background:${t.accent}!important}
      html body #app .products-grid .pcard .pname,html body #app .home-category-body .home-category-name,html body #app .products-grid .pcard .price{color:${t.text}!important}
      html body .header{position:${t.headerSticky?'sticky':'relative'}!important;top:0!important}
      ${h.heroEnabled===false?'html body #app .rc-home-carousel{display:none!important}':''}
      ${h.productsEnabled===false?'html body #app #rentcam-home-product-sections,html body #app .home-product-sections{display:none!important}':''}
      ${h.articlesEnabled===false?'html body #app .home-journal,html body #app .home-editorial,html body #app .home-articles,html body #app .home-article-section{display:none!important}':''}
      ${h.newsletterEnabled===false?'html body #app .newsletter{display:none!important}':''}
      ${h.servicesEnabled===false?'html body #app .services{display:none!important}':''}
      ${h.portfolioEnabled===false?'html body #app .home-portfolio{display:none!important}':''}
      ${h.brandsEnabled===false?'html body #app .rc-brand-equipment{display:none!important}':''}
      ${config.popup?.enabled===false?'html body .rc-promo-widget{display:none!important}':''}
      ${config.appearance?.catalogHeadingEnabled===true?'html body #app .page .product-meta{display:block!important}':''}
    `;
    if(s.textContent!==css)s.textContent=css;
  }
  function hero(config){
    if(location.pathname!=='/')return;
    const slides=lib.getSlides(config);
    document.querySelectorAll('#app .rc-home-slide').forEach((el,i)=>{
      const s=slides[i];if(!s)return;
      text(el.querySelector('.rc-home-eyebrow'),s.eyebrow);text(el.querySelector('h1'),s.title);text(el.querySelector('p'),s.text);
      for(const [selector,label,path] of [['.primary',s.primary,s.primaryPath],['.secondary',s.secondary,s.secondaryPath]]){
        const b=el.querySelector(selector);text(b,label);if(b&&b.dataset.rcGo!==path)b.dataset.rcGo=path;
      }
      const background='url("'+s.image.replace(/"/g,'%22')+'")';if(el.style.backgroundImage!==background)el.style.backgroundImage=background;
    });
    const input=document.querySelector('.rc-camera-search input');if(input&&config.appearance?.homeSearchPlaceholder)input.placeholder=config.appearance.homeSearchPlaceholder;
    document.querySelectorAll('.rc-home-trust span').forEach((el,i)=>text(el,config.appearance?.heroTrust?.[i]));
    text(document.querySelector('.rc-brand-head h2'),config.appearance?.brandTitle);text(document.querySelector('.rc-brand-head>p'),config.appearance?.brandSubtitle);text(document.querySelector('.home-journal .home-product-head h2'),config.appearance?.homeArticlesTitle);
    document.querySelectorAll('#app .home-product-section').forEach(el=>{
      const category=el.querySelector('.home-product-title-link')?.getAttribute('onclick')?.match(/cat=([^'"&)]+)/)?.[1];
      const key=category==='cinema'?'camera':category;if(!key)return;
      text(el.querySelector('.home-product-title-link,.home-product-head h2'),config.homepage?.[key+'Title']);
      let subtitle=el.querySelector('.home-product-head p,.rc-camera-heading p');
      if(!subtitle&&config.homepage?.[key+'Subtitle']){subtitle=document.createElement('p');subtitle.className='cms-heading-subtitle';el.querySelector('.home-product-head')?.append(subtitle);}
      text(subtitle,config.homepage?.[key+'Subtitle']);
    });
    text(document.querySelector('#rentcam-home-general h2,.home-general h2'),config.homepage?.generalTitle);text(document.querySelector('#rentcam-home-general p,.home-general p'),config.homepage?.generalSubtitle);
  }
  function navigation(config){
    if(!Array.isArray(config.navigation))return;
    const drawerMarkup=n=>'<span class="drawer-link-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4"/></svg></span><span><b>'+escape(n.label)+'</b><small>Buka halaman</small></span>';
    for(const host of document.querySelectorAll('.header .nav,#drawer .rc-drawer-nav')){
      const signature=JSON.stringify(config.navigation);
      if(host.dataset.designNav===signature){
        host.querySelectorAll('[data-design-index]').forEach(a=>{const n=config.navigation[Number(a.dataset.designIndex)];if(!n)return;if(host.closest('#drawer')){if(a.querySelector('b')?.textContent!==String(n.label||''))a.innerHTML=drawerMarkup(n);}else text(a,n.label);});
        continue;
      }
      const tracking=host.querySelector('[data-track-desktop],[data-go="/cek-order"]');
      const isDrawer=host.closest('#drawer');
      const nodes=config.navigation.map((n,i)=>({n,i})).filter(({n})=>n.enabled!==false).map(({n,i})=>{
        const path=lib.link(n.path,'/'),a=document.createElement('a');a.href=path;
        a.dataset.designIndex=String(i);
        if(path.startsWith('/'))a.dataset.go=path;else{a.target='_blank';a.rel='noopener';}
        if(isDrawer){a.className='drawer-link';a.innerHTML=drawerMarkup(n);}
        else a.textContent=String(n.label||'Menu');
        return a;
      });
      if(isDrawer){const cart=host.querySelector('[data-go="/cart"]');if(cart&&!nodes.some(a=>a.dataset.go==='/cart'))nodes.push(cart);}
      if(tracking&&!nodes.some(a=>a.dataset.go==='/cek-order'))nodes.push(tracking);
      host.replaceChildren(...nodes);host.dataset.designNav=signature;
    }
  }
  function catalog(config){if(location.pathname!=='/produk')return;
    const banners=lib.getCatalogSlides(config);
    document.querySelectorAll('#promoTrack .promo-slide').forEach((el,i)=>{const b=banners[i];el.hidden=!b;if(!b)return;const background='url('+JSON.stringify(b.image)+')';if(el.style.getPropertyValue('--rc-promo-image')!==background)el.style.setProperty('--rc-promo-image',background);text(el.querySelector('.promo-ey'),b.ey);text(el.querySelector('h2'),b.title);text(el.querySelector('p'),b.text);const button=el.querySelector('.promo-copy button');if(button){text(button,b.cta);button.removeAttribute('onclick');button.dataset.go=b.href;}});
    const input=document.querySelector('#productSearchInput');if(input&&config.copy?.catalogSearchPlaceholder)input.placeholder=config.copy.catalogSearchPlaceholder;text(document.querySelector('.catalog-filter-field>span'),config.copy?.catalogFilterLabel);if(!location.search)text(document.querySelector('.product-meta h1'),config.copy?.catalogTitle);}
  function footer(config){
    const host=document.querySelector('.footer .footgrid'),f=config.footer,g=config.general||{};if(!host||!f)return;
    const signature=JSON.stringify([f,g.siteName,g.whatsapp]);if(host.dataset.designFooter===signature&&host.querySelector('[data-design-footer]')){host.querySelectorAll('[data-design-footer-label]').forEach(a=>text(a,a.dataset.designFooterLabel));return;}
    const identity=document.createElement('div');identity.dataset.designFooter='';
    const brand=document.createElement('div');brand.className='brand';brand.style.color='white';brand.textContent=g.siteName||'Rentcam';
    const description=document.createElement('p');description.textContent=f.description||'';identity.append(brand,description);
    const nodes=[identity];
    for(const column of f.columns||[]){const el=document.createElement('div'),title=document.createElement('h4');title.textContent=column.title||'';el.append(title);for(const item of column.links||[]){if(item.active===false||item.deleted===true)continue;const a=document.createElement('a');a.textContent=item.label||'';a.dataset.designFooterLabel=item.label||'';const wa=String(g.whatsapp||'').replace(/\D/g,'');a.href=item.path==='#whatsapp'&&wa?'https://wa.me/'+wa:lib.link(item.path,'/');if(a.getAttribute('href').startsWith('/'))a.dataset.go=a.getAttribute('href');else{a.target='_blank';a.rel='noopener';}el.append(a);}nodes.push(el);}
    const copyright=document.createElement('div');copyright.className='cms-footer-copy';copyright.style.cssText='grid-column:1/-1;border-top:1px solid rgba(255,255,255,.12);padding-top:18px;margin-top:8px;font-size:11px;color:#888';copyright.textContent=f.copyright||'';nodes.push(copyright);host.replaceChildren(...nodes);host.dataset.designFooter=signature;
  }
  function apply(){const config=window.RENTCAM_CMS_CONFIG;if(!config||!document.getElementById('app'))return;theme(config);hero(config);navigation(config);catalog(config);footer(config);text(document.querySelector('.rc-promo-float span'),config.popup?.floatLabel);const page=location.pathname==='/portfolio'?'portfolio':location.pathname==='/artikel'?'articles':null;if(page){text(document.querySelector('.ed-hero h1'),config.appearance?.[page+'Title']);text(document.querySelector('.ed-hero>p'),config.appearance?.[page+'Subtitle']);}}
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  document.addEventListener('rentcam-cms-updated',schedule);document.addEventListener('rentcam-route-change',schedule);addEventListener('popstate',schedule);
  document.addEventListener('click',e=>{const button=e.target.closest('[data-rc-go]');if(button&&/^https:\/\//.test(button.dataset.rcGo)){e.preventDefault();e.stopImmediatePropagation();location.assign(lib.link(button.dataset.rcGo));}},true);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
