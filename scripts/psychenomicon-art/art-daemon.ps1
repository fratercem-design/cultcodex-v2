# Durable Psychenomicon art runner.
#
# Runs one bounded chunk per invocation: generates + publishes (Railway
# Postgres) art for the next incomplete chapters, then exits. A scheduled task
# re-triggers it, so it grinds through the archive across sessions/reboots and
# resumes automatically (run.ts skips chapters that already have complete art).
#
# Stop gracefully:     New-Item scripts\psychenomicon-art\output\STOP
# Resume:              Remove-Item scripts\psychenomicon-art\output\STOP
# Per-run chapter cap: set env ART_MAX_NEW (default 50).

$ErrorActionPreference = "Continue"
$proj   = "C:\Users\johnb\cultcodex-v2"
$art    = Join-Path $proj "scripts\psychenomicon-art"
$outDir = Join-Path $art "output"
$log    = Join-Path $art "daemon.log"
$lock   = Join-Path $art "daemon.lock"
$maxNew = if ($env:ART_MAX_NEW) { $env:ART_MAX_NEW } else { "50" }

$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location $proj

function Log($m) {
  "$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss')) $m" | Out-File -FilePath $log -Append -Encoding utf8
}

if (Test-Path (Join-Path $outDir "STOP")) { Log "STOP present, exiting."; exit 0 }

# Single-instance guard (alongside the task's IgnoreNew policy).
if (Test-Path $lock) {
  $age = (Get-Date) - (Get-Item $lock).LastWriteTime
  if ($age.TotalHours -lt 6) { Log ("run in progress (lock {0:n0}m old), skipping" -f $age.TotalMinutes); exit 0 }
  Log "stale lock, overriding"
}
"" | Out-File -FilePath $lock -Encoding utf8

try {
  Log "=== run start (max-new $maxNew) ==="
  & "C:\Program Files\nodejs\npx.cmd" tsx (Join-Path $art "run.ts") --max-new $maxNew *>> $log
  Log "=== run end (exit $LASTEXITCODE) ==="
} finally {
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
