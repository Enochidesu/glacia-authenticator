'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.5.0/resources/app'),{GoogleSync,signature}=require(path.join(appDir,'google-sync.cjs'));
const publicRelease=process.argv[2]==='public',resultFile=path.join(__dirname,publicRelease?'native-google-public-result.json':'native-google-private-result.json');
const profile=path.join(__dirname,'google-release-native-'+Date.now()+'-'+process.pid);process.env.WINTERBELL_DATA_DIR=profile;
const defaultConfig={clientId:'1234567890-synthetic.apps.googleusercontent.com',clientSecret:'synthetic-only'};
const handlers=new Map(),errors=[],checks=[],openedPages=[];let main,cloud,finished=false,fileDialogs=0,signInCalls=0;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,publicRelease,checks,rendererErrors:errors,syntheticProfile:true,simulatedGoogle:true},null,2));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
class TestGoogle extends GoogleSync{constructor(options){super(options);cloud=this;}async authorize(){signInCalls++;assert.deepEqual(this.config,defaultConfig);this.tokens={accessToken:'synthetic-access',refreshToken:'synthetic-refresh',expiresAt:Date.now()+3600000,sub:'synthetic-user',email:'demo@example.invalid',device:crypto.randomUUID()};await this.persist();this.changed();}}
const load=Module._load;Module._load=function(name,parent,isMain){if(parent?.filename===path.join(appDir,'main.cjs')){if(name==='./release-config.cjs')return {loadReleaseConfig:()=>({publicRelease,defaultConfig:publicRelease?defaultConfig:null})};if(name==='./google-sync.cjs')return {GoogleSync:TestGoogle,signature};}if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title==='Glacia Authenticator')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}},dialog:{...electron.dialog,showOpenDialog:async()=>{fileDialogs++;return {canceled:true,filePaths:[]};}},shell:{...electron.shell,openExternal:async url=>{assert.equal(url,'https://enochidesu.github.io/glacia-authenticator/privacy.html');openedPages.push(url);}}};return load.apply(this,arguments);};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
async function wait(predicate){for(let i=0;i<300;i++){if(await predicate())return;await pause(20);}throw Error('Google release UI did not reach expected state.');}
async function raw(name,arg){return handlers.get('winterbell:'+name)({sender:main.webContents,senderFrame:main.webContents.mainFrame},arg);}
async function call(name,arg){const r=await raw(name,arg);if(!r.ok)throw Error(r.error);return r.data;}
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());await wait(()=>js("!!document.querySelector('#wb-locked h2')"));
 assert.equal((await call('status')).cloud.developerSetup,!publicRelease);
 assert(await js("!!document.querySelector('#wb-locked [data-public-page=privacy]')"));
 await js("document.querySelector('#wb-locked [data-public-page=privacy]').click()");await wait(()=>openedPages.length===1);
 for(const input of ['https://evil.invalid','constructor','file:///C:/Windows'])assert.equal((await raw('openPublicPage',{page:input})).ok,false);
 assert.equal((await handlers.get('winterbell:openPublicPage')({sender:main.webContents,senderFrame:{}},{page:'privacy'})).ok,false);
 assert.equal(openedPages.length,1);assert.equal((await call('status')).locked,true);
 checks.push('privacy is accessible while locked; arbitrary URLs and foreign frames are rejected');
 if(publicRelease){assert.equal((await call('status')).cloud.configured,true);assert(await js("!!document.querySelector('[data-first-google]')&&!document.querySelector('[data-first-google-setup]')&&!document.querySelector('[data-cloud-configure]')"));await js("document.querySelector('[data-first-google]').click()");await wait(()=>js("document.querySelectorAll('[data-setup-mode]').length===3"));assert.equal(signInCalls,1);assert.equal(fileDialogs,0);checks.push('fresh public profile signs in without a setup file or picker');}
 await call('unlock',{password:'Synthetic release vault password',remember:false});await wait(()=>js("document.querySelector('#wb-locked').hidden"));await js("document.querySelector('[data-page=cloud]').click()");await wait(()=>js("!!document.querySelector('.wb-cloud-page')"));
 if(publicRelease){assert(await js("!document.querySelector('.wb-google-advanced')&&!document.querySelector('[data-cloud-help]')&&!document.querySelector('[data-cloud-configure]')"));assert.equal(handlers.has('winterbell:cloudConfigure'),false);assert.equal(handlers.has('winterbell:cloudSetup'),false);assert(await js("typeof window.winterbell.cloudConfigure==='undefined'&&typeof window.winterbell.cloudSetup==='undefined'"));assert.equal(fileDialogs,0);await call('cloudDisconnect');await wait(()=>js("!!document.querySelector('[data-cloud-signin]')"));assert(await js("!document.querySelector('[data-cloud-configure]')&&!document.querySelector('.wb-google-advanced')"));checks.push('public sync screen and preload/backend omit developer setup before and after disconnect');}
 else{assert(await js("!document.querySelector('.wb-google-advanced')&&!document.querySelector('[data-cloud-configure]')&&!document.querySelector('[data-cloud-help]')"));await cloud.configure(JSON.stringify({installed:{client_id:defaultConfig.clientId,client_secret:defaultConfig.clientSecret}}));await wait(()=>js("!!document.querySelector('[data-cloud-signin]')"));await js("document.querySelector('[data-cloud-signin]').click()");await wait(async()=>(await call('status')).cloud.connected);assert.equal(signInCalls,1);assert.equal(fileDialogs,0);checks.push('private build also omits developer controls and retains configured sign-in');}
 assert(await js("!document.querySelector('.wb-cloud-page').innerText.match(/OAuth|Google Cloud|setup guide|Advanced setup/i)"));

 await js("document.querySelector('[data-page=settings]').click()");await wait(()=>js("!!document.querySelector('.wb-about-copy [data-public-page=privacy]')"));
 for(const [lang,label] of [['id','Kebijakan privasi'],['ja','プライバシーポリシー'],['en','Privacy policy']]){
  await js("document.querySelector('#wb-language').value="+JSON.stringify(lang)+";document.querySelector('#wb-language').dispatchEvent(new Event('change',{bubbles:true}))");
  await wait(()=>js("document.querySelector('[data-public-page=privacy]').textContent.trim()==="+JSON.stringify(label)));
 }
 checks.push('Settings privacy link updates immediately in all three languages');
 main.showInactive();await pause(150);fs.writeFileSync(path.join(profile,'sync-screen.png'),(await main.webContents.capturePage()).toPNG());assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));setTimeout(()=>finish(false,'Google release native check timed out'),25000).unref();require(path.join(appDir,'main.cjs'));test();
