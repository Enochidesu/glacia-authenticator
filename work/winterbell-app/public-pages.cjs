'use strict';
const pages=Object.freeze({privacy:'https://enochidesu.github.io/glacia-authenticator/privacy.html'});
function publicPageUrl(page){
 if(typeof page!=='string'||!Object.hasOwn(pages,page))throw Error('This information page is unavailable.');
 return pages[page];
}
module.exports={publicPageUrl};
