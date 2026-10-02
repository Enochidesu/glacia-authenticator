'use strict';
// A separate installer identity prevents disposable checks from upgrading or
// uninstalling the user's chosen installation or replacing their shortcuts.
const fs = require('node:fs'), path = require('node:path'), child = require('node:child_process');
const root = path.resolve(__dirname, '..'), version = require('./winterbell-app/package.json').version;
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'installer-config.json'), 'utf8'));
config.appId = 'project.wintergarden.glacia.installertest';
config.publish = null; // Test artifacts must never replace the production update manifest.
config.nsis.guid = 'c653d7da-7dde-4a33-a4de-a6287bdabf55';
config.nsis.shortcutName = 'Glacia Authenticator Installer Test';
config.nsis.uninstallDisplayName = 'Glacia Authenticator Installer Test';
config.nsis.artifactName = 'Glacia Installer Test ${version}.exe';
const temp = path.join(__dirname, 'installer-test-native-build');
fs.mkdirSync(temp, {recursive:true});
const configFile = path.join(temp, 'config.json');
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
fs.rmSync(path.join(root, `outputs/Glacia Authenticator Public v${version}`, 'debug.log'), {force:true});
child.execFileSync(process.execPath, [path.join(__dirname, 'release-tools/node_modules/electron-builder/cli.js'),
  '--projectDir', path.join(__dirname, 'winterbell-app'), '--prepackaged', path.join(root, `outputs/Glacia Authenticator Public v${version}`),
  '--config', configFile, '--win', 'nsis', '--x64', '--publish', 'never'],
  {cwd:root, stdio:'inherit', env:{...process.env,ELECTRON_BUILDER_CACHE:path.join(__dirname,'release-cache'),CSC_IDENTITY_AUTO_DISCOVERY:'false'}});
