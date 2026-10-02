'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const packaged=process.argv.includes('packaged'),mode=process.argv[2]||'start';
const appDir=path.resolve(__dirname,packaged?'../outputs/Glacia Authenticator v0.5.0/resources/app':'winterbell-app');
const {GoogleSync,signature}=require(path.join(appDir,'google-sync.cjs')),core=require(path.join(appDir,'core.cjs'));
const resultFile=path.join(__dirname,'native-sync-'+mode+'-result.json'),first=mode==='start';
const profileName=first?'sync-native-'+Date.now()+'-'+process.pid:JSON.parse(fs.readFileSync(path.join(__dirname,'native-sync-start-result.json'),'utf8')).profileName;
assert.match(profileName,/^sync-native-\d+-\d+$/);const profile=path.join(__dirname,profileName);process.env.WINTERBELL_DATA_DIR=profile;
const driveFile=path.join(profile,'synthetic-drive.json'),files=new Map(first?[]:JSON.parse(fs.readFileSync(driveFile,'utf8')));
const handlers=new Map(),checks=[],errors=[];let main,cloud,finished=false,user=mode==='different-account'?'other-synthetic-user':'synthetic-user',writes=0,listCalls=0,stall=false,networkStarted;
const localPassword='Synthetic local vault password',syncPassword='Synthetic sync resume password';
const response=data=>new Response(typeof data==='string'?data:JSON.stringify(data));
async function fetchImpl(input,options={}){
 if(options.signal?.aborted)throw options.signal.reason;const url=new URL(input);
 if(url.hostname==='oauth2.googleapis.com')return response({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,scope:'openid email https://www.googleapis.com/auth/drive.appdata'});
 if(url.hostname==='openidconnect.googleapis.com')return response({sub:user,email:user+'@example.invalid',email_verified:true});
 if(url.pathname==='/drive/v3/files'){listCalls++;if(mode==='offline')throw Error('Synthetic offline connection');if(stall){networkStarted?.();return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));}return response({files:[...files.values()].filter(file=>file.owner===user).map(({text,owner,...meta})=>meta)});}
 if(url.pathname.startsWith('/drive/v3/files/'))return response(files.get(url.pathname.split('/').pop()).text);
 if(url.pathname==='/upload/drive/v3/files'){const boundary=options.headers['Content-Type'].split('boundary=')[1],parts=options.body.split('--'+boundary),metadata=JSON.parse(parts[1].split('\r\n\r\n')[1].trim()),text=parts[2].split('\r\n\r\n')[1].trim(),id='file'+(files.size+1);files.set(id,{...metadata,owner:user,id,text,size:Buffer.byteLength(text)});}
 else if(url.pathname.startsWith('/upload/drive/v3/files/')){const id=url.pathname.split('/').pop();files.set(id,{...files.get(id),text:options.body,size:Buffer.byteLength(options.body)});}
 else throw Error('Unexpected synthetic request');
 writes++;fs.writeFileSync(driveFile,JSON.stringify([...files]));return response({id:'synthetic-file'});
}
async function openExternal(input){const auth=new URL(input);assert.equal(auth.hostname,'accounts.google.com');const callback=new URL(auth.searchParams.get('redirect_uri'));callback.searchParams.set('state',auth.searchParams.get('state'));callback.searchParams.set('code','synthetic-code');assert.equal((await fetch(callback)).status,200);}
class TestGoogle extends GoogleSync{constructor(options){super({...options,fetchImpl,openExternal});cloud=this;}}
const load=Module._load;Module._load=function(name,parent,isMain){
 if(name==='./google-sync.cjs'&&parent?.filename===path.join(appDir,'main.cjs'))return {GoogleSync:TestGoogle,signature};
 if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title==='Glacia Authenticator')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};
 return load.apply(this,arguments);
};
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,mode,profileName,checks,rendererErrors:errors,syntheticProfile:true,simulatedGoogle:true,packaged},null,2));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
async function wait(predicate){for(let i=0;i<450;i++){if(await predicate())return;await pause(20);}throw Error('Sync resume state was not reached.');}
async function raw(name,arg){return handlers.get('winterbell:'+name)({sender:main.webContents,senderFrame:main.webContents.mainFrame},arg);}
async function call(name,arg){const result=await raw(name,arg);if(!result.ok)throw Error(result.error);return result.data;}
const signIn=async()=>{await call('cloudSignIn');await cloud.authTask;assert.equal(cloud.status().connected,true,cloud.status().error);};
const unlock=()=>call('unlock',{password:localPassword,remember:true});
const enable=()=>call('cloudEnable',{password:localPassword,legacyPassword:syncPassword});
const stored=()=>JSON.parse(electron.safeStorage.decryptString(fs.readFileSync(path.join(profile,'google-sync.secure'))));
async function uiSync(){await wait(()=>js("document.querySelector('#wb-locked').hidden"));await js("document.querySelector('[data-page=cloud]').click()");await wait(()=>js("!!document.querySelector('.wb-cloud-card h2')"));}
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());
 if(first){
  await cloud.configure(JSON.stringify({installed:{client_id:'1234567890-synthetic.apps.googleusercontent.com',client_secret:'synthetic-client'}}));await signIn();await unlock();
  await call('add',{name:'Sync sample',email:'sample@example.invalid',secret:'JBSWY3DPEHPK3PXP'});await cloud.newVault('Synthetic remembered vault');await enable();
  assert.equal((await call('status')).cloud.rememberedSync,true);assert.ok(stored().syncUnlock);assert.equal(JSON.stringify(stored()).includes(syncPassword),false);
  await uiSync();assert.equal(await js("document.querySelector('.wb-cloud-card h2').textContent"),'Automatic sync is on');checks.push('Successful Unlock sync saves only a vault-encrypted password inside Windows-protected storage');
  await call('lock');assert.equal(cloud.passphrase,null);assert.equal((await call('status')).cloud.connected,true);assert.equal((await call('status')).cloud.enabled,false);await unlock();assert.equal((await call('status')).cloud.enabled,true);checks.push('Lock clears the in-memory password and Google stays signed in; vault-password unlock resumes sync');
  await call('cloudDisconnect');assert.equal((await call('status')).locked,false);await signIn();assert.equal((await call('status')).cloud.enabled,true);checks.push('Same-account reconnect while the vault is open resumes automatically');
  const previous=stored().syncUnlock;const failed=await raw('cloudEnable',{password:'Incorrect synthetic sync password',confirm:'Incorrect synthetic sync password'});assert.equal(failed.ok,false);assert.deepEqual(stored().syncUnlock,previous);await enable();checks.push('A wrong sync password cannot replace the valid saved password');
  await call('cloudPause');await call('lock');await unlock();assert.equal((await call('status')).cloud.enabled,false);assert.equal((await call('status')).cloud.rememberedSync,false);await enable();
  const started=new Promise(resolve=>networkStarted=resolve);stall=true;const pending=raw('cloudSync');await started;await wait(()=>js("document.getElementById('wb-sync-label').textContent==='Syncing'"));const paused=await call('cloudPause');assert.equal((await pending).ok,false);assert.equal(paused.cloud.rememberedSync,false);assert.equal(cloud.passphrase,null);stall=false;await enable();checks.push('Pause cancels a running sync and clears the saved intent; enabling again restores it');
  const device=cloud.tokens.device,vaultId=cloud.tokens.vaultId;await call('signOut');assert.equal((await call('status')).locked,true);assert.equal(stored().tokens,null);assert.equal(cloud.passphrase,null);assert.equal(fs.existsSync(path.join(profile,'remembered-login.secure')),false);
  await signIn();assert.equal(cloud.tokens.device,device);assert.equal(cloud.tokens.vaultId,vaultId);assert.equal((await call('status')).cloud.enabled,false);await unlock();assert.equal((await call('status')).cloud.enabled,true);checks.push('Sign Out removes authentication and local saved login; same-account sign-in plus vault unlock continues its previous sync');
 }else if(mode==='restart'||mode==='offline'){
  await wait(async()=>{const data=await call('status');return !data.locked&&data.cloud.enabled;});await wait(()=>listCalls>0);const data=await call('status');assert.equal(data.accounts.length,1);assert.equal(data.cloud.rememberedSync,true);await wait(()=>!cloud.syncing&&(mode==='offline'?!!cloud.error:!!cloud.lastSync));await uiSync();await wait(()=>js("document.querySelector('.wb-cloud-card h2').textContent==='Automatic sync is on'"));
  if(mode==='offline'){await wait(()=>!!cloud.error);assert.equal(cloud.status().enabled,true);checks.push('Offline relaunch retains enabled sync and local codes while reporting the connection failure');}
  else {await wait(()=>!!cloud.lastSync);assert.equal(writes,0);checks.push('Real process restart restores the remembered local login and automatically syncs without another password prompt or duplicate upload');}
 }else if(mode==='pause'){
  await wait(async()=>!(await call('status')).locked);await call('cloudPause');assert.equal((await call('status')).cloud.enabled,false);assert.equal(stored().syncUnlock,null);checks.push('Explicit pause persisted with Google still signed in');
 }else if(mode==='paused-restart'){
  await wait(async()=>!(await call('status')).locked);await pause(1700);assert.equal((await call('status')).cloud.enabled,false);assert.equal((await call('status')).cloud.rememberedSync,false);assert.equal(listCalls,0);checks.push('Explicit pause stays paused through a real process restart');
 }else if(mode==='signout'){
  await wait(async()=>!(await call('status')).locked);await enable();await call('signOut');assert.equal(stored().tokens,null);assert.ok(stored().syncUnlock);assert.equal((await call('status')).locked,true);checks.push('Sign Out leaves only the vault-encrypted, identity-bound sync record for a later sign-in');
 }else if(mode==='same-account'){
  assert.equal((await call('status')).locked,true);assert.equal((await call('status')).cloud.connected,false);await signIn();assert.equal((await call('status')).cloud.rememberedSync,true);assert.equal((await call('status')).cloud.enabled,false);await unlock();assert.equal((await call('status')).cloud.enabled,true);await wait(()=>!!cloud.lastSync);await call('signOut');checks.push('Same-account sign-in after an actual signed-out process restart resumes after the vault password');
 }else if(mode==='different-account'){
  const before=fs.readFileSync(driveFile,'utf8');await signIn();await unlock();const data=await call('status');assert.equal(data.cloud.connected,true);assert.equal(data.cloud.rememberedSync,false);assert.equal(data.cloud.enabled,false);assert.equal(data.cloud.vaultId,'legacy');await pause(1700);assert.equal(listCalls,0);assert.equal(writes,0);assert.equal(fs.readFileSync(driveFile,'utf8'),before);await uiSync();assert.ok(await js("!!document.querySelector('[data-cloud-enable]')"));assert.ok(await js("document.querySelector('.wb-cloud-card').textContent.includes('Enter your Glacia password once')"));checks.push('Different-account sign-in starts unconfigured and never inherits the previous accountâ€™s sync password, cloud namespace or uploads');
 }else throw Error('Unknown test mode');
 const badgeLabel=mode==='offline'?'Needs attention':['pause','paused-restart','different-account'].includes(mode)?'Paused':['signout','same-account'].includes(mode)?'Local vault':'Synced';
 await wait(()=>js(`document.getElementById('wb-sync-label').textContent==='${badgeLabel}'`));checks.push('Titlebar sync indicator matches the active session state');
 if(mode==='offline'){await js("Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'));void 0;");await wait(()=>js("document.getElementById('wb-sync-label').textContent==='Offline'"));await js("delete navigator.onLine;window.dispatchEvent(new Event('online'));void 0;");checks.push('Offline browser events update the titlebar badge immediately');}
 assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
setTimeout(()=>finish(false,'Sync resume native test timed out'),40000).unref();require(path.join(appDir,'main.cjs'));test();
