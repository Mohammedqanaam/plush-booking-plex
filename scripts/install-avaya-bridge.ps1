[CmdletBinding()]
param(
    [string]$ExportDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Avaya Exports"),
    [string]$Endpoint = "https://www.res-dashbord.com/api/avaya/sync",
    [ValidateRange(1, 60)]
    [int]$IntervalMinutes = 5,
    [SecureString]$ApiKey
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $Endpoint.StartsWith("https://", [StringComparison]::OrdinalIgnoreCase)) {
    throw "Endpoint must use HTTPS."
}

$sourceScript = Join-Path $PSScriptRoot "avaya-bridge.ps1"
if (-not (Test-Path -LiteralPath $sourceScript -PathType Leaf)) {
    throw "avaya-bridge.ps1 must be in the same directory as this installer."
}

if (-not $ApiKey) {
    $ApiKey = Read-Host "Enter the AVAYA_SYNC_KEY configured in Netlify" -AsSecureString
}

$installDirectory = Join-Path $env:LOCALAPPDATA "RES-Avaya-Bridge"
$installedScript = Join-Path $installDirectory "avaya-bridge.ps1"
$configPath = Join-Path $installDirectory "config.json"
$secretPath = Join-Path $installDirectory "secret.txt"
$taskName = "RES Avaya Report Sync"

New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $ExportDirectory -Force | Out-Null
Copy-Item -LiteralPath $sourceScript -Destination $installedScript -Force

$ApiKey | ConvertFrom-SecureString | Set-Content -LiteralPath $secretPath -Encoding UTF8
@{
    exportDirectory = (Resolve-Path -LiteralPath $ExportDirectory).Path
    endpoint = $Endpoint
    secretFile = "secret.txt"
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8

$powerShell = Join-Path $PSHOME "powershell.exe"
$action = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$installedScript`" -ConfigPath `"$configPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal

Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
& $installedScript -ConfigPath $configPath

Write-Host "RES Avaya bridge installed."
Write-Host "Export directory: $ExportDirectory"
Write-Host "Scheduled task: $taskName (every $IntervalMinutes minutes)"
