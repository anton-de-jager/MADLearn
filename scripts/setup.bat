@echo off
echo =====================================================
echo  LMS - Full Stack Developer Bootcamp - Setup
echo =====================================================
echo.

:: Check for .NET 8
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] .NET 8 SDK not found. Download from https://dot.net
    pause
    exit /b 1
)

:: Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Restoring .NET packages...
cd /d "%~dp0..\apps\api"
set NUGET_PACKAGES=C:\NuGet
dotnet restore LMS.sln
if %errorlevel% neq 0 (
    echo [ERROR] dotnet restore failed.
    pause
    exit /b 1
)
echo     Done.

echo.
echo [2/4] Building backend...
dotnet build LMS.sln --no-restore -c Release
set NUGET_PACKAGES=
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b 1
)
echo     Done.

echo.
echo [3/4] Installing Angular packages...
cd /d "%~dp0.."
call pnpm install --filter lms-frontend --frozen-lockfile
if %errorlevel% neq 0 (
    echo [ERROR] pnpm install failed.
    pause
    exit /b 1
)
echo     Done.

echo.
echo [4/4] Setup complete!
echo.
echo =====================================================
echo  To run the application:
echo.
echo  Backend:  scripts\run-backend.bat
echo  Frontend: scripts\run-frontend.bat
echo.
echo  Backend URL:  http://localhost:3016
echo  Frontend URL: http://localhost:4216
echo  Swagger UI:   http://localhost:3016/swagger
echo.
echo  Demo accounts:
echo    Admin:   admin@madlearn.local   / Admin@123
echo    Student: student@madlearn.local / Student@123
echo =====================================================
pause
