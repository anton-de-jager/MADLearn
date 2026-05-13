<#
.SYNOPSIS
  madTraining production deploy to DreamHost CloudCompute (PM2 + Apache reverse-proxy).

.DESCRIPTION
  Builds the Angular frontend with the production API URL baked in, publishes the
  ASP.NET Core 8 backend (framework-dependent, linux-x64), ships a tarball over
  SFTP to the DreamCompute instance, then reloads the API process under PM2 over
  SSH. The Apache vhost in front of the API subdomain reverse-proxies all
  requests to the PM2 port via an .htaccess rule (mod_proxy / [P] flag) -
  Passenger is intentionally NOT used because it is broken on this hosting.

  -------------------------------------------------------------------------
  Server layout (DreamCompute 208.113.128.35, user `madproducts`)
  -------------------------------------------------------------------------
    SPA            /home/madproducts/madtraining.madleads.ai/        (Apache, TLS)
    API web root   /home/madproducts/madtrainingapi.madleads.ai/     (.htaccess [P])
                                            |
                                            v
    PM2 app dir    /home/madproducts/madtraining-api/                (dotnet runtime)
                   * pm2 process name: madtraining-api
                   * upstream port   : 3003 (3000-3002 already used
                                              by ms-api / ml-api / mh-api)

  -------------------------------------------------------------------------
  One-time prerequisites (do these once, BEFORE the first deploy)
  -------------------------------------------------------------------------
  1. DNS (already done per the task brief)
       madtraining.madleads.ai     A 208.113.128.35
       madtrainingapi.madleads.ai  A 208.113.128.35

  2. DreamHost panel -> Domains -> Manage Domains -> Add Hosting
       madtraining.madleads.ai      Fully Hosted (static SPA host).   Do NOT tick Passenger.
       madtrainingapi.madleads.ai   Fully Hosted (API reverse-proxy). Do NOT tick Passenger.
     The panel creates /home/madproducts/<domain>/ web roots and an Apache vhost.
     Apache must have mod_proxy + mod_proxy_http + mod_rewrite + mod_headers
     enabled (default on this DreamCompute image -- already in use by the
     api.madleads.ai reverse-proxy .htaccess pattern).

  3. Let's Encrypt certificates (one per subdomain, in order):
       a) Confirm DNS for both records has propagated:  dig +short <subdomain>
       b) DreamHost panel -> Domains -> Manage Domains -> Secure Hosting
            - Click "Add" next to madtraining.madleads.ai     -> Free Let's Encrypt cert
            - Click "Add" next to madtrainingapi.madleads.ai  -> Free Let's Encrypt cert
          Each issuance takes ~1-2 min; the panel rewrites the Apache vhost to
          add SSLCertificateFile / SSLCertificateKeyFile and reloads Apache.
       c) Verify TLS:  curl -I https://madtraining.madleads.ai          (expect 200/301)
                       curl -I https://madtrainingapi.madleads.ai       (expect 200/502
                                                                         until first deploy)
     If a cert issuance fails, the panel surfaces the certbot error. Most
     common cause: the A record hasn't propagated yet -- wait 10 min and retry.

  4. .NET 8 ASP.NET Core runtime on the box (one-off, no sudo needed):
       SSH in as madproducts and run:
         curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
         bash /tmp/dotnet-install.sh --channel 8.0 --runtime aspnetcore --install-dir ~/.dotnet
         echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
         echo 'export PATH=$DOTNET_ROOT:$PATH'   >> ~/.bashrc
       The PM2 process invokes `dotnet` from $HOME/.dotnet via `bash -lc` so the
       login profile resolves it at start time.

  5. .env.deploy at the repo root with the values listed in .env.deploy.example.
       This file is gitignored.

.PARAMETER Target
  'All' (default), 'Frontend', or 'Backend'. Matches the convention used by
  the multisciple deploy script in the sibling repo.

