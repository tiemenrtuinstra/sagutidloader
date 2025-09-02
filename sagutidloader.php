<?php
defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\CMS\Application\CMSApplication;
use Joomla\CMS\Document\HtmlDocument;

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
     * Base URL (absolute) to this plugin's assets directory.
     * Example: https://example.com/plugins/system/sagutidloader/assets/
     *
     * @var string
     */
    private $assetUrl = '';

    /**
     * Constructor.
     *
     * @param   object  $subject  The object to observe
     * @param   array   $config   Plugin configuration array
     */
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
        $this->computeAssetUrl();
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
            // Only run on the site front-end
            $app = Factory::getApplication();
            if (!$app->isClient('site')) {
                return;
            }

            $document = $app->getDocument();
            if (!($document instanceof HtmlDocument) || $document->getType() !== 'html') {
                return;
            }

            // Build JS configuration object for front-end
            $assetBase   = $this->assetUrl; // .../plugins/system/sagutidloader/assets/
            $distBase    = $assetBase . 'dist/';
            $scriptUrl   = $distBase . 'main.bundle.js';
            $styleUrl    = $distBase . 'styles.bundle.css';
            $manifestUrl = $assetBase . 'manifest.webmanifest';
            $swUrl       = $assetBase . 'serviceworker.js';
            $offlineUrl  = $assetBase . 'offline.html';
            $imagesBase  = Uri::root() . 'images/';

            $config = [
                'serviceWorkerPath' => $swUrl,
                'joomlaLogoPath'    => $imagesBase . 'Logo',
                'assetPath'         => $assetBase,
                'serviceWorker'     => $swUrl,
                'script'            => $scriptUrl,
                'style'             => $styleUrl,
                'manifest'          => $manifestUrl,
                'debugMode'         => false,
                'offlineUrl'        => $offlineUrl,
            ];
            $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

            $block  = "\n<!-- Sagutid Loader -->\n";
            $block .= '<script type="text/javascript">window.SAGUTID_CONFIG = ' . $configJson . ';</script>' . "\n";
            $block .= '<link rel="manifest" href="' . htmlspecialchars($manifestUrl, ENT_QUOTES, 'UTF-8') . '" />' . "\n";
            $block .= '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars($styleUrl, ENT_QUOTES, 'UTF-8') . '" />' . "\n";
            // Properly close the external script tag without escaping the slash
            $block .= '<script defer type="text/javascript" src="' . htmlspecialchars($scriptUrl, ENT_QUOTES, 'UTF-8') . '"></script>' . "\n";
            $block .= "<!-- END Sagutid Loader -->\n";

            $document->addCustomTag($block);
        } catch (\Exception $e) {
            $msg = 'Error in Sagutid loader: ' . $e->getMessage();
            $doc = Factory::getApplication()->getDocument();
            if ($doc instanceof HtmlDocument) {
                // Keep error reporting minimal and avoid stray IIFE remnants in the markup
                $doc->addScriptDeclaration(
                    'try{console.error("[Sagutid Loader] " + ' .
                        json_encode($msg, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) .
                        ');}catch(e){}'
                );
            }
        }
    }

    /**
     * Compute the absolute URL to the plugin assets folder.
     */
    private function computeAssetUrl(): void
    {
        // Resolve plugin group/element reliably
        $group = 'system';
        $element = 'sagutidloader';
        try {
            $plugin = PluginHelper::getPlugin($group, $element);
            if ($plugin && isset($plugin->name) && is_string($plugin->name)) {
                $element = $plugin->name;
            }
        } catch (\Throwable $e) {
            // Fallback keeps defaults
        }
        $this->assetUrl = Uri::root() . 'plugins/' . $group . '/' . $element . '/assets/';
    }

    /**
     * Diagnostics: Check if assets are loaded (for admin panel display)
     *
     * @return string HTML with asset status
     */
    public function getDiagnosticsStatus()
    {
        // Only show in admin
        $app = Factory::getApplication();
        if (!$app->isClient('administrator')) {
            return '';
        }
        $doc = $app->getDocument();
        $headHtml = $doc->getBuffer('head');
        $assets = [
            'main.bundle.js',
            'styles.bundle.css',
            'manifest.webmanifest',
        ];
        $output = '<ul style="list-style:none;padding:0;">';
        foreach ($assets as $asset) {
            $ok = strpos($headHtml, $asset) !== false;
            $icon = $ok ? '✅' : '❌';
            $output .= "<li>$icon $asset</li>";
        }
        $output .= '</ul>';
        return $output;
    }
}
