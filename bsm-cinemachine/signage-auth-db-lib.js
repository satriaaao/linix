const crypto=require('node:crypto');

function normalizeUsername(username){
  return String(username||'').trim().toLowerCase();
}
function isValidUsername(username){
  const value=normalizeUsername(username);
  return /^[a-z0-9._-]{3,32}$/.test(value);
}
function isStrongPassword(password){
  return typeof password==='string' && password.length>=8;
}
function hashPassword(password,saltHex){
  if(!isStrongPassword(password))throw new Error('Password minimal 8 karakter');
  const salt=saltHex||crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex');
  return {salt,hash};
}
function verifyPassword(password,hashHex,saltHex){
  try{
    const expected=Buffer.from(String(hashHex||''),'hex');
    const actual=crypto.scryptSync(String(password||''),Buffer.from(String(saltHex||''),'hex'),expected.length);
    return expected.length>0&&expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
  }catch(_){return false}
}
function randomToken(){return crypto.randomBytes(32).toString('base64url')}
function hashToken(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex')}
function parseCookies(header){
  const out={};
  String(header||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i<0)return;
    const k=part.slice(0,i).trim();
    const v=part.slice(i+1).trim();
    if(!k)return;
    try{out[k]=decodeURIComponent(v)}catch(_){out[k]=v}
  });
  return out;
}
function sessionCookie(token,maxAgeSeconds){
  const age=Math.max(0,Number(maxAgeSeconds||0));
  return 'signage_session='+encodeURIComponent(String(token||''))+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+Math.floor(age);
}
function clearSessionCookie(){
  return 'signage_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
function getDatabaseUrl(env){
  env=env||{};
  return String(env.SIGNAGE_DATABASE_URL||env.DATABASE_URL||env.POSTGRES_URL||env.POSTGRES_PRISMA_URL||'').trim();
}
module.exports={normalizeUsername,isValidUsername,isStrongPassword,hashPassword,verifyPassword,randomToken,hashToken,parseCookies,sessionCookie,clearSessionCookie,getDatabaseUrl};
