<?php

namespace PlgSystemSagutidloader\Shared\Enums;

/**
 * Validation state enumeration
 */
enum ValidationState: string
{
    case VALID = 'valid';
    case INVALID = 'invalid';
    case PENDING = 'pending';
    case UNKNOWN = 'unknown';

    /**
     * Check if state represents success
     * 
     * @return bool
     */
    public function isValid(): bool
    {
        return $this === self::VALID;
    }

    /**
     * Check if state represents failure
     * 
     * @return bool
     */
    public function isInvalid(): bool
    {
        return $this === self::INVALID;
    }

    /**
     * Check if state is conclusive (not pending/unknown)
     * 
     * @return bool
     */
    public function isConcluded(): bool
    {
        return in_array($this, [self::VALID, self::INVALID], true);
    }

    /**
     * Get CSS class for state representation
     * 
     * @return string
     */
    public function getCssClass(): string
    {
        return match ($this) {
            self::VALID => 'success',
            self::INVALID => 'error',
            self::PENDING => 'warning',
            self::UNKNOWN => 'info'
        };
    }

    /**
     * Get icon for state representation
     * 
     * @return string
     */
    public function getIcon(): string
    {
        return match ($this) {
            self::VALID => '✅',
            self::INVALID => '❌',
            self::PENDING => '⏳',
            self::UNKNOWN => '❓'
        };
    }
}