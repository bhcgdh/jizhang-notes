@echo off
setlocal
cd /d "%~dp0"

set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

echo Checking Qwen API...
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 8001 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo Starting Qwen API...
  start "Qwen API" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-qwen-api.ps1"
) else (
  echo Qwen API is already running.
)

echo Waiting for Qwen API...
for /l %%I in (1,1,180) do (
  powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 8001 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
  if not errorlevel 1 goto :QwenReady
  timeout /t 1 /nobreak >nul
)

echo Failed to start Qwen API on port 8001.
pause
exit /b 1

:QwenReady
call :FindBookkeepingPort
if not defined BOOKKEEPING_PORT (
  echo Starting bookkeeping service...
  start "Bookkeeping Service" cmd.exe /k "cd /d ""%~dp0"" && npm run start:qwen"
)

echo Waiting for bookkeeping page...
for /l %%I in (1,1,60) do (
  call :FindBookkeepingPort
  if defined BOOKKEEPING_PORT goto :OpenBrowser
  timeout /t 1 /nobreak >nul
)

echo Failed to start the bookkeeping page.
pause
exit /b 1

:OpenBrowser
set "BOOKKEEPING_URL=http://localhost:%BOOKKEEPING_PORT%/"
echo Opening %BOOKKEEPING_URL%
if exist "%CHROME%" (
  start "" "%CHROME%" "%BOOKKEEPING_URL%"
) else (
  echo Google Chrome was not found. Opening the default browser.
  start "" "%BOOKKEEPING_URL%"
)
exit /b 0

:FindBookkeepingPort
set "BOOKKEEPING_PORT="
for /f %%P in ('powershell.exe -NoProfile -Command "foreach ($p in 5174..5190) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri ('http://127.0.0.1:' + $p + '/api/categories') -TimeoutSec 1; if ($r.StatusCode -eq 200) { Write-Output $p; break } } catch {} }"') do set "BOOKKEEPING_PORT=%%P"
exit /b 0
