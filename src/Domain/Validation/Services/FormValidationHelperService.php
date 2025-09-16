<?php

namespace PlgSystemSagutidloader\Domain\Validation\Services;

/**
 * Handles form context validation and admin interface checks (DDD Validation domain)
 */
class FormValidationHelperService
{
    /**
     * Check if current request is in admin interface
     *
     * @return bool True if in administrator client
     */
    public static function isAdminClient(): bool
    {
        try {
            if (!class_exists('Joomla\\CMS\\Factory')) {
                return false;
            }
            $app = \Joomla\CMS\Factory::getApplication();
            return $app->isClient('administrator');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Validate if form is a valid plugin form object
     *
     * @param mixed $form Form object to validate
     * @return bool True if valid form object
     */
    public static function isValidFormObject($form): bool
    {
        return is_object($form) && method_exists($form, 'getName');
    }

    /**
     * Check if form context is for plugins
     *
     * @param mixed $form Form object
     * @return bool True if plugin form
     */
    public static function isPluginForm($form): bool
    {
        if (!self::isValidFormObject($form)) {
            return false;
        }
        $formName = $form->getName();
        return strpos((string) $formName, 'com_plugins') !== false;
    }

    /**
     * Check if context is for plugin data preparation
     *
     * @param string $context Context string
     * @return bool True if plugin context
     */
    public static function isPluginDataContext($context): bool
    {
        return strpos((string) $context, 'com_plugins.plugin') !== false;
    }

    /**
     * Check if context is for plugin save operation
     *
     * @param string $context Context string
     * @return bool True if plugin save context
     */
    public static function isPluginSaveContext($context): bool
    {
        return strpos((string) $context, 'com_plugins.plugin') !== false;
    }

    /**
     * Validate that table object is specifically our sagutidloader plugin
     *
     * @param mixed $table Table object to validate
     * @return bool True if our plugin table
     */
    public static function isSagutidloaderPlugin($table): bool
    {
        return is_object($table) &&
               property_exists($table, 'folder') &&
               property_exists($table, 'element') &&
               $table->folder === 'system' &&
               $table->element === 'sagutidloader';
    }

    /**
     * Check if form has a specific field
     *
     * @param mixed $form Form object
     * @param string $fieldName Field name to check
     * @param string $group Field group (default 'params')
     * @return bool True if field exists
     */
    public static function hasFormField($form, string $fieldName, string $group = 'params'): bool
    {
        if (!self::isValidFormObject($form) || !method_exists($form, 'getField')) {
            return false;
        }
        return (bool) $form->getField($fieldName, $group);
    }

    /**
     * Complete validation chain for form preparation
     *
     * @param mixed $form Form object
     * @return bool True if all validations pass
     */
    public static function validateFormPreparation($form): bool
    {
        return self::isAdminClient() &&
               self::isValidFormObject($form) &&
               self::isPluginForm($form);
    }

    /**
     * Complete validation chain for data preparation
     *
     * @param string $context Context string
     * @return bool True if all validations pass
     */
    public static function validateDataPreparation($context): bool
    {
        return self::isAdminClient() &&
               self::isPluginDataContext($context);
    }

    /**
     * Complete validation chain for save operation
     *
     * @param string $context Context string
     * @param mixed $table Table object
     * @return bool True if all validations pass
     */
    public static function validateSaveOperation($context, $table): bool
    {
        return self::isPluginSaveContext($context) &&
               self::isSagutidloaderPlugin($table);
    }
}