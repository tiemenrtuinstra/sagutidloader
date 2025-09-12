param(
    [Parameter(Position = 0, Mandatory = $true)]
    [ValidateSet("major", "minor", "patch")]
    [string]$ReleaseType,
    [switch]$Force,
    [switch]$SkipBuild
    ,
    # Optional: include Play Store/TWA support
    [switch]$PublishPlay,
    [string]$PlayOrigin,
    [string]$PlayPackage,
    [string]$PlaySha256
    ,
    [switch]$BuildAab,
    [string]$PlayManifest,
    [string]$KeystorePath,
    [string]$KeystoreAlias,
    [string]$KeystorePassword
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
        }
        catch { }
    }
    return $null
}

function Compute-NewVersion([string]$Current, [string]$ReleaseType) {
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

function Update-VersionFiles([string]$XmlFile, [string]$NewVersion, [string]$PackageJsonFile) {
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

function Update-ServiceWorkerCacheName([string]$ServiceWorkerFile, [string]$NewCacheName) {
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
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        npm run build:prod | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Host 'Build failed.' -ForegroundColor Red; exit 1 }
        $did = $true
        Write-Host 'Build completed.'
    }
    else { Write-Warning 'npm command not found; skipping build.' }
    return $did
}

function Package-Plugin([string]$ManifestPath) {
    [xml]$manifest = Get-Content $ManifestPath
    $pluginName = $manifest.extension.files.filename | Where-Object { $_.plugin } | Select-Object -First 1 | ForEach-Object { [string]$_.plugin }
    if (-not $pluginName) { $pluginName = [IO.Path]::GetFileNameWithoutExtension($ManifestPath) }

    $buildRoot = Join-Path (Get-Location) 'build'
    $stageDir = Join-Path $buildRoot $pluginName
    if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
    New-Item -ItemType Directory -Path $stageDir | Out-Null

    # Always include the manifest
    Copy-Item $ManifestPath (Join-Path $stageDir (Split-Path $ManifestPath -Leaf)) -Force

    # Process all <filename>, <file> and <folder> entries from the manifest
    $nodes = @()
    $filesNode = $manifest.extension.files
    if ($filesNode) { $nodes = $filesNode.ChildNodes }
    foreach ($node in $nodes) {
        $tag = $node.Name.ToLower()
        $text = [string]$node.'#text'
        switch ($tag) {
            'filename' {
                $src = Join-Path (Get-Location) $text
                if (Test-Path $src) { Copy-Item $src (Join-Path $stageDir (Split-Path $text -Leaf)) -Force }
                else { Write-Warning "Missing file: $text" }
            }
            'file' {
                $src = Join-Path (Get-Location) $text
                if (Test-Path $src) {
                    $dest = Join-Path $stageDir $text
                    $parent = Split-Path $dest -Parent
                    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
                    Copy-Item $src $dest -Force
                }
                else { Write-Warning "Missing file: $text" }
            }
            'folder' {
                $src = Join-Path (Get-Location) $text
                $dest = Join-Path $stageDir $text
                if (Test-Path $src) { Copy-Item $src $dest -Recurse -Force }
                else { Write-Warning "Missing folder: $text" }
            }
            default { }
        }
    }

    # Include generated assetlinks.json if present
    if ($global:AssetLinksFilePath -and (Test-Path $global:AssetLinksFilePath)) {
        $wellKnownDir = Join-Path $stageDir '.well-known'
        if (-not (Test-Path $wellKnownDir)) { New-Item -ItemType Directory -Path $wellKnownDir | Out-Null }
        Copy-Item $global:AssetLinksFilePath (Join-Path $wellKnownDir 'assetlinks.json') -Force
    }

    $ZipName = "$pluginName.zip"
    $ZipPath = Join-Path (Get-Location) $ZipName
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Push-Location $stageDir
    try { Compress-Archive -Path * -DestinationPath $ZipPath | Out-Null }
    finally { Pop-Location }
    Write-Host "Created package: $ZipPath" -ForegroundColor Green

    return [pscustomobject]@{ PluginName = $pluginName; StageDir = $stageDir; ZipPath = $ZipPath; ZipName = $ZipName }
}

