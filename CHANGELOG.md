# Changelog

## 0.5.0

Published as a regular Windows x64 [release](https://github.com/Enochidesu/glacia-authenticator/releases/tag/v0.5.0) on October 2, 2026.

- Check for updates manually in Settings or once per fresh app launch. Stable releases are the default; pre-release updates are optional.
- Approve downloads, follow progress, cancel a download, or postpone an available update for 24 hours. Restart & update installs silently in the existing installation folder.
- Preserve preferences, encrypted Google credentials, vault data and the current unlocked session during an approved update.
- Use one Glacia password for the local vault and Google sync. Existing vaults offer migration without replacing authenticator accounts or encrypted cloud snapshots.
- Change the password in Settings by verifying the old password and entering the new password twice. New Glacia passwords require at least six characters. Interrupted changes can recover using a Windows-protected journal.
- Start quietly in the system tray with Windows. Minimize hides the app in the tray.
- Choose Minimize to tray, Exit app or Cancel in a Glacia-themed close dialog, with an optional remembered choice. Change that choice later in Settings.
- Translate the new settings and dialogs in English, Bahasa Indonesia and Japanese.

Users of 0.4.3 must install the first updater-enabled version manually. Existing exported backups keep their original password. Changing a linked cloud password requires the original Google account and an internet connection.

## 0.4.3

- Offer an optional desktop shortcut and a dedicated Glacia Authenticator installation folder.
- Check the selected drive's available space correctly.
- Include Glacia's Terms of Use and Apache 2.0 software license in the installer.
