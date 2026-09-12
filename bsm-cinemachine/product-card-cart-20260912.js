/* Rentcam — add-to-cart button on every product card */
(function(){
  const aud=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

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
        transition:transform .15s ease,background .15s ease!important;
        box-sizing:border-box!important;
      }
      #app .product-card-cart-btn:hover{background:#242424!important;transform:translateY(-1px)!important}
      #app .product-card-cart-btn svg{width:16px!important;height:16px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important;flex:0 0 auto!important}
      #app .product-card-cart-btn .cart-mobile-label{display:none!important}

      @media(max-width:620px){
        #app .product-card-cart-btn{
          width:calc(100% - 20px)!important;
          min-height:36px!important;
          height:36px!important;
          margin:10px 10px 10px!important;
          padding:0 9px!important;
          border-radius:9px!important;
          gap:5px!important;
          font-size:10px!important;
        }
        #app .product-card-cart-btn svg{width:14px!important;height:14px!important}
        #app .product-card-cart-btn .cart-desktop-label{display:none!important}
        #app .product-card-cart-btn .cart-mobile-label{display:inline!important}
      }

      @media(max-width:390px){
        #app .product-card-cart-btn{font-size:9.5px!important;padding:0 7px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function overrideCard(){
    if(typeof window.go!=='function' || typeof window.add!=='function' || typeof window.P==='undefined') return false;
    installStyle();
    window.pc=function(p){
      return `<article class="pcard" onclick="go('/produk/${p.id}')">
        <div class="pimg" style="position:relative">
          <span class="arri-source-badge">ARRI</span>
          <img src="${p.img}" alt="${esc(p.name)}">
          <div class="hoverBtns"><button onclick="event.stopPropagation();go('/produk/${p.id}')">Quick view</button></div>
        </div>
        <div class="pbrand">ARRI · ${esc(p.cat)}</div>
        <div class="pname">${esc(p.name)}</div>
        <div class="price"><span class="source-price">${aud(p.priceAud ?? p.price)}</span></div>
        <button class="product-card-cart-btn" type="button" onclick="event.stopPropagation();add('${String(p.id).replace(/'/g,"\\'")}',1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/><path d="M12 8v6M9 11h6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>
          <span class="cart-desktop-label">Tambah ke Keranjang</span><span class="cart-mobile-label">Tambah</span>
        </button>
      </article>`;
    };
    return true;
  }

  function apply(){
    if(!overrideCard()) return;
    if(location.pathname==='/produk' && typeof window.render==='function') window.render();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));
  else setTimeout(apply,0);
})();
