export class Logger {
    static debugMode = (() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
    })();

    static log(message, color = '#48dbfb', context = 'General', ...args) {
        if (Logger.debugMode) {
            console.log(`%c[${context}] ${message}`, `color: ${color};`, ...args);
        }
    }

    static error(message, context = 'General', ...args) {
        if (Logger.debugMode) {
            console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
        }
    }
}