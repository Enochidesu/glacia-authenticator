'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
class RememberedVault{
 constructor(directory,safeStorage){this.file=path.join(directory,'remembered-login.secure');this.safeStorage=safeStorage;this.revision=0;this.pending=Promise.resolve();}
 cancel(){this.revision++;}
 enqueue(fn){const job=this.pending.then(fn,fn);this.pending=job.catch(()=>{});return job;}
 async exists(){try{await fs.access(this.file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
 async load(){
  if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows secure storage is unavailable. Enter your vault password.');
  const bytes=await fs.readFile(this.file);if(bytes.length>16384)throw Error('Saved login could not be opened.');
  const data=JSON.parse(this.safeStorage.decryptString(bytes));
  if(data.version!==1||typeof data.key!=='string'||typeof data.salt!=='string')throw Error('Saved login could not be opened.');
  const key=Buffer.from(data.key,'base64'),salt=Buffer.from(data.salt,'base64');
  if(key.length!==32||salt.length!==16){key.fill(0);throw Error('Saved login could not be opened.');}return {key,salt};
 }
 save(key,salt){
  if(!this.safeStorage.isEncryptionAvailable())return Promise.reject(Error('Windows secure storage is unavailable. Uncheck Keep me logged in to continue.'));
  const revision=this.revision,bytes=this.safeStorage.encryptString(JSON.stringify({version:1,key:key.toString('base64'),salt:salt.toString('base64')}));
  return this.enqueue(async()=>{const temp=this.file+'.tmp';try{if(revision!==this.revision)return false;await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(temp,bytes,{mode:0o600});if(revision!==this.revision){await fs.rm(temp,{force:true});return false;}await fs.rename(temp,this.file);return true;}finally{bytes.fill(0);}});
 }
 forget(){this.cancel();return this.enqueue(async()=>{await fs.rm(this.file,{force:true});await fs.rm(this.file+'.tmp',{force:true});});}
}
module.exports={RememberedVault};
