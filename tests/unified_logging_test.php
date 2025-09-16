<?php
/**
 * Test voor het unified logging systeem
 * Test integratie tussen TypeScript Logger, DebugLogger en sagutidlogger_bridge
 */

// Bootstrap de plugin omgeving
if (!defined('_JEXEC')) {
    define('_JEXEC', 1);
}

// Include benodigde files
require_once __DIR__ . '/../src/DebugLogger.php';

use PlgSystemSagutidloader\Helper\DebugLogger;

?>
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified Logging System Test - Sagutid Plugin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .section h3 { margin-top: 0; color: #333; }
        .test-btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
        .test-btn:hover { background: #005a87; }
        .test-btn.success { background: #28a745; }
        .test-btn.warning { background: #ffc107; color: #212529; }
        .test-btn.error { background: #dc3545; }
        .log-output { background: #f8f9fa; padding: 15px; border-left: 4px solid #007cba; margin: 10px 0; font-family: monospace; font-size: 14px; white-space: pre-wrap; }
        .status { padding: 5px 10px; border-radius: 3px; margin: 5px 0; display: inline-block; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.warning { background: #fff3cd; color: #856404; }
        .results { margin-top: 20px; }
        .log-viewer { max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Unified Logging System Test</h1>
        <p>Test de integratie tussen TypeScript Logger, PHP DebugLogger, en sagutidlogger_bridge.php</p>

        <!-- PHP DebugLogger Tests -->
        <div class="section">
            <h3>📝 PHP DebugLogger Tests</h3>
            
            <?php
            $phpResults = [];
            
            // Test 1: Info logging
            $result1 = DebugLogger::info('PHP Info test message', 'TestPHP', ['test_id' => 1, 'timestamp' => date('c')]);
            $phpResults['info'] = $result1;
            
            // Test 2: Success logging  
            $result2 = DebugLogger::success('PHP Success test message', 'TestPHP', ['test_id' => 2, 'status' => 'completed']);
            $phpResults['success'] = $result2;
            
            // Test 3: Warning logging
            $result3 = DebugLogger::warn('PHP Warning test message', 'TestPHP', ['test_id' => 3, 'severity' => 'medium']);
            $phpResults['warning'] = $result3;
            
            // Test 4: Error logging
            $result4 = DebugLogger::error('PHP Error test message', 'TestPHP', ['test_id' => 4, 'critical' => true]);
            $phpResults['error'] = $result4;
            
            // Test 5: Legacy debug logging (parameter save)
            $debugInfo = [
                'timestamp' => date('Y-m-d H:i:s'),
                'context' => 'test_context',
                'table_element' => 'sagutidloader_test',
                'posted_params' => ['debug' => '1', 'test_mode' => '1'],
                'merged_params' => ['debug' => '1', 'test_mode' => '1', 'existing' => 'value']
            ];
            $result5 = DebugLogger::logParameterSave($debugInfo);
            $phpResults['parameter_save'] = $result5;
            ?>
            
            <div class="results">
                <h4>PHP Test Resultaten:</h4>
                <?php foreach ($phpResults as $test => $success): ?>
                    <div class="status <?php echo $success ? 'success' : 'error'; ?>">
                        <?php echo ucfirst($test); ?>: <?php echo $success ? 'SLAAGDE' : 'GEFAALD'; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- TypeScript Logger Tests -->
        <div class="section">
            <h3>🌐 TypeScript Logger Tests</h3>
            <p>Deze tests sturen logs naar sagutidlogger_bridge.php die ze doorsturen naar DebugLogger:</p>
            
            <button class="test-btn" onclick="testTSInfo()">Test Info Log</button>
            <button class="test-btn success" onclick="testTSSuccess()">Test Success Log</button>
            <button class="test-btn warning" onclick="testTSWarning()">Test Warning Log</button>
            <button class="test-btn error" onclick="testTSError()">Test Error Log</button>
            <button class="test-btn" onclick="testTSBatch()">Test Batch Logs</button>
            
            <div id="ts-results" class="results"></div>
        </div>

        <!-- Bridge Endpoint Test -->
        <div class="section">
            <h3>🌉 Bridge Endpoint Test</h3>
            <p>Test directe communicatie met sagutidlogger_bridge.php:</p>
            
            <button class="test-btn" onclick="testBridgeEndpoint()">Test Bridge Directly</button>
            
            <div id="bridge-results" class="results"></div>
        </div>

        <!-- Log File Viewer -->
        <div class="section">
            <h3>📊 Log Files Viewer</h3>
            <p>Bekijk de gegenereerde logbestanden:</p>
            
            <button class="test-btn" onclick="loadLogFiles()">Refresh Log Files</button>
            
            <div id="log-files" class="log-viewer">
                <em>Klik "Refresh Log Files" om logs te bekijken...</em>
            </div>
        </div>

        <!-- System Status -->
        <div class="section">
            <h3>⚙️ System Status</h3>
            <?php
            $logsDir = __DIR__ . '/../logs/';
            $tempDir = defined('JPATH_ROOT') ? \JPATH_ROOT . '/tmp' : __DIR__ . '/../tmp';
            ?>
            
            <div class="status <?php echo is_dir($logsDir) ? 'success' : 'error'; ?>">
                Logs Directory: <?php echo is_dir($logsDir) ? 'EXISTS' : 'MISSING'; ?> (<?php echo $logsDir; ?>)
            </div>
            
            <div class="status <?php echo is_dir($tempDir) ? 'success' : 'error'; ?>">
                Temp Directory: <?php echo is_dir($tempDir) ? 'EXISTS' : 'MISSING'; ?> (<?php echo $tempDir; ?>)
            </div>
            
            <div class="status <?php echo file_exists(__DIR__ . '/../sagutidlogger_bridge.php') ? 'success' : 'error'; ?>">
                Bridge Endpoint: <?php echo file_exists(__DIR__ . '/../sagutidlogger_bridge.php') ? 'EXISTS' : 'MISSING'; ?>
            </div>
        </div>
    </div>

    <script>
        // Mock SAGUTID_CONFIG for testing
        window.SAGUTID_CONFIG = {
            debugMode: true,
            logToServer: true,
            loggerEndpoint: '/sagutidloader/sagutidlogger_bridge.php'
        };

        // TypeScript Logger mock (simplified version for testing)
        const LogType = {
            INFO: 'info',
            SUCCESS: 'success', 
            WARN: 'warn',
            ERROR: 'error'
        };

        class Logger {
            static async sendLog(type, message, context = 'TestTS', args = []) {
                const payload = {
                    time: new Date().toISOString(),
                    type: type,
                    level: this.getLevel(type),
                    context: context,
                    message: message,
                    args: args,
                    origin: window.location.href,
                    userAgent: navigator.userAgent
                };

                try {
                    const response = await fetch('/sagutidloader/sagutidlogger_bridge.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    return { success: response.ok, result: result };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            static getLevel(type) {
                const map = { info: 0, success: 1, warn: 2, error: 3 };
                return map[type] || 0;
            }
        }

        // Test functions
        async function testTSInfo() {
            const result = await Logger.sendLog(LogType.INFO, 'TypeScript Info test message', 'TestTS', [{ test_id: 'ts_1', source: 'typescript' }]);
            showResult('ts-results', 'Info Log', result);
        }

        async function testTSSuccess() {
            const result = await Logger.sendLog(LogType.SUCCESS, 'TypeScript Success test message', 'TestTS', [{ test_id: 'ts_2', source: 'typescript' }]);
            showResult('ts-results', 'Success Log', result);
        }

        async function testTSWarning() {
            const result = await Logger.sendLog(LogType.WARN, 'TypeScript Warning test message', 'TestTS', [{ test_id: 'ts_3', source: 'typescript' }]);
            showResult('ts-results', 'Warning Log', result);
        }

        async function testTSError() {
            const result = await Logger.sendLog(LogType.ERROR, 'TypeScript Error test message', 'TestTS', [{ test_id: 'ts_4', source: 'typescript' }]);
            showResult('ts-results', 'Error Log', result);
        }

        async function testTSBatch() {
            const tests = [
                Logger.sendLog(LogType.INFO, 'Batch test 1', 'TestTSBatch'),
                Logger.sendLog(LogType.SUCCESS, 'Batch test 2', 'TestTSBatch'),
                Logger.sendLog(LogType.WARN, 'Batch test 3', 'TestTSBatch'),
                Logger.sendLog(LogType.ERROR, 'Batch test 4', 'TestTSBatch')
            ];
            
            const results = await Promise.all(tests);
            const success = results.every(r => r.success);
            showResult('ts-results', 'Batch Logs', { success: success, results: results });
        }

        async function testBridgeEndpoint() {
            const testPayload = {
                time: new Date().toISOString(),
                type: 'info',
                level: 0,
                context: 'BridgeTest',
                message: 'Direct bridge endpoint test',
                args: [{ direct: true, test: 'endpoint' }],
                origin: window.location.href,
                userAgent: 'Test Script'
            };

            try {
                const response = await fetch('/sagutidloader/sagutidlogger_bridge.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testPayload)
                });
                
                const result = await response.json();
                showResult('bridge-results', 'Bridge Test', { success: response.ok, result: result });
            } catch (error) {
                showResult('bridge-results', 'Bridge Test', { success: false, error: error.message });
            }
        }

        async function loadLogFiles() {
            try {
                const response = await fetch('/sagutidloader/tests/log_viewer.php');
                const html = await response.text();
                document.getElementById('log-files').innerHTML = html;
            } catch (error) {
                document.getElementById('log-files').innerHTML = '<div class="status error">Error loading log files: ' + error.message + '</div>';
            }
        }

        function showResult(containerId, testName, result) {
            const container = document.getElementById(containerId);
            const statusClass = result.success ? 'success' : 'error';
            const status = result.success ? 'SLAAGDE' : 'GEFAALD';
            
            const resultHtml = `
                <div class="status ${statusClass}">
                    ${testName}: ${status}
                </div>
                <div class="log-output">${JSON.stringify(result, null, 2)}</div>
            `;
            
            container.innerHTML += resultHtml;
        }
    </script>
</body>
</html>