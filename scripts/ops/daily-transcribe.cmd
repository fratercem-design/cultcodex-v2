@echo off
REM Daily transcript sweep — downloads audio for any un-transcribed published
REM episode and transcribes it via free Groq Whisper. Registered as a Windows
REM Scheduled Task (CultCodexTranscribeDaemon). Stop by deleting the task or
REM dropping a STOP file next to this script.

setlocal
set REPO=C:\Users\johnb\cultcodex-v2
set LOGDIR=%REPO%\logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

REM STOP file kill-switch — create logs\TRANSCRIBE_STOP to pause the daemon.
if exist "%LOGDIR%\TRANSCRIBE_STOP" (
  echo [%date% %time%] STOP file present, skipping run >> "%LOGDIR%\daily-transcribe.log"
  exit /b 0
)

REM Ensure yt-dlp is reachable (lives in the hermes venv).
set PATH=%PATH%;C:\Users\johnb\AppData\Local\hermes\hermes-agent\venv\Scripts

cd /d "%REPO%"
echo [%date% %time%] --- sweep start --- >> "%LOGDIR%\daily-transcribe.log"
node scripts\ops\whisper-transcribe.mjs --download >> "%LOGDIR%\daily-transcribe.log" 2>&1
echo [%date% %time%] --- sweep end (exit %ERRORLEVEL%) --- >> "%LOGDIR%\daily-transcribe.log"
endlocal
