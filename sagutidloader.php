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
     * Joomla application instance.
     *
     * @var    CMSApplication
     * @since  1.0.0
     */
    private static $app;

    /**
     * Joomla document instance.
     *
     * @var    HtmlDocument
     * @since  1.0.0
     */
    private static $document;

    /**
     * Base URL to this plugin's assets directory.
     *
     * @var    string
     * @since  1.0.0
     */
    private static $assetPath;

    /**
     * Constructor.
     *
     * @param   object  $subject  The object to observe
     * @param   array   $config   Plugin configuration array
     *
     * @since   1.0.0
     */
    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
        self::$app      = Factory::getApplication();
        self::$document = self::$app->getDocument();
        self::setAssetPath();
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
            if (!self::$app->isClient('site')) {
                return;
            }

            // Ensure the document is HTML
            if (!self::$document instanceof HtmlDocument) {
                self::$app->enqueueMessage('Document is not an HTML document.', 'error');
                return;
            }

            // Build JS configuration object for front-end
            $serviceWorkerPath = self::getJoomlaImagePath('serviceworker.js');
            $joomlaLogoPath    = self::getJoomlaImagePath('Logo');
            $assetPath         = self::$assetPath;

            // Mark start of injected configuration in the <head>
            self::$document->addCustomTag("\n<!-- Sagutid Loader -->\n");

            self::$document->addScriptDeclaration(
                "window.SAGUTID_CONFIG = {
                    serviceWorkerPath: '{$serviceWorkerPath}',
                    joomlaLogoPath:    '{$joomlaLogoPath}',
                    assetPath:         '{$assetPath}',
                    serviceWorker:     '{$serviceWorkerPath}',
                    script:           '{$assetPath}dist/main.bundle.js',
                    style:            '{$assetPath}dist/styles.bundle.css',
                    manifest:         '{$assetPath}manifest.webmanifest',
                    debugMode:        false
                };"
            );

            // Mark end of injected configuration in the <head>
            self::$document->addCustomTag("<!-- END Sagutid Loader -->\n");

            // Enqueue plugin assets
            self::addAssets();
        } catch (\Exception $e) {
            $msg = 'Error in Sagutid loader: ' . $e->getMessage();
            // Joomla message (backend/admin notifications)
            self::$app->enqueueMessage($msg, 'error');
            // Also surface the error in the browser console for developers
            if (self::$document instanceof HtmlDocument) {  
                self::$document->addScriptDeclaration(
                    '(function(){try{console.error("[Sagutid Loader] " + ' .
                    json_encode($msg, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) .
                    ');}catch(e){}})();'
                );
            }
        }
    }

    /**
     * Enqueue the plugin's main JS, CSS and manifest.
     *
     * @return  void
     * @since   1.0.0
     */
    private static function addAssets(): void
    {
        self::addScript('main.bundle.js',   ['type' => 'text/javascript', 'defer' => true]);
        self::addStyleSheet('styles.bundle.css',   ['type' => 'text/css']);
        self::addHeadLink('manifest.webmanifest', 'manifest');
    }

    /**
     * Add a <script> tag for a file in assets/dist.
     *
     * @param   string  $fileName  Filename under assets/dist
     * @param   array   $args      HTML attributes for the <script> tag
     *
     * @return  void
     * @since   1.0.0
     */
    private static function addScript(string $fileName, array $args = []): void
    {
        $url = self::getDistPath($fileName);
        self::$document->addScript($url, $args);
        self::$app->enqueueMessage('Script added: ' . $url, 'info');
    }

    /**
     * Add a <link rel="stylesheet"> tag for a file in assets/dist.
     *
     * @param   string  $fileName  Filename under assets/dist
     * @param   array   $args      HTML attributes for the <link> tag
     *
     * @return  void
     * @since   1.0.0
     */
    private static function addStyleSheet(string $fileName, array $args = []): void
    {
        $url = self::getDistPath($fileName);
        self::$document->addStyleSheet($url, $args);
        self::$app->enqueueMessage('Stylesheet added: ' . $url, 'info');
    }

    /**
     * Add a generic <link> tag (e.g., manifest).
     *
     * @param   string  $fileName  Filename under assets/
     * @param   string  $rel       The rel attribute for the link
     * @param   string  $type      The type attribute (default text/css)
     *
     * @return  void
     * @since   1.0.0
     */
    private static function addHeadLink(string $fileName, string $rel = 'stylesheet', string $type = 'text/css'): void
    {
        $url = self::getAssetPath($fileName);
        self::$document->addHeadLink($url, $rel, 'stylesheet', ['type' => $type]);
        self::$app->enqueueMessage('Head link added: ' . $url, 'info');
    }

    /**
     * Get full URL to a file in assets/.
     *
     * @param   string  $fileName  Filename relative to assets/
     *
     * @return  string
     * @since   1.0.0
     */
    private static function getAssetPath(string $fileName): string
    {
        return self::$assetPath . $fileName;
    }

    /**
     * Get full URL to a file in assets/dist/.
     *
     * @param   string  $fileName  Filename relative to assets/dist/
     *
     * @return  string
     * @since   1.0.0
     */
    private static function getDistPath(string $fileName): string
    {
        return self::getAssetPath('dist/' . $fileName);
    }

    /**
     * Get full URL to a file in Joomla's images/ directory.
     *
     * @param   string  $fileName  Optional filename
     *
     * @return  string
     * @since   1.0.0
     */
    private static function getJoomlaImagePath(string $fileName = ''): string
    {
        return Uri::root() . 'images/' . $fileName;
    }

    /**
     * Determine and store the base URL to the plugin's assets directory.
     *
     * @return  string  The asset folder URL or empty on failure
     * @since   1.0.0
     */
    private static function setAssetPath(): string
    {
        $plugin = PluginHelper::getPlugin('system', 'sagutidloader');

        if (!$plugin) {
            self::$app->enqueueMessage('Could not load plugin data.', 'error');
            return '';
        }

        $path = Uri::root(true)
            . '/plugins/system/'
            . $plugin->name
            . '/assets/';

        self::$assetPath = $path;

        return $path;
    }

    /**
     * Diagnostics: Check if assets are loaded (for admin panel display)
     *
     * @return string HTML with asset status
     */
    public function getDiagnosticsStatus()
    {
        // Only show in admin
        if (!self::$app->isClient('administrator')) {
            return '';
        }
        $doc = self::$document;
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
