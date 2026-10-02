'use strict';
const path=require('node:path');
function createStartupController(app,{platform=process.platform,execPath=process.execPath,packaged=app.isPackaged,name='Glacia Authenticator'}={}){
 const available=platform==='win32'&&packaged===true&&path.win32.isAbsolute(execPath);
 const options={path:execPath,args:['--startup']};
 // Electron parses the query path as a Windows command line; quote spaces.
 const query={path:'"'+execPath+'"',args:[]};
 const samePath=(left,right)=>typeof left==='string'&&path.win32.normalize(left).toLowerCase()===path.win32.normalize(right).toLowerCase();
 function status(){
  if(!available)return {available:false,enabled:false,message:'Available in the Windows app.'};
  try{
   const settings=app.getLoginItemSettings(query);
   const own=settings.launchItems?.find(item=>item.name===name&&item.scope==='user'&&samePath(item.path,execPath)&&Array.isArray(item.args)&&(item.args.length===0||(item.args.length===1&&item.args[0]==='--startup')));
   return {available:true,enabled:own?.enabled===true,legacy:own?.enabled===true&&own.args.length===0,message:''};
  }catch{return {available:false,enabled:false,message:'Windows startup settings could not be read. Try opening Glacia again.'};}
 }
 function setEnabled(enabled){
  if(typeof enabled!=='boolean')throw Error('Choose whether Glacia should start with Windows.');
  if(!available)throw Error('Startup is available in the Windows app.');
  app.setLoginItemSettings({...options,name,openAtLogin:enabled,enabled});
  const updated=status();if(!updated.available)throw Error(updated.message);
  if(updated.enabled!==enabled)throw Error('Windows did not change this setting. Check Glacia in Windows Startup apps.');
  return updated;
 }
 return {status,setEnabled,upgrade:()=>{if(status().legacy)setEnabled(true);}};
}
module.exports={createStartupController};
