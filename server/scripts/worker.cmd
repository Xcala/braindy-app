@echo off
rem Free-action worker (see server/src/worker/run.ts). Windows Task Scheduler runs this every 5 minutes.
if not exist "%USERPROFILE%\braindy-worker" mkdir "%USERPROFILE%\braindy-worker"
cd /d "%~dp0..\.."
node node_modules\tsx\dist\cli.mjs server\src\worker\run.ts >> "%USERPROFILE%\braindy-worker\worker.log" 2>&1
