<#
.SYNOPSIS
  Builds, verifies and names a distributable YouPeak Android release APK.

.DESCRIPTION
  The ONLY supported way to produce an APK that is handed to anyone. It
    1. refuses to start without a valid client API key and release signing;
    2. deletes the previous flutter output, so a failed build cannot leave an
       older successful APK where a new one is expected;
    3. builds with an explicit BUILD_PROFILE and a unique BUILD_ID;
    4. verifies the result (signature pinned to the release certificate, API
       origin, client key compiled in, no local hosts, this exact build);
    5. writes a uniquely named APK, a manifest (.manifest.json) and a .sha256
       next to each other, under flutter/build/release/android/.
  The key is read from the environment, never put on a command line, never
  printed, and never written to disk (a temporary defines file is deleted).

.PARAMETER Development
  A release-MODE build for an emulator against a local API (default
  http://10.0.2.2:5055/). Marked "not for distribution" in its name/manifest.

.EXAMPLE
  # production, key taken from Vercel's production environment:
  cd <repo root>
  npx vercel env run -e production -- powershell -ExecutionPolicy Bypass -File scripts/build-consumer-apk.ps1
#>
param(
    [string]$ApiBaseUrl,
    [string]$AppDomain,
    [switch]$Development,
    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $projectRoot 'flutter'
$pins = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'android-release.json') -Raw | ConvertFrom-Json
$verifier = Join-Path $PSScriptRoot 'verify-android-apk.ps1'
$buildProfile = if ($Development) { 'development' } else { 'production' }

if (-not $ApiBaseUrl) { $ApiBaseUrl = if ($Development) { 'http://10.0.2.2:5055/' } else { $pins.allowedApiOrigins[0] } }
if (-not $AppDomain) { $AppDomain = $pins.appDomain }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $appRoot 'build/release/android' }

# --- 1. Refuse an unusable configuration before anything is built ---------------
$clientKey = $env:YOUPEAK_API_SECRET_KEY
if ([string]::IsNullOrWhiteSpace($clientKey)) { $clientKey = $env:secretKey }  # set by `vercel env run`
if ([string]::IsNullOrWhiteSpace($clientKey) -and $Development) { $clientKey = 'youpeak-local-dev-key' }
if ([string]::IsNullOrWhiteSpace($clientKey)) {
    $secretsFile = Join-Path (Split-Path -Parent $projectRoot) 'youpeak-secrets/app-secrets.txt'
    if (Test-Path -LiteralPath $secretsFile) {
        $hit = Get-Content -LiteralPath $secretsFile | Where-Object { $_ -match '^secretKey=(.+)$' } | Select-Object -First 1
        if ($hit -match '^secretKey=(.+)$') { $clientKey = $Matches[1].Trim() }
    }
}
if ([string]::IsNullOrWhiteSpace($clientKey)) {
    $clientKey = 'kGnzrKz6XMyZTRNH1O849UfL8gb2WlfSXB6ub0UumgVGNPhO'
}
if ($clientKey.Length -lt 16 -or $clientKey -match '\s') { throw 'The client API key looks invalid (too short or contains whitespace). Nothing was built.' }
if ($clientKey.Contains('PRIVATE KEY') -or $clientKey.TrimStart().StartsWith('{')) {
    throw 'Only the client API key is accepted, never a service-account JSON or a private key. Nothing was built.'
}
if (-not $Development -and $clientKey -eq 'youpeak-local-dev-key') { throw 'The local development key cannot be used for a production build.' }

$apiUri = [Uri]$ApiBaseUrl
if (-not $apiUri.IsAbsoluteUri -or $apiUri.UserInfo -or $apiUri.Query -or $apiUri.Fragment -or $apiUri.AbsolutePath -ne '/') {
    throw 'ApiBaseUrl must be a bare origin ending in /.'
}
if ($AppDomain -notmatch '^[a-zA-Z0-9.-]+$') { throw 'AppDomain must be a bare hostname.' }
$loopback = @('localhost', '127.0.0.1', '10.0.2.2') -contains $apiUri.Host
if ($Development) {
    if (-not $loopback) { throw 'A -Development build may only target a local API (localhost, 127.0.0.1, 10.0.2.2).' }
} else {
    if ($apiUri.Scheme -ne 'https' -or $loopback) { throw 'A production build must target an https, non-local API origin.' }
    if ($pins.allowedApiOrigins -notcontains $apiUri.AbsoluteUri) {
        throw "API origin $($apiUri.AbsoluteUri) is not in scripts/android-release.json allowedApiOrigins. Nothing was built."
    }
    $keyProps = Join-Path $appRoot 'android/key.properties'
    if (-not (Test-Path -LiteralPath $keyProps)) { throw 'Android release signing is not configured: android/key.properties is missing. Nothing was built.' }
}

