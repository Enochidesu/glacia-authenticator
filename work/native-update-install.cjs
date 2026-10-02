'use strict';
// Exercises the real NSIS updater against a loopback-only synthetic release.
const {app}=require('electron'),path=require('node:path'),fs=require('node:fs');
const {installDir,profile,feedUrl:url,reportFile}=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
app.setPath('userData',profile);
const {NsisUpdater}=require('./winterbell-app/node_modules/electron-updater');
const {UpdateController}=require('./winterbell-app/updates.cjs');
const adapter={version:'0.5.0',name:'Glacia Authenticator Update Test',isPackaged:true,
 appUpdateConfigPath:path.join(installDir,'resources/app-update.yml'),userDataPath:profile,baseCachePath:path.join(profile,'cache'),
 whenReady:()=>app.whenReady(),quit:()=>app.quit(),relaunch:()=>app.relaunch(),onQuit:fn=>app.once('quit',(_event,code)=>fn(code))};
const engine=new NsisUpdater({provider:'generic',url},adapter);engine.installDirectory=installDir;
engine.httpExecutor=new (require('./winterbell-app/node_modules/electron-updater/out/electronHttpExecutor').ElectronHttpExecutor)();engine.setFeedURL({provider:'generic',url});
const engineErrors=[];engine.on('error',error=>engineErrors.push(error.stack));
const controller=new UpdateController({updater:engine,directory:profile,currentVersion:'0.5.0',supported:true,installSupported:true});
function report(data){fs.writeFileSync(reportFile,JSON.stringify(data));}
process.on('uncaughtException',error=>{report({ok:false,error:error.stack});app.exit(1);});
process.on('unhandledRejection',error=>{report({ok:false,error:error.stack});app.exit(1);});
app.whenReady().then(async()=>{
 try{
  await controller.load();await controller.check();if(controller.status().version!=='0.5.1')throw Error('Synthetic update not detected: '+JSON.stringify({status:controller.status(),engineErrors}));
  await controller.download();if(controller.status().phase!=='ready')throw Error('Verified installer download failed');
  report({ok:true,version:'0.5.1',realNsisUpdater:true,verifiedDownload:true,installRequested:true});
  engine.on('error',error=>{report({ok:false,error:error.message});app.exit(1);});
  await controller.install();
 }catch(error){report({ok:false,error:error.stack});app.exit(1);}
});
setTimeout(()=>{report({ok:false,error:'Real updater timed out'});app.exit(1);},60000).unref();
