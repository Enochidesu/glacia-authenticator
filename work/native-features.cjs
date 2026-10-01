'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const mode=process.argv[2]||'start',packaged=process.argv.includes('packaged');
const appDir=path.resolve(__dirname,packaged?'../outputs/Glacia Authenticator v0.4.3/resources/app':'winterbell-app');
const first=mode==='start',previous=first?null:JSON.parse(fs.readFileSync(path.join(__dirname,'native-features-start-result.json'),'utf8'));
const profileName=first||mode==='restore'?'features-native-'+Date.now()+'-'+process.pid:previous.profileName;
assert.match(profileName,/^features-native-\d+-\d+$/);const profile=path.join(__dirname,profileName);process.env.WINTERBELL_DATA_DIR=profile;
const resultPath=path.join(__dirname,'native-features-'+mode+'-result.json'),handlers=new Map(),errors=[],checks=[];
const localPassword='Synthetic feature vault password',backupPassword='Synthetic feature backup password';
const backupFile=path.join(profile,'review-backup.winterbell');let dialogMode='save',finished=false,main;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultPath,JSON.stringify({ok,error,mode,profileName,checks,rendererErrors:errors,syntheticProfile:true}));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.message));process.on('unhandledRejection',e=>finish(false,e.message));
const original=Module._load;Module._load=function(name){if(name==='electron')return {...electron,BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false});}},ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}},dialog:{...electron.dialog,showSaveDialog:async()=>({canceled:dialogMode==='cancel',filePath:dialogMode==='protected'?path.join(profile,'vault.winterbell'):dialogMode==='failure'?path.join(profile,'missing-folder','backup.winterbell'):backupFile}),showOpenDialog:async()=>({canceled:false,filePaths:[path.join(__dirname,previous?.profileName||profileName,'review-backup.winterbell')]})}};return original.apply(this,arguments);};
electron.app.on('browser-window-created',(_event,win)=>{
 main=win;win.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
 win.webContents.once('did-finish-load',async()=>{
  const js=code=>win.webContents.executeJavaScript(code),wait=async predicate=>{for(let i=0;i<200;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('UI did not reach the expected state.');};
  const call=async(name,arg)=>{const result=await handlers.get('winterbell:'+name)({sender:win.webContents,senderFrame:win.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;};
  try{
   await call('unlock',{password:localPassword,remember:false});await wait(()=>js("!document.getElementById('wb-unlocked').hidden"));
   if(mode==='restart'){
    const data=await call('status');assert.equal(data.accounts.length,3);assert.equal(data.folders.find(f=>f.name==='Settings').color,'green');assert.ok(data.backup.lastAt);assert.equal(data.preferences.backupReminderDays,7);assert.equal(data.backup.changed,true);
    const id=data.folders.find(f=>f.name==='Settings').id;assert.equal(data.accounts.find(a=>a.issuer==='SEGA').folder,id);checks.push('folder membership, colors, reminder preferences and backup status survive restart');
    await js("document.getElementById('wb-manage-folders').click();");await wait(()=>js(`!!document.querySelector('[data-edit-folder="${id}"]')`));await js(`document.querySelector('[data-edit-folder="${id}"]').click();`);await wait(()=>js("!!document.getElementById('wb-folder-name')"));
    await js("document.getElementById('wb-folder-name').value='Gaming';document.getElementById('wb-folder-color').value='rose';document.querySelector('[data-save-folder]').click();");await wait(async()=>(await call('status')).folders.some(f=>f.name==='Gaming'&&f.color==='rose'));checks.push('edit folder name and color through UI');
    await js("document.getElementById('wb-manage-folders').click();");await wait(()=>js(`!!document.querySelector('[data-remove-folder="${id}"]')`));await js(`document.querySelector('[data-remove-folder="${id}"]').click();`);await wait(()=>js("!!document.querySelector('[data-delete-folder]')"));assert.equal((await call('status')).folders.length,3);
    await js("document.querySelector('[data-close-modal]').click();");await wait(()=>js("document.getElementById('wb-modal-shade').hidden"));assert.equal((await call('status')).folders.length,3);
    await js("document.getElementById('wb-manage-folders').click();");await wait(()=>js(`!!document.querySelector('[data-remove-folder="${id}"]')`));await js(`document.querySelector('[data-remove-folder="${id}"]').click();`);await wait(()=>js("!!document.querySelector('[data-delete-folder]')"));await js("document.querySelector('[data-delete-folder]').click();");await wait(async()=>(await call('status')).folders.length===2);const removed=await call('status');assert.equal(removed.accounts.length,3);assert.equal(removed.accounts.find(a=>a.issuer==='SEGA').folder,'personal');checks.push('folder deletion requires confirmation, cancel preserves it, and deletion preserves every authenticator');
   }else if(mode==='restore'){
    const chosen=await call('chooseImport');assert.equal(chosen.encrypted,true);const staged=await call('decryptImport',{password:backupPassword});await call('commitImport',{ids:staged.accounts.map(account=>account.id)});
    const data=await call('status');assert.equal(data.accounts.length,3);assert.equal(data.folders.length,3);assert.equal(data.folders.find(f=>f.name==='Settings').color,'green');assert.equal(data.accounts.find(a=>a.issuer==='SEGA').folder,data.folders.find(f=>f.name==='Settings').id);assert.equal(data.backup.lastAt,null);checks.push('encrypted restore retains folders and accounts without copying another PC backup status');
   }else{
    for(const [name,email] of [['SEGA','demo@example.invalid'],['Authenticator','Discord demo'],['Unknown service','other@example.invalid']])await call('add',{name,email,secret:'JBSWY3DPEHPK3PXP'});
    await wait(()=>js("document.querySelectorAll('.wb-account').length===3"));
    assert.equal(await js("document.querySelectorAll('[data-service-logo]').length"),2);assert.equal(await js("getComputedStyle(document.querySelector('[data-service-logo=sega]')).maskImage.includes('sega.svg')"),true);checks.push('offline service logos and initials fallback');
    await js("document.getElementById('wb-manage-folders').click();");await wait(()=>js("!!document.querySelector('[data-create-folder]')"));await js("document.querySelector('[data-create-folder]').click();");await wait(()=>js("!!document.getElementById('wb-folder-name')"));
    await js("document.getElementById('wb-folder-name').value='Settings';document.getElementById('wb-folder-color').value='green';document.getElementById('wb-folder-color').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-save-folder]').click();");
    await wait(async()=>!!(await call('status')).folders.find(f=>f.name==='Settings'));const data=await call('status'),folder=data.folders.find(f=>f.name==='Settings'),sega=data.accounts.find(a=>a.issuer==='SEGA');
    await wait(()=>js(`!!document.querySelector('[data-account-folder="${sega.id}"] option[value="${folder.id}"]')`));
    await js(`const select=document.querySelector('[data-account-folder="${sega.id}"]');select.value='${folder.id}';select.dispatchEvent(new Event('change',{bubbles:true}));`);
    await wait(async()=>(await call('status')).accounts.find(a=>a.id===sega.id).folder===folder.id);await wait(()=>js(`document.querySelector('[data-page="${folder.id}"] .wb-count').textContent==='1'`));checks.push('create folder and move account through UI');
    await js(`document.querySelector('[data-page="${folder.id}"]').click();`);await wait(()=>js("document.querySelectorAll('.wb-account').length===1"));assert.equal(await js("document.getElementById('wb-heading').textContent"),'Settings');
    await call('preferences',{backupReminderDays:7});await wait(()=>js("!document.getElementById('wb-backup-reminder').hidden"));assert.equal((await call('status')).backup.due,true);checks.push('opt-in reminder appears when no backup is recorded');
    await js("document.querySelector('[data-dismiss-backup]').click();");await wait(()=>js("document.getElementById('wb-backup-reminder').hidden"));
    dialogMode='cancel';assert.equal(await call('export',{password:backupPassword,confirm:backupPassword}),null);assert.equal((await call('status')).backup.lastAt,null);
    dialogMode='protected';await assert.rejects(()=>call('export',{password:backupPassword,confirm:backupPassword}),/different export/);assert.equal((await call('status')).backup.lastAt,null);
    dialogMode='failure';await assert.rejects(()=>call('export',{password:backupPassword,confirm:backupPassword}));assert.equal((await call('status')).backup.lastAt,null);checks.push('cancelled, failed and protected-path exports cannot mark a backup successful');
    dialogMode='save';const exported=await call('export',{password:backupPassword,confirm:backupPassword});assert.equal(exported.statusSaved,true);assert.equal(exported.count,3);assert.equal((await call('status')).backup.changed,false);assert.equal((await call('status')).backup.due,false);
    await call('favorite',{id:sega.id,favorite:true});assert.equal((await call('status')).backup.changed,true);checks.push('only encrypted export records success and later changes are detected');
    for(const language of ['en','id','ja']){
     await call('preferences',{language});await wait(()=>js(`document.documentElement.lang==='${language}'`));
     assert.equal(await js(`document.querySelector('[data-page="${folder.id}"] [data-i18n-skip]').textContent`),'Settings');
     await js("document.querySelector('[data-page=help]').click();");await wait(()=>js("!!document.querySelector('.wb-help-page')"));assert.equal(await js("document.querySelectorAll('.wb-help-page details').length"),6);
     const title=await js("document.getElementById('wb-heading').textContent");assert.equal(title,require(path.join(appDir,'i18n.js')).translate('Help & Recovery',language));
     await js("document.querySelector('[data-page=backup]').click();");await wait(()=>js("!!document.getElementById('wb-backup-date')?.dataset.i18nDate"));assert.equal(await js("!!document.getElementById('wb-backup-date').dataset.i18nDate"),true);
     await js("document.querySelector('[data-page=settings]').click();");await wait(()=>js("!!document.querySelector('.wb-about-description')"));assert.equal(await js("document.querySelector('.wb-about-description span').textContent"),require(path.join(appDir,'i18n.js')).translate('Glacia Authenticator is app from Winter Garden Project for your two-step Verification Codes.',language));
    }
    checks.push('all three languages include Help, Backup and About without translating custom folder names');
    await call('preferences',{language:'en'});await wait(()=>js("document.documentElement.lang==='en'"));await js("document.querySelector('[data-page=all]').click();");await wait(()=>js("document.querySelectorAll('.wb-account').length===3"));
    for(const theme of ['light','dark']){await js(`document.getElementById('winterbell-ui').dataset.theme='${theme}'; void 0;`);win.showInactive();await new Promise(r=>setTimeout(r,650));fs.writeFileSync(path.join(__dirname,'features-native-preview-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());win.hide();}
    const layout=await js("({overflow:document.documentElement.scrollWidth>innerWidth,signOutBottom:document.getElementById('wb-lock-button').getBoundingClientRect().bottom,height:innerHeight,navScroll:getComputedStyle(document.querySelector('.wb-sidebar-scroll')).overflowY})");assert.equal(layout.overflow,false);assert.ok(layout.signOutBottom<=layout.height);assert.equal(layout.navScroll,'auto');
    await js("document.querySelector('[data-page=backup]').click();");win.showInactive();await new Promise(r=>setTimeout(r,150));fs.writeFileSync(path.join(__dirname,'features-native-preview-backup.png'),(await win.webContents.capturePage()).toPNG());win.hide();
    await call('lock');await wait(()=>js("document.querySelectorAll('.wb-folder-nav [data-i18n-skip]').length===0"));assert.equal((await call('status')).backup,null);assert.equal((await call('status')).folders.length,2);checks.push('lock clears private custom folders and backup details');
   }
   if(errors.length)throw Error('Renderer console errors: '+errors.join('; '));finish(true);
  }catch(error){finish(false,error.stack);}
 });
});setTimeout(()=>finish(false,'Feature native checks timed out'),40000).unref();require(path.join(appDir,'main.cjs'));
