'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path');
const core=require('../core.cjs'),{GoogleSync,credentials,mergeCloud,signature,SCOPE}=require('../google-sync.cjs');
const folders=require('../folders.cjs');
const work=path.resolve(__dirname,'../..');
const fixture={installed:{client_id:'1234567890-synthetic.apps.googleusercontent.com',client_secret:'synthetic-desktop-secret'}};
const secureKey=crypto.randomBytes(32),safeStorage={isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',secureKey,iv);return Buffer.concat([iv,c.getAuthTag?.length?Buffer.alloc(0):Buffer.alloc(0),c.update(text),c.final(),c.getAuthTag()]);},decryptString:bytes=>{const c=crypto.createDecipheriv('aes-256-gcm',secureKey,bytes.subarray(0,12));c.setAuthTag(bytes.subarray(-16));return Buffer.concat([c.update(bytes.subarray(12,-16)),c.final()]).toString();}};
function response(data,status=200){return new Response(typeof data==='string'?data:JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});}
function fakeGoogle(){const files=new Map(),requests=[];let writes=0,refreshes=0;const fetchImpl=async(input,options={})=>{
 const url=new URL(input);requests.push({url,options});if(options.signal?.aborted)throw options.signal.reason;
 if(url.hostname==='oauth2.googleapis.com'){refreshes++;return response({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,scope:SCOPE});}
 if(url.hostname==='openidconnect.googleapis.com')return response({sub:'synthetic-user',email:'demo@example.invalid',email_verified:true});
 if(url.pathname==='/drive/v3/files'){return response({files:[...files.values()].map(({text,...meta})=>meta)});}
 if(url.pathname.startsWith('/drive/v3/files/'))return response(files.get(url.pathname.split('/').pop()).text);
 if(url.pathname==='/upload/drive/v3/files'){
  const boundary=options.headers['Content-Type'].split('boundary=')[1];const sections=options.body.split('--'+boundary);
  const metadata=JSON.parse(sections[1].split('\r\n\r\n')[1].trim()),text=sections[2].split('\r\n\r\n')[1].trim(),id='file'+(files.size+1);files.set(id,{...metadata,id,text,size:Buffer.byteLength(text)});writes++;return response({id});
 }
 if(url.pathname.startsWith('/upload/drive/v3/files/')){const id=url.pathname.split('/').pop();files.set(id,{...files.get(id),text:options.body,size:Buffer.byteLength(options.body)});writes++;return response({id});}
 throw Error('Unexpected mock request');
 };return {files,requests,fetchImpl,get writes(){return writes;},get refreshes(){return refreshes;}};}
