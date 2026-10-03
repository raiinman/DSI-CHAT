param([string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'tools.ps1')
$JavaHome=Resolve-DsiJavaHome $JavaHome
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')); $classes=Join-Path $repo '.cache/android-tests'
New-Item -ItemType Directory -Force $classes | Out-Null
& "$JavaHome/bin/javac.exe" --release 8 -encoding UTF-8 -d $classes (Join-Path $PSScriptRoot 'src/interactive/deadsignal/dsi/devhost/PluginEngine.java') (Join-Path $PSScriptRoot 'tests/NativeLifecycleTest.java')
if ($LASTEXITCODE -ne 0) { throw 'Native test compilation failed' }
& "$JavaHome/bin/java.exe" -cp $classes NativeLifecycleTest
if ($LASTEXITCODE -ne 0) { throw 'Native acceptance tests failed' }
