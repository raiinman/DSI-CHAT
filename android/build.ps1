param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!$Sdk) { $Sdk=Join-Path $repo '.cache/toolchains/android-sdk' }
. (Join-Path $PSScriptRoot 'tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
$sdkJar=Join-Path $Sdk 'platforms/android-35/android.jar'
$tools=Join-Path $Sdk 'build-tools/35.0.1'
if (!(Test-Path $sdkJar) -or !(Test-Path "$tools/aapt2.exe")) { throw 'Install Android platform 35 and build-tools 35.0.1; pass -Sdk or ANDROID_HOME. See android/README.md.' }
function Run([string]$command,[string[]]$arguments) { & $command @arguments; if ($LASTEXITCODE -ne 0) { throw "$command failed ($LASTEXITCODE)" } }
$work=Join-Path $repo '.cache/android-build'
$out=Join-Path $repo 'dist/android'
$stage=Join-Path $work ('stage-'+[guid]::NewGuid().ToString('N'))
$classes=Join-Path $stage 'classes'; $dex=Join-Path $stage 'dex'; $assets=Join-Path $stage 'assets'
New-Item -ItemType Directory -Force $work,$out,$classes,$dex,$assets | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'plugins.json') -Destination (Join-Path $assets 'dsi-native-plugins.json')
$source=@(Get-ChildItem (Join-Path $PSScriptRoot 'src') -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
Run "$JavaHome/bin/javac.exe" (@('--release','8','-encoding','UTF-8','-classpath',$sdkJar,'-d',$classes)+$source)
Run "$JavaHome/bin/jar.exe" @('cf',(Join-Path $stage 'classes.jar'),'-C',$classes,'.')
$oldJava=$env:JAVA_HOME; $env:JAVA_HOME=$JavaHome
try {
    Run "$tools/d8.bat" @('--lib',$sdkJar,'--min-api','26','--output',$dex,(Join-Path $stage 'classes.jar'))
    $unsigned=Join-Path $stage 'unsigned.apk'; $aligned=Join-Path $stage 'aligned.apk'; $apk=Join-Path $out 'dsi-native-lab-debug.apk'
    $resources=Join-Path $stage 'resources.zip'
    Run "$tools/aapt2.exe" @('compile','--dir',(Join-Path $PSScriptRoot 'res'),'-o',$resources)
    Run "$tools/aapt2.exe" @('link','-o',$unsigned,'--manifest',(Join-Path $PSScriptRoot 'AndroidManifest.xml'),'-I',$sdkJar,'-A',$assets,$resources)
    Run "$JavaHome/bin/jar.exe" @('uf',$unsigned,'-C',$dex,'classes.dex')
    Run "$tools/zipalign.exe" @('-f','-p','4',$unsigned,$aligned)
    $key=Join-Path $work 'debug.keystore'
    if (!(Test-Path $key)) { Run "$JavaHome/bin/keytool.exe" @('-genkeypair','-keystore',$key,'-alias','androiddebugkey','-storepass','android','-keypass','android','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=DSI Development,OU=Development,O=DSI,C=US') }
    Run "$tools/apksigner.bat" @('sign','--ks',$key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,$aligned)
    Run "$tools/apksigner.bat" @('verify','--verbose',$apk)
    Run "$tools/aapt2.exe" @('dump','badging',$apk)
    $record=[ordered]@{package='interactive.deadsignal.dsi.devhost';version='0.1.0';apiVersion=1;platform='android';host='native-development-fixture';discordAttached=$false;minSdk=26;targetSdk=35;buildTools='35.0.1';signing='development-debug';sha256=(Get-FileHash $apk -Algorithm SHA256).Hash.ToLowerInvariant();bytes=(Get-Item $apk).Length}
    [IO.File]::WriteAllText((Join-Path $out 'build-report.json'),($record|ConvertTo-Json)+"`n")
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'plugins.json') -Destination (Join-Path $out 'plugins.json')
    Write-Output "Built $apk"
} finally { $env:JAVA_HOME=$oldJava }
