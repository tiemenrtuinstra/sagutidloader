<?php
// Simple server-side logger for the sagutidloader plugin.
// Writes log entries to logs/{context}.log and rotates when file exceeds MAX_BYTES.

header('Content-Type: application/json');

// Configurable via environment or global constants
$MAX_BYTES = defined('SAGUTID_LOG_MAX_BYTES') ? SAGUTID_LOG_MAX_BYTES : 5 * 1024 * 1024; // 5 MB default
$MAX_ROTATIONS = defined('SAGUTID_LOG_MAX_ROTATIONS') ? SAGUTID_LOG_MAX_ROTATIONS : 5;
$LOG_DIR = defined('SAGUTID_LOG_DIR') ? SAGUTID_LOG_DIR : (__DIR__ . DIRECTORY_SEPARATOR . 'logs');
if (!file_exists($LOG_DIR)) {
    @mkdir($LOG_DIR, 0755, true);
}

// Optional token authentication: define SAGUTID_LOG_TOKEN in server or config to require it
$REQUIRE_TOKEN = defined('SAGUTID_LOG_TOKEN');

// Minimum level to persist (0=LOG/INFO,1=SUCCESS,2=WARN,3=ERROR) - default 0
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

// Normalize fields
$context = isset($data['context']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '_', $data['context']) : 'general';
$time = isset($data['time']) ? $data['time'] : date(DATE_ATOM);
$type = isset($data['type']) ? $data['type'] : 'INFO';
$message = isset($data['message']) ? $data['message'] : '';
$args = isset($data['args']) ? $data['args'] : null;
$origin = isset($data['origin']) ? $data['origin'] : '';
$ua = isset($data['userAgent']) ? $data['userAgent'] : '';

// Optional token authentication via header X-Sagutid-Token or SAGUTID_LOG_TOKEN constant
if ($REQUIRE_TOKEN) {
    $provided = isset($_SERVER['HTTP_X_SAGUTID_TOKEN']) ? $_SERVER['HTTP_X_SAGUTID_TOKEN'] : (isset($data['token']) ? $data['token'] : null);
    if (!$provided || $provided !== SAGUTID_LOG_TOKEN) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'unauthorized']);
        exit;
    }
}

// Level filtering: expect 'level' numeric field or infer from type
$level = isset($data['level']) ? intval($data['level']) : null;
if ($level === null) {
    $map = ['INFO' => 0, 'LOG' => 0, 'SUCCESS' => 1, 'WARN' => 2, 'ERROR' => 3];
    $level = isset($map[strtoupper($type)]) ? $map[strtoupper($type)] : 0;
}
if ($level < $MIN_PERSIST_LEVEL) {
    // Not persisted by server config; return success but don't write
    echo json_encode(['ok' => true, 'skipped' => true]);
    http_response_code(200);
    exit;
}

$logFile = $LOG_DIR . DIRECTORY_SEPARATOR . $context . '.log';
$maxBytes = $MAX_BYTES;

$entry = sprintf("%s [%s] %s - %s | origin=%s ua=%s\n", $time, $type, $context, str_replace("\n", " ", trim($message)), $origin, $ua);
if ($args) {
    $entry .= "ARGS: " . json_encode($args) . "\n";
}

// Rotate if file too large
clearstatcache(false, $logFile);
if (file_exists($logFile) && filesize($logFile) > $maxBytes) {
    // shift rotations up to $MAX_ROTATIONS
    for ($i = $MAX_ROTATIONS - 1; $i >= 0; $i--) {
        $from = $LOG_DIR . DIRECTORY_SEPARATOR . $context . ($i === 0 ? '.log' : ('.' . $i . '.log'));
        $to = $LOG_DIR . DIRECTORY_SEPARATOR . $context . '.' . ($i + 1) . '.log';
        if (file_exists($from)) {
            @rename($from, $to);
        }
    }
}

// Append atomically
$fp = @fopen($logFile, 'a');
if ($fp) {
    @flock($fp, LOCK_EX);
    @fwrite($fp, $entry);
    @flock($fp, LOCK_UN);
    @fclose($fp);

    // Prune older rotations beyond MAX_ROTATIONS
    $files = glob($LOG_DIR . DIRECTORY_SEPARATOR . $context . '.*.log');
    if ($files && count($files) > $MAX_ROTATIONS) {
        usort($files, function($a, $b){ return filemtime($a) - filemtime($b); });
        $remove = array_slice($files, 0, count($files) - $MAX_ROTATIONS);
        foreach ($remove as $f) { @unlink($f); }
    }

    echo json_encode(['ok' => true]);
    http_response_code(200);
    exit;
} else {
    echo json_encode(['ok' => false, 'error' => 'cannot_write']);
    http_response_code(500);
    exit;
}
