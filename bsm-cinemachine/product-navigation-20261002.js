/* One client-side transition for product cards, preserving cart and promo actions. */
(()=>{
 if(location.pathname.startsWith('/cms')||window.__rentcamProductNavigation)return;window.__rentcamProductNavigation=true;
 function pathFor(target){
  if(target.closest('[data-rc-camera-promo],.rc-label.sale,.rc-label.promo,.home-add-cart,.home-open-cart,.product-card-cart-btn,button,input,select,textarea'))return null;
  const link=target.closest('a[href]');if(link){const url=new URL(link.href,location.origin);if(url.origin!==location.origin||link.target&&link.target!=='_self'||link.hasAttribute('download'))return null;if(/^\/produk\/[^/]+$/.test(url.pathname))return url.pathname+url.search;}
  const card=target.closest('.home-category-card,.pcard,.related-card,[data-product-id]');if(!card)return null;const id=card.dataset.productId;const match=card.getAttribute('onclick')?.match(/go\(['"](\/produk\/[^'"]+)['"]\)/);return id?'/produk/'+encodeURIComponent(id):match?.[1]||null;
 }
 document.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const path=pathFor(e.target);if(!path||typeof window.go!=='function')return;e.preventDefault();e.stopImmediatePropagation();document.getElementById('drawer')?.classList.remove('open');document.body.classList.remove('menu-open');if(location.pathname+location.search!==path)window.go(path);},true);
 const warmed=new Set();document.addEventListener('pointerover',e=>{const path=pathFor(e.target);if(!path)return;try{const id=decodeURIComponent(path.split('/')[2].split('?')[0]),p=P.find(x=>String(x.id)===id),original=p?.images?.[0]||p?.img,src=window.rentcamFastProductImage?.(original)||original;if(src&&!warmed.has(src)){warmed.add(src);const preload=new Image();preload.src=src;}}catch(_){}},{passive:true});
})();
