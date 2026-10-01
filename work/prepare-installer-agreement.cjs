'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'website', 'terms.html'), 'utf8');
const decode = text => text.replace(/<a\b[^>]*href="privacy\.html"[^>]*>(.*?)<\/a>/g, '$1 (https://enochidesu.github.io/glacia-authenticator/privacy.html)')
  .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const intro = html.match(/<div class="intro"><p>(.*?)<\/p><\/div>/s)?.[1];
const sections = [...html.matchAll(/<h2>(.*?)<\/h2>((?:<p>.*?<\/p>)+)/gs)];
if (!intro || sections.length !== 6) throw Error('Expected the reviewed Glacia Terms of Use with six sections.');
// The dated website's release-preparation sentence is a status note, not a term.
const terms = [
  'GLACIA AUTHENTICATOR - TERMS OF USE', 'Last updated: October 1, 2026',
  decode(intro).replace(' The public installer is still in preparation.', ''),
  ...sections.flatMap(([, heading, body]) => [decode(heading), ...[...body.matchAll(/<p>(.*?)<\/p>/gs)].map(m => decode(m[1]))]),
  'Online terms: https://enochidesu.github.io/glacia-authenticator/terms.html',
  'Privacy policy: https://enochidesu.github.io/glacia-authenticator/privacy.html'
].join('\r\n\r\n');
const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8').trim();
if (!license.includes('Apache License') || !license.includes('END OF TERMS AND CONDITIONS')) throw Error('The full Apache 2.0 license is required.');
fs.writeFileSync(path.join(__dirname, 'installer-terms.txt'), terms + '\r\n');
fs.writeFileSync(path.join(__dirname, 'installer-agreement.txt'), terms + '\r\n\r\nSOFTWARE LICENSE\r\n\r\n' + fs.readFileSync(path.join(root, 'NOTICE'), 'utf8') + '\r\n\r\n' + license + '\r\n');
console.log('Prepared Glacia Terms of Use and the full Apache 2.0 license for the installer.');
