param([Parameter(Mandatory=$true)][string]$Serial,[Parameter(Mandatory=$true)][string]$OutputDirectory,[string]$Package='com.discord',[string]$Adb)
$ErrorActionPreference='Stop'
if($Serial-notmatch '^[A-Za-z0-9._:-]+$'){throw 'Explicit ADB serial contains unsupported characters.'}
if($Package-notmatch '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$'){throw 'Invalid Android package name'}
if(!$Adb){if($env:ANDROID_HOME){$Adb=Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'}else{$Adb=(Get-Command adb -ErrorAction Stop).Source}}
$output=[IO.Path]::GetFullPath($OutputDirectory)
if(Test-Path -LiteralPath $output){throw 'Export directory already exists. Choose a new directory; existing files are preserved.'}
$state=@(& $Adb -s $Serial get-state);if($LASTEXITCODE-ne 0 -or ($state-join '').Trim()-ne 'device'){throw 'Selected device must already be connected and authorized. No automatic connect/pair/install is performed.'}
$response=@(& $Adb -s $Serial shell pm path $Package);if($LASTEXITCODE-ne 0){throw 'Package path query failed'}
$paths=@();$names=New-Object 'Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
foreach($line in $response){$line="$line".Trim();if(!$line){continue};if($line-notmatch '^package:(/(?:data/app|mnt/expand|system/(?:app|priv-app)|product/app|system_ext/app|vendor/app)/[A-Za-z0-9._~+=/-]+\.apk)$'){throw 'Package manager returned an unsupported APK path; nothing was exported.'};$remote=$Matches[1];$name=[IO.Path]::GetFileName($remote);if(!$names.Add($name)){throw 'Duplicate APK filenames cannot be exported safely'};$paths+=@{remote=$remote;file=$name}}
if($paths.Count-eq 0){throw "Package $Package is not installed for the selected device/user."}
New-Item -ItemType Directory -Path $output|Out-Null
$files=@()
foreach($item in $paths){$destination=Join-Path $output $item.file;& $Adb -s $Serial pull $item.remote $destination;if($LASTEXITCODE-ne 0 -or !(Test-Path -LiteralPath $destination)){throw 'APK export failed; partial output is preserved for inspection.'};$files+=@{file=$item.file;source=$item.remote;sha256=(Get-FileHash $destination -Algorithm SHA256).Hash.ToLowerInvariant();bytes=(Get-Item $destination).Length}}
$report=[ordered]@{schemaVersion=1;kind='dsi-read-only-installed-apk-export';package=$Package;serial=$Serial;completeInstalledPathInventory=$true;apks=$files;accountDataExported=$false;installationPerformed=$false}
[IO.File]::WriteAllText((Join-Path $output 'export-report.json'),($report|ConvertTo-Json -Depth 6)+"`n")
Write-Output "Exported $($files.Count) installed APK files to $output. Only package APKs were read; no account data or installation was touched."
