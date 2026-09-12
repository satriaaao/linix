/* Rentcam product PNG patch — all cinema equipment images are delivered as PNG */
(function(){
  const weserv='https://images.weserv.nl/?url=';
  const fallback='https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=90';
  const png=url=>{
    url=String(url||fallback);
    if(url.startsWith(weserv)) return /[?&]output=png(?:&|$)/i.test(url)?url:url+(url.includes('?')?'&':'?')+'output=png';
    return weserv+encodeURIComponent(url.replace(/^https?:\/\//,''))+'&output=png&w=1100&h=1100&fit=contain&bg=ffffff';
  };

  const droneImgs=[
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?auto=format&fit=crop&w=1200&q=90'
  ];
  const drones=[
    ['dji-inspire-3','DJI Inspire 3',3500000,'NEW'],
    ['dji-inspire-2-x7','DJI Inspire 2 + Zenmuse X7',2200000,'PAKET'],
    ['dji-mavic-3-cine','DJI Mavic 3 Cine',1200000,'NEW'],
    ['dji-mavic-3-pro-cine','DJI Mavic 3 Pro Cine',1500000,'PAKET'],
    ['dji-matrice-350-rtk','DJI Matrice 350 RTK',1800000,'PAKET'],
    ['dji-avata-2','DJI Avata 2',700000,'NEW'],
    ['dji-mini-4-pro','DJI Mini 4 Pro',500000,'DISKON 20%'],
    ['dji-air-3s','DJI Air 3S',750000,'NEW']
  ];

  function ensureData(){
    if(typeof P==='undefined') return false;
    drones.forEach((d,i)=>{
      const [id,name,price,badge]=d;
      if(!P.some(x=>x.id===id)) P.push({
        id,name,brand:'DJI',cat:'Drone',price,img:png(droneImgs[i%droneImgs.length]),stock:2,badge,dummy:true,
        spec:[['Type','Cinema Drone'],['Brand','DJI'],['Workflow','Aerial Cinema Production'],['Image Format','PNG']],
        inc:['Aircraft','Remote Controller','Battery Set','Propeller Set','Production Case']
      });
    });
    P.forEach(p=>{p.img=png(p.img||fallback)});
    return true;
  }

  function sync(){
    if(typeof P==='undefined') return;
    document.querySelectorAll('#app .pcard').forEach(card=>{
      const m=(card.getAttribute('onclick')||'').match(/\/produk\/([^'"\)]+)/);
      if(!m) return;
      const p=P.find(x=>x.id===m[1]);
      if(!p) return;
      const img=card.querySelector('.pimg img,img');
      if(img&&img.src!==p.img) img.src=p.img;
      if(p.badge&&!card.querySelector('.rentcam-card-status')){
        const b=document.createElement('span');b.className='rentcam-card-status';b.textContent=p.badge;(card.querySelector('.pimg')||card).appendChild(b);
      }
    });
    const m=location.pathname.match(/^\/produk\/([^/]+)/);
    if(m){
      const p=P.find(x=>x.id===m[1]);
      const img=document.querySelector('#app .detail-media img,#app .detail-ref-media img');
      if(p&&img&&img.src!==p.img) img.src=p.img;
    }
  }

  const css=document.createElement('style');
  css.textContent=`
    #app .pimg,#app .rimg,#app .detail-media,#app .detail-ref-media{background:#fff!important;overflow:hidden!important}
    #app .pimg img,#app .rimg img,#app .detail-media img,#app .detail-ref-media img{width:100%!important;height:100%!important;object-fit:contain!important;background:transparent!important}
    #app .product-detail-simple .detail-info h1::before,#app .product-detail-simple .detail-info h1::after,#app .detail-ref-info h1::before,#app .detail-ref-info h1::after{display:none!important;content:none!important;visibility:hidden!important;opacity:0!important}
  `;
  document.head.appendChild(css);

  let n=0;
  const timerPng=setInterval(()=>{
    n++;
    if(ensureData()){
      if(n>3&&typeof render==='function') render();
      requestAnimationFrame(sync);
      if(n>8) clearInterval(timerPng);
    }
    if(n>40) clearInterval(timerPng);
  },180);
  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>requestAnimationFrame(sync)).observe(app,{childList:true,subtree:true});
})();
