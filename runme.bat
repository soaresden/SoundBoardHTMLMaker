@echo off
chcp 65001 >nul
cls

echo 🔥 Reset serveur...
taskkill /IM pythonw.exe /F >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SoundboardServer*" >nul 2>&1

echo 🚀 Lancement serveur static (silencieux, en arrière-plan)...
REM pythonw.exe = Python sans fenêtre console -> 1 seule fenêtre au total
start "SoundboardServer" /B pythonw "%~dp0server_static.py"

timeout /t 2 >nul

:menu
cls
echo =============================
echo SOUNDBOARD BUILDER
echo =============================
echo.
echo Serveur: http://127.0.0.1:8765/editor (silencieux)
echo.
echo 1. Scan fichiers (config.json)
echo 2. Ouvrir Editor
echo 3. Build Player
echo 4. Scan + Build
echo 5. Build + Open Player
echo 6. Build PORTABLE (un seul fichier HTML, ideal tablette)
echo 0. Quit (kill serveur)
echo.
set /p choice=Choix :

if "%choice%"=="1" goto scan
if "%choice%"=="2" goto edit
if "%choice%"=="3" goto build
if "%choice%"=="4" goto scanbuild
if "%choice%"=="5" goto launch
if "%choice%"=="6" goto portable
if "%choice%"=="0" goto quit

goto menu

:quit
echo 🛑 Arrêt du serveur...
taskkill /IM pythonw.exe /F >nul 2>&1
exit

:scan
cls
echo Scan des fichiers...
python build.py scan
pause
goto menu

:edit
cls
echo Ouverture de l editor...
start http://127.0.0.1:8765/editor
goto menu

:build
cls
echo Build du player...
python build.py build
pause
goto menu

:scanbuild
cls
echo Scan + Build...
python build.py scan
python build.py build
echo ✅ Terminé !
pause
goto menu

:portable
cls
echo Build PORTABLE (mp3 + covers inlines en base64)...
echo Patience, ca peut prendre 30s+ selon la taille des mp3.
python build.py portable

IF EXIST FOLDERTOEXPORT\output_portable.html (
    echo.
    echo Fichier pret : FOLDERTOEXPORT\output_portable.html
    echo Copie-le sur ta tablette, il se suffit a lui-meme.
)
pause
goto menu

:launch
cls
echo Build + ouverture...
python build.py build

IF EXIST FOLDERTOEXPORT\output.html (
    start "" "FOLDERTOEXPORT\output.html"
) ELSE (
    echo ERR FOLDERTOEXPORT\output.html introuvable !
)

pause
goto menu