import { PWAHandler } from './PWAHandler.js';
import { ServiceWorkerHandler } from './ServiceWorkerHandler.js';
import { MetaTagHandler } from './MetaTagHandler.js';
import { CCommentHandler } from './CCommentHandler.js';
import { HeaderHandler } from './HeaderHandler.js';
import { PWAShareHandler } from './PWAShareHandler.js';

function initializeApp() {
    const handlers = [
        { condition: !!document.querySelector('#installPopup'), handler: PWAHandler },
        { condition: 'serviceWorker' in navigator, handler: ServiceWorkerHandler },
        { condition: true, handler: MetaTagHandler },
        { condition: true, handler: CCommentHandler },
        { condition: true, handler: HeaderHandler },
        { condition: true, handler: PWAShareHandler },
    ];

    handlers.forEach(({ condition, handler }) => {
        if (condition) {
            try {
                handler.init();
            } catch (error) {
                console.error(`Error initializing ${handler.name}:`, error);
            }
        }
    });
}

initializeApp();