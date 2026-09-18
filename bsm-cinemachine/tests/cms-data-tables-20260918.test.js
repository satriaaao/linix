const assert=require('node:assert/strict');
const lib=require('../cms-data-tables-20260918.js');

assert.equal(lib.TABLES.length,15);
assert.equal(lib.TABLES.some(x=>x.name==='rentcam_admin_sessions'),false);
assert.equal(lib.TABLES.some(x=>x.name==='rentcam_upload_tokens'),false);
assert.match(String(lib.sanitizeCell('customer_token','1234567890')),/…$/);
assert.match(String(lib.sanitizeCell('session_id','abcdefghijklmnop')),/…$/);
const meta=lib.sanitizeCell('meta',{visitor_hash:'12345678901234567890',ip_masked:'36.72.xxx.xxx'});
assert.ok(meta.visitor_hash.length<=13);
assert.deepEqual(lib.columns([{a:1,b:2},{b:3,c:4}]),['a','b','c']);
console.log('cms-data-tables tests: PASS');