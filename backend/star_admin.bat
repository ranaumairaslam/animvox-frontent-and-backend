@echo off
echo ==============================
echo Starting AnimVox Admin Panel with Backend
echo ==============================

REM -------------------------
REM Change to AnimVox root folder
REM -------------------------
cd /d D:\animvox

REM -------------------------
REM Start Flask backend on port 9000
REM -------------------------
echo Starting Flask backend on port 9000...
start "AnimVox Backend" cmd /k "python main.py"

REM -------------------------
REM Wait a few seconds for backend to bind port
REM -------------------------
timeout /t 6

REM -------------------------
REM Change to Admin Panel folder
REM -------------------------
cd /d D:\animvox\admin-app

REM -------------------------
REM Install dependencies if missing
REM -------------------------
IF NOT EXIST node_modules (
    echo Installing Admin Panel dependencies...
    npm install
) ELSE (
    echo Dependencies already installed.
)

REM -------------------------
REM Set fixed port for Admin Panel
REM -------------------------
set PORT=5174

REM -------------------------
REM Start the Admin Panel
REM -------------------------
echo Launching Admin Panel on port %PORT%...
start "AnimVox Admin Panel" cmd /k "npm start"

echo ==============================
echo Admin Panel with backend started successfully
echo ==============================
pause
