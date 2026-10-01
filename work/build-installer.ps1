$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$publicApp = Join-Path $projectRoot 'outputs/Glacia Authenticator Public v0.4.3'
if (-not (Test-Path -LiteralPath (Join-Path $publicApp 'Glacia Authenticator.exe'))) { throw 'Build and validate the public executable first.' }
$env:ELECTRON_BUILDER_CACHE = Join-Path $PSScriptRoot 'release-cache'
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
try {
    & node (Join-Path $PSScriptRoot 'prepare-installer-agreement.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Installer agreement preparation failed.' }
    $validatedLaunch = Get-Content (Join-Path $projectRoot 'validation/public-exe-launch.json') -Raw -Encoding utf8 | ConvertFrom-Json
    if (-not $validatedLaunch.Running -or -not $validatedLaunch.Responding) { throw 'Validate the public executable before building its installer.' }
    if ($validatedLaunch.Executable -ne (Join-Path $publicApp 'Glacia Authenticator.exe') -or $validatedLaunch.Version -ne '0.4.3.0') { throw 'Launch validation must match this public build.' }
    & node (Join-Path $PSScriptRoot 'release-tools/node_modules/electron-builder/cli.js') --projectDir (Join-Path $PSScriptRoot 'winterbell-app') --prepackaged $publicApp --config (Join-Path $PSScriptRoot 'installer-config.json') --win nsis --x64 --publish never
    if ($LASTEXITCODE -ne 0) { throw 'Installer build failed.' }
} finally {
    Remove-Item Env:\ELECTRON_BUILDER_CACHE -ErrorAction SilentlyContinue
    Remove-Item Env:\CSC_IDENTITY_AUTO_DISCOVERY -ErrorAction SilentlyContinue
}
