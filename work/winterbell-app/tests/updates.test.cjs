'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {UpdateController,UPDATE_FEED,REMINDER_DELAY}=require('../updates.cjs');
class FakeUpdater extends EventEmitter {
 constructor(){super();this.checks=0;this.downloads=0;this.installs=0;this.version='0.5.1';this.fail=false;}
 async checkForUpdates(){this.checks++;if(this.fail)throw Error('synthetic network failure');this.emit('update-available',{version:this.version,releaseNotes:'<script>must never render</script>'});return {cancellationToken:{cancel:()=>{this.cancelled=true;this.rejectDownload?.(Error('cancelled'));}}};}
 async downloadUpdate(){this.downloads++;this.emit('download-progress',{percent:49.5});if(this.fail)throw Error('synthetic checksum failure');if(this.hold)return new Promise((resolve,reject)=>{this.resolveDownload=resolve;this.rejectDownload=reject;});return ['verified synthetic installer'];}
 quitAndInstall(silent,runAfter){this.installs++;this.installArgs=[silent,runAfter];}
}
async function setup(t,extra={}){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'glacia-updates-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const updater=new FakeUpdater();const controller=new UpdateController({updater,directory:dir,currentVersion:'0.5.0',supported:true,installSupported:true,...extra});await controller.load();return {controller,updater,dir};}
test('fixed public GitHub feed and consent-only download/install',async t=>{
 const {controller:c,updater:u}=await setup(t);
 assert.deepEqual(UPDATE_FEED,{provider:'github',owner:'Enochidesu',repo:'glacia-authenticator',private:false});
 assert.equal(u.autoDownload,false);assert.equal(u.autoInstallOnAppQuit,false);assert.equal(u.disableWebInstaller,true);
 await c.startup();await c.startup();assert.equal(u.checks,1);assert.equal(u.downloads,0);assert.equal(u.installs,0);assert.equal(c.status().prompt,true);
 await c.dismiss('cancel');assert.equal(c.status().prompt,false);assert.equal(u.downloads,0);
 await c.check();await c.download();assert.equal(c.status().phase,'ready');assert.equal(u.installs,0);
 await c.install();assert.equal(u.installs,1);assert.deepEqual(u.installArgs,[true,true]);await assert.rejects(c.install(),/Download the update/);
});
test('24-hour reminder survives reopening, only suppresses the same version and manual checks override it',async t=>{
 let time=1000;const {controller:c,updater:u,dir}=await setup(t,{now:()=>time});await c.check();await c.dismiss('later');
 const saved=JSON.parse(await fs.readFile(path.join(dir,'update-preferences.json')));assert.equal(saved.reminder.until,time+REMINDER_DELAY);
 const next=new UpdateController({updater:new FakeUpdater(),directory:dir,currentVersion:'0.5.0',supported:true,installSupported:true,now:()=>time});await next.load();await next.startup();assert.equal(next.status().prompt,false);
 await next.check();assert.equal(next.status().prompt,true);await next.dismiss('cancel');u.version='0.5.2';await c.check(false);assert.equal(c.status().prompt,true);
 time+=REMINDER_DELAY+1;await next.check(false);assert.equal(next.status().prompt,true);
});
test('deduplicates simultaneous checks; manual intent upgrades an in-flight startup check',async t=>{
 const {controller:c,updater:u}=await setup(t);let release;u.checkForUpdates=()=>{u.checks++;return new Promise(resolve=>{release=()=>{u.emit('update-available',{version:'0.5.1'});resolve({});};});};
 const startup=c.startup(),manual=c.check();await new Promise(r=>setImmediate(r));release();await Promise.all([startup,manual]);assert.equal(u.checks,1);assert.equal(c.status().prompt,true);
});
test('rejects invalid versions, downgrades, equal versions and pre-releases by default',async t=>{
 const {controller:c,updater:u}=await setup(t);
 for(const version of ['not-a-version','0.4.3','0.5.0','0.6.0-beta.1']){u.version=version;await c.check();assert.equal(c.status().phase,'current');assert.equal(c.status().prompt,false);assert.throws(()=>c.download(),/Check for an update/);}
 await c.configureSettings({includePrerelease:true});assert.equal(u.allowPrerelease,true);assert.equal(u.allowDowngrade,false);await c.check();assert.equal(c.status().version,'0.6.0-beta.1');
 await assert.rejects(c.configureSettings({url:'https://untrusted.invalid'}),/Invalid update preference/);
});
test('offline startup is quiet; failed checks/downloads never install or touch vault files',async t=>{
 const {controller:c,updater:u,dir}=await setup(t);const vault=path.join(dir,'vault.winterbell');await fs.writeFile(vault,'synthetic vault remains intact');u.fail=true;
 await c.startup();assert.equal(c.status().phase,'error');assert.equal(c.status().prompt,false);await c.check();assert.equal(c.status().prompt,true);
 u.fail=false;await c.check();u.fail=true;await c.download();assert.equal(c.status().phase,'error');assert.equal(u.installs,0);assert.equal(await fs.readFile(vault,'utf8'),'synthetic vault remains intact');
 await assert.rejects(c.install(),/Download the update/);
});
test('cancel download never installs; retry uses a fresh cancellation token',async t=>{
 const {controller:c,updater:u}=await setup(t);await c.check();u.hold=true;const download=c.download();await new Promise(r=>setImmediate(r));c.cancelDownload();await download;assert.equal(c.status().phase,'available');assert.equal(u.installs,0);assert.equal(c.token,null);
 u.hold=false;await c.download();assert.equal(c.status().phase,'ready');
});
test('startup checks can be disabled; portable/development builds never install',async t=>{
 const {controller:c,updater:u,dir}=await setup(t);await c.configureSettings({autoCheck:false});await c.startup();assert.equal(u.checks,0);await c.check();assert.equal(u.checks,1);
 const disabled=new UpdateController({updater:new FakeUpdater(),directory:dir,currentVersion:'0.5.0',supported:false,installSupported:false});await disabled.load();await disabled.startup();assert.equal(disabled.updater.checks,0);await disabled.check();assert.equal(disabled.status().phase,'unavailable');
 const portable=new UpdateController({updater:new FakeUpdater(),directory:dir,currentVersion:'0.5.0',supported:true,installSupported:false});await portable.load();await portable.check();assert.throws(()=>portable.download(),/Install Glacia/);
});
test('installation waits for current work, and aborts if preparation fails',async t=>{
 let complete;const {controller:c,updater:u}=await setup(t,{beforeInstall:()=>new Promise(resolve=>{complete=resolve;})});await c.check();await c.download();const installing=c.install();assert.equal(u.installs,0);complete();await installing;assert.equal(u.installs,1);
 const second=await setup(t,{beforeInstall:async()=>{throw Error('synthetic pending save failure');}});await second.controller.check();await second.controller.download();await second.controller.install();assert.equal(second.updater.installs,0);assert.equal(second.controller.status().phase,'error');
});
