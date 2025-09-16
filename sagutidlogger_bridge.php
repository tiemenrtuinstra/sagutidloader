<?php
/**
 * Enhanced logging endpoint that bridges TypeScript Logger and PHP DebugLogger
 * Extends sagutidlogger.php functionality with DebugLogger integration
 */

// Include the DebugLogger for unified logging
require_once __DIR__ . '/src/DebugLogger.php';

use PlgSystemSagutidloader\Helper\DebugLogger;

header('Content-Type: application/json');

// Configuration - same as original sagutidlogger.php
$MAX_BYTES = defined('SAGUTID_LOG_MAX_BYTES') ? SAGUTID_LOG_MAX_BYTES : 5 * 1024 * 1024; // 5 MB default
$MAX_ROTATIONS = defined('SAGUTID_LOG_MAX_ROTATIONS') ? SAGUTID_LOG_MAX_ROTATIONS : 5;
$LOG_DIR = defined('SAGUTID_LOG_DIR') ? SAGUTID_LOG_DIR : (__DIR__ . DIRECTORY_SEPARATOR . 'logs');
if (!file_exists($LOG_DIR)) {
    @mkdir($LOG_DIR, 0755, true);
}

// Optional token authentication
$REQUIRE_TOKEN = defined('SAGUTID_LOG_TOKEN');
$MIN_PERSIST_LEVEL = defined('SAGUTID_LOG_MIN_LEVEL') ? intval(SAGUTID_LOG_MIN_LEVEL) : 0;

$input = file_get_contents('php://input');
if (!$input) {
    echo json_encode(['ok' => false, 'error' => 'empty_payload']);
    http_response_code(400);
    exit;
}

$data = json_decode($input, true);
if (!$data) {
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    http_response_code(400);
    exit;
}

// Normalize fields (same as original)
$context = isset($data['context']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '_', $data['context']) : 'general';
$time = isset($data['time']) ? $data['time'] : date(DATE_ATOM);
$type = isset($data['type']) ? strtolower($data['type']) : 'info';
$message = isset($data['message']) ? $data['message'] : '';
$args = isset($data['args']) ? $data['args'] : [];
$origin = isset($data['origin']) ? $data['origin'] : '';
$ua = isset($data['userAgent']) ? $data['userAgent'] : '';

// Token authentication (same as original)
if ($REQUIRE_TOKEN) {
    $provided = isset($_SERVER['HTTP_X_SAGUTID_TOKEN']) ? $_SERVER['HTTP_X_SAGUTID_TOKEN'] : (isset($data['token']) ? $data['token'] : null);
    if (!$provided || $provided !== SAGUTID_LOG_TOKEN) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'unauthorized']);
        exit;
    }
}

// Level filtering (same as original)
$level = isset($data['level']) ? intval($data['level']) : null;
if ($level === null) {
    $map = ['info' => 0, 'log' => 0, 'success' => 1, 'warn' => 2, 'error' => 3];
    $level = isset($map[strtolower($type)]) ? $map[strtolower($type)] : 0;
}
if ($level < $MIN_PERSIST_LEVEL) {
    echo json_encode(['ok' => true, 'skipped' => true]);
    http_response_code(200);
    exit;
}

// **NEW: Use DebugLogger for unified logging**
try {
    // Normalize type to DebugLogger constants
    $normalizedType = $type;
    switch (strtolower($type)) {
        case 'log':
        case 'info':
            $normalizedType = DebugLogger::TYPE_INFO;
            break;
        case 'success':
            $normalizedType = DebugLogger::TYPE_SUCCESS;
            break;
        case 'warn':
        case 'warning':
            $normalizedType = DebugLogger::TYPE_WARN;
            break;
        case 'error':
            $normalizedType = DebugLogger::TYPE_ERROR;
            break;
    }
    
    // Create metadata for enhanced logging
    $meta = [
        'timestamp' => $time,
        'origin' => $origin,
        'userAgent' => $ua,
        'level' => $level,
        'source' => 'TypeScript',
        'endpoint' => 'sagutidlogger_bridge'
    ];
    
    // Use DebugLogger unified logging
    $success = DebugLogger::log($normalizedType, $message, $context, $args, $meta);
    
    if ($success) {
        echo json_encode(['ok' => true, 'method' => 'DebugLogger']);
        http_response_code(200);
        exit;
    } else {
        // Fallback to original sagutidlogger.php method
        throw new Exception('DebugLogger failed, using fallback');
    }
    
} catch (\Throwable $e) {
    // **FALLBACK: Original sagutidlogger.php behavior**
    $logFile = $LOG_DIR . DIRECTORY_SEPARATOR . $context . '.log';
    
    $entry = sprintf("%s [%s] %s - %s | origin=%s ua=%s\n", $time, strtoupper($type), $context, str_replace("\n", " ", trim($message)), $origin, $ua);
    if ($args) {
        $entry .= "ARGS: " . json_encode($args) . "\n";
    }

    // Rotate if file too large (same as original)
    clearstatcache(false, $logFile);
    if (file_exists($logFile) && filesize($logFile) > $MAX_BYTES) {
        for ($i = $MAX_ROTATIONS - 1; $i >= 0; $i--) {
            $from = $LOG_DIR . DIRECTORY_SEPARATOR . $context . ($i === 0 ? '.log' : ('.' . $i . '.log'));
            $to = $LOG_DIR . DIRECTORY_SEPARATOR . $context . '.' . ($i + 1) . '.log';
            if (file_exists($from)) {
                @rename($from, $to);
            }
        }
    }

    // Append atomically (same as original)
    $fp = @fopen($logFile, 'a');
    if ($fp) {
        @flock($fp, LOCK_EX);
        @fwrite($fp, $entry);
        @flock($fp, LOCK_UN);
        @fclose($fp);

        // Prune older rotations (same as original)
        $files = glob($LOG_DIR . DIRECTORY_SEPARATOR . $context . '.*.log');
        if ($files && count($files) > $MAX_ROTATIONS) {
            usort($files, function($a, $b){ return filemtime($a) - filemtime($b); });
            $remove = array_slice($files, 0, count($files) - $MAX_ROTATIONS);
            foreach ($remove as $f) { @unlink($f); }
        }

        echo json_encode(['ok' => true, 'method' => 'fallback']);
        http_response_code(200);
        exit;
    } else {
        echo json_encode(['ok' => false, 'error' => 'cannot_write']);
        http_response_code(500);
        exit;
    }
}