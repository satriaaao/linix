const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('signage-cms.html','utf8');

assert.ok(html.includes('signage-db-status'),'CMS harus cek status database');
assert.ok(html.includes('signage-setup'),'CMS harus punya first-time password setup');
assert.ok(html.includes('signage-login'),'CMS harus punya login password');
assert.ok(html.includes('signage-config'),'CMS harus simpan playlist ke database');
assert.ok(html.includes('signage-change-password'),'CMS harus bisa ganti password');
assert.ok(html.includes('signage-logout'),'CMS harus bisa logout');
assert.ok(html.includes('type="password"'),'form password harus pakai input password');
assert.ok(html.includes('id="setupUsername"'),'setup harus meminta username');
assert.ok(html.includes('id="loginUsername"'),'login harus meminta username');
assert.ok(html.includes('autocomplete="username"'),'input username harus memakai autocomplete username');
assert.ok(html.includes('username'),'request auth harus mengirim username');
console.log('signage CMS database UI tests passed');
