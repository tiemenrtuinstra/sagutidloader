<?php
/**
 * Log viewer helper voor unified logging test
 */

$logsDir = __DIR__ . '/../logs/';
$tempDir = __DIR__ . '/../tmp/';

if (!is_dir($logsDir)) {
    echo '<div class="status error">Logs directory does not exist: ' . htmlspecialchars($logsDir) . '</div>';
    exit;
}

$logFiles = [];

// Scan logs directory
if (is_dir($logsDir)) {
    $files = scandir($logsDir);
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'log') {
            $logFiles[] = [
                'name' => $file,
                'path' => $logsDir . $file,
                'type' => 'unified',
                'size' => filesize($logsDir . $file),
                'modified' => filemtime($logsDir . $file)
            ];
        }
    }
}

// Scan temp directory for legacy debug files
if (is_dir($tempDir)) {
    $files = scandir($tempDir);
    foreach ($files as $file) {
        if (strpos($file, 'sagutid_') === 0 && (pathinfo($file, PATHINFO_EXTENSION) === 'log' || pathinfo($file, PATHINFO_EXTENSION) === 'json')) {
            $logFiles[] = [
                'name' => $file,
                'path' => $tempDir . $file,
                'type' => 'legacy',
                'size' => filesize($tempDir . $file),
                'modified' => filemtime($tempDir . $file)
            ];
        }
    }
}

// Sort by modification time (newest first)
usort($logFiles, function($a, $b) {
    return $b['modified'] - $a['modified'];
});

if (empty($logFiles)) {
    echo '<div class="status warning">Geen logbestanden gevonden</div>';
    exit;
}

echo '<h4>Gevonden Logbestanden:</h4>';

foreach ($logFiles as $file) {
    $sizeKb = round($file['size'] / 1024, 2);
    $modifiedTime = date('Y-m-d H:i:s', $file['modified']);
    $typeClass = $file['type'] === 'unified' ? 'success' : 'warning';
    
    echo '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">';
    echo '<strong>' . htmlspecialchars($file['name']) . '</strong> ';
    echo '<span class="status ' . $typeClass . '" style="font-size: 12px;">' . strtoupper($file['type']) . '</span><br>';
    echo '<small>Size: ' . $sizeKb . ' KB | Modified: ' . $modifiedTime . '</small>';
    
    // Show last few lines of the file
    if (is_readable($file['path'])) {
        $lines = file($file['path'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines !== false) {
            $recentLines = array_slice($lines, -5); // Last 5 lines
            echo '<div class="log-output" style="margin-top: 5px; max-height: 150px; overflow-y: auto;">';
            foreach ($recentLines as $line) {
                echo htmlspecialchars($line) . "\n";
            }
            if (count($lines) > 5) {
                echo '<em>... en ' . (count($lines) - 5) . ' oudere entries</em>';
            }
            echo '</div>';
        } else {
            echo '<div class="status error">Kon bestand niet lezen</div>';
        }
    } else {
        echo '<div class="status error">Bestand niet toegankelijk</div>';
    }
    
    echo '</div>';
}
?>