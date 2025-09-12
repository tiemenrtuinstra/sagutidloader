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

# Clean and parse version - handle various formats
$cleanVersion = $currentVersion -replace '[^\d\.]', '' -replace '\.+', '.'
$cleanVersion = $cleanVersion.Trim('.')

Write-Host "Cleaned version: $cleanVersion" -ForegroundColor Cyan

# Try to extract semantic version parts
$versionParts = $cleanVersion -split '\.'
if ($versionParts.Count -ge 3) {
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1] 
    $patch = [int]$versionParts[2]
} elseif ($versionParts.Count -eq 2) {
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = 0
} elseif ($versionParts.Count -eq 1) {
    $major = [int]$versionParts[0]
    $minor = 0
    $patch = 0
} else {
    # Fallback for completely non-standard versions
    Write-Warning "Cannot parse version '$currentVersion', using 1.0.0 as base"
    $major = 1
    $minor = 0  
    $patch = 0
}

Write-Host "Parsed as: $major.$minor.$patch" -ForegroundColor Cyan

# Calculate new version
if ($ReleaseType -eq 'custom') {
    if (!$CustomVersion) {
        $CustomVersion = Read-Host "Enter custom version"
    }
    $newVersion = $CustomVersion
} else {
    switch ($ReleaseType) {
        'major' { $major++; $minor = 0; $patch = 0 }
        'minor' { $minor++; $patch = 0 }
        'patch' { $patch++ }
    }
    
    $newVersion = "$major.$minor.$patch"
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
    # Update manifest - find and update version node properly
    Write-Host "Updating $manifestPath..." -ForegroundColor Cyan
    
    $versionNode = $manifest.extension.SelectSingleNode('version')
    if ($versionNode) {
        $versionNode.InnerText = $newVersion
    } else {
        # Create version node if it doesn't exist
        $versionElement = $manifest.CreateElement('version')
        $versionElement.InnerText = $newVersion
        $manifest.extension.AppendChild($versionElement) | Out-Null
    }
    
    # Save with proper formatting
    $xmlSettings = New-Object System.Xml.XmlWriterSettings
    $xmlSettings.Indent = $true
    $xmlSettings.IndentChars = "    "
    $xmlSettings.Encoding = [System.Text.UTF8Encoding]::new($false) # UTF8 without BOM
    
    $xmlWriter = [System.Xml.XmlWriter]::Create($manifestPath, $xmlSettings)
    try {
        $manifest.Save($xmlWriter)
        Write-Host "Updated manifest version to $newVersion" -ForegroundColor Green
    } finally {
        $xmlWriter.Close()
    }
    
    # Update package.json if it exists
    $packagePath = 'package.json'
    if (Test-Path $packagePath) {
        Write-Host "Updating $packagePath..." -ForegroundColor Cyan
        $package = Get-Content $packagePath -Encoding UTF8 | ConvertFrom-Json
        $package.version = $newVersion
        $package | ConvertTo-Json -Depth 10 | Set-Content $packagePath -Encoding UTF8
        Write-Host "Updated package.json version to $newVersion" -ForegroundColor Green
    }
    
    # Update service worker version
    $swPath = 'assets/ts/serviceworker.ts'
    if (Test-Path $swPath) {
        Write-Host "Updating service worker version..." -ForegroundColor Cyan
        $content = Get-Content $swPath -Raw -Encoding UTF8
        $content = $content -replace "const VERSION = '[^']*'", "const VERSION = '$newVersion'"
        Set-Content $swPath $content -NoNewline -Encoding UTF8
        Write-Host "Updated service worker version to $newVersion" -ForegroundColor Green
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
    
    # Get repository URL for actions link
    try {
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl -match 'github\.com[:/](.+?)(?:\.git)?$') {
            $repoPath = $matches[1]
            Write-Host "`nMonitor progress at: https://github.com/$repoPath/actions" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "`nCheck GitHub Actions for build progress." -ForegroundColor Cyan
    }
    
} catch {
    Write-Error "Failed to bump version: $($_.Exception.Message)"
    exit 1
}