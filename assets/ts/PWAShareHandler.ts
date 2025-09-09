import Logger from './Util/Logger';

const PWAShareHandler = {
    clickHandler: null as ((e: Event) => void) | null,
    canShare: typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function',

    init() {
        this.addShareClassToLinks();
        this.registerClickHandler();
    },

    destroy() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    },

    addShareClassToLinks() {
        try {
            const shareLinks = document.querySelectorAll('[aria-label="pwa-share"]');
            if (!shareLinks.length) {
                Logger.Warn('No share links found on the page.', 'PWAShareHandler');
                return;
            }
            shareLinks.forEach((el) => el.classList.add('pwa-share'));
            Logger.Info('Share links initialized (class added).', 'PWAShareHandler');
        } catch (e) {
            Logger.Error('Failed to initialize share links.', 'PWAShareHandler', e);
        }
    },

    registerClickHandler() {
        if (this.clickHandler) return;
        this.clickHandler = (ev: Event) => {
            const e = ev as MouseEvent & { target: Element };
            try {
                if (!e.target) return;
                const anchor = (e.target as Element).closest('[aria-label="pwa-share"]') as HTMLAnchorElement | null;
                if (!anchor) return;
                ev.preventDefault();
                (this as any).handleShareClick(anchor);
            } catch (err) {
                Logger.Error('Error handling share click', 'PWAShareHandler', err);
            }
        };
        document.addEventListener('click', this.clickHandler);
    },

    async handleShareClick(shareLink: HTMLAnchorElement) {
        if (!this.canShare) {
            Logger.Warn('Web Share API is not supported in this browser.', 'PWAShareHandler');
            const href = shareLink.getAttribute('href') || '';
            await (this as any).fallbackCopyFromHref(href);
            return;
        }

        const href = shareLink.getAttribute('href') || '';
        let url = '';
        let text = '';
        try {
            const parsed = new URL(href, location.href);
            const params = parsed.searchParams;
            url = (params.get('url') || '').trim();
            text = (params.get('text') || '').trim();
        } catch (e) {
            const idx = href.indexOf('?');
            if (idx >= 0) {
                const params = new URLSearchParams(href.substring(idx + 1));
                url = (params.get('url') || '').trim();
                text = (params.get('text') || '').trim();
            }
        }

        if (!url) {
            Logger.Error('No URL found in share link.', 'PWAShareHandler');
            await (this as any).fallbackCopyFromHref(href);
            return;
        }

        text = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();

        const shareData: any = { title: document.title, text: text || 'Check this out!', url };
        try {
            await (navigator as any).share(shareData);
            Logger.Info('Content shared successfully.', 'PWAShareHandler');
        } catch (err: any) {
            Logger.Error(`Share failed: ${err?.message || err}`, 'PWAShareHandler');
            await (this as any).fallbackCopyFromHref(url);
        }
    },

    async fallbackCopyFromHref(maybeUrl: string) {
        const toCopy = maybeUrl || window.location.href;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(toCopy);
                Logger.Warn('URL copied to clipboard as fallback.', 'PWAShareHandler');
                return;
            } catch (err) {
                Logger.Error('Fallback clipboard copy failed.', 'PWAShareHandler', err);
            }
        } else {
            Logger.Error('Clipboard API unavailable for fallback copy.', 'PWAShareHandler');
        }
    }
};

export default PWAShareHandler;
