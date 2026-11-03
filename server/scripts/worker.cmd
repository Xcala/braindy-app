@echo off
rem Free-action worker (see server/src/worker/run.ts). Windows Task Scheduler runs this every 5 minutes.
if not exist "%USERPROFILE%raindy-worker" mkdir "%USERPROFILE%raindy-worker"
cd /d "%~dp0..\.."
node node_modules	sx\dist\cli.mjs server\src\workerun.ts >> "%USERPROFILE%raindy-worker\worker.log" 2>&1
