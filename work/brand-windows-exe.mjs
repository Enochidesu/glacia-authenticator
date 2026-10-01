import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rcedit} from './release-tools/node_modules/rcedit/lib/index.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'outputs','Glacia Authenticator Public v0.4.3');
const exe=path.join(output,'Glacia Authenticator.exe');
if(!fs.existsSync(exe)||JSON.parse(fs.readFileSync(path.join(output,'resources/app/package.json'),'utf8')).glaciaReleaseMode!=='public')throw Error('Build the public Glacia app first.');
await rcedit(exe,{
 icon:path.join(root,'work/winterbell-app/winterbell.ico'),
 'file-version':'0.4.3.0',
 'product-version':'0.4.3.0',
 'version-string':{
  ProductName:'Glacia Authenticator',FileDescription:'Glacia Authenticator',
  CompanyName:'Winter Garden Project',InternalName:'Glacia Authenticator',
  OriginalFilename:'Glacia Authenticator.exe',LegalCopyright:'Copyright 2026 Enochi Sasaina'
 }
});
console.log('Branded Glacia executable: '+exe);
