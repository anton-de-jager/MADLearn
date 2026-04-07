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
cd /d "%~dp0backend"
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
cd /d "%~dp0frontend"
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
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
echo  Backend:  cd backend && dotnet run --project LMS.Api
echo  Frontend: cd frontend && npm start
echo.
echo  Backend URL:  http://localhost:5000
echo  Frontend URL: http://localhost:4200
echo  Swagger UI:   http://localhost:5000/swagger
echo.
echo  Demo accounts:
echo    Admin:   admin@lms.com   / Admin@123
echo    Student: student@lms.com / Student@123
echo =====================================================
pause
