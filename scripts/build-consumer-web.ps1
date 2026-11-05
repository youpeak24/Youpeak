param(
    [string]$ApiBaseUrl = 'https://api.youpeak.app/',
    [string]$AppDomain = 'youpeak.app'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $projectRoot 'Youpeak_Flutter'
$clientKey = $env:YOUPEAK_API_SECRET_KEY
if ([string]::IsNullOrWhiteSpace($clientKey)) {
    throw 'Set YOUPEAK_API_SECRET_KEY to the backend secretKey value locally, then rerun. Do not use a Firebase private key or an R2 secret.'
}
if ($clientKey.Contains('PRIVATE KEY') -or $clientKey.TrimStart().StartsWith('{')) {
    throw 'This build accepts only the client API key, never a service-account JSON or private key.'
}
$apiUri = [Uri]$ApiBaseUrl
if (-not $apiUri.IsAbsoluteUri -or $apiUri.Scheme -ne 'https' -or $apiUri.UserInfo -or $apiUri.Query -or $apiUri.Fragment -or $apiUri.AbsolutePath -ne '/') {
    throw 'ApiBaseUrl must be a bare HTTPS API origin with a trailing slash.'
}
if ($AppDomain -notmatch '^[a-zA-Z0-9.-]+$') { throw 'AppDomain must be a bare hostname.' }

# Flutter embeds this client key in the browser bundle. Server credentials
# belong only on the admin/API Vercel project.
$defineDirectory = Join-Path $appRoot '.dart_tool'
New-Item -ItemType Directory -Path $defineDirectory -Force | Out-Null
$definePath = Join-Path $defineDirectory ('consumer-defines-' + [Guid]::NewGuid().ToString('N') + '.json')
# BUILD_PROFILE is required: a release build without it refuses to start
# (Youpeak_Flutter/lib/core/config/build_config.dart).
$defines = @{
    BUILD_PROFILE = 'production'
    BUILD_ID = ('web-' + (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss'))
    API_BASE_URL = $apiUri.AbsoluteUri
    APP_DOMAIN = $AppDomain
    API_SECRET_KEY = $clientKey
    USE_LOCAL_DEV = 'false'
    FIRESTORE_EMULATOR = ''
    AUTH_EMULATOR = ''
}
try {
    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($definePath, ($defines | ConvertTo-Json), $utf8WithoutBom)
    Push-Location $appRoot
    try {
        & flutter build web --release --no-wasm-dry-run "--dart-define-from-file=$definePath"
        if ($LASTEXITCODE -ne 0) { throw 'Flutter web build failed.' }
    } finally { Pop-Location }
    $outputRoot = Join-Path $appRoot 'build/web'
    $staticConfig = Get-Content -LiteralPath (Join-Path $appRoot 'web/vercel.json') -Raw | ConvertFrom-Json
    foreach ($rule in $staticConfig.rewrites) {
        if ($rule.destination.StartsWith('https://api.youpeak.app/')) {
            $rule.destination = $apiUri.AbsoluteUri + $rule.destination.Substring('https://api.youpeak.app/'.Length)
        }
    }
    [System.IO.File]::WriteAllText((Join-Path $outputRoot 'vercel.json'), ($staticConfig | ConvertTo-Json -Depth 10), $utf8WithoutBom)
    if (-not (Test-Path -LiteralPath (Join-Path $outputRoot 'index.html')) -or
        -not (Test-Path -LiteralPath (Join-Path $outputRoot 'main.dart.js'))) {
        throw 'Consumer output is incomplete.'
    }
    Write-Output "Consumer web build prepared at: $outputRoot"
    Write-Output 'Preview and validate this build before assigning the production domains.'
} finally {
    Remove-Item -LiteralPath $definePath -Force -ErrorAction SilentlyContinue
}
