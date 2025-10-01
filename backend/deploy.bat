@echo off
REM Production Deployment Script for Windows

echo Starting Production Deployment...
echo.

REM Install dependencies
echo Installing dependencies...
call npm install --production

REM Check if PM2 is installed
where pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PM2...
    call npm install -g pm2
)

REM Stop existing processes
echo Stopping existing processes...
call pm2 stop event-manager-backend 2>nul
call pm2 delete event-manager-backend 2>nul

REM Start with PM2
echo Starting backend with PM2...
call pm2 start ecosystem.config.js

REM Save PM2 configuration
call pm2 save

echo.
echo ==============================
echo  Deployment complete!
echo ==============================
echo.
echo View logs: pm2 logs event-manager-backend
echo Monitor: pm2 monit
echo.
echo Pro Tips:
echo   - Check health: curl http://localhost:5000/api/health
echo   - View stats: curl http://localhost:5000/api/stats
echo   - Restart: npm run pm2:restart
echo   - Stop: npm run pm2:stop
echo.
pause
