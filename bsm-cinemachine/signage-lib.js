(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BSMSignage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STORAGE_KEY='bsm-signage-config-v1';
  function extractDriveFileId(input){
    const value=String(input||'').trim();
    if(!value) return '';
    const patterns=[
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
      /[?&]id=([a-zA-Z0-9_-]+)/i
    ];
    for(const re of patterns){ const m=value.match(re); if(m) return m[1]; }
    return /^[a-zA-Z0-9_-]{20,}$/.test(value)?value:'';
  }
  function driveVideoUrl(input){
    const id=extractDriveFileId(input);
    if(!id) return String(input||'').trim();
    return 'https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download&confirm=t';
  }
  function normalizeVideo(video,index){
    return {
      id:String(video?.id||('vid-'+Date.now()+'-'+index)),
      title:String(video?.title||('Video '+(index+1))).trim(),
      driveUrl:String(video?.driveUrl||video?.url||'').trim(),
      src:driveVideoUrl(video?.driveUrl||video?.url||video?.src||''),
      fit:video?.fit==='contain'?'contain':'cover',
      enabled:video?.enabled!==false
    };
  }
  function normalizeConfig(input){
    const videos=Array.isArray(input?.videos)?input.videos.map(normalizeVideo).filter(v=>v.src):[];
    return {
      name:String(input?.name||'Standing Monitor').trim()||'Standing Monitor',
      orientation:input?.orientation==='landscape'?'landscape':'portrait',
      muted:input?.muted!==false,
      updatedAt:Number(input?.updatedAt||Date.now()),
      videos
    };
  }
  function encodeConfig(config){
    const json=JSON.stringify(normalizeConfig(config));
    return btoa(unescape(encodeURIComponent(json)));
  }
  function decodeConfig(encoded){
    try{return normalizeConfig(JSON.parse(decodeURIComponent(escape(atob(String(encoded||''))))));}
    catch(_){return normalizeConfig({videos:[]});}
  }
  function save(config){
    const value=normalizeConfig({...config,updatedAt:Date.now()});
    localStorage.setItem(STORAGE_KEY,JSON.stringify(value));
    try{new BroadcastChannel('bsm-signage').postMessage({type:'config',config:value});}catch(_){}
    return value;
  }
  function load(){
    try{return normalizeConfig(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}
    catch(_){return normalizeConfig({videos:[]});}
  }
  return {STORAGE_KEY,extractDriveFileId,driveVideoUrl,normalizeConfig,encodeConfig,decodeConfig,save,load};
});