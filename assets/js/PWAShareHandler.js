export class PWAShareHandler {
    static log(message, color = '#5f27cd', ...args) {
        if (debugMode) {
            console.log(`%c[PWAShareHandler] 📤 ${message}`, `color: ${color};`, ...args);
        }
    }

    static init() {
        PWAShareHandler.setupShareLinks();
    }

    static setupShareLinks() {
        $('[aria-label="pwa-share"]').each(function () {
            var $shareLink = $(this);
            $shareLink.addClass('pwa-share');
            $shareLink.attr('aria-label', 'Share Sagutid.nl');
            $shareLink.on('click', function (event) {
                event.preventDefault();
                var href = $(this).attr('href');
                var params = new URLSearchParams(href.substring(href.indexOf('?') + 1));
                var url = decodeURIComponent(params.get('url'));
                var text = decodeURIComponent(params.get('text'));
                var data = {
                    title: document.title,
                    text: text,
                    url: url
                };
                navigator.share(data)
                    .then(function () { PWAShareHandler.log('Successful share', 'green'); })
                    .catch(function (error) { PWAShareHandler.log('Error sharing: ' + error, 'red'); });
            });
        });
    }
}