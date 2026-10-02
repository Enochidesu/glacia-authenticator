'use strict';
const path=require('node:path');const i18n=require('./i18n.js');
function createTrayController({app,Tray,Menu,BrowserWindow,screen,mainWindow,baseDirectory,getLanguage=()=> 'en',onNavigate=()=>{},onExit=()=>app.quit()}){
 let mini=null,expanded=false,anchor=null,closed=false;
 const tray=new Tray(path.join(baseDirectory,'winterbell.ico'));tray.setToolTip('Glacia Authenticator');
 function openMain(page){if(closed||mainWindow.isDestroyed())return;if(mini&&!mini.isDestroyed())mini.hide();mainWindow.setSkipTaskbar(false);if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();if(page)onNavigate(page);}
 function position(){if(!mini||mini.isDestroyed())return;const icon=anchor||tray.getBounds(),point=icon.width>0?{x:icon.x,y:icon.y}:screen.getCursorScreenPoint(),area=screen.getDisplayNearestPoint(point).workArea,width=Math.min(340,area.width-16),height=Math.min(expanded?430:230,area.height-16);mini.setBounds({x:Math.round(area.x+area.width-width-8),y:Math.round(area.y+area.height-height-8),width:Math.round(width),height:Math.round(height)});}
 function resize(open){expanded=open===true;position();}
 async function showMini(bounds){
  if(closed)return;anchor=bounds||tray.getBounds();expanded=false;
  if(!mini||mini.isDestroyed()){
   mini=new BrowserWindow({title:'Glacia mini',width:340,height:230,show:false,frame:false,transparent:true,resizable:false,maximizable:false,minimizable:false,alwaysOnTop:true,skipTaskbar:true,backgroundColor:'#00000000',icon:path.join(baseDirectory,'winterbell.ico'),webPreferences:{preload:path.join(baseDirectory,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,devTools:false}});
   mini.webContents.setWindowOpenHandler(()=>({action:'deny'}));mini.webContents.on('will-navigate',e=>e.preventDefault());mini.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));
   mini.on('blur',()=>{if(mini&&!mini.isDestroyed()){mini.hide();resize(false);}});mini.on('closed',()=>{mini=null;});
   await mini.loadFile(path.join(baseDirectory,'mini.html'));
  }
  if(closed||!mini||mini.isDestroyed())return;position();mini.webContents.send('winterbell:mini-reset');mini.show();mini.focus();
 }
 function hideMain(){hideMini();mainWindow.setSkipTaskbar(true);mainWindow.hide();}
 function hideMini(){if(mini&&!mini.isDestroyed()){mini.hide();resize(false);}}
 mainWindow.on('minimize',()=>{mainWindow.setSkipTaskbar(true);mainWindow.hide();});
 tray.on('click',(_event,bounds)=>{showMini(bounds).catch(()=>openMain());});
 function updateLanguage(){const t=text=>i18n.translate(text,getLanguage());tray.setContextMenu(Menu.buildFromTemplate([{label:t('Open Glacia'),click:()=>openMain()},{label:t('Settings'),click:()=>openMain('settings')},{type:'separator'},{label:t('Exit'),click:onExit}]));}
 updateLanguage();
 return {tray,updateLanguage,openMain,hideMain,hideMini,resize,get miniWindow(){return mini;},broadcast(channel,payload){if(!mainWindow.isDestroyed())mainWindow.webContents.send(channel,payload);if(mini&&!mini.isDestroyed())mini.webContents.send(channel,payload);},dispose(){closed=true;if(mini&&!mini.isDestroyed())mini.destroy();if(!tray.isDestroyed())tray.destroy();}};
}
module.exports={createTrayController};
