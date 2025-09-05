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
     * Get the client's IP address from server variables (IPv4/IPv6 aware).
     *
     * @return string|null
     */
    private function getClientIp()
    {
        $keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'REMOTE_ADDR',
        ];
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                // X-Forwarded-For may contain a comma-separated list; take the first
                $val = $_SERVER[$key];
                if (strpos($val, ',') !== false) {
                    $val = trim(explode(',', $val)[0]);
                }
                return $val;
            }
        }
        return null;
    }

    /**
     * Check if an IP matches a rule. Rule may be a single IP, a CIDR (x.x.x.x/yy) or a prefix with wildcard.
     *
     * @param string|null $ip
     * @param string $rule
     * @return bool
     */
    private function ipMatchesRule($ip, string $rule): bool
    {
        if (empty($ip) || empty($rule)) {
            return false;
        }
        $ip = trim($ip);
        $rule = trim($rule);

        // CIDR
        if (strpos($rule, '/') !== false) {
            list($subnet, $bits) = explode('/', $rule, 2) + [1 => null];
            if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && is_numeric($bits)) {
                $bits = (int) $bits;
                $ipDecimal = ip2long($ip);
                $subnetDecimal = ip2long($subnet);
                if ($ipDecimal === false || $subnetDecimal === false) {
                    return false;
                }
                $mask = -1 << (32 - $bits);
                return (($ipDecimal & $mask) === ($subnetDecimal & $mask));
            }
        }

        // Wildcard prefix, e.g. 192.168.*
        if (strpos($rule, '*') !== false) {
            $pattern = '#^' . str_replace('\*', '.*', preg_quote($rule, '#')) . '$#';
            return (bool) preg_match($pattern, $ip);
        }

        // Exact match
        return hash_equals($rule, $ip);
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
            $vendorsUrl  = $distBase . 'vendors.js';
            $styleUrl    = $distBase . 'styles.bundle.css';
            $manifestUrl = $assetBase . 'manifest.webmanifest';
            // Prefer the bundled service worker output in dist if available
            $swUrl       = $distBase . 'serviceworker.js';
            $offlineUrl  = $assetBase . 'offline.html';
            $imagesBase  = Uri::root() . 'images/';

            // Defensive access to plugin params: some static analysis tools warn about $this->params
            $debugParam = false;
            $forceReregisterParam = false;
            try {
                if (property_exists($this, 'params') && isset($this->params) && method_exists($this->params, 'get')) {
                    $debugParam = (bool) $this->params->get('debug', 0);
                    $forceReregisterParam = (bool) $this->params->get('force_reregister', 0);
                    $allowedIpsRaw = (string) $this->params->get('debug_allowed_ips', '');
                }
            } catch (\Throwable $e) {
                // leave defaults
            }

            // Determine whether debug mode should be enabled for this client based on allowed IPs
            $debugMode = false;
            try {
                if ($debugParam) {
                    $allowedIps = array_filter(array_map('trim', preg_split('/\r?\n/', (string) ($allowedIpsRaw ?? ''))));
                    // If no allowed IPs are configured, allow debug for all when debugParam is true
                    if (empty($allowedIps)) {
                        $debugMode = true;
                    } else {
                        $clientIp = $this->getClientIp();
                        foreach ($allowedIps as $rule) {
                            if ($this->ipMatchesRule($clientIp, $rule)) {
                                $debugMode = true;
                                break;
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {
                $debugMode = (bool) $debugParam;
            }

            $config = [
                'serviceWorkerPath' => $swUrl,
                'joomlaLogoPath'    => $imagesBase . 'Logo',
                'assetPath'         => $assetBase,
                'serviceWorker'     => $swUrl,
                'script'            => $scriptUrl,
                'style'             => $styleUrl,
                'manifest'          => $manifestUrl,
                // Use plugin parameters (defensive): debug flag and optional forced re-register
                'debugMode'         => $debugMode,
                'forceReregister'   => $forceReregisterParam,
                'offlineUrl'        => $offlineUrl,
            ];
            $configJson = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

            $block  = "\n<!-- Sagutid Loader -->\n";
            $block .= '<script type="text/javascript">window.SAGUTID_CONFIG = ' . $configJson . ';</script>' . "\n";
            $block .= '<link rel="manifest" href="' . htmlspecialchars($manifestUrl, ENT_QUOTES, 'UTF-8') . '" />' . "\n";
            $block .= '<link rel="stylesheet" type="text/css" href="' . htmlspecialchars($styleUrl, ENT_QUOTES, 'UTF-8') . '" />' . "\n";
            // Properly close the external script tag without escaping the slash
            // Include vendors chunk first so shared runtime is available
            $block .= '<script defer type="text/javascript" src="' . htmlspecialchars($vendorsUrl, ENT_QUOTES, 'UTF-8') . '"></script>' . "\n";
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
        // Check files on disk under the plugin's assets folder for a reliable package diagnostic
        try {
            $pluginBase = defined('JPATH_PLUGINS') ? JPATH_PLUGINS . '/system/sagutidloader/assets/' : null;

            $distBase = $pluginBase ? $pluginBase . 'dist/' : null;
            $files = [
                'vendors.js' => $distBase ? $distBase . 'vendors.js' : null,
                'main.bundle.js' => $distBase ? $distBase . 'main.bundle.js' : null,
                'styles.bundle.css' => $distBase ? $distBase . 'styles.bundle.css' : null,
                'manifest.webmanifest' => $pluginBase ? $pluginBase . 'manifest.webmanifest' : null,
            ];

            $output = '<ul style="list-style:none;padding:0;margin:0;">';
            foreach ($files as $name => $path) {
                $ok = $path && is_file($path) && is_readable($path);
                $icon = $ok ? '✅' : '❌';
                $size = '';
                if ($ok) {
                    $bytes = filesize($path);
                    if ($bytes !== false) {
                        $size = ' (' . round($bytes / 1024, 1) . ' KiB)';
                    }
                }
                $output .= "<li>$icon $name$size</li>";
            }

            // Show plugin param states
            $debug = false;
            $force = false;
            try {
                if (property_exists($this, 'params') && isset($this->params) && method_exists($this->params, 'get')) {
                    $debug = (bool) $this->params->get('debug', 0);
                    $force = (bool) $this->params->get('force_reregister', 0);
                }
            } catch (\Throwable $e) {
                // ignore and show defaults
            }

            $output .= "<li>Debug mode: " . ($debug ? 'ON' : 'OFF') . "</li>";
            $output .= "<li>Force re-register: " . ($force ? 'ON' : 'OFF') . "</li>";

            $output .= '</ul>';
            return $output;
        } catch (\Throwable $e) {
            return '<p>Diagnostics unavailable</p>';
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
        try {
            $app = Factory::getApplication();
            if (!$app->isClient('administrator')) {
                return;
            }

            // Be defensive: ensure we have a Form object
            if (!is_object($form) || !method_exists($form, 'getName')) {
                return;
            }

            $formName = $form->getName();
            // Only alter the plugin configuration form (com_plugins)
            if (strpos((string) $formName, 'com_plugins') === false) {
                return;
            }

            $diagnostics = $this->getDiagnosticsStatus();

            // Set the value into the params group if the field exists
            if (method_exists($form, 'getField') && $form->getField('diagnostics_status', 'params')) {
                // setValue(name, group, value)
                $form->setValue('diagnostics_status', 'params', $diagnostics);
            }
        } catch (\Throwable $e) {
            // Swallow errors to avoid breaking the admin UI
        }
    }
}
