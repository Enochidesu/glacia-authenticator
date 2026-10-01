const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const git=(args,options={})=>execFileSync('git',args,{cwd:root,maxBuffer:128*1024*1024,...options});
const historyObjects=git(['rev-list','--objects','--all'],{encoding:'utf8'}).trim().split(/\r?\n/).map(line=>{
 const space=line.indexOf(' ');return {sha:space<0?line:line.slice(0,space),file:space<0?'':line.slice(space+1)};
});
const stagedObjects=git(['ls-files','--stage'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).map(line=>{
 const [metadata,file]=line.split('\t');return {sha:metadata.split(' ')[1],file};
});
const listed=[...new Map([...historyObjects,...stagedObjects].map(o=>[o.sha,o])).values()];
const types=git(['cat-file','--batch-check=%(objectname) %(objecttype)'],{input:listed.map(o=>o.sha).join('\n')+'\n',encoding:'utf8'}).trim().split(/\r?\n/);
const blobs=listed.filter((o,index)=>types[index].endsWith(' blob'));
const findings=[];
const privatePath=/(^|\/)(?:\.env(?:\..*)?|client_secret[^/]*\.json|[^/]*OAuth[^/]*\.json|google-client\.json|google-sync\.secure[^/]*|remembered-login\.secure[^/]*|vault\.winterbell[^/]*|credentials\.json)$/i;
const signatures=[
 ['Google client secret',/GOCSPX-[A-Za-z0-9_-]{20,}/],
 ['Google API key',/AIza[A-Za-z0-9_-]{30,}/],
 ['Google access token',/ya29\.[A-Za-z0-9_.-]{30,}/],
 ['Google refresh token',/1\/\/[A-Za-z0-9_-]{40,}/],
 ['GitHub token',/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
 ['Private signing key',/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
 ['AWS access key',/AKIA[A-Z0-9]{16}/],
 ['Live Google desktop registration',/\b\d{6,}-[a-z0-9]{15,}\.apps\.googleusercontent\.com\b/],
];
const contents=git(['cat-file','--batch'],{input:blobs.map(o=>o.sha).join('\n')+'\n'});
let offset=0,scannedBytes=0;
for(const blob of blobs){
 const end=contents.indexOf(10,offset);const header=contents.subarray(offset,end).toString('utf8');
 const size=Number(header.split(' ')[2]);offset=end+1;
 const data=contents.subarray(offset,offset+size);offset+=size+1;scannedBytes+=size;
 if(privatePath.test(blob.file))findings.push({file:blob.file,object:blob.sha,category:'Private file path'});
 if(!data.includes(0)){
  const source=data.toString('utf8');
  for(const [category,pattern] of signatures)if(pattern.test(source))findings.push({file:blob.file,object:blob.sha,category});
 }
}
const report={ok:findings.length===0,scope:'All locally reachable Git history and staged files',commitCount:Number(git(['rev-list','--count','--all'],{encoding:'utf8'})),blobCount:blobs.length,scannedBytes,checks:['Private vault/token/config filenames','Recognizable Google and GitHub credentials','Private signing keys and AWS access keys','Live Google desktop registration IDs'],findings,limitation:'Pattern and path scan; does not prove that arbitrary unrecognized secrets are absent. Synthetic test vectors are intentional.'};
fs.mkdirSync(path.join(root,'validation'),{recursive:true});
fs.writeFileSync(path.join(root,'validation','source-history-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.ok)process.exitCode=1;
