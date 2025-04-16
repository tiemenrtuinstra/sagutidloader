<?php
// filepath: /plugins/system/sagutidloader/sagutidloader.php

defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;

class PlgSystemSagutidloader extends CMSPlugin
{
    protected $app;

    public function onBeforeCompileHead()
    {
        // Only load on the frontend
        if ($this->app->isClient('site')) {
            $doc = Factory::getDocument();
            $baseUri = Uri::root() . 'plugins/system/sagutidloader/assets/';

            // Add custom.js
            $doc->addScript($baseUri . '/dist/sagutid.bundle.js', ['type' => 'module']);
            $doc->addStyleSheet($baseUri . '/dist/sagutid.bundle.css', ['type' => 'text/css']);

            // Add serviceworker.js
            $doc->addScriptDeclaration("
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('{$baseUri}serviceworker.js')
                        .then(reg => console.log('Service Worker registered:', reg.scope))
                        .catch(err => console.error('Service Worker registration failed:', err));
                }
            ");

            // Add manifest.webmanifest
            $doc->addHeadLink($baseUri . 'manifest.webmanifest', 'manifest');

    
        }
    }
}