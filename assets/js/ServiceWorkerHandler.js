import { Logger } from './Util/Logger.js';

export const ServiceWorkerHandler = {
  init() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
  const cfg = (typeof window !== 'undefined' && window.SAGUTID_CONFIG) ? window.SAGUTID_CONFIG : {};
  const swPath = cfg.serviceWorker || cfg.serviceWorkerPath || '/plugins/system/sagutidloader/assets/serviceworker.js';

  // Try to register with site-wide scope; if not allowed, fall back to SW's directory
  let reg;
  try {
    reg = await navigator.serviceWorker.register(swPath, { updateViaCache: 'none', scope: '/' });
  } catch (e) {
    reg = await navigator.serviceWorker.register(swPath, { updateViaCache: 'none' });
  }

        // Force a check now and on window focus
        reg.update();
        window.addEventListener('focus', () => reg.update());

        // Kick off offline content update shortly after registration if online
        setTimeout(() => {
          if (navigator.onLine) this._updateDynamicContent(reg);
        }, 1500);

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
          // After controller changes, send config so SW can compute OFFLINE_URL correctly
          if (navigator.serviceWorker.controller && window.SAGUTID_CONFIG) {
            navigator.serviceWorker.controller.postMessage({ type: 'INIT_CONFIG', config: window.SAGUTID_CONFIG });
          }
          // After activate, refresh offline content soon
          setTimeout(() => {
            if (navigator.onLine) this._updateDynamicContent(reg);
          }, 2000);
          window.location.reload();
        });

        // Refresh offline content when coming back online
        window.addEventListener('online', () => this._updateDynamicContent(reg));

        // Try to register periodic background sync when supported
        const swApi = navigator.serviceWorker;
        if (swApi && 'periodicSync' in swApi) {
          try {
            // @ts-ignore - periodicSync is experimental
            await swApi.periodicSync.register('sagutid-content', { minInterval: 24 * 60 * 60 * 1000 });
          } catch (_) { /* ignore */ }
        }
      } catch (e) {
        console.error('SW registration failed:', e);
      }
    });
  },

  _activate(sw) {
    // Auto-activate. If you want a prompt, show UI then call this.
    sw.postMessage('SKIP_WAITING');
  },

  async _updateDynamicContent(reg) {
    try {
      const sw = reg.active || navigator.serviceWorker.controller;
      if (!sw) return;
      const msg = { type: 'UPDATE_DYNAMIC_CONTENT' };
      // Use MessageChannel to optionally receive a result
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => {
        if (e.data?.success) {
          console.log(`SW: Precached ${e.data.count} pages from sitemap`);
        } else if (e.data?.error) {
          console.warn('SW: Update dynamic content reported error:', e.data.error);
        }
      };
      sw.postMessage(msg, [channel.port2]);
    } catch (err) {
      console.warn('Failed to request dynamic content update:', err);
    }
  }
};