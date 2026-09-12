/* Rentcam product live rerender v10 */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  let queued=false;
  function refresh(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      if(!location.pathname.startsWith('/produk'))return;
      try{if(typeof render==='function')render()}catch(e){console.warn('Rentcam live rerender',e)}
      setTimeout(()=>document.dispatchEvent(new CustomEvent('rentcam-route-change',{detail:{path:location.pathname}})),60);
    });
  }
  document.addEventListener('rentcam-cms-updated',()=>setTimeout(refresh,0));
})();