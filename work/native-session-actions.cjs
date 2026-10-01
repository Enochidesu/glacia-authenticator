'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app'),{GoogleSync,signature}=require(path.join(appDir,'google-sync.cjs'));
const restart=process.argv[2]==='restart',resultFile=path.join(__dirname,restart?'native-session-restart-result.json':'native-session-actions-result.json');
const profileName=restart?JSON.parse(fs.readFileSync(path.join(__dirname,'native-session-actions-result.json'),'utf8')).profileName:'session-native-'+Date.now()+'-'+process.pid;
assert.match(profileName,/^session-native-\d+-\d+$/);process.env.WINTERBELL_DATA_DIR=path.join(__dirname,profileName);
const profile=process.env.WINTERBELL_DATA_DIR,handlers=new Map(),errors=[];let main,cloud,finished=false,signInCalls=0,stall=false,networkStarted;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,profileName,syntheticProfile:true,simulatedGoogle:true,rendererErrors:errors,...(restart?{signedOutAfterRestart:true,localVaultLock:true}:{lockKeepsGoogle:true,passwordUnlock:true,signOutLocksVault:true,clearsSavedSessions:true,signOutDuringSync:true,signOutWhileLocked:true,trustedSenderOnly:true})}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const response=data=>new Response(JSON.stringify(data));
class TestGoogle extends GoogleSync{
 constructor(options){super({...options,fetchImpl:async(input,{signal}={})=>{
  const url=new URL(input);if(stall&&url.pathname==='/drive/v3/files'){networkStarted?.();return new Promise((_resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});}
  if(url.pathname==='/drive/v3/files')return response({files:[]});if(url.pathname==='/upload/drive/v3/files')return response({id:'synthetic-file'});throw Error('Unexpected simulated Google request');
 }});cloud=this;}
 async signIn(){assert(this.config);assert.equal(this.tokens,null);signInCalls++;this.tokens={accessToken:'synthetic-access',refreshToken:'synthetic-refresh',expiresAt:Date.now()+3600000,sub:'synthetic-user',email:'demo@example.invalid',device:crypto.randomUUID()};await this.persist();this.changed();return this.status();}
}
const load=Module._load;Module._load=function(name,parent,isMain){
 if(name==='./google-sync.cjs'&&parent?.filename===path.join(appDir,'main.cjs'))return {GoogleSync:TestGoogle,signature};
 if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title!=='Glacia mini')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}},shell:{...electron.shell,openExternal:async()=>{throw Error('No external browser should open in this test.');}}};
 return load.apply(this,arguments);
};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
const wait=async predicate=>{for(let i=0;i<350;i++){if(await predicate())return;await pause(20);}throw Error('Session UI did not reach expected state.');};
const raw=async(name,arg,sender=main.webContents)=>handlers.get('winterbell:'+name)({sender,senderFrame:sender.mainFrame},arg);
const call=async(name,arg)=>{const result=await raw(name,arg);if(!result.ok)throw Error(result.error);return result.data;};
const savedGoogle=()=>JSON.parse(electron.safeStorage.decryptString(fs.readFileSync(path.join(profile,'google-sync.secure'))));
const vaultBytes=()=>fs.readFileSync(path.join(profile,'vault.winterbell'));
const passwordUnlock=async remember=>{await wait(()=>js("!!document.querySelector('#wb-vault-password')"));await js("document.querySelector('#wb-vault-password').value='123456';document.querySelector('#wb-remember-login').checked="+remember+";document.querySelector('#wb-unlock-real').click()");await wait(async()=>!(await call('status')).locked);await wait(()=>js("document.querySelector('#wb-locked').hidden"));await pause(50);};
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());await wait(()=>js("!!document.querySelector('#wb-locked h2')"));
 if(restart){
  const data=await call('status');assert.equal(data.hasVault,true);assert.equal(data.locked,true);assert.equal(data.rememberedLogin,false);assert.equal(data.cloud.connected,false);assert.equal(data.cloud.configured,true);assert.equal(data.accounts.length,0);assert.equal(savedGoogle().tokens,null);assert.equal(fs.existsSync(path.join(profile,'remembered-login.secure')),false);
  await wait(()=>js("!!document.querySelector('[data-first-google]')&&!document.querySelector('#wb-vault-password')"));
  await js("document.querySelector('[data-local-setup]').click()");await passwordUnlock(false);assert.equal((await call('status')).accounts.length,1);
  await js("document.querySelector('#wb-lock-short').click()");await wait(()=>js("!!document.querySelector('#wb-vault-password')"));assert.equal((await call('status')).locked,true);assert.equal(signInCalls,0);assert.equal(errors.length,0);finish(true);return;
 }
 await cloud.configure(JSON.stringify({installed:{client_id:'1234567890-synthetic.apps.googleusercontent.com',client_secret:'synthetic-secret'}}));await call('cloudSignIn');await call('unlock',{password:'123456',remember:true});await call('add',{name:'Session sample',email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP'});
 await wait(()=>js("document.querySelectorAll('.wb-account').length===1"));const originalVault=vaultBytes(),googleBefore=fs.readFileSync(path.join(profile,'google-sync.secure'));
 assert.equal(await js("document.querySelector('#wb-lock-button').textContent.trim()"),'Sign Out');assert.equal(await js("document.querySelector('#wb-lock-short').getAttribute('aria-label')"),'Lock vault');
 await cloud.enable('Synthetic session sync password');await js("document.querySelector('#wb-lock-short').click()");await wait(()=>js("!!document.querySelector('#wb-vault-password')&&!document.querySelector('#wb-resume-login')"));
 const locked=await call('status');assert.equal(locked.locked,true);assert.equal(locked.rememberedLogin,false);assert.equal(locked.accounts.length,0);assert.equal(locked.cloud.connected,true);assert.equal(locked.cloud.enabled,false);assert.equal(locked.cloud.email,'demo@example.invalid');assert.equal(cloud.passphrase,null);assert.deepEqual(fs.readFileSync(path.join(profile,'google-sync.secure')),googleBefore);assert.equal(fs.existsSync(path.join(profile,'remembered-login.secure')),false);
 assert.equal((await raw('unlock',{password:'wrong password'})).ok,false);await passwordUnlock(true);assert.equal(signInCalls,1);assert.equal((await call('status')).accounts.length,1);
 await js("document.querySelector('#wb-lock-button').click()");await wait(async()=>{const d=await call('status');return d.locked&&!d.cloud.connected&&!d.rememberedLogin;});await wait(()=>js("!!document.querySelector('[data-first-google]')&&!document.querySelector('#wb-vault-password')"));
 assert.equal(savedGoogle().tokens,null);assert.equal(savedGoogle().config.clientId,'1234567890-synthetic.apps.googleusercontent.com');assert.equal(fs.existsSync(path.join(profile,'remembered-login.secure')),false);assert.deepEqual(vaultBytes(),originalVault);assert.equal((await raw('resumeLogin')).ok,false);
 // Sign in again and sign out while the vault is already locked.
 await js("document.querySelector('[data-first-google]').click()");await wait(()=>js("!!document.querySelector('#wb-vault-password')"));assert.equal(signInCalls,2);assert.equal(await js("document.querySelector('#wb-lock-button').disabled"),false);await pause(50);
 await js("document.querySelector('#wb-lock-button').click()");await wait(async()=>(await call('status')).cloud.connected===false);await wait(()=>js("!!document.querySelector('[data-first-google]')"));await pause(50);
 await js("document.querySelector('[data-first-google]').click()");await passwordUnlock(true);
 // The busy renderer route must also sign out while sync is waiting on a request.
 await cloud.enable('Synthetic session sync password');await js("document.querySelector('[data-page=cloud]').click()");await wait(()=>js("!!document.querySelector('[data-cloud-now]')"));
 const started=new Promise(resolve=>networkStarted=resolve);stall=true;await pause(50);await js("document.querySelector('[data-cloud-now]').click()");await started;
 await js("document.querySelector('#wb-lock-button').click()");await wait(async()=>(await call('status')).locked);await wait(async()=>{const d=await call('status');return !d.cloud.connected&&!d.rememberedLogin;});await wait(()=>js("!!document.querySelector('[data-first-google]')"));
 assert.equal(cloud.passphrase,null);assert.equal(cloud.tokens,null);assert.equal(savedGoogle().tokens,null);assert.equal(fs.existsSync(path.join(profile,'remembered-login.secure')),false);assert.deepEqual(vaultBytes(),originalVault);
 const outsider=new electron.BrowserWindow({show:false});assert.equal((await raw('signOut',null,outsider.webContents)).ok,false);outsider.destroy();assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
setTimeout(()=>finish(false,'Session native test timed out'),30000).unref();require(path.join(appDir,'main.cjs'));test();
