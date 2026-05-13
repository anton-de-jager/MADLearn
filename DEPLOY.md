# Deploying madTraining to DreamHost CloudCompute

A single PowerShell script (`deploy.ps1`) handles the full publish:

- Builds the Angular SPA with the production API URL baked in
- Publishes the ASP.NET Core 8 API as framework-dependent linux-x64
- Ships a tarball over SFTP, extracts on the box, reloads PM2

The Apache vhost in front of `madtrainingapi.madleads.ai` reverse-proxies every
request to the PM2 process via an `.htaccess` rule using the `[P]` flag
(`mod_proxy` + `mod_proxy_http`). **Passenger is intentionally not used.**

Credentials live in **`.env.deploy`** at the repo root (gitignored). Copy
[`.env.deploy.example`](.env.deploy.example) to `.env.deploy` and fill in values.

---

## Architecture

```
                              Internet
                                 |
                  +--------------+---------------+
                  |                              |
       madtraining.madleads.ai      madtrainingapi.madleads.ai
            (Apache, TLS)                 (Apache, TLS)
                  |                              |
        +---------+---------+         +----------+----------+
        | static SPA bundle |         | .htaccess [P]       |
        | /home/madproducts |         | reverse-proxy to    |
        | /madtraining...   |         | 127.0.0.1:3003      |
        +-------------------+         +----------+----------+
                                                 |
                                                 v
                                       +-------------------+
                                       | PM2 process       |
                                       | madtraining-api   |
                                       | dotnet LMS.Api    |
                                       +---------+---------+
                                                 |
                                                 v
                                       MSSQL (41.185.13.202)
```

---

## One-time prerequisites

### 1. DNS

Both A records already exist on DreamHost (per task brief). Confirm:

```bash
dig +short madtraining.madleads.ai      # -> 208.113.128.35
dig +short madtrainingapi.madleads.ai   # -> 208.113.128.35
```

### 2. DreamHost panel — add hosting for both subdomains

**Domains -> Manage Domains -> Add Hosting** for each:

| Domain | Type | Notes |
|---|---|---|
| `madtraining.madleads.ai`    | Fully Hosted | Web root `/home/madproducts/madtraining.madleads.ai`. Do **NOT** tick Passenger. |
| `madtrainingapi.madleads.ai` | Fully Hosted | Web root `/home/madproducts/madtrainingapi.madleads.ai`. Do **NOT** tick Passenger. Apache must have `mod_proxy`, `mod_proxy_http`, `mod_rewrite`, `mod_headers` enabled (already on, used by the `api.madleads.ai` reverse-proxy). |

### 3. Let's Encrypt certificates (after step 2)

Order matters — the SPA cert first, then the API cert. Both are issued through the panel.

1. Confirm DNS has propagated for **both** records (`dig +short ...`).
2. **DreamHost panel -> Domains -> Manage Domains -> Secure Hosting**
   - Click **Add** next to `madtraining.madleads.ai` -> "Free Let's Encrypt certificate". Wait ~1-2 min.
   - Click **Add** next to `madtrainingapi.madleads.ai` -> same. Wait ~1-2 min.
3. Verify:
   ```bash
   curl -I https://madtraining.madleads.ai          # 200/301
   curl -I https://madtrainingapi.madleads.ai       # 502 expected before first deploy
   ```

If issuance fails, the panel surfaces the certbot error. Most common cause:
A record hasn't propagated yet — wait 10 min and retry.

### 4. .NET 8 ASP.NET Core runtime on the box (one-off, no sudo)

```bash
ssh madproducts@208.113.128.35
curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
bash /tmp/dotnet-install.sh --channel 8.0 --runtime aspnetcore --install-dir ~/.dotnet
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$DOTNET_ROOT:$PATH'   >> ~/.bashrc
# verify in a fresh login shell:
bash -lc 'dotnet --list-runtimes'   # should list Microsoft.AspNetCore.App 8.0.x
```

