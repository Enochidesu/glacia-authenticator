'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {publicPageUrl}=require('../public-pages.cjs');
test('public page requests resolve only the fixed HTTPS privacy page',()=>{
 assert.equal(publicPageUrl('privacy'),'https://enochidesu.github.io/glacia-authenticator/privacy.html');
 for(const input of [null,undefined,{},['privacy'],'constructor','__proto__','https://evil.invalid','file:///C:/Windows','privacy?next=https://evil.invalid','javascript:alert(1)'])assert.throws(()=>publicPageUrl(input),/unavailable/);
});
