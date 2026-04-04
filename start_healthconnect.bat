@echo off
echo ============================================
echo   🩺 HealthConnect — Full Stack Launcher
echo ============================================
echo.

echo [1/3] Starting Python ML Server (port 5001)...
start "HealthConnect ML" cmd /k "cd /d %~dp0healthconnect-ml && python app.py"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Node.js Backend (port 5000)...
start "HealthConnect Backend" cmd /k "cd /d %~dp0healthconnect-backend && node server.js"
timeout /t 2 /nobreak > nul

echo [3/3] Starting React Frontend (port 3000)...
start "HealthConnect Frontend" cmd /k "cd /d %~dp0healthconnect && npm start"

echo.
echo ============================================
echo   ✅ All 3 services are starting!
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000
echo   ML Server: http://localhost:5001
echo ============================================
echo.
echo Close this window anytime. The services
echo will keep running in their own windows.
pause
