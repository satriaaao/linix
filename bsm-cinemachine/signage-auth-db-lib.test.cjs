const assert=require('node:assert/strict');
const A=require('./signage-auth-db-lib.js');

assert.equal(A.isStrongPassword('1234567'),false);
assert.equal(A.isStrongPassword('password123'),true);

const h=A.hashPassword('password123','00112233445566778899aabbccddeeff');
assert.equal(h.salt,'00112233445566778899aabbccddeeff');
assert.ok(h.hash.length>40);
assert.equal(A.verifyPassword('password123',h.hash,h.salt),true);
assert.equal(A.verifyPassword('salah',h.hash,h.salt),false);

const token='abc123-session-token';
assert.equal(A.hashToken(token),A.hashToken(token));
assert.notEqual(A.hashToken(token),A.hashToken('different'));

const cookies=A.parseCookies('foo=bar; signage_session=abc%20123');
assert.equal(cookies.signage_session,'abc 123');

const c=A.sessionCookie('abc',3600);
assert.ok(c.includes('HttpOnly'));
assert.ok(c.includes('Secure'));
assert.ok(c.includes('SameSite=Lax'));
assert.ok(c.includes('Max-Age=3600'));

assert.equal(A.getDatabaseUrl({SIGNAGE_DATABASE_URL:'postgres://a'}),'postgres://a');
assert.equal(A.getDatabaseUrl({DATABASE_URL:'postgres://b'}),'postgres://b');
assert.equal(A.getDatabaseUrl({POSTGRES_URL:'postgres://c'}),'postgres://c');
assert.equal(A.getDatabaseUrl({}),'');
console.log('signage auth/db helper tests passed');