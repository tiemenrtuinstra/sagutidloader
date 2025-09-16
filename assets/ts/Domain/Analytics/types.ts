// Selector type used in Analytics domain
export type Selector = string | Element | NodeListOf<Element>;
// Domain-specific types for Analytics
// Move any Analytics-specific interfaces, enums, or types here as you refactor.

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}
