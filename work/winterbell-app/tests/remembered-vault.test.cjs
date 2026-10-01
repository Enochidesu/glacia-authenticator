'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {RememberedVault}=require('../remembered-vault.cjs'),core=require('../core.cjs');
function secureStore(){const wrappingKey=crypto.randomBytes(32);return {isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',wrappingKey,iv),data=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]);},decryptString:bytes=>{const cipher=crypto.createDecipheriv('aes-256-gcm',wrappingKey,bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString();}};}
test('saved derived key is encrypted and reopens only with the same Windows-store adapter',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'glacia-remember-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const adapter=secureStore(),saved=new RememberedVault(dir,adapter),key=crypto.randomBytes(32),salt=crypto.randomBytes(16);await saved.save(key,salt);
 const bytes=await fs.readFile(saved.file);assert.equal(bytes.includes(Buffer.from(key.toString('base64'))),false);
 const reopened=await new RememberedVault(dir,adapter).load();assert.deepEqual(reopened.key,key);assert.deepEqual(reopened.salt,salt);reopened.key.fill(0);
 await assert.rejects(new RememberedVault(dir,secureStore()).load());await saved.forget();assert.equal(await saved.exists(),false);
});
test('forget cancels queued saving and never removes the vault',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'glacia-forget-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const saved=new RememberedVault(dir,secureStore());
 await fs.writeFile(path.join(dir,'vault.winterbell'),'untouched');const saving=saved.save(crypto.randomBytes(32),crypto.randomBytes(16));const forgetting=saved.forget();await Promise.all([saving,forgetting]);assert.equal(await saved.exists(),false);assert.equal(await fs.readFile(path.join(dir,'vault.winterbell'),'utf8'),'untouched');
});
test('unavailable Windows storage cannot save a remembered login',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'glacia-unavailable-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const saved=new RememberedVault(dir,{isEncryptionAvailable:()=>false});await assert.rejects(saved.save(crypto.randomBytes(32),crypto.randomBytes(16)),/Windows secure storage/);assert.equal(await saved.exists(),false);
});
test('local six-character minimum leaves the stronger backup minimum intact',async()=>{
 assert.throws(()=>core.passwordCheck('12345',6),/6 characters/);assert.doesNotThrow(()=>core.passwordCheck('123456',6));assert.throws(()=>core.passwordCheck('123456'),/12 characters/);await assert.rejects(core.encryptBackup([],'123456'),/12 characters/);
});
