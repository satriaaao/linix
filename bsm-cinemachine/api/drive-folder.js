const D=require('../drive-folder-lib');

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store, max-age=0');
  return res.end(JSON.stringify(payload));
}
function safeFolderInput(value){
  const raw=Array.isArray(value)?String(value[0]||'').trim():String(value||'').trim();
  if(!raw)return {raw:'',id:'',resourceKey:''};
  const id=D.extractFolderId(raw);
  const resourceKey=D.extractResourceKey(raw);
  return {raw,id,resourceKey};
}
async function listViaApi(folderId,apiKey){
  const q="'"+folderId.replace(/'/g,"\\'")+"' in parents and trashed = false";
  const url=new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q',q);
  url.searchParams.set('key',apiKey);
  url.searchParams.set('fields','files(id,name,mimeType,webViewLink),nextPageToken');
  url.searchParams.set('pageSize','1000');
  url.searchParams.set('orderBy','name_natural');
  url.searchParams.set('supportsAllDrives','true');
  url.searchParams.set('includeItemsFromAllDrives','true');
  const r=await fetch(url,{headers:{accept:'application/json'}});
  if(!r.ok)throw new Error('Drive API '+r.status);
  const data=await r.json();
  return (data.files||[]).map(x=>({
    id:String(x.id||''),
    name:String(x.name||''),
    mimeType:String(x.mimeType||''),
    url:String(x.webViewLink||('https://drive.google.com/file/d/'+x.id+'/view')),
    isVideo:String(x.mimeType||'').startsWith('video/')||D.isVideoName(x.name)
  })).filter(x=>x.id);
}
async function listViaEmbedded(folderId,resourceKey){
  const url=new URL('https://drive.google.com/u/0/embeddedfolderview');
  url.searchParams.set('id',folderId);
  if(resourceKey)url.searchParams.set('resourcekey',resourceKey);
  url.searchParams.set('pli','1');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{
      'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
      'accept':'text/html,application/xhtml+xml'
    }});
    if(!r.ok)throw new Error('Drive folder '+r.status);
    const html=await r.text();
    return D.parseEmbeddedFolderHtml(html);
  }finally{clearTimeout(timer)}
}
module.exports=async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{ok:false,message:'Method not allowed'});
  const input=safeFolderInput(req.query?.url||req.query?.id);
  if(!input.id)return send(res,200,{ok:false,code:'invalid_folder_url',message:'Link folder Google Drive tidak valid',videos:[]});
  try{
    let files=[],source='embedded';
    const key=String(process.env.GOOGLE_DRIVE_API_KEY||'').trim();
    if(key){
      try{files=await listViaApi(input.id,key);source='drive-api'}catch(_){files=[]}
    }
    if(!files.length){files=await listViaEmbedded(input.id,input.resourceKey);source='embedded'}
    const videos=files.filter(x=>x.isVideo!==false).map((x,i)=>({
      id:x.id,
      title:x.name||('Video '+(i+1)),
      driveUrl:'https://drive.google.com/file/d/'+x.id+'/view',
      src:'https://drive.usercontent.google.com/download?id='+encodeURIComponent(x.id)+'&export=download&confirm=t',
      fit:'cover',
      enabled:true
    }));
    return send(res,200,{ok:true,folderId:input.id,source,totalFiles:files.length,totalVideos:videos.length,videos});
  }catch(e){
    return send(res,502,{ok:false,code:'folder_read_failed',message:'Folder Google Drive tidak bisa dibaca. Pastikan akses folder: Siapa saja yang memiliki link.',detail:String(e?.message||e),videos:[]});
  }
};
module.exports._safeFolderInput=safeFolderInput;
module.exports._listViaApi=listViaApi;
module.exports._listViaEmbedded=listViaEmbedded;