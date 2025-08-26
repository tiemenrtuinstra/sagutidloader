import { Logger } from './Util/Logger.js';

export const ServiceWorkerHandler = {
  init() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
  const cfg = (typeof window !== 'undefined' && window.SAGUTID_CONFIG) ? window.SAGUTID_CONFIG : {};
  const swPath = cfg.serviceWorker || cfg.serviceWorkerPath || '/plugins/system/sagutidloader/assets/serviceworker.js';

  const reg = await navigator.serviceWorker.register(swPath, { updateViaCache: 'none' });

        // Force a check now and on window focus
        reg.update();
        window.addEventListener('focus', () => reg.update());

        // Handle an already waiting worker on page load
        if (reg.waiting) this._activate(reg.waiting);

        // Detect new update arrivals
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              // New version ready – activate it (or show a prompt first)
              this._activate(sw);
            }
          });
        });

        // When the new SW takes control, reload to get fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } catch (e) {
        console.error('SW registration failed:', e);
      }
    });
  },

  _activate(sw) {
    // Auto-activate. If you want a prompt, show UI then call this.
    sw.postMessage('SKIP_WAITING');
  }
};