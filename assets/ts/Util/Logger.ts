export class Logger {
    /** whether debug mode is enabled */
    static debugMode: boolean = (() => {
        // 1) Check global config
        const configDebug = !!(
            (window as any).SAGUTID_CONFIG &&
            (window as any).SAGUTID_CONFIG.debugMode === true
        );

        // 2) Check URL parameter
        let urlDebug = false;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            urlDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
        } catch (e) {
            // ignore
        }

        return configDebug || urlDebug || false;
    })();

    static log(message: string, color = '#48dbfb', context = 'App', ...args: any[]): void {
        if (Logger.debugMode) {
            console.log(`%c[${context}] ${message}`, `color: ${color};`, ...args);
        }
    }

    static error(message: string, context = 'App', ...args: any[]): void {
        console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
    }
}

export default Logger;
