const VERSION    = 'v14.3.2';
const CACHE_NAME = `sagutid-${VERSION}`;

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
    console.log('⏳ Installing Sagutid SW…');
    self.skipWaiting();

    event.waitUntil((async () => {
      const cache = await caches.open(this.CACHE_NAME);

      // 1) Preload critical assets
      for (const asset of this.CRITICAL_ASSETS) {
        // Skip if asset is already cached
        const cached = await cache.match(asset);
        if (cached) {
          console.log(`✅ Asset already cached: ${asset}`);
          continue;
        }
        // Fetch and cache the asset
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
            console.log(`✅ Cached critical asset: ${asset}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to cache critical asset ${asset}:`, err);
        }
      }

      // 2) Cache static assets
      for (const asset of this.STATIC_ASSETS) {
        try {
          const res = await fetchWithTimeout(asset);
          if (res.ok) {
            await cache.put(asset, res.clone());
            console.log(`✅ Cached static asset: ${asset}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to cache static asset ${asset}:`, err);
        }
      }

      // 3) Fetch & cache sitemap URLs
      try {
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml       = await sitemapRes.text();
        const doc       = new DOMParser().parseFromString(xml, 'application/xml');
        const urls      = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        console.log(`🔍 Found ${urls.length} pages in sitemap.`);
        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
              console.log(`✅ Cached sitemap URL: ${url}`);
            }
          } catch (err) {
            console.warn(`⚠️ Failed to cache sitemap URL ${url}:`, err);
          }
        }
      } catch (err) {
        console.warn('⚠️ Error fetching or parsing sitemap:', err);
      }
    })());
  }

  async activate(event) {
    console.log('🚀 Activating Sagutid SW…');
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(
          keys.filter(key => key !== this.CACHE_NAME)
            .map(old => caches.delete(old))
        ))
        .then(() => self.clients.claim())
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
          console.warn(`🌐 Network fail, falling back to cache: ${req.url}`);
          const cached = await caches.match(req);
          return cached || caches.match('/offline.html');
        })
      );
      return;
    }

    // Strategy B: Cache-first for logo images (using SAGUTID_CONFIG)
    if (typeof SAGUTID_CONFIG?.joomlaLogoPath === 'string') {
      const prefix = new URL(SAGUTID_CONFIG.joomlaLogoPath, self.location.origin).pathname;
      if (url.pathname.startsWith(prefix)) {
        event.respondWith(
          caches.match(req).then(cached => cached || fetch(req).then(networkRes => {
            if (networkRes.ok) {
              caches.open(this.CACHE_NAME)
                .then(cache => cache.put(req, networkRes.clone()));
            }
            return networkRes;
          }).catch(() => null))
        );
        return;
      }
    }

    // Strategy C: Cache-first for other static assets
    if (/\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/.test(url.pathname) ||
        this.STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(
        caches.match(req).then(cached => cached || fetch(req).then(networkRes => {
          if (networkRes.ok) {
            caches.open(this.CACHE_NAME)
              .then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        }).catch(() => null))
      );
      return;
    }

    // Fallback: cache-first, then network, then offline page
    event.respondWith(
      caches.match(req).then(cached => {
        return cached ||
          fetch(req).catch(() => {
            if (req.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return null;
          });
      })
    );
  }

  async message(event) {
    // Skip waiting on demand
    if (event.data === 'SKIP_WAITING') {
      return self.skipWaiting();
    }

    // Initialize config from page
    if (event.data?.type === 'INIT_CONFIG') {
      self.SAGUTID_CONFIG = event.data.config;
      console.log('ℹ️ SW config initialized:', event.data.config);
      return;
    }

    // Update dynamic content on demand
    if (event.data?.type === 'UPDATE_DYNAMIC_CONTENT') {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        const xml       = await sitemapRes.text();
        const doc       = new DOMParser().parseFromString(xml, 'application/xml');
        const urls      = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

        for (const url of urls) {
          try {
            const res = await fetchWithTimeout(url);
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          } catch (err) {
            console.warn(`⚠️ Failed dynamic update cache ${url}:`, err);
          }
        }

        event.ports[0]?.postMessage({ success: true });
      } catch (err) {
        console.error('❌ UPDATE_DYNAMIC_CONTENT failed:', err);
        event.ports[0]?.postMessage({ success: false });
      }
    }
  }
}

const sagutidSW = new SagutidServiceWorker();

self.addEventListener('install',  e => sagutidSW.install(e));
self.addEventListener('activate', e => sagutidSW.activate(e));
self.addEventListener('fetch',    e => sagutidSW.fetch(e));
self.addEventListener('message',  e => sagutidSW.message(e));




























