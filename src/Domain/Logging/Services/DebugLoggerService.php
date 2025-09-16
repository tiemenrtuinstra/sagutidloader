<?php

namespace PlgSystemSagutidloader\Domain\Logging\Services;

use PlgSystemSagutidloader\Shared\Enums\LogLevel;
use PlgSystemSagutidloader\Shared\Enums\LogType;
use PlgSystemSagutidloader\Shared\Traits\FileOperationsTrait;

/**
 * Unified debug logging service for DDD Logging domain
 * Integrates TypeScript and PHP logging, compatible with sagutidlogger.php endpoint
 */
class DebugLoggerService
{
    use FileOperationsTrait;

    /**
     * Get main logs directory (for unified logging with sagutidlogger.php)
     *
     * @return string Logs directory path
     */
    private static function getLogsDir(): string
    {
        $pluginBase = defined('JPATH_PLUGINS') ? constant('JPATH_PLUGINS') . '/system/sagutidloader/' : __DIR__ . '/../../../../';
        return $pluginBase . 'logs/';
    }

    /**
     * Get temporary directory path (for legacy debug files)
     *
     * @return string Temporary directory path
     */
    private static function getTempDir(): string
    {
        return defined('JPATH_ROOT') ? constant('JPATH_ROOT') . '/tmp' : __DIR__ . '/../../../../tmp';
    }

    /**
     * Ensure logs directory exists
     *
     * @return void
     */
    private static function ensureLogsDir(): void
    {
        $logsDir = self::getLogsDir();
        if (!is_dir($logsDir)) {
            @mkdir($logsDir, 0755, true);
        }
    }

    /**
     * Ensure temporary directory exists
     *
     * @return void
     */
    private static function ensureTempDir(): void
    {
        $tmpDir = self::getTempDir();
        if (!is_dir($tmpDir)) {
            @mkdir($tmpDir, 0755, true);
        }
    }

