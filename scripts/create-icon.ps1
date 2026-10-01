Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path -Parent $PSScriptRoot
$bitmap = [System.Drawing.Bitmap]::new(128, 128)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#121019'))
$pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#a78bfa'), 8)
$pen.StartCap = $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$points = [System.Drawing.Point[]] @(
    [System.Drawing.Point]::new(24, 68), [System.Drawing.Point]::new(40, 68),
    [System.Drawing.Point]::new(50, 42), [System.Drawing.Point]::new(64, 88),
    [System.Drawing.Point]::new(78, 52), [System.Drawing.Point]::new(88, 68),
    [System.Drawing.Point]::new(104, 68)
)
$graphics.DrawLines($pen, $points)
$bitmap.Save((Join-Path $repoRoot 'assets/dsi-chat.png'), [System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item -LiteralPath (Join-Path $repoRoot 'assets/dsi-chat.png') -Destination (Join-Path $repoRoot 'apps/desktop/browser/icon.png')
Copy-Item -LiteralPath (Join-Path $repoRoot 'assets/dsi-chat.png') -Destination (Join-Path $repoRoot 'apps/mobile/src/assets/icons/dsi-chat.png')
$pen.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
