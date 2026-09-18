/* Rentcam CMS Media — one upload seam for CMS images/files. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms'))root.RentcamCmsMedia=lib.install(root);
})(typeof window!=='undefined'?window:null,function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const MAX_BYTES=10*1024*1024;
  const TYPES={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
  const safeName=s=>String(s||'image').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(-100);
  function validate(file){
    if(!file||!TYPES[file.type])throw new Error('Pilih JPG, PNG, WEBP atau GIF');
    if(Number(file.size)>MAX_BYTES)throw new Error('Maksimal 10 MB per foto');
    return {type:file.type,size:Number(file.size)||0,ext:TYPES[file.type],name:safeName(file.name)};
  }
  async function decode(r,label){
    const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch(_){d=t}
    if(!r.ok)throw new Error(d?.message||d||label||'Upload gagal');
    return d;
  }
  function create(root,store,admin){
    if(!store?.get)throw new Error('CMS Config Store diperlukan');
    const request=(url,init)=>admin?.request?admin.request(url,init):root.fetch(url,init);
    const list=()=>{const c=store.get();c.media=Array.isArray(c.media)?c.media:[];return c.media};
    async function upload(file,folder='media'){
      const info=validate(file);
      const tr=await request(SB+'/rest/v1/rpc/rentcam_issue_upload_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'});
      const raw=await decode(tr,'Tidak bisa membuat akses upload. Silakan login ulang.');
      const token=String(raw??'').replace(/"/g,'').trim();
      if(!token)throw new Error('Token upload tidak valid.');
      const uuid=root.crypto?.randomUUID?root.crypto.randomUUID():String(Date.now());
      const path=[token,String(folder||'media'),Date.now()+'-'+uuid+'-'+info.name].map(encodeURIComponent).join('/');
      const ur=await request(SB+'/storage/v1/object/cms-media/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':info.type,'cache-control':'3600'},body:file});
      await decode(ur,'Upload gagal');
      const url=SB+'/storage/v1/object/public/cms-media/'+path;
      const row={url,name:file.name||info.name,type:info.type,size:info.size,folder:String(folder||'media'),createdAt:new Date().toISOString()};
      list().unshift(row);
      const c=store.get();c.media=c.media.slice(0,500);
      return row;
    }
    async function uploadMany(files,folder='media'){
      const out=[];for(const file of Array.from(files||[]))out.push(await upload(file,folder));return out;
    }
    function remove(index){const a=list(),i=Number(index);if(!Number.isInteger(i)||i<0||i>=a.length)return null;return a.splice(i,1)[0]||null}
    function save(){return store.save(store.get())}
    return Object.freeze({validate,list,upload,uploadMany,remove,save});
  }
  function install(root){return create(root,root.RentcamCmsConfig,root.RentcamCmsAdmin)}
  return {SB,KEY,MAX_BYTES,TYPES,safeName,validate,decode,create,install};
});