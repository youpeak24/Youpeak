<#
.SYNOPSIS
  Runs the YouPeak app from source (debug) WITH the client API key, so login,
  settings and translations are accepted by the backend.

.DESCRIPTION
  `flutter run` on its own compiles an empty API key and every key-gated request
  (including login) is answered with HTTP 401 by the real backend. This script
  supplies the key the same way the release helper does: read from the
  environment, written to a temporary defines file that is deleted afterwards,
  never printed and never placed on a command line.

  Against production (default) it needs the key:
    npx vercel env run -e production -- powershell -ExecutionPolicy Bypass -File scripts/run-web-dev.ps1
  Against the local stack (local-dev/start.js running):
    powershell -File scripts/run-web-dev.ps1 -Local

  This is for development. Distributable builds come only from
  scripts/build-consumer-apk.ps1 (see DEPLOYMENT.md section 5).

.PARAMETER Device
  Flutter device id: chrome (default), web-server, or an Android device id.

.PARAMETER WebPort
  Fixed port for the web run (0 = let Flutter choose).

.PARAMETER Local
  Use the local emulator stack instead of production.
#>
param(
    [string]$Device = 'chrome',
    [int]$WebPort = 0,
    [switch]$Local,
    [string]$ApiBaseUrl
)

$ErrorActionPreference = 'Stop'
$appRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'Youpeak_Flutter'
$pins = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'android-release.json') -Raw | ConvertFrom-Json

$key = $env:YOUPEAK_API_SECRET_KEY
if ([string]::IsNullOrWhiteSpace($key)) { $key = $env:secretKey }   # set by `vercel env run`

$defines = [ordered]@{ APP_DOMAIN = $pins.appDomain; USE_LOCAL_DEV = 'false' }
if ($Local) {
    # Android devices reach the host machine at 10.0.2.2; a browser at localhost.
    $isAndroid = ($Device -ne 'chrome' -and $Device -ne 'web-server' -and $Device -notmatch '^edge')
    $defines.API_BASE_URL = if ($ApiBaseUrl) { $ApiBaseUrl } elseif ($isAndroid) { 'http://10.0.2.2:5055/' } else { 'http://localhost:5055/' }
    $defines.API_SECRET_KEY = if ([string]::IsNullOrWhiteSpace($key)) { 'youpeak-local-dev-key' } else { $key }
    if (-not $isAndroid) { $defines.AUTH_EMULATOR = '127.0.0.1:9095'; $defines.FIRESTORE_EMULATOR = '127.0.0.1:8095' }
    else { $defines.AUTH_EMULATOR = '10.0.2.2:9095'; $defines.FIRESTORE_EMULATOR = '10.0.2.2:8095' }
} else {
    if ([string]::IsNullOrWhiteSpace($key)) {
        throw 'No client API key, so the backend would answer every login with HTTP 401. Run: npx vercel env run -e production -- powershell -ExecutionPolicy Bypass -File scripts/run-web-dev.ps1  (or set YOUPEAK_API_SECRET_KEY).'
    }
    if ($key.Length -lt 16 -or $key -match '\s' -or $key.Contains('PRIVATE KEY') -or $key.TrimStart().StartsWith('{')) {
        throw 'That does not look like the client API key (never use a service-account JSON or private key).'
    }
    $defines.API_BASE_URL = if ($ApiBaseUrl) { $ApiBaseUrl } else { $pins.allowedApiOrigins[0] }
    $defines.API_SECRET_KEY = $key
}

$defineDirectory = Join-Path $appRoot '.dart_tool'
New-Item -ItemType Directory -Path $defineDirectory -Force | Out-Null
$definePath = Join-Path $defineDirectory ('run-defines-' + [Guid]::NewGuid().ToString('N') + '.json')
try {
    [System.IO.File]::WriteAllText($definePath, ($defines | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
    $runArgs = @('run', '-d', $Device, "--dart-define-from-file=$definePath")
    if ($WebPort -gt 0) { $runArgs += "--web-port=$WebPort" }
    "Running YouPeak ($Device) against $($defines.API_BASE_URL) - client key supplied: yes"
    Push-Location $appRoot
    try { & flutter @runArgs } finally { Pop-Location }
} finally {
    Remove-Item -LiteralPath $definePath -Force -ErrorAction SilentlyContinue
    $key = $null
}
