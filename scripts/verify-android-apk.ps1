<#
.SYNOPSIS
  Verifies that an Android APK is a usable YouPeak release, without ever
  printing the client API key.

.DESCRIPTION
  Works on any APK, including one you were handed. Checks:
    - it is a signed, non-debuggable APK of the right application id;
    - it is signed with the pinned release certificate (scripts/android-release.json);
    - the production API origin is compiled in and no local-development hosts are;
    - the client API key is compiled in (needs YOUPEAK_API_SECRET_KEY in the
      environment; without it this check is reported as "not checked" and the
      result is NOT a pass);
    - optionally that it is the build recorded by -BuildId.
  Only true/false is reported for the key. Exit code 0 = every required check
  passed; 1 = at least one failed or could not be checked.

.EXAMPLE
  # key from the environment Vercel already holds, without printing it
  npx vercel env run -e production -- powershell -File scripts/verify-android-apk.ps1 -Apk app.apk
#>
param(
    [Parameter(Mandatory = $true)][string]$Apk,
    [string]$ExpectedApiOrigin,
    [string]$BuildId,
    [string]$ResultJson,
    [ValidateSet("production", "development")][string]$Profile = "production",
    [switch]$AllowUncheckedKey
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pins = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'android-release.json') -Raw | ConvertFrom-Json
if (-not $ExpectedApiOrigin) { $ExpectedApiOrigin = $pins.allowedApiOrigins[0] }
if (-not (Test-Path -LiteralPath $Apk)) { throw "APK not found: $Apk" }
$Apk = (Resolve-Path -LiteralPath $Apk).Path

