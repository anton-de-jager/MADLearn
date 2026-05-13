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

> The DreamCompute box does **NOT** use the DreamHost panel for hosting —
> Apache vhosts live in `/etc/apache2/sites-available/` and certs are issued
> directly with `certbot`. The vhost/cert setup needs **`sudo` on the box**.
> The `ubuntu` user (passwordless sudo) is the standard way to run those
> commands; `madproducts` owns the app files and is what `deploy.ps1` connects
> as.

### 1. DNS

Both A records already exist (per task brief). Confirm:

```bash
dig +short madtraining.madleads.ai      # -> 208.113.128.35
dig +short madtrainingapi.madleads.ai   # -> 208.113.128.35
```

### 2. Web roots (as `madproducts`)

```bash
ssh madproducts@208.113.128.35 \
  'mkdir -p /home/madproducts/madtraining.madleads.ai \
            /home/madproducts/madtrainingapi.madleads.ai \
            /home/madproducts/madtraining-api'
```

### 3. Apache vhosts (HTTP-only, as `ubuntu` with sudo)

Drop two vhost files into `/etc/apache2/sites-available/`:

**`madtraining.madleads.ai.conf`** — static SPA with ACME alias + FallbackResource:
```apache
<VirtualHost *:80>
    ServerName madtraining.madleads.ai
    Alias /.well-known/acme-challenge/ /var/www/letsencrypt/.well-known/acme-challenge/
    <Directory /var/www/letsencrypt/.well-known/acme-challenge>
        Options None
        AllowOverride None
        Require all granted
    </Directory>
    DocumentRoot /home/madproducts/madtraining.madleads.ai
    <Directory /home/madproducts/madtraining.madleads.ai>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
    ErrorLog ${APACHE_LOG_DIR}/madtraining.madleads.ai.error.log
    CustomLog ${APACHE_LOG_DIR}/madtraining.madleads.ai.access.log combined
</VirtualHost>
```

**`madtrainingapi.madleads.ai.conf`** — reverse-proxy host. The `[P]` rewrite
lives in `.htaccess` (managed by `deploy.ps1`), so the vhost itself only needs
to enable AllowOverride + the ProxyPassReverse for Apache to rewrite
`Location:` / `Set-Cookie:` headers (ProxyPassReverse is **not** allowed in
`.htaccess` — context error):
```apache
<VirtualHost *:80>
    ServerName madtrainingapi.madleads.ai
    Alias /.well-known/acme-challenge/ /var/www/letsencrypt/.well-known/acme-challenge/
    <Directory /var/www/letsencrypt/.well-known/acme-challenge>
        Options None
        AllowOverride None
        Require all granted
    </Directory>
    DocumentRoot /home/madproducts/madtrainingapi.madleads.ai
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPassReverse / http://127.0.0.1:3003/
    <Directory /home/madproducts/madtrainingapi.madleads.ai>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    Timeout 300
    ProxyTimeout 300
    ErrorLog ${APACHE_LOG_DIR}/madtrainingapi.madleads.ai.error.log
    CustomLog ${APACHE_LOG_DIR}/madtrainingapi.madleads.ai.access.log combined
</VirtualHost>
```

Enable both + reload Apache:
```bash
sudo a2ensite madtraining.madleads.ai madtrainingapi.madleads.ai
sudo apache2ctl configtest && sudo systemctl reload apache2
```

### 4. Let's Encrypt certs (as `ubuntu` with sudo)

`certbot --apache` issues the cert AND rewrites the vhost into an HTTPS
`-le-ssl.conf` variant with an HTTP→HTTPS redirect:

```bash
sudo certbot --apache --non-interactive --agree-tos \
  --email anton@madproducts.co.za --redirect \
  -d madtraining.madleads.ai \
  -d madtrainingapi.madleads.ai
```

After issuance, **re-add `ProxyPassReverse` to the generated
`madtrainingapi.madleads.ai-le-ssl.conf`** — certbot copies most directives
but not always `ProxyPassReverse`. Then reload Apache.

Renewals are handled automatically by certbot's systemd timer (`systemctl list-timers certbot`).

### 5. .NET 8 ASP.NET Core runtime (as `madproducts`, no sudo)

```bash
ssh madproducts@208.113.128.35
curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
bash /tmp/dotnet-install.sh --channel 8.0 --runtime aspnetcore --install-dir ~/.dotnet
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$DOTNET_ROOT:$PATH'   >> ~/.bashrc
bash -lc 'dotnet --list-runtimes'   # should list Microsoft.AspNetCore.App 8.0.x
```

### 6. PM2 startup unit

`pm2 startup` was run on the box during the first NestJS deploy; the systemd
unit `pm2-madproducts.service` is enabled and survives reboot. `deploy.ps1`
calls `pm2 save` after every deploy so the new app stays in the dump.

### 7. `.env.deploy`

Copy `.env.deploy.example` to `.env.deploy` and fill in `SFTP_PASS`,
`DB_CONNECTION_STRING` (with the real password — keep `Encrypt=False`, see
note in the example), and a fresh `JWT_KEY`.

### Gotchas you'll hit if you skip a step

- **`ProxyPassReverse not allowed here` in error log** — it's in `.htaccess`
  instead of the vhost. The directive is server/vhost/directory context only.
  Move it into the vhost.
- **API crashloops with `SSL Provider, error: 31`** — Ubuntu 24.04 OpenSSL 3
  rejects the cipher the remote MSSQL negotiates. `deploy.ps1` ships an
  `openssl.cnf` that lowers `SECLEVEL=0` / `MinProtocol=TLSv1.0` for the
  dotnet process only, via `OPENSSL_CONF` exported in `start.sh`. Don't
  remove it.
- **`./.env: line N: User: command not found`** — `start.sh` is sourcing
  `.env` with `. ./.env` instead of the line-by-line parser. The connection
  string contains `User Id=...` which bash then runs as a command. The
  current `start.sh` uses a manual key=value loader to avoid this.

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
