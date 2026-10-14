@echo off
chcp 65001 >nul
title NovaCraft - デスクトップショートカット作成

echo ===================================================
echo   NovaCraft をホーム画面 (デスクトップ) に追加中...
echo ===================================================
echo.

set SCRIPT="%TEMP%\CreateNovaCraftShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\NovaCraft.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0NovaCraft.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "NovaCraft - Ultimate Infinite Voxel Sandbox" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo [完了] ホーム画面 (デスクトップ) に NovaCraft のショートカットを作成しました！
echo.
echo 今すぐゲームを起動します...
start "" "%~dp0NovaCraft.exe"
timeout /t 2 >nul
exit
