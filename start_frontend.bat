@echo off
echo ============================================
echo  Demarrage NoamHome Frontend
echo ============================================

cd /d "%~dp0frontend"

echo Port: 5173
echo.

npm run dev

pause
