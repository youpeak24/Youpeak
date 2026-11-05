$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($env:secretKey)) { throw 'Production client key unavailable.' }
$env:YOUPEAK_API_SECRET_KEY = $env:secretKey
try {
    & "$PSScriptRoot/../../../scripts/build-consumer-web.ps1"
} finally {
    Remove-Item Env:YOUPEAK_API_SECRET_KEY -ErrorAction SilentlyContinue
}
