# MADLearn — Codex Project Notes

## Product
AI-powered Learning Management System (LMS) for South African businesses.
Part of the MAD Prospects ecosystem.

## Repo
`C:\Code\madTraining`

## Stack
- **Frontend**: Angular 19 (standalone) + Tailwind CSS · `apps/web/`
- **Backend**: ASP.NET Core 8 + EF Core · `apps/api/LMS.Api`

## Canonical URLs (madprospects.com domain — 1-grid)
| | |
|---|---|
| Frontend | https://madlearn.madprospects.com |
| API | https://madlearnapi.madprospects.com |

## Database (WINSVRSQL03.hostserv.co.za,1433)
- App DB: `madlearn`
- Hangfire DB: `madlearnhangfire`

## Brand Colors
- Primary: `#8B5CF6` (purple / Tailwind violet-500)
- Secondary: `#F59E0B` (amber)

## Deploy (1-grid FTP)
- Host: `41.185.110.61`
- User: `coronbyd_0`
- FE path: `/madlearn.madprospects.com/`
- API path: `/madlearnapi.madprospects.com/`
- Credentials: See `C:\Temp\` or team password manager

## Build commands
```powershell
# Frontend (from apps/web/)
pnpm build

# Backend (.NET)
dotnet publish apps/api/LMS.Api/LMS.Api.csproj -c Release -o .deploy/madlearn/api --no-self-contained
```

## Key files
- `apps/web/src/environments/environment.prod.ts` — API URL config
- `apps/web/src/app/app.routes.ts` — routing (landing at root, auth-guarded shell)
- `apps/web/src/app/features/home/home.component.ts` — public landing page
- `apps/api/LMS.Api/appsettings.Production.json` — CORS & Swagger config
