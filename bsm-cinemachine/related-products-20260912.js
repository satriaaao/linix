/* Rentcam — related products on product detail */
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const aud=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2}).format(Number(n)||0);

  function installStyle(){
    if(document.getElementById('rentcam-related-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-related-style';
    st.textContent=`
      #app .related-products-section{margin:44px 0 10px!important;padding-top:28px!important;border-top:1px solid #e9e9e9!important}
      #app .related-products-head{display:flex!important;align-items:end!important;justify-content:space-between!important;gap:16px!important;margin-bottom:20px!important}
      #app .related-products-head h2{margin:0!important;font-size:28px!important;line-height:1.05!important;letter-spacing:-.03em!important;color:#111!important}
      #app .related-products-head p{margin:6px 0 0!important;color:#777!important;font-size:13px!important}
      #app .related-products-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
      #app .related-card{display:flex!important;flex-direction:column!important;min-width:0!important;border:1px solid #e7e7e7!important;border-radius:16px!important;overflow:hidden!important;background:#fff!important;cursor:pointer!important;transition:transform .16s ease,box-shadow .16s ease!important}
      #app .related-card:hover{transform:translateY(-2px)!important;box-shadow:0 10px 28px rgba(0,0,0,.07)!important}
      #app .related-card-image{position:relative!important;aspect-ratio:1/1!important;background:#f8f8f8!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      #app .related-card-image img{width:100%!important;height:100%!important;object-fit:contain!important;background:#fff!important}
      #app .related-card-badge{position:absolute!important;left:10px!important;top:10px!important;background:#111!important;color:#fff!important;border-radius:999px!important;padding:7px 9px!important;font-size:8px!important;font-weight:900!important;letter-spacing:.06em!important}
      #app .related-card-body{display:flex!important;flex-direction:column!important;flex:1!important;padding:14px!important}
      #app .related-card-cat{font-size:9px!important;letter-spacing:.07em!important;text-transform:uppercase!important;color:#8b8b8b!important;margin-bottom:6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #app .related-card-name{font-size:14px!important;line-height:1.25!important;font-weight:800!important;color:#111!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;min-height:35px!important}
      #app .related-card-price{margin-top:12px!important;font-size:14px!important;font-weight:850!important;color:#111!important}
      #app .related-card-cart{margin-top:12px!important;width:100%!important;height:38px!important;border:1px solid #111!important;border-radius:9px!important;background:#111!important;color:#fff!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important}
      #app .related-card-cart:hover{background:#222!important}
      @media(max-width:900px){#app .related-products-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:620px){
        #app .related-products-section{margin-top:30px!important;padding-top:22px!important}
        #app .related-products-head{align-items:flex-start!important;margin-bottom:14px!important}
        #app .related-products-head h2{font-size:21px!important}
        #app .related-products-head p{font-size:11px!important}
        #app .related-products-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
        #app .related-card{border-radius:12px!important}
        #app .related-card-body{padding:10px!important}
        #app .related-card-name{font-size:12px!important;min-height:30px!important}
        #app .related-card-price{font-size:12px!important;margin-top:9px!important}
        #app .related-card-cart{height:34px!important;font-size:10px!important;margin-top:9px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function getProductId(){
    const m=location.pathname.match(/^\/produk\/([^/?#]+)/);
    return m?decodeURIComponent(m[1]):'';
  }

  function mount(){
    const id=getProductId();
    if(!id) return;
    let products;
    try{ products=P; }catch(e){ return; }
    if(!Array.isArray(products)) return;
    const current=products.find(x=>String(x.id)===id);
    if(!current) return;
    const host=document.querySelector('#app .product-detail-simple .container, #app .product-detail-simple, #app .page>.container');
    if(!host) return;
    const old=document.getElementById('rentcam-related-products');
    if(old) old.remove();
    const related=products.filter(x=>x.id!==current.id && x.cat===current.cat).slice(0,4);
    if(!related.length) return;
    installStyle();
    const section=document.createElement('section');
    section.id='rentcam-related-products';
    section.className='related-products-section';
    section.innerHTML=`<div class="related-products-head"><div><h2>Produk Sejenis</h2><p>Produk lain dalam kategori ${esc(current.cat)}</p></div></div><div class="related-products-grid">${related.map(p=>`<article class="related-card" onclick="go('/produk/${esc(p.id)}')"><div class="related-card-image"><span class="related-card-badge">ARRI</span><img src="${p.img}" alt="${esc(p.name)}"></div><div class="related-card-body"><div class="related-card-cat">ARRI · ${esc(p.cat)}</div><div class="related-card-name">${esc(p.name)}</div><div class="related-card-price">${aud(p.priceAud??p.price)}</div><button type="button" class="related-card-cart" onclick="event.stopPropagation();add('${String(p.id).replace(/'/g,"\\'")}',1)">Tambah ke Keranjang</button></div></article>`).join('')}</div>`;
    host.appendChild(section);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;mount();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0)); else setTimeout(schedule,0);
  const app=document.getElementById('app');
  if(app) new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('popstate',schedule);
})();
