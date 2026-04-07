@echo off
echo Starting LMS Backend API...
cd /d "%~dp0backend"
set NUGET_PACKAGES=C:\NuGet
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --project LMS.Api --urls "http://localhost:5000"
