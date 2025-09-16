<?php

namespace PlgSystemSagutidloader\Shared\Enums;

/**
 * Debug mode enumeration
 */
enum DebugMode: string
{
    case ENABLED = 'enabled';
    case DISABLED = 'disabled';
    case IP_RESTRICTED = 'ip_restricted';
    case SESSION_BASED = 'session_based';

    /**
     * Check if debug is active
     * 
     * @return bool
     */
    public function isActive(): bool
    {
        return in_array($this, [self::ENABLED, self::IP_RESTRICTED, self::SESSION_BASED], true);
    }

    /**
     * Check if IP validation is required
     * 
     * @return bool
     */
    public function requiresIpValidation(): bool
    {
        return $this === self::IP_RESTRICTED;
    }

    /**
     * Check if session persistence is used
     * 
     * @return bool
     */
    public function usesSession(): bool
    {
        return $this === self::SESSION_BASED;
    }

    /**
     * Get status description
     * 
     * @return string
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::ENABLED => 'Debug mode is enabled for all users',
            self::DISABLED => 'Debug mode is disabled',
            self::IP_RESTRICTED => 'Debug mode is enabled with IP restrictions',
            self::SESSION_BASED => 'Debug mode is session-based'
        };
    }

    /**
     * Determine debug mode from parameters
     * 
     * @param bool $debugParam Debug parameter value
     * @param array $allowedIps Array of allowed IPs
     * @param bool $hasSession Whether session has debug state
     * @return self
     */
    public static function fromParameters(bool $debugParam, array $allowedIps, bool $hasSession): self
    {
        if (!$debugParam) {
            return self::DISABLED;
        }

        if ($hasSession) {
            return self::SESSION_BASED;
        }

        if (!empty($allowedIps)) {
            return self::IP_RESTRICTED;
        }

        return self::ENABLED;
    }
}