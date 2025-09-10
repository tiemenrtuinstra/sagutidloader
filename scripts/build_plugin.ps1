# Build script for sagutidloader Joomla plugin
# Run from repository root (PowerShell):
#   .\scripts\build_plugin.ps1
# This script creates a zip archive named sagutidloader.zip including the files needed for installation.

Param(
    [string]$Out = "sagutidloader.zip"
)

$root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent | Split-Path -Parent
Set-Location $root

Write-Host "Building plugin package in: $root"

# Files and folders to include (relative to repo root)
$include = @(
    'sagutidloader.php',
    'sagutidlogger.php',
    'sagutidloader.xml',
    'readme.MD',
    'manifest-checksum.txt',
    'assets',
    'language'
)

# Remove previous zip if exists
if (Test-Path $Out) { Remove-Item $Out -Force }

# Build a temporary staging folder to ensure the zip structure is correct
$staging = Join-Path $env:TEMP "sagutidloader_build_$(Get-Random)"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -Path $staging -ItemType Directory | Out-Null

try {
    foreach ($item in $include) {
        $src = Join-Path $root $item
        if (-not (Test-Path $src)) {
            Write-Warning "Skipping missing path: $item"
            continue
        }
        $dest = Join-Path $staging $item
        $parent = Split-Path $dest -Parent
        if (-not (Test-Path $parent)) { New-Item -Path $parent -ItemType Directory -Force | Out-Null }

        if (Test-Path $src -PathType Container) {
            # copy directory recursively
            Copy-Item -Path $src -Destination $dest -Recurse -Force
        } else {
            Copy-Item -Path $src -Destination $dest -Force
        }
    }

    # Create zip from staging folder
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path $Out) { Remove-Item $Out -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($staging, (Join-Path $root $Out))
    Write-Host "Created package: $Out"
} catch {
    Write-Error "Build failed: $_"
    exit 1
} finally {
    # Clean up staging
    if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
}

Write-Host "Done. You can now upload $Out to Joomla installer or update server."
