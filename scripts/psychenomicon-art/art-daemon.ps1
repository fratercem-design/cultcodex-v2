# Durable Psychenomicon art runner.
#
# Runs one bounded local chunk per invocation for the next incomplete chapters,
# then exits. Publishing requires --publish after explicit approval. A scheduled
# task may re-trigger it across sessions/reboots; the pipeline resumes without
# replacing completed local files.
#
# Stop gracefully:     New-Item scripts\psychenomicon-art\output\STOP
# Resume:              Remove-Item scripts\psychenomicon-art\output\STOP
# Per-run chapter cap: set env ART_MAX_NEW (default 1).

$ErrorActionPreference = "Continue"
$proj   = "C:\Users\johnb\Projects\cultcodex-v2"
$art    = Join-Path $proj "scripts\psychenomicon-art"
$outDir = Join-Path $art "output"
$log    = Join-Path $art "daemon.log"
$lock   = Join-Path $art "daemon.lock"
$maxNew = if ($env:ART_MAX_NEW) { $env:ART_MAX_NEW } else { "1" }
# Budget guard: stop for good once the archive has this many chapters with art.
# Raise it (or set ART_STOP_AT_TOTAL) to push further; the runner auto-stops
# when the configured provider reports exhausted credit or quota.
$stopAt = if ($env:ART_STOP_AT_TOTAL) { $env:ART_STOP_AT_TOTAL } else { "300" }

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
  Log "=== run start (max-new $maxNew, stop-at-total $stopAt) ==="
  & "C:\Program Files\nodejs\npx.cmd" tsx (Join-Path $art "run.ts") --max-new $maxNew --stop-at-total $stopAt *>> $log
  Log "=== run end (exit $LASTEXITCODE) ==="
} finally {
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
