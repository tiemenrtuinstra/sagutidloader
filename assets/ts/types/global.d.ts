interface SagutidConfig {
  serviceWorker?: string;
  serviceWorkerPath?: string;
  debugMode?: boolean;
  forceReregister?: boolean;
  sitemapPrefetchLimit?: number;
}

declare global {
  interface Window {
    SAGUTID_CONFIG?: SagutidConfig;
  }
  interface ServiceWorkerGlobalScope {
    SAGUTID_CONFIG?: SagutidConfig;
  }
  var self: ServiceWorkerGlobalScope & typeof globalThis;
}

export {};
