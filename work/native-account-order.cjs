'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.5.0/resources/app'),resultFile=path.join(__dirname,'native-account-order-result.json');
process.env.WINTERBELL_DATA_DIR=path.join(__dirname,'order-native-'+Date.now());
const handlers=new Map(),errors=[];let finished=false,main;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,syntheticProfile:true,rendererErrors:errors,dragReorder:true,filteredOrder:true,keyboardOrder:true,persistedOrder:true}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title!=='Glacia mini')main=this;}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};return load.apply(this,arguments);};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async predicate=>{for(let i=0;i<300;i++){if(await predicate())return;await pause(20);}throw Error('Account order UI did not reach expected state.');};
const js=code=>main.webContents.executeJavaScript(code),call=async(name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:main.webContents,senderFrame:main.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
const names=()=>js("[...document.querySelectorAll('.wb-service-text h3')].map(e=>e.textContent)");
async function test(){try{
 await wait(()=>main&&!main.webContents.isLoading());await wait(()=>js("!!document.querySelector('#wb-locked')"));
 await call('unlock',{password:'Synthetic native vault password',remember:false});
 const labels=['Alpha','Bravo','Charlie','Delta','SEGA test','Foxtrot'];
 for(let i=0;i<labels.length;i++)await call('add',{name:labels[i],email:i+'@example.invalid',secret:'JBSWY3DPEHPK3PXP',folder:i%2?'work':'personal'});
 await wait(()=>js("document.querySelectorAll('.wb-account').length===6"));const original=(await call('status')).accounts,move=original[4].id;
 main.show();main.focus();await pause(150);
 // Move the fifth card onto the beginning of the first card using Chromium input.
 await js("document.querySelector('.wb-main').scrollTo(0,document.querySelector('.wb-account').getBoundingClientRect().top+document.querySelector('.wb-main').scrollTop-120)");
 const points=await js("(()=>{const cards=[...document.querySelectorAll('.wb-account')],source=cards[4].querySelector('[data-reorder]').getBoundingClientRect(),target=cards[0].getBoundingClientRect();return {start:{x:Math.round(source.left+source.width/2),y:Math.round(source.top+source.height/2)},end:{x:Math.round(target.left+20),y:Math.round(target.top+target.height/2)}}})()");
 main.webContents.sendInputEvent({type:'mouseMove',...points.start});main.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...points.start});
 for(let i=1;i<=16;i++){main.webContents.sendInputEvent({type:'mouseMove',button:'left',modifiers:['leftbuttondown'],x:Math.round(points.start.x+(points.end.x-points.start.x)*i/16),y:Math.round(points.start.y+(points.end.y-points.start.y)*i/16)});await pause(20);}
 main.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...points.end});
 await wait(async()=>(await call('status')).accounts[0].id===move);await wait(async()=>(await names())[0]==='SEGA test');
 const ordered=(await call('status')).accounts.map(a=>a.id);assert.deepEqual(ordered,[move,...original.filter(a=>a.id!==move).map(a=>a.id)]);
 fs.writeFileSync(path.join(__dirname,'order-native-preview.png'),(await main.webContents.capturePage()).toPNG());
 // Folder and search views move only the requested account; hidden accounts survive.
 await js("document.querySelector('[data-page=personal]').click()");await wait(async()=>(await names()).length===3);
 await js("document.querySelector('[data-reorder]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',altKey:true,bubbles:true}))");await wait(async()=>(await names())[0]==='Alpha');assert.equal((await call('status')).accounts.length,6);
 await js("document.querySelector('[data-page=all]').click();var search=document.querySelector('#wb-search');search.value='SEGA test';search.dispatchEvent(new Event('input',{bubbles:true}));");await wait(async()=>(await names()).length===1);
 await js("document.querySelector('[data-reorder]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true}))");assert.equal((await call('status')).accounts.length,6);
 await js("var search=document.querySelector('#wb-search');search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-page=settings]').click();var layout=document.querySelector('#wb-layout');layout.value='compact';layout.dispatchEvent(new Event('change',{bubbles:true}));");await wait(async()=>(await call('status')).preferences.layout==='compact');
 await js("document.querySelector('[data-page=all]').click()");await wait(async()=>(await names()).length===6);
 const beforeKeyboard=(await call('status')).accounts.map(a=>a.id);await js("document.querySelector('[data-reorder]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',altKey:true,bubbles:true}))");await wait(async()=>(await call('status')).accounts[1].id===beforeKeyboard[0]);
 // Exercise dragging down in the compact list as well as the two-column cards.
 const compactBefore=(await call('status')).accounts.map(a=>a.id);
 await js("document.querySelector('.wb-main').scrollTo(0,document.querySelector('.wb-account').getBoundingClientRect().top+document.querySelector('.wb-main').scrollTop-120)");
 const compact=await js("(()=>{const cards=[...document.querySelectorAll('.wb-account')],source=cards[0].querySelector('[data-reorder]').getBoundingClientRect(),target=cards[1].getBoundingClientRect();return {start:{x:Math.round(source.left+source.width/2),y:Math.round(source.top+source.height/2)},end:{x:Math.round(target.left+20),y:Math.round(target.bottom-15)}}})()");
 main.webContents.sendInputEvent({type:'mouseMove',...compact.start});main.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...compact.start});
 for(let i=1;i<=12;i++){main.webContents.sendInputEvent({type:'mouseMove',modifiers:['leftbuttondown'],x:Math.round(compact.start.x+(compact.end.x-compact.start.x)*i/12),y:Math.round(compact.start.y+(compact.end.y-compact.start.y)*i/12)});await pause(20);}
 assert.equal(await js("document.querySelector('#wb-account-grid').classList.contains('wb-reorder-vertical')"),true);
 main.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...compact.end});await wait(async()=>(await call('status')).accounts[1].id===compactBefore[0]);
 const untrusted=new electron.BrowserWindow({show:false});const denied=await handlers.get('winterbell:reorderAccounts')({sender:untrusted.webContents,senderFrame:untrusted.webContents.mainFrame},{id:move,targetId:original[0].id});assert.equal(denied.ok,false);untrusted.destroy();
 const saved=(await call('status')).accounts.map(a=>a.id);await call('lock');const locked=await handlers.get('winterbell:reorderAccounts')({sender:main.webContents,senderFrame:main.webContents.mainFrame},{id:move,targetId:original[0].id});assert.equal(locked.ok,false);
 const reopened=await call('unlock',{password:'Synthetic native vault password',remember:false});assert.deepEqual(reopened.accounts.map(a=>a.id),saved);assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
electron.app.on('browser-window-created',(_event,window)=>window.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);}));
setTimeout(()=>finish(false,'Account order native test timed out'),30000).unref();require(path.join(appDir,'main.cjs'));test();
