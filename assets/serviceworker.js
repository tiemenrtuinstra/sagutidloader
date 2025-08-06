const CACHE_NAME = `sagutid-v17.0.0`;

// Import Logger functionality for service worker
// Since we can't import ES modules in SW, we'll replicate the Logger logic
class ServiceWorkerLogger {
  static get debugMode() {
    try {
      const urlParams = new URLSearchParams(self.location.search);
      const urlDebug = urlParams.get('debug') === 'true' || urlParams.get('debug') === '1';
      const configDebug = !!(self.SAGUTID_CONFIG && self.SAGUTID_CONFIG.debugMode === true);
      return configDebug || urlDebug;
    } catch {
      return false;
    }
  }

  static log(message, color = '#48dbfb', context = 'ServiceWorker', ...args) {
    if (ServiceWorkerLogger.debugMode) {
      console.log(
        `%c[${context}] ${message}`,
        `color: ${color};`,
        ...args
      );
    }
  }

  static error(message, context = 'ServiceWorker', ...args) {
    if (ServiceWorkerLogger.debugMode) {
      console.error(
        `%c[${context}] ${message}`,
        'color: red; font-weight: bold;',
        ...args
      );
    }
  }
}

// Helper: fetch with timeout
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

class SagutidServiceWorker {
  constructor() {
    this.CACHE_NAME    = CACHE_NAME;
    this.STATIC_ASSETS = [
      '/', '/index.php', '/offline.html',
      '/templates/yootheme/css/theme.css',
      '/templates/yootheme/js/app.js',
      '/images/Logo/android-chrome-512x512.png',
      '/images/Logo/Sagutid-verhalen.png',
      '/images/Logo/Sagutid-gedichten.png',
      '/images/Logo/Sagutid-overig.png',
      '/images/Logo/Sagutid-groot.jpg',
      '/images/Logo/android-chrome-192x192.png',
      '/images/Logo/apple-touch-icon.png',
      '/images/Logo/favicon-16x16.png',
      '/images/Logo/favicon-32x32.png'
    ];
    this.dynamicPaths = ['/', '/verhalen', '/gedichten', '/overig'];
    this.CRITICAL_ASSETS = [
      '/index.php',
      '/plugins/system/sagutidloader/assets/offline.html',
      '/templates/yootheme/css/theme.css',
      '/templates/yootheme/js/app.js',
      '/plugins/system/sagutidloader/assets/dist/main.bundle.js',
      '/plugins/system/sagutidloader/assets/dist/main.bundle.css',
      '/plugins/system/sagutidloader/assets/dist/styles.bundle.css',
    ];
  }

  async install(event) {
    ServiceWorkerLogger.log('Installing Sagutid SW…', '#00ff00');
    self.skipWaiting();

    event.waitUntil((async () => {
      const cache = await caches.open(this.CACHE_NAME);

      // 1) Preload critical assets
      for (const asset of this.CRITICAL_ASSETS) {
        const cached = await cache.match(asset);
        if (cached) {
          ServiceWorkerLogger.log(`Asset already cached: ${asset}`, '#48dbfb');
          continue;
        }
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
            ServiceWorkerLogger.log(`Cached critical asset: ${asset}`, '#00ff00');
          }
        } catch (err) {
          ServiceWorkerLogger.error(`Failed to cache critical asset ${asset}: ${err.message}`);
        }
      }

      // 2) Cache static assets
      for (const asset of this.STATIC_ASSETS) {
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
            ServiceWorkerLogger.log(`Cached static asset: ${asset}`, '#00ff00');
          }
        } catch (err) {
          ServiceWorkerLogger.error(`Failed to cache static asset ${asset}: ${err.message}`);
        }
      }

