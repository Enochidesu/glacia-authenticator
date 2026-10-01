'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {loadReleaseConfig}=require('../release-config.cjs');
const fixture={installed:{client_id:'1234567890-synthetic.apps.googleusercontent.com',client_secret:'synthetic-only'}};
function directory(t,mode){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glacia-release-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({glaciaReleaseMode:mode}));return dir;}
test('private builds ignore any bundled Google file and keep developer setup',t=>{const dir=directory(t,'private');fs.writeFileSync(path.join(dir,'google-client.json'),'not JSON');assert.deepEqual(loadReleaseConfig(dir),{publicRelease:false,defaultConfig:null});});
test('public builds load only the supplied Desktop app registration',t=>{const dir=directory(t,'public');fs.writeFileSync(path.join(dir,'google-client.json'),JSON.stringify({...fixture,tokens:{access_token:'must-not-load'}}));assert.deepEqual(loadReleaseConfig(dir),{publicRelease:true,defaultConfig:{clientId:fixture.installed.client_id,clientSecret:fixture.installed.client_secret}});});
test('public builds fail when the registration is missing or invalid',t=>{const dir=directory(t,'public');assert.throws(()=>loadReleaseConfig(dir),/missing valid Google app configuration/);for(const data of ['not JSON',JSON.stringify({web:fixture.installed})]){fs.writeFileSync(path.join(dir,'google-client.json'),data);assert.throws(()=>loadReleaseConfig(dir),/missing valid Google app configuration/);}});
test('packager rejects public builds without an explicitly supplied client before writing output',()=>{assert.throws(()=>execFileSync(process.execPath,[path.resolve(__dirname,'../../package-winterbell.cjs'),'--public'],{stdio:'pipe'}),error=>error.stderr.toString().includes('Public builds require --google-client'));});
test('public packaging includes only app registration and omits the developer guide',t=>{
 const root=directory(t,'private'),source=path.join(root,'work','winterbell-app'),actual=path.resolve(__dirname,'..');fs.mkdirSync(source,{recursive:true});
 const buildFile=path.join(root,'work','package-winterbell.cjs');fs.copyFileSync(path.resolve(actual,'../package-winterbell.cjs'),buildFile);
 for(const name of ['LICENSE','NOTICE'])fs.copyFileSync(path.resolve(actual,'../..',name),path.join(root,name));
 fs.copyFileSync(path.resolve(actual,'../installer-terms.txt'),path.join(root,'work','installer-terms.txt'));
 for(const name of fs.readdirSync(actual)){if(fs.statSync(path.join(actual,name)).isFile())fs.copyFileSync(path.join(actual,name),path.join(source,name));}
 fs.mkdirSync(path.join(source,'vendor'));fs.cpSync(path.join(actual,'assets'),path.join(source,'assets'),{recursive:true});const runtime=path.join(source,'node_modules','electron','dist');fs.mkdirSync(runtime,{recursive:true});fs.writeFileSync(path.join(runtime,'electron.exe'),'synthetic runtime fixture');
 for(const name of ['qrcode','jsqr','lucide']){const dir=path.join(source,'node_modules',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name,version:'test'}));}
 const clientFile=path.join(root,'release client.json');fs.writeFileSync(clientFile,JSON.stringify({...fixture,tokens:{access_token:'never-package-account-tokens'}}));
 execFileSync(process.execPath,[buildFile,'--public','--google-client',clientFile],{cwd:root,stdio:'pipe'});
 const output=path.join(root,'outputs','Glacia Authenticator Public v0.4.3'),target=path.join(output,'resources','app');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(target,'google-client.json'),'utf8')),fixture);assert.equal(loadReleaseConfig(target).publicRelease,true);assert.equal(fs.existsSync(path.join(output,'GOOGLE SYNC SETUP.md')),false);
 for(const file of ['folders.cjs','features.js','features-ui.js','features.css','assets/service-logos/sega.svg'])assert.equal(fs.existsSync(path.join(target,file)),true,file);
 assert.equal(JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8')).license,'Apache-2.0');
 for(const name of ['LICENSE','NOTICE','TERMS OF USE.txt']){
  const source=name==='TERMS OF USE.txt'?path.join(root,'work','installer-terms.txt'):path.join(root,name);
  for(const dir of [output,target])assert.equal(fs.readFileSync(path.join(dir,name),'utf8'),fs.readFileSync(source,'utf8'));
 }
 const readme=fs.readFileSync(path.join(output,'READ ME.txt'),'utf8');assert(readme.includes('No Google Cloud project or setup file is needed'));assert(!readme.includes('Create a Google Cloud Desktop OAuth client'));assert(!readme.includes('Advanced setup'));
});
