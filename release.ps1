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
$CurrentVersion = $XmlContent.extension.version
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

# Update the version in the XML file
Write-Host "Updating version in $XmlFile from $CurrentVersion to $NewVersion..."
$XmlContent.extension.version = $NewVersion
$XmlContent.Save($XmlFile)

# Commit the change
Write-Host "Committing the version update..."
git add $XmlFile
git commit -m "Release version $NewVersion"

# Create a new Git tag
$Tag = "v$NewVersion"
Write-Host "Creating Git tag $Tag..."
git tag $Tag

# Push the changes and the tag
Write-Host "Pushing changes and tag $Tag to the repository..."
git push origin main
git push origin $Tag

Write-Host "Release $NewVersion completed successfully!"