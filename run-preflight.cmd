@echo off
setlocal
cd /d "%~dp0"
call npm run preflight
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Preflight failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)
echo.
echo Preflight passed.
pause
