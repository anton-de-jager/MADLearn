<#
.SYNOPSIS
  Build MADLearn + FTP-deploy to two Plesk/IIS sites on the corenetworks
  shared host (41.185.110.61):
    - .NET 8 API publish output -> /madlearnapi.madprospects.com/
    - Angular SPA dist           -> /madlearn.madprospects.com/

.DESCRIPTION
  This is the active FTP/IIS deploy path for the 1-grid/Plesk Windows host.
  `deploy/deploy.ps1` is kept as a compatibility wrapper and delegates here.

  Pipeline:
    1. ng build --configuration production         -> apps/web/dist/lms-frontend/browser/
    2. dotnet publish (win-x64, framework-dependent) -> %TEMP%/madlearn-deploy/api/
    3. Copy deploy/madlearn/web.config (ANCM hosting) into API staging.
       Copy deploy/madlearn/fe-web.config (SPA URL rewrite) into FE staging.
       Write a sanitized .env into API staging (FTP_* / SFTP_* keys stripped).
    4. Take API offline via app_offline.htm (IIS releases DLL locks),
       upload via FTPS (curl.exe --ssl-reqd), then delete app_offline.htm.
    5. Health-check the public API URL until it returns 200.

  Credentials in .env.deploy.madlearn at the repo root (gitignored). Copy
  .env.deploy.madlearn.example to .env.deploy.madlearn and fill in real values.

  -------------------------------------------------------------------------
  One-time host prerequisites (panel admin)
  -------------------------------------------------------------------------
  API site (madlearnapi.madprospects.com):
    - .NET 8.0 ASP.NET Core Hosting Bundle installed on the IIS server
    - App pool: No Managed Code (CLR Version -> No Managed Code)
    - App pool identity has read/write on /madlearnapi.madprospects.com/

  FE site (madlearn.madprospects.com):
    - URL Rewrite IIS module installed (Plesk default has it)
    - No app pool requirements (static files only)

  DNS + HTTPS already in place; both subdomains -> 41.185.110.61, certs
  managed by Plesk.

.PARAMETER Target
  'All' (default), 'Frontend', or 'Backend'.

.PARAMETER SkipBuild
  Re-upload the last staged output without rebuilding.

.PARAMETER WhatIf
  Dry-run: log what would upload but don't actually push.

.EXAMPLE
  .\deploy\deploy-madlearn.ps1                       # build + deploy both
  .\deploy\deploy-madlearn.ps1 -Target Frontend      # SPA only
  .\deploy\deploy-madlearn.ps1 -Target Backend       # API only
  .\deploy\deploy-madlearn.ps1 -SkipBuild            # re-upload last build
  .\deploy\deploy-madlearn.ps1 -WhatIf               # dry-run
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateSet('All', 'Frontend', 'Backend')]
    [string]$Target = 'All',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'
$env:DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = 'true'
$scriptRoot            = $PSScriptRoot
$repoRoot              = Split-Path $scriptRoot -Parent
$pnpmVersion           = 'pnpm@11.2.2'
$pnpmStore             = 'C:\Code\.pnpm'
$pnpmVirtualStore      = 'C:\Code\.pnpm\madlearn-virtual-store'
$pnpmRunner            = Join-Path $pnpmStore 'madlearn-deploy-bin'
Set-Location $repoRoot