    /**
     * Write unified log entry (compatible with sagutidlogger.php format)
     *
     * @param LogType|string $type Log type (info, success, warn, error)
     * @param string $message Log message
     * @param string $context Log context/category
     * @param array $args Additional arguments
     * @param array $meta Additional metadata
     * @return bool Success status
     */
    public static function log(LogType|string $type, string $message, string $context = 'PHP', array $args = [], array $meta = []): bool
    {
        try {
            self::ensureLogsDir();

            // Normalize context for filename
            $normalizedContext = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $context);
            $logFile = self::getLogsDir() . $normalizedContext . '.log';

            // Normalize type
            $typeEnum = $type instanceof LogType ? $type : LogType::fromValue($type);

            // Create unified log entry format (same as sagutidlogger.php)
            $time = date(DATE_ATOM);
            $origin = $_SERVER['REQUEST_URI'] ?? 'PHP';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'PHP';

            $entry = sprintf(
                "%s [%s] %s - %s | origin=%s ua=%s\n",
                $time,
                $typeEnum->toUpperCase(),
                $context,
                str_replace("\n", " ", trim($message)),
                $origin,
                $userAgent
            );

            if (!empty($args)) {
                $entry .= "ARGS: " . json_encode($args) . "\n";
            }

            if (!empty($meta)) {
                $entry .= "META: " . json_encode($meta) . "\n";
            }

            // Use trait for atomic file write
            return (new self())->writeFileAtomic($logFile, $entry, true);

        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Convenience methods for different log levels
     */
    public static function info(string $message, string $context = 'PHP', array $args = [], array $meta = []): bool
    {
        return self::log(LogType::INFO, $message, $context, $args, $meta);
    }

    public static function success(string $message, string $context = 'PHP', array $args = [], array $meta = []): bool
    {
        return self::log(LogType::SUCCESS, $message, $context, $args, $meta);
    }

    public static function warn(string $message, string $context = 'PHP', array $args = [], array $meta = []): bool
    {
        return self::log(LogType::WARN, $message, $context, $args, $meta);
    }

    public static function error(string $message, string $context = 'PHP', array $args = [], array $meta = []): bool
    {
        return self::log(LogType::ERROR, $message, $context, $args, $meta);
    }

    /**
     * Write JSON debug file
     *
     * @param string $filename Filename (without path)
     * @param array $data Data to write as JSON
     * @return bool Success status
     */
    public static function writeJsonDebug(string $filename, array $data): bool
    {
        try {
            self::ensureTempDir();
            $filePath = self::getTempDir() . '/' . $filename;
            $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            return (new self())->writeFileAtomic($filePath, $jsonData, false);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Write error log entry
     *
     * @param string $filename Log filename (without path)
     * @param string $message Error message
     * @param string $prefix Error prefix (default: 'ERROR')
     * @return bool Success status
     */
    public static function writeErrorLog(string $filename, string $message, string $prefix = 'ERROR'): bool
    {
        try {
            self::ensureTempDir();
            $filePath = self::getTempDir() . '/' . $filename;
            $logEntry = date('Y-m-d H:i:s') . " [{$prefix}]: " . $message . "\n";
            return (new self())->writeFileAtomic($filePath, $logEntry, true);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Log parameter save debug info
     *
     * @param array $debugInfo Debug information array
     * @return bool Success status
     */
    public static function logParameterSave(array $debugInfo): bool
    {
        // Write to both legacy debug file and unified log
        $jsonResult = self::writeJsonDebug('sagutid_param_save_debug.json', $debugInfo);

        $message = sprintf(
            'Parameter save: element=%s, posted_params=%d, merged_params=%d',
            $debugInfo['table_element'] ?? 'unknown',
            count($debugInfo['posted_params'] ?? []),
            count($debugInfo['merged_params'] ?? [])
        );

        $logResult = self::info($message, 'ParameterSave', [], $debugInfo);

        return $jsonResult && $logResult;
    }

    /**
     * Log data preparation debug info
     *
     * @param array $debugInfo Debug information array
     * @return bool Success status
     */
    public static function logDataPreparation(array $debugInfo): bool
    {
        // Write to both legacy debug file and unified log
        $jsonResult = self::writeJsonDebug('sagutid_prepare_data_debug.json', $debugInfo);

        $message = sprintf(
            'Data preparation: context=%s, current_params=%d, final_params=%d',
            $debugInfo['context'] ?? 'unknown',
            count($debugInfo['current_params'] ?? []),
            count($debugInfo['final_data_params'] ?? [])
        );

        $logResult = self::info($message, 'DataPreparation', [], $debugInfo);

        return $jsonResult && $logResult;
    }

    /**
     * Log parameter save error
     *
     * @param string $errorMessage Error message
     * @return bool Success status
     */
    public static function logSaveError(string $errorMessage): bool
    {
        // Write to both legacy error log and unified log
        $legacyResult = self::writeErrorLog('sagutid_save_error.log', $errorMessage);
        $unifiedResult = self::error($errorMessage, 'ParameterSave');

        return $legacyResult && $unifiedResult;
    }

    /**
     * Log data preparation error
     *
     * @param string $errorMessage Error message
     * @return bool Success status
     */
    public static function logPreparationError(string $errorMessage): bool
    {
        // Write to both legacy error log and unified log
        $legacyResult = self::writeErrorLog('sagutid_prepare_error.log', $errorMessage, 'PREPARE ERROR');
        $unifiedResult = self::error($errorMessage, 'DataPreparation');

        return $legacyResult && $unifiedResult;
    }

    /**
     * Log form preparation error
     *
     * @param string $errorMessage Error message
     * @return bool Success status
     */
    public static function logFormError(string $errorMessage): bool
    {
        // Write to both legacy error log and unified log
        $legacyResult = self::writeErrorLog('sagutid_form_error.log', $errorMessage, 'FORM ERROR');
        $unifiedResult = self::error($errorMessage, 'FormPreparation');

        return $legacyResult && $unifiedResult;
    }

    /**
     * Log general plugin error
     *
     * @param string $errorMessage Error message
     * @param string $context Context where error occurred
     * @return bool Success status
     */
    public static function logPluginError(string $errorMessage, string $context = 'GENERAL'): bool
    {
        $message = "[{$context}] " . $errorMessage;
        return self::writeErrorLog('sagutid_plugin_error.log', $message);
    }

    /**
     * Get debug file path
     *
     * @param string $filename Debug filename
     * @return string Full path to debug file
     */
    public static function getDebugFilePath(string $filename): string
    {
        return self::getTempDir() . '/' . $filename;
    }

    /**
     * Check if debug file exists
     *
     * @param string $filename Debug filename
     * @return bool True if file exists
     */
    public static function debugFileExists(string $filename): bool
    {
        return file_exists(self::getDebugFilePath($filename));
    }

    /**
     * Read debug file contents
     *
     * @param string $filename Debug filename
     * @return string|false File contents or false on failure
     */
    public static function readDebugFile(string $filename): string|false
    {
        $filePath = self::getDebugFilePath($filename);
        return (new self())->readFileSafe($filePath);
    }

    /**
     * Delete debug file
     *
     * @param string $filename Debug filename
     * @return bool Success status
     */
    public static function deleteDebugFile(string $filename): bool
    {
        $filePath = self::getDebugFilePath($filename);
        return (new self())->deleteFileSafe($filePath);
    }

    /**
     * Clean up old debug files (older than specified days)
     *
     * @param int $daysOld Number of days old (default: 7)
     * @return int Number of files cleaned up
     */
    public static function cleanupOldDebugFiles(int $daysOld = 7): int
    {
        try {
            $tmpDir = self::getTempDir();
            if (!is_dir($tmpDir)) {
                return 0;
            }

            $cutoffTime = time() - ($daysOld * 24 * 60 * 60);
            $cleaned = 0;

            $files = glob($tmpDir . '/sagutid_*');
            foreach ($files as $file) {
                if (is_file($file) && filemtime($file) < $cutoffTime) {
                    if ((new self())->deleteFileSafe($file)) {
                        $cleaned++;
                    }
                }
            }

            return $cleaned;
        } catch (\Throwable $e) {
            return 0;
        }
    }
}