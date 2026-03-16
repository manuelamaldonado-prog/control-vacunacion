@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Iniciando servidor local...
start /b python backend.py

echo [2/2] Abriendo aplicacion...
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5000"

echo.
echo ======================================================
echo   SISTEMA DE CONTROL DE VACUNACION INICIADO
echo ======================================================
echo.
echo No cierres esta ventana mientras uses la aplicacion.
echo.
echo Presiona cualquier tecla para cerrar el servidor...
pause >nul

taskkill /f /im python.exe /fi "WINDOWTITLE eq backend.py" >nul 2>&1
echo Servidor detenido.
exit