      // 3) Fetch & cache sitemap URLs
      try {
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml = await sitemapRes.text();
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        ServiceWorkerLogger.log(`Found ${urls.length} pages in sitemap.`, '#ffa500');
        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
              ServiceWorkerLogger.log(`Cached sitemap URL: ${url}`, '#00ff00');
            }
          } catch (err) {
            ServiceWorkerLogger.error(`Failed to cache sitemap URL ${url}: ${err.message}`);
          }
        }
      } catch (err) {
        ServiceWorkerLogger.error(`Error fetching or parsing sitemap: ${err.message}`);
      }
    })());
  }

  async activate(event) {
    ServiceWorkerLogger.log('Activating Sagutid SW…', '#00ff00');
    const currentCaches = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.filter(name => !currentCaches.includes(name))
            .map(name => {
              ServiceWorkerLogger.log(`Deleting old cache: ${name}`, '#ffa500');
              return caches.delete(name);
            })
        )
      ).then(() => {
        ServiceWorkerLogger.log('Service worker activated and claiming clients', '#00ff00');
        return self.clients.claim();
      })
    );
  }

  fetch(event) {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Strategy A: Network-first for dynamic pages
    if (req.mode === 'navigate' &&
        this.dynamicPaths.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) {
      event.respondWith(
        fetch(req).then(networkRes => {
          if (networkRes.ok) {
            ServiceWorkerLogger.log(`Network success for dynamic page: ${req.url}`, '#00ff00');
            caches.open(this.CACHE_NAME)
              .then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        }).catch(async () => {
          ServiceWorkerLogger.error(`Network fail, falling back to cache: ${req.url}`);
          const cached = await caches.match(req);
          if (cached) {
            ServiceWorkerLogger.log(`Serving from cache: ${req.url}`, '#ffa500');
          } else {
            ServiceWorkerLogger.error(`No cache found, serving offline page for: ${req.url}`);
          }
          return cached || caches.match('/offline.html');
        })
      );
      return;
    }

    // Strategy B: Cache-first for logo images (using SAGUTID_CONFIG)
    if (typeof self.SAGUTID_CONFIG?.joomlaLogoPath === 'string') {
      const prefix = new URL(self.SAGUTID_CONFIG.joomlaLogoPath, self.location.origin).pathname;
      if (url.pathname.startsWith(prefix)) {
        event.respondWith(
          caches.match(req).then(cached => {
            if (cached) {
              ServiceWorkerLogger.log(`Serving logo from cache: ${req.url}`, '#48dbfb');
            } else {
              ServiceWorkerLogger.log(`Fetching logo from network: ${req.url}`, '#ffa500');
            }
            return cached || fetch(req).then(networkRes => {
              if (networkRes.ok) {
                caches.open(this.CACHE_NAME)
                  .then(cache => cache.put(req, networkRes.clone()));
              }
              return networkRes;
            }).catch(() => null);
          })
        );
        return;
      }
    }

    // Strategy C: Cache-first for other static assets
    if (/\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/.test(url.pathname) ||
        this.STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(
        caches.match(req).then(cached => {
          if (cached) {
            ServiceWorkerLogger.log(`Serving static asset from cache: ${req.url}`, '#48dbfb');
          } else {
            ServiceWorkerLogger.log(`Fetching static asset from network: ${req.url}`, '#ffa500');
          }
          return cached || fetch(req).then(networkRes => {
            if (networkRes.ok) {
              caches.open(this.CACHE_NAME)
                .then(cache => cache.put(req, networkRes.clone()));
            }
            return networkRes;
          }).catch(() => null);
        })
      );
      return;
    }

    // Fallback for navigation requests (offline)
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(async () => {
          ServiceWorkerLogger.error(`Navigation request failed: ${req.url}`);
          const cached = await caches.match(req);
          return cached || caches.match('/offline.html');
        })
      );
      return;
    }
  }

  async message(event) {
    // Skip waiting on demand
    if (event.data === 'SKIP_WAITING') {
      ServiceWorkerLogger.log('Skip waiting message received', '#ffa500');
      return self.skipWaiting();
    }

    // Initialize config from page
    if (event.data?.type === 'INIT_CONFIG') {
      self.SAGUTID_CONFIG = event.data.config;
      ServiceWorkerLogger.log('SW config initialized', '#00ff00', 'ServiceWorker', event.data.config);
      return;
    }

    // Update dynamic content on demand
    if (event.data?.type === 'UPDATE_DYNAMIC_CONTENT') {
      ServiceWorkerLogger.log('Dynamic content update requested', '#ffa500');
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml = await sitemapRes.text();
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        ServiceWorkerLogger.log(`Updating ${urls.length} URLs from sitemap`, '#ffa500');
        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
              ServiceWorkerLogger.log(`Updated cache for: ${url}`, '#00ff00');
            }
          } catch (err) {
            ServiceWorkerLogger.error(`Failed dynamic update cache ${url}: ${err.message}`);
          }
        }

        ServiceWorkerLogger.log('Dynamic content update completed successfully', '#00ff00');
        event.ports[0]?.postMessage({ success: true });
      } catch (err) {
        ServiceWorkerLogger.error(`UPDATE_DYNAMIC_CONTENT failed: ${err.message}`);
        event.ports[0]?.postMessage({ success: false });
      }
    }

    // Set debug mode
    if (event.data?.type === 'SET_DEBUG_MODE') {
      ServiceWorkerLogger.log(`Debug mode set to: ${event.data.debugMode}`, '#00ff00');
      // Update local debug mode state
      Logger.debugMode = event.data.debugMode;
      return;
    }
  }
}

const sagutidSW = new SagutidServiceWorker();

// --- Service Worker: Robust Cache Management and Offline Support ---

// Message event: Allow page to trigger cache update or skip waiting
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'UPDATE_DYNAMIC_CONTENT') {
    // Optionally, update dynamic content here (already present in your message handler)
    // ... (existing dynamic content update code) ...
  }
});

// On install: Call skipWaiting for immediate activation
self.addEventListener('install', event => {
  ServiceWorkerLogger.log('Install event triggered', '#00ff00');
  sagutidSW.install(event);
});

self.addEventListener('activate', e => sagutidSW.activate(e));
self.addEventListener('fetch',    e => sagutidSW.fetch(e));
self.addEventListener('message',  e => sagutidSW.message(e));

// In main thread
navigator.serviceWorker.ready.then(registration => {
  registration.active.postMessage({
    type: 'SET_DEBUG_MODE',
    debugMode: Logger.debugMode
  });
});



































