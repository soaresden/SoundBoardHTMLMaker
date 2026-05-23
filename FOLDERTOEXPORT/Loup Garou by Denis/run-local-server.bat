@echo off
REM Loup Garou Game - Local Server Launcher
REM ========================================

cls
echo.
echo ========================================
echo   LOUP GAROU - SERVEUR LOCAL
echo ========================================
echo.
echo [*] Demarrage du serveur...
echo.

REM Demarrer le serveur Python en arriere-plan
python -m http.server 8000

REM Si le serveur s'arrete, afficher un message
echo.
echo [!] Le serveur s'est arrete.
pause
