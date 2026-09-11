<#
Usage:
  .\Update-AppId.ps1 downloadedExtendSource.zip original_app_reference_id new_app_reference_id

Output:
  new_app_reference_id.zip
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ZipFile,

    [Parameter(Mandatory=$true)]
    [string]$SearchString,

    [Parameter(Mandatory=$true)]
    [string]$ReplaceString
)

# ---- Helpers ----
function Capitalize-First {
    param([string]$s)
    if ([string]::IsNullOrEmpty($s)) { return $s }
    return $s.Substring(0,1).ToUpper() + $s.Substring(1)
}

$SearchCap  = Capitalize-First $SearchString
$ReplaceCap = Capitalize-First $ReplaceString

if (!(Test-Path $ZipFile)) {
    Write-Error "ZIP file not found: $ZipFile"
    exit 1
}

$WorkDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid())
$OutputZip = Join-Path (Get-Location) "$ReplaceString.zip"

try {
    New-Item -ItemType Directory -Path $WorkDir | Out-Null

    # ---- Unzip ----
    Expand-Archive -Path $ZipFile -DestinationPath $WorkDir -Force

    # ---- Replace strings in ALL files ----
    Get-ChildItem -Path $WorkDir -Recurse -File | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -ne $content) {
            $content = $content.Replace($SearchString, $ReplaceString)
            $content = $content.Replace($SearchCap,  $ReplaceCap)
            Set-Content $_.FullName $content -NoNewline
        }
    }

    # ---- Rebuild zip ----
    if (Test-Path $OutputZip) {
        Remove-Item $OutputZip -Force
    }

    Compress-Archive -Path (Join-Path $WorkDir '*') -DestinationPath $OutputZip

    Write-Host "✅ Updated zip created: $OutputZip"
}
finally {
    Remove-Item $WorkDir -Recurse -Force -ErrorAction SilentlyContinue
}

