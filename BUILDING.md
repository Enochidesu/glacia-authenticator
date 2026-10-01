# Building Glacia Authenticator

Glacia is a Windows x64 Electron app. Use Node.js 24 and pnpm 11. App dependencies and release tools are pinned in their respective lockfiles. Run the commands below from the repository root unless stated otherwise.

## Development and tests

```powershell
Push-Location .\work\winterbell-app
pnpm install --frozen-lockfile
node .\node_modules\electron\install.js
pnpm test
$env:WINTERBELL_DATA_DIR = Join-Path (Resolve-Path ..).Path 'dev-profile'
pnpm start
Pop-Location
Remove-Item Env:\WINTERBELL_DATA_DIR -ErrorAction SilentlyContinue
```

The override selects an isolated development vault. Never use real authenticator secrets as test fixtures. Historical `winterbell` storage, encryption and IPC identifiers are intentional compatibility identifiers.

## App packaging

The legal files are included in the repository. To regenerate them from the approved website Terms of Use and Apache license, run `node work/prepare-installer-agreement.cjs`.

```powershell
node .\work\package-winterbell.cjs
```

This creates `outputs/Glacia Authenticator v0.4.3`. Keep its executable together with all adjacent runtime files. Close that build before using `--refresh` to update it. A fresh development profile supports a local vault; the public release includes the separate Google Desktop registration.

To build a public Google-enabled app, supply your own Desktop OAuth registration file stored outside the repository:

```powershell
node .\work\package-winterbell.cjs --public --google-client 'C:\private\desktop-oauth.json'
```

Output: `outputs/Glacia Authenticator Public v0.4.3`. The packager includes the app registration only; it does not copy a user's account tokens or vault. The developer must configure the corresponding Google project and complete any required verification separately. Do not commit the registration file.

## Windows executable and installer

```powershell
Push-Location .\work\release-tools
pnpm install --frozen-lockfile
Pop-Location
node .\work\brand-windows-exe.mjs
.\work\verify-public-exe.ps1
.\work\build-installer.ps1
```

Run executable verification in an interactive Windows session. It opens and gracefully closes the public build using a separate synthetic profile and writes a new ignored report. The installer builder requires this report to match the build's executable path and version. No saved report is needed in a fresh clone.

The offline NSIS installer appears under `outputs/installer/`. It installs for the current Windows user, offers an optional desktop shortcut, uses a dedicated Glacia Authenticator folder, and preserves separately stored vault data on uninstall. The current configuration produces unsigned binaries and does not publish automatically.

## Optional automated Windows checks

After packaging the private and public apps, `work/run-native-checks.ps1` exercises the actual Electron UI with synthetic profiles. Unit tests and these checks do not require real account secrets.

For installer testing on a PC that already has Glacia installed, use the separate test identity:

```powershell
node .\work\build-installer-test.cjs
.\work\verify-installer.ps1 -InstallerPath 'outputs/installer/Glacia Installer Test 0.4.3.exe' -ShortcutName 'Glacia Authenticator Installer Test' -RegistryKey 'c653d7da-7dde-4a33-a4de-a6287bdabf55'
.\work\verify-installer.ps1 -InstallerPath 'outputs/installer/Glacia Installer Test 0.4.3.exe' -ShortcutName 'Glacia Authenticator Installer Test' -RegistryKey 'c653d7da-7dde-4a33-a4de-a6287bdabf55' -DesktopShortcut -ExactFolder
```

Reports are generated under `validation/`; app packages, caches, synthetic profiles and reports remain local and ignored. `node work/audit-source-history.cjs` checks reachable Git history and staged files for recognizable credentials and private file paths. This pattern scan is an additional check, not a complete secret detector.

## Website and legal files

GitHub Pages serves the root HTML/CSS/SVG files. `website/` retains the corresponding source copy used by the legal-file and branding helpers. Keep both copies synchronized when reviewing website changes.

Original software code is Apache 2.0; see `LICENSE` and `NOTICE`. Original Glacia branding and website content are excluded from that software license. Third-party notices must remain in app builds.
