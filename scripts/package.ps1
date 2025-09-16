param(
    [string]$SourceDir = $PSScriptRoot,
    [string]$ManifestPath,
    [string]$OutputZip,
    [switch]$SkipBuild,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "[packege] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[packege] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[packege] $msg" -ForegroundColor Red }

try {
    if (-not (Test-Path $SourceDir)) {
        throw "SourceDir not found: $SourceDir"
    }

    Push-Location $SourceDir

    # Discover manifest if not provided
    if (-not $ManifestPath) {
        $candidates = Get-ChildItem -File -Filter *.xml | ForEach-Object { $_.FullName }
        foreach ($xmlFile in $candidates) {
            try {
                [xml]$xml = Get-Content $xmlFile -ErrorAction Stop
                if ($xml.extension -and $xml.extension.type -eq 'plugin') {
                    $ManifestPath = $xmlFile
                    break
                }
            } catch {
                # ignore parse errors and keep looking
            }
        }
    }

    if (-not $ManifestPath) {
        throw "Could not find a Joomla plugin manifest (*.xml with extension[@type='plugin']). Use -ManifestPath to specify it."
    }

    Write-Step "Using manifest: $ManifestPath"
    [xml]$manifest = Get-Content $ManifestPath

    # Determine plugin folder/name from <filename plugin="name"> element
    $pluginName = $null
    $pluginPhp  = $null
    $fileNodes  = $manifest.extension.files.filename
    if ($fileNodes) {
        foreach ($node in $fileNodes) {
            if ($node.plugin) {
                $pluginName = [string]$node.plugin
            }
            if (-not $pluginPhp) { $pluginPhp = [string]$node.'#text' }
        }
    }
    if (-not $pluginName) {
        # Fallback to manifest file name without extension
        $pluginName = [IO.Path]::GetFileNameWithoutExtension($ManifestPath)
        Write-Warn "Could not read <filename plugin=...>. Falling back to: $pluginName"
    }
    if (-not $OutputZip) {
        $OutputZip = Join-Path $SourceDir ("$pluginName.zip")
    }

    $buildRoot  = Join-Path $SourceDir 'build'
    $stageDir   = Join-Path $buildRoot $pluginName

    Write-Step "Staging to: $stageDir"
    if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
    New-Item -ItemType Directory -Path $stageDir | Out-Null

    # Optional build step
    if (-not $SkipBuild) {
        if (Test-Path (Join-Path $SourceDir 'package.json')) {
            try {
                Write-Step 'Installing dependencies (npm ci || npm install)...'
                if (Test-Path (Join-Path $SourceDir 'package-lock.json')) {
                    npm ci --no-fund --no-audit | Out-Null
                } else {
                    npm install --no-fund --no-audit | Out-Null
                }
                if ((Get-Content (Join-Path $SourceDir 'package.json') | Out-String) -match '"build:prod"') {
                    Write-Step 'Running build:prod'
                    npm run build:prod
                } else {
                    Write-Warn 'No build:prod script found. Skipping build.'
                }
            } catch {
                Write-Warn "Build step failed or npm not available: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Step 'SkipBuild enabled. Skipping build phase.'
    }

    # Copy required items into stage
    $manifestName = Split-Path $ManifestPath -Leaf
    Copy-Item $ManifestPath (Join-Path $stageDir $manifestName) -Force

    if ($pluginPhp -and (Test-Path (Join-Path $SourceDir $pluginPhp))) {
        Copy-Item (Join-Path $SourceDir $pluginPhp) $stageDir -Force
    } else {
        # Try best-effort: copy any PHP that matches plugin name
        $fallbackPhp = Get-ChildItem -Path $SourceDir -Filter "$pluginName*.php" -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($fallbackPhp) {
            Copy-Item $fallbackPhp.FullName $stageDir -Force
        } else {
            Write-Warn 'Could not find plugin PHP file to copy.'
        }
    }

    foreach ($folder in @('assets','language')) {
        $src = Join-Path $SourceDir $folder
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $stageDir $folder) -Recurse -Force
        }
    }

    Write-Step "Output zip: $OutputZip"

    if ($DryRun) {
        Write-Step 'DryRun enabled. Contents to be zipped:'
        Get-ChildItem -Recurse -File -Path $stageDir | ForEach-Object { $_.FullName.Replace($stageDir, '.') }
    } else {
        if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force }
        Push-Location $stageDir
        try {
            Compress-Archive -Path * -DestinationPath $OutputZip
        } finally {
            Pop-Location
        }
        Write-Host "Created: $OutputZip" -ForegroundColor Green
    }
}
catch {
    Write-Err $_.Exception.Message
    exit 1
}
finally {
    Pop-Location 2>$null | Out-Null
}
