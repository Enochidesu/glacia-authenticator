'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),semver=require('semver');
const UPDATE_FEED=Object.freeze({provider:'github',owner:'Enochidesu',repo:'glacia-authenticator',private:false});
const REMINDER_DELAY=24*60*60*1000;

// Only the main process owns update state, download approval, and installation.
class UpdateController {
 constructor({updater,directory,currentVersion,supported,installSupported,onChange=()=>{},beforeInstall=async()=>{},now=Date.now}) {
  this.updater=updater;this.directory=directory;this.file=path.join(directory,'update-preferences.json');
  this.currentVersion=currentVersion;this.supported=!!supported;this.installSupported=!!installSupported;
  this.onChange=onChange;this.beforeInstall=beforeInstall;this.now=now;
  this.settings={autoCheck:true,includePrerelease:false};this.reminder=null;this.started=false;
  this.state={phase:'idle',version:null,percent:0,prompt:false,error:''};this.manual=false;
  this.checking=null;this.downloading=null;this.token=null;this.cancelled=false;this.persistence=Promise.resolve();
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;
  updater.disableWebInstaller=true;updater.disableDifferentialDownload=true;updater.logger=null;
  updater.on('update-available',info=>this.available(info));
  updater.on('update-not-available',()=>this.change({phase:'current',version:null,prompt:false,error:''}));
  updater.on('download-progress',progress=>{if(this.state.phase==='downloading')this.change({percent:Math.max(0,Math.min(100,Math.round(progress.percent||0)))});});
  updater.on('error',error=>{if(!this.cancelled)this.failed(error);});
 }
 status(){return {...this.state,currentVersion:this.currentVersion,supported:this.supported,installSupported:this.installSupported,settings:{...this.settings}};}
 change(next){Object.assign(this.state,next);this.onChange(this.status());return this.status();}
 async load(){
  try {const saved=JSON.parse(await fs.readFile(this.file,'utf8'));this.settings={autoCheck:saved.autoCheck!==false,includePrerelease:saved.includePrerelease===true};
   if(semver.valid(saved.reminder?.version)&&Number.isFinite(saved.reminder.until))this.reminder={version:saved.reminder.version,until:saved.reminder.until};
  } catch{/* Missing or unreadable update preferences must not prevent vault access. */}
  this.configure();return this.status();
 }
 configure(){this.updater.allowPrerelease=this.settings.includePrerelease;this.updater.allowDowngrade=false;}
 persist(){
  const text=JSON.stringify({...this.settings,reminder:this.reminder});
  const job=this.persistence.catch(()=>{}).then(async()=>{await fs.mkdir(this.directory,{recursive:true});await fs.writeFile(this.file+'.tmp',text,{mode:0o600});await fs.rename(this.file+'.tmp',this.file);});
  this.persistence=job;return job;
 }
 async configureSettings(arg){
  if(this.checking||this.downloading||this.state.phase==='installing')throw Error('Wait for the current update operation to finish.');
  if(!arg||!Object.keys(arg).length||Object.keys(arg).some(k=>!['autoCheck','includePrerelease'].includes(k)||typeof arg[k]!=='boolean'))throw Error('Invalid update preference.');
  const previous={...this.settings};Object.assign(this.settings,arg);
  try{await this.persist();}catch(error){this.settings=previous;throw Error('Could not save update preferences.');}
  this.configure();return this.change({phase:'idle',version:null,prompt:false,error:''});
 }
 startup(){if(this.started)return Promise.resolve(this.status());this.started=true;return this.supported&&this.settings.autoCheck?this.check(false):Promise.resolve(this.status());}
 available(info){
  const version=semver.valid(info?.version);
  if(!version||!semver.gt(version,this.currentVersion)||(!this.settings.includePrerelease&&semver.prerelease(version)))return this.change({phase:'current',version:null,prompt:false,error:''});
  const snoozed=this.reminder?.version===version&&this.reminder.until>this.now();
  return this.change({phase:'available',version,percent:0,prompt:this.manual||!snoozed,error:''});
 }
 failed(error){const missing=['ERR_UPDATER_NO_PUBLISHED_VERSIONS','ERR_UPDATER_LATEST_VERSION_NOT_FOUND','ERR_UPDATER_CHANNEL_FILE_NOT_FOUND'].includes(error?.code);
  return this.change({phase:'error',prompt:this.manual||this.state.phase==='downloading'||this.state.phase==='installing',error:missing?'Updates are not available yet. Try again later.':'Could not complete the update. Check your internet connection and try again.'});}
 check(manual=true){
  if(!this.supported)return Promise.resolve(this.change({phase:'unavailable',prompt:manual,error:'Update checks are available in the packaged Windows app.'}));
  if(this.checking){if(manual)this.manual=true;return this.checking;}
  if(this.downloading||['ready','installing'].includes(this.state.phase)){if(manual)this.change({prompt:true});return Promise.resolve(this.status());}
  this.manual=manual;this.configure();this.change({phase:'checking',prompt:false,error:''});
  this.checking=Promise.resolve().then(()=>this.updater.checkForUpdates()).then(result=>{
   this.token=result?.cancellationToken||null;
   if(this.state.phase==='checking')this.change({phase:'current',version:null,prompt:false});
   return this.status();
  }).catch(error=>this.failed(error)).finally(()=>{this.checking=null;});
  return this.checking;
 }
 async dismiss(kind){
  if(!['cancel','later'].includes(kind))throw Error('Invalid update action.');
  if(this.downloading||this.state.phase==='installing')throw Error('Wait for the current update operation to finish.');
  if(kind==='later'&&this.state.version){const old=this.reminder;this.reminder={version:this.state.version,until:this.now()+REMINDER_DELAY};try{await this.persist();}catch{this.reminder=old;throw Error('Could not save update preferences.');}}
  return this.change({prompt:false});
 }
 download(){
  if(this.downloading)return this.downloading;
  if(!this.installSupported)throw Error('Install Glacia with its installer to enable automatic installation.');
  if(this.state.phase!=='available'||!semver.valid(this.state.version)||!semver.gt(this.state.version,this.currentVersion))throw Error('Check for an update before downloading.');
  this.cancelled=false;this.manual=true;this.change({phase:'downloading',percent:0,prompt:true,error:''});
  this.downloading=Promise.resolve().then(()=>this.updater.downloadUpdate(this.token||undefined)).then(()=>{
   if(this.cancelled)return this.change({phase:'available',percent:0,prompt:false});
   return this.change({phase:'ready',percent:100,prompt:true,error:''});
  }).catch(error=>this.cancelled?this.change({phase:'available',percent:0,prompt:false,error:''}):this.failed(error)).finally(()=>{this.downloading=null;});
  return this.downloading;
 }
 cancelDownload(){if(this.state.phase!=='downloading'||!this.token)throw Error('No cancellable update download is running.');this.cancelled=true;this.token.cancel();this.token=null;return this.change({phase:'available',percent:0,prompt:false,error:''});}
 async install(){
  if(!this.installSupported||this.state.phase!=='ready')throw Error('Download the update before installing.');
  this.change({phase:'installing',prompt:true,error:''});
  try{await this.beforeInstall();if(this.state.phase==='installing')this.updater.quitAndInstall(true,true);}catch{this.failed();}
  return this.status();
 }
}
module.exports={UpdateController,UPDATE_FEED,REMINDER_DELAY};
