const crypto=require('node:crypto');
const {Pool}=require('pg');

const DATABASE_URL=String(process.env.DATABASE_URL||'').trim();
const WORKSPACE_KEY=String(process.env.REPORT_WORKSPACE_KEY||'bsm-report-gudang').trim();
const ADMIN_USERNAME=String(process.env.REPORT_ADMIN_USERNAME||'admin').trim().toLowerCase();
const ADMIN_PASSWORD=String(process.env.REPORT_ADMIN_PASSWORD||'');
const ADMIN_DISPLAY_NAME=String(process.env.REPORT_ADMIN_DISPLAY_NAME||'BSM Admin').trim()||'BSM Admin';
const SESSION_DAYS=Math.max(1,Number(process.env.REPORT_SESSION_DAYS||7));
const MAX_STATE_BYTES=3.5*1024*1024;

let pool=null;
let schemaPromise=null;

function getPool(){
  if(!DATABASE_URL)return null;
  if(!pool)pool=new Pool({connectionString:DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:8000});
  return pool;
}
function send(res,status,data){
  res.status(status);
  res.setHeader('cache-control','no-store, max-age=0');
  res.setHeader('x-content-type-options','nosniff');
  res.setHeader('referrer-policy','no-referrer');
  return res.json(data);
}
function tokenHash(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
function passwordHash(password){
  const salt=crypto.randomBytes(16);
  const hash=crypto.scryptSync(String(password),salt,64);
  return 'scrypt$'+salt.toString('hex')+'$'+hash.toString('hex');
}
function passwordOk(password,stored){
  const parts=String(stored||'').split('$');
  if(parts.length!==3||parts[0]!=='scrypt')return false;
  try{
    const salt=Buffer.from(parts[1],'hex'),expected=Buffer.from(parts[2],'hex');
    const actual=crypto.scryptSync(String(password),salt,expected.length);
    return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
  }catch(_){return false;}
}
async function ensureSchema(){
  const db=getPool();
  if(!db)throw Object.assign(new Error('DATABASE_URL belum dikonfigurasi'),{statusCode:503,code:'DB_NOT_CONFIGURED'});
  if(schemaPromise)return schemaPromise;
  schemaPromise=db.query(`
    CREATE TABLE IF NOT EXISTS app_users(
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS app_sessions(
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash CHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON app_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_sessions_expires ON app_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS report_workspaces(
      id BIGSERIAL PRIMARY KEY,
      workspace_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT 'BSM Report Gudang',
      state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      version BIGINT NOT NULL DEFAULT 0,
      updated_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS report_audit_logs(
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_report_audit_created ON report_audit_logs(created_at DESC);
  `).catch(err=>{schemaPromise=null;throw err;});
  await schemaPromise;
}
async function ensureAdmin(){
  const db=getPool();
  const count=await db.query('SELECT COUNT(*)::int AS n FROM app_users');
  if(Number(count.rows[0].n)>0)return {ready:true,created:false};
  if(!ADMIN_PASSWORD)return {ready:false,created:false};
  if(ADMIN_PASSWORD.length<10)throw Object.assign(new Error('REPORT_ADMIN_PASSWORD minimal 10 karakter'),{statusCode:503,code:'ADMIN_PASSWORD_WEAK'});
  await db.query(
    'INSERT INTO app_users(username,display_name,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,TRUE) ON CONFLICT(username) DO NOTHING',
    [ADMIN_USERNAME,ADMIN_DISPLAY_NAME,passwordHash(ADMIN_PASSWORD),'admin']
  );
  return {ready:true,created:true};
}
async function audit(userId,action,detail){
  try{await getPool().query('INSERT INTO report_audit_logs(user_id,action,detail) VALUES($1,$2,$3::jsonb)',[userId||null,action,JSON.stringify(detail||{})]);}catch(_){}
}
async function auth(req){
  const match=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);
  if(!match)return null;
  const result=await getPool().query(`
    SELECT s.id AS session_id,u.id,u.username,u.display_name,u.role,u.must_change_password
    FROM app_sessions s JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.is_active=TRUE
    LIMIT 1
  `,[tokenHash(match[1])]);
  if(!result.rows.length)return null;
  getPool().query('UPDATE app_sessions SET last_seen_at=NOW() WHERE id=$1',[result.rows[0].session_id]).catch(()=>{});
  return {...result.rows[0],token:match[1]};
}
async function newSession(userId){
  const token=crypto.randomBytes(32).toString('base64url');
  await getPool().query(
    "INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+($3::text || ' days')::interval)",
    [userId,tokenHash(token),String(SESSION_DAYS)]
  );
  return token;
}
function userView(u){
  return {id:u.id,username:u.username,displayName:u.display_name,role:u.role,mustChangePassword:!!u.must_change_password};
}

