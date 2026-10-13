@echo off
title NovaCraft - デスクトップに追加
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d1=[Environment]::GetFolderPath('Desktop'); $u=[Environment]::GetFolderPath('UserProfile'); $d2=Join-Path $u 'OneDrive\Desktop'; $target=Join-Path (Get-Location) 'NovaCraft.exe'; $wsh=New-Object -ComObject WScript.Shell; foreach($d in @($d1, $d2)){ if(Test-Path $d){ $s=$wsh.CreateShortcut((Join-Path $d 'NovaCraft.lnk')); $s.TargetPath=$target; $s.WorkingDirectory=(Get-Location); $s.Save(); } }"
echo [成功] ホーム画面 (デスクトップ) に NovaCraft を追加しました！
start "" "NovaCraft.exe"