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
  if(typeof P!=='undefined'){
    P.forEach(p=>{ if(images[p.id]) p.img=png(images[p.id]); });
  }
})();
