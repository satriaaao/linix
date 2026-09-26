const {Pool}=require('pg');
const A=require('./signage-auth-db-lib');
const S=require('./signage-lib');

let pool=null;
let schemaReady=false;

function connectionString(){return A.getDatabaseUrl(process.env)}
function configured(){return !!connectionString()}
function sslConfig(url){
  return /localhost|127\.0\.0\.1/.test(url)?false:{rejectUnauthorized:false};
}
function getPool(){
  const url=connectionString();
  if(!url){
    const e=new Error('Database belum terhubung');
    e.code='DB_NOT_CONFIGURED';
    throw e;
  }
  if(!pool)pool=new Pool({connectionString:url,ssl:sslConfig(url),max:3,idleTimeoutMillis:20000,connectionTimeoutMillis:8000});
  return pool;
}
async function ensureSchema(){
  if(schemaReady)return;
  const p=getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS signage_admin (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS signage_sessions (
      token_hash TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS signage_sessions_expires_idx ON signage_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS signage_config (
      id TEXT PRIMARY KEY,
      config JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  schemaReady=true;
}
async function status(){
  if(!configured())return {configured:false,connected:false,setupRequired:false,message:'DATABASE_URL belum tersedia'};
  try{
    await ensureSchema();
    const p=getPool();
    const a=await p.query('SELECT EXISTS(SELECT 1 FROM signage_admin WHERE id=1) AS exists');
    const c=await p.query("SELECT updated_at FROM signage_config WHERE id='default'");
    return {
      configured:true,
      connected:true,
      setupRequired:!a.rows[0]?.exists,
      updatedAt:c.rows[0]?.updated_at||null
    };
  }catch(e){
    return {configured:true,connected:false,setupRequired:false,message:String(e?.message||e)};
  }
}
async function adminExists(){
  await ensureSchema();
  const r=await getPool().query('SELECT EXISTS(SELECT 1 FROM signage_admin WHERE id=1) AS exists');
  return !!r.rows[0]?.exists;
}
async function issueSession(){
  await ensureSchema();
  const token=A.randomToken();
  const tokenHash=A.hashToken(token);
  const seconds=60*60*24*30;
  await getPool().query('DELETE FROM signage_sessions WHERE expires_at <= NOW()');
  await getPool().query(
    "INSERT INTO signage_sessions(token_hash,expires_at) VALUES($1,NOW()+($2::text || ' seconds')::interval)",
    [tokenHash,String(seconds)]
  );
  return {token,maxAge:seconds};
}
async function setupAdmin(password){
  await ensureSchema();
  if(await adminExists()){
    const e=new Error('Password admin sudah dibuat');
    e.code='ADMIN_EXISTS';
    throw e;
  }
  const h=A.hashPassword(password);
  try{
    await getPool().query('INSERT INTO signage_admin(id,password_hash,password_salt) VALUES(1,$1,$2)',[h.hash,h.salt]);
  }catch(e){
    if(e?.code==='23505'){
      const x=new Error('Password admin sudah dibuat');x.code='ADMIN_EXISTS';throw x;
    }
    throw e;
  }
  return issueSession();
}
async function login(password){
  await ensureSchema();
  const r=await getPool().query('SELECT password_hash,password_salt FROM signage_admin WHERE id=1');
  const row=r.rows[0];
  if(!row||!A.verifyPassword(password,row.password_hash,row.password_salt)){
    const e=new Error('Password salah');e.code='INVALID_PASSWORD';throw e;
  }
  return issueSession();
}
async function sessionValid(token){
  if(!token)return false;
  await ensureSchema();
  const hash=A.hashToken(token);
  const r=await getPool().query('SELECT 1 FROM signage_sessions WHERE token_hash=$1 AND expires_at>NOW()',[hash]);
  return !!r.rowCount;
}
async function logout(token){
  if(!token||!configured())return;
  await ensureSchema();
  await getPool().query('DELETE FROM signage_sessions WHERE token_hash=$1',[A.hashToken(token)]);
}
async function changePassword(token,currentPassword,newPassword){
  if(!await sessionValid(token)){
    const e=new Error('Sesi login tidak valid');e.code='UNAUTHORIZED';throw e;
  }
  const r=await getPool().query('SELECT password_hash,password_salt FROM signage_admin WHERE id=1');
  const row=r.rows[0];
  if(!row||!A.verifyPassword(currentPassword,row.password_hash,row.password_salt)){
    const e=new Error('Password lama salah');e.code='INVALID_PASSWORD';throw e;
  }
  const h=A.hashPassword(newPassword);
  await getPool().query('UPDATE signage_admin SET password_hash=$1,password_salt=$2,updated_at=NOW() WHERE id=1',[h.hash,h.salt]);
  await getPool().query('DELETE FROM signage_sessions WHERE token_hash<>$1',[A.hashToken(token)]);
}
function cleanConfig(input){
  const value=S.normalizeConfig({...input,updatedAt:Date.now()});
  return value;
}
async function getConfig(){
  await ensureSchema();
  const r=await getPool().query("SELECT config,updated_at FROM signage_config WHERE id='default'");
  if(!r.rowCount)return cleanConfig({name:'Standing Lobby',orientation:'portrait',videos:[]});
  const cfg=cleanConfig(r.rows[0].config||{});
  cfg.updatedAt=new Date(r.rows[0].updated_at).getTime();
  return cfg;
}
async function saveConfig(token,input){
  if(!await sessionValid(token)){
    const e=new Error('Sesi login tidak valid');e.code='UNAUTHORIZED';throw e;
  }
  const cfg=cleanConfig(input);
  const r=await getPool().query(
    "INSERT INTO signage_config(id,config,updated_at) VALUES('default',$1::jsonb,NOW()) ON CONFLICT(id) DO UPDATE SET config=EXCLUDED.config,updated_at=NOW() RETURNING config,updated_at",
    [JSON.stringify(cfg)]
  );
  const out=cleanConfig(r.rows[0].config);
  out.updatedAt=new Date(r.rows[0].updated_at).getTime();
  return out;
}
module.exports={configured,ensureSchema,status,adminExists,setupAdmin,login,sessionValid,logout,changePassword,getConfig,saveConfig,cleanConfig};
