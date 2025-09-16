// Domain-specific types for ServiceWorker
// Move any SW-specific interfaces, enums, or types here as you refactor.

export interface SWMessage {
  type: string;
  [key: string]: any;
}
