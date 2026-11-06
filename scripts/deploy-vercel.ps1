# Deploys one YouPeak Vercel project with its own project link.
#
# Why this exists: the repo root has .vercel/project.json linked to the ADMIN/API
# project ("youpeak"). The Vercel CLI only reads the .vercel folder inside the
# directory it runs from, so a landing deploy started from the repo root (for
# example `vercel Youpeak_Landing_Page`) reuses that link and ships to the admin
# project. This script never relies on the implicit root link: each target is
# linked from its own folder, and the landing page is refused if it resolves to
# the admin project.
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target landing
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target api
#   add -Prod for production; add -DryRun to print the commands only.
param(
  [Parameter(Mandatory = $true)][ValidateSet('landing', 'api')][string]$Target,
  [switch]$Prod,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Get-ProjectId([string]$dir) {
  $file = Join-Path $dir '.vercel/project.json'
  if (-not (Test-Path -LiteralPath $file)) { return $null }
  return (Get-Content -LiteralPath $file -Raw | ConvertFrom-Json).projectId
}

function Invoke-Vercel([string[]]$arguments) {
  $shown = 'npx --yes vercel ' + ($arguments -join ' ')
  if ($DryRun) { Write-Output "[dry-run] $shown"; return }
  Write-Output "> $shown"
  & npx --yes vercel @arguments
  if ($LASTEXITCODE -ne 0) { throw "Vercel command failed (exit $LASTEXITCODE)." }
}

# The admin/API project is whatever the repo root is linked to. Nothing else may
# use that ID.
$adminId = Get-ProjectId $root
if (-not $adminId) { throw 'The repo root has no .vercel/project.json for the admin/API project.' }

if ($Target -eq 'landing') {
  $dir = Join-Path $root 'Youpeak_Landing_Page'
  $landingId = Get-ProjectId $dir
  if (-not $landingId) {
    Write-Output 'Youpeak_Landing_Page is not linked yet. Choose the LANDING project in the prompt.'
    Invoke-Vercel @('link', '--cwd', $dir)
    $landingId = Get-ProjectId $dir
    if (-not $landingId -and -not $DryRun) { throw 'Landing link was not created.' }
  }
  if ($landingId -and $landingId -eq $adminId) { throw 'Youpeak_Landing_Page is linked to the admin/API project. Delete Youpeak_Landing_Page/.vercel and run again.' }
} else {
  $dir = $root
  if ((Get-ProjectId $dir) -ne $adminId) { throw 'The repo root link changed unexpectedly.' }
}

Write-Output "Target: $Target  Directory: $dir  Production: $($Prod.IsPresent)"
$deployArgs = @('--cwd', $dir)
if ($Prod) { $deployArgs += '--prod' }
Invoke-Vercel $deployArgs
