param(
    [Parameter(Position=0,Mandatory=$true)]
    [ValidateSet("major","minor","patch")]
    [string]$ReleaseType,
    [switch]$Force,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Assert-Tools([string[]]$Names) {
    foreach ($tool in $Names) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Host "Error: Required tool '$tool' not found in PATH." -ForegroundColor Red
            exit 1
        }
    }
}

function Ensure-CleanGit([switch]$Force) {
    $gitStatus = git status --porcelain
    if ($gitStatus -and -not $Force) {
        Write-Warning "Working tree not clean. Commit / stash changes or re-run with -Force."
        exit 1
    }
    Write-Host "Working tree is clean, proceeding with release."
}

function Get-Manifest() {
    $candidates = Get-ChildItem -File -Filter *.xml | ForEach-Object { $_.FullName }
    foreach ($xmlFile in $candidates) {
        try {
            [xml]$xml = Get-Content $xmlFile -ErrorAction Stop
            if ($xml.extension -and $xml.extension.type -eq 'plugin') {
                return [pscustomobject]@{ Path = $xmlFile; Xml = $xml }
            }
        } catch { }
    }
    return $null
}

function Compute-NewVersion([string]$Current,[string]$ReleaseType) {
    $parts = $Current -split '\.'
    if ($parts.Count -lt 3) { throw "Version format must be MAJOR.MINOR.PATCH" }
    [int]$maj = $parts[0]; [int]$min = $parts[1]; [int]$pat = $parts[2]
    switch ($ReleaseType) {
        'major' { $maj++; $min = 0; $pat = 0 }
        'minor' { $min++; $pat = 0 }
        'patch' { $pat++ }
    }
    $nv = "$maj.$min.$pat"
    return [pscustomobject]@{ NewVersion = $nv; CacheName = "sagutid-v$nv" }
}

function Update-VersionFiles([string]$XmlFile,[string]$NewVersion,[string]$PackageJsonFile) {
    [xml]$xml = Get-Content $XmlFile
    $node = $xml.SelectSingleNode("//extension/version")
    if (-not $node) { throw "Could not find <version> node in $XmlFile" }
    $node.InnerText = $NewVersion
    $xml.Save($XmlFile)
    Write-Host "Updated $XmlFile"

    if (Test-Path $PackageJsonFile) {
        $pkg = Get-Content $PackageJsonFile -Raw | ConvertFrom-Json
        $pkg.version = $NewVersion
        $pkg | ConvertTo-Json -Depth 32 | Set-Content $PackageJsonFile -Encoding UTF8
        Write-Host "Updated $PackageJsonFile"
    }
}

function Update-ServiceWorkerCacheName([string]$ServiceWorkerFile,[string]$NewCacheName) {
    if (-not (Test-Path $ServiceWorkerFile)) { Write-Warning "$ServiceWorkerFile not found (skipping)."; return }
    $sw = Get-Content $ServiceWorkerFile -Raw
    $patterns = @(
        '(const\s+CACHE_NAME\s*=\s*`)sagutid-v[^`]+(`;?)',
        '(const\s+CACHE_NAME\s*=\s*'')sagutid-v[^'']+('';?)',
        '(const\s+CACHE_NAME\s*=\s*")sagutid-v[^"]+(";?)'
    )
    $matched = $false
    foreach ($p in $patterns) {
        if ($sw -match $p) {
            $sw = [regex]::Replace($sw, $p, "`$1$NewCacheName`$2")
            $matched = $true; break
        }
    }
    if (-not $matched) { Write-Warning "CACHE_NAME pattern not found in $ServiceWorkerFile" }
    else { Set-Content -Path $ServiceWorkerFile -Value $sw -Encoding UTF8; Write-Host "Updated cache name in $ServiceWorkerFile" }
}

