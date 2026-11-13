@echo off
chcp 65001 >nul
REM EduPlan KHBD AI v1.1 - buoc STAGE (an toan, chua doi ban dang chay). Dat file trong eduplan-5512\deploy roi nhap dup.
set VPS=root@72.62.72.204
tar -czf "%TEMP%\eduplan-v11.tar.gz" -C "%~dp0..\app" . || goto :err
scp -o BatchMode=yes "%TEMP%\eduplan-v11.tar.gz" %VPS%:/tmp/eduplan-v11.tar.gz || goto :err
scp -o BatchMode=yes "%~dp0deploy-v1.1.sh" %VPS%:/tmp/deploy-v1.1.sh || goto :err
ssh -o BatchMode=yes %VPS% "sed -i s/\r$// /tmp/deploy-v1.1.sh && bash /tmp/deploy-v1.1.sh stage"
echo.
echo Buoc tiep theo (sau khi duyet): ssh %VPS% "EDUPLAN_OLD_PASS=... bash /tmp/deploy-v1.1.sh switch --confirm"
pause
exit /b
:err
echo Loi - kiem tra khoa SSH va lenh tar
pause
