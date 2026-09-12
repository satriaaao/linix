/* Rentcam — force all cinema-equipment product images to PNG + add Drone catalog */
(function(){
  const weservBase='https://images.weserv.nl/?url=';
  const fallback='https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=90';

  function png(url){
    url=String(url||fallback);
    if(url.startsWith(weservBase)){
      if(/[?&]output=png(?:&|$)/i.test(url)) return url;
      return url+(url.includes('?')?'&':'?')+'output=png';
    }
    return weservBase+encodeURIComponent(url.replace(/^https?:\/\//,''))+'&output=png&w=1100&h=1100&fit=contain&bg=ffffff';
  }
  window.rentcamPng=png;

  const droneImg=[
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=90',
    'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?auto=format&fit=crop&w=1200&q=90'
  ];

  function droneSpec(name){
    return [['Type','Cinema Drone'],['Platform',name],['Workflow','Aerial Cinema Production'],['Image Format','PNG catalog asset']];
  }
  const droneInc=['Aircraft','Remote Controller','Battery Set','Propeller Set','Production Case'];
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

  function addDrones(){
    if(typeof P==='undefined') return false;
    drones.forEach((d,i)=>{
      const [id,name,price,badge]=d;
      if(P.some(x=>x.id===id)) return;
      P.push({
        id,name,brand:'DJI',cat:'Drone',price,
        img:png(droneImg[i%droneImg.length]),stock:2,badge,
        spec:droneSpec(name),inc:droneInc.slice(),dummy:true
      });
    });
    return true;
  }

  function forceAllProductImagesPng(){
    if(typeof P==='undefined') return false;
    P.forEach(p=>{ p.img=png(p.img||fallback); });
    return true;
  }

  function syncRenderedImages(){
    if(typeof P==='undefined') return;
    document.querySelectorAll('#app .pcard').forEach(card=>{
      const click=card.getAttribute('onclick')||'';
      const m=click.match(/\/produk\/([^'"\)]+)/);
      if(!m) return;
      const p=P.find(x=>x.id===m[1]);
      const img=card.querySelector('.pimg img,img');
      if(p&&img&&img.src!==p.img) img.src=p.img;
      if(p&&p.badge&&!card.querySelector('.rentcam-card-status')){
        const badge=document.createElement('span');
        badge.className='rentcam-card-status';
        badge.textContent=p.badge;
        (card.querySelector('.pimg')||card).appendChild(badge);
      }
    });

    const path=location.pathname.match(/^\/produk\/([^/]+)/);
    if(path){
      const p=P.find(x=>x.id===path[1]);
      const img=document.querySelector('#app .detail-media img,#app .detail-ref-media img');
      if(p&&img&&img.src!==p.img) img.src=p.img;
    }
  }

  const style=document.createElement('style');
  style.id='rentcam-all-product-png-v2';
  style.textContent=`
    #app .pimg,#app .rimg,#app .detail-media,#app .detail-ref-media{background:#fff!important;overflow:hidden!important}
    #app .pimg img,#app .rimg img,#app .detail-media img,#app .detail-ref-media img{width:100%!important;height:100%!important;object-fit:contain!important;background:transparent!important}
    #app .product-detail-simple .detail-info h1::before,#app .product-detail-simple .detail-info h1::after,#app .detail-ref-info h1::before,#app .detail-ref-info h1::after{display:none!important;content:none!important;visibility:hidden!important;opacity:0!important}
  `;
  document.head.appendChild(style);

  let tries=0;
  const boot=setInterval(()=>{
    tries++;
    if(addDrones()&&forceAllProductImagesPng()){
      clearInterval(boot);
      if(typeof render==='function') render();
      requestAnimationFrame(syncRenderedImages);
    }
    if(tries>40) clearInterval(boot);
  },100);

  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>requestAnimationFrame(syncRenderedImages)).observe(app,{childList:true,subtree:true});
})();
