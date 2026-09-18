/* Rentcam CMS Branding — CMS-only logo state, upload and persistence. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsBranding=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const MAX_BYTES=5*1024*1024;
  const DEFAULTS={mobile:145,desktop:170};
  const LIMITS={mobile:[60,190],desktop:[80,280]};
  const TYPES={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};

  function clampSize(kind,value){
    const [min,max]=LIMITS[kind]||LIMITS.desktop;
    const fallback=DEFAULTS[kind]||DEFAULTS.desktop;
    const n=Number(value);
    return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback));
  }
  function validateFile(file){
    if(!file||!TYPES[file.type])throw new Error('Pilih file PNG, JPG, WEBP.');
    if(Number(file.size)>MAX_BYTES)throw new Error('Ukuran logo maksimal 5 MB.');
    return {ext:TYPES[file.type],type:file.type,size:Number(file.size)||0};
  }
  async function decode(response,label='Permintaan branding gagal'){
    const text=await response.text();let data=null;
    try{data=text?JSON.parse(text):null}catch(_){data=text}
    if(!response.ok)throw new Error(data?.message||data||label);
    return data;
  }
  function create(root,store,admin){
    if(!store?.get||!store?.save)throw new Error('CMS Config Store diperlukan');
    const getGeneral=()=>{
      const cfg=store.get();
      cfg.general=cfg.general||{};
      return cfg.general;
    };
    function state(){
      const g=getGeneral();
      return {
        siteName:String(g.siteName||'Rentcam'),
        logoUrl:String(g.logoUrl||''),
        mobile:clampSize('mobile',g.logoMobileWidth),
        desktop:clampSize('desktop',g.logoDesktopWidth)
      };
    }
    function setLogoUrl(url){
      const g=getGeneral();g.logoUrl=String(url||'').trim();return state();
    }
    function setSize(kind,value){
      const g=getGeneral(),n=clampSize(kind,value);
      if(kind==='mobile')g.logoMobileWidth=n;
      else if(kind==='desktop')g.logoDesktopWidth=n;
      else throw new Error('Jenis ukuran logo tidak dikenal');
      return n;
    }
    function resetSizes(){
      setSize('mobile',DEFAULTS.mobile);setSize('desktop',DEFAULTS.desktop);
      return state();
    }
    function remove(){return setLogoUrl('')}
    async function request(url,init={}){
      if(admin?.request)return admin.request(url,init);
      return root.fetch(url,init);
    }
    async function upload(file){
      const meta=validateFile(file);
      const tokenResponse=await request(SB+'/rest/v1/rpc/rentcam_issue_upload_token',{
        method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'
      });
      const raw=await decode(tokenResponse,'Tidak bisa membuat akses upload. Silakan login ulang.');
      const token=String(raw??'').replace(/"/g,'').trim();
      if(!token)throw new Error('Token upload logo tidak valid.');
      const uuid=root.crypto?.randomUUID?root.crypto.randomUUID():String(Date.now());
      const path=[token,'website-logo',Date.now()+'-'+uuid+'.'+meta.ext].map(encodeURIComponent).join('/');
      const uploadResponse=await request(SB+'/storage/v1/object/cms-media/'+path,{
        method:'POST',headers:{apikey:KEY,'Content-Type':meta.type,'cache-control':'3600'},body:file
      });
      await decode(uploadResponse,'Upload logo gagal.');
      const url=SB+'/storage/v1/object/public/cms-media/'+path;
      setLogoUrl(url);
      return url;
    }
    function save(){return store.save(store.get())}
    return Object.freeze({state,setLogoUrl,setSize,resetSizes,remove,upload,save});
  }
  function install(root){
    if(!root.RentcamCmsConfig)throw new Error('RentcamCmsConfig belum dimuat');
    return create(root,root.RentcamCmsConfig,root.RentcamCmsAdmin);
  }
  return {SB,KEY,MAX_BYTES,DEFAULTS,LIMITS,TYPES,clampSize,validateFile,decode,create,install};
});