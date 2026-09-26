const assert=require('node:assert/strict');
const Store=require('./signage-db-store.js');

assert.equal(Store.configured(),true);
assert.equal(Store.provider,'supabase');
assert.equal(Store.projectRef,'bdutjchphtqtklclbgoz');
console.log('signage Supabase store tests passed');
