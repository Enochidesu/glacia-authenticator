'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app'),resultFile=path.join(__dirname,'native-tray-result.json');
process.env.WINTERBELL_DATA_DIR=path.join(__dirname,'tray-native-'+Date.now());
const handlers=new Map(),errors=[];let main,mini,tray,menu,finished=false,exitRequested=false;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,rendererErrors:errors,syntheticProfile:true,trayMenu:true,oneKeyPanel:true,upwardPicker:true,lockedPanel:true,fullExit:exitRequested}));if(!exitRequested||!ok)electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,
 BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false});this.shown=false;this.skipped=!!options.skipTaskbar;if(options.title==='Glacia mini')mini=this;else main=this;}show(){this.shown=true;}focus(){}hide(){this.shown=false;return super.hide();}setSkipTaskbar(value){this.skipped=value;return super.setSkipTaskbar(value);}},
 Tray:function(icon){tray=new electron.Tray(icon);const set=tray.setContextMenu.bind(tray);tray.setContextMenu=value=>{menu=value;return set(value);};return tray;},
 ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}
 };return load.apply(this,arguments);};
electron.app.on('browser-window-created',(_event,window)=>window.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);}));
const wait=async predicate=>{for(let i=0;i<250;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,20));}throw Error('Tray UI did not reach expected state.');};
const js=code=>mini.webContents.executeJavaScript(code);
// Windows display scaling can round DIP bounds by one pixel.
function assertNear(actual,expected){assert.ok(Math.abs(actual-expected)<=1,`Expected ${actual} to be within one pixel of ${expected}`);}
function assertCorner(workArea){const bounds=mini.getBounds();assertNear(bounds.x+bounds.width,workArea.x+workArea.width-8);assertNear(bounds.y+bounds.height,workArea.y+workArea.height-8);}
const call=async(window,name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:window.webContents,senderFrame:window.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
async function test(){try{
 await wait(()=>main&&tray&&menu);await call(main,'unlock',{password:'123456',remember:false});
 await call(main,'add',{name:'First demo',email:'one@example.invalid',secret:'JBSWY3DPEHPK3PXP'});
 const data=await call(main,'add',{name:'Second demo',email:'two@example.invalid',secret:'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'}),second=data.accounts[1];
 assert.deepEqual(menu.items.map(item=>item.type==='separator'?'separator':item.label),['Open Glacia','Settings','separator','Exit']);
 main.emit('minimize');assert.equal(main.skipped,true);assert.equal(main.shown,false);
 const workArea=electron.screen.getPrimaryDisplay().workArea,offsetIcon={x:workArea.x+40,y:workArea.y+40,width:24,height:24};
 tray.emit('click',{},offsetIcon);await wait(()=>mini&&!mini.webContents.isLoading());
 await wait(()=>js("document.querySelector('#mini-name')?.textContent==='First demo'"));
 assert.equal(mini.shown,true);assert.equal(mini.skipped,true);assert.equal(await js("document.querySelectorAll('#mini-code').length"),1);
 assert.equal(await js("document.querySelectorAll('.mini-account').length"),2);assertNear(mini.getBounds().height,230);
 assertCorner(workArea);const collapsed=mini.getBounds();await js("document.querySelector('#mini-picker').click()");await wait(()=>js("!document.querySelector('#mini-menu').hidden"));
 assertNear(mini.getBounds().height,430);assert.equal(mini.getBounds().y<collapsed.y,true);assertCorner(workArea);
 await js("document.querySelectorAll('.mini-account')[1].click()");await wait(()=>js("document.querySelector('#mini-name').textContent==='Second demo'&&document.querySelector('#mini-menu').hidden"));
 assertNear(mini.getBounds().height,230);assertCorner(workArea);assert.equal((await call(main,'status')).preferences.trayAccountId,second.id);
 assert.equal(await js("document.querySelector('#mini-email').textContent"),'two@example.invalid');
 assert.equal((await handlers.get('winterbell:unlock')({sender:mini.webContents,senderFrame:mini.webContents.mainFrame},{password:'123456'})).ok,false);
 await call(main,'lock');await wait(()=>js("document.querySelector('#mini-code').textContent===''&&document.querySelector('#mini-key').hidden"));
 await js("document.querySelector('#mini-open').click()");await wait(()=>main.shown&&!mini.shown);assert.equal(main.skipped,false);
 await call(main,'unlock',{password:'123456',remember:false});
 menu.items[1].click();await wait(()=>main.webContents.executeJavaScript("document.querySelector('[data-page=settings]').getAttribute('aria-current')==='page'"));
 tray.emit('click',{},tray.getBounds());await wait(()=>mini.shown);await js("document.querySelector('#mini-hide').click()");await wait(()=>!mini.shown);
 assert.equal(errors.length,0);
 electron.app.once('will-quit',()=>{try{assert.equal(tray.isDestroyed(),true);assert.equal(mini===undefined||mini.isDestroyed(),true);finish(true);}catch(error){finish(false,error.stack);}});
 exitRequested=true;menu.items[3].click();
 }catch(error){finish(false,error.stack);}}
setTimeout(()=>finish(false,'Native tray test timed out'),25000).unref();require(path.join(appDir,'main.cjs'));test();

