class SagutidServiceWorker {
    constructor() {
        this.CACHE_NAME = 'sagutid-v14.0.0';
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
                    console.warn('?? Fout bij ophalen of verwerken sitemap of paginaÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s:', err);
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

        const url = new URL(event.request.url);
        const request = event.request;
        // Define the paths that expect dynamic content
        const dynamicPaths = ['/', '/verhalen', '/gedichten', '/overig']; // Add trailing slashes if your URLs use them

        // --- Strategy 1: Network First for Dynamic HTML Pages ---
        // Check if it's a navigation request for one of the dynamic paths
        const isDynamicPath = dynamicPaths.some(path => {
            // Match exact path or paths starting with it (e.g., /verhalen/some-story)
            return url.pathname === path || url.pathname.startsWith(path + '/');
        });

        if (request.mode === 'navigate' && isDynamicPath) {
            event.respondWith(
                fetch(request)
                    .then(networkResponse => {
                        // If fetch is successful, cache the response and return it
                        if (networkResponse.ok) {
                            const responseToCache = networkResponse.clone();
                            caches.open(this.CACHE_NAME).then(cache => {
                                cache.put(request, responseToCache);
                                console.log(`?? Cached dynamic page (Network First): ${request.url}`);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(async () => {
                        // If network fails, try to get from cache
                        console.warn(`?? Network failed for dynamic page: ${request.url}. Trying cache...`);
                        const cachedResponse = await caches.match(request);
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If not in cache either, return offline page
                        console.warn(`?? Not found in cache either: ${request.url}. Serving offline page.`);
                        // Ensure '/offline.html' is pre-cached during install
                        return caches.match('/offline.html');
                    })
            );
            return; // Request handled
        }

        // --- Strategy 2: Cache First for Logo Images ---
        // Use the CONFIG object passed from the main thread
        const logoPathPrefix = SAGUTID_CONFIG && SAGUTID_CONFIG.joomlaLogoPath ? new URL(SAGUTID_CONFIG.joomlaLogoPath, self.location.origin).pathname : '/images/Logo/';
        if (url.pathname.startsWith(logoPathPrefix)) {
             event.respondWith(
                caches.match(request)
                    .then(cachedResponse => {
                        // Return cached response if found
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Otherwise, fetch from network
                        return fetch(request).then(networkResponse => {
                            // If fetch is successful, cache the response and return it
                            if (networkResponse.ok) {
                                const responseToCache = networkResponse.clone();
                                caches.open(this.CACHE_NAME).then(cache => {
                                    cache.put(request, responseToCache);
                                    console.log(`?? Cached logo image (Cache First): ${request.url}`);
                                });
                            }
                            return networkResponse;
                        }).catch(() => {
                             console.warn(`?? Failed to fetch logo image: ${request.url}`);
                             // Optionally return a placeholder image from cache here
                             return null; // Or return a placeholder response
                        });
                    })
            );
            return; // Request handled
        }

        // --- Strategy 3: Cache First for Other Static Assets ---
        // You might refine this check based on file extensions or if they are in STATIC_ASSETS
        const isStaticAssetRequest = /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(url.pathname) || this.STATIC_ASSETS.includes(url.pathname);
        if (isStaticAssetRequest) {
             event.respondWith(
                caches.match(request)
                    .then(cachedResponse => {
                        // Return cached response if found
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Otherwise, fetch from network
                        return fetch(request).then(networkResponse => {
                            // If fetch is successful, cache the response and return it
                            if (networkResponse.ok) {
                                const responseToCache = networkResponse.clone();
                                caches.open(this.CACHE_NAME).then(cache => {
                                    cache.put(request, responseToCache);
                                    console.log(`?? Cached static asset (Cache First): ${request.url}`);
                                });
                            }
                            return networkResponse;
                        }).catch(() => {
                             console.warn(`?? Failed to fetch static asset: ${request.url}`);
                             // Optionally return a fallback response or null
                             return null;
                        });
                    })
            );
            return; // Request handled
        }

        // --- Fallback Strategy (Optional - e.g., Cache falling back to Network) ---
        // For any other GET request not handled above
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request).catch(() => {
                    // Only return offline page for navigation requests if network fails
                    if (request.mode === 'navigate') {
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


















