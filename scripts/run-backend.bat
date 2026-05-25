@echo off
echo Starting MADLearn Backend API on http://localhost:3016 ...
cd /d "%~dp0..\apps\api"
set NUGET_PACKAGES=C:\NuGet
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --project LMS.Api\LMS.Api.csproj --urls "http://localhost:3016"
