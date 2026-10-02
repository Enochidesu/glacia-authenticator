'use strict';
window.createGlaciaUpdates=({root,api,safe,icons})=>{
 const q=s=>root.querySelector(s);
 let state=null,previousFocus=null,active=false,pending=false,lastNotice='';
 const shade=document.createElement('div');shade.className='wb-modal-shade wb-update-shade';shade.hidden=true;
 shade.innerHTML='<section class="wb-modal wb-update-dialog" role="dialog" aria-modal="true" aria-labelledby="wb-update-title"></section>';
 root.append(shade);
 const t=text=>window.GlaciaI18n.translate(text,document.documentElement.lang||'en');
 function message(){return {idle:'Checks GitHub for a newer version of Glacia.',checking:'Checking for updates…',current:'You have the latest available version.',available:'A new update is available.',downloading:'Downloading update…',ready:'Your update is ready.',installing:'Restarting Glacia to install the update…',error:state?.error,unavailable:state?.error}[state?.phase]||'';}
 function button(action,label,primary=false,disabled=false){return `<button class="${primary?'wb-primary':'wb-secondary'} cursor-interaction" data-update-action="${action}" ${disabled?'disabled':''}>${label}</button>`;}
 function settings(){
  if(!state)return;const page=q('#wb-tools-view .wb-page');if(!page)return;
  let panel=q('#wb-update-settings');if(!panel){panel=document.createElement('div');panel.id='wb-update-settings';const about=page.querySelector('.wb-about-row');page.insertBefore(panel,about);}
  const working=['checking','downloading','installing'].includes(state.phase);
  panel.innerHTML=`<div class="wb-setting-row"><div><strong>App updates</strong><p><span>Current version:</span> <span data-i18n-skip>${safe(state.currentVersion)}</span></p><p role="status">${safe(message())}</p>${!state.installSupported&&state.supported?'<p>Install Glacia with its installer to enable automatic installation.</p>':''}</div>${button('check','Check for updates',false,working)}</div><div class="wb-setting-row"><div><strong>Check when Glacia starts</strong><p>Checks after a fresh launch, without downloading automatically.</p></div><button class="wb-startup-toggle cursor-interaction" data-update-action="autoCheck" role="switch" aria-label="Check when Glacia starts" aria-checked="${state.settings.autoCheck}" data-on="${state.settings.autoCheck}" ${working?'disabled':''}><span>${state.settings.autoCheck?'On':'Off'}</span><span class="wb-switch" aria-hidden="true"></span></button></div><div class="wb-setting-row"><div><strong>Include pre-release updates</strong><p>Receive testing versions as well as stable releases.</p></div><button class="wb-startup-toggle cursor-interaction" data-update-action="includePrerelease" role="switch" aria-label="Include pre-release updates" aria-checked="${state.settings.includePrerelease}" data-on="${state.settings.includePrerelease}" ${working?'disabled':''}><span>${state.settings.includePrerelease?'On':'Off'}</span><span class="wb-switch" aria-hidden="true"></span></button></div>`;
  icons();
 }
 function hide(){shade.hidden=true;active=false;q('.wb-shell').inert=!q('#wb-modal-shade').hidden;if(previousFocus?.isConnected)previousFocus.focus();}
 function render(){
  if(!state)return;
  if(q('#wb-update-settings'))settings();
  if(!state.prompt){if(active)hide();return;}
  if(!q('#wb-modal-shade').hidden||document.hidden)return;
  const show=['available','downloading','ready','installing','error','unavailable'].includes(state.phase);
  if(!show){if(active)hide();return;}
  const phase=state.phase;
  if(!active){previousFocus=document.activeElement;active=true;shade.hidden=false;}
  q('.wb-shell').inert=true;
  // Progress changes must not replace the focused Cancel button every tick.
  const dialog=shade.querySelector('section');
  if(dialog.dataset.phase===phase&&['downloading','installing'].includes(phase)){
   const progress=dialog.querySelector('progress');if(progress){progress.value=state.percent;dialog.querySelector('[data-update-percent]').textContent=state.percent+'%';}return;
  }
  const title={available:'A new update is available.',downloading:'Downloading update…',ready:'Your update is ready.',installing:'Restarting Glacia to install the update…',error:'Update could not be completed.',unavailable:'App updates'}[phase];
  let body=`<p><span>Current version:</span> <span data-i18n-skip>${safe(state.currentVersion)}</span>${state.version?`<br><span>New version:</span> <span data-i18n-skip>${safe(state.version)}</span>`:''}</p>`;
  if(phase==='available')body+=`<p>Glacia will download the update, then ask you to restart. Your vault and settings will be kept.</p>${!state.installSupported?'<p>Install Glacia with its installer to enable automatic installation.</p>':''}<div class="wb-update-actions">${button('download','Update',true,!state.installSupported)}${button('later','Remind me later')}${button('cancel','Cancel')}</div>`;
  else if(phase==='downloading')body+=`<progress max="100" value="${state.percent}" aria-label="Download progress"></progress><p data-update-percent>${state.percent}%</p><div class="wb-update-actions">${button('cancelDownload','Cancel download')}</div>`;
  else if(phase==='ready')body+=`<p>Restart Glacia to finish installing the update.</p><div class="wb-update-actions">${button('install','Restart & update',true)}${button('later','Remind me later')}${button('cancel','Cancel')}</div>`;
  else if(phase==='installing')body+='<p>Finishing current work before restarting.</p>';
  else body+=`<p role="alert">${safe(message())}</p><div class="wb-update-actions">${button('check','Try again',true,phase==='unavailable')}${button('cancel','Cancel')}</div>`;
  dialog.dataset.phase=phase;dialog.innerHTML=`<h2 id="wb-update-title">${title}</h2>${body}`;icons();dialog.querySelector('button')?.focus();
 }
 function receive(next){state=next;render();if(next.phase==='current'&&pending&&lastNotice!==next.phase){q('#wb-toast').textContent=t('You have the latest available version.');q('#wb-toast').hidden=false;setTimeout(()=>q('#wb-toast').hidden=true,3500);}lastNotice=next.phase;}
 root.addEventListener('click',async event=>{
  const target=event.target.closest('[data-update-action]');if(!target)return;event.stopImmediatePropagation();event.preventDefault();if(target.disabled)return;
  const action=target.dataset.updateAction;target.disabled=true;
  try{
   if(action==='check'){pending=true;receive(await api.updateCheck());}
   else if(action==='autoCheck'||action==='includePrerelease'){receive(await api.updateSettings({[action]:!state.settings[action]}));}
   else if(action==='download')receive(await api.updateDownload());
   else if(action==='install')receive(await api.updateInstall());
   else if(action==='cancelDownload')receive(await api.updateCancelDownload());
   else receive(await api.updateDismiss({action}));
  }catch{q('#wb-toast').textContent=t('Could not complete the update. Check your internet connection and try again.');q('#wb-toast').hidden=false;}
  finally{pending=false;if(target.isConnected)target.disabled=false;}
 },true);
 root.addEventListener('keydown',event=>{
  if(!active)return;event.stopImmediatePropagation();
  if(event.key==='Escape'){event.preventDefault();if(!['downloading','installing'].includes(state.phase))api.updateDismiss({action:'cancel'}).then(receive);}
  if(event.key==='Tab'){const buttons=[...shade.querySelectorAll('button:not(:disabled)')];if(!buttons.length){event.preventDefault();return;}const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 },true);
 api.onUpdateChanged(receive);
 api.onLocked(()=>setTimeout(render,0));
 api.onLanguageChanged(()=>{shade.querySelector('section').dataset.phase='';render();});
 document.addEventListener('visibilitychange',render);
 const observer=new MutationObserver(()=>{if(state?.prompt)render();});observer.observe(q('#wb-modal-shade'),{attributes:true,attributeFilter:['hidden']});
 api.updateStatus().then(receive).catch(()=>{});
 return {renderSettings:settings};
};
