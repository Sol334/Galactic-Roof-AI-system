@echo off
echo Galactic Roof AI System - Enhanced Version - Installation Script
echo =========================================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
  echo Error installing dependencies!
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Initializing database...
call npm run init
if %ERRORLEVEL% neq 0 (
  echo Error initializing database!
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Installation complete!
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
echo To start the application, run:
echo npm start
echo.
echo Then open your web browser and navigate to:
echo http://localhost:8080
echo.

pause