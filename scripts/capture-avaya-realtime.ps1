[CmdletBinding()]
param(
    [string]$WindowTitle = "Avaya",
    [string]$OutputPath = (Join-Path ([Environment]::GetFolderPath("MyPictures")) ("Avaya-Realtime-{0}.png" -f (Get-Date -Format "yyyyMMdd-HHmmss")))
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not [Environment]::UserInteractive) {
    throw "Run this script from the signed-in office user's desktop; a background SYSTEM task cannot capture the interactive Avaya window."
}

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class AvayaWindowCapture {
    [StructLayout(LayoutKind.Sequential)]
    public struct Rect {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr windowHandle, out Rect bounds);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr windowHandle);
}
"@

$window = Get-Process |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$WindowTitle*" } |
    Select-Object -First 1

if (-not $window) {
    throw "No visible application window matching '$WindowTitle' was found. Open the Avaya Reporting real-time dashboard and try again."
}

[AvayaWindowCapture]::SetForegroundWindow($window.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 500

$bounds = New-Object AvayaWindowCapture+Rect
if (-not [AvayaWindowCapture]::GetWindowRect($window.MainWindowHandle, [ref]$bounds)) {
    throw "Windows could not read the Avaya window bounds."
}

$width = $bounds.Right - $bounds.Left
$height = $bounds.Bottom - $bounds.Top
if ($width -le 0 -or $height -le 0) {
    throw "The Avaya window is minimized or has invalid dimensions. Restore it and try again."
}

$outputDirectory = Split-Path -Parent $OutputPath
if (-not $outputDirectory) {
    $outputDirectory = (Get-Location).Path
    $OutputPath = Join-Path $outputDirectory $OutputPath
}
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$bitmap = New-Object Drawing.Bitmap($width, $height)
$graphics = [Drawing.Graphics]::FromImage($bitmap)
try {
    $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bitmap.Size, [Drawing.CopyPixelOperation]::SourceCopy)
    $bitmap.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $graphics.Dispose()
    $bitmap.Dispose()
}

Write-Host "Avaya real-time dashboard image saved to: $OutputPath"
