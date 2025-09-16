export const LogType = Object.freeze({
    INFO: 'info',
    SUCCESS: 'success',
    WARN: 'warn',
    ERROR: 'error'
} as const);

export type LogType = typeof LogType[keyof typeof LogType];
