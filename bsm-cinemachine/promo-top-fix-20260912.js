/* Rentcam promo: top position, cinematic gradient backgrounds, hide product heading */
(function(){
  function installStyle(){
    if(document.getElementById('rentcam-promo-top-fix-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-promo-top-fix-style';
    st.textContent=`
      body #app .page{padding-top:0!important}
      body #app .page>.container{padding-top:0!important}
      body #app .product-meta{display:none!important}
      body #app .promo-slider{margin:0 0 20px!important;border-radius:0 0 22px 22px!important;box-shadow:0 18px 50px rgba(0,0,0,.14)!important}
      body #app .promo-slide{height:300px!important;grid-template-columns:1fr!important;padding:38px 78px 38px 54px!important;background-size:cover!important;background-position:center!important}
      body #app .promo-slide:nth-child(1){background-image:linear-gradient(90deg,rgba(7,7,7,.88) 0%,rgba(11,11,11,.72) 42%,rgba(11,11,11,.34) 70%,rgba(11,11,11,.16) 100%),url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1800&q=88')!important}
      body #app .promo-slide:nth-child(2){background-image:linear-gradient(90deg,rgba(10,10,10,.90) 0%,rgba(15,15,15,.74) 43%,rgba(15,15,15,.34) 72%,rgba(15,15,15,.16) 100%),url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1800&q=88')!important}
      body #app .promo-slide:nth-child(3){background-image:linear-gradient(90deg,rgba(7,20,32,.92) 0%,rgba(10,45,77,.78) 45%,rgba(15,52,84,.36) 72%,rgba(15,52,84,.14) 100%),url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=88')!important}
      body #app .promo-slide::before{background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.28))!important}
      body #app .promo-copy{max-width:640px!important}
      body #app .promo-copy h2{font-size:48px!important;line-height:.98!important;letter-spacing:-.05em!important;text-shadow:0 3px 18px rgba(0,0,0,.28)!important}
      body #app .promo-copy p{max-width:570px!important;font-size:15px!important;color:rgba(255,255,255,.9)!important;text-shadow:0 2px 10px rgba(0,0,0,.25)!important}
      body #app .promo-visual{display:none!important}
      body #app .promo-dots{left:54px!important;bottom:18px!important}
      body #app .product-search-wrap{margin-top:20px!important}
      @media(max-width:820px){
        body #app .promo-slide{height:245px!important;padding:30px 58px 32px 42px!important}
        body #app .promo-copy h2{font-size:38px!important}
        body #app .promo-copy p{font-size:13px!important}
        body #app .promo-dots{left:42px!important}
      }
      @media(max-width:620px){
        body #app .promo-slider{border-radius:0 0 16px 16px!important;margin-bottom:14px!important}
        body #app .promo-slide{height:195px!important;padding:22px 42px 30px 20px!important;background-position:center!important}
        body #app .promo-copy h2{font-size:27px!important;max-width:270px!important}
        body #app .promo-copy p{font-size:11px!important;max-width:280px!important}
        body #app .promo-dots{left:20px!important;bottom:10px!important}
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
