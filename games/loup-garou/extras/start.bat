@echo off
echo.
echo Demarrage du serveur Loup-Garou...
echo.

REM Verifier que Node.js est installe
node --version >nul 2>&1
if not errorlevel 1 (
    echo OK - Node.js trouve
    goto StartServer
)

REM Node.js non trouve - installation automatique
echo Node.js non detecte
echo Telechargement et installation automatique...
echo.

REM Detecter architecture (32 ou 64 bits)
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
) else (
    set NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x86.msi
)

set INSTALLER=%TEMP%\node-installer.msi

echo Telechargement de Node.js...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%NODE_URL%', '%INSTALLER%')}"

if not exist "%INSTALLER%" (
    echo ERREUR: Impossible de telecharger Node.js
    echo Telecharge manuellement depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo Lancement de l'installation...
start /wait "" msiexec /i "%INSTALLER%" /passive

REM Rafraichir le PATH de cette session (l'installeur modifie le PATH systeme,
REM mais la fenetre cmd en cours ne le voit pas)
set "PATH=%ProgramFiles%\nodejs;%PATH%"

REM Verifier l'installation
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: L'installation a echoue
    echo Telecharge manuellement depuis: https://nodejs.org/
    pause
    exit /b 1
)

echo Installation reussie!
echo.

:StartServer
echo Generation de l'index des roles...
echo.

REM Lancer le serveur depuis le dossier gamemaster
cd /d "%~dp0gamemaster"

echo Serveur demarrare sur http://localhost:8000
echo Appuie sur CTRL+C pour arreter le serveur
echo.

REM Ouvrir le navigateur apres 2 secondes
timeout /t 2 /nobreak
start http://localhost:8000

REM Demarrer le serveur Node.js
node server.js
