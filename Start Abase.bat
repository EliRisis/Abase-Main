@echo off
title Abase dev server
cd /d "%~dp0"
echo Starting Abase at http://localhost:3000 ...
start "" http://localhost:3000
npm run dev
pause
