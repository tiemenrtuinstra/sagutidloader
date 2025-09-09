import Logger from './Util/Logger';

const ServiceWorkerHandler = {
  init() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
        const cfg = (typeof window !== 'undefined' && (window as any).SAGUTID_CONFIG) ? (window as any).SAGUTID_CONFIG : {};
        // Prefer the bundled service worker in dist to avoid unbundled ES imports being fetched
        const preferredSw = '/plugins/system/sagutidloader/assets/dist/serviceworker.js';
        const swPath = cfg.serviceWorker || cfg.serviceWorkerPath || preferredSw;

        // Try to register with site-wide scope; if not allowed, fall back to SW's directory
        let reg: ServiceWorkerRegistration;
        try {
          // @ts-ignore Allow scope option
          reg = await navigator.serviceWorker.register(swPath, { updateViaCache: 'none', scope: '/' } as any);
        } catch (e) {
          reg = await navigator.serviceWorker.register(swPath, { updateViaCache: 'none' } as any);
        }

        // Log registration and the actual script URL used by the registration (helps debug wrong file served)
        const actualScript = (reg && (reg.active || reg.installing || reg.waiting) && ((reg.active && (reg.active as any).scriptURL) || (reg.installing && (reg.installing as any).scriptURL) || (reg.waiting && (reg.waiting as any).scriptURL))) || 'unknown';
        Logger.Log(`SW registered (attempted: ${swPath}) (actual: ${actualScript})`, 'ServiceWorkerHandler', reg as any);
        reg.update();
        window.addEventListener('focus', () => reg.update());

        // If a controller already exists, send the config immediately so the SW can pick up debugMode
        if (navigator.serviceWorker.controller && (window as any).SAGUTID_CONFIG) {
          navigator.serviceWorker.controller.postMessage({ type: 'INIT_CONFIG', config: (window as any).SAGUTID_CONFIG });
        }

        // If debugMode is enabled via config, optionally force a quick re-register cycle to ensure the SW uses the latest config.
        // This is a helpful development aid and only runs when debugMode is true.
        try {
          const cfg = (window as any).SAGUTID_CONFIG || {};
          if (cfg.forceReregister === true) {
            // Unregister and re-register to ensure a fresh controller and INIT_CONFIG handshake in some edge cases
            // Do this asynchronously to avoid blocking the page
            (async () => {
              try {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const r of regs) {
                  await r.unregister();
                }
                // Re-register
                await navigator.serviceWorker.register(swPath, { updateViaCache: 'none', scope: '/' } as any);
                // Send INIT_CONFIG again after short delay
                setTimeout(() => {
                  if (navigator.serviceWorker.controller && (window as any).SAGUTID_CONFIG) {
                    navigator.serviceWorker.controller.postMessage({ type: 'INIT_CONFIG', config: (window as any).SAGUTID_CONFIG });
                    Logger.Info('Sent INIT_CONFIG after forced re-register', 'ServiceWorkerHandler');
                  }
                }, 1000);
              } catch (e) {
                // ignore errors in this best-effort debug flow
              }
            })();
          }
        } catch (e) {
          // ignore
        }

        // Kick off offline content update shortly after registration if online
        setTimeout(() => {
          if (navigator.onLine) {
            Logger.Log('Triggering dynamic content update after registration', 'ServiceWorkerHandler');
            (this as any)._updateDynamicContent(reg);
          }
        }, 1500);

        // Handle an already waiting worker on page load
        if (reg.waiting) {
          Logger.Log('Found waiting service worker on load, activating', 'ServiceWorkerHandler');
          (this as any)._activate(reg.waiting);
        }

        // Detect new update arrivals
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              // New version ready – activate it (or show a prompt first)
              Logger.Log('New service worker installed, activating', 'ServiceWorkerHandler');
              (this as any)._activate(sw);
            }
          });
        });

        // When the new SW takes control, reload to get fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          Logger.Log('Service worker controller changed', 'ServiceWorkerHandler');
          // After controller changes, send config so SW can compute OFFLINE_URL correctly
          if (navigator.serviceWorker.controller && (window as any).SAGUTID_CONFIG) {
            Logger.Log('Sending INIT_CONFIG to new service worker', 'ServiceWorkerHandler');
            navigator.serviceWorker.controller.postMessage({ type: 'INIT_CONFIG', config: (window as any).SAGUTID_CONFIG });
          }
          // After activate, refresh offline content soon
          setTimeout(() => {
            if (navigator.onLine) {
              Logger.Log('Requesting dynamic content update after controller change', 'ServiceWorkerHandler');
              (this as any)._updateDynamicContent(reg);
            }
          }, 2000);
          window.location.reload();
        });

        // Refresh offline content when coming back online
        window.addEventListener('online', () => {
          Logger.Log('Browser went online, requesting dynamic content update', 'ServiceWorkerHandler');
          (this as any)._updateDynamicContent(reg);
        });

        // Listen for SW messages (e.g. MANIFEST_CHANGED)
        navigator.serviceWorker.addEventListener('message', (e: any) => {
          try {
            const data = e.data;
            if (!data) return;
            if (data.type === 'MANIFEST_CHANGED') {
              Logger.Info('Received MANIFEST_CHANGED from SW: ' + (data.href || ''), 'ServiceWorkerHandler');
              // You can show UI here or reload depending on your UX choice. For now just log.
            }
          } catch (err) {
            Logger.Warn('Error handling SW message', 'ServiceWorkerHandler', err);
          }
        });

        // Try to register periodic background sync when supported
        const swApi = navigator.serviceWorker as any;
        if (swApi && 'periodicSync' in swApi) {
          try {
            // @ts-ignore - periodicSync is experimental
            await swApi.periodicSync.register('sagutid-content', { minInterval: 24 * 60 * 60 * 1000 });
            Logger.Log('Registered periodicSync for sagutid-content', 'ServiceWorkerHandler');
          } catch (err) {
            Logger.Warn('Failed to register periodicSync', 'ServiceWorkerHandler', err);
          }
        }
      } catch (e) {
        Logger.Error('SW registration failed: ' + (e?.message || e), 'ServiceWorkerHandler');
      }
    });
  },

  // Ask the service worker to check the manifest immediately
  async checkManifestNow(manifestHref = '/plugins/system/sagutidloader/assets/manifest.webmanifest') {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const reg = regs[0] || null;
      const sw = (reg as any)?.active || navigator.serviceWorker.controller;
      if (!sw) return;
      const channel = new MessageChannel();
      channel.port1.onmessage = (e: any) => {
        if (e.data?.changed) Logger.Log('Manifest check result: changed=' + String(e.data.changed), 'ServiceWorkerHandler');
        else if (e.data?.error) Logger.Warn('Manifest check error: ' + e.data.error, 'ServiceWorkerHandler');
      };
      sw.postMessage({ type: 'CHECK_MANIFEST', href: manifestHref }, [channel.port2]);
    } catch (err) {
      Logger.Warn('Failed to request manifest check: ' + (err?.message || err), 'ServiceWorkerHandler');
    }
  },

  _activate(sw: ServiceWorker) {
    // Auto-activate. If you want a prompt, show UI then call this.
    sw.postMessage('SKIP_WAITING');
  },

  async _updateDynamicContent(reg: ServiceWorkerRegistration) {
    try {
      const sw = (reg as any).active || navigator.serviceWorker.controller;
      if (!sw) return;
      const msg = { type: 'UPDATE_DYNAMIC_CONTENT' };
      // Use MessageChannel to optionally receive a result
      const channel = new MessageChannel();
      channel.port1.onmessage = (e: any) => {
        if (e.data?.success) {
          Logger.Log(`SW: Precached ${e.data.count} pages from sitemap`, 'ServiceWorkerHandler');
        } else if (e.data?.error) {
          Logger.Warn('SW: Update dynamic content reported error: ' + (e.data.error || ''), 'ServiceWorkerHandler');
        }
      };
      sw.postMessage(msg, [channel.port2]);
    } catch (err) {
      Logger.Warn('Failed to request dynamic content update: ' + (err?.message || err), 'ServiceWorkerHandler');
    }
  }
};

export default ServiceWorkerHandler;
