/* Rentcam CMS Logo — CMS-only logo state, upload and persistence. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsLogo=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const LIMITS={mobile:{min:60,max:190,default:145},desktop:{min:80,max:280,default:170}};
  const TYPES={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));

  function normalizeSize(kind,value){
    const x=LIMITS[kind];if(!x)throw new Error('Ukuran logo tidak dikenal');
    const n=Number(value);return clamp(Number.isFinite(n)&&n?n:x.default,x.min,x.max);
  }
  function validateFile(file){
    if(!file||!TYPES[file.type])throw new Error('Pilih file PNG, JPG, WEBP.');
    if(Number(file.size)>5*1024*1024)throw new Error('Ukuran logo maksimal 5 MB.');
    return {ext:TYPES[file.type],type:file.type,size:Number(file.size)||0};
  }
  function create(deps){
    const {request,store,now=()=>Date.now(),uuid=()=>crypto.randomUUID()}=deps||{};
    if(typeof request!=='function')throw new Error('CMS Logo request diperlukan');
    if(!store?.get||!store?.save)throw new Error('CMS Config Store diperlukan');
    const general=()=>{const c=store.get();c.general=c.general||{};return c.general};
    function get(){
      const g=general();
      return {
        siteName:g.siteName||'Rentcam',
        logoUrl:String(g.logoUrl||''),
        logoMobileWidth:normalizeSize('mobile',g.logoMobileWidth),
        logoDesktopWidth:normalizeSize('desktop',g.logoDesktopWidth)
      };
    }
    function setUrl(url){general().logoUrl=String(url||'').trim();return get()}
    function setSize(kind,value){
      const v=normalizeSize(kind,value);
      general()[kind==='mobile'?'logoMobileWidth':'logoDesktopWidth']=v;
      return v;
    }
    function resetSizes(){setSize('mobile',LIMITS.mobile.default);setSize('desktop',LIMITS.desktop.default);return get()}
    function remove(){return setUrl('')}
    async function save(){return store.save(store.get())}
    async function upload(file){
      const info=validateFile(file);
      const tokenResponse=await request(SB+'/rest/v1/rpc/rentcam_issue_upload_token',{
        method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'
      });
      const tokenText=await tokenResponse.text();
      let token=null;try{token=JSON.parse(tokenText)}catch(_){token=tokenText}
      if(!tokenResponse.ok)throw new Error(token?.message||'Tidak bisa membuat akses upload. Silakan login ulang.');
      token=String(token||'').replace(/"/g,'');
      if(!token)throw new Error('Token upload tidak valid.');
      const path=[token,'website-logo',String(now())+'-'+String(uuid())+'.'+info.ext].map(encodeURIComponent).join('/');
      const uploadResponse=await request(SB+'/storage/v1/object/cms-media/'+path,{
        method:'POST',headers:{apikey:KEY,'Content-Type':info.type,'cache-control':'3600'},body:file
      });
      if(!uploadResponse.ok){
        let message='Upload logo gagal.';
        try{const t=await uploadResponse.text();const j=JSON.parse(t);message=j?.message||message}catch(_){}
        throw new Error(message);
      }
      return SB+'/storage/v1/object/public/cms-media/'+path;
    }
    return Object.freeze({get,setUrl,setSize,resetSizes,remove,save,upload});
  }
  function install(root){
    const request=(url,init)=>root.RentcamCmsAdmin?.request?root.RentcamCmsAdmin.request(url,init):root.fetch(url,init);
    return create({request,store:root.RentcamCmsConfig,now:()=>Date.now(),uuid:()=>root.crypto.randomUUID()});
  }
  return {SB,KEY,LIMITS,TYPES,normalizeSize,validateFile,create,install};
});