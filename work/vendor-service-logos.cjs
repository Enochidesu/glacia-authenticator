'use strict';
// Development-only vendoring. The app never downloads logos at runtime.
const fs=require('node:fs/promises'),path=require('node:path');
const version='16.0.0',base='https://raw.githubusercontent.com/simple-icons/simple-icons/'+version;
const names=['discord','ea','sega','paypal','steam','google','github','apple','amazon','facebook','instagram','twitch','reddit','epicgames','riotgames','telegram','nintendo','playstation','dropbox','linkedin'];
const output=path.join(__dirname,'winterbell-app/assets/service-logos');
async function get(file){const response=await fetch(base+'/'+file,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(file+': '+response.status);return response.text();}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const results=await Promise.allSettled(names.map(async name=>{const svg=await get('icons/'+name+'.svg');if(!/^<svg\b/.test(svg)||!svg.includes('viewBox="0 0 24 24"')||/<(?:script|foreignObject|image|use)\b|\bon\w+=|\bhref=/i.test(svg))throw Error('Unexpected SVG: '+name);await fs.writeFile(path.join(output,name+'.svg'),svg);return name;}));
 const loaded=[];for(let i=0;i<results.length;i++){const result=results[i];if(result.status==='fulfilled')loaded.push(result.value);else console.log('Unavailable:',names[i],result.reason.message);}
 if(!loaded.length)throw Error('No service logos were available');
 for(const file of ['LICENSE.md','DISCLAIMER.md'])await fs.writeFile(path.join(output,file),await get(file));
 await fs.writeFile(path.join(output,'SOURCES.json'),JSON.stringify({project:'Simple Icons',version,source:base,icons:loaded},null,2));
 console.log(JSON.stringify({version,loaded}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
