/* Rentcam product search */
(function(){
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function install(){
    if(typeof P==='undefined'||typeof go!=='function'||typeof pc!=='function') return false;

    const old=document.getElementById('rentcam-product-search-style');
    if(old) old.remove();
    const st=document.createElement('style');
    st.id='rentcam-product-search-style';
    st.textContent=`
      .product-search-wrap{display:flex;align-items:center;gap:10px;margin:18px 0 14px;max-width:680px}
      .product-search-box{flex:1;height:50px;border:1px solid #dcdfe3;background:#fff;display:flex;align-items:center;padding:0 15px;gap:10px;border-radius:10px}
      .product-search-box svg{width:20px;height:20px;stroke:#777;fill:none;stroke-width:2;flex:0 0 auto}
      .product-search-box input{width:100%;height:100%;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:#111}
      .product-search-box input::placeholder{color:#9aa0a6}
      .product-search-btn{height:50px;padding:0 20px;border:0;border-radius:10px;background:#111;color:#fff;font-size:14px;font-weight:800;cursor:pointer}
      .product-search-clear{height:50px;padding:0 14px;border:1px solid #dcdfe3;border-radius:10px;background:#fff;color:#555;font-size:13px;font-weight:700;cursor:pointer}
      .product-empty{padding:48px 10px;text-align:center;color:#777;border-top:1px solid #eee;border-bottom:1px solid #eee}
      @media(max-width:620px){
        .product-search-wrap{margin:14px 0 12px;gap:8px;max-width:none}
        .product-search-box{height:46px;border-radius:9px;padding:0 12px}
        .product-search-box input{font-size:14px}
        .product-search-btn{height:46px;padding:0 15px;font-size:13px;border-radius:9px}
        .product-search-clear{display:none}
      }
    `;
    document.head.appendChild(st);

    window.rentcamSearch=function(){
      const input=document.getElementById('productSearchInput');
      const value=(input?.value||'').trim();
      const u=new URLSearchParams(location.search);
      const cat=u.get('cat')||'';
      let path='/produk';
      const n=new URLSearchParams();
      if(cat) n.set('cat',cat);
      if(value) n.set('q',value);
      const qs=n.toString();
      if(qs) path+='?'+qs;
      go(path);
    };

    window.rentcamClearSearch=function(){
      const u=new URLSearchParams(location.search);
      const cat=u.get('cat')||'';
      go(cat?'/produk?cat='+encodeURIComponent(cat):'/produk');
    };

    window.products=function(){
      const u=new URLSearchParams(location.search);
      const cat=u.get('cat')||'';
      const q=(u.get('q')||'').trim();
      const qLower=q.toLowerCase();
      const a=P.filter(x=>(!cat||x.cat===cat)&&(!qLower||`${x.name} ${x.cat} ${x.sku||''}`.toLowerCase().includes(qLower)));
      const allCats=[...new Set(P.map(x=>x.cat))];
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${cat?esc(cat):'ARRI Products'}</h1><p>${a.length} products</p></div><div class="product-search-wrap"><div class="product-search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="productSearchInput" value="${esc(q)}" placeholder="Cari nama produk atau SKU..." onkeydown="if(event.key==='Enter')rentcamSearch()"></div><button class="product-search-btn" onclick="rentcamSearch()">Cari</button>${q?'<button class="product-search-clear" onclick="rentcamClearSearch()">Hapus</button>':''}</div><div class="arri-cats"><button class="arri-cat ${!cat?'on':''}" onclick="go('/produk${q?`?q=${encodeURIComponent(q)}`:''}')">All</button>${allCats.map(c=>{const s=new URLSearchParams();s.set('cat',c);if(q)s.set('q',q);return `<button class="arri-cat ${cat===c?'on':''}" onclick="go('/produk?${s.toString()}')">${esc(c)}</button>`}).join('')}</div>${a.length?`<div class="products-grid">${a.map(pc).join('')}</div>`:`<div class="product-empty">Produk tidak ditemukan. Coba kata kunci lain.</div>`}</div></section>`;
    };

    if(location.pathname==='/produk' && typeof render==='function') render();
    return true;
  }

  let tries=0; const t=setInterval(()=>{tries++; if(install()||tries>50) clearInterval(t)},100);
})();
