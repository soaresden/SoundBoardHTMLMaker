@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"
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
REM   CHECK REQUIREMENTS (mutagen, lameenc)
REM ============================================================
python -c "import mutagen, lameenc" >nul 2>&1
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

REM Pas encore de jeu courant ? -> on le choisit d'abord
call :get_game
if not defined GAME goto choose

call :restart_server

:menu
call :get_game
cls
echo.
echo  ===========================================================
echo  ::                                                       ::
echo  ::         S O U N D B O A R D    B U I L D E R          ::
echo  ::                                                       ::
echo  ::   Editor live  : http://127.0.0.1:8765/editor         ::
echo  ::                                                       ::
echo  ===========================================================
echo.
echo    Jeu courant : !GAME!   (dossier games\!GAME!\)
echo.
echo    +-- CE JEU ---------------------------------------------+
echo    ^|   [1]  Scan fichiers       (mp3 ^> config.json)       ^|
echo    ^|   [2]  Ouvrir l'editeur    (browser)                 ^|
echo    ^|   [3]  Build LIGHT         + ouvrir le player        ^|
echo    ^|   [4]  Build AiO           + ouvrir le player        ^|
echo    ^|   [5]  Build TOUT          (light + AiO)             ^|
echo    +-- PROJET ---------------------------------------------+
echo    ^|   [6]  Changer de jeu                                ^|
echo    ^|   [7]  Nouveau jeu         (copie de games\_template) ^|
echo    ^|   [8]  Build de TOUS les jeux + page d'accueil       ^|
echo    ^|   --                                                 ^|
echo    ^|   [0]  Quitter  (arrete le serveur)                  ^|
echo    +------------------------------------------------------+
echo.
set "choice="
set /p choice=    ^> Ton choix :

if "%choice%"=="1" goto scan
if "%choice%"=="2" goto edit
if "%choice%"=="3" goto build_light
if "%choice%"=="4" goto build_aio
if "%choice%"=="5" goto build_all
if "%choice%"=="6" goto choose
if "%choice%"=="7" goto newgame
if "%choice%"=="8" goto build_every
if "%choice%"=="0" goto quit
goto menu

:quit
cls
echo.
echo    Arret du serveur Soundboard...
taskkill /IM pythonw.exe /F >nul 2>&1
echo    Bye.
timeout /t 1 >nul
exit

:scan
cls
echo.
echo  === SCAN des fichiers mp3 de games\!GAME! ===
echo.
python build.py scan "!GAME!"
echo.
pause
goto menu

:edit
start http://127.0.0.1:8765/editor
goto menu

:build_light
cls
echo.
echo  === BUILD LIGHT (index.html + dossiers) ===
echo.
python build.py build "!GAME!"
call :open_player light
pause
goto menu

:build_aio
cls
echo.
echo  === BUILD ALL-IN-ONE (un seul fichier autonome) ===
echo  Patience, encodage base64 en cours...
echo.
python build.py portable "!GAME!"
call :open_player portable
pause
goto menu

:build_all
cls
echo.
echo  === BUILD COMPLET (light + all-in-one) ===
echo.
python build.py all "!GAME!"
call :open_player light
pause
goto menu

:build_every
cls
echo.
echo  === BUILD DE TOUS LES JEUX + PAGE D'ACCUEIL ===
echo.
python build.py build-all
echo.
echo  Page d'accueil : index.html (a la racine)
pause
goto menu

:choose
cls
echo.
echo  === CHOISIR LE JEU ===
echo.
python build.py list
echo.
set "pick="
set /p pick=    ^> Nom du dossier du jeu (ex. metal-gear) :
if not defined pick goto choose
python build.py use "!pick!"
if errorlevel 1 ( pause & goto choose )
call :restart_server
goto menu

:newgame
cls
echo.
echo  === NOUVEAU JEU ===
echo.
set "gname="
set /p gname=    ^> Nom du jeu (ex. Dixit chez Paul) :
if not defined gname goto menu
python build.py new "!gname!"
echo.
echo  Mets tes musiques dans music\ et tes bruitages dans sfx\ du nouveau dossier,
echo  puis fais [1] Scan et [2] Editeur.
call :restart_server
pause
goto menu

REM ------------------------------------------------------------
:get_game
set "GAME="
for /f "usebackq delims=" %%I in (`python build.py current`) do set "GAME=%%I"
exit /b 0

:restart_server
taskkill /IM pythonw.exe /F >nul 2>&1
start "SoundboardServer" /B pythonw "%~dp0server_static.py"
timeout /t 2 >nul
exit /b 0

:open_player
set "PLAYER="
for /f "usebackq delims=" %%I in (`python build.py path "!GAME!" %1`) do set "PLAYER=%%I"
if defined PLAYER (
    if exist "!PLAYER!" (
        echo.
        echo  Ouverture : !PLAYER!
        start "" "!PLAYER!"
    ) else (
        echo  [ERR] fichier non trouve : "!PLAYER!"
    )
)
echo.
exit /b 0
