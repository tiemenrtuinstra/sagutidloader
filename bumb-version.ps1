<#
.SYNOPSIS
    Local script to bump version and create/push tags for release automation.

.DESCRIPTION
    Updates version in manifest and package.json files, commits changes, creates a tag, and pushes to trigger GitHub Actions release workflow.

.PARAMETER ReleaseType
    Type of version bump: major, minor, patch, or custom version string.

.PARAMETER CustomVersion
    Custom version string (e.g., "1.2.3-beta.1").

.PARAMETER Force
    Skip confirmation prompts.

.EXAMPLE
    .\bump-version.ps1 -ReleaseType patch
    .\bump-version.ps1 -CustomVersion "2.0.0-rc.1" -Force
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('major', 'minor', 'patch', 'custom')]
    [string]$ReleaseType,
    
    [string]$CustomVersion = '',
    
    [switch]$Force
)

# Ensure we're in a git repo
if (!(Test-Path '.git')) {
    Write-Error "Not in a git repository root"
    exit 1
}

# Get current version from manifest
$manifestPath = 'sagutidloader.xml'
if (!(Test-Path $manifestPath)) {
    Write-Error "Manifest file not found: $manifestPath"
    exit 1
}

[xml]$manifest = Get-Content $manifestPath
$currentVersion = $manifest.extension.version

Write-Host "Current version: $currentVersion" -ForegroundColor Yellow

# Calculate new version
if ($ReleaseType -eq 'custom') {
    if (!$CustomVersion) {
        $CustomVersion = Read-Host "Enter custom version"
    }
    $newVersion = $CustomVersion
} else {
    # Parse semantic version
    if ($currentVersion -match '^(\d+)\.(\d+)\.(\d+)') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        $patch = [int]$matches[3]
        
        switch ($ReleaseType) {
            'major' { $major++; $minor = 0; $patch = 0 }
            'minor' { $minor++; $patch = 0 }
            'patch' { $patch++ }
        }
        
        $newVersion = "$major.$minor.$patch"
    } else {
        Write-Error "Cannot parse current version: $currentVersion"
        exit 1
    }
}

Write-Host "New version: $newVersion" -ForegroundColor Green

# Confirmation
if (!$Force) {
    $confirm = Read-Host "Proceed with version bump to $newVersion? (y/N)"
    if ($confirm -notmatch '^y(es)?$') {
        Write-Host "Aborted" -ForegroundColor Yellow
        exit 0
    }
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
    $status | Write-Host
    
    if (!$Force) {
        $proceed = Read-Host "Continue anyway? (y/N)"
        if ($proceed -notmatch '^y(es)?$') {
            Write-Host "Aborted - commit or stash changes first" -ForegroundColor Yellow
            exit 0
        }
    }
}

try {
    # Update manifest
    Write-Host "Updating $manifestPath..." -ForegroundColor Cyan
    $manifest.extension.version = $newVersion
    $manifest.Save((Resolve-Path $manifestPath).Path)
    
    # Update package.json if it exists
    $packagePath = 'package.json'
    if (Test-Path $packagePath) {
        Write-Host "Updating $packagePath..." -ForegroundColor Cyan
        $package = Get-Content $packagePath | ConvertFrom-Json
        $package.version = $newVersion
        $package | ConvertTo-Json -Depth 10 | Set-Content $packagePath
    }
    
    # Update service worker version
    $swPath = 'assets/ts/serviceworker.ts'
    if (Test-Path $swPath) {
        Write-Host "Updating service worker version..." -ForegroundColor Cyan
        $content = Get-Content $swPath -Raw
        $content = $content -replace "const VERSION = '[^']*'", "const VERSION = '$newVersion'"
        Set-Content $swPath $content -NoNewline
    }
    
    # Git operations
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git add $manifestPath
    if (Test-Path $packagePath) { git add $packagePath }
    if (Test-Path $swPath) { git add $swPath }
    
    git commit -m "Bump version to $newVersion"
    
    # Create and push tag
    $tagName = "v$newVersion"
    Write-Host "Creating tag: $tagName" -ForegroundColor Cyan
    git tag $tagName
    
    Write-Host "Pushing to origin..." -ForegroundColor Cyan
    git push origin main
    git push origin $tagName
    
    Write-Host "`n✅ Release initiated!" -ForegroundColor Green
    Write-Host "Tag $tagName has been pushed and will trigger the GitHub Actions release workflow." -ForegroundColor Green
    Write-Host "`nMonitor progress at: https://github.com/$(git config --get remote.origin.url -replace '.*github\.com[:/](.+?)(?:\.git)?$', '$1')/actions" -ForegroundColor Cyan
    
} catch {
    Write-Error "Failed to bump version: $($_.Exception.Message)"
    exit 1
}