function Run-Build([switch]$SkipBuild) {
    $did = $false
    if (-not (Test-Path 'package.json')) { return $did }
    if ($SkipBuild) { return $did }

    $hasLock = Test-Path -LiteralPath 'package-lock.json'
    $hasMods = Test-Path -LiteralPath 'node_modules'
    if ($hasLock -or $hasMods) { Write-Host 'Running npm install (ensuring dependencies)...' }
    else { Write-Host 'Running initial npm install...' }

    npm install --no-fund --no-audit | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host 'npm install failed.' -ForegroundColor Red; exit 1 }

    Write-Host 'Running build...'
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm run build:prod
        if ($LASTEXITCODE -ne 0) { Write-Host 'Build failed.' -ForegroundColor Red; exit 1 }
        $did = $true
        Write-Host 'Build completed.'
    } else { Write-Warning 'npm command not found; skipping build.' }
    return $did
}

function Package-Plugin([string]$ManifestPath) {
    [xml]$manifest = Get-Content $ManifestPath
    $pluginName = $null; $pluginPhp = $null
    $fileNodes = $manifest.extension.files.filename
    if ($fileNodes) {
        foreach ($node in $fileNodes) {
            if ($node.plugin) { $pluginName = [string]$node.plugin }
            if (-not $pluginPhp) { $pluginPhp = [string]$node.'#text' }
        }
    }
    if (-not $pluginName) { $pluginName = [IO.Path]::GetFileNameWithoutExtension($ManifestPath); Write-Warning "Could not read <filename plugin=...>. Falling back to: $pluginName" }

    $buildRoot = Join-Path (Get-Location) 'build'
    $stageDir  = Join-Path $buildRoot $pluginName
    if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
    New-Item -ItemType Directory -Path $stageDir | Out-Null

    $manifestName = Split-Path $ManifestPath -Leaf
    Copy-Item $ManifestPath (Join-Path $stageDir $manifestName) -Force

    if ($pluginPhp -and (Test-Path (Join-Path (Get-Location) $pluginPhp))) {
        Copy-Item (Join-Path (Get-Location) $pluginPhp) $stageDir -Force
    } else {
        $fallbackPhp = Get-ChildItem -Path (Get-Location) -Filter "$pluginName*.php" -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($fallbackPhp) { Copy-Item $fallbackPhp.FullName $stageDir -Force }
        else { Write-Warning 'Could not find plugin PHP file to copy.' }
    }

    foreach ($folder in @('assets','language')) {
        $src = Join-Path (Get-Location) $folder
        if (Test-Path $src) { Copy-Item $src (Join-Path $stageDir $folder) -Recurse -Force }
    }

    $ZipName = "$pluginName.zip"
    $ZipPath = Join-Path (Get-Location) $ZipName
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Push-Location $stageDir
    try { Compress-Archive -Path * -DestinationPath $ZipPath }
    finally { Pop-Location }
    Write-Host "Created package: $ZipPath" -ForegroundColor Green

    return [pscustomobject]@{ PluginName = $pluginName; StageDir = $stageDir; ZipPath = $ZipPath; ZipName = $ZipName }
}

function Git-Commit-Push-Tag([string]$NewVersion,[bool]$DidBuild,[string]$XmlFile,[string]$PackageJsonFile,[string]$ServiceWorkerFile) {
    git add $XmlFile
    if (Test-Path $PackageJsonFile) { git add $PackageJsonFile }
    if (Test-Path $ServiceWorkerFile) { git add $ServiceWorkerFile }
    if ($DidBuild -eq $true -and (Test-Path -LiteralPath 'assets/dist')) { git add -- 'assets/dist' }

    $pending = git diff --cached --name-only
    if (-not $pending) { Write-Warning 'No staged changes; nothing to commit.' }
    else {
        $commitMsg = "chore(release): bump version to $NewVersion"
        git commit -m $commitMsg
        Write-Host "Created commit for version $NewVersion"
    }

    git push origin main

    $Tag = "v$NewVersion"
    git tag -a $Tag -m "Release $NewVersion"
    Write-Host "Created tag $Tag"
    git push origin $Tag
    return $Tag
}

