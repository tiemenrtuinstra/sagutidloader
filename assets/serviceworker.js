class SagutidServiceWorker {
    constructor() {
        this.CACHE_NAME = 'sagutid-v2.1.0';
        this.STATIC_ASSETS = [
            '/',
            '/index.php',
            '/offline.html',
            '/templates/yootheme/css/theme.css',
            '/templates/yootheme/js/app.js',
            "/images/Logo/android-chrome-512x512.png",
            "/images/Logo/Sagutid-verhalen.png",
            "/images/Logo/Sagutid-gedichten.png",
            "/images/Logo/Sagutid-overig.png",
            "/images/Logo/Sagutid-groot.jpg",
            "/images/Logo/android-chrome-192x192.png",
            "/images/Logo/apple-touch-icon.png",
            "/images/Logo/favicon-16x16.png",
            "/images/Logo/favicon-32x32.png"
        ];
    }

    async install(event) {
        console.log('?? Service worker installeren...');
        self.skipWaiting();

        event.waitUntil(
            (async () => {
                const cache = await caches.open(this.CACHE_NAME);
                console.log('?? Caching static assets...');

                // Preload critical assets
                await cache.addAll(['/index.php', '/offline.html', '/templates/yootheme/css/theme.css', '/templates/yootheme/js/app.js']);

                // Cache static assets
                await Promise.all(
                    this.STATIC_ASSETS.map(async (asset) => {
                        try {
                            const response = await fetchWithTimeout(asset);
                            if (response.ok) {
                                await cache.put(asset, response);
                                console.log(`?? ${asset} is gecached`);
                            }
                        } catch (error) {
                            console.error(`Fout bij het cachen van ${asset}:`, error);
                        }
                    })
                );

                // Fetch and cache sitemap URLs
                try {
                    const sitemapUrl = 'https://sagutid.nl/index.php?option=com_jmap&view=sitemap&format=xml';
                    const res = await fetchWithTimeout(sitemapUrl);
                    const xml = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(xml, 'application/xml');
                    const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

                    console.log(`?? ${urls.length} pagina's gevonden in sitemap`);

                    await Promise.all(
                        urls.map(async (url) => {
                            try {
                                const response = await fetchWithTimeout(url);
                                if (response.ok) {
                                    await cache.put(url, response);
                                    console.log(`?? ${url} is gecached`);
                                }
                            } catch (error) {
                                console.error(`Fout bij het cachen van ${url}:`, error);
                            }
                        })
                    );
                } catch (err) {
                    console.warn('?? Fout bij ophalen of verwerken sitemap of paginaâ€™s:', err);
                }
            })()
        );
    }

    async activate(event) {
        console.log('?? Service worker activeren...');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== this.CACHE_NAME) {
                            console.log('?? Oude cache verwijderen:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(() => self.clients.claim())
        );
    }

    async fetch(event) {
        if (event.request.method !== 'GET') return;

        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response; // Return cached response if found
                    }

                    return fetch(event.request)
                        .then(fetchResponse => {
                            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                                return fetchResponse;
                            }

                            const responseToCache = fetchResponse.clone();

                            // Use CONFIG.assetPath if needed
                            if (!event.request.url.startsWith(CONFIG.assetPath)) {
                                caches.open(CONFIG.CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache);
                                    });
                            }

                            return fetchResponse;
                        })
                        .catch(() => {
                            if (event.request.mode === 'navigate') {
                                return caches.match('/offline.html');
                            }
                            return null;
                        });
                })
        );
    }

    async message(event) {
        if (event.data) {
            if (event.data.type === 'CACHE_PAGE') {
                const urlToCache = event.data.url;

                try {
                    const cache = await caches.open(this.CACHE_NAME);
                    const response = await fetch(urlToCache);

                    if (response.ok) {
                        await cache.put(urlToCache, response);
                        console.log(`?? ${urlToCache} is added to the cache.`);
                        event.ports[0].postMessage({ success: true, message: `${urlToCache} is cached.` });
                    } else {
                        console.error(`Failed to fetch ${urlToCache}: ${response.status}`);
                        event.ports[0].postMessage({ success: false, message: `Failed to fetch ${urlToCache}.` });
                    }
                } catch (error) {
                    console.error(`Error caching ${urlToCache}:`, error);
                    event.ports[0].postMessage({ success: false, message: `Error caching ${urlToCache}.` });
                }
            } else if (event.data.type === 'UPDATE_DYNAMIC_CONTENT') {
                try {
                    const cache = await caches.open(this.CACHE_NAME);
                    const sitemapUrl = '/index.php?option=com_jmap&view=sitemap&format=xml';

                    // Fetch and parse the sitemap
                    const res = await fetch(sitemapUrl);
                    const xml = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(xml, 'application/xml');
                    const urls = Array.from(doc.querySelectorAll('url > loc')).map(el => el.textContent);

                    console.log(`?? Found ${urls.length} pages in the sitemap.`);

                    // Cache all URLs from the sitemap
                    await Promise.all(
                        urls.map(async (url) => {
                            try {
                                const response = await fetch(url);
                                if (response.ok) {
                                    await cache.put(url, response);
                                    console.log(`?? ${url} is updated in the cache.`);
                                }
                            } catch (error) {
                                console.error(`Error updating cache for ${url}:`, error);
                            }
                        })
                    );

                    event.ports[0].postMessage({ success: true, message: 'Dynamic content updated successfully.' });
                } catch (error) {
                    console.error('Error updating dynamic content:', error);
                    event.ports[0].postMessage({ success: false, message: 'Error updating dynamic content.' });
                }
            }
        }
    }
}

const serviceWorker = new SagutidServiceWorker();

self.addEventListener('install', (event) => {
    serviceWorker.install(event);
});

self.addEventListener('activate', (event) => {
    serviceWorker.activate(event);
});

self.addEventListener('fetch', (event) => {
    serviceWorker.fetch(event);
});

self.addEventListener('message', async (event) => {
    serviceWorker.message(event);
});

let CONFIG = {};

self.addEventListener('message', (event) => {
    if (event.data.type === 'INIT_CONFIG') {
        CONFIG = event.data.config;
        console.log('Service Worker configuration initialized:', CONFIG);
    }
});







