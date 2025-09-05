import { Logger, LogType } from './Util/Logger';

export class PWAShareHandler {
    static init() {
        this.setupShareLinks();
    }

    static setupShareLinks() {
        const shareLinks = document.querySelectorAll('[aria-label="pwa-share"]');
        if (!shareLinks.length) {
            Logger.log('No share links found on the page.', 'PWAShareHandler', LogType.WARN);
            return;
        }

        shareLinks.forEach((shareLink: Element) => {
            shareLink.classList.add('pwa-share');
            shareLink.setAttribute('aria-label', 'Share Sagutid.nl');
            shareLink.addEventListener('click', (event: Event) => this.handleShareClick(event, shareLink as HTMLAnchorElement));
        });

    Logger.log('Share links initialized.', 'PWAShareHandler', LogType.INFO);
    }

    static handleShareClick(event: Event, shareLink: HTMLAnchorElement) {
        event.preventDefault();

        // Early Web Share API check
        if (!navigator.share) {
            Logger.error('Web Share API is not supported in this browser.', 'PWAShareHandler');
            return;
        }

        const href = shareLink.getAttribute('href') || '';
        if (!href || !href.includes('?')) {
            Logger.error('Invalid or missing href attribute on share link.', 'PWAShareHandler');
            return;
        }

        const params = new URLSearchParams(href.substring(href.indexOf('?') + 1));
        const url = decodeURIComponent(params.get('url') || '').trim();

        if (!url) {
            Logger.error('No URL found in share parameters.', 'PWAShareHandler');
            return;
        }

        const text = decodeURIComponent(params.get('text') || '')
            .trim()
            .replace(/<[^>]*>/g, '')  // Strip HTML tags
            .replace(/&[^;]+;/g, ' ') // Strip HTML entities
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();

        if (!text) {
            Logger.log('No text provided for sharing, using default.', undefined, 'PWAShareHandler', LogType.WARN);
        }

        const shareData = {
            title: document.title,
            text: text || 'Check this out!',
            url: url
        };

        navigator.share(shareData)
            .then(() => Logger.log('Content shared successfully.', undefined, 'PWAShareHandler', LogType.INFO))
            .catch(error => {
                Logger.error(`Share failed: ${error.message || error}`, 'PWAShareHandler');
                // Fallback: copy URL to clipboard
                navigator.clipboard?.writeText(url)
                    .then(() => Logger.log('URL copied to clipboard as fallback.', undefined, 'PWAShareHandler', LogType.WARN))
                    .catch(() => Logger.error('Fallback clipboard copy also failed.', 'PWAShareHandler'));
            });
    }
}
