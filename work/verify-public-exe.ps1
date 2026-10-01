$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'validation') -Force | Out-Null
$publicExe = Join-Path $projectRoot 'outputs/Glacia Authenticator Public v0.4.3/Glacia Authenticator.exe'
$syntheticProfile = Join-Path $PSScriptRoot ('public-launch-native-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $syntheticProfile | Out-Null
$env:WINTERBELL_DATA_DIR = $syntheticProfile
try {
    # This check exercises the real interactive app window, including its title.
    $appCheck = Start-Process -FilePath $publicExe -WindowStyle Normal -PassThru
    Start-Sleep -Seconds 3
    $appCheck.Refresh()
    if ($appCheck.HasExited -or -not $appCheck.Responding -or $appCheck.MainWindowTitle -ne 'Glacia Authenticator') { throw 'The public app did not launch correctly.' }
    $report = [ordered]@{Executable=$publicExe;Running=$true;Responding=$appCheck.Responding;WindowTitle=$appCheck.MainWindowTitle;SyntheticProfile=$true;Version=(Get-Item -LiteralPath $publicExe).VersionInfo.FileVersion;ProfileCreated=(Test-Path -LiteralPath (Join-Path $syntheticProfile 'preferences.json'));PrivacyUrl='https://enochidesu.github.io/glacia-authenticator/privacy.html'}
    if (-not $appCheck.CloseMainWindow() -or -not $appCheck.WaitForExit(10000)) { throw 'Test app failed to close gracefully.' }
    $report | ConvertTo-Json | Set-Content (Join-Path $projectRoot 'validation/public-exe-launch.json') -Encoding utf8
    $report | ConvertTo-Json
} finally { Remove-Item Env:\WINTERBELL_DATA_DIR -ErrorAction SilentlyContinue }
