'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GlaciaFeatures=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
const services=[
 ['discord',['discord']],['ea',['electronic arts','ea','origin']],['sega',['sega']],['paypal',['paypal']],['steam',['steam']],
 ['google',['google','gmail']],['github',['github']],['apple',['apple','icloud']],['facebook',['facebook','meta']],['instagram',['instagram']],
 ['twitch',['twitch']],['reddit',['reddit']],['epicgames',['epic games','epicgames']],['riotgames',['riot games','riotgames','riot']],
 ['telegram',['telegram']],['playstation',['playstation','psn']],['dropbox',['dropbox']]
];
function serviceLogo(account){
 const candidates=[account.issuer,account.name,typeof account.email==='string'&&!account.email.includes('@')?account.email:''].filter(value=>typeof value==='string').map(value=>value.trim().toLowerCase());
 for(const candidate of candidates)for(const [slug,aliases] of services)if(aliases.some(alias=>candidate===alias||candidate.startsWith(alias+' ')||candidate.startsWith(alias+':')))return slug;
 return null;
}
function syncBadge(cloud={},locked=false,online=true){
 if(cloud.connecting)return {label:'Connecting',icon:'cloud',state:'pending',note:'Waiting for Google sign-in'};
 if(!cloud.connected)return {label:'Local vault',icon:'hard-drive',state:'local',note:'Google sync is not connected.'};
 if(locked||!cloud.enabled)return {label:'Paused',icon:'pause',state:'paused',note:locked?'Unlock your vault to resume sync.':'Open Google sync to continue.'};
 if(!online)return {label:'Offline',icon:'cloud-off',state:'offline',note:'Codes still work. Sync will retry when you are online.'};
 if(cloud.syncing)return {label:'Syncing',icon:'refresh-cw',state:'syncing',note:'Syncing your encrypted vault'};
 if(cloud.error)return {label:'Needs attention',icon:'cloud-alert',state:'error',note:'Open Google sync to review the problem.'};
 if(cloud.syncPending||!cloud.lastSync)return {label:'Sync pending',icon:'cloud',state:'pending',note:'Waiting to sync your latest changes.'};
 return {label:'Synced',icon:'cloud',state:'synced',note:'Your latest changes are synced.'};
}
return {serviceLogo,syncBadge,services};
});
