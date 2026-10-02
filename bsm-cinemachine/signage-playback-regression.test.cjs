const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const S=require('./signage-lib');
const source=fs.readFileSync('signage-display.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('bootDisplay();','');
function player(videos){
  class Video extends EventTarget{
    constructor(){super();this.dataset={};this.style={};this.classList={add(){},remove(){}};this.currentTime=0;this.readyState=2;this.paused=true;this.ended=false;this.loads=0;this.loop=false}
    setAttribute(){} removeAttribute(){} load(){this.loads++;this.currentTime=0}
    pause(){this.paused=true} play(){this.paused=false;return Promise.resolve()}
  }
  const A=new Video(),B=new Video(),messages=[];
  const config=S.normalizeConfig({folderUrl:'https://drive.google.com/drive/folders/folder123456789',updatedAt:1,videos});
  const context=vm.createContext({window:{BSMSignage:S,parent:{postMessage:m=>messages.push(m)},addEventListener(){}},document:{getElementById:id=>id==='videoA'?A:id==='videoB'?B:{style:{}},addEventListener(){},hidden:false},navigator:{userAgent:'Chrome',onLine:true},location:{hash:'#config',origin:'https://example.test'},localStorage:{setItem(){}},AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,URL,Date,console,fetch:async()=>({ok:true,json:async()=>({ok:true,videos:[{id:'new',title:'New',driveUrl:'https://example.test/new.mp4'}]})})});
  context.window.BSMSignage={...S,decodeConfig:()=>config,load:()=>config};
  vm.runInContext(source,context);
  return {context,A,B,messages,run:code=>vm.runInContext(code,context)};
}
const videos=[{id:'a',driveUrl:'https://example.test/a.mp4'},{id:'b',driveUrl:'https://example.test/b.mp4'}];
test('the next video is paused at its beginning and buffered media survives a full two-video cycle',async()=>{
  const p=player(videos);p.run('start(0)');
  assert.equal(p.B.autoplay,false);assert.equal(p.B.paused,true);assert.equal(p.B.currentTime,0);
  const loads=[p.A.loads,p.B.loads];
  await p.run('activateIndex(1,true)');await p.run('activateIndex(0,true)');
  assert.deepEqual([p.A.loads,p.B.loads],loads);
  assert.equal(p.B.currentTime,0);assert.equal(p.run('swapping'),false);
});
test('folder discoveries enter preview without interrupting the current video and are sent to CMS',async()=>{
  const p=player(videos);p.run('start(0)');p.A.currentTime=0.75;
  await p.run('syncDriveFolder()');
  assert.equal(p.run('list().length'),3);assert.equal(p.A.currentTime,0.75);
  assert.equal(p.run('index'),0);assert.equal(p.messages[0].type,'signage-folder');
  await p.run('syncDriveFolder()');assert.equal(p.run('list().length'),3);
});
test('playlist updates keep playing the same file even when its legacy id changes',()=>{
  const p=player(videos);p.run('start(0)');p.A.currentTime=1.25;
  p.context.next={videos:[{...videos[0],id:'different-id'},videos[1],{id:'c',driveUrl:'https://example.test/c.mp4'}],updatedAt:2};
  p.run('applyRemoteConfig(next)');
  assert.equal(p.A.currentTime,1.25);assert.equal(p.run('active'),p.A);
});
test('a rejected play falls back to the other Drive source without leaving transition locked',async()=>{
  const p=player([{id:'a',driveUrl:'https://example.test/a.mp4'},{id:'b',driveUrl:'https://drive.google.com/file/d/12345678901234567890123/view'}]);
  p.run('start(0)');let attempts=0;
  p.B.play=function(){attempts++;if(attempts===1)return Promise.reject(new Error('source failed'));this.paused=false;return Promise.resolve()};
  await p.run('activateIndex(1,true)');
  assert.equal(attempts,2);assert.equal(p.run('swapping'),false);assert.equal(p.run('active'),p.B);
});
test('one-video playlists loop in the media element',()=>{
  const p=player(videos.slice(0,1));p.run('start(0)');assert.equal(p.A.loop,true);
});
test('a playlist edit cancels a pending transition instead of leaving swapping stuck',async()=>{
  const p=player(videos);p.run('start(0)');p.B.readyState=0;
  const pending=p.run('activateIndex(1,true)');
  p.context.next={videos:[videos[0]],updatedAt:2};p.run('applyRemoteConfig(next)');
  await pending;
  assert.equal(p.run('swapping'),false);assert.equal(p.run('active'),p.A);assert.equal(p.A.loop,true);
});
test('the streaming endpoint rejects a Drive HTML warning instead of pretending it is MP4',async()=>{
  const savedFetch=global.fetch;const handler=require('./api/cms')._streamDriveVideo;
  global.fetch=async()=>new Response('<html>Access denied</html>',{headers:{'content-type':'text/html'}});
  let body;const res={setHeader(){},end(value){body=value}};
  try{
    await handler({method:'GET',headers:{range:'bytes=0-'},query:{id:'12345678901234567890123',name:'video.mp4'}},res);
    assert.equal(res.statusCode,502);assert.equal(JSON.parse(body).ok,false);
  }finally{global.fetch=savedFetch}
});
