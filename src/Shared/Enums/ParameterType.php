<?php

namespace PlgSystemSagutidloader\Shared\Enums;

/**
 * Parameter type enumeration
 */
enum ParameterType: string
{
    case BOOLEAN = 'boolean';
    case STRING = 'string';
    case INTEGER = 'integer';
    case FLOAT = 'float';
    case ARRAY = 'array';
    case OBJECT = 'object';

    /**
     * Normalize a value to this parameter type
     * 
     * @param mixed $value Value to normalize
     * @return mixed Normalized value
     */
    public function normalize(mixed $value): mixed
    {
        return match ($this) {
            self::BOOLEAN => (bool) $value,
            self::STRING => (string) $value,
            self::INTEGER => (int) $value,
            self::FLOAT => (float) $value,
            self::ARRAY => is_array($value) ? $value : [$value],
            self::OBJECT => is_object($value) ? $value : (object) $value
        };
    }

    /**
     * Validate if value matches this parameter type
     * 
     * @param mixed $value Value to validate
     * @return bool
     */
    public function validates(mixed $value): bool
    {
        return match ($this) {
            self::BOOLEAN => is_bool($value) || in_array($value, [0, 1, '0', '1', 'true', 'false'], true),
            self::STRING => is_string($value) || is_scalar($value),
            self::INTEGER => is_int($value) || (is_string($value) && ctype_digit($value)),
            self::FLOAT => is_float($value) || is_numeric($value),
            self::ARRAY => is_array($value),
            self::OBJECT => is_object($value)
        };
    }

    /**
     * Detect parameter type from value
     * 
     * @param mixed $value Value to analyze
     * @return self
     */
    public static function detect(mixed $value): self
    {
        return match (gettype($value)) {
            'boolean' => self::BOOLEAN,
            'integer' => self::INTEGER,
            'double' => self::FLOAT,
            'string' => self::STRING,
            'array' => self::ARRAY,
            'object' => self::OBJECT,
            default => self::STRING
        };
    }
}