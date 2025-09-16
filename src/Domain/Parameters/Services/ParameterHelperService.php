<?php

namespace PlgSystemSagutidloader\Domain\Parameters\Services;

/**
 * Parameter helper service for DDD Parameters domain
 * Handles parameter extraction, normalization, and validation
 */
class ParameterHelperService
{
    /**
     * Safely extract a parameter value from plugin params with fallback
     *
     * @param mixed $params Plugin params object
     * @param string $key Parameter key
     * @param mixed $default Default value if not found
     * @return mixed Parameter value or default
     */
    public static function getParam($params, string $key, $default = null)
    {
        try {
            if ($params && method_exists($params, 'get')) {
                return $params->get($key, $default);
            }
        } catch (\Throwable $e) {
            // Fall back to default
        }
        return $default;
    }

    /**
     * Get boolean parameter value
     *
     * @param mixed $params Plugin params object
     * @param string $key Parameter key
     * @param bool $default Default boolean value
     * @return bool
     */
    public static function getBoolParam($params, string $key, bool $default = false): bool
    {
        return (bool) self::getParam($params, $key, $default ? '1' : '0');
    }

    /**
     * Get string parameter value
     *
     * @param mixed $params Plugin params object
     * @param string $key Parameter key
     * @param string $default Default string value
     * @return string
     */
    public static function getStringParam($params, string $key, string $default = ''): string
    {
        return (string) self::getParam($params, $key, $default);
    }

    /**
     * Extract all plugin configuration parameters needed for asset generation
     *
     * @param mixed $params Plugin params object
     * @return array Associative array with debug and forceReregister flags
     */
    public static function getAssetParams($params): array
    {
        return [
            'debug' => self::getBoolParam($params, 'debug', false),
            'forceReregister' => self::getBoolParam($params, 'force_reregister', false),
            'debugAllowedIps' => self::getStringParam($params, 'debug_allowed_ips', '')
        ];
    }

    /**
     * Validate and normalize posted form parameters for safe storage
     *
     * @param array $postedParams Raw posted parameters from form
     * @param array $currentParams Current saved parameters (for merging)
     * @return array Normalized parameters ready for JSON encoding
     */
    public static function normalizePostedParams(array $postedParams, array $currentParams = []): array
    {
        $normalized = [];

        foreach ($postedParams as $key => $value) {
            // Handle different data types appropriately
            if (is_bool($value) || $value === '1' || $value === '0') {
                $normalized[$key] = ($value === true || $value === '1') ? '1' : '0';
            } elseif ($value === null || $value === '') {
                $normalized[$key] = '';
            } elseif (is_array($value)) {
                $normalized[$key] = json_encode($value);
            } else {
                $normalized[$key] = (string) $value;
            }
        }

        // Merge with current params to avoid losing existing settings
        return array_merge($currentParams, $normalized);
    }

    /**
     * Safely extract parameters from a Joomla plugin object
     *
     * @param object $plugin Joomla plugin instance
     * @return array Parameters as associative array
     */
    public static function extractPluginParams($plugin): array
    {
        $params = [];

        try {
            if (property_exists($plugin, 'params') && isset($plugin->params)) {
                if (method_exists($plugin->params, 'toArray')) {
                    $params = $plugin->params->toArray();
                } elseif (method_exists($plugin->params, 'toString')) {
                    $paramsJson = $plugin->params->toString();
                    $params = json_decode($paramsJson, true) ?: [];
                } elseif (is_string($plugin->params)) {
                    $params = json_decode($plugin->params, true) ?: [];
                }
            }
        } catch (\Throwable $e) {
            // Return empty array on any error
        }

        return $params;
    }
}