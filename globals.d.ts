interface SagutidConfig {
  serviceWorkerPath?: string;
  offlineUrl?: string;
  debugMode?: boolean;
  [key: string]: any;
}

interface Window {
  SAGUTID_CONFIG?: SagutidConfig;
}

declare const joomlaLogoPath: string;
