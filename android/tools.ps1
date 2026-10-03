function Resolve-DsiJavaHome([string]$requested) {
    if ($requested) {
        if (!(Test-Path (Join-Path $requested 'bin/javac.exe'))) {throw 'Selected JAVA_HOME must contain bin/javac.exe.'}
        return [IO.Path]::GetFullPath($requested)
    }
    # Oracle's PATH shims are not the JDK directory. Ask the running JVM instead.
    $info=New-Object Diagnostics.ProcessStartInfo
    $info.FileName=(Get-Command java -ErrorAction Stop).Source
    $info.Arguments='-XshowSettings:properties -version'
    $info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardError=$true
    $process=New-Object Diagnostics.Process;$process.StartInfo=$info
    [void]$process.Start();$properties=$process.StandardError.ReadToEnd();$process.WaitForExit()
    if($process.ExitCode-ne 0){throw 'Could not resolve Java runtime'}
    $match=[regex]::Match($properties,'(?m)^\s*java\.home\s*=\s*(.+)\r?$')
    $process.Dispose()
    if(!$match.Success){throw 'Set JAVA_HOME to a development JDK or pass -JavaHome.'}
    $resolved=$match.Groups[1].Value.Trim()
    if(!(Test-Path (Join-Path $resolved 'bin/javac.exe'))){throw 'Java runtime has no compiler; select a JDK.'}
    return $resolved
}
