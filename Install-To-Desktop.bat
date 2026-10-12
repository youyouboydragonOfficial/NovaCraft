@echo off
title NovaCraft - ホーム画面 (デスクトップ) に追加
cd /d "%~dp0"

echo ========================================================
echo    NovaCraft - ホーム画面 (デスクトップ) に追加
echo ========================================================
echo.
echo デスクトップにショートカットアイコンを作成しています...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$target = Resolve-Path 'NovaCraftApp\publish_fx\NovaCraft.exe';" ^
  "$wsh = New-Object -ComObject WScript.Shell;" ^
  "$shortcut = $wsh.CreateShortcut(\"$desktop\NovaCraft.lnk\");" ^
  "$shortcut.TargetPath = $target.Path;" ^
  "$shortcut.WorkingDirectory = Split-Path $target.Path;" ^
  "$shortcut.Description = 'NovaCraft - Ultimate Infinite Voxel Sandbox';" ^
  "$shortcut.Save();"

echo.
echo [成功] ホーム画面 (デスクトップ) に「NovaCraft」アイコンを追加しました！
echo デスクトップからいつでもダブルクリックで遊べます。
echo.
echo 今すぐゲームを起動しますか？ (Y/N)
set /p opt="Choice: "
if /i "%opt%"=="Y" (
    cd NovaCraftApp\publish_fx
    start "" "NovaCraft.exe"
)
