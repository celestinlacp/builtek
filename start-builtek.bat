@echo off
title Builtek Dev Server

:: Matar proceso previo en puerto 3000 si existe
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Iniciar servidor
cd /d "C:\Users\CELESTIN\Documents\ThinkPad\App Development\App Builtek\builtek"

echo.
echo  ================================
echo   Builtek - Iniciando servidor...
echo  ================================
echo.

start "" cmd /k "npm run dev"

:: Esperar y abrir browser
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000/dashboard"
