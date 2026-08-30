param(
    [switch]$Inventory,
    [ValidateRange(1, 100)]
    [int]$MaxNew = 1,
    [string]$Chapter,
    [string]$EnvFile
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if ($EnvFile) {
    $resolvedEnvFile = (Resolve-Path -LiteralPath $EnvFile).Path
}
elseif (-not $env:DATABASE_URL) {
    throw "DATABASE_URL is not set. Set it in this PowerShell session, or explicitly pass -EnvFile to a trusted env file."
}

$secureKey = $null
$keyPointer = [IntPtr]::Zero

try {
    if (-not $Inventory) {
        $secureKey = Read-Host "Paste the HCNSEC API key" -AsSecureString
        $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
        $env:HCNSEC_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    }

    $runnerArgs = @("tsx", "scripts/psychenomicon-art/run.ts")

    if ($Inventory) {
        $runnerArgs += "--inventory"
    }
    else {
        $runnerArgs += @("--max-new", $MaxNew)
    }

    if ($Chapter) {
        $runnerArgs += @("--chapter", $Chapter)
    }

    if ($resolvedEnvFile) {
        & npx.cmd dotenvx run -f $resolvedEnvFile -- npx.cmd @runnerArgs
    }
    else {
        & npx.cmd @runnerArgs
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Psychenomicon art runner exited with code $LASTEXITCODE."
    }
}
finally {
    Remove-Item Env:\HCNSEC_API_KEY -ErrorAction SilentlyContinue

    if ($keyPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
    }

    $secureKey = $null
}
