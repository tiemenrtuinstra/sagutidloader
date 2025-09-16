<?php

namespace PlgSystemSagutidloader\Domain\Forms\Services;

/**
 * Diagnostics service for DDD Forms domain
 * Handles log and diagnostics status rendering
 */
class DiagnosticsService
{
    public static function getLogEntries(): string
    {
        try {
            $pluginBase = defined('JPATH_PLUGINS') ? constant('JPATH_PLUGINS') . '/system/sagutidloader/' : __DIR__ . '/../../../../';
            $logsDir = $pluginBase . 'logs/';
            if (!is_dir($logsDir)) {
                return '<p><em>Geen logbestanden gevonden. Logs directory bestaat nog niet.</em></p>';
            }
            $logFiles = glob($logsDir . '*.log');
            if (empty($logFiles)) {
                return '<p><em>Geen logbestanden gevonden in ' . htmlspecialchars($logsDir) . '</em></p>';
            }
            usort($logFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
            $output = '<div style="max-height: 400px; overflow-y: auto; background: #f9f9f9; padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 12px;">';
            foreach (array_slice($logFiles, 0, 3) as $logFile) {
                $filename = basename($logFile);
                $output .= '<h4 style="margin: 0 0 10px 0; color: #333;">📄 ' . htmlspecialchars($filename) . '</h4>';
                if (!is_readable($logFile)) {
                    $output .= '<p style="color: #999;">Bestand niet leesbaar</p>';
                    continue;
                }
                $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                if ($lines === false) {
                    $output .= '<p style="color: #999;">Kon bestand niet lezen</p>';
                    continue;
                }
                $recentLines = array_slice($lines, -10);
                foreach ($recentLines as $line) {
                    $line = htmlspecialchars($line);
                    if (strpos($line, '[ERROR]') !== false) {
                        $color = '#d32f2f';
                    } elseif (strpos($line, '[WARN]') !== false) {
                        $color = '#f57c00';
                    } elseif (strpos($line, '[SUCCESS]') !== false) {
                        $color = '#388e3c';
                    } else {
                        $color = '#666';
                    }
                    $output .= '<div style="margin: 2px 0; color: ' . $color . '; white-space: pre-wrap;">' . $line . '</div>';
                }
                $totalLines = count($lines);
                if ($totalLines > 10) {
                    $output .= '<p style="margin: 10px 0 0 0; color: #999; font-style: italic;">... en ' . ($totalLines - 10) . ' oudere entries</p>';
                }
                $output .= '<hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">';
            }
            $output .= '</div>';
            return $output;
        } catch (\Throwable $e) {
            return '<p style="color: #d32f2f;">Fout bij het laden van logbestanden: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    }

    public static function getDiagnosticsStatus($params = null): string
    {
        if (!class_exists('Joomla\\CMS\\Factory')) {
            return '';
        }
        $app = \Joomla\CMS\Factory::getApplication();
        if (!$app->isClient('administrator')) {
            return '';
        }
        try {
            $pluginBase = defined('JPATH_PLUGINS') ? constant('JPATH_PLUGINS') . '/system/sagutidloader/assets/' : null;
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
                if ($params && method_exists($params, 'get')) {
                    $debug = (bool) $params->get('debug', 0);
                    $force = (bool) $params->get('force_reregister', 0);
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
}