param([Parameter(Mandatory=$true)][string]$InputDirectory,[Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'));if(!$Sdk){$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
. (Join-Path $PSScriptRoot 'tools.ps1');$JavaHome=Resolve-DsiJavaHome $JavaHome
. (Join-Path $PSScriptRoot 'apk-info.ps1');. (Join-Path $PSScriptRoot 'patch-core.ps1')
$selectedInput=(Resolve-Path -LiteralPath $InputDirectory).Path;$output=[IO.Path]::GetFullPath($OutputDirectory)
if(!(Get-Item -LiteralPath $selectedInput).PSIsContainer){throw 'Select a directory containing the explicit local APK set'}
if(Test-Path -LiteralPath $output){throw 'Output directory already exists; no existing files will be overwritten'}
if($output.StartsWith($selectedInput.TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Output must be outside the input APK directory'}
$files=@(Get-ChildItem -LiteralPath $selectedInput -File -Filter '*.apk');if($files.Count-lt 2){throw 'Split set requires one base APK and at least one configuration split; use patch-apk.ps1 for monolithic input.'}
$lock=Get-Content (Join-Path $PSScriptRoot 'tooling.lock.json') -Raw|ConvertFrom-Json;$apktool=Join-Path $repo ".cache/android-tools/apktool-$($lock.apktool.version).jar"
if(!(Test-Path $apktool)-or (Get-FileHash $apktool -Algorithm SHA256).Hash.ToLowerInvariant()-ne $lock.apktool.sha256){throw 'Run node android/setup.mjs; pinned Apktool verification failed'}
$stage=Join-Path $repo ('.cache/android-set/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Force $stage|Out-Null
$info=@();foreach($file in $files){$info+=Get-DsiApkInfo $file.FullName $Sdk $JavaHome $apktool $stage}
$bases=@($info|Where-Object {!$_.split});if($bases.Count-ne 1){throw 'APK set must contain exactly one base manifest (no split attribute)'};$base=$bases[0]
$splits=@($info|Where-Object {$_.split});$names=New-Object 'Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
foreach($item in $info){if($item.package-ne $base.package -or $item.versionCode-ne $base.versionCode -or $item.versionMajor-ne $base.versionMajor){throw 'APK set package/version mismatch'};if($item.certificate-ne $base.certificate){throw 'APK set certificate mismatch'}}
foreach($split in $splits){
    if(!$names.Add($split.split)){throw 'Duplicate split manifest name'}
    if($split.feature-or $split.dexCount-gt 0 -or $split.configFor -and $split.configFor-ne 'base' -or $split.split-notmatch '^config[._][A-Za-z0-9_.-]+$'){throw 'Feature/code/non-base-dependent splits are not supported. Supply a complete installed base plus its configuration/resource/native-library splits.'}
}
foreach($item in $info){foreach($dependency in $item.dependencies){if($dependency-ne 'base' -and !$names.Contains($dependency)){throw "Incomplete APK set: missing declared split $dependency"}}}
$providedTypes=New-Object 'Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
foreach($item in $info){foreach($type in $item.types){[void]$providedTypes.Add($type)}}
foreach($item in $info){foreach($type in $item.requiredTypes){if(!$providedTypes.Contains($type)){throw "Incomplete APK set: missing required split type $type"}}}
$exportFile=Join-Path $selectedInput 'export-report.json';$exportVerified=$false
if(Test-Path -LiteralPath $exportFile){
    $export=Get-Content -LiteralPath $exportFile -Raw|ConvertFrom-Json
    if($export.schemaVersion-ne 1 -or $export.kind-ne 'dsi-read-only-installed-apk-export' -or !$export.completeInstalledPathInventory -or $export.package-ne $base.package){throw 'Export inventory is unsupported or does not match the APK package'}
    if(@($export.apks).Count-ne $info.Count){throw 'Incomplete/changed APK set: export inventory count mismatch'}
    foreach($item in $info){$record=@($export.apks|Where-Object {$_.file-ceq $item.name});if($record.Count-ne 1 -or $record[0].sha256-ne $item.sha256){throw 'APK set differs from its exported installed-path inventory'}}
    $exportVerified=$true
}
$key=Join-Path $repo '.cache/android-build/debug.keystore';if(!(Test-Path $key)){throw 'Run android/build.ps1 first to prepare the local debug signing key'}
# All input validation precedes creation of the requested output directory.
New-Item -ItemType Directory -Path $output|Out-Null
$baseOut=Join-Path $output $base.name
Invoke-DsiPatchApk -InputApk $base.file -OutputApk $baseOut -Sdk $Sdk -JavaHome $JavaHome -ValidatedSplitBase
$tools=Join-Path $Sdk 'build-tools/35.0.1';$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try{foreach($split in $splits){$aligned=Join-Path $stage $split.name;& "$tools/zipalign.exe" -f -P 16 4 $split.file $aligned;if($LASTEXITCODE-ne 0){throw 'Split ZIP alignment failed'};& "$tools/apksigner.bat" sign --ks $key --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out (Join-Path $output $split.name) $aligned;if($LASTEXITCODE-ne 0){throw 'Split signing failed'};& "$tools/apksigner.bat" verify --verbose (Join-Path $output $split.name);if($LASTEXITCODE-ne 0){throw 'Split signature verification failed'}}}finally{$env:JAVA_HOME=$oldJava}
$records=@();$outputCert=$null
foreach($item in $info){if((Get-FileHash $item.file -Algorithm SHA256).Hash.ToLowerInvariant()-ne $item.sha256){throw 'Input APK changed during set patching; output must not be installed'};$result=Get-DsiApkInfo (Join-Path $output $item.name) $Sdk $JavaHome $apktool $stage;if(!$outputCert){$outputCert=$result.certificate};if($result.certificate-ne $outputCert -or $result.package-ne $base.package -or $result.versionCode-ne $base.versionCode -or $result.versionMajor-ne $base.versionMajor -or $result.split-ne $item.split -or $result.splitRequired-ne $item.splitRequired -or $result.configFor-ne $item.configFor -or ($result.dependencies-join ',')-ne ($item.dependencies-join ',') -or ($result.requiredTypes-join ',')-ne ($item.requiredTypes-join ',') -or ($result.types-join ',')-ne ($item.types-join ',')){throw 'Patched set package/signature/manifest verification failed'};$records+=@{file=$item.name;split=$item.split;inputSha256=$item.sha256;outputSha256=$result.sha256}}
$report=[ordered]@{schemaVersion=1;kind='dsi-original-native-split-patch';package=$base.package;versionCode=$base.versionCode;inputCertificate=$base.certificate;outputCertificate=$outputCert;exportInventoryVerified=$exportVerified;declaredSplitRequirementsValidated=$true;completeness=$(if($exportVerified){'matches-complete-exported-installed-path-inventory'}else{'declared-requirements-only-inventory-unavailable'});completenessLimit='Without exported inventory, missing unreferenced configuration APKs cannot be determined.';signing='DSI-development-debug-original-signature-not-retained';installationPerformed=$false;discordRuntime='unverified';base=$base.name;apks=$records}
[IO.File]::WriteAllText((Join-Path $output 'patch-set-report.json'),($report|ConvertTo-Json -Depth 6)+"`n")
Write-Output "Patched $($info.Count) APKs into separate directory $output. Install as a complete set only after controlled validation; no installation was performed."
if(!$exportVerified){Write-Output 'Completeness limit: no exported installed-path inventory was provided. Declared requirements passed; missing unreferenced configuration APKs cannot be detected.'}
