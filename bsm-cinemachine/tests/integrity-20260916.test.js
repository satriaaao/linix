const assert = require('assert');
const lib = require('../rental-integrity-lib-20260916.js');

assert.deepStrictEqual(lib.taxConfig({tax:{enabled:true,rate:12,label:'PPN'}}), {enabled:true,rate:12,label:'PPN'});
assert.deepStrictEqual(lib.taxConfig({tax:{enabled:false,rate:12,label:'PPN'}}), {enabled:false,rate:12,label:'PPN'});
assert.strictEqual(lib.quoteTax(1000000,{tax:{enabled:true,rate:12,label:'PPN'}}),120000);
assert.strictEqual(lib.rentalDays('2026-09-15','2026-09-16'),2);
assert.strictEqual(lib.lineTotal(6500000,1,2),13000000);
assert.strictEqual(lib.cleanPhone('0812-3456-7890'),'6281234567890');
assert.strictEqual(lib.validPhone('0812-3456-7890'),true);
assert.strictEqual(lib.validPhone(''),false);
console.log('integrity tests passed');
