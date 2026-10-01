'use strict';
const electron=require('electron'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const restart=process.argv.includes('restart'),packaged=process.argv.includes('packaged');
const appDir=path.resolve(__dirname,packaged?'../outputs/Glacia Authenticator v0.4.3/resources/app':'winterbell-app');
const resultFile=path.join(__dirname,restart?'native-language-restart-result.json':'native-language-result.json');
const profileName=restart?JSON.parse(fs.readFileSync(path.join(__dirname,'native-language-result.json'),'utf8')).profileName:'language-native-'+Date.now()+'-'+process.pid;
assert.match(profileName,/^language-native-\d+-\d+$/);process.env.WINTERBELL_DATA_DIR=path.join(__dirname,profileName);
const handlers=new Map(),errors=[],checks=[],unknown=new Set();let main,mini,tray,menu,finished=false,dialogOptions;
function finish(ok,error){if(finished)return;finished=true;fs.writeFileSync(resultFile,JSON.stringify({ok,error,profileName,checks,untranslated:[...unknown],rendererErrors:errors,syntheticProfile:true,packaged},null,2));electron.app.exit(ok?0:1);}
process.on('uncaughtException',e=>finish(false,e.stack));process.on('unhandledRejection',e=>finish(false,e.stack));
const load=Module._load;Module._load=function(name,parent,isMain){if(name==='electron')return {...electron,
 BrowserWindow:class extends electron.BrowserWindow{constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,backgroundThrottling:false}});if(options.title==='Glacia Authenticator')main=this;else mini=this;}show(){}focus(){}},
 Tray:function(icon){tray=new electron.Tray(icon);const set=tray.setContextMenu.bind(tray);tray.setContextMenu=value=>{menu=value;return set(value);};return tray;},
 dialog:{...electron.dialog,showOpenDialog:async(_window,options)=>{dialogOptions=options;return {canceled:true};},showSaveDialog:async(_window,options)=>{dialogOptions=options;return {canceled:true};}},
 ipcMain:{handle:(name,fn)=>{handlers.set(name,fn);electron.ipcMain.handle(name,fn);}}
 };return load.apply(this,arguments);};
