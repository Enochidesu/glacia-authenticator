'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createStartupController}=require('../startup.cjs');
const execPath='E:\\Glacia Authenticator\\outputs\\Glacia Authenticator v0.4.3\\Glacia Authenticator.exe',name='Glacia Authenticator';
function fixture(){let entry=null;const calls=[];const app={isPackaged:true,getLoginItemSettings:options=>{assert.deepEqual(options,{path:'"'+execPath+'"',args:[]});return {openAtLogin:false,launchItems:entry?[entry]:[]};},setLoginItemSettings:settings=>{calls.push(settings);entry=settings.openAtLogin?{name:settings.name,path:settings.path,args:settings.args,scope:'user',enabled:settings.enabled}:null;}};return {app,calls,setEntry:value=>entry=value};}
const controller=app=>createStartupController(app,{platform:'win32',execPath});
test('startup registers only the portable Glacia executable for the current user and removes it when off',()=>{
 const f=fixture(),startup=controller(f.app);assert.equal(startup.status().enabled,false);assert.equal(f.calls.length,0);assert.equal(startup.setEnabled(true).enabled,true);assert.deepEqual(f.calls[0],{path:execPath,args:[],name,openAtLogin:true,enabled:true});assert.equal(startup.setEnabled(false).enabled,false);assert.equal(f.calls[1].openAtLogin,false);
});
test('startup follows Windows approval state and ignores other launch entries, paths and arguments',()=>{
 const f=fixture(),startup=controller(f.app),own={name,path:execPath,args:[],scope:'user',enabled:true};
 for(const entry of [{...own,enabled:false},{...own,name:'Other app'},{...own,path:'E:\\Other\\app.exe'},{...own,args:['--other']},{...own,scope:'machine'}]){f.setEntry(entry);assert.equal(startup.status().enabled,false);}
 f.setEntry({...own,path:execPath.toUpperCase()});assert.equal(startup.status().enabled,true);
});
test('invalid values and development or non-Windows runtimes cannot register startup',()=>{
 const f=fixture();for(const value of [undefined,null,'true',1,{}])assert.throws(()=>controller(f.app).setEnabled(value),/Choose whether/);
 for(const options of [{platform:'linux',packaged:true},{platform:'win32',packaged:false}]){const startup=createStartupController(f.app,{...options,execPath});assert.equal(startup.status().available,false);assert.throws(()=>startup.setEnabled(true),/Windows app/);}assert.equal(f.calls.length,0);
});
test('Windows failures are reported instead of showing a successful startup change',()=>{
 const f=fixture();f.app.setLoginItemSettings=()=>{};assert.throws(()=>controller(f.app).setEnabled(true),/Windows did not change/);
 f.app.getLoginItemSettings=()=>{throw Error('Synthetic read failure');};assert.equal(controller(f.app).status().available,false);assert.throws(()=>controller(f.app).setEnabled(true),/could not be read/);
});