function Write-Step  { param($n, $total, $msg) Write-Host ""; Write-Host "[$n/$total] $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg"   -ForegroundColor Green }
function Write-Warn2 { param($msg) Write-Host "  [!]  $msg"   -ForegroundColor Yellow }
function Write-Info  { param($msg) Write-Host "  ...  $msg"   -ForegroundColor Gray }
function Invoke-Native {
    param([Parameter(Mandatory)][scriptblock]$Block)
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Block } finally { $ErrorActionPreference = $old }
}
function Get-CorepackExe {
    $corepack = Get-Command corepack.cmd,corepack -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $corepack) {
        throw 'corepack is required to run pnpm but was not found on PATH.'
    }
    return $corepack.Source
}
function Set-TextFileIfChanged {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string[]]$Value
    )

    $desired = ($Value -join [Environment]::NewLine) + [Environment]::NewLine
    if (Test-Path -LiteralPath $Path) {
        $existing = [System.IO.File]::ReadAllText($Path)
        if ($existing -eq $desired -or $existing.TrimEnd() -eq $desired.TrimEnd()) {
            return
        }
    }
    Set-Content -LiteralPath $Path -Value $Value -Encoding ASCII
}
function Set-Utf8NoBomText {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Value
    )

    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Value, $encoding)
}
function Initialize-PnpmRunner {
    New-Item -ItemType Directory -Force -Path $pnpmRunner | Out-Null
    $corepack = Get-CorepackExe

    Set-TextFileIfChanged -Path (Join-Path $pnpmRunner 'pnpm.cmd') -Value @(
        '@echo off'
        "`"$corepack`" $pnpmVersion %*"
    )
    Set-TextFileIfChanged -Path (Join-Path $pnpmRunner 'pnpm.CMD') -Value @(
        '@echo off'
        "`"$corepack`" $pnpmVersion %*"
    )
    Set-TextFileIfChanged -Path (Join-Path $pnpmRunner 'pnpm') -Value @(
        '#!/usr/bin/env sh'
        "`"$corepack`" $pnpmVersion `"$@`""
    )
    Set-TextFileIfChanged -Path (Join-Path $pnpmRunner 'pnpm.ps1') -Value @(
        "& '$corepack' '$pnpmVersion' @args"
        'exit $LASTEXITCODE'
    )

    $pathParts = @($env:PATH -split ';' | Where-Object { $_ })
    $pathParts = @($pnpmRunner) + @($pathParts | Where-Object { $_ -ne $pnpmRunner })
    $env:PATH = $pathParts -join ';'
}
function Invoke-Pnpm {
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [Parameter(Mandatory)][string]$WorkingDirectory
    )

    $oldPath = Get-Location
    Push-Location $WorkingDirectory
    $oldStore = $env:PNPM_STORE_DIR
    $oldNpmStore = $env:NPM_CONFIG_STORE_DIR
    $oldPrompt = $env:COREPACK_ENABLE_DOWNLOAD_PROMPT
    $oldStrict = $env:COREPACK_ENABLE_STRICT
    $oldCorepackEnvFile = $env:COREPACK_ENV_FILE
    $env:PNPM_STORE_DIR = $pnpmStore
    $env:NPM_CONFIG_STORE_DIR = $pnpmStore
    $env:COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
    $env:COREPACK_ENABLE_STRICT = '0'
    $env:COREPACK_ENV_FILE = '0'
    Initialize-PnpmRunner
    try {
        & (Get-CorepackExe) $pnpmVersion @Arguments 2>&1 | ForEach-Object { Write-Host $_ }
        $exitCode = $LASTEXITCODE
        return $exitCode
    }
    finally {
        $env:PNPM_STORE_DIR = $oldStore
        $env:NPM_CONFIG_STORE_DIR = $oldNpmStore
        $env:COREPACK_ENABLE_DOWNLOAD_PROMPT = $oldPrompt
        $env:COREPACK_ENABLE_STRICT = $oldStrict
        $env:COREPACK_ENV_FILE = $oldCorepackEnvFile
        Pop-Location
        Set-Location $oldPath
    }
}

$doFrontend = ($Target -eq 'All') -or ($Target -eq 'Frontend')
$doBackend  = ($Target -eq 'All') -or ($Target -eq 'Backend')

# ---------------------------------------------------------------------------
# 1. Load .env.deploy.madlearn
# ---------------------------------------------------------------------------
Write-Step 1 7 "Loading .env.deploy.madlearn"

$envFile = Join-Path $repoRoot '.env.deploy.madlearn'
if (-not (Test-Path $envFile)) {
    throw ".env.deploy.madlearn not found in $repoRoot. Copy .env.deploy.madlearn.example and fill in values."
}

$cfg = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 0) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    if ($v.Length -ge 2 -and (
            ($v.StartsWith('"') -and $v.EndsWith('"')) -or
            ($v.StartsWith("'") -and $v.EndsWith("'")))) {
        $v = $v.Substring(1, $v.Length - 2)
    }
    $cfg[$k] = $v
}

