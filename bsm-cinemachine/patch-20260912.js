/* Production loader: load the latest Cinemachine ARRI catalog after legacy scripts finish. */
(function(){
  const SRC='https://cdn.jsdelivr.net/gh/satriaaao/linix@031fefa01cdc4392ab513021aaa6787958024c8d/bsm-cinemachine/rentcam-live-v2.js';
  function loadCatalog(){
    if(document.querySelector('script[data-cinemachine-arri-catalog]')) return;
    const s=document.createElement('script');
    s.src=SRC;
    s.async=false;
    s.dataset.cinemachineArriCatalog='1';
    document.body.appendChild(s);
  }
  if(document.readyState==='complete') loadCatalog();
  else window.addEventListener('load',()=>setTimeout(loadCatalog,60),{once:true});
})();
