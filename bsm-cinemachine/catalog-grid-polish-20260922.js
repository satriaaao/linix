(()=>{
'use strict';
const ID='rc-catalog-grid-polish-style';
function mount(){
  if(location.pathname!=='/produk')return;
  if(!document.getElementById(ID)){
    const s=document.createElement('style');s.id=ID;s.textContent=`
      html body #app .page>.container{padding-top:28px!important;padding-bottom:42px!important}
      html body #app .product-meta{margin-bottom:18px!important}
      html body #app .product-meta h1{margin:0 0 7px!important;font-size:clamp(30px,3.2vw,46px)!important;line-height:1!important;letter-spacing:-.045em!important;color:#151b24!important}
      html body #app .product-meta p{margin:0!important;color:#7d8795!important;font-size:12px!important}
      html body #app .product-search-wrap{max-width:none!important;margin:18px 0 16px!important}
      html body #app .catalog-filter-row{max-width:none!important;margin:0 0 26px!important}
      html body #app .catalog-group{margin:0 0 34px!important;padding-top:4px!important}
      html body #app .catalog-group+ .catalog-group{padding-top:26px!important;border-top:1px solid #eceff3!important}
      html body #app .catalog-group header{margin-bottom:18px!important}
      html body #app .products-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:22px!important;row-gap:26px!important;align-items:stretch!important}
      html body #app .pcard,html body #app .product-card{margin:0!important;min-width:0!important;border-radius:16px!important;overflow:hidden!important}
      html body #app #catalogResults{display:block!important}
      html body #app .product-empty{margin:24px 0!important;border:1px dashed #dce2e9!important;border-radius:16px!important;background:#fafbfc!important}
      html body.rc-products-new #app #promoSlider{display:none!important}
      html body.rc-products-new #app .product-meta h1:after{content:"";display:inline-block;width:8px;height:8px;margin-left:9px;border-radius:50%;background:#2d7ef7;vertical-align:middle}
      html body.rc-products-promo #app .product-meta h1:after{content:"";display:inline-block;width:8px;height:8px;margin-left:9px;border-radius:50%;background:#f26a21;vertical-align:middle}
      @media(max-width:1050px){html body #app .products-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px!important;row-gap:22px!important}}
      @media(max-width:700px){
        html body #app .page>.container{padding-top:20px!important;padding-bottom:30px!important}
        html body #app .product-meta h1{font-size:30px!important}
        html body #app .products-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;row-gap:16px!important}
        html body #app .catalog-group{margin-bottom:26px!important}
        html body #app .catalog-group header{margin-bottom:13px!important}
      }
    `;document.head.appendChild(s);
  }
  const p=new URLSearchParams(location.search);
  document.body.classList.toggle('rc-products-new',p.get('new')==='1');
  document.body.classList.toggle('rc-products-promo',p.get('promo')==='1');
}
let q=false;
function schedule(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('popstate',schedule);
})();