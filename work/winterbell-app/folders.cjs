'use strict';
const crypto=require('node:crypto');
const colors=['blue','purple','green','amber','rose','slate'];
const builtins=[{id:'personal',name:'Personal',color:'purple'},{id:'work',name:'Work',color:'blue'}];
const customId=id=>typeof id==='string'&&/^folder-[a-f0-9-]{36}$/.test(id);
function normalize(raw){
 if(!raw||!customId(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.trim().length>60||/[\u0000-\u001f\u007f]/.test(raw.name)||!colors.includes(raw.color)||!Number.isSafeInteger(raw.updatedAt)||raw.updatedAt<0)throw Error('Invalid folder.');
 return {id:raw.id,name:raw.name.trim(),color:raw.color,updatedAt:raw.updatedAt,...(raw.deleted===true?{deleted:true}:{})};
}
function merge(...lists){
 const records=new Map();
 for(const list of lists){if(!Array.isArray(list)||list.length>1000)throw Error('Too many folders.');for(const raw of list){const folder=normalize(raw),old=records.get(folder.id);if(!old||folder.updatedAt>old.updatedAt||(folder.updatedAt===old.updatedAt&&JSON.stringify(folder)>JSON.stringify(old)))records.set(folder.id,folder);}}
 if(records.size>1000||[...records.values()].filter(folder=>!folder.deleted).length>100)throw Error('Too many folders.');
 return [...records.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function visible(records){return [...builtins,...merge(records).filter(folder=>!folder.deleted).sort((a,b)=>a.updatedAt-b.updatedAt||a.id.localeCompare(b.id))];}
function available(records,id){return visible(records).some(folder=>folder.id===id);}
function reconcile(accounts,records){const ids=new Set(visible(records).map(folder=>folder.id));return accounts.map(account=>ids.has(account.folder)?account:{...account,folder:'personal'});}
function edit(records,{id,name,color}={}){
 if(typeof name!=='string'||!name.trim()||name.trim().length>60||/[\u0000-\u001f\u007f]/.test(name))throw Error('Enter a folder name of up to 60 characters.');
 if(!colors.includes(color))throw Error('Choose a folder color.');
 const old=id?records.find(folder=>folder.id===id&&!folder.deleted):null;
 if(id&&!old)throw Error('Folder not found.');
 if(visible(records).some(folder=>folder.id!==id&&folder.name.toLocaleLowerCase()===name.trim().toLocaleLowerCase()))throw Error('A folder with this name already exists.');
 const folder={id:old?.id||'folder-'+crypto.randomUUID(),name:name.trim(),color,updatedAt:Math.max(Date.now(),(old?.updatedAt||0)+1)};
 return {records:merge(records,[folder]),folder};
}
function remove(records,id){const old=records.find(folder=>folder.id===id&&!folder.deleted);if(!old)throw Error('Folder not found.');return merge(records,[{...old,deleted:true,updatedAt:Math.max(Date.now(),old.updatedAt+1)}]);}
module.exports={colors,builtins,customId,normalize,merge,visible,available,reconcile,edit,remove};
