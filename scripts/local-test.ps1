<#
.SYNOPSIS
    Test Joomla plugin update system locally
#>

param(
    [string]$ManifestPath = "sagutidloader.xml",
    [string]$UpdateXmlPath = "updates/sagutidloader_updates.xml"
)

Write-Host "🔍 Testing Joomla Plugin Update Configuration" -ForegroundColor Cyan

# Check manifest exists
if (!(Test-Path $ManifestPath)) {
    Write-Error "Manifest not found: $ManifestPath"
    exit 1
}

# Check update XML exists
if (!(Test-Path $UpdateXmlPath)) {
    Write-Warning "Update XML not found: $UpdateXmlPath"
}

try {
    # Parse manifest
    [xml]$manifest = Get-Content $ManifestPath -Encoding UTF8
    
    Write-Host "`n📋 Manifest Analysis:" -ForegroundColor Yellow
    Write-Host "  Plugin Name: $($manifest.extension.name)"
    Write-Host "  Version: $($manifest.extension.version)"
    Write-Host "  Type: $($manifest.extension.type)"
    Write-Host "  Group: $($manifest.extension.group)"
    
    # Check for main PHP file with plugin attribute
    $mainFile = $manifest.extension.files.filename | Where-Object { $_.plugin -ne $null } | Select-Object -First 1
    if ($mainFile) {
        $element = [string]$mainFile.plugin
        Write-Host "  Element: $element" -ForegroundColor Green
    } else {
        # Fallback: look for first PHP file
        $phpFile = $manifest.extension.files.filename | Where-Object { $_ -like "*.php" } | Select-Object -First 1
        if ($phpFile) {
            $element = [string]$phpFile -replace '\.php$', ''
            Write-Host "  Element: $element (from filename)" -ForegroundColor Yellow
        } else {
            Write-Host "  Element: NOT FOUND" -ForegroundColor Red
            $element = $null
        }
    }
    
    # Check update servers
    $updateServers = $manifest.extension.updateservers.server
    if ($updateServers) {
        Write-Host "  Update Server: ✅ Configured" -ForegroundColor Green
        foreach ($server in $updateServers) {
            $serverUrl = [string]$server.InnerText
            Write-Host "    URL: $serverUrl" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  Update Server: ❌ MISSING" -ForegroundColor Red
    }
    
    # Parse update XML if exists
    if (Test-Path $UpdateXmlPath) {
        [xml]$updateXml = Get-Content $UpdateXmlPath -Encoding UTF8
        $update = $updateXml.updates.update
        
        Write-Host "`n🔄 Update XML Analysis:" -ForegroundColor Yellow
        Write-Host "  Name: $($update.name)"
        Write-Host "  Element: $($update.element)"
        Write-Host "  Version: $($update.version)"
        
        # Get download URL properly
        $downloadUrl = $null
        if ($update.downloads -and $update.downloads.downloadurl) {
            $downloadUrl = [string]$update.downloads.downloadurl.'#text'
            if (-not $downloadUrl) {
                $downloadUrl = [string]$update.downloads.downloadurl
            }
        }
        Write-Host "  Download URL: $downloadUrl"
        
        # Version comparison
        if ($manifest.extension.version -eq $update.version) {
            Write-Host "  Version Match: ✅" -ForegroundColor Green
        } else {
            Write-Host "  Version Match: ❌ Manifest=$($manifest.extension.version), Update=$($update.version)" -ForegroundColor Red
        }
        
        # Element comparison
        if ($element -eq $update.element) {
            Write-Host "  Element Match: ✅" -ForegroundColor Green
        } else {
            Write-Host "  Element Match: ❌ Expected=$element, Update=$($update.element)" -ForegroundColor Red
        }
        
        # Test download URL accessibility  
        if ($downloadUrl -and $downloadUrl -ne "System.Xml.XmlElement") {
            try {
                Write-Host "  Testing URL: $downloadUrl" -ForegroundColor Gray
                $response = Invoke-WebRequest -Uri $downloadUrl -Method Head -UseBasicParsing -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "  Download URL: ✅ Accessible" -ForegroundColor Green
                } else {
                    Write-Host "  Download URL: ⚠️  Status $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  Download URL: ❌ Not accessible - $($_.Exception.Message)" -ForegroundColor Red
            }
        } elseif ($downloadUrl -eq "System.Xml.XmlElement") {
            Write-Host "  Download URL: ❌ XML parsing issue - check update XML structure" -ForegroundColor Red
        } else {
            Write-Host "  Download URL: ❌ Not specified" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🎯 Recommendations:" -ForegroundColor Magenta
    
    if (!$updateServers) {
        Write-Host "  1. Add <updateservers> section to manifest" -ForegroundColor White
    }
    
    if (!(Test-Path $UpdateXmlPath)) {
        Write-Host "  2. Generate update XML file" -ForegroundColor White
    }
    
    Write-Host "  3. Test in Joomla: Extensions → Manage → Update → Find Updates" -ForegroundColor White
    Write-Host "  4. Check Joomla error logs if updates don't appear" -ForegroundColor White
    
} catch {
    Write-Error "Failed to analyze files: $($_.Exception.Message)"
}