param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!$Sdk) {$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
. (Join-Path $PSScriptRoot 'tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
$sdkJar=Join-Path $Sdk 'platforms/android-35/android.jar';$tools=Join-Path $Sdk 'build-tools/35.0.1'
if (!(Test-Path $sdkJar)) {throw 'Android platform 35 is required'}
function Run([string]$command,[string[]]$arguments) {& $command @arguments;if($LASTEXITCODE -ne 0){throw "$command failed ($LASTEXITCODE)"}}
$stage=Join-Path $repo ('.cache/android-bootstrap/stage-'+[guid]::NewGuid().ToString('N'))
$classes=Join-Path $stage 'classes';$dex=Join-Path $stage 'dex';$out=Join-Path $repo 'dist/android'
New-Item -ItemType Directory -Force $stage,$classes,$dex,$out|Out-Null
$engine=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'src/interactive/deadsignal/dsi/devhost/PluginEngine.java')).Replace('package interactive.deadsignal.dsi.devhost;','package interactive.deadsignal.dsi.bootstrap;')
[IO.File]::WriteAllText((Join-Path $stage 'PluginEngine.java'),$engine)
$sources=@(Get-ChildItem (Join-Path $PSScriptRoot 'bootstrap') -Filter '*.java' | ForEach-Object {$_.FullName})+(Join-Path $stage 'PluginEngine.java')
Run "$JavaHome/bin/javac.exe" (@('--release','8','-encoding','UTF-8','-classpath',$sdkJar,'-d',$classes)+$sources)
Run "$JavaHome/bin/jar.exe" @('cf',(Join-Path $stage 'bootstrap.jar'),'-C',$classes,'.')
$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try {Run "$tools/d8.bat" @('--lib',$sdkJar,'--min-api','26','--output',$dex,(Join-Path $stage 'bootstrap.jar'))}finally{$env:JAVA_HOME=$oldJava}
Copy-Item -LiteralPath (Join-Path $dex 'classes.dex') -Destination (Join-Path $out 'dsi-native-bootstrap.dex')
Write-Output "Built original native bootstrap: $out/dsi-native-bootstrap.dex"
