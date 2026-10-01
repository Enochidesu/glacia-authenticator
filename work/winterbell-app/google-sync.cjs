'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const core=require('./core.cjs');
const folders=require('./folders.cjs');
const DRIVE='https://www.googleapis.com/drive/v3/files',UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
const SCOPE='openid email https://www.googleapis.com/auth/drive.appdata';
const MAX_BYTES=3*1048576;
function credentials(text){
 let raw;try{raw=JSON.parse(text);}catch{throw Error('Choose the OAuth JSON downloaded from Google Cloud.');}
 const c=raw.installed;
 if(!c||typeof c.client_id!=='string'||!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(c.client_id)||typeof c.client_secret!=='string'||!c.client_secret||c.client_secret.length>512)throw Error('Choose a Google OAuth client of type Desktop app.');
 return {clientId:c.client_id,clientSecret:c.client_secret};
}
function mergeCloud(local,remote,localDeletions=local.deletions??[],remoteDeletions=remote.deletions??[],localFolders=local.folders??[],remoteFolders=remote.folders??[]){
 const deletions=core.mergeDeletions(localDeletions,remoteDeletions);
 const folderRecords=folders.merge(localFolders,remoteFolders);
 const map=new Map(local.map(a=>[core.fingerprint(a),a]));
 for(const raw of remote){const record=core.normalize(raw),f=core.fingerprint(record),old=map.get(f);
  const stamp=a=>Number.isSafeInteger(a.updatedAt)?a.updatedAt:0;
  if(!old)map.set(f,record);
  else if(stamp(record)>stamp(old)||(stamp(record)===stamp(old)&&JSON.stringify([record.folder,record.favorite,record.displayName||''])>JSON.stringify([old.folder,old.favorite,old.displayName||''])))map.set(f,{...record,id:old.id});
 }
 const accounts=folders.reconcile(core.applyDeletions([...map.values()],deletions),folderRecords);if(accounts.length>2000)throw Error('The combined vault exceeds 2000 accounts. Export a backup before reorganizing it.');Object.defineProperties(accounts,{deletions:{value:deletions},folders:{value:folderRecords}});return accounts;
}
function signature(accounts,deletions=accounts.deletions??[],folderRecords=accounts.folders??[]){return JSON.stringify([core.mergeDeletions(deletions),accounts.map(a=>[core.fingerprint(a),a.displayName||'',a.folder,a.favorite,a.updatedAt||0]).sort((a,b)=>a[0].localeCompare(b[0])),folders.merge(folderRecords)]);}
async function bodyText(response){
 const length=Number(response.headers.get('content-length')||0);if(length>MAX_BYTES)throw Error('Cloud data is too large.');
 const reader=response.body?.getReader();if(!reader)return '';
 const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('Cloud data is too large.');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
 return Buffer.concat(chunks).toString('utf8');
}
// Keep a non-authenticating sync target so re-signing in on this PC reuses its vault.
function syncTarget(raw){
 if(!raw||typeof raw.sub!=='string'||!raw.sub||typeof raw.device!=='string'||!/^[a-f0-9-]{36}$/.test(raw.device))return null;
 const validVault=raw.vaultId==='legacy'||(typeof raw.vaultId==='string'&&/^[a-f0-9-]{36}$/.test(raw.vaultId));
 return {sub:raw.sub,device:raw.device,...(validVault?{vaultId:raw.vaultId,vaultName:typeof raw.vaultName==='string'?raw.vaultName:'Original Glacia vault'}:{})};
}
const i18n=require('./i18n.js');
function syncUnlockContext(config,tokens){return tokens&&config?{sub:tokens.sub,vaultId:tokens.vaultId||'legacy',clientId:config.clientId,device:tokens.device,vaultName:tokens.vaultName||'Original Glacia vault'}:null;}
function syncUnlockAAD(context){return Buffer.from(JSON.stringify(['Glacia:sync-unlock:1',context.sub,context.vaultId,context.clientId,context.device]));}
function syncUnlockKey(vaultKey){if(!Buffer.isBuffer(vaultKey)||vaultKey.length!==32)throw Error('Unlock Glacia first.');return Buffer.from(crypto.hkdfSync('sha256',vaultKey,Buffer.alloc(0),'Glacia:sync-unlock:1',32));}
function syncUnlockRecord(raw){
 if(!raw||raw.version!==1||!syncTarget(raw)?.vaultId||typeof raw.clientId!=='string')return null;
 for(const [field,min,max] of [['iv',12,12],['tag',16,16],['ciphertext',12,4096]]){const text=raw[field];if(typeof text!=='string'||text.length>Math.ceil(max/3)*4)return null;const bytes=Buffer.from(text,'base64');if(bytes.length<min||bytes.length>max||bytes.toString('base64')!==text)return null;}
 return {version:1,sub:raw.sub,vaultId:raw.vaultId,clientId:raw.clientId,device:raw.device,vaultName:typeof raw.vaultName==='string'?raw.vaultName:'Original Glacia vault',iv:raw.iv,tag:raw.tag,ciphertext:raw.ciphertext};
}
class GoogleSync {
 constructor({directory,safeStorage,openExternal,fetchImpl=fetch,onChange=()=>{},defaultConfig=null,developerSetup=true,getLanguage=()=> 'en'}){Object.assign(this,{directory,safeStorage,openExternal,fetchImpl,onChange,developerSetup,getLanguage});this.config=defaultConfig;this.tokens=null;this.target=null;this.savedSync=null;this.passphrase=null;this.controller=null;this.authController=null;this.connecting=false;this.syncing=false;this.error='';this.lastSync=null;this.published=null;this.localRevision=null;}
 get file(){return path.join(this.directory,'google-sync.secure');}
 hasRememberedSync(){const context=syncUnlockContext(this.config,this.tokens);return !!context&&!!this.savedSync&&['sub','vaultId','clientId','device'].every(field=>context[field]===this.savedSync[field]);}
 status(){return {configured:!!this.config,developerSetup:this.developerSetup,connected:!!this.tokens,email:this.tokens?.email||'',vaultId:this.tokens?.vaultId||'legacy',vaultName:this.tokens?.vaultName||'Original Glacia vault',connecting:this.connecting,enabled:!!this.passphrase,rememberedSync:this.hasRememberedSync(),syncing:this.syncing,error:this.error,lastSync:this.lastSync};}
 changed(){this.onChange(this.status());}
 async load(){
  try{if(!this.safeStorage.isEncryptionAvailable())return;const bytes=await fs.readFile(this.file);const data=JSON.parse(this.safeStorage.decryptString(bytes));
   if(data?.version===1&&data.config&&typeof data.config.clientId==='string'){this.config=data.config;this.tokens=data.tokens||null;this.target=syncTarget(data.target)||syncTarget(this.tokens);this.savedSync=syncUnlockRecord(data.syncUnlock);}
  }catch(error){if(error.code!=='ENOENT')this.error='Saved Google sign-in could not be opened. Please sign in again.';}
 }
 async persist(){
  if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows secure token storage is unavailable.');
  await fs.mkdir(this.directory,{recursive:true});if(this.tokens)this.target=syncTarget(this.tokens);const bytes=this.safeStorage.encryptString(JSON.stringify({version:1,config:this.config,tokens:this.tokens,target:this.target,syncUnlock:this.savedSync}));
  const temp=this.file+'.tmp';await fs.writeFile(temp,bytes,{mode:0o600});await fs.rename(temp,this.file);
 }
 async configure(text){if(!this.developerSetup)throw Error('Google setup is provided by Glacia.');if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows secure token storage is unavailable.');if(this.tokens)throw Error('Disconnect Google before changing the OAuth client.');if(this.connecting)throw Error('Cancel Google sign-in first.');const previous=this.config;this.config=credentials(text);try{await this.persist();}catch(error){this.config=previous;throw error;}this.error='';this.changed();return this.status();}
 async request(url,options={},signal){
  const response=await this.fetchImpl(url,{...options,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(25000)]):AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok){await response.body?.cancel().catch(()=>{});if(response.status===401)throw Error('Google sign-in expired. Disconnect and sign in again.');if(response.status===403)throw Error('Google did not allow syncing. Try signing in again. If this continues, contact Glacia support.');throw Error(`Google request failed (${response.status}). Try syncing again.`);}
  return bodyText(response);
 }
 async form(url,fields,signal){return JSON.parse(await this.request(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString()},signal));}
 async signIn(){
  if(!this.config)throw Error('Google sign-in is unavailable in this build.');if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows secure token storage is unavailable.');if(this.tokens)throw Error('Google is already connected.');if(this.connecting)return this.status();
  this.connecting=true;this.error='';this.authController=new AbortController();this.changed();
  const signal=this.authController.signal;
  this.authTask=this.authorize(signal).catch(error=>{if(!signal.aborted)this.error=error.message;}).finally(()=>{this.connecting=false;this.authController=null;this.changed();});
  return this.status();
 }
 async authorize(signal){
  const config={...this.config},verifier=crypto.randomBytes(32).toString('base64url'),state=crypto.randomBytes(32).toString('base64url');
  const challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
  let timer,server,abort,redirect;
  const code=await new Promise((resolve,reject)=>{
   const finish=(error,value)=>{clearTimeout(timer);signal.removeEventListener('abort',abort);server.close();if(error)reject(error);else resolve(value);};
   server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    if(req.method!=='GET'||url.pathname!=='/'||req.headers.host!==new URL(redirect).host){res.writeHead(404);res.end();return;}
    if(url.searchParams.get('state')!==state){res.writeHead(400);res.end('Invalid sign-in response.');return;}
    const denied=url.searchParams.has('error'),code=url.searchParams.get('code');
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'Referrer-Policy':'no-referrer'});const language=i18n.normalizeLanguage(this.getLanguage()),t=text=>i18n.translate(text,language);res.end('<!doctype html><html lang="'+language+'"><meta charset="utf-8"><title>Glacia</title><h1>'+t('Return to Glacia')+'</h1><p>'+t((denied||!code)?'Google sign-in was not completed.':'Google responded. Glacia is finishing your connection.')+'</p></html>');
    finish((denied||!code)?Error('Google sign-in was declined.'):null,code);
   });
   abort=()=>finish(Error('Google sign-in canceled.'));signal.addEventListener('abort',abort,{once:true});
   server.once('error',error=>finish(Error('Could not open the local sign-in callback.')));
   server.listen(0,'127.0.0.1',()=>{
    if(signal.aborted){abort();return;}redirect='http://127.0.0.1:'+server.address().port+'/';
    const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    for(const [name,value] of Object.entries({client_id:config.clientId,redirect_uri:redirect,response_type:'code',scope:SCOPE,code_challenge:challenge,code_challenge_method:'S256',state,access_type:'offline',prompt:'consent select_account'}))url.searchParams.set(name,value);
    timer=setTimeout(()=>finish(Error('Google sign-in timed out. Try again.')),180000);timer.unref();
    Promise.resolve(this.openExternal(url.toString())).catch(()=>finish(Error('Could not open your browser.')));
   });
  });
  const token=await this.form('https://oauth2.googleapis.com/token',{client_id:config.clientId,client_secret:config.clientSecret,code,code_verifier:verifier,redirect_uri:redirect,grant_type:'authorization_code'},signal);
  if(typeof token.access_token!=='string'||typeof token.refresh_token!=='string'||!String(token.scope||'').split(' ').includes('https://www.googleapis.com/auth/drive.appdata'))throw Error('Google did not grant offline app-data access. Sign in again and allow the requested permission.');
  const user=JSON.parse(await this.request('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token.access_token}},signal));
  if(typeof user.sub!=='string'||typeof user.email!=='string'||user.email_verified!==true)throw Error('Google account identity could not be verified.');
  if(signal.aborted)throw Error('Google sign-in canceled.');
  const target=this.target?.sub===user.sub?this.target:this.savedSync?.sub===user.sub&&this.savedSync.clientId===config.clientId?syncTarget(this.savedSync):null;
  this.tokens={accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:Date.now()+Number(token.expires_in||3600)*1000,sub:user.sub,email:user.email,device:target?.device||crypto.randomUUID(),...(target?.vaultId?{vaultId:target.vaultId,vaultName:target.vaultName}:{})};
  try{await this.persist();}catch(error){this.tokens=null;throw error;}if(signal.aborted){this.tokens=null;await this.persist();throw Error('Google sign-in canceled.');}this.changed();
 }
 cancelSignIn(){this.authController?.abort();return this.status();}
 pause(){this.passphrase?.fill(0);this.passphrase=null;this.controller?.abort();this.authController?.abort();this.published=null;this.localRevision=null;this.changed();}
 // Sign-out removes authenticating tokens. The vault-encrypted sync record
 // stays bound to its Google identity and can only reopen after vault unlock.
 async disconnect(){this.pause();await this.authTask;this.tokens=null;this.error='';this.lastSync=null;await this.persist();this.changed();return this.status();}
 async enable(password){if(!this.tokens)throw Error('Sign in with Google first.');core.passwordCheck(password);this.passphrase?.fill(0);this.passphrase=Buffer.from(password,'utf8');this.error='';this.changed();}
 // Remember only a successfully verified sync password. It is encrypted with
 // a separate key derived from the local vault key, then Windows protects the
 // existing Google session file. Google sign-in alone cannot reopen it.
 async rememberSync(vaultKey){
  if(!this.tokens||!this.passphrase)throw Error('Unlock Glacia and enable sync again.');
  const wrappingKey=syncUnlockKey(vaultKey),context=syncUnlockContext(this.config,this.tokens),previous=this.savedSync;
  try{const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',wrappingKey,iv);cipher.setAAD(syncUnlockAAD(context));const ciphertext=Buffer.concat([cipher.update(this.passphrase),cipher.final()]);this.savedSync={version:1,...context,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};await this.persist();this.changed();}
  catch(error){this.savedSync=previous;throw error;}finally{wrappingKey.fill(0);}
 }
 resumeSync(vaultKey){
  if(this.passphrase)return true;if(!this.hasRememberedSync())return false;let wrappingKey,password;
  try{wrappingKey=syncUnlockKey(vaultKey);const decipher=crypto.createDecipheriv('aes-256-gcm',wrappingKey,Buffer.from(this.savedSync.iv,'base64'));decipher.setAAD(syncUnlockAAD(this.savedSync));decipher.setAuthTag(Buffer.from(this.savedSync.tag,'base64'));password=Buffer.concat([decipher.update(Buffer.from(this.savedSync.ciphertext,'base64')),decipher.final()]);core.passwordCheck(password.toString('utf8'));this.passphrase=Buffer.from(password);this.error='';this.changed();return true;}
  catch{this.error='Saved sync could not be unlocked. Enter your sync password again.';this.changed();return false;}finally{wrappingKey?.fill(0);password?.fill(0);}
 }
 async forgetSync(){const previous=this.savedSync;this.savedSync=null;try{await this.persist();}catch(error){this.savedSync=previous;this.changed();throw error;}this.changed();}
 async accessToken(signal){
  if(!this.tokens)throw Error('Sign in with Google first.');
  if(Date.now()<this.tokens.expiresAt-60000)return this.tokens.accessToken;
  const token=await this.form('https://oauth2.googleapis.com/token',{client_id:this.config.clientId,client_secret:this.config.clientSecret,refresh_token:this.tokens.refreshToken,grant_type:'refresh_token'},signal);
  if(typeof token.access_token!=='string')throw Error('Google sign-in needs to be renewed.');
  this.tokens={...this.tokens,accessToken:token.access_token,expiresAt:Date.now()+Number(token.expires_in||3600)*1000};await this.persist();return this.tokens.accessToken;
 }
 async list(headers,signal,all=false){
  let files=[],page='';do{const url=new URL(DRIVE);url.searchParams.set('spaces','appDataFolder');url.searchParams.set('q',"trashed = false and appProperties has { key='winterbell' and value='vault-v1' }");url.searchParams.set('fields','nextPageToken,files(id,name,size,appProperties)');url.searchParams.set('pageSize','100');if(page)url.searchParams.set('pageToken',page);
   const data=JSON.parse(await this.request(url.toString(),{headers},signal));if(!Array.isArray(data.files))throw Error('Invalid Drive response.');files.push(...data.files);if(files.length>100)throw Error('Too many synced devices. Keep an encrypted backup and review your Google app data.');page=data.nextPageToken||'';
  }while(page);return all?files:files.filter(file=>(file.appProperties?.vaultId||'legacy')===(this.tokens?.vaultId||'legacy'));
 }
 async discoverVaults(){if(!this.tokens)throw Error('Sign in with Google first.');const signal=AbortSignal.timeout(25000),headers={Authorization:'Bearer '+await this.accessToken(signal)},files=await this.list(headers,signal,true),groups=new Map();for(const file of files){const id=file.appProperties?.vaultId||'legacy';if(id!=='legacy'&&!/^[a-f0-9-]{36}$/.test(id))continue;if(!groups.has(id))groups.set(id,{id,name:file.appProperties?.vaultName||'Original Glacia vault'});}return [...groups.values()];}
 async selectVault(id){const groups=await this.discoverVaults(),group=groups.find(v=>v.id===id);if(!group)throw Error('That Glacia cloud backup is no longer available.');return this.setVault(group);}
 async newVault(name){if(typeof name!=='string'||!name.trim()||name.trim().length>80||/[\u0000-\u001f\u007f]/.test(name))throw Error('Enter a cloud vault name of up to 80 characters.');return this.setVault({id:crypto.randomUUID(),name:name.trim()});}
 async setVault({id,name}){if(!this.tokens)throw Error('Sign in with Google first.');this.pause();const previous=this.tokens,previousSync=this.savedSync;this.tokens={...previous,vaultId:id,vaultName:name};this.savedSync=null;try{await this.persist();}catch(error){this.tokens=previous;this.savedSync=previousSync;throw error;}this.lastSync=null;this.changed();return this.status();}
 async run(local,deletions=local.deletions??[],folderRecords=local.folders??[]){
  if(!this.passphrase||!this.tokens)throw Error('Unlock Google sync with your sync password first.');
  this.controller=new AbortController();const signal=this.controller.signal,password=Buffer.from(this.passphrase);this.syncing=true;this.error='';this.changed();
  try{
   const headers={Authorization:'Bearer '+await this.accessToken(signal)},files=await this.list(headers,signal);let combined=mergeCloud(local,[],deletions,[],folderRecords),own=null,ownContent=null;
   for(const file of files){
    if(typeof file.id!=='string'||!/^[a-zA-Z0-9_-]+$/.test(file.id)||Number(file.size)>MAX_BYTES)throw Error('Cloud vault metadata is invalid.');
    const text=await this.request(DRIVE+'/'+encodeURIComponent(file.id)+'?alt=media',{headers},signal);
    let opened;try{opened=await core.decryptBackup(text,password.toString('utf8'));}catch{throw Error('Your sync password cannot unlock the cloud vault. Use the same sync password on every computer.');}
    opened.key.fill(0);combined=mergeCloud(combined,opened.accounts,combined.deletions,opened.deletions,combined.folders,opened.folders);
    if(file.appProperties?.device===this.tokens.device){own=file;ownContent=signature(opened.accounts,opened.deletions,opened.folders);}
   }
   if(signal.aborted)throw Error('Sync paused.');const content=signature(combined);
   if(content!==ownContent){
    const encrypted=await core.encryptBackup(combined,password.toString('utf8'),combined.deletions);if(signal.aborted)throw Error('Sync paused.');if(Buffer.byteLength(encrypted)>MAX_BYTES)throw Error('Your cloud vault is too large. Save an encrypted local backup.');
    if(own)await this.request(UPLOAD+'/'+encodeURIComponent(own.id)+'?uploadType=media',{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:encrypted},signal);
    else{const boundary='winterbell_'+crypto.randomBytes(16).toString('hex');const metadata={name:'Glacia-'+this.tokens.device+'.winterbell',parents:['appDataFolder'],appProperties:{winterbell:'vault-v1',device:this.tokens.device,...(this.tokens.vaultId?{vaultId:this.tokens.vaultId,vaultName:this.tokens.vaultName}:{})}};
     const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${encrypted}\r\n--${boundary}--\r\n`;
     await this.request(UPLOAD+'?uploadType=multipart',{method:'POST',headers:{...headers,'Content-Type':'multipart/related; boundary='+boundary},body},signal);
    }
   }
   if(signal.aborted)throw Error('Sync paused.');this.published=content;this.localRevision=signature(local,deletions,folderRecords);this.lastSync=new Date().toISOString();return combined;
  }catch(error){if(!signal.aborted)this.error=error.message;throw error;}finally{password.fill(0);this.syncing=false;this.controller=null;this.changed();}
 }
}
module.exports={GoogleSync,credentials,mergeCloud,signature,SCOPE};
