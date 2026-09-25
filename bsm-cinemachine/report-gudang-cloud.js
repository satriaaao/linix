(function(root){
  var API_BASE='https://report-api.invalid';
  var TOKEN_KEY='bsm-report-gudang-session';

  function getToken(){
    try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch(_){return '';}
  }
  function setToken(token){
    try{
      if(token)sessionStorage.setItem(TOKEN_KEY,String(token));
      else sessionStorage.removeItem(TOKEN_KEY);
    }catch(_){}
  }
  function headers(extra){
    var out=Object.assign({'content-type':'application/json'},extra||{});
    var token=getToken();
    if(token)out.Authorization='Bearer '+token;
    return out;
  }
  async function request(path,options){
    options=options||{};
    var res=await fetch(API_BASE+path,{
      method:options.method||'GET',
      headers:headers(options.headers),
      body:options.body==null?undefined:JSON.stringify(options.body),
      cache:'no-store',
      keepalive:!!options.keepalive
    });
    var data={};
    try{data=await res.json();}catch(_){}
    if(res.status===401)setToken('');
    if(!res.ok){
      var err=new Error(data&&data.error?data.error:'Server database tidak dapat dihubungi');
      err.status=res.status;
      err.payload=data;
      throw err;
    }
    return data;
  }

  async function login(username,password){
    var data=await request('/api/auth/login',{method:'POST',body:{username:username,password:password}});
    setToken(data.token||'');
    return data;
  }
  async function logout(){
    try{if(getToken())await request('/api/auth/logout',{method:'POST',body:{}});}finally{setToken('');}
  }
  function me(){return request('/api/auth/me');}
  function getState(){return request('/api/state');}
  function saveState(state,keepalive){return request('/api/state',{method:'PUT',body:{state:state},keepalive:!!keepalive});}
  function clearState(){return request('/api/state/clear',{method:'POST',body:{}});}
  function changePassword(currentPassword,newPassword){
    return request('/api/auth/change-password',{method:'POST',body:{currentPassword:currentPassword,newPassword:newPassword}});
  }

  root.BSMReportCloud={
    apiBase:API_BASE,
    getToken:getToken,
    setToken:setToken,
    login:login,
    logout:logout,
    me:me,
    getState:getState,
    saveState:saveState,
    clearState:clearState,
    changePassword:changePassword
  };
})(typeof window!=='undefined'?window:this);
