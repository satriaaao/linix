/* Rentcam header logo dedupe v13 — remove only the left duplicate logo */
(function(){
  function fix(){
    const brand=document.querySelector('.header .brand');
    if(!brand)return;
    const imgs=[...brand.querySelectorAll('img')].filter(i=>i.offsetParent!==null || i.classList.contains('cms-logo-img'));
    if(imgs.length>1){
      /* User requested: remove the left logo, keep the right one. */
      imgs.slice(0,-1).forEach(i=>i.remove());
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fix,120));
  else setTimeout(fix,120);
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(fix,80));
  document.addEventListener('rentcam-route-change',()=>setTimeout(fix,80));
  setTimeout(fix,700);
})();