function Find-SdkTool([string]$name) {
    $roots = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk')) | Where-Object { $_ -and (Test-Path $_) }
    foreach ($root in $roots) {
        $hit = Get-ChildItem -Path (Join-Path $root 'build-tools') -Recurse -Filter $name -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    throw "Android SDK build-tools ($name) not found. Install the Android SDK build-tools."
}

$checks = [ordered]@{}
function Add-Check([string]$name, [object]$value, [bool]$ok, [string]$detail = '') {
    $checks[$name] = [ordered]@{ value = $value; pass = $ok; detail = $detail }
}

# -- Identity, signing, debuggable --------------------------------------------
$apksigner = Find-SdkTool 'apksigner.bat'
$aapt2 = Find-SdkTool 'aapt2.exe'

$signOut = & $apksigner verify --print-certs $Apk 2>&1
$verified = ($LASTEXITCODE -eq 0)
$sha256 = ($signOut | Select-String 'certificate SHA-256 digest: ([0-9a-f]+)' | Select-Object -First 1).Matches.Groups[1].Value
$sha1 = ($signOut | Select-String 'certificate SHA-1 digest: ([0-9a-f]+)' | Select-Object -First 1).Matches.Groups[1].Value
Add-Check 'signatureVerifies' $verified $verified
# A development build may be signed with the debug key; only production is pinned.
$certOk = $verified -and ($Profile -eq "development" -or $sha256 -eq $pins.signingCertificateSha256)
$found = if ($sha256) { $sha256.Substring(0, 12) + "..." } else { "none" }
Add-Check "signedWithReleaseCertificate" $sha256 $certOk "expected $($pins.signingCertificateSha256.Substring(0, 12))..., found $found$(if ($Profile -eq "development") { "; not pinned for a development build" })"

$badging = & $aapt2 dump badging $Apk 2>$null
$pkg = ($badging | Select-String "^package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'" | Select-Object -First 1).Matches.Groups
$appId = $pkg[1].Value; $versionCode = $pkg[2].Value; $versionName = $pkg[3].Value
Add-Check 'applicationId' $appId ($appId -eq $pins.applicationId)
$debuggable = [bool]($badging | Select-String 'application-debuggable')
Add-Check 'notDebuggable' (-not $debuggable) (-not $debuggable)

# -- Compiled-in configuration (from the AOT libraries) -----------------------
Add-Type -AssemblyName System.IO.Compression.FileSystem
$latin1 = [Text.Encoding]::GetEncoding(28591)
$zip = [IO.Compression.ZipFile]::OpenRead($Apk)
$libs = @()
try {
    foreach ($entry in ($zip.Entries | Where-Object { $_.FullName -match '^lib/[^/]+/libapp\.so$' })) {
        $ms = New-Object IO.MemoryStream
        $s = $entry.Open(); $s.CopyTo($ms); $s.Dispose()
        $libs += [pscustomobject]@{ abi = ($entry.FullName -split '/')[1]; text = $latin1.GetString($ms.ToArray()) }
        $ms.Dispose()
    }
} finally { $zip.Dispose() }
Add-Check 'dartLibrariesFound' $libs.Count ($libs.Count -gt 0) 'AOT libapp.so per ABI'

$origin = $ExpectedApiOrigin
$allHave = { param($pred) ($libs.Count -gt 0) -and (@($libs | Where-Object { -not (& $pred $_.text) }).Count -eq 0) }

Add-Check 'apiOriginCompiledIn' $origin (& $allHave { param($t) $t.Contains($origin) }) 'in every ABI'

$localMarkers = @('youpeak-local-dev-key', ':5055/', '127.0.0.1:8095', '127.0.0.1:9095', 'localhost:5055')
$foundLocal = @()
foreach ($m in $localMarkers) { if (@($libs | Where-Object { $_.text.Contains($m) }).Count -gt 0) { $foundLocal += $m } }
$localOk = ($foundLocal.Count -eq 0) -or ($Profile -eq "development")
Add-Check "noLocalDevelopmentHosts" ($foundLocal.Count -eq 0) $localOk $(if ($foundLocal.Count) { "found: " + ($foundLocal -join ", ") + $(if ($Profile -eq "development") { " (allowed in a development build)" }) } else { "" })

$key = $env:YOUPEAK_API_SECRET_KEY
if ([string]::IsNullOrWhiteSpace($key) -and $env:secretKey) { $key = $env:secretKey }
if ([string]::IsNullOrWhiteSpace($key)) {
    Add-Check 'productionKeyCompiledIn' 'not checked' $AllowUncheckedKey.IsPresent 'set YOUPEAK_API_SECRET_KEY (or run under vercel env run) to check'
} else {
    $has = & $allHave { param($t) $t.Contains($key) }
    Add-Check 'productionKeyCompiledIn' $has $has 'in every ABI; value never printed'
}

if ($BuildId) {
    Add-Check 'isTheRecordedBuild' $BuildId (& $allHave { param($t) $t.Contains($BuildId) }) 'BUILD_ID string present in every ABI'
}
$key = $null

# -- Result -------------------------------------------------------------------
$hash = (Get-FileHash -LiteralPath $Apk -Algorithm SHA256).Hash.ToLower()
$allPass = (@($checks.Values | Where-Object { -not $_.pass }).Count -eq 0)
$result = [ordered]@{
    apk = $Apk; sha256 = $hash; sizeBytes = (Get-Item -LiteralPath $Apk).Length
    applicationId = $appId; versionName = $versionName; versionCode = $versionCode
    signingCertificateSha256 = $sha256; signingCertificateSha1 = $sha1
    apiOrigin = $origin; pass = $allPass; checks = $checks
}
if ($ResultJson) { [IO.File]::WriteAllText($ResultJson, ($result | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false))) }

"APK            : $Apk"
"SHA-256        : $hash"
"Application    : $appId  version $versionName ($versionCode)"
"Signing cert   : SHA-256 $sha256"
foreach ($name in $checks.Keys) {
    $c = $checks[$name]
    $mark = if ($c.pass) { 'PASS' } else { 'FAIL' }
    $shown = if ($c.value -is [bool]) { $c.value.ToString().ToLower() } else { [string]$c.value }
    if ($name -in 'signedWithReleaseCertificate') { $shown = '' }
    "{0}  {1,-30} {2} {3}" -f $mark, $name, $shown, $(if ($c.detail) { "($($c.detail))" } else { '' })
}
if ($allPass) { 'RESULT: usable release build' } else { 'RESULT: NOT a usable release build' }
exit $(if ($allPass) { 0 } else { 1 })
