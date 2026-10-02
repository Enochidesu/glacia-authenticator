'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.5.0/resources/app'),restart=process.argv[2]==='restart';
const resultFile=path.join(__dirname,restart?'native-auto-lock-restart-result.json':'native-auto-lock-result.json');
const profileName=restart?JSON.parse(fs.readFileSync(path.join(__dirname,'native-auto-lock-result.json'),'utf8')).profileName:'autolock-native-'+Date.now()+'-'+process.pid;
assert.match(profileName,/^autolock-native-\d+-\d+$/);process.env.WINTERBELL_DATA_DIR=path.join(__dirname,profileName);
let now=Date.now(),idleTick,main,finished=false;const handlers=new Map(),errors=[],checks=[];Date.now=()=>now;
const interval=global.setInterval;global.setInterval=(fn,ms,...args)=>{if(ms===5000){idleTick=fn;return {unref(){return this;}};}return interval(fn,ms,...args);};
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,profileName,checks,rendererErrors:errors,syntheticProfile:true,simulatedIdleClock:true},null,2));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title==='Glacia Authenticator')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};return load.apply(this,arguments);};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
async function wait(predicate){for(let i=0;i<300;i++){if(await predicate())return;await pause(20);}throw Error('Automatic lock UI did not reach expected state.');}
async function call(name,arg){const r=await handlers.get('winterbell:'+name)({sender:main.webContents,senderFrame:main.webContents.mainFrame},arg);if(!r.ok)throw Error(r.error);return r.data;}
const unlock=()=>call('unlock',{password:'Synthetic auto lock password',remember:false});
async function settings(){await wait(()=>js("document.querySelector('#wb-locked').hidden"));await js("document.querySelector('[data-page=settings]').click()");await wait(()=>js("!!document.querySelector('#wb-auto-lock')"));}
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading()&&!!idleTick);
 const initial=await call('status');assert.equal(initial.preferences.autoLock,restart?0:5);
 await unlock();await settings();
 if(restart){assert.equal(await js("document.querySelector('#wb-auto-lock').value"),'0');now+=86400000;idleTick();assert.equal((await call('status')).locked,false);checks.push('Never persists across a real process restart');finish(true);return;}
 assert.deepEqual(await js("[...document.querySelector('#wb-auto-lock').options].map(o=>[o.value,o.textContent])"),[['1','After 1 minute'],['5','After 5 minutes'],['15','After 15 minutes'],['0','Never']]);
 await js("var select=document.querySelector('#wb-auto-lock');select.value='0';select.dispatchEvent(new Event('change',{bubbles:true}))");await wait(async()=>(await call('status')).preferences.autoLock===0);
 await wait(()=>{try{return JSON.parse(fs.readFileSync(path.join(process.env.WINTERBELL_DATA_DIR,'preferences.json'),'utf8')).autoLock===0;}catch{return false;}});now+=100*86400000;idleTick();assert.equal((await call('status')).locked,false);checks.push('Never selected and saved; long inactivity stays unlocked');
 for(const minutes of [1,5,15]){await call('touch');await call('preferences',{autoLock:minutes});now+=minutes*60000-1;idleTick();assert.equal((await call('status')).locked,false);now+=2;idleTick();assert.equal((await call('status')).locked,true);await unlock();}checks.push('existing timed lock choices still lock at their thresholds');
 for(const invalid of [undefined,null,false,'',99,'0']){await call('preferences',{autoLock:invalid});assert.equal((await call('status')).preferences.autoLock,15);}checks.push('invalid and absent values do not disable idle locking');
 await call('preferences',{autoLock:0});electron.powerMonitor.emit('lock-screen');assert.equal((await call('status')).locked,true);await unlock();electron.powerMonitor.emit('suspend');assert.equal((await call('status')).locked,true);await unlock();await call('lock');assert.equal((await call('status')).locked,true);checks.push('Windows lock, sleep and manual lock still lock with Never');
 assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
setTimeout(()=>finish(false,'Automatic lock native test timed out'),25000).unref();require(path.join(appDir,'main.cjs'));test();
