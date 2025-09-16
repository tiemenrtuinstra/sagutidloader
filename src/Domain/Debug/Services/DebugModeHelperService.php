<?php

namespace PlgSystemSagutidloader\Domain\Debug\Services;

use Joomla\CMS\Factory;
use PlgSystemSagutidloader\Domain\Logging\Services\DebugLoggerService;
use PlgSystemSagutidloader\Domain\Parameters\Services\ParameterHelperService;

/**
 * Debug mode helper service for DDD Debug domain
 * Handles debug mode checks and IP rule logic
 */
class DebugModeHelperService
{
    private $params;

    public function __construct($params)
    {
        $this->params = $params;
    }

    public function isDebugModeEnabled(): bool
    {
        if (!class_exists('Joomla\\CMS\\Factory')) {
            // Not in Joomla context, fallback to debug param only
            $debugParam = ParameterHelperService::getBoolParam($this->params, 'debug', false);
            return (bool)$debugParam;
        }
        $session = \Joomla\CMS\Factory::getApplication()->getSession();
        $sessionKey = 'sagutid_debugMode';
        $debugMode = $session->get($sessionKey, null);

        if ($debugMode !== null) {
            DebugLoggerService::info("Debug mode from session: " . ($debugMode ? 'enabled' : 'disabled'), 'DebugMode');
            return (bool)$debugMode;
        }

        $debugParam = ParameterHelperService::getBoolParam($this->params, 'debug', false);
        $allowedIpsRaw = ParameterHelperService::getStringParam($this->params, 'debug_allowed_ips', '');

        if (!$debugParam) {
            $session->set($sessionKey, false);
            DebugLoggerService::info("Debug mode disabled: parameter debug=false", 'DebugMode');
            return false;
        }

        $result = false;
        $clientIp = $this->getClientIp();

        try {
            $allowedIps = array_filter(array_map('trim', preg_split('/\r?\n/', (string) ($allowedIpsRaw ?? ''))));

            if (empty($allowedIps)) {
                $result = true;
                DebugLoggerService::info("Debug mode enabled: no IP restrictions", 'DebugMode', ['client_ip' => $clientIp]);
            } else {
                foreach ($allowedIps as $rule) {
                    if ($this->ipMatchesRule($clientIp, $rule)) {
                        $result = true;
                        DebugLoggerService::info("Debug mode enabled: IP matched rule", 'DebugMode', [
                            'client_ip' => $clientIp,
                            'matched_rule' => $rule
                        ]);
                        break;
                    }
                }

                if (!$result) {
                    DebugLoggerService::warn("Debug mode denied: IP not in allowed list", 'DebugMode', [
                        'client_ip' => $clientIp,
                        'allowed_rules' => $allowedIps
                    ]);
                }
            }
        } catch (\Throwable $e) {
            $result = (bool) $debugParam;
            DebugLoggerService::error("Debug mode check failed, using fallback", 'DebugMode', [
                'error' => $e->getMessage(),
                'fallback_result' => $result
            ]);
        }

        $session->set($sessionKey, $result);
        return $result;
    }

    public function getClientIp(): ?string
    {
        $keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'REMOTE_ADDR',
        ];
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                $val = $_SERVER[$key];
                if (strpos($val, ',') !== false) {
                    $val = trim(explode(',', $val)[0]);
                }
                return $val;
            }
        }
        return null;
    }

    public function ipMatchesRule($ip, $rule): bool
    {
        if (empty($ip) || empty($rule)) {
            DebugLoggerService::warn("IP rule check failed: empty IP or rule", 'DebugMode', [
                'ip' => $ip, 'rule' => $rule
            ]);
            return false;
        }

        $ip = trim($ip);
        $rule = trim($rule);

        // CIDR notation check
        if (strpos($rule, '/') !== false) {
            list($subnet, $bits) = explode('/', $rule, 2) + [1 => null];
            if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && is_numeric($bits)) {
                $bits = (int) $bits;
                $ipDecimal = ip2long($ip);
                $subnetDecimal = ip2long($subnet);
                if ($ipDecimal === false || $subnetDecimal === false) {
                    DebugLoggerService::warn("IP rule check failed: invalid CIDR format", 'DebugMode', [
                        'ip' => $ip, 'rule' => $rule, 'subnet' => $subnet, 'bits' => $bits
                    ]);
                    return false;
                }
                $mask = -1 << (32 - $bits);
                $matches = (($ipDecimal & $mask) === ($subnetDecimal & $mask));

                DebugLoggerService::info("CIDR IP rule check", 'DebugMode', [
                    'ip' => $ip, 'rule' => $rule, 'matches' => $matches
                ]);

                return $matches;
            }
        }

        // Wildcard pattern check
        if (strpos($rule, '*') !== false) {
            $pattern = '#^' . str_replace('\\*', '.*', preg_quote($rule, '#')) . '$#';
            $matches = (bool) preg_match($pattern, $ip);

            DebugLoggerService::info("Wildcard IP rule check", 'DebugMode', [
                'ip' => $ip, 'rule' => $rule, 'pattern' => $pattern, 'matches' => $matches
            ]);

            return $matches;
        }

        // Exact match check
        $matches = hash_equals($rule, $ip);

        DebugLoggerService::info("Exact IP rule check", 'DebugMode', [
            'ip' => $ip, 'rule' => $rule, 'matches' => $matches
        ]);

        return $matches;
    }
}