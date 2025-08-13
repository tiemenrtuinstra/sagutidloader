export class Logger {
    /**
     * Determines whether debug logging is enabled.
     * Checks (in order):
     * 1. window.SAGUTID_CONFIG.debugMode (if defined)
     * 2. URL param "debug" === "true" or "1"
     * Defaults to false.
     */
    static debugMode = (() => {
        // 1) Check global config
        const configDebug = !!(
            window.SAGUTID_CONFIG &&
            window.SAGUTID_CONFIG.debugMode === true
        );

        // 2) Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlDebug =
            urlParams.get('debug') === 'true' ||
            urlParams.get('debug') === '1';

        // 3) Default to false if neither condition is met              
        return configDebug || urlDebug || false;
    })();

    static log(message, color = '#48dbfb', context = 'App', ...args) {
        if (Logger.debugMode) {
            console.log(
                `%c[${context}] ${message}`,
                `color: ${color};`,
                ...args
            );
        }
    }

    static error(message, context = 'App', ...args) {
        // Always log errors, regardless of debug mode
        console.error(
            `%c[${context}] ${message}`,
            'color: red; font-weight: bold;',
            ...args
        );
    }
}