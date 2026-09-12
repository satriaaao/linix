/* Rentcam app loader + global back-button click fix */
document.write('<script src="https://cdn.jsdelivr.net/gh/satriaaao/linix@eb571c2066d51232bf89eff4249aebbf8023e650/bsm-cinemachine/app.js"><\/script>');
(function(){
  function handleBack(e){
    const btn=e.target && e.target.closest ? e.target.closest('.product-detail-simple .back-link') : null;
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof window.go==='function') window.go('/produk');
    else { history.pushState({},'', '/produk'); if(typeof window.render==='function') window.render(); else location.href='/produk'; }
  }
  document.addEventListener('click',handleBack,true);
  document.addEventListener('touchend',handleBack,true);
})();