function Create-GitHubRelease([string]$Tag,[string]$NewVersion) {
    Write-Host 'Creating GitHub release...'
    gh release create $Tag --title "Release $NewVersion" --notes "Automated release for $NewVersion."
    Write-Host 'GitHub release created.'
}

function Upload-ReleaseAsset([string]$Tag,[string]$ZipPath) {
    if (Test-Path -LiteralPath $ZipPath) {
        $zipName = Split-Path -Path $ZipPath -Leaf
        Write-Host "Uploading release asset: $zipName"
        gh release upload $Tag $ZipPath --clobber
        if ($LASTEXITCODE -ne 0) { Write-Warning "Failed to upload $zipName as a release asset." }
        else { Write-Host "Uploaded $zipName to release $Tag." }
    } else { Write-Warning "Zip not found at $ZipPath. Skipping asset upload." }
}

function Show-LatestReleaseAssetUrl([string]$AssetName) {
    $repo = (git remote get-url origin) -replace '.*github.com[:/](.+?)(\.git)?$','$1'
    $apiUrl = "https://api.github.com/repos/$repo/releases/latest"
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Headers @{'User-Agent'='PowerShell'}
        $asset = $response.assets | Where-Object { $_.name -eq $AssetName }
        if ($asset) { Write-Host 'Latest release asset URL:'; Write-Host $asset.browser_download_url }
        else { Write-Host "Release done. Asset '$AssetName' not found (may not be uploaded)." -ForegroundColor Yellow }
    } catch { Write-Warning 'Failed to query latest release info.' }
}

# ---------------- Main ----------------
Assert-Tools @('git','gh')
Ensure-CleanGit -Force:$Force

$manifestRef = Get-Manifest
if (-not $manifestRef) { Write-Host "Error: Plugin manifest not found." -ForegroundColor Red; exit 1 }

$XmlFile = (Split-Path $manifestRef.Path -Leaf)  # sagutidloader.xml
[xml]$xml = $manifestRef.Xml
$CurrentVersion = $xml.SelectSingleNode('//extension/version').InnerText
if (-not $CurrentVersion) { Write-Host 'Error: Could not read version from XML.' -ForegroundColor Red; exit 1 }

$nv = Compute-NewVersion -Current $CurrentVersion -ReleaseType $ReleaseType
Write-Host "Current version : $CurrentVersion"
Write-Host "New version     : $($nv.NewVersion)"
Write-Host "New cache name  : $($nv.CacheName)"

$confirm = Read-Host 'Proceed? (yes/no)'
if ($confirm -ne 'yes') { Write-Host 'Aborted.'; exit 0 }

$PackageJsonFile = 'package.json'
Update-VersionFiles -XmlFile $XmlFile -NewVersion $nv.NewVersion -PackageJsonFile $PackageJsonFile

$ServiceWorkerFile = Join-Path 'assets' 'serviceworker.js'
Update-ServiceWorkerCacheName -ServiceWorkerFile $ServiceWorkerFile -NewCacheName $nv.CacheName

$DidBuild = Run-Build -SkipBuild:$SkipBuild

$pkg = Package-Plugin -ManifestPath $manifestRef.Path

$Tag = Git-Commit-Push-Tag -NewVersion $nv.NewVersion -DidBuild:$DidBuild -XmlFile $XmlFile -PackageJsonFile $PackageJsonFile -ServiceWorkerFile $ServiceWorkerFile

Create-GitHubRelease -Tag $Tag -NewVersion $nv.NewVersion
Upload-ReleaseAsset -Tag $Tag -ZipPath $pkg.ZipPath
Show-LatestReleaseAssetUrl -AssetName $pkg.ZipName

Write-Host 'Release pipeline finished.'