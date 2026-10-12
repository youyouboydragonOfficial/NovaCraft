@echo off
title NovaCraft
cd /d "%~dp0"

if exist "NovaCraftApp\publish_fx\NovaCraft.exe" (
    cd NovaCraftApp\publish_fx
    start "" "NovaCraft.exe"
    exit /b
)

if exist "NovaCraftApp\wwwroot\index.html" (
    start "" "NovaCraftApp\wwwroot\index.html"
    exit /b
)

pause
