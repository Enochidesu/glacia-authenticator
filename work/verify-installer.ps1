param(
    [string]$InstallerPath = '',
    [string]$ShortcutName = 'Glacia Authenticator',
    [string]$RegistryKey = '8a6b350b-c7b7-5b16-ac1a-2fd57c5f948b',
    [switch]$DesktopShortcut,
    [switch]$ExactFolder
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'validation') -Force | Out-Null
$installer = if ($InstallerPath) { [IO.Path]::GetFullPath($InstallerPath) } else { Join-Path $projectRoot 'outputs/installer/Glacia-Authenticator-Setup-0.5.0.exe' }
$testRoot = Join-Path $PSScriptRoot ('installer-test-native-' + [Guid]::NewGuid().ToString())
$selectedParent = [IO.Path]::GetFullPath((Join-Path $testRoot 'Glacia Authenticator parent'))
$installDir = Join-Path $selectedParent 'Glacia Authenticator'
if (-not $installDir.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'The installer test target is outside this project.' }
$profile = Join-Path $testRoot 'profile'
$existingInstallation = Get-ItemProperty -LiteralPath ('HKCU:\Software\' + $RegistryKey) -ErrorAction SilentlyContinue
if ($existingInstallation.InstallLocation) { throw 'Do not run the disposable test over an existing Glacia installation.' }
$desktopLink = Join-Path ([Environment]::GetFolderPath('Desktop')) ($ShortcutName + '.lnk')
if (Test-Path -LiteralPath $desktopLink) { throw 'A real Glacia desktop shortcut already exists; use an isolated fixture.' }
New-Item -ItemType Directory -Path $profile -Force | Out-Null
# Keep the launch check independent of the user's close-dialog choice.
[IO.File]::WriteAllText((Join-Path $profile 'preferences.json'),'{"closeBehavior":"exit"}',(New-Object Text.UTF8Encoding($false)))
$realData = Join-Path $env:APPDATA 'Winterbell Authenticator'
$before = @{}
if (Test-Path -LiteralPath $realData) { Get-ChildItem -LiteralPath $realData -File | ForEach-Object { $before[$_.FullName] = (Get-FileHash -LiteralPath $_.FullName).Hash } }
New-Item -ItemType Directory -Path $selectedParent -Force | Out-Null
$sentinel = Join-Path $selectedParent 'keep-this-file.txt'
'An unrelated parent-folder file must remain intact.' | Set-Content -LiteralPath $sentinel
$sentinelHash = (Get-FileHash -LiteralPath $sentinel).Hash
$selectedLocation = if ($ExactFolder) { $installDir + '\' } else { $selectedParent }
$shortcutChoice = if ($DesktopShortcut) { '1' } else { '0' }
$install = Start-Process -FilePath $installer -ArgumentList ('/S /DESKTOPSHORTCUT=' + $shortcutChoice + ' /D=' + $selectedLocation) -WindowStyle Hidden -PassThru -Wait
if ($install.ExitCode -ne 0) { throw 'Silent installer failed.' }
$installedExe = Join-Path $installDir 'Glacia Authenticator.exe'
if (-not (Test-Path -LiteralPath $installedExe)) { throw 'Installed executable is missing.' }
if ((Test-Path -LiteralPath $desktopLink) -ne [bool]$DesktopShortcut) { throw 'Desktop shortcut did not honor the selected choice.' }
if ($DesktopShortcut) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($desktopLink)
    if ($shortcut.TargetPath -ne $installedExe) { throw 'The desktop shortcut targets the wrong executable.' }
}
if (Test-Path -LiteralPath (Join-Path $installDir 'Glacia Authenticator')) { throw 'The installer duplicated the product folder.' }
$sourceExe = Join-Path $projectRoot 'outputs/Glacia Authenticator Public v0.5.0/Glacia Authenticator.exe'
if ((Get-FileHash -LiteralPath $installedExe).Hash -ne (Get-FileHash -LiteralPath $sourceExe).Hash) { throw 'The installed executable differs from the reviewed build.' }
$sourcePackage = Split-Path -Parent $sourceExe
$verifiedFiles = 0
Get-ChildItem -LiteralPath $sourcePackage -File -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($sourcePackage.Length + 1)
    $installedFile = Join-Path $installDir $relative
    if (-not (Test-Path -LiteralPath $installedFile -PathType Leaf) -or (Get-FileHash -LiteralPath $installedFile).Hash -ne (Get-FileHash -LiteralPath $_.FullName).Hash) { throw "Installed file differs from the reviewed package: $relative" }
    $verifiedFiles++
}
$manifest = Get-Content (Join-Path $installDir 'resources/app/package.json') -Raw -Encoding utf8 | ConvertFrom-Json
if ($manifest.glaciaReleaseMode -ne 'public' -or $manifest.version -ne '0.5.0') { throw 'Wrong release manifest installed.' }
if ($manifest.license -ne 'Apache-2.0') { throw 'Original software license is missing.' }
foreach ($notice in @('LICENSE', 'NOTICE', 'TERMS OF USE.txt')) {
    if (-not (Test-Path -LiteralPath (Join-Path $installDir $notice))) { throw "Installed legal notice is missing: $notice" }
}
$installedPrivacyUrl = & node -e "process.stdout.write(require(require('node:path').join(process.argv[1],'resources/app/public-pages.cjs')).publicPageUrl('privacy'))" $installDir
if ($LASTEXITCODE -ne 0 -or $installedPrivacyUrl -ne 'https://enochidesu.github.io/glacia-authenticator/privacy.html') { throw 'Installed privacy link is incorrect.' }
$env:WINTERBELL_DATA_DIR = $profile
try {
    $launch = Start-Process -FilePath $installedExe -WindowStyle Normal -PassThru
    Start-Sleep -Seconds 3
    $launch.Refresh()
    if ($launch.HasExited -or -not $launch.Responding -or $launch.MainWindowTitle -ne 'Glacia Authenticator') { throw 'Installed app launch failed.' }
    if (-not $launch.CloseMainWindow()) { throw 'Installed app refused graceful close.' }
    if (-not $launch.WaitForExit(10000)) { throw 'Installed app is still running.' }
} finally { Remove-Item Env:\WINTERBELL_DATA_DIR -ErrorAction SilentlyContinue }
$uninstaller = Join-Path $installDir 'Uninstall Glacia Authenticator.exe'
if (-not (Test-Path -LiteralPath $uninstaller)) { throw 'Uninstaller is missing.' }
# NSIS receives an unquoted trailing _?= path, including spaces, as documented.
$uninstall = Start-Process -FilePath $uninstaller -ArgumentList ('/S _?=' + $installDir) -WindowStyle Hidden -PassThru -Wait
if ($uninstall.ExitCode -ne 0) { throw 'Silent uninstaller failed.' }
if (Test-Path -LiteralPath $installedExe) { throw 'Uninstall left the app executable.' }
if (Test-Path -LiteralPath $desktopLink) { throw 'Uninstall left the test desktop shortcut.' }
if (-not (Test-Path -LiteralPath $sentinel) -or (Get-FileHash -LiteralPath $sentinel).Hash -ne $sentinelHash) { throw 'An unrelated file in the selected parent folder changed.' }
foreach ($file in $before.Keys) { if (-not (Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file).Hash -ne $before[$file]) { throw 'Existing Glacia data changed during the installer test.' } }
$report = [ordered]@{ok=$true;installer=(Split-Path -Leaf $installer);isolatedInstallerIdentity=($ShortcutName -ne 'Glacia Authenticator');perUser=$true;temporaryInstallUnderProject=$true;dedicatedProductFolder=$true;parentWithProductNameSubstringHandled=$true;exactProductFolderSelected=[bool]$ExactFolder;noDuplicateProductFolder=$true;desktopShortcutSelected=[bool]$DesktopShortcut;desktopShortcutChoiceHonored=$true;desktopShortcutRemovedOnUninstall=$true;unrelatedParentFilePreserved=$true;legalNoticesInstalled=$true;originalCodeLicense='Apache-2.0';installedExecutableMatches=$true;installedPackageFilesVerified=$verifiedFiles;installedAppLaunches=$true;privacyUrl=$installedPrivacyUrl;uninstallWorks=$true;existingUserDataUnchanged=$true;syntheticProfileRetained=(Test-Path -LiteralPath $profile);installerSignature=(Get-AuthenticodeSignature -LiteralPath $installer).Status.ToString()}
$reportFile = if ($DesktopShortcut) { 'validation/installer-smoke-shortcut.json' } else { 'validation/installer-smoke.json' }
$report | ConvertTo-Json | Set-Content (Join-Path $projectRoot $reportFile) -Encoding utf8
$report | ConvertTo-Json
