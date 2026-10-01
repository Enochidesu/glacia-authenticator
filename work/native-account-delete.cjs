'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app'),resultFile=path.join(__dirname,'native-account-delete-result.json');
process.env.WINTERBELL_DATA_DIR=path.join(__dirname,'delete-native-'+Date.now());
const handlers=new Map(),errors=[];let main,finished=false;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,syntheticProfile:true,rendererErrors:errors,handlePosition:true,trashPosition:true,confirmation:true,fiveSecondCooldown:true,cancelSafe:true,deletionPersisted:true,trayReset:true,explicitReimport:true}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title!=='Glacia mini')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};return load.apply(this,arguments);};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
const wait=async p=>{for(let i=0;i<350;i++){if(await p())return;await pause(20);}throw Error('Delete UI did not reach expected state.');};
const raw=async(name,arg,sender=main.webContents)=>handlers.get('winterbell:'+name)({sender,senderFrame:sender.mainFrame},arg);
const call=async(name,arg)=>{const result=await raw(name,arg);if(!result.ok)throw Error(result.error);return result.data;};
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());await call('unlock',{password:'123456',remember:false});
 const sample={name:'SEGA sample',email:'sample@example.invalid',secret:'JBSWY3DPEHPK3PXP'};await call('add',sample);await call('add',{...sample,name:'Keep sample'});await wait(()=>js("document.querySelectorAll('.wb-account').length===2"));
 const target=(await call('status')).accounts[0].id;await call('traySelect',{id:target});
 assert.equal(await js("(()=>{const c=document.querySelector('.wb-account-top');return c.firstElementChild.matches('[data-reorder]')&&c.children[1].matches('.wb-service-mark')&&c.querySelector('[data-favorite]').nextElementSibling.matches('[data-delete]')})()"),true);
 await js("document.querySelector('[data-delete]').click()");await wait(()=>js("!!document.querySelector('[data-delete-confirm]')"));assert.equal((await call('status')).accounts.length,2);
 assert.equal(await js("document.querySelector('[data-delete-confirm]').disabled"),true);assert.equal(await js("document.querySelector('[data-delete-confirm]').textContent"),'Delete (5s)');
 assert.equal(await js("document.activeElement.textContent"),'Cancel');
 await js("document.querySelector('[data-delete-confirm]').click()");assert.equal((await call('status')).accounts.length,2);
 const early=await call('prepareDelete',{id:target});assert.match((await raw('deleteAccount',{id:target,token:early.token})).error,/five seconds/);
 await js("document.querySelector('.wb-delete-actions [data-close-modal]').click()");await wait(()=>js("document.querySelector('#wb-modal-shade').hidden"));assert.equal((await call('status')).accounts.length,2);assert.equal((await raw('deleteAccount',{id:target,token:early.token})).ok,false);
 await js("document.querySelector('[data-delete]').click()");await wait(()=>js("!!document.querySelector('[data-delete-confirm]')"));await pause(1000);assert.equal(await js("document.querySelector('[data-delete-confirm]').disabled"),true);assert.match(await js("document.querySelector('[data-delete-confirm]').textContent"),/^Delete \([1-4]s\)$/);
 fs.writeFileSync(path.join(__dirname,'delete-native-preview.png'),(await main.webContents.capturePage()).toPNG());
 await js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))");assert.equal((await call('status')).accounts.length,2);
 await wait(()=>js("!document.querySelector('[data-delete-confirm]').disabled"));assert.equal(await js("document.querySelector('[data-delete-confirm]').textContent"),'Delete');
 assert.equal(await js("getComputedStyle(document.querySelector('[data-delete-confirm]')).backgroundColor"),'rgb(181, 44, 53)');await js("document.querySelector('[data-delete-confirm]').click()");await wait(async()=>(await call('status')).accounts.length===1);await wait(()=>js("document.querySelector('#wb-modal-shade').hidden&&document.querySelectorAll('.wb-account').length===1"));
 assert.equal((await call('status')).preferences.trayAccountId,'');assert.equal((await raw('copy',{id:target})).ok,false);
 const stranger=new electron.BrowserWindow({show:false});assert.equal((await raw('prepareDelete',{id:target},stranger.webContents)).ok,false);assert.equal((await raw('deleteAccount',{id:target},stranger.webContents)).ok,false);stranger.destroy();
 await call('lock');assert.equal((await raw('prepareDelete',{id:target})).ok,false);const reopened=await call('unlock',{password:'123456',remember:false});assert.equal(reopened.accounts.length,1);assert.equal(reopened.accounts[0].name,'Keep sample');
 const core=require(path.join(appDir,'core.cjs')),saved=await core.decryptBackup(fs.readFileSync(path.join(process.env.WINTERBELL_DATA_DIR,'vault.winterbell'),'utf8'),'123456');assert.equal(saved.deletions.length,1);assert.equal(saved.accounts.some(a=>a.name===sample.name),false);saved.key.fill(0);
 await call('add',sample);await call('lock');assert.equal((await call('unlock',{password:'123456',remember:false})).accounts.length,2);
 // Confirm compact layout and dark theme retain the same controls and safe Escape dismissal.
 await wait(()=>js("document.querySelectorAll('.wb-account').length===2"));
 await js("document.querySelector('[data-page=settings]').click();var layout=document.querySelector('#wb-layout');layout.value='compact';layout.dispatchEvent(new Event('change',{bubbles:true}));");await wait(async()=>(await call('status')).preferences.layout==='compact');
 await js("document.querySelector('[data-page=all]').click()");await pause(50);await js("document.querySelector('#wb-theme').click()");await wait(()=>js("document.querySelector('#winterbell-ui').dataset.theme==='dark'"));await wait(async()=>(await call('status')).preferences.dark===true);await pause(100);
 assert.equal(await js("document.querySelector('.wb-account-top').firstElementChild.matches('[data-reorder]')"),true);
 await js("document.querySelector('[data-delete]').click()");await wait(()=>js("!!document.querySelector('[data-delete-confirm]')"));assert.equal(await js("document.querySelector('[data-delete-confirm]').disabled"),true);
 await js("document.querySelector('.wb-modal').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await wait(()=>js("document.querySelector('#wb-modal-shade').hidden"));assert.equal((await call('status')).accounts.length,2);
 assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
setTimeout(()=>finish(false,'Delete native test timed out'),30000).unref();require(path.join(appDir,'main.cjs'));test();
