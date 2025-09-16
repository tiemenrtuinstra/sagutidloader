<?php

namespace PlgSystemSagutidloader\Shared\Enums;

/**
 * Log type enumeration (compatible with TypeScript LogType)
 */
enum LogType: string
{
    case INFO = 'info';
    case SUCCESS = 'success';
    case WARN = 'warn';
    case ERROR = 'error';

    /**
     * Get corresponding log level
     * 
     * @return LogLevel
     */
    public function getLevel(): LogLevel
    {
        return match ($this) {
            self::INFO => LogLevel::INFO,
            self::SUCCESS => LogLevel::SUCCESS,
            self::WARN => LogLevel::WARN,
            self::ERROR => LogLevel::ERROR
        };
    }

    /**
     * Create from string value with normalization
     * 
     * @param string $value Type value
     * @return self
     */
    public static function fromValue(string $value): self
    {
        return match (strtolower($value)) {
            'info', 'log' => self::INFO,
            'success' => self::SUCCESS,
            'warn', 'warning' => self::WARN,
            'error' => self::ERROR,
            default => self::INFO
        };
    }

    /**
     * Get uppercase representation
     * 
     * @return string
     */
    public function toUpperCase(): string
    {
        return strtoupper($this->value);
    }
}