/* Rentcam product detail mobile layout fix v12 */
(function(){
  if(location.pathname.startsWith('/cms')) return;
  function install(){
    if(document.getElementById('rentcam-detail-mobile-v12')) return;
    const s=document.createElement('style');
    s.id='rentcam-detail-mobile-v12';
    s.textContent=`
      @media(max-width:700px){
        #app .product-detail-simple .detail-top{
          display:flex!important;
          flex-direction:column!important;
          align-items:stretch!important;
          gap:16px!important;
          position:relative!important;
          overflow:visible!important;
        }
        #app .product-detail-simple .detail-media{
          order:1!important;
          width:100%!important;
          min-width:0!important;
          height:auto!important;
          position:relative!important;
          inset:auto!important;
          margin:0!important;
          padding:0!important;
          transform:none!important;
          overflow:visible!important;
          z-index:1!important;
        }
        #app .product-detail-simple .cms-gallery{
          display:flex!important;
          flex-direction:column!important;
          width:100%!important;
          gap:10px!important;
          position:relative!important;
          overflow:visible!important;
        }
        #app .product-detail-simple .cms-gallery-main{
          width:100%!important;
          aspect-ratio:1/1!important;
          height:auto!important;
          min-height:0!important;
          margin:0!important;
          position:relative!important;
          border-radius:16px!important;
          overflow:hidden!important;
        }
        #app .product-detail-simple .cms-gallery-main img{
          width:100%!important;
          height:100%!important;
          object-fit:contain!important;
          display:block!important;
          transform:none!important;
        }
        #app .product-detail-simple .cms-gallery-thumbs{
          display:flex!important;
          grid-template-columns:none!important;
          width:100%!important;
          gap:8px!important;
          margin:0!important;
          padding:0 0 4px!important;
          overflow-x:auto!important;
          overflow-y:hidden!important;
          position:relative!important;
          z-index:2!important;
          -webkit-overflow-scrolling:touch!important;
          scrollbar-width:none!important;
        }
        #app .product-detail-simple .cms-gallery-thumbs::-webkit-scrollbar{display:none!important}
        #app .product-detail-simple .cms-gallery-thumb{
          flex:0 0 76px!important;
          width:76px!important;
          height:76px!important;
          min-width:76px!important;
          aspect-ratio:1/1!important;
          margin:0!important;
          padding:4px!important;
          position:relative!important;
          inset:auto!important;
          transform:none!important;
          border-radius:12px!important;
          overflow:hidden!important;
        }
        #app .product-detail-simple .cms-gallery-thumb.on{padding:3px!important}
        #app .product-detail-simple .cms-gallery-thumb img{
          width:100%!important;
          height:100%!important;
          object-fit:contain!important;
          display:block!important;
          transform:none!important;
        }
        #app .product-detail-simple .detail-info{
          order:2!important;
          width:100%!important;
          min-width:0!important;
          height:auto!important;
          position:static!important;
          inset:auto!important;
          top:auto!important;
          left:auto!important;
          right:auto!important;
          bottom:auto!important;
          margin:0!important;
          padding:0!important;
          transform:none!important;
          z-index:auto!important;
          overflow:visible!important;
        }
        #app .product-detail-simple .detail-brand{
          position:static!important;
          margin:2px 0 6px!important;
          transform:none!important;
        }
        #app .product-detail-simple .detail-info h1{
          position:static!important;
          inset:auto!important;
          width:100%!important;
          margin:0 0 10px!important;
          padding:0!important;
          transform:none!important;
          font-size:30px!important;
          line-height:1.08!important;
          letter-spacing:-.035em!important;
          word-break:break-word!important;
          z-index:auto!important;
        }
        #app .product-detail-simple .detail-price{
          position:static!important;
          inset:auto!important;
          display:flex!important;
          align-items:baseline!important;
          flex-wrap:wrap!important;
          gap:6px!important;
          width:100%!important;
          margin:0 0 16px!important;
          padding:0!important;
          transform:none!important;
          line-height:1.1!important;
          z-index:auto!important;
        }
        #app .product-detail-simple .detail-price .cms-product-price{
          font-size:28px!important;
          line-height:1.1!important;
          font-weight:900!important;
          white-space:nowrap!important;
        }
        #app .product-detail-simple .detail-price small{
          position:static!important;
          margin:0!important;
          padding:0!important;
          font-size:14px!important;
          line-height:1.2!important;
          color:#666!important;
        }
        #app .product-detail-simple .detail-sections{
          position:static!important;
          width:100%!important;
          margin:0!important;
          padding:0!important;
          transform:none!important;
        }
        #app .product-detail-simple .detail-section,
        #app .product-detail-simple .cms-detail-block{
          position:static!important;
          width:100%!important;
          margin:0 0 14px!important;
          padding:16px!important;
          transform:none!important;
          border:1px solid #ececec!important;
          border-radius:16px!important;
          background:#fff!important;
          overflow:visible!important;
        }
        #app .product-detail-simple .detail-section h2,
        #app .product-detail-simple .cms-detail-block h2{
          position:static!important;
          margin:0 0 10px!important;
          padding:0!important;
          font-size:22px!important;
          line-height:1.15!important;
        }
        #app .product-detail-simple .detail-section p,
        #app .product-detail-simple .cms-detail-block p,
        #app .product-detail-simple .cms-detail-block li{
          font-size:15px!important;
          line-height:1.65!important;
        }
      }
      @media(max-width:420px){
        #app .product-detail-simple .cms-gallery-thumb{
          flex-basis:68px!important;
          width:68px!important;
          min-width:68px!important;
          height:68px!important;
        }
        #app .product-detail-simple .detail-info h1{font-size:28px!important}
        #app .product-detail-simple .detail-price .cms-product-price{font-size:26px!important}
        #app .product-detail-simple .detail-section h2,
        #app .product-detail-simple .cms-detail-block h2{font-size:20px!important}
      }
    `;
    document.head.appendChild(s);
  }
  install();
  document.addEventListener('rentcam-route-change',install);
  document.addEventListener('rentcam-cms-updated',install);
})();
