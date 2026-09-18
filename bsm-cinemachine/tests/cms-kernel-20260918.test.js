const assert=require('node:assert/strict');
const lib=require('../cms-kernel-20260918.js');

assert.equal(lib.validateManifest(lib.MANIFEST),true);
assert.throws(()=>lib.validateManifest([{id:'a',src:'a'},{id:'a',src:'b'}]),/Duplikat/);
assert.throws(()=>lib.validateManifest([{id:'a',src:'a',after:['x']}]),/Dependency/);
assert.throws(()=>lib.validateManifest([{id:'b',src:'b',after:['a']},{id:'a',src:'a'}]),/Urutan/);

const appended=[];
const fakeDocument={
  documentElement:{dataset:{}},
  head:{appendChild(s){appended.push(s.dataset.cmsKernel);Promise.resolve().then(()=>s.onload&&s.onload())}},
  querySelector(){return null},
  createElement(){return {dataset:{},addEventListener(){}};},
  getElementById(){return {innerHTML:''}}
};
const root={document:fakeDocument,location:{pathname:'/cms'},dispatchEvent(){},CustomEvent:function(){}};

(async()=>{
  const kernel=lib.createLoader(root);
  const [a,b]=await Promise.all([kernel.start(),kernel.start()]);
  assert.equal(a.status,'ready');
  assert.equal(b.status,'ready');
  assert.equal(appended.length,lib.MANIFEST.length);
  assert.deepEqual(appended,lib.MANIFEST.map(x=>x.id));
  console.log('cms-kernel tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
