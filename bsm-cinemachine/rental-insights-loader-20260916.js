/* Load existing rental insights + integrity + stable analytics enhancements. */
(function(){
  const srcs=[
    'https://cdn.jsdelivr.net/gh/satriaaao/linix@46bde66fd10ce06d2ba9f0c1af67689bb43c5ba0/bsm-cinemachine/rental-insights-20260913.js',
    'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/rental-integrity-lib-20260916.js',
    'https://cdn.jsdelivr.net/gh/satriaaao/linix@636f895753b457a401c8357dc24e485795d28454/bsm-cinemachine/cms-integrity-fix-20260916.js',
    'https://cdn.jsdelivr.net/gh/satriaaao/linix@86145acbcd398ed7ec8d1c93d0331bc770313d6f/bsm-cinemachine/analytics-geo-lib-20260916.js',
    'https://cdn.jsdelivr.net/gh/satriaaao/linix@8064e6f650ed721641d42495f2b6f36b53909bf2/bsm-cinemachine/analytics-geo-dashboard-stable-20260916.js'
  ];
  const load=src=>new Promise((resolve,reject)=>{
    if(document.querySelector(`script[data-rc-src="${src}"]`))return resolve();
    const s=document.createElement('script');s.src=src;s.async=false;s.dataset.rcSrc=src;s.onload=resolve;s.onerror=reject;(document.head||document.documentElement).appendChild(s);
  });
  (async()=>{for(const src of srcs){try{await load(src)}catch(e){console.error('Rentcam loader failed',src,e);break}}})();
})();
