(function(){
  const legacy=document.createElement('script');
  legacy.src='https://cdn.jsdelivr.net/gh/satriaaao/linix@d4b1eeea5bf62fe5f98e8180d971a9653ef2f3bd/bsm-cinemachine/rentcam-live-v2.js';

  legacy.onload=function(){
    const old=document.getElementById('rentcam-catalog-v6');
    if(old) old.remove();

    const style=document.createElement('style');
    style.id='rentcam-catalog-v6';
    style.textContent=`
      /* No status label may sit beside a product title */
      html body.rentcam-detail-clean #app .product-detail-simple .detail-info h1::before,
      html body.rentcam-detail-clean #app .product-detail-simple .detail-info h1::after,
      html body.rentcam-detail-clean #app .detail-ref-info h1::before,
      html body.rentcam-detail-clean #app .detail-ref-info h1::after,
      html body:has(#app .product-detail-simple) #app .product-detail-simple .detail-info h1::before,
      html body:has(#app .product-detail-simple) #app .product-detail-simple .detail-info h1::after{
        display:none!important;
        content:none!important;
        visibility:hidden!important;
        opacity:0!important;
        width:0!important;
        height:0!important;
        min-width:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        box-shadow:none!important;
      }

      /* Disable all old pseudo-card labels; badges are real DOM elements now */
      html body #app .pcard::before,
      html body #app .pcard::after,
      html body #app .product-row::before,
      html body #app .product-row::after{
        display:none!important;
        content:none!important;
      }

      html body #app .pimg,
      html body #app .rimg,
      html body #app .detail-media{
        position:relative!important;
      }

      /* One visual system for every status label */
      html body #app .rentcam-card-status,
      html body #app .rentcam-detail-status-unified{
        position:absolute!important;
        top:12px!important;
        left:12px!important;
        z-index:130!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        height:28px!important;
        min-width:54px!important;
        padding:0 11px!important;
        margin:0!important;
        border:0!important;
        border-radius:999px!important;
        background:#111!important;
        color:#fff!important;
        font-size:9px!important;
        line-height:1!important;
        font-weight:900!important;
        letter-spacing:.055em!important;
        white-space:nowrap!important;
        box-shadow:0 4px 12px rgba(0,0,0,.16)!important;
        pointer-events:none!important;
      }

      html body #app .rentcam-detail-badge,
      html body #app .rentcam-photo-new-badge{
        display:none!important;
      }

      @media(max-width:620px){
        html body #app .rentcam-card-status,
        html body #app .rentcam-detail-status-unified{
          top:8px!important;
          left:8px!important;
          height:24px!important;
          min-width:48px!important;
          padding:0 9px!important;
          font-size:8px!important;
        }
      }
    `;
    document.head.appendChild(style);

    const baseStatus={
      'arri-alexa-35':'NEW',
      'arri-alexa-mini-lf':'DISCONTINUED',
      'red-v-raptor-x':'DISKON 20%',
      'cooke-s8-set':'PAKET',
      'arri-signature-prime':'PAKET',
      'atlas-mercury':'PAKET'
    };

    const extras={
      'ARRI':[
        ['arri-alexa-mini','ARRI ALEXA Mini','Camera',4200000,'NEW'],
        ['arri-alexa-lf','ARRI ALEXA LF','Camera',5800000,'PAKET'],
        ['arri-hi-5','ARRI Hi-5 Hand Unit','Wireless',650000,'NEW']
      ],
      'Sony':[
        ['sony-burano','Sony BURANO 8.6K','Camera',3000000,'NEW'],
        ['sony-fx9','Sony FX9','Camera',1500000,'PAKET'],
        ['sony-fx6','Sony FX6','Camera',1100000,'NEW'],
        ['sony-fx3','Sony FX3','Camera',750000,'DISKON 20%'],
        ['sony-a7siii','Sony A7S III','Camera',550000,'PAKET'],
        ['sony-fe-c-16-35','Sony FE C 16-35mm Cinema Zoom','Lens',850000,'NEW'],
        ['sony-fe-c-28-135','Sony FE PZ 28-135mm Cinema Zoom','Lens',650000,'PAKET']
      ],
      'RED':[
        ['red-komodo-x','RED KOMODO-X 6K','Camera',1800000,'NEW'],
        ['red-komodo-6k','RED KOMODO 6K','Camera',1200000,'DISKON 20%'],
        ['red-v-raptor-xl','RED V-RAPTOR XL 8K VV','Camera',4500000,'NEW'],
        ['red-dsmc2-monstro','RED DSMC2 MONSTRO 8K VV','Camera',2600000,'PAKET'],
        ['red-dsmc2-gemini','RED DSMC2 GEMINI 5K S35','Camera',1800000,'PAKET'],
        ['red-ranger-monstro','RED RANGER MONSTRO 8K','Camera',3200000,'DISCONTINUED'],
        ['red-ranger-helium','RED RANGER HELIUM 8K','Camera',2800000,'DISCONTINUED']
      ],
      'Cooke':[
        ['cooke-s4-set','Cooke S4/i Prime Set','Lens',2600000,'PAKET'],
        ['cooke-s7-set','Cooke S7/i Full Frame Set','Lens',3200000,'PAKET'],
        ['cooke-panchro-classic','Cooke Panchro/i Classic Set','Lens',2200000,'PAKET'],
        ['cooke-sp3-set','Cooke SP3 Full Frame Set','Lens',1800000,'NEW'],
        ['cooke-anamorphic-sf','Cooke Anamorphic/i SF Set','Lens',3800000,'PAKET'],
        ['cooke-varotal-30-95','Cooke Varotal/i 30-95mm','Lens',2100000,'NEW'],
        ['cooke-varotal-85-215','Cooke Varotal/i 85-215mm','Lens',2300000,'NEW']
      ],
      'Atlas':[
        ['atlas-orion-set','Atlas Orion 2x Anamorphic Set','Lens',2600000,'PAKET'],
        ['atlas-orion-silver','Atlas Orion Silver Edition Set','Lens',3000000,'PAKET'],
        ['atlas-mercury-36','Atlas Mercury 36mm','Lens',750000,'NEW'],
        ['atlas-mercury-54','Atlas Mercury 54mm','Lens',750000,'NEW'],
        ['atlas-mercury-72','Atlas Mercury 72mm','Lens',750000,'NEW'],
        ['atlas-orion-32','Atlas Orion 32mm','Lens',700000,'DISKON 20%'],
        ['atlas-orion-50','Atlas Orion 50mm','Lens',700000,'DISKON 20%']
      ],
      'Aputure':[
        ['aputure-ls1200d','Aputure LS 1200d Pro','Lighting',950000,'PAKET'],
        ['aputure-ls600c','Aputure LS 600c Pro II','Lighting',700000,'NEW'],
        ['aputure-ls600d','Aputure LS 600d Pro','Lighting',600000,'PAKET'],
        ['aputure-storm1200x','Aputure STORM 1200x','Lighting',1050000,'NEW'],
        ['aputure-storm1000c','Aputure STORM 1000c','Lighting',900000,'NEW'],
        ['aputure-nova-p600c','Aputure Nova P600c','Lighting',650000,'PAKET'],
        ['aputure-nova-p300c','Aputure Nova P300c','Lighting',450000,'DISKON 20%']
      ],
      'Teradek':[
        ['teradek-bolt6-lt','Teradek Bolt 6 LT 750','Wireless',650000,'NEW'],
        ['teradek-bolt6-max','Teradek Bolt 6 Max','Wireless',1200000,'NEW'],
        ['teradek-bolt4k-750','Teradek Bolt 4K 750','Wireless',600000,'PAKET'],
        ['teradek-bolt4k-1500','Teradek Bolt 4K 1500','Wireless',850000,'PAKET'],
        ['teradek-serv4k','Teradek Serv 4K','Wireless',700000,'NEW'],
        ['teradek-ranger-mk2','Teradek Ranger MK II','Wireless',1400000,'NEW'],
        ['teradek-ace750','Teradek Ace 750','Wireless',400000,'DISKON 20%']
      ],
      'SmallHD':[
        ['smallhd-cine7','SmallHD Cine 7','Wireless',450000,'PAKET'],
        ['smallhd-indie7','SmallHD Indie 7','Wireless',350000,'NEW'],
        ['smallhd-703ub','SmallHD 703 UltraBright','Wireless',400000,'PAKET'],
        ['smallhd-503ub','SmallHD 503 UltraBright','Wireless',300000,'DISKON 20%'],
        ['smallhd-1303hdr','SmallHD 1303 HDR','Wireless',750000,'PAKET'],
        ['smallhd-oled22','SmallHD OLED 22','Wireless',1200000,'NEW'],
        ['smallhd-quantum32','SmallHD Quantum 32','Wireless',1600000,'NEW']
      ],
      "O'Connor":[
        ['oconnor-2560',"O'Connor 2560 Fluid Head",'Grip',550000,'PAKET'],
        ['oconnor-2065',"O'Connor 2065 Fluid Head",'Grip',500000,'NEW'],
        ['oconnor-1040',"O'Connor 1040 Fluid Head",'Grip',350000,'PAKET'],
        ['oconnor-1030d',"O'Connor 1030D Fluid Head",'Grip',300000,'DISKON 20%'],
        ['oconnor-120ex',"O'Connor 120EX Fluid Head",'Grip',800000,'PAKET'],
        ['oconnor-30l',"O'Connor 30L Tripod System",'Grip',250000,'NEW'],
        ['oconnor-ultimate-dolly',"O'Connor Ultimate Dolly Kit",'Grip',700000,'PAKET']
      ],
      'Easyrig':[
        ['easyrig-minimax','Easyrig Minimax','Grip',250000,'NEW'],
        ['easyrig-cinema3','Easyrig Cinema 3','Grip',350000,'PAKET'],
        ['easyrig-stabil-g3','Easyrig STABIL G3','Grip',300000,'NEW'],
        ['easyrig-vario5-stabil','Easyrig Vario 5 + STABIL','Grip',500000,'PAKET'],
        ['easyrig-vario5-strong','Easyrig Vario 5 Strong','Grip',475000,'NEW'],
        ['easyrig-minimax-stabil','Easyrig Minimax + STABIL','Grip',325000,'DISKON 20%'],
        ['easyrig-boom-rig','Easyrig Boom Rig','Grip',400000,'PAKET']
      ],
      'Sound Devices':[
        ['sound-devices-scorpio','Sound Devices Scorpio','Audio',1500000,'NEW'],
        ['sound-devices-833','Sound Devices 833','Audio',900000,'NEW'],
        ['sound-devices-mixpre10ii','Sound Devices MixPre-10 II','Audio',500000,'PAKET'],
        ['sound-devices-mixpre6ii','Sound Devices MixPre-6 II','Audio',350000,'DISKON 20%'],
        ['sound-devices-688','Sound Devices 688','Audio',700000,'PAKET'],
        ['sound-devices-633','Sound Devices 633','Audio',550000,'DISCONTINUED'],
        ['sound-devices-a20-nexus','Sound Devices A20-Nexus','Audio',1100000,'NEW']
      ],
      'Sennheiser':[
        ['sennheiser-mkh8060','Sennheiser MKH 8060','Audio',250000,'NEW'],
        ['sennheiser-mkh50','Sennheiser MKH 50','Audio',225000,'PAKET'],
        ['sennheiser-mkh60','Sennheiser MKH 60','Audio',225000,'PAKET'],
        ['sennheiser-mke600','Sennheiser MKE 600','Audio',125000,'DISKON 20%'],
        ['sennheiser-ewdp','Sennheiser EW-DP Wireless Set','Audio',300000,'NEW'],
        ['sennheiser-ew500g4','Sennheiser EW 500 G4 Set','Audio',250000,'PAKET'],
        ['sennheiser-mke2','Sennheiser MKE 2 Lavalier','Audio',100000,'NEW']
      ]
    };

    function imgFor(cat){
      if(cat==='Lens') return I.lens;
      if(cat==='Lighting') return I.light;
      if(cat==='Audio') return I.audio;
      return cat==='Camera'||cat==='Grip'?I.cam:I.cam2;
    }

    function specFor(cat,brand){
      if(cat==='Camera') return [['Brand',brand],['Type','Cinema Camera'],['Recording','Professional Cinema Workflow'],['Status','Dummy catalog data']];
      if(cat==='Lens') return [['Brand',brand],['Type','Cinema Lens'],['Mount','Cinema Mount'],['Status','Dummy catalog data']];
      if(cat==='Lighting') return [['Brand',brand],['Type','Cinema Lighting'],['Control','Professional Set Control'],['Status','Dummy catalog data']];
      if(cat==='Wireless') return [['Brand',brand],['Type','Monitoring / Wireless'],['Use','Production Workflow'],['Status','Dummy catalog data']];
      if(cat==='Grip') return [['Brand',brand],['Type','Grip & Support'],['Use','Cinema Production'],['Status','Dummy catalog data']];
      return [['Brand',brand],['Type','Production Audio'],['Use','Location Sound'],['Status','Dummy catalog data']];
    }

    function incFor(cat){
      if(cat==='Camera') return ['Main Unit','Battery x2','Media','Support Plate','Production Case'];
      if(cat==='Lens') return ['Lens / Set','Front & Rear Caps','Support Kit','Lens Case'];
      if(cat==='Lighting') return ['Fixture','Yoke','Power Cable','Control Accessories','Case'];
      if(cat==='Wireless') return ['Main Unit','Power Cable','Mounting Kit','Accessories','Case'];
      if(cat==='Grip') return ['Main Unit','Plate / Adapter','Handle / Support','Bag / Case'];
      return ['Main Unit','Power Kit','Audio Accessories','Bag / Case'];
    }

    Object.keys(extras).forEach(brand=>{
      const already=P.filter(x=>x.brand===brand).length;
      const need=Math.max(0,8-already);
      extras[brand].slice(0,need).forEach(row=>{
        const [id,name,cat,price,badge]=row;
        if(P.some(x=>x.id===id)) return;
        P.push({
          id,name,brand,cat,price,
          img:imgFor(cat),
          stock:Math.max(1,Math.min(5,(P.length%5)+1)),
          spec:specFor(cat,brand),
          inc:incFor(cat),
          badge,
          dummy:true
        });
      });
    });

    /* Guarantee exactly at least 8 per current brand even if the seed changes later */
    [...new Set(P.map(x=>x.brand))].forEach(brand=>{
      let count=P.filter(x=>x.brand===brand).length;
      let n=1;
      while(count<8){
        const base=P.find(x=>x.brand===brand);
        const id=(brand.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-dummy-'+n).replace(/^-|-$/g,'');
        n++;
        if(P.some(x=>x.id===id)) continue;
        P.push({
          id,
          name:`${brand} Rental Demo ${count+1}`,
          brand,
          cat:base?.cat||'Camera',
          price:base?.price||500000,
          img:base?.img||I.cam,
          stock:2,
          spec:specFor(base?.cat||'Camera',brand),
          inc:incFor(base?.cat||'Camera'),
          badge:'NEW',
          dummy:true
        });
        count++;
      }
    });

    function badgeFor(p){ return p.badge||baseStatus[p.id]||''; }

    function catalogCard(p){
      const badge=badgeFor(p);
      return `<article class="pcard" onclick="go('/produk/${p.id}')"><div class="pimg"><img src="${p.img}" alt="${p.name}">${badge?`<span class="rentcam-card-status">${badge}</span>`:''}<div class="hoverBtns"><button onclick="event.stopPropagation();go('/produk/${p.id}')">Quick view</button><button onclick="event.stopPropagation();add('${p.id}')">Add to cart</button></div></div><div class="pbrand">${p.brand}</div><div class="pname">${p.name}</div><div class="price">From ${rp(p.price)} <small>/ full day</small></div></article>`;
    }

    function catalogRow(p){
      const badge=badgeFor(p);
      return `<article class="product-row" onclick="go('/produk/${p.id}')"><div class="rimg"><img src="${p.img}" alt="${p.name}">${badge?`<span class="rentcam-card-status">${badge}</span>`:''}</div><div class="meta"><small>${p.brand}</small><h3>${p.name}</h3></div><div class="side"><div class="price">From ${rp(p.price)}</div><button onclick="event.stopPropagation();add('${p.id}')">Tambah Rental</button></div></article>`;
    }

    const getSort=()=>localStorage.getItem('rentcam_product_sort')||'featured';
    const getView=()=>localStorage.getItem('rentcam_product_view')||'grid';
    window.productSetSort=v=>{localStorage.setItem('rentcam_product_sort',v);render()};
    window.productSetView=v=>{localStorage.setItem('rentcam_product_view',v);render()};

    function catalogToolbar(s,v){
      return `<div class="product-toolbar"><div class="product-sort"><label>Sort by</label><select onchange="productSetSort(this.value)"><option value="featured" ${s==='featured'?'selected':''}>Featured</option><option value="name-asc" ${s==='name-asc'?'selected':''}>Nama A–Z</option><option value="price-asc" ${s==='price-asc'?'selected':''}>Harga Terendah</option><option value="price-desc" ${s==='price-desc'?'selected':''}>Harga Tertinggi</option><option value="brand" ${s==='brand'?'selected':''}>Brand</option></select></div><div class="product-view-switch"><button class="product-view-btn ${v==='grid'?'active':''}" onclick="productSetView('grid')" aria-label="Grid"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1"/><rect x="17" y="3" width="4" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/><rect x="17" y="10" width="4" height="5" rx="1"/><rect x="3" y="17" width="5" height="4" rx="1"/><rect x="10" y="17" width="5" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/></svg></button><button class="product-view-btn ${v==='list'?'active':''}" onclick="productSetView('list')" aria-label="List"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="5" width="4" height="4" rx="1"/><rect x="10" y="5.5" width="10" height="3" rx="1.5"/><rect x="4" y="10" width="4" height="4" rx="1"/><rect x="10" y="10.5" width="10" height="3" rx="1.5"/><rect x="4" y="15" width="4" height="4" rx="1"/><rect x="10" y="15.5" width="10" height="3" rx="1.5"/></svg></button></div></div>`;
    }

    window.pc=catalogCard;

    window.products=function(){
      let u=new URLSearchParams(location.search),c=u.get('cat')||'',b=u.get('brand')||'',q=(u.get('q')||'').toLowerCase();
      let a=P.filter(x=>(!c||x.cat===c)&&(!b||x.brand===b)&&(!q||`${x.name} ${x.brand} ${x.cat}`.toLowerCase().includes(q)));
      const s=getSort(),v=getView();
      if(s==='name-asc') a=a.slice().sort((x,y)=>x.name.localeCompare(y.name));
      else if(s==='price-asc') a=a.slice().sort((x,y)=>x.price-y.price);
      else if(s==='price-desc') a=a.slice().sort((x,y)=>y.price-x.price);
      else if(s==='brand') a=a.slice().sort((x,y)=>x.brand.localeCompare(y.brand)||x.name.localeCompare(y.name));
      const title=c?`${c} Rentals`:(b?b:'All Rentals');
      return `<section class="page"><div class="container"><div class="product-meta"><h1>${title}</h1><p>${a.length} products</p></div>${catalogToolbar(s,v)}<div class="${v==='grid'?'products-grid':'products-list'}">${v==='grid'?a.map(catalogCard).join(''):a.map(catalogRow).join('')}</div></div></section>`;
    };

    window.detail=function(id){
      const p=P.find(x=>x.id===id); if(!p)return products();
      const desc=`${p.name} disiapkan untuk workflow film, commercial, series dan production profesional.${p.dummy?' Data produk ini adalah dummy untuk pengembangan katalog.':''}`;
      const badge=badgeFor(p);
      return `<section class="page"><div class="container product-detail-simple"><a class="back-link" onclick="go('/produk')">← Kembali ke Rentals</a><div class="detail-top"><div class="detail-media"><img src="${p.img}" alt="${p.name}">${badge?`<span class="rentcam-detail-status-unified">${badge}</span>`:''}</div><div class="detail-info"><div class="detail-brand">${p.brand}</div><h1>${p.name}</h1><div class="detail-price">${rp(p.price)} <small>/ day</small></div><div class="qty-wrap"><div class="qty-label">Quantity</div><div class="qty-box"><button onclick="qty=Math.max(1,qty-1);render()">−</button><span>${qty}</span><button onclick="qty++;render()">+</button></div><button class="add-rental-full" onclick="add('${p.id}',qty)">Add to Rental Cart</button></div><div class="detail-sections"><section class="detail-section"><h2>Description</h2><p>${desc}</p></section><section class="detail-section"><h2>Included as Standard</h2><ul class="included-list">${p.inc.map(x=>`<li>${x}</li>`).join('')}</ul></section><section class="detail-section"><h2>Specifications</h2><div class="spec-list">${p.spec.map(x=>`<div class="spec-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></section></div></div></div></div></section>`;
    };

    function cleanDetailTitleLabels(){
      const isDetail=/^\/produk\/[^/]+/.test(location.pathname);
      document.body.classList.toggle('rentcam-detail-clean',isDetail);
      if(!isDetail) return;
      const info=document.querySelector('#app .detail-info,#app .detail-ref-info');
      if(!info) return;
      const labels=['NEW','PAKET','DISCONTINUED','DISKON 20%'];
      info.querySelectorAll('*').forEach(el=>{
        if(el.children.length===0 && labels.includes((el.textContent||'').trim().toUpperCase())) el.remove();
      });
    }

    function enforce(){
      cleanDetailTitleLabels();
      if(/^\/produk\/[^/]+/.test(location.pathname)){
        const id=location.pathname.split('/')[2];
        const p=P.find(x=>x.id===id);
        const media=document.querySelector('#app .detail-media,#app .detail-ref-media,#app .mainPhoto');
        if(media && p){
          media.querySelectorAll('.rentcam-detail-badge,.rentcam-photo-new-badge').forEach(x=>x.remove());
          let badge=media.querySelector('.rentcam-detail-status-unified');
          const text=badgeFor(p);
          if(text){
            if(!badge){badge=document.createElement('span');badge.className='rentcam-detail-status-unified';media.appendChild(badge)}
            badge.textContent=text;
          }else if(badge) badge.remove();
        }
      }
    }

    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>requestAnimationFrame(enforce)).observe(app,{childList:true,subtree:true});

    if(typeof render==='function') render();
    requestAnimationFrame(enforce);
  };

  document.head.appendChild(legacy);
})();
