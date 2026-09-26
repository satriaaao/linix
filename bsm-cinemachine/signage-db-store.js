const PROVIDER='supabase';
const PROJECT_REF='bdutjchphtqtklclbgoz';
const SUPABASE_URL='https://bdutjchphtqtklclbgoz.supabase.co';
const SUPABASE_KEY='sb_publishable_jEF2xLIueWHUdU5MBwd6dg_sG9JFFWU';

function configured(){return true}

function mappedError(message,status){
  const msg=String(message||'Supabase request gagal');
  const e=new Error(msg);
  e.status=status||500;
  if(/Akun admin sudah dibuat/i.test(msg))e.code='ADMIN_EXISTS';
  else if(/Username atau password salah/i.test(msg))e.code='INVALID_CREDENTIALS';
  else if(/Sesi login tidak valid/i.test(msg))e.code='UNAUTHORIZED';
  else if(/Password lama salah/i.test(msg))e.code='INVALID_PASSWORD';
  else if(/Username harus/i.test(msg))e.code='INVALID_USERNAME';
  return e;
}

async function rpc(name,args={}){
  const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+encodeURIComponent(name),{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:'Bearer '+SUPABASE_KEY,
      'Content-Type':'application/json',
      Accept:'application/json'
    },
    body:JSON.stringify(args)
  });
  let data=null;
  const text=await r.text();
  if(text){
    try{data=JSON.parse(text)}catch(_){data=text}
  }
  if(!r.ok){
    const message=(data&&typeof data==='object'&&(data.message||data.details||data.hint))||String(data||('HTTP '+r.status));
    throw mappedError(message,r.status);
  }
  return data;
}

async function status(){
  try{
    const data=await rpc('signage_status',{p_token:''});
    return {
      configured:true,
      connected:true,
      setupRequired:!!data?.setupRequired,
      authenticated:false,
      updatedAt:data?.updatedAt||null,
      provider:PROVIDER
    };
  }catch(e){
    return {configured:true,connected:false,setupRequired:false,authenticated:false,message:String(e?.message||e),provider:PROVIDER};
  }
}

async function setupAdmin(username,password){
  return rpc('signage_setup_admin',{p_username:String(username||''),p_password:String(password||'')});
}

async function login(username,password){
  return rpc('signage_login',{p_username:String(username||''),p_password:String(password||'')});
}

async function sessionValid(token){
  if(!token)return false;
  const data=await rpc('signage_status',{p_token:String(token)});
  return !!data?.authenticated;
}

async function logout(token){
  if(!token)return true;
  return rpc('signage_logout',{p_token:String(token)});
}

async function changePassword(token,currentPassword,newPassword){
  return rpc('signage_change_password',{
    p_token:String(token||''),
    p_current_password:String(currentPassword||''),
    p_new_password:String(newPassword||'')
  });
}

async function getConfig(){
  const data=await rpc('signage_get_config',{});
  return data&&typeof data==='object'?data:{name:'Standing Lobby',orientation:'portrait',muted:true,folderUrl:'',videos:[],updatedAt:0};
}

async function saveConfig(token,input){
  return rpc('signage_save_config',{p_token:String(token||''),p_config:input||{}});
}

module.exports={
  provider:PROVIDER,
  projectRef:PROJECT_REF,
  configured,
  status,
  setupAdmin,
  login,
  sessionValid,
  logout,
  changePassword,
  getConfig,
  saveConfig,
  _rpc:rpc
};
