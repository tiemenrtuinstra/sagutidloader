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

        shareLinks.forEach((shareLink) => {
            shareLink.classList.add('pwa-share');
            shareLink.setAttribute('aria-label', 'Share Sagutid.nl');
            shareLink.addEventListener('click', (event) => this.handleShareClick(event, shareLink));
        });

        Logger.log('Share links initialized.', 'green', 'PWAShareHandler');
    }

    static handleShareClick(event, shareLink) {
        event.preventDefault();

        const href = shareLink.getAttribute('href');
        if (!href) {
            Logger.error('No href attribute found on share link.', 'PWAShareHandler');
            return;
        }

        const params = new URLSearchParams(href.substring(href.indexOf('?') + 1));
        const url = decodeURIComponent(params.get('url') || '');
        const text = decodeURIComponent(params.get('text') || '');

        if (!url) {
            Logger.error('No URL found in share parameters.', 'PWAShareHandler');
            return;
        }

        const data = {
            title: document.title,
            text: text || 'Check this out!',
            url: url,
        };

        navigator.share(data)
            .then(() => Logger.log('Successful share.', 'green', 'PWAShareHandler'))
            .catch((error) => Logger.error(`Error sharing: ${error}`, 'PWAShareHandler'));
    }
}