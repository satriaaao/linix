/* Rentcam cart navigation hardening */
(function(){
  if(location.pathname.startsWith('/cms')) return;

  function openCart(){
    const drawer=document.getElementById('drawer');
    drawer?.classList.remove('open');
    document.body.classList.remove('menu-open');
    if(location.pathname==='/cart'){
      requestAnimationFrame(()=>scrollTo(0,0));
      return;
    }
    try{
      if(typeof window.go==='function'){
        window.go('/cart');
      }else{
        history.pushState({},'','/cart');
        if(typeof window.render==='function') window.render();
        else location.assign('/cart');
      }
    }catch(_){
      location.assign('/cart');
    }
    requestAnimationFrame(()=>scrollTo(0,0));
  }

  function isCartTarget(target){
    if(!target?.closest) return false;
    return Boolean(target.closest('.rc-cart-button,[data-go="/cart"],[aria-label*="Keranjang"],[aria-label*="keranjang"],.home-open-cart'));
  }

  function handle(e){
    if(!isCartTarget(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    openCart();
  }

  ['click','touchend','pointerup'].forEach(type=>{
    document.addEventListener(type,handle,true);
  });

  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&isCartTarget(e.target)){
      handle(e);
    }
  },true);
})();
