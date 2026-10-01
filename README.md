# Glacia Authenticator

Glacia Authenticator is an app from Winter Garden Project for your two-step verification codes. Created by Enochi Sasaina, it stores keys in an encrypted local vault, generates codes offline, and supports optional encrypted Google Drive sync.

Features include account ordering and folders, encrypted backup and restore, QR imports, a system-tray panel, light and dark themes, and English, Bahasa Indonesia, and Japanese language options.

Download the Windows testing [pre-release](https://github.com/Enochidesu/glacia-authenticator/releases/tag/v0.4.3). Google branding verification is still pending.

The current installer is unsigned, so Windows may display publisher or SmartScreen warnings. There is no automatic updater.

## Source and development

The app source is published on `main`, starting from a clean snapshot containing the files needed to build and test Glacia. Earlier release tags `v0.4.1` through `v0.4.3` were created before the source was published, so their generated source archives contain website files. Use `main` for the app source.

- `work/winterbell-app/`: Electron app source, pinned dependencies and tests.
- `work/`: packaging, installer and automated verification helpers.
- `website/`: website source copy. The root HTML/CSS/SVG files serve the existing GitHub Pages site.

For Windows development, install Node.js 24 and pnpm 11, then run from the repository root:

```powershell
Set-Location .\work\winterbell-app
pnpm install --frozen-lockfile
node .\node_modules\electron\install.js
pnpm test
$env:WINTERBELL_DATA_DIR = Join-Path (Resolve-Path ..).Path 'dev-profile'
pnpm start
```

The data override uses an isolated development profile. Keep authenticator secrets, vaults, account tokens and Google configuration out of commits. The package's `private: true` prevents accidental npm publication; the source repository is public.

Build a private app from the repository root with `node work/package-winterbell.cjs`. Public Google-enabled builds require the developer's separately supplied Desktop OAuth registration. It is intentionally excluded from this repository. See [BUILDING.md](BUILDING.md) for packaging, installer and verification instructions. Generated outputs, test reports and internal development notes are excluded from Git.

GitHub Pages deploys from `main`, root folder. Keep the root website files synchronized with reviewed changes in `website/`.

## License and support

Original Glacia software code is licensed under [Apache 2.0](LICENSE). The Glacia name, logos, original artwork and website content are excluded from that software license; see [NOTICE](NOTICE). Third-party components retain their own licenses and notices.

Contact: enochi3317@gmail.com. Never send passwords, setup keys, or authenticator secrets.

© 2026 Enochi Sasaina. All rights reserved for original branding and website content.
