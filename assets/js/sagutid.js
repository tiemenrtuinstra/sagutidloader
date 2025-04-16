import { PWAHandler } from './PWAHandler.js';
import { ServiceWorkerHandler } from './ServiceWorkerHandler.js';
import { MetaTagHandler } from './MetaTagHandler.js';
import { CCommentHandler } from './CCommentHandler.js';
import { HeaderHandler } from './HeaderHandler.js';
import { PWAShareHandler } from './PWAShareHandler.js';

function initializeApp() {
    if (document.querySelector('#installPopup')) {
        PWAHandler.init();
    }

    if ('serviceWorker' in navigator) {
        ServiceWorkerHandler.init();
    }

    MetaTagHandler.init();
    CCommentHandler.init();
    HeaderHandler.init();
    PWAShareHandler.init();

}

initializeApp();