<#
.SYNOPSIS
  MADLearn production deploy entrypoint for 1-grid/Plesk IIS.

.DESCRIPTION
  The active MADLearn production target is 41.185.110.61 using the coronbyd_0
  account, IIS, the ASP.NET Core Hosting Bundle, Angular static hosting, and
  MSSQL on WINSVRSQL03.hostserv.co.za,1433.

  This wrapper preserves the historical command name while delegating to the
  current Windows/IIS deployment script.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateSet('All', 'Frontend', 'Backend')]
    [string]$Target = 'All',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
$delegate = Join-Path $scriptRoot 'deploy-madlearn.ps1'

if (-not (Test-Path $delegate)) {
    throw "Active MADLearn deployment script not found: $delegate"
}

& $delegate -Target $Target -SkipBuild:$SkipBuild -WhatIf:$WhatIfPreference
