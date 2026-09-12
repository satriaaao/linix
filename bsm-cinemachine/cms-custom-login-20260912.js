/* Rentcam CMS custom admin login adapter */
(function(){
  const SB='https://xleceiffuopioeguniwj.supabase.co';
  const ADMIN_EMAIL='admin@aiorbitlab.me';
  const KEY='sb_publishable_POksYryhG_mkFbs7N0fjKQ_4dUim7Ex';
  const PASS_KEY='rentcam_cms_admin_password';
  const AUTH_KEY='rentcam_cms_auth';
  const VERSION_KEY='rentcam_cms_version';
  const nativeFetch=window.fetch.bind(window);

  try{
    const saved=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
    if(saved?.access_token==='rentcam-cms-custom'&&!sessionStorage.getItem(PASS_KEY)) localStorage.removeItem(AUTH_KEY);
  }catch(e){}

  const nativeRemove=Storage.prototype.removeItem;
  Storage.prototype.removeItem=function(k){
    if(this===localStorage&&k===AUTH_KEY) sessionStorage.removeItem(PASS_KEY);
    return nativeRemove.call(this,k);
  };

  function broadcastCmsUpdate(){
    const v=String(Date.now());
    try{localStorage.setItem(VERSION_KEY,v)}catch(e){}
    try{const bc=new BroadcastChannel('rentcam-cms');bc.postMessage({type:'config-updated',version:v});bc.close()}catch(e){}
  }

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:input?.url||'';
    const method=String(init.method||'GET').toUpperCase();

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
          method:'POST',
          headers:{apikey:KEY,'Content-Type':'application/json','x-rentcam-admin':password},
          body:'{}'
        });
        const ok=r.ok&&((await r.json())===true);
        if(!ok) throw new Error('invalid');
        sessionStorage.setItem(PASS_KEY,password);
        return new Response(JSON.stringify({access_token:'rentcam-cms-custom',token_type:'bearer',expires_in:43200,user:{email:ADMIN_EMAIL}}),{status:200,headers:{'Content-Type':'application/json'}});
      }catch(e){
        sessionStorage.removeItem(PASS_KEY);
        return new Response(JSON.stringify({message:'Password admin salah'}),{status:400,headers:{'Content-Type':'application/json'}});
      }
    }

    const needsAdminHeader=url.startsWith(SB+'/rest/v1/')||url.startsWith(SB+'/storage/v1/');
    if(needsAdminHeader){
      const p=sessionStorage.getItem(PASS_KEY);
      if(p){
        const h=new Headers(init.headers||{});
        h.set('x-rentcam-admin',p);
        init={...init,headers:h};
      }
    }

    const response=await nativeFetch(input,init);

    if(response.ok&&method==='PATCH'&&url.includes('/rest/v1/rentcam_cms_config')){
      broadcastCmsUpdate();
    }

    if(url.startsWith(SB+'/storage/v1/')&&!response.ok){
      try{
        const copy=response.clone();
        const text=await copy.text();
        console.error('Rentcam CMS storage upload failed',response.status,text);
      }catch(e){}
    }
    return response;
  };
})();
