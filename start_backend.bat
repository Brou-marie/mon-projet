@echo off
echo ============================================
echo  Demarrage NoamHome Backend
echo ============================================

:: Forcer les bons settings (annule toute variable existante)
set DJANGO_SETTINGS_MODULE=NoamHome.settings

cd /d "%~dp0backend"

echo Settings: %DJANGO_SETTINGS_MODULE%
echo DB: SQLite (db.sqlite3)
echo.

python manage.py migrate --run-syncdb
python manage.py runserver 0.0.0.0:8000

pause
