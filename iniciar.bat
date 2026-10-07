@echo off
title El Volcan - servidor web
cd /d "%~dp0"

echo Iniciando El Volcan en http://localhost:5000 ...
echo (El navegador se abrira solo. No cierres esta ventana mientras uses la pagina.)
echo.

python web.py
if errorlevel 1 (
    echo.
    echo No se pudo iniciar. Revisa que Python este instalado y que hayas
    echo ejecutado una vez:  pip install -r requirements.txt
)
pause
