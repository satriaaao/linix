/* Rentcam — homepage category product sections */
(function(){
  const IMG={
    camera:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=88',
    camera2:'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=88',
    lighting:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=88',
    audio:'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=88',
    package:'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=88'
  };

  const sections=[
    {key:'camera',title:'Kamera',subtitle:'Cinema camera untuk film, commercial, series dan content production.',items:[
      ['ARRI ALEXA 35','ARRI',IMG.camera],['ARRI ALEXA Mini LF','ARRI',IMG.camera2],['Sony VENICE 2','SONY',IMG.camera2],['Sony BURANO','SONY',IMG.camera],['Canon EOS C400','CANON',IMG.camera2],['RED V-RAPTOR [X]','RED',IMG.camera],['Blackmagic URSA Cine 12K','BLACKMAGIC',IMG.camera2],['Sony FX6','SONY',IMG.camera]
    ]},
    {key:'lighting',title:'Lighting',subtitle:'Lighting profesional untuk studio, interior, exterior dan produksi sinema.',items:[
      ['ARRI SkyPanel X21','ARRI',IMG.lighting],['ARRI Orbiter','ARRI',IMG.lighting],['Aputure LS 1200d Pro','APUTURE',IMG.lighting],['Aputure Electro Storm XT26','APUTURE',IMG.lighting],['Nanlux Evoke 2400B','NANLUX',IMG.lighting],['Astera Titan Tube','ASTERA',IMG.lighting],['Creamsource Vortex8','CREAMSOURCE',IMG.lighting],['Kino Flo Mimik 120','KINO FLO',IMG.lighting]
    ]},
    {key:'audio',title:'Audio',subtitle:'Recorder, microphone dan wireless audio untuk production sound profesional.',items:[
      ['Sound Devices 888','SOUND DEVICES',IMG.audio],['Sound Devices MixPre-10 II','SOUND DEVICES',IMG.audio],['Sennheiser MKH 416','SENNHEISER',IMG.audio],['Schoeps CMIT 5U','SCHOEPS',IMG.audio],['DPA 4017B','DPA',IMG.audio],['Wisycom MCR54','WISYCOM',IMG.audio],['Lectrosonics DSR4','LECTROSONICS',IMG.audio],['Tentacle Sync E','TENTACLE',IMG.audio]
    ]},
    {key:'package',title:'Paket',subtitle:'Paket equipment siap produksi dengan kombinasi kamera, lens, support dan monitoring.',items:[
      ['ARRI ALEXA 35 Production Package','PAKET',IMG.package],['ARRI Mini LF Production Package','PAKET',IMG.package],['Sony VENICE 2 Production Package','PAKET',IMG.package],['Sony BURANO Documentary Package','PAKET',IMG.package],['RED V-RAPTOR Cinema Package','PAKET',IMG.package],['FX6 Run & Gun Package','PAKET',IMG.package],['Cinema Interview Package','PAKET',IMG.package],['Commercial Production Package','PAKET',IMG.package]
    ]}
  ];

  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function installStyle(){
    if(document.getElementById('rentcam-home-sections-style')) return;
    const st=document.createElement('style');
    st.id='rentcam-home-sections-style';
    st.textContent=`
      #app .home-product-sections{background:#f7f7f5!important;padding:8px 0 54px!important}
      #app .home-product-section{padding:44px 0 12px!important}
      #app .home-product-section+.home-product-section{border-top:1px solid #e6e6e3!important}
      #app .home-product-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:16px!important;margin-bottom:22px!important}
      #app .home-product-head h2{margin:0!important;font-size:34px!important;line-height:1!important;letter-spacing:-.04em!important;color:#111!important}
      #app .home-product-head p{margin:8px 0 0!important;font-size:13px!important;line-height:1.5!important;color:#777!important}
      #app .home-product-view{border:0!important;background:transparent!important;color:#111!important;font-size:12px!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:4px!important;cursor:pointer!important;padding:8px 0!important;white-space:nowrap!important}
      #app .home-product-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px!important}
      #app .home-category-card{min-width:0!important;background:#fff!important;border:1px solid #e9e9e6!important;border-radius:15px!important;overflow:hidden!important;cursor:pointer!important;display:flex!important;flex-direction:column!important;transition:transform .16s ease,box-shadow .16s ease!important}
      #app .home-category-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 30px rgba(0,0,0,.07)!important}
      #app .home-category-image{position:relative!important;width:100%!important;aspect-ratio:1.12/1!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
      #app .home-category-image img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
      #app .home-category-badge{position:absolute!important;left:11px!important;top:11px!important;background:#111!important;color:#fff!important;border-radius:999px!important;padding:7px 9px!important;font-size:8px!important;font-weight:900!important;letter-spacing:.05em!important}
      #app .home-category-body{padding:13px 14px 15px!important;display:flex!important;flex-direction:column!important;flex:1!important}
      #app .home-category-brand{font-size:9px!important;color:#8a8a8a!important;letter-spacing:.07em!important;text-transform:uppercase!important;margin-bottom:6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #app .home-category-name{font-size:15px!important;line-height:1.28!important;font-weight:800!important;color:#111!important;min-height:39px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
      #app .home-category-cta{margin-top:13px!important;font-size:10px!important;font-weight:800!important;color:#555!important}
      @media(max-width:900px){#app .home-product-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:620px){
        #app .home-product-sections{padding-bottom:34px!important}
        #app .home-product-section{padding:30px 0 8px!important}
        #app .home-product-head{align-items:flex-end!important;margin-bottom:14px!important;gap:10px!important}
        #app .home-product-head h2{font-size:25px!important}
        #app .home-product-head p{font-size:11px!important;margin-top:5px!important;max-width:250px!important}
        #app .home-product-view{font-size:10px!important}
        #app .home-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
        #app .home-category-card{border-radius:13px!important}
        #app .home-category-image{aspect-ratio:1/1!important}
        #app .home-category-badge{left:8px!important;top:8px!important;padding:6px 8px!important;font-size:7px!important}
        #app .home-category-body{padding:10px 10px 12px!important}
        #app .home-category-brand{font-size:8px!important;margin-bottom:5px!important}
        #app .home-category-name{font-size:12.5px!important;min-height:32px!important}
        #app .home-category-cta{font-size:9px!important;margin-top:9px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function card(item,key){
    const [name,brand,img]=item;
    return `<article class="home-category-card" data-home-cat="${key}" onclick="go('/produk')"><div class="home-category-image"><span class="home-category-badge">${esc(brand)}</span><img src="${img}" alt="${esc(name)}" loading="lazy"></div><div class="home-category-body"><div class="home-category-brand">${esc(brand)} · ${key==='package'?'Package':key}</div><div class="home-category-name">${esc(name)}</div><div class="home-category-cta">Lihat produk →</div></div></article>`;
  }

  function markup(){
    return `<section class="home-product-sections"><div class="container">${sections.map(s=>`<section class="home-product-section home-${s.key}"><div class="home-product-head"><div><h2>${esc(s.title)}</h2><p>${esc(s.subtitle)}</p></div><button class="home-product-view" onclick="go('/produk')">View all</button></div><div class="home-product-grid">${s.items.slice(0,8).map(x=>card(x,s.key)).join('')}</div></section>`).join('')}</div></section>`;
  }

  function mount(){
    if(location.pathname!=='/') return;
    installStyle();
    const app=document.getElementById('app');
    if(!app || document.getElementById('rentcam-home-product-sections')) return;

    const legacy=[...app.querySelectorAll('.section')].find(s=>/Latest in Rentals|ARRI Products/i.test(s.textContent||''));
    const wrap=document.createElement('div');
    wrap.id='rentcam-home-product-sections';
    wrap.innerHTML=markup();
    if(legacy){
      legacy.insertAdjacentElement('beforebegin',wrap);
      legacy.remove();
    }else{
      app.appendChild(wrap);
    }
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;mount();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
  const app=document.getElementById('app');
  if(app) new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('popstate',schedule);
})();
