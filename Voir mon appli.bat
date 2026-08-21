@echo off
REM Double-clique sur ce fichier pour essayer l'application sur ton ordinateur.
REM Une fenetre noire s'ouvre : c'est le petit serveur, laisse-la ouverte.
REM Pour tout arreter, ferme simplement cette fenetre noire.

cd /d "%~dp0"
start "Serveur La Baguette Maquille" powershell -NoProfile -ExecutionPolicy Bypass -File "outils\serveur-local.ps1"
timeout /t 2 /nobreak >nul
start "" http://localhost:8080
