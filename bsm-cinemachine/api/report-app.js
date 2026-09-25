const crypto=require('node:crypto');
const {Pool}=require('pg');

const DATABASE_URL=process.env.DATABASE_URL||'';
const WORKSPACE_KEY=process.env.REPORT_WORKSPACE_KEY||'bsm-report-gudang';
const SESSION_DAYS=Math.max(1,Number(process.env.SESSION_DAYS||7));
const REPORT_IDS=['it','admin','gudang-kamera','gudang-audio','gudang-lighting','gudang-cinema','koordinator-crew','marketing'];
const KNOWN_PERMISSIONS=['data.read','data.write','data.clear','preview.view','reports.list','cover.edit','input.bulk','input.manual','downloads.data','downloads.pdf','settings.manage','accounts.manage','install.app',...REPORT_IDS.map(id=>'report.'+id)];
const VALID_ROLES=['admin','manager','editor','viewer','custom'];
const pool=DATABASE_URL?new Pool({connectionString:DATABASE_URL,max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:10000}):null;
let schemaReady=null;

function send(res,status,payload){
  res.status(status);
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store, max-age=0');
  res.setHeader('x-content-type-options','nosniff');
  res.setHeader('referrer-policy','no-referrer');
  res.send(JSON.stringify(payload));
}
function nowIso(){return new Date().toISOString();}
function tokenHash(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
function makePasswordHash(password){
  const salt=crypto.randomBytes(16),derived=crypto.scryptSync(String(password),salt,64);
  return 'scrypt$'+salt.toString('hex')+'$'+derived.toString('hex');
}
function verifyPassword(password,stored){
  const parts=String(stored||'').split('$');
  if(parts.length!==3||parts[0]!=='scrypt')return false;
  try{
    const salt=Buffer.from(parts[1],'hex'),expected=Buffer.from(parts[2],'hex'),actual=crypto.scryptSync(String(password),salt,expected.length);
    return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
  }catch(_){return false;}
}
function cleanUsername(v){return String(v||'').trim().toLowerCase();}
function validUsername(v){return /^[a-z0-9._-]{3,40}$/.test(v)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function cleanRole(v){v=String(v||'custom').toLowerCase();return VALID_ROLES.includes(v)?v:'custom';}
function normalizePermissions(v){
  if(!Array.isArray(v))return [];
  return Array.from(new Set(v.map(x=>String(x||'').trim()).filter(x=>x==='*'||KNOWN_PERMISSIONS.includes(x))));
}
function publicUser(row){
  if(!row)return null;
  return {id:String(row.id),username:row.username,displayName:row.display_name,role:row.role,permissions:String(row.role).toLowerCase()==='admin'?['*']:normalizePermissions(row.permissions),mustChangePassword:!!row.must_change_password,isActive:row.is_active!==false};
}
function hasPermission(user,key){
  if(String(user.role||'').toLowerCase()==='admin')return true;
  const p=normalizePermissions(user.permissions);return p.includes('*')||p.includes(key);
}
function allowedReports(user){return String(user.role||'').toLowerCase()==='admin'?REPORT_IDS.slice():REPORT_IDS.filter(id=>hasPermission(user,'report.'+id));}
function clone(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
function bodyObject(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}

async function ensureSchema(){
  if(!pool)throw Object.assign(new Error('DATABASE_URL belum dikonfigurasi'),{status:503});
  if(schemaReady)return schemaReady;
  schemaReady=pool.query(`
    CREATE TABLE IF NOT EXISTS app_users(
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'custom',
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
    CREATE TABLE IF NOT EXISTS app_sessions(
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash CHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  `).catch(err=>{schemaReady=null;throw err;});
  await schemaReady;
}
async function ensureBootstrapAdmin(){
  const count=await pool.query('SELECT COUNT(*)::int AS n FROM app_users');
  if(count.rows[0].n>0)return;
  const password=String(process.env.ADMIN_PASSWORD||'');
  if(password.length<10)return;
  const username=cleanUsername(process.env.ADMIN_USERNAME||'admin');
  const display=String(process.env.ADMIN_DISPLAY_NAME||'BSM Admin').trim()||'BSM Admin';
  await pool.query('INSERT INTO app_users(username,display_name,password_hash,role,permissions,must_change_password,is_active) VALUES($1,$2,$3,$4,$5::jsonb,FALSE,TRUE)',[username,display,makePasswordHash(password),'admin',JSON.stringify(['*'])]);
}
async function audit(userId,action,detail){try{await pool.query('INSERT INTO report_audit_logs(user_id,action,detail) VALUES($1,$2,$3::jsonb)',[userId||null,action,JSON.stringify(detail||{})]);}catch(_){}}
async function createSession(userId){
  const token=crypto.randomBytes(32).toString('base64url');
  await pool.query("INSERT INTO app_sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+($3::text||' days')::interval)",[userId,tokenHash(token),String(SESSION_DAYS)]);
  return token;
}
async function authenticate(req){
  const header=String(req.headers&&req.headers.authorization||''),m=header.match(/^Bearer\s+(.+)$/i);
  if(!m)return null;
  const q=await pool.query(`
    SELECT s.id AS session_id,u.*
    FROM app_sessions s JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.is_active=TRUE LIMIT 1
  `,[tokenHash(m[1])]);
  return q.rows[0]||null;
}
function filterStateForUser(state,user){
  const src=clone(state||{});
  if(String(user.role||'').toLowerCase()==='admin')return src;
  const allowed=allowedReports(user),sections=src.sections&&typeof src.sections==='object'?src.sections:{},manual=src.manualSheets&&typeof src.manualSheets==='object'?src.manualSheets:{},nextS={},nextM={};
  allowed.forEach(id=>{if(sections[id])nextS[id]=sections[id];if(manual[id])nextM[id]=manual[id];});
  src.sections=nextS;src.manualSheets=nextM;
  if(!allowed.includes(String(src.activeType||'')))src.activeType=allowed[0]||'it';
  const section=nextS[src.activeType];src.slides=section&&Array.isArray(section.slides)?clone(section.slides):[];
  src.activeSlide=0;src.draft=src.slides.length?clone(src.slides[0]):{groups:[]};src.activeView=0;return src;
}
function mergeStateForUser(existing,incoming,user){
  if(String(user.role||'').toLowerCase()==='admin')return clone(incoming);
  const out=clone(existing||{}),allowed=allowedReports(user),outS=out.sections&&typeof out.sections==='object'?out.sections:{},outM=out.manualSheets&&typeof out.manualSheets==='object'?out.manualSheets:{},inS=incoming.sections&&typeof incoming.sections==='object'?incoming.sections:{},inM=incoming.manualSheets&&typeof incoming.manualSheets==='object'?incoming.manualSheets:{};
  allowed.forEach(id=>{if(inS[id])outS[id]=clone(inS[id]);if(inM[id])outM[id]=clone(inM[id]);});
  out.sections=outS;out.manualSheets=outM;
  if(hasPermission(user,'cover.edit')&&incoming.cover)out.cover=clone(incoming.cover);
  if(hasPermission(user,'cover.edit')&&incoming.coverTarget)out.coverTarget=incoming.coverTarget;
  const active=allowed.includes(String(incoming.activeType||''))?String(incoming.activeType):(allowed[0]||String(out.activeType||'it'));
  out.activeType=active;const section=outS[active];out.slides=section&&Array.isArray(section.slides)?clone(section.slides):[];out.activeSlide=0;out.draft=out.slides.length?clone(out.slides[0]):{groups:[]};out.activeView=0;return out;
}
async function readWorkspace(){
  const q=await pool.query('SELECT state_json,version,updated_at FROM report_workspaces WHERE workspace_key=$1 LIMIT 1',[WORKSPACE_KEY]);
  if(!q.rows.length)return {exists:false,state:null,version:0,updatedAt:null};
  const r=q.rows[0];return {exists:true,state:r.state_json,version:Number(r.version||0),updatedAt:r.updated_at};
}
async function writeWorkspace(state,userId){
  const q=await pool.query(`
    INSERT INTO report_workspaces(workspace_key,name,state_json,version,updated_by,updated_at)
    VALUES($1,'BSM Report Gudang',$2::jsonb,1,$3,NOW())
    ON CONFLICT(workspace_key) DO UPDATE SET state_json=EXCLUDED.state_json,version=report_workspaces.version+1,updated_by=EXCLUDED.updated_by,updated_at=NOW()
    RETURNING version,updated_at
  `,[WORKSPACE_KEY,JSON.stringify(state||{}),userId||null]);
  return {version:Number(q.rows[0].version),updatedAt:q.rows[0].updated_at};
}

module.exports=async function handler(req,res){
  try{
    await ensureSchema();
    await ensureBootstrapAdmin();
    const op=String(req.query&&req.query.op||'health');
    const method=String(req.method||'GET').toUpperCase();
    const body=bodyObject(req.body);

    if(op==='health'&&method==='GET'){
      const users=await pool.query('SELECT COUNT(*)::int AS n FROM app_users');
      const db=await pool.query('SELECT NOW() AS now');
      return send(res,200,{ok:true,configured:true,database:true,adminConfigured:users.rows[0].n>0,provider:'PostgreSQL',now:db.rows[0].now});
    }
    if(op==='bootstrap-user')return send(res,404,{ok:false,error:'Pembuatan akun tidak tersedia dari halaman login'});
    if(op==='login'&&method==='POST'){
      const username=cleanUsername(body.username),password=String(body.password||'');
      const q=await pool.query('SELECT * FROM app_users WHERE username=$1 LIMIT 1',[username]),user=q.rows[0];
      if(!user||user.is_active===false||!verifyPassword(password,user.password_hash))return send(res,401,{ok:false,error:'Username atau password salah'});
      const token=await createSession(user.id);await audit(user.id,'login',{});
      return send(res,200,{ok:true,token,user:publicUser(user)});
    }

    const auth=await authenticate(req);
    if(!auth)return send(res,401,{ok:false,error:'Sesi login tidak valid atau sudah habis'});

    if(op==='me'&&method==='GET')return send(res,200,{ok:true,user:publicUser(auth)});
    if(op==='logout'&&method==='POST'){await pool.query('DELETE FROM app_sessions WHERE id=$1',[auth.session_id]);await audit(auth.id,'logout',{});return send(res,200,{ok:true});}
    if(op==='change-password'&&method==='POST'){
      const current=String(body.currentPassword||''),next=String(body.newPassword||'');
      if(next.length<10)return send(res,400,{ok:false,error:'Password baru minimal 10 karakter'});
      if(!verifyPassword(current,auth.password_hash))return send(res,400,{ok:false,error:'Password lama salah'});
      await pool.query('UPDATE app_users SET password_hash=$1,must_change_password=FALSE,updated_at=NOW() WHERE id=$2',[makePasswordHash(next),auth.id]);
      await pool.query('DELETE FROM app_sessions WHERE user_id=$1',[auth.id]);const token=await createSession(auth.id);await audit(auth.id,'change_password',{});
      return send(res,200,{ok:true,token});
    }
    if(op==='state'&&method==='GET'){
      if(!hasPermission(auth,'data.read'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const ws=await readWorkspace();return send(res,200,ws.exists?{...ws,state:filterStateForUser(ws.state||{},auth)}:ws);
    }
    if(op==='state'&&method==='PUT'){
      if(!hasPermission(auth,'data.write'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      if(!body.state||typeof body.state!=='object'||Array.isArray(body.state))return send(res,400,{ok:false,error:'State report tidak valid'});
      const current=await readWorkspace(),merged=mergeStateForUser(current.state||{},body.state,auth),result=await writeWorkspace(merged,auth.id);
      return send(res,200,{ok:true,...result});
    }
    if(op==='clear'&&method==='POST'){
      if(!hasPermission(auth,'data.clear'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const result=await writeWorkspace(body.state&&typeof body.state==='object'?body.state:{},auth.id);await audit(auth.id,'clear_state',{});
      return send(res,200,{ok:true,...result});
    }
    if(op==='users'&&method==='GET'){
      if(!hasPermission(auth,'accounts.manage'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const q=await pool.query('SELECT * FROM app_users ORDER BY created_at ASC');return send(res,200,{ok:true,users:q.rows.map(publicUser)});
    }
    if(op==='users'&&method==='POST'){
      if(!hasPermission(auth,'accounts.manage'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const username=cleanUsername(body.username),display=String(body.displayName||'').trim(),password=String(body.password||''),role=cleanRole(body.role),permissions=role==='admin'?['*']:normalizePermissions(body.permissions);
      if(!validUsername(username))return send(res,400,{ok:false,error:'Username tidak valid'});
      if(!display)return send(res,400,{ok:false,error:'Nama akun wajib diisi'});
      if(password.length<10)return send(res,400,{ok:false,error:'Password minimal 10 karakter'});
      const exists=await pool.query('SELECT id FROM app_users WHERE username=$1 LIMIT 1',[username]);if(exists.rows.length)return send(res,409,{ok:false,error:'Username sudah digunakan'});
      const q=await pool.query('INSERT INTO app_users(username,display_name,password_hash,role,permissions,must_change_password,is_active) VALUES($1,$2,$3,$4,$5::jsonb,TRUE,$6) RETURNING *',[username,display,makePasswordHash(password),role,JSON.stringify(permissions),body.isActive!==false]);
      await audit(auth.id,'create_user',{targetUserId:q.rows[0].id,username,role});return send(res,201,{ok:true,user:publicUser(q.rows[0])});
    }
    if(op==='users'&&method==='PUT'){
      if(!hasPermission(auth,'accounts.manage'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const id=String(body.id||'');if(!id)return send(res,400,{ok:false,error:'ID akun tidak valid'});
      const f=await pool.query('SELECT * FROM app_users WHERE id=$1 LIMIT 1',[id]);if(!f.rows.length)return send(res,404,{ok:false,error:'Akun tidak ditemukan'});
      const cur=f.rows[0],self=String(cur.id)===String(auth.id),username=cleanUsername(body.username==null?cur.username:body.username),display=String(body.displayName==null?cur.display_name:body.displayName).trim(),role=self?'admin':cleanRole(body.role==null?cur.role:body.role),permissions=role==='admin'?['*']:normalizePermissions(body.permissions==null?cur.permissions:body.permissions),active=self?true:body.isActive!==false,password=String(body.password||'');
      if(!validUsername(username))return send(res,400,{ok:false,error:'Username tidak valid'});
      if(!display)return send(res,400,{ok:false,error:'Nama akun wajib diisi'});
      if(password&&password.length<10)return send(res,400,{ok:false,error:'Password baru minimal 10 karakter'});
      const collision=await pool.query('SELECT id FROM app_users WHERE username=$1 AND id<>$2 LIMIT 1',[username,id]);if(collision.rows.length)return send(res,409,{ok:false,error:'Username sudah digunakan'});
      const q=await pool.query('UPDATE app_users SET username=$1,display_name=$2,role=$3,permissions=$4::jsonb,is_active=$5,password_hash=$6,must_change_password=$7,updated_at=NOW() WHERE id=$8 RETURNING *',[username,display,role,JSON.stringify(permissions),active,password?makePasswordHash(password):cur.password_hash,password?true:cur.must_change_password,id]);
      if(password)await pool.query('DELETE FROM app_sessions WHERE user_id=$1',[id]);await audit(auth.id,'update_user',{targetUserId:id,username,role,isActive:active});
      return send(res,200,{ok:true,user:publicUser(q.rows[0])});
    }
    if(op==='users'&&method==='DELETE'){
      if(!hasPermission(auth,'accounts.manage'))return send(res,403,{ok:false,error:'Akses tidak diizinkan'});
      const id=String(body.id||req.query&&req.query.id||'');if(!id)return send(res,400,{ok:false,error:'ID akun tidak valid'});
      if(id===String(auth.id))return send(res,400,{ok:false,error:'Akun yang sedang dipakai tidak dapat dihapus'});
      const f=await pool.query('SELECT * FROM app_users WHERE id=$1 LIMIT 1',[id]);if(!f.rows.length)return send(res,404,{ok:false,error:'Akun tidak ditemukan'});
      if(String(f.rows[0].role).toLowerCase()==='admin'){const q=await pool.query("SELECT COUNT(*)::int AS n FROM app_users WHERE role='admin' AND is_active=TRUE");if(q.rows[0].n<=1)return send(res,400,{ok:false,error:'Minimal satu akun admin harus tetap aktif'});}
      await pool.query('DELETE FROM app_users WHERE id=$1',[id]);await audit(auth.id,'delete_user',{targetUserId:id,username:f.rows[0].username});return send(res,200,{ok:true});
    }
    return send(res,404,{ok:false,error:'Endpoint tidak ditemukan'});
  }catch(err){
    console.error('report-app sql error',err&&err.message?err.message:err);
    return send(res,Number(err&&err.status||500),{ok:false,error:err&&err.message?err.message:'Database SQL tidak dapat dihubungi'});
  }
};