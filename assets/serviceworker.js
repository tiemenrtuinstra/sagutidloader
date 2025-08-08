const CACHE_NAME = `sagutid-v18.10.0`;

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
      '/',
      '/index.php',
      '/templates/yootheme/css/theme.css',
      '/templates/yootheme/js/app.js',
      '/images/Logo/android-chrome-192x192.png',
      '/images/Logo/android-chrome-512x512.png'
    ];
    
    this.dynamicPaths = ['/', '/verhalen', '/gedichten', '/overig'];
    
    // Only critical assets that definitely exist
    this.CRITICAL_ASSETS = [
      '/index.php',
      '/templates/yootheme/css/theme.css'
    ];
  }

  async install(event) {
    console.log('SW: Installing...');
    self.skipWaiting();

    event.waitUntil((async () => {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        console.log('SW: Cache opened successfully');

        // Cache critical assets first
        let successCount = 0;
        let failCount = 0;

        for (const asset of this.CRITICAL_ASSETS) {
          try {
            const response = await fetchWithTimeout(asset);
            if (response.ok) {
              await cache.put(asset, response.clone());
              successCount++;
              console.log(`SW: Cached critical asset: ${asset}`);
            } else {
              failCount++;
              console.warn(`SW: Failed to cache ${asset}: ${response.status}`);
            }
          } catch (err) {
            failCount++;
            console.warn(`SW: Error caching ${asset}:`, err.message);
          }
        }

        // Cache static assets (non-critical)
        for (const asset of this.STATIC_ASSETS) {
          try {
            const response = await fetchWithTimeout(asset);
            if (response.ok) {
              await cache.put(asset, response.clone());
              successCount++;
              console.log(`SW: Cached static asset: ${asset}`);
            } else {
              failCount++;
              console.warn(`SW: Failed to cache ${asset}: ${response.status}`);
            }
          } catch (err) {
            failCount++;
            console.warn(`SW: Error caching ${asset}:`, err.message);
          }
        }

        console.log(`SW: Installation complete. Success: ${successCount}, Failed: ${failCount}`);

      } catch (err) {
        console.error('SW: Installation failed:', err);
        // Don't throw - allow SW to install even with cache failures
      }
    })());
  }

  async activate(event) {
    console.log('SW: Activating...');
    
    event.waitUntil((async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== this.CACHE_NAME);
        
        await Promise.all(
          oldCaches.map(name => {
            console.log(`SW: Deleting old cache: ${name}`);
            return caches.delete(name);
          })
        );

        // Take control of all clients
        await self.clients.claim();
        console.log('SW: Activated and claimed clients');
        
      } catch (err) {
        console.error('SW: Activation failed:', err);
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
                .catch(err => console.warn('SW: Failed to cache navigation response:', err));
            }
            return response;
          })
          .catch(async () => {
            // Fallback to cache, then offline page
            const cached = await caches.match(req);
            if (cached) {
              console.log(`SW: Serving cached navigation: ${req.url}`);
              return cached;
            }
            
            // Try to serve offline page
            const offlinePage = await caches.match('/offline.html') || 
                               await caches.match('/index.php');
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
                    .catch(err => console.warn('SW: Failed to cache static asset:', err));
                }
                return response;
              })
              .catch(() => {
                console.warn(`SW: Failed to fetch static asset: ${req.url}`);
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
      console.log('SW: Skip waiting requested');
      return self.skipWaiting();
    }

    if (data?.type === 'INIT_CONFIG') {
      self.SAGUTID_CONFIG = data.config;
      console.log('SW: Config initialized');
      return;
    }

    if (data?.type === 'UPDATE_DYNAMIC_CONTENT') {
      console.log('SW: Dynamic content update requested');
      
      try {
        const cache = await caches.open(this.CACHE_NAME);
        
        // Try to update sitemap-based content
        const sitemapRes = await fetchWithTimeout('/index.php?option=com_jmap&view=sitemap&format=xml');
        
        if (sitemapRes.ok) {
          const xml = await sitemapRes.text();
          const doc = new DOMParser().parseFromString(xml, 'application/xml');
          const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);
          
          let updateCount = 0;
          for (const url of urls.slice(0, 50)) { // Limit to first 50 URLs
            try {
              const res = await fetchWithTimeout(url);
              if (res.ok) {
                await cache.put(url, res.clone());
                updateCount++;
              }
            } catch (err) {
              console.warn(`SW: Failed to update ${url}:`, err.message);
            }
          }
          
          console.log(`SW: Updated ${updateCount} URLs`);
          event.ports[0]?.postMessage({ success: true, count: updateCount });
        } else {
          throw new Error(`Sitemap request failed: ${sitemapRes.status}`);
        }
        
      } catch (err) {
        console.error('SW: Update failed:', err);
        event.ports[0]?.postMessage({ success: false, error: err.message });
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




