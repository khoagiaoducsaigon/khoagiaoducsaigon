@echo off
chcp 65001 >nul
REM Đưa EduPlan 5512 CoPilot lên VPS. Đặt file này trong thư mục eduplan-5512\deploy rồi nhấp đúp.
set VPS=root@72.62.72.204
scp -o BatchMode=yes "%~dp0..\index.html" %VPS%:/tmp/eduplan.html || goto :err
scp -o BatchMode=yes "%~dp0deploy-vps.sh" %VPS%:/tmp/deploy-vps.sh || goto :err
ssh -o BatchMode=yes %VPS% "sed -i 's/\r$//' /tmp/deploy-vps.sh && bash /tmp/deploy-vps.sh"
pause
exit /b
:err
echo Loi scp - kiem tra khoa SSH C:\Users\admin\.ssh\id_ed25519
pause
