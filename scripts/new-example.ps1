# Creates a new example folder from examples/_template. Same job as
# new-example.mjs, for machines without Node.
#
#   powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 my-example-name
#   powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 my-example-name -Type "Orchestration" -Title "My Example"

param(
  [Parameter(Position = 0)] [string]$Name,
  [string]$Type,
  [string]$Title
)

$ErrorActionPreference = "Stop"

function Bail($Message) {
  Write-Host $Message
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$config = Get-Content (Join-Path $root "hub.config.json") -Raw | ConvertFrom-Json

if (-not $Name -or $Name.StartsWith("-")) {
  Bail 'Usage: powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 <folder-name> [-Type "Extend App"] [-Title "My Example"]'
}
if ($Name -cnotmatch '^[a-z0-9][a-z0-9-]*$') {
  Bail "Folder names are kebab-case: lowercase letters, numbers, and hyphens. `"$Name`" is not."
}

if (-not $Type) { $Type = $config.types[0] }
if ($config.types -notcontains $Type) {
  Bail "`"$Type`" is not an approved type. Pick from: $($config.types -join ', ')"
}

if (-not $Title) {
  $Title = ($Name -split "-" | ForEach-Object { $_.Substring(0, 1).ToUpper() + $_.Substring(1) }) -join " "
}

$dir = Join-Path $root (Join-Path "examples" $Name)
if (Test-Path $dir) {
  Bail "examples/$Name already exists. Pick another name."
}

Copy-Item (Join-Path $root (Join-Path "examples" "_template")) $dir -Recurse

$metaPath = Join-Path $dir "example.json"
$meta = Get-Content $metaPath -Raw | ConvertFrom-Json
$meta.title = $Title
$meta.type = $Type
$meta | ConvertTo-Json -Depth 5 | Set-Content $metaPath -Encoding UTF8

$readmePath = Join-Path $dir "README.md"
$lines = @(Get-Content $readmePath)
$lines[0] = "# $Title"
$lines | Set-Content $readmePath -Encoding UTF8

Write-Host "Created examples/$Name (type: $Type)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Drop your artifact into examples/$Name/ (app source, orchestration, skill markdown, diagrams)."
Write-Host "  2. Edit examples/$Name/example.json and README.md."
Write-Host "  3. Open a pull request. CI runs validation for you."
