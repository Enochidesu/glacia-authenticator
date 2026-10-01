'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {translate,normalizeLanguage,catalog}=require('../i18n.js');
test('English defaults and unsupported saved locales fall back without changing text',()=>{
 for(const value of [undefined,null,'','fr','EN',true,{},['ja']])assert.equal(normalizeLanguage(value),'en');
 for(const language of ['en','id','ja'])assert.equal(normalizeLanguage(language),language);
 assert.equal(translate('  Settings  ','en'),'  Settings  ');assert.equal(translate('Settings','fr'),'Settings');
 assert.equal(translate('unknown OS error','ja'),'unknown OS error');
});
test('all translations retain exactly the same placeholders in both languages',()=>{
 const placeholders=text=>(text.match(/\{\w+\}/g)||[]).sort();
 for(const [source,translations] of Object.entries(catalog))for(const language of ['id','ja']){assert.ok(translations[language].trim(),source);assert.deepEqual(placeholders(translations[language]),placeholders(source),source);}
});
test('dynamic messages translate counts and error details while preserving account data',()=>{
 assert.equal(translate('Delete (5s)','ja'),'削除（5秒）');
 assert.equal(translate('  Copy code for Settings <script>日本語</script>  ','id'),'  Salin kode Settings <script>日本語</script>  ');
 assert.equal(translate('Signed in as Settings@example.invalid','ja'),'Settings@example.invalid でサインイン中');
 assert.equal(translate('2 accounts imported; 1 duplicate skipped.','id'),'2 akun diimpor; 1 duplikat dilewati.');
 assert.equal(translate('Line 4: Enter a valid otpauth://totp/ link.','ja'),'4行目：有効な otpauth://totp/ リンクを入力してください。');
 assert.equal(translate('Google account','id'),'Google account');
 assert.equal(translate('23s · 30 SEC','ja'),'23秒 · 30秒周期');
});
test('all reachable application validation errors have translations',()=>{
 const directory=path.resolve(__dirname,'..');
 for(const name of ['main.cjs','core.cjs','google-sync.cjs','remembered-vault.cjs','onboarding.cjs','migration.cjs','startup.cjs']){
  const source=fs.readFileSync(path.join(directory,name),'utf8');
  for(const match of source.matchAll(/(?:Error|fail)\('([^']+)'\)/g)){
   // Developer-only OAuth import validation has no renderer/IPC entry point.
   if(['Choose the OAuth JSON downloaded from Google Cloud.','Choose a Google OAuth client of type Desktop app.','Google setup is provided by Glacia.','Disconnect Google before changing the OAuth client.'].includes(match[1]))continue;
   for(const language of ['id','ja'])assert.notEqual(translate(match[1],language),match[1],name+': '+match[1]);
  }
 }
});
