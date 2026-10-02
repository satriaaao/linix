const assert=require('node:assert/strict'),{dates,quote}=require('../rental-pricing-20261002');const items=[{p:{name:'Kamera',price:4000000},q:2}];
let q=quote(items,dates('2026-10-02','2026-10-04'),{enabled:true,rate:11});assert.equal(q.days,3);assert.equal(q.freeDays,1);assert.equal(q.discount,8000000);assert.equal(q.tax,1760000);assert.equal(q.total,17760000);
q=quote(items,['2026-10-02','2026-10-04','2026-10-06']);assert.equal(q.freeDays,0);assert.equal(q.total,24000000);
assert.equal(quote(items,['2026-10-02','2026-10-02']).days,1);assert.equal(quote(items,dates('2026-10-02','2026-10-03')).freeDays,0);assert.deepEqual(dates('2026-10-04','2026-10-02'),[]);assert.equal(quote(items,dates('2026-10-02','2026-10-07')).freeDays,1);console.log('PASS: consecutive dates, separated dates, quantity, tax after discount, duplicates and invalid range');

const promo=[{p:{id:'arri',name:'ARRI ALEXA Mini LF',price:5000000,discountPercent:20},q:2}];
q=quote(promo,['2026-10-03'],{enabled:true,rate:11});assert.equal(q.gross,10000000);assert.equal(q.productDiscount,2000000);assert.equal(q.subtotal,8000000);assert.equal(q.tax,880000);assert.equal(q.total,8880000);
q=quote(promo,dates('2026-10-03','2026-10-05'));assert.equal(q.productDiscount,6000000);assert.equal(q.durationDiscount,8000000);assert.equal(q.subtotal,16000000);
q=quote(promo,['2026-10-03','2026-10-05','2026-10-07']);assert.equal(q.productDiscount,6000000);assert.equal(q.durationDiscount,0);assert.equal(q.subtotal,24000000);
q=quote([{...promo[0],dates:['2026-10-03']},{p:{id:'lens',price:2800000},q:1,dates:dates('2026-10-03','2026-10-08')}],[],{enabled:true,rate:11});assert.equal(q.mixed,true);assert.equal(q.subtotal,22000000);assert.equal(q.tax,2420000);
const {productPrice}=require('../rental-pricing-20261002');assert.equal(productPrice({...promo[0].p,discountStart:'2099-01-01'}).price,5000000);assert.equal(productPrice({...promo[0].p,discountEnd:'2000-01-01'}).price,5000000);assert.equal(productPrice({...promo[0].p,discountPercent:100}).price,0);
console.log('PASS: product promos, duration discount, mixed dates, tax, scheduled and 100% discounts');
