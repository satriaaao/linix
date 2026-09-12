/* Rentcam promo: full image banner + clean swipe interactions */
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

      /* Hide banner navigation arrows everywhere — swipe/drag still works */
      body #app .promo-arrow,
      body #app .promo-prev,
      body #app .promo-next{display:none!important;visibility:hidden!important;pointer-events:none!important}

      body #app .promo-slider{
        margin:0 0 20px!important;
        border-radius:22px!important;
        overflow:hidden!important;
        box-shadow:0 18px 50px rgba(0,0,0,.14)!important;
        width:100%!important;
        background:#090909!important;
        position:relative!important;
        z-index:1!important;
        touch-action:pan-y!important;
      }

      body #app .promo-slide{
        position:relative!important;
        height:clamp(320px,29vw,420px)!important;
        min-height:320px!important;
        grid-template-columns:1fr!important;
        padding:42px 56px 48px 56px!important;
        background-size:cover!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        isolation:isolate!important;
      }

      body #app .promo-slide:nth-child(1){background-image:url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=90')!important}
      body #app .promo-slide:nth-child(2){background-image:url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2000&q=90')!important}
      body #app .promo-slide:nth-child(3){background-image:url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=90')!important}

      body #app .promo-slide::before{
        content:""!important;position:absolute!important;inset:0!important;
        background:linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.62) 34%,rgba(0,0,0,.34) 60%,rgba(0,0,0,.15) 100%),linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.20))!important;
        z-index:0!important;pointer-events:none!important;
      }

      body #app .promo-copy{position:relative!important;z-index:2!important;max-width:640px!important}
      body #app .promo-copy h2{font-size:48px!important;line-height:1!important;letter-spacing:-.05em!important;color:#fff!important;text-shadow:0 3px 18px rgba(0,0,0,.28)!important}
      body #app .promo-copy p{max-width:570px!important;font-size:15px!important;color:rgba(255,255,255,.92)!important;text-shadow:0 2px 10px rgba(0,0,0,.25)!important}
      body #app .promo-visual{display:none!important}
      body #app .promo-dots{left:56px!important;bottom:18px!important;z-index:3!important}
      body #app .product-search-wrap{margin-top:20px!important}

      /* Homepage hero: swipe/drag enabled without covering arrows */
      body #app .hero{position:relative!important;touch-action:pan-y!important;user-select:none!important;-webkit-user-select:none!important;cursor:grab!important}
      body #app .hero:active{cursor:grabbing!important}

      @media(max-width:1024px){
        body #app .page>.container{padding-top:16px!important}
        body #app .promo-slide{height:300px!important;min-height:300px!important;padding:34px 44px 40px 44px!important;background-position:center center!important}
        body #app .promo-copy h2{font-size:40px!important}
        body #app .promo-dots{left:44px!important}
      }

      @media(max-width:820px){
        body #app .page>.container{padding-top:14px!important}
        body #app .promo-slide{height:270px!important;min-height:270px!important;padding:30px 36px 36px 36px!important;background-position:center center!important}
        body #app .promo-copy h2{font-size:34px!important}
        body #app .promo-copy p{font-size:13px!important}
        body #app .promo-dots{left:36px!important}
      }

      @media(max-width:620px){
        body #app .page>.container{padding-top:12px!important}
        body #app .promo-slider{border-radius:18px!important;margin-bottom:14px!important}
        body #app .promo-slide{height:220px!important;min-height:220px!important;padding:24px 20px 32px 20px!important;background-position:center center!important}
        body #app .promo-copy h2{font-size:27px!important;max-width:280px!important}
        body #app .promo-copy p{font-size:11px!important;max-width:285px!important}
        body #app .promo-dots{left:20px!important;bottom:10px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function fixProductLayout(){
    if(location.pathname!='/produk') return;
    const app=document.getElementById('app');
    const container=app?.querySelector('.page>.container');
    const promo=container?.querySelector('.promo-slider');
    const meta=container?.querySelector('.product-meta');
    if(meta) meta.style.display='none';
    if(container&&promo&&container.firstElementChild!==promo) container.insertBefore(promo,container.firstElementChild);
  }

  function replaceHomeHero(){
    try{
      if(location.pathname!=='/' || typeof hero!=='function') return;
      const current=document.querySelector('#app .hero');
      if(!current) return;
      current.outerHTML=hero();
      requestAnimationFrame(setupHomeHeroSwipe);
    }catch(e){}
  }

  function moveHomeHero(dir){
    try{
      if(typeof SL==='undefined'||!Array.isArray(SL)||!SL.length||typeof hi==='undefined') return;
      hi=(hi+dir+SL.length)%SL.length;
      replaceHomeHero();
    }catch(e){}
  }

  function setupHomeHeroSwipe(){
    if(location.pathname!=='/') return;
    const el=document.querySelector('#app .hero');
    if(!el||el.dataset.rentcamSwipeReady==='1') return;
    el.dataset.rentcamSwipeReady='1';

    let x0=null,y0=null,pointerId=null;
    el.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,a,input,textarea,select')) return;
      x0=e.clientX;y0=e.clientY;pointerId=e.pointerId;
      try{el.setPointerCapture(e.pointerId)}catch(_){}
    });
    el.addEventListener('pointerup',e=>{
      if(x0===null||pointerId!==e.pointerId) return;
      const dx=e.clientX-x0,dy=e.clientY-y0;
      x0=null;y0=null;pointerId=null;
      if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.15) moveHomeHero(dx<0?1:-1);
    });
    el.addEventListener('pointercancel',()=>{x0=null;y0=null;pointerId=null});
  }

  function run(){
    installStyle();
    fixProductLayout();
    setupHomeHeroSwipe();
  }

  const schedule=()=>requestAnimationFrame(run);
  schedule();
  const app=document.getElementById('app');
  if(app&&!app.dataset.promoTopFixObserver){
    app.dataset.promoTopFixObserver='1';
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  }
  addEventListener('popstate',schedule);
})();
