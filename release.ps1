param(
    [Parameter(Position=0,Mandatory=$true)]
    [ValidateSet("major","minor","patch")]
    [string]$ReleaseType,
    [switch]$Force,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# --- 1. Tool checks ---
foreach ($tool in @("git","gh")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Required tool '$tool' not found in PATH." -ForegroundColor Red
        exit 1
    }
}

# --- 2. Git cleanliness ---
$gitStatus = git status --porcelain
if ($gitStatus) {
    if (-not $Force) {
        Write-Warning "Working tree not clean. Commit / stash changes or re-run with -Force."
        exit 1
    }
}
Write-Host "Working tree is clean, proceeding with release."

# --- 3. Version bump logic (XML) ---
$XmlFile = "sagutidloader.xml"
if (-not (Test-Path $XmlFile)) { Write-Host "Error: $XmlFile not found." -ForegroundColor Red; exit 1 }

[xml]$XmlContent = Get-Content $XmlFile
$CurrentVersion = $XmlContent.SelectSingleNode("//extension/version").InnerText
if (-not $CurrentVersion) { Write-Host "Error: Could not read version from XML." -ForegroundColor Red; exit 1 }

$VersionParts = $CurrentVersion -split '\.'
if ($VersionParts.Count -lt 3) { Write-Host "Error: Version format must be MAJOR.MINOR.PATCH" -ForegroundColor Red; exit 1 }

[int]$Major = $VersionParts[0]
[int]$Minor = $VersionParts[1]
[int]$Patch = $VersionParts[2]

switch ($ReleaseType) {
    "major" { $Major++; $Minor = 0; $Patch = 0 }
    "minor" { $Minor++; $Patch = 0 }
    "patch" { $Patch++ }
}

$NewVersion   = "$Major.$Minor.$Patch"
$NewCacheName = "sagutid-v$NewVersion"

Write-Host "Current version : $CurrentVersion"
Write-Host "New version     : $NewVersion"
Write-Host "New cache name  : $NewCacheName"

$confirm = Read-Host "Proceed? (yes/no)"
if ($confirm -ne "yes") { Write-Host "Aborted."; exit 0 }

# --- 4. Update XML ---
$XmlContent.SelectSingleNode("//extension/version").InnerText = $NewVersion
$XmlContent.Save($XmlFile)
Write-Host "Updated $XmlFile"

# --- 5. Update package.json (if present) ---
$PackageJsonFile = "package.json"
if (Test-Path $PackageJsonFile) {
    $pkg = Get-Content $PackageJsonFile -Raw | ConvertFrom-Json
    $pkg.version = $NewVersion
    $pkg | ConvertTo-Json -Depth 32 | Set-Content $PackageJsonFile -Encoding UTF8
    Write-Host "Updated $PackageJsonFile"
}

# --- 6. Update serviceworker.js cache name ---
$ServiceWorkerFile = Join-Path "assets" "serviceworker.js"
if (Test-Path $ServiceWorkerFile) {
    $swContent = Get-Content $ServiceWorkerFile -Raw

    # Patterns (template literal, single, double)
    $patterns = @(
        '(const\s+CACHE_NAME\s*=\s*`)sagutid-v[^`]+(`;?)',
        '(const\s+CACHE_NAME\s*=\s*'')sagutid-v[^'']+('';?)',
        '(const\s+CACHE_NAME\s*=\s*")sagutid-v[^"]+(";?)'
    )

    $matched = $false
    foreach ($p in $patterns) {
        if ($swContent -match $p) {
            $swContent = [regex]::Replace($swContent, $p, "`$1$NewCacheName`$2")
            $matched = $true
            break
        }
    }

    if (-not $matched) {
        Write-Warning "CACHE_NAME pattern not found in $ServiceWorkerFile"
    } else {
        Set-Content -Path $ServiceWorkerFile -Value $swContent -Encoding UTF8
        Write-Host "Updated cache name in $ServiceWorkerFile"
    }
} else {
    Write-Warning "$ServiceWorkerFile not found (skipping)."
}

# --- 7. (Optional) Build step ---
$DidBuild = $false
if (Test-Path $PackageJsonFile) {
    if (-not $SkipBuild) {

        # Compute conditions separately (avoids parser treating -or as a param)
        $hasLock  = Test-Path -LiteralPath "package-lock.json"
        $hasMods  = Test-Path -LiteralPath "node_modules"
        if ($hasLock -or $hasMods) {
            Write-Host "Running npm install (ensuring dependencies)..."
        } else {
            Write-Host "Running initial npm install..."
        }

        npm install --no-fund --no-audit | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "npm install failed." -ForegroundColor Red
            exit 1
        }

        Write-Host "Running build..."
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            npm run build
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Build failed." -ForegroundColor Red
                exit 1
            }
            $DidBuild = $true
            Write-Host "Build completed."
        } else {
            Write-Warning "npm command not found; skipping build."
        }
    }
}

# --- 8. Git commit (normal) ---
git add $XmlFile
if (Test-Path $PackageJsonFile) { git add $PackageJsonFile }
if (Test-Path $ServiceWorkerFile) { git add $ServiceWorkerFile }
if ($DidBuild -eq $true) {
    if (Test-Path -LiteralPath "assets/dist") {
        git add -- "assets/dist"
    }
}

# Guard: ensure there is something to commit
$pending = git diff --cached --name-only
if (-not $pending) {
    Write-Warning "No staged changes; nothing to commit."
} else {
    $commitMsg = "chore(release): bump version to $NewVersion"
    git commit -m $commitMsg
    Write-Host "Created commit for version $NewVersion"
}

# --- 9. Push commit first ---
git push origin main

# --- 10. Create annotated tag from current HEAD ---
$Tag = "v$NewVersion"
git tag -a $Tag -m "Release $NewVersion"
Write-Host "Created tag $Tag"
git push origin $Tag

# --- 11. GitHub release ---
Write-Host "Creating GitHub release..."
gh release create $Tag --title "Release $NewVersion" --notes "Automated release for $NewVersion."
Write-Host "GitHub release created."

# --- 12. Show latest asset URL (optional) ---
$repo = (git remote get-url origin) -replace '.*github.com[:/](.+?)(\.git)?$','$1'
$assetName = "sagutidloader.zip"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Headers @{"User-Agent"="PowerShell"}
    $asset = $response.assets | Where-Object { $_.name -eq $assetName }
    if ($asset) {
        Write-Host "Latest release asset URL:"
        Write-Host $asset.browser_download_url
    } else {
        Write-Host "Release done. Asset '$assetName' not found (may not be uploaded)." -ForegroundColor Yellow
    }
} catch {
    Write-Warning "Failed to query latest release info."
}

Write-Host "Release pipeline finished."