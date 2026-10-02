'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const core=require('../core.cjs'),{sealCloudKey,openCloudKey,PasswordTransaction}=require('../passwords.cjs');
const root=path.resolve(__dirname,'../../..'),context={sub:'synthetic-user',vaultId:crypto.randomUUID()},password='Synthetic unified password';
test('protected recovery journals reject tampering without replacing the original vault',async t=>{
 const directory=await fs.mkdtemp(path.join(root,'work/password-native-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const key=crypto.randomBytes(32),storage={encryptString(text){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,cipher.update(text),cipher.final(),cipher.getAuthTag()]);},decryptString(bytes){const decipher=crypto.createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(-16));return Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]).toString();}};
 await fs.writeFile(path.join(directory,'vault.winterbell'),'original encrypted vault');const tx=new PasswordTransaction(directory,storage);await tx.prepare({'vault.winterbell':'new encrypted vault'},null);
 const bytes=await fs.readFile(tx.file);assert(!bytes.includes(Buffer.from('new encrypted vault')));bytes[15]^=1;await fs.writeFile(tx.file,bytes);
 const recovered=new PasswordTransaction(directory,storage);await assert.rejects(recovered.load(),/recovery data/);assert.equal(recovered.pending.phase,'invalid');await assert.rejects(recovered.finish({}),/recovery data/);assert.equal(await fs.readFile(path.join(directory,'vault.winterbell'),'utf8'),'original encrypted vault');key.fill(0);
});
test('cloud key wrappers authenticate password, Google identity, vault and ciphertext',async()=>{
 const secret=crypto.randomBytes(32),text=await sealCloudKey(secret,password,context);assert(!text.includes(secret.toString('base64')));assert.deepEqual(await openCloudKey(text,password,context),secret);
 await assert.rejects(openCloudKey(text,'Wrong synthetic password',context));await assert.rejects(openCloudKey(text,password,{...context,sub:'other-user'}));
 const damaged=JSON.parse(text);damaged.tag=crypto.randomBytes(16).toString('base64');await assert.rejects(openCloudKey(JSON.stringify(damaged),password,context));await assert.rejects(sealCloudKey(secret,'12345',context));assert.deepEqual(await openCloudKey(await sealCloudKey(secret,'abc123',context),'abc123',context),secret);secret.fill(0);
});
test('password rotation keeps the cloud data key and original encrypted backup recoverable',async()=>{
 const secret=Buffer.from('Previous distinct sync password'),record=core.normalize({name:'Synthetic legacy account',secret:'JBSWY3DPEHPK3PXP'}),backup=await core.encryptBackup([record],secret.toString());
 const first=await sealCloudKey(secret,password,context),nextPassword='Next unified synthetic password',next=await sealCloudKey(await openCloudKey(first,password,context),nextPassword,context);
 await assert.rejects(openCloudKey(next,password,context));const reopened=await openCloudKey(next,nextPassword,context),restored=await core.decryptBackup(backup,reopened.toString());assert.equal(core.totp(restored.accounts[0],123456),core.totp(record,123456));restored.key.fill(0);reopened.fill(0);secret.fill(0);
});
test('unified policy and identity-bound sync key stay inside the local encrypted vault, never exported',async()=>{
 const salt=crypto.randomBytes(16),key=await core.derive(password,salt),security={unified:true,cloud:{...context,secret:Buffer.from('Synthetic cloud key').toString('base64')}};
 const text=core.encode([],key,salt,[],[],{},security);assert(!text.includes(security.cloud.secret));assert.deepEqual(core.decodeVaultWithKey(core.envelope(text),key).security,security);
 const exported=await core.decryptBackup(await core.encryptBackup([],password),password);assert.deepEqual(exported.security,{});exported.key.fill(0);key.fill(0);
});
test('an interrupted ready transaction replays encrypted vault and saved sessions without changing preferences',async t=>{
 const directory=await fs.mkdtemp(path.join(root,'work/password-native-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));await fs.writeFile(path.join(directory,'preferences.json'),'synthetic unchanged settings');
 const tx=new PasswordTransaction(directory);await tx.prepare({'vault.winterbell':'encrypted new vault','google-sync.secure':'encrypted google session','remembered-login.secure':'encrypted saved login'},null);
 await fs.writeFile(path.join(directory,'google-sync.secure'),'partial prior write');const recovered=new PasswordTransaction(directory);await recovered.load();await recovered.finish({});
 assert.equal(await fs.readFile(path.join(directory,'vault.winterbell'),'utf8'),'encrypted new vault');assert.equal(await fs.readFile(path.join(directory,'remembered-login.secure'),'utf8'),'encrypted saved login');assert.equal(await fs.readFile(path.join(directory,'preferences.json'),'utf8'),'synthetic unchanged settings');assert.equal(await recovered.load(),null);
});
test('remote failure preserves old files and a retryable encrypted journal; recovery commits only once',async t=>{
 const directory=await fs.mkdtemp(path.join(root,'work/password-native-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));await fs.writeFile(path.join(directory,'vault.winterbell'),'original encrypted vault');
 const tx=new PasswordTransaction(directory);await tx.prepare({'vault.winterbell':'new encrypted vault'},{next:'encrypted remote record'});await assert.rejects(tx.finish({commitPasswordPlan:async()=>{throw Error('offline');}}));assert.equal(await fs.readFile(path.join(directory,'vault.winterbell'),'utf8'),'original encrypted vault');
 let calls=0;const recovered=new PasswordTransaction(directory);await recovered.load();await recovered.finish({commitPasswordPlan:async()=>{calls++;}});assert.equal(calls,1);assert.equal(await fs.readFile(path.join(directory,'vault.winterbell'),'utf8'),'new encrypted vault');assert.equal(recovered.pending,null);
});
