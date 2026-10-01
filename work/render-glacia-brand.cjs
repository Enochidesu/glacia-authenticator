'use strict';
// Run with the project's Electron runtime. Generates original vector brand exports only.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),source=path.join(root,'website/glacia-logo.svg');
 const window=new BrowserWindow({show:false,width:512,height:512,transparent:true,frame:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 await window.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<html><body style="margin:0;background:transparent">'+fs.readFileSync(source,'utf8').replace('viewBox="0 0 96 96"','width="512" height="512" viewBox="0 0 96 96"')+'</body></html>'));
 await new Promise(resolve=>setTimeout(resolve,250));
 const image=await window.webContents.capturePage({x:0,y:0,width:512,height:512});
 const out=path.join(root,'outputs/branding');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'Glacia-Authenticator-512.png'),image.resize({width:512,height:512,quality:'best'}).toPNG());
 fs.writeFileSync(path.join(out,'Glacia-Authenticator-Google-120.png'),image.resize({width:120,height:120,quality:'best'}).toPNG());
 window.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
