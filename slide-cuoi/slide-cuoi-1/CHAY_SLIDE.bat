@echo off
chcp 65001 > nul
title Khoi dong Slide Cuoi LED 16:9
echo Dang khoi dong may chu Slide Cuoi LED...
start "" http://localhost:8899/
node server.js
pause
