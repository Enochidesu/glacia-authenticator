'use strict';
// Only synthetic records are used for deletion checks.
const test=require('node:test'),assert=require('node:assert/strict');const core=require('../core.cjs'),{mergeCloud,signature}=require('../google-sync.cjs');
const demo=()=>core.normalize({name:'Original issuer',email:'demo@example.invalid',secret:'JBSWY3DPEHPK3PXP',folder:'personal',favorite:true});
test('editing display name preserves the key, ID, OTP code and import identity',()=>{const before=demo(),after=core.renameAccount(before,'  My account  ');assert.equal(core.publicAccount(after,1700000000).name,'My account');assert.equal(after.id,before.id);assert.equal(after.secret,before.secret);assert.equal(core.totp(after,1700000000),core.totp(before,1700000000));assert.equal(core.fingerprint(after),core.fingerprint(before));assert.equal(core.merge([after],[before]).added,0);assert.equal(after.favorite,true);assert.throws(()=>core.renameAccount(before,'  '));assert.throws(()=>core.renameAccount(before,'x'.repeat(121)));});
test('custom names and folder moves survive encrypted backup reopen',async()=>{const after={...core.renameAccount(demo(),'New label'),folder:'work'},text=await core.encryptBackup([after],'Synthetic backup password');const opened=await core.decryptBackup(text,'Synthetic backup password');assert.equal(core.publicAccount(opened.accounts[0]).name,'New label');assert.equal(opened.accounts[0].folder,'work');opened.key.fill(0);});
test('name edits merge across computers without creating duplicate accounts',()=>{const before=demo(),after={...core.renameAccount(before,'Renamed on another PC'),folder:'work'},remote={...after,id:'other-id'};const merged=mergeCloud([before],[remote]);assert.equal(merged.length,1);assert.equal(merged[0].id,before.id);assert.equal(core.publicAccount(merged[0]).name,'Renamed on another PC');assert.equal(merged[0].folder,'work');assert.notEqual(signature([before]),signature(merged));assert.equal(signature(mergeCloud(merged,[before])),signature(merged));});

test('moving an account before or after a target preserves every account and its OTP identity',()=>{
 const original=Array.from({length:6},(_,i)=>core.normalize({...demo(),name:'Account '+i,email:i+'@example.invalid'}));
 const next=core.reorderAccounts(original,{id:original[4].id,targetId:original[0].id});
 assert.deepEqual(next.map(a=>a.id),[original[4],...original.slice(0,4),original[5]].map(a=>a.id));
 assert.deepEqual(original.map(a=>a.name),Array.from({length:6},(_,i)=>'Account '+i));
 for(const account of original){assert.equal(next.find(a=>a.id===account.id),account);assert.equal(core.totp(account,59),core.totp(next.find(a=>a.id===account.id),59));}
 assert.deepEqual(core.reorderAccounts(next,{id:original[4].id,targetId:original[5].id,after:true}).map(a=>a.id),[...original.filter(a=>a.id!==original[4].id),original[4]].map(a=>a.id));
 assert.throws(()=>core.reorderAccounts(original,{id:'missing',targetId:original[0].id}));assert.throws(()=>core.reorderAccounts(original,{id:original[0].id,targetId:original[1].id,after:'true'}));
 assert.equal(core.reorderAccounts(original,{id:original[0].id,targetId:original[0].id}),original);
});
test('manual order survives encrypted reopen and cloud metadata merges; later imports append',async()=>{
 const original=Array.from({length:3},(_,i)=>core.normalize({...demo(),name:'Account '+i,email:i+'@example.invalid'}));
 const next=core.reorderAccounts(original,{id:original[2].id,targetId:original[0].id}),text=await core.encryptBackup(next,'Synthetic backup password'),opened=await core.decryptBackup(text,'Synthetic backup password');
 try{assert.deepEqual(opened.accounts.map(a=>a.id),next.map(a=>a.id));}finally{opened.key.fill(0);}
 const remote=original.map(a=>({...a,favorite:false,updatedAt:20})),merged=mergeCloud(next,remote);
 assert.deepEqual(merged.map(a=>a.id),next.map(a=>a.id));assert(merged.every(a=>!a.favorite));
 assert.equal(signature(next),signature(original));
 const imported=core.normalize({...demo(),email:'new@example.invalid'});assert.deepEqual(core.merge(next,[imported]).accounts.slice(0,3).map(a=>a.id),next.map(a=>a.id));
});

test('deletion removes the key and persists secret-free markers in the encrypted vault',async()=>{
 const a=demo(),other=core.normalize({...a,name:'Keep this'}),removed=core.deleteAccount([a,other],[],a.id);
 assert.deepEqual(removed.accounts,[other]);assert.deepEqual(Object.keys(removed.deletions[0]).sort(),['deletedAt','fingerprint']);assert.equal(JSON.stringify(removed.deletions).includes(a.secret),false);
 const text=await core.encryptBackup(removed.accounts,'Synthetic delete password',removed.deletions),opened=await core.decryptBackup(text,'Synthetic delete password');
 assert.deepEqual(opened.accounts.map(x=>x.name),['Keep this']);assert.deepEqual(opened.deletions,removed.deletions);opened.key.fill(0);
 assert.throws(()=>core.deleteAccount([other],removed.deletions,a.id),/not found/);assert.throws(()=>core.mergeDeletions([{fingerprint:'invalid',deletedAt:1}]));
});
test('deletion beats stale snapshots regardless of merge order; an explicit newer reimport survives',()=>{
 const a=demo(),removed=core.deleteAccount([a],[],a.id),marker=removed.deletions[0];
 const left=mergeCloud([], [a], removed.deletions),right=mergeCloud([a],[],[],removed.deletions);assert.equal(left.length,0);assert.equal(signature(left),signature(right));
 const restored={...a,updatedAt:marker.deletedAt+1};assert.equal(mergeCloud(left,[restored]).length,1);assert.notEqual(signature([]),signature(left));
});
