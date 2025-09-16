<?php

namespace PlgSystemSagutidloader\Shared\Traits;

use PlgSystemSagutidloader\Shared\Enums\ValidationState;

/**
 * Validation trait for common validation operations
 */
trait ValidationTrait
{
    /**
     * Validate required field
     * 
     * @param mixed $value Value to validate
     * @param string $fieldName Field name for error messages
     * @return ValidationState
     */
    protected function validateRequired(mixed $value, string $fieldName = 'field'): ValidationState
    {
        if (is_null($value) || (is_string($value) && trim($value) === '')) {
            return ValidationState::INVALID;
        }

        return ValidationState::VALID;
    }

    /**
     * Validate string length
     * 
     * @param string $value Value to validate
     * @param int $minLength Minimum length
     * @param int $maxLength Maximum length
     * @return ValidationState
     */
    protected function validateStringLength(string $value, int $minLength = 0, int $maxLength = PHP_INT_MAX): ValidationState
    {
        $length = strlen($value);
        
        if ($length < $minLength || $length > $maxLength) {
            return ValidationState::INVALID;
        }

        return ValidationState::VALID;
    }

    /**
     * Validate email format
     * 
     * @param string $email Email to validate
     * @return ValidationState
     */
    protected function validateEmail(string $email): ValidationState
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false 
            ? ValidationState::VALID 
            : ValidationState::INVALID;
    }

    /**
     * Validate URL format
     * 
     * @param string $url URL to validate
     * @return ValidationState
     */
    protected function validateUrl(string $url): ValidationState
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false 
            ? ValidationState::VALID 
            : ValidationState::INVALID;
    }

    /**
     * Validate IP address
     * 
     * @param string $ip IP address to validate
     * @param bool $allowPrivate Allow private IP addresses
     * @return ValidationState
     */
    protected function validateIpAddress(string $ip, bool $allowPrivate = true): ValidationState
    {
        $flags = FILTER_VALIDATE_IP;
        
        if (!$allowPrivate) {
            $flags |= FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE;
        }

        return filter_var($ip, $flags) !== false 
            ? ValidationState::VALID 
            : ValidationState::INVALID;
    }

    /**
     * Validate numeric range
     * 
     * @param mixed $value Value to validate
     * @param float $min Minimum value
     * @param float $max Maximum value
     * @return ValidationState
     */
    protected function validateNumericRange(mixed $value, float $min = PHP_FLOAT_MIN, float $max = PHP_FLOAT_MAX): ValidationState
    {
        if (!is_numeric($value)) {
            return ValidationState::INVALID;
        }

        $numValue = (float) $value;
        
        if ($numValue < $min || $numValue > $max) {
            return ValidationState::INVALID;
        }

        return ValidationState::VALID;
    }

    /**
     * Validate array contains only allowed values
     * 
     * @param array $values Values to validate
     * @param array $allowedValues Allowed values
     * @return ValidationState
     */
    protected function validateAllowedValues(array $values, array $allowedValues): ValidationState
    {
        foreach ($values as $value) {
            if (!in_array($value, $allowedValues, true)) {
                return ValidationState::INVALID;
            }
        }

        return ValidationState::VALID;
    }

    /**
     * Validate JSON format
     * 
     * @param string $json JSON string to validate
     * @return ValidationState
     */
    protected function validateJson(string $json): ValidationState
    {
        json_decode($json);
        
        return json_last_error() === JSON_ERROR_NONE 
            ? ValidationState::VALID 
            : ValidationState::INVALID;
    }

    /**
     * Validate regular expression pattern
     * 
     * @param string $value Value to validate
     * @param string $pattern Regular expression pattern
     * @return ValidationState
     */
    protected function validatePattern(string $value, string $pattern): ValidationState
    {
        try {
            return preg_match($pattern, $value) === 1 
                ? ValidationState::VALID 
                : ValidationState::INVALID;
        } catch (\Throwable $e) {
            return ValidationState::INVALID;
        }
    }

    /**
     * Combine multiple validation results
     * 
     * @param ValidationState ...$states Validation states to combine
     * @return ValidationState Combined result (invalid if any invalid)
     */
    protected function combineValidations(ValidationState ...$states): ValidationState
    {
        foreach ($states as $state) {
            if ($state === ValidationState::INVALID) {
                return ValidationState::INVALID;
            }
            
            if ($state === ValidationState::PENDING || $state === ValidationState::UNKNOWN) {
                return $state;
            }
        }

        return ValidationState::VALID;
    }
}