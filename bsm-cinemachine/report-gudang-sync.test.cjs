const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/report-gudang.html','utf8');
function source(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));}
function context(){
 const c={STORAGE_KEY:"test",cloudReady:true,cloudHydrated:true,cloud:{},hasPermission:()=>true,remoteSaveInFlight:false,remoteSaveQueued:false,remoteSaveFailures:0,remoteDirty:false,remoteReadInFlight:false,remoteSaveTimer:null,remoteReadTimer:null,remoteVersion:1,saveTimer:null,modalHost:{children:[]},document:{activeElement:null,getElementById:()=>({})},dbStatus:{},state:{},sessionStorage:{setItem(){}},localStorage:{setItem(){}},setTimeout(fn,delay){c.timers.push({fn,delay});return 1;},clearTimeout(){},timers:[],setDbConnectedStatus(){},cacheRemoteVersion(version){c.remoteVersion=Math.max(0,Number(version||0)||0);},toast(){},stopRealtimeSync(){},clearCachedCloudUser(){},updateAccountUi(){},showAuthGate(){},Date,Math,Number};
 vm.createContext(c);vm.runInContext(source('      async function persistRemoteState(', '      function scheduleRemoteSave'),c);vm.runInContext(source('      function remoteApplyBlocked(', '      async function initializeCloud('),c);return c;
}
(async()=>{
 let c=context();let guardedWrites=0;c.cloudHydrated=false;c.cloud.saveState=async()=>{guardedWrites++;return {version:2};};await c.persistRemoteState(false,false);assert.equal(guardedWrites,0);c.cloudHydrated=true;c.cloud.saveState=async()=>{throw Object.assign(new Error('offline'),{status:503});};
 await c.persistRemoteState(false,false);assert.equal(c.timers[0].delay,2000);
 await c.persistRemoteState(false,false);assert.equal(c.timers[1].delay,4000);
 c=context();c.cloud.saveState=async()=>{throw Object.assign(new Error('expired'),{status:401});};await c.persistRemoteState(false,false);assert.equal(c.timers.length,0);assert.equal(c.cloudReady,false);
 c=context();let resolve,reads=0;c.cloud.getState=()=>{reads++;return new Promise(r=>resolve=r);};let first=c.syncRemoteStateFast(true);await c.syncRemoteStateFast(true);assert.equal(reads,1);resolve({exists:true,version:1,state:{}});await first;assert.equal(c.remoteReadInFlight,false);
 c=context();c.remoteDirty=true;c.cloud.getState=()=>assert.fail('Must not replace unsaved edits');await c.syncRemoteStateFast(true);assert.equal(c.timers[0].delay,3000);
 c=context();c.cloudHydrated=false;c.cloud.getState=async()=>({exists:true,version:2,state:{cover:{},sections:{it:{}}}});c.state={activeType:'it',activeSlide:0,activeView:2,coverTarget:'master'};c.clone=x=>JSON.parse(JSON.stringify(x));c.window={BSMReportCover:{normalizeCover:x=>x},BSMReportMaster:{normalizeSections:x=>x},BSMReportLiveEdit:{ensure:x=>x||{}}};c.ensureMasterReports=()=>{};c.bindActiveSection=()=>{};c.masterPages=()=>[1,2,3];let renders=0;c.renderAll=()=>renders++;c.showPage=()=>{};c.activeMenu='preview';await c.syncRemoteStateFast(true);assert.equal(c.remoteVersion,2);assert.equal(c.cloudHydrated,true);assert.equal(c.state.activeView,2);assert.equal(renders,1);await c.syncRemoteStateFast(true);assert.equal(renders,1);assert.equal(c.timers.length,0);
 console.log('Sync regression: hydration guard, backoff, auth expiry, concurrent reads, unsaved edits, and no reload passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
