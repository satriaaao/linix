/* Rentcam CMS admin client — one deep module for auth/session/admin requests. */
(function(root,factory){
  const lib=factory();
  if(typeof module==='object'&&module.exports)module.exports=lib;
  if(root&&root.location&&String(root.location.pathname||'').startsWith('/cms')){
    root.RentcamCmsAdmin=lib.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  const DEFAULTS={
    sb:'https://xleceiffuopioeguniwj.supabase.co',
    key:'sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex',
    adminEmail:'admin@aiorbitlab.me',
    passKey:'rentcam_cms_admin_password',
    sessionKey:'rentcam_cms_admin_session',
    authKey:'rentcam_cms_auth',
    versionKey:'rentcam_cms_version'
  };

  function parseSession(raw,now=Date.now()){
    try{
      const s=typeof raw==='string'?JSON.parse(raw):raw;
      if(!s?.token||!s?.expires_at)return null;
      const exp=Date.parse(s.expires_at);
      if(!Number.isFinite(exp)||exp<=now)return null;
      return {token:String(s.token),expires_at:String(s.expires_at)};
    }catch(_){return null}
  }
  function isLoginRequest(url,method='GET',sb=DEFAULTS.sb){
    return String(method).toUpperCase()==='POST'&&String(url).startsWith(sb+'/auth/v1/token')&&String(url).includes('grant_type=password');
  }
  function isAdminUrl(url,sb=DEFAULTS.sb){
    const u=String(url||'');
    return u.startsWith(sb+'/rest/v1/')||u.startsWith(sb+'/storage/v1/');
  }
  function addAdminHeaders(inputHeaders,session){
    const h=new Headers(inputHeaders||{});
    if(session?.token)h.set('x-rentcam-session',session.token);
    h.delete('x-rentcam-admin');
    return h;
  }
  function create(env,opts={}){
    const cfg={...DEFAULTS,...opts};
    const nativeFetch=env.fetch.bind(env);
    const local=env.localStorage,sessionStore=env.sessionStorage;
    const nativeRemove=env.Storage?.prototype?.removeItem||null;
    let bridgeInstalled=false;

    function remove(store,key){
      if(nativeRemove)return nativeRemove.call(store,key);
      return store.removeItem(key);
    }
    function readSession(){
      const raw=local.getItem(cfg.sessionKey);
      const s=parseSession(raw);
      if(!s&&raw)remove(local,cfg.sessionKey);
      return s;
    }
    function password(){return ''}
    function clearSession(){
      sessionStore.removeItem(cfg.passKey);
      remove(local,cfg.sessionKey);
    }
    function logout(){
      clearSession();
      remove(local,cfg.authKey);
    }
    async function verifyPassword(pass){
      const r=await nativeFetch(cfg.sb+'/rest/v1/rpc/rentcam_admin_check',{
        method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json','x-rentcam-admin':pass},body:'{}'
      });
      if(!r.ok)return false;
      return (await r.json())===true;
    }
    async function issueSession(pass){
      const r=await nativeFetch(cfg.sb+'/rest/v1/rpc/rentcam_issue_admin_session',{
        method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json','x-rentcam-admin':pass},body:'{}'
      });
      if(!r.ok)throw new Error('Gagal membuat sesi admin');
      const s=parseSession(await r.json());
      if(!s)throw new Error('Sesi admin tidak valid');
      local.setItem(cfg.sessionKey,JSON.stringify(s));
      return s;
    }
    async function login(email,pass){
      if(String(email||'').trim().toLowerCase()!==cfg.adminEmail)throw new Error('Email admin tidak sesuai');
      if(!await verifyPassword(pass))throw new Error('Password admin salah');
      sessionStore.removeItem(cfg.passKey);
      const s=await issueSession(pass);
      local.setItem(cfg.authKey,JSON.stringify({access_token:'rentcam-cms-custom',token_type:'bearer',expires_in:43200,user:{email:cfg.adminEmail}}));
      return s;
    }
    async function ensureSession(){
      const s=readSession();
      if(s)return s;
      sessionStore.removeItem(cfg.passKey);
      const auth=(()=>{try{return JSON.parse(local.getItem(cfg.authKey)||'null')}catch(_){return null}})();
      if(auth?.access_token==='rentcam-cms-custom')remove(local,cfg.authKey);
      return null;
    }
    async function request(input,init={}){
      const url=typeof input==='string'?input:input?.url||'';
      if(!isAdminUrl(url,cfg.sb))return nativeFetch(input,init);
      const s=readSession();
      const headers=addAdminHeaders(init.headers||input?.headers,s);
      return nativeFetch(input,{...init,headers});
    }
    async function rest(path,init={}){
      const p=String(path||'');
      return request(cfg.sb+(p.startsWith('/')?p:'/rest/v1/'+p),init);
    }
    async function rpc(name,body={}){
      const r=await request(cfg.sb+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
      const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}
      if(!r.ok)throw new Error(data?.message||data||'Permintaan admin gagal');
      return data;
    }
    async function storage(path,init={}){
      const p=String(path||'').replace(/^\/+/, '');
      return request(cfg.sb+'/storage/v1/'+p,init);
    }
    function broadcastConfigUpdate(){
      const v=String(Date.now());
      try{local.setItem(cfg.versionKey,v)}catch(_){}
      try{const bc=new env.BroadcastChannel('rentcam-cms');bc.postMessage({type:'config-updated',version:v});bc.close()}catch(_){}
      return v;
    }
    function installBridge(){
      if(bridgeInstalled||env.__rentcamCmsAdminFetchBridge)return;
      bridgeInstalled=true;env.__rentcamCmsAdminFetchBridge=true;
      env.fetch=async function(input,init={}){
        const url=typeof input==='string'?input:input?.url||'';
        const method=String(init.method||input?.method||'GET').toUpperCase();
        if(isLoginRequest(url,method,cfg.sb)){
          let body={};try{body=JSON.parse(init.body||'{}')}catch(_){}
          try{
            await login(body.email,body.password);
            return new Response(JSON.stringify({access_token:'rentcam-cms-custom',token_type:'bearer',expires_in:43200,user:{email:cfg.adminEmail}}),{status:200,headers:{'Content-Type':'application/json'}});
          }catch(e){
            clearSession();
            return new Response(JSON.stringify({message:e.message||'Login gagal'}),{status:400,headers:{'Content-Type':'application/json'}});
          }
        }
        const response=await request(input,init);
        if(response.ok&&method==='PATCH'&&url.includes('/rest/v1/rentcam_cms_config'))broadcastConfigUpdate();
        if(url.startsWith(cfg.sb+'/storage/v1/')&&!response.ok){
          try{console.error('Rentcam CMS storage upload failed',response.status,await response.clone().text())}catch(_){}
        }
        return response;
      };
      if(nativeRemove&&env.Storage?.prototype&&!env.Storage.prototype.__rentcamCmsAdminPatched){
        const original=nativeRemove;
        env.Storage.prototype.removeItem=function(k){
          if(this===local&&k===cfg.authKey){
            sessionStore.removeItem(cfg.passKey);
            original.call(local,cfg.sessionKey);
          }
          return original.call(this,k);
        };
        env.Storage.prototype.__rentcamCmsAdminPatched=true;
      }
    }
    sessionStore.removeItem(cfg.passKey);
    installBridge();
    ensureSession().catch(()=>{});
    return {login,logout,session:readSession,ensureSession,request,rest,rpc,storage,broadcastConfigUpdate,config:Object.freeze({...cfg})};
  }
  function install(root,opts={}){return create(root,opts)}
  return {DEFAULTS,parseSession,isLoginRequest,isAdminUrl,addAdminHeaders,create,install};
});