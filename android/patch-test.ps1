param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
$stage=Join-Path $repo ('.cache/android-patch-tests/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Force $stage|Out-Null
$apk=Join-Path $repo 'dist/android/dsi-native-lab-debug.apk';$patched=Join-Path $stage 'patched.apk';$hash=(Get-FileHash $apk -Algorithm SHA256).Hash
& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $apk -OutputApk $patched -Sdk $Sdk -JavaHome $JavaHome
if((Get-FileHash $apk -Algorithm SHA256).Hash -ne $hash){throw 'Input fixture mutated'}
$decoded=Join-Path $stage 'decoded'
& "$JavaHome/bin/java.exe" -jar (Join-Path $repo '.cache/android-tools/apktool-3.0.3.jar') d $patched -o $decoded -p (Join-Path $stage 'framework')
if($LASTEXITCODE-ne 0){throw 'Patched fixture decode failed'}
$smali=[IO.File]::ReadAllText((Join-Path $decoded 'smali/interactive/deadsignal/dsi/devhost/FixtureApplication.smali'))
if($smali -notmatch '(?s)invoke-super.*?onCreate\(\)V.*?invoke-static/range.*?Bootstrap;->install' -or $smali -notmatch 'Original Application preserved'){throw 'Original application behavior/hook missing'}
if(!(Test-Path (Join-Path $decoded 'smali_classes2/interactive/deadsignal/dsi/bootstrap/Bootstrap.smali'))){throw 'Native bootstrap DEX not present'}
$failure=$false;try{& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $apk -OutputApk $patched -Sdk $Sdk -JavaHome $JavaHome}catch{if($_.Exception.Message -notmatch 'Output already exists'){throw};$failure=$true};if(!$failure){throw 'Existing output was not rejected'}
$failure=$false;try{& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $patched -OutputApk (Join-Path $stage 'twice.apk') -Sdk $Sdk -JavaHome $JavaHome}catch{if($_.Exception.Message -notmatch 'already contains a DSI bootstrap'){throw};$failure=$true};if(!$failure){throw 'Duplicate bootstrap not rejected'}
$bundle=Join-Path $stage 'fixture.apks';[IO.File]::WriteAllText($bundle,'unsupported fixture');$failure=$false;try{& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $bundle -OutputApk (Join-Path $stage 'bundle.apk') -Sdk $Sdk -JavaHome $JavaHome}catch{if($_.Exception.Message -notmatch 'monolithic'){throw};$failure=$true};if(!$failure){throw 'Bundle not rejected'}
$template=Join-Path $stage 'template'
$apktool=Join-Path $repo '.cache/android-tools/apktool-3.0.3.jar'
& "$JavaHome/bin/java.exe" -jar $apktool d $apk -o $template -p (Join-Path $stage 'framework')
if($LASTEXITCODE-ne 0){throw 'Fixture decode failed'}
function Variant([string]$name,[scriptblock]$change){
    $folder=Join-Path $stage $name;Copy-Item -LiteralPath $template -Destination $folder -Recurse
    & $change $folder
    $fixture=Join-Path $stage ($name+'.apk')
    & "$JavaHome/bin/java.exe" -jar $apktool b $folder -o $fixture -p (Join-Path $stage 'framework')
    if($LASTEXITCODE-ne 0){throw "Variant $name build failed"};return $fixture
}
function Reject([string]$fixture,[string]$reason,[string]$name){
    $failed=$false;try{& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $fixture -OutputApk (Join-Path $stage ($name+'-patched.apk')) -Sdk $Sdk -JavaHome $JavaHome}catch{if($_.Exception.Message-notmatch $reason){throw};$failed=$true};if(!$failed){throw "$name was not rejected"}
}
# Redirect tool logs to the host so Variant's sole pipeline result is its APK path.
$split=Variant 'split' {param($folder);$file=Join-Path $folder 'AndroidManifest.xml';[xml]$doc=Get-Content $file -Raw;$doc.DocumentElement.SetAttribute('split','config.en');$doc.Save($file)}
$split=@($split)[-1];Reject $split 'Split APKs are unsupported' 'split'
$missing=Variant 'missing' {param($folder);$file=Join-Path $folder 'AndroidManifest.xml';[xml]$doc=Get-Content $file -Raw;$doc.DocumentElement.SelectSingleNode('application').SetAttribute('name','http://schemas.android.com/apk/res/android','.MissingApplication');$doc.Save($file)}
$missing=@($missing)[-1];Reject $missing 'unavailable or duplicated' 'missing'
$default=Variant 'default' {param($folder);$file=Join-Path $folder 'AndroidManifest.xml';[xml]$doc=Get-Content $file -Raw;$doc.DocumentElement.SelectSingleNode('application').RemoveAttribute('name','http://schemas.android.com/apk/res/android');$doc.Save($file)}
$default=@($default)[-1];$defaultPatched=Join-Path $stage 'default-patched.apk';& (Join-Path $PSScriptRoot 'patch-apk.ps1') -InputApk $default -OutputApk $defaultPatched -Sdk $Sdk -JavaHome $JavaHome
$defaultReport=Get-Content ($defaultPatched+'.patch.json') -Raw|ConvertFrom-Json;if($defaultReport.applicationHook-ne 'original-default-application'){throw 'Default Application path failed'}
Write-Output 'APK patch acceptance passed: input preservation, original superclass/behavior, additional native DEX, default Application, duplicate patch/output, bundle/split and missing Application rejection.'
