/* Rentcam route loader v7 — only load what the current page needs */
(function(){
  const BASE='https://cdn.jsdelivr.net/gh/satriaaao/linix@';
  const files={
    images:['8a585cd72fa186b5277350b4c872310c8910b319','product-images-20260912.js'],
    homeClean:['e6704eb2e5e2faa0ede94cb7af40dfadb46aade3','home-category-cleanup.js'],
    search:['57bf81a3fbc9aed67a1c31d7bb331c6f5acf3b13','product-search-20260912.js'],
    promoTop:['7a84295cbd025a40f5c9df58c6f06a963068fbb7','promo-top-fix-20260912.js'],
    cardCart:['312cbfaa68db7efc7ba86f02a0fc6b2d6acb6b4e','product-card-cart-20260912.js'],
    related:['c2e5e5b6ecf97ccbe335a94c20236088c19c2830','related-products-20260912.js'],
    detailPolish:['1d70b028762c23b9ba685a1a332ba244325bc433','detail-content-polish-20260912.js'],
    homeSections:['536652b63ae36e03048fdf05491606ed51bb563b','home-product-sections-20260912.js'],
    editorial:['e3f19a19de24a6e78d291732c79ae986aa8e50cd','portfolio-article-polish-20260912.js'],
    cmsContent:['1315b917583f9b7d456c642f59792b785d89e8e1','cms-content-render-20260912.js'],
    advanced:['90d4d015cc20c73107acfa9e6af8f3a650bbc370','product-advanced-runtime-v7-20260912.js'],
    promo:['22117a96ec1159a0ecc44ea8b9fccdefe8084dda','promo-schedule-runtime-v7-20260912.js']
  };
  const loaded=new Set();
  function url(k){const [ref,name]=files[k];return `${BASE}${ref}/bsm-cinemachine/${name}`}
  function load(k){if(loaded.has(k)||document.querySelector(`script[data-route-file="${k}"]`))return;loaded.add(k);const s=document.createElement('script');s.src=url(k);s.async=false;s.dataset.routeFile=k;document.head.appendChild(s)}
  function loadFor(path){if(path==='/'){['images','homeClean','promoTop','homeSections','advanced','promo'].forEach(load);return}if(path==='/produk'){['images','search','cardCart','advanced','promo'].forEach(load);return}if(path.startsWith('/produk/')){['images','related','detailPolish','advanced','promo'].forEach(load);return}if(path==='/cart'){['images','advanced'].forEach(load);return}if(path.startsWith('/portfolio')||path.startsWith('/artikel')){['editorial','cmsContent'].forEach(load)}}
  loadFor(location.pathname);
  document.addEventListener('rentcam-route-change',()=>loadFor(location.pathname));addEventListener('popstate',()=>loadFor(location.pathname));
})();