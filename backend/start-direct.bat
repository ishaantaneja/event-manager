@echo off
echo ========================================
echo DIRECT NODE SERVER STARTUP (No PM2)
echo ========================================
echo.
echo Starting backend on port 5000...
echo Press Ctrl+C to stop the server
echo.

node src/server.js
