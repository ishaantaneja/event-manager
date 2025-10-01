@echo off
echo ========================================
echo CORS FIX DEPLOYMENT SCRIPT
echo ========================================
echo.

echo [1/4] Stopping existing PM2 processes...
call npm run pm2:stop
timeout /t 2 /nobreak > nul

echo.
echo [2/4] Clearing PM2 process list...
npx pm2 delete event-manager-backend
timeout /t 1 /nobreak > nul

echo.
echo [3/4] Starting backend with fixed CORS configuration...
call npm run pm2:start
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Verifying health status...
timeout /t 2 /nobreak > nul
curl http://localhost:5000/api/health

echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Check logs with: npm run pm2:logs
echo Monitor with: npm run pm2:monitor
echo.

pause
