<?php

namespace PlgSystemSagutidloader\Domain\Forms\Services;

use PlgSystemSagutidloader\Domain\Validation\Services\FormValidationHelperService;
use PlgSystemSagutidloader\Domain\Logging\Services\DebugLoggerService;
use PlgSystemSagutidloader\Domain\Forms\Services\DiagnosticsService;
use PlgSystemSagutidloader\Domain\Forms\Services\ParameterSaveHandler;

/**
 * Simplified PluginFormHelperService that delegates to specialized helpers (DDD Forms domain)
 */
class PluginFormHelperService
{
    /**
     * Prepare plugin form with diagnostics information
     *
     * @param mixed $form Form object
     * @param mixed $data Form data
     * @param mixed $plugin Plugin instance
     * @return void
     */
    public static function prepareForm($form, $data, $plugin): void
    {
        try {
            // Validate form preparation requirements
            if (!FormValidationHelperService::validateFormPreparation($form)) {
                return;
            }

            // Get diagnostics data
            $diagnostics = DiagnosticsService::getDiagnosticsStatus($plugin->params ?? null);
            $logEntries = DiagnosticsService::getLogEntries();

            // Set form field values
            self::setFormFieldValue($form, 'diagnostics_status', $diagnostics);
            self::setFormFieldValue($form, 'log_entries', $logEntries);

        } catch (\Throwable $e) {
            DebugLoggerService::logFormError($e->getMessage());
        }
    }

    /**
     * Set form field value if field exists
     *
     * @param mixed $form Form object
     * @param string $fieldName Field name
     * @param mixed $value Value to set
     * @param string $group Field group (default 'params')
     * @return void
     */
    private static function setFormFieldValue($form, $fieldName, $value, $group = 'params'): void
    {
        if (FormValidationHelperService::hasFormField($form, $fieldName, $group)) {
            $form->setValue($fieldName, $group, $value);
        }
    }

    /**
     * Prepare plugin data to ensure parameters are properly populated
     *
     * @param string $context Context string
     * @param mixed $data Data object
     * @param mixed $plugin Plugin instance
     * @return void
     */
    public static function prepareData($context, $data, $plugin): void
    {
        try {
            // Validate data preparation requirements
            if (!FormValidationHelperService::validateDataPreparation($context) || !is_object($data)) {
                return;
            }

            // Extract current parameters from plugin
            $currentParams = ParameterSaveHandler::extractCurrentParams($plugin);

            // Ensure data object has proper parameters
            ParameterSaveHandler::ensureDataParams($data, $currentParams);

            // Log debug information
            $debugInfo = ParameterSaveHandler::getDataPreparationInfo(
                $context,
                $currentParams,
                $data->params
            );
            DebugLoggerService::logDataPreparation($debugInfo);

        } catch (\Throwable $e) {
            DebugLoggerService::logPreparationError($e->getMessage());
        }
    }

    /**
     * Handle plugin configuration save with proper parameter processing
     *
     * @param string $context Context string
     * @param mixed $table Table object
     * @param mixed $plugin Plugin instance
     * @return void
     */
    public static function beforeSave($context, $table, $plugin): void
    {
        try {
            // Validate save operation requirements
            if (!FormValidationHelperService::validateSaveOperation($context, $table)) {
                return;
            }

            // Extract parameters from different sources
            $originalParams = ParameterSaveHandler::extractTableParams($table);
            $postedParams = ParameterSaveHandler::extractPostedParams();

            // Apply parameters to table for saving
            $mergedParams = ParameterSaveHandler::applyParamsToTable($table, $originalParams, $postedParams);

            // Log debug information
            $debugInfo = ParameterSaveHandler::getProcessingInfo(
                $context,
                $table,
                $originalParams,
                $postedParams,
                $mergedParams
            );
            DebugLoggerService::logParameterSave($debugInfo);

        } catch (\Throwable $e) {
            DebugLoggerService::logSaveError($e->getMessage());
        }
    }
}