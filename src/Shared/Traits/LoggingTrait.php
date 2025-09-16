<?php

namespace PlgSystemSagutidloader\Shared\Traits;

use PlgSystemSagutidloader\Shared\Enums\LogType;
use PlgSystemSagutidloader\Shared\Enums\LogLevel;

/**
 * Logging trait for common logging operations
 */
trait LoggingTrait
{
    /**
     * Log message with context
     * 
     * @param string $message Log message
     * @param LogType $type Log type
     * @param string $context Log context
     * @param array $data Additional data
     * @return void
     */
    protected function log(string $message, LogType $type = LogType::INFO, string $context = 'App', array $data = []): void
    {
        // This will be implemented by classes using this trait
        // or delegated to a logger service
    }

    /**
     * Log info message
     * 
     * @param string $message Message to log
     * @param string $context Context
     * @param array $data Additional data
     * @return void
     */
    protected function logInfo(string $message, string $context = 'App', array $data = []): void
    {
        $this->log($message, LogType::INFO, $context, $data);
    }

    /**
     * Log success message
     * 
     * @param string $message Message to log
     * @param string $context Context
     * @param array $data Additional data
     * @return void
     */
    protected function logSuccess(string $message, string $context = 'App', array $data = []): void
    {
        $this->log($message, LogType::SUCCESS, $context, $data);
    }

    /**
     * Log warning message
     * 
     * @param string $message Message to log
     * @param string $context Context
     * @param array $data Additional data
     * @return void
     */
    protected function logWarning(string $message, string $context = 'App', array $data = []): void
    {
        $this->log($message, LogType::WARN, $context, $data);
    }

    /**
     * Log error message
     * 
     * @param string $message Message to log
     * @param string $context Context
     * @param array $data Additional data
     * @return void
     */
    protected function logError(string $message, string $context = 'App', array $data = []): void
    {
        $this->log($message, LogType::ERROR, $context, $data);
    }

    /**
     * Log exception
     * 
     * @param \Throwable $exception Exception to log
     * @param string $context Context
     * @param array $additionalData Additional context data
     * @return void
     */
    protected function logException(\Throwable $exception, string $context = 'App', array $additionalData = []): void
    {
        $data = array_merge([
            'exception_class' => get_class($exception),
            'exception_code' => $exception->getCode(),
            'exception_file' => $exception->getFile(),
            'exception_line' => $exception->getLine(),
            'stack_trace' => $exception->getTraceAsString()
        ], $additionalData);

        $this->logError($exception->getMessage(), $context, $data);
    }

    /**
     * Log operation start
     * 
     * @param string $operation Operation name
     * @param string $context Context
     * @param array $data Operation data
     * @return void
     */
    protected function logOperationStart(string $operation, string $context = 'App', array $data = []): void
    {
        $message = "Starting operation: {$operation}";
        $this->logInfo($message, $context, $data);
    }

    /**
     * Log operation completion
     * 
     * @param string $operation Operation name
     * @param bool $success Operation success
     * @param string $context Context
     * @param array $data Operation data
     * @return void
     */
    protected function logOperationComplete(string $operation, bool $success, string $context = 'App', array $data = []): void
    {
        $status = $success ? 'completed successfully' : 'failed';
        $message = "Operation {$operation} {$status}";
        $type = $success ? LogType::SUCCESS : LogType::ERROR;
        
        $this->log($message, $type, $context, $data);
    }

    /**
     * Log performance metric
     * 
     * @param string $metric Metric name
     * @param mixed $value Metric value
     * @param string $unit Unit of measurement
     * @param string $context Context
     * @return void
     */
    protected function logMetric(string $metric, mixed $value, string $unit = '', string $context = 'Performance'): void
    {
        $message = "Metric {$metric}: {$value}";
        if ($unit) {
            $message .= " {$unit}";
        }

        $data = [
            'metric' => $metric,
            'value' => $value,
            'unit' => $unit,
            'timestamp' => microtime(true)
        ];

        $this->logInfo($message, $context, $data);
    }

    /**
     * Log conditional message (only if condition is true)
     * 
     * @param bool $condition Condition to check
     * @param string $message Message to log
     * @param LogType $type Log type
     * @param string $context Context
     * @param array $data Additional data
     * @return void
     */
    protected function logIf(bool $condition, string $message, LogType $type = LogType::INFO, string $context = 'App', array $data = []): void
    {
        if ($condition) {
            $this->log($message, $type, $context, $data);
        }
    }

    /**
     * Format structured log data
     * 
     * @param array $data Data to format
     * @return array Formatted data
     */
    protected function formatLogData(array $data): array
    {
        return array_map(function ($value) {
            if (is_object($value)) {
                return get_class($value);
            }
            
            if (is_resource($value)) {
                return 'resource(' . get_resource_type($value) . ')';
            }
            
            return $value;
        }, $data);
    }
}