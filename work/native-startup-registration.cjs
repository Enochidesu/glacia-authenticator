'use strict';
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createStartupController}=require(path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/resources/app/startup.cjs'));
const execPath=path.resolve(__dirname,'../outputs/Glacia Authenticator v0.4.3/Glacia Authenticator.exe'),registryName='GlaciaStartupCheck_'+Date.now()+'_'+process.pid,resultFile=path.join(__dirname,'native-startup-registration-result.json');
app.setPath('userData',path.join(__dirname,'startup-native-registration-'+Date.now()));
app.whenReady().then(()=>{
 let error,diagnostic,registered=false,removed=false,unchanged=false;
 const test=createStartupController(app,{execPath,packaged:true,name:registryName}),normal=createStartupController(app,{execPath,packaged:true});const before=normal.status().enabled;
 try{assert.equal(fs.existsSync(execPath),true);assert.equal(test.status().enabled,false);registered=test.setEnabled(true).enabled;assert.equal(registered,true);assert.equal(normal.status().enabled,before);app.setLoginItemSettings({path:execPath,args:[],name:registryName,openAtLogin:true,enabled:false});assert.equal(test.status().enabled,false);assert.equal(test.setEnabled(true).enabled,true);}
 catch(e){error=e.stack;const raw=app.getLoginItemSettings({path:'"'+execPath+'"',args:[]});diagnostic={openAtLogin:raw.openAtLogin,launchItems:raw.launchItems.filter(item=>item.name===registryName)};}
 finally{try{test.setEnabled(false);removed=!app.getLoginItemSettings({path:'"'+execPath+'"',args:[]}).launchItems.some(item=>item.name===registryName);assert.equal(removed,true);unchanged=normal.status().enabled===before;assert.equal(unchanged,true);}catch(e){error=error||e.stack;}}
 fs.writeFileSync(resultFile,JSON.stringify({ok:!error,error,diagnostic,actualWindowsRegistration:true,temporaryEntry:true,registryName,registered,removed,normalEntryUnchanged:unchanged}));app.exit(error?1:0);
});
