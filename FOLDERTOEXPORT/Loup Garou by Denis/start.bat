@echo off
echo 🎮 Démarrage du serveur Loup-Garou...
echo.

REM Vérifier que Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Python n'est pas installé ou n'est pas dans le PATH
    echo Télécharge Python depuis https://www.python.org/
    pause
    exit /b 1
)

REM Lancer le serveur HTTP sur le port 8000
echo ✅ Serveur démarré sur http://localhost:8000
echo.
echo 📝 Appuie sur CTRL+C pour arrêter le serveur
echo.

REM Ouvrir le navigateur
timeout /t 1 /nobreak
start http://localhost:8000

REM Démarrer le serveur
python -m http.server 8000
