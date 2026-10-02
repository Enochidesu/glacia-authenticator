'use strict';
const crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path'),core=require('./core.cjs');
const aad=context=>Buffer.from(JSON.stringify(['Glacia:cloud-key:1',context.sub,context.vaultId]));
async function sealCloudKey(secret,password,context){
 core.passwordCheck(password);if(!Buffer.isBuffer(secret)||secret.length<12||secret.length>4096)throw Error('Invalid cloud encryption key.');
 const salt=crypto.randomBytes(16),key=await core.derive(password,salt),iv=crypto.randomBytes(12);
 try{const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad(context));const data=Buffer.concat([cipher.update(secret),cipher.final()]);
  return JSON.stringify({format:'glacia-cloud-key',version:1,kdf:{name:'scrypt',N:32768,r:8,p:1},sub:context.sub,vaultId:context.vaultId,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
 }finally{key.fill(0);}
}
async function openCloudKey(text,password,context){
 let raw;try{raw=JSON.parse(text);if(raw.format!=='glacia-cloud-key'||raw.sub!==context.sub||raw.vaultId!==context.vaultId)throw Error();}catch{throw Error('The cloud password record is invalid.');}
 const envelope=core.envelope(JSON.stringify({...raw,format:'winterbell'})),key=await core.derive(password,envelope.salt);
 try{const decipher=crypto.createDecipheriv('aes-256-gcm',key,envelope.iv);decipher.setAAD(aad(context));decipher.setAuthTag(envelope.tag);const secret=Buffer.concat([decipher.update(envelope.data),decipher.final()]);if(secret.length<12||secret.length>4096){secret.fill(0);throw Error();}return secret;
 }catch{throw Error('Incorrect Glacia password for this cloud vault.');}finally{key.fill(0);}
}
// Only already-encrypted vault/session bytes and an encrypted cloud-key record
// enter this journal. Replay completes a interrupted multi-file password change.
class PasswordTransaction{
 constructor(directory,safeStorage=null){this.directory=directory;this.safeStorage=safeStorage;this.file=path.join(directory,'password-change.pending');this.pending=null;}
 async load(){try{const bytes=await fs.readFile(this.file);if(bytes.length>8*1048576)throw Error();const value=JSON.parse(this.safeStorage?this.safeStorage.decryptString(bytes):bytes.toString('utf8'));if(value.version!==1||!['prepared','ready'].includes(value.phase))throw Error();const allowed=['vault.winterbell','google-sync.secure','remembered-login.secure'];if(!value.files?.['vault.winterbell']||Object.keys(value.files).some(name=>!allowed.includes(name)||typeof value.files[name]!=='string'||Buffer.from(value.files[name],'base64').toString('base64')!==value.files[name]))throw Error();this.pending=value;}catch(error){if(error.code==='ENOENT'){if(this.pending?.phase==='invalid')this.pending=null;}else{this.pending={phase:'invalid'};throw Error('Password recovery data could not be read. Your encrypted vault is preserved.');}}return this.pending;}
 async persist(){const text=JSON.stringify(this.pending),bytes=this.safeStorage?this.safeStorage.encryptString(text):Buffer.from(text);await fs.mkdir(this.directory,{recursive:true});await fs.writeFile(this.file+'.tmp',bytes,{mode:0o600});await fs.rename(this.file+'.tmp',this.file);}
 async prepare(files,plan){if(this.pending)throw Error('Finish the pending password change first.');this.pending={version:1,phase:plan?'prepared':'ready',plan,files:Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,Buffer.from(bytes).toString('base64')]))};try{await this.persist();}catch(error){this.pending=null;throw error;}}
 async finish(cloud){if(!this.pending)return false;if(this.pending.phase==='invalid'){await this.load();if(!this.pending)return false;}if(this.pending.phase==='prepared'){await cloud.commitPasswordPlan(this.pending.plan);this.pending.phase='ready';await this.persist();}
  // The vault is committed last; a crash before it is recovered by replay.
  const names=Object.keys(this.pending.files).sort((a,b)=>Number(a==='vault.winterbell')-Number(b==='vault.winterbell'));
  for(const name of names){const target=path.join(this.directory,name);await fs.writeFile(target+'.password-tmp',Buffer.from(this.pending.files[name],'base64'),{mode:0o600});await fs.rename(target+'.password-tmp',target);}
  await fs.rm(this.file,{force:true});this.pending=null;return true;
 }
}
module.exports={sealCloudKey,openCloudKey,PasswordTransaction};