function Git-Commit-Push-Tag([string]$NewVersion, [bool]$DidBuild, [string]$XmlFile, [string]$PackageJsonFile, [string]$ServiceWorkerFile) {
    $null = git add $XmlFile
    if (Test-Path $PackageJsonFile) { $null = git add $PackageJsonFile }
    if (Test-Path $ServiceWorkerFile) { $null = git add $ServiceWorkerFile }
    if ($DidBuild -eq $true -and (Test-Path -LiteralPath 'assets/dist')) { $null = git add -- 'assets/dist' }

    # Stage update server XML if present (force add in case folder is ignored)
    $updatesFile = Join-Path 'updates' 'sagutidloader_updates.xml'
    if (Test-Path $updatesFile) { $null = git add -f -- $updatesFile }

    $pending = git diff --cached --name-only
    if (-not $pending) { Write-Warning 'No staged changes; nothing to commit.' }
    else {
        $commitMsg = "chore(release): bump version to $NewVersion"
        $null = git commit -m $commitMsg
        Write-Host "Created commit for version $NewVersion"
    }

    $null = git push origin main

    $Tag = ("v$NewVersion").Trim()
    $null = git tag -a $Tag -m "Release $NewVersion"
    Write-Host "Created tag $Tag"
    $null = git push origin $Tag
    return $Tag
}

function Create-GitHubRelease([string]$Tag, [string]$NewVersion) {
    Write-Host 'Creating GitHub release...'
    # Ensure tag exists locally (and presumably remote, since we pushed it)
    $ref = git rev-parse -q --verify "refs/tags/$Tag" 2>$null
    if (-not $ref) {
        Write-Host "Error: Tag '$Tag' does not exist locally." -ForegroundColor Red
        exit 1
    }

    gh release create $Tag --title "Release $NewVersion" --notes "Automated release for $NewVersion."
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create GitHub release for tag '$Tag'." -ForegroundColor Red
        exit 1
    }
    Write-Host 'GitHub release created.'
}

function Ensure-TagNotReleased([string]$Tag) {
    # Check if a release already exists for this tag on GitHub; if yes, abort to avoid 422s
    gh release view $Tag --json tagName 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Error: A GitHub release for tag '$Tag' already exists. Bump version or delete the release first." -ForegroundColor Red
        exit 1
    }
}

function Upload-ReleaseAsset([string]$Tag, [string]$ZipPath) {
    if (Test-Path -LiteralPath $ZipPath) {
        $zipName = Split-Path -Path $ZipPath -Leaf
        Write-Host "Uploading release asset: $zipName"
        gh release upload $Tag $ZipPath --clobber
        if ($LASTEXITCODE -ne 0) { Write-Warning "Failed to upload $zipName as a release asset." }
        else { Write-Host "Uploaded $zipName to release $Tag." }
    }
    else { Write-Warning "Zip not found at $ZipPath. Skipping asset upload." }
}

function Show-LatestReleaseAssetUrl([string]$AssetName) {
    $repo = (git remote get-url origin) -replace '.*github.com[:/](.+?)(\.git)?$', '$1'
    $apiUrl = "https://api.github.com/repos/$repo/releases/latest"
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Headers @{'User-Agent' = 'PowerShell' }
        $asset = $response.assets | Where-Object { $_.name -eq $AssetName }
        if ($asset) { Write-Host 'Latest release asset URL:'; Write-Host $asset.browser_download_url }
        else { Write-Host "Release done. Asset '$AssetName' not found (may not be uploaded)." -ForegroundColor Yellow }
    }
    catch { Write-Warning 'Failed to query latest release info.' }
}

