'use strict';
const fs=require('node:fs/promises'),crypto=require('node:crypto'),core=require('./core.cjs');
async function createGoogleVault({cloud,file,password,confirm,syncPassword,syncConfirm,isCurrent,mode,vaultId,cloudName}){
 if(password!==confirm)throw Error('The vault passwords do not match.');core.passwordCheck(password,6);if(syncPassword!==syncConfirm)throw Error('The sync passwords do not match.');core.passwordCheck(syncPassword);
 if(!cloud.status().connected)throw Error('Sign in with Google first.');
 if(!['new','local','cloud'].includes(mode))throw Error('Choose how to set up your vault.');
 try{await fs.access(file);throw Error('A vault already exists. Unlock it to connect Google.');}catch(error){if(error.code!=='ENOENT')throw error;}
 let key;try{
  if(mode==='cloud')await cloud.selectVault(vaultId);else await cloud.newVault(cloudName);
  if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');
  await cloud.enable(syncPassword);const accounts=await cloud.run([]);if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');const salt=crypto.randomBytes(16);key=await core.derive(password,salt);if(!isCurrent())throw Error('Setup was canceled or locked. Try again.');
  await fs.writeFile(file,core.encode(accounts,key,salt,accounts.deletions??[]),{flag:'wx',mode:0o600});return {accounts,key,salt,deletions:accounts.deletions??[],folders:accounts.folders??[]};
 }catch(error){key?.fill(0);cloud.pause();throw error;}
}
module.exports={createGoogleVault};
