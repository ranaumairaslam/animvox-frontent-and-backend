@echo off
echo ==============================
echo Starting AnimVox Services
echo ==============================

cd /d D:\animvox

REM Use Python from PATH
set PYTHON_EXE=python

REM -------------------------
REM Core backend (main.py) - PORT 9000
REM -------------------------
echo Starting core backend (main.py) on port 9000
start "AnimVox Backend" cmd /k "%PYTHON_EXE% main.py"

REM -------------------------
REM Voiceover service - PORT 9001
REM -------------------------
echo Starting voiceover service
start "Voiceover Service" cmd /k "%PYTHON_EXE% voiceover\app.py"

REM -------------------------
REM Animated video service - PORT 8500
REM -------------------------
echo Starting animated video service
start "Animated Video Service" cmd /k "%PYTHON_EXE% videos_animated\app.py"

REM -------------------------
REM Static video service - PORT 8000
REM -------------------------
echo Starting static video service
start "Static Video Service" cmd /k "%PYTHON_EXE% videos_static\app.py"

REM Give backend time to bind ports
timeout /t 6

REM -------------------------
REM Start Main React App (User App)
REM -------------------------
echo Starting AnimVox Main App
cd /d D:\animvox\animvox-app
start "AnimVox Frontend" cmd /k "npm start"

timeout /t 3

REM -------------------------
REM Start Admin React App
REM -------------------------
echo Starting AnimVox Admin Panel
cd /d D:\animvox\admin_app\admin
start "AnimVox Admin Panel" cmd /k "npm start"

echo ==============================
echo All AnimVox services started
echo ==============================
pause
