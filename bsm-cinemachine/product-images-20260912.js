/* Clean product packshots converted/delivered as PNG for Rentcam */
(function(){
  const png=(url)=>`https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//,''))}&output=png&w=1000&h=1000&fit=contain&bg=ffffff`;
  const images={
    'arri-alexa-35':'https://www.newsshooter.com/wp-content/uploads/2022/05/Screen-Shot-2022-05-19-at-20.49.14-740x623.png',
    'arri-alexa-mini-lf':'https://primerental.ru/image/cache/catalog/1rental/camera/arri/alexa_mini_lf/1arri-alexa-mini_lf_2-700x700.jpg',
    'sony-venice-2':'https://nofilmschool.com/media-library/hp99ukj4.jpg?id=34055181&width=980',
    'red-v-raptor-x':'https://www.adcom.it/public/images/big/k0y9fxh0.png',
    'cooke-s8-set':'https://dynaphos.com/cdn/shop/files/nFcgpFEE0tAZr1Lrf7YwOQwFPMbU0GFC.jpg?v=1776796132',
    'arri-signature-prime':'https://cdn.myikas.com/images/ddafa165-c183-4dd8-8efa-256547741a1a/50ab764e-9e49-44c7-a8b5-db08bf27626b/3840/signature-prime-75---hero---white---01---front.webp',
    'atlas-mercury':'https://atlaslensco.com/cdn/shop/files/mer_0011_MERC_54_Front_58eafd59-aa76-46b9-a302-97fd8b8df6de.png?v=1753829199&width=1445',
    'arri-skypanel-x21':'https://www.adorama.com/images/Large/ARL00049591.jpg',
    'arri-orbiter':'https://avgear.shop/21549-large_default/arri-orbiter-bluesilver-projecteur-led-spot-light-sans-accessoires-1894',
    'aputure-xt26':'https://apertured.in/cdn/shop/files/List-_E2_86_92-Item-4_75285fdd-c2ae-4160-a92a-9c5aada17e06.png?v=1751332930',
    'teradek-bolt6':'https://teradek.com/cdn/shop/files/10-2300-G-ThreeQuartersFront.png?v=1743310403&width=1206',
    'smallhd-ultra7':'https://smallhd.com/cdn/shop/files/SmallHD_16-0727-007_Ultra-7-_TEAL__Quarter-Raised-R.png?v=1724192105&width=1946',
    'oconnor-2575':'https://content.booqablecdn.com/uploads/bc8232201bd6644516abe423d7fba9d4/photo/photo/0aaa824c-9be9-4643-ab1e-b9da92819751/large_photo.jpg',
    'easyrig-vario5':'https://cdn.sanity.io/images/rns5gelz/production/36706fbc651e9638ada150649464ca9e3506f4d7-500x500.jpg?auto=format&fit=max',
    'sound-devices-888':'https://img-va.myshopline.com/image/store/1691396198864/Sound-Devices-888-Portable-Mixer-Recorder-1k-1-1920x1920.jpeg?h=1000&w=1000',
    'sennheiser-mkh416':'https://www.digitalcameragraz.at/wp-content/uploads/2025/08/310725011-1.jpg'
  };
  if(typeof P!=='undefined') P.forEach(p=>{ if(images[p.id]) p.img=png(images[p.id]); });

  const style=document.createElement('style');
  style.id='rentcam-detail-reference-style';
  style.textContent=`
    .detail-ref{max-width:1120px;margin:0 auto;padding:34px 0 72px}
    .detail-ref-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(380px,.95fr);gap:56px;align-items:start}
    .detail-ref-media{background:#f7f7f7;min-height:560px;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .detail-ref-media img{width:100%;height:100%;max-height:620px;object-fit:contain}
    .detail-ref-info{padding-top:8px}
    .detail-ref-brand{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#68717b;margin-bottom:18px}
    .detail-ref-title{font-size:58px;line-height:1.03;letter-spacing:-.055em;margin:0 0 30px;color:#111;font-weight:800}
    .detail-ref-price{font-size:46px;line-height:1;font-weight:760;color:#111;margin-bottom:34px}
    .detail-ref-price small{font-size:15px;font-weight:500;color:#30343a;margin-left:8px}
    .detail-ref-buy{border-top:1px solid #e2e5e7;padding-top:24px}
    .detail-ref-label{font-size:18px;font-weight:760;margin-bottom:14px}
    .detail-ref-qty{width:210px;height:64px;border:1px solid #d4d7da;display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;text-align:center;margin-bottom:16px}
    .detail-ref-qty button{height:100%;border:0;background:#fff;color:#278edb;font-size:27px;cursor:pointer}
    .detail-ref-qty span{font-size:22px;color:#111}
    .detail-ref-add{width:100%;height:72px;border:0;background:#111;color:white;font-size:22px;font-weight:760;cursor:pointer;margin-bottom:26px}
    .detail-ref-sections{border-top:1px solid #e2e5e7}
    .detail-ref-section{padding:28px 0;border-bottom:1px solid #e2e5e7}
    .detail-ref-section h2{font-size:24px;line-height:1.15;margin:0 0 18px;color:#111;letter-spacing:-.02em}
    .detail-ref-section p{font-size:16px;line-height:1.8;color:#53585f;margin:0}
    .detail-ref-list{margin:0;padding-left:28px;color:#5d6269}
    .detail-ref-list li{font-size:16px;line-height:1.85;padding-left:4px}
    .detail-ref-spec{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eceeef}
    .detail-ref-spec-row{display:flex;justify-content:space-between;gap:18px;padding:14px 0;border-bottom:1px solid #eceeef;font-size:14px}
    .detail-ref-spec-row:nth-child(odd){padding-right:22px}.detail-ref-spec-row:nth-child(even){padding-left:22px;border-left:1px solid #eceeef}
    .detail-ref-spec-row span{color:#7b848e}.detail-ref-spec-row b{text-align:right;color:#111}
    @media(max-width:760px){
      .page:has(.detail-ref){padding-top:0!important}
      .detail-ref{padding:0 0 64px}
      .detail-ref-grid{display:block}
      .detail-ref-media{display:none!important}
      .detail-ref-info{padding:14px 6px 0}
      .detail-ref-brand{font-size:11px;letter-spacing:.07em;margin:0 0 14px;color:#6f7780}
      .detail-ref-title{font-size:36px;line-height:1.12;letter-spacing:-.045em;margin:0 0 28px}
      .detail-ref-price{font-size:34px;line-height:1.04;letter-spacing:-.025em;margin:0 0 28px}
      .detail-ref-price small{font-size:13px;margin-left:5px;white-space:nowrap}
      .detail-ref-buy{padding-top:20px}
      .detail-ref-label{font-size:18px;margin-bottom:14px}
      .detail-ref-qty{width:170px;height:58px;margin-bottom:12px}
      .detail-ref-qty button{font-size:25px}.detail-ref-qty span{font-size:20px}
      .detail-ref-add{height:62px;font-size:18px;margin-bottom:24px}
      .detail-ref-section{padding:24px 0}
      .detail-ref-section h2{font-size:20px;margin-bottom:14px}
      .detail-ref-section p,.detail-ref-list li{font-size:15px;line-height:1.75}
      .detail-ref-spec{grid-template-columns:1fr}
      .detail-ref-spec-row,.detail-ref-spec-row:nth-child(odd),.detail-ref-spec-row:nth-child(even){padding:13px 0;border-left:0}
    }`;
  document.head.appendChild(style);

  window.detail=function(id){
    const p=P.find(x=>x.id===id); if(!p) return products();
    const description=`${p.name} disiapkan untuk workflow film, commercial, series dan production profesional.`;
    return `<section class="page"><div class="container detail-ref"><div class="detail-ref-grid">
      <div class="detail-ref-media"><img src="${p.img}" alt="${p.name}"></div>
      <div class="detail-ref-info">
        <div class="detail-ref-brand">${p.brand}</div>
        <h1 class="detail-ref-title">${p.name}</h1>
        <div class="detail-ref-price">${rp(p.price)} <small>/ full day</small></div>
        <div class="detail-ref-buy">
          <div class="detail-ref-label">Quantity</div>
          <div class="detail-ref-qty"><button onclick="qty=Math.max(1,qty-1);render()">−</button><span>${qty}</span><button onclick="qty++;render()">+</button></div>
          <button class="detail-ref-add" onclick="add('${p.id}',qty)">Add to Rental Cart</button>
        </div>
        <div class="detail-ref-sections">
          <section class="detail-ref-section"><h2>Description</h2><p>${description}</p></section>
          <section class="detail-ref-section"><h2>Included as Standard</h2><ul class="detail-ref-list">${p.inc.map(x=>`<li>${x}</li>`).join('')}</ul></section>
          <section class="detail-ref-section"><h2>Specifications</h2><div class="detail-ref-spec">${p.spec.map(x=>`<div class="detail-ref-spec-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></section>
        </div>
      </div>
    </div></div></section>`;
  };
})();