module.exports=async function handler(req,res){
  const op=String(req.query&&req.query.op||'health');
  try{
    if(op==='health'){
      if(!DATABASE_URL)return send(res,200,{ok:true,configured:false,database:false,adminConfigured:false});
      await ensureSchema();
      const admin=await ensureAdmin();
      await getPool().query('DELETE FROM app_sessions WHERE expires_at<=NOW()').catch(()=>{});
      return send(res,200,{ok:true,configured:true,database:true,adminConfigured:admin.ready});
    }

    await ensureSchema();
    const adminStatus=await ensureAdmin();

    if(op==='login'){
      if(req.method!=='POST')return send(res,405,{ok:false,error:'Method tidak diizinkan'});
      if(!adminStatus.ready)return send(res,503,{ok:false,error:'Akun admin belum dikonfigurasi',code:'ADMIN_NOT_CONFIGURED'});
      const username=String(req.body&&req.body.username||'').trim().toLowerCase();
      const password=String(req.body&&req.body.password||'');
      if(!username||!password)return send(res,400,{ok:false,error:'Username dan password wajib diisi'});
      const result=await getPool().query(
        'SELECT id,username,display_name,password_hash,role,must_change_password,is_active FROM app_users WHERE username=$1 LIMIT 1',
        [username]
      );
      const u=result.rows[0];
      if(!u||!u.is_active||!passwordOk(password,u.password_hash)){
        await new Promise(r=>setTimeout(r,220));
        return send(res,401,{ok:false,error:'Username atau password salah'});
      }
      const token=await newSession(u.id);
      await audit(u.id,'login',{});
      return send(res,200,{ok:true,token,user:userView(u)});
    }

    const u=await auth(req);
    if(!u)return send(res,401,{ok:false,error:'Sesi login tidak valid atau sudah habis'});

    if(op==='me'){
      if(req.method!=='GET')return send(res,405,{ok:false,error:'Method tidak diizinkan'});
      return send(res,200,{ok:true,user:userView(u)});
    }
    if(op==='logout'){
      if(req.method!=='POST')return send(res,405,{ok:false,error:'Method tidak diizinkan'});
      await getPool().query('DELETE FROM app_sessions WHERE token_hash=$1',[tokenHash(u.token)]);
      await audit(u.id,'logout',{});
      return send(res,200,{ok:true});
    }
    if(op==='change-password'){
      if(req.method!=='POST')return send(res,405,{ok:false,error:'Method tidak diizinkan'});
      const currentPassword=String(req.body&&req.body.currentPassword||'');
      const nextPassword=String(req.body&&req.body.newPassword||'');
      if(nextPassword.length<10)return send(res,400,{ok:false,error:'Password baru minimal 10 karakter'});
      const result=await getPool().query('SELECT password_hash FROM app_users WHERE id=$1',[u.id]);
      if(!result.rows.length||!passwordOk(currentPassword,result.rows[0].password_hash))return send(res,400,{ok:false,error:'Password lama salah'});
      await getPool().query('UPDATE app_users SET password_hash=$1,must_change_password=FALSE,updated_at=NOW() WHERE id=$2',[passwordHash(nextPassword),u.id]);
      await getPool().query('DELETE FROM app_sessions WHERE user_id=$1 AND token_hash<>$2',[u.id,tokenHash(u.token)]);
      await audit(u.id,'change_password',{});
      return send(res,200,{ok:true});
    }
    if(op==='state'){
      if(req.method==='GET'){
        const result=await getPool().query('SELECT state_json,version,updated_at FROM report_workspaces WHERE workspace_key=$1 LIMIT 1',[WORKSPACE_KEY]);
        if(!result.rows.length)return send(res,200,{ok:true,exists:false,state:null,version:0,updatedAt:null});
        const row=result.rows[0];
        return send(res,200,{ok:true,exists:true,state:row.state_json,version:Number(row.version||0),updatedAt:row.updated_at});
      }
      if(req.method==='PUT'){
        const state=req.body&&req.body.state;
        if(!state||typeof state!=='object'||Array.isArray(state))return send(res,400,{ok:false,error:'State report tidak valid'});
        const serialized=JSON.stringify(state);
        if(Buffer.byteLength(serialized,'utf8')>MAX_STATE_BYTES)return send(res,413,{ok:false,error:'Data report terlalu besar untuk satu sinkronisasi'});
        const result=await getPool().query(`
          INSERT INTO report_workspaces(workspace_key,name,state_json,version,updated_by,updated_at)
          VALUES($1,'BSM Report Gudang',$2::jsonb,1,$3,NOW())
          ON CONFLICT(workspace_key) DO UPDATE SET
            state_json=EXCLUDED.state_json,
            version=report_workspaces.version+1,
            updated_by=EXCLUDED.updated_by,
            updated_at=NOW()
          RETURNING version,updated_at
        `,[WORKSPACE_KEY,serialized,u.id]);
        return send(res,200,{ok:true,version:Number(result.rows[0].version),updatedAt:result.rows[0].updated_at});
      }
      return send(res,405,{ok:false,error:'Method tidak diizinkan'});
    }
    if(op==='clear'){
      if(req.method!=='POST')return send(res,405,{ok:false,error:'Method tidak diizinkan'});
      const state=req.body&&req.body.state;
      const serialized=JSON.stringify(state&&typeof state==='object'&&!Array.isArray(state)?state:{});
      const result=await getPool().query(`
        INSERT INTO report_workspaces(workspace_key,name,state_json,version,updated_by,updated_at)
        VALUES($1,'BSM Report Gudang',$2::jsonb,1,$3,NOW())
        ON CONFLICT(workspace_key) DO UPDATE SET
          state_json=EXCLUDED.state_json,
          version=report_workspaces.version+1,
          updated_by=EXCLUDED.updated_by,
          updated_at=NOW()
        RETURNING version,updated_at
      `,[WORKSPACE_KEY,serialized,u.id]);
      await audit(u.id,'clear_state',{});
      return send(res,200,{ok:true,version:Number(result.rows[0].version),updatedAt:result.rows[0].updated_at});
    }

    return send(res,404,{ok:false,error:'Endpoint tidak ditemukan'});
  }catch(err){
    console.error('report-app',op,err&&err.message?err.message:err);
    return send(res,err.statusCode||500,{ok:false,error:err&&err.message?err.message:'Server database bermasalah',code:err&&err.code||undefined});
  }
};