electron.app.on('browser-window-created',(_event,w)=>w.webContents.on('console-message',d=>{if(d.level==='error')errors.push(d.message);}));
const pause=ms=>new Promise(r=>setTimeout(r,ms)),js=code=>main.webContents.executeJavaScript(code),miniJS=code=>mini.webContents.executeJavaScript(code);
async function wait(predicate){for(let i=0;i<350;i++){if(await predicate())return;await pause(20);}throw Error('Language UI did not reach expected state.');}
async function call(name,arg,window=main){const result=await handlers.get('winterbell:'+name)({sender:window.webContents,senderFrame:window.webContents.mainFrame},arg);if(!result.ok)throw Error(result.error);return result.data;}
async function click(selector){await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(40);}
async function language(value){await js(`var languageSelect=document.querySelector('#wb-language');languageSelect.value=${JSON.stringify(value)};languageSelect.dispatchEvent(new Event('change',{bubbles:true}))`);await wait(()=>js(`document.documentElement.lang===${JSON.stringify(value)}`));}
async function preview(name){if(!process.argv.includes('preview'))return;main.showInactive();await pause(650);fs.writeFileSync(path.join(__dirname,'language-native-preview-'+name+'.png'),(await main.webContents.capturePage()).toPNG());main.hide();}
async function audit(){const texts=await js(`(()=>{const ignore='[data-i18n-skip],script,style,svg,.wb-service-mark,.wb-account-email,[data-code],.wb-drag-preview,#mini-name,#mini-email,#mini-code,.mini-account strong,.mini-account small,.wb-phone-account strong,.wb-phone-account small,.wb-choice-row strong';const values=[];const walker=document.createTreeWalker(document.querySelector('#winterbell-ui'),NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode,text=node.data.trim();if(text&&node.parentElement.getClientRects().length&&!node.parentElement.closest(ignore)&&/[a-z]{2}/i.test(text))values.push(text);}return values;})()`);
 const {translate}=require(path.join(appDir,'i18n.js'));
 const translatedPatterns=Object.values(require(path.join(appDir,'i18n.js')).catalog).map(row=>new RegExp('^'+row.id.split(/(\{\w+\})/).map(part=>/^\{\w+\}$/.test(part)?'.+?':part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('')+'$'));
 for(const text of texts){if(['Glacia','Glacia Authenticator','Enochi Sasaina','SHA1','SHA256','SHA512'].includes(text))continue;if(translate(text,'id')===text&&!translatedPatterns.some(pattern=>pattern.test(text)))unknown.add(text);}
}
async function test(){try{
 await wait(()=>main&&tray&&menu&&!main.webContents.isLoading());
 assert.equal((await call('status')).preferences.language,restart?'ja':'en');
 if(restart){await wait(()=>js("document.documentElement.lang==='ja'"));assert.equal(await js("document.querySelector('[data-page=settings]').textContent.trim()"),'設定');assert.equal(menu.items[0].label,'Glacia を開く');await call('unlock',{password:'Synthetic language vault password'});await wait(()=>js("document.querySelector('#wb-locked').hidden"));await click('[data-page=settings]');assert.equal(await js("document.querySelector('#wb-language').value"),'ja');main.setSize(780,930);await preview('ja-dark-narrow');checks.push('Japanese persists across a real process restart, including lock screen, Settings and tray');assert.equal(errors.length,0);finish(true);return;}
 await call('unlock',{password:'Synthetic language vault password',remember:false});
 await call('add',{name:'Settings',email:'Work',secret:'JBSWY3DPEHPK3PXP'});
 await call('add',{name:'SEGA',email:'example@example.invalid',secret:'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'});
 await wait(()=>js("document.querySelectorAll('.wb-account').length===2"));await click('[data-page=settings]');
 assert.deepEqual(await js("[...document.querySelector('#wb-language').options].map(o=>[o.value,o.textContent])"),[['en','English'],['id','Bahasa Indonesia'],['ja','日本語']]);
 await js("window.originalSelect=document.querySelector('#wb-language');void 0");await language('id');
 assert.equal(await js("document.querySelector('#wb-heading').textContent"),'Sesuaikan untuk Anda');
 assert.equal(await js("document.querySelector('[data-page=settings]').textContent.trim()"),'Pengaturan');
 assert.equal(await js("window.originalSelect===document.querySelector('#wb-language')"),true);
 assert.equal(menu.items[0].label,'Buka Glacia');assert.equal(menu.items[1].label,'Pengaturan');assert.equal(menu.items[3].label,'Keluar aplikasi');await audit();await preview('id-light');
 for(const width of [1150,780]){main.setSize(width,930);await pause(40);assert.equal(await js("document.documentElement.scrollWidth>window.innerWidth"),false);}
 for(const [selector,value] of [['#wb-appearance','dark'],['#wb-layout','compact'],['#wb-auto-lock','0']]){await js(`var option=document.querySelector(${JSON.stringify(selector)});option.value=${JSON.stringify(value)};option.dispatchEvent(new Event('change',{bubbles:true}))`);await pause(40);}await call('preferences',{language:'ja'});await wait(()=>js("document.documentElement.lang==='ja'"));
 assert.equal((await call('status')).locked,false);assert.equal((await call('status')).accounts.length,2);
 assert.equal((await call('status')).preferences.dark,true);assert.equal((await call('status')).preferences.layout,'compact');assert.equal((await call('status')).preferences.autoLock,0);
 await preview('ja-dark-narrow');
 checks.push('English default; dropdown switches instantly in place; theme, layout, lock setting and vault session preserved');
 await language('en');assert.equal(await js("document.querySelector('#wb-heading').textContent"),'Make it yours');
 for(const invalid of ['fr',null,{},true]){await call('preferences',{language:invalid});assert.equal((await call('status')).preferences.language,'en');}
 await language('id');await click('[data-page=all]');assert.equal(await js("document.querySelector('.wb-service-text h3').textContent"),'Settings');assert.equal(await js("document.querySelector('.wb-account-email').textContent"),'Work');
 assert.equal(await js("document.querySelector('[data-copy]').getAttribute('aria-label')"),'Salin kode Settings');
 await click('#wb-add');await js("document.querySelector('#wb-new-service').value='Private typed value';document.querySelector('#wb-new-secret').value='NOT-A-REAL-SECRET-1';document.querySelector('#wb-new-service').focus();window.originalInput=document.activeElement;void 0");
 await call('preferences',{language:'ja'});await wait(()=>js("document.querySelector('#wb-modal-title').textContent==='認証キーを追加'"));
 assert.equal(await js("document.querySelector('#wb-new-service').value"),'Private typed value');assert.equal(await js("document.querySelector('#wb-new-secret').value"),'NOT-A-REAL-SECRET-1');assert.equal(await js("document.activeElement===window.originalInput"),true);
 await click('[data-save-manual]');await wait(()=>js("!document.querySelector('#wb-dialog-error').hidden"));assert.equal(await js("document.querySelector('#wb-dialog-error').textContent"),'セットアップキーには Base32 の英字 A–Z と数字 2–7 を使ってください。');await click('[data-close-modal]');
 checks.push('Japanese dialogs and errors; typed inputs, focus, account names and labels survive live switching');
 await call('preferences',{language:'id'});await click('[data-delete]');await wait(()=>js("!!document.querySelector('[data-delete-confirm]')"));
 assert.equal(await js("document.querySelector('#wb-modal-title').textContent"),'Hapus autentikator?');assert.equal(await js("document.querySelector('.wb-modal strong').textContent"),'Settings');assert.match(await js("document.querySelector('[data-delete-confirm]').textContent"),/^Hapus \(\d dtk\)$/);
 await js("window.originalDelete=document.querySelector('[data-delete-confirm]');void 0");await call('preferences',{language:'ja'});await wait(()=>js("document.querySelector('#wb-modal-title').textContent==='認証キーを削除しますか？'"));
 assert.equal(await js("window.originalDelete===document.querySelector('[data-delete-confirm]')"),true);await wait(()=>js("!document.querySelector('[data-delete-confirm]').disabled"));assert.equal(await js("document.querySelector('[data-delete-confirm]').textContent"),'削除');await click('[data-close-modal]');
 checks.push('Delete countdown keeps its timer and confirmation state across languages; cancel retains accounts');
 await call('preferences',{language:'id'});await click('[data-page=backup]');await audit();await click('[data-export]');await audit();await click('[data-export-format=text]');await audit();assert.equal(await js("document.querySelector('.wb-choice-row strong').textContent"),'Settings');assert.equal(await js("document.querySelector('.wb-choice-row small [data-i18n-skip]').textContent"),'Work');await click('[data-close-modal]');
 await click('[data-paste-import]');await js("document.querySelector('#wb-import-text').value='otpauth://totp/Settings:Work?secret=JBSWY3DPEHPK3PXP&issuer=Settings'");await click('[data-review-text]');await wait(()=>js("document.querySelectorAll('[data-import-id]').length===1"));await audit();assert.equal(await js("document.querySelector('.wb-choice-row strong').textContent"),'Settings');await click('[data-close-modal]');
 await click('[data-phone-picker]');await audit();await click('[data-qr]');await wait(()=>js("!!document.querySelector('.wb-transfer-qr')"));await audit();assert.equal(await js("document.querySelector('.wb-modal p strong').textContent"),'Settings');await click('[data-close-modal]');
 await click('[data-page=cloud]');await audit();
 await call('chooseImport');assert.equal(dialogOptions.title,'Impor autentikator atau pulihkan cadangan Glacia');await call('chooseQR');assert.equal(dialogOptions.filters[0].name,'Gambar QR');
 checks.push('Backup, import review, phone QR, Google sync, accessible labels and native file dialogs translated');
 tray.emit('click',{},tray.getBounds());await wait(()=>mini&&!mini.webContents.isLoading());await wait(()=>miniJS("document.querySelector('#mini-open').textContent.trim()==='Buka Glacia'"));assert.equal(await miniJS("document.querySelector('#mini-name').textContent"),'Settings');
 await call('preferences',{language:'ja'});await wait(()=>miniJS("document.querySelector('#mini-open').textContent.trim()==='Glacia を開く'"));assert.match(await miniJS("document.querySelector('#mini-time').textContent"),/^残り \d+秒$/);assert.equal(menu.items[1].label,'設定');
 await call('lock');await wait(()=>js("!document.querySelector('#wb-locked').hidden"));await wait(()=>miniJS("document.querySelector('#mini-message').textContent==='Glacia を開いて保管庫のロックを解除してください。'"));assert.equal(await js("document.querySelector('#wb-locked h2').textContent"),'Glacia へようこそ。');
 checks.push('Open tray panel, native tray menu and locked vault update immediately');
 assert.deepEqual([...unknown],[],'Untranslated visible app-owned text');assert.equal(errors.length,0);finish(true);
 }catch(error){finish(false,error.stack);}}
setTimeout(()=>finish(false,'Native language test timed out'),45000).unref();require(path.join(appDir,'main.cjs'));test();
