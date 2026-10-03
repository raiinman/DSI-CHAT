function Get-DsiApkInfo([string]$Apk,[string]$Sdk,[string]$JavaHome,[string]$Apktool,[string]$Stage) {
    $tools=Join-Path $Sdk 'build-tools/35.0.1'
    $badging=@(& "$tools/aapt2.exe" dump badging $Apk);if($LASTEXITCODE-ne 0){throw 'APK manifest inspection failed'}
    $header=($badging|Where-Object {$_-like 'package:*'}|Select-Object -First 1)
    if($header-notmatch "name='([^']+)' versionCode='([^']+)'"){throw 'APK package/version metadata unavailable'}
    $packageName=$Matches[1];$versionCode=$Matches[2];$major='0';if($header-match "versionCodeMajor='([^']+)'"){$major=$Matches[1]}
    $oldJava=$env:JAVA_HOME;$env:JAVA_HOME=$JavaHome
    try{$certificates=@(& "$tools/apksigner.bat" verify --print-certs $Apk);if($LASTEXITCODE-ne 0){throw 'Input APK has an invalid/unavailable signature'}}finally{$env:JAVA_HOME=$oldJava}
    $certs=@();foreach($line in $certificates){if($line-match '^Signer #\d+ certificate SHA-256 digest: ([A-Fa-f0-9]{64})$'){$certs+=$Matches[1].ToLowerInvariant()}}
    if($certs.Count-ne 1){throw 'Only a single original signer is currently supported for APK sets.'}
    $manifestFolder=Join-Path $Stage ('manifest-'+[guid]::NewGuid().ToString('N'))
    & "$JavaHome/bin/java.exe" -jar $Apktool d --only-manifest --no-src $Apk -o $manifestFolder -p (Join-Path $Stage 'framework') | Out-Host
    if($LASTEXITCODE-ne 0){throw 'APK manifest decoding failed'}
    [xml]$manifest=Get-Content (Join-Path $manifestFolder 'AndroidManifest.xml') -Raw
    $root=$manifest.DocumentElement;$ns='http://schemas.android.com/apk/res/android';$app=$root.SelectSingleNode('application')
    $dependencies=@();foreach($use in $root.SelectNodes('uses-split')){$dependencies+=$use.GetAttribute('name',$ns)}
    $requiredTypes=@();$types=@()
    foreach($value in @($root.GetAttribute('requiredSplitTypes',$ns),$(if($app){$app.GetAttribute('requiredSplitTypes',$ns)}))){if($value){$requiredTypes+=@($value.Split(',')|ForEach-Object {$_.Trim()}|Where-Object {$_})}}
    foreach($value in @($root.GetAttribute('splitTypes',$ns),$(if($app){$app.GetAttribute('splitTypes',$ns)}))){if($value){$types+=@($value.Split(',')|ForEach-Object {$_.Trim()}|Where-Object {$_})}}
    $required=$root.GetAttribute('isSplitRequired',$ns)-eq 'true'
    if($app){if($app.GetAttribute('isSplitRequired',$ns)-eq 'true'){$required=$true};foreach($meta in $app.SelectNodes('meta-data')){if($meta.GetAttribute('name',$ns)-eq 'com.android.vending.splits.required'-and $meta.GetAttribute('value',$ns)-eq 'true'){$required=$true}}}
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive=[IO.Compression.ZipFile]::OpenRead($Apk)
    try {$dex=@($archive.Entries|Where-Object {$_.FullName-match '^classes\d*\.dex$'}).Count} finally {$archive.Dispose()}
    return [pscustomobject]@{file=[IO.Path]::GetFullPath($Apk);name=[IO.Path]::GetFileName($Apk);package=$packageName;versionCode=$versionCode;versionMajor=$major;certificate=$certs[0];split=$root.GetAttribute('split');feature=$root.GetAttribute('isFeatureSplit',$ns)-eq 'true';configFor=$root.GetAttribute('configForSplit',$ns);dependencies=$dependencies;requiredTypes=$requiredTypes;types=$types;splitRequired=$required;dexCount=$dex;sha256=(Get-FileHash $Apk -Algorithm SHA256).Hash.ToLowerInvariant();manifest=$manifest}
}