$required = @(
    'API_URL','FE_URL',
    'API_FTP_HOST','API_FTP_USER','API_FTP_PASS','API_FTP_PATH',
    'FE_FTP_HOST','FE_FTP_USER','FE_FTP_PASS','FE_FTP_PATH',
    'ConnectionStrings__Default','Jwt__Secret','Jwt__Issuer','Jwt__Audience',
    'PAYFAST_PASSPHRASE','PAYFAST_MERCHANT_KEY'
)
foreach ($k in $required) {
    if (-not $cfg.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($cfg[$k])) {
        throw "Missing or empty key in .env.deploy.madlearn: $k"
    }
}
if (-not $cfg.ContainsKey('ASPNETCORE_ENVIRONMENT')) { $cfg['ASPNETCORE_ENVIRONMENT'] = 'Production' }
if (-not $cfg.ContainsKey('FTP_TLS'))                { $cfg['FTP_TLS']                = 'explicit' }

# Normalize FTP paths (leading + trailing slash).
function Normalize-Path([string]$p) {
    if (-not $p.StartsWith('/')) { $p = "/$p" }
    if (-not $p.EndsWith('/'))   { $p = "$p/" }
    return $p
}
$cfg['API_FTP_PATH'] = Normalize-Path $cfg['API_FTP_PATH']
$cfg['FE_FTP_PATH']  = Normalize-Path $cfg['FE_FTP_PATH']

# FTP TLS mode: explicit (default Plesk, port 21 + AUTH TLS) | implicit (ftps:// 990) | false (plain).
switch ($cfg['FTP_TLS'].ToLowerInvariant()) {
    'implicit' { $scheme = 'ftps'; $tlsFlag = $null }
    'false'    { $scheme = 'ftp';  $tlsFlag = $null }
    default    { $scheme = 'ftp';  $tlsFlag = '--ssl-reqd' }
}

Write-Ok "Config loaded. api=$($cfg.API_URL)  fe=$($cfg.FE_URL)  tls=$($cfg.FTP_TLS)"

# ---------------------------------------------------------------------------
# 2. Ensure curl.exe is available
# ---------------------------------------------------------------------------
Write-Step 2 7 "Checking tools (curl.exe)"
$curlCmd = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $curlCmd) {
    throw "curl.exe not found on PATH (ships in C:\Windows\System32 on Windows 10+)."
}
$curl = $curlCmd.Source
Write-Ok "curl.exe at $curl"

# ---------------------------------------------------------------------------
# 3. Frontend build (Angular prod, env.ts rewritten then restored)
# ---------------------------------------------------------------------------
$frontendDir   = Join-Path $repoRoot 'apps\web'
$envTsPath     = Join-Path $frontendDir 'src\environments\environment.ts'
$frontendBuild = Join-Path $frontendDir 'dist\lms-frontend\browser'
$stagingRoot   = Join-Path $env:TEMP 'madlearn-deploy'
$feStaging     = Join-Path $stagingRoot 'fe'

if ($doFrontend -and -not $SkipBuild) {
    Write-Step 3 7 "Building frontend (prod). apiUrl = $($cfg.API_URL)/api"

    if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
        Write-Info "Installing frontend deps..."
        $code = Invoke-Pnpm -WorkingDirectory $repoRoot -Arguments @('install', '--filter', 'lms-frontend', '--frozen-lockfile', '--prefer-offline', '--ignore-scripts', '--reporter', 'append-only', '--virtual-store-dir', $pnpmVirtualStore)
        if ($code -ne 0) { throw "frontend pnpm install failed (exit $code)" }
    }

    $envBackup = Get-Content $envTsPath -Raw
    try {
        $prodEnvTs = @"
export const environment = {
  production: true,
  apiUrl: '$($cfg.API_URL)/api'
};
"@
        Set-Utf8NoBomText -Path $envTsPath -Value $prodEnvTs

        $code = Invoke-Pnpm -WorkingDirectory $frontendDir -Arguments @('exec', 'ng', 'build', '--configuration', 'production')
        if ($code -ne 0) { throw "Frontend build failed (exit $code)" }
    } finally {
        Set-Utf8NoBomText -Path $envTsPath -Value $envBackup
    }

    if (-not (Test-Path (Join-Path $frontendBuild 'index.html'))) {
        $alt = Join-Path $frontendDir 'dist\lms-frontend'
        if (Test-Path (Join-Path $alt 'index.html')) { $frontendBuild = $alt }
        else { throw "Frontend build output not found at $frontendBuild" }
    }

    # Stage: build output + IIS SPA-fallback web.config.
    if (Test-Path $feStaging) { Remove-Item $feStaging -Recurse -Force }
    New-Item -ItemType Directory -Path $feStaging | Out-Null
    Copy-Item "$frontendBuild\*" $feStaging -Recurse -Force
    Copy-Item (Join-Path $repoRoot 'deploy\madlearn\fe-web.config') (Join-Path $feStaging 'web.config') -Force

    Write-Ok "Frontend staged at $feStaging"
} elseif ($doFrontend) {
    Write-Step 3 7 "Frontend build skipped (-SkipBuild)"
    if (-not (Test-Path (Join-Path $feStaging 'index.html'))) {
        throw "No existing FE staging at $feStaging. Drop -SkipBuild on first run."
    }
}

