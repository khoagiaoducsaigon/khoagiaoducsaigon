@echo off
chcp 65001 >nul
title Trien khai EduLesson len VPS
setlocal
set VPS=root@72.62.72.204
set HERE=%~dp0

echo.
echo  Dang tai bo trien khai len VPS %VPS% ...
if not exist "%HERE%deploy-edulesson.sh" (
  echo  [LOI] Khong thay deploy-edulesson.sh - de 2 tep trong cung mot thu muc.
  goto :end
)
scp -o BatchMode=yes "%HERE%deploy-edulesson.sh" %VPS%:/tmp/deploy-edulesson.sh
if errorlevel 1 (
  echo  [LOI] Khong ket noi duoc VPS bang SSH. Kiem tra mang / khoa SSH.
  goto :end
)
ssh -o BatchMode=yes %VPS% "sed -i 's/\r$//' /tmp/deploy-edulesson.sh && bash /tmp/deploy-edulesson.sh"

:end
echo.
pause
