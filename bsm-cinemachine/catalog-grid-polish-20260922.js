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
      html body #app .products-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px!important;row-gap:24px!important;align-items:stretch!important}
      html body #app .pcard,html body #app .product-card{margin:0!important;min-width:0!important;border:1px solid #e9e9e6!important;border-radius:15px!important;overflow:hidden!important;background:#fff!important;display:flex!important;flex-direction:column!important;transition:transform .16s ease,box-shadow .16s ease!important}
      html body #app .pcard:hover,html body #app .product-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 30px rgba(0,0,0,.07)!important}
      html body #app .pcard .pimg{width:100%!important;aspect-ratio:1.12/1!important;height:auto!important;min-height:0!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;background:#fff!important}
      html body #app .pcard .pimg>img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important;padding:0!important}
      html body #app .pcard .pbrand{margin:12px 14px 0!important;padding:0!important;font-size:9px!important;line-height:1.2!important;color:#8a8a8a!important;letter-spacing:.07em!important;text-transform:uppercase!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      html body #app .pcard .pname{margin:6px 14px 0!important;padding:0!important;min-height:39px!important;font-size:15px!important;line-height:1.28!important;font-weight:800!important;color:#111!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
      html body #app .pcard .price{margin:14px 14px 0!important;padding:0!important;min-height:24px!important;display:flex!important;align-items:baseline!important;gap:6px!important;font-size:18px!important;line-height:1!important;font-weight:850!important;color:#111!important}
      html body #app .pcard .product-card-cart-btn{width:calc(100% - 28px)!important;height:40px!important;min-height:40px!important;margin:14px!important;margin-top:auto!important;padding:0 12px!important;border:0!important;border-radius:10px!important;background:#111!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:11px!important;font-weight:850!important}
      html body #app .pcard .product-card-cart-btn svg{width:17px!important;height:17px!important}
      html body #app .pcard .hoverBtns{display:none!important}
      html body #app .pcard .arri-source-badge{left:11px!important;top:11px!important;border-radius:999px!important;padding:7px 9px!important;font-size:8px!important}
      html body #app #catalogResults{display:block!important}
      html body #app .product-empty{margin:24px 0!important;border:1px dashed #dce2e9!important;border-radius:16px!important;background:#fafbfc!important}
      html body.rc-products-new #app #promoSlider{display:none!important}
      html body.rc-products-new #app .product-meta h1:after{content:"";display:inline-block;width:8px;height:8px;margin-left:9px;border-radius:50%;background:#2d7ef7;vertical-align:middle}
      html body.rc-products-promo #app .product-meta h1:after{content:"";display:inline-block;width:8px;height:8px;margin-left:9px;border-radius:50%;background:#f26a21;vertical-align:middle}
      @media(max-width:1050px){html body #app .products-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important;row-gap:20px!important}}
      @media(max-width:700px){
        html body #app .page>.container{padding-top:20px!important;padding-bottom:30px!important}
        html body #app .product-meta h1{font-size:30px!important}
        html body #app .products-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;row-gap:14px!important}
        html body #app .pcard,html body #app .product-card{border-radius:13px!important}
        html body #app .pcard .pimg{aspect-ratio:1.2/1!important}
        html body #app .pcard .pbrand{margin:9px 10px 0!important;font-size:8px!important}
        html body #app .pcard .pname{margin:5px 10px 0!important;min-height:32px!important;font-size:12.5px!important}
        html body #app .pcard .price{margin:11px 10px 0!important;font-size:16px!important}
        html body #app .pcard .product-card-cart-btn{width:calc(100% - 20px)!important;height:36px!important;min-height:36px!important;margin:10px!important;font-size:10px!important}
        html body #app .pcard .product-card-cart-btn svg{width:15px!important;height:15px!important}
        html body #app .pcard .arri-source-badge{left:8px!important;top:8px!important;padding:6px 8px!important;font-size:7px!important}
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