function Write-UpdateServerXml([string]$ManifestPath, [string]$NewVersion, [string]$ReleaseNotes) {
    [xml]$manifest = Get-Content $ManifestPath
    # Read group from the manifest's extension element attribute (fallback to 'system')
    $group = $null
    try { $group = $manifest.extension.GetAttribute('group') } catch { $group = $null }
    if (-not $group) { $group = 'system' }
    $pluginName = $null
    $fileNodes = $manifest.extension.files.filename
    if ($fileNodes) {
        foreach ($node in $fileNodes) { if ($node.plugin) { $pluginName = [string]$node.plugin; break } }
    }
    if (-not $pluginName) { $pluginName = [IO.Path]::GetFileNameWithoutExtension($ManifestPath) }

    $repo = (git remote get-url origin) -replace '.*github.com[:/](.+?)(\.git)?$', '$1'
    $tag = "v$NewVersion"
    $zip = "$pluginName.zip"
    $downloadUrl = "https://github.com/$repo/releases/download/$tag/$zip"

    $updatesDir = Join-Path (Get-Location) 'updates'
    if (-not (Test-Path $updatesDir)) { New-Item -ItemType Directory -Path $updatesDir | Out-Null }
    $updatesFile = Join-Path $updatesDir 'sagutidloader_updates.xml'

    # Build description: include provided release notes inside CDATA if present
    $desc = 'Sagutid Loader'
    if ($ReleaseNotes) { $desc = "$desc`n`n$ReleaseNotes" }
    $changelogUrl = "https://github.com/$repo/releases/tag/$tag"

    # Build XML content line by line to ensure proper formatting
    $xmlLines = @(
        '<?xml version="1.0" encoding="utf-8"?>',
        '<updates>',
        '    <update>',
        "        <name>plg_${group}_${pluginName}</name>",
        "        <description><![CDATA[${desc}]]></description>",
        "        <element>${pluginName}</element>",
        '        <type>plugin</type>',
        "        <folder>${group}</folder>",
        '        <client>0</client>',
        "        <version>${NewVersion}</version>",
        "        <infourl title=`"Plugin Info`">${changelogUrl}</infourl>",
        '        <downloads>',
        "            <downloadurl type=`"full`" format=`"zip`">${downloadUrl}</downloadurl>",
        '        </downloads>',
        "        <changelogurl>${changelogUrl}</changelogurl>",
        '        <targetplatform name="joomla" version="4.*" />',
        '        <targetplatform name="joomla" version="5.*" />',
        '        <php_minimum>7.4</php_minimum>',
        '    </update>',
        '</updates>'
    )
    
    $xmlLines | Set-Content -Path $updatesFile -Encoding UTF8
    return $updatesFile
}

function Generate-AssetLinks([string]$Origin, [string]$Package, [string]$Sha256) {
    if (-not $Origin -or -not $Package -or -not $Sha256) { throw 'Play Origin, Package and Sha256 must be provided to generate assetlinks.' }
    $obj = @(
        @{ relation = @('delegate_permission/common.handle_all_urls'); target = @{ namespace = 'android_app'; package_name = $Package; sha256_cert_fingerprints = @($Sha256) } }
    )
    $json = $obj | ConvertTo-Json -Depth 8

    $tmp = Join-Path (Get-Location) 'build' 'assetlinks.json'
    if (-not (Test-Path (Join-Path (Get-Location) 'build'))) { New-Item -ItemType Directory -Path (Join-Path (Get-Location) 'build') | Out-Null }
    Set-Content -Path $tmp -Value $json -Encoding UTF8
    $global:AssetLinksFilePath = $tmp
    Write-Host "Generated assetlinks.json at $tmp" -ForegroundColor Green
    Write-Host "Remember to publish the same JSON at: $Origin/.well-known/assetlinks.json" -ForegroundColor Yellow
}

function Build-TwaAab([string]$ManifestUrl, [string]$OutDir, [string]$KeystorePath, [string]$KeystoreAlias, [string]$KeystorePassword) {
    if (-not (Get-Command bubblewrap -ErrorAction SilentlyContinue)) { Write-Warning 'bubblewrap CLI not found in PATH. Install @bubblewrap/cli to enable AAB builds.'; return $null }
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Write-Warning 'Java not found in PATH. Android build requires Java (JDK).' ; return $null }

    if (-not $ManifestUrl) { throw 'ManifestUrl is required to build TWA' }
    if (-not $OutDir) { $OutDir = Join-Path (Get-Location) 'build' }

    if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
    $cwd = Get-Location
    Push-Location $OutDir
    try {
        Write-Host "Initializing Bubblewrap in $OutDir..."
        # bubblewrap init will create twa-manifest.json; run non-interactively where possible
        & bubblewrap init --manifest $ManifestUrl | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warning 'bubblewrap init failed.'; Pop-Location; return $null }

        Write-Host 'Building AAB with bubblewrap...'
        # If keystore provided, bubblewrap build will prompt; we attempt a non-interactive build and rely on environment for signing
        & bubblewrap build | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warning 'bubblewrap build failed.'; Pop-Location; return $null }

        # Find produced .aab
        $aab = Get-ChildItem -Path (Get-Location) -Recurse -Filter *.aab -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($aab) { Write-Host "Found AAB: $($aab.FullName)"; return $aab.FullName }
        else { Write-Warning 'No .aab found after build.'; return $null }
    }
    finally { Pop-Location }
}

