import { Logger } from './Util/Logger.js';

export class MetaTagHandler {
    static init() {
        this.addIcons();
        this.addMetaTags();
        this.addOpenGraphTags();
        this.addCanonicalLink();
    }

    static addLink(attributes) {
        if (typeof joomlaLogoPath === 'undefined') {
            Logger.error('Joomla logo path is not defined.', 'MetaTagHandler');
            return;
        }

        // Prepend joomlaLogoPath to relative hrefs
        if (attributes.href && !attributes.href.startsWith('http')) {
            attributes.href = joomlaLogoPath + attributes.href;
        }

        const link = document.createElement('link');
        Object.entries(attributes).forEach(([key, value]) => {
            link.setAttribute(key, value);
        });
        document.head.appendChild(link);
        Logger.log(`Link tag added: ${JSON.stringify(attributes)}`, 'green', 'MetaTagHandler');
    }

    static addMeta(attributes, attrType = 'name') {
        const meta = document.createElement('meta');
        Object.entries(attributes).forEach(([key, value]) => {
            meta.setAttribute(key, value);
        });
        document.head.appendChild(meta);
        Logger.log(`Meta tag added: ${JSON.stringify(attributes)}`, 'green', 'MetaTagHandler');
    }

    static addIcons() {
        const icons = [
            { rel: 'apple-touch-icon', href: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { rel: 'apple-touch-icon', href: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            { rel: 'apple-touch-icon', href: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            { rel: 'icon', href: 'favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { rel: 'icon', href: 'favicon-32x32.png', sizes: '32x32', type: 'image/png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)' },
        ];

        icons.forEach(icon => this.addLink(icon));
        Logger.log('Icons added to the document.', 'green', 'MetaTagHandler');
    }

    static addMetaTags() {
        const metaTags = [
            { name: 'theme-color', content: '#0B9444' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
            { name: 'screen-orientation', content: 'natural' },
            { name: 'facebook-domain-verification', content: 'yt99npcp5if48m2yx2m0kmm434ponl' },
        ];

        metaTags.forEach(tag => this.addMeta(tag));
        Logger.log('Meta tags added to the document.', 'green', 'MetaTagHandler');
    }

    static addOpenGraphTags() {
        const openGraphTags = [
            { property: 'og:title', content: document.title },
            { property: 'og:description', content: 'Welkom op Sagutid.nl, waar verhalen tot leven komen.' },
            { property: 'og:image', content: 'https://sagutid.nl/images/Logo/Sagutid-groot.jpg' },
            { property: 'og:url', content: window.location.href },
            { property: 'og:type', content: 'website' },
        ];

        openGraphTags.forEach(tag => this.addMeta(tag, 'property'));
        Logger.log('OpenGraph tags added to the document.', 'green', 'MetaTagHandler');
    }

    static addCanonicalLink() {
        this.addLink({ rel: 'canonical', href: window.location.href });
        Logger.log('Canonical link added to the document.', 'green', 'MetaTagHandler');
    }
}