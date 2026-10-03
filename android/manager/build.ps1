param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME,[int]$VersionCode=2,[string]$VersionName='0.3.0-dev.2',[string]$OutputName='dsi-manager-debug.apk',[string]$QaCertificate,[string]$SigningKey)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
. (Join-Path $PSScriptRoot '../tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
if(!$Sdk){$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
$tools=Join-Path $Sdk 'build-tools/35.0.1';$sdkJar=Join-Path $Sdk 'platforms/android-35/android.jar'
if(!(Test-Path "$tools/aapt2.exe") -or !(Test-Path $sdkJar)){throw 'Select SDK35/build-tools35.0.1 via -Sdk.'}
if($VersionCode-lt 1 -or $VersionName -notmatch '^[A-Za-z0-9._-]+$' -or $OutputName -notmatch '^[A-Za-z0-9._-]+\.apk$'){throw 'Invalid output name/version.'}
$qa=[bool]$QaCertificate
if($qa){$QaCertificate=(Resolve-Path -LiteralPath $QaCertificate).Path;if($OutputName-eq 'dsi-manager-debug.apk'){$OutputName='dsi-manager-qa-debug.apk'}}
function Run([string]$command,[string[]]$arguments){& $command @arguments;if($LASTEXITCODE-ne 0){throw "$command failed ($LASTEXITCODE)"}}
$work=Join-Path $repo '.cache/android-manager';$out=Join-Path $repo 'dist/android';$stage=Join-Path $work ('stage-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $work,$out,$stage | Out-Null
if(!$SigningKey){$SigningKey=Join-Path $work 'debug.keystore'}
if(!(Test-Path $SigningKey)){if($PSBoundParameters.ContainsKey('SigningKey')){throw 'Explicit signing key must already exist.'};Run "$JavaHome/bin/keytool.exe" @('-genkeypair','-keystore',$SigningKey,'-alias','androiddebugkey','-storepass','android','-keypass','android','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=DSI Manager Development,OU=Development,O=DSI,C=US')}
function Build-Apk([string]$area,[string]$manifest,[string]$resources,[string]$assets,[string[]]$sources,[string]$destination){
 $root=Join-Path $stage $area;$classes=Join-Path $root 'classes';$dex=Join-Path $root 'dex';New-Item -ItemType Directory -Force $root,$classes,$dex | Out-Null
 Run "$JavaHome/bin/javac.exe" (@('--release','8','-encoding','UTF-8','-classpath',$sdkJar,'-d',$classes)+$sources)
 Run "$JavaHome/bin/jar.exe" @('cf',"$root/classes.jar",'-C',$classes,'.')
 Run "$tools/d8.bat" @('--lib',$sdkJar,'--min-api','26','--output',$dex,"$root/classes.jar")
 Run "$tools/aapt2.exe" @('compile','--dir',$resources,'-o',"$root/resources.zip")
 Run "$tools/aapt2.exe" @('link','-o',"$root/unsigned.apk",'--manifest',$manifest,'-I',$sdkJar,'-A',$assets,"$root/resources.zip")
 Run "$JavaHome/bin/jar.exe" @('uf',"$root/unsigned.apk",'-C',$dex,'classes.dex')
 Run "$tools/zipalign.exe" @('-f','-p','4',"$root/unsigned.apk","$root/aligned.apk")
 Run "$tools/apksigner.bat" @('sign','--ks',$SigningKey,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$destination,"$root/aligned.apk")
 Run "$tools/apksigner.bat" @('verify','--verbose',$destination)
}
function Metadata([string]$file,[string]$package,[int]$code,[string]$name){
 $certText=@(& "$tools/apksigner.bat" verify --print-certs $file);if($LASTEXITCODE-ne 0){throw 'Certificate inspection failed'}
 $match=[regex]::Match(($certText-join "`n"),'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)');if(!$match.Success){throw 'Missing signing certificate'}
 return [ordered]@{file=[IO.Path]::GetFileName($file);package=$package;sha256=(Get-FileHash $file -Algorithm SHA256).Hash.ToLowerInvariant();bytes=(Get-Item $file).Length;certificateSha256=$match.Groups[1].Value.ToLowerInvariant();versionCode=$code;versionName=$name;minSdk=26;testOnly=$false}
}
$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try{
 # Build a distinct, normal sideloadable original demo; preserve the test-only native lab.
 $demoManifest=Join-Path $stage 'demo-manifest.xml';[xml]$demo=Get-Content (Join-Path $PSScriptRoot '../AndroidManifest.xml') -Raw
 $ns='http://schemas.android.com/apk/res/android';$demo.manifest.SetAttribute('package','interactive.deadsignal.dsi.managerdemo');$app=$demo.manifest.application;$app.RemoveAttribute('testOnly',$ns);$app.SetAttribute('name',$ns,'interactive.deadsignal.dsi.devhost.FixtureApplication');$app.SetAttribute('label',$ns,'DSI Native Demo');$app.activity.SetAttribute('name',$ns,'interactive.deadsignal.dsi.devhost.MainActivity');$demo.Save($demoManifest)
 $demoAssets=Join-Path $stage 'demo-assets';New-Item -ItemType Directory $demoAssets | Out-Null;Copy-Item (Join-Path $PSScriptRoot '../plugins.json') (Join-Path $demoAssets 'dsi-native-plugins.json')
 $source=@(Get-ChildItem (Join-Path $PSScriptRoot '../src') -Recurse -Filter '*.java'|ForEach-Object{$_.FullName});$demoRaw=Join-Path $stage 'demo-raw.apk'
 Build-Apk 'demo' $demoManifest (Join-Path $PSScriptRoot '../res') $demoAssets $source $demoRaw
 & (Join-Path $PSScriptRoot '../build-bootstrap.ps1') -Sdk $Sdk -JavaHome $JavaHome
 . (Join-Path $PSScriptRoot '../patch-core.ps1')
 $demoPatched=Join-Path $stage 'demo-patched.apk';Invoke-DsiPatchApk -InputApk $demoRaw -OutputApk $demoPatched -Sdk $Sdk -JavaHome $JavaHome
 $demoOutput=Join-Path $out 'dsi-manager-demo-debug.apk';Copy-Item -LiteralPath $demoPatched -Destination $demoOutput -Force
 $payload=Metadata $demoOutput 'interactive.deadsignal.dsi.managerdemo' 1 '0.1.0';$payload.schemaVersion=1;$payload.asset='native-demo.apk'
 $assets=Join-Path $stage 'manager-assets';New-Item -ItemType Directory $assets | Out-Null;Copy-Item $demoOutput (Join-Path $assets 'native-demo.apk');[IO.File]::WriteAllText((Join-Path $assets 'payload.json'),($payload|ConvertTo-Json)+"`n")
 $manifest=Join-Path $stage 'manager-manifest.xml';[xml]$manager=Get-Content (Join-Path $PSScriptRoot 'AndroidManifest.xml') -Raw;$manager.manifest.SetAttribute('versionCode',$ns,[string]$VersionCode);$manager.manifest.SetAttribute('versionName',$ns,$VersionName)
 $res=Join-Path $stage 'manager-res';Copy-Item (Join-Path $PSScriptRoot 'res') $res -Recurse
 $sources=@(Get-ChildItem (Join-Path $PSScriptRoot 'src') -Recurse -Filter '*.java'|ForEach-Object{$_.FullName})
 if($qa){
  $manager.manifest.application.SetAttribute('networkSecurityConfig',$ns,'@xml/qa_network_security');$manager.manifest.application.SetAttribute('label',$ns,'DSI Manager QA')
  New-Item -ItemType Directory -Force "$res/xml","$res/raw" | Out-Null;Copy-Item $QaCertificate "$res/raw/qa_ca.pem"
  [IO.File]::WriteAllText("$res/xml/qa_network_security.xml",'<network-security-config><base-config cleartextTrafficPermitted="false"/><domain-config cleartextTrafficPermitted="false"><domain includeSubdomains="false">localhost</domain><trust-anchors><certificates src="@raw/qa_ca"/></trust-anchors></domain-config></network-security-config>')
  $config=Join-Path $stage 'ManagerUpdateConfig.java';[IO.File]::WriteAllText($config,'package interactive.deadsignal.dsi.manager; final class ManagerUpdateConfig {static final boolean QA_BUILD=true;static final String FEED_URL="https://localhost:8443/manager.json";static final String QA_ASSET_PREFIX="https://localhost:8443/assets/";}')
  $sources=@($sources|Where-Object{[IO.Path]::GetFileName($_)-ne 'ManagerUpdateConfig.java'})+@($config)
 }
 $manager.Save($manifest);$apk=Join-Path $out $OutputName;Build-Apk 'manager' $manifest $res $assets $sources $apk
 $report=[ordered]@{schemaVersion=1;qaBuild=$qa;manager=(Metadata $apk 'interactive.deadsignal.dsi.manager' $VersionCode $VersionName);payload=$payload;buildTools='35.0.1';signing='persistent-local-development-key';keyPath=$SigningKey;productionFeed=(!$qa)}
 $reportName=if($OutputName-eq 'dsi-manager-debug.apk'){'manager-build-report.json'}elseif($qa){'manager-qa-build-report.json'}else{[IO.Path]::GetFileNameWithoutExtension($OutputName)+'-report.json'}
 [IO.File]::WriteAllText((Join-Path $out $reportName),($report|ConvertTo-Json -Depth 8)+"`n")
 Write-Output "Built $apk (QA=$qa); report $reportName. Signing key preserved; do not redistribute it."
}finally{$env:JAVA_HOME=$oldJava}
