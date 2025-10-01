@echo off
echo ========================================
echo PM2 REPAIR UTILITY
echo ========================================
echo.

echo [1/5] Killing all PM2 processes...
taskkill /F /IM PM2.exe >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq PM2*" >nul 2>&1

echo [2/5] Clearing PM2 cache...
if exist "%USERPROFILE%\.pm2" (
    rmdir /S /Q "%USERPROFILE%\.pm2"
    echo PM2 cache cleared
)

echo [3/5] Removing corrupted PM2 from node_modules...
if exist "node_modules\pm2" (
    rmdir /S /Q "node_modules\pm2"
    echo Removed corrupted PM2
)

echo [4/5] Reinstalling PM2...
call npm install --save-dev pm2@latest

echo.
echo [5/5] Testing PM2...
npx pm2 -v

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo PM2 REPAIR SUCCESSFUL!
    echo ========================================
    echo.
    echo You can now use: npm run pm2:start
) else (
    echo.
    echo ========================================
    echo PM2 REPAIR FAILED
    echo ========================================
    echo.
    echo Use start-direct.bat to run without PM2
)

echo.
pause
