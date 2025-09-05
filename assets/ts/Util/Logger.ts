// Enum-like object for log types (avoid TS `enum` so Babel builds stay compatible)
export const LogType = Object.freeze({
    INFO: 'info',
    SUCCESS: 'success',
    WARN: 'warn',
    ERROR: 'error'
} as const);

export type LogType = typeof LogType[keyof typeof LogType];

export class Logger {
    /** whether debug mode is enabled */
    static debugMode: boolean = (() => {
        // Use a global-safe accessor (works in window and worker contexts)
        const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};

        // 1) Check global config
        const configDebug = !!(g.SAGUTID_CONFIG && g.SAGUTID_CONFIG.debugMode === true);

        // 2) Check URL parameter if available (window or worker location)
        let urlDebug = false;
        try {
            // location.search exists in window and may exist in worker as part of script URL
            const search = (typeof (g.location) !== 'undefined' && g.location.search) ? g.location.search : '';
            if (search) {
                const urlParams = new URLSearchParams(search);
                urlDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
            }
        } catch (e) {
            // ignore
        }

        return configDebug || urlDebug || false;
    })();

    /**
     * Generic log function. Uses LogType to determine console method.
     * By default normal logs and warnings are gated behind debugMode; errors always print.
     */
    // Backwards-compatible signature:
    // log(message, color?, context?, typeOrArg?, ...args)
    static log(message: string, context = 'App', typeOrArg?: LogType | any, ...args: any[]): void {
        // Determine whether the 3rd param is a LogType or the first arg
        // Prefer INFO as the default type; LOG remains available for compatibility
        let type: LogType = LogType.INFO as LogType;
    if (typeOrArg === LogType.INFO || typeOrArg === LogType.WARN || typeOrArg === LogType.ERROR || typeOrArg === LogType.SUCCESS) {
            type = typeOrArg as LogType;
        } else if (typeof typeOrArg !== 'undefined') {
            // shift this value into args
            args = [typeOrArg, ...args];
        }

        // Only print non-error logs when not in debug mode
        if (!Logger.debugMode && type !== LogType.ERROR) return;

        // Resolve default color based on log type when color not provided
        const defaultColor = (t: LogType) => {
            switch (t) {
                case LogType.ERROR: return '#ff3f34';
                case LogType.WARN: return '#ffaa00';
                case LogType.SUCCESS: return '#28a745';
                case LogType.INFO: return '#48dbfb';
                default: return '#48dbfb';
            }
        };
    const resolvedColor = defaultColor(type);

        try {
            if (type === LogType.ERROR) {
                console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
            } else if (type === LogType.WARN) {
                console.warn(`%c[${context}] ${message}`, `color: ${resolvedColor};`, ...args);
            } else {
                console.log(`%c[${context}] ${message}`, `color: ${resolvedColor};`, ...args);
            }
        } catch (e) {
            // fallback without CSS
            if (type === LogType.ERROR) {
                console.error(`[${context}] ${message}`, ...args);
            } else if (type === LogType.WARN) {
                console.warn(`[${context}] ${message}`, ...args);
            } else {
                console.log(`[${context}] ${message}`, ...args);
            }
    }
    }

    static warn(message: string, context = 'App', ...args: any[]): void {
        // Warning logs respect debugMode like normal logs; rely on default warn color
    Logger.log(message, context, LogType.WARN, ...args);
    }

    static info(message: string, context = 'App', ...args: any[]): void {
        // Info logs behave like normal logs and are gated by debugMode
    Logger.log(message, context, LogType.INFO, ...args);
    }

    static success(message: string, context = 'App', ...args: any[]): void {
        // Success messages are informational but have a dedicated color
    Logger.log(message, context, LogType.SUCCESS, ...args);
    }

    static error(message: string, context = 'App', ...args: any[]): void {
        // Errors always print regardless of debugMode
        try {
            console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
        } catch (e) {
            console.error(`[${context}] ${message}`, ...args);
        }
    }
}

export default Logger;
