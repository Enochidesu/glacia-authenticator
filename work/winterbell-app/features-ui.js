'use strict';
window.createGlaciaExtras=function({root,api,icon,icons,safe,getStatus,getPage,setStatus,go,modal,closeModal,toast}){
 const q=selector=>root.querySelector(selector),builtins=[{id:'personal',name:'Personal',color:'purple'},{id:'work',name:'Work',color:'blue'}];
 const colors={blue:'Blue',purple:'Purple',green:'Green',amber:'Amber',rose:'Rose',slate:'Slate'};
 let folderSignature='',badgeSignature='',backupSignature='',dismissed=false,lastBackup=null;
 const folders=()=>getStatus().locked?builtins:getStatus().folders||builtins;
 const name=folder=>`<span ${folder.id.startsWith('folder-')?'data-i18n-skip':''}>${safe(folder.name)}</span>`;
 function folderOptions(selected){return folders().map(folder=>`<option value="${folder.id}" ${folder.id.startsWith('folder-')?'data-i18n-skip':''} ${folder.id===selected?'selected':''}>${safe(folder.name)}</option>`).join('');}
 function folderColor(id){return folders().find(folder=>folder.id===id)?.color||'purple';}
 function renderFolders(){
  const data=getStatus(),list=folders(),signature=JSON.stringify([list,data.accounts.map(account=>account.folder),!!data.locked]);
  if(signature===folderSignature)return;folderSignature=signature;
  q('.wb-folder-nav').innerHTML=list.map(folder=>`<button class="wb-nav-button cursor-interaction" data-page="${folder.id}"><span class="wb-folder-dot" data-folder-color="${folder.color}"></span>${name(folder)}<span class="wb-count" ${['personal','work'].includes(folder.id)?`id="wb-${folder.id}-count"`:''}>${data.accounts.filter(account=>account.folder===folder.id).length}</span></button>`).join('')+`<button class="wb-nav-button wb-manage-folders cursor-interaction" id="wb-manage-folders" ${data.locked?'disabled':''}>${icon('folder-plus')}Manage folders</button>`;
  icons();
 }
 function serviceMark(account){const logo=window.GlaciaFeatures.serviceLogo(account);return logo?`<span class="wb-service-logo" style="--wb-logo:url('assets/service-logos/${logo}.svg')" data-service-logo="${logo}"></span>`:safe(account.name.slice(0,2));}
 function updateSync(){
  const data=getStatus(),badge=window.GlaciaFeatures.syncBadge(data.cloud,data.locked,navigator.onLine),signature=JSON.stringify(badge);
  const button=q('#wb-sync-status');button.disabled=!!data.locked;
  if(signature!==badgeSignature){badgeSignature=signature;button.dataset.syncState=badge.state;button.title=badge.note;q('#wb-sync-label').textContent=badge.label;q('#wb-sync-icon').innerHTML=`<i data-lucide="${badge.icon}" aria-hidden="true"></i>`;icons();}
 }
 function backupPanel(){
  const data=getStatus();return `<section class="wb-page wb-backup-status"><div class="wb-backup-heading"><div>${icon('archive')}<h2>Backup status</h2></div><button class="wb-secondary cursor-interaction" data-export>Create a backup</button></div><div class="wb-backup-details"><div><strong>Last encrypted backup</strong><p id="wb-backup-date"></p></div><p id="wb-backup-change"></p></div><div class="wb-setting-row"><div><strong>Backup reminder</strong><p>Show a gentle reminder in Glacia when a backup is due.</p></div><select id="wb-backup-reminder-days" aria-label="Backup reminder">${[0,7,14,30].map(days=>`<option value="${days}" ${days===(data.preferences.backupReminderDays||0)?'selected':''}>${days?'Every '+days+' days':'Off'}</option>`).join('')}</select></div></section>`;
 }
 function updateBackup(){
  const data=getStatus(),backup=data.backup||{};
  if(lastBackup!==backup.lastAt){lastBackup=backup.lastAt;dismissed=false;}
  q('#wb-backup-reminder').hidden=!!data.locked||!backup.due||dismissed;
  const signature=JSON.stringify([backup,data.preferences.backupReminderDays]),date=q('#wb-backup-date');
  if(date&&(signature!==backupSignature||!date.textContent)){
   backupSignature=signature;
   if(backup.lastAt){date.dataset.i18nDate=backup.lastAt;date.textContent=new Date(backup.lastAt).toLocaleString(data.preferences.language);}
   else{delete date.dataset.i18nDate;date.textContent='No backup recorded on this PC.';}
   q('#wb-backup-change').textContent=backup.lastAt?(backup.changed?'Changes since your last backup.':'No changes since this backup.'):'Create an encrypted backup you can restore on another PC.';
  }
 }
 function manageFolders(){
  const data=getStatus();modal('Manage folders',`<div class="wb-folder-list">${folders().map(folder=>`<div class="wb-folder-row"><span class="wb-folder-dot" data-folder-color="${folder.color}"></span>${name(folder)}<span class="wb-folder-row-actions">${folder.id.startsWith('folder-')?`<button class="wb-icon-button cursor-interaction" data-edit-folder="${folder.id}" aria-label="Edit folder">${icon('pencil')}</button><button class="wb-icon-button wb-folder-remove cursor-interaction" data-remove-folder="${folder.id}" aria-label="Delete folder">${icon('trash-2')}</button>`:'<span class="wb-folder-builtin">Built-in</span>'}</span></div>`).join('')}</div><button class="wb-primary cursor-interaction" data-create-folder ${folders().length>=102?'disabled':''}>${icon('folder-plus')}Create a folder</button>`,'folders');
 }
 function editFolder(id){
  const folder=id?folders().find(folder=>folder.id===id):{name:'',color:'blue'};if(!folder)return;
  modal(id?'Edit folder':'Create a folder',`<label>Folder name<input id="wb-folder-name" value="${safe(folder.name)}" maxlength="60" autocomplete="off" placeholder="For example, Gaming" required></label><label>Folder color<select id="wb-folder-color">${Object.entries(colors).map(([color,label])=>`<option value="${color}" ${color===folder.color?'selected':''}>${label}</option>`).join('')}</select></label><div class="wb-folder-preview">${icon('folder')}<span class="wb-folder-dot" id="wb-folder-color-preview" data-folder-color="${folder.color}"></span><span>Folder preview</span></div><button class="wb-primary cursor-interaction" data-save-folder="${id||''}">Save folder</button>`,'folder-edit');q('#wb-folder-name').focus();
 }
 function removeFolder(id){
  const folder=folders().find(folder=>folder.id===id);if(!folder)return;
  modal('Delete folder?',`<p><strong data-i18n-skip>${safe(folder.name)}</strong></p><p>Accounts in this folder will move to Personal. No authenticators will be deleted.</p><div class="wb-delete-actions"><button class="wb-secondary cursor-interaction" data-close-modal>Cancel</button><button class="wb-danger cursor-interaction" data-delete-folder="${id}">Delete folder</button></div>`,'folder-delete');
 }
 function renderHelp(){
  q('#wb-tools-view').innerHTML=`<section class="wb-page wb-help-page"><h2>A little guidance, whenever you need it.</h2>
   <details open><summary class="cursor-interaction">Add or import your authenticators</summary><p>Use Add authenticator for a setup key, setup link, or QR image.</p><p>For Google Authenticator, open Transfer accounts on your phone, then Export accounts. Import a clear image of every transfer QR page into Glacia and review the accounts before saving.</p><p>Google sign-in syncs Glacia backups. It does not import your phone’s Google Authenticator cloud data.</p><button class="wb-secondary cursor-interaction" data-open-add>Add authenticator</button></details>
   <details><summary class="cursor-interaction">Back up and move to another PC</summary><ol><li>Export an encrypted Glacia backup on your old PC.</li><li>Keep the backup file and its backup password somewhere you can access if this PC is lost.</li><li>On the new PC, create or unlock a local vault, then choose Import accounts and select your backup.</li><li>Enter the backup password, review the accounts, and import them.</li></ol><p>Import merges accounts and skips duplicates. An encrypted backup preserves your custom folders.</p><button class="wb-secondary cursor-interaction" data-page="backup">Open Import / Export</button></details>
   <details><summary class="cursor-interaction">Restore a Google cloud backup</summary><p>On a new PC, sign in with the same Google account and choose Restore a Glacia cloud backup. Select your cloud vault and enter its sync password.</p><p>You can choose a different local vault password on the new PC. With an existing local vault, unlock it, connect the same Google account, and unlock sync to merge your accounts.</p><p>Keep an independent encrypted backup, even when Google sync is on.</p><button class="wb-secondary cursor-interaction" data-page="cloud">Open Google sync</button></details>
   <details><summary class="cursor-interaction">Understand your passwords</summary><dl><dt>Vault password</dt><dd>Unlocks the local vault on this PC. Use at least 6 characters.</dd><dt>Sync password</dt><dd>Protects your Google cloud backups. Use the same sync password on each PC, with at least 12 characters.</dd><dt>Backup password</dt><dd>Protects an exported backup file. Use at least 12 characters and keep it for restoring that file.</dd></dl><p>These passwords can be different. Glacia cannot recover forgotten passwords, and Google sign-in cannot decrypt a backup by itself.</p></details>
   <details><summary class="cursor-interaction">Lock, sign out, and disconnect</summary><p>The top lock button locks your vault while keeping Google signed in. Unlock the vault to continue.</p><p>Sign Out locks the vault and removes the saved Google sign-in and saved vault login. Signing in again with the same Google account resumes its saved sync after you unlock the vault.</p><p>Disconnect Google stops syncing on this PC. Your local accounts and existing encrypted cloud copies remain available.</p></details>
   <details><summary class="cursor-interaction">Offline codes and sign-in problems</summary><p>Your codes work offline. Google sync retries while Glacia is open, unlocked, and online.</p><p>If a code is rejected, check that Windows date, time, and time zone are correct. Wait for a fresh code and try again.</p><p>Service logos help you recognize an account. Accounts without a supported logo show their initials.</p></details>
  </section>`;icons();
 }
 function handleAction(button){
  if(button.id==='wb-sync-status'){go('cloud');return true;}
  if(button.hasAttribute('data-dismiss-backup')){dismissed=true;updateBackup();return true;}
  if(button.id==='wb-manage-folders'){manageFolders();return true;}
  if(button.hasAttribute('data-create-folder')){editFolder();return true;}
  if(button.dataset.editFolder){editFolder(button.dataset.editFolder);return true;}
  if(button.dataset.removeFolder){removeFolder(button.dataset.removeFolder);return true;}
  if(button.hasAttribute('data-save-folder')){return (async()=>{const input=q('#wb-folder-name');if(!input.reportValidity())return true;const result=await api.saveFolder({id:button.dataset.saveFolder||undefined,name:input.value,color:q('#wb-folder-color').value});closeModal();setStatus(result.status);toast('Folder saved.');return true;})();}
  if(button.dataset.deleteFolder){return (async()=>{const data=await api.deleteFolder({id:button.dataset.deleteFolder});closeModal();setStatus(data);toast('Folder removed. Your authenticators are safe.');return true;})();}
  return false;
 }
 function handleChange(target){
  if(target.id==='wb-folder-color'){q('#wb-folder-color-preview').dataset.folderColor=target.value;return true;}
  if(target.id==='wb-backup-reminder-days'){return (async()=>{const preferences=await api.preferences({backupReminderDays:Number(target.value)});getStatus().preferences=preferences;const data=await api.status();getStatus().backup=data.backup;updateBackup();toast('Backup reminder updated.');return true;})();}
  return false;
 }
 window.addEventListener('online',updateSync);window.addEventListener('offline',updateSync);
 return {folders,folderOptions,folderColor,renderFolders,serviceMark,updateSync,backupPanel,updateBackup,renderHelp,handleAction,handleChange};
};