### 5. PM2 startup unit (once per box, already done for ms-api/ml-api/mh-api)

`pm2 startup` was run on this box when ms-api was first deployed; the systemd
unit survives reboot. After every deploy, `deploy.ps1` calls `pm2 save` so the
new app is included in the dump.

### 6. `.env.deploy`

Copy `.env.deploy.example` to `.env.deploy` and fill in `SFTP_PASS`,
`DB_CONNECTION_STRING` (with the real password), and a fresh `JWT_KEY`.

---

## First deploy

From the project root in PowerShell:

```powershell
.\deploy.ps1 -Target All
```

The script will:

1. Build the Angular SPA (prod) with `apiUrl: https://madtrainingapi.madleads.ai/api`.
2. `dotnet publish` the API (framework-dependent linux-x64).
3. SFTP the SPA -> `/home/madproducts/madtraining.madleads.ai/`.
4. SFTP a tarball -> `/home/madproducts/madtraining-api/`, extract, drop the
   reverse-proxy `.htaccess` into `/home/madproducts/madtrainingapi.madleads.ai/`.
5. `pm2 start dotnet ... --name madtraining-api` (idempotent — reloads if
   already running). `pm2 save` afterwards.
6. Smoke-test both public URLs.

---

## Subsequent deploys

```powershell
.\deploy.ps1                       # build + push both
.\deploy.ps1 -Target Frontend      # SPA only
.\deploy.ps1 -Target Backend       # API only
.\deploy.ps1 -SkipBuild            # re-upload last build
.\deploy.ps1 -DryRun               # build + stage, no remote ops
```

The PM2 reload is idempotent — safe to re-run.

---

## What ends up where

### Frontend (`/home/madproducts/madtraining.madleads.ai/`)
```
index.html
.htaccess        # SPA rewrite: /dashboard etc. -> index.html
main-*.js
polyfills-*.js
styles-*.css
assets/
```

### API web root (`/home/madproducts/madtrainingapi.madleads.ai/`)
```
.htaccess        # reverse-proxy [P] to 127.0.0.1:3003
```

### API runtime dir (`/home/madproducts/madtraining-api/`)
```
start.sh         # PM2 entry: loads .env, execs `dotnet LMS.Api.dll`
.env             # ConnectionStrings__DefaultConnection, Jwt__Key, CORS_ORIGINS
LMS.Api.dll
LMS.Application.dll
LMS.Domain.dll
LMS.Infrastructure.dll
appsettings.json
... (.NET publish output)
```

---

## Troubleshooting

**API returns 502 / connection refused**
PM2 process is down. SSH in:
```
pm2 ls
pm2 logs madtraining-api --lines 200
```
Common causes: bad connection string in `.env`, port collision, missing
`dotnet` on PATH (re-check step 4 above).

**API up but Apache returns 500**
Hit it directly on the box:
```
curl -i http://127.0.0.1:3003/api/auth/me     # expect 401
```
If that works, the issue is Apache — confirm `mod_proxy_http` is enabled and
`/home/madproducts/madtrainingapi.madleads.ai/.htaccess` exists.

**Frontend loads, API calls fail with CORS**
```
ssh madproducts@208.113.128.35 'cat /home/madproducts/madtraining-api/.env | grep CORS'
```
Should be `CORS_ORIGINS=https://madtraining.madleads.ai`. Edit `.env.deploy`
and re-run `deploy.ps1 -Target Backend`.

**Refresh on `/dashboard` returns 404**
The SPA `.htaccess` rewrite didn't land. Check
`/home/madproducts/madtraining.madleads.ai/.htaccess` exists.

**PM2 doesn't survive reboot**
Confirm the systemd unit is active: `systemctl status pm2-madproducts`. If
missing, run `pm2 startup` once (DreamHost CloudCompute supports it) and follow
the printed sudo command. `pm2 save` is already called by every deploy.
