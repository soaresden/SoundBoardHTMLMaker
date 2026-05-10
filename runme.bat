@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cls

REM ============================================================
REM   CHECK PYTHON
REM ============================================================
where python >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERREUR] Python n'est pas installe ou pas dans le PATH.
    echo Installe Python 3 depuis https://www.python.org/downloads/
    echo et coche "Add Python to PATH" pendant l'installation.
    pause
    exit /b 1
)

REM ============================================================
REM   CHECK REQUIREMENTS (mutagen)
REM ============================================================
python -c "import mutagen" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [SETUP] Installation des dependances Python...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERREUR] L'installation a echoue. Lance manuellement :
        echo    pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo [OK] Dependances installees.
    timeout /t 2 >nul
)

REM ============================================================
REM   RESET + LANCE LE SERVEUR EN ARRIERE-PLAN
REM ============================================================
taskkill /IM pythonw.exe /F >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SoundboardServer*" >nul 2>&1
start "SoundboardServer" /B pythonw "%~dp0server_static.py"
timeout /t 2 >nul

:menu
cls
echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║                                                       ║
echo  ║   ♬   S O U N D B O A R D   B U I L D E R   ♪         ║
echo  ║                                                       ║
echo  ║   ▸ Editor live  : http://127.0.0.1:8765/editor       ║
echo  ║   ▸ Project root : %~dp0
echo  ║                                                       ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.
echo    ┌─ ACTIONS ──────────────────────────────────────────┐
echo    │                                                    │
echo    │   [1]  Scan fichiers       (mp3 → config.json)     │
echo    │   [2]  Ouvrir Editor       (browser)               │
echo    │   ──                                               │
echo    │   [3]  Build LIGHT         + Open Player           │
echo    │   [4]  Build AiO           + Open Player           │
echo    │   [5]  Build TOUT          + Open Player           │
echo    │   ──                                               │
echo    │   [0]  Quit  (kill serveur)                        │
echo    │                                                    │
echo    └────────────────────────────────────────────────────┘
echo.
set /p choice=    ▸ Ton choix :

if "%choice%"=="1" goto scan
if "%choice%"=="2" goto edit
if "%choice%"=="3" goto build_light
if "%choice%"=="4" goto build_aio
if "%choice%"=="5" goto build_all
if "%choice%"=="0" goto quit

goto menu

:quit
cls
echo.
echo    ▸ Arret du serveur Soundboard...
taskkill /IM pythonw.exe /F >nul 2>&1
echo    ▸ Bye.
timeout /t 1 >nul
exit

:scan
cls
echo.
echo  ▸▸▸ SCAN des fichiers mp3
echo  ─────────────────────────────────────
python build.py scan
echo.
pause
goto menu

:edit
cls
echo  ▸▸▸ Ouverture de l'editor dans le navigateur...
start http://127.0.0.1:8765/editor
goto menu

:build_light
cls
echo.
echo  ▸▸▸ BUILD LIGHT (index.html + dossiers)
echo  ─────────────────────────────────────
python build.py build

set "PLAYER="
for /f "usebackq delims=" %%I in (`python "_get_export_path.py" output`) do set "PLAYER=%%I"

IF DEFINED PLAYER (
    IF EXIST "%PLAYER%" (
        echo.
        echo  ▸ Ouverture : %PLAYER%
        start "" "%PLAYER%"
    ) ELSE (
        echo  [ERR] fichier non trouve : "%PLAYER%"
    )
)
echo.
pause
goto menu

:build_aio
cls
echo.
echo  ▸▸▸ BUILD ALL-IN-ONE (un seul fichier autonome)
echo  ─────────────────────────────────────
echo  Patience, encodage base64 en cours...
python build.py portable

set "PLAYER="
for /f "usebackq delims=" %%I in (`python "_get_export_path.py" portable`) do set "PLAYER=%%I"

IF DEFINED PLAYER (
    IF EXIST "%PLAYER%" (
        echo.
        echo  ▸ Ouverture : %PLAYER%
        start "" "%PLAYER%"
    ) ELSE (
        echo  [ERR] fichier non trouve : "%PLAYER%"
    )
)
echo.
pause
goto menu

:build_all
cls
echo.
echo  ▸▸▸ BUILD COMPLET (light + all-in-one)
echo  ─────────────────────────────────────
python build.py all

set "PLAYER="
for /f "usebackq delims=" %%I in (`python "_get_export_path.py" output`) do set "PLAYER=%%I"

IF DEFINED PLAYER (
    IF EXIST "%PLAYER%" (
        echo.
        echo  ▸ Ouverture (light) : %PLAYER%
        start "" "%PLAYER%"
    ) ELSE (
        echo  [ERR] fichier non trouve : "%PLAYER%"
    )
)
echo.
pause
goto menu
