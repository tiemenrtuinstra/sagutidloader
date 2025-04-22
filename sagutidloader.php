<?php
// filepath: /plugins/system/sagutidloader/sagutidloader.php

defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;

class PlgSystemSagutidloader extends CMSPlugin
{
    private static $app;
    private static $document;
    private static $assetPath;

    public function __construct(&$subject, $config)
    {
        parent::__construct($subject, $config);
        self::$app = Factory::getApplication();
        self::$document = self::$app->getDocument();
        self::$assetPath = Uri::root() . 'plugins/system/sagutidloader/assets/';
    }

    public function onBeforeCompileHead()
    {
        // Only load on the frontend
        if (!self::$app->isClient('site')) {
            return;
        }

        if (!self::$document instanceof \Joomla\CMS\Document\HtmlDocument) {
            self::$app->enqueueMessage('Document is not an HTML document.', 'error');
            return;
        }

        // Debugging
        self::$app->enqueueMessage('onBeforeCompileHead executed', 'info');

        // Inject paths into a global JavaScript variable
        $serviceWorkerPath = self::getJoomlaImagePath('serviceworker.js');
        $joomlaLogoPath = self::getJoomlaImagePath('Logo');
        $assetPath = self::$assetPath;

        self::$document->addScriptDeclaration("
            const SAGUTID_CONFIG = {
                serviceWorkerPath: '{$serviceWorkerPath}',
                joomlaLogoPath: '{$joomlaLogoPath}',
                assetPath: '{$assetPath}'
            };
        ");

        // Add assets
        self::addAssets();
    }

    private static function addAssets()
    {
        self::addScript('main.bundle.js', ['type' => 'text/javascript', 'defer' => true]);
        self::addStyleSheet('styles.css', ['type' => 'text/css']);
        self::addHeadLink('manifest.webmanifest', 'manifest');
    }

    private static function addScript($fileName, $args = [])
    {
        self::$document->addScript(self::getDistPath($fileName), $args);
        self::$app->enqueueMessage('Script added: ' . $fileName, 'info');
    }

    private static function addStyleSheet($fileName, $args = [])
    {
        self::$document->addStyleSheet(self::getDistPath($fileName), $args);
        self::$app->enqueueMessage('Stylesheet added: ' . $fileName, 'info');
    }

    private static function addHeadLink($fileName, $rel = 'stylesheet', $type = 'text/css')
    {
        self::$document->addHeadLink(self::getAssetPath($fileName), $rel, 'stylesheet', ['type' => $type]);
        self::$app->enqueueMessage('Head link added: ' . $fileName, 'info');
    }

    private static function getAssetPath($fileName)
    {
        return self::$assetPath . $fileName;
    }

    private static function getDistPath($fileName)
    {
        return self::getAssetPath('dist/' . $fileName);
    }

    private static function getJoomlaImagePath(string $fileName = '')
    {
        return Uri::root() . 'images/' . ($fileName ? $fileName : '');
    }
}
