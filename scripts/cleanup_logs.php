<?php
// scripts/cleanup_logs.php
// CLI tool to prune and rotate sagutidloader logs.
// Usage: php scripts/cleanup_logs.php [--dir=path] [--max-bytes=5242880] [--keep=5] [--older-than-days=30]

$options = getopt('', ['dir::', 'max-bytes::', 'keep::', 'older-than-days::']);
$logDir = isset($options['dir']) ? $options['dir'] : __DIR__ . '/../logs';
$maxBytes = isset($options['max-bytes']) ? intval($options['max-bytes']) : (5 * 1024 * 1024);
$keep = isset($options['keep']) ? intval($options['keep']) : 5;
$olderThan = isset($options['older-than-days']) ? intval($options['older-than-days']) : 30;

if (!is_dir($logDir)) {
    echo "Log directory does not exist: $logDir\n";
    exit(1);
}

$files = glob(rtrim($logDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.log');
$now = time();
foreach ($files as $file) {
    // rotate large files
    if (filesize($file) > $maxBytes) {
        $i = 1;
        do {
            $rotated = $file . '.' . $i;
            $i++;
        } while (file_exists($rotated) && $i < 1000);
        @rename($file, $rotated);
        echo "Rotated $file -> $rotated\n";
    }
}

// prune based on age
$files = glob(rtrim($logDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.log*');
foreach ($files as $file) {
    $mtime = filemtime($file);
    if ($mtime && ($now - $mtime) > ($olderThan * 24 * 3600)) {
        @unlink($file);
        echo "Removed old log $file\n";
    }
}

// ensure only $keep rotations per base name
$grouped = [];
$all = glob(rtrim($logDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.*');
foreach ($all as $file) {
    $base = preg_replace('/\.[0-9]+(\.log)?$/', '.log', basename($file));
    $grouped[$base][] = $file;
}
foreach ($grouped as $base => $files) {
    usort($files, function($a, $b){ return filemtime($a) - filemtime($b); });
    if (count($files) > $keep) {
        $remove = array_slice($files, 0, count($files) - $keep);
        foreach ($remove as $f) { @unlink($f); echo "Pruned $f\n"; }
    }
}

echo "Cleanup complete.\n";
