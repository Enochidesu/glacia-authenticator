$ErrorActionPreference = 'Stop'
$checkpointRoot = Split-Path -Parent $PSScriptRoot
$electronRuntime = Join-Path $PSScriptRoot 'winterbell-app/node_modules/electron/dist/electron.exe'
if (-not (Test-Path -LiteralPath $electronRuntime)) { throw 'Install source dependencies and run the Electron install script first.' }
$checks = @(
    @{ Script='native-features.cjs'; Mode='start packaged'; Result='native-features-start-result.json' },
    @{ Script='native-features.cjs'; Mode='restart packaged'; Result='native-features-restart-result.json' },
    @{ Script='native-features.cjs'; Mode='restore packaged'; Result='native-features-restore-result.json' },
    @{ Script='native-app-smoke.cjs'; Mode=''; Result='native-app-result.json' },
    @{ Script='native-window-controls.cjs'; Mode=''; Result='native-window-controls-result.json' },
    @{ Script='native-language.cjs'; Mode='packaged'; Result='native-language-result.json' },
    @{ Script='native-language.cjs'; Mode='restart packaged'; Result='native-language-restart-result.json' },
    @{ Script='native-auto-lock.cjs'; Mode=''; Result='native-auto-lock-result.json' },
    @{ Script='native-auto-lock.cjs'; Mode='restart'; Result='native-auto-lock-restart-result.json' },
    @{ Script='native-google-release.cjs'; Mode='private'; Result='native-google-private-result.json' },
    @{ Script='native-google-release.cjs'; Mode='public'; Result='native-google-public-result.json' },
    @{ Script='native-startup-test.cjs'; Mode=''; Result='native-startup-result.json' },
    @{ Script='native-startup-registration.cjs'; Mode=''; Result='native-startup-registration-result.json' },
    @{ Script='native-session-actions.cjs'; Mode=''; Result='native-session-actions-result.json' },
    @{ Script='native-session-actions.cjs'; Mode='restart'; Result='native-session-restart-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='start packaged'; Result='native-sync-start-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='restart packaged'; Result='native-sync-restart-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='offline packaged'; Result='native-sync-offline-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='pause packaged'; Result='native-sync-pause-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='paused-restart packaged'; Result='native-sync-paused-restart-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='signout packaged'; Result='native-sync-signout-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='same-account packaged'; Result='native-sync-same-account-result.json' },
    @{ Script='native-sync-resume.cjs'; Mode='different-account packaged'; Result='native-sync-different-account-result.json' },
    @{ Script='native-card-edit.cjs'; Mode=''; Result='native-card-result.json' },
    @{ Script='native-account-order.cjs'; Mode=''; Result='native-account-order-result.json' },
    @{ Script='native-account-delete.cjs'; Mode=''; Result='native-account-delete-result.json' },
    @{ Script='native-tray-test.cjs'; Mode=''; Result='native-tray-result.json' },
    @{ Script='native-onboarding-test.cjs'; Mode='new'; Result='native-onboarding-new-result.json' },
    @{ Script='native-onboarding-test.cjs'; Mode='local'; Result='native-onboarding-local-result.json' },
    @{ Script='native-onboarding-test.cjs'; Mode='cloud'; Result='native-onboarding-cloud-result.json' },
    @{ Script='native-passwords.cjs'; Mode='legacy'; Result='../validation/native-passwords-legacy.json' },
    @{ Script='native-passwords.cjs'; Mode='restart'; Result='../validation/native-passwords-restart.json' },
    @{ Script='native-passwords.cjs'; Mode='update-prepare'; Result='../validation/native-passwords-update-prepare.json' },
    @{ Script='native-passwords.cjs'; Mode='update-restart'; Result='../validation/native-passwords-update-restart.json' },
    @{ Script='native-passwords.cjs'; Mode='startup --startup'; Result='../validation/native-passwords-startup.json' },
    @{ Script='native-passwords.cjs'; Mode='second-device'; Result='../validation/native-passwords-second-device.json' },
    @{ Script='native-passwords.cjs'; Mode='offline-password'; Result='../validation/native-passwords-offline-password.json' },
    @{ Script='native-passwords.cjs'; Mode='exit'; Result='../validation/native-passwords-exit.json' },
    @{ Script='native-passwords.cjs'; Mode='six-minimum'; Result='../validation/native-passwords-six-minimum.json' },
    @{ Script='native-updates.cjs'; Mode=''; Result='../validation/native-updates.json' }
)
foreach ($check in $checks) {
    $scriptFile = Join-Path $PSScriptRoot $check.Script
    $testArguments = '"' + $scriptFile + '"' + $(if ($check.Mode) { ' ' + $check.Mode } else { '' })
    $started = Get-Date
    $testProcess = Start-Process -FilePath $electronRuntime -ArgumentList $testArguments -WindowStyle Hidden -PassThru
    if (-not $testProcess.WaitForExit(45000)) { throw ('Test timed out: ' + $check.Script + ' ' + $check.Mode) }
    $resultFile = Get-Item -LiteralPath (Join-Path $PSScriptRoot $check.Result)
    if ($resultFile.LastWriteTime -lt $started) { throw 'Stale native test result.' }
    $result = Get-Content -LiteralPath $resultFile.FullName -Raw | ConvertFrom-Json
    if (-not $result.ok) { throw $result.error }
    Write-Output ('PASS ' + $check.Script + ' ' + $check.Mode)
}