.PARAMETER SkipBuild
  Re-upload the previous build without rebuilding. Useful when retrying a
  failed upload without waiting for ng build / dotnet publish to churn again.

.PARAMETER DryRun
  Build + stage everything locally but skip every SFTP/SSH operation.

.EXAMPLE
  .\deploy.ps1                       # build + deploy both
  .\deploy.ps1 -Target Frontend      # SPA only
  .\deploy.ps1 -Target Backend       # API only
  .\deploy.ps1 -SkipBuild            # retry upload, no rebuild
  .\deploy.ps1 -DryRun               # validate config + stage, no remote ops
#>

[CmdletBinding()]
param(
    [ValidateSet('All', 'Frontend', 'Backend')]
    [string]$Target = 'All',
    [switch]$SkipBuild,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'
$scriptRoot            = $PSScriptRoot
Set-Location $scriptRoot

function Write-Step  { param($n, $total, $msg) Write-Host ""; Write-Host "[$n/$total] $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg"   -ForegroundColor Green }
function Write-Warn2 { param($msg) Write-Host "  [!]  $msg"   -ForegroundColor Yellow }
function Write-Info  { param($msg) Write-Host "  ...  $msg"   -ForegroundColor Gray }

# Run a native command (npm, npx, dotnet, tar, ...) without PowerShell wrapping
# stderr lines as NativeCommandError ErrorRecords. Read $LASTEXITCODE after.
# (Don't return a value - the function would otherwise capture stdout into it.)
function Invoke-Native {
    param([Parameter(Mandatory)][scriptblock]$Block)
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Block } finally { $ErrorActionPreference = $old }
}

$doFrontend = ($Target -eq 'All') -or ($Target -eq 'Frontend')
$doBackend  = ($Target -eq 'All') -or ($Target -eq 'Backend')

# ---------------------------------------------------------------------------
# 1. Load .env.deploy
# ---------------------------------------------------------------------------
Write-Step 1 7 "Loading .env.deploy"

$envFile = Join-Path $scriptRoot '.env.deploy'
if (-not (Test-Path $envFile)) {
    throw ".env.deploy not found in $scriptRoot. Copy .env.deploy.example and fill in values."
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

# Required keys. Same SSH user owns both web roots and the PM2 app dir.
$required = @(
    'FRONTEND_PUBLIC_URL','API_PUBLIC_URL',
    'SFTP_HOST','SFTP_USER','SFTP_PASS',
    'FRONTEND_REMOTE_PATH','API_REMOTE_PATH','API_WEB_ROOT',
    'DB_CONNECTION_STRING','JWT_KEY'
)
foreach ($k in $required) {
    if (-not $cfg.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($cfg[$k])) {
        throw "Missing or empty key in .env.deploy: $k"
    }
}
if (-not $cfg.ContainsKey('SFTP_PORT'))         { $cfg['SFTP_PORT']         = '22' }
if (-not $cfg.ContainsKey('API_PORT'))          { $cfg['API_PORT']          = '3003' }
if (-not $cfg.ContainsKey('PM2_PROCESS_NAME'))  { $cfg['PM2_PROCESS_NAME']  = 'madtraining-api' }
if (-not $cfg.ContainsKey('JWT_ISSUER'))        { $cfg['JWT_ISSUER']        = 'LmsApi' }
if (-not $cfg.ContainsKey('JWT_AUDIENCE'))      { $cfg['JWT_AUDIENCE']      = 'LmsClient' }
if (-not $cfg.ContainsKey('CORS_ORIGINS'))      { $cfg['CORS_ORIGINS']      = $cfg.FRONTEND_PUBLIC_URL }
if (-not $cfg.ContainsKey('DOTNET_PATH'))       { $cfg['DOTNET_PATH']       = '$HOME/.dotnet/dotnet' }

Write-Ok "Config loaded. frontend=$($cfg.FRONTEND_PUBLIC_URL)  api=$($cfg.API_PUBLIC_URL)  port=$($cfg.API_PORT)"

# ---------------------------------------------------------------------------
# 2. Ensure Posh-SSH
# ---------------------------------------------------------------------------
Write-Step 2 7 "Checking PowerShell modules"

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Info "Posh-SSH not installed. Installing for current user..."
    try {
        Install-Module Posh-SSH -Scope CurrentUser -Force -AllowClobber -ErrorAction Stop
    } catch {
        throw "Failed to install Posh-SSH. Run as Administrator: Install-Module Posh-SSH -Scope CurrentUser -Force"
    }
}
Import-Module Posh-SSH -ErrorAction Stop
Write-Ok "Posh-SSH ready"

