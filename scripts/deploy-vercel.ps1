# Deploys one YouPeak Vercel project from its own folder.
#
# Each deployable folder is linked to its own Vercel project through
# <folder>/.vercel/project.json. The script never relies on a link stored in a
# parent folder, because the Vercel CLI reads only the directory it runs from.
#
#   landing   -> landing/        (project: landing)
#   admin     -> admin-panel/    (project: admin)
#   api       -> functions/      (project: api, also serves api.youpeak.app)
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target landing
#   add -Prod for production; add -DryRun to print the commands only.
param(
  [Parameter(Mandatory = $true)][ValidateSet('landing', 'admin', 'api')][string]$Target,
  [switch]$Prod,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$folders = @{
  landing = Join-Path $root 'landing'
  admin   = Join-Path $root 'admin-panel'
  api     = Join-Path $root 'functions'
}

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

$dir = $folders[$Target]
if (-not (Test-Path -LiteralPath $dir)) { throw "Folder not found: $dir" }

# Link the folder to its project the first time (you pick the project in the prompt).
$projectId = Get-ProjectId $dir
if (-not $projectId) {
  Write-Output "$Target is not linked yet. Choose the matching Vercel project in the prompt."
  Invoke-Vercel @('link', '--cwd', $dir)
  $projectId = Get-ProjectId $dir
  if (-not $projectId -and -not $DryRun) { throw "$Target link was not created." }
}

# Each folder must map to a different project. The API and admin/landing links
# must never resolve to the same ID.
foreach ($other in $folders.Keys) {
  if ($other -eq $Target) { continue }
  $otherId = Get-ProjectId $folders[$other]
  if ($projectId -and $otherId -and $projectId -eq $otherId) {
    throw "$Target and $other are linked to the same Vercel project. Delete $($folders[$Target])/.vercel and link it again."
  }
}

Write-Output "Target: $Target  Directory: $dir  Production: $($Prod.IsPresent)"
$deployArgs = @('--cwd', $dir)
if ($Prod) { $deployArgs += '--prod' }
Invoke-Vercel $deployArgs
