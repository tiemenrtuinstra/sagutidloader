// Re-export LogType from central types folder for consistency
import { LogType } from '../../Shared/types/log';
export { LogType };

export class Logger {
    static debugMode: boolean = (() => {
        const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : {};
        const configDebug = !!(g.SAGUTID_CONFIG && g.SAGUTID_CONFIG.debugMode === true);
        let urlDebug = false;
        try {
            const search = (typeof (g.location) !== 'undefined' && g.location.search) ? g.location.search : '';
            if (search) {
                const urlParams = new URLSearchParams(search);
                urlDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
            }
        } catch (e) {}
        return configDebug || urlDebug || false;
    })();

    static Log(message: string, context = 'App', typeOrArg?: LogType | any, ...args: any[]): void {
        let type: LogType = LogType.INFO as LogType;
        if (typeOrArg === LogType.INFO || typeOrArg === LogType.WARN || typeOrArg === LogType.ERROR || typeOrArg === LogType.SUCCESS) {
            type = typeOrArg as LogType;
        } else if (typeof typeOrArg !== 'undefined') {
            args = [typeOrArg, ...args];
        }
        try {
            void Logger.sendToServer(type, message, context, args);
        } catch (e) {}
        if (!Logger.debugMode && type !== LogType.ERROR) return;
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
        Logger.Log(message, context, LogType.WARN, ...args);
    }

    static Info(message: string, context = 'App', ...args: any[]): void {
        Logger.Log(message, context, LogType.INFO, ...args);
    }

    static Success(message: string, context = 'App', ...args: any[]): void {
        Logger.Log(message, context, LogType.SUCCESS, ...args);
    }

    static Error(message: string, context = 'App', ...args: any[]): void {
        try {
            console.error(`%c[${context}] ${message}`, 'color: red; font-weight: bold;', ...args);
        } catch (e) {
            console.error(`[${context}] ${message}`, ...args);
        }
    }

    private static async sendToServer(type: LogType, message: string, context = 'App', args: any[] = []) {
        try {
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
            const fetchOpts: any = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
            if (typeof navigator !== 'undefined' && (navigator as any).sendBeacon) {
                try {
                    (navigator as any).sendBeacon(endpoint, JSON.stringify(payload));
                    return;
                } catch (e) {}
            }
            try {
                (fetchOpts as any).keepalive = true;
            } catch (e) {}
            void fetch(endpoint, fetchOpts).catch(() => { });
        } catch (e) {}
    }

    private static _safeSerialize(obj: any) {
        try {
            return JSON.parse(JSON.stringify(obj, Logger._jsonReplacer));
        } catch (e) {
            try { return String(obj); } catch (e2) { return null; }
        }
    }

    private static _jsonReplacer(key: string, value: any) {
        if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
        if (typeof Node !== 'undefined' && value instanceof Node) return `[DOM Node ${value.nodeName}]`;
        return value;
    }
}

export type LoggerType = typeof Logger;

export default Logger;
