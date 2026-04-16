@echo off
setlocal
cd /d "%~dp0"
call npm run verify:release
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Release verification failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)
echo.
echo Release verification passed.
pause
