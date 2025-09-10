import Logger from './Util/Logger';

// Ensure TypeScript treats `self` as the ServiceWorker global scope
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const CACHE_NAME = `sagutid-v31.2.1`;
const BASE_ORIGIN = (typeof self !== 'undefined' && 'location' in self) ? new URL(self.location.href).origin : location.origin;
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

    // Helper: generate a synthetic metadata key URL for a cached resource
    private metaKeyFor(url: string) {
        try {
            // append a query param that will never be requested from the network
            return url + (url.includes('?') ? '&' : '?') + 'sagutid_meta=1';
        } catch (e) {
            return url + '?sagutid_meta=1';
        }
    }

    // Helper: determine whether a cached response is still considered fresh
    private async isCachedFresh(cache: Cache, url: string): Promise<boolean> {
        try {
            const cached = await cache.match(url);
            if (!cached) return false;

            // Try meta entry first
            const metaKey = this.metaKeyFor(url);
            const metaResp = await cache.match(metaKey);
            if (metaResp) {
                try {
                    const meta = await metaResp.json();
                    if (meta && typeof meta.ts === 'number' && typeof meta.ttl === 'number') {
                        return (Date.now() - meta.ts) < (meta.ttl * 1000);
                    }
                } catch (e) {
                    // ignore and fallback
                }
            }

            // Fallback: respect response cache headers if present
            const cc = cached.headers.get('cache-control') || '';
            const m = /max-age=(\d+)/i.exec(cc);
            if (m) {
                const maxAge = parseInt(m[1], 10) || 0;
                // Use Date header if available else assume cached now
                const dateHeader = cached.headers.get('date');
                const baseTs = dateHeader ? Date.parse(dateHeader) : Date.now();
                return (Date.now() - baseTs) < (maxAge * 1000);
            }

            const expires = cached.headers.get('expires');
            if (expires) {
                const expTs = Date.parse(expires);
                if (!isNaN(expTs)) return Date.now() < expTs;
            }

            // No metadata or headers -> treat as stale so it will be refreshed
            return false;
        } catch (e) {
            return false;
        }
    }

    // Helper: store metadata about cached resource (timestamp + ttl seconds)
    private async storeCacheMeta(cache: Cache, url: string, resp: Response) {
        try {
            let ttl = 0;
            const cc = resp.headers.get('cache-control') || '';
            const m = /max-age=(\d+)/i.exec(cc);
            if (m) ttl = parseInt(m[1], 10) || 0;
            if (!ttl) {
                const expires = resp.headers.get('expires');
                if (expires) {
                    const expTs = Date.parse(expires);
                    if (!isNaN(expTs)) ttl = Math.max(0, Math.floor((expTs - Date.now()) / 1000));
                }
            }
            // Default TTL if none provided: 7 days
            if (!ttl || ttl <= 0) ttl = 7 * 24 * 3600;

            const meta = { ts: Date.now(), ttl };
            const metaKey = this.metaKeyFor(url);
            await cache.put(metaKey, new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
        } catch (e) {
            // ignore failures
        }
    }

    // Check manifest for changes. Returns object { changed, etag?, hash?, error? }
    async checkManifestChange(manifestHref = '/plugins/system/sagutidloader/assets/manifest.webmanifest') {
        try {
            const cache = await caches.open(this.CACHE_NAME);
            // Fetch manifest fresh
            const res = await fetchWithTimeout(manifestHref, {}, 8000);
            if (!res.ok) return { changed: false, error: `fetch failed ${res.status}` };

            const etag = res.headers.get('ETag') || res.headers.get('etag') || null;
            const text = await res.text();

            // compute sha256
            let hash = null;
            try {
                const buf = new TextEncoder().encode(text);
                const digest = await crypto.subtle.digest('SHA-256', buf);
                hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                // ignore hashing errors
            }

            const metaKey = this.metaKeyFor(manifestHref + '#manifest');
            const metaResp = await cache.match(metaKey);
            let old: any = null;
            if (metaResp) {
                try { old = await metaResp.json(); } catch (e) { old = null; }
            }

            const changed = !(old && ((etag && old.etag === etag) || (old.hash && hash && old.hash === hash)));
            if (changed) {
                Logger.Info('SW: Manifest change detected: ' + manifestHref, 'ServiceWorker');
                // update cached manifest and meta
                await cache.put(manifestHref, new Response(text, { headers: { 'Content-Type': 'application/manifest+json' } }));
                await cache.put(metaKey, new Response(JSON.stringify({ etag, hash, ts: Date.now() }), { headers: { 'Content-Type': 'application/json' } }));

                // notify clients
                const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
                for (const c of clientsList) {
                    try { c.postMessage({ type: 'MANIFEST_CHANGED', href: manifestHref, etag, hash }); } catch (e) { /* ignore */ }
                }
            } else {
                Logger.Info('SW: Manifest not changed: ' + manifestHref, 'ServiceWorker');
            }

            return { changed, etag, hash };
        } catch (err) {
            Logger.Warn('SW: checkManifestChange failed: ' + ((err as any)?.message || err), 'ServiceWorker');
            return { changed: false, error: (err as any)?.message || String(err) };
        }
    }

    async install(event: ExtendableEvent) {
        Logger.Info('SW: Installing...', 'ServiceWorker');
        self.skipWaiting();

        event.waitUntil((async () => {
            try {
                const cache = await caches.open(this.CACHE_NAME);
                Logger.Info('SW: Cache opened successfully', 'ServiceWorker');

                // Cache critical assets first
                let successCount = 0;
                let failCount = 0;

                for (const asset of this.CRITICAL_ASSETS) {
                    try {
                        const response = await fetchWithTimeout(asset);
                        if (response.ok) {
                            await cache.put(asset, response.clone());
                            successCount++;
                            Logger.Info(`SW: Cached critical asset: ${asset}`, 'ServiceWorker');
                        } else {
                            failCount++;
                            Logger.Warn(`SW: Failed to cache ${asset}: ${response.status}`, 'ServiceWorker');
                        }
                    } catch (err) {
                        failCount++;
                        Logger.Warn(`SW: Error caching ${asset}: ${(err as any)?.message || err}`, 'ServiceWorker');
                    }
                }

                // Cache static assets (non-critical)
                for (const asset of this.STATIC_ASSETS) {
                    try {
                        const response = await fetchWithTimeout(asset);
                        if (response.ok) {
                            await cache.put(asset, response.clone());
                            successCount++;
                            Logger.Info(`SW: Cached static asset: ${asset}`, 'ServiceWorker');
                        } else {
                            failCount++;
                            Logger.Warn(`SW: Failed to cache ${asset}: ${response.status}`, 'ServiceWorker');
                        }
                    } catch (err) {
                        failCount++;
                        Logger.Warn(`SW: Error caching ${asset}: ${(err as any)?.message || err}`, 'ServiceWorker');
                    }
                }

                Logger.Info(`SW: Installation complete. Success: ${successCount}, Failed: ${failCount}`, 'ServiceWorker');

            } catch (err) {
                Logger.Error('SW: Installation failed: ' + ((err as any)?.message || err), 'ServiceWorker');
                // Don't throw - allow SW to install even with cache failures
            }
        })());
    }

    async activate(event: ExtendableEvent) {
        Logger.Info('SW: Activating...', 'ServiceWorker');

        event.waitUntil((async () => {
            try {
                // Clean up old caches
                const cacheNames = await caches.keys();
                const oldCaches = cacheNames.filter(name => name !== this.CACHE_NAME);

                await Promise.all(
                    oldCaches.map(name => {
                        Logger.Info(`SW: Deleting old cache: ${name}`, 'ServiceWorker');
                        return caches.delete(name);
                    })
                );

                // Take control of all clients
                await self.clients.claim();
                Logger.Info('SW: Activated and claimed clients', 'ServiceWorker');

                // Start background precache from sitemap asynchronously so activation isn't blocked.
                // Use optional config.sitemapPrefetchLimit (0 = no limit / all URLs). Default: 0 (all).
                try {
                    const cfg = (self as any).SAGUTID_CONFIG || {};
                    const limit = (typeof cfg.sitemapPrefetchLimit === 'number') ? Math.max(0, Math.floor(cfg.sitemapPrefetchLimit)) : 0;
                    // Schedule async precache without awaiting so activation completes promptly
                    setTimeout(() => {
                        (async () => {
                            try {
                                Logger.Info('SW: Starting background sitemap precache', 'ServiceWorker');
                                await (new SagutidServiceWorker()).precacheFromSitemap(limit);
                                Logger.Info('SW: Background sitemap precache finished', 'ServiceWorker');
                            } catch (e) {
                                Logger.Warn('SW: Background sitemap precache failed: ' + ((e as any)?.message || e), 'ServiceWorker');
                            }
                        })();
                    }, 1000);
                } catch (e) {
                    // ignore
                }

            } catch (err) {
                Logger.Error('SW: Activation failed: ' + ((err as any)?.message || err), 'ServiceWorker');
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
                            .catch(err => Logger.Warn('SW: Failed to cache navigation response: ' + ((err as any)?.message || err), 'ServiceWorker'));
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
                        Logger.Log(`SW: Serving cached navigation: ${req.url}`, 'ServiceWorker');
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
                                        .catch(err => Logger.Warn('SW: Failed to cache static asset: ' + ((err as any)?.message || err), 'ServiceWorker'));
                                }
                                return response;
                            })
                            .catch(() => {
                                Logger.Warn(`SW: Failed to fetch static asset: ${req.url}`, 'ServiceWorker');
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
            Logger.Info('SW: Skip waiting requested', 'ServiceWorker');
            return (self as any).skipWaiting();
        }

        if (data?.type === 'INIT_CONFIG') {
            (self as any).SAGUTID_CONFIG = data.config;
            try {
                (Logger as any).debugMode = !!(data.config && data.config.debugMode === true);
            } catch (e) {
                // ignore if Logger isn't writable for any reason
            }
            Logger.Info('SW: Config initialized', 'ServiceWorker');
            return;
        }

        if (data?.type === 'UPDATE_DYNAMIC_CONTENT') {
            Logger.Info('SW: Dynamic content update requested', 'ServiceWorker');

            try {
                const cache = await caches.open(this.CACHE_NAME);

                const limit = (typeof data?.limit === 'number' && data.limit >= 0) ? Math.floor(data.limit) : 0; // 0 = unlimited

                // Collect page URLs using the class helper
                const startSitemap = '/index.php?option=com_jmap&view=sitemap&format=xml';
                const urls: string[] = [];
                await this.collectUrls(startSitemap, urls, limit);

                let updateCount = 0;

                // Helper: extract image urls from HTML
                const extractImageUrls = (html: string, baseUrl: string) => {
                    const out: string[] = [];
                    const push = (u: string) => {
                        if (!u) return;
                        try { out.push(new URL(u, baseUrl).toString()); } catch (e) { /* ignore */ }
                    };

                    let m: RegExpExecArray | null;
                    const imgSrcRegex = /<img\b[^>]*?\bsrc\s*=\s*['\"]([^'\"]+)['\"]/gi;
                    while ((m = imgSrcRegex.exec(html))) push(m[1]);

                    const imgSrcsetRegex = /<img\b[^>]*?\bsrcset\s*=\s*['\"]([^'\"]+)['\"]/gi;
                    while ((m = imgSrcsetRegex.exec(html))) {
                        const parts = m[1].split(',').map(s => s.trim().split(' ')[0]);
                        parts.forEach(p => push(p));
                    }

                    const sourceSrcsetRegex = /<source\b[^>]*?\bsrcset\s*=\s*['\"]([^'\"]+)['\"]/gi;
                    while ((m = sourceSrcsetRegex.exec(html))) {
                        const parts = m[1].split(',').map(s => s.trim().split(' ')[0]);
                        parts.forEach(p => push(p));
                    }

                    const dataSrcRegex = /<(?:img|source)\b[^>]*?\bdata-src\s*=\s*['\"]([^'\"]+)['\"]/gi;
                    while ((m = dataSrcRegex.exec(html))) push(m[1]);

                    const bgRegex = /background(?:-image)?\s*:\s*url\((?:['\"])?([^'\")]+)(?:['\"])?\)/gi;
                    while ((m = bgRegex.exec(html))) push(m[1]);

                    const linkImgRegex = /<link\b[^>]*?rel\s*=\s*['\"](?:image_src|preload)['\"][^>]*?href\s*=\s*['\"]([^'\"]+)['\"]/gi;
                    while ((m = linkImgRegex.exec(html))) push(m[1]);

                    return Array.from(new Set(out));
                };

                // Helper: fetch page and cache page + discovered images
                const cachePageAndImages = async (pageUrl: string) => {
                    try {
                        const res = await fetchWithTimeout(pageUrl, {}, 10000);
                        if (!res.ok) return false;
                        await cache.put(pageUrl, res.clone());

                        const contentType = res.headers.get('content-type') || '';
                        if (!/text\//i.test(contentType)) return true;

                        const text = await res.text();
                        const imgs = extractImageUrls(text, pageUrl);

                        // 0 = unlimited images per page
                        const maxImagesPerPage = 0;
                        const toCache = (maxImagesPerPage > 0 ? imgs.slice(0, maxImagesPerPage) : imgs).filter(u => {
                            try { const uu = new URL(u); return uu.origin === BASE_ORIGIN; } catch (e) { return false; }
                        });

                        const imgConcurrency = 6;
                        let j = 0;
                        const imgWorker = async () => {
                            while (j < toCache.length) {

                // Force precache request (explicit from client when installed as PWA or user requested)
                if (data?.type === 'FORCE_PRECACHE_NOW') {
                    Logger.Info('SW: FORCE_PRECACHE_NOW requested', 'ServiceWorker');
                    const limit = (typeof data?.limit === 'number' && data.limit >= 0) ? Math.floor(data.limit) : 0;
                    try {
                        const result = await this.precacheFromSitemap(limit);
                        event.ports[0]?.postMessage({ success: true, result });
                    } catch (err) {
                        Logger.Warn('SW: FORCE_PRECACHE_NOW failed: ' + ((err as any)?.message || err), 'ServiceWorker');
                        event.ports[0]?.postMessage({ success: false, error: (err as any)?.message || String(err) });
                    }
                    return;
                }

                // Check manifest on demand
                if (data?.type === 'CHECK_MANIFEST') {
                    const href = (data && data.href) ? String(data.href) : '/manifest.webmanifest';
                    try {
                        const r = await this.checkManifestChange(href);
                        event.ports[0]?.postMessage(r);
                    } catch (err) {
                        event.ports[0]?.postMessage({ changed: false, error: (err as any)?.message || String(err) });
                    }
                    return;
                }
                                const idx = j++;
                                const imgUrl = toCache[idx];
                                try {
                                    // Skip if cached and still fresh
                                    if (await this.isCachedFresh(cache, imgUrl)) continue;

                                    const r = await fetchWithTimeout(imgUrl, {}, 8000);
                                    if (r.ok) {
                                        await cache.put(imgUrl, r.clone());
                                        // store metadata for freshness checks
                                        await this.storeCacheMeta(cache, imgUrl, r);
                                    }
                                } catch (e) { /* ignore */ }
                            }
                        };
                        const workers = [];
                        for (let w = 0; w < imgConcurrency; w++) workers.push(imgWorker());
                        await Promise.all(workers);
                        return true;
                    } catch (err) { return false; }
                };

                for (const url of urls) {
                    try {
                        const ok = await cachePageAndImages(url);
                        if (ok) updateCount++;
                    } catch (err) {
                        Logger.Log(`SW: Failed to update ${url}: ${(err as any)?.message || err}`, 'ServiceWorker');
                    }
                }

                Logger.Log(`SW: Updated ${updateCount} URLs (limit ${limit})`, 'ServiceWorker');
                event.ports[0]?.postMessage({ success: true, count: updateCount });
            } catch (err) {
                Logger.Error('SW: Update failed: ' + ((err as any)?.message || err), 'ServiceWorker');
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
            if (limit > 0 && out.length >= limit) return;

            // 2) sitemapindex -> recurse into <sitemap><loc>
            const sitemapRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
            while ((limit === 0 || out.length < limit) && (match = sitemapRegex.exec(xml))) {
                const sm = match[1].trim();
                if (!sm) continue;
                await this.collectUrls(sm, out, limit);
                if (limit > 0 && out.length >= limit) break;
            }
        } catch (err) {
            Logger.Warn(`SW: collectUrls failed for ${sitemapUrl}: ${(err as any)?.message || err}`, 'ServiceWorker');
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

            // Batch fetch and cache pages + images to avoid long-running single loops; use concurrency
            const concurrency = 6;
            let i = 0;
            const results = { success: 0, failed: 0 };

            const extractImageUrls = (html: string, baseUrl: string) => {
                const out: string[] = [];
                const push = (u: string) => {
                    if (!u) return;
                    try { out.push(new URL(u, baseUrl).toString()); } catch (e) { /* ignore */ }
                };
                let m: RegExpExecArray | null;
                const imgSrcRegex = /<img\b[^>]*?\bsrc\s*=\s*['\"]([^'\"]+)['\"]/gi;
                while ((m = imgSrcRegex.exec(html))) push(m[1]);
                const imgSrcsetRegex = /<img\b[^>]*?\bsrcset\s*=\s*['\"]([^'\"]+)['\"]/gi;
                while ((m = imgSrcsetRegex.exec(html))) {
                    const parts = m[1].split(',').map(s => s.trim().split(' ')[0]);
                    parts.forEach(p => push(p));
                }
                const sourceSrcsetRegex = /<source\b[^>]*?\bsrcset\s*=\s*['\"]([^'\"]+)['\"]/gi;
                while ((m = sourceSrcsetRegex.exec(html))) {
                    const parts = m[1].split(',').map(s => s.trim().split(' ')[0]);
                    parts.forEach(p => push(p));
                }
                const dataSrcRegex = /<(?:img|source)\b[^>]*?\bdata-src\s*=\s*['\"]([^'\"]+)['\"]/gi;
                while ((m = dataSrcRegex.exec(html))) push(m[1]);
                const bgRegex = /background(?:-image)?\s*:\s*url\((?:['\"])?([^'\")]+)(?:['\"])?\)/gi;
                while ((m = bgRegex.exec(html))) push(m[1]);
                const linkImgRegex = /<link\b[^>]*?rel\s*=\s*['\"](?:image_src|preload)['\"][^>]*?href\s*=\s*['\"]([^'\"]+)['\"]/gi;
                while ((m = linkImgRegex.exec(html))) push(m[1]);
                return Array.from(new Set(out));
            };

            const cachePageAndImages = async (pageUrl: string) => {
                try {
                    const res = await fetchWithTimeout(pageUrl, {}, 10000);
                    if (!res.ok) return false;
                    await cache.put(pageUrl, res.clone());
                    const contentType = res.headers.get('content-type') || '';
                    if (!/text\//i.test(contentType)) return true;
                    const text = await res.text();
                    const imgs = extractImageUrls(text, pageUrl);

                    // 0 = unlimited images per page
                    const maxImagesPerPage = 0;
                    const toCache = (maxImagesPerPage > 0 ? imgs.slice(0, maxImagesPerPage) : imgs).filter(u => {
                        try { const uu = new URL(u); return uu.origin === BASE_ORIGIN; } catch (e) { return false; }
                    });

                    const imgConcurrency = 6;
                    let j = 0;
                    const imgWorker = async () => {
                        while (j < toCache.length) {
                            const idx = j++;
                            const imgUrl = toCache[idx];
                            try {
                                if (await this.isCachedFresh(cache, imgUrl)) continue;
                                const r = await fetchWithTimeout(imgUrl, {}, 8000);
                                if (r.ok) {
                                    await cache.put(imgUrl, r.clone());
                                    await this.storeCacheMeta(cache, imgUrl, r);
                                }
                            } catch (e) { /* ignore */ }
                        }
                    };
                    const workers = [];
                    for (let w = 0; w < imgConcurrency; w++) workers.push(imgWorker());
                    await Promise.all(workers);
                    return true;
                } catch (err) { return false; }
            };

            const worker = async () => {
                while (i < urls.length) {
                    const idx = i++;
                    const u = urls[idx];
                    try {
                        const ok = await cachePageAndImages(u);
                        if (ok) results.success++; else results.failed++;
                    } catch (err) { results.failed++; }
                }
            };

            const workers: Promise<any>[] = [];
            for (let w = 0; w < concurrency; w++) workers.push(worker());
            await Promise.all(workers);
            Logger.Info(`SW: precacheFromSitemap done. Success: ${results.success}, Failed: ${results.failed}`, 'ServiceWorker');
            return { success: results.success, failed: results.failed };
        } catch (err) {
            Logger.Warn('SW: precacheFromSitemap failed: ' + ((err as any)?.message || err), 'ServiceWorker');
            return { success: 0, failed: 0, error: ((err as any)?.message || String(err)) };
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
