# ---------------------------------------------------------------------------
# 4. Backend publish (win-x64 framework-dependent for IIS + ANCM)
# ---------------------------------------------------------------------------
$apiStaging = Join-Path $stagingRoot 'api'

if ($doBackend -and -not $SkipBuild) {
    Write-Step 4 7 "Publishing backend (win-x64, framework-dependent for IIS ANCM)"

    if (Test-Path $apiStaging) { Remove-Item $apiStaging -Recurse -Force }
    New-Item -ItemType Directory -Path $apiStaging | Out-Null

    Push-Location (Join-Path $repoRoot 'apps\api')
    Invoke-Native {
        dotnet publish LMS.Api/LMS.Api.csproj `
            --configuration Release `
            --runtime win-x64 `
            --self-contained false `
            --output $apiStaging `
            --nologo `
            /p:PublishSingleFile=false `
            /p:UseAppHost=false
    }
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { throw "dotnet publish failed (exit $code)" }

    # IIS hosting config (ANCM InProcess + ASPNETCORE_ENVIRONMENT env var).
    Copy-Item (Join-Path $repoRoot 'deploy\madlearn\web.config') (Join-Path $apiStaging 'web.config') -Force

    # Inject runtime secrets into the staged appsettings.json. The tracked
    # appsettings.json keeps these fields blank so secrets don't enter git;
    # the live deployment gets the real values from .env.deploy.madlearn here.
    # Mapping:
    #   PAYFAST_PASSPHRASE   -> Payfast.Passphrase   (-> Payfast:Passphrase)
    #   PAYFAST_MERCHANT_KEY -> Payfast.MerchantKey  (-> Payfast:MerchantKey)
    $stagedAppsettings = Join-Path $apiStaging 'appsettings.json'
    if (Test-Path $stagedAppsettings) {
        $appsettings = Get-Content $stagedAppsettings -Raw | ConvertFrom-Json
        if (-not $appsettings.PSObject.Properties.Match('Payfast').Count) {
            $appsettings | Add-Member -NotePropertyName 'Payfast' -NotePropertyValue ([pscustomobject]@{})
        }
        if ($cfg.ContainsKey('PAYFAST_PASSPHRASE')) {
            $appsettings.Payfast.Passphrase = $cfg['PAYFAST_PASSPHRASE']
        }
        if ($cfg.ContainsKey('PAYFAST_MERCHANT_KEY')) {
            $appsettings.Payfast.MerchantKey = $cfg['PAYFAST_MERCHANT_KEY']
        }
        $appsettings | ConvertTo-Json -Depth 10 | Set-Content -Path $stagedAppsettings -Encoding UTF8
        Write-Info "  Injected PayFast secrets into staged appsettings.json"
    }

    # Sanitize .env: strip FTP_* deploy-only keys, keep app config. Plesk on
    # Windows does NOT run start.sh; the .env is just for operator inspection
    # on disk - the actual runtime config lives in appsettings.json (which
    # has the runtime secrets injected just above) plus the
    # ASPNETCORE_ENVIRONMENT env var set by web.config.
    #
    # If you want .env values to influence the running process directly, the
    # App_Data path and DotNetEnv NuGet would let us load them. Not wired in
    # yet - for now we mutate appsettings.json on the wire instead.
    $serverEnv = Get-Content $envFile | Where-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return $true }
        $key = ($line -split '=', 2)[0].Trim()
        return -not (
            $key -like 'API_FTP_*' -or
            $key -like 'FE_FTP_*' -or
            $key -eq 'FTP_TLS'
        )
    }
    $serverEnv | Set-Content -Path (Join-Path $apiStaging '.env') -Encoding UTF8

    # IIS expects logs/ to exist for stdoutLogFile.
    New-Item -ItemType Directory -Path (Join-Path $apiStaging 'logs') -Force | Out-Null

    Write-Ok "Backend staged at $apiStaging"
} elseif ($doBackend) {
    Write-Step 4 7 "Backend publish skipped (-SkipBuild)"
    if (-not (Test-Path (Join-Path $apiStaging 'LMS.Api.dll'))) {
        throw "No existing API staging at $apiStaging. Drop -SkipBuild on first run."
    }
}

# ---------------------------------------------------------------------------
# FTP helpers
# ---------------------------------------------------------------------------
function Push-OneFile {
    param([string]$LocalFile, [string]$RemoteUrl, [string]$User, [string]$Pass)
    $args = @('--silent', '--show-error', '--fail', '--ftp-create-dirs',
        '--user', "${User}:${Pass}", '--upload-file', $LocalFile)
    if ($tlsFlag) { $args += $tlsFlag }
    $args += '--insecure'   # Plesk self-signed FTPS cert
    $args += $RemoteUrl
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $curl @args 2>&1 | ForEach-Object { Write-Info "  $_" } }
    finally { $ErrorActionPreference = $prev }
    return ($LASTEXITCODE -eq 0)
}

function Remove-OneFile {
    param([string]$RemoteHost, [string]$RemotePath, [string]$FileName, [string]$User, [string]$Pass)
    $absolute = ($RemotePath.TrimEnd('/')) + '/' + $FileName
    $hostUrl  = "${scheme}://${RemoteHost}/"
    foreach ($target in @($absolute, $FileName)) {
        for ($attempt = 1; $attempt -le 3; $attempt++) {
            $cargs = @('--silent', '--show-error', '--user', "${User}:${Pass}",
                '--ftp-method', 'nocwd',
                '-Q', "DELE $target", $hostUrl, '-o', 'NUL')
            if ($tlsFlag) { $cargs += $tlsFlag }
            $cargs += '--insecure'
            $prev = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                $out = & $curl @cargs 2>&1 | Out-String
                $code = $LASTEXITCODE
                if ($code -eq 0) { Write-Info "    deleted '$target' (try $attempt)"; return }
                if ($code -eq 21 -and ($out -match '\b550\b|file unavailable|cannot find|no such')) {
                    Write-Info "    '$target' already absent"; return
                }
            } finally { $ErrorActionPreference = $prev }
            Start-Sleep -Milliseconds 800
        }
    }
    Write-Warn2 "could not delete '$FileName' from the API path after retries"
}

function Get-RemoteFileInfo {
    param([string]$RemoteUrl, [string]$User, [string]$Pass)
    $args = @('--silent', '--show-error', '--head', '--user', "${User}:${Pass}")
    if ($tlsFlag) { $args += $tlsFlag }
    $args += '--insecure'
    $args += $RemoteUrl

    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $curl @args 2>&1
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }

    if ($code -ne 0) {
        return [pscustomobject]@{ Exists = $false; Size = $null; LastModifiedUtc = $null }
    }

    $size = $null
    $lastModifiedUtc = $null
    foreach ($line in $output) {
        $text = [string]$line
        if ($text -match '^\s*Content-Length\s*:\s*(\d+)\s*$') {
            $size = [int64]$matches[1]
        } elseif ($text -match '^\s*Last-Modified\s*:\s*(.+?)\s*$') {
            try {
                $lastModifiedUtc = ([DateTimeOffset]::Parse($matches[1], [Globalization.CultureInfo]::InvariantCulture)).UtcDateTime
            } catch {
                $lastModifiedUtc = $null
            }
        }
    }

    return [pscustomobject]@{ Exists = $true; Size = $size; LastModifiedUtc = $lastModifiedUtc }
}

function Get-UploadDecision {
    param([System.IO.FileInfo]$LocalFile, [string]$RemoteUrl, [string]$User, [string]$Pass)
    $remote = Get-RemoteFileInfo -RemoteUrl $RemoteUrl -User $User -Pass $Pass
    if (-not $remote.Exists) { return [pscustomobject]@{ Upload = $true; Reason = 'missing remote file' } }
    if ($null -eq $remote.Size) { return [pscustomobject]@{ Upload = $true; Reason = 'remote size unavailable' } }
    if ([int64]$LocalFile.Length -ne [int64]$remote.Size) {
        return [pscustomobject]@{ Upload = $true; Reason = "size changed local=$($LocalFile.Length) remote=$($remote.Size)" }
    }
    if ($null -eq $remote.LastModifiedUtc) { return [pscustomobject]@{ Upload = $true; Reason = 'remote timestamp unavailable' } }
    if ($LocalFile.LastWriteTimeUtc -gt $remote.LastModifiedUtc.AddSeconds(2)) {
        return [pscustomobject]@{ Upload = $true; Reason = "newer local=$($LocalFile.LastWriteTimeUtc.ToString('u')) remote=$($remote.LastModifiedUtc.ToString('u'))" }
    }
    return [pscustomobject]@{ Upload = $false; Reason = 'same size and not newer' }
}

function Upload-Tree {
    param(
        [string]$LocalRoot, [string]$RemoteHost, [string]$RemotePath,
        [string]$User, [string]$Pass, [string]$Label
    )
    $files = Get-ChildItem -Path $LocalRoot -Recurse -File
    $total = $files.Count
    Write-Info "checking $total $Label files -> ${scheme}://${RemoteHost}${RemotePath}"

    $i = 0; $uploaded = 0; $skipped = 0; $failed = @()
    foreach ($file in $files) {
        $i++
        $relPath = $file.FullName.Substring($LocalRoot.Length).TrimStart('\').Replace('\','/')
        $remoteUrl = "${scheme}://${RemoteHost}${RemotePath}${relPath}"
        $decision = Get-UploadDecision -LocalFile $file -RemoteUrl $remoteUrl -User $User -Pass $Pass

        if (-not $decision.Upload) {
            $skipped++
            if ($i % 25 -eq 0 -or $i -eq $total) { Write-Info "  checked $i/$total uploaded=$uploaded skipped=$skipped" }
            continue
        }

        if ($PSCmdlet.ShouldProcess($remoteUrl, 'PUT')) {
            $cargs = @('--silent', '--show-error', '--fail', '--ftp-create-dirs',
                '--user', "${User}:${Pass}", '--upload-file', $file.FullName)
            if ($tlsFlag) { $cargs += $tlsFlag }
            $cargs += '--insecure'
            $cargs += $remoteUrl
            $prev = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try { & $curl @cargs 2>&1 | Out-Null }
            finally { $ErrorActionPreference = $prev }
            if ($LASTEXITCODE -ne 0) {
                $failed += $relPath
                Write-Warn2 "X $relPath"
            } else {
                $uploaded++
            }
        }
        if ($i % 25 -eq 0 -or $i -eq $total) { Write-Info "  checked $i/$total uploaded=$uploaded skipped=$skipped" }
    }

    if ($failed.Count -gt 0) {
        Write-Warn2 "$($failed.Count) $Label file(s) failed:"
        $failed | ForEach-Object { Write-Warn2 "  - $_" }
        return $false
    }
    return $true
}

# ---------------------------------------------------------------------------
# 5. Upload frontend
# ---------------------------------------------------------------------------
if ($doFrontend) {
    Write-Step 5 7 "Uploading frontend to $($cfg.FE_FTP_HOST):$($cfg.FE_FTP_PATH)"
    $ok = Upload-Tree -LocalRoot $feStaging -RemoteHost $cfg.FE_FTP_HOST `
        -RemotePath $cfg.FE_FTP_PATH -User $cfg.FE_FTP_USER -Pass $cfg.FE_FTP_PASS -Label 'FE'
    if (-not $ok) { throw "frontend upload had failures" }
    Write-Ok "Frontend uploaded"
} else {
    Write-Step 5 7 "Frontend upload skipped (Target=$Target)"
}

# ---------------------------------------------------------------------------
# 6. Upload backend (app_offline.htm dance for IIS DLL locks)
# ---------------------------------------------------------------------------
if ($doBackend) {
    Write-Step 6 7 "Uploading backend to $($cfg.API_FTP_HOST):$($cfg.API_FTP_PATH)"

    # AspNetCoreModuleV2 watches for app_offline.htm in the site root: presence
    # stops the app and releases all file locks (otherwise w3wp.exe holds the
    # DLLs and the next FTP put hits 550 "file in use").
    $offlinePath = Join-Path $env:TEMP "madlearn_app_offline.htm"
    @"
<!DOCTYPE html><html><head><title>Deploying...</title></head>
<body style="font-family:sans-serif;color:#444;padding:2rem;">
<h1>madLearn API is updating</h1>
<p>The API is briefly offline while a new build deploys. Refresh in a minute.</p>
</body></html>
"@ | Set-Content -Path $offlinePath -Encoding UTF8

    Write-Info "taking API offline (app_offline.htm) so IIS releases DLL locks"
    $null = Push-OneFile -LocalFile $offlinePath `
        -RemoteUrl "${scheme}://$($cfg.API_FTP_HOST)$($cfg.API_FTP_PATH)app_offline.htm" `
        -User $cfg.API_FTP_USER -Pass $cfg.API_FTP_PASS
    Start-Sleep -Seconds 4

    try {
        $ok = Upload-Tree -LocalRoot $apiStaging -RemoteHost $cfg.API_FTP_HOST `
            -RemotePath $cfg.API_FTP_PATH -User $cfg.API_FTP_USER -Pass $cfg.API_FTP_PASS -Label 'API'
        if (-not $ok) { throw "backend upload had failures" }
        Write-Ok "Backend uploaded"
    } finally {
        Write-Info "bringing API back online (deleting app_offline.htm)"
        Remove-OneFile -RemoteHost $cfg.API_FTP_HOST -RemotePath $cfg.API_FTP_PATH `
            -FileName 'app_offline.htm' -User $cfg.API_FTP_USER -Pass $cfg.API_FTP_PASS
        Remove-Item $offlinePath -ErrorAction SilentlyContinue
    }
} else {
    Write-Step 6 7 "Backend upload skipped (Target=$Target)"
}

# ---------------------------------------------------------------------------
# 7. Verify
# ---------------------------------------------------------------------------
Write-Step 7 7 "Verifying public endpoints"

if ($WhatIfPreference) {
    Write-Warn2 "WhatIf set: skipping HTTP verification."
} else {
    if ($doBackend) {
        Write-Info "polling API for up to 60s (IIS warm-up + EF Core seed take a moment)"
        $online = $false
        for ($i = 1; $i -le 12; $i++) {
            $code = 0
            try {
                $r = Invoke-WebRequest -Uri "$($cfg.API_URL)/api/courses" -Method Head -UseBasicParsing -TimeoutSec 10
                $code = $r.StatusCode
            } catch { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } }
            # 401 = up, [Authorize] gate engaged. 405 = up, HEAD not allowed. Either is a success signal.
            if ($code -in 401, 405) {
                Write-Ok "API at $($cfg.API_URL)/api/courses  [HTTP $code] (try $i)"
                $online = $true; break
            }
            Write-Info "  try $i -> HTTP $code"
            Start-Sleep -Seconds 5
        }
        if (-not $online) {
            Write-Warn2 "API didn't come up within 60s. Check Plesk error log or app pool state."
        }
    }
    if ($doFrontend) {
        $code = 0
        try { $code = (Invoke-WebRequest -Uri $cfg.FE_URL -Method Head -UseBasicParsing -TimeoutSec 15).StatusCode }
        catch { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } }
        if ($code -in 200, 304) { Write-Ok "Frontend at $($cfg.FE_URL)  [HTTP $code]" }
        else { Write-Warn2 "Frontend at $($cfg.FE_URL)  [HTTP $code]" }
    }
}

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
Write-Host "  Frontend : $($cfg.FE_URL)"  -ForegroundColor Green
Write-Host "  API      : $($cfg.API_URL)/api"  -ForegroundColor Green
