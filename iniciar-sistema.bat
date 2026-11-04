@echo off
title Ellenco - Sistema Digital de Apontamento de Producao
color 0B
cls
echo ================================================================
echo           ELLENCO - SISTEMA DIGITAL DE PRODUCAO 2026
echo ================================================================
echo.
echo Iniciando o servidor Node.js e banco de dados SQLite...
echo.

start "" http://localhost:3000/HTML/index.html
node server.js

pause
