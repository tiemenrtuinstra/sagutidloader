import Logger from './Util/Logger';

// Ensure TypeScript treats `self` as the ServiceWorker global scope
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const CACHE_NAME = `sagutid-v29.0.0`;
// Base path for plugin assets (derived from the SW script URL, not the scope)
const SCRIPT_PATHNAME = (typeof self !== 'undefined' && 'location' in self) ? new URL(self.location.href).pathname : '/plugins/system/sagutidloader/assets/serviceworker.js';
const ASSET_BASE = SCRIPT_PATHNAME.replace(/[^/]+$/, ''); // strip filename to get folder
const OFFLINE_URL = ASSET_BASE + 'offline.html';

// Helper: fetch with timeout and better error handling
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 8000) {
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
    CACHE_NAME: string;
    STATIC_ASSETS: string[];
    dynamicPaths: string[];
    CRITICAL_ASSETS: string[];

    constructor() {
        this.CACHE_NAME = CACHE_NAME;

        // Simplified asset lists - only cache what's guaranteed to exist
        this.STATIC_ASSETS = [
            OFFLINE_URL,
            '/templates/yootheme/css/theme.css',
            '/templates/yootheme/js/app.js',
            '/images/Logo/android-chrome-192x192.png',
            '/images/Logo/android-chrome-512x512.png',
            // Common site images used by the offline page
            '/images/Logo/Sagutid-groot-01.svg',
            '/images/Logo/Sagutid-verhalen.png',
            '/images/Logo/Sagutid-gedichten.png',
            '/images/Logo/Sagutid-wijsheden.png',
            '/images/Logo/Sagutid-overig.png'
        ];

        this.dynamicPaths = ['/', '/verhalen', '/gedichten', '/overig', 'tegeltjes-wijsheden'];

        // Only critical assets that definitely exist
        this.CRITICAL_ASSETS = [
            OFFLINE_URL,
            '/templates/yootheme/css/theme.css',
            '/plugins/system/sagutidloader/assets/dist/main.bundle.js',
            '/plugins/system/sagutidloader/assets/dist/styles.bundle.css',
            '/plugins/system/sagutidloader/offline.html',
            // Ensure the primary logo and essential images are cached at install so offline.html renders correctly
            '/images/Logo/Sagutid-groot-01.svg',
            '/images/Logo/Sagutid-verhalen.png',
            '/images/Logo/Sagutid-gedichten.png',
            '/images/Logo/Sagutid-wijsheden.png',
            '/images/Logo/Sagutid-overig.png'
        ];
    }

    async install(event: ExtendableEvent) {
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
                        Logger.warn(`SW: Error caching ${asset}: ${(err as any)?.message || err}`, 'ServiceWorker');
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
                        Logger.warn(`SW: Error caching ${asset}: ${(err as any)?.message || err}`, 'ServiceWorker');
                    }
                }

                Logger.info(`SW: Installation complete. Success: ${successCount}, Failed: ${failCount}`, 'ServiceWorker');

            } catch (err) {
                Logger.error('SW: Installation failed: ' + ((err as any)?.message || err), 'ServiceWorker');
                // Don't throw - allow SW to install even with cache failures
            }
        })());
    }

    async activate(event: ExtendableEvent) {
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

                // Start background precache from sitemap asynchronously so activation isn't blocked.
                // Use optional config.sitemapPrefetchLimit (0 = no limit / all URLs). Default: 0 (all).
                try {
                    const cfg = (self as any).SAGUTID_CONFIG || {};
                    const limit = (typeof cfg.sitemapPrefetchLimit === 'number') ? Math.max(0, Math.floor(cfg.sitemapPrefetchLimit)) : 0;
                    // Schedule async precache without awaiting so activation completes promptly
                    setTimeout(() => {
                        (async () => {
                            try {
                                Logger.info('SW: Starting background sitemap precache', 'ServiceWorker');
                                await (new SagutidServiceWorker()).precacheFromSitemap(limit);
                                Logger.info('SW: Background sitemap precache finished', 'ServiceWorker');
                            } catch (e) {
                                Logger.warn('SW: Background sitemap precache failed: ' + ((e as any)?.message || e), 'ServiceWorker');
                            }
                        })();
                    }, 1000);
                } catch (e) {
                    // ignore
                }

            } catch (err) {
                Logger.error('SW: Activation failed: ' + ((err as any)?.message || err), 'ServiceWorker');
            }
        })());
    }

    fetch(event: FetchEvent) {
        const req = event.request;

        // Only handle GET requests
        if (req.method !== 'GET') return;

        const url = new URL(req.url);

        // Skip non-HTTP(S) requests
        if (!url.protocol.startsWith('http')) return;

        // Network-first for navigation requests
        if (req.mode === 'navigate') {
            event.respondWith((async () => {
                try {
                    const response = await fetch(req);
                    // Cache successful responses (do not await to keep response fast)
                    if (response && response.ok) {
                        caches.open(this.CACHE_NAME)
                            .then(cache => cache.put(req, response.clone()))
                            .catch(err => Logger.warn('SW: Failed to cache navigation response: ' + ((err as any)?.message || err), 'ServiceWorker'));
                    }
                    return response;
                } catch (e) {
                    // Network failed — try to serve previously cached navigation entries.
                    // Try several match strategies to increase chance of a hit (Request object and URL string).
                    let cached = await caches.match(req).catch(() => null);
                    if (!cached) {
                        try { cached = await caches.match(req.url); } catch (_) { cached = null; }
                    }
                    if (cached) {
                        Logger.log(`SW: Serving cached navigation: ${req.url}`, 'ServiceWorker');
                        return cached;
                    }

                    // No cached page — serve offline fallback
                    const offlinePage = await caches.match(OFFLINE_URL);
                    return offlinePage || new Response('Offline', { status: 503 });
                }
            })());
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
                                        .catch(err => Logger.warn('SW: Failed to cache static asset: ' + ((err as any)?.message || err), 'ServiceWorker'));
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

    async message(event: ExtendableMessageEvent) {
        const { data } = event;

        if (data === 'SKIP_WAITING') {
            Logger.info('SW: Skip waiting requested', 'ServiceWorker');
            return (self as any).skipWaiting();
        }

        if (data?.type === 'INIT_CONFIG') {
            (self as any).SAGUTID_CONFIG = data.config;
            // Propagate debugMode into the Logger runtime for the service worker
            try {
                (Logger as any).debugMode = !!(data.config && data.config.debugMode === true);
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
                const collectUrls = async (sitemapUrl: string, out: string[]) => {
                    if (out.length >= limit) return;
                    const res = await fetchWithTimeout(sitemapUrl);
                    if (!res.ok) throw new Error(`Sitemap request failed: ${res.status}`);
                    const xml = await res.text();

                    // Simple, robust XML parsing without DOMParser: extract <url><loc> and <sitemap><loc>
                    // 1) Find <url> entries and their <loc>
                    const urlRegex = /<url\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/gi;
                    let match: RegExpExecArray | null;
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
                        try {
                            await collectUrls(sm, out);
                        } catch (err) {
                            Logger.warn(`SW: Error processing sitemap ${sm}: ${(err as any)?.message || err}`, 'ServiceWorker');
                        }
                        if (out.length >= limit) break;
                    }
                };

                // Start from primary sitemap
                const startSitemap = '/index.php?option=com_jmap&view=sitemap&format=xml';
                const urls: string[] = [];
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
                        Logger.log(`SW: Failed to update ${url}: ${(err as any)?.message || err}`, 'ServiceWorker');
                    }
                }
                Logger.log(`SW: Updated ${updateCount} URLs (limit ${limit})`, 'ServiceWorker');
                event.ports[0]?.postMessage({ success: true, count: updateCount });
            } catch (err) {
                Logger.error('SW: Update failed: ' + ((err as any)?.message || err), 'ServiceWorker');
                event.ports[0]?.postMessage({ success: false, error: (err as any)?.message || String(err) });
            }
        }
    }

    /**
     * Collect URLs from a sitemap (or sitemapindex) up to `limit`.
     */
    async collectUrls(sitemapUrl: string, out: string[], limit = 0) {
        if (limit > 0 && out.length >= limit) return;
        try {
            const res = await fetchWithTimeout(sitemapUrl);
            if (!res.ok) throw new Error(`Sitemap request failed: ${res.status}`);
            const xml = await res.text();

            // 1) <url><loc>
            const urlRegex = /<url\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/gi;
            let match: RegExpExecArray | null;
            while ((limit === 0 || out.length < limit) && (match = urlRegex.exec(xml))) {
                const u = match[1].trim();
                if (u) out.push(u);
            }
            if (out.length >= limit && limit > 0) return;

            // 2) sitemapindex -> recurse into <sitemap><loc>
            const sitemapRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
            while ((limit === 0 || out.length < limit) && (match = sitemapRegex.exec(xml))) {
                const sm = match[1].trim();
                if (!sm) continue;
                await this.collectUrls(sm, out, limit);
                if (limit > 0 && out.length >= limit) break;
            }
        } catch (err) {
            Logger.warn(`SW: collectUrls failed for ${sitemapUrl}: ${(err as any)?.message || err}`, 'ServiceWorker');
        }
    }

    /**
     * Precache pages discovered from sitemap(s) in background without blocking activation.
     * limit: 0 = unlimited
     */
    async precacheFromSitemap(limit = 0) {
        try {
            const cache = await caches.open(this.CACHE_NAME);
            const startSitemap = '/index.php?option=com_jmap&view=sitemap&format=xml';
            const urls: string[] = [];
            await this.collectUrls(startSitemap, urls, limit);

            // Batch fetch and cache to avoid long-running single loops; use concurrency of 6
            const concurrency = 6;
            let i = 0;
            const results = { success: 0, failed: 0 };
            const worker = async () => {
                while (i < urls.length) {
                    const idx = i++;
                    const u = urls[idx];
                    try {
                        const res = await fetchWithTimeout(u, {}, 10000);
                        if (res.ok) {
                            await cache.put(u, res.clone());
                            results.success++;
                        } else {
                            results.failed++;
                        }
                    } catch (err) {
                        results.failed++;
                    }
                }
            };

            const workers = [];
            for (let w = 0; w < concurrency; w++) workers.push(worker());
            await Promise.all(workers);
            Logger.info(`SW: precacheFromSitemap done. Success: ${results.success}, Failed: ${results.failed}`, 'ServiceWorker');
        } catch (err) {
            Logger.warn('SW: precacheFromSitemap failed: ' + ((err as any)?.message || err), 'ServiceWorker');
        }
    }
}

// Initialize service worker
const sagutidSW = new SagutidServiceWorker();

// Register event listeners
(self as any).addEventListener('install', (event: any) => sagutidSW.install(event));
(self as any).addEventListener('activate', (event: any) => sagutidSW.activate(event));
(self as any).addEventListener('fetch', (event: any) => sagutidSW.fetch(event));
(self as any).addEventListener('message', (event: any) => sagutidSW.message(event));


