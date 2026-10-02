/* All promo entry points open the combined published promo/new catalog. */
(function(){
 if(location.pathname.startsWith('/cms'))return;
 const promo='/produk?label=PROMO%2CNEW%2CDISKON%2CBARANG%20BARU';let pointer=null;
 document.addEventListener('pointerdown',e=>{if(target(e))pointer={x:e.clientX,y:e.clientY,moved:false};},true);
 document.addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>8)pointer.moved=true;},true);
 function target(e){return e.target.closest('.rc-promo-float,[data-rc-camera-promo],.rc-label.sale,.rc-label.promo');}
 function open(e){if(!target(e))return;e.preventDefault();e.stopImmediatePropagation();if(window.RENTCAM_PRODUCT_DRAFT)return;if(e.type==='touchend'&&pointer?.moved||e.type==='click'&&e.detail>0&&pointer?.moved)return;try{sessionStorage.setItem('rentcam_force_promo_list','1')}catch(_){}location.assign(promo);}
 document.addEventListener('click',open,true);document.addEventListener('touchend',open,{capture:true,passive:false});
})();
