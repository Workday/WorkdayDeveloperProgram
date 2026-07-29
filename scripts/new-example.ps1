# Same as new-example.mjs but for Windows machines without Node. Copies
# examples/_template and fills in the title and type.
#
#   powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 my-example-name
#   powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 my-example-name -Type "Orchestration" -Title "My Example"

param(
  [Parameter(Position=0)][string]$Name,
  [string]$Type,
  [string]$Title
)

$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host $msg
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$config = Get-Content "$root\hub.config.json" -Raw | ConvertFrom-Json

if (-not $Name -or $Name.StartsWith("-")) {
  Fail 'Usage: powershell -ExecutionPolicy Bypass -File scripts\new-example.ps1 <folder-name> [-Type "Extend App"] [-Title "My Example"]'
}
if ($Name -cnotmatch '^[a-z0-9][a-z0-9-]*$') {
  Fail "Folder names are kebab-case: lowercase letters, numbers, and hyphens. `"$Name`" is not."
}

if (-not $Type) { $Type = $config.types[0] }
if ($config.types -notcontains $Type) {
  Fail "`"$Type`" is not an approved type. Pick from: $($config.types -join ', ')"
}

if (-not $Title) {
  $Title = ($Name -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ' '
}

$dir = "$root\examples\$Name"
if (Test-Path $dir) {
  Fail "examples/$Name already exists. Pick another name."
}

Copy-Item "$root\examples\_template" $dir -Recurse

$meta = Get-Content "$dir\example.json" -Raw | ConvertFrom-Json
$meta.title = $Title
$meta.type = $Type
$meta | ConvertTo-Json -Depth 5 | Set-Content "$dir\example.json" -Encoding UTF8

$readme = @(Get-Content "$dir\README.md")
$readme[0] = "# $Title"
$readme | Set-Content "$dir\README.md" -Encoding UTF8

Write-Host "Created examples/$Name (type: $Type)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Drop your artifact into examples/$Name/ (app source, orchestration, skill markdown, diagrams)."
Write-Host "  2. Edit examples/$Name/example.json and README.md."
Write-Host "  3. Open a pull request. CI runs validation for you."