function Commit-UpdateXml([string]$ManifestPath, [string]$NewVersion) {
    # Regenerate update XML and commit/push if it changed
    $updatesFile = Write-UpdateServerXml -ManifestPath $ManifestPath -NewVersion $NewVersion
    if (-not (Test-Path $updatesFile)) { return }
    # Force-add in case updates/ is ignored
    $null = git add -f -- $updatesFile
    $pending = git diff --cached --name-only -- $updatesFile
    if ($pending) {
        $null = git commit -m "chore(update-site): update update XML for v$NewVersion"
        $null = git push origin main
        Write-Host "Pushed updated update-server XML for v$NewVersion"
    }
}

# ---------------- Main ----------------
Assert-Tools @('git', 'gh')
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

$ServiceWorkerFile = Join-Path 'assets' 'ts\serviceworker.ts'
Update-ServiceWorkerCacheName -ServiceWorkerFile $ServiceWorkerFile -NewCacheName $nv.CacheName

$DidBuild = Run-Build -SkipBuild:$SkipBuild

# If requested, generate assetlinks.json for Play/TWA and include it in the staged package
if ($PublishPlay) {
    if (-not $PlayOrigin -or -not $PlayPackage -or -not $PlaySha256) {
        Write-Warning 'PublishPlay requested but PlayOrigin, PlayPackage or PlaySha256 not provided. Provide these parameters to generate assetlinks.json.'
    }
    else {
        Generate-AssetLinks -Origin $PlayOrigin -Package $PlayPackage -Sha256 $PlaySha256
    }
}

# Generate release notes from git between current tag and HEAD
$prevTag = ("v$CurrentVersion")
$releaseNotes = $null
try {
    $gitRange = "$prevTag..HEAD"
    $log = git --no-pager log --pretty=format:"- %s (%an)" $gitRange 2>$null
    if ($LASTEXITCODE -eq 0 -and $log) { $releaseNotes = $log }
}
catch { }

# Generate/update update server XML now (referencing the soon-to-exist release asset)
$null = Write-UpdateServerXml -ManifestPath $manifestRef.Path -NewVersion $nv.NewVersion -ReleaseNotes $releaseNotes

$pkg = Package-Plugin -ManifestPath $manifestRef.Path

$Tag = Git-Commit-Push-Tag -NewVersion $nv.NewVersion -DidBuild:([bool]$DidBuild) -XmlFile $XmlFile -PackageJsonFile $PackageJsonFile -ServiceWorkerFile $ServiceWorkerFile

Ensure-TagNotReleased -Tag $Tag
Create-GitHubRelease -Tag $Tag -NewVersion $nv.NewVersion
Upload-ReleaseAsset -Tag $Tag -ZipPath $pkg.ZipPath
 
# Optionally build and upload Android AAB via Bubblewrap
if ($BuildAab) {
    if (-not $PlayManifest) { Write-Warning 'BuildAab requested but PlayManifest (manifest URL) not provided.' }
    else {
        $aabPath = Build-TwaAab -ManifestUrl $PlayManifest -OutDir (Join-Path (Get-Location) 'build' ) -KeystorePath $KeystorePath -KeystoreAlias $KeystoreAlias -KeystorePassword $KeystorePassword
        if ($aabPath) {
            Write-Host "Uploading AAB $aabPath to release $Tag"
            gh release upload $Tag $aabPath --clobber
            if ($LASTEXITCODE -ne 0) { Write-Warning 'Failed to upload AAB to release.' } else { Write-Host 'Uploaded AAB to release.' }
        }
    }
}
Commit-UpdateXml -ManifestPath $manifestRef.Path -NewVersion $nv.NewVersion
Show-LatestReleaseAssetUrl -AssetName $pkg.ZipName

Write-Host 'Release pipeline finished.'