# Exit on error
$ErrorActionPreference = "Stop"

# Check for arguments
if ($args.Count -ne 1) {
    Write-Host "Usage: .\release.ps1 [major|minor|patch]"
    exit 1
}

# Get the release type
$ReleaseType = $args[0]

# Filepath to the XML file
$XmlFile = "sagutidloader.xml"

# Check if the XML file exists
if (-Not (Test-Path $XmlFile)) {
    Write-Host "Error: $XmlFile not found."
    exit 1
}

# Load the XML file
[xml]$XmlContent = Get-Content $XmlFile

# Extract the current version
$CurrentVersion = $XmlContent.SelectSingleNode("//extension/version").InnerText
if (-Not $CurrentVersion) {
    Write-Host "Error: Could not extract the current version from $XmlFile."
    exit 1
}

# Split the version into major, minor, and patch
$VersionParts = $CurrentVersion -split '\.'
$Major = [int]$VersionParts[0]
$Minor = [int]$VersionParts[1]
$Patch = [int]$VersionParts[2]

# Increment the version based on the release type
switch ($ReleaseType) {
    "major" {
        $Major++
        $Minor = 0
        $Patch = 0
    }
    "minor" {
        $Minor++
        $Patch = 0
    }
    "patch" {
        $Patch++
    }
    default {
        Write-Host "Error: Invalid release type. Use 'major', 'minor', or 'patch'."
        exit 1
    }
}

# Construct the new version
$NewVersion = "$Major.$Minor.$Patch"
$NewCacheName = "sagutid-v$NewVersion"

# Confirm the new version
Write-Host "Current version: $CurrentVersion"
Write-Host "New version: $NewVersion"
Write-Host "New cache name: $NewCacheName" 
$Confirmation = Read-Host "Do you want to proceed with this version? (yes/no)"
if ($Confirmation -ne "yes") {
    Write-Host "Release process aborted."
    exit 0
}

# Update the version in the XML file
Write-Host "Updating version in $XmlFile from $CurrentVersion to $NewVersion..."
$XmlContent.SelectSingleNode("//extension/version").InnerText = $NewVersion
$XmlContent.Save($XmlFile)

# --- Update serviceworker.js ---
$ServiceWorkerFile = "assets\serviceworker.js" # Path to your service worker file
if (Test-Path $ServiceWorkerFile) {
    Write-Host "Updating cache name in $ServiceWorkerFile to $NewCacheName..."
    # Read the file content
    $swContent = Get-Content $ServiceWorkerFile -Raw
    # Use regex to replace the CACHE_NAME value
    $newSwContent = $swContent -replace "(this\.CACHE_NAME\s*=\s*['""])sagutid-v[^'""]+(['""])", "`$1$NewCacheName`$2"
    # Write the updated content back to the file
    Set-Content -Path $ServiceWorkerFile -Value $newSwContent -Encoding UTF8
} else {
    Write-Warning "$ServiceWorkerFile not found. Skipping cache name update."
}

# Commit the change
Write-Host "Committing the version update..."
git add $XmlFile
git add $ServiceWorkerFile
git commit -m "Release version $NewVersion"

# Create a new Git tag
$Tag = "v$NewVersion"
Write-Host "Creating Git tag $Tag..."
git tag $Tag

# Push the changes and the tag
Write-Host "Pushing changes and tag $Tag to the repository..."
git push origin main
git push origin $Tag

# Create a GitHub release
Write-Host "Creating GitHub release for tag $Tag..."
gh release create $Tag --title "Release $NewVersion" --notes "This is the release for version $NewVersion."

Write-Host "Release $NewVersion completed successfully!"