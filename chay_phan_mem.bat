@echo off
title Khoi Dong Phan Mem Quan Ly Hui - Chu Thao
echo ============================================================
echo   KHOI DONG PHAN MEM QUAN LY HUI (CHU THAO)
echo ============================================================
echo.
echo   Buoc 1: Tu dong mo trinh duyet truy cap ung dung...
start http://localhost:8000
echo.
echo   Buoc 2: Chay may chu local (Local Web Server)...
echo.
node "%~dp0server.js"
if %errorlevel% neq 0 (
  echo.
  echo [LOI] Khong the khoi dong duoc may chu Node.js.
  echo Vui long kiem tra xem Node.js da duoc cai dat hay chua.
  echo Neu Node.js chua co, ban van co the nhap dup chuot truc tiep 
  echo vao file "index.html" de chay ung dung tren trinh duyet.
  echo.
  pause
)
