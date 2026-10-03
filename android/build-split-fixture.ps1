param([string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop';$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'));if(!$Sdk){$Sdk=Join-Path $repo '.cache/toolchains/android-sdk'}
. (Join-Path $PSScriptRoot 'tools.ps1');$JavaHome=Resolve-DsiJavaHome $JavaHome
$tools=Join-Path $Sdk 'build-tools/35.0.1';$jar=Join-Path $Sdk 'platforms/android-35/android.jar'
$stage=Join-Path $repo ('.cache/android-split-fixture/stage-'+[guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Force $stage|Out-Null
$res=Join-Path $stage 'res';Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'res') -Destination $res -Recurse
$localized=Join-Path $res 'values-en';New-Item -ItemType Directory -Force $localized|Out-Null
[IO.File]::WriteAllText((Join-Path $localized 'strings.xml'),'<resources><string name="app_name">DSI Native Lab • Split fixture</string></resources>')
$manifest=Join-Path $stage 'AndroidManifest.xml';[xml]$doc=Get-Content (Join-Path $PSScriptRoot 'AndroidManifest.xml') -Raw
$ns='http://schemas.android.com/apk/res/android';$doc.DocumentElement.SelectSingleNode('application').SetAttribute('isSplitRequired',$ns,'true');$doc.Save($manifest)
function Run([string]$command,[string[]]$arguments){& $command @arguments;if($LASTEXITCODE-ne 0){throw "$command failed"}}
$resources=Join-Path $stage 'resources.zip';Run "$tools/aapt2.exe" @('compile','--dir',$res,'-o',$resources)
$baseUnsigned=Join-Path $stage 'base.apk';$splitUnsigned=Join-Path $stage 'split_config.en.apk'
Run "$tools/aapt2.exe" @('link','-o',$baseUnsigned,'--manifest',$manifest,'-I',$jar,'--split',($splitUnsigned+';en'),$resources)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$native=Join-Path $repo 'dist/android/dsi-native-lab-debug.apk';$zip=[IO.Compression.ZipFile]::OpenRead($native)
try{[IO.Compression.ZipFileExtensions]::ExtractToFile($zip.GetEntry('classes.dex'),(Join-Path $stage 'classes.dex'))}finally{$zip.Dispose()}
Run "$JavaHome/bin/jar.exe" @('uf',$baseUnsigned,'-C',$stage,'classes.dex')
$out=Join-Path $repo 'dist/android/split-fixture';if(Test-Path $out){throw 'Split fixture output exists; preserve it and choose a fresh build checkout.'};New-Item -ItemType Directory -Path $out|Out-Null
$key=Join-Path $repo '.cache/android-build/debug.keystore';$oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
try{foreach($name in @('base.apk','split_config.en.apk')){$aligned=Join-Path $stage ($name+'.aligned');Run "$tools/zipalign.exe" @('-f','-P','16','4',(Join-Path $stage $name),$aligned);Run "$tools/apksigner.bat" @('sign','--ks',$key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',(Join-Path $out $name),$aligned);Run "$tools/apksigner.bat" @('verify','--verbose',(Join-Path $out $name))}}finally{$env:JAVA_HOME=$oldJava}
Write-Output "Built controlled original split fixture: $out"
