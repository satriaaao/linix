(function(root){
  var API_PATH='/api/report-app';
  var TOKEN_KEY='bsm-report-gudang-session';

  function getToken(){
    try{
      var token=localStorage.getItem(TOKEN_KEY)||'';
      if(token)return token;
      token=sessionStorage.getItem(TOKEN_KEY)||'';
      if(token){localStorage.setItem(TOKEN_KEY,token);sessionStorage.removeItem(TOKEN_KEY);}
      return token;
    }catch(_){return '';}
  }
  function setToken(token){
    try{
      if(token)localStorage.setItem(TOKEN_KEY,String(token));
      else localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }catch(_){}
  }
  function headers(extra){
    var out=Object.assign({'content-type':'application/json'},extra||{});
    var token=getToken();
    if(token)out.Authorization='Bearer '+token;
    return out;
  }
  async function request(op,options){
    options=options||{};
    var res=await fetch(API_PATH+'?op='+encodeURIComponent(op),{
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
      err.code=data&&data.code;
      err.payload=data;
      throw err;
    }
    return data;
  }

  function health(){return request('health');}
  async function bootstrapUser(payload){
    var data=await request('bootstrap-user',{method:'POST',body:payload||{}});
    setToken(data.token||'');
    return data;
  }
  async function login(username,password){
    var data=await request('login',{method:'POST',body:{username:username,password:password}});
    setToken(data.token||'');
    return data;
  }
  async function logout(){
    try{if(getToken())await request('logout',{method:'POST',body:{}});}finally{setToken('');}
  }
  function me(){return request('me');}
  function getState(){return request('state');}
  function saveState(state,keepalive){return request('state',{method:'PUT',body:{state:state},keepalive:!!keepalive});}
  function clearState(state){return request('clear',{method:'POST',body:{state:state||{}}});}
  function changePassword(currentPassword,newPassword){
    return request('change-password',{method:'POST',body:{currentPassword:currentPassword,newPassword:newPassword}});
  }
  function listUsers(){return request('users');}
  function createUser(payload){return request('users',{method:'POST',body:payload||{}});}
  function updateUser(payload){return request('users',{method:'PUT',body:payload||{}});}
  function deleteUser(id){return request('users',{method:'DELETE',body:{id:id}});}

  root.BSMReportCloud={
    apiPath:API_PATH,
    getToken:getToken,
    setToken:setToken,
    health:health,
    bootstrapUser:bootstrapUser,
    login:login,
    logout:logout,
    me:me,
    getState:getState,
    saveState:saveState,
    clearState:clearState,
    changePassword:changePassword,
    listUsers:listUsers,
    createUser:createUser,
    updateUser:updateUser,
    deleteUser:deleteUser
  };
})(typeof window!=='undefined'?window:this);
