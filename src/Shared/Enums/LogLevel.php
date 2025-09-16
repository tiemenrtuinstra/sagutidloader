<?php

namespace PlgSystemSagutidloader\Shared\Enums;

/**
 * Log level enumeration (compatible with TypeScript Logger)
 */
enum LogLevel: int
{
    case INFO = 0;
    case SUCCESS = 1;
    case WARN = 2;
    case ERROR = 3;

    /**
     * Get log level from type name
     * 
     * @param string $typeName Type name (info, success, warn, error)
     * @return self
     */
    public static function fromTypeName(string $typeName): self
    {
        return match (strtolower($typeName)) {
            'info', 'log' => self::INFO,
            'success' => self::SUCCESS,
            'warn', 'warning' => self::WARN,
            'error' => self::ERROR,
            default => self::INFO
        };
    }

    /**
     * Get type name for log level
     * 
     * @return string
     */
    public function getTypeName(): string
    {
        return match ($this) {
            self::INFO => 'info',
            self::SUCCESS => 'success',
            self::WARN => 'warn',
            self::ERROR => 'error'
        };
    }

    /**
     * Check if this level should be logged based on minimum level
     * 
     * @param self $minLevel Minimum log level
     * @return bool
     */
    public function shouldLog(self $minLevel): bool
    {
        return $this->value >= $minLevel->value;
    }
}