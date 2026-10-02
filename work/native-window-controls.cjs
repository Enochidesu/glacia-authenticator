'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.5.0/resources/app');
const profile=path.join(__dirname,'controls-native-'+Date.now()),resultFile=path.join(__dirname,'native-window-controls-result.json');
process.env.WINTERBELL_DATA_DIR=profile;fs.mkdirSync(profile,{recursive:true});
const handlers=new Map(),errors=[],checks=[],actions=[];let main,closeRequested=false,finished=false;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,checks,actions,rendererErrors:errors,syntheticProfile:true},null,2));if(!ok)electron.app.exit(1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title==='Glacia Authenticator')main=this;}},ipcMain:{handle:(name,fn)=>{const tracked=(event,arg)=>{if(name==='winterbell:windowAction')actions.push(arg?.action);return fn(event,arg);};handlers.set(name,tracked);electron.ipcMain.handle(name,tracked);}}};return load.apply(this,arguments);};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code);
async function wait(predicate){for(let i=0;i<300;i++){if(await predicate())return;await pause(20);}throw Error('Window controls did not reach expected state.');}
const raw=(arg,event={sender:main.webContents,senderFrame:main.webContents.mainFrame})=>handlers.get('winterbell:windowAction')(event,arg);
async function point(action){return js(`(()=>{const r=document.querySelector('[data-window-action="${action}"]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);}
async function hover(action){const p=await point(action);main.webContents.sendInputEvent({type:'mouseMove',...p});await pause(180);}
async function click(action){await wait(async()=>{const [width,height]=main.getContentSize();return js(`innerWidth===${width}&&innerHeight===${height}`);});await pause(450);const p=await point(action);main.webContents.sendInputEvent({type:'mouseMove',...p});main.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});main.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());main.show();main.focus();await pause(200);
 assert((await handlers.get('winterbell:status')({sender:main.webContents,senderFrame:main.webContents.mainFrame})).data.locked);
 for(const dark of [false,true]){
  if(dark){await js("document.querySelector('#wb-theme').click()");await wait(()=>js("document.querySelector('#winterbell-ui').dataset.theme==='dark'"));await pause(400);}
  for(const action of ['minimize','maximize','close']){
   await hover(action);
   const expectedBackground=action==='close'?'rgb(196, 43, 50)':dark?'rgb(41, 77, 99)':'rgb(212, 237, 249)';
   await wait(()=>js(`getComputedStyle(document.querySelector('[data-window-action="${action}"]')).backgroundColor==='${expectedBackground}'`));
   const style=await js(`(()=>{const b=document.querySelector('[data-window-action="${action}"]'),s=getComputedStyle(b);return {hover:b.matches(':hover'),background:s.backgroundColor,color:s.color,drag:s.getPropertyValue('-webkit-app-region')}})()`);
   assert(style.hover);assert.equal(style.drag,'no-drag');assert.equal(style.background,action==='close'?'rgb(196, 43, 50)':dark?'rgb(41, 77, 99)':'rgb(212, 237, 249)');if(action==='close')assert.equal(style.color,'rgb(255, 255, 255)');
   fs.writeFileSync(path.join(profile,`${dark?'dark':'light'}-${action}.png`),(await main.webContents.capturePage({x:main.getContentSize()[0]-138,y:0,width:138,height:44})).toPNG());checks.push(`${dark?'dark':'light'} ${action} hover`);
  }
 }
 await click('maximize');await wait(()=>main.isMaximized());await wait(()=>js("document.querySelector('[data-window-action=maximize]').getAttribute('aria-label')==='Restore'"));assert(await js("document.querySelector('[data-window-maximize]').hasAttribute('hidden')&&!document.querySelector('[data-window-restore]').hasAttribute('hidden')"));
 await click('maximize');await wait(()=>!main.isMaximized());await wait(()=>js("document.querySelector('[data-window-action=maximize]').getAttribute('aria-label')==='Maximize'"));
 main.maximize();await wait(()=>js("document.querySelector('[data-window-action=maximize]').getAttribute('aria-label')==='Restore'"));main.unmaximize();await wait(()=>js("document.querySelector('[data-window-action=maximize]').getAttribute('aria-label')==='Maximize'"));checks.push('maximize and restore with external state updates');
 await click('minimize');await wait(()=>!main.isVisible());await handlers.get('winterbell:openMainWindow')({sender:main.webContents,senderFrame:main.webContents.mainFrame});await wait(()=>main.isVisible()&&!main.isMinimized());checks.push('minimize to tray and reopen');
 assert.equal((await raw({action:'invalid'})).ok,false);assert.equal((await raw({action:'maximize'},{sender:main.webContents,senderFrame:{}})).ok,false);
 const outsider=new electron.BrowserWindow({show:false});assert.equal((await raw({action:'close'},{sender:outsider.webContents,senderFrame:outsider.webContents.mainFrame})).ok,false);outsider.destroy();checks.push('invalid and untrusted actions rejected');
 await handlers.get('winterbell:preferences')({sender:main.webContents,senderFrame:main.webContents.mainFrame},{closeBehavior:'exit'});assert.equal(errors.length,0);closeRequested=true;await click('close');
 }catch(error){if(main&&!main.isDestroyed()){const diagnosis=await js(`({width:innerWidth,height:innerHeight,active:document.activeElement?.tagName,buttons:[...document.querySelectorAll('[data-window-action]')].map(b=>({action:b.dataset.windowAction,hover:b.matches(':hover'),disabled:b.disabled,rect:b.getBoundingClientRect().toJSON()}))})`);fs.writeFileSync(path.join(profile,'diagnosis.json'),JSON.stringify(diagnosis,null,2));fs.writeFileSync(path.join(profile,'failure.png'),(await main.webContents.capturePage()).toPNG());}finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
electron.app.on('will-quit',()=>{if(!closeRequested)return finish(false,'Unexpected quit');checks.push('close button quits the app');finish(true);});
setTimeout(()=>finish(false,'Window controls native test timed out'),25000).unref();require(path.join(appDir,'main.cjs'));test();
