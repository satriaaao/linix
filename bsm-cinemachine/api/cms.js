const SOURCE='https://cdn.jsdelivr.net/gh/satriaaao/linix@a1d819043facf60ad3c6e025340b990a6642168a/bsm-cinemachine/cms-v15-20260918.html';
const PWA=require('../cms-pwa-assets');
const D=require('../drive-folder-lib');
const V=require('../drive-video-lib');
const SignageStore=require('../signage-db-store');
const SignageAuth=require('../signage-auth-db-lib');
const {Readable}=require('node:stream');

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
function methodNotAllowed(res){
  return sendJson(res,405,{ok:false,message:'Method not allowed'});
}
function sameOrigin(req){
  const origin=String(req.headers?.origin||'').trim();
  if(!origin)return true;
  try{return new URL(origin).host===String(req.headers?.host||'')}catch(_){return false}
}
async function readJsonBody(req){
  if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body))return req.body;
  if(typeof req.body==='string'){
    try{return JSON.parse(req.body||'{}')}catch(_){return {}}
  }
  let raw='';
  for await(const chunk of req){
    raw+=chunk;
    if(raw.length>1024*1024)throw new Error('Payload terlalu besar');
  }
  try{return JSON.parse(raw||'{}')}catch(_){return {}}
}
function sessionToken(req){
  return SignageAuth.parseCookies(req.headers?.cookie||'').signage_session||'';
}
function setSessionCookie(res,token,maxAge){
  res.setHeader('set-cookie',SignageAuth.sessionCookie(token,maxAge));
}
function clearSession(res){
  res.setHeader('set-cookie',SignageAuth.clearSessionCookie());
}
async function signageDbStatus(req,res){
  if(req.method!=='GET')return methodNotAllowed(res);
  const status=await SignageStore.status();
  let authenticated=false;
  if(status.connected){
    try{authenticated=await SignageStore.sessionValid(sessionToken(req))}catch(_){}
  }
  return sendJson(res,200,{ok:true,...status,authenticated});
}
async function signageSetup(req,res){
  if(req.method!=='POST')return methodNotAllowed(res);
  if(!sameOrigin(req))return sendJson(res,403,{ok:false,message:'Origin tidak valid'});
  const body=await readJsonBody(req);
  const username=SignageAuth.normalizeUsername(body.username);
  const password=String(body.password||'');
  if(!SignageAuth.isValidUsername(username))return sendJson(res,400,{ok:false,message:'Username harus 3-32 karakter dan hanya boleh huruf kecil, angka, titik, garis bawah, atau strip'});
  if(!SignageAuth.isStrongPassword(password))return sendJson(res,400,{ok:false,message:'Password minimal 8 karakter'});
  try{
    const s=await SignageStore.setupAdmin(username,password);
    setSessionCookie(res,s.token,s.maxAge);
    return sendJson(res,200,{ok:true,message:'Akun admin berhasil dibuat'});
  }catch(e){
    if(e?.code==='DB_NOT_CONFIGURED')return sendJson(res,503,{ok:false,code:'db_not_configured',message:'Database belum terhubung'});
    if(e?.code==='ADMIN_EXISTS')return sendJson(res,409,{ok:false,code:'admin_exists',message:'Akun admin sudah dibuat'});
    if(e?.code==='INVALID_USERNAME')return sendJson(res,400,{ok:false,code:'invalid_username',message:e.message});
    return sendJson(res,500,{ok:false,message:'Setup admin gagal'});
  }
}
async function signageLogin(req,res){
  if(req.method!=='POST')return methodNotAllowed(res);
  if(!sameOrigin(req))return sendJson(res,403,{ok:false,message:'Origin tidak valid'});
  const body=await readJsonBody(req);
  try{
    const s=await SignageStore.login(SignageAuth.normalizeUsername(body.username),String(body.password||''));
    setSessionCookie(res,s.token,s.maxAge);
    return sendJson(res,200,{ok:true});
  }catch(e){
    if(e?.code==='DB_NOT_CONFIGURED')return sendJson(res,503,{ok:false,code:'db_not_configured',message:'Database belum terhubung'});
    if(e?.code==='INVALID_CREDENTIALS')return sendJson(res,401,{ok:false,code:'invalid_credentials',message:'Username atau password salah'});
    return sendJson(res,500,{ok:false,message:'Login gagal'});
  }
}
async function signageLogout(req,res){
  if(req.method!=='POST')return methodNotAllowed(res);
  try{await SignageStore.logout(sessionToken(req))}catch(_){}
  clearSession(res);
  return sendJson(res,200,{ok:true});
}
async function signageChangePassword(req,res){
  if(req.method!=='POST')return methodNotAllowed(res);
  if(!sameOrigin(req))return sendJson(res,403,{ok:false,message:'Origin tidak valid'});
  const body=await readJsonBody(req);
  const next=String(body.newPassword||'');
  if(!SignageAuth.isStrongPassword(next))return sendJson(res,400,{ok:false,message:'Password baru minimal 8 karakter'});
  try{
    await SignageStore.changePassword(sessionToken(req),String(body.currentPassword||''),next);
    return sendJson(res,200,{ok:true});
  }catch(e){
    if(e?.code==='UNAUTHORIZED')return sendJson(res,401,{ok:false,code:'unauthorized',message:'Silakan login ulang'});
    if(e?.code==='INVALID_PASSWORD')return sendJson(res,401,{ok:false,code:'invalid_password',message:'Password lama salah'});
    if(e?.code==='DB_NOT_CONFIGURED')return sendJson(res,503,{ok:false,code:'db_not_configured',message:'Database belum terhubung'});
    return sendJson(res,500,{ok:false,message:'Ganti password gagal'});
  }
}
async function signageConfig(req,res){
  if(req.method==='GET'){
    try{
      const config=await SignageStore.getConfig();
      return sendJson(res,200,{ok:true,config});
    }catch(e){
      if(e?.code==='DB_NOT_CONFIGURED')return sendJson(res,503,{ok:false,code:'db_not_configured',message:'Database belum terhubung'});
      return sendJson(res,500,{ok:false,message:'Database signage tidak bisa dibaca'});
    }
  }
  if(req.method==='PUT'){
    if(!sameOrigin(req))return sendJson(res,403,{ok:false,message:'Origin tidak valid'});
    const body=await readJsonBody(req);
    try{
      const config=await SignageStore.saveConfig(sessionToken(req),body.config||{});
      return sendJson(res,200,{ok:true,config});
    }catch(e){
      if(e?.code==='UNAUTHORIZED')return sendJson(res,401,{ok:false,code:'unauthorized',message:'Silakan login ulang'});
      if(e?.code==='DB_NOT_CONFIGURED')return sendJson(res,503,{ok:false,code:'db_not_configured',message:'Database belum terhubung'});
      return sendJson(res,500,{ok:false,message:'Playlist gagal disimpan ke database'});
    }
  }
  return methodNotAllowed(res);
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

async function fetchDriveMedia(fileId,range){
  const headers=V.forwardRange({range});
  let r=await fetch(V.downloadUrl(fileId),{redirect:'follow',headers});
  const type=String(r.headers.get('content-type')||'').toLowerCase();
  if(type.includes('text/html')){
    const html=await r.text();
    const confirmed=V.parseConfirmHtml(html,r.url);
    if(confirmed)r=await fetch(confirmed,{redirect:'follow',headers});
  }
  return r;
}
async function streamDriveVideo(req,res){
  const id=V.safeFileId(Array.isArray(req.query?.id)?req.query.id[0]:req.query?.id);
  const name=Array.isArray(req.query?.name)?String(req.query.name[0]||''):String(req.query?.name||'');
  if(!id)return sendJson(res,400,{ok:false,message:'File ID tidak valid'});
  try{
    const range=String(req.headers?.range||'');
    const upstream=await fetchDriveMedia(id,range);
    if(!upstream.ok&&upstream.status!==206){
      return sendJson(res,upstream.status||502,{ok:false,message:'Video Google Drive tidak dapat dibuka'});
    }
    const upstreamType=upstream.headers.get('content-type')||'';
    const mime=V.mimeFor(name,upstreamType);
    res.statusCode=upstream.status===206?206:200;
    res.setHeader('content-type',mime);
    res.setHeader('content-disposition','inline');
    res.setHeader('accept-ranges',upstream.headers.get('accept-ranges')||'bytes');
    res.setHeader('cache-control','private, max-age=300');
    const contentRange=upstream.headers.get('content-range');
    const contentLength=upstream.headers.get('content-length');
    if(contentRange)res.setHeader('content-range',contentRange);
    if(contentLength)res.setHeader('content-length',contentLength);
    res.setHeader('x-content-type-options','nosniff');
    if(req.method==='HEAD'||!upstream.body)return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  }catch(e){
    return sendJson(res,502,{ok:false,message:'Stream video Google Drive gagal',detail:String(e?.message||e)});
  }
}

async function handler(req,res){
  const asset=Array.isArray(req.query?.asset)?req.query.asset[0]:req.query?.asset;

  if(asset==='signage-db-status')return signageDbStatus(req,res);
  if(asset==='signage-setup')return signageSetup(req,res);
  if(asset==='signage-login')return signageLogin(req,res);
  if(asset==='signage-logout')return signageLogout(req,res);
  if(asset==='signage-change-password')return signageChangePassword(req,res);
  if(asset==='signage-config')return signageConfig(req,res);

  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('content-type','text/plain; charset=utf-8');return res.end('Method not allowed');
  }

  if(asset==='drive-folder')return listDriveFolder(req,res);
  if(asset==='drive-video')return streamDriveVideo(req,res);
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
module.exports._streamDriveVideo=streamDriveVideo;
module.exports._signageDbStatus=signageDbStatus;
module.exports._signageConfig=signageConfig;
