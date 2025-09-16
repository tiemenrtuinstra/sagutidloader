<?php

namespace PlgSystemSagutidloader\Domain\Assets\Services;

/**
 * Document helper service for DDD Assets domain
 * Handles asset injection and document manipulation
 */
class DocumentHelperService
{
    /**
     * Check if we should run on the current application context
     *
     * @return bool True if we should proceed with asset injection
     */
    public static function shouldInjectAssets(): bool
    {
        try {
            if (!class_exists('Joomla\\CMS\\Factory')) {
                return false;
            }
            $app = \Joomla\CMS\Factory::getApplication();
            if (!$app->isClient('site')) {
                return false;
            }

            $document = $app->getDocument();
            if (!($document instanceof \Joomla\CMS\Document\HtmlDocument) || $document->getType() !== 'html') {
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Add custom HTML block to document head
     *
     * @param string $block HTML block to add
     * @return void
     */
    public static function addCustomBlock(string $block): void
    {
        try {
            if (!class_exists('Joomla\\CMS\\Factory')) {
                return;
            }
            $app = \Joomla\CMS\Factory::getApplication();
            $document = $app->getDocument();
            if ($document instanceof \Joomla\CMS\Document\HtmlDocument) {
                $document->addCustomTag($block);
            }
        } catch (\Throwable $e) {
            // Silently fail
        }
    }

    /**
     * Add error logging script to document
     *
     * @param string $errorMessage Error message to log
     * @return void
     */
    public static function addErrorLogging(string $errorMessage): void
    {
        try {
            if (!class_exists('Joomla\\CMS\\Factory')) {
                return;
            }
            $doc = \Joomla\CMS\Factory::getApplication()->getDocument();
            if ($doc instanceof \Joomla\CMS\Document\HtmlDocument) {
                $doc->addScriptDeclaration(
                    'try{console.error("[Sagutid Loader] " + ' .
                        json_encode($errorMessage, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) .
                        ');}catch(e){}'
                );
            }
        } catch (\Throwable $e) {
            // Silently fail
        }
    }
}