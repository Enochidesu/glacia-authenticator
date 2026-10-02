'use strict';
const fs=require('node:fs'),path=require('node:path'),child=require('node:child_process'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'updates-upgrade-native-'+Date.now()),profile=path.join(fixture,'profile');
if(!fixture.startsWith(path.join(__dirname,'updates-upgrade-native-')))throw Error('Unsafe synthetic fixture path');
const guid='9cfa713d-cf6d-4a68-936b-6a4ee905ded4',shortcut='Glacia Authenticator Update Test';
const registry=child.spawnSync('reg',['query','HKCU\\Software\\'+guid],{windowsHide:true});if(registry.status===0&&!process.argv[2])throw Error('The disposable update identity already has an installation');
fs.mkdirSync(profile,{recursive:true});
const reportPath=path.join(root,'validation/update-upgrade.json');fs.mkdirSync(path.dirname(reportPath),{recursive:true});
function run(exe,args,raw=false){return new Promise((resolve,reject)=>{const isElectron=path.basename(exe)==='electron.exe';const p=child.spawn(exe,args,{cwd:root,windowsHide:true,windowsVerbatimArguments:raw,stdio:isElectron?'ignore':'pipe'});let stderr='';p.stderr?.on('data',chunk=>stderr+=chunk);p.stdout?.on('data',chunk=>stderr+=chunk);p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(path.basename(exe)+' exited '+code+': '+stderr)));});}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(predicate){for(let i=0;i<240;i++){if(predicate())return;await pause(250);}throw Error('Synthetic installer upgrade did not finish');}
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function build(version){
 const project=path.join(fixture,'project-'+version),app=path.join(fixture,'app-'+version),out=path.join(fixture,'installers-'+version);
 fs.mkdirSync(project,{recursive:true});fs.cpSync(path.join(root,'outputs/Glacia Authenticator Public v0.5.0'),app,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(app,'resources/app/package.json')));manifest.version=version;
 fs.writeFileSync(path.join(project,'package.json'),JSON.stringify(manifest));fs.writeFileSync(path.join(app,'resources/app/package.json'),JSON.stringify(manifest));
 // Force-run must start a harmless fixture, never the real app's default vault.
 fs.writeFileSync(path.join(app,'resources/app/main.cjs'),`const {app}=require('electron'),fs=require('node:fs');app.whenReady().then(()=>{fs.writeFileSync(${JSON.stringify(path.join(fixture,'relaunched-'+version+'.json'))},JSON.stringify({version:${JSON.stringify(version)}}));app.quit();});`);
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'installer-config.json')));
 config.appId='project.wintergarden.glacia.updatetest';config.publish=null;config.electronVersion=require('./winterbell-app/package.json').devDependencies.electron;
 config.directories={output:out,buildResources:path.join(__dirname,'winterbell-app')};config.win.icon=path.join(__dirname,'winterbell-app/winterbell.ico');
 Object.assign(config.nsis,{guid,shortcutName:shortcut,uninstallDisplayName:shortcut,artifactName:'Glacia-Update-Test-${version}.exe',include:path.join(__dirname,'installer-options.nsh'),license:path.join(__dirname,'installer-agreement.txt')});
 const configFile=path.join(fixture,'config-'+version+'.json');fs.writeFileSync(configFile,JSON.stringify(config));
 await run(process.execPath,[path.join(__dirname,'release-tools/node_modules/electron-builder/cli.js'),'--projectDir',project,'--prepackaged',app,'--config',configFile,'--win','nsis','--x64','--publish','never']);
 return path.join(out,'Glacia-Update-Test-'+version+'.exe');
}
(async()=>{
 process.env.ELECTRON_BUILDER_CACHE=path.join(__dirname,'release-cache');process.env.CSC_IDENTITY_AUTO_DISCOVERY='false';
 const oldInstaller=process.argv[2]?path.join(fixture,'installers-0.5.0/Glacia-Update-Test-0.5.0.exe'):await build('0.5.0'),nextInstaller=process.argv[2]?path.join(fixture,'installers-0.5.1/Glacia-Update-Test-0.5.1.exe'):await build('0.5.1');
 const selectedParent=path.join(fixture,'Chosen folder with spaces'),installDir=path.join(selectedParent,'Glacia Authenticator');
 fs.mkdirSync(selectedParent,{recursive:true});fs.writeFileSync(path.join(selectedParent,'keep-parent.txt'),'synthetic parent sentinel');
 if(oldInstaller)await run(oldInstaller,['/S','/DESKTOPSHORTCUT=1','/D='+selectedParent],true);
 const installedExe=path.join(installDir,'Glacia Authenticator.exe');assert(fs.existsSync(installedExe));
 const core=require('./winterbell-app/core.cjs');const record=core.normalize({name:'Synthetic upgrade account',email:'fixture@example.invalid',secret:'JBSWY3DPEHPK3PXP'});
 fs.writeFileSync(path.join(profile,'vault.winterbell'),await core.encryptBackup([record],'Synthetic upgrade vault password'));
 fs.writeFileSync(path.join(profile,'preferences.json'),JSON.stringify({dark:true,language:'ja',autoLock:15}));
 fs.writeFileSync(path.join(profile,'google-sync.secure'),'Synthetic Google connection sentinel');
 const files=['vault.winterbell','preferences.json','google-sync.secure'].map(name=>path.join(profile,name));const before=files.map(hash);
 const desktop=process.env.USERPROFILE&&path.join(process.env.USERPROFILE,'Desktop');
 // Query the OS-known Desktop path, including OneDrive redirection, without touching real shortcuts.
 const desktopQuery=child.execFileSync('reg',['query','HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders','/v','Desktop'],{encoding:'utf8',windowsHide:true});
 const desktopValue=desktopQuery.split(/REG_\w+\s+/)[1]?.trim().replace(/%([^%]+)%/g,(_all,name)=>process.env[name]||'');
 const link=path.join(desktopValue||desktop,shortcut+'.lnk');assert(fs.existsSync(link));const linkBefore=hash(link);
 const bytes=fs.readFileSync(nextInstaller),sha512=crypto.createHash('sha512').update(bytes).digest('base64');
 const metadata=`version: 0.5.1\nfiles:\n  - url: update.exe\n    sha512: ${sha512}\n    size: ${bytes.length}\npath: update.exe\nsha512: ${sha512}\n`;
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://127.0.0.1').pathname;if(pathname==='/latest.yml'){res.end(metadata);}else if(pathname==='/update.exe'){res.setHeader('Content-Length',bytes.length);res.end(bytes);}else{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const runnerReport=path.join(fixture,'engine-result.json');fs.rmSync(runnerReport,{force:true});fs.rmSync(path.join(fixture,'relaunched-0.5.1.json'),{force:true});const runnerArguments=path.join(fixture,'runner-arguments.json');fs.writeFileSync(runnerArguments,JSON.stringify({installDir,profile,feedUrl:'http://127.0.0.1:'+server.address().port+'/',reportFile:runnerReport}));
  await run('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',['-NoProfile','-ExecutionPolicy','RemoteSigned','-File',path.join(__dirname,'run-native-update-install.ps1'),runnerArguments]);
  await wait(()=>fs.existsSync(path.join(fixture,'relaunched-0.5.1.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(installDir,'resources/app/package.json'))).version,'0.5.1');
  assert.deepEqual(files.map(hash),before);assert.equal(hash(link),linkBefore);assert(fs.existsSync(path.join(selectedParent,'keep-parent.txt')));assert(!fs.existsSync(path.join(installDir,'Glacia Authenticator')));
  const restored=await core.decryptBackup(fs.readFileSync(files[0],'utf8'),'Synthetic upgrade vault password');assert.equal(restored.accounts[0].name,'Synthetic upgrade account');restored.key.fill(0);
  await run(path.join(installDir,'Uninstall Glacia Authenticator.exe'),['/S','_?='+installDir],true);assert(!fs.existsSync(installedExe));assert(!fs.existsSync(link));
  fs.writeFileSync(reportPath,JSON.stringify({ok:true,realNsisUpdater:true,syntheticVersions:['0.5.0','0.5.1'],verifiedDownload:true,customDirectoryPreserved:true,noDuplicateFolder:true,desktopShortcutPreserved:true,vaultPreferencesAndConnectionUnchanged:true,encryptedVaultReopens:true,updatedAppRelaunched:true,testUninstalled:true,loopbackOnly:true}));
  console.log('Real updater download, install, restart and data/shortcut preservation passed.');
 }finally{server.close();}
})().catch(error=>{fs.writeFileSync(reportPath,JSON.stringify({ok:false,error:error.stack,fixture}));console.error(error.stack);process.exitCode=1;});
