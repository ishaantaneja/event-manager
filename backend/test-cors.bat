@echo off
echo ========================================
echo API ENDPOINT VALIDATION TEST
echo ========================================
echo.

echo Testing Health Endpoint...
curl -X GET http://localhost:5000/api/health
echo.
echo.

echo Testing Events Endpoint (OPTIONS preflight)...
curl -X OPTIONS http://localhost:5000/api/events -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Request-ID" -v
echo.
echo.

echo Testing Auth Login Endpoint (OPTIONS preflight)...
curl -X OPTIONS http://localhost:5000/api/auth/login -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,X-Request-ID" -v
echo.
echo.

echo ========================================
echo TEST COMPLETE
echo ========================================
echo.
echo If you see "Access-Control-Allow-Headers" with "x-request-id" in the response, CORS is fixed!
echo.

pause
