'use strict';
const {app,BrowserWindow,ipcMain,dialog,clipboard,Menu,powerMonitor,safeStorage,shell,Tray,screen}=require('electron');
const fs=require('node:fs/promises');const path=require('node:path');const crypto=require('node:crypto');const core=require('./core.cjs');
const folderStore=require('./folders.cjs');
const QRCode=require('qrcode');const {GoogleSync,signature}=require('./google-sync.cjs');
const {loadReleaseConfig}=require('./release-config.cjs');const release=loadReleaseConfig(__dirname);
const {publicPageUrl}=require('./public-pages.cjs');
const i18n=require('./i18n.js');const t=text=>i18n.translate(text,preferences.language);
const {RememberedVault}=require('./remembered-vault.cjs');
const {createTrayController}=require('./tray-controller.cjs');
const {parseMigration,collectMigration}=require('./migration.cjs');
const {createGoogleVault}=require('./onboarding.cjs');
const {createStartupController}=require('./startup.cjs');const startup=createStartupController(app);
const {UpdateController,UPDATE_FEED}=require('./updates.cjs');const {PasswordTransaction}=require('./passwords.cjs');
app.setName('Glacia Authenticator');
app.setPath('userData',process.env.WINTERBELL_DATA_DIR?path.resolve(process.env.WINTERBELL_DATA_DIR):path.join(app.getPath('appData'),'Winterbell Authenticator'));
const vaultPath=()=>path.join(app.getPath('userData'),'vault.winterbell');
let win,accounts=[],deletions=[],folders=[],backup={},pendingDelete=null,key=null,salt=null,pending=null,lastActivity=Date.now(),hasVault=false,busy=Promise.resolve(),copiedCode=null,lockEpoch=0;
let trayController=null,quitting=false,closePrompt=false;const startupLaunch=process.argv.includes('--startup');
async function exitGracefully(){await busy;await remembered.pending;quitting=true;app.quit();}
async function requestClose(){if(quitting||closePrompt)return;if(preferences.closeBehavior==='ask'){closePrompt=true;win.webContents.send('winterbell:close-requested');return;}if(preferences.closeBehavior==='tray')trayController?.hideMain();else await exitGracefully();}

function broadcast(channel,payload){if(trayController)trayController.broadcast(channel,payload);else if(win&&!win.isDestroyed())win.webContents.send(channel,payload);}
let preferences={dark:false,layout:'cards',autoLock:5,language:'en',trayAccountId:'',backupReminderDays:0,closeBehavior:'ask'};
const updateSession=new RememberedVault(app.getPath('userData'),safeStorage);updateSession.file=path.join(app.getPath('userData'),'update-session.secure');
const remembered=new RememberedVault(app.getPath('userData'),safeStorage);let rememberedLogin=false,loginNotice='';
function windowState(){return {maximized:!!win&&!win.isDestroyed()&&win.isMaximized()};}
const prefPath=()=>path.join(app.getPath('userData'),'preferences.json');
const {NsisUpdater}=require('electron-updater');
const updater=new NsisUpdater(UPDATE_FEED);
updater.installDirectory=path.dirname(process.execPath);
const updates=new UpdateController({updater,directory:app.getPath('userData'),currentVersion:app.getVersion(),
 supported:app.isPackaged&&process.platform==='win32'&&release.publicRelease,
 installSupported:app.isPackaged&&process.platform==='win32'&&require('node:fs').existsSync(path.join(path.dirname(process.execPath),'Uninstall Glacia Authenticator.exe')),
 onChange:state=>broadcast('winterbell:update-changed',state),beforeInstall:async()=>{await busy;if(passwordTransaction.pending)throw Error('Finish the pending password change first.');if(key&&!rememberedLogin)await updateSession.save(key,salt);lock();}});
