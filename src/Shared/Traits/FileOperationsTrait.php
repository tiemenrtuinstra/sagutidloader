<?php

namespace PlgSystemSagutidloader\Shared\Traits;

/**
 * File operations trait for common file handling
 */
trait FileOperationsTrait
{
    /**
     * Get safe directory path with fallback
     * 
     * @param string $joomlaConstant Joomla constant name
     * @param string $fallbackPath Fallback relative path
     * @return string
     */
    protected function getSafePath(string $joomlaConstant, string $fallbackPath): string
    {
        return defined($joomlaConstant) ? constant($joomlaConstant) . $fallbackPath : __DIR__ . $fallbackPath;
    }

    /**
     * Ensure directory exists with proper permissions
     * 
     * @param string $dirPath Directory path
     * @param int $permissions Directory permissions (default 0755)
     * @return bool Success status
     */
    protected function ensureDirectory(string $dirPath, int $permissions = 0755): bool
    {
        if (is_dir($dirPath)) {
            return true;
        }

        try {
            return @mkdir($dirPath, $permissions, true);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Write content to file atomically with locking
     * 
     * @param string $filePath File path
     * @param string $content Content to write
     * @param bool $append Append mode (default false)
     * @return bool Success status
     */
    protected function writeFileAtomic(string $filePath, string $content, bool $append = false): bool
    {
        $mode = $append ? 'a' : 'w';
        
        try {
            $handle = @fopen($filePath, $mode);
            if (!$handle) {
                return false;
            }

            @flock($handle, LOCK_EX);
            $result = @fwrite($handle, $content) !== false;
            @flock($handle, LOCK_UN);
            @fclose($handle);

            return $result;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Read file with error handling
     * 
     * @param string $filePath File path
     * @return string|false File contents or false on failure
     */
    protected function readFileSafe(string $filePath): string|false
    {
        try {
            if (!is_readable($filePath)) {
                return false;
            }

            return file_get_contents($filePath);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Check if file exists and is readable
     * 
     * @param string $filePath File path
     * @return bool
     */
    protected function isFileAccessible(string $filePath): bool
    {
        return file_exists($filePath) && is_readable($filePath);
    }

    /**
     * Get file size safely
     * 
     * @param string $filePath File path
     * @return int File size in bytes, 0 on failure
     */
    protected function getFileSizeSafe(string $filePath): int
    {
        try {
            if (!$this->isFileAccessible($filePath)) {
                return 0;
            }

            $size = filesize($filePath);
            return $size !== false ? $size : 0;
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Delete file safely
     * 
     * @param string $filePath File path
     * @return bool Success status
     */
    protected function deleteFileSafe(string $filePath): bool
    {
        try {
            return !file_exists($filePath) || @unlink($filePath);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Normalize file path for cross-platform compatibility
     * 
     * @param string $path File path
     * @return string Normalized path
     */
    protected function normalizePath(string $path): string
    {
        return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    }
}