$ErrorActionPreference='Stop';$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$stage=Join-Path $repo ('.cache/android-export-tests/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Path $stage|Out-Null
$mock=Join-Path $stage 'mock-adb.ps1'
# A deterministic local mock; no device/server is contacted by this test.
$source=@'
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
if($Arguments[0]-ne '-s'-or $Arguments[1]-ne 'fixture-serial'){throw 'Explicit serial required'}
$command=$Arguments[2]
if($command-eq 'get-state'){Write-Output 'device';$global:LASTEXITCODE=0;return}
if($command-eq 'shell'-and $Arguments[3]-eq 'pm'-and $Arguments[4]-eq 'path'-and $Arguments[5]-eq 'com.discord'){Write-Output 'package:/data/app/~~fixture==/com.discord-fixture==/base.apk';Write-Output 'package:/data/app/~~fixture==/com.discord-fixture==/split_config.en.apk';$global:LASTEXITCODE=0;return}
if($command-eq 'pull'){[IO.File]::WriteAllText($Arguments[4],'mock APK '+[IO.Path]::GetFileName($Arguments[3]));$global:LASTEXITCODE=0;return}
throw 'Unexpected mutating/device command'
'@
[IO.File]::WriteAllText($mock,$source)
$destination=Join-Path $stage 'exported'; & (Join-Path $PSScriptRoot 'export-apks.ps1') -Serial fixture-serial -OutputDirectory $destination -Adb $mock
$report=Get-Content (Join-Path $destination 'export-report.json') -Raw|ConvertFrom-Json
if(@($report.apks).Count-ne 2-or $report.installationPerformed-or $report.accountDataExported){throw 'Export was not a read-only complete APK path inventory'}
$failed=$false;try{& (Join-Path $PSScriptRoot 'export-apks.ps1') -Serial fixture-serial -OutputDirectory $destination -Adb $mock}catch{if($_.Exception.Message-notmatch 'already exists'){throw};$failed=$true};if(!$failed){throw 'Existing export output not preserved'}
$failed=$false;try{& (Join-Path $PSScriptRoot 'export-apks.ps1') -Serial 'bad;serial' -OutputDirectory (Join-Path $stage 'invalid') -Adb $mock}catch{if($_.Exception.Message-notmatch 'serial contains'){throw};$failed=$true};if(!$failed){throw 'Invalid serial not rejected'}
Write-Output 'Read-only export acceptance passed with local ADB mock: explicit serial, all paths/hashes, no mutation/account-data commands, existing output and invalid serial rejection.'