async function instance(google,label){const c=new GoogleSync({directory:path.join(work,'cloud-tests-'+process.pid,label),safeStorage,fetchImpl:google.fetchImpl,openExternal:async()=>{}});await c.configure(JSON.stringify(fixture));c.tokens={accessToken:'synthetic-access',refreshToken:'synthetic-refresh',expiresAt:Date.now()+3600000,sub:'synthetic-user',email:'demo@example.invalid',device:crypto.randomUUID()};await c.persist();return c;}
function record(name,updatedAt=1){return core.normalize({name,email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP',updatedAt});}
test('only Desktop OAuth JSON accepted; fixed endpoints are not read from imported JSON',()=>{assert.equal(credentials(JSON.stringify(fixture)).clientId,fixture.installed.client_id);assert.throws(()=>credentials(JSON.stringify({web:fixture.installed})));assert.throws(()=>credentials('{}'));assert.throws(()=>credentials('not JSON'));});
test('public app registration works on fresh profiles without an import and preserves existing saved connections',async()=>{
 const directory=path.join(work,'cloud-tests-'+process.pid,'public-client'),defaultConfig=credentials(JSON.stringify(fixture));
 const fresh=new GoogleSync({directory,safeStorage,defaultConfig,developerSetup:false,openExternal:async()=>{}});await fresh.load();assert.equal(fresh.status().configured,true);assert.equal(fresh.status().developerSetup,false);assert.equal(fresh.status().connected,false);assert.equal(fresh.status().clientSecret,undefined);await assert.rejects(fresh.configure(JSON.stringify(fixture)),/provided by Glacia/);
 const existing=new GoogleSync({directory,safeStorage,openExternal:async()=>{}});await existing.configure(JSON.stringify({installed:{client_id:'9999999999-previous.apps.googleusercontent.com',client_secret:'synthetic-previous'}}));
 const reopened=new GoogleSync({directory,safeStorage,defaultConfig,developerSetup:false,openExternal:async()=>{}});await reopened.load();assert.equal(reopened.config.clientId,'9999999999-previous.apps.googleusercontent.com');assert.equal(reopened.status().developerSetup,false);
});
test('two computers merge encrypted cloud snapshots, preserve settings and propagate favorite changes',async()=>{
 const google=fakeGoogle(),a=await instance(google,'a'),b=await instance(google,'b'),password='Synthetic sync password 2026';
 await a.enable(password);await b.enable(password);
 const first=record('First'),second={...record('Second'),algorithm:'SHA512',digits:8,period:60};
 let left,right;[left,right]=await Promise.all([a.run([first]),b.run([second])]);assert.equal(google.files.size,2);
 left=await a.run(left);right=await b.run(right);assert.equal(left.length,2);assert.equal(signature(left),signature(right));
 for(const file of google.files.values()){assert.equal(file.text.includes(first.secret),false);assert.equal(file.text.includes('First'),false);assert.equal(file.parents[0],'appDataFolder');const opened=await core.decryptBackup(file.text,password);opened.key.fill(0);assert.equal(opened.accounts.length,2);}
 const before=google.writes;await a.run(left);assert.equal(google.writes,before,'unchanged snapshots are not uploaded again');
 left=left.map(x=>({...x,favorite:true,updatedAt:50}));await a.run(left);right=await b.run(right);assert.equal(right.every(x=>x.favorite),true);
 const restored=await instance(google,'new-device');await restored.enable(password);const result=await restored.run([]);assert.equal(result.length,2);for(const x of result){const original=[first,second].find(y=>y.name===x.name);assert.equal(core.totp(x,123456),core.totp(original,123456));}
 a.pause();b.pause();restored.pause();
});
test('wrong password never overwrites cloud data',async()=>{const google=fakeGoogle(),a=await instance(google,'password-a'),b=await instance(google,'password-b');await a.enable('Correct synthetic sync password');await a.run([record('Account')]);const before=[...google.files.values()].map(x=>x.text),writes=google.writes;await b.enable('Incorrect synthetic sync password');await assert.rejects(()=>b.run([record('Other')]),/same sync password/);assert.equal(google.writes,writes);assert.deepEqual([...google.files.values()].map(x=>x.text),before);a.pause();b.pause();});
test('saved Google tokens are encrypted; load, refresh, pause, disconnect preserve cloud data',async()=>{const google=fakeGoogle(),c=await instance(google,'persist');const saved=await fs.readFile(c.file);assert.equal(saved.includes(Buffer.from('synthetic-refresh')),false);const restored=new GoogleSync({directory:c.directory,safeStorage,fetchImpl:google.fetchImpl,openExternal:async()=>{}});await restored.load();assert.equal(restored.status().connected,true);assert.equal(restored.status().enabled,false);restored.tokens.expiresAt=0;await restored.enable('Synthetic sync password 2026');await restored.run([record('Saved')]);assert.equal(google.refreshes,1);restored.pause();assert.equal(restored.status().enabled,false);await restored.disconnect();assert.equal(restored.status().connected,false);assert.equal(google.files.size,1);});
test('OAuth loopback validates state, uses PKCE and opens only Google system-browser sign-in',async()=>{
 const google=fakeGoogle();let verifierChallenge,language='en';
 const c=new GoogleSync({directory:path.join(work,'cloud-tests-'+process.pid,'oauth'),safeStorage,getLanguage:()=>language,fetchImpl:async(url,options)=>{if(url==='https://oauth2.googleapis.com/token'){const form=new URLSearchParams(options.body);assert.equal(crypto.createHash('sha256').update(form.get('code_verifier')).digest('base64url'),verifierChallenge);assert.equal(form.get('code'),'synthetic-code');}return google.fetchImpl(url,options);},openExternal:async input=>{const auth=new URL(input);assert.equal(auth.hostname,'accounts.google.com');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.equal(auth.searchParams.get('scope'),SCOPE);verifierChallenge=auth.searchParams.get('code_challenge');const callback=new URL(auth.searchParams.get('redirect_uri'));assert.equal(callback.hostname,'127.0.0.1');callback.searchParams.set('state','wrong');callback.searchParams.set('code','synthetic-code');assert.equal((await fetch(callback)).status,400);callback.searchParams.set('state',auth.searchParams.get('state'));language='ja';const reply=await fetch(callback);assert.equal(reply.status,200);const html=await reply.text();assert.match(html,/<html lang="ja">/);assert.match(html,/Glacia に戻る/);assert.match(html,/Glacia が接続を完了しています/);}});
 await c.configure(JSON.stringify(fixture));await c.signIn();await c.authTask;assert.equal(c.status().connected,true,c.status().error);assert.equal(c.status().email,'demo@example.invalid');assert.equal(c.status().connecting,false);await c.disconnect();
});
test('cancel OAuth closes the loopback and stores no account tokens',async()=>{const c=new GoogleSync({directory:path.join(work,'cloud-tests-'+process.pid,'cancel'),safeStorage,fetchImpl:async()=>{throw Error('No token request expected');},openExternal:async()=>c.cancelSignIn()});await c.configure(JSON.stringify(fixture));await c.signIn();await c.authTask;assert.equal(c.status().connected,false);assert.equal(c.status().connecting,false);});
test('locking during a pending network request aborts sync and clears the password',async()=>{let started;const ready=new Promise(resolve=>started=resolve);const google=fakeGoogle(),c=await instance(google,'abort');c.fetchImpl=(_url,{signal})=>new Promise((resolve,reject)=>{started();signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});await c.enable('Synthetic sync password 2026');const pending=c.run([record('Private')]);await ready;c.pause();await assert.rejects(pending);assert.equal(c.status().enabled,false);assert.equal(c.passphrase,null);assert.equal(google.files.size,0);});
test('merge is deterministic and keeps current local IDs',()=>{const a=record('Tie'),b={...a,id:crypto.randomUUID(),favorite:true};const left=mergeCloud([a],[b]),right=mergeCloud([b],[a]);assert.equal(signature(left),signature(right));assert.equal(left[0].id,a.id);});

test('Google onboarding separates new vaults and restores the chosen cloud backup by upgrading legacy sync to one Glacia password',async()=>{
 const {createGoogleVault}=require('../onboarding.cjs'),google=fakeGoogle(),original=await instance(google,'onboard-original'),password='Original sync password 2026';await original.enable(password);await original.run([record('Original key')]);const preserved=[...google.files.values()][0].text;
 const fresh=await instance(google,'onboard-fresh'),file=path.join(fresh.directory,'vault.winterbell');const created=await createGoogleVault({cloud:fresh,file,password:'Unified synthetic password',confirm:'Unified synthetic password',syncPassword:'New cloud password 2026',syncConfirm:'New cloud password 2026',mode:'new',cloudName:'New vault',isCurrent:()=>true});assert.equal(created.accounts.length,0);created.key.fill(0);await fresh.run([record('New key')]);assert.equal([...google.files.values()][0].text,preserved);assert.deepEqual((await fresh.run([])).map(r=>r.name),['New key']);
 const restore=await instance(google,'onboard-restore'),groups=await restore.discoverVaults();assert.equal(groups.length,2);assert.equal(groups.find(v=>v.id!=='legacy').name,'New vault');const restored=await createGoogleVault({cloud:restore,file:path.join(restore.directory,'vault.winterbell'),password:'Restored unified password',confirm:'Restored unified password',syncPassword:password,syncConfirm:password,mode:'cloud',vaultId:'legacy',isCurrent:()=>true});assert.deepEqual(restored.accounts.map(r=>r.name),['Original key']);restored.key.fill(0);const opened=await core.decryptBackup(await fs.readFile(path.join(restore.directory,'vault.winterbell'),'utf8'),'Restored unified password');assert.equal(opened.accounts[0].name,'Original key');opened.key.fill(0);
 await assert.rejects(()=>createGoogleVault({cloud:fresh,file,password:'Unified synthetic password',confirm:'Unified synthetic password',syncPassword:password,syncConfirm:password,mode:'new',cloudName:'Another',isCurrent:()=>true}),/already exists/);original.pause();fresh.pause();restore.pause();
});
test('a fresh PC restores an upgraded cloud vault with only the Glacia password and rejects stale concurrent password changes',async()=>{
 const {createGoogleVault}=require('../onboarding.cjs'),google=fakeGoogle(),original=await instance(google,'unified-original'),password='One unified Glacia password';const secret=Buffer.from('Synthetic internal cloud key');await original.enable(secret.toString());await original.run([record('Unified cloud account')]);await original.commitPasswordPlan(await original.passwordPlan(password,password,secret));
 const restore=await instance(google,'unified-fresh'),opened=await createGoogleVault({cloud:restore,file:path.join(restore.directory,'vault.winterbell'),password,confirm:password,mode:'cloud',vaultId:'legacy',isCurrent:()=>true});assert.equal(opened.accounts[0].name,'Unified cloud account');assert.equal(opened.security.unified,true);opened.key.fill(0);
 const first=await original.passwordPlan(password,'First new Glacia password',secret),stale=await restore.passwordPlan(password,'Other new Glacia password',secret);await original.commitPasswordPlan(first);const writes=google.writes;await assert.rejects(restore.commitPasswordPlan(stale),/changed on another/);assert.equal(google.writes,writes);await assert.rejects(restore.unifiedSecret(password));const reopened=await restore.unifiedSecret('First new Glacia password');assert.deepEqual(reopened,secret);reopened.fill(0);secret.fill(0);original.pause();restore.pause();
});
test('failed cloud restore leaves local vault absent and never overwrites remote accounts',async()=>{
 const {createGoogleVault}=require('../onboarding.cjs'),google=fakeGoogle(),original=await instance(google,'onboard-failed-original'),password='Correct sync password 2026';await original.enable(password);await original.run([record('Keep this key')]);const copy=[...google.files.values()][0].text,writes=google.writes,restore=await instance(google,'onboard-failed-restore'),file=path.join(restore.directory,'vault.winterbell'),options={cloud:restore,file,password:'Unified synthetic password',confirm:'Unified synthetic password',syncPassword:'Incorrect password 2026',syncConfirm:'Incorrect password 2026',mode:'cloud',vaultId:'legacy',isCurrent:()=>true};await assert.rejects(()=>createGoogleVault(options),/same sync password/);assert.equal(google.writes,writes);assert.equal([...google.files.values()][0].text,copy);await assert.rejects(()=>fs.access(file));assert.equal(restore.status().enabled,false);
 await assert.rejects(()=>createGoogleVault({...options,syncPassword:password,syncConfirm:password,isCurrent:()=>false}),/canceled/);await assert.rejects(()=>fs.access(file));original.pause();restore.pause();
});

test('delete propagates between devices and cloud restoration cannot revive a stale key',async()=>{
 const google=fakeGoogle(),a=await instance(google,'delete-a'),b=await instance(google,'delete-b'),password='Synthetic deletion sync password';await a.enable(password);await b.enable(password);
 const target=record('Delete me'),keep=record('Keep me');let left=await a.run([target,keep]),right=await b.run([]);
 const removed=core.deleteAccount(left,[],left.find(x=>x.name==='Delete me').id);left=await a.run(removed.accounts,removed.deletions);
 assert.deepEqual(left.map(x=>x.name),['Keep me']);right=await b.run(right);assert.equal(signature(left),signature(right));
 left=await a.run(left);assert.deepEqual(left.map(x=>x.name),['Keep me']);
 const c=await instance(google,'delete-restore');await c.enable(password);const restored=await c.run([]);assert.equal(signature(restored),signature(left));
 // Restore onboarding must retain the deletion history in the local encrypted vault.
 const {createGoogleVault}=require('../onboarding.cjs'),d=await instance(google,'delete-onboard'),file=path.join(d.directory,'vault.winterbell');
 const opened=await createGoogleVault({cloud:d,file,password:'Unified synthetic password',confirm:'Unified synthetic password',syncPassword:password,syncConfirm:password,mode:'cloud',vaultId:'legacy',isCurrent:()=>true});
 assert.equal(opened.deletions.length,1);const saved=await core.decryptBackup(await fs.readFile(file,'utf8'),'Unified synthetic password');assert.equal(saved.deletions.length,1);assert.equal(saved.accounts.length,1);opened.key.fill(0);saved.key.fill(0);
 for(const device of [a,b,c,d])device.pause();
});

test('signing out removes persisted Google tokens but re-signing in as the same user reuses the sync target',async()=>{
 const google=fakeGoogle(),directory=path.join(work,'cloud-tests-'+process.pid,'signout-target');let user='synthetic-user';
 const fetchImpl=async(input,options)=>new URL(input).hostname==='openidconnect.googleapis.com'?response({sub:user,email:user+'@example.invalid',email_verified:true}):google.fetchImpl(input,options);
 const openExternal=async input=>{const auth=new URL(input),callback=new URL(auth.searchParams.get('redirect_uri'));callback.searchParams.set('state',auth.searchParams.get('state'));callback.searchParams.set('code','synthetic-code');const reply=await fetch(callback);assert.equal(reply.status,200);assert.match(await reply.text(),/<html lang="en">/);};
 const c=new GoogleSync({directory,safeStorage,fetchImpl,openExternal});await c.configure(JSON.stringify(fixture));await c.signIn();await c.authTask;await c.newVault('My synthetic vault');const original={device:c.tokens.device,vaultId:c.tokens.vaultId};
 await c.disconnect();const stored=JSON.parse(safeStorage.decryptString(await fs.readFile(c.file)));assert.equal(stored.tokens,null);assert.deepEqual(Object.keys(stored.target).sort(),['device','sub','vaultId','vaultName']);assert.equal(stored.config.clientId,fixture.installed.client_id);
 const reopened=new GoogleSync({directory,safeStorage,fetchImpl,openExternal});await reopened.load();assert.equal(reopened.status().connected,false);assert.equal(reopened.status().configured,true);
 await reopened.signIn();await reopened.authTask;assert.equal(reopened.status().connected,true);assert.equal(reopened.tokens.device,original.device);assert.equal(reopened.status().vaultId,original.vaultId);
 await reopened.disconnect();user='different-user';await reopened.signIn();await reopened.authTask;assert.notEqual(reopened.tokens.device,original.device);assert.equal(reopened.status().vaultId,'legacy');await reopened.disconnect();
});

test('remembered sync stays encrypted and resumes only with the unlocked local vault key',async()=>{
 const google=fakeGoogle(),c=await instance(google,'remember-sync'),key=crypto.randomBytes(32),password='Synthetic remembered sync password';
 await c.enable(password);await c.run([record('Remembered sample')]);await c.rememberSync(key);
 const bytes=await fs.readFile(c.file),stored=JSON.parse(safeStorage.decryptString(bytes));
 assert.equal(bytes.includes(Buffer.from(password)),false);assert.equal(JSON.stringify(stored).includes(password),false);assert.equal(JSON.stringify(stored).includes(key.toString('base64')),false);
 assert.deepEqual(Object.keys(stored.syncUnlock).sort(),['ciphertext','clientId','device','iv','sub','tag','vaultId','vaultName','version']);
 const oldPassword=c.passphrase;c.pause();assert.ok(oldPassword.every(byte=>byte===0));assert.equal(c.status().rememberedSync,true);
 const reopened=new GoogleSync({directory:c.directory,safeStorage,fetchImpl:google.fetchImpl});await reopened.load();assert.equal(reopened.status().enabled,false);
 assert.equal(reopened.resumeSync(crypto.randomBytes(32)),false);assert.equal(reopened.passphrase,null);
 assert.equal(reopened.resumeSync(key),true);assert.equal(reopened.status().enabled,true);assert.equal((await reopened.run([]))[0].name,'Remembered sample');
 assert.equal(reopened.status().syncUnlock,undefined);assert.equal(reopened.status().passphrase,undefined);reopened.pause();key.fill(0);
});

test('sign-out retains vault-protected sync for the same Google identity, while a different account starts fresh',async()=>{
 const google=fakeGoogle(),c=await instance(google,'remember-account'),key=crypto.randomBytes(32),password='Synthetic same account sync password';
 await c.newVault('Remembered namespace');await c.enable(password);await c.run([record('Bound sample')]);await c.rememberSync(key);const device=c.tokens.device,vaultId=c.tokens.vaultId;
 await c.disconnect();assert.equal(c.tokens,null);assert.equal(c.passphrase,null);assert.equal(c.status().rememberedSync,false);assert.equal(JSON.parse(safeStorage.decryptString(await fs.readFile(c.file))).tokens,null);
 let user='different-user';const reopened=new GoogleSync({directory:c.directory,safeStorage,fetchImpl:async(input,options)=>new URL(input).hostname==='openidconnect.googleapis.com'?response({sub:user,email:user+'@example.invalid',email_verified:true}):google.fetchImpl(input,options),openExternal:async input=>{const auth=new URL(input),callback=new URL(auth.searchParams.get('redirect_uri'));callback.searchParams.set('state',auth.searchParams.get('state'));callback.searchParams.set('code','synthetic-code');assert.equal((await fetch(callback)).status,200);}});
 await reopened.load();await reopened.signIn();await reopened.authTask;assert.equal(reopened.status().connected,true);assert.equal(reopened.status().rememberedSync,false);assert.equal(reopened.status().vaultId,'legacy');assert.notEqual(reopened.tokens.device,device);assert.equal(reopened.resumeSync(key),false);assert.equal(reopened.status().enabled,false);
 await reopened.disconnect();user='synthetic-user';await reopened.signIn();await reopened.authTask;assert.equal(reopened.status().vaultId,vaultId);assert.equal(reopened.tokens.device,device);assert.equal(reopened.resumeSync(key),true);assert.equal((await reopened.run([]))[0].name,'Bound sample');await reopened.disconnect();key.fill(0);
});

test('intentional pause removes remembered sync and remains paused after reload and vault unlock',async()=>{
 const google=fakeGoogle(),c=await instance(google,'remember-pause'),key=crypto.randomBytes(32);await c.enable('Synthetic pause sync password');await c.run([]);await c.rememberSync(key);c.pause();await c.forgetSync();
 const reopened=new GoogleSync({directory:c.directory,safeStorage});await reopened.load();assert.equal(reopened.status().connected,true);assert.equal(reopened.status().rememberedSync,false);assert.equal(reopened.resumeSync(key),false);assert.equal(reopened.status().enabled,false);key.fill(0);
});

test('remembered sync refuses tampering, another vault key or namespace, and survives failed persistence',async()=>{
 const google=fakeGoogle(),c=await instance(google,'remember-tamper'),key=crypto.randomBytes(32);await c.enable('Synthetic tamper sync password');await c.rememberSync(key);const original=structuredClone(c.savedSync);
 for(const field of ['iv','tag','ciphertext']){c.pause();c.savedSync=structuredClone(original);const bytes=Buffer.from(c.savedSync[field],'base64');bytes[0]^=1;c.savedSync[field]=bytes.toString('base64');assert.equal(c.resumeSync(key),false);assert.equal(c.passphrase,null);}
 c.savedSync=structuredClone(original);c.tokens.vaultId=crypto.randomUUID();assert.equal(c.resumeSync(key),false);assert.equal(c.status().rememberedSync,false);delete c.tokens.vaultId;c.config.clientId='different-client';assert.equal(c.resumeSync(key),false);c.config.clientId=fixture.installed.client_id;
 c.savedSync=structuredClone(original);await c.enable('Synthetic changed sync password');const persist=c.persist;c.persist=async()=>{throw Error('Synthetic write failure');};await assert.rejects(c.rememberSync(key),/Synthetic write failure/);assert.deepEqual(c.savedSync,original);c.pause();await assert.rejects(c.forgetSync(),/Synthetic write failure/);assert.deepEqual(c.savedSync,original);assert.equal(c.status().enabled,false);c.persist=persist;
 await c.newVault('Different namespace');assert.equal(c.savedSync,null);assert.equal(c.status().enabled,false);key.fill(0);
});


test('custom and empty folders sync between devices, preserve edits and stay deleted on stale devices',async()=>{
 const google=fakeGoogle(),a=await instance(google,'folders-a'),b=await instance(google,'folders-b'),password='Synthetic folders sync password';await a.enable(password);await b.enable(password);
 const created=folders.edit([],{name:'Gaming',color:'green'}),empty=folders.edit(created.records,{name:'Empty folder',color:'rose'}),account={...record('SEGA'),folder:created.folder.id};
 let first=await a.run([account],[],empty.records),second=await b.run([]);assert.equal(second.length,1);assert.equal(second[0].folder,created.folder.id);assert.equal(folders.visible(second.folders).length,4);
 const edited=folders.edit(second.folders,{id:created.folder.id,name:'Games',color:'amber'});second=await b.run(second,second.deletions,edited.records);first=await a.run(first);assert.equal(first.folders.find(folder=>folder.id===created.folder.id).name,'Games');
 const removed=folders.remove(first.folders,created.folder.id);first=await a.run(first,first.deletions,removed);second=await b.run(second);assert.equal(second[0].folder,'personal');assert.equal(folders.visible(second.folders).length,3);assert.equal(core.totp(second[0],123456),core.totp(account,123456));
 a.pause();b.pause();
});
