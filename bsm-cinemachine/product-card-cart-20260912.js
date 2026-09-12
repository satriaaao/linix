/* Rentcam — add-to-cart button on every rendered product card */
(function(){
  function installStyle(){
    if(document.getElementById('rentcam-card-cart-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-card-cart-style';
    st.textContent=`
      #app .products-grid .pcard{display:flex!important;flex-direction:column!important}
      #app .products-grid .pcard .price{margin-top:auto!important}
      #app .product-card-cart-btn{
        width:calc(100% - 28px)!important;
        min-height:42px!important;
        margin:14px 14px 16px!important;
        padding:0 16px!important;
        border:1px solid #111!important;
        border-radius:10px!important;
        background:#111!important;
        color:#fff!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        font:inherit!important;
        font-size:12px!important;
        font-weight:800!important;
        line-height:1!important;
        cursor:pointer!important;
        box-sizing:border-box!important;
      }
      #app .product-card-cart-btn:hover{background:#242424!important}
      #app .product-card-cart-btn svg{width:16px!important;height:16px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important;flex:0 0 auto!important}
      #app .product-card-cart-btn .cart-mobile-label{display:none!important}

      @media(max-width:620px){
        #app .product-card-cart-btn{
          width:calc(100% - 20px)!important;
          min-height:36px!important;
          height:36px!important;
          margin:10px!important;
          padding:0 9px!important;
          border-radius:9px!important;
          gap:5px!important;
          font-size:10px!important;
        }
        #app .product-card-cart-btn svg{width:14px!important;height:14px!important}
        #app .product-card-cart-btn .cart-desktop-label{display:none!important}
        #app .product-card-cart-btn .cart-mobile-label{display:inline!important}
      }
    `;
    document.head.appendChild(st);
  }

  function getProductId(card){
    const raw=card.getAttribute('onclick')||'';
    const m=raw.match(/\/produk\/([^'\")]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function injectButtons(){
    installStyle();
    document.querySelectorAll('#app .products-grid .pcard').forEach(card=>{
      if(card.querySelector('.product-card-cart-btn')) return;
      const id=getProductId(card);
      if(!id) return;

      const btn=document.createElement('button');
      btn.type='button';
      btn.className='product-card-cart-btn';
      btn.innerHTML=`
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/><path d="M12 8v6M9 11h6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>
        <span class="cart-desktop-label">Tambah ke Keranjang</span><span class="cart-mobile-label">Tambah</span>`;
      btn.addEventListener('click',ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.add==='function') window.add(id,1);
        else if(typeof add==='function') add(id,1);
      });
      card.appendChild(btn);
    });
  }

  function run(){ requestAnimationFrame(injectButtons); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();

  const app=document.getElementById('app');
  if(app){
    new MutationObserver(run).observe(app,{childList:true,subtree:true});
  }else{
    document.addEventListener('DOMContentLoaded',()=>{
      const root=document.getElementById('app');
      if(root) new MutationObserver(run).observe(root,{childList:true,subtree:true});
      run();
    });
  }
  addEventListener('popstate',run);
})();
