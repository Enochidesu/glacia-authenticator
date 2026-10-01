'use strict';
const core=require('./core.cjs');
// Field layout follows the interoperable Google Authenticator transfer protocol.
function fail(message='This Google transfer QR is damaged.'){throw Error(message);}
function fields(bytes){let offset=0;const result=new Map();
 const integer=()=>{let value=0n;for(let i=0;i<10;i++){if(offset>=bytes.length)fail();const b=bytes[offset++];if(i===9&&b>1)fail();value|=BigInt(b&127)<<BigInt(i*7);if(!(b&128))return value;}fail();};
 while(offset<bytes.length){const tag=integer();if(tag>0xffffffffn)fail();const id=Number(tag>>3n),wire=Number(tag&7n);if(!id)fail();let value;
  if(wire===0)value=integer();else if(wire===2){const length=integer();if(length>BigInt(bytes.length-offset))fail();value=bytes.subarray(offset,offset+Number(length));offset+=Number(length);}else if(wire===1||wire===5){offset+=wire===1?8:4;if(offset>bytes.length)fail();continue;}else fail();
  if(!result.has(id))result.set(id,[]);result.get(id).push({wire,value});
 }return result;
}
function one(map,id,wire,fallback){const values=map.get(id);if(!values)return fallback;if(values.length!==1||values[0].wire!==wire)fail();return values[0].value;}
function number(map,id,fallback=0){const value=one(map,id,0,BigInt(fallback));if(value>BigInt(Number.MAX_SAFE_INTEGER))fail();return Number(value);}
function label(map,id){const bytes=one(map,id,2,Buffer.alloc(0));try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes).trim();}catch{fail();}}
function base32Encode(bytes){if(!bytes.length||bytes.length>1280)fail('The transfer QR contains an invalid setup key.');let value=0,bits=0,text='';const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){bits-=5;text+=alphabet[(value>>>bits)&31];}value&=(1<<bits)-1;}if(bits)text+=alphabet[(value<<(5-bits))&31];return text;}
function parseMigration(uri){if(typeof uri!=='string'||uri.length>65536)fail();let url;try{url=new URL(uri);}catch{fail();}
 if(url.protocol!=='otpauth-migration:'||url.hostname!=='offline'||url.username||url.password||url.port||url.hash||!['','/'].includes(url.pathname)||url.searchParams.getAll('data').length!==1)fail('Choose a Google Authenticator export QR.');
 const encoded=url.searchParams.get('data');if(!encoded||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))fail();const bytes=Buffer.from(encoded,'base64');if(bytes.length>32768)fail();const payload=fields(bytes),version=number(payload,2);if(version>0x7fffffff)fail('The transfer QR has invalid version information.');
 // Version is metadata, not a reason to reject an otherwise compatible payload.
 // Validate each field and OTP setting below, and ignore unknown protobuf fields.
 const size=number(payload,3,1),index=number(payload,4),id=one(payload,5,0,null);if(size<1||size>200||index>=size||(size>1&&id===null))fail('The transfer QR has invalid page information.');
 const params=payload.get(1)||[];if(!params.length||params.length>2000)fail('The transfer QR contains no accounts or too many accounts.');
 const records=params.map(({wire,value})=>{if(wire!==2)fail();const p=fields(value),algorithm=number(p,4),digits=number(p,5),type=number(p,6);if(type!==0&&type!==2)fail('This transfer contains HOTP or an unsupported account type. No accounts were imported.');if(algorithm>3||digits>2)fail('This transfer contains unsupported code settings. No accounts were imported.');
  let name=label(p,2),issuer=label(p,3);const colon=name.indexOf(':');if(colon>=0&&(!issuer||issuer===name.slice(0,colon).trim())){issuer=issuer||name.slice(0,colon).trim();name=name.slice(colon+1).trim();}
  return core.normalize({name:issuer||'Authenticator',email:name||'Account',secret:base32Encode(one(p,1,2,Buffer.alloc(0))),algorithm:['SHA1','SHA1','SHA256','SHA512'][algorithm],digits:digits===2?8:6,period:30});
 });return {records,batch:{id:id===null?'single':id.toString(),size,index,version},digest:require('node:crypto').createHash('sha256').update(bytes).digest('hex')};
}
function collectMigration(previous,parsed){const {batch,digest,records}=parsed;if(previous&&(previous.id!==batch.id||previous.size!==batch.size||previous.version!==batch.version))fail('This QR belongs to another transfer. Close the review and start a new import.');const parts=new Map(previous?.parts||[]),old=parts.get(batch.index);if(old&&old.digest!==digest)fail('This QR conflicts with a page already scanned. Start the transfer again.');parts.set(batch.index,{digest,records});
 const total=[...parts.values()].reduce((sum,p)=>sum+p.records.length,0);if(total>2000)fail('A transfer can contain up to 2000 accounts.');const missing=Array.from({length:batch.size},(_,i)=>i).filter(i=>!parts.has(i));return {id:batch.id,size:batch.size,version:batch.version,parts,missing,records:[...parts].sort((a,b)=>a[0]-b[0]).flatMap(([,part])=>part.records)};
}
module.exports={parseMigration,collectMigration};
