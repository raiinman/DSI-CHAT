param([Parameter(Mandatory=$true)][string]$InputApk,[Parameter(Mandatory=$true)][string]$OutputApk,[string]$Sdk=$env:ANDROID_HOME,[string]$JavaHome=$env:JAVA_HOME)
. (Join-Path $PSScriptRoot 'patch-core.ps1')
Invoke-DsiPatchApk -InputApk $InputApk -OutputApk $OutputApk -Sdk $Sdk -JavaHome $JavaHome
