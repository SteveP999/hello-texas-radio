@echo off
echo.
echo ==========================================
echo  HTR Radio Update
echo ==========================================
echo.
echo Pushing to GitHub...
git add .
git status
echo.
set /p MSG="Commit message (Enter = 'update stations'): "
if "%MSG%"=="" set MSG=update stations
git commit -m "%MSG%"
git push --force
if %errorlevel% equ 0 (
  echo.
  echo ==========================================
  echo  SUCCESS! hello-texas-radio is live.
  echo ==========================================
) else (
  echo ERROR: Push failed.
)
echo.
pause
