'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const appDir=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app'),resultPath=path.join(__dirname,'native-app-result.json');
process.env.WINTERBELL_DATA_DIR=path.join(__dirname,'native-smoke-'+Date.now());
const handlers=new Map(),errors=[];let finished=false,nativeOptions;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultPath,JSON.stringify({ok,error,rendererErrors:errors,isolatedSyntheticProfile:true,packagedVersion:'0.4.3'}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',error=>finish(false,error.message));process.on('unhandledRejection',error=>finish(false,error.message));
const load=Module._load;
Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){nativeOptions=options;super({...options,show:false});}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}};return load.apply(this,arguments);};
electron.app.on('browser-window-created',(_event,window)=>{
 window.webContents.on('did-fail-load',(_e,code,description)=>finish(false,'Load failed: '+code+' '+description));
 window.webContents.on('render-process-gone',(_e,details)=>finish(false,'Renderer exited: '+details.reason));
 window.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
 window.webContents.once('did-finish-load',async()=>{
  try{const call=async(name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:window.webContents,senderFrame:window.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
   const initial=await call('status');if(initial.hasVault||!initial.locked||initial.cloud.configured)throw Error('Unexpected fresh-profile status');
   if(nativeOptions.titleBarStyle!=='hidden'||nativeOptions.titleBarOverlay!==false)throw Error('Custom titlebar was not enabled');
   const titlebar=await window.webContents.executeJavaScript(`(()=>{const bar=document.querySelector('.wb-titlebar');return {height:bar.getBoundingClientRect().height,drag:getComputedStyle(bar).getPropertyValue('-webkit-app-region'),platform:!!document.querySelector('.wb-platform'),controls:document.querySelectorAll('[data-window-action]').length,noDrag:getComputedStyle(document.querySelector('.wb-window-controls')).getPropertyValue('-webkit-app-region')};})()`);
   if(titlebar.height!==44||titlebar.drag!=='drag'||titlebar.platform||titlebar.controls!==3||titlebar.noDrag!=='no-drag')throw Error('Titlebar layout failed: '+JSON.stringify(titlebar));
   const scrolling=await window.webContents.executeJavaScript(`(async()=>{const bar=document.querySelector('.wb-titlebar'),main=document.querySelector('.wb-main'),content=document.querySelector('.wb-toolbar');const spacer=document.createElement('div');spacer.style.height='1800px';spacer.style.flexShrink='0';main.append(spacer);main.scrollTo(0,0);const start=content.getBoundingClientRect().top;main.scrollTo(0,260);await new Promise(r=>requestAnimationFrame(r));const rect=bar.getBoundingClientRect();const result={start,scroll:main.scrollTop,content:content.getBoundingClientRect().top,headerTop:rect.top,headerHeight:rect.height,headerHit:document.elementFromPoint(300,20)?.closest('.wb-titlebar')===bar,signOutVisible:document.getElementById('wb-lock-button').getBoundingClientRect().bottom<=innerHeight};main.scrollTo(0,0);spacer.remove();return result;})()`);
   if(scrolling.scroll!==260||scrolling.content!==scrolling.start-260||scrolling.headerTop!==0||scrolling.headerHeight!==44||!scrolling.headerHit||!scrolling.signOutVisible)throw Error('Header or sidebar scrolled with content: '+JSON.stringify(scrolling));
   const motion=await window.webContents.executeJavaScript(`(async()=>{await new Promise(r=>setTimeout(r,60));const root=document.getElementById('winterbell-ui'),button=document.getElementById('wb-theme'),sun=document.querySelector('.wb-theme-sun');const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;button.click();await new Promise(r=>setTimeout(r,60));return {theme:root.dataset.theme,iconsStable:sun===document.querySelector('.wb-theme-sun'),reduced,duration:getComputedStyle(root).transitionDuration,animations:root.getAnimations({subtree:true}).length};})()`);
   if(motion.theme!=='dark'||!motion.iconsStable||(!motion.reduced&&!motion.duration.includes('0.32s')))throw Error('Theme toggle transition failed: '+JSON.stringify(motion));
   await new Promise(resolve=>setTimeout(resolve,380));
   const settled=await window.webContents.executeJavaScript(`(()=>{const root=document.getElementById('winterbell-ui');return {color:getComputedStyle(root).backgroundColor,moon:getComputedStyle(document.querySelector('.wb-theme-moon')).opacity,sun:getComputedStyle(document.querySelector('.wb-theme-sun')).opacity};})()`);
   if(settled.color!=='rgb(16, 30, 44)'||settled.moon!=='1'||settled.sun!=='0')throw Error('Theme did not reach dark palette: '+JSON.stringify(settled));
   const password='Native synthetic vault password';await call('unlock',{password});const added=await call('add',{name:'Synthetic native demo',email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP'});if(added.accounts.length!==1||!/^[0-9]{6}$/.test(added.accounts[0].code))throw Error('Native account code failed');
   await call('lock');const reopened=await call('unlock',{password});if(reopened.accounts.length!==1)throw Error('Native vault reopen failed');await call('lock');
   if(errors.length)throw Error('Renderer console errors');finish(true);
  }catch(error){finish(false,error.message);}
 });
});
setTimeout(()=>finish(false,'Native smoke test timed out'),20000).unref();
require(path.join(appDir,'main.cjs'));
