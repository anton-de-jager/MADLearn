@echo off
echo Starting LMS Backend API...
cd /d "%~dp0backend"
set NUGET_PACKAGES=C:\NuGet
dotnet run --project LMS.Api --urls "http://localhost:5000"
