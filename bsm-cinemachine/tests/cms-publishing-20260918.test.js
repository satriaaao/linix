const assert=require('node:assert/strict');
const lib=require('../cms-publishing-20260918.js');

const state={
  customProducts:[{id:'c1',name:'Custom',active:true}],
  productOverrides:{b1:{active:true}},
  mainCategories:[],subCategories:[],brands:[],productLabels:[],
  banners:[{id:'bn1',title:'Banner',active:true}],
  navigation:[{id:'home',enabled:true}],
  footer:{columns:[{title:'A',active:true}]}
};
let saved=0;
const store={
  get:()=>state,
  save:async()=>{saved++;return state},
  ensureCategories:()=>{if(!state.mainCategories.some(x=>x.id==='camera'))state.mainCategories.push({id:'camera',name:'Kamera',active:true});if(!state.subCategories.some(x=>x.mainCategory==='camera'))state.subCategories.push({id:'camera-utama',name:'Kamera Utama',mainCategory:'camera',active:true})},
  addBrands:names=>names.forEach((name,i)=>{if(!state.brands.some(b=>b.name===name))state.brands.push({id:name.toLowerCase(),name,active:true,sort:i})}),
  ensureProductLabels:()=>{if(!state.productLabels.some(x=>x.name==='PROMO'))state.productLabels.push({id:'promo',name:'PROMO',active:true})}
};

(async()=>{
  const p=lib.create(store);
  assert.equal(p.isProductActive('c1'),true);
  p.toggleProduct('c1');
  assert.equal(state.customProducts[0].active,false);
  p.deleteProduct('c1',new Date('2026-09-18T00:00:00Z'));
  assert.equal(state.customProducts.length,0);
  p.deleteProduct('base1',new Date('2026-09-18T00:00:00Z'));
  assert.equal(state.productOverrides.base1.deleted,true);
  p.toggleCollection('navigation',0);
  assert.equal(state.navigation[0].enabled,false);
  p.deleteCollection('footer',0);
  assert.equal(state.footer.columns.length,0);
  p.patchBannerSchedule(0,{discountPercent:25});
  assert.equal(state.banners[0].discountPercent,25);
  p.syncWebsiteContent([{id:'p1',name:'Sony A',brand:'Sony',category:'camera',price:100}],[{id:'hero',title:'Promo',img:'x.jpg'}]);
  assert.ok(state.customProducts.some(x=>x.id==='p1'));
  assert.ok(state.brands.some(x=>x.name==='Sony'));
  assert.ok(state.banners.some(x=>x.id==='hero'));
  await p.save();
  assert.equal(saved,1);
  console.log('cms-publishing tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
