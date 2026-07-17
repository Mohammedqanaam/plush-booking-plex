[CmdletBinding()]
param(
    [string]$ConfigPath = (Join-Path $env:LOCALAPPDATA "RES-Avaya-Bridge\config.json")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-BridgeLog {
    param([string]$Message)

    $logPath = Join-Path (Split-Path -Parent $ConfigPath) "bridge.log"
    if (Test-Path -LiteralPath $logPath) {
        $log = Get-Item -LiteralPath $logPath
        if ($log.Length -gt 2MB) {
            Move-Item -LiteralPath $logPath -Destination "$logPath.1" -Force
        }
    }
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $Message" -Encoding UTF8
}

function Save-BridgeState {
    param(
        [string]$Path,
        [string[]]$ProcessedHashes
    )

    $temporaryPath = "$Path.tmp"
    @{ processedHashes = @($ProcessedHashes | Select-Object -Last 2000) } |
        ConvertTo-Json -Depth 3 |
        Set-Content -LiteralPath $temporaryPath -Encoding UTF8
    Move-Item -LiteralPath $temporaryPath -Destination $Path -Force
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Bridge configuration was not found: $ConfigPath"
}

$config = Get-Content -Raw -LiteralPath $ConfigPath -Encoding UTF8 | ConvertFrom-Json
$configDirectory = Split-Path -Parent $ConfigPath
$exportDirectory = [string]$config.exportDirectory
$endpoint = [string]$config.endpoint
$secretPath = Join-Path $configDirectory ([string]$config.secretFile)
$statePath = Join-Path $configDirectory "state.json"

if (-not $exportDirectory -or -not (Test-Path -LiteralPath $exportDirectory -PathType Container)) {
    throw "Avaya export directory is unavailable: $exportDirectory"
}
if (-not $endpoint.StartsWith("https://", [StringComparison]::OrdinalIgnoreCase)) {
    throw "The bridge endpoint must use HTTPS."
}
if (-not (Test-Path -LiteralPath $secretPath -PathType Leaf)) {
    throw "The encrypted bridge secret is missing."
}

$secureToken = (Get-Content -Raw -LiteralPath $secretPath).Trim() | ConvertTo-SecureString
$credential = New-Object System.Management.Automation.PSCredential("avaya-sync", $secureToken)
$token = $credential.GetNetworkCredential().Password
if ([string]::IsNullOrWhiteSpace($token)) {
    throw "The encrypted bridge secret could not be decrypted for this Windows user."
}

$processedHashes = @()
if (Test-Path -LiteralPath $statePath -PathType Leaf) {
    try {
        $storedState = Get-Content -Raw -LiteralPath $statePath -Encoding UTF8 | ConvertFrom-Json
        $processedHashes = @($storedState.processedHashes | ForEach-Object { [string]$_ })
    }
    catch {
        Write-BridgeLog "State file was invalid and has been reset."
    }
}

$processedLookup = @{}
foreach ($hash in $processedHashes) {
    if ($hash) { $processedLookup[$hash] = $true }
}

$files = Get-ChildItem -LiteralPath $exportDirectory -File -Filter "*.xlsx" |
    Where-Object { $_.LastWriteTimeUtc -lt (Get-Date).ToUniversalTime().AddSeconds(-15) } |
    Sort-Object LastWriteTimeUtc

$hadError = $false
foreach ($file in $files) {
    try {
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($processedLookup.ContainsKey($hash)) { continue }
        if ($file.Length -gt 3MB) {
            Write-BridgeLog "Skipped oversized workbook: $($file.Name)"
            continue
        }

        $payload = @{
            fileName = $file.Name
            sha256 = $hash
            contentBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName))
        } | ConvertTo-Json -Compress

        $response = Invoke-RestMethod -Uri $endpoint -Method Post -ContentType "application/json" -Headers @{
            Authorization = "Bearer $token"
        } -Body $payload -TimeoutSec 60

        if (-not $response.ok) {
            throw "The server did not accept the workbook."
        }

        $processedHashes += $hash
        $processedLookup[$hash] = $true
        Save-BridgeState -Path $statePath -ProcessedHashes $processedHashes
        Write-BridgeLog "Uploaded $($file.Name): $($response.status)"
    }
    catch {
        $hadError = $true
        Write-BridgeLog "Upload failed for $($file.Name): $($_.Exception.Message)"
    }
}

$credential = $null
$secureToken = $null
$token = $null
if ($hadError) { exit 1 }
