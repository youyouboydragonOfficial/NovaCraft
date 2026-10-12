@echo off
title NovaCraft - Launching...
cd /d "%~dp0"

echo ========================================================
echo    NovaCraft - Ultimate Voxel Sandbox
echo    Survival & Creative Mode (Original Edition)
echo ========================================================
echo.
echo Launching Windows Application...

if exist "NovaCraft.exe" (
    start "" "NovaCraft.exe"
    exit /b
)

if exist "NovaCraftLauncher.exe" (
    start "" "NovaCraftLauncher.exe"
    exit /b
)

if exist "wwwroot\index.html" (
    start "" "wwwroot\index.html"
    exit /b
)

echo Error: NovaCraft files not found!
pause
