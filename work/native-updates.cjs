'use strict';
// Synthetic Electron UI integration; no production feed, installer or real vault is used.
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const root=path.resolve(__dirname,'..'),appDir=path.join(__dirname,'winterbell-app');
const profile=path.join(__dirname,'updates-native-'+Date.now()+'-'+process.pid);process.env.WINTERBELL_DATA_DIR=profile;
const handlers=new Map(),checks=[],errors=[];let engine,finished=false;
class FakeUpdater extends EventEmitter{
 constructor(){super();engine=this;this.checks=0;this.downloads=0;this.installs=0;this.fail=false;}
 async checkForUpdates(){this.checks++;if(this.fail)throw Error('synthetic offline');this.emit('update-available',{version:'0.5.1'});return {cancellationToken:{cancel:()=>this.reject?.(Error('cancelled'))}};}
 async downloadUpdate(){this.downloads++;return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
 quitAndInstall(){this.installs++;}
}
function finish(ok,error){if(finished)return;finished=true;fs.mkdirSync(path.join(root,'validation'),{recursive:true});fs.writeFileSync(path.join(root,'validation/native-updates.json'),JSON.stringify({ok,error,checks,rendererErrors:errors,syntheticProfile:true}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',error=>finish(false,error.stack));process.on('unhandledRejection',error=>finish(false,error.stack));
const original=Module._load;Module._load=function(name){
 if(name==='electron-updater')return {NsisUpdater:FakeUpdater};
 if(name==='./updates.cjs'){const actual=original.apply(this,arguments);return {...actual,UpdateController:class extends actual.UpdateController{constructor(options){super({...options,currentVersion:'0.5.0',supported:true,installSupported:true});}}};}
 if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false});}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};
 return original.apply(this,arguments);
};
electron.app.on('browser-window-created',(_event,win)=>{
 win.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
 win.webContents.once('did-finish-load',async()=>{
  const js=code=>win.webContents.executeJavaScript(code);
  const wait=async predicate=>{for(let n=0;n<240;n++){if(await predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('Update UI did not reach expected state');};
  const call=async(name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:win.webContents,senderFrame:win.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
  const click=action=>js(`document.querySelector('.wb-update-shade [data-update-action="${action}"]').click()`);
  const title=()=>js("document.getElementById('wb-update-title')?.textContent");
  try{
   await wait(()=>js("!document.querySelector('.wb-update-shade').hidden"));assert.equal(await title(),'A new update is available.');assert.equal((await call('status')).locked,true);assert.equal(engine.checks,1);assert.equal(engine.downloads,0);assert.equal(await js("document.querySelector('.wb-shell').inert"),true);checks.push('fresh startup prompts while locked without downloading');
   await click('cancel');await wait(()=>js("document.querySelector('.wb-update-shade').hidden"));assert.equal(await js("document.querySelector('.wb-shell').inert"),false);checks.push('cancel dismisses for the session');
   const forbidden=await handlers.get('winterbell:updateDownload')({sender:{},senderFrame:{}},{});assert.equal(forbidden.ok,false);checks.push('foreign frames cannot download or install');
   await js("document.querySelector('[data-local-setup]').click()");await wait(()=>js("!!document.getElementById('wb-vault-confirm')"));
   await js("document.getElementById('wb-vault-password').value='Synthetic update vault password';document.getElementById('wb-vault-confirm').value='Synthetic update vault password';document.getElementById('wb-unlock-real').click();");
   await wait(()=>js("document.getElementById('wb-locked').hidden"));await js("document.querySelector('[data-page=settings]').click()");await wait(()=>js("!!document.getElementById('wb-update-settings')"));
   await call('updateCheck');await wait(()=>js("!document.querySelector('.wb-update-shade').hidden"));await click('later');await wait(()=>js("document.querySelector('.wb-update-shade').hidden"));const reminder=JSON.parse(fs.readFileSync(path.join(profile,'update-preferences.json')));assert.equal(reminder.reminder.version,'0.5.1');checks.push('reminder is persisted separately from vault and preferences');
   await js("document.querySelector('#wb-update-settings [data-update-action=check]').click()");await wait(()=>js("!document.querySelector('.wb-update-shade').hidden"));checks.push('manual check overrides reminder');
   await click('download');await wait(()=>engine.downloads===1);await wait(()=>js("!!document.querySelector('[data-update-action=cancelDownload]')"));await js("document.querySelector('[data-update-action=cancelDownload]').focus()");engine.emit('download-progress',{percent:58});await wait(()=>js("document.querySelector('progress')?.value===58"));assert.equal(await js("document.activeElement.dataset.updateAction"),'cancelDownload');checks.push('download progress keeps cancel focus');
   await click('cancelDownload');await wait(()=>js("document.querySelector('.wb-update-shade').hidden"));assert.equal(engine.installs,0);checks.push('cancel download keeps the app and vault running');
   await call('updateCheck');await wait(()=>js("!document.querySelector('.wb-update-shade').hidden"));await click('download');await wait(()=>engine.downloads===2);engine.resolve(['synthetic installer']);await wait(()=>js("!!document.querySelector('[data-update-action=install]')"));assert.equal(engine.installs,0);checks.push('download waits for explicit restart approval');
   for(const [language,expected] of [['id','Pembaruan siap dipasang.'],['ja','更新の準備ができました。']]){await call('preferences',{language});await wait(async()=>await title()===expected);checks.push('update dialog translates immediately to '+language);}
   await call('preferences',{language:'en'});await wait(async()=>await title()==='Your update is ready.');
   await click('cancel');await wait(()=>js("document.querySelector('.wb-update-shade').hidden"));await js("document.getElementById('wb-theme').click()");await wait(()=>js("document.getElementById('winterbell-ui').dataset.theme==='dark'"));await call('updateCheck');await wait(()=>js("!document.querySelector('.wb-update-shade').hidden"));
   assert.equal(await js("getComputedStyle(document.getElementById('wb-update-title')).color"),'rgb(229, 243, 252)');win.showInactive();await new Promise(r=>setTimeout(r,500));fs.mkdirSync(path.join(root,'outputs'),{recursive:true});fs.writeFileSync(path.join(root,'outputs/Glacia-update-ready-dark.png'),(await win.webContents.capturePage()).toPNG());win.hide();
   await click('cancel');await wait(()=>js("document.querySelector('.wb-update-shade').hidden"));await js("document.getElementById('wb-theme').click()");await wait(()=>js("document.getElementById('winterbell-ui').dataset.theme==='light'"));
   await js("document.getElementById('wb-update-settings').scrollIntoView({block:'center'})");win.showInactive();await new Promise(r=>setTimeout(r,600));assert.equal(await js("document.querySelector('.wb-shell').inert"),false);assert.equal(await js("getComputedStyle(document.getElementById('winterbell-ui')).color"),'rgb(24, 53, 75)');fs.writeFileSync(path.join(root,'outputs/Glacia-update-settings-light.png'),(await win.webContents.capturePage()).toPNG());win.hide();
   await call('updateInstall');assert.equal(engine.installs,1);assert.equal((await call('status')).locked,true);checks.push('restart install locks the vault first');
   assert.equal(errors.length,0);finish(true);
  }catch(error){finish(false,error.stack);}
 });
});
setTimeout(()=>finish(false,'Updater native test timed out'),45000).unref();require(path.join(appDir,'main.cjs'));
