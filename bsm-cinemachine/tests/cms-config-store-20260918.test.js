const assert=require('node:assert/strict');
const lib=require('../cms-config-store-20260918.js');

const future=new Date(Date.now()+3600000).toISOString();
const merged=lib.merge({general:{name:'A',keep:true},items:[1]},{general:{name:'B'},items:[2]});
assert.equal(merged.general.name,'B');
assert.equal(merged.general.keep,true);
assert.deepEqual(merged.items,[2]);

const cfg={general:{},homepage:{},copy:{},footer:{},productLabels:[]};
lib.applyTemplateTo(cfg,'allRental');
assert.equal(cfg.general.siteName,'Rental All');
assert.ok(cfg.mainCategories.some(x=>x.id==='camera'));
assert.ok(cfg.brands.some(x=>x.name==='ARRI'));
assert.ok(cfg.productLabels.some(x=>x.name==='PROMO'));

const c2={mainCategories:[],subCategories:[],brands:[],productLabels:[]};
lib.ensureAllRentalCategories(c2);
lib.ensureBrands(c2,['ARRI','Sony','ARRI']);
lib.ensureLabels(c2);
assert.ok(c2.mainCategories.some(x=>x.id==='food'));
assert.equal(c2.brands.length,2);
assert.ok(c2.productLabels.some(x=>x.name==='NEW'));

console.log('cms-config-store tests: PASS');
