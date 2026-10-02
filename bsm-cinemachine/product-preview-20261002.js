/* Same-origin CMS drafts render through the real storefront; nothing is saved. */
(function(){
 if(new URLSearchParams(location.search).get('cmsPreview')!=='1'||parent===window)return;
 const origin=location.origin;let draft=null,config=null,applying=false;
 function products(){try{return Array.isArray(P)?P:[]}catch(_){return []}}
 function apply(){
  if(!draft||applying||typeof render!=='function')return;
  const id=decodeURIComponent(location.pathname.split('/')[2]||'cms-draft-product'),p={...draft,id,name:draft.name||'Produk Baru',price:Number(draft.price)||0,stock:Number(draft.stock)||0,brand:draft.brand||'',img:draft.images?.[0]||draft.image||draft.img||'',inc:draft.included||draft.inc||[],cat:draft.category||draft.cat||'',spec:draft.spec||[]};
  window.RENTCAM_PRODUCT_DRAFT=p;
  const c=structuredClone(config||{});c.productOverrides={...(c.productOverrides||{}),[id]:p};c.customProducts=(c.customProducts||[]).filter(x=>String(x.id)!==id);c.customProducts.push(p);window.RENTCAM_CMS_CONFIG=c;
  const all=products(),existing=all.find(x=>String(x.id)===id);if(existing)Object.assign(existing,p);else all.push(p);
  applying=true;try{render();document.dispatchEvent(new CustomEvent('rentcam-cms-updated'));parent.postMessage({type:'rentcam-preview-applied'},origin);}finally{applying=false;}
 }
 addEventListener('message',event=>{if(event.origin!==origin||event.source!==parent||event.data?.type!=='rentcam-product-draft'||!event.data.product||typeof event.data.product!=='object')return;draft=event.data.product;config=event.data.config;apply();});
 document.addEventListener('click',event=>{const button=event.target.closest('a,[data-go],[onclick]');if(button&&(/\badd\s*\(|\bgo\s*\(/.test(button.getAttribute('onclick')||'')||button.matches('a,[data-go]'))){event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener('rentcam-cms-updated',()=>{if(!applying)apply();});
 parent.postMessage({type:'rentcam-preview-ready'},origin);
 let attempts=0;const timer=setInterval(()=>{if(draft&&typeof render==='function'){apply();clearInterval(timer);}else if(++attempts>=40)clearInterval(timer);},250);
})();
