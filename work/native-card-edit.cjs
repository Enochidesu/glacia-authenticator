'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app'),resultFile=path.join(__dirname,'native-card-result.json');process.env.WINTERBELL_DATA_DIR=path.join(__dirname,'card-native-'+Date.now());
const handlers=new Map(),errors=[];let finished=false;const realNow=Date.now,base=Math.floor(realNow()/30000)*30000;let clock=base+24000;Date.now=()=>clock;
function finish(ok,error){if(finished)return;finished=true;Date.now=realNow;fs.writeFileSync(resultFile,JSON.stringify({ok,error,rendererErrors:errors,syntheticProfile:true,inlineRename:true,folderMove:true,expiryRollover:true}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.message));process.on('unhandledRejection',e=>finish(false,e.message));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false});}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};return load.apply(this,arguments);};
electron.app.on('browser-window-created',(_event,window)=>{
 window.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
 window.webContents.once('did-finish-load',async()=>{
  const js=code=>window.webContents.executeJavaScript(code),wait=async predicate=>{for(let i=0;i<150;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,20));}throw Error('UI did not reach the expected state.');};
  const call=async(name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:window.webContents,senderFrame:window.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
  try{
   await call('unlock',{password:'123456',remember:false});const added=await call('add',{name:'Synthetic issuer',email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP'}),id=added.accounts[0].id;
   await wait(()=>js("!!document.querySelector('[data-rename]')"));assert.equal(await js("document.querySelector('.wb-brand-name').textContent"),'Glacia');assert.equal(await js("document.querySelector('[data-code]').classList.contains('is-expiring')"),false);
   await js("document.querySelector('[data-rename]').click()");assert.equal(await js("document.activeElement===document.querySelector('[data-name-input]')"),true);assert.equal(await js("document.querySelector('[data-rename]').getAttribute('aria-label').startsWith('Save name')"),true);
   await js("const input=document.querySelector('[data-name-input]');input.value='My renamed account';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-rename]').click();");
   await wait(async()=>!(await js("!!document.querySelector('[data-name-input]')"))&&(await call('status')).accounts[0].name==='My renamed account');assert.equal(await js("document.querySelector('.wb-service-text h3').textContent"),'My renamed account');
   const blank=await handlers.get('winterbell:renameAccount')({sender:window.webContents,senderFrame:window.webContents.mainFrame},{id,name:'   '});assert.equal(blank.ok,false);
   await js("document.querySelector('[data-page=personal]').click()");await js("const folder=document.querySelector('[data-account-folder]');folder.value='work';folder.dispatchEvent(new Event('change',{bubbles:true}));");
   await wait(async()=>((await call('status')).accounts[0].folder==='work')&&!(await js("!!document.querySelector('.wb-account')")));await js("document.querySelector('[data-page=work]').click()");assert.equal(await js("document.querySelector('[data-account-folder]').value"),'work');
   const badFolder=await handlers.get('winterbell:moveAccount')({sender:window.webContents,senderFrame:window.webContents.mainFrame},{id,folder:'other'});assert.equal(badFolder.ok,false);
   clock=base+25000;await wait(()=>js("document.querySelector('[data-code]').classList.contains('is-expiring')"));clock=base+29000;await wait(()=>js("document.querySelector('[data-remaining]').textContent.startsWith('1s')"));assert.equal(await js("document.querySelector('[data-code]').classList.contains('is-expiring')"),true);
   clock=base+30000;await wait(()=>js("!document.querySelector('[data-code]').classList.contains('is-expiring')"));assert.equal((await call('status')).accounts[0].remaining,30);
   await call('lock');const reopened=await call('unlock',{password:'123456',remember:false});assert.equal(reopened.accounts[0].name,'My renamed account');assert.equal(reopened.accounts[0].folder,'work');assert.equal(reopened.accounts[0].id,id);assert.equal(errors.length,0);finish(true);
  }catch(e){finish(false,e.message);}
 });
});setTimeout(()=>finish(false,'Card UI test timed out'),20000).unref();require(path.join(appDir,'main.cjs'));
