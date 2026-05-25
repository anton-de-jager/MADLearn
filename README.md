# MADLearn

AI-powered learning management for South African businesses.

## Structure

- `apps/api/` - ASP.NET Core 8 API, EF Core, migrations, services, appsettings.
- `apps/web/` - Angular frontend.
- `database/` - SQL scripts and seed/database notes outside EF migrations.
- `deploy/` - deployment scripts and IIS templates.
- `docs/` - deployment notes, architecture notes, and recovery runbooks.
- `scripts/` - local setup and run scripts.
- `verification/` - smoke test notes, screenshots, and deployment proof.

## Local URLs

- Frontend: `http://localhost:4216`
- API: `http://localhost:3016`
- Swagger: `http://localhost:3016/swagger`

## Commands

```powershell
scripts\setup.bat
scripts\run-backend.bat
scripts\run-frontend.bat
```

Root package shortcuts:

```powershell
pnpm build:web
pnpm build:api
pnpm start:web
pnpm start:api
```

pnpm uses the shared store at `C:\Code\.pnpm` via root `.npmrc`.

Deployment notes live in `docs/DEPLOY.md`.
