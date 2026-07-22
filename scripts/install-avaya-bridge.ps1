[CmdletBinding()]
param(
    [string]$ExportDirectory = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Avaya Exports"),
    [string]$Endpoint = "https://www.res-dashbord.com/api/avaya/sync",
    [ValidateRange(1, 60)]
    [int]$IntervalMinutes = 5,
    [SecureString]$ApiKey,
    [switch]$UserMode
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

$isAdministrator = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $UserMode -and -not $isAdministrator) {
    throw "Run PowerShell as Administrator for nonstop background sync, or use -UserMode for sync only while this Windows user is logged in."
}

$installDirectory = if ($UserMode) {
    Join-Path $env:LOCALAPPDATA "RES-Avaya-Bridge"
}
else {
    Join-Path $env:ProgramData "RES-Avaya-Bridge"
}
$installedScript = Join-Path $installDirectory "avaya-bridge.ps1"
$configPath = Join-Path $installDirectory "config.json"
$secretPath = Join-Path $installDirectory "secret.txt"
$taskName = "RES Avaya Report Sync"

New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $ExportDirectory -Force | Out-Null
Copy-Item -LiteralPath $sourceScript -Destination $installedScript -Force

$secretProtection = if ($UserMode) { "CurrentUser" } else { "LocalMachine" }
if ($UserMode) {
    $ApiKey | ConvertFrom-SecureString | Set-Content -LiteralPath $secretPath -Encoding UTF8
}
else {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiKey)
    try {
        $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        $plainBytes = [Text.Encoding]::UTF8.GetBytes($plainToken)
        $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
            $plainBytes,
            $null,
            [Security.Cryptography.DataProtectionScope]::LocalMachine
        )
        [Convert]::ToBase64String($protectedBytes) | Set-Content -LiteralPath $secretPath -Encoding ASCII
        [Array]::Clear($plainBytes, 0, $plainBytes.Length)
        [Array]::Clear($protectedBytes, 0, $protectedBytes.Length)
        $plainToken = $null
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}
@{
    exportDirectory = (Resolve-Path -LiteralPath $ExportDirectory).Path
    endpoint = $Endpoint
    secretFile = "secret.txt"
    secretProtection = $secretProtection
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8

if (-not $UserMode) {
    $acl = Get-Acl -LiteralPath $installDirectory
    $acl.SetAccessRuleProtection($true, $false)
    $systemSid = New-Object Security.Principal.SecurityIdentifier("S-1-5-18")
    $administratorsSid = New-Object Security.Principal.SecurityIdentifier("S-1-5-32-544")
    $inheritance = [Security.AccessControl.InheritanceFlags]"ContainerInherit, ObjectInherit"
    $propagation = [Security.AccessControl.PropagationFlags]::None
    $allow = [Security.AccessControl.AccessControlType]::Allow
    $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($systemSid, "FullControl", $inheritance, $propagation, $allow)))
    $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($administratorsSid, "FullControl", $inheritance, $propagation, $allow)))
    Set-Acl -LiteralPath $installDirectory -AclObject $acl
}

$powerShell = Join-Path $PSHOME "powershell.exe"
$actionArguments = "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$installedScript`" -ConfigPath `"$configPath`""
$action = New-ScheduledTaskAction -Execute $powerShell -Argument $actionArguments
$repeatTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$triggers = if ($UserMode) { @($repeatTrigger) } else { @((New-ScheduledTaskTrigger -AtStartup), $repeatTrigger) }
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)
$principal = if ($UserMode) {
    New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
}
else {
    New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
}
$task = New-ScheduledTask -Action $action -Trigger $triggers -Settings $settings -Principal $principal

Register-ScheduledTask -TaskName $taskName -InputObject $task -Force | Out-Null
& $installedScript -ConfigPath $configPath

Write-Host "RES Avaya bridge installed."
Write-Host "Export directory: $ExportDirectory"
Write-Host "Scheduled task: $taskName (every $IntervalMinutes minutes)"
Write-Host $(if ($UserMode) { "Mode: current user (requires sign-in)" } else { "Mode: nonstop system task (runs after restart and without sign-in)" })
