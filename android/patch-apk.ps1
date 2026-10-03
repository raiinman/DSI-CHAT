param([Parameter(Mandatory=$true)][string]$InputApk,[Parameter(Mandatory=$true)][string]$OutputApk,[string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!$Sdk) {$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
. (Join-Path $PSScriptRoot 'tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
$inputFile=(Resolve-Path -LiteralPath $InputApk).Path
$outputFile=[IO.Path]::GetFullPath($OutputApk)
if ([IO.Path]::GetExtension($inputFile) -ne '.apk') {throw 'Only a user-supplied single monolithic .apk is supported; APKS/XAPK and split sets are unsupported.'}
if (Test-Path -LiteralPath $outputFile) {throw 'Output already exists; select a new output path. The patcher never overwrites input or existing outputs.'}
$lock=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'tooling.lock.json') -Raw|ConvertFrom-Json
$apktool=Join-Path $repo ".cache/android-tools/apktool-$($lock.apktool.version).jar"
if (!(Test-Path $apktool) -or (Get-FileHash $apktool -Algorithm SHA256).Hash.ToLowerInvariant() -ne $lock.apktool.sha256) {throw 'Run node android/setup.mjs to prepare checksum-verified Apktool.'}
$bootstrap=Join-Path $repo 'dist/android/dsi-native-bootstrap.dex'
if (!(Test-Path $bootstrap)) {throw 'Build android/build-bootstrap.ps1 first.'}
function Run([string]$command,[string[]]$arguments) {& $command @arguments;if($LASTEXITCODE -ne 0){throw "$command failed ($LASTEXITCODE)"}}
$originalHash=(Get-FileHash $inputFile -Algorithm SHA256).Hash.ToLowerInvariant()
$stage=Join-Path $repo ('.cache/android-patch/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Force $stage|Out-Null
$decoded=Join-Path $stage 'decoded';$framework=Join-Path $stage 'framework'
Run "$JavaHome/bin/java.exe" @('-jar',$apktool,'d',$inputFile,'-o',$decoded,'-p',$framework)
$manifestFile=Join-Path $decoded 'AndroidManifest.xml';[xml]$manifest=Get-Content -LiteralPath $manifestFile -Raw
$androidNs='http://schemas.android.com/apk/res/android';$root=$manifest.DocumentElement
if($root.HasAttribute('split') -or $root.GetAttribute('isSplitRequired',$androidNs) -eq 'true'){throw 'Split APKs are unsupported. Supply a standalone monolithic APK.'}
$app=$root.SelectSingleNode('application');if(!$app){throw 'Manifest has no application'}
if($app.GetAttribute('isSplitRequired',$androidNs) -eq 'true'){throw 'Split-required base APK unsupported'}
if($root.GetAttribute('sharedUserId',$androidNs)){throw 'Shared-UID APK cannot retain its original signing identity; unsupported.'}
$badging=@(& (Join-Path $Sdk 'build-tools/35.0.1/aapt2.exe') dump badging $inputFile)
if($LASTEXITCODE-ne 0){throw 'Could not inspect input SDK requirements'}
$minSdk=0;if(($badging -join "`n") -match "minSdkVersion:'(\d+)'"){$minSdk=[int]$Matches[1]}
if($minSdk -lt 26){throw 'Native bootstrap currently supports APKs declaring minimum Android API 26 or newer.'}
foreach($metadata in $app.SelectNodes('meta-data')) {if($metadata.GetAttribute('name',$androidNs) -eq 'com.android.vending.splits.required' -and $metadata.GetAttribute('value',$androidNs) -eq 'true'){throw 'Split-required base APK unsupported'}}
$package=$root.GetAttribute('package');$class=$app.GetAttribute('name',$androidNs)
if(!$class -or $class -eq 'android.app.Application') {$app.SetAttribute('name',$androidNs,'interactive.deadsignal.dsi.bootstrap.BootstrapApplication');$manifest.Save($manifestFile);$hook='original-default-application'}
else {
    if($class.StartsWith('.')){$class=$package+$class}elseif(!$class.Contains('.')){$class=$package+'.'+$class}
    $relative=$class.Replace('.','/')+'.smali';$matches=@(Get-ChildItem $decoded -Directory -Filter 'smali*'|ForEach-Object {$candidate=Join-Path $_.FullName $relative;if(Test-Path -LiteralPath $candidate){$candidate}})
    if($matches.Count -ne 1){throw "Application class $class unavailable or duplicated in decoded DEX; no patch applied."}
    $classFile=$matches[0];$smali=[IO.File]::ReadAllText($classFile)
    if($smali.Contains('Linteractive/deadsignal/dsi/bootstrap/Bootstrap;')){throw 'This APK already contains a DSI bootstrap hook'}
    $method=[regex]::Match($smali,'(?ms)^\.method[^\r\n]*\bonCreate\(\)V\r?\n.*?^\.end method')
    $call='    invoke-static/range {p0 .. p0}, Linteractive/deadsignal/dsi/bootstrap/Bootstrap;->install(Landroid/app/Application;)V'
    if($method.Success){
        if($method.Value -match '^\.method[^\r\n]*\b(native|abstract|static)\b'){throw 'Unsupported Application.onCreate method'}
        $super=[regex]::Match($method.Value,'(?m)^\s*invoke-super(?:/range)?\s+\{[^\r\n]+\},\s*L[^;]+;->onCreate\(\)V[^\r\n]*')
        if(!$super.Success){throw 'Application.onCreate lacks a recognizable superclass call; refuse an unsafe hook.'}
        $patched=$method.Value.Insert($super.Index+$super.Length,"`n"+$call)
        $smali=$smali.Remove($method.Index,$method.Length).Insert($method.Index,$patched)
    }else{
        $superClass=[regex]::Match($smali,'(?m)^\.super\s+(L[^;]+;)').Groups[1].Value
        if(!$superClass){throw 'Missing Application superclass'}
        $smali+="`n.method public onCreate()V`n    .locals 0`n    invoke-super {p0}, $superClass"+'->onCreate()V'+"`n$call`n    return-void`n.end method`n"
    }
    [IO.File]::WriteAllText($classFile,$smali);$hook=$class
}
if(Get-ChildItem $decoded -Recurse -Filter 'Bootstrap.smali'|Where-Object {$_.FullName.Replace('\','/').Contains('/interactive/deadsignal/dsi/bootstrap/')}){throw 'Existing bootstrap namespace collision'}
$unsigned=Join-Path $stage 'unsigned.apk';Run "$JavaHome/bin/java.exe" @('-jar',$apktool,'b',$decoded,'-o',$unsigned,'-p',$framework)
$entries=@(& "$JavaHome/bin/jar.exe" tf $unsigned);if($LASTEXITCODE-ne 0){throw 'Could not inspect rebuilt archive'}
$maxDex=1;foreach($entry in $entries){if($entry -match '^classes(\d*)\.dex$'){$number=1;if($Matches[1]){$number=[int]$Matches[1]};$maxDex=[Math]::Max($maxDex,$number)}}
$added='classes'+($maxDex+1)+'.dex';Copy-Item -LiteralPath $bootstrap -Destination (Join-Path $stage $added)
Run "$JavaHome/bin/jar.exe" @('uf',$unsigned,'-C',$stage,$added)
$tools=Join-Path $Sdk 'build-tools/35.0.1';$aligned=Join-Path $stage 'aligned.apk';Run "$tools/zipalign.exe" @('-f','-P','16','4',$unsigned,$aligned)
$key=Join-Path $repo '.cache/android-build/debug.keystore';if(!(Test-Path $key)){throw 'Run android/build.ps1 to create the local development signing key.'}
New-Item -ItemType Directory -Force (Split-Path $outputFile)|Out-Null
$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try{Run "$tools/apksigner.bat" @('sign','--ks',$key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$outputFile,$aligned);Run "$tools/apksigner.bat" @('verify','--verbose',$outputFile)}finally{$env:JAVA_HOME=$oldJava}
if((Get-FileHash $inputFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $originalHash){throw 'Input changed during patching; output must not be installed.'}
$record=[ordered]@{package=$package;inputSha256=$originalHash;outputSha256=(Get-FileHash $outputFile -Algorithm SHA256).Hash.ToLowerInvariant();bootstrapSha256=(Get-FileHash $bootstrap -Algorithm SHA256).Hash.ToLowerInvariant();applicationHook=$hook;addedDex=$added;signing='DSI-development-debug-original-signature-not-retained';discordRuntime='unavailable';testedHost='user-supplied-unverified';apktool=$lock.apktool.version}
[IO.File]::WriteAllText($outputFile+'.patch.json',($record|ConvertTo-Json)+"`n")
Write-Output "Patched separate development APK: $outputFile. Original signature is not retained. No installation was performed."
