const http = require('node:http');
const crypto = require('node:crypto');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL;
const WORKSPACE_KEY = process.env.REPORT_WORKSPACE_KEY || 'bsm-report-gudang';
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || 'https://rentalcamera.aiorbitlab.me,http://localhost:3000,http://localhost:8080')
  .split(',').map(s => s.trim()).filter(Boolean);
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS || 7));
const BODY_LIMIT = 30 * 1024 * 1024;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

function setCors(res, origin) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'Origin');
  }
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'Content-Type, Authorization');
  res.setHeader('access-control-max-age', '600');
}

function json(res, status, payload, origin) {
  setCors(res, origin);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-frame-options', 'DENY');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(Object.assign(new Error('Payload terlalu besar'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (_) {
        reject(Object.assign(new Error('JSON tidak valid'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password), salt, 64);
  return 'scrypt$' + salt.toString('hex') + '$' + derived.toString('hex');
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch (_) {
    return false;
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
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

    CREATE TABLE IF NOT EXISTS app_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      token_hash CHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON app_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_sessions_expires ON app_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS report_workspaces (
      id BIGSERIAL PRIMARY KEY,
      workspace_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT 'BSM Report Gudang',
      state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      version BIGINT NOT NULL DEFAULT 0,
      updated_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS report_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      detail JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_report_audit_created ON report_audit_logs(created_at DESC);
  `);
}

async function ensureBootstrapAdmin() {
  const username = String(process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!password) return;
  const count = await pool.query('SELECT COUNT(*)::int AS n FROM app_users');
  if (count.rows[0].n > 0) return;
  const displayName = String(process.env.ADMIN_DISPLAY_NAME || 'BSM Admin').trim() || 'BSM Admin';
  await pool.query(
    'INSERT INTO app_users (username, display_name, password_hash, role, must_change_password) VALUES ($1,$2,$3,$4,TRUE)',
    [username, displayName, makePasswordHash(password), 'admin']
  );
  console.log('Bootstrap admin created');
}

async function audit(userId, action, detail) {
  try {
    await pool.query(
      'INSERT INTO report_audit_logs (user_id, action, detail) VALUES ($1,$2,$3::jsonb)',
      [userId || null, action, JSON.stringify(detail || {})]
    );
  } catch (_) {}
}

async function authenticate(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const hash = tokenHash(match[1]);
  const result = await pool.query(`
    SELECT s.id AS session_id, u.id, u.username, u.display_name, u.role, u.must_change_password
    FROM app_sessions s
    JOIN app_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.is_active=TRUE
    LIMIT 1
  `, [hash]);
  if (!result.rows.length) return null;
  pool.query('UPDATE app_sessions SET last_seen_at=NOW() WHERE id=$1', [result.rows[0].session_id]).catch(() => {});
  return { ...result.rows[0], tokenHash: hash };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = tokenHash(token);
  await pool.query(
    `INSERT INTO app_sessions (user_id, token_hash, expires_at)
     VALUES ($1,$2,NOW()+($3::text || ' days')::interval)`,
    [userId, hash, String(SESSION_DAYS)]
  );
  return token;
}

const loginAttempts = new Map();
function loginAllowed(ip) {
  const now = Date.now();
  const row = loginAttempts.get(ip) || { start: now, count: 0 };
  if (now - row.start > 10 * 60000) {
    row.start = now;
    row.count = 0;
  }
  row.count += 1;
  loginAttempts.set(ip, row);
  return row.count <= 20;
}

async function handle(req, res) {
  const origin = String(req.headers.origin || '');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json(res, 403, { ok: false, error: 'Origin tidak diizinkan' }, null);
  }
  if (req.method === 'OPTIONS') {
    setCors(res, origin);
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    const check = await pool.query('SELECT NOW() AS now');
    return json(res, 200, { ok: true, service: 'bsm-report-gudang-api', database: true, now: check.rows[0].now }, origin);
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (!loginAllowed(ip)) return json(res, 429, { ok: false, error: 'Terlalu banyak percobaan login. Coba beberapa menit lagi.' }, origin);
    const body = await readBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!username || !password) return json(res, 400, { ok: false, error: 'Username dan password wajib diisi' }, origin);
    const result = await pool.query(
      'SELECT id, username, display_name, password_hash, role, must_change_password, is_active FROM app_users WHERE username=$1 LIMIT 1',
      [username]
    );
    const user = result.rows[0];
    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      await new Promise(r => setTimeout(r, 250));
      return json(res, 401, { ok: false, error: 'Username atau password salah' }, origin);
    }
    const token = await createSession(user.id);
    await audit(user.id, 'login', { ip });
    return json(res, 200, {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        mustChangePassword: user.must_change_password
      }
    }, origin);
  }

  const auth = await authenticate(req);
  if (!auth) return json(res, 401, { ok: false, error: 'Sesi login tidak valid atau sudah habis' }, origin);

  if (req.method === 'GET' && path === '/api/auth/me') {
    return json(res, 200, {
      ok: true,
      user: {
        id: auth.id,
        username: auth.username,
        displayName: auth.display_name,
        role: auth.role,
        mustChangePassword: auth.must_change_password
      }
    }, origin);
  }

  if (req.method === 'POST' && path === '/api/auth/logout') {
    await pool.query('DELETE FROM app_sessions WHERE token_hash=$1', [auth.tokenHash]);
    await audit(auth.id, 'logout', {});
    return json(res, 200, { ok: true }, origin);
  }

  if (req.method === 'POST' && path === '/api/auth/change-password') {
    const body = await readBody(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 10) return json(res, 400, { ok: false, error: 'Password baru minimal 10 karakter' }, origin);
    const result = await pool.query('SELECT password_hash FROM app_users WHERE id=$1', [auth.id]);
    if (!result.rows.length || !verifyPassword(currentPassword, result.rows[0].password_hash)) {
      return json(res, 400, { ok: false, error: 'Password lama salah' }, origin);
    }
    await pool.query(
      'UPDATE app_users SET password_hash=$1, must_change_password=FALSE, updated_at=NOW() WHERE id=$2',
      [makePasswordHash(newPassword), auth.id]
    );
    await audit(auth.id, 'change_password', {});
    return json(res, 200, { ok: true }, origin);
  }

  if (req.method === 'GET' && path === '/api/state') {
    const result = await pool.query(
      'SELECT state_json, version, updated_at FROM report_workspaces WHERE workspace_key=$1 LIMIT 1',
      [WORKSPACE_KEY]
    );
    if (!result.rows.length) {
      return json(res, 200, { ok: true, exists: false, state: null, version: 0, updatedAt: null }, origin);
    }
    const row = result.rows[0];
    return json(res, 200, {
      ok: true,
      exists: true,
      state: row.state_json,
      version: Number(row.version || 0),
      updatedAt: row.updated_at
    }, origin);
  }

  if (req.method === 'PUT' && path === '/api/state') {
    const body = await readBody(req);
    if (!body || typeof body.state !== 'object' || Array.isArray(body.state) || body.state === null) {
      return json(res, 400, { ok: false, error: 'State report tidak valid' }, origin);
    }
    const serialized = JSON.stringify(body.state);
    if (Buffer.byteLength(serialized, 'utf8') > BODY_LIMIT - 1024) {
      return json(res, 413, { ok: false, error: 'Data report terlalu besar' }, origin);
    }
    const result = await pool.query(`
      INSERT INTO report_workspaces (workspace_key, name, state_json, version, updated_by, updated_at)
      VALUES ($1, 'BSM Report Gudang', $2::jsonb, 1, $3, NOW())
      ON CONFLICT (workspace_key) DO UPDATE
      SET state_json=EXCLUDED.state_json,
          version=report_workspaces.version+1,
          updated_by=EXCLUDED.updated_by,
          updated_at=NOW()
      RETURNING version, updated_at
    `, [WORKSPACE_KEY, serialized, auth.id]);
    return json(res, 200, {
      ok: true,
      version: Number(result.rows[0].version),
      updatedAt: result.rows[0].updated_at
    }, origin);
  }

  if (req.method === 'POST' && path === '/api/state/clear') {
    const result = await pool.query(`
      INSERT INTO report_workspaces (workspace_key, name, state_json, version, updated_by, updated_at)
      VALUES ($1, 'BSM Report Gudang', '{}'::jsonb, 1, $2, NOW())
      ON CONFLICT (workspace_key) DO UPDATE
      SET state_json='{}'::jsonb,
          version=report_workspaces.version+1,
          updated_by=EXCLUDED.updated_by,
          updated_at=NOW()
      RETURNING version, updated_at
    `, [WORKSPACE_KEY, auth.id]);
    await audit(auth.id, 'clear_state', {});
    return json(res, 200, { ok: true, version: Number(result.rows[0].version), updatedAt: result.rows[0].updated_at }, origin);
  }

  return json(res, 404, { ok: false, error: 'Endpoint tidak ditemukan' }, origin);
}

async function start() {
  await ensureSchema();
  await pool.query('DELETE FROM app_sessions WHERE expires_at <= NOW()').catch(() => {});
  await ensureBootstrapAdmin();
  const server = http.createServer((req, res) => {
    Promise.resolve(handle(req, res)).catch(err => {
      console.error('request error', err && err.message ? err.message : err);
      if (!res.headersSent) json(res, err.statusCode || 500, { ok: false, error: err.message || 'Server error' }, String(req.headers.origin || ''));
      else res.end();
    });
  });
  server.listen(PORT, '0.0.0.0', () => console.log('BSM Report API listening on ' + PORT));
}

start().catch(err => {
  console.error('startup error', err);
  process.exit(1);
});
