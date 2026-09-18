# Rebuilds and deploys Fly production (cultcodex-v2) against the live database.
#
# The image prerenders database-backed pages at BUILD time, so the build needs
# production's DATABASE_URL as a BuildKit secret. This reads it from the running
# Fly Machine (the same value the app uses), refuses anything whose database
# path is not /postgres, and passes it to the build without printing it.
#
# Usage, from anywhere:
#   powershell -ExecutionPolicy Bypass -File C:\Users\johnb\code\cultcodex-v2\scripts\deploy-fly-production.ps1
#   Add -DryRun to verify the build secret without deploying.

param([switch]$DryRun)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location (Join-Path $PSScriptRoot "..")

$app = "cultcodex-v2"
$commit = (git rev-parse HEAD).Trim()
Write-Host "Deploying commit $commit of branch $((git branch --show-current).Trim()) to $app"

# Windows PowerShell 5.1 turns ANY stderr line from a native program into a
# terminating error under "Stop" -- and flyctl writes routine progress such as
# "Connecting to ..." to stderr. Relax it around native calls and judge them by
# $LASTEXITCODE instead.
function Invoke-Native([scriptblock]$Command) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { & $Command } finally { $ErrorActionPreference = $previous }
}

# flyctl ssh console exits 1 on Windows without a real TTY ("The handle is
# invalid") even when the remote command succeeded, so its exit code is not
# trustworthy here. The URL match below is the real success test.
$raw = Invoke-Native { flyctl ssh console --app $app --command 'node -e "process.stdout.write(process.env.DATABASE_URL)"' 2>$null }
$match = ($raw | Select-String -Pattern 'postgres(ql)?://\S+' | Select-Object -First 1).Matches
if (-not $match) { throw "Could not read DATABASE_URL from the Fly Machine." }
$databaseUrl = $match[0].Value

$path = ([Uri]$databaseUrl).AbsolutePath
if ($path -ne "/postgres") {
    throw "Refusing to build: DATABASE_URL points at database '$path', not '/postgres'."
}
Write-Host "Build secret verified: database path is /postgres."
if ($DryRun) {
    Remove-Variable databaseUrl, raw, match
    Write-Host "Dry run: stopping before deploy."
    exit 0
}

# --depot=false: the Depot builder was OOM-killed twice building this image.
Invoke-Native {
    flyctl deploy --app $app --depot=false `
        --build-secret "DATABASE_URL=$databaseUrl" `
        --build-arg "SOURCE_COMMIT=$commit" 2>&1 | ForEach-Object { "$_" }
}
if ($LASTEXITCODE -ne 0) { throw "flyctl deploy failed with exit code $LASTEXITCODE." }

Remove-Variable databaseUrl, raw, match
Write-Host "`nDeployed. Tell Claude 'deployed' to verify."