# ---------------------------------------------------------------------------
# 3. Frontend build (Angular with prod API URL baked in)
# ---------------------------------------------------------------------------
# angular.json has no fileReplacements, so we mutate environment.ts directly
# pre-build and restore it after the build (success OR failure). This mirrors
# the multisciple deploy convention.
$frontendDir   = Join-Path $scriptRoot 'frontend'
$envTsPath     = Join-Path $frontendDir 'src\environments\environment.ts'
$frontendBuild = Join-Path $frontendDir 'dist\lms-frontend\browser'

if ($doFrontend -and -not $SkipBuild) {
    Write-Step 3 7 "Building frontend (prod). apiUrl = $($cfg.API_PUBLIC_URL)/api"

    if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
        Write-Info "Installing frontend deps..."
        Push-Location $frontendDir
        Invoke-Native { npm install --legacy-peer-deps --no-audit --no-fund }
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { throw "frontend npm install failed (exit $code)" }
    }

    $envBackup = Get-Content $envTsPath -Raw
    try {
        $prodEnvTs = @"
export const environment = {
  production: true,
  apiUrl: '$($cfg.API_PUBLIC_URL)/api'
};
"@
        Set-Content -Path $envTsPath -Value $prodEnvTs -Encoding UTF8 -NoNewline

        Push-Location $frontendDir
        Invoke-Native { npx ng build --configuration production }
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { throw "Frontend build failed (exit $code)" }
    } finally {
        Set-Content -Path $envTsPath -Value $envBackup -Encoding UTF8 -NoNewline
    }

    if (-not (Test-Path (Join-Path $frontendBuild 'index.html'))) {
        $alt = Join-Path $frontendDir 'dist\lms-frontend'
        if (Test-Path (Join-Path $alt 'index.html')) { $frontendBuild = $alt }
        else { throw "Frontend build output not found at $frontendBuild" }
    }

    # SPA-routing .htaccess so /dashboard etc. don't 404 on refresh.
    # Written as ASCII without BOM - Apache rejects BOMs in .htaccess.
    $spaHtaccess = @'
RewriteEngine On
RewriteBase /

# Don't rewrite real files or directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Everything else falls back to index.html (SPA routing)
RewriteRule ^ /index.html [L]
'@
    [System.IO.File]::WriteAllText((Join-Path $frontendBuild '.htaccess'), $spaHtaccess, [System.Text.Encoding]::ASCII)

    Write-Ok "Frontend built at $frontendBuild"
} elseif ($doFrontend) {
    Write-Step 3 7 "Frontend build skipped (-SkipBuild)"
    if (-not (Test-Path (Join-Path $frontendBuild 'index.html'))) {
        throw "No existing build at $frontendBuild. Drop -SkipBuild on first run."
    }
}

# ---------------------------------------------------------------------------
# 4. Backend publish + stage PM2 bundle
# ---------------------------------------------------------------------------
$backendStage   = Join-Path $scriptRoot '.deploy\backend'
$backendTarball = Join-Path $scriptRoot '.deploy\backend-deploy.tar.gz'
$apiWebStage    = Join-Path $scriptRoot '.deploy\api-webroot'

