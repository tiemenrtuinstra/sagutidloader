// Re-export LogType from central types folder for consistency
import { LogType } from '../../Shared/types/log';
export { LogType };


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
    static Log(message: string, context = 'App', typeOrArg?: LogType | any, ...args: any[]): void {
        // Determine whether the 3rd param is a LogType or the first arg
        // Prefer INFO as the default type; LOG remains available for compatibility
        let type: LogType = LogType.INFO as LogType;
        if (typeOrArg === LogType.INFO || typeOrArg === LogType.WARN || typeOrArg === LogType.ERROR || typeOrArg === LogType.SUCCESS) {
            type = typeOrArg as LogType;
        } else if (typeof typeOrArg !== 'undefined') {
            // shift this value into args
            args = [typeOrArg, ...args];
        }

        // Send to server for persistence regardless of debugMode (server-side can filter via config)
        try {
            void Logger.sendToServer(type, message, context, args);
        } catch (e) {
            // ignore
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

    static Warn(message: string, context = 'App', ...args: any[]): void {
        // Warning logs respect debugMode like normal logs; rely on default warn color
        Logger.Log(message, context, LogType.WARN, ...args);
    }

    static Info(message: string, context = 'App', ...args: any[]): void {
        // Info logs behave like normal logs and are gated by debugMode
        Logger.Log(message, context, LogType.INFO, ...args);
    }

    static Success(message: string, context = 'App', ...args: any[]): void {
        // Success messages are informational but have a dedicated color
        Logger.Log(message, context, LogType.SUCCESS, ...args);
    }

    static Error(message: string, context = 'App', ...args: any[]): void {
        // Errors always print regardless of debugMode
        try {
            console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
        } catch (e) {
            console.error(`[${context}] ${message}`, ...args);
        }
    }

    // Send the log entry to the server-side logger endpoint for persistence.
    private static async sendToServer(type: LogType, message: string, context = 'App', args: any[] = []) {
        try {
            // Determine whether server logging is allowed via config; default to true unless explicitly false
            const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
            const config = g.SAGUTID_CONFIG || {};
            if (config.logToServer === false) return;

            const endpoint = config.loggerEndpoint || '/plugins/system/sagutidloader/sagutidlogger_bridge.php';

            const payload = {
                time: new Date().toISOString(),
                type: LogType[type] || String(type),
                level: type,
                context: context,
                message: String(message),
                args: Logger._safeSerialize(args),
                origin: (typeof location !== 'undefined' && location.href) ? location.href : (g?.location?.href || null),
                userAgent: (typeof navigator !== 'undefined') ? (navigator.userAgent || null) : null
            };

            // Use keepalive for page unload scenarios when available
            const fetchOpts: any = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            if (typeof navigator !== 'undefined' && (navigator as any).sendBeacon) {
                try {
                    // sendBeacon only accepts body as ArrayBufferView / Blob / USVString - use string
                    (navigator as any).sendBeacon(endpoint, JSON.stringify(payload));
                    return;
                } catch (e) {
                    // fallback to fetch
                }
            }

            // Use keepalive flag with fetch when available
            try {
                (fetchOpts as any).keepalive = true;
            } catch (e) {
                // ignore
            }

            // Fire-and-forget
            void fetch(endpoint, fetchOpts).catch(() => { /* ignore network errors */ });
        } catch (e) {
            // Swallow errors - logging should never break app
        }
    }

    private static _safeSerialize(obj: any) {
        try {
            return JSON.parse(JSON.stringify(obj, Logger._jsonReplacer));
        } catch (e) {
            try { return String(obj); } catch (e2) { return null; }
        }
    }

    private static _jsonReplacer(key: string, value: any) {
        // avoid functions and DOM nodes
        if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
        if (value instanceof Node) return `[DOM Node ${value.nodeName}]`;
        return value;
    }
}

export type LoggerType = typeof Logger;

export default Logger;
