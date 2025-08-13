import { Logger } from './Util/Logger.js';

export class PWAShareHandler {
    static init() {
        this.setupShareLinks();
    }

    static setupShareLinks() {
        const shareLinks = document.querySelectorAll('[aria-label="pwa-share"]');
        if (!shareLinks.length) {
            Logger.log('No share links found on the page.', 'orange', 'PWAShareHandler');
            return;
        }

        shareLinks.forEach(shareLink => {
            shareLink.classList.add('pwa-share');
            shareLink.setAttribute('aria-label', 'Share Sagutid.nl');
            shareLink.addEventListener('click', event => this.handleShareClick(event, shareLink));
        });

        Logger.log('Share links initialized.', 'green', 'PWAShareHandler');
    }

    static handleShareClick(event, shareLink) {
        event.preventDefault();

        // Early Web Share API check
        if (!navigator.share) {
            Logger.error('Web Share API is not supported in this browser.', 'PWAShareHandler');
            return;
        }

        const href = shareLink.getAttribute('href');
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
            Logger.log('No text provided for sharing, using default.', 'orange', 'PWAShareHandler');
        }

        const shareData = {
            title: document.title,
            text: text || 'Check this out!',
            url: url
        };

        navigator.share(shareData)
            .then(() => Logger.log('Content shared successfully.', 'green', 'PWAShareHandler'))
            .catch(error => {
                Logger.error(`Share failed: ${error.message || error}`, 'PWAShareHandler');
                // Fallback: copy URL to clipboard
                navigator.clipboard?.writeText(url)
                    .then(() => Logger.log('URL copied to clipboard as fallback.', 'orange', 'PWAShareHandler'))
                    .catch(() => Logger.error('Fallback clipboard copy also failed.', 'PWAShareHandler'));
            });
    }
}