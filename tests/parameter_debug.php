<?php
/**
 * Debug script for Sagutid Plugin Parameter Saving
 * 
 * Place this file in the tests folder and access via browser
 * to check parameter saving functionality and debug issues.
 * 
 * URL: http://yoursite.com/plugins/system/sagutidloader/tests/parameter_debug.php
 */

define('_JEXEC', 1);
define('JPATH_BASE', dirname(dirname(dirname(dirname(__FILE__)))));

// Include Joomla framework
require_once JPATH_BASE . '/includes/defines.php';
require_once JPATH_BASE . '/includes/framework.php';

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;

try {
    $app = Factory::getApplication('site');
    
    echo "<!DOCTYPE html><html><head><title>Sagutid Parameter Debug</title></head><body>";
    echo "<h1>🔧 Sagutid Plugin Parameter Debug</h1>";
    
    // Get plugin info
    $plugin = PluginHelper::getPlugin('system', 'sagutidloader');
    
    if (!$plugin) {
        echo "<p style='color: red;'>❌ Plugin niet gevonden of niet ingeschakeld!</p>";
        exit;
    }
    
    echo "<p style='color: green;'>✅ Plugin gevonden en ingeschakeld</p>";
    
    // Check plugin parameters
    echo "<h2>📋 Huidige Plugin Parameters</h2>";
    
    if (empty($plugin->params)) {
        echo "<p style='color: orange;'>⚠️ Nog geen parameters opgeslagen</p>";
    } else {
        $params = json_decode($plugin->params, true);
        echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 5px;'>";
        echo htmlspecialchars(json_encode($params, JSON_PRETTY_PRINT));
        echo "</pre>";
    }
    
    // Check debug files
    echo "<h2>📁 Debug Bestanden Status</h2>";
    
    $debugFiles = [
        'Parameter Save Debug' => JPATH_ROOT . '/tmp/sagutid_param_save_debug.json',
        'Prepare Data Debug' => JPATH_ROOT . '/tmp/sagutid_prepare_data_debug.json', 
        'Save Error Log' => JPATH_ROOT . '/tmp/sagutid_save_error.log',
        'Prepare Error Log' => JPATH_ROOT . '/tmp/sagutid_prepare_error.log'
    ];
    
    foreach ($debugFiles as $name => $file) {
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $fileTime = date('Y-m-d H:i:s', filemtime($file));
            echo "<h3>📄 {$name} <small>(laatst gewijzigd: {$fileTime})</small></h3>";
            echo "<pre style='background: #f0f8ff; padding: 10px; border: 1px solid #ccc; border-radius: 5px; max-height: 300px; overflow-y: auto;'>";
            echo htmlspecialchars($content);
            echo "</pre>";
        } else {
            echo "<p>📁 {$name}: <span style='color: #666;'>Bestand niet gevonden</span></p>";
        }
    }
    
    // Check plugin files
    echo "<h2>🗂️ Plugin Bestandsstructuur</h2>";
    
    $pluginPath = JPATH_PLUGINS . '/system/sagutidloader/';
    $helperPath = $pluginPath . 'src/';
    
    $files = [
        'Main Plugin' => $pluginPath . 'sagutidloader.php',
        'ParameterHelper' => $helperPath . 'ParameterHelper.php',
        'PluginFormHelper' => $helperPath . 'PluginFormHelper.php',
        'DocumentHelper' => $helperPath . 'DocumentHelper.php',
        'DebugModeHelper' => $helperPath . 'DebugModeHelper.php',
        'AssetManager' => $helperPath . 'AssetManager.php',
        'DiagnosticsService' => $helperPath . 'DiagnosticsService.php'
    ];
    
    echo "<ul>";
    foreach ($files as $name => $file) {
        $exists = file_exists($file);
        $icon = $exists ? '✅' : '❌';
        $size = $exists ? ' (' . round(filesize($file) / 1024, 1) . ' KB)' : '';
        echo "<li>{$icon} {$name}: {$file}{$size}</li>";
    }
    echo "</ul>";
    
    // Test parameter helper
    echo "<h2>🧪 Parameter Helper Test</h2>";
    
    if (file_exists($helperPath . 'ParameterHelper.php')) {
        require_once $helperPath . 'ParameterHelper.php';
        
        // Test parameter extraction
        $testParams = new \Joomla\Registry\Registry($plugin->params);
        $debug = \PlgSystemSagutidloader\Helper\ParameterHelper::getBoolParam($testParams, 'debug', false);
        $forceReregister = \PlgSystemSagutidloader\Helper\ParameterHelper::getBoolParam($testParams, 'force_reregister', false);
        $debugIps = \PlgSystemSagutidloader\Helper\ParameterHelper::getStringParam($testParams, 'debug_allowed_ips', '');
        
        echo "<div style='background: #e8f5e8; padding: 10px; border: 1px solid #4caf50; border-radius: 5px;'>";
        echo "<p><strong>Debug Mode:</strong> " . ($debug ? '🟢 AAN' : '🔴 UIT') . "</p>";
        echo "<p><strong>Force Reregister:</strong> " . ($forceReregister ? '🟢 AAN' : '🔴 UIT') . "</p>";
        echo "<p><strong>Debug Allowed IPs:</strong> " . (empty($debugIps) ? '<em>Geen</em>' : htmlspecialchars($debugIps)) . "</p>";
        echo "</div>";
    } else {
        echo "<p style='color: red;'>❌ ParameterHelper.php niet gevonden</p>";
    }
    
    // Test asset generation
    echo "<h2>🎨 Asset Manager Test</h2>";
    
    if (file_exists($helperPath . 'AssetManager.php')) {
        require_once $helperPath . 'AssetManager.php';
        
        $assetUrl = \PlgSystemSagutidloader\Helper\AssetManager::computeAssetUrl();
        echo "<p><strong>Asset URL:</strong> <code>{$assetUrl}</code></p>";
        
        // Check if asset files exist
        $assetFiles = [
            'manifest.webmanifest' => $assetUrl . 'manifest.webmanifest',
            'main.bundle.js' => $assetUrl . 'dist/main.bundle.js',
            'vendors.js' => $assetUrl . 'dist/vendors.js',
            'styles.bundle.css' => $assetUrl . 'dist/styles.bundle.css'
        ];
        
        echo "<h3>Asset Bestanden Controle</h3>";
        echo "<ul>";
        foreach ($assetFiles as $name => $url) {
            $localPath = str_replace(JURI::root(), JPATH_ROOT . '/', $url);
            $exists = file_exists($localPath);
            $icon = $exists ? '✅' : '❌';
            echo "<li>{$icon} {$name}: {$localPath}</li>";
        }
        echo "</ul>";
    }
    
    echo "</body></html>";

} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Fout: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre style='background: #ffe6e6; padding: 10px; border: 1px solid #ff0000; border-radius: 5px;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
?>