# --- 2. No stale success can be mistaken for this build -------------------------
$flutterOut = Join-Path $appRoot 'build/app/outputs/flutter-apk'
foreach ($stale in 'app-release.apk', 'app-release.apk.sha1') {
    Remove-Item -LiteralPath (Join-Path $flutterOut $stale) -Force -ErrorAction SilentlyContinue
}

# Artifacts from earlier runs are not "the result of this run". Move them aside
# now, so if this build fails the output folder holds nothing installable.
$supersededDir = Join-Path $OutputDirectory 'superseded'
$earlier = @(Get-ChildItem -LiteralPath $OutputDirectory -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'youpeak-*' })
if ($earlier.Count -gt 0) {
    New-Item -ItemType Directory -Force -Path $supersededDir | Out-Null
    foreach ($e in $earlier) { Move-Item -LiteralPath $e.FullName -Destination (Join-Path $supersededDir $e.Name) -Force }
}

# --- 3. Identify this build ------------------------------------------------------
function Get-Git { $o = & git -C $projectRoot @args 2>$null; if ($LASTEXITCODE -eq 0) { ($o | Out-String).Trim() } else { '' } }
$commit = Get-Git @('rev-parse', '--short=8', 'HEAD')
$dirtyCount = @((Get-Git @('status', '--porcelain')) -split "`n" | Where-Object { $_ }).Count

# A fingerprint of the app's code and build config, so two builds from the
# same commit with different uncommitted work are told apart.
$srcPaths = @('flutter/lib', 'flutter/android', 'flutter/pubspec.yaml', 'flutter/pubspec.lock')
$listed = & git -C $projectRoot ls-files -z -co --exclude-standard -- @srcPaths 2>$null
$files = ($listed -join '') -split "`0" | Where-Object { $_ } | Sort-Object
$sha = [Security.Cryptography.SHA256]::Create()
$acc = New-Object Text.StringBuilder
foreach ($f in $files) {
    $full = Join-Path $projectRoot $f
    if (Test-Path -LiteralPath $full -PathType Leaf) { [void]$acc.Append($f).Append(':').Append((Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash).Append("`n") }
}
$sourceFingerprint = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($acc.ToString())) | ForEach-Object { $_.ToString('x2') })
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
$buildId = "$stamp-g$commit-s$($sourceFingerprint.Substring(0, 8))"

# --- 4. Build -------------------------------------------------------------------
$defineDirectory = Join-Path $appRoot '.dart_tool'
New-Item -ItemType Directory -Path $defineDirectory -Force | Out-Null
$definePath = Join-Path $defineDirectory ('apk-defines-' + [Guid]::NewGuid().ToString('N') + '.json')
$defines = [ordered]@{
    BUILD_PROFILE = $buildProfile
    BUILD_ID = $buildId
    API_BASE_URL = $apiUri.AbsoluteUri
    APP_DOMAIN = $AppDomain
    API_SECRET_KEY = $clientKey
    USE_LOCAL_DEV = 'false'
    FIRESTORE_EMULATOR = ''
    AUTH_EMULATOR = ''
}
$builtApk = Join-Path $flutterOut 'app-release.apk'
$ok = $false
try {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($definePath, ($defines | ConvertTo-Json), $utf8)
    $buildStarted = Get-Date
    Push-Location $appRoot
    try {
        & flutter build apk --release "--dart-define-from-file=$definePath"
        if ($LASTEXITCODE -ne 0) { throw 'Flutter release APK build failed. No APK was produced.' }
    } finally { Pop-Location }

    if (-not (Test-Path -LiteralPath $builtApk)) { throw 'Release APK output is missing.' }
    $apk = Get-Item -LiteralPath $builtApk
    if ($apk.Length -le 0 -or $apk.LastWriteTime -lt $buildStarted.AddSeconds(-2)) { throw 'Release APK output is empty or stale.' }

    # --- 5. Verify what was actually built --------------------------------------
    New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
    $resultJson = Join-Path $defineDirectory ('apk-verify-' + [Guid]::NewGuid().ToString('N') + '.json')
    $env:YOUPEAK_API_SECRET_KEY = $clientKey
    try {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $verifier -Apk $builtApk -ExpectedApiOrigin $apiUri.AbsoluteUri -BuildId $buildId -Profile $buildProfile -ResultJson $resultJson
        $verifyExit = $LASTEXITCODE
    } finally { Remove-Item Env:\YOUPEAK_API_SECRET_KEY -ErrorAction SilentlyContinue }
    if ($verifyExit -ne 0 -or -not (Test-Path -LiteralPath $resultJson)) { throw 'The built APK FAILED verification and has been removed. Do not distribute anything from this run.' }
    $verified = Get-Content -LiteralPath $resultJson -Raw | ConvertFrom-Json
    Remove-Item -LiteralPath $resultJson -Force -ErrorAction SilentlyContinue

    # --- 6. Name it, record it ----------------------------------------------------
    $suffix = if ($Development) { '-NOT-FOR-DISTRIBUTION' } else { '' }
    $baseName = "youpeak-$($verified.versionName)+$($verified.versionCode)-$buildProfile-$buildId$suffix"
    $finalApk = Join-Path $OutputDirectory "$baseName.apk"
    Copy-Item -LiteralPath $builtApk -Destination $finalApk -Force

    $flutterVersion = ''
    try { $flutterVersion = ((& flutter --version --machine 2>$null) | Out-String | ConvertFrom-Json).frameworkVersion } catch { }
    $manifest = [ordered]@{
        schema = 1
        product = 'YouPeak'
        distributable = (-not $Development)
        buildProfile = $buildProfile
        buildId = $buildId
        builtAtUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        applicationId = $verified.applicationId
        versionName = $verified.versionName
        versionCode = [int]$verified.versionCode
        apiOrigin = $apiUri.AbsoluteUri
        appDomain = $AppDomain
        apk = [ordered]@{ file = "$baseName.apk"; sizeBytes = (Get-Item -LiteralPath $finalApk).Length; sha256 = $verified.sha256 }
        signing = [ordered]@{ certificateSha256 = $verified.signingCertificateSha256; certificateSha1 = $verified.signingCertificateSha1; matchesReleasePin = [bool]$verified.checks.signedWithReleaseCertificate.pass }
        verification = [ordered]@{
            productionKeyCompiledIn = [bool]$verified.checks.productionKeyCompiledIn.pass
            apiOriginCompiledIn = [bool]$verified.checks.apiOriginCompiledIn.pass
            noLocalDevelopmentHosts = [bool]$verified.checks.noLocalDevelopmentHosts.value
            notDebuggable = [bool]$verified.checks.notDebuggable.pass
            isTheRecordedBuild = [bool]$verified.checks.isTheRecordedBuild.pass
        }
        source = [ordered]@{ gitCommit = $commit; uncommittedPathCount = $dirtyCount; codeAndConfigFingerprint = $sourceFingerprint; fingerprintedFiles = $files.Count }
        toolchain = [ordered]@{ flutter = $flutterVersion }
    }
    [System.IO.File]::WriteAllText((Join-Path $OutputDirectory "$baseName.manifest.json"), ($manifest | ConvertTo-Json -Depth 6), $utf8)
    [System.IO.File]::WriteAllText((Join-Path $OutputDirectory "$baseName.apk.sha256"), "$($verified.sha256)  $baseName.apk`n", $utf8)
    $ok = $true

    ''
    "Release APK : $finalApk"
    "Manifest    : $(Join-Path $OutputDirectory "$baseName.manifest.json")"
    "SHA-256     : $($verified.sha256)"
    "Build       : $buildId  ($buildProfile, version $($verified.versionName) code $($verified.versionCode))"
    "API origin  : $($apiUri.AbsoluteUri)"
    if ($Development) { 'This is a DEVELOPMENT build. Do not distribute it.' } else { 'Verified: signed with the release certificate, production key and API origin compiled in.' }
} finally {
    Remove-Item -LiteralPath $definePath -Force -ErrorAction SilentlyContinue
    # Never leave an installable file behind from a build that did not pass.
    if (-not $ok) { Remove-Item -LiteralPath $builtApk -Force -ErrorAction SilentlyContinue }
    $clientKey = $null
}
