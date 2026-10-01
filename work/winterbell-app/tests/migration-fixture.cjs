'use strict';
const core=require('../core.cjs');
function integer(value){value=BigInt(value);const bytes=[];do{let b=Number(value&127n);value>>=7n;if(value)b|=128;bytes.push(b);}while(value);return Buffer.from(bytes);}
function field(id,value){return typeof value==='number'?Buffer.concat([integer(id*8),integer(value)]):Buffer.concat([integer(id*8+2),integer(value.length),value]);}
function migrationUri(records,{size=1,index=0,id=2468,version=1}={}){const bytes=Buffer.concat([...records.map(r=>field(1,Buffer.concat([field(1,core.base32(r.secret)),field(2,Buffer.from(r.email||'demo@example.invalid')),field(3,Buffer.from(r.name||'Demo')),field(4,r.migrationAlgorithm??({SHA1:1,SHA256:2,SHA512:3}[r.algorithm]||1)),field(5,r.digits===8?2:1),field(6,r.type??2)]))),field(2,version),field(3,size),field(4,index),field(5,id)]);const url=new URL('otpauth-migration://offline');url.searchParams.set('data',bytes.toString('base64'));return url.toString();}
module.exports={migrationUri,field,integer};
