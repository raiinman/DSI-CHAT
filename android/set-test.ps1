param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop';$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'));if(!$Sdk){$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
. (Join-Path $PSScriptRoot 'tools.ps1');$JavaHome=Resolve-DsiJavaHome $JavaHome
$source=Join-Path $repo 'dist/android/split-fixture';if(!(Test-Path $source)){throw 'Build android/build-split-fixture.ps1 first'}
$stage=Join-Path $repo ('.cache/android-set-tests/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Path $stage|Out-Null
$selected=Join-Path $stage 'selected';Copy-Item -LiteralPath $source -Destination $selected -Recurse
$records=@(Get-ChildItem $selected -Filter '*.apk'|ForEach-Object {@{file=$_.Name;sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}})
$export=@{schemaVersion=1;kind='dsi-read-only-installed-apk-export';package='interactive.deadsignal.dsi.devhost';completeInstalledPathInventory=$true;apks=$records}
[IO.File]::WriteAllText((Join-Path $selected 'export-report.json'),($export|ConvertTo-Json -Depth 5))
$patched=Join-Path $stage 'patched';& (Join-Path $PSScriptRoot 'patch-set.ps1') -InputDirectory $selected -OutputDirectory $patched -Sdk $Sdk -JavaHome $JavaHome
$report=Get-Content (Join-Path $patched 'patch-set-report.json') -Raw|ConvertFrom-Json
if(!$report.exportInventoryVerified-or @($report.apks).Count-ne 2){throw 'Complete split set/inventory was not validated'}
foreach($record in $records){if((Get-FileHash (Join-Path $selected $record.file) -Algorithm SHA256).Hash.ToLowerInvariant()-ne $record.sha256){throw 'Input set mutated'}}
function RejectSet([string]$folder,[string]$reason,[string]$name){$destination=Join-Path $stage $name;$rejected=$false;try{& (Join-Path $PSScriptRoot 'patch-set.ps1') -InputDirectory $folder -OutputDirectory $destination -Sdk $Sdk -JavaHome $JavaHome}catch{if($_.Exception.Message-notmatch $reason){throw};$rejected=$true};if(!$rejected-or (Test-Path $destination)){throw "Invalid set $name created an output"}}
$incomplete=Join-Path $stage 'incomplete';New-Item -ItemType Directory -Path $incomplete|Out-Null;Copy-Item (Join-Path $source 'base.apk') $incomplete
RejectSet $incomplete 'at least one configuration split' 'incomplete-output'
$duplicate=Join-Path $stage 'duplicate';Copy-Item -LiteralPath $source -Destination $duplicate -Recurse;Copy-Item (Join-Path $source 'split_config.en.apk') (Join-Path $duplicate 'duplicate.apk')
RejectSet $duplicate 'Duplicate split manifest name' 'duplicate-output'
$inventory=Join-Path $stage 'changed-inventory';Copy-Item -LiteralPath $selected -Destination $inventory -Recurse
[IO.File]::WriteAllText((Join-Path $inventory 'export-report.json'),($export|ConvertTo-Json -Depth 5).Replace($records[0].sha256,('0'*64)))
RejectSet $inventory 'exported installed-path inventory' 'changed-output'
$certificate=Join-Path $stage 'certificate';Copy-Item -LiteralPath $source -Destination $certificate -Recurse
$key=Join-Path $stage 'alternate.keystore'; & "$JavaHome/bin/keytool.exe" -genkeypair -keystore $key -alias fixture -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 2 -dname 'CN=DSI Acceptance Fixture'
if($LASTEXITCODE-ne 0){throw 'Alternate certificate fixture failed'}
$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try{& (Join-Path $Sdk 'build-tools/35.0.1/apksigner.bat') sign --ks $key --ks-key-alias fixture --ks-pass pass:android --key-pass pass:android (Join-Path $certificate 'split_config.en.apk');if($LASTEXITCODE-ne 0){throw 'Alternate signed split failed'}}finally{$env:JAVA_HOME=$oldJava}
RejectSet $certificate 'certificate mismatch' 'certificate-output'
Write-Output 'Split set acceptance passed: complete fixture/inventory, consistent output signer, input preservation, incomplete/duplicate/changed-inventory/certificate mismatch rejection.'
