# Deploying MADLearn to 1-grid IIS

MADLearn now deploys to the 1-grid/Plesk Windows host at `41.185.110.61`
using the `coronbyd_0` account.

## Production Stack

| Layer | Target |
| --- | --- |
| Frontend | Angular static site on IIS: `https://madlearn.madprospects.com` |
| API | ASP.NET Core 8 on IIS/AspNetCoreModuleV2: `https://madlearnapi.madprospects.com` |
| Database | MSSQL: `WINSVRSQL03.hostserv.co.za,1433`, database `madlearn` |
| Deploy account | `coronbyd_0` |

## One-Time Host Requirements

1. DNS records for `madlearn.madprospects.com` and
   `madlearnapi.madprospects.com` must point to `41.185.110.61`.
2. The IIS server must have the .NET 8 ASP.NET Core Hosting Bundle installed.
3. The API app pool should run with **No Managed Code**.
4. The frontend site needs the IIS URL Rewrite module for SPA fallback.
5. TLS certificates are managed in Plesk for both subdomains.

## Configuration

Copy `.env.deploy.madlearn.example` to `.env.deploy.madlearn` and fill in
the private values locally. The production connection string must use MSSQL
and the deployment database user:

```text
Server=WINSVRSQL03.hostserv.co.za,1433;Database=madlearn;User Id=coronbyd_0;Password=<secret>;TrustServerCertificate=True;Encrypt=True;
```

Do not commit real credentials.

## Deploy

From `C:\Code\madprospects\madLearn`:

```powershell
.\deploy\deploy.ps1
```

Useful targets:

```powershell
.\deploy\deploy.ps1 -Target Frontend
.\deploy\deploy.ps1 -Target Backend
.\deploy\deploy.ps1 -SkipBuild
.\deploy\deploy-madlearn.ps1 -WhatIf
```

The deployment script builds the Angular frontend, publishes the .NET API for
Windows/IIS, uploads staged artifacts over FTPS, takes the API offline during
the DLL swap with `app_offline.htm`, removes the offline marker, and performs
a public API health check.

## Post-Deploy Checks

```powershell
Invoke-WebRequest https://madlearnapi.madprospects.com/health
Invoke-WebRequest https://madlearn.madprospects.com
```

Then verify browser login against the production API using a real MADLearn
account.
