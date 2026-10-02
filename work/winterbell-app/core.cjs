'use strict';
const crypto=require('node:crypto');
const folders=require('./folders.cjs');
const KDF={name:'scrypt',N:32768,r:8,p:1};
const MAX_ACCOUNTS=2000;
function fail(message){throw new Error(message);}
function cleanLabel(value,fallback='',max=240){const s=String(value??fallback).trim();if(!s||s.length>max||/[\u0000-\u001f\u007f]/.test(s))fail('Enter a valid service and account label.');return s;}
function base32(secret){
 const s=String(secret||'').replace(/[\s-]/g,'').toUpperCase();
 if(!/^[A-Z2-7]+={0,6}$/.test(s)||s.length>2048)fail('The setup key must use Base32 letters A–Z and numbers 2–7.');
 const raw=s.replace(/=+$/,'');if(![0,2,4,5,7].includes(raw.length%8))fail('The setup key has an invalid length.');
 let bits=0,value=0;const bytes=[];for(const c of raw){value=(value<<5)|'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);bits+=5;if(bits>=8){bits-=8;bytes.push((value>>>bits)&255);value&=(1<<bits)-1;}}
 if(!bytes.length||value!==0)fail('The setup key has invalid Base32 padding.');
 return Buffer.from(bytes);
}
function normalize(input){
 if(!input||typeof input!=='object')fail('Invalid authenticator record.');
 const secret=String(input.secret||'').replace(/[\s-]/g,'').replace(/=+$/,'').toUpperCase();base32(secret);
 const algorithm=String(input.algorithm||'SHA1').toUpperCase().replace(/-/g,'');
 const digits=Number(input.digits??6),period=Number(input.period??30);
 if(!['SHA1','SHA256','SHA512'].includes(algorithm))fail('Supported algorithms are SHA1, SHA256 and SHA512.');
 if(![6,8].includes(digits))fail('Codes must have 6 or 8 digits.');
 if(!Number.isInteger(period)||period<1||period>3600)fail('The refresh period must be between 1 and 3600 seconds.');
 return {id:crypto.randomUUID(),name:cleanLabel(input.name||input.issuer||'Authenticator','',120),...(input.displayName!==undefined?{displayName:cleanLabel(input.displayName,'',120)}:{}),email:cleanLabel(input.email||input.label||'Account'),secret,algorithm,digits,period,folder:input.folder==='work'||folders.customId(input.folder)?input.folder:'personal',favorite:input.favorite===true,updatedAt:Number.isSafeInteger(input.updatedAt)&&input.updatedAt>=0?input.updatedAt:0};
}
function parseUri(value){
 let url;try{url=new URL(String(value).trim());}catch{fail('Enter a valid otpauth://totp/ link.');}
 if(url.protocol==='otpauth-migration:')fail('Use QR image upload to import Google Authenticator transfer codes.');
 if(url.protocol!=='otpauth:'||url.hostname!=='totp')fail('Only time-based otpauth://totp/ authenticators are supported.');
 if(url.hash||url.username||url.password||url.port)fail('The authenticator link is malformed.');
 for(const field of ['secret','issuer','algorithm','digits','period'])if(url.searchParams.getAll(field).length>1)fail('The authenticator link contains repeated settings.');
 let label;try{label=decodeURIComponent(url.pathname.slice(1));}catch{fail('The account label is not encoded correctly.');}
 const colon=label.indexOf(':');const prefix=colon>=0?label.slice(0,colon).trim():'';const email=colon>=0?label.slice(colon+1).trim():label;
 const issuer=url.searchParams.get('issuer')||prefix||'Authenticator';
 if(prefix&&url.searchParams.get('issuer')&&prefix!==issuer)fail('The service name in the label and issuer does not match.');
 return normalize({name:issuer,email,secret:url.searchParams.get('secret'),algorithm:url.searchParams.get('algorithm')||'SHA1',digits:url.searchParams.get('digits')||6,period:url.searchParams.get('period')||30});
}
function parseText(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>1048576)fail('Import files must be smaller than 1 MB.');
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
 if(!lines.length||lines.length>MAX_ACCOUNTS)fail('Choose a file with 1–2000 authenticator links.');
 return lines.map((line,i)=>{try{return parseUri(line);}catch(e){fail(`Line ${i+1}: ${e.message}`);}});
}
function fingerprint(a){return crypto.createHash('sha256').update([a.name,a.email,a.secret,a.algorithm,a.digits,a.period].join('\0')).digest('hex');}
function merge(existing,incoming){if(!Array.isArray(incoming))fail('Invalid import.');const seen=new Set(existing.map(fingerprint));let skipped=0;const added=[];for(const record of incoming){const a=normalize(record);const f=fingerprint(a);if(seen.has(f)){skipped++;continue;}seen.add(f);added.push(a);}if(existing.length+added.length>MAX_ACCOUNTS)fail('A vault can contain up to 2000 accounts.');return {accounts:[...existing,...added],added:added.length,skipped};}
function totp(a,unixSeconds=Date.now()/1000){
 const counter=BigInt(Math.floor(unixSeconds/a.period));const msg=Buffer.alloc(8);msg.writeBigUInt64BE(counter);
 const hash=crypto.createHmac(a.algorithm.toLowerCase(),base32(a.secret)).update(msg).digest();const offset=hash[hash.length-1]&15;
 const bin=hash.readUInt32BE(offset)&0x7fffffff;return String(bin%10**a.digits).padStart(a.digits,'0');
}
function publicAccount(a,now=Date.now()/1000){return {id:a.id,name:a.displayName||a.name,issuer:a.name,email:a.email,folder:a.folder,favorite:a.favorite,algorithm:a.algorithm,digits:a.digits,period:a.period,code:totp(a,now),remaining:a.period-Math.floor(now)%a.period};}
function renameAccount(account,name){if(typeof name!=='string')fail('Enter an account name.');return {...account,displayName:cleanLabel(name,'',120),updatedAt:Math.max(Date.now(),(account.updatedAt||0)+1)};}
function reorderAccounts(accounts,{id,targetId,after=false}={}){
 if(!Array.isArray(accounts)||typeof id!=='string'||typeof targetId!=='string'||typeof after!=='boolean')fail('Invalid account order.');
 const source=accounts.find(a=>a.id===id),target=accounts.find(a=>a.id===targetId);
 if(!source||!target)fail('Account not found.');
 if(id===targetId)return accounts;
 const next=accounts.filter(a=>a.id!==id),index=next.findIndex(a=>a.id===targetId);
 next.splice(index+(after?1:0),0,source);return next;
}
// Markers retain no secret, only a fingerprint and deletion timestamp.
function mergeDeletions(...lists){const map=new Map();for(const list of lists){if(!Array.isArray(list)||list.length>20000)fail('Invalid account deletion history.');for(const d of list){if(!d||typeof d.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(d.fingerprint)||!Number.isSafeInteger(d.deletedAt)||d.deletedAt<0)fail('Invalid account deletion history.');map.set(d.fingerprint,Math.max(map.get(d.fingerprint)||0,d.deletedAt));}}if(map.size>20000)fail('Account deletion history is full.');return [...map].sort(([a],[b])=>a.localeCompare(b)).map(([fingerprint,deletedAt])=>({fingerprint,deletedAt}));}
function applyDeletions(accounts,deletions){const stamps=new Map(deletions.map(d=>[d.fingerprint,d.deletedAt]));return accounts.filter(a=>!stamps.has(fingerprint(a))||(a.updatedAt||0)>stamps.get(fingerprint(a)));}
function deleteAccount(accounts,deletions,id){const account=accounts.find(a=>a.id===id);if(!account)fail('Account not found.');return {accounts:accounts.filter(a=>a.id!==id),deletions:mergeDeletions(deletions,[{fingerprint:fingerprint(account),deletedAt:Math.max(Date.now(),(account.updatedAt||0)+1)}])};}
function setupUri(a){const url=new URL('otpauth://totp/'+encodeURIComponent(a.name+':'+a.email));url.searchParams.set('secret',a.secret);url.searchParams.set('issuer',a.name);url.searchParams.set('algorithm',a.algorithm);url.searchParams.set('digits',String(a.digits));url.searchParams.set('period',String(a.period));return url.toString();}
function exportText(records){if(!Array.isArray(records)||!records.length)fail('Select at least one account to export.');return records.map(setupUri).join('\r\n')+'\r\n';}
function passwordCheck(password,minimum=6){if(typeof password!=='string'||password.length<minimum||password.length>1024)fail('Use a password of at least '+minimum+' characters.');}
function derive(password,salt){return new Promise((resolve,reject)=>crypto.scrypt(password,salt,32,{N:KDF.N,r:KDF.r,p:KDF.p,maxmem:64*1024*1024},(e,k)=>e?reject(e):resolve(k)));}
function encode(accounts,key,salt,deletions=[],folderRecords=accounts.folders??[],backup={},security={}){
 const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('Winterbell:1'));
 const plain=Buffer.from(JSON.stringify({accounts,...(deletions.length?{deletions:mergeDeletions(deletions)}:{}),...(folderRecords.length?{folders:folders.merge(folderRecords)}:{}),...(backup.lastAt?{backup}:{}),...(security.unified===true?{security}:{})}));const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);plain.fill(0);
 return JSON.stringify({format:'winterbell',version:1,kdf:KDF,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')},null,2);
}
function envelope(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>3*1048576)fail('Invalid or oversized backup file.');
 let e;try{e=JSON.parse(text);}catch{fail('Choose a valid Glacia backup file.');}
 if(e?.format!=='winterbell'||e.version!==1||e.kdf?.name!=='scrypt'||e.kdf.N!==KDF.N||e.kdf.r!==KDF.r||e.kdf.p!==KDF.p)fail('This backup format is not supported.');
 const decoded={};for(const name of ['salt','iv','tag','data']){if(typeof e[name]!=='string'||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(e[name]))fail('The backup file is damaged.');decoded[name]=Buffer.from(e[name],'base64');}
 if(decoded.salt.length!==16||decoded.iv.length!==12||decoded.tag.length!==16||!decoded.data.length)fail('The backup file is damaged.');return decoded;
}
function decodeVaultWithKey(e,key){
 let plain;try{const decipher=crypto.createDecipheriv('aes-256-gcm',key,e.iv);decipher.setAAD(Buffer.from('Winterbell:1'));decipher.setAuthTag(e.tag);plain=Buffer.concat([decipher.update(e.data),decipher.final()]);const payload=JSON.parse(plain.toString('utf8'));if(!Array.isArray(payload.accounts)||payload.accounts.length>MAX_ACCOUNTS)fail('Invalid backup contents.');const deletions=mergeDeletions(payload.deletions??[]),folderRecords=folders.merge(payload.folders??[]);const accounts=payload.accounts.map(raw=>{const a=normalize(raw);if(typeof raw.id==='string'&&/^[a-f0-9-]{36}$/.test(raw.id))a.id=raw.id;return a;});const rawBackup=payload.backup,backup=rawBackup&&typeof rawBackup.lastAt==='string'&&Number.isFinite(Date.parse(rawBackup.lastAt))&&Number.isInteger(rawBackup.lastCount)&&rawBackup.lastCount>=0&&rawBackup.lastCount<=MAX_ACCOUNTS&&/^[a-f0-9]{64}$/.test(rawBackup.revision)?{lastAt:rawBackup.lastAt,lastCount:rawBackup.lastCount,revision:rawBackup.revision}:{};const security=payload.security?.unified===true?{unified:true,cloud:payload.security.cloud&&typeof payload.security.cloud.sub==='string'&&typeof payload.security.cloud.vaultId==='string'&&typeof payload.security.cloud.secret==='string'?{sub:payload.security.cloud.sub,vaultId:payload.security.cloud.vaultId,secret:payload.security.cloud.secret}:null}:{};return {security,accounts:folders.reconcile(applyDeletions(accounts,deletions),folderRecords),deletions,folders:folderRecords,backup};}catch{fail('Incorrect password, or the backup file is damaged.');}finally{if(plain)plain.fill(0);}
}
function decodeWithKey(e,key){return decodeVaultWithKey(e,key).accounts;}
async function encryptBackup(accounts,password,deletions=[],folderRecords=accounts.folders??[]){passwordCheck(password,12);const salt=crypto.randomBytes(16);const key=await derive(password,salt);try{return encode(accounts,key,salt,deletions,folderRecords);}finally{key.fill(0);}}
async function decryptBackup(text,password){if(typeof password!=='string'||password.length>1024)fail('Enter the backup password.');const e=envelope(text);const key=await derive(password,e.salt);try{return {...decodeVaultWithKey(e,key),key,salt:e.salt};}catch(error){key.fill(0);throw error;}}
module.exports={base32,normalize,parseUri,parseText,fingerprint,merge,totp,publicAccount,renameAccount,reorderAccounts,mergeDeletions,applyDeletions,deleteAccount,decodeVaultWithKey,setupUri,exportText,passwordCheck,derive,encode,envelope,decodeWithKey,encryptBackup,decryptBackup};
