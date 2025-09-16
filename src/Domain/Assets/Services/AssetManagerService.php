<?php


namespace PlgSystemSagutidloader\Domain\Assets\Services;

use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Plugin\PluginHelper;
use PlgSystemSagutidloader\Domain\Parameters\Services\ParameterHelperService;

/**
 * @note This service requires Joomla autoloading for Uri and PluginHelper classes.
 *       Ensure this file is loaded in a Joomla context.
 */

/**
 * Asset manager service for DDD Assets domain
 * Handles asset URL computation and HTML block generation
 */
class AssetManagerService
{
    /**
     * Get plugin element name from Joomla plugin system
     *
     * @return string Plugin element name
     */
    private static function getPluginElement(): string
    {
        $element = 'sagutidloader';
        try {
            if (class_exists('Joomla\\CMS\\Plugin\\PluginHelper')) {
                $plugin = \Joomla\CMS\Plugin\PluginHelper::getPlugin('system', $element);
                if ($plugin && isset($plugin->name) && is_string($plugin->name)) {
                    $element = $plugin->name;
                }
            }
        } catch (\Throwable $e) {
            // Fallback to default element name
        }
        return $element;
    }

    /**
     * Compute base asset URL for the plugin
     *
     * @return string Base asset URL ending with /
     */
    public static function computeAssetUrl(): string
    {
        $group = 'system';
        $element = self::getPluginElement();
        if (class_exists('Joomla\\CMS\\Uri\\Uri')) {
            return \Joomla\CMS\Uri\Uri::root() . 'plugins/' . $group . '/' . $element . '/assets/';
        }
        // Fallback for non-Joomla context
        return '/plugins/' . $group . '/' . $element . '/assets/';
    }

    /**
     * Get all asset URLs for the plugin
     *
     * @return array Associative array of asset URLs
     */
    private static function getAssetUrls(): array
    {
        $assetBase = self::computeAssetUrl();
        $distBase = $assetBase . 'dist/';

        $imagesUrl = '/images/';
        if (class_exists('Joomla\\CMS\\Uri\\Uri')) {
            $imagesUrl = \Joomla\CMS\Uri\Uri::root() . 'images/';
        }

        return [
            'assetBase'   => $assetBase,
            'distBase'    => $distBase,
            'script'      => $distBase . 'main.bundle.js',
            'vendors'     => $distBase . 'vendors.js',
            'style'       => $distBase . 'styles.bundle.css',
            'manifest'    => $assetBase . 'manifest.webmanifest',
            'serviceWorker' => $distBase . 'serviceworker.js',
            'offline'     => $assetBase . 'offline.html',
            'images'      => $imagesUrl
        ];
    }

    /**
     * Build configuration object for front-end JavaScript
     *
     * @param bool $debugMode Debug mode enabled
     * @param bool $forceReregister Force service worker re-registration
     * @return array Configuration array
     */
    private static function buildConfig(bool $debugMode, bool $forceReregister): array
    {
        $urls = self::getAssetUrls();

        return [
            'serviceWorkerPath' => $urls['serviceWorker'],
            'joomlaLogoPath'    => $urls['images'] . 'Logo',
            'assetPath'         => $urls['assetBase'],
            'serviceWorker'     => $urls['serviceWorker'],
            'script'            => $urls['script'],
            'style'             => $urls['style'],
            'manifest'          => $urls['manifest'],
            'debugMode'         => $debugMode,
            'forceReregister'   => $forceReregister,
            'offlineUrl'        => $urls['offline'],
        ];
    }

    /**
     * Generate JavaScript configuration script tag
     *
     * @param array $config Configuration array
     * @return string HTML script tag with configuration
     */
    private static function generateConfigScript(array $config): string
    {
        $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        return '<script type="text/javascript">window.SAGUTID_CONFIG = ' . $configJson . ';</script>';
    }

    /**
     * Generate manifest link tag
     *
     * @param string $manifestUrl Manifest URL
     * @return string HTML link tag for manifest
     */
    private static function generateManifestLink(string $manifestUrl): string
    {
        return '<link rel="manifest" href="' . htmlspecialchars($manifestUrl, ENT_QUOTES, 'UTF-8') . '" />';
    }

    /**
     * Generate stylesheet link tag
     *
     * @param string $styleUrl Style URL
     * @return string HTML link tag for stylesheet
     */
    private static function generateStyleLink(string $styleUrl): string
    {
        return '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars($styleUrl, ENT_QUOTES, 'UTF-8') . '" />';
    }

    /**
     * Generate script tags for JavaScript files
     *
     * @param string $vendorsUrl Vendors bundle URL
     * @param string $scriptUrl Main script URL
     * @return string HTML script tags
     */
    private static function generateScriptTags(string $vendorsUrl, string $scriptUrl): string
    {
        $vendorsTag = '<script defer type="text/javascript" src="' . htmlspecialchars($vendorsUrl, ENT_QUOTES, 'UTF-8') . '"></script>';
        $scriptTag = '<script defer type="text/javascript" src="' . htmlspecialchars($scriptUrl, ENT_QUOTES, 'UTF-8') . '"></script>';
        return $vendorsTag . "\n" . $scriptTag;
    }

    /**
     * Extract plugin parameters for asset generation
     *
     * @param mixed $params Plugin params object
     * @param bool|null $debugMode Override debug mode
     * @param bool|null $forceReregister Override force reregister
     * @return array Extracted parameters [debugMode, forceReregister]
     */
    private static function extractAssetParams($params, $debugMode, $forceReregister): array
    {
        if ($debugMode === null || $forceReregister === null) {
            $assetParams = ParameterHelperService::getAssetParams($params);
            $debugMode = $debugMode ?? $assetParams['debug'];
            $forceReregister = $forceReregister ?? $assetParams['forceReregister'];
        }
        return [$debugMode, $forceReregister];
    }

    /**
     * Generate the HTML block with all assets and configuration for injection into document head
     *
     * @param mixed $params Plugin params object (optional, will extract debug/forceReregister internally)
     * @param bool $debugMode Debug mode enabled (optional, overrides param extraction)
     * @param bool $forceReregister Force service worker re-registration (optional, overrides param extraction)
     * @return string HTML block ready for injection
     */
    public static function generateAssetBlock($params = null, $debugMode = null, $forceReregister = null): string
    {
        // Extract parameters
        [$debugMode, $forceReregister] = self::extractAssetParams($params, $debugMode, $forceReregister);

        // Get asset URLs and build configuration
        $urls = self::getAssetUrls();
        $config = self::buildConfig($debugMode, $forceReregister);

        // Generate HTML components
        $configScript = self::generateConfigScript($config);
        $manifestLink = self::generateManifestLink($urls['manifest']);
        $styleLink = self::generateStyleLink($urls['style']);
        $scriptTags = self::generateScriptTags($urls['vendors'], $urls['script']);

        // Assemble final HTML block
        $block = "\n<!-- Sagutid Loader -->\n";
        $block .= $configScript . "\n";
        $block .= $manifestLink . "\n";
        $block .= $styleLink . "\n";
        $block .= $scriptTags . "\n";
        $block .= "<!-- END Sagutid Loader -->\n";

        return $block;
    }
}