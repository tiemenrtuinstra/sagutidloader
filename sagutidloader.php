<?php

defined('_JEXEC') or die;

namespace PlgSystemSagutidloader;

use Joomla\CMS\Plugin\CMSPlugin;
use PlgSystemSagutidloader\Helper\DebugModeHelper;
use PlgSystemSagutidloader\Helper\AssetManager;
use PlgSystemSagutidloader\Helper\DiagnosticsService;
use PlgSystemSagutidloader\Helper\PluginFormHelper;
use PlgSystemSagutidloader\Helper\ParameterHelper;
use PlgSystemSagutidloader\Helper\DocumentHelper;

require_once __DIR__ . '/src/DebugModeHelper.php';
require_once __DIR__ . '/src/AssetManager.php';
require_once __DIR__ . '/src/DiagnosticsService.php';
require_once __DIR__ . '/src/PluginFormHelper.php';
require_once __DIR__ . '/src/ParameterHelper.php';
require_once __DIR__ . '/src/DocumentHelper.php';
require_once __DIR__ . '/src/FormValidationHelper.php';
require_once __DIR__ . '/src/ParameterSaveHandler.php';
require_once __DIR__ . '/src/DebugLogger.php';

/**
 * System plugin to load Sagutid PWA assets and configuration.
 *
 * Injects JS configuration, service worker registration and plugin assets
 * into the HTML head section on the frontend.
 *
 * @since  1.0.0
 */
class PlgSystemSagutidloader extends CMSPlugin
{
    /**
     * Auto-load language files.
     *
     * @var bool
     */
    protected $autoloadLanguage = true;

    /**
     * Debug mode helper instance
     *
     * @var DebugModeHelper
     */
    private $debugHelper;

    /**
     * Constructor.
     *
     * @param   object  $subject  The object to observe
     * @param   array   $config   Plugin configuration array
     */

    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
        $this->debugHelper = new DebugModeHelper($this->params);
    }

    /**
     * Joomla event: before compiling the HTML head.
     * This event is triggered before the document head is compiled.
     *
     * - Checks client is site and document is HTML
     * - Injects a global JavaScript config object
     * - Calls addAssets() to enqueue JS/CSS/manifest
     *
     * @return  void
     * @since   1.0.0
     * @throws  \Exception
     */
    public function onBeforeCompileHead(): void
    {
        try {
            // Check if we should inject assets (handles app/document validation)
            if (!DocumentHelper::shouldInjectAssets()) {
                return;
            }

            $debugMode = $this->debugHelper->isDebugModeEnabled();

            // Generate and inject asset block using AssetManager (extracts params internally)
            $block = AssetManager::generateAssetBlock($this->params, $debugMode);
            DocumentHelper::addCustomBlock($block);

        } catch (\Exception $e) {
            // Log error using DocumentHelper
            DocumentHelper::addErrorLogging('Error in Sagutid loader: ' . $e->getMessage());
        }
    }

    /**
     * Populate the diagnostics_status custom field when the plugin form is prepared in admin.
     *
     * This hooks into the form prepare event and sets the value of the readonly custom field
     * so administrators see a live diagnostics summary.
     *
     * @param  mixed  $form  The form being prepared (Joomla Form object)
     * @param  mixed  $data  The associated data
     * @return void
     */
    public function onContentPrepareForm($form, $data = null): void
    {
        PluginFormHelper::prepareForm($form, $data, $this);
    }

    /**
     * Ensure the plugin params are present when the plugin configuration form is prepared.
     * This helps avoid cases where the form doesn't populate saved params correctly.
     *
     * @param string $context
     * @param mixed  $data
     * @return void
     */
    public function onContentPrepareData($context, $data = null): void
    {
        PluginFormHelper::prepareData($context, $data, $this);
    }

    /**
     * Debug hook: log incoming plugin params when the plugin config is saved.
     * This does not alter save behaviour, only writes a debug file to tmp for troubleshooting.
     *
     * @param string $context
     * @param object $table
     * @param bool   $isNew
     * @return void
     */
    public function onExtensionBeforeSave($context, $table, $isNew): void
    {
        PluginFormHelper::beforeSave($context, $table, $this);
    }
}
