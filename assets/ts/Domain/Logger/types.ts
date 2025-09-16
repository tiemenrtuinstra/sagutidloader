// Domain-specific types for Logger
// Move any Logger-specific interfaces, enums, or types here as you refactor.

export interface LogEntry {
  time: string;
  type: string;
  level: number;
  context: string;
  message: string;
  args: any[];
  origin?: string;
  userAgent?: string;
}
