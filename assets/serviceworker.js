const CACHE_NAME = `sagutid-v18.2.0`;

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
    // ServiceWorkerLogger..log('Installing Sagutid SW…', '#00ff00');
    self.skipWaiting();

    event.waitUntil((async () => {
      const cache = await caches.open(this.CACHE_NAME);

      // 1) Preload critical assets
      for (const asset of this.CRITICAL_ASSETS) {
        const cached = await cache.match(asset);
        if (cached) {
          continue;
        }
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
          }
        } catch (err) {
          throw new Error(`Failed to cache critical asset ${asset}: ${err.message}`);
        }
      }

      // 2) Cache static assets
      for (const asset of this.STATIC_ASSETS) {
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
          }
        } catch (err) {
          throw new Error(`Failed to cache static asset ${asset}: ${err.message}`);
        }
      }

      // 3) Fetch & cache sitemap URLs
      try {
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml = await sitemapRes.text();
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          } catch (err) {
            throw new Error(`Failed to cache sitemap URL ${url}: ${err.message}`);
          }
        }
      } catch (err) {
        throw new Error(`Error fetching or parsing sitemap: ${err.message}`);
      }
    })());
  }

  async activate(event) {
    const currentCaches = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.filter(name => !currentCaches.includes(name))
            .map(name => {
              return caches.delete(name);
            })
        )
      ).then(() => {
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
            caches.open(this.CACHE_NAME)
              .then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        }).catch(async () => {
          const cached = await caches.match(req);
        
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
      return self.skipWaiting();
    }

    // Initialize config from page
    if (event.data?.type === 'INIT_CONFIG') {
      self.SAGUTID_CONFIG = event.data.config;
      return;
    }

    // Update dynamic content on demand
    if (event.data?.type === 'UPDATE_DYNAMIC_CONTENT') {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml = await sitemapRes.text();
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          } catch (err) {
            throw new Error(`Failed to update ${url}: ${err.message}`);
          }
        }
        event.ports[0]?.postMessage({ success: true });
      } catch (err) {
        console.error(`UPDATE_DYNAMIC_CONTENT failed: ${err.message}`);
        event.ports[0]?.postMessage({ success: false });
      }
    }
  }
}

const sagutidSW = new SagutidServiceWorker();

// Event listeners - only one set needed
self.addEventListener('install', event => {
  sagutidSW.install(event);
});

self.addEventListener('activate', e => sagutidSW.activate(e));
self.addEventListener('fetch', e => sagutidSW.fetch(e));
self.addEventListener('message', e => sagutidSW.message(e));






