const passwordTransaction=new PasswordTransaction(app.getPath('userData'),safeStorage);let security={};let cloudReady=false;
function cloudChanged(state){const ready=state.connected&&!state.connecting,resume=ready&&!cloudReady;cloudReady=ready;if(resume&&key)resumeCloudSync();broadcast('winterbell:cloud-changed');}
const cloud=new GoogleSync({directory:app.getPath('userData'),safeStorage,defaultConfig:release.defaultConfig,developerSetup:!release.publicRelease,getLanguage:()=>preferences.language,openExternal:url=>shell.openExternal(url),onChange:cloudChanged});
let syncTimer;
function scheduleSync(){clearTimeout(syncTimer);if(key&&cloud.status().enabled)syncTimer=setTimeout(()=>{const job=busy.then(()=>{if(key&&cloud.status().enabled)return syncCloud();});busy=job.catch(()=>{});},1500);}
function resumeCloudSync(){if(key&&cloud.resumeSync(key))scheduleSync();}
async function syncCloud(){locked();const epoch=lockEpoch;const before=signature(accounts,deletions,folders);const merged=await cloud.run(accounts,deletions,folders);locked();if(epoch!==lockEpoch)throw Error('Unlock Glacia and enable sync again.');if(signature(merged)!==before)await saveVault(merged,true,merged.deletions,merged.folders);cloud.localRevision=signature(accounts,deletions,folders);return status();}
function locked(){if(passwordTransaction.pending)throw Error('Finish the pending password change first.');if(!key)throw new Error('Unlock Glacia first.');}
function lock(){lockEpoch++;remembered.cancel();clearTimeout(syncTimer);cloud.pause();if(key)key.fill(0);key=null;salt=null;accounts=[];deletions=[];folders=[];backup={};security={};pendingDelete=null;pending=null;if(copiedCode&&clipboard.readText()===copiedCode)clipboard.clear();copiedCode=null;broadcast('winterbell:locked');}
async function resumeLogin(){
 if(key)return status();if(!hasVault||!rememberedLogin)throw Error('Enter your vault password.');const epoch=lockEpoch,saved=await remembered.load();
 try{const vault=core.envelope(await fs.readFile(vaultPath(),'utf8'));if(!saved.salt.equals(vault.salt))throw Error('Saved login no longer matches this vault.');const opened=core.decodeVaultWithKey(vault,saved.key);if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');key=Buffer.from(saved.key);salt=saved.salt;accounts=opened.accounts;deletions=opened.deletions;folders=opened.folders;backup=opened.backup;security=opened.security;lastActivity=Date.now();loginNotice='';resumeCloudSync();return status();}finally{saved.key.fill(0);}
}
async function saveVault(next,fromCloud=false,nextDeletions=deletions,nextFolders=folders,nextBackup=backup){locked();const resolved=folderStore.reconcile(next,nextFolders),text=core.encode(resolved,key,salt,nextDeletions,nextFolders,nextBackup,security);const temp=vaultPath()+'.tmp';await fs.writeFile(temp,text,{mode:0o600});await fs.rename(temp,vaultPath());accounts=key?resolved:[];deletions=key?nextDeletions:[];folders=key?nextFolders:[];backup=key?nextBackup:{};if(!fromCloud)scheduleSync();}
function backupRevision(){return crypto.createHash('sha256').update(JSON.stringify([signature(accounts,deletions,folders),accounts.map(core.fingerprint)])).digest('hex');}
function backupStatus(){if(!key)return null;return {lastAt:backup.lastAt||null,lastCount:backup.lastCount||0,changed:!!backup.lastAt&&backup.revision!==backupRevision(),due:!!preferences.backupReminderDays&&accounts.length>0&&(!backup.lastAt||Date.now()-Date.parse(backup.lastAt)>=preferences.backupReminderDays*86400000)};}
function status(){const c=cloud.status(),unlocked=!!key&&!passwordTransaction.pending;return {hasVault,locked:!unlocked,passwordUpgradeRequired:unlocked&&!security.unified,passwordChangePending:!!passwordTransaction.pending,rememberedLogin,loginNotice,preferences,window:windowState(),startup:startup.status(),cloud:{...c,syncPending:unlocked&&c.enabled&&signature(accounts,deletions,folders)!==cloud.localRevision},folders:unlocked?folderStore.visible(folders):folderStore.builtins,backup:unlocked?backupStatus():null,accounts:unlocked?accounts.map(a=>core.publicAccount(a)):[]};}
function publicPending(){return {file:pending.name,fileIsLabel:pending.fileIsLabel===true,...(pending.migration?{migration:{scanned:pending.migration.parts.size,total:pending.migration.size,missing:pending.migration.missing.map(i=>i+1)}}:{}),accounts:pending.records.map(a=>({id:a.id,name:a.name,email:a.email,algorithm:a.algorithm,digits:a.digits,period:a.period})),skipped:pending.records.filter(a=>accounts.some(b=>core.fingerprint(a)===core.fingerprint(b))).length};}
const miniChannels=new Set(['status','touch','copy','traySelect','trayMenuOpen','openMainWindow','closeMiniWindow']);
function handle(channel,fn,serial=false){ipcMain.handle('winterbell:'+channel,(event,arg)=>{const mini=trayController?.miniWindow,isMain=win&&event.sender===win.webContents,isMini=mini&&event.sender===mini.webContents;if((!isMain&&!(isMini&&miniChannels.has(channel)))||event.senderFrame!==event.sender.mainFrame)return {ok:false,error:'Request denied.'};const run=async()=>{try{return {ok:true,data:await fn(arg)};}catch(error){return {ok:false,error:error.message||'The operation could not be completed.'};}};if(!serial)return run();const work=busy.then(run,run);busy=work.catch(()=>{});return work;});}
handle('status',()=>status());
handle('closeDecision',async arg=>{if(!closePrompt||!['tray','exit','cancel'].includes(arg?.action)||typeof arg?.remember!=='boolean')throw Error('Request denied.');try{if(arg.action==='cancel')return true;if(arg.remember){const job=busy.then(async()=>{const next={...preferences,closeBehavior:arg.action};await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(prefPath(),JSON.stringify(next),{mode:0o600});preferences=next;});busy=job.catch(()=>{});await job;}if(arg.action==='tray')trayController?.hideMain();else await exitGracefully();return true;}finally{closePrompt=false;}});
handle('updateStatus',()=>updates.status());
handle('updateCheck',()=>updates.check(true));
handle('updateSettings',arg=>updates.configureSettings(arg));
handle('updateDismiss',arg=>updates.dismiss(arg?.action));
handle('updateDownload',()=>updates.download());
handle('updateCancelDownload',()=>updates.cancelDownload());
handle('updateInstall',()=>updates.install());
handle('openPublicPage',async arg=>{await shell.openExternal(publicPageUrl(arg?.page));return true;});
handle('windowAction',arg=>{
 if(!['minimize','maximize','close'].includes(arg?.action))throw Error('Unknown window action.');
 if(!win||win.isDestroyed())throw Error('The window is closed.');
 if(arg.action==='minimize')win.minimize();
 else if(arg.action==='maximize'){if(win.isMaximized())win.unmaximize();else win.maximize();}
 else setImmediate(()=>{if(win&&!win.isDestroyed())win.close();});
 return windowState();
});
handle('openMainWindow',()=>{trayController?.openMain();return true;});
handle('closeMiniWindow',()=>{trayController?.hideMini();return true;});
handle('trayMenuOpen',arg=>{trayController?.resize(arg?.open===true);return true;});
handle('traySelect',async arg=>{locked();if(!accounts.some(a=>a.id===arg?.id))throw Error('Account not found.');preferences.trayAccountId=arg.id;await fs.writeFile(prefPath(),JSON.stringify(preferences),{mode:0o600});return status();},true);
handle('cloudVaults',()=>cloud.discoverVaults(),true);
handle('cloudSignIn',()=>{return cloud.signIn();},true);
handle('cloudCancelSignIn',()=>cloud.cancelSignIn());
handle('cloudDisconnect',async()=>{clearTimeout(syncTimer);await cloud.disconnect();return status();},true);
handle('cloudEnable',async arg=>{
 locked();if(passwordTransaction.pending)throw Error('Finish the pending password change first.');
 if(!security.unified)throw Error('Create your one Glacia password first.');
 const epoch=lockEpoch,verified=await core.decryptBackup(await fs.readFile(vaultPath(),'utf8'),arg?.password);verified.key.fill(0);locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');
 if(!cloud.status().connected)throw Error('Sign in with Google first.');let secret;
 try{const entry=await cloud.passwordEntry();if(entry)secret=await cloud.unifiedSecret(arg.password);
 else if(arg.legacyPassword){core.passwordCheck(arg.legacyPassword);secret=Buffer.from(arg.legacyPassword);}
 else secret=await cloud.unifiedSecret(arg.password,true);
 await cloud.enable(secret.toString('utf8'));await syncCloud();locked();
 if(!entry){const plan=await cloud.passwordPlan(arg.legacyPassword||arg.password,arg.password,secret);await cloud.commitPasswordPlan(plan);}
 locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');security={unified:true,cloud:{...cloud.context(),secret:secret.toString('base64')}};await saveVault(accounts,true);await cloud.rememberSync(key);return status();
 }catch(error){cloud.pause();throw error;}finally{secret?.fill(0);}
},true);
handle('cloudPause',()=>{clearTimeout(syncTimer);cloud.pause();const work=busy.then(async()=>{await cloud.forgetSync();return status();});busy=work.catch(()=>{});return work;});
handle('cloudSync',()=>syncCloud(),true);
handle('touch',()=>{lastActivity=Date.now();return true;});
handle('unlock',async arg=>{
 if(passwordTransaction.pending)throw Error('Finish the pending password change before unlocking.');if(key)throw new Error('Glacia is already unlocked.');const password=arg?.password,epoch=lockEpoch;
 if(hasVault){const text=await fs.readFile(vaultPath(),'utf8');const opened=await core.decryptBackup(text,password);if(epoch!==lockEpoch){opened.key.fill(0);throw new Error('The vault was locked. Try unlocking again.');}key=opened.key;salt=opened.salt;accounts=opened.accounts;deletions=opened.deletions;folders=opened.folders;backup=opened.backup;security=opened.security;}
 else{core.passwordCheck(password);security={unified:true};const newSalt=crypto.randomBytes(16),newKey=await core.derive(password,newSalt);if(epoch!==lockEpoch){newKey.fill(0);throw new Error('The vault was locked. Try unlocking again.');}salt=newSalt;key=newKey;accounts=[];try{await fs.mkdir(app.getPath('userData'),{recursive:true});locked();await fs.writeFile(vaultPath(),core.encode(accounts,key,salt,[],[],{},security),{flag:'wx',mode:0o600});hasVault=true;}catch(error){lock();throw error;}}
 try{if(arg?.remember===true){const saved=await remembered.save(key,salt);if(epoch!==lockEpoch||!saved)throw Error('The vault was locked. Try unlocking again.');rememberedLogin=true;}else{await remembered.forget();rememberedLogin=false;}loginNotice='';}catch(error){lock();throw error;}
 lastActivity=Date.now();resumeCloudSync();return status();
},true);
handle('googleOnboard',async arg=>{
 if(hasVault||key)throw Error('A vault already exists. Unlock it to connect Google.');const epoch=lockEpoch,identity=cloud.tokens?.sub;
 await fs.mkdir(app.getPath('userData'),{recursive:true});
 const opened=await createGoogleVault({cloud,file:vaultPath(),password:arg?.password,confirm:arg?.confirm,syncPassword:arg?.syncPassword,syncConfirm:arg?.syncConfirm,mode:arg?.mode,vaultId:arg?.vaultId,cloudName:arg?.cloudName,isCurrent:()=>epoch===lockEpoch&&identity===cloud.tokens?.sub});
 hasVault=true;if(epoch!==lockEpoch){opened.key.fill(0);broadcast('winterbell:locked');throw Error('Setup was locked. Unlock your newly created vault to continue.');}
 key=opened.key;salt=opened.salt;accounts=opened.accounts;deletions=opened.deletions;folders=opened.folders??[];backup={};security=opened.security;lastActivity=Date.now();loginNotice='';
 try{if(arg?.remember===true){const saved=await remembered.save(key,salt);if(epoch!==lockEpoch||!saved)throw Error('The vault was locked. Try unlocking again.');rememberedLogin=true;}else{await remembered.forget();rememberedLogin=false;}}catch(error){lock();throw error;}
 await cloud.rememberSync(key);scheduleSync();return status();
},true);
handle('changePassword',async arg=>{
 locked();if(passwordTransaction.pending)throw Error('Finish the pending password change first.');
 const epoch=lockEpoch;let opened;try{opened=await core.decryptBackup(await fs.readFile(vaultPath(),'utf8'),arg?.oldPassword);}catch{throw Error('The old password is incorrect.');}opened.key.fill(0);locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');
 if(arg?.newPassword!==arg?.confirm)throw Error('The new passwords do not match.');core.passwordCheck(arg.newPassword);
 const oldKey=key,wasEnabled=cloud.status().enabled;clearTimeout(syncTimer);let secret,newKey,plan=null;
 try{
  const linked=security.cloud||cloud.savedSync||cloud.target;
  if(linked){if(!cloud.tokens||cloud.tokens.sub!==linked.sub)throw Error('Sign in to the original Google account before changing this password.');
   if(security.cloud){secret=Buffer.from(security.cloud.secret,'base64');}
   else if(cloud.resumeSync(oldKey)){secret=Buffer.from(cloud.passphrase);}
   else{core.passwordCheck(arg.legacyPassword);secret=Buffer.from(arg.legacyPassword);await cloud.enable(arg.legacyPassword);await syncCloud();}
   try{plan=await cloud.passwordPlan(arg.legacyPassword||arg.oldPassword,arg.newPassword,secret);}catch(error){if(!security.unified&&error.message==='Incorrect Glacia password for this cloud vault.')plan=await cloud.passwordPlan(arg.newPassword,arg.newPassword,secret);else throw error;}
  }
  if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');
  const nextSalt=crypto.randomBytes(16);newKey=await core.derive(arg.newPassword,nextSalt);const nextSecurity={unified:true,...(secret?{cloud:{...cloud.context(),secret:secret.toString('base64')}}:{})};
  const files={'vault.winterbell':Buffer.from(core.encode(accounts,newKey,nextSalt,deletions,folders,backup,nextSecurity))};
  if(secret)files['google-sync.secure']=cloud.sessionBytes(newKey,secret);
  if(rememberedLogin){if(!safeStorage.isEncryptionAvailable())throw Error('Windows secure storage is unavailable.');files['remembered-login.secure']=safeStorage.encryptString(JSON.stringify({version:1,key:newKey.toString('base64'),salt:nextSalt.toString('base64')}));}
  if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');
  await passwordTransaction.prepare(files,plan);await passwordTransaction.finish(cloud);
  cloud.pause();oldKey.fill(0);if(epoch===lockEpoch){key=newKey;newKey=null;salt=nextSalt;security=nextSecurity;}else if(!rememberedLogin)await remembered.forget();
  if(secret){await cloud.load();if(key&&wasEnabled)resumeCloudSync();}
  return status();
 }catch(error){cloud.pause();if(!passwordTransaction.pending&&key&&wasEnabled)resumeCloudSync();throw error;}finally{secret?.fill(0);newKey?.fill(0);if(key&&!passwordTransaction.pending&&cloud.status().enabled)scheduleSync();}
},true);
handle('finishPasswordChange',async()=>{lock();await passwordTransaction.finish(cloud);await cloud.load();rememberedLogin=await remembered.exists();hasVault=true;if(rememberedLogin)await resumeLogin();return status();},true);
handle('resumeLogin',()=>resumeLogin(),true);
handle('forgetLogin',async()=>{rememberedLogin=false;await remembered.forget();return status();},true);
handle('lock',async()=>{rememberedLogin=false;lock();await remembered.forget();return status();});
// Lock immediately, then drain canceled work before removing the saved sessions.
handle('signOut',()=>{
 rememberedLogin=false;lock();
 const work=busy.then(async()=>{
  rememberedLogin=false;lock();
  const results=await Promise.allSettled([remembered.forget(),cloud.disconnect()]);
  const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  return status();
 });busy=work.catch(()=>{});return work;
});
handle('add',async record=>{locked();const a=record?.uri?core.parseUri(record.uri):core.normalize(record);if(!folderStore.available(folders,a.folder))throw Error('Folder not found.');a.updatedAt=Math.max(Date.now(),(deletions.find(d=>d.fingerprint===core.fingerprint(a))?.deletedAt??0)+1);const result=core.merge(accounts,[a]);if(!result.added)throw new Error('This authenticator is already in your vault.');await saveVault(result.accounts);lastActivity=Date.now();return status();},true);
handle('favorite',async arg=>{locked();if(typeof arg?.favorite!=='boolean')throw new Error('Invalid favorite setting.');const next=accounts.map(a=>a.id===arg.id?{...a,favorite:arg.favorite,updatedAt:Date.now()}:a);await saveVault(next);return status();},true);
handle('renameAccount',async arg=>{locked();if(!accounts.some(a=>a.id===arg?.id))throw Error('Account not found.');const next=accounts.map(a=>a.id===arg.id?core.renameAccount(a,arg.name):a);await saveVault(next);return status();},true);
handle('moveAccount',async arg=>{locked();if(!folderStore.available(folders,arg?.folder))throw Error('Folder not found.');if(!accounts.some(a=>a.id===arg?.id))throw Error('Account not found.');const next=accounts.map(a=>a.id===arg.id?{...a,folder:arg.folder,updatedAt:Math.max(Date.now(),(a.updatedAt||0)+1)}:a);await saveVault(next);return status();},true);
handle('saveFolder',async arg=>{locked();const result=folderStore.edit(folders,arg);await saveVault(accounts,false,deletions,result.records);return {folder:result.folder,status:status()};},true);
handle('deleteFolder',async arg=>{locked();const records=folderStore.remove(folders,arg?.id);const next=accounts.map(account=>account.folder===arg.id?{...account,folder:'personal',updatedAt:Math.max(Date.now(),(account.updatedAt||0)+1)}:account);await saveVault(next,false,deletions,records);return status();},true);
// Account placement is local to this vault. Cloud merges retain the local array order.
handle('reorderAccounts',async arg=>{locked();const next=core.reorderAccounts(accounts,arg);if(next.some((a,i)=>a.id!==accounts[i].id))await saveVault(next,true);return status();},true);
handle('prepareDelete',arg=>{locked();if(!accounts.some(a=>a.id===arg?.id))throw Error('Account not found.');pendingDelete={id:arg.id,token:crypto.randomUUID(),readyAt:performance.now()+5000};return {token:pendingDelete.token,delay:5000};},true);
handle('cancelDelete',()=>{pendingDelete=null;return true;});
handle('deleteAccount',async arg=>{
 locked();if(!pendingDelete||pendingDelete.id!==arg?.id||pendingDelete.token!==arg?.token)throw Error('Open the delete confirmation again.');if(performance.now()<pendingDelete.readyAt)throw Error('Wait five seconds before deleting this account.');
 const result=core.deleteAccount(accounts,deletions,arg.id);await saveVault(result.accounts,false,result.deletions);pendingDelete=null;
 if(preferences.trayAccountId===arg.id){preferences.trayAccountId='';await fs.writeFile(prefPath(),JSON.stringify(preferences),{mode:0o600});}
 if(copiedCode&&clipboard.readText()===copiedCode)clipboard.clear();copiedCode=null;broadcast('winterbell:cloud-changed');return status();
},true);
handle('copy',arg=>{locked();const account=accounts.find(a=>a.id===arg?.id);if(!account)throw new Error('Account not found.');const code=core.totp(account);clipboard.writeText(code);copiedCode=code;setTimeout(()=>{if(clipboard.readText()===code)clipboard.clear();if(copiedCode===code)copiedCode=null;},30000);return true;});
handle('showQR',async arg=>{locked();const account=accounts.find(a=>a.id===arg?.id);if(!account)throw new Error('Account not found.');const dataUrl=await QRCode.toDataURL(core.setupUri(account),{width:320,margin:4,errorCorrectionLevel:'M',color:{dark:'#102c40',light:'#ffffff'}});return {name:account.name,email:account.email,dataUrl};});
handle('setStartup',arg=>{locked();return startup.setEnabled(arg?.enabled);},true);
handle('preferences',async arg=>{const next={...preferences},dark=arg?.dark,layout=arg?.layout,autoLock=arg?.autoLock;if(typeof dark==='boolean')next.dark=dark;if(['cards','compact'].includes(layout))next.layout=layout;if([0,1,5,15].includes(autoLock))next.autoLock=autoLock;if(i18n.languages.includes(arg?.language))next.language=arg.language;if(['ask','tray','exit'].includes(arg?.closeBehavior))next.closeBehavior=arg.closeBehavior;if([0,7,14,30].includes(arg?.backupReminderDays))next.backupReminderDays=arg.backupReminderDays;await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(prefPath(),JSON.stringify(next),{mode:0o600});const changed=next.language!==preferences.language;preferences=next;if(changed){trayController?.updateLanguage();broadcast('winterbell:language-changed',preferences.language);}return preferences;},true);
handle('chooseImport',async()=>{locked();const result=await dialog.showOpenDialog(win,{title:t('Import authenticators or restore a Glacia backup'),properties:['openFile'],filters:[{name:t('Authenticator links and Glacia backups'),extensions:['txt','winterbell','json']}]});if(result.canceled)return null;const file=result.filePaths[0];const stat=await fs.stat(file);if(stat.size>3*1048576)throw new Error('The file is too large.');const text=await fs.readFile(file,'utf8');if(text.trimStart().startsWith('{')){core.envelope(text);pending={name:path.basename(file),text,records:null};return {encrypted:true,file:pending.name};}pending={name:path.basename(file),records:core.parseText(text)};return {encrypted:false,...publicPending()};},true);
handle('decryptImport',async arg=>{locked();if(!pending?.text)throw new Error('Choose an encrypted backup first.');const epoch=lockEpoch,name=pending.name,opened=await core.decryptBackup(pending.text,arg?.password);opened.key.fill(0);locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Try again.');pending={name,records:opened.accounts,folders:opened.folders};return publicPending();},true);
handle('stageText',arg=>{locked();if(typeof arg?.text!=='string')throw new Error('Enter authenticator links.');pending={name:'Pasted authenticator links',fileIsLabel:true,records:core.parseText(arg.text)};return publicPending();},true);
handle('stageQR',arg=>{locked();if(typeof arg?.uri!=='string'||arg.uri.length>65536)throw Error('The QR is invalid or too large.');
 if(arg.uri.startsWith('otpauth-migration:')){const migration=collectMigration(pending?.migration,parseMigration(arg.uri));pending={name:'Google Authenticator transfer',fileIsLabel:true,records:migration.records,migration};}
 else pending={name:'Setup QR image',fileIsLabel:true,records:[core.parseUri(arg.uri)]};return publicPending();},true);
handle('commitImport',async arg=>{locked();if(pending?.migration?.missing.length)throw Error('Scan every QR page before importing this transfer.');if(!pending?.records||!Array.isArray(arg?.ids))throw new Error('Choose accounts to import.');const ids=new Set(arg.ids);const records=pending.records.filter(a=>ids.has(a.id)).map(a=>({...a,updatedAt:Math.max(Date.now(),(deletions.find(d=>d.fingerprint===core.fingerprint(a))?.deletedAt??0)+1)}));if(!records.length)throw new Error('Select at least one account.');const result=core.merge(accounts,records);await saveVault(result.accounts,false,deletions,folderStore.merge(folders,pending.folders??[]));pending=null;return {added:result.added,skipped:result.skipped,status:status()};},true);
handle('cancelImport',()=>{pending=null;return true;},true);
handle('exportText',async arg=>{
 locked();if(!Array.isArray(arg?.ids))throw new Error('Select accounts to export.');
 const ids=new Set(arg.ids);if(!accounts.some(a=>ids.has(a.id)))throw new Error('Select at least one account to export.');
 const epoch=lockEpoch;
 const result=await dialog.showSaveDialog(win,{title:t('Export unencrypted authenticator links'),defaultPath:'Glacia-accounts-'+new Date().toISOString().slice(0,10)+'.txt',filters:[{name:t('Plain-text authenticator links (contains secret keys)'),extensions:['txt']}]});
 if(result.canceled)return null;
 locked();if(epoch!==lockEpoch)throw new Error('The vault was locked. Start the export again.');
 if(path.extname(result.filePath).toLowerCase()!=='.txt')throw new Error('Choose a file name ending in .txt.');
 const protectedPaths=[vaultPath(),prefPath()].map(p=>path.resolve(p).toLowerCase());
 if(protectedPaths.includes(path.resolve(result.filePath).toLowerCase()))throw new Error('Choose a different export location.');
 const selected=accounts.filter(a=>ids.has(a.id));const text=core.exportText(selected);
 await fs.writeFile(result.filePath,text,{encoding:'utf8',mode:0o600});
 return {count:selected.length,file:path.basename(result.filePath)};
},true);
handle('export',async arg=>{
 locked();if(typeof arg?.password!=='string'||arg.password!==arg.confirm)throw new Error('The backup passwords do not match.');core.passwordCheck(arg.password);const epoch=lockEpoch;
 const result=await dialog.showSaveDialog(win,{title:t('Save encrypted Glacia backup'),defaultPath:'Glacia-'+new Date().toISOString().slice(0,10)+'.winterbell',filters:[{name:t('Encrypted Glacia backup'),extensions:['winterbell']}]});if(result.canceled)return null;
 locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Start the export again.');
 const protectedPaths=['vault.winterbell','vault.winterbell.tmp','vault.winterbell.password-tmp','preferences.json','google-sync.secure','google-sync.secure.tmp','google-sync.secure.password-tmp','remembered-login.secure','remembered-login.secure.password-tmp','update-session.secure','password-change.pending','password-change.pending.tmp'].map(file=>path.resolve(app.getPath('userData'),file).toLowerCase());
 if(protectedPaths.includes(path.resolve(result.filePath).toLowerCase()))throw Error('Choose a different export location.');
 const count=accounts.length,revision=backupRevision(),text=await core.encryptBackup(accounts,arg.password,deletions,folders);locked();if(epoch!==lockEpoch)throw Error('The vault was locked. Start the export again.');
 await fs.writeFile(result.filePath,text,{mode:0o600});
 let statusSaved=false;if(key&&epoch===lockEpoch){try{await saveVault(accounts,true,deletions,folders,{lastAt:new Date().toISOString(),lastCount:count,revision});statusSaved=!!key&&epoch===lockEpoch;}catch{statusSaved=false;}}
 return {count,file:path.basename(result.filePath),statusSaved};
},true);
handle('chooseQR',async()=>{locked();const result=await dialog.showOpenDialog(win,{title:t('Choose a setup QR image'),properties:['openFile'],filters:[{name:t('QR image'),extensions:['png','jpg','jpeg','webp']}]});if(result.canceled)return null;const file=result.filePaths[0];const stat=await fs.stat(file);if(stat.size>10*1048576)throw new Error('QR images must be smaller than 10 MB.');const bytes=await fs.readFile(file);const ext=path.extname(file).slice(1).toLowerCase();return {file:path.basename(file),dataUrl:`data:image/${ext==='jpg'?'jpeg':ext};base64,${bytes.toString('base64')}`};},true);
const primaryInstance=app.requestSingleInstanceLock();if(!primaryInstance)app.quit();
else app.whenReady().then(async()=>{
 await updates.load();
 await cloud.load();try{await passwordTransaction.load();if(passwordTransaction.pending){try{await passwordTransaction.finish(cloud);await cloud.load();}catch{loginNotice='Reconnect to Google to finish your password change. Your encrypted vault is preserved.';}}}catch(error){loginNotice=error.message;}cloudReady=cloud.status().connected;
 try{await fs.access(vaultPath());hasVault=true;}catch{}
 if(hasVault&&!passwordTransaction.pending&&await updateSession.exists()){try{const saved=await updateSession.load();try{const vault=core.envelope(await fs.readFile(vaultPath(),'utf8'));if(!saved.salt.equals(vault.salt))throw Error('Saved login no longer matches this vault.');const opened=core.decodeVaultWithKey(vault,saved.key);key=Buffer.from(saved.key);salt=saved.salt;accounts=opened.accounts;deletions=opened.deletions;folders=opened.folders;backup=opened.backup;security=opened.security;resumeCloudSync();}finally{saved.key.fill(0);}}catch{lock();loginNotice='Saved login could not be restored. Enter your vault password to continue.';}finally{await updateSession.forget();}}
 rememberedLogin=await remembered.exists();if(rememberedLogin&&!passwordTransaction.pending){try{await resumeLogin();}catch{await remembered.forget();rememberedLogin=false;loginNotice='Saved login could not be restored. Enter your vault password to continue.';}}
 try{const saved=JSON.parse(await fs.readFile(prefPath(),'utf8'));preferences={dark:saved.dark===true,layout:saved.layout==='compact'?'compact':'cards',autoLock:[0,1,5,15].includes(saved.autoLock)?saved.autoLock:5,language:i18n.normalizeLanguage(saved.language),trayAccountId:typeof saved.trayAccountId==='string'?saved.trayAccountId:'',backupReminderDays:[0,7,14,30].includes(saved.backupReminderDays)?saved.backupReminderDays:0,closeBehavior:['ask','tray','exit'].includes(saved.closeBehavior)?saved.closeBehavior:'ask'};}catch{}
 Menu.setApplicationMenu(null);
 win=new BrowserWindow({title:'Glacia Authenticator',titleBarStyle:'hidden',titleBarOverlay:false,icon:path.join(__dirname,'winterbell.ico'),show:!startupLaunch,width:1150,height:930,minWidth:780,minHeight:650,backgroundColor:preferences.dark?'#101e2c':'#f3f8fc',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,devTools:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
 const sendWindowState=()=>win.webContents.send('winterbell:window-state',windowState());
 win.on('maximize',sendWindowState);win.on('unmaximize',sendWindowState);
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 await win.loadFile(path.join(__dirname,'index.html'));
 trayController=createTrayController({app,Tray,Menu,BrowserWindow,screen,mainWindow:win,baseDirectory:__dirname,getLanguage:()=>preferences.language,onExit:()=>exitGracefully().catch(()=>{}),onNavigate:page=>win.webContents.send('winterbell:navigate',page)});
 win.on('close',event=>{if(!quitting){event.preventDefault();requestClose().catch(()=>{closePrompt=false;});}});
 if(startupLaunch)trayController.hideMain();try{startup.upgrade();}catch{/* Keep a user-disabled startup entry disabled. */}
 win.on('closed',()=>{if(!quitting)app.quit();});
 powerMonitor.on('lock-screen',lock);powerMonitor.on('suspend',lock);
 setInterval(()=>{if(key&&!rememberedLogin&&preferences.autoLock>0&&Date.now()-lastActivity>preferences.autoLock*60000)lock();},5000).unref();
 setInterval(()=>{if(key&&cloud.status().enabled)scheduleSync();},60000).unref();
 // Only the primary process's initial launch checks; tray restore and second-instance do not.
 updates.startup();
});
app.on('second-instance',()=>trayController?.openMain());
app.on('before-quit',()=>{quitting=true;lock();trayController?.dispose();});
app.on('window-all-closed',()=>{lock();app.quit();});
