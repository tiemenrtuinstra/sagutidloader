// Domain-specific types for PWA
// Move any PWA-specific interfaces, enums, or types here as you refactor.

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
