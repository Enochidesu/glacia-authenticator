param([string]$FixtureArgumentsFile)
$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot 'winterbell-app/node_modules/electron/dist/electron.exe'
$runner = Join-Path $PSScriptRoot 'native-update-install.cjs'
$arguments = @($runner, $FixtureArgumentsFile) | ForEach-Object {
    if ($_ -match '"') { throw 'Invalid synthetic test argument.' }
    '"' + $_ + '"'
}
$testProcess = Start-Process -FilePath $runtime -ArgumentList ($arguments -join ' ') -WindowStyle Hidden -RedirectStandardError (Join-Path $PSScriptRoot 'update-launch-result.json') -PassThru
if (-not $testProcess.WaitForExit(65000)) { throw 'Synthetic updater runner timed out.' }
$fixtureInput = Get-Content -LiteralPath $FixtureArgumentsFile -Raw | ConvertFrom-Json
$engineResult = Get-Content -LiteralPath $fixtureInput.reportFile -Raw | ConvertFrom-Json
if (-not $engineResult.ok) { throw $engineResult.error }
