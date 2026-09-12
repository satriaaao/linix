/* Rentcam promo: top position, full image gradient backgrounds, hide product heading */
(function(){
  function installStyle(){
    const old=document.getElementById('rentcam-promo-top-fix-style');
    if(old) old.remove();
    const st=document.createElement('style');
    st.id='rentcam-promo-top-fix-style';
    st.textContent=`
      body #app .page{padding-top:0!important}
      body #app .page>.container{padding-top:18px!important}
      body #app .product-meta{display:none!important}
      body #app .promo-slider{margin:0 0 20px!important;border-radius:22px!important;overflow:hidden!important;box-shadow:0 18px 50px rgba(0,0,0,.14)!important;width:100%!important;background:#090909!important;position:relative!important;z-index:1!important}
      body #app .promo-slide{height:clamp(330px,29vw,420px)!important;min-height:330px!important;grid-template-columns:1fr!important;padding:42px 82px 48px 56px!important;background-color:#090909!important;background-size:100% 100%,auto 100%!important;background-repeat:no-repeat,no-repeat!important;background-position:center,right center!important}
      body #app .promo-slide:nth-child(1){background-image:linear-gradient(90deg,#080808 0%,rgba(8,8,8,.96) 34%,rgba(8,8,8,.82) 49%,rgba(8,8,8,.42) 68%,rgba(8,8,8,.08) 100%),url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=90')!important}
      body #app .promo-slide:nth-child(2){background-image:linear-gradient(90deg,#0a0a0a 0%,rgba(10,10,10,.96) 34%,rgba(10,10,10,.82) 49%,rgba(10,10,10,.42) 68%,rgba(10,10,10,.08) 100%),url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=90')!important}
      body #app .promo-slide:nth-child(3){background-image:linear-gradient(90deg,#071520 0%,rgba(7,21,32,.96) 34%,rgba(8,35,58,.82) 49%,rgba(10,48,78,.42) 68%,rgba(10,48,78,.08) 100%),url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=90')!important}
      body #app .promo-slide::before{background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.18))!important}
      body #app .promo-copy{max-width:650px!important}
      body #app .promo-copy h2{font-size:48px!important;line-height:.98!important;letter-spacing:-.05em!important;text-shadow:0 3px 18px rgba(0,0,0,.28)!important}
      body #app .promo-copy p{max-width:570px!important;font-size:15px!important;color:rgba(255,255,255,.9)!important;text-shadow:0 2px 10px rgba(0,0,0,.25)!important}
      body #app .promo-visual{display:none!important}
      body #app .promo-dots{left:56px!important;bottom:20px!important}
      body #app .product-search-wrap{margin-top:20px!important}
      @media(max-width:1024px){
        body #app .page>.container{padding-top:16px!important}
        body #app .promo-slide{height:clamp(300px,31vw,360px)!important;min-height:300px!important;padding:36px 64px 42px 46px!important;background-size:100% 100%,auto 100%!important;background-position:center,right center!important}
        body #app .promo-copy h2{font-size:42px!important}
        body #app .promo-dots{left:46px!important}
      }
      @media(max-width:820px){
        body #app .page>.container{padding-top:14px!important}
        body #app .promo-slide{height:280px!important;min-height:280px!important;padding:32px 58px 38px 40px!important;background-size:100% 100%,auto 100%!important;background-position:center,right center!important}
        body #app .promo-copy h2{font-size:36px!important}
        body #app .promo-copy p{font-size:13px!important}
        body #app .promo-dots{left:40px!important}
      }
      @media(max-width:620px){
        body #app .page>.container{padding-top:10px!important}
        body #app .promo-slider{border-radius:16px!important;margin-bottom:14px!important}
        body #app .promo-slide{height:220px!important;min-height:220px!important;padding:24px 42px 34px 20px!important;background-size:100% 100%,auto 100%!important;background-position:center,right center!important}
        body #app .promo-copy h2{font-size:27px!important;max-width:280px!important}
        body #app .promo-copy p{font-size:11px!important;max-width:285px!important}
        body #app .promo-dots{left:20px!important;bottom:11px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function fixLayout(){
    if(location.pathname!='/produk') return;
    installStyle();
    const app=document.getElementById('app');
    const container=app?.querySelector('.page>.container');
    const promo=container?.querySelector('.promo-slider');
    const meta=container?.querySelector('.product-meta');
    if(meta) meta.style.display='none';
    if(container&&promo&&container.firstElementChild!==promo){
      container.insertBefore(promo,container.firstElementChild);
    }
  }

  const run=()=>requestAnimationFrame(fixLayout);
  run();
  const app=document.getElementById('app');
  if(app&&!app.dataset.promoTopFixObserver){
    app.dataset.promoTopFixObserver='1';
    new MutationObserver(run).observe(app,{childList:true,subtree:true});
  }
  addEventListener('popstate',run);
})();
