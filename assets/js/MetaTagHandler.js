export class MetaTagHandler {
    static log(message, color = '#6ab04c', ...args) {
        if (debugMode) {
            console.log(`%c[MetaTagHandler] 🏷️ ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        MetaTagHandler.addManifestLink();
        MetaTagHandler.addIcons();
        MetaTagHandler.addMetaTags();
        MetaTagHandler.addOpenGraphTags();
        MetaTagHandler.addCanonicalLink();
    }

    static addLink(attributes) {
        var $link = $('<link>');
        $.each(attributes, function (key, value) {
            $link.attr(key, value);
        });
        $('head').append($link);
        MetaTagHandler.log('Link tag toegevoegd: ' + attributes, 'green');
    }

    static addMeta(attributes, attrType) {
        attrType = attrType || 'name';
        var $meta = $('<meta>');
        $meta.attr(attrType, attributes.name);
        $meta.attr('content', attributes.content);
        $('head').append($meta);
        MetaTagHandler.log('Meta tag toegevoegd: ' + attributes, 'green');
    }

    static isMobileOrTablet() {
        return $(window).width() <= 1024;
    }

    static addManifestLink() {
        MetaTagHandler.addLink({ rel: 'manifest', href: MetaTagHandler.isMobileOrTablet() ? '/manifest.webmanifest' : '/wide-manifest.webmanifest' });
    }

    static addIcons() {
        var icons = [
            { rel: 'apple-touch-icon', src: "/images/Logo/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { rel: 'apple-touch-icon', src: "/images/Logo/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
            { rel: 'apple-touch-icon', src: "/images/Logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
            { rel: 'apple-touch-icon', src: "/images/Logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { rel: 'apple-touch-icon', src: "/images/Logo/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" }
        ];

        $.each(icons, function (_, icon) {
            MetaTagHandler.addLink(icon);
            if (icon.media) {
                MetaTagHandler.addLink({ rel: 'apple-touch-startup-image', href: icon.src, media: icon.media });
            }
        });
    }

    static addMetaTags() {
        var metaTags = [
            { name: 'theme-color', content: '#0B9444' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
            { name: 'screen-orientation', content: 'natural' },
            { name: 'facebook-domain-verification', content: 'yt99npcp5if48m2yx2m0kmm434ponl' }
        ];

        $.each(metaTags, function (_, tag) {
            MetaTagHandler.addMeta(tag);
        });
    }

    static addOpenGraphTags() {
        var openGraphTags = [
            { name: 'og:title', content: document.title },
            { name: 'og:description', content: 'Welkom op Sagutid.nl, waar verhalen tot leven komen.' },
            { name: 'og:image', content: 'https://sagutid.nl/images/Logo/Sagutid-groot.jpg' },
            { name: 'og:url', content: window.location.href },
            { name: 'og:type', content: 'website' }
        ];

        $.each(openGraphTags, function (_, tag) {
            MetaTagHandler.addMeta(tag, 'property');
        });
    }

    static addCanonicalLink() {
        MetaTagHandler.addLink({ rel: 'canonical', href: window.location.href });
    }
}