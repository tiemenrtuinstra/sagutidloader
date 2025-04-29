
const CACHE_NAME = 'sagutid-v14.1.0';
const pluginPath = '/plugins/system/sagutidloader/';
self.addEventListener('install', event => {
  self.skipWaiting(); // immediately move to activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // pre‑cache your assets...
        return cache.addAll([
          '/index.php',
          pluginPath + 'assets/offline.html',
          pluginPath + 'assets/dist/main.bundle.js',
          pluginPath + 'assets/dist/styles.bundle.css',
          pluginPath + 'assets/manifest.webmanifest'
        ]);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)  // delete old versions
          .map(old => caches.delete(old))
      ))
      .then(() => self.clients.claim())      // take control of all pages
  );
});

// handle the message from the page to skipWaiting early
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ... your fetch handlers here ...



























