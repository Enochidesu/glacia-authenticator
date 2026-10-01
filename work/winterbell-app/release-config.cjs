'use strict';
const fs=require('node:fs'),path=require('node:path');
const {credentials}=require('./google-sync.cjs');
function loadReleaseConfig(directory){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));
 if(manifest.glaciaReleaseMode!=='public')return {publicRelease:false,defaultConfig:null};
 try{return {publicRelease:true,defaultConfig:credentials(fs.readFileSync(path.join(directory,'google-client.json'),'utf8'))};}
 catch{throw Error('This public Glacia build is missing valid Google app configuration. Rebuild it with the release client.');}
}
module.exports={loadReleaseConfig};
