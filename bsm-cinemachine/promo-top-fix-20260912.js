/* Rentcam promo: full image banner, top spacing, rounded corners, hide product heading */
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

      body #app .promo-slider{
        margin:0 0 20px!important;
        border-radius:22px!important;
        overflow:hidden!important;
        box-shadow:0 18px 50px rgba(0,0,0,.14)!important;
        width:100%!important;
        background:#090909!important;
        position:relative!important;
        z-index:1!important;
      }

      body #app .promo-slide{
        position:relative!important;
        height:clamp(320px,29vw,420px)!important;
        min-height:320px!important;
        grid-template-columns:1fr!important;
        padding:42px 82px 48px 56px!important;
        background-size:cover!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        isolation:isolate!important;
      }

      body #app .promo-slide:nth-child(1){
        background-image:url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=90')!important;
      }
      body #app .promo-slide:nth-child(2){
        background-image:url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=90')!important;
      }
      body #app .promo-slide:nth-child(3){
        background-image:url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=90')!important;
      }

      body #app .promo-slide::before{
        content:""!important;
        position:absolute!important;
        inset:0!important;
        background:
          linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.62) 34%,rgba(0,0,0,.34) 60%,rgba(0,0,0,.15) 100%),
          linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.20))!important;
        z-index:0!important;
        pointer-events:none!important;
      }

      body #app .promo-copy{
        position:relative!important;
        z-index:2!important;
        max-width:640px!important;
      }
      body #app .promo-copy h2{
        font-size:48px!important;
        line-height:1!important;
        letter-spacing:-.05em!important;
        color:#fff!important;
        text-shadow:0 3px 18px rgba(0,0,0,.28)!important;
      }
      body #app .promo-copy p{
        max-width:570px!important;
        font-size:15px!important;
        color:rgba(255,255,255,.92)!important;
        text-shadow:0 2px 10px rgba(0,0,0,.25)!important;
      }
      body #app .promo-visual{display:none!important}
      body #app .promo-dots{left:56px!important;bottom:18px!important;z-index:3!important}
      body #app .promo-prev,body #app .promo-next{z-index:3!important}
      body #app .product-search-wrap{margin-top:20px!important}

      @media(max-width:1024px){
        body #app .page>.container{padding-top:16px!important}
        body #app .promo-slide{
          height:300px!important;
          min-height:300px!important;
          padding:34px 64px 40px 44px!important;
          background-position:center center!important;
        }
        body #app .promo-copy h2{font-size:40px!important}
        body #app .promo-dots{left:44px!important}
      }

      @media(max-width:820px){
        body #app .page>.container{padding-top:14px!important}
        body #app .promo-slide{
          height:270px!important;
          min-height:270px!important;
          padding:30px 56px 36px 36px!important;
          background-position:center center!important;
        }
        body #app .promo-copy h2{font-size:34px!important}
        body #app .promo-copy p{font-size:13px!important}
        body #app .promo-dots{left:36px!important}
      }

      @media(max-width:620px){
        body #app .page>.container{padding-top:12px!important}
        body #app .promo-slider{border-radius:18px!important;margin-bottom:14px!important}
        body #app .promo-slide{
          height:220px!important;
          min-height:220px!important;
          padding:24px 42px 32px 20px!important;
          background-position:center center!important;
        }
        body #app .promo-copy h2{font-size:27px!important;max-width:280px!important}
        body #app .promo-copy p{font-size:11px!important;max-width:285px!important}
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
