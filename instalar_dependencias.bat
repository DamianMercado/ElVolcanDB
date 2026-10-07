@echo off
title El Volcan - instalar dependencias
cd /d "%~dp0"
echo Instalando oracledb y flask...
echo.
python -m pip install -r requirements.txt
echo.
if errorlevel 1 (
    echo Hubo un problema. Revisa que Python este instalado y marcado en el PATH.
) else (
    echo Listo. Ahora haz doble clic en iniciar.bat
)
pause
