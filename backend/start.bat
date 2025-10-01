@echo off
echo ========================================
echo BACKEND STARTUP - INTELLIGENT MODE
echo ========================================
echo.

echo [STEP 1] Checking PM2 status...
npx pm2 list >nul 2>&1

if %errorlevel% equ 0 (
    echo PM2 is working - using PM2 mode
    echo.
    echo [STEP 2] Stopping existing processes...
    npx pm2 stop event-manager-backend >nul 2>&1
    npx pm2 delete event-manager-backend >nul 2>&1
    
    echo [STEP 3] Starting with PM2...
    npx pm2 start ecosystem.config.js
    
    echo.
    echo [STEP 4] View logs with: npm run pm2:logs
    echo Monitor with: npm run pm2:monitor
) else (
    echo PM2 is corrupted or not working - falling back to direct Node
    echo.
    echo [STEP 2] Starting server directly with Node.js...
    echo Press Ctrl+C to stop the server
    echo.
    echo ========================================
    echo SERVER RUNNING ON PORT 5000
    echo Health: http://localhost:5000/api/health
    echo ========================================
    echo.
    node src/server.js
)

pause