if ($doBackend -and -not $SkipBuild) {
    Write-Step 4 7 "Publishing backend (framework-dependent, linux-x64)"

    # `--self-contained false` produces a portable bundle that depends on the
    # aspnetcore-runtime installed on the box. `/p:UseAppHost=false` skips the
    # platform-specific launcher; we invoke `dotnet LMS.Api.dll` directly under
    # PM2, which makes the bundle truly OS-agnostic on the file level.
    $publishOut = Join-Path $scriptRoot '.deploy\publish'
    if (Test-Path $publishOut) { Remove-Item $publishOut -Recurse -Force }

    Push-Location 'backend'
    Invoke-Native {
        dotnet publish LMS.Api/LMS.Api.csproj `
            -c Release `
            -r linux-x64 `
            --self-contained false `
            /p:UseAppHost=false `
            -o $publishOut
    }
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { throw "dotnet publish failed (exit $code)" }

    if (Test-Path $backendStage) { Remove-Item $backendStage -Recurse -Force }
    New-Item -ItemType Directory -Path $backendStage | Out-Null
    Copy-Item "$publishOut\*" $backendStage -Recurse -Force

    # Production .env. start.sh reads this with a manual key/value loader so
    # that values containing spaces or semicolons (the SQL Server connection
    # string has both: `User Id=...;Password=...;`) don't get reinterpreted by
    # bash as commands. The loader strips CR (in case Windows writes CRLF) and
    # surrounding quotes. We still wrap values in double-quotes here so the
    # file is also valid shell syntax for `. ./.env` if anyone uses it that way.
    #
    # Connection string + JWT secret + CORS_ORIGINS are the three values that
    # must differ from the bundled appsettings.json.
    function Escape-EnvValue {
        param([string]$v)
        # Backslash-escape inner double quotes; everything else is fine inside
        # the literal-quote loader.
        return $v.Replace('"','\"')
    }
    $envLines = @(
        'ASPNETCORE_ENVIRONMENT="Production"',
        ('ASPNETCORE_URLS="http://127.0.0.1:' + $cfg.API_PORT + '"'),
        'DOTNET_RUNNING_IN_CONTAINER="false"',
        '',
        ('ConnectionStrings__DefaultConnection="' + (Escape-EnvValue $cfg.DB_CONNECTION_STRING) + '"'),
        '',
        ('Jwt__Key="'      + (Escape-EnvValue $cfg.JWT_KEY)      + '"'),
        ('Jwt__Issuer="'   + (Escape-EnvValue $cfg.JWT_ISSUER)   + '"'),
        ('Jwt__Audience="' + (Escape-EnvValue $cfg.JWT_AUDIENCE) + '"'),
        '',
        ('CORS_ORIGINS="'  + (Escape-EnvValue $cfg.CORS_ORIGINS) + '"')
    )
    # LF-only, no BOM. CRLF would survive the manual parser (it strips CR) but
    # LF keeps the file portable to any other reader.
    $envText = ($envLines -join "`n") + "`n"
    [System.IO.File]::WriteAllText("$backendStage\.env", $envText, (New-Object System.Text.UTF8Encoding $false))

    # OpenSSL override. Ubuntu 24.04 ships OpenSSL 3.0 with SECLEVEL=2 by default,
    # which refuses TLS 1.0/1.1 and weak DH params. The remote MSSQL Server at
    # 41.185.13.202 negotiates a cipher that OpenSSL rejects -> "SSL Provider,
    # error: 31 - Encryption(ssl/tls) handshake failed". Microsoft.Data.SqlClient
    # encrypts the login packet even with Encrypt=False in the connection string,
    # so we can't avoid the handshake. Lowering SECLEVEL to 0 + MinProtocol to
    # TLSv1.0 ONLY for the .NET process (via OPENSSL_CONF) is the standard fix.
    # System-wide config is unchanged.
    $opensslCnf = @'
openssl_conf = openssl_init

[openssl_init]
ssl_conf = ssl_sect

[ssl_sect]
system_default = system_default_sect

[system_default_sect]
MinProtocol = TLSv1.0
CipherString = DEFAULT@SECLEVEL=0
'@
    [System.IO.File]::WriteAllText("$backendStage\openssl.cnf", ($opensslCnf -replace "`r`n","`n"), (New-Object System.Text.UTF8Encoding $false))

    # PM2 entry script. PM2 launches this via `pm2 start ... --interpreter bash`
    # so $HOME/.dotnet is on PATH via the login profile. Uses a manual key/value
    # loader (NOT `. ./.env`) so values containing spaces or semicolons survive
    # unmolested - sourcing the file lets bash reinterpret e.g. `User Id=foo` as
    # a command. The parser strips CR (in case the upload picked up CRLF) and
    # one matched pair of surrounding double-quotes.
    $pm2Entry = @'
#!/usr/bin/env bash
# PM2 entry for madtraining-api. Loads .env safely then exec's dotnet LMS.Api.dll.
set -e
cd "$(dirname "$0")"
# Per-process OpenSSL override so Microsoft.Data.SqlClient can complete the
# pre-login handshake against the SECLEVEL=0-required MSSQL server.
export OPENSSL_CONF="$(pwd)/openssl.cnf"
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ''|\#*) continue ;; esac
    key="${line%%=*}"
    val="${line#*=}"
    if [ "${val:0:1}" = '"' ] && [ "${val: -1}" = '"' ]; then
      val="${val:1:${#val}-2}"
      val="${val//\\\"/\"}"
    fi
    export "$key=$val"
  done < .env
fi
exec "${DOTNET_ROOT:-$HOME/.dotnet}/dotnet" LMS.Api.dll
'@
    # LF-only, no BOM - bash on the box will choke on CRLF (`\r` becomes part
    # of the last token on each line, breaking case-matches like `\#*`).
    $pm2EntryLf = $pm2Entry -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText("$backendStage\start.sh", $pm2EntryLf, (New-Object System.Text.UTF8Encoding $false))

    # Bundle. One SFTP put is dramatically faster than walking hundreds of
    # publish files; server-side `tar -xzf` reassembles in 1-2 seconds.
    if (Test-Path $backendTarball) { Remove-Item $backendTarball -Force }
    Write-Info "Bundling backend..."
    Invoke-Native { & tar -czf $backendTarball -C $backendStage . }
    if ($LASTEXITCODE -ne 0) { throw "tar bundling failed (exit $LASTEXITCODE)" }
    $sizeMb = [Math]::Round((Get-Item $backendTarball).Length / 1MB, 1)
    Write-Ok "Backend staged + bundled at $backendTarball ($sizeMb MB)"

    # Stage the Apache reverse-proxy .htaccess for the API web root.
    # mirrors the api.madleads.ai pattern: [P] flag hands the request to
    # mod_proxy_http which dials into PM2 on 127.0.0.1:<API_PORT>.
    if (Test-Path $apiWebStage) { Remove-Item $apiWebStage -Recurse -Force }
    New-Item -ItemType Directory -Path $apiWebStage | Out-Null

    # NOTE on directive contexts: ProxyPassReverse, ProxyPassReverseCookieDomain,
    # and ProxyPreserveHost are NOT permitted in .htaccess (Apache returns 500
    # with "X not allowed here" in the error log). They live in the vhost
    # itself (see setup notes in DEPLOY.md). The .htaccess only does the [P]
    # rewrite, which IS allowed under AllowOverride FileInfo.
    $apiHtaccess = @"
# madtrainingapi.madleads.ai reverse-proxy to PM2 on 127.0.0.1:$($cfg.API_PORT)
# Managed by deploy.ps1 - regenerated on every backend deploy.
# DO NOT enable Passenger on this vhost; it is broken on this hosting.

DirectoryIndex disabled
Options -Indexes

RewriteEngine On

# Forward original Host + scheme so ASP.NET URL helpers / redirects are correct.
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"

# Proxy everything to PM2. The [P] flag requires mod_proxy + mod_proxy_http.
RewriteRule ^(.*)`$ http://127.0.0.1:$($cfg.API_PORT)/`$1 [P,QSA,L]

Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
"@
    [System.IO.File]::WriteAllText((Join-Path $apiWebStage '.htaccess'), $apiHtaccess, [System.Text.Encoding]::ASCII)
    Write-Ok "API reverse-proxy .htaccess staged (port $($cfg.API_PORT))"
} elseif ($doBackend) {
    Write-Step 4 7 "Backend build skipped (-SkipBuild)"
    if (-not (Test-Path "$backendStage\LMS.Api.dll")) {
        throw "No existing staged backend at $backendStage. Drop -SkipBuild on first run."
    }
}

# ---------------------------------------------------------------------------
# SFTP / SSH helpers
# ---------------------------------------------------------------------------
function New-SftpSessionFor {
    param([string]$Address, [int]$Port, [string]$User, [string]$Pass)
    $secure = ConvertTo-SecureString $Pass -AsPlainText -Force
    $cred   = New-Object System.Management.Automation.PSCredential($User, $secure)
    return New-SFTPSession -ComputerName $Address -Port $Port -Credential $cred -AcceptKey -ErrorAction Stop
}
function New-SshSessionFor {
    param([string]$Address, [int]$Port, [string]$User, [string]$Pass)
    $secure = ConvertTo-SecureString $Pass -AsPlainText -Force
    $cred   = New-Object System.Management.Automation.PSCredential($User, $secure)
    return New-SSHSession -ComputerName $Address -Port $Port -Credential $cred -AcceptKey -ErrorAction Stop
}
function Confirm-RemoteDir {
    param($SessionId, $Path)
    if (-not (Test-SFTPPath -SessionId $SessionId -Path $Path)) {
        New-SFTPItem -SessionId $SessionId -Path $Path -ItemType Directory | Out-Null
    }
}
function Send-Tree {
    param(
        [Parameter(Mandatory)] $SessionId,
        [Parameter(Mandatory)] [string] $LocalRoot,
        [Parameter(Mandatory)] [string] $RemoteRoot
    )
    $LocalRoot = (Resolve-Path $LocalRoot).Path
    Confirm-RemoteDir -SessionId $SessionId -Path $RemoteRoot

    $allDirs  = Get-ChildItem -Path $LocalRoot -Recurse -Directory
    $allFiles = Get-ChildItem -Path $LocalRoot -Recurse -File

    foreach ($dir in $allDirs) {
        $rel = $dir.FullName.Substring($LocalRoot.Length).TrimStart('\','/').Replace('\','/')
        Confirm-RemoteDir -SessionId $SessionId -Path "$RemoteRoot/$rel"
    }

    $total = $allFiles.Count
    $i = 0
    foreach ($file in $allFiles) {
        $i++
        $rel       = $file.FullName.Substring($LocalRoot.Length).TrimStart('\','/').Replace('\','/')
        $remoteDir = if ($rel.Contains('/')) {
            "$RemoteRoot/$([System.IO.Path]::GetDirectoryName($rel).Replace('\','/'))"
        } else {
            $RemoteRoot
        }
        Confirm-RemoteDir -SessionId $SessionId -Path $remoteDir
        Set-SFTPItem -SessionId $SessionId -Path $file.FullName -Destination $remoteDir -Force -ErrorAction Stop | Out-Null
        if ($i % 25 -eq 0 -or $i -eq $total) {
            Write-Info "uploaded $i/$total"
        }
    }
}

# ---------------------------------------------------------------------------
# 5. Upload frontend
# ---------------------------------------------------------------------------
if ($doFrontend) {
    Write-Step 5 7 "Uploading frontend to $($cfg.SFTP_HOST):$($cfg.FRONTEND_REMOTE_PATH)"
    if ($DryRun) {
        Write-Warn2 "DryRun set: skipping SFTP upload."
    } else {
        $sftp = New-SftpSessionFor `
            -Address $cfg.SFTP_HOST `
            -Port    ([int]$cfg.SFTP_PORT) `
            -User    $cfg.SFTP_USER `
            -Pass    $cfg.SFTP_PASS
        try {
            Send-Tree -SessionId $sftp.SessionId -LocalRoot $frontendBuild -RemoteRoot $cfg.FRONTEND_REMOTE_PATH
        } finally {
            Remove-SFTPSession -SessionId $sftp.SessionId | Out-Null
        }
        Write-Ok "Frontend uploaded"
    }
} else {
    Write-Step 5 7 "Frontend upload skipped (Target=$Target)"
}

# ---------------------------------------------------------------------------
# 6. Upload backend tarball + API .htaccess, then SSH extract + pm2 reload
# ---------------------------------------------------------------------------
if ($doBackend) {
    Write-Step 6 7 "Uploading backend to $($cfg.SFTP_HOST):$($cfg.API_REMOTE_PATH)"
    if (-not (Test-Path $backendTarball)) { throw "Backend tarball not found at $backendTarball. Re-run without -SkipBuild." }
    if (-not (Test-Path (Join-Path $apiWebStage '.htaccess'))) {
        throw "Reverse-proxy .htaccess not staged at $apiWebStage. Re-run without -SkipBuild."
    }

    if ($DryRun) {
        Write-Warn2 "DryRun set: skipping SFTP upload."
    } else {
        Write-Info "Uploading backend tarball ($([Math]::Round((Get-Item $backendTarball).Length / 1MB, 1)) MB)..."
        $sftp = New-SftpSessionFor `
            -Address $cfg.SFTP_HOST `
            -Port    ([int]$cfg.SFTP_PORT) `
            -User    $cfg.SFTP_USER `
            -Pass    $cfg.SFTP_PASS
        try {
            Confirm-RemoteDir -SessionId $sftp.SessionId -Path $cfg.API_REMOTE_PATH
            Set-SFTPItem -SessionId $sftp.SessionId `
                -Path $backendTarball `
                -Destination $cfg.API_REMOTE_PATH `
                -Force -ErrorAction Stop | Out-Null

            Confirm-RemoteDir -SessionId $sftp.SessionId -Path $cfg.API_WEB_ROOT
            Set-SFTPItem -SessionId $sftp.SessionId `
                -Path (Join-Path $apiWebStage '.htaccess') `
                -Destination $cfg.API_WEB_ROOT `
                -Force -ErrorAction Stop | Out-Null
            Write-Info "Uploaded reverse-proxy .htaccess to $($cfg.API_WEB_ROOT)"
        } finally {
            Remove-SFTPSession -SessionId $sftp.SessionId | Out-Null
        }
        Write-Ok "Backend tarball + API .htaccess uploaded"
    }

    if (-not $DryRun) {
        Write-Info "Opening SSH session to extract + (re)start PM2..."
        $ssh = New-SshSessionFor `
            -Address $cfg.SFTP_HOST `
            -Port    ([int]$cfg.SFTP_PORT) `
            -User    $cfg.SFTP_USER `
            -Pass    $cfg.SFTP_PASS
        try {
            $remote   = $cfg.API_REMOTE_PATH
            $procName = $cfg.PM2_PROCESS_NAME
            $tarName  = 'backend-deploy.tar.gz'

            # Ensure the PM2 app dir exists and has the right ownership BEFORE
            # extracting. mkdir -p is idempotent; chmod 700 on .env keeps the
            # DB password + JWT secret out of any future world-readable accident.
            Write-Info "Preparing remote dirs..."
            $prepCmd = "mkdir -p '$remote' && mkdir -p '$($cfg.API_WEB_ROOT)' && echo PREP_OK"
            $res = Invoke-SSHCommand -SessionId $ssh.SessionId -Command $prepCmd -TimeOut 30
            if ($res.ExitStatus -ne 0) { throw "Remote mkdir failed: $($res.Error -join '`n')" }

            Write-Info "Extracting tarball on the server..."
            $extractCmd = "cd '$remote' && tar -xzf '$tarName' && rm -f '$tarName' && chmod 700 .env 2>/dev/null; chmod +x start.sh && echo EXTRACT_OK"
            $res = Invoke-SSHCommand -SessionId $ssh.SessionId -Command $extractCmd -TimeOut 180
            $res.Output | ForEach-Object { Write-Info $_ }
            if ($res.ExitStatus -ne 0 -or -not (($res.Output -join "`n") -match 'EXTRACT_OK')) {
                throw "Remote tar extract failed (exit $($res.ExitStatus))"
            }
            Write-Ok "Backend extracted"

            # Idempotent PM2 (re)start. `bash -lc` sources the login profile so
            # $HOME/.dotnet (from step 4 of the prereqs) is on PATH for the
            # start.sh shim. `pm2 save` persists the process list so the box
            # survives a reboot (requires one-off `pm2 startup` on the box).
            Write-Info "Reloading PM2 process '$procName' (idempotent)..."
            $pm2Cmd = "bash -lc `"if pm2 describe '$procName' > /dev/null 2>&1; then pm2 reload '$procName' --update-env; else pm2 start '$remote/start.sh' --name '$procName' --cwd '$remote' --time --interpreter bash; fi && pm2 save`""
            $res = Invoke-SSHCommand -SessionId $ssh.SessionId -Command $pm2Cmd -TimeOut 120
            $res.Output | ForEach-Object { Write-Info $_ }
            if ($res.ExitStatus -ne 0) {
                throw "PM2 reload/start failed (exit $($res.ExitStatus)). Check 'pm2 logs $procName' on the server."
            }
            Write-Ok "PM2 process '$procName' is running"
        } finally {
            Remove-SSHSession -SessionId $ssh.SessionId | Out-Null
        }
    }
} else {
    Write-Step 6 7 "Backend upload skipped (Target=$Target)"
}

# ---------------------------------------------------------------------------
# 7. Verify
# ---------------------------------------------------------------------------
Write-Step 7 7 "Verifying public endpoints"

if ($DryRun) {
    Write-Warn2 "DryRun: skipping HTTP verification."
} else {
    $checks = @()
    if ($doFrontend) { $checks += @{ name='Frontend'; url=$cfg.FRONTEND_PUBLIC_URL;                expected=@(200, 304) } }
    # /api/courses is [Authorize] -> 401 without a token is the "API up + DB
    # reachable" success signal. (AuthController has no /me endpoint.)
    if ($doBackend)  { $checks += @{ name='API';      url="$($cfg.API_PUBLIC_URL)/api/courses";    expected=@(401, 405) } }

    if ($doBackend) {
        Write-Info "Waiting 5s for PM2 + Apache to settle..."
        Start-Sleep -Seconds 5
    }

    foreach ($c in $checks) {
        $code = 0
        try {
            $res  = Invoke-WebRequest -Uri $c.url -Method Head -UseBasicParsing -TimeoutSec 20
            $code = $res.StatusCode
        } catch {
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        }
        if ($code -eq 0) {
            Write-Warn2 "$($c.name) at $($c.url) is unreachable"
        } elseif ($c.expected -contains $code) {
            Write-Ok "$($c.name) at $($c.url)  [HTTP $code]"
        } else {
            Write-Warn2 "$($c.name) at $($c.url)  [HTTP $code, expected $($c.expected -join ',')]"
        }
    }
}

Write-Host ""
Write-Host "Deploy finished." -ForegroundColor Green
Write-Host "  Frontend : $($cfg.FRONTEND_PUBLIC_URL)" -ForegroundColor Green
Write-Host "  API      : $($cfg.API_PUBLIC_URL)/api"  -ForegroundColor Green
