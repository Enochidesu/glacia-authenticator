'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const folders=require('../folders.cjs'),core=require('../core.cjs'),{mergeCloud,signature}=require('../google-sync.cjs'),features=require('../features.js'),i18n=require('../i18n.js');
const record=()=>core.normalize({name:'SEGA',email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP'});
test('custom folder edits validate names, color and identity without changing built-in folders',()=>{
 const created=folders.edit([],{name:'Gaming',color:'green'}),id=created.folder.id;
 assert.equal(folders.customId(id),true);assert.equal(folders.visible(created.records).length,3);
 const edited=folders.edit(created.records,{id,name:'Games',color:'amber'});
 assert.equal(edited.folder.id,id);assert.ok(edited.folder.updatedAt>created.folder.updatedAt);
 for(const arg of [{name:'Personal',color:'blue'},{name:'Gaming',color:'url(evil)'},{name:'\u0000',color:'blue'},{name:'x'.repeat(61),color:'blue'},{id:'personal',name:'Renamed',color:'blue'}])assert.throws(()=>folders.edit(created.records,arg));
 assert.throws(()=>folders.remove(created.records,'work'));assert.throws(()=>folders.merge([{...created.folder,id:'../../file'}]));
});
test('folder deletion preserves all accounts, moves memberships and resists stale remote folder records',()=>{
 const created=folders.edit([],{name:'Gaming',color:'green'}),account={...record(),folder:created.folder.id},deleted=folders.remove(created.records,created.folder.id);
 const resolved=folders.reconcile([account],deleted);assert.equal(resolved.length,1);assert.equal(resolved[0].secret,account.secret);assert.equal(resolved[0].folder,'personal');
 const merged=mergeCloud(resolved,[account],[],[],deleted,created.records);assert.equal(merged[0].folder,'personal');assert.equal(folders.visible(merged.folders).length,2);
 const left=folders.merge(deleted,created.records),right=folders.merge(created.records,deleted);assert.deepEqual(left,right);
});
test('encrypted backups round trip folder definitions and legacy backups keep their format',async()=>{
 const created=folders.edit([],{name:'Settings 日本語',color:'rose'}),account={...record(),folder:created.folder.id},password='Synthetic backup password';
 const text=await core.encryptBackup([account],password,[],created.records);assert.equal(text.includes('Settings'),false);assert.equal(JSON.parse(text).format,'winterbell');assert.equal(JSON.parse(text).version,1);
 const opened=await core.decryptBackup(text,password);assert.equal(opened.accounts[0].folder,created.folder.id);assert.deepEqual(opened.folders,created.records);assert.equal(core.totp(opened.accounts[0],123456),core.totp(account,123456));opened.key.fill(0);
 const legacy=await core.encryptBackup([record()],password),old=await core.decryptBackup(legacy,password);assert.deepEqual(old.folders,[]);assert.deepEqual(old.backup,{});old.key.fill(0);
 await assert.rejects(()=>core.decryptBackup(text,'Incorrect password'));
});
test('local backup metadata stays encrypted and is omitted from portable exports',async()=>{
 const account=record(),key=crypto.randomBytes(32),salt=crypto.randomBytes(16),backup={lastAt:'2026-10-01T04:00:00.000Z',lastCount:1,revision:'a'.repeat(64)};
 const text=core.encode([account],key,salt,[],[],backup);assert.equal(text.includes(backup.lastAt),false);assert.deepEqual(core.decodeVaultWithKey(core.envelope(text),key).backup,backup);
 const exported=await core.encryptBackup([account],'Synthetic backup password'),opened=await core.decryptBackup(exported,'Synthetic backup password');assert.deepEqual(opened.backup,{});opened.key.fill(0);key.fill(0);
});
test('empty custom folders affect sync signatures and retain edits across deterministic merges',()=>{
 const created=folders.edit([],{name:'Social',color:'purple'}),edited=folders.edit(created.records,{id:created.folder.id,name:'Friends',color:'rose'});
 const a=mergeCloud([],[],[],[],created.records),b=mergeCloud([],[],[],[],edited.records);assert.notEqual(signature(a),signature([]));assert.notEqual(signature(a),signature(b));
 assert.equal(signature(mergeCloud(a,b)),signature(mergeCloud(b,a)));assert.equal(mergeCloud(a,b).folders[0].name,'Friends');
});
test('sync badge distinguishes queued changes, paused vaults, offline and errors from successful sync',()=>{
 const cloud={connected:true,enabled:true,lastSync:'2026-10-01T04:00:00Z'};
 assert.equal(features.syncBadge(cloud).label,'Synced');assert.equal(features.syncBadge({...cloud,syncPending:true}).label,'Sync pending');assert.equal(features.syncBadge({...cloud,syncing:true}).label,'Syncing');
 assert.equal(features.syncBadge(cloud,true).label,'Paused');assert.equal(features.syncBadge({...cloud,enabled:false}).label,'Paused');assert.equal(features.syncBadge(cloud,false,false).label,'Offline');
 assert.equal(features.syncBadge({...cloud,error:'Rejected'}).label,'Needs attention');assert.equal(features.syncBadge({}).label,'Local vault');
});
test('service logos resolve issuer identity after renaming and only use bundled assets',()=>{
 assert.equal(features.serviceLogo({issuer:'SEGA',name:'My gaming account'}),'sega');assert.equal(features.serviceLogo({issuer:'Electronic Arts'}),'ea');assert.equal(features.serviceLogo({issuer:'Authenticator',email:'Discord RAO'}),'discord');
 assert.equal(features.serviceLogo({issuer:'Unknown',email:'demo@gmail.com'}),null);assert.equal(features.serviceLogo({issuer:'github"><script>alert(1)</script>'}),null);
 for(const [slug] of features.services)assert.ok(fs.existsSync(path.resolve(__dirname,'../assets/service-logos',slug+'.svg')),slug);
});
test('new feature errors and labels translate into both supported languages',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../folders.cjs'),'utf8');
 for(const match of source.matchAll(/Error\('([^']+)'\)/g))for(const language of ['id','ja'])assert.notEqual(i18n.translate(match[1],language),match[1]);
 for(const label of ['Help & Recovery','Manage folders','Backup status','Glacia Authenticator is app from Winter Garden Project for your two-step Verification Codes.'])for(const language of ['id','ja'])assert.notEqual(i18n.translate(label,language),label);
});
