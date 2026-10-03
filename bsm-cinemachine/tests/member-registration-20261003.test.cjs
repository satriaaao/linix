const {chromium}=require('playwright');const fs=require('fs'),http=require('http'),assert=require('assert');
const base=require('path').resolve(__dirname,'..');
const luminance=s=>s.match(/\d+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
const fixture={general:{siteName:'Fixture Camera'},customProducts:[{id:'keep-product',name:'Camera Fixture',price:250000,stock:2,images:['https://example.com/one.jpg','https://example.com/two.jpg']}],appearance:{},footer:{description:'Original description',copyright:'Original copyright',columns:[]}};
let reviewRows=[{id:'test-review',name:'Pelanggan Uji',kind:'review',rating:4,message:'Layanan rental sangat baik.',published:false,created_at:'2026-10-02T00:00:00Z'},{id:'test-feedback',name:'Masukan Uji',kind:'feedback',message:'Tambahkan pilihan peralatan.',published:false,created_at:'2026-10-02T00:00:00Z'}];
let saved=structuredClone(fixture),writes=0,failSave=false;
const server=http.createServer((req,res)=>{
 if(req.url.startsWith('/produk/')){res.setHeader('Content-Type','text/html');return res.end(`<html><head><link rel="stylesheet" href="/product-knowledge-20261002.css"></head><body><main id="app"></main><script>window.P=[];window.RENTCAM_CMS_CONFIG={};function render(){document.getElementById('app').innerHTML='<h1>'+String(P[0]?.name||'Product')+'</h1>'}</script><script src="/product-knowledge-20261002.js"></script><script src="/seo-runtime-20260930.js"></script><script src="/product-preview-20261002.js"></script></body></html>`);}
 if(req.url==='/cms'){res.setHeader('Content-Type','text/html');return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/cms-v5-readable-20260912.css"><link rel="stylesheet" href="/cms-appearance-20260930.css"></head><body><main id="app"></main><script>localStorage.setItem('rentcam_cms_auth',JSON.stringify({access_token:'local-test-only'}));window.P=[{id:"website-camera",name:"Website Camera",brand:"Fixture Brand",cat:"Camera",price:100000,img:"https://example.com/camera.jpg"}];window.SL=[{id:"website-promo",t:"Website Promo",p:"Original promo",img:"https://example.com/banner.jpg"}];window.PORT=[];window.ART=[];</script><script src="/website-design-lib-20260930.js"></script><script src="/cms-config-store-20260918.js"></script><script src="/cms-publishing-20260918.js"></script><script src="/member-registration-config-20261003.js"></script><script src="/cms-admin-all-tables-adapter-20260918.js"></script><script src="/cms-ui-final-20260918.js"></script><script src="/cms-template-publishing-adapter-20260918.js"></script></body></html>`);}
 const file=base+req.url.split('?')[0];if(!file.startsWith(base+'/')||req.url.includes('..')){res.statusCode=404;return res.end();}
 try{res.setHeader('Content-Type',req.url.split('?')[0].endsWith('.css')?'text/css':'application/javascript');res.end(fs.readFileSync(file));}catch(_){res.statusCode=404;res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/cms';
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext();
 await context.route('https://xleceiffuopioeguniwj.supabase.co/**',async route=>{
  const req=route.request();if(req.url().includes('/rest/v1/rentcam_reviews')){if(req.method()==='PATCH'){reviewRows[0].published=JSON.parse(req.postData()).published;return route.fulfill({status:204})}return route.fulfill({contentType:'application/json',body:JSON.stringify(reviewRows)})}if(req.url().includes('/rest/v1/rentcam_order_catalog'))return route.fulfill({contentType:'application/json',body:'[]'});if(!req.url().includes('/rest/v1/rentcam_cms_config'))throw Error('Unexpected network request: '+req.url());
  if(req.method()==='PATCH'){if(failSave)return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'Fixture save error'})});saved=JSON.parse(req.postData()).config;writes++;return route.fulfill({status:204});}
  return route.fulfill({contentType:'application/json',body:JSON.stringify([{config:saved}])});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('[data-field="theme.switchEnabled"]').waitFor();assert.equal(await page.locator('.v5-nav').evaluate(e=>e.firstElementChild.className),'v5-design-menu');assert.equal(await page.locator('.v5-design-menu summary').textContent(),'Pengaturan Web');
 assert.equal(await page.locator('.v5-design-menu').count(),1);assert.equal(await page.locator('.v5-design-menu [data-tpl-nav]').count(),1);
 await page.locator('[data-nav=reviews]').click();await page.locator('[data-review-publish]').waitFor();assert.equal(await page.locator('[data-review-publish]').count(),1);await page.locator('[data-review-publish]').click();await page.getByRole('button',{name:'Sembunyikan',exact:true}).waitFor();assert.equal(reviewRows[0].published,true);await page.getByRole('button',{name:'Sembunyikan',exact:true}).click();await page.getByRole('button',{name:'Tampilkan di Website',exact:true}).waitFor();assert.equal(reviewRows[0].published,false);await page.locator('[data-nav=design-features]').click();

 await page.locator('[data-nav=design-member]').first().click();
 await page.locator('[data-field="memberRegistration.copy.title"]').fill('Gabung Rentalall');
 await page.locator('[data-field="memberRegistration.copy.submitLabel"]').fill('Kirim Data Member');
 await page.locator('[data-field="memberRegistration.sections.2.title"]').fill('Rekomendasi Member');
 await page.locator('[data-field="memberRegistration.fields.8.label"]').fill('Nama pemberi referensi');
 await page.locator('[data-member-field-add]').click();
 const index=10;await page.locator('[data-field="memberRegistration.fields.10.label"]').fill('Jenis produksi');
 await page.locator('[data-field="memberRegistration.fields.10.type"]').selectOption('select');
 await page.locator('[data-field="memberRegistration.fields.10.options"]').fill('Film\nIklan');
 await page.locator('[data-field="memberRegistration.fields.10.required"]').check();
 await page.locator('[data-act=save]').click();await page.waitForFunction(()=>document.querySelector('.v5-dirty')?.hidden===true);
 assert.equal(saved.memberRegistration.copy.title,'Gabung Rentalall');assert.equal(saved.memberRegistration.fields.length,11);
 const newKey=saved.memberRegistration.fields[10].key;
 await page.reload();await page.locator('[data-nav=design-member]').first().click();assert.equal(await page.locator('[data-field="memberRegistration.copy.title"]').inputValue(),'Gabung Rentalall');
 await context.route('**/member-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main><nav class="rc-app-nav"><button data-register-member>Daftar</button></nav><script>window.RENTCAM_CMS_CONFIG=${JSON.stringify(saved)};window.__shared=null;Object.defineProperty(navigator,'canShare',{value:()=>true});Object.defineProperty(navigator,'share',{value:async payload=>{window.__shared=payload}});</script><script src="/member-registration-config-20261003.js"></script><script src="/member-registration-20261002.js"></script></body></html>`}));
 await page.goto(url.replace('/cms','/member-test'));await page.locator('[data-register-member]').click();await page.locator('#rcMemberDialog').waitFor();
 assert.equal(await page.locator('#rcMemberDialog').evaluate(el=>getComputedStyle(el).display),'flex');assert.equal(await page.locator('#rcMemberTitle').textContent(),'Gabung Rentalall');assert.equal(await page.locator('[data-member-summary],.rc-member-summary').count(),0);assert.equal(await page.locator('#rcMemberDialog').getByText('Kontak darurat',{exact:true}).count(),0);assert.equal(await page.locator('#rcMemberDialog').getByText('Rekomendasi Member',{exact:true}).count(),1);
 for(const width of [320,390,1024]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.locator('#rcMemberDialog').evaluate(el=>el.scrollWidth<=el.clientWidth));}
 const values={name:'Pelanggan Uji',phone:'081234567890',nik:'1234567890123456',address:'Alamat Uji',job:'Filmmaker',company:'Studio Uji',email:'test@example.com',social:'@test',referenceName:'Member Uji',referencePhone:'081234567891'};
 for(const [key,value] of Object.entries(values))await page.locator('[name="'+key+'"]').fill(value);
 await page.locator('[name="'+newKey+'"]').selectOption('Film');
 const photo={name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTyQAAAAASUVORK5CYII=','base64')};for(const kind of ['selfie','ktp'])await page.locator('[data-member-upload="'+kind+'"]').setInputFiles(photo);
 await page.locator('#rcMemberDialog [type=submit]').click();await page.waitForFunction(()=>!!window.__shared);const share=await page.evaluate(()=>({text:window.__shared.text,files:window.__shared.files.length}));assert(share.text.includes('Nama pemberi referensi: Member Uji'));assert(share.text.includes('Jenis produksi: Film'));assert(!share.text.includes('Darurat'));assert.equal(share.files,2);
 await page.locator('[data-member-close]').click();await page.locator('[data-register-member]').click();assert.equal(await page.locator('[name=name]').inputValue(),'');assert.equal(await page.locator('.rc-member-photos img').count(),0);
 console.log('PASS: CMS labels, added required dropdown, persistence/reload, reference fields, no summary, mobile layout, message and photos, clean close/reopen');await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
