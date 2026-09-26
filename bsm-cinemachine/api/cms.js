const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@a1d819043facf60ad3c6e025340b990a6642168a/bsm-cinemachine/cms-v15-20260918.html';
const PWA=require('../cms-pwa-assets');
const D=require('../drive-folder-lib');

function sanitizeCmsHtml(html){
  return String(html||'')
    .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/satriaaao\/linix@85b0a21372bfcc3bf1276c19ffb6de8a96ff1200\/bsm-cinemachine\/cms-kernel-20260918\.js/g,'/cms-kernel-secure-20260922.js')
    .replace(/<link\b[^>]*href=["'][^"']*cart-mobile-layout-fix-20260919\.css[^"']*["'][^>]*>/gi,'')
    .replace(/<link\b[^>]*href=["'][^"']*cart[^"']*\.css[^"']*["'][^>]*data-public-only[^>]*>/gi,'');
}

function injectCmsPwa(html){
  let out=String(html||'');
  const head=[
    '<link rel="manifest" href="/api/cms?asset=manifest">',
    '<meta name="theme-color" content="#111318">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="Rentcam CMS">',
    '<link rel="icon" href="/api/cms?asset=icon" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/api/cms?asset=icon">'
  ].join('');
  if(!out.includes('/api/cms?asset=manifest')){
    out=out.includes('</head>')?out.replace('</head>',head+'</head>'):head+out;
  }
  if(!out.includes('/api/cms?asset=pwa')){
    const script='<script src="/api/cms?asset=pwa" defer></script>';
    out=out.includes('</body>')?out.replace('</body>',script+'</body>'):out+script;
  }
  return out;
}

function sendJson(res,status,payload){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store, max-age=0');
  return res.end(JSON.stringify(payload));
}
async function listDriveFolder(req,res){
  const raw=Array.isArray(req.query?.url)?String(req.query.url[0]||'').trim():String(req.query?.url||'').trim();
  const folderId=D.extractFolderId(raw),resourceKey=D.extractResourceKey(raw);
  if(!folderId)return sendJson(res,200,{ok:false,code:'invalid_folder_url',message:'Link folder Google Drive tidak valid',videos:[]});
  try{
    let files=[],source='embedded';
    const key=String(process.env.GOOGLE_DRIVE_API_KEY||'').trim();
    if(key){
      try{
        const q="'"+folderId.replace(/'/g,"\\'")+"' in parents and trashed = false";
        const u=new URL('https://www.googleapis.com/drive/v3/files');
        u.searchParams.set('q',q);u.searchParams.set('key',key);
        u.searchParams.set('fields','files(id,name,mimeType,webViewLink)');
        u.searchParams.set('pageSize','1000');u.searchParams.set('orderBy','name_natural');
        u.searchParams.set('supportsAllDrives','true');u.searchParams.set('includeItemsFromAllDrives','true');
        const r=await fetch(u,{headers:{accept:'application/json'}});
        if(r.ok){
          const data=await r.json();
          files=(data.files||[]).map(x=>({id:String(x.id||''),name:String(x.name||''),url:String(x.webViewLink||''),isVideo:String(x.mimeType||'').startsWith('video/')||D.isVideoName(x.name)})).filter(x=>x.id);
          source='drive-api';
        }
      }catch(_){}
    }
    if(!files.length){
      const u=new URL('https://drive.google.com/u/0/embeddedfolderview');
      u.searchParams.set('id',folderId);u.searchParams.set('pli','1');
      if(resourceKey)u.searchParams.set('resourcekey',resourceKey);
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{
        const r=await fetch(u,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36','accept':'text/html,application/xhtml+xml'}});
        if(!r.ok)throw new Error('Drive folder '+r.status);
        files=D.parseEmbeddedFolderHtml(await r.text());
      }finally{clearTimeout(timer)}
    }
    const videos=files.filter(x=>x.isVideo!==false).map((x,i)=>({id:x.id,title:x.name||('Video '+(i+1)),driveUrl:'https://drive.google.com/file/d/'+x.id+'/view',src:'https://drive.usercontent.google.com/download?id='+encodeURIComponent(x.id)+'&export=download&confirm=t',fit:'cover',enabled:true}));
    return sendJson(res,200,{ok:true,folderId,source,totalFiles:files.length,totalVideos:videos.length,videos});
  }catch(e){
    return sendJson(res,502,{ok:false,code:'folder_read_failed',message:'Folder Google Drive tidak bisa dibaca. Pastikan akses folder: Siapa saja yang memiliki link.',detail:String(e?.message||e),videos:[]});
  }
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }

  const asset=Array.isArray(req.query?.asset)?req.query.asset[0]:req.query?.asset;
  if(asset==='drive-folder')return listDriveFolder(req,res);
  if(asset&&PWA[asset])return PWA[asset](req,res);

  try{
    const r=await fetch(SOURCE,{cache:'no-store'});
    if(!r.ok)throw new Error('cms source '+r.status);
    const html=injectCmsPwa(sanitizeCmsHtml(await r.text()));
    res.statusCode=200;
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, max-age=0');
    res.setHeader('pragma','no-cache');
    res.setHeader('x-content-type-options','nosniff');
    res.setHeader('x-frame-options','DENY');
    res.setHeader('referrer-policy','no-referrer');
    res.setHeader('cross-origin-opener-policy','same-origin');
    res.setHeader('permissions-policy','camera=(self), geolocation=(self), microphone=()');
    if(req.method==='HEAD')return res.end();
    return res.end(html);
  }catch(e){
    res.statusCode=502;res.setHeader('content-type','text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:24px">CMS sedang dimuat ulang. Silakan refresh.</p>');
  }
}
module.exports=handler;
module.exports._sanitizeCmsHtml=sanitizeCmsHtml;
module.exports._injectCmsPwa=injectCmsPwa;
module.exports._source=SOURCE;
module.exports._listDriveFolder=listDriveFolder;
