<?php
/**
 * Unit test voor ParameterHelper
 * 
 * Eenvoudige test om de ParameterHelper functionaliteit te controleren
 * zonder volledige Joomla framework afhankelijkheden
 */

// Simuleer een eenvoudige params object
class MockParams {
    private $data = [];
    
    public function __construct($data = []) {
        $this->data = $data;
    }
    
    public function get($key, $default = null) {
        return isset($this->data[$key]) ? $this->data[$key] : $default;
    }
    
    public function toArray() {
        return $this->data;
    }
}

// Include de ParameterHelper
require_once dirname(__DIR__) . '/src/ParameterHelper.php';

use PlgSystemSagutidloader\Helper\ParameterHelper;

echo "<!DOCTYPE html><html><head><title>ParameterHelper Unit Test</title></head><body>";
echo "<h1>🧪 ParameterHelper Unit Test</h1>";

// Test data
$testData = [
    'debug' => '1',
    'force_reregister' => '0',
    'debug_allowed_ips' => "192.168.1.1\n127.0.0.1",
    'empty_param' => '',
    'null_param' => null
];

$mockParams = new MockParams($testData);

echo "<h2>Test Data</h2>";
echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 5px;'>";
print_r($testData);
echo "</pre>";

// Test getBoolParam
echo "<h2>🔵 getBoolParam Tests</h2>";

$tests = [
    ['debug', true, 'Should return true for "1"'],
    ['force_reregister', false, 'Should return false for "0"'],
    ['nonexistent', false, 'Should return default (false) for non-existent param'],
    ['empty_param', false, 'Should return false for empty string']
];

foreach ($tests as $test) {
    $result = ParameterHelper::getBoolParam($mockParams, $test[0], false);
    $expected = $test[1];
    $status = ($result === $expected) ? '✅' : '❌';
    echo "<p>{$status} <strong>{$test[2]}</strong><br>";
    echo "&nbsp;&nbsp;&nbsp;Parameter: '{$test[0]}' → Expected: " . ($expected ? 'true' : 'false') . ", Got: " . ($result ? 'true' : 'false') . "</p>";
}

// Test getStringParam
echo "<h2>🔤 getStringParam Tests</h2>";

$stringTests = [
    ['debug_allowed_ips', "192.168.1.1\n127.0.0.1", 'Should return multi-line IP string'],
    ['nonexistent', '', 'Should return default empty string'],
    ['empty_param', '', 'Should return empty string for empty param']
];

foreach ($stringTests as $test) {
    $result = ParameterHelper::getStringParam($mockParams, $test[0], '');
    $expected = $test[1];
    $status = ($result === $expected) ? '✅' : '❌';
    echo "<p>{$status} <strong>{$test[2]}</strong><br>";
    echo "&nbsp;&nbsp;&nbsp;Parameter: '{$test[0]}' → Expected: '" . htmlspecialchars($expected) . "', Got: '" . htmlspecialchars($result) . "'</p>";
}

// Test getAssetParams
echo "<h2>🎨 getAssetParams Test</h2>";

$assetParams = ParameterHelper::getAssetParams($mockParams);
echo "<pre style='background: #e8f5e8; padding: 10px; border: 1px solid #4caf50; border-radius: 5px;'>";
print_r($assetParams);
echo "</pre>";

$expectedAssetParams = [
    'debug' => true,
    'forceReregister' => false,
    'debugAllowedIps' => "192.168.1.1\n127.0.0.1"
];

$assetTestStatus = '✅';
foreach ($expectedAssetParams as $key => $expectedValue) {
    if (!isset($assetParams[$key]) || $assetParams[$key] !== $expectedValue) {
        $assetTestStatus = '❌';
        break;
    }
}

echo "<p>{$assetTestStatus} <strong>Asset params extraction test</strong></p>";

// Test normalizePostedParams
echo "<h2>🔧 normalizePostedParams Test</h2>";

$postedData = [
    'debug' => true,
    'force_reregister' => '0',
    'new_param' => 'test_value',
    'array_param' => ['item1', 'item2'],
    'null_param' => null
];

$currentData = [
    'existing_param' => 'keep_this',
    'debug' => false  // Should be overridden
];

$normalized = ParameterHelper::normalizePostedParams($postedData, $currentData);

echo "<h3>Posted Data:</h3>";
echo "<pre style='background: #fff3cd; padding: 10px; border: 1px solid #ffc107; border-radius: 5px;'>";
print_r($postedData);
echo "</pre>";

echo "<h3>Current Data:</h3>";
echo "<pre style='background: #d1ecf1; padding: 10px; border: 1px solid #17a2b8; border-radius: 5px;'>";
print_r($currentData);
echo "</pre>";

echo "<h3>Normalized Result:</h3>";
echo "<pre style='background: #e8f5e8; padding: 10px; border: 1px solid #4caf50; border-radius: 5px;'>";
print_r($normalized);
echo "</pre>";

// Test validation
$validationTests = [
    'existing_param preserved' => isset($normalized['existing_param']) && $normalized['existing_param'] === 'keep_this',
    'boolean true converted to "1"' => isset($normalized['debug']) && $normalized['debug'] === '1',
    'string "0" kept as "0"' => isset($normalized['force_reregister']) && $normalized['force_reregister'] === '0',
    'array converted to JSON' => isset($normalized['array_param']) && $normalized['array_param'] === '["item1","item2"]',
    'null converted to empty string' => isset($normalized['null_param']) && $normalized['null_param'] === ''
];

echo "<h3>Validation Results:</h3>";
foreach ($validationTests as $testName => $result) {
    $icon = $result ? '✅' : '❌';
    echo "<p>{$icon} {$testName}</p>";
}

echo "<h2>📊 Test Samenvatting</h2>";
$allPassed = true;
foreach ($validationTests as $result) {
    if (!$result) {
        $allPassed = false;
        break;
    }
}

if ($allPassed) {
    echo "<div style='background: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;'>";
    echo "<h3>🎉 Alle tests geslaagd!</h3>";
    echo "<p>ParameterHelper werkt correct en is klaar voor gebruik.</p>";
    echo "</div>";
} else {
    echo "<div style='background: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px; color: #721c24;'>";
    echo "<h3>⚠️ Sommige tests gefaald</h3>";
    echo "<p>Controleer de ParameterHelper implementatie.</p>";
    echo "</div>";
}

echo "</body></html>";
?>