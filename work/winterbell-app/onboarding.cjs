'use strict';
const fs=require('node:fs/promises'),crypto=require('node:crypto'),core=require('./core.cjs');
async function createGoogleVault({cloud,file,password,confirm,syncPassword,syncConfirm,isCurrent,mode,vaultId,cloudName}){
 if(password!==confirm)throw Error('The vault passwords do not match.');core.passwordCheck(password);
 if(!cloud.status().connected)throw Error('Sign in with Google first.');
 if(!['new','local','cloud'].includes(mode))throw Error('Choose how to set up your vault.');
 try{await fs.access(file);throw Error('A vault already exists. Unlock it to connect Google.');}catch(error){if(error.code!=='ENOENT')throw error;}
 let key;try{
  if(mode==='cloud')await cloud.selectVault(vaultId);else await cloud.newVault(cloudName);
  if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');
  const entry=await cloud.passwordEntry();let secret;if(entry)secret=await cloud.unifiedSecret(password);else if(mode==='cloud'){if(syncPassword!==syncConfirm)throw Error('The previous sync passwords do not match.');core.passwordCheck(syncPassword);secret=Buffer.from(syncPassword);}else secret=await cloud.unifiedSecret(password,true);
  let accounts,security;try{await cloud.enable(secret.toString('utf8'));accounts=await cloud.run([]);if(!entry){const plan=await cloud.passwordPlan(syncPassword||password,password,secret);await cloud.commitPasswordPlan(plan);}security={unified:true,cloud:{...cloud.context(),secret:secret.toString('base64')}};}finally{secret.fill(0);}if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');const salt=crypto.randomBytes(16);key=await core.derive(password,salt);if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');
  await fs.writeFile(file,core.encode(accounts,key,salt,accounts.deletions??[],accounts.folders??[],{},security),{flag:'wx',mode:0o600});return {security,accounts,key,salt,deletions:accounts.deletions??[],folders:accounts.folders??[]};
 }catch(error){key?.fill(0);cloud.pause();throw error;}
}
module.exports={createGoogleVault};
