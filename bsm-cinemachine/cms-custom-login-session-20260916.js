/* Rentcam CMS persistent admin session adapter */
(function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const ADMIN_EMAIL='admin@aiorbitlab.me';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PASS_KEY='rentcam_cms_admin_password';
  const SESSION_KEY='rentcam_cms_admin_session';
  const AUTH_KEY='rentcam_cms_auth';
  const VERSION_KEY='rentcam_cms_version';
  const nativeFetch=window.fetch.bind(window);
  const nativeRemove=Storage.prototype.removeItem;

  function readSession(){
    try{
      const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
      if(!s?.token||!s?.expires_at)return null;
      if(Date.parse(s.expires_at)<=Date.now()){
        nativeRemove.call(localStorage,SESSION_KEY);
        return null;
      }
      return s;
    }catch(_){return null}
  }

  async function issueSession(password){
    const r=await nativeFetch(SB+'/rest/v1/rpc/rentcam_issue_admin_session',{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json','x-rentcam-admin':password},
      body:'{}'
    });
    if(!r.ok)throw new Error('Gagal membuat sesi admin');
    const s=await r.json();
    if(!s?.token||!s?.expires_at)throw new Error('Sesi admin tidak valid');
    localStorage.setItem(SESSION_KEY,JSON.stringify(s));
    return s;
  }

  /* One-time migration: an old custom auth token without password/session cannot
     satisfy RLS. Force a single clean login, then the new 30-day session persists. */
  try{
    const auth=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
    const pass=sessionStorage.getItem(PASS_KEY);
    const sess=readSession();
    if(auth?.access_token==='rentcam-cms-custom'&&!sess&&!pass){
      nativeRemove.call(localStorage,AUTH_KEY);
    }else if(pass&&!sess){
      issueSession(pass).catch(()=>{});
    }
  }catch(_){ }

  Storage.prototype.removeItem=function(k){
    if(this===localStorage&&k===AUTH_KEY){
      sessionStorage.removeItem(PASS_KEY);
      nativeRemove.call(localStorage,SESSION_KEY);
    }
    return nativeRemove.call(this,k);
  };

  function broadcastCmsUpdate(){
    const v=String(Date.now());
    try{localStorage.setItem(VERSION_KEY,v)}catch(e){}
    try{const bc=new BroadcastChannel('rentcam-cms');bc.postMessage({type:'config-updated',version:v});bc.close()}catch(e){}
  }

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:input?.url||'';
    const method=String(init.method||input?.method||'GET').toUpperCase();

    if(url.startsWith(SB+'/auth/v1/token')&&url.includes('grant_type=password')&&method==='POST'){
      let body={};
      try{body=JSON.parse(init.body||'{}')}catch(e){}
      const email=String(body.email||'').trim().toLowerCase();
      const password=String(body.password||'');
      if(email!==ADMIN_EMAIL){
        return new Response(JSON.stringify({message:'Email admin tidak sesuai'}),{status:400,headers:{'Content-Type':'application/json'}});
      }
      try{
        const r=await nativeFetch(SB+'/rest/v1/rpc/rentcam_admin_check',{
          method:'POST',headers:{apikey:KEY,'Content-Type':'application/json','x-rentcam-admin':password},body:'{}'
        });
        const ok=r.ok&&((await r.json())===true);
        if(!ok)throw new Error('invalid');
        sessionStorage.setItem(PASS_KEY,password);
        await issueSession(password);
        return new Response(JSON.stringify({access_token:'rentcam-cms-custom',token_type:'bearer',expires_in:2592000,user:{email:ADMIN_EMAIL}}),{status:200,headers:{'Content-Type':'application/json'}});
      }catch(e){
        sessionStorage.removeItem(PASS_KEY);
        nativeRemove.call(localStorage,SESSION_KEY);
        return new Response(JSON.stringify({message:'Password admin salah'}),{status:400,headers:{'Content-Type':'application/json'}});
      }
    }

    const needsAdminHeader=url.startsWith(SB+'/rest/v1/')||url.startsWith(SB+'/storage/v1/');
    if(needsAdminHeader){
      const sess=readSession();
      const pass=sessionStorage.getItem(PASS_KEY);
      if(sess?.token||pass){
        const h=new Headers(init.headers||{});
        if(sess?.token)h.set('x-rentcam-session',sess.token);
        if(pass)h.set('x-rentcam-admin',pass);
        init={...init,headers:h};
      }
    }

    const response=await nativeFetch(input,init);
    if(response.ok&&method==='PATCH'&&url.includes('/rest/v1/rentcam_cms_config'))broadcastCmsUpdate();
    if(url.startsWith(SB+'/storage/v1/')&&!response.ok){
      try{const text=await response.clone().text();console.error('Rentcam CMS storage upload failed',response.status,text)}catch(e){}
    }
    return response;
  };
})();