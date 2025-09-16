<?php

namespace PlgSystemSagutidloader\Domain\Forms\Services;

/**
 * Handles parameter saving, normalization and data processing (DDD Forms domain)
 */
class ParameterSaveHandler
{
    public static function extractCurrentParams($plugin)
    {
        $currentParams = [];
        try {
            if (property_exists($plugin, 'params') && isset($plugin->params)) {
                if (method_exists($plugin->params, 'toArray')) {
                    $currentParams = $plugin->params->toArray();
                } elseif (method_exists($plugin->params, 'toString')) {
                    $paramsJson = $plugin->params->toString();
                    $currentParams = json_decode($paramsJson, true) ?: [];
                }
            }
        } catch (\Throwable $e) {
            // Return empty array on failure
        }
        return $currentParams;
    }

    public static function extractTableParams($table)
    {
        if (!is_object($table) || !property_exists($table, 'params') || empty($table->params)) {
            return [];
        }
        return json_decode($table->params, true) ?: [];
    }

    public static function extractPostedParams()
    {
        if (empty($_POST['jform']['params']) || !is_array($_POST['jform']['params'])) {
            return [];
        }
        return $_POST['jform']['params'];
    }

    public static function normalizeParamValue($value)
    {
        if ($value === true || $value === false || $value === '1' || $value === '0') {
            return ($value === true || $value === '1') ? '1' : '0';
        }
        if ($value === null) {
            return '';
        }
        return (string) $value;
    }

    public static function normalizeParams(array $params)
    {
        $normalized = [];
        foreach ($params as $key => $value) {
            $normalized[$key] = self::normalizeParamValue($value);
        }
        return $normalized;
    }

    public static function mergeParams(array $originalParams, array $postedParams)
    {
        $normalizedPosted = self::normalizeParams($postedParams);
        return array_merge($originalParams, $normalizedPosted);
    }

    public static function ensureDataParams($data, array $currentParams)
    {
        if (!is_object($data)) {
            return;
        }
        if (empty($data->params) || !is_array($data->params)) {
            $data->params = $currentParams;
        } else {
            $data->params = array_merge($currentParams, (array) $data->params);
        }
    }

    public static function applyParamsToTable($table, array $originalParams, array $postedParams)
    {
        if (empty($postedParams) || !is_object($table) || !property_exists($table, 'params')) {
            return $originalParams;
        }
        $mergedParams = self::mergeParams($originalParams, $postedParams);
        $table->params = json_encode($mergedParams, JSON_UNESCAPED_SLASHES);
        return $mergedParams;
    }

    public static function getProcessingInfo($context, $table, array $originalParams, array $postedParams, array $mergedParams)
    {
        return [
            'timestamp' => date('Y-m-d H:i:s'),
            'context' => $context,
            'table_element' => $table->element ?? 'unknown',
            'table_folder' => $table->folder ?? 'unknown',
            'original_params' => $originalParams,
            'posted_params' => $postedParams,
            'merged_params' => $mergedParams,
            'final_table_params' => isset($table->params) ? json_decode($table->params, true) : null
        ];
    }

    public static function getDataPreparationInfo($context, array $currentParams, array $finalParams)
    {
        return [
            'timestamp' => date('Y-m-d H:i:s'),
            'context' => $context,
            'current_params' => $currentParams,
            'final_data_params' => $finalParams
        ];
    }
}