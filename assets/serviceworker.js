import Logger from './ts/Util/Logger';

const CACHE_NAME = `sagutid-v27.0.2`;
// Base path for plugin assets (derived from the SW script URL, not the scope)
const SCRIPT_PATHNAME = (typeof self !== 'undefined' && self.location) ? new URL(self.location).pathname : '/plugins/system/sagutidloader/assets/serviceworker.js';
const ASSET_BASE = SCRIPT_PATHNAME.replace(/[^/]+$/, ''); // strip filename to get folder
const OFFLINE_URL = ASSET_BASE + 'offline.html';

// Helper: fetch with timeout and better error handling
async function fetchWithTimeout(resource, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      cache: 'no-store' // Prevent cache conflicts during SW install
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

class SagutidServiceWorker {
  constructor() {
    this.CACHE_NAME = CACHE_NAME;

    // Simplified asset lists - only cache what's guaranteed to exist
    this.STATIC_ASSETS = [
      // Keep only same-origin assets likely available; note: navigations will be handled separately
      OFFLINE_URL,
      '/templates/yootheme/css/theme.css',
      '/templates/yootheme/js/app.js',
      '/images/Logo/android-chrome-192x192.png',
      '/images/Logo/android-chrome-512x512.png'
    ];

    this.dynamicPaths = ['/', '/verhalen', '/gedichten', '/overig', 'tegeltjes-wijsheden'];

    // Only critical assets that definitely exist
    this.CRITICAL_ASSETS = [
      OFFLINE_URL,
      '/templates/yootheme/css/theme.css',
      '/plugins/system/sagutidloader/assets/dist/main.bundle.js',
      '/plugins/system/sagutidloader/assets/dist/styles.bundle.css',
      '/plugins/system/sagutidloader/offline.html'
    ];
  }

  async install(event) {
  Logger.info('SW: Installing...', 'ServiceWorker');
    self.skipWaiting();

    event.waitUntil((async () => {
      try {
        const cache = await caches.open(this.CACHE_NAME);
  Logger.info('SW: Cache opened successfully', 'ServiceWorker');

        // Cache critical assets first
        let successCount = 0;
        let failCount = 0;

        for (const asset of this.CRITICAL_ASSETS) {
          try {
            const response = await fetchWithTimeout(asset);
            if (response.ok) {
              await cache.put(asset, response.clone());
              successCount++;
              Logger.info(`SW: Cached critical asset: ${asset}`, 'ServiceWorker');
            } else {
              failCount++;
              Logger.warn(`SW: Failed to cache ${asset}: ${response.status}`, 'ServiceWorker');
            }
          } catch (err) {
            failCount++;
            Logger.warn(`SW: Error caching ${asset}: ${err?.message || err}`, 'ServiceWorker');
          }
        }

        // Cache static assets (non-critical)
        for (const asset of this.STATIC_ASSETS) {
          try {
            const response = await fetchWithTimeout(asset);
            if (response.ok) {
              await cache.put(asset, response.clone());
              successCount++;
              Logger.info(`SW: Cached static asset: ${asset}`, 'ServiceWorker');
            } else {
              failCount++;
              Logger.warn(`SW: Failed to cache ${asset}: ${response.status}`, 'ServiceWorker');
            }
            } catch (err) {
            failCount++;
            Logger.warn(`SW: Error caching ${asset}: ${err?.message || err}`, 'ServiceWorker');
          }
        }

  Logger.info(`SW: Installation complete. Success: ${successCount}, Failed: ${failCount}`, 'ServiceWorker');

      } catch (err) {
        Logger.error('SW: Installation failed: ' + (err?.message || err), 'ServiceWorker');
        // Don't throw - allow SW to install even with cache failures
      }
    })());
  }

  async activate(event) {
  Logger.info('SW: Activating...', 'ServiceWorker');

    event.waitUntil((async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== this.CACHE_NAME);

        await Promise.all(
          oldCaches.map(name => {
            Logger.info(`SW: Deleting old cache: ${name}`, 'ServiceWorker');
            return caches.delete(name);
          })
        );

        // Take control of all clients
        await self.clients.claim();
  Logger.info('SW: Activated and claimed clients', 'ServiceWorker');

      } catch (err) {
            Logger.error('SW: Activation failed: ' + (err?.message || err), 'ServiceWorker');
      }
    })());
  }

  fetch(event) {
    const req = event.request;

    // Only handle GET requests
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Skip non-HTTP(S) requests
    if (!url.protocol.startsWith('http')) return;

    // Network-first for navigation requests
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req)
          .then(response => {
            // Cache successful responses
            if (response.ok) {
              caches.open(this.CACHE_NAME)
          .then(cache => cache.put(req, response.clone()))
          .catch(err => Logger.warn('SW: Failed to cache navigation response: ' + (err?.message || err), 'ServiceWorker'));
            }
            return response;
          })
          .catch(async () => {
            // Fallback to cache, then offline page
            const cached = await caches.match(req);
            if (cached) {
              Logger.log(`SW: Serving cached navigation: ${req.url}`, '#00cc66', 'ServiceWorker');
              return cached;
            }

            // Try to serve offline page
            const offlinePage = await caches.match(OFFLINE_URL);
            return offlinePage || new Response('Offline', { status: 503 });
          })
      );
      return;
    }

    // Cache-first for static assets
    if (/\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/i.test(url.pathname)) {
      event.respondWith(
        caches.match(req)
          .then(cached => {
            if (cached) {
              return cached;
            }

            return fetch(req)
              .then(response => {
                if (response.ok) {
                  caches.open(this.CACHE_NAME)
            .then(cache => cache.put(req, response.clone()))
            .catch(err => Logger.warn('SW: Failed to cache static asset: ' + (err?.message || err), 'ServiceWorker'));
                }
                return response;
              })
              .catch(() => {
              Logger.warn(`SW: Failed to fetch static asset: ${req.url}`, 'ServiceWorker');
                  return new Response('Asset not available', { status: 404 });
                });
          })
      );
      return;
    }
  }

  async message(event) {
    const { data } = event;

    if (data === 'SKIP_WAITING') {
  Logger.info('SW: Skip waiting requested', 'ServiceWorker');
      return self.skipWaiting();
    }

    if (data?.type === 'INIT_CONFIG') {
      self.SAGUTID_CONFIG = data.config;
      // Propagate debugMode into the Logger runtime for the service worker
      try {
        Logger.debugMode = !!(data.config && data.config.debugMode === true);
      } catch (e) {
        // ignore if Logger isn't writable for any reason
      }
  Logger.info('SW: Config initialized', 'ServiceWorker');
      return;
    }

    if (data?.type === 'UPDATE_DYNAMIC_CONTENT') {
  Logger.info('SW: Dynamic content update requested', 'ServiceWorker');

      try {
        const cache = await caches.open(this.CACHE_NAME);

        const limit = (typeof data?.limit === 'number' && data.limit > 0) ? Math.floor(data.limit) : 300;

        // Helper: parse a sitemap or sitemap index and collect up to `limit` URLs
        const collectUrls = async (sitemapUrl, out) => {
          if (out.length >= limit) return;
          const res = await fetchWithTimeout(sitemapUrl);
          if (!res.ok) throw new Error(`Sitemap request failed: ${res.status}`);
          const xml = await res.text();

          // Simple, robust XML parsing without DOMParser: extract <url><loc> and <sitemap><loc>
          // 1) Find <url> entries and their <loc>
          const urlRegex = /<url\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/gi;
          let match;
          let found = false;
          while (out.length < limit && (match = urlRegex.exec(xml))) {
            found = true;
            const u = match[1].trim();
            if (u) out.push(u);
            if (out.length >= limit) break;
          }
          if (found) return;

          // 2) If no <url> entries, treat as sitemapindex and recurse into <sitemap><loc>
          const sitemapRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
          while (out.length < limit && (match = sitemapRegex.exec(xml))) {
            const sm = match[1].trim();
            if (!sm) continue;
                Logger.warn(`SW: Error caching ${asset}: ${err?.message || err}`, 'ServiceWorker');
            if (out.length >= limit) break;
          }
        };

        // Start from primary sitemap
        const startSitemap = '/index.php?option=com_jmap&view=sitemap&format=xml';
        const urls = [];
        await collectUrls(startSitemap, urls);

        let updateCount = 0;
        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
              updateCount++;
            }
          } catch (err) {
            Logger.log(`SW: Failed to update ${url}: ${err?.message || err}`, 'orange', 'ServiceWorker');
          }
        }
        Logger.log(`SW: Updated ${updateCount} URLs (limit ${limit})`, '#00cc66', 'ServiceWorker');
        event.ports[0]?.postMessage({ success: true, count: updateCount });
      } catch (err) {
        Logger.error('SW: Update failed: ' + (err?.message || err), 'ServiceWorker');
        event.ports[0]?.postMessage({ success: false, error: err?.message || String(err) });
      }
    }
  }
}

// Initialize service worker
const sagutidSW = new SagutidServiceWorker();

// Register event listeners
self.addEventListener('install', event => sagutidSW.install(event));
self.addEventListener('activate', event => sagutidSW.activate(event));
self.addEventListener('fetch', event => sagutidSW.fetch(event));
self.addEventListener('message', event => sagutidSW.message(event